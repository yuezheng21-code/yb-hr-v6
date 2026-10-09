import { useState, useEffect } from 'react';
import { useListTools, ListToolbar } from '../components/ListTools.jsx';
import { api, downloadCsv } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import Chart from '../components/common/Chart.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => today().slice(0, 8) + '01';

const GROUP_LABELS = {
  employee: '按员工', supplier: '按劳务供应商', op_type: '按作业类型', client: '按客户', warehouse: '按仓库', date: '按日期',
};
const GRADE_COLORS = { A: 'var(--gn)', B: 'var(--ac2)', C: 'var(--og)', D: 'var(--rd)', '-': 'var(--tx3)' };
const HOURS_SOURCE = { log: '记录工时', timesheet: '工时单', clock: '打卡', none: '无工时' };

function effColor(v) {
  if (v == null) return 'var(--tx3)';
  return v >= 100 ? 'var(--gn)' : v >= 80 ? 'var(--og)' : 'var(--rd)';
}

function EffBar({ value }) {
  if (value == null) return <span className="tm">—</span>;
  const w = Math.min(value, 150) / 150 * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, position: 'relative' }}>
        <div style={{ width: `${w}%`, height: '100%', background: effColor(value), borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: `${100 / 150 * 100}%`, top: -2, bottom: -2, width: 1, background: 'var(--tx3)' }} />
      </div>
      <span className="mn" style={{ color: effColor(value), minWidth: 44, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default function Performance({ token, user }) {
  const showToast = useToast();
  const isWorker = user?.role === 'worker';
  const [f, setF] = useState({
    date_from: monthStart(), date_to: today(), group_by: 'employee', warehouse_code: '', client: '',
    supplier_id: '', confirmed_only: false, w_efficiency: 0.7,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [detail, setDetail] = useState(null);
  const lt = useListTools(data?.rows || [], {}, token);
  const PCOLS = [
    { label: '排名', value: 'rank', type: 'int' }, { label: '维度', value: 'label' }, { label: '工号/代码', value: r => r.emp_no || r.code || r.key },
    { label: '供应商', value: 'supplier_name' }, { label: '人数', value: 'headcount', type: 'int' }, { label: '天数', value: 'days', type: 'int' },
    { label: '产量', value: 'qty', type: 'num', sum: true }, { label: '工时', value: 'total_hours', type: 'num', sum: true },
    { label: 'UPH', value: 'uph', type: 'num' }, { label: '效率%', value: 'efficiency', type: 'pct' }, { label: '差错率%', value: 'error_rate', type: 'pct' },
    { label: '质量分', value: 'quality_score', type: 'num' }, { label: '综合分', value: 'score', type: 'num' }, { label: '等级', value: 'grade' },
    { label: '计件€', value: 'piece_amount', type: 'money', sum: true }, { label: '客户€', value: 'client_amount', type: 'money', sum: true },
    { label: '扣款€', value: 'deductions', type: 'money', sum: true },
  ];

  const qs = (extra = {}) => {
    const p = new URLSearchParams();
    const all = { ...f, w_quality: Math.round((1 - f.w_efficiency) * 100) / 100, ...extra };
    Object.entries(all).forEach(([k, v]) => { if (v !== '' && v !== false && v != null) p.set(k, v); });
    return p.toString();
  };

  const load = () => {
    setLoading(true);
    api(`/api/v1/ops/performance?${qs()}`, { token })
      .then(setData).catch(e => showToast(e.message, 'err')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [f.group_by, f.date_from, f.date_to, f.confirmed_only, f.supplier_id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (['admin', 'hr', 'mgr', 'fin'].includes(user?.role)) api('/api/v1/suppliers', { token }).then(setSuppliers).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (row) => {
    if (f.group_by !== 'employee') return;
    try {
      const d = await api(`/api/v1/ops/performance?${qs({ group_by: 'date', employee_id: row.key, supplier_id: '' })}`, { token });
      setDetail({ row, days: d.rows });
    } catch (e) { showToast(e.message, 'err'); }
  };

  const s = data?.summary;
  const rows = data?.rows || [];
  const g = f.group_by;

  return (
    <div>
      <div className="ab" style={{ flexWrap: 'wrap', gap: 6 }}>
        <input className="fi" type="date" style={{ width: 140 }} value={f.date_from} onChange={e => setF({ ...f, date_from: e.target.value })} />
        <input className="fi" type="date" style={{ width: 140 }} value={f.date_to} onChange={e => setF({ ...f, date_to: e.target.value })} />
        {!isWorker && <select className="fsl" style={{ width: 140 }} value={f.group_by} onChange={e => setF({ ...f, group_by: e.target.value })}>
          {Object.entries(GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>}
        {suppliers.length > 0 && <select className="fsl" style={{ width: 150 }} value={f.supplier_id} onChange={e => setF({ ...f, supplier_id: e.target.value })}>
          <option value="">全部供应商</option>
          {suppliers.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
        </select>}
        {!isWorker && user?.role !== 'wh' && <input className="fi" style={{ width: 90 }} placeholder="仓库" value={f.warehouse_code}
          onChange={e => setF({ ...f, warehouse_code: e.target.value.toUpperCase() })} onKeyDown={e => e.key === 'Enter' && load()} />}
        {!isWorker && <input className="fi" style={{ width: 100 }} placeholder="客户" value={f.client}
          onChange={e => setF({ ...f, client: e.target.value })} onKeyDown={e => e.key === 'Enter' && load()} />}
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={f.confirmed_only} onChange={e => setF({ ...f, confirmed_only: e.target.checked })} /> 仅已确认
        </label>
        {!isWorker && <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }} title="综合分中效率与质量的权重">
          效率权重 <input type="range" min="0" max="1" step="0.1" value={f.w_efficiency}
            onChange={e => setF({ ...f, w_efficiency: parseFloat(e.target.value) })} onMouseUp={load} onTouchEnd={load} />
          <span className="mn">{Math.round(f.w_efficiency * 100)}/{Math.round((1 - f.w_efficiency) * 100)}</span>
        </label>}
        <div className="ml" style={{ display: 'flex', gap: 6 }}>
          <button className="b bgh" onClick={load}>↻</button>
          {!isWorker && <button className="b bgh" onClick={() => downloadCsv(`/api/v1/ops/performance/export?${qs()}`, token, `performance_${g}.csv`)
            .catch(e => showToast(e.message, 'err'))}>↓ CSV</button>}
        </div>
      </div>

      {loading || !data ? <Loading /> : (
        <>
          <div className="sr" style={{ marginBottom: 12 }}>
            {[
              [s.groups, GROUP_LABELS[g].replace('按', '') + '数', 'var(--cy)'],
              [s.qty.toLocaleString(), '总产量', 'var(--ac2)'],
              [`${s.total_hours}h`, '总工时', 'var(--pp)'],
              [s.avg_efficiency != null ? `${s.avg_efficiency}%` : '—', '整体效率', effColor(s.avg_efficiency)],
              [s.avg_score ?? '—', '平均综合分', 'var(--og)'],
              [`€${s.piece_amount.toLocaleString()}`, '计件金额', 'var(--gn)'],
            ].map(([v, l, c], i) => (
              <div key={i} className="sc"><div className="sl">{l}</div><div className={`sv ${l === '整体效率' || l === '期间效率' || l === '等级' ? 'keep' : ''}`} style={{ color: c }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 11 }}>
            {Object.entries(s.grades).map(([k, v]) => (
              <span key={k} className="mz-tag"><span className="mz-dot" style={{ background: GRADE_COLORS[k] }} />
                {k === '-' ? '未评级' : `${k} 级`}：{v}
              </span>
            ))}
            <span className="tm" style={{ marginLeft: 'auto' }}>A≥90 超出标准 · B≥75 达标 · C≥60 待改进 · D&lt;60</span>
          </div>

          {g === 'date' && rows.length > 0 && (
            <div className="cd" style={{ padding: 12, marginBottom: 12 }}>
              <div className="fw6" style={{ fontSize: 12, marginBottom: 6 }}>每日效率 %</div>
              <Chart data={rows.map(r => ({ label: r.key.slice(5), value: r.efficiency || 0 }))} height={140} />
            </div>
          )}

          <ListToolbar lt={lt} title="绩效看板" columns={PCOLS} token={token}
            subtitle={[`${f.date_from || '…'} → ${f.date_to || '…'}`, f.warehouse_code && `仓库 ${f.warehouse_code}`, f.supplier_id && `供应商 #${f.supplier_id}`, f.client && `客户 ${f.client}`].filter(Boolean).join(' · ')} />
          <div className="tw"><div className="ts"><table>
            <thead><tr>
              <th>#</th>
              <th>{GROUP_LABELS[g].replace('按', '')}</th>
              {g === 'employee' && <th>供应商</th>}
              {g !== 'employee' && g !== 'date' && <th>人数</th>}
              <th>天数</th><th>产量</th><th>工时</th><th>UPH</th><th>效率</th><th>差错率</th>
              <th>质量分</th><th>综合分</th><th>等级</th><th>计件€</th><th>客户€</th><th>扣款€</th>
              {g !== 'op_type' && <th>作业构成</th>}
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.key} style={{ cursor: g === 'employee' ? 'pointer' : 'default' }} onClick={() => openDetail(r)}>
                <td className="mn">{r.rank}</td>
                <td className="fw6">{r.label}{r.emp_no && <div className="tm" style={{ fontSize: 9 }}>{r.emp_no}</div>}
                  {r.code && <div className="tm" style={{ fontSize: 9 }}>{r.code} · 标准 {r.standard_uph}/{r.unit}·h</div>}</td>
                {g === 'employee' && <td>{r.supplier_name}</td>}
                {g !== 'employee' && g !== 'date' && <td className="mn">{r.headcount}</td>}
                <td className="mn">{r.days}</td>
                <td className="mn">{r.qty.toLocaleString()}</td>
                <td className="mn" title={(r.hours_sources || []).map(x => HOURS_SOURCE[x] || x).join(' / ')}>{r.total_hours}h</td>
                <td className="mn">{r.uph ?? '—'}</td>
                <td><EffBar value={r.efficiency} /></td>
                <td className="mn" style={{ color: r.error_rate > 1 ? 'var(--rd)' : undefined }}>{r.error_rate}%</td>
                <td className="mn">{r.quality_score}{r.quality_events > 0 && <span className="tm"> ({r.quality_events})</span>}</td>
                <td className="mn fw6">{r.score ?? '—'}</td>
                <td><span className="fw6" style={{ color: GRADE_COLORS[r.grade], fontSize: 14 }}>{r.grade}</span></td>
                <td className="mn">{r.piece_amount ? `€${r.piece_amount}` : '—'}</td>
                <td className="mn">{r.client_amount ? `€${r.client_amount}` : '—'}</td>
                <td className="mn" style={{ color: r.deductions ? 'var(--rd)' : undefined }}>{r.deductions ? `€${r.deductions}` : '—'}</td>
                {g !== 'op_type' && <td className="tm" style={{ fontSize: 10, maxWidth: 220 }}>
                  {Object.entries(r.ops).map(([k, v]) => `${k} ${v}`).join(' · ')}
                </td>}
              </tr>
            ))}</tbody>
          </table></div></div>
          {rows.length === 0 && <div className="tm" style={{ textAlign: 'center', padding: 30 }}>
            该期间暂无作业记录。可在「作业记录」中手工录入、导入 WMS 文件或配置 API 推送。
          </div>}
        </>
      )}

      {detail && (
        <Modal wide title={`${detail.row.label} · 每日绩效`} onClose={() => setDetail(null)}>
          <div className="sr" style={{ marginBottom: 12 }}>
            {[[detail.row.efficiency != null ? `${detail.row.efficiency}%` : '—', '期间效率', effColor(detail.row.efficiency)],
              [detail.row.quality_score, '质量分', 'var(--cy)'],
              [detail.row.score ?? '—', '综合分', 'var(--og)'],
              [detail.row.grade, '等级', GRADE_COLORS[detail.row.grade]]].map(([v, l, c], i) => (
              <div key={i} className="sc"><div className="sl">{l}</div><div className={`sv ${l === '整体效率' || l === '期间效率' || l === '等级' ? 'keep' : ''}`} style={{ color: c }}>{v}</div></div>
            ))}
          </div>
          <Chart data={detail.days.map(r => ({ label: r.key.slice(5), value: r.efficiency || 0 }))} height={130} color="var(--gn)" />
          <div className="tw" style={{ marginTop: 10 }}><div className="ts"><table>
            <thead><tr><th>日期</th><th>产量</th><th>工时</th><th>工时来源</th><th>效率</th><th>质量分</th><th>作业构成</th></tr></thead>
            <tbody>{detail.days.map(r => (
              <tr key={r.key}>
                <td className="mn">{r.key}</td><td className="mn">{r.qty}</td><td className="mn">{r.total_hours}h</td>
                <td className="tm">{(r.hours_sources || []).map(x => HOURS_SOURCE[x] || x).join(' / ')}</td>
                <td><EffBar value={r.efficiency} /></td><td className="mn">{r.quality_score}</td>
                <td className="tm" style={{ fontSize: 10 }}>{Object.entries(r.ops).map(([k, v]) => `${k} ${v}`).join(' · ')}</td>
              </tr>
            ))}</tbody>
          </table></div></div>
        </Modal>
      )}
    </div>
  );
}
