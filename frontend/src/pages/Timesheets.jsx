import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export default function Timesheets({ token, user }) {
  const [ts, setTS] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({
    work_date: new Date().toISOString().slice(0,10),
    start_time: '08:00',
    end_time: '16:00',
    shift: '白班',
  });
  const [emps, setEmps] = useState([]);
  const { t } = useLang();
  const showToast = useToast();

  const canApproveWH = ['admin','wh','mgr'].includes(user?.role);
  const canApproveFin = ['admin','fin'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api(`/api/v1/timesheets?status=${encodeURIComponent(filterStatus)}`, { token })
      .then(setTS)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api('/api/v1/employees?status=active', { token }).then(setEmps);
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async (id) => {
    try {
      await api(`/api/v1/timesheets/${id}/approve`, { method:'PUT', token });
      load();
      showToast('审批成功');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const addTS = async () => {
    try {
      await api('/api/v1/timesheets', { method:'POST', body:form, token });
      setAddModal(false);
      load();
      showToast('工时已录入');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const batchApprove = async (ids) => {
    try {
      await api('/api/v1/timesheets/batch-approve', { method:'POST', body:{ ids }, token });
      load();
      showToast(`已批量审批 ${ids.length} 条`);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const pending = ts.filter(r => r.approval_status === 'wh_pending' || r.approval_status === 'fin_pending');

  const statusFilters = [
    ['', 'c.all'], ['draft','draft'], ['wh_pending','wh_pending'],
    ['fin_pending','fin_pending'], ['booked','booked'], ['rejected','rejected'],
  ];

  return (
    <div>
      <div className="ab">
        {statusFilters.map(([s, tk]) => (
          <button key={s} className={`fb ${filterStatus===s?'on':''}`} onClick={() => setFilterStatus(s)}>
            {s === '' ? t('c.all') : s}
          </button>
        ))}
        <div className="ml" style={{ display:'flex',gap:6 }}>
          {pending.length > 0 && canApproveWH && (
            <button className="b bgn" onClick={() => batchApprove(pending.map(r => r.id))}>
              {t('ts.batch')} ({pending.length})
            </button>
          )}
          <button className="b bga" onClick={() => setAddModal(true)}>{t('ts.add')}</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('ts.col_id')}</th><th>{t('ts.col_emp')}</th><th>{t('ts.col_grade')}</th>
            <th>{t('ts.col_wh')}</th><th>{t('ts.col_date')}</th><th>{t('ts.col_shift')}</th>
            <th>{t('ts.col_hrs')}</th><th>{t('ts.col_base')}</th><th>{t('ts.col_shift_b')}</th>
            <th>{t('ts.col_eff')}</th><th>{t('ts.col_brutto')}</th><th>{t('ts.col_perf')}</th>
            <th>{t('ts.col_net')}</th><th>{t('ts.col_status')}</th><th>{t('ts.col_action')}</th>
          </tr></thead>
          <tbody>{ts.map(row => (
            <tr key={row.id}>
              <td className="mn tm">{row.ts_no}</td>
              <td className="fw6">{row.emp_name}</td>
              <td style={{ color:'var(--pp)',fontWeight:600 }}>{row.biz_line||'—'}</td>
              <td>{row.warehouse_code}</td>
              <td>{row.work_date}</td>
              <td>
                <span style={{ color: row.settlement_type==='container'?'var(--pp)':row.settlement_type==='piece'?'var(--og)':'var(--tx3)', fontSize:10 }}>
                  {row.settlement_type||'hourly'}
                </span>
              </td>
              <td className="mn fw6">{row.hours}h</td>
              <td className="mn tm">€{(row.base_rate||0).toFixed(2)}</td>
              <td className="mn" style={{ color: row.amount_bonus>0?'var(--og)':'var(--tx3)' }}>+€{(row.amount_bonus||0).toFixed(2)}</td>
              <td className="mn fw6" style={{ color:'var(--ac2)' }}>€{(row.amount_hourly||0).toFixed(2)}</td>
              <td className="mn">€{(row.amount_total||0).toFixed(2)}</td>
              <td className="mn" style={{ color: row.amount_kpi>0?'var(--gn)':'var(--tx3)' }}>+€{(row.amount_kpi||0).toFixed(2)}</td>
              <td className="mn gn">€{(row.amount_total||0).toFixed(2)}</td>
              <td><StatusBadge value={row.approval_status} /></td>
              <td>
                {row.approval_status === 'wh_pending' && canApproveWH
                  ? <button className="b bgn" style={{ fontSize:9 }} onClick={() => approve(row.id)}>{t('ts.wh_approve')}</button>
                  : row.approval_status === 'fin_pending' && canApproveFin
                  ? <button className="b bga" style={{ fontSize:9 }} onClick={() => approve(row.id)}>{t('ts.fin_approve')}</button>
                  : <span className="tm" style={{ fontSize:9 }}>—</span>
                }
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}

      {addModal && (
        <Modal title={t('ts.add_title')} onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={addTS}>{t('c.submit')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">{t('ts.f_emp')}</label>
              <select className="fsl" value={form.employee_id||''} onChange={e => setForm({...form,employee_id:e.target.value})}>
                <option value="">—选择员工—</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.name}（{e.id}）</option>)}
              </select></div>
            <div className="fg"><label className="fl">{t('ts.f_date')}</label>
              <input className="fi" type="date" value={form.work_date}
                onChange={e => setForm({...form,work_date:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ts.f_start')}</label>
              <input className="fi" type="time" value={form.start_time}
                onChange={e => setForm({...form,start_time:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ts.f_end')}</label>
              <input className="fi" type="time" value={form.end_time}
                onChange={e => setForm({...form,end_time:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ts.f_wh')}</label>
              <input className="fi" value={form.warehouse_code||''}
                onChange={e => setForm({...form,warehouse_code:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ts.f_shift')}</label>
              <select className="fsl" value={form.shift||'白班'} onChange={e => setForm({...form,shift:e.target.value})}>
                <option>白班</option><option>夜班</option><option>周末</option><option>节假日</option>
              </select></div>
            <div className="fg"><label className="fl">{t('ts.f_notes')}</label>
              <input className="fi" value={form.notes||''}
                onChange={e => setForm({...form,notes:e.target.value})} /></div>
          </div>
          <div className="alert alert-ac" style={{ marginTop:10 }}>{t('ts.auto_calc')}</div>
        </Modal>
      )}
    </div>
  );
}
