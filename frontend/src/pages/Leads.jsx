import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { useListTools, ListToolbar } from '../components/ListTools.jsx';

const STATUS = {
  new: ['新线索', 'var(--ac)'], contacted: ['已联系', 'var(--og)'], quoting: ['报价中', 'var(--pp)'], quoted: ['已报价', 'var(--pp)'],
  won: ['成交', 'var(--gn)'], lost: ['流失', 'var(--tx3)'], spam: ['无效', 'var(--tx3)'],
};

export default function Leads({ token, user }) {
  const showToast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [sel, setSel] = useState(null);
  const canWrite = ['admin', 'hr', 'mgr'].includes(user?.role);
  const base = (data?.items || []).filter(x => (filter ? x.status === filter : x.status !== 'spam'));
  const lt = useListTools(base, { date: 'created_at' }, token);
  const COLS = [
    { label: '编号', value: 'lead_no' }, { label: '公司', value: 'company' }, { label: '联系人', value: 'contact_name' }, { label: '邮箱', value: 'email' },
    { label: '电话', value: 'phone' }, { label: '服务', value: l => (l.service_labels || []).join('、') }, { label: '地点', value: 'location' },
    { label: '人数', value: 'headcount', type: 'int', sum: true }, { label: '业务量', value: 'volume' }, { label: '开始', value: 'start_date', type: 'date' },
    { label: '期限', value: 'duration' }, { label: '状态', value: l => STATUS[l.status]?.[0] || l.status }, { label: '负责人', value: 'assigned_to' },
    { label: '提交时间', value: l => String(l.created_at).slice(0, 16).replace('T', ' ') }, { label: '需求说明', value: 'message' },
  ];

  const load = () => api('/api/v1/leads', { token }).then(d => {
    setData(d);
    if (sel) setSel(d.items.find(x => x.id === sel.id) || null);
  }).catch(e => showToast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <Loading />;
  const items = lt.rows;
  const open = (data.counts.new || 0);

  return (
    <div className="mz">
      <div className="mz-head">
        <div><div className="mz-title">客户线索</div>
          <div className="mz-sub">官网「企业合作」表单提交的需求。跟进 → 生成报价单 → 成交。{open > 0 && <span style={{ color: 'var(--ac2)' }}> {open} 条新线索待跟进</span>}</div></div>
        <div className="mz-actions"><button className="mz-btn" onClick={() => window.open('/site', '_blank')}>查看官网</button></div>
      </div>

      <div className="mz-seg">
        <button className={!filter ? 'on' : ''} onClick={() => setFilter('')}>全部<em>{data.items.filter(x => x.status !== 'spam').length}</em></button>
        {data.statuses.map(s => <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{STATUS[s][0]}<em>{data.counts[s] || 0}</em></button>)}
      </div>

      <ListToolbar lt={lt} title="客户线索" columns={COLS} token={token} dateLabel="提交日期" />
      <div className="mz-card" style={{ padding: 0 }}>
        {items.length === 0 ? <div className="mz-empty">暂无线索。客户在官网首页「企业合作」提交需求后会出现在这里。</div> : (
          <div className="mz-scroll"><table className="mz-table">
            <thead><tr><th>编号</th><th>公司 / 联系人</th><th>服务</th><th>地点</th><th style={{ textAlign: 'right' }}>人数</th><th>开始</th><th>状态</th><th>提交时间</th></tr></thead>
            <tbody>{items.map(l => (
              <tr key={l.id} onClick={() => setSel(l)} style={{ cursor: 'pointer' }}>
                <td className="mz-num mz-muted">{l.lead_no}</td>
                <td><div style={{ fontWeight: 500 }}>{l.company}</div><div className="mz-muted">{l.contact_name} · {l.email}</div></td>
                <td style={{ maxWidth: 260 }}>{l.service_labels.map(s => s.split(' ')[0]).join('、') || '—'}</td>
                <td>{l.location || '—'}</td>
                <td className="mz-num" style={{ textAlign: 'right' }}>{l.headcount ?? '—'}</td>
                <td className="mz-num">{l.start_date || '—'}</td>
                <td><span className="mz-tag"><span className="mz-dot" style={{ background: STATUS[l.status]?.[1] }} />{STATUS[l.status]?.[0] || l.status}</span></td>
                <td className="mz-num mz-muted">{String(l.created_at).slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {sel && <LeadDrawer lead={sel} statuses={data.statuses} canWrite={canWrite} token={token}
        onClose={() => setSel(null)} onChange={load} goQuote={() => navigate('/quotations')} />}
    </div>
  );
}

function LeadDrawer({ lead, statuses, canWrite, token, onClose, onChange, goQuote }) {
  const showToast = useToast();
  const [notes, setNotes] = useState(lead.notes || '');
  const [assigned, setAssigned] = useState(lead.assigned_to || '');
  useEffect(() => { setNotes(lead.notes || ''); setAssigned(lead.assigned_to || ''); }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (body) => {
    try { await api(`/api/v1/leads/${lead.id}`, { method: 'PUT', body, token }); showToast('已更新'); onChange(); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const quote = async () => {
    try {
      const r = await api(`/api/v1/leads/${lead.id}/quote`, { method: 'POST', token });
      showToast(`已生成报价单 ${r.quote_no}，请在「工程报价」中测算并定价`); onChange(); goQuote();
    } catch (e) { showToast(e.message, 'err'); }
  };
  const rows = [
    ['联系人', lead.contact_name], ['邮箱', <a key="m" href={`mailto:${lead.email}`} style={{ color: 'var(--ac2)' }}>{lead.email}</a>],
    ['电话', lead.phone ? <a key="t" href={`tel:${lead.phone}`} style={{ color: 'var(--ac2)' }}>{lead.phone}</a> : '—'],
    ['地点', lead.location], ['服务', lead.service_labels.join('、')], ['人数', lead.headcount], ['业务量', lead.volume],
    ['开始', lead.start_date], ['期限', lead.duration], ['班次', lead.shifts], ['语言', lead.language],
  ];
  return (
    <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mz-drawer" style={{ width: 520 }}>
        <div className="mz-drawer-h">
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>{lead.company}</div><div className="mz-muted" style={{ marginTop: 2 }}>{lead.lead_no} · {String(lead.created_at).slice(0, 16).replace('T', ' ')}</div></div>
          <button className="mz-link" style={{ fontSize: 18 }} onClick={onClose}>×</button>
        </div>
        <div className="mz-drawer-b">
          <div>{rows.map(([k, v]) => (
            <div key={k} className="mz-row" style={{ padding: '7px 0' }}><span className="mz-muted" style={{ width: 70, flexShrink: 0 }}>{k}</span><span className="mz-grow">{v || '—'}</span></div>
          ))}</div>
          {lead.message && <div><div className="mz-section">需求说明</div><div style={{ whiteSpace: 'pre-wrap', marginTop: 6, fontSize: 13 }}>{lead.message}</div></div>}
          {canWrite && <>
            <div className="mz-field"><label>状态</label>
              <div className="mz-seg">{statuses.map(s => <button key={s} className={lead.status === s ? 'on' : ''} onClick={() => update({ status: s })}>{STATUS[s][0]}</button>)}</div></div>
            <div className="mz-field"><label>负责人</label>
              <input className="mz-input" value={assigned} onChange={e => setAssigned(e.target.value)} onBlur={() => assigned !== (lead.assigned_to || '') && update({ assigned_to: assigned })} /></div>
            <div className="mz-field"><label>跟进记录（内部）</label>
              <textarea className="mz-input" style={{ height: 120, padding: 10 }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </>}
        </div>
        {canWrite && (
          <div className="mz-drawer-f">
            <button className="mz-btn" disabled={notes === (lead.notes || '')} onClick={() => update({ notes })}>保存记录</button>
            {lead.quotation_id
              ? <button className="mz-btn mz-btn-p" onClick={goQuote}>查看报价单</button>
              : <button className="mz-btn mz-btn-p" onClick={quote}>生成报价单</button>}
          </div>
        )}
      </div>
    </div>
  );
}
