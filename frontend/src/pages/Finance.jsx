import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { openFile, saveFile } from './PersonnelFile.jsx';
import { useListTools, ListToolbar } from '../components/ListTools.jsx';

const F = '/api/v1/finance';
const eur = (v) => (v == null ? '—' : `€${Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const lastMonth = () => { const d = new Date(); d.setDate(0); return d.toISOString().slice(0, 7); };
const monthRange = (p) => { const [y, m] = p.split('-').map(Number); return [`${p}-01`, new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)]; };
const STAT = [['lst', 'Lohnsteuer 工资税'], ['soli', 'Soli 团结税'], ['kist', 'Kirchensteuer 教会税'], ['kv', 'KV 医保（员工）'], ['rv', 'RV 养老（员工）'], ['av', 'AV 失业（员工）'], ['pv', 'PV 护理（员工）']];
const INV_STATUS = { draft: ['草稿', 'var(--tx3)'], issued: ['已开具', 'var(--ac)'], paid: ['已收款', 'var(--gn)'], cancelled: ['已作废', 'var(--rd)'] };

const TABS = [
  ['payslips', '工资条', ['admin', 'fin', 'hr']],
  ['suppliers', '供应商结算单', ['admin', 'fin', 'hr', 'mgr', 'sup']],
  ['invoices', '甲方账单', ['admin', 'fin', 'mgr']],
  ['customers', '客户', ['admin', 'fin', 'mgr']],
  ['datev', 'DATEV / 税务', ['admin', 'fin', 'hr']],
];

function Tag({ color, children }) {
  return <span className="mz-tag"><span className="mz-dot" style={{ background: color }} />{children}</span>;
}
function Drawer({ title, sub, width = 560, onClose, footer, children }) {
  return (
    <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mz-drawer" style={{ width }}>
        <div className="mz-drawer-h">
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>{sub && <div className="mz-muted" style={{ marginTop: 2 }}>{sub}</div>}</div>
          <button className="mz-link" style={{ fontSize: 18 }} onClick={onClose}>×</button>
        </div>
        <div className="mz-drawer-b">{children}</div>
        {footer && <div className="mz-drawer-f">{footer}</div>}
      </div>
    </div>
  );
}

export default function Finance({ token, user }) {
  const tabs = TABS.filter(([, , roles]) => roles.includes(user?.role));
  const [tab, setTab] = useState(tabs[0]?.[0]);
  if (!tabs.length) return <div className="mz-empty">无权访问财务中心</div>;
  return (
    <div className="mz">
      <div className="mz-head">
        <div><div className="mz-title">财务中心</div>
          <div className="mz-sub">工资条 · 供应商结算单 · 甲方账单（含 XRechnung 电子发票）· DATEV 与增值税对接</div></div>
      </div>
      <div className="tb">{tabs.map(([k, l]) => <button key={k} className={`tbn ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'payslips' && <Payslips token={token} user={user} />}
      {tab === 'suppliers' && <SupplierStatements token={token} user={user} />}
      {tab === 'invoices' && <Invoices token={token} user={user} />}
      {tab === 'customers' && <Customers token={token} user={user} />}
      {tab === 'datev' && <Datev token={token} user={user} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Payslips({ token, user }) {
  const showToast = useToast();
  const [period, setPeriod] = useState(lastMonth());
  const [list, setList] = useState(null);
  const [sel, setSel] = useState(null);
  const [checked, setChecked] = useState([]);
  const load = () => api(`${F}/payslips?period=${period}`, { token }).then(l => { setList(l); setChecked([]); }).catch(e => showToast(e.message, 'err'));
  const lt = useListTools(list || [], { warehouse: 'warehouse_code' }, token);
  const COLS = [
    { label: '工资条号', value: 'slip_no' }, { label: '工号', value: 'emp_no' }, { label: '姓名', value: 'emp_name' }, { label: '仓库', value: 'warehouse_code' },
    { label: 'DATEV PNR', value: s => s.employee?.datev_pnr }, { label: '天数', value: 'work_days', type: 'int' }, { label: '工时', value: 'total_hours', type: 'num', sum: true },
    { label: '税前', value: 'gross', type: 'money', sum: true }, { label: '税/社保', value: 'statutory_total', type: 'money', sum: true },
    { label: '其他扣款', value: s => (s.other_deductions || []).reduce((a, o) => a + o.amount, 0), type: 'money', sum: true },
    { label: '实发', value: 'payout', type: 'money', sum: true }, { label: '状态', value: s => (s.status === 'issued' ? '已签发' : '草稿') },
  ];
  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    try { const r = await api(`${F}/payslips/generate`, { method: 'POST', body: { period }, token }); showToast(`新建 ${r.created}，更新 ${r.updated}，已签发未改动 ${r.skipped_issued}`); load(); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const issue = async (ids) => {
    if (!ids.length) return;
    if (!window.confirm(`签发 ${ids.length} 张工资条？签发后锁定，PDF 存入员工档案，工人可在「我的工资条」查看。`)) return;
    try { const r = await api(`${F}/payslips/issue`, { method: 'POST', body: { ids }, token }); showToast(`已签发 ${r.issued} 张`); load(); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const importCsv = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`${F}/payslips/import-statutory?period=${period}`, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
    const r = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(r.detail || '导入失败', 'err'); return; }
    showToast(`已导入 ${r.matched} 人${r.unmatched.length ? `，未匹配：${r.unmatched.join(', ')}` : ''}`); load();
  };
  if (!list) return <Loading />;
  const drafts = list.filter(s => s.status === 'draft');
  const sum = (k) => lt.rows.reduce((a, s) => a + (s[k] || 0), 0);
  return (
    <>
      <div className="mz-card" style={{ padding: 12 }}>
        <div className="mz-actions" style={{ flexWrap: 'wrap' }}>
          <input className="mz-input" type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 150 }} />
          <button className="mz-btn mz-btn-p" onClick={generate}>从已入账工时生成</button>
          <label className="mz-btn" style={{ cursor: 'pointer' }}>导入税/社保扣款 CSV
            <input type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) importCsv(e.target.files[0]); e.target.value = ''; }} /></label>
          <button className="mz-btn" disabled={!checked.length} onClick={() => issue(checked)}>签发所选 {checked.length || ''}</button>
          <button className="mz-btn" disabled={!drafts.length} onClick={() => issue(drafts.map(s => s.id))}>全部签发 {drafts.length || ''}</button>
        </div>
        <div className="mz-hint" style={{ marginTop: 8 }}>
          工资条按本月「已入账」的自有员工工时汇总。税与社保（Lohnsteuer、KV/RV/AV/PV）请以工资核算软件（DATEV 等）的计算结果为准：在明细里录入，或导入 CSV（列：emp_no 或 pnr，lst, soli, kist, kv, rv, av, pv）。未录入时工资条按税前金额出具并注明。
        </div>
      </div>
      <div className="mz-grid mz-g4">
        {[['人数', lt.rows.length], ['税前合计', eur(sum('gross'))], ['法定扣款', eur(sum('statutory_total'))], ['实发合计', eur(sum('payout'))]].map(([l, v]) => (
          <div key={l} className="mz-card"><div className="mz-kpi-l">{l}</div><div className="mz-kpi-v" style={{ fontSize: 22 }}>{v}</div></div>
        ))}
      </div>
      <ListToolbar lt={lt} title={`工资条 ${period}`} columns={COLS} token={token} subtitle={`工资月份 ${period}`}
        bundle={{ label: '打包下载工资条 PDF', disabled: !lt.rows.length, url: () => `${F}/payslips/zip?period=${period}&ids=${lt.rows.map(s => s.id).join(',')}` }} />
      <div className="mz-card" style={{ padding: 0 }}>
        {!list.length ? <div className="mz-empty">本月还没有工资条。先在「工时记录」完成审批入账，再点「从已入账工时生成」。</div> : (
          <div className="mz-scroll"><table className="mz-table">
            <thead><tr>
              <th style={{ width: 28 }}><input type="checkbox" checked={checked.length === drafts.length && drafts.length > 0} onChange={e => setChecked(e.target.checked ? drafts.map(s => s.id) : [])} /></th>
              <th>员工</th><th style={{ textAlign: 'right' }}>工时</th><th style={{ textAlign: 'right' }}>税前</th><th style={{ textAlign: 'right' }}>税/社保</th>
              <th style={{ textAlign: 'right' }}>其他扣款</th><th style={{ textAlign: 'right' }}>实发</th><th>状态</th><th /></tr></thead>
            <tbody>{lt.rows.map(s => {
              const other = (s.other_deductions || []).reduce((a, o) => a + o.amount, 0);
              return (
                <tr key={s.id}>
                  <td><input type="checkbox" disabled={s.status !== 'draft'} checked={checked.includes(s.id)} onChange={e => setChecked(e.target.checked ? [...checked, s.id] : checked.filter(x => x !== s.id))} /></td>
                  <td><div style={{ fontWeight: 500 }}>{s.emp_name}</div><div className="mz-muted">{s.emp_no}{s.employee?.datev_pnr ? ` · PNR ${s.employee.datev_pnr}` : ''}</div></td>
                  <td className="mz-num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{s.total_hours} h · {s.work_days} 天</td>
                  <td className="mz-num" style={{ textAlign: 'right' }}>{eur(s.gross)}</td>
                  <td className="mz-num" style={{ textAlign: 'right', color: s.statutory_source === 'none' ? 'var(--og)' : undefined }}>{s.statutory_source === 'none' ? '未录入' : eur(s.statutory_total)}</td>
                  <td className="mz-num" style={{ textAlign: 'right' }}>{other ? eur(other) : '—'}</td>
                  <td className="mz-num" style={{ textAlign: 'right', fontWeight: 600 }}>{eur(s.payout)}</td>
                  <td><Tag color={s.status === 'issued' ? 'var(--gn)' : 'var(--tx3)'}>{s.status === 'issued' ? '已签发' : '草稿'}</Tag></td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="mz-btn mz-btn-s" onClick={() => openFile(`${F}/payslips/${s.id}/pdf`, token).catch(e => showToast(e.message, 'err'))}>PDF</button>{' '}
                    <button className="mz-btn mz-btn-s" onClick={() => setSel(s)}>{s.status === 'draft' ? '编辑' : '查看'}</button>
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>
      {sel && <SlipDrawer slip={sel} token={token} user={user} onClose={() => setSel(null)} onSaved={() => { setSel(null); load(); }} />}
    </>
  );
}

function SlipDrawer({ slip, token, user, onClose, onSaved }) {
  const showToast = useToast();
  const [stat, setStat] = useState(slip.statutory || {});
  const [other, setOther] = useState(slip.other_deductions || []);
  const [notes, setNotes] = useState(slip.notes || '');
  const ro = slip.status !== 'draft';
  const gross = slip.gross;
  const statSum = STAT.reduce((a, [k]) => a + (Number(stat[k]) || 0), 0);
  const otherSum = other.reduce((a, o) => a + (Number(o.amount) || 0), 0);
  const save = async () => {
    try {
      await api(`${F}/payslips/${slip.id}`, { method: 'PUT', token, body: {
        statutory: Object.fromEntries(STAT.map(([k]) => [k, Number(stat[k]) || 0])),
        other_deductions: other.map(o => ({ ...o, amount: Number(o.amount) || 0 })), notes } });
      showToast('已保存'); onSaved();
    } catch (e) { showToast(e.message, 'err'); }
  };
  const revoke = async () => {
    if (!window.confirm('撤回签发？档案中的 PDF 将被移除，工资条回到草稿。')) return;
    try { await api(`${F}/payslips/${slip.id}/revoke`, { method: 'POST', token }); showToast('已撤回'); onSaved(); } catch (e) { showToast(e.message, 'err'); }
  };
  return (
    <Drawer title={`工资条 ${slip.period} · ${slip.emp_name}`} sub={`${slip.slip_no} · ${slip.emp_no}`} onClose={onClose}
      footer={<>
        {ro && user.role === 'admin' && <button className="mz-btn mz-btn-d" style={{ marginRight: 'auto' }} onClick={revoke}>撤回签发</button>}
        <button className="mz-btn" onClick={() => openFile(`${F}/payslips/${slip.id}/pdf`, token).catch(e => showToast(e.message, 'err'))}>预览 PDF</button>
        {!ro && <button className="mz-btn mz-btn-p" onClick={save}>保存</button>}
      </>}>
      <div>
        <div className="mz-section">收入（来自工时记录）</div>
        {slip.earnings.map((e, i) => (
          <div key={i} className="mz-row" style={{ padding: '6px 0' }}>
            <span className="mz-grow">{e.label}</span>
            <span className="mz-muted mz-num">{e.qty != null ? `${e.qty} ${e.unit}` : ''}{e.rate ? ` × €${e.rate}` : ''}</span>
            <span className="mz-num" style={{ width: 90, textAlign: 'right' }}>{eur(e.amount)}</span>
          </div>
        ))}
        <div className="mz-row" style={{ padding: '6px 0', fontWeight: 600 }}><span className="mz-grow">税前合计 Gesamtbrutto</span><span className="mz-num">{eur(gross)}</span></div>
      </div>
      <div>
        <div className="mz-section">法定扣款（员工部分，按工资核算结果录入）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          {STAT.map(([k, l]) => (
            <div key={k} className="mz-field"><label>{l}</label>
              <input className="mz-input" type="number" step="0.01" min="0" disabled={ro} value={stat[k] ?? ''} onChange={e => setStat({ ...stat, [k]: e.target.value })} /></div>
          ))}
        </div>
      </div>
      <div>
        <div className="mz-section">其他扣款 / 预支</div>
        {other.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input className="mz-input mz-grow" disabled={ro || o.auto} value={o.label} onChange={e => setOther(other.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className="mz-input" style={{ width: 110 }} type="number" step="0.01" disabled={ro || o.auto} value={o.amount} onChange={e => setOther(other.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
            {!ro && !o.auto && <button className="mz-btn mz-btn-s" onClick={() => setOther(other.filter((_, j) => j !== i))}>×</button>}
          </div>
        ))}
        {!ro && <button className="mz-btn mz-btn-s" style={{ marginTop: 8 }} onClick={() => setOther([...other, { label: 'Vorschuss 预支', amount: '' }])}>+ 添加扣款</button>}
      </div>
      <div className="mz-field"><label>备注（显示在工资条上）</label><input className="mz-input" disabled={ro} value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <div className="mz-card" style={{ background: 'var(--bg3)' }}>
        <div className="mz-row" style={{ padding: '3px 0' }}><span className="mz-grow">税前</span><span className="mz-num">{eur(gross)}</span></div>
        <div className="mz-row" style={{ padding: '3px 0' }}><span className="mz-grow">− 税/社保</span><span className="mz-num">{eur(statSum)}</span></div>
        <div className="mz-row" style={{ padding: '3px 0' }}><span className="mz-grow">= 税后</span><span className="mz-num">{eur(gross - statSum)}</span></div>
        <div className="mz-row" style={{ padding: '3px 0' }}><span className="mz-grow">− 其他扣款</span><span className="mz-num">{eur(otherSum)}</span></div>
        <div className="mz-row" style={{ padding: '3px 0', fontWeight: 700 }}><span className="mz-grow">实发 Auszahlung</span><span className="mz-num">{eur(gross - statSum - otherSum)}</span></div>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────
function SupplierStatements({ token, user }) {
  const showToast = useToast();
  const [period, setPeriod] = useState(lastMonth());
  const [list, setList] = useState(null);
  const [detail, setDetail] = useState(null);
  const canGen = ['admin', 'fin', 'hr'].includes(user.role);
  const load = () => api(`${F}/supplier-statements?period=${period}`, { token }).then(setList).catch(e => showToast(e.message, 'err'));
  const lt = useListTools(list || [], { supplier: 'supplier_id' }, token);
  const COLS = [
    { label: '结算单', value: 'settle_no' }, { label: '供应商', value: 'supplier_name' }, { label: '人数', value: 'employee_count', type: 'int', sum: true },
    { label: '工时', value: 'total_hours', type: 'num', sum: true }, { label: '净额', value: 'net', type: 'money', sum: true },
    { label: '增值税', value: 'vat', type: 'money', sum: true }, { label: '含税', value: 'gross', type: 'money', sum: true },
    { label: '发票号', value: 'invoice_no' }, { label: '发票日期', value: 'invoice_date', type: 'date' }, { label: '状态', value: 'status' },
  ];
  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps
  const generate = async () => {
    try { const r = await api('/api/v1/settlements/supplier/generate', { method: 'POST', body: { period }, token }); showToast(`已生成 ${r.generated} 个供应商结算`); load(); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const open = async (s) => {
    try { setDetail({ s, d: await api(`${F}/supplier-statements/${s.id}`, { token }) }); } catch (e) { showToast(e.message, 'err'); }
  };
  if (!list) return <Loading />;
  return (
    <>
      <div className="mz-card" style={{ padding: 12 }}>
        <div className="mz-actions">
          <input className="mz-input" type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 150 }} />
          {canGen && <button className="mz-btn mz-btn-p" onClick={generate}>按已入账工时生成 / 更新</button>}
        </div>
        <div className="mz-hint" style={{ marginTop: 8 }}>结算单（Leistungsabrechnung）列出供应商每位人员的天数、工时和金额，供应商据此开票；供应商账号登录后可下载自己的结算单。发票号与付款在「月度结算」中登记。</div>
      </div>
      <ListToolbar lt={lt} title={`供应商结算 ${period}`} columns={COLS} token={token} subtitle={`结算月份 ${period}`}
        bundle={{ label: '打包下载结算单 PDF', disabled: !lt.rows.length, url: () => `${F}/supplier-statements/zip?period=${period}${lt.sup && lt.sup !== '__own' ? `&supplier_id=${lt.sup}` : ''}` }} />
      <div className="mz-card" style={{ padding: 0 }}>
        {!list.length ? <div className="mz-empty">本月暂无供应商结算</div> : (
          <div className="mz-scroll"><table className="mz-table">
            <thead><tr><th>结算单</th><th>供应商</th><th style={{ textAlign: 'right' }}>人数</th><th style={{ textAlign: 'right' }}>工时</th>
              <th style={{ textAlign: 'right' }}>净额</th><th style={{ textAlign: 'right' }}>含税</th><th>状态</th><th /></tr></thead>
            <tbody>{lt.rows.map(s => (
              <tr key={s.id}>
                <td className="mz-num mz-muted">{s.settle_no}</td><td style={{ fontWeight: 500 }}>{s.supplier_name}</td>
                <td className="mz-num" style={{ textAlign: 'right' }}>{s.employee_count}</td><td className="mz-num" style={{ textAlign: 'right' }}>{s.total_hours}</td>
                <td className="mz-num" style={{ textAlign: 'right' }}>{eur(s.net)}</td><td className="mz-num" style={{ textAlign: 'right' }}>{eur(s.gross)}</td>
                <td><Tag color={s.status === 'paid' ? 'var(--gn)' : s.status === 'invoiced' ? 'var(--ac)' : 'var(--tx3)'}>{{ draft: '待开票', invoiced: '已开票', paid: '已付款' }[s.status] || s.status}</Tag>{s.invoice_no && <div className="mz-muted">{s.invoice_no}</div>}</td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button className="mz-btn mz-btn-s" onClick={() => open(s)}>明细</button>{' '}
                  <button className="mz-btn mz-btn-s" onClick={() => openFile(`${F}/supplier-statements/${s.id}/pdf`, token).catch(e => showToast(e.message, 'err'))}>PDF</button>{' '}
                  <button className="mz-btn mz-btn-s" onClick={() => saveFile(`${F}/supplier-statements/${s.id}/csv`, token, `Leistungsnachweis_${s.settle_no}.csv`).catch(e => showToast(e.message, 'err'))}>工时 CSV</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
      {detail && (
        <Drawer title={detail.d.supplier_name} sub={`${detail.d.settle_no} · ${detail.d.period}`} onClose={() => setDetail(null)}>
          {detail.d.workers.map(w => (
            <div key={w.emp_no} className="mz-row" style={{ padding: '7px 0' }}>
              <span className="mz-grow"><span style={{ fontWeight: 500 }}>{w.name}</span> <span className="mz-muted">{w.emp_no}</span></span>
              <span className="mz-muted mz-num">{w.days} 天 · {w.hours} h</span>
              <span className="mz-num" style={{ width: 90, textAlign: 'right' }}>{eur(w.amount)}</span>
            </div>
          ))}
        </Drawer>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Invoices({ token, user }) {
  const showToast = useToast();
  const [list, setList] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('');
  const [newForm, setNewForm] = useState(null);
  const [edit, setEdit] = useState(null);
  const canWrite = ['admin', 'fin'].includes(user.role);
  const load = () => api(`${F}/invoices`, { token }).then(setList).catch(e => showToast(e.message, 'err'));
  const lt = useListTools(list || [], { date: i => i.issue_date || (i.created_at || '').slice(0, 10) }, token);
  const COLS = [
    { label: '发票号', value: i => i.invoice_no || `草稿 #${i.id}` }, { label: '类型', value: i => (i.kind === 'storno' ? '红字发票' : '发票') },
    { label: '客户', value: 'customer_name' }, { label: 'USt-IdNr.', value: 'customer_vat_id' },
    { label: '服务期间从', value: 'period_from', type: 'date' }, { label: '至', value: 'period_to', type: 'date' },
    { label: '开票日期', value: 'issue_date', type: 'date' }, { label: '到期', value: 'due_date', type: 'date' },
    { label: '净额', value: 'net', type: 'money', sum: true }, { label: '增值税', value: 'vat', type: 'money', sum: true }, { label: '含税', value: 'gross', type: 'money', sum: true },
    { label: '状态', value: i => (i.overdue ? '逾期' : INV_STATUS[i.status][0]) }, { label: '收款日期', value: 'paid_at', type: 'date' }, { label: '收款金额', value: 'paid_amount', type: 'money', sum: true },
  ];
  useEffect(() => { load(); api(`${F}/customers`, { token }).then(setCustomers).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createDraft = async () => {
    try {
      const r = await api(`${F}/invoices/draft`, { method: 'POST', token, body: newForm });
      setNewForm(null); load(); setEdit({ ...r });
    } catch (e) { showToast(e.message, 'err'); }
  };
  const openInv = async (i) => { try { setEdit(await api(`${F}/invoices/${i.id}`, { token })); } catch (e) { showToast(e.message, 'err'); } };
  if (!list) return <Loading />;
  const shown = lt.rows.filter(i => !filter || (filter === 'overdue' ? i.overdue : i.status === filter));
  const open = list.filter(i => i.status === 'issued' && i.kind === 'invoice');
  const [pf, pt] = monthRange(lastMonth());
  return (
    <>
      <div className="mz-grid mz-g4">
        <div className="mz-card"><div className="mz-kpi-l">待收款</div><div className="mz-kpi-v" style={{ fontSize: 22 }}>{eur(open.reduce((a, i) => a + i.gross, 0))}</div><div className="mz-kpi-n">{open.length} 张</div></div>
        <div className="mz-card"><div className="mz-kpi-l">已逾期</div><div className="mz-kpi-v" style={{ fontSize: 22, color: list.some(i => i.overdue) ? 'var(--rd)' : undefined }}>{eur(list.filter(i => i.overdue).reduce((a, i) => a + i.gross, 0))}</div><div className="mz-kpi-n">{list.filter(i => i.overdue).length} 张</div></div>
        <div className="mz-card"><div className="mz-kpi-l">草稿</div><div className="mz-kpi-v" style={{ fontSize: 22 }}>{list.filter(i => i.status === 'draft').length}</div><div className="mz-kpi-n">未开具</div></div>
        <div className="mz-card"><div className="mz-kpi-l">已收款（全部）</div><div className="mz-kpi-v" style={{ fontSize: 22 }}>{eur(list.filter(i => i.status === 'paid').reduce((a, i) => a + i.paid_amount, 0))}</div></div>
      </div>
      <div className="mz-card" style={{ padding: 12 }}>
        <div className="mz-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="mz-seg">
            {[['', '全部'], ['draft', '草稿'], ['issued', '待收款'], ['overdue', '逾期'], ['paid', '已收款'], ['cancelled', '已作废']].map(([k, l]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          {canWrite && <button className="mz-btn mz-btn-p" disabled={!customers.length} title={customers.length ? '' : '请先在「客户」中添加甲方'}
            onClick={() => setNewForm({ customer_id: customers.find(c => c.is_active)?.id, period_from: pf, period_to: pt, include: { hours: true, containers: true, operations: false } })}>新建账单</button>}
        </div>
      </div>
      <ListToolbar lt={{ ...lt, rows: shown }} title="甲方账单" columns={COLS} token={token} dateLabel="开票日期"
        bundle={{ label: '打包下载发票 PDF', disabled: !shown.some(i => i.invoice_no), title: '仅已开具的发票',
          url: () => `${F}/invoices/zip?ids=${shown.filter(i => i.invoice_no).map(i => i.id).join(',')}` }} />
      <div className="mz-card" style={{ padding: 0 }}>
        {!shown.length ? <div className="mz-empty">{customers.length ? '暂无账单' : '先在「客户」页添加甲方并关联仓库，再按月生成账单。'}</div> : (
          <div className="mz-scroll"><table className="mz-table">
            <thead><tr><th>发票号</th><th>客户</th><th>服务期间</th><th>开票 / 到期</th><th style={{ textAlign: 'right' }}>净额</th><th style={{ textAlign: 'right' }}>含税</th><th>状态</th><th /></tr></thead>
            <tbody>{shown.map(i => (
              <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => openInv(i)}>
                <td className="mz-num">{i.invoice_no || <span className="mz-muted">草稿 #{i.id}</span>}{i.kind === 'storno' && <div className="mz-muted">红字发票</div>}</td>
                <td style={{ fontWeight: 500 }}>{i.customer_name}</td>
                <td className="mz-num mz-muted">{i.period_from} → {i.period_to}</td>
                <td className="mz-num">{i.issue_date || '—'}<div className="mz-muted" style={{ color: i.overdue ? 'var(--rd)' : undefined }}>{i.due_date ? `到期 ${i.due_date}` : ''}</div></td>
                <td className="mz-num" style={{ textAlign: 'right' }}>{eur(i.net)}</td>
                <td className="mz-num" style={{ textAlign: 'right', fontWeight: 600 }}>{eur(i.gross)}</td>
                <td><Tag color={i.overdue ? 'var(--rd)' : INV_STATUS[i.status][1]}>{i.overdue ? '逾期' : INV_STATUS[i.status][0]}</Tag></td>
                <td style={{ textAlign: 'right' }}><button className="mz-btn mz-btn-s" onClick={e => { e.stopPropagation(); openFile(`${F}/invoices/${i.id}/pdf`, token).catch(x => showToast(x.message, 'err')); }}>PDF</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {newForm && (
        <Drawer title="新建甲方账单" onClose={() => setNewForm(null)} width={460}
          footer={<><button className="mz-btn" onClick={() => setNewForm(null)}>取消</button><button className="mz-btn mz-btn-p" onClick={createDraft}>生成草稿</button></>}>
          <div className="mz-field"><label>客户</label>
            <select className="mz-select" value={newForm.customer_id || ''} onChange={e => setNewForm({ ...newForm, customer_id: Number(e.target.value) })}>
              {customers.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}（{c.warehouse_codes.join(', ') || '未关联仓库'}）</option>)}
            </select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mz-field"><label>服务期间从</label><input className="mz-input" type="date" value={newForm.period_from} onChange={e => setNewForm({ ...newForm, period_from: e.target.value })} /></div>
            <div className="mz-field"><label>至</label><input className="mz-input" type="date" value={newForm.period_to} onChange={e => setNewForm({ ...newForm, period_to: e.target.value })} /></div>
          </div>
          <div className="mz-section">计费来源</div>
          {[['hours', '工时（仓库已审批）× 仓库客户时薪'], ['containers', '装卸柜（已审批）× 柜型单价'], ['operations', '计件作业（已确认）× 作业类型客户单价']].map(([k, l]) => (
            <label key={k} className="mz-switch">{l}<input type="checkbox" checked={!!newForm.include[k]} onChange={e => setNewForm({ ...newForm, include: { ...newForm.include, [k]: e.target.checked } })} /></label>
          ))}
          <div className="mz-hint">单价取自「仓库价格配置」与「作业类型」中的客户单价；同一项工作不要同时按工时和计件计费。生成后可逐行修改、增删明细。</div>
        </Drawer>
      )}
      {edit && <InvoiceDrawer key={`${edit.id}-${edit.status}-${edit.updated_at}`} inv={edit} token={token} canWrite={canWrite} onClose={() => setEdit(null)} onChange={(x) => { load(); if (x) setEdit(x); else setEdit(null); }} />}
    </>
  );
}

function InvoiceDrawer({ inv, token, canWrite, onClose, onChange }) {
  const showToast = useToast();
  const [lines, setLines] = useState(inv.lines.map(l => ({ ...l })));
  const [notes, setNotes] = useState(inv.notes || '');
  const draft = inv.status === 'draft';
  const net = lines.reduce((a, l) => a + Math.round((Number(l.qty) || 0) * (Number(l.unit_price) || 0) * 100) / 100, 0);
  const vat = inv.reverse_charge ? 0 : Math.round(net * inv.vat_rate * 100) / 100;
  const dirty = JSON.stringify(lines) !== JSON.stringify(inv.lines) || notes !== (inv.notes || '');
  const call = async (path, body, msg) => {
    try { const r = await api(`${F}/invoices/${inv.id}${path}`, { method: 'POST', token, body }); showToast(msg); onChange(r.storno ? null : r); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const save = async () => {
    try { const r = await api(`${F}/invoices/${inv.id}`, { method: 'PUT', token, body: { lines, notes } }); showToast('已保存'); onChange(r); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const issue = async () => {
    if (dirty) { showToast('请先保存修改', 'err'); return; }
    if (!window.confirm('开具后将分配正式发票号并锁定，之后只能通过红字发票作废。确定开具？')) return;
    call('/issue', {}, '账单已开具');
  };
  const del = async () => {
    if (!window.confirm('删除此草稿？')) return;
    try { await api(`${F}/invoices/${inv.id}`, { method: 'DELETE', token }); showToast('已删除'); onChange(null); } catch (e) { showToast(e.message, 'err'); }
  };
  const cancel = () => { const r = window.prompt('作废原因（会写在红字发票上）：'); if (r && r.trim().length >= 2) call('/cancel', { reason: r.trim() }, '已作废并生成红字发票'); };
  const paid = () => { const d = window.prompt('收款日期（YYYY-MM-DD）：', new Date().toISOString().slice(0, 10)); if (d) call('/paid', { paid_at: d }, '已登记收款'); };
  const set = (i, k, v) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <Drawer width={860} title={inv.invoice_no ? `${inv.kind === 'storno' ? '红字发票' : '发票'} ${inv.invoice_no}` : `账单草稿 #${inv.id}`}
      sub={`${inv.customer_name} · ${inv.period_from} → ${inv.period_to}${inv.reverse_charge ? ' · § 13b 反向征收' : ''}`} onClose={onClose}
      footer={<>
        {draft && canWrite && <button className="mz-btn mz-btn-d" style={{ marginRight: 'auto' }} onClick={del}>删除草稿</button>}
        {!draft && canWrite && inv.kind === 'invoice' && inv.status !== 'cancelled' && <button className="mz-btn mz-btn-d" style={{ marginRight: 'auto' }} onClick={cancel}>作废（红字发票）</button>}
        <button className="mz-btn" onClick={() => openFile(`${F}/invoices/${inv.id}/pdf`, token).catch(e => showToast(e.message, 'err'))}>{draft ? '预览 PDF' : 'PDF'}</button>
        {!draft && <button className="mz-btn" onClick={() => saveFile(`${F}/invoices/${inv.id}/xrechnung`, token, `${inv.invoice_no}_xrechnung.xml`).catch(e => showToast(e.message, 'err'))}>XRechnung</button>}
        {!draft && canWrite && inv.status === 'issued' && inv.kind === 'invoice' && <button className="mz-btn mz-btn-p" onClick={paid}>登记收款</button>}
        {draft && canWrite && <button className="mz-btn" disabled={!dirty} onClick={save}>保存</button>}
        {draft && canWrite && <button className="mz-btn mz-btn-p" onClick={issue}>开具</button>}
      </>}>
      {inv.warnings?.length > 0 && <div className="mz-card" style={{ background: 'var(--bg3)', padding: 10 }}>{inv.warnings.map(w => <div key={w} className="mz-hint" style={{ color: 'var(--og)' }}>⚠ {w}</div>)}</div>}
      <div className="mz-scroll"><table className="mz-table">
        <thead><tr><th>服务内容（发票上显示）</th><th style={{ width: 90, textAlign: 'right' }}>数量</th><th style={{ width: 80 }}>单位</th><th style={{ width: 100, textAlign: 'right' }}>单价 €</th><th style={{ width: 100, textAlign: 'right' }}>金额</th>{draft && <th style={{ width: 30 }} />}</tr></thead>
        <tbody>{lines.map((l, i) => (
          <tr key={i}>
            <td>{draft ? <input className="mz-input" style={{ width: '100%' }} value={l.description} onChange={e => set(i, 'description', e.target.value)} /> : l.description}</td>
            <td style={{ textAlign: 'right' }}>{draft ? <input className="mz-input" style={{ width: 80, textAlign: 'right' }} type="number" step="any" value={l.qty} onChange={e => set(i, 'qty', e.target.value)} /> : l.qty}</td>
            <td>{draft ? <input className="mz-input" style={{ width: 70 }} value={l.unit} onChange={e => set(i, 'unit', e.target.value)} /> : l.unit}</td>
            <td style={{ textAlign: 'right' }}>{draft ? <input className="mz-input" style={{ width: 90, textAlign: 'right' }} type="number" step="any" value={l.unit_price} onChange={e => set(i, 'unit_price', e.target.value)} /> : eur(l.unit_price)}</td>
            <td className="mz-num" style={{ textAlign: 'right', color: !Number(l.unit_price) ? 'var(--rd)' : undefined }}>{eur((Number(l.qty) || 0) * (Number(l.unit_price) || 0))}</td>
            {draft && <td><button className="mz-link" onClick={() => setLines(lines.filter((_, j) => j !== i))}>×</button></td>}
          </tr>
        ))}</tbody>
      </table></div>
      {draft && <button className="mz-btn mz-btn-s" style={{ alignSelf: 'flex-start' }} onClick={() => setLines([...lines, { description: '', qty: 1, unit: 'pauschal', unit_price: 0, source: 'manual' }])}>+ 添加明细</button>}
      <div style={{ alignSelf: 'flex-end', minWidth: 260 }}>
        <div className="mz-row" style={{ padding: '3px 0' }}><span className="mz-grow">净额 Summe netto</span><span className="mz-num">{eur(net)}</span></div>
        <div className="mz-row" style={{ padding: '3px 0' }}><span className="mz-grow">{inv.reverse_charge ? 'USt. 0 %（§ 13b）' : `USt. ${Math.round(inv.vat_rate * 100)} %`}</span><span className="mz-num">{eur(vat)}</span></div>
        <div className="mz-row" style={{ padding: '3px 0', fontWeight: 700 }}><span className="mz-grow">合计 Rechnungsbetrag</span><span className="mz-num">{eur(net + vat)}</span></div>
        {inv.status === 'paid' && <div className="mz-hint" style={{ color: 'var(--gn)' }}>已于 {inv.paid_at} 收款 {eur(inv.paid_amount)}</div>}
      </div>
      <div className="mz-field"><label>发票备注（显示在发票上）</label>
        <textarea className="mz-input" style={{ height: 60, padding: 8 }} disabled={!draft} value={notes} onChange={e => setNotes(e.target.value)} /></div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────
const EMPTY_CUST = { name: '', address: '', country: 'DE', vat_id: '', email: '', contact: '', payment_days: '', reverse_charge: false, buyer_reference: '', warehouse_codes: [], datev_account: '', is_active: true, notes: '' };

function Customers({ token, user }) {
  const showToast = useToast();
  const [list, setList] = useState(null);
  const [whs, setWhs] = useState([]);
  const [form, setForm] = useState(null);
  const canWrite = ['admin', 'fin'].includes(user.role);
  const load = () => api(`${F}/customers`, { token }).then(setList).catch(e => showToast(e.message, 'err'));
  const lt = useListTools(list || [], { warehouse: c => (c.warehouse_codes || [])[0] }, token);
  const COLS = [
    { label: '客户', value: 'name' }, { label: '地址', value: c => (c.address || '').replace(/\n/g, ', ') }, { label: '国家', value: 'country' },
    { label: 'USt-IdNr.', value: 'vat_id' }, { label: '§13b', value: c => (c.reverse_charge ? '是' : '') }, { label: '邮箱', value: 'email' },
    { label: '联系人', value: 'contact' }, { label: '仓库', value: c => (c.warehouse_codes || []).join(', ') },
    { label: '付款期(天)', value: 'payment_days', type: 'int' }, { label: 'DATEV 债务人', value: 'debitor' }, { label: '状态', value: c => (c.is_active ? '启用' : '停用') },
  ];
  useEffect(() => { load(); api('/api/v1/warehouses', { token }).then(setWhs).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    try {
      const body = { ...form, payment_days: form.payment_days === '' || form.payment_days == null ? null : Number(form.payment_days) };
      ['vat_id', 'email', 'contact', 'buyer_reference', 'datev_account', 'address', 'notes'].forEach(k => { if (!body[k]) body[k] = null; });
      await api(form.id ? `${F}/customers/${form.id}` : `${F}/customers`, { method: form.id ? 'PUT' : 'POST', token, body });
      showToast('已保存'); setForm(null); load();
    } catch (e) { showToast(e.message, 'err'); }
  };
  if (!list) return <Loading />;
  const f = form;
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <>
      {canWrite && <div className="mz-actions"><button className="mz-btn mz-btn-p" onClick={() => setForm({ ...EMPTY_CUST })}>添加客户</button></div>}
      <ListToolbar lt={lt} title="客户" columns={COLS} token={token} />
      <div className="mz-card" style={{ padding: 0 }}>
        {!list.length ? <div className="mz-empty">还没有客户。添加甲方（仓库方）的开票信息并关联仓库后，即可按月生成账单。</div> : (
          <div className="mz-scroll"><table className="mz-table">
            <thead><tr><th>客户</th><th>USt-IdNr.</th><th>仓库</th><th>付款期</th><th>DATEV 债务人</th><th /></tr></thead>
            <tbody>{lt.rows.map(c => (
              <tr key={c.id} style={{ opacity: c.is_active ? 1 : 0.5 }}>
                <td><div style={{ fontWeight: 500 }}>{c.name}</div><div className="mz-muted">{(c.address || '').replace(/\n/g, ', ')}</div></td>
                <td className="mz-num">{c.vat_id || '—'}{c.reverse_charge && <div className="mz-muted">§ 13b</div>}</td>
                <td>{c.warehouse_codes.join(', ') || '—'}</td>
                <td>{c.payment_days != null ? `${c.payment_days} 天` : '默认'}</td>
                <td className="mz-num">{c.debitor}</td>
                <td style={{ textAlign: 'right' }}>{canWrite && <button className="mz-btn mz-btn-s" onClick={() => setForm({ ...EMPTY_CUST, ...c, payment_days: c.payment_days ?? '' })}>编辑</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
      {f && (
        <Drawer title={f.id ? '编辑客户' : '添加客户'} onClose={() => setForm(null)}
          footer={<><button className="mz-btn" onClick={() => setForm(null)}>取消</button><button className="mz-btn mz-btn-p" onClick={save}>保存</button></>}>
          <div className="mz-field"><label>公司名称（开票抬头）*</label><input className="mz-input" value={f.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="mz-field"><label>地址（每行一项：街道门牌 / 邮编 城市）*</label>
            <textarea className="mz-input" style={{ height: 64, padding: 8 }} value={f.address || ''} onChange={e => set('address', e.target.value)} placeholder={'Kaltbandstraße 4\n44145 Dortmund'} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mz-field"><label>国家代码</label><input className="mz-input" maxLength={2} value={f.country} onChange={e => set('country', e.target.value.toUpperCase())} /></div>
            <div className="mz-field"><label>USt-IdNr.</label><input className="mz-input" value={f.vat_id || ''} onChange={e => set('vat_id', e.target.value.toUpperCase())} /></div>
            <div className="mz-field"><label>账单邮箱</label><input className="mz-input" value={f.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div className="mz-field"><label>联系人</label><input className="mz-input" value={f.contact || ''} onChange={e => set('contact', e.target.value)} /></div>
            <div className="mz-field"><label>付款期限（天，空=系统默认）</label><input className="mz-input" type="number" value={f.payment_days} onChange={e => set('payment_days', e.target.value)} /></div>
            <div className="mz-field"><label>DATEV 债务人科目（空=自动）</label><input className="mz-input" value={f.datev_account || ''} onChange={e => set('datev_account', e.target.value)} /></div>
          </div>
          <div className="mz-field"><label>客户参考号 / Leitweg-ID（XRechnung，可选）</label><input className="mz-input" value={f.buyer_reference || ''} onChange={e => set('buyer_reference', e.target.value)} /></div>
          <div className="mz-field"><label>关联仓库（账单从这些仓库汇总）</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {whs.map(w => (
                <button key={w.code} type="button" className={`mz-btn mz-btn-s ${f.warehouse_codes.includes(w.code) ? 'mz-btn-p' : ''}`}
                  onClick={() => set('warehouse_codes', f.warehouse_codes.includes(w.code) ? f.warehouse_codes.filter(x => x !== w.code) : [...f.warehouse_codes, w.code])}>{w.code}</button>
              ))}
            </div></div>
          <label className="mz-switch">欧盟其他国家企业客户：§ 13b 反向征收（0% 增值税）<input type="checkbox" checked={f.reverse_charge} onChange={e => set('reverse_charge', e.target.checked)} /></label>
          <label className="mz-switch">启用<input type="checkbox" checked={f.is_active} onChange={e => set('is_active', e.target.checked)} /></label>
        </Drawer>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Datev({ token, user }) {
  const showToast = useToast();
  const [period, setPeriod] = useState(lastMonth());
  const [check, setCheck] = useState(null);
  const [ustva, setUstva] = useState(null);
  const fin = ['admin', 'fin'].includes(user.role);
  useEffect(() => {
    setCheck(null); setUstva(null);
    api(`${F}/datev/check?period=${period}`, { token }).then(setCheck).catch(e => showToast(e.message, 'err'));
    if (fin) api(`${F}/tax/ustva?period=${period}`, { token }).then(setUstva).catch(() => {});
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps
  const dl = (path, name) => saveFile(path, token, name).catch(e => showToast(e.message, 'err'));
  return (
    <>
      <div className="mz-card" style={{ padding: 12 }}>
        <div className="mz-actions"><input className="mz-input" type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 150 }} />
          <span className="mz-muted">导出文件交给税务师（Steuerberater）导入 DATEV；科目与 Lohnart 在「系统设置 → 财务 / DATEV」中配置。</span></div>
      </div>
      {check && (check.settings_missing.length > 0 || check.company_missing.length > 0 || check.missing_pnr.length > 0 || check.lodas_missing.length > 0) && (
        <div className="mz-card" style={{ background: 'var(--bg3)' }}>
          <div className="mz-section" style={{ color: 'var(--og)' }}>需要补充</div>
          {check.company_missing.length > 0 && <div className="mz-hint">公司开票信息：{check.company_missing.join('、')}</div>}
          {check.settings_missing.length > 0 && <div className="mz-hint">DATEV：Beraternummer / Mandantennummer 未填写</div>}
          {check.lodas_missing.length > 0 && <div className="mz-hint">LODAS：工时 Lohnart 未配置</div>}
          {check.missing_pnr.length > 0 && <div className="mz-hint">以下员工没有 DATEV 人员编号（在员工档案 → 个人信息中填写），LODAS 导出将跳过：{check.missing_pnr.map(m => `${m.name}（${m.emp_no}）`).join('、')}</div>}
        </div>
      )}
      <div className="mz-grid mz-g2">
        {fin && (
          <div className="mz-card">
            <div className="mz-card-t">会计凭证 · DATEV Buchungsstapel</div>
            <div className="mz-hint" style={{ margin: '6px 0 12px' }}>EXTF 格式（CSV）。包含本月开具的甲方账单（应收，含红字发票）与已开票的供应商结算（应付）。{check && `本月：账单 ${check.bookings.invoices} 张，供应商结算 ${check.bookings.supplier_settlements} 笔${check.bookings.skipped_supplier_drafts ? `（另有 ${check.bookings.skipped_supplier_drafts} 笔未开票未导出）` : ''}`}</div>
            <button className="mz-btn mz-btn-p" onClick={() => { const [a, b] = monthRange(period); dl(`${F}/datev/buchungsstapel?date_from=${a}&date_to=${b}`, `EXTF_Buchungsstapel_${period}.csv`); }}>下载 Buchungsstapel</button>
          </div>
        )}
        <div className="mz-card">
          <div className="mz-card-t">工资录入 · DATEV LODAS / Lohn und Gehalt</div>
          <div className="mz-hint" style={{ margin: '6px 0 12px' }}>按员工汇总本月已入账的工时、计件/卸柜金额、奖金与扣款。{check && `涉及 ${check.payroll_employees} 名自有员工。`}税与社保由 DATEV 计算，结果可再导入工资条。</div>
          <div className="mz-actions">
            <button className="mz-btn mz-btn-p" onClick={() => dl(`${F}/datev/lodas?period=${period}`, `LODAS_${period}.txt`)}>LODAS ASCII</button>
            <button className="mz-btn" onClick={() => dl(`${F}/datev/lohn-csv?period=${period}`, `Lohnvorerfassung_${period}.csv`)}>通用 CSV</button>
          </div>
        </div>
      </div>
      {fin && ustva && (
        <div className="mz-card">
          <div className="mz-card-t">增值税预申报预估 · UStVA {period}</div>
          <div className="mz-grid mz-g4" style={{ marginTop: 12 }}>
            {[['Kz 81 应税收入 19%', ustva.kz81_net, `税额 ${eur(ustva.kz81_tax)}`], ['Kz 60 § 13b 收入', ustva.kz60_net, '税由客户承担'], ['Kz 66 进项税', ustva.kz66_input_tax, '供应商结算'], ['应缴 / 退税', ustva.payable, '预估']].map(([l, v, n]) => (
              <div key={l}><div className="mz-kpi-l">{l}</div><div className="mz-kpi-v" style={{ fontSize: 20 }}>{eur(v)}</div><div className="mz-kpi-n">{n}</div></div>
            ))}
          </div>
          <div className="mz-hint" style={{ marginTop: 10 }}>{ustva.note} 申报通过 ELSTER 进行，一般由税务师经 DATEV 提交。</div>
        </div>
      )}
    </>
  );
}
