import { useState, useEffect } from 'react';
import { api, downloadCsv } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => today().slice(0, 8) + '01';

const SOURCE_LABELS = { manual: '手工', scan: '扫码/报工', import: '导入', api: 'API推送', container: '卸柜同步' };
const CATEGORY_LABELS = {
  inbound: '收货', putaway: '上架', picking: '拣货', packing: '打包', labeling: '贴标', outbound: '出库',
  returns: '退货', inventory: '盘点', container: '装卸柜', project: '项目', other: '其他',
};
const EVENT_LABELS = {
  mispick: '错拣', damage: '破损', missing_scan: '漏扫', label_error: '贴错标', safety: '安全违规',
  absence: '缺勤/迟到', complaint: '客户投诉', praise: '表扬',
};
const SEVERITY_LABELS = { minor: '轻微', major: '严重', critical: '重大', positive: '加分' };

const TABS = [
  ['logs', '作业记录'],
  ['entry', '班组录入'],
  ['import', '文件导入'],
  ['integration', '系统对接/账号映射'],
  ['types', '作业类型与工效标准'],
  ['quality', '质量事件'],
];

async function uploadForm(path, formData, token) {
  const res = await fetch(path, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: formData });
  const data = await res.json().catch(() => ({ detail: 'Network error' }));
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

