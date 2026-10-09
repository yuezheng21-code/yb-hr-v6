import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { initials } from './admin/shared.js';

const P = '/api/v1/personnel';
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d, n) => new Date(new Date(d).getTime() + n * 864e5).toISOString().slice(0, 10);

export const DOC_CAT = {
  id_doc: '身份证件', work_permit: '居留/工作许可', application: '求职材料', contract: '劳动合同', amendment: '合同补充协议',
  salary: '薪资', performance: '绩效', leave: '请假/病假证明', warning: 'Abmahnung', termination: '离职/解约',
  certificate: '证明/资质', training: '培训', other: '其他',
};
const EVENT = {
  hired: ['入职', 'var(--gn)'], contract: ['合同', 'var(--ac)'], amendment: ['合同修订', 'var(--ac)'],
  salary: ['调薪', 'var(--gn)'], performance: ['绩效', 'var(--pp)'], warning: ['警告', 'var(--rd)'],
  leave: ['请假', 'var(--og)'], termination: ['离职', 'var(--rd)'], document: ['文件', 'var(--tx3)'], note: ['备注', 'var(--tx3)'],
};
const LEAVE = { urlaub: '年假 Urlaub', krank: '病假 Krank', kind_krank: '子女病假', unbezahlt: '无薪假', sonderurlaub: '特别假', elternzeit: '育儿假', sonstiges: '其他' };
const CONTRACT = { befristet: '定期 befristet', unbefristet: '无固定期 unbefristet', minijob: 'Minijob', werkstudent: 'Werkstudent', aushilfe: '临时工 Aushilfe' };
const CONTRACT_STATUS = { draft: '草稿', active: '生效中', amended: '已修订', ended: '已结束' };
const TERM = { ordentlich: '普通解雇', fristlos: '即时解雇', aufhebung: '协议解除', befristung_ende: '合同到期', eigenkuendigung: '员工辞职', probezeit: '试用期解除' };
const LEAVE_STATUS = { requested: '待批准', approved: '已批准', rejected: '已拒绝' };
// action → template code offered after submit
const ACTION_TEMPLATE = { contract: 'AV_BEFRISTET', salary: 'AENDERUNG_LOHN', warning: 'ABMAHNUNG', termination: 'KUENDIGUNG_ORDENTLICH' };

const deDate = (v) => (v ? v.split('-').reverse().join('.') : '');
const deNum = (v) => (v === '' || v == null ? '' : Number(v).toFixed(2).replace('.', ','));
// Values the action form already knows → pre-filled into the template form
function prefillFor(kind, f, emp) {
  if (kind === 'salary') return { neuer_stundenlohn: deNum(f.new_rate), gueltig_ab: deDate(f.effective_date), bisheriger_stundenlohn: deNum(emp.hourly_rate) };
  if (kind === 'warning') return { vorfall_datum: deDate(f.incident_date), sachverhalt: f.description || f.reason, verletzte_pflicht: f.reason };
  if (kind === 'termination') return { beendigungsdatum: deDate(f.last_day) };
  return {};
}
const sizeLabel = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

