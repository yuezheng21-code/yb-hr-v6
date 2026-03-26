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
  const [rejectModal, setRejectModal] = useState(null); // ts_id
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({
    work_date: new Date().toISOString().slice(0, 10),
    start_time: '08:00',
    end_time: '16:00',
    warehouse_code: '',
    employee_id: '',
    settlement_type: 'hourly',
    notes: '',
  });
  const [emps, setEmps] = useState([]);
  const { t } = useLang();
  const showToast = useToast();

  const canApproveWH = ['admin', 'wh', 'mgr'].includes(user?.role);
  const canApproveFin = ['admin', 'fin'].includes(user?.role);
  const canCreate = ['admin', 'hr', 'wh', 'mgr'].includes(user?.role);

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

  const submit = async (id) => {
    try {
      await api(`/api/v1/timesheets/${id}/submit`, { method: 'PUT', token });
      load();
      showToast('已提交审批');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const approve = async (id) => {
    try {
      await api(`/api/v1/timesheets/${id}/approve`, { method: 'PUT', token });
      load();
      showToast('审批成功');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { showToast('请填写拒绝原因', 'err'); return; }
    try {
      await api(`/api/v1/timesheets/${rejectModal}/reject`, { method: 'PUT', body: { reason: rejectReason }, token });
      setRejectModal(null);
      setRejectReason('');
      load();
      showToast('已拒绝');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const addTS = async () => {
    if (!form.employee_id) { showToast('请选择员工', 'err'); return; }
    if (!form.warehouse_code) { showToast('请填写仓库', 'err'); return; }
    try {
      await api('/api/v1/timesheets', { method: 'POST', body: form, token });
      setAddModal(false);
      load();
      showToast('工时已录入');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const batchApprove = async () => {
    const pending = ts.filter(r =>
      (r.approval_status === 'wh_pending' && canApproveWH) ||
      (r.approval_status === 'fin_pending' && canApproveFin)
    );
    if (!pending.length) return;
    try {
      await api('/api/v1/timesheets/batch-approve', { method: 'POST', body: { ids: pending.map(r => r.id) }, token });
      load();
      showToast(`已批量审批 ${pending.length} 条`);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const pendingCount = ts.filter(r =>
    (r.approval_status === 'wh_pending' && canApproveWH) ||
    (r.approval_status === 'fin_pending' && canApproveFin)
  ).length;

  const statusFilters = [
    ['', 'c.all'], ['draft', 'ts.status_draft'], ['wh_pending', 'ts.status_wh_pending'],
    ['fin_pending', 'ts.status_fin_pending'], ['booked', 'ts.status_booked'], ['rejected', 'ts.status_rejected'],
  ];

  return (
    <div>
      <div className="ab">
        {statusFilters.map(([s, labelKey]) => (
          <button key={s} className={`fb ${filterStatus === s ? 'on' : ''}`} onClick={() => setFilterStatus(s)}>
            {t(labelKey)}
          </button>
        ))}
        <div className="ml" style={{ display: 'flex', gap: 6 }}>
          {pendingCount > 0 && (
            <button className="b bgn" onClick={batchApprove}>
              {t('ts.batch')} ({pendingCount})
            </button>
          )}
          {canCreate && (
            <button className="b bga" onClick={() => setAddModal(true)}>{t('ts.add')}</button>
          )}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('ts.col_id')}</th><th>{t('ts.col_emp')}</th><th>{t('ts.col_grade')}</th>
            <th>{t('ts.col_wh')}</th><th>{t('ts.col_date')}</th><th>{t('ts.col_shift')}</th>
            <th>{t('ts.col_hrs')}</th><th>{t('ts.col_base')}</th><th>{t('ts.col_shift_b')}</th>
            <th>{t('ts.col_brutto')}</th><th>{t('ts.col_status')}</th><th>{t('ts.col_action')}</th>
          </tr></thead>
          <tbody>{ts.map(row => (
            <tr key={row.id}>
              <td className="mn tm">{row.ts_no}</td>
              <td className="fw6">{row.emp_name}</td>
              <td style={{ color: 'var(--pp)', fontWeight: 600 }}>{row.emp_grade || row.biz_line || '—'}</td>
              <td>{row.warehouse_code}</td>
              <td>{row.work_date}</td>
              <td>
                <span style={{ color: row.settlement_type === 'container' ? 'var(--pp)' : row.settlement_type === 'piece' ? 'var(--og)' : 'var(--tx3)', fontSize: 10 }}>
                  {row.settlement_type || 'hourly'}
                </span>
              </td>
              <td className="mn fw6">{row.hours}h</td>
              <td className="mn tm">€{(row.base_rate || 0).toFixed(2)}</td>
              <td className="mn" style={{ color: row.amount_bonus > 0 ? 'var(--og)' : 'var(--tx3)' }}>
                {row.amount_bonus > 0 ? `+€${row.amount_bonus.toFixed(2)}` : '—'}
              </td>
              <td className="mn fw6 gn">€{(row.amount_total || 0).toFixed(2)}</td>
              <td><StatusBadge value={row.approval_status} /></td>
              <td>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                  {row.approval_status === 'draft' && canApproveWH && (
                    <button className="b bgn" style={{ fontSize: 9 }} onClick={() => submit(row.id)}>提交</button>
                  )}
                  {row.approval_status === 'wh_pending' && canApproveWH && (
                    <>
                      <button className="b bgn" style={{ fontSize: 9 }} onClick={() => approve(row.id)}>{t('ts.wh_approve')}</button>
                      <button className="b bgr" style={{ fontSize: 9 }} onClick={() => { setRejectModal(row.id); setRejectReason(''); }}>✗</button>
                    </>
                  )}
                  {row.approval_status === 'fin_pending' && canApproveFin && (
                    <>
                      <button className="b bga" style={{ fontSize: 9 }} onClick={() => approve(row.id)}>{t('ts.fin_approve')}</button>
                      <button className="b bgr" style={{ fontSize: 9 }} onClick={() => { setRejectModal(row.id); setRejectReason(''); }}>✗</button>
                    </>
                  )}
                  {!['draft', 'wh_pending', 'fin_pending'].includes(row.approval_status) && (
                    <span className="tm" style={{ fontSize: 9 }}>—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}

      {/* Add modal */}
      {addModal && (
        <Modal title={t('ts.add_title')} onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={addTS}>{t('c.submit')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">{t('ts.f_emp')}</label>
              <select className="fsl" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value ? +e.target.value : '' })}>
                <option value="">—选择员工—</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.name}（{e.emp_no || e.id}）</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">{t('ts.f_date')}</label>
              <input className="fi" type="date" value={form.work_date}
                onChange={e => setForm({ ...form, work_date: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">{t('ts.f_start')}</label>
              <input className="fi" type="time" value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">{t('ts.f_end')}</label>
              <input className="fi" type="time" value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">{t('ts.f_wh')}</label>
              <input className="fi" value={form.warehouse_code}
                onChange={e => setForm({ ...form, warehouse_code: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">结算方式</label>
              <select className="fsl" value={form.settlement_type} onChange={e => setForm({ ...form, settlement_type: e.target.value })}>
                <option value="hourly">按小时 (Hourly)</option>
                <option value="piece">按件 (Piece)</option>
                <option value="hourly_kpi">小时+KPI</option>
                <option value="container">集装箱</option>
              </select>
            </div>
            <div className="fg"><label className="fl">{t('ts.f_notes')}</label>
              <input className="fi" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="alert alert-ac" style={{ marginTop: 10 }}>{t('ts.auto_calc')}</div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <Modal title="拒绝工时记录" onClose={() => setRejectModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setRejectModal(null)}>{t('c.cancel')}</button>
            <button className="b bgr" onClick={reject}>确认拒绝</button>
          </>}
        >
          <div className="fg">
            <label className="fl">拒绝原因 <span style={{ color: 'var(--rd)' }}>*</span></label>
            <textarea className="fta" rows={3} value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="请填写拒绝原因..." autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}