export default function Operations({ token, user }) {
  const [tab, setTab] = useState('logs');
  const [types, setTypes] = useState([]);
  const [emps, setEmps] = useState([]);
  const [meta, setMeta] = useState(null);
  const canWrite = ['admin', 'hr', 'mgr', 'wh'].includes(user?.role);
  const canConfig = ['admin', 'hr', 'mgr'].includes(user?.role);

  const loadTypes = () => api('/api/v1/ops/types', { token }).then(setTypes).catch(() => {});

  useEffect(() => {
    loadTypes();
    api('/api/v1/ops/meta', { token }).then(setMeta).catch(() => {});
    api('/api/v1/employees?status=active&limit=1000', { token }).then(setEmps).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTabs = TABS.filter(([k]) =>
    k === 'logs' || k === 'quality' || (canWrite && k !== 'types') || (k === 'types' && canWrite));
  const shared = { token, user, types, emps, meta, canWrite, canConfig, reloadTypes: loadTypes };

  return (
    <div>
      <div className="tb">
        {visibleTabs.map(([k, label]) => (
          <button key={k} className={`tbn ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {tab === 'logs' && <LogsTab {...shared} />}
      {tab === 'entry' && <EntryTab {...shared} onDone={() => setTab('logs')} />}
      {tab === 'import' && <ImportTab {...shared} />}
      {tab === 'integration' && <IntegrationTab {...shared} />}
      {tab === 'types' && <TypesTab {...shared} />}
      {tab === 'quality' && <QualityTab {...shared} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function LogsTab({ token, types, emps, canWrite }) {
  const showToast = useToast();
  const [f, setF] = useState({ date_from: monthStart(), date_to: today(), status: '', op_type_id: '', source: '', q: '' });
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState([]);
  const [edit, setEdit] = useState(null);

  const qs = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p.toString();
  };
  const load = () => {
    setLoading(true);
    api(`/api/v1/ops/logs?${qs()}`, { token }).then(d => { setData(d); setSel([]); }).catch(e => showToast(e.message, 'err')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [f.status, f.op_type_id, f.source, f.date_from, f.date_to]); // eslint-disable-line react-hooks/exhaustive-deps

  const bulk = async (action) => {
    if (!sel.length) return;
    let reason;
    if (action === 'reject') { reason = window.prompt('驳回原因'); if (reason === null) return; }
    try {
      const r = await api(`/api/v1/ops/logs/${action}`, { method: 'POST', body: { ids: sel, reason }, token });
      showToast(`已处理 ${r.updated} 条${r.skipped_unmatched ? `，${r.skipped_unmatched} 条未匹配已跳过` : ''}`);
      load();
    } catch (e) { showToast(e.message, 'err'); }
  };
  const rematch = async () => {
    try {
      const r = await api('/api/v1/ops/logs/rematch', { method: 'POST', token });
      showToast(`重新匹配 ${r.checked} 条：成功 ${r.matched}，仍未匹配 ${r.still_unmatched}`);
      load();
    } catch (e) { showToast(e.message, 'err'); }
  };
  const del = async (id) => {
    if (!window.confirm('删除该作业记录？')) return;
    try { await api(`/api/v1/ops/logs/${id}`, { method: 'DELETE', token }); load(); } catch (e) { showToast(e.message, 'err'); }
  };
  const saveEdit = async () => {
    try {
      const body = { ...edit.form };
      ['qty', 'hours', 'error_qty'].forEach(k => { body[k] = parseFloat(body[k]) || 0; });
      ['employee_id', 'op_type_id'].forEach(k => { if (body[k]) body[k] = parseInt(body[k]); else delete body[k]; });
      await api(`/api/v1/ops/logs/${edit.id}`, { method: 'PUT', body, token });
      setEdit(null); load(); showToast('已保存');
    } catch (e) { showToast(e.message, 'err'); }
  };
  const toggle = (id) => setSel(sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  const selectable = data.items.filter(l => l.status !== 'unmatched');

  return (
    <div>
      <div className="ab" style={{ flexWrap: 'wrap', gap: 6 }}>
        <input className="fi" type="date" style={{ width: 140 }} value={f.date_from} onChange={e => setF({ ...f, date_from: e.target.value })} />
        <input className="fi" type="date" style={{ width: 140 }} value={f.date_to} onChange={e => setF({ ...f, date_to: e.target.value })} />
        <select className="fsl" style={{ width: 110 }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="">全部状态</option>
          <option value="pending">待确认</option><option value="confirmed">已确认</option>
          <option value="unmatched">未匹配</option><option value="rejected">已驳回</option>
        </select>
        <select className="fsl" style={{ width: 150 }} value={f.op_type_id} onChange={e => setF({ ...f, op_type_id: e.target.value })}>
          <option value="">全部作业</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
        </select>
        <select className="fsl" style={{ width: 110 }} value={f.source} onChange={e => setF({ ...f, source: e.target.value })}>
          <option value="">全部来源</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="fi" style={{ width: 160 }} placeholder="姓名/单号/账号" value={f.q}
          onChange={e => setF({ ...f, q: e.target.value })} onKeyDown={e => e.key === 'Enter' && load()} />
        <div className="ml" style={{ display: 'flex', gap: 6 }}>
          {canWrite && <button className="b bgn" disabled={!sel.length} onClick={() => bulk('confirm')}>✓ 确认 ({sel.length})</button>}
          {canWrite && <button className="b bgr" disabled={!sel.length} onClick={() => bulk('reject')}>✕ 驳回</button>}
          {canWrite && <button className="b bgh" onClick={rematch}>↻ 重新匹配</button>}
          <button className="b bgh" onClick={() => downloadCsv(`/api/v1/ops/logs/export?${qs()}`, token, 'operation_logs.csv')
            .catch(e => showToast(e.message, 'err'))}>↓ CSV</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{canWrite && <input type="checkbox" checked={sel.length > 0 && sel.length === selectable.length}
              onChange={e => setSel(e.target.checked ? selectable.map(l => l.id) : [])} />}</th>
            <th>日期</th><th>员工</th><th>作业</th><th>数量</th><th>工时</th><th>UPH</th><th>效率</th>
            <th>差错</th><th>仓库</th><th>客户</th><th>单号</th><th>来源</th><th>状态</th><th></th>
          </tr></thead>
          <tbody>{data.items.map(l => (
            <tr key={l.id}>
              <td>{canWrite && l.status !== 'unmatched' && <input type="checkbox" checked={sel.includes(l.id)} onChange={() => toggle(l.id)} />}</td>
              <td className="mn">{l.work_date}</td>
              <td className="fw6">{l.emp_name || <span style={{ color: 'var(--rd)' }}>{l.operator_ref}</span>}</td>
              <td>{l.op_name || <span style={{ color: 'var(--rd)' }}>{l.op_label}</span>}</td>
              <td className="mn">{l.qty} <span className="tm">{l.unit || ''}</span></td>
              <td className="mn">{l.hours ? `${l.hours}h` : '—'}</td>
              <td className="mn">{l.uph ?? '—'}</td>
              <td className="mn" style={{ color: l.efficiency == null ? undefined : l.efficiency >= 100 ? 'var(--gn)' : l.efficiency >= 80 ? 'var(--og)' : 'var(--rd)' }}>
                {l.efficiency != null ? `${l.efficiency}%` : '—'}
              </td>
              <td className="mn">{l.error_qty || ''}</td>
              <td>{l.warehouse_code || '—'}</td>
              <td>{l.client || '—'}</td>
              <td className="tm">{l.ref_no || ''}</td>
              <td className="tm">{SOURCE_LABELS[l.source] || l.source}{l.source_system && l.source_system !== 'generic' ? ` · ${l.source_system}` : ''}</td>
              <td><StatusBadge value={l.status} />{l.match_issue && <div style={{ fontSize: 9, color: 'var(--rd)' }}>{l.match_issue}</div>}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {canWrite && <button className="b bgh xs" onClick={() => setEdit({
                  id: l.id, form: {
                    employee_id: l.employee_id || '', op_type_id: l.op_type_id || '', work_date: l.work_date,
                    qty: l.qty, hours: l.hours, error_qty: l.error_qty, ref_no: l.ref_no || '', notes: l.notes || '',
                  },
                })}>编辑</button>}
                {canWrite && <button className="b bgh xs" onClick={() => del(l.id)}>删除</button>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
        <div className="tm" style={{ padding: 8, fontSize: 11 }}>共 {data.total} 条{data.total > data.items.length ? `（显示前 ${data.items.length} 条）` : ''}</div>
        </div>
      )}

      {edit && (
        <Modal title="编辑作业记录" onClose={() => setEdit(null)} footer={<>
          <button className="b bgh" onClick={() => setEdit(null)}>取消</button>
          <button className="b bga" onClick={saveEdit}>保存</button>
        </>}>
          <div className="fr">
            <div className="fg"><label className="fl">员工</label>
              <select className="fsl" value={edit.form.employee_id} onChange={e => setEdit({ ...edit, form: { ...edit.form, employee_id: e.target.value } })}>
                <option value="">—</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_no} {e.name}</option>)}
              </select></div>
            <div className="fg"><label className="fl">作业类型</label>
              <select className="fsl" value={edit.form.op_type_id} onChange={e => setEdit({ ...edit, form: { ...edit.form, op_type_id: e.target.value } })}>
                <option value="">—</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
              </select></div>
            {[['work_date', '日期', 'date'], ['qty', '数量', 'number'], ['hours', '工时(h)', 'number'],
              ['error_qty', '差错数', 'number'], ['ref_no', '单号', 'text'], ['notes', '备注', 'text']].map(([k, label, type]) => (
              <div className="fg" key={k}><label className="fl">{label}</label>
                <input className="fi" type={type} step="any" value={edit.form[k]}
                  onChange={e => setEdit({ ...edit, form: { ...edit.form, [k]: e.target.value } })} /></div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function EntryTab({ token, user, types, emps, onDone }) {
  const showToast = useToast();
  const [head, setHead] = useState({
    op_type_id: '', work_date: today(), warehouse_code: user?.bound_warehouse || '', client: '', ref_no: '',
  });
  const [rows, setRows] = useState({});
  const [filter, setFilter] = useState('');
  const active = types.filter(t => t.is_active);
  const opType = active.find(t => String(t.id) === String(head.op_type_id));
  const list = emps.filter(e => !filter || `${e.name} ${e.emp_no}`.toLowerCase().includes(filter.toLowerCase())
    || (e.primary_warehouse || '') === filter.toUpperCase());

  const setRow = (id, k, v) => setRows({ ...rows, [id]: { ...(rows[id] || {}), [k]: v } });

  const submit = async () => {
    if (!head.op_type_id) { showToast('请选择作业类型', 'err'); return; }
    const entries = Object.entries(rows)
      .map(([id, r]) => ({ employee_id: parseInt(id), qty: parseFloat(r.qty) || 0, hours: parseFloat(r.hours) || 0, error_qty: parseFloat(r.error_qty) || 0 }))
      .filter(r => r.qty > 0 || r.hours > 0);
    if (!entries.length) { showToast('请至少填写一名员工的数量或工时', 'err'); return; }
    try {
      const r = await api('/api/v1/ops/logs/batch', {
        method: 'POST', token,
        body: { ...head, op_type_id: parseInt(head.op_type_id), warehouse_code: head.warehouse_code || null, client: head.client || null, entries },
      });
      showToast(`已录入 ${r.created} 条`);
      setRows({});
      onDone();
    } catch (e) { showToast(e.message, 'err'); }
  };

  return (
    <div>
      <div className="alert alert-ac" style={{ marginBottom: 12, fontSize: 11 }}>
        班组长/仓管按「同一天 × 同一作业」一次录入整组人员的产量与工时 —— 不依赖任何仓储系统，纸质工时单也能快速数字化。
      </div>
      <div className="fr">
        <div className="fg"><label className="fl">作业类型 *</label>
          <select className="fsl" value={head.op_type_id} onChange={e => setHead({ ...head, op_type_id: e.target.value })}>
            <option value="">请选择</option>
            {active.map(t => <option key={t.id} value={t.id}>{t.code} · {t.name}{t.client ? ` (${t.client})` : ''}</option>)}
          </select></div>
        <div className="fg"><label className="fl">日期</label>
          <input className="fi" type="date" value={head.work_date} onChange={e => setHead({ ...head, work_date: e.target.value })} /></div>
        <div className="fg"><label className="fl">仓库</label>
          <input className="fi" value={head.warehouse_code} disabled={user?.role === 'wh'} onChange={e => setHead({ ...head, warehouse_code: e.target.value.toUpperCase() })} placeholder="UNA / DBG / ..." /></div>
        <div className="fg"><label className="fl">客户</label>
          <input className="fi" value={head.client} onChange={e => setHead({ ...head, client: e.target.value })} placeholder="Amazon / TEMU / ..." /></div>
        <div className="fg"><label className="fl">单号/波次/柜号/项目号</label>
          <input className="fi" value={head.ref_no} onChange={e => setHead({ ...head, ref_no: e.target.value })} /></div>
        <div className="fg"><label className="fl">筛选员工</label>
          <input className="fi" value={filter} onChange={e => setFilter(e.target.value)} placeholder="姓名/工号/仓库代码" /></div>
      </div>
      {opType && <div className="tm" style={{ fontSize: 11, margin: '6px 0' }}>
        单位：{opType.unit} · 标准UPH：{opType.standard_uph || '不计效率'} · 计件单价：€{opType.piece_rate}
      </div>}
      <div className="tw"><div className="ts"><table>
        <thead><tr><th>工号</th><th>姓名</th><th>主仓</th><th>数量</th><th>工时(h)</th><th>差错</th><th>预估效率</th></tr></thead>
        <tbody>{list.map(e => {
          const r = rows[e.id] || {};
          const q = parseFloat(r.qty) || 0, h = parseFloat(r.hours) || 0;
          const eff = opType?.standard_uph && h ? Math.round(q / h / opType.standard_uph * 1000) / 10 : null;
          return (
            <tr key={e.id}>
              <td className="mn">{e.emp_no}</td><td className="fw6">{e.name}</td><td>{e.primary_warehouse || '—'}</td>
              <td><input className="fi" type="number" step="any" style={{ width: 90 }} value={r.qty || ''} onChange={ev => setRow(e.id, 'qty', ev.target.value)} /></td>
              <td><input className="fi" type="number" step="0.25" style={{ width: 70 }} value={r.hours || ''} onChange={ev => setRow(e.id, 'hours', ev.target.value)} /></td>
              <td><input className="fi" type="number" step="any" style={{ width: 60 }} value={r.error_qty || ''} onChange={ev => setRow(e.id, 'error_qty', ev.target.value)} /></td>
              <td className="mn" style={{ color: eff == null ? undefined : eff >= 100 ? 'var(--gn)' : 'var(--og)' }}>{eff != null ? `${eff}%` : '—'}</td>
            </tr>
          );
        })}</tbody>
      </table></div></div>
      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <button className="b bga" onClick={submit}>提交录入</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function ImportTab({ token, user, meta }) {
  const showToast = useToast();
  const [file, setFile] = useState(null);
  const [opts, setOpts] = useState({ system: 'generic', default_warehouse: user?.bound_warehouse || '', default_client: '', default_date: '', field_mapping: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (dryRun) => {
    if (!file) { showToast('请选择文件', 'err'); return; }
    if (opts.field_mapping) {
      try { JSON.parse(opts.field_mapping); } catch { showToast('自定义列映射不是合法 JSON', 'err'); return; }
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('dry_run', dryRun ? 'true' : 'false');
    Object.entries(opts).forEach(([k, v]) => { if (v) fd.append(k, v); });
    setBusy(true);
    try {
      const r = await uploadForm('/api/v1/ops/import', fd, token);
      setResult({ ...r, dryRun });
      if (!dryRun) showToast(`导入完成：新增 ${r.created}，重复 ${r.duplicates}，未匹配 ${r.unmatched}`);
    } catch (e) { showToast(e.message, 'err'); }
    setBusy(false);
  };

  return (
    <div>
      <div className="alert alert-ac" style={{ marginBottom: 12, fontSize: 11, lineHeight: 1.7 }}>
        支持 <b>马帮 / 领星 / 易仓</b> 等 WMS 导出的 Excel/CSV（作业日志、拣货/打包/上架记录），也支持本系统模板。
        系统自动识别中/英/德常见列名；导出列名不同时可在「自定义列映射」填写 JSON，例如
        <code> {'{"operator":"拣货人账号","qty":"拣货数量"}'}</code>。
        带「作业单号/任务ID」的行重复导入会自动跳过。<b>请先预览</b>核对识别结果再正式导入。
      </div>
      <div className="fr">
        <div className="fg"><label className="fl">文件 (.xlsx / .csv)</label>
          <input className="fi" type="file" accept=".xlsx,.xlsm,.csv,.txt" onChange={e => { setFile(e.target.files[0]); setResult(null); }} /></div>
        <div className="fg"><label className="fl">来源系统</label>
          <select className="fsl" value={opts.system} onChange={e => setOpts({ ...opts, system: e.target.value })}>
            {Object.entries(meta?.systems || { generic: '通用模板' }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <div className="fg"><label className="fl">默认仓库（文件无仓库列时）</label>
          <input className="fi" value={opts.default_warehouse} disabled={user?.role === 'wh'} onChange={e => setOpts({ ...opts, default_warehouse: e.target.value.toUpperCase() })} /></div>
        <div className="fg"><label className="fl">默认客户</label>
          <input className="fi" value={opts.default_client} onChange={e => setOpts({ ...opts, default_client: e.target.value })} placeholder="Amazon / TEMU" /></div>
        <div className="fg"><label className="fl">默认日期（文件无日期列时）</label>
          <input className="fi" type="date" value={opts.default_date} onChange={e => setOpts({ ...opts, default_date: e.target.value })} /></div>
        <div className="fg ful"><label className="fl">自定义列映射 (JSON，可选；标准字段：{(meta?.fields || []).join(', ')})</label>
          <input className="fi" value={opts.field_mapping} onChange={e => setOpts({ ...opts, field_mapping: e.target.value })} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="b bgh" onClick={() => downloadCsv('/api/v1/ops/import/template', token, 'ops_import_template.csv')}>↓ 下载模板</button>
        <div className="ml" style={{ display: 'flex', gap: 8 }}>
          <button className="b bgs" disabled={busy} onClick={() => run(true)}>预览</button>
          <button className="b bga" disabled={busy || !result?.dryRun} onClick={() => run(false)}>正式导入</button>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 14 }}>
          <div className="sr" style={{ marginBottom: 10 }}>
            {[[result.total, '文件行数', 'var(--cy)'],
              [result.dryRun ? result.would_create : result.created, result.dryRun ? '将新增' : '已新增', 'var(--gn)'],
              [result.duplicates, '重复跳过', 'var(--tx3)'],
              [result.unmatched, '未匹配(需映射)', 'var(--og)'],
              [result.errors.length, '错误行', 'var(--rd)']].map(([v, l, c], i) => (
              <div key={i} className="sc"><div className="sl">{l}</div><div className="sv" style={{ color: c }}>{v}</div></div>
            ))}
          </div>
          <div className="tm" style={{ fontSize: 11, marginBottom: 6 }}>
            列识别：{Object.entries(result.header_map).map(([k, v]) => `${k} ← ${v}`).join(' · ') || '未识别任何列'}
          </div>
          {result.errors.length > 0 && <div className="alert alert-rd" style={{ fontSize: 11 }}>
            {result.errors.slice(0, 10).map(e => `第${e.row}行：${e.error}`).join('；')}
          </div>}
          {result.preview && (
            <div className="tw"><div className="ts"><table>
              <thead><tr><th>行</th><th>日期</th><th>操作员</th><th>匹配员工</th><th>原始作业</th><th>作业代码</th><th>数量</th><th>工时</th><th>单号</th><th>状态</th></tr></thead>
              <tbody>{result.preview.map(p => (
                <tr key={p.row}>
                  <td className="mn">{p.row}</td><td>{p.work_date}</td><td>{p.operator}</td>
                  <td className="fw6">{p.emp_name || '—'}</td><td>{p.op_label}</td><td>{p.op_code}</td>
                  <td className="mn">{p.qty}</td><td className="mn">{p.hours || '—'}</td><td className="tm">{p.ref_no}</td>
                  <td><StatusBadge value={p.status} />{p.match_issue && <div style={{ fontSize: 9, color: 'var(--rd)' }}>{p.match_issue}</div>}</td>
                </tr>
              ))}</tbody>
            </table></div></div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function IntegrationTab({ token, user, emps, meta, canConfig }) {
  const showToast = useToast();
  const isAdmin = user?.role === 'admin';
  const [sources, setSources] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [srcForm, setSrcForm] = useState(null);
  const [aliasForm, setAliasForm] = useState({ system: '*', alias: '', employee_id: '' });
  const [syncRange, setSyncRange] = useState({ date_from: monthStart(), date_to: today() });

  const load = () => {
    if (isAdmin) api('/api/v1/ops/sources', { token }).then(setSources).catch(() => {});
    api('/api/v1/ops/aliases', { token }).then(setAliases).catch(() => {});
    api('/api/v1/ops/aliases/unmatched', { token }).then(setUnmatched).catch(() => {});
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSource = async () => {
    try {
      let mapping = null;
      if (srcForm.field_mapping) mapping = JSON.parse(srcForm.field_mapping);
      const body = { ...srcForm, field_mapping: mapping };
      if (srcForm.id) {
        await api(`/api/v1/ops/sources/${srcForm.id}`, { method: 'PUT', body, token });
      } else {
        const r = await api('/api/v1/ops/sources', { method: 'POST', body, token });
        setNewKey(r.api_key);
      }
      setSrcForm(null); load();
    } catch (e) { showToast(e.message.includes('JSON') ? '字段映射不是合法 JSON' : e.message, 'err'); }
  };
  const rotate = async (id) => {
    if (!window.confirm('重新生成密钥后旧密钥立即失效，确定？')) return;
    const r = await api(`/api/v1/ops/sources/${id}/rotate`, { method: 'POST', token });
    setNewKey(r.api_key); load();
  };
  const delSource = async (id) => {
    if (!window.confirm('删除该接入源？')) return;
    await api(`/api/v1/ops/sources/${id}`, { method: 'DELETE', token }); load();
  };
  const addAlias = async (preset) => {
    const body = preset || aliasForm;
    if (!body.alias || !body.employee_id) { showToast('请填写账号并选择员工', 'err'); return; }
    try {
      await api('/api/v1/ops/aliases', { method: 'POST', body: { ...body, employee_id: parseInt(body.employee_id) }, token });
      await api('/api/v1/ops/logs/rematch', { method: 'POST', token });
      setAliasForm({ system: '*', alias: '', employee_id: '' });
      showToast('映射已保存并重新匹配'); load();
    } catch (e) { showToast(e.message, 'err'); }
  };
  const delAlias = async (id) => { await api(`/api/v1/ops/aliases/${id}`, { method: 'DELETE', token }); load(); };
  const syncContainers = async () => {
    try {
      const r = await api('/api/v1/ops/sync/containers', { method: 'POST', body: syncRange, token });
      showToast(`同步 ${r.containers} 个柜，新增 ${r.created} 条作业记录（已存在 ${r.skipped_existing}）`);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const systems = meta?.systems || {};
  const scopes = meta?.api_scopes || { 'ops:write': '推送作业记录', 'containers:write': '推送卸柜记录', 'employees:read': '读取人员信息' };
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div>
      {/* Container sync */}
      <div className="cd" style={{ padding: 14, marginBottom: 14 }}>
        <div className="fw6" style={{ marginBottom: 6 }}>卸柜记录 → 作业记录</div>
        <div className="tm" style={{ fontSize: 11, marginBottom: 8 }}>把已审批的装/卸柜记录按人头分摊（每人 1/n 柜），计入绩效。可重复执行，不会重复计数。</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input className="fi" type="date" style={{ width: 140 }} value={syncRange.date_from} onChange={e => setSyncRange({ ...syncRange, date_from: e.target.value })} />
          <input className="fi" type="date" style={{ width: 140 }} value={syncRange.date_to} onChange={e => setSyncRange({ ...syncRange, date_to: e.target.value })} />
          <button className="b bga" onClick={syncContainers}>同步</button>
        </div>
      </div>

      {/* API sources */}
      {isAdmin && (
        <div className="cd" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div className="fw6">外部系统接入（API Key）</div>
            <button className="b bga xs ml" onClick={() => setSrcForm({ name: '', system: 'generic', default_warehouse: '', default_client: '', field_mapping: '', auto_confirm: false, enabled: true, scopes: ['ops:write'] })}>+ 新建接入源</button>
          </div>
          <div className="tm" style={{ fontSize: 11, lineHeight: 1.7, marginBottom: 8 }}>
            WMS 或中间件（马帮/领星/易仓 的开放 API 拉取后、或自建脚本、Zapier/Make）调用：<br />
            <code>POST {origin}/api/v1/ops/ingest</code>　Header <code>X-API-Key: ybk_…</code>　Body <code>{'{"records":[{"task_id":"T1","operator":"zhang01","op_type":"拣货","qty":120,"date":"2026-10-08"}]}'}</code><br />
            加 <code>?dry_run=true</code> 只校验不入库；以 task_id/作业单号 幂等去重。
          </div>
          <details style={{ fontSize: 11, lineHeight: 1.8, marginBottom: 8 }}>
            <summary className="fw6" style={{ cursor: 'pointer' }}>对接 YBKPI（ybkpi.com）/ 卸柜记录软件：接口说明</summary>
            <div className="tm" style={{ marginTop: 6 }}>
              新建接入源时按需勾选权限，每个系统单独一把密钥。所有请求带 Header <code>X-API-Key</code>。<br />
              · 连通测试：<code>GET {origin}/api/v1/ext/ping</code><br />
              · 推送作业记录（ops:write）：<code>POST {origin}/api/v1/ext/operations</code>，格式同上<br />
              · 推送装卸柜记录（containers:write）：<code>POST {origin}/api/v1/ext/containers</code><br />
              <code>{'{"records":[{"external_id":"C-1","container_no":"MSKU1234567","work_date":"2026-10-08","container_type":"40HC","load_type":"unload","start_time":"08:00","end_time":"10:30","workers":["YB-2026-001","zhang01"]}]}'}</code><br />
              　workers 填工号或该系统的操作员账号（在下方「账号映射」中绑定）；同一 external_id 再推送会更新未审批的记录；勾选「自动确认」直接记为仓库已审批，之后可用「卸柜记录同步」转为作业记录。<br />
              · 读取人员信息（employees:read）：<code>GET {origin}/api/v1/ext/employees?status=active&format=json|csv&updated_since=2026-10-01T00:00:00</code><br />
              　只返回工号、姓名、状态、仓库、岗位、等级、业务线、来源、供应商、入离职日期、该系统操作员账号；不含电话、证件、税号、银行与薪资。
            </div>
          </details>
          {newKey && <div className="alert alert-og" style={{ fontSize: 11, wordBreak: 'break-all' }}>
            新密钥（只显示一次，请立即复制保存）：<b className="mn">{newKey}</b>
            <button className="b bgh xs" style={{ marginLeft: 8 }} onClick={() => { navigator.clipboard?.writeText(newKey); showToast('已复制'); }}>复制</button>
          </div>}
          <div className="tw"><div className="ts"><table>
            <thead><tr><th>名称</th><th>系统</th><th>权限</th><th>密钥前缀</th><th>默认仓库/客户</th><th>自动确认</th><th>累计接收</th><th>最近推送</th><th>状态</th><th></th></tr></thead>
            <tbody>{sources.map(s => (
              <tr key={s.id}>
                <td className="fw6">{s.name}</td><td>{systems[s.system] || s.system}</td>
                <td style={{ fontSize: 11 }}>{(s.scopes || []).map(x => scopes[x] || x).join('、')}</td><td className="mn">{s.key_prefix}…</td>
                <td>{s.default_warehouse || '—'} / {s.default_client || '—'}</td><td>{s.auto_confirm ? '✓' : '—'}</td>
                <td className="mn">{s.total_received}</td><td className="tm">{s.last_used_at ? s.last_used_at.slice(0, 16).replace('T', ' ') : '—'}</td>
                <td style={{ color: s.enabled ? 'var(--gn)' : 'var(--rd)' }}>{s.enabled ? '启用' : '停用'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="b bgh xs" onClick={() => setSrcForm({ ...s, field_mapping: s.field_mapping ? JSON.stringify(s.field_mapping) : '' })}>编辑</button>
                  <button className="b bgh xs" onClick={() => rotate(s.id)}>↻ 密钥</button>
                  <button className="b bgh xs" onClick={() => delSource(s.id)}>删除</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div></div>
        </div>
      )}

      {/* Alias mapping */}
      <div className="cd" style={{ padding: 14 }}>
        <div className="fw6" style={{ marginBottom: 6 }}>WMS 操作员账号 ↔ 员工 映射</div>
        <div className="tm" style={{ fontSize: 11, marginBottom: 8 }}>WMS 里的操作员账号（如 zhang01）与花名册员工不一致时，在此映射；保存后自动重新匹配历史未匹配记录。</div>
        {unmatched.length > 0 && (
          <div className="alert alert-og" style={{ fontSize: 11, marginBottom: 8 }}>
            <div className="fw6" style={{ marginBottom: 4 }}>待映射账号（{unmatched.length}）</div>
            {unmatched.slice(0, 30).map(u => (
              <div key={`${u.system}:${u.alias}`} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span className="mn" style={{ minWidth: 160 }}>{u.alias} <span className="tm">({systems[u.system] || u.system} · {u.records}条)</span></span>
                {canConfig && <select className="fsl" style={{ width: 200 }} defaultValue=""
                  onChange={e => e.target.value && addAlias({ system: u.system, alias: u.alias, employee_id: e.target.value })}>
                  <option value="">→ 选择员工</option>
                  {emps.map(e => <option key={e.id} value={e.id}>{e.emp_no} {e.name}</option>)}
                </select>}
              </div>
            ))}
          </div>
        )}
        {canConfig && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <select className="fsl" style={{ width: 150 }} value={aliasForm.system} onChange={e => setAliasForm({ ...aliasForm, system: e.target.value })}>
              <option value="*">所有系统</option>
              {Object.entries(systems).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className="fi" style={{ width: 160 }} placeholder="WMS账号/工牌号" value={aliasForm.alias} onChange={e => setAliasForm({ ...aliasForm, alias: e.target.value })} />
            <select className="fsl" style={{ width: 200 }} value={aliasForm.employee_id} onChange={e => setAliasForm({ ...aliasForm, employee_id: e.target.value })}>
              <option value="">选择员工</option>
              {emps.map(e => <option key={e.id} value={e.id}>{e.emp_no} {e.name}</option>)}
            </select>
            <button className="b bga" onClick={() => addAlias()}>添加</button>
          </div>
        )}
        <div className="tw"><div className="ts"><table>
          <thead><tr><th>系统</th><th>账号</th><th>员工</th><th></th></tr></thead>
          <tbody>{aliases.map(a => (
            <tr key={a.id}>
              <td>{a.system === '*' ? '所有系统' : (systems[a.system] || a.system)}</td><td className="mn">{a.alias}</td>
              <td className="fw6">{a.emp_no} {a.emp_name}</td>
              <td>{canConfig && <button className="b bgh xs" onClick={() => delAlias(a.id)}>删除</button>}</td>
            </tr>
          ))}</tbody>
        </table></div></div>
      </div>

      {srcForm && (
        <Modal title={srcForm.id ? '编辑接入源' : '新建接入源'} onClose={() => setSrcForm(null)} footer={<>
          <button className="b bgh" onClick={() => setSrcForm(null)}>取消</button>
          <button className="b bga" onClick={saveSource}>保存</button>
        </>}>
          <div className="fr">
            <div className="fg"><label className="fl">名称</label>
              <input className="fi" value={srcForm.name} onChange={e => setSrcForm({ ...srcForm, name: e.target.value })} placeholder="例如：易仓-UNA仓" /></div>
            <div className="fg"><label className="fl">系统</label>
              <select className="fsl" value={srcForm.system} onChange={e => setSrcForm({ ...srcForm, system: e.target.value })}>
                {Object.entries(systems).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="fg"><label className="fl">默认仓库</label>
              <input className="fi" value={srcForm.default_warehouse || ''} onChange={e => setSrcForm({ ...srcForm, default_warehouse: e.target.value.toUpperCase() })} /></div>
            <div className="fg"><label className="fl">默认客户</label>
              <input className="fi" value={srcForm.default_client || ''} onChange={e => setSrcForm({ ...srcForm, default_client: e.target.value })} /></div>
            <div className="fg ful"><label className="fl">字段映射 JSON（可选）</label>
              <input className="fi" value={srcForm.field_mapping || ''} onChange={e => setSrcForm({ ...srcForm, field_mapping: e.target.value })} placeholder='{"operator":"opUser","qty":"pcs"}' /></div>
            <div className="fg ful"><label className="fl">权限范围</label>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {Object.entries(scopes).map(([k, v]) => (
                  <label key={k} style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="checkbox" checked={(srcForm.scopes || []).includes(k)}
                      onChange={e => setSrcForm({ ...srcForm, scopes: e.target.checked ? [...(srcForm.scopes || []), k] : (srcForm.scopes || []).filter(x => x !== k) })} />
                    {v} <span className="tm mn">{k}</span></label>
                ))}
              </div></div>
            <div className="fg"><label className="fl">
              <input type="checkbox" checked={!!srcForm.auto_confirm} onChange={e => setSrcForm({ ...srcForm, auto_confirm: e.target.checked })} /> 推送后自动确认</label></div>
            <div className="fg"><label className="fl">
              <input type="checkbox" checked={!!srcForm.enabled} onChange={e => setSrcForm({ ...srcForm, enabled: e.target.checked })} /> 启用</label></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function TypesTab({ token, types, meta, canConfig, reloadTypes }) {
  const showToast = useToast();
  const [form, setForm] = useState(null);
  const empty = { code: '', name: '', name_de: '', category: 'picking', unit: '件', client: '', warehouse_code: '', standard_uph: 0, piece_rate: 0, client_rate: 0, keywords: '', is_active: true };

  const save = async () => {
    try {
      const body = { ...form };
      ['standard_uph', 'piece_rate', 'client_rate'].forEach(k => { body[k] = parseFloat(body[k]) || 0; });
      ['client', 'warehouse_code', 'name_de', 'keywords'].forEach(k => { if (!body[k]) body[k] = null; });
      if (form.id) await api(`/api/v1/ops/types/${form.id}`, { method: 'PUT', body, token });
      else await api('/api/v1/ops/types', { method: 'POST', body, token });
      setForm(null); reloadTypes(); showToast('已保存');
    } catch (e) { showToast(e.message, 'err'); }
  };
  const del = async (t) => {
    if (!window.confirm(`删除/停用 ${t.code}？已有记录的作业类型会改为停用。`)) return;
    const r = await api(`/api/v1/ops/types/${t.id}`, { method: 'DELETE', token });
    showToast(r.deactivated ? `已停用（有 ${r.used_by} 条记录引用）` : '已删除'); reloadTypes();
  };

  return (
    <div>
      <div className="alert alert-ac" style={{ fontSize: 11, marginBottom: 10, lineHeight: 1.7 }}>
        <b>标准UPH</b> = 每人每小时标准产量（工效标准），效率% = 实际产量 ÷ (标准UPH × 实际工时)。
        不同作业（拣货/打包/卸柜…）都折算为「标准工时」后可以合并比较。标准UPH 填 0 表示只计工时、不计效率（如项目计时作业）。
        <b> 关键词</b>用于导入时把 WMS 的作业名称（如「拣货」「配货」）自动识别为本作业。
      </div>
      {canConfig && <div className="ab"><div className="ml"><button className="b bga" onClick={() => setForm(empty)}>+ 新增作业类型</button></div></div>}
      <div className="tw"><div className="ts"><table>
        <thead><tr><th>代码</th><th>名称</th><th>Deutsch</th><th>类别</th><th>单位</th><th>客户</th><th>仓库</th><th>标准UPH</th><th>计件单价</th><th>客户单价</th><th>关键词</th><th>状态</th><th></th></tr></thead>
        <tbody>{types.map(t => (
          <tr key={t.id} style={{ opacity: t.is_active ? 1 : 0.5 }}>
            <td className="mn fw6">{t.code}</td><td>{t.name}</td><td className="tm">{t.name_de}</td>
            <td>{CATEGORY_LABELS[t.category] || t.category}</td><td>{t.unit}</td><td>{t.client || '通用'}</td><td>{t.warehouse_code || '全部'}</td>
            <td className="mn">{t.standard_uph || '—'}</td><td className="mn">€{t.piece_rate}</td><td className="mn">€{t.client_rate}</td>
            <td className="tm" style={{ maxWidth: 160, fontSize: 10 }}>{t.keywords}</td>
            <td style={{ color: t.is_active ? 'var(--gn)' : 'var(--tx3)' }}>{t.is_active ? '启用' : '停用'}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{canConfig && <>
              <button className="b bgh xs" onClick={() => setForm({ ...empty, ...t, client: t.client || '', warehouse_code: t.warehouse_code || '', name_de: t.name_de || '', keywords: t.keywords || '' })}>编辑</button>
              <button className="b bgh xs" onClick={() => del(t)}>删除</button>
            </>}</td>
          </tr>
        ))}</tbody>
      </table></div></div>

      {form && (
        <Modal title={form.id ? `编辑 ${form.code}` : '新增作业类型'} onClose={() => setForm(null)} footer={<>
          <button className="b bgh" onClick={() => setForm(null)}>取消</button>
          <button className="b bga" onClick={save}>保存</button>
        </>}>
          <div className="fr">
            <div className="fg"><label className="fl">代码 (条码内容)</label>
              <input className="fi" value={form.code} disabled={!!form.id} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div className="fg"><label className="fl">名称</label>
              <input className="fi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="fg"><label className="fl">Deutsch</label>
              <input className="fi" value={form.name_de} onChange={e => setForm({ ...form, name_de: e.target.value })} /></div>
            <div className="fg"><label className="fl">类别</label>
              <select className="fsl" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {(meta?.categories || Object.keys(CATEGORY_LABELS)).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
              </select></div>
            <div className="fg"><label className="fl">单位</label>
              <select className="fsl" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {(meta?.units || ['件']).map(u => <option key={u}>{u}</option>)}
              </select></div>
            <div className="fg"><label className="fl">客户（空=通用）</label>
              <input className="fi" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Amazon / TEMU" /></div>
            <div className="fg"><label className="fl">仓库（空=全部）</label>
              <input className="fi" value={form.warehouse_code} onChange={e => setForm({ ...form, warehouse_code: e.target.value.toUpperCase() })} /></div>
            <div className="fg"><label className="fl">标准UPH（{form.unit}/人·时）</label>
              <input className="fi" type="number" step="any" value={form.standard_uph} onChange={e => setForm({ ...form, standard_uph: e.target.value })} /></div>
            <div className="fg"><label className="fl">员工计件单价 €/{form.unit}</label>
              <input className="fi" type="number" step="any" value={form.piece_rate} onChange={e => setForm({ ...form, piece_rate: e.target.value })} /></div>
            <div className="fg"><label className="fl">客户结算单价 €/{form.unit}</label>
              <input className="fi" type="number" step="any" value={form.client_rate} onChange={e => setForm({ ...form, client_rate: e.target.value })} /></div>
            <div className="fg ful"><label className="fl">导入匹配关键词（逗号分隔）</label>
              <input className="fi" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="拣货,配货,pick" /></div>
            <div className="fg"><label className="fl">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> 启用</label></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function QualityTab({ token, user, emps, canWrite, canConfig }) {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [range, setRange] = useState({ date_from: monthStart(), date_to: today() });
  const [form, setForm] = useState(null);

  const load = () => api(`/api/v1/ops/quality?date_from=${range.date_from}&date_to=${range.date_to}`, { token }).then(setList).catch(() => {});
  useEffect(() => { load(); }, [range.date_from, range.date_to]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form.employee_id) { showToast('请选择员工', 'err'); return; }
    try {
      await api('/api/v1/ops/quality', {
        method: 'POST', token,
        body: { ...form, employee_id: parseInt(form.employee_id), qty: parseFloat(form.qty) || 1, deduction: parseFloat(form.deduction) || 0, warehouse_code: form.warehouse_code || null, client: form.client || null },
      });
      setForm(null); load(); showToast('已记录');
    } catch (e) { showToast(e.message, 'err'); }
  };
  const del = async (id) => { if (window.confirm('删除？')) { await api(`/api/v1/ops/quality/${id}`, { method: 'DELETE', token }); load(); } };

  return (
    <div>
      <div className="ab">
        <input className="fi" type="date" style={{ width: 140 }} value={range.date_from} onChange={e => setRange({ ...range, date_from: e.target.value })} />
        <input className="fi" type="date" style={{ width: 140 }} value={range.date_to} onChange={e => setRange({ ...range, date_to: e.target.value })} />
        <div className="ml">{canWrite && <button className="b bga" onClick={() => setForm({
          employee_id: '', event_date: today(), event_type: 'mispick', severity: 'minor', qty: 1, deduction: 0,
          warehouse_code: user?.bound_warehouse || '', client: '', ref_no: '', description: '',
        })}>+ 记录质量事件</button>}</div>
      </div>
      <div className="tm" style={{ fontSize: 11, margin: '6px 0' }}>质量分扣分：轻微 −5 · 严重 −15 · 重大 −40 · 表扬 +5；另按差错率每 1% 扣 10 分。</div>
      <div className="tw"><div className="ts"><table>
        <thead><tr><th>日期</th><th>员工</th><th>类型</th><th>程度</th><th>数量</th><th>扣款</th><th>仓库</th><th>客户</th><th>单号</th><th>说明</th><th>记录人</th><th></th></tr></thead>
        <tbody>{list.map(q => (
          <tr key={q.id}>
            <td className="mn">{q.event_date}</td><td className="fw6">{q.emp_name}</td>
            <td>{EVENT_LABELS[q.event_type] || q.event_type}</td>
            <td style={{ color: q.severity === 'positive' ? 'var(--gn)' : q.severity === 'minor' ? 'var(--og)' : 'var(--rd)' }}>{SEVERITY_LABELS[q.severity] || q.severity}</td>
            <td className="mn">{q.qty}</td><td className="mn">{q.deduction ? `€${q.deduction}` : '—'}</td>
            <td>{q.warehouse_code || '—'}</td><td>{q.client || '—'}</td><td className="tm">{q.ref_no}</td>
            <td style={{ maxWidth: 220 }}>{q.description}</td><td className="tm">{q.created_by}</td>
            <td>{canConfig && <button className="b bgh xs" onClick={() => del(q.id)}>删除</button>}</td>
          </tr>
        ))}</tbody>
      </table></div></div>

      {form && (
        <Modal title="记录质量事件" onClose={() => setForm(null)} footer={<>
          <button className="b bgh" onClick={() => setForm(null)}>取消</button>
          <button className="b bga" onClick={save}>保存</button>
        </>}>
          <div className="fr">
            <div className="fg"><label className="fl">员工 *</label>
              <select className="fsl" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">请选择</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_no} {e.name}</option>)}
              </select></div>
            <div className="fg"><label className="fl">日期</label>
              <input className="fi" type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
            <div className="fg"><label className="fl">类型</label>
              <select className="fsl" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value, severity: e.target.value === 'praise' ? 'positive' : form.severity })}>
                {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="fg"><label className="fl">程度</label>
              <select className="fsl" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            {[['qty', '数量', 'number'], ['deduction', '扣款 €', 'number'], ['warehouse_code', '仓库', 'text'],
              ['client', '客户', 'text'], ['ref_no', '单号', 'text']].map(([k, label, type]) => (
              <div className="fg" key={k}><label className="fl">{label}</label>
                <input className="fi" type={type} step="any" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
            ))}
            <div className="fg ful"><label className="fl">说明</label>
              <textarea className="fi" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