async function fetchBlob(path, token, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { Authorization: 'Bearer ' + token, ...(opts.headers || {}) } });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || res.statusText);
  }
  return res.blob();
}
export async function openFile(path, token) {
  const w = window.open('', '_blank');
  try {
    const blob = await fetchBlob(path + (path.includes('?') ? '&' : '?') + 'inline=true', token);
    const url = URL.createObjectURL(blob);
    if (w) w.location = url; else window.location = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { if (w) w.close(); throw e; }
}
export async function saveFile(path, token, filename, opts) {
  const blob = await fetchBlob(path, token, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
export async function uploadDoc(token, empId, file, fields) {
  const fd = new FormData();
  fd.append('file', file);
  Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v); });
  const res = await fetch(`${P}/employees/${empId}/documents`, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

export default function PersonnelFile({ token, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('timeline');
  const [action, setAction] = useState(null);    // {kind, ...}
  const [gen, setGen] = useState(null);          // {templateCode?, eventId?, contractId?}
  const [templates, setTemplates] = useState([]);

  const load = () => api(`${P}/employees/${id}`, { token }).then(setD).catch(e => setErr(e.message));
  useEffect(() => {
    load();
    api(`${P}/templates`, { token }).then(setTemplates).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!['admin', 'hr'].includes(user?.role)) return <div className="mz-empty">人事档案仅 HR / 管理员可查看</div>;
  if (err) return <div className="mz-empty">{err}</div>;
  if (!d) return <Loading />;

  const e = d.employee;
  const ac = d.active_contract;
  const ls = d.leave_summary;
  const left = e.status !== 'active';

  const after = async (kind, res, file, useTemplate, prefill) => {
    if (file) {
      try { await uploadDoc(token, e.id, file, { category: fileCategory(kind), title: file.name, event_id: res.event_id }); }
      catch (x) { showToast('记录已保存，但附件上传失败：' + x.message, 'err'); }
    }
    setAction(null);
    await load();
    if (useTemplate && ACTION_TEMPLATE[kind]) setGen({ templateCode: ACTION_TEMPLATE[kind], eventId: res.event_id, contractId: kind === 'contract' ? res.id : undefined, values: prefill });
  };

  return (
    <div className="mz">
      <div className="mz-head" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="mz-btn mz-btn-s" onClick={() => navigate('/employees')}>← 花名册</button>
          <div className="mz-av" style={{ width: 44, height: 44, fontSize: 16, background: left ? 'var(--tx3)' : 'var(--ac)' }}>{initials(e.name)}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{e.name} <span className="mz-muted" style={{ fontSize: 12, fontWeight: 400 }}>{e.emp_no}</span></div>
            <div className="mz-sub" style={{ marginTop: 2 }}>
              <span className="mz-tag"><span className="mz-dot" style={{ background: left ? 'var(--tx3)' : 'var(--gn)' }} />{left ? '已离职' : '在职'}</span>
              {' · '}{e.position || '—'} · {e.primary_warehouse || '—'} · {e.grade} · €{e.hourly_rate ?? '—'}/h
              {e.join_date && ` · 入职 ${e.join_date}`}{e.leave_date && ` · 离职 ${e.leave_date}`}
            </div>
          </div>
        </div>
        <div className="mz-actions">
          <button className="mz-btn" onClick={() => setAction({ kind: 'upload' })}>上传文件</button>
          <button className="mz-btn mz-btn-p" onClick={() => setGen({})}>生成文书</button>
        </div>
      </div>

      <div className="mz-card" style={{ padding: 12 }}>
        <div className="mz-actions" style={{ gap: 6 }}>
          {[['contract', '签订合同'], ['salary', '调薪'], ['performance', '绩效评估'], ['leave', '请假'], ['warning', 'Abmahnung'], ['note', '备注'], ['termination', '离职']].map(([k, l]) => (
            <button key={k} className={`mz-btn mz-btn-s ${k === 'termination' || k === 'warning' ? 'mz-btn-d' : ''}`} disabled={left && k !== 'note'} onClick={() => setAction({ kind: k })}>{l}</button>
          ))}
        </div>
      </div>

      <div className="mz-grid mz-g4">
        <Stat label="当前合同" value={ac ? (CONTRACT[ac.contract_type] || ac.contract_type).split(' ')[0] : '无'} note={ac ? `${ac.start_date} → ${ac.end_date || '无固定期限'}` : '尚未签订生效合同'} warn={!ac && !left} />
        <Stat label="年假（今年）" value={`${ls.vacation_used} / ${ls.vacation_entitlement ?? '—'}`} note="已用 / 合同年假天数" />
        <Stat label="病假（今年）" value={`${ls.sick_days} 天`} note="已批准的病假工作日" />
        <Stat label="本月作业效率" value={d.performance_month?.efficiency != null ? `${d.performance_month.efficiency}%` : '—'} note={d.performance_month ? `综合 ${d.performance_month.score ?? '—'} · ${d.performance_month.grade}` : '本月暂无作业记录'} />
      </div>

      <div className="mz-card">
        <div className="tb" style={{ marginBottom: 16 }}>
          {[['timeline', `时间线 ${d.events.length}`], ['contracts', `合同 ${d.contracts.length}`], ['documents', `档案文件 ${d.documents.length}`], ['leaves', `请假 ${d.leaves.length}`], ['basic', '个人信息']].map(([k, l]) => (
            <button key={k} className={`tbn ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === 'timeline' && <Timeline events={d.events} docs={d.documents} token={token} />}
        {tab === 'contracts' && <Contracts contracts={d.contracts} onAmend={c => setAction({ kind: 'amend', contract: c })} onGenerate={c => setGen({ templateCode: 'AV_BEFRISTET', contractId: c.id })} />}
        {tab === 'documents' && <Documents docs={d.documents} token={token} onChange={load} />}
        {tab === 'leaves' && <Leaves leaves={d.leaves} token={token} onChange={load} />}
        {tab === 'basic' && <Basic emp={e} token={token} onSaved={load} />}
      </div>

      {action && <ActionDrawer action={action} emp={e} contract={ac} token={token} onClose={() => setAction(null)} onDone={after} />}
      {gen && <GenerateDrawer init={gen} emp={e} templates={templates} token={token} onClose={() => setGen(null)} onSaved={() => { setGen(null); load(); }} />}
    </div>
  );
}

function fileCategory(kind) {
  return { contract: 'contract', amend: 'amendment', salary: 'salary', performance: 'performance', leave: 'leave', warning: 'warning', termination: 'termination' }[kind] || 'other';
}

function Stat({ label, value, note, warn }) {
  return (
    <div className="mz-card">
      <div className="mz-kpi-l">{label}</div>
      <div className="mz-kpi-v" style={{ fontSize: 22, ...(warn ? { color: 'var(--og)' } : {}) }}>{value}</div>
      <div className="mz-kpi-n">{note}</div>
    </div>
  );
}

function Timeline({ events, docs, token }) {
  const showToast = useToast();
  const docById = Object.fromEntries(docs.map(x => [x.id, x]));
  if (!events.length) return <div className="mz-empty">暂无记录</div>;
  return (
    <div>
      {events.map(ev => {
        const [label, color] = EVENT[ev.event_type] || [ev.event_type, 'var(--tx3)'];
        const det = ev.details || {};
        const lines = [];
        if (det.reason) lines.push(`原因：${det.reason}`);
        if (det.summary) lines.push(det.summary);
        if (det.text) lines.push(det.text);
        if (det.description) lines.push(det.description);
        if (det.ops?.efficiency != null) lines.push(`作业效率 ${det.ops.efficiency}% · 质量 ${det.ops.quality_score} · ${det.ops.grade}`);
        if (det.changes) lines.push(Object.entries(det.changes).map(([k, v]) => `${k}: ${v.from ?? '—'} → ${v.to}`).join('；'));
        return (
          <div key={ev.id} className="mz-row" style={{ alignItems: 'flex-start' }}>
            <div className="mz-num mz-muted" style={{ width: 84, flexShrink: 0, paddingTop: 1 }}>{ev.event_date}</div>
            <span className="mz-tag" style={{ width: 74, flexShrink: 0 }}><span className="mz-dot" style={{ background: color }} />{label}</span>
            <div className="mz-grow">
              <div style={{ fontSize: 13 }}>{ev.title}</div>
              {lines.map((l, i) => <div key={i} className="mz-muted" style={{ marginTop: 2 }}>{l}</div>)}
              {ev.documents?.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  {ev.documents.map(x => (
                    <button key={x.id} className="mz-link" style={{ color: 'var(--ac2)' }}
                      onClick={() => openFile(`${P}/documents/${x.id}/file`, token).catch(e => showToast(e.message, 'err'))}>
                      📎 {x.title}{docById[x.id]?.source === 'generated' ? '（生成）' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mz-muted" style={{ flexShrink: 0 }}>{ev.created_by}</div>
          </div>
        );
      })}
    </div>
  );
}

function Contracts({ contracts, onAmend, onGenerate }) {
  if (!contracts.length) return <div className="mz-empty">暂无合同。点击上方「签订合同」录入，并可用模板直接生成合同文本。</div>;
  return (
    <div className="mz-scroll"><table className="mz-table">
      <thead><tr><th>编号</th><th>类型</th><th>期限</th><th>试用期至</th><th style={{ textAlign: 'right' }}>周工时</th><th style={{ textAlign: 'right' }}>时薪</th><th>岗位 / 地点</th><th>状态</th><th /></tr></thead>
      <tbody>{contracts.map(c => (
        <tr key={c.id} style={{ opacity: c.status === 'active' ? 1 : 0.6 }}>
          <td className="mz-num">{c.contract_no}{c.change_summary && <div className="mz-muted">{c.change_summary}</div>}</td>
          <td>{CONTRACT[c.contract_type] || c.contract_type}</td>
          <td className="mz-num">{c.start_date} → {c.end_date || '—'}</td>
          <td className="mz-num mz-muted">{c.probation_end || '—'}</td>
          <td className="mz-num" style={{ textAlign: 'right' }}>{c.weekly_hours}h</td>
          <td className="mz-num" style={{ textAlign: 'right' }}>€{c.hourly_rate}</td>
          <td>{c.position || '—'} · {c.warehouse_code || '—'}</td>
          <td><span className="mz-tag"><span className="mz-dot" style={{ background: c.status === 'active' ? 'var(--gn)' : 'var(--tx3)' }} />{CONTRACT_STATUS[c.status] || c.status}</span></td>
          <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
            {c.status === 'active' && <button className="mz-btn mz-btn-s" onClick={() => onAmend(c)}>修订</button>}{' '}
            <button className="mz-btn mz-btn-s" onClick={() => onGenerate(c)}>生成文本</button>
          </td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function Documents({ docs, token, onChange }) {
  const showToast = useToast();
  const [cat, setCat] = useState('');
  const cats = [...new Set(docs.map(x => x.category))];
  const list = docs.filter(x => !cat || x.category === cat);
  const del = async (x) => {
    if (!window.confirm(`从档案移除「${x.title}」？（文件仍保留以备审计）`)) return;
    try { await api(`${P}/documents/${x.id}`, { method: 'DELETE', token }); onChange(); } catch (e) { showToast(e.message, 'err'); }
  };
  if (!docs.length) return <div className="mz-empty">档案为空。可上传证件、合同扫描件等，或用模板生成文书。</div>;
  const soon = (v) => v && (new Date(v) - Date.now()) / 864e5 < 60;
  return (
    <div>
      <div className="mz-seg" style={{ marginBottom: 14 }}>
        <button className={!cat ? 'on' : ''} onClick={() => setCat('')}>全部<em>{docs.length}</em></button>
        {cats.map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{DOC_CAT[c] || c}<em>{docs.filter(x => x.category === c).length}</em></button>)}
      </div>
      <div className="mz-scroll"><table className="mz-table">
        <thead><tr><th>文件</th><th>类别</th><th>来源</th><th>有效期至</th><th>上传</th><th /></tr></thead>
        <tbody>{list.map(x => (
          <tr key={x.id}>
            <td><div>{x.title}</div><div className="mz-muted">{x.file?.filename} · {x.file ? sizeLabel(x.file.size) : ''}</div></td>
            <td>{DOC_CAT[x.category] || x.category}</td>
            <td className="mz-muted">{x.source === 'generated' ? '模板生成' : '上传'}</td>
            <td className="mz-num" style={{ color: soon(x.valid_until) ? 'var(--rd)' : undefined }}>{x.valid_until || '—'}</td>
            <td className="mz-muted">{String(x.created_at).slice(0, 10)} · {x.uploaded_by}</td>
            <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
              <button className="mz-btn mz-btn-s" onClick={() => openFile(`${P}/documents/${x.id}/file`, token).catch(e => showToast(e.message, 'err'))}>查看</button>{' '}
              <button className="mz-btn mz-btn-s" onClick={() => saveFile(`${P}/documents/${x.id}/file`, token, x.file?.filename || 'file').catch(e => showToast(e.message, 'err'))}>下载</button>{' '}
              <button className="mz-btn mz-btn-s mz-btn-d" onClick={() => del(x)}>移除</button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function Leaves({ leaves, token, onChange }) {
  const showToast = useToast();
  const set = async (l, status) => {
    try { await api(`${P}/leaves/${l.id}`, { method: 'PUT', body: { status }, token }); onChange(); } catch (e) { showToast(e.message, 'err'); }
  };
  if (!leaves.length) return <div className="mz-empty">暂无请假记录</div>;
  return (
    <div className="mz-scroll"><table className="mz-table">
      <thead><tr><th>类型</th><th>日期</th><th style={{ textAlign: 'right' }}>工作日</th><th>状态</th><th>病假证明</th><th>备注</th><th /></tr></thead>
      <tbody>{leaves.map(l => (
        <tr key={l.id}>
          <td>{LEAVE[l.leave_type] || l.leave_type}</td>
          <td className="mz-num">{l.start_date} → {l.end_date}</td>
          <td className="mz-num" style={{ textAlign: 'right' }}>{l.days}</td>
          <td><span className="mz-tag"><span className="mz-dot" style={{ background: l.status === 'approved' ? 'var(--gn)' : l.status === 'rejected' ? 'var(--rd)' : 'var(--og)' }} />{LEAVE_STATUS[l.status]}</span></td>
          <td className="mz-muted">{l.certificate_required ? '需要（>3 天）' : '—'}</td>
          <td className="mz-muted">{l.notes || ''}</td>
          <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
            {l.status !== 'approved' && <button className="mz-btn mz-btn-s" onClick={() => set(l, 'approved')}>批准</button>}{' '}
            {l.status !== 'rejected' && <button className="mz-btn mz-btn-s mz-btn-d" onClick={() => set(l, 'rejected')}>拒绝</button>}
          </td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

const BASIC_FIELDS = [
  ['name', '姓名'], ['phone', '电话'], ['email', '邮箱'], ['birth_date', '出生日期', 'date'], ['nationality', '国籍'],
  ['address', '住址（合同使用）'], ['id_type', '证件类型'], ['id_number', '证件号'], ['tax_id', '税号 Steuer-ID'],
  ['social_security_no', '社保号 SV-Nr.'], ['health_insurance', '医保 Krankenkasse'], ['iban', 'IBAN'],
  ['datev_pnr', 'DATEV 人员编号（工资系统）'],
  ['whatsapp', 'WhatsApp'], ['wechat', '微信'],
];

function Basic({ emp, token, onSaved }) {
  const showToast = useToast();
  const [f, setF] = useState(() => Object.fromEntries(BASIC_FIELDS.map(([k]) => [k, emp[k] || ''])));
  const save = async () => {
    try {
      const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v]));
      if (!body.name) { showToast('姓名不能为空', 'err'); return; }
      await api(`/api/v1/employees/${emp.id}`, { method: 'PUT', body, token });
      showToast('已保存'); onSaved();
    } catch (e) { showToast(e.message, 'err'); }
  };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {BASIC_FIELDS.map(([k, l, type]) => (
          <div key={k} className="mz-field"><label>{l}</label>
            <input className="mz-input" type={type || 'text'} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></div>
        ))}
      </div>
      <div style={{ marginTop: 16, textAlign: 'right' }}><button className="mz-btn mz-btn-p" onClick={save}>保存个人信息</button></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function ActionDrawer({ action, emp, contract, token, onClose, onDone }) {
  const showToast = useToast();
  const kind = action.kind;
  const defaults = {
    contract: { contract_type: 'befristet', position: emp.position || 'Lagerhelfer', warehouse_code: emp.primary_warehouse || '', start_date: today(), end_date: plusDays(today(), 364), weekly_hours: 40, hourly_rate: emp.hourly_rate || '', vacation_days: 24, notice_period: '4 Wochen zum 15. oder Monatsende', status: 'active' },
    amend: { effective_date: today(), change_summary: '', hourly_rate: '', weekly_hours: '', warehouse_code: '', position: '', end_date: '' },
    salary: { new_rate: emp.hourly_rate ? (emp.hourly_rate + 0.5).toFixed(2) : '', effective_date: today(), reason: '' },
    performance: { period_from: plusDays(today(), -90), period_to: today(), rating: 3, summary: '', strengths: '', improvements: '', goals: '', include_ops: true },
    leave: { leave_type: 'urlaub', start_date: today(), end_date: today(), status: 'approved', notes: '' },
    warning: { incident_date: today(), reason: '', description: '' },
    termination: { last_day: plusDays(today(), 28), termination_type: 'ordentlich', notice_date: today(), reason: '', deactivate_login: true },
    note: { title: '', text: '', event_date: today() },
    upload: { category: 'id_doc', title: '', valid_until: '', notes: '' },
  }[kind];
  const [f, setF] = useState(defaults);
  const [file, setFile] = useState(null);
  const [useTpl, setUseTpl] = useState(!!ACTION_TEMPLATE[kind]);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });
  const title = { contract: '签订劳动合同', amend: `修订合同 ${action.contract?.contract_no || ''}`, salary: '调薪', performance: '绩效评估', leave: '请假', warning: 'Abmahnung（书面警告）', termination: '办理离职', note: '添加备注', upload: '上传档案文件' }[kind];

  const submit = async () => {
    setBusy(true);
    try {
      const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      let res;
      if (kind === 'upload') {
        if (!file) throw new Error('请选择文件');
        res = await uploadDoc(token, emp.id, file, { ...clean, title: f.title || file.name });
        showToast('已存入档案'); onDone(kind, res, null, false); return;
      }
      const num = (k) => { if (clean[k] !== undefined) clean[k] = Number(clean[k]); };
      ['hourly_rate', 'weekly_hours', 'vacation_days', 'new_rate', 'rating'].forEach(num);
      const url = {
        contract: `${P}/employees/${emp.id}/contracts`, amend: `${P}/contracts/${action.contract?.id}/amend`,
        salary: `${P}/employees/${emp.id}/salary`, performance: `${P}/employees/${emp.id}/reviews`,
        leave: `${P}/employees/${emp.id}/leaves`, warning: `${P}/employees/${emp.id}/warnings`,
        termination: `${P}/employees/${emp.id}/terminate`, note: `${P}/employees/${emp.id}/notes`,
      }[kind];
      res = await api(url, { method: 'POST', body: clean, token });
      showToast('已保存' + (res.ops ? `（已带入作业绩效：效率 ${res.ops.efficiency ?? '—'}%）` : ''));
      onDone(kind, res, file, useTpl, prefillFor(kind, f, emp));
    } catch (e) { showToast(e.message, 'err'); }
    setBusy(false);
  };

  const F = (k, label, type = 'text', props = {}) => (
    <div className="mz-field"><label>{label}</label>
      {type === 'textarea'
        ? <textarea className="mz-input" style={{ height: 72, padding: 10 }} value={f[k]} onChange={e => set(k, e.target.value)} {...props} />
        : <input className="mz-input" type={type} step="any" value={f[k]} onChange={e => set(k, e.target.value)} {...props} />}
    </div>
  );
  const S = (k, label, options) => (
    <div className="mz-field"><label>{label}</label>
      <select className="mz-select" value={f[k]} onChange={e => set(k, e.target.value)}>
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select></div>
  );
  const two = (a, b) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{a}{b}</div>;

  return (
    <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mz-drawer">
        <div className="mz-drawer-h">
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div><div className="mz-muted" style={{ marginTop: 2 }}>{emp.name} · {emp.emp_no}</div></div>
          <button className="mz-link" style={{ fontSize: 18 }} onClick={onClose}>×</button>
        </div>
        <div className="mz-drawer-b">
          {kind === 'contract' && <>
            {two(S('contract_type', '合同类型', CONTRACT), S('status', '状态', { active: '生效（替换当前合同）', draft: '草稿' }))}
            {two(F('position', '岗位'), F('warehouse_code', '工作地点（仓库）'))}
            {two(F('start_date', '开始日期', 'date'), F('end_date', '结束日期（定期合同必填）', 'date'))}
            {two(F('hourly_rate', '时薪 €', 'number'), F('weekly_hours', '每周工时', 'number'))}
            {two(F('vacation_days', '年假天数', 'number'), F('probation_end', '试用期至（默认 6 个月）', 'date'))}
            {F('notice_period', '解约期')}
            {contract && <div className="mz-hint">保存为「生效」后，当前合同 {contract.contract_no} 将标记为已结束。</div>}
          </>}
          {kind === 'amend' && <>
            {F('change_summary', '修订内容摘要 *')}
            {F('effective_date', '生效日期', 'date')}
            <div className="mz-section">只填写需要变更的项</div>
            {two(F('hourly_rate', `时薪 €（现 ${action.contract.hourly_rate}）`, 'number'), F('weekly_hours', `每周工时（现 ${action.contract.weekly_hours}）`, 'number'))}
            {two(F('position', `岗位（现 ${action.contract.position || '—'}）`), F('warehouse_code', `地点（现 ${action.contract.warehouse_code || '—'}）`))}
            {F('end_date', `结束日期（现 ${action.contract.end_date || '无'}）`, 'date')}
          </>}
          {kind === 'salary' && <>
            {two(F('new_rate', `新时薪 €（现 ${emp.hourly_rate ?? '—'}）`, 'number'), F('effective_date', '生效日期', 'date'))}
            {F('reason', '调薪原因', 'textarea')}
          </>}
          {kind === 'performance' && <>
            {two(F('period_from', '评估期开始', 'date'), F('period_to', '评估期结束', 'date'))}
            <div className="mz-field"><label>评分</label>
              <div className="mz-seg">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={Number(f.rating) === n ? 'on' : ''} onClick={() => set('rating', n)}>{n}</button>)}</div>
              <span className="mz-hint">1 不合格 · 2 待改进 · 3 达标 · 4 良好 · 5 优秀</span></div>
            {F('summary', '总体评价', 'textarea')}
            {F('strengths', '优点', 'textarea')}
            {F('improvements', '待改进', 'textarea')}
            {F('goals', '下期目标', 'textarea')}
            <label className="mz-switch">自动带入该期间作业绩效（效率、质量、等级）<input type="checkbox" checked={f.include_ops} onChange={e => set('include_ops', e.target.checked)} /></label>
          </>}
          {kind === 'leave' && <>
            {two(S('leave_type', '请假类型', LEAVE), S('status', '状态', LEAVE_STATUS))}
            {two(F('start_date', '开始', 'date'), F('end_date', '结束', 'date'))}
            {F('days', '工作日天数（留空自动按周一至周五计算）', 'number')}
            {F('notes', '备注', 'textarea')}
            {['krank', 'kind_krank'].includes(f.leave_type) && <div className="mz-hint">病假超过 3 天需提交医生证明（AU-Bescheinigung），可在下方直接上传。</div>}
          </>}
          {kind === 'warning' && <>
            {F('incident_date', '违规日期', 'date')}
            {F('reason', '违规事由 *（如：无故缺勤、迟到、违反安全规定）')}
            {F('description', '具体经过（时间、地点、发生了什么）', 'textarea')}
            <div className="mz-hint">Abmahnung 须写明具体事实，并警示再犯将导致解雇。勾选下方选项可直接用模板生成正式信件。</div>
          </>}
          {kind === 'termination' && <>
            {S('termination_type', '离职类型', TERM)}
            {two(F('notice_date', '通知日期', 'date'), F('last_day', '最后工作日', 'date'))}
            {F('reason', '原因 / 备注', 'textarea')}
            <label className="mz-switch">最后工作日后停用打卡/登录账号<input type="checkbox" checked={f.deactivate_login} onChange={e => set('deactivate_login', e.target.checked)} /></label>
            <div className="mz-hint">解雇须书面原件并亲笔签名（§ 623 BGB），注意解约期与 Betriebsrat 听证。</div>
          </>}
          {kind === 'note' && <>{F('title', '标题 *')}{F('event_date', '日期', 'date')}{F('text', '内容', 'textarea')}</>}
          {kind === 'upload' && <>
            {S('category', '文件类别', DOC_CAT)}
            {F('title', '标题（默认用文件名）')}
            {F('valid_until', '有效期至（证件/签证，到期前 60 天提醒）', 'date')}
            {F('notes', '备注', 'textarea')}
          </>}

          {kind !== 'note' && (
            <div className="mz-field"><label>{kind === 'upload' ? '文件 *' : '附件（可选：签字扫描件、医生证明等）'}</label>
              <input className="mz-input" style={{ height: 'auto', padding: 8 }} type="file" onChange={e => setFile(e.target.files[0] || null)} />
              <span className="mz-hint">PDF、图片、Office 文档，单个最大 15 MB；文件存入该员工档案。</span></div>
          )}
          {ACTION_TEMPLATE[kind] && (
            <label className="mz-switch">保存后用模板生成正式文书<input type="checkbox" checked={useTpl} onChange={e => setUseTpl(e.target.checked)} /></label>
          )}
        </div>
        <div className="mz-drawer-f">
          <button className="mz-btn" onClick={onClose}>取消</button>
          <button className="mz-btn mz-btn-p" disabled={busy} onClick={submit}>{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
export function GenerateDrawer({ init, emp, templates, token, onClose, onSaved }) {
  const showToast = useToast();
  const active = templates.filter(t => t.is_active);
  const first = active.find(t => t.code === init.templateCode) || active[0];
  const [tplId, setTplId] = useState(first?.id || '');
  const [values, setValues] = useState(init.values || {});
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const tpl = active.find(t => t.id === Number(tplId));

  const body = (mode) => ({ employee_id: emp.id, contract_id: init.contractId, values, mode, event_id: init.eventId });
  useEffect(() => {
    if (!tpl) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api(`${P}/templates/${tpl.id}/render`, { method: 'POST', body: body('preview'), token }).then(setPreview).catch(e => showToast(e.message, 'err'));
    }, 300);
    return () => clearTimeout(timer.current);
  }, [tplId, JSON.stringify(values)]); // eslint-disable-line react-hooks/exhaustive-deps

  const manual = (preview?.fields || []).filter(x => !x.auto);
  const autoMissing = (preview?.fields || []).filter(x => x.auto && !x.value);

  const save = async () => {
    setBusy(true);
    try {
      await api(`${P}/templates/${tpl.id}/render`, { method: 'POST', body: body('save'), token });
      showToast('文书已生成并存入档案'); onSaved();
    } catch (e) { showToast(e.message, 'err'); }
    setBusy(false);
  };
  const download = () => saveFile(`${P}/templates/${tpl.id}/render`, token, `${tpl.code}_${emp.emp_no}.docx`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body('docx')),
  }).catch(e => showToast(e.message, 'err'));

  return (
    <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mz-drawer" style={{ width: 980 }}>
        <div className="mz-drawer-h">
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>生成文书</div><div className="mz-muted" style={{ marginTop: 2 }}>{emp.name} · {emp.emp_no}{init.eventId ? ' · 将关联到刚保存的记录' : ''}</div></div>
          <button className="mz-link" style={{ fontSize: 18 }} onClick={onClose}>×</button>
        </div>
        <div className="gen-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
          <div className="mz-drawer-b" style={{ borderRight: '1px solid var(--bd)' }}>
            <div className="mz-field"><label>模板</label>
              <select className="mz-select" value={tplId} onChange={e => { setTplId(e.target.value); setValues({}); }}>
                {active.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {tpl?.description && <span className="mz-hint">{tpl.description}</span>}
            </div>
            {manual.length > 0 && <div className="mz-section">需要填写</div>}
            {manual.map(x => (
              <div key={x.key} className="mz-field"><label>{x.label}{x.optional ? '' : ' *'}</label>
                <textarea className="mz-input" style={{ height: 'auto', minHeight: 34, padding: '7px 10px' }} rows={x.label.length > 30 ? 3 : 1}
                  value={values[x.key] || ''} onChange={e => setValues({ ...values, [x.key]: e.target.value })} /></div>
            ))}
            {autoMissing.length > 0 && <>
              <div className="mz-section">档案中缺少（可在此补填，或先完善个人信息 / 系统设置）</div>
              {autoMissing.map(x => (
                <div key={x.key} className="mz-field"><label>{x.label}</label>
                  <input className="mz-input" value={values[x.key] || ''} onChange={e => setValues({ ...values, [x.key]: e.target.value })} /></div>
              ))}
            </>}
            {preview && preview.missing.length === 0 && <div className="mz-hint" style={{ color: 'var(--gn)' }}>所有字段已填写，可以生成。</div>}
          </div>
          <div style={{ overflowY: 'auto', background: 'var(--bg3)', padding: 24 }}>
            <div className="doc-paper" dangerouslySetInnerHTML={{ __html: preview?.html || '' }} />
          </div>
        </div>
        <div className="mz-drawer-f">
          <span className="mz-muted" style={{ marginRight: 'auto' }}>{preview?.missing.length ? `还有 ${preview.missing.length} 个字段未填（预览中以 [方括号] 显示）` : ''}</span>
          <button className="mz-btn" onClick={download} disabled={!tpl}>下载 Word</button>
          <button className="mz-btn mz-btn-p" disabled={busy || !tpl || preview?.missing.length > 0} onClick={save}>生成并存入档案</button>
        </div>
      </div>
    </div>
  );
}
