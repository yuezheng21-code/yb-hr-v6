import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

function parseWorkerCount(worker_ids) {
  if (!worker_ids) return 0;
  try { return JSON.parse(worker_ids).length; } catch { return 0; }
}

function computeHours(start, end) {
  if (!start || !end) return null;
  const startParts = start.split(':').map(Number);
  const endParts = end.split(':').map(Number);
  if (startParts.length < 2 || endParts.length < 2) return null;
  const [sh, sm] = startParts;
  const [eh, em] = endParts;
  if ([sh, sm, eh, em].some(isNaN)) return null;
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(1));
}

export default function Containers({ token, user }) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [splitResult, setSplitResult] = useState(null);
  const [form, setForm] = useState({
    container_no: '', container_type: '20GP', load_type: 'unload',
    work_date: new Date().toISOString().slice(0, 10),
    start_time: '08:00', seal_no: '', client_revenue: '',
    group_pay: '', notes: '', worker_ids: [],
    warehouse_code: '',
  });
  const [completeForm, setCompleteForm] = useState({ end_time: '', video_recorded: true });
  const [emps, setEmps] = useState([]);
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin', 'hr', 'wh', 'mgr'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api('/api/v1/containers', { token }).then(setContainers).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api('/api/v1/employees?status=active', { token }).then(setEmps);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addContainer = async () => {
    if (!form.container_no) { showToast('请填写柜号', 'err'); return; }
    if (!form.warehouse_code) { showToast('请填写仓库', 'err'); return; }
    try {
      const payload = {
        ...form,
        worker_ids: JSON.stringify(form.worker_ids),
        client_revenue: parseFloat(form.client_revenue) || 0,
        group_pay: parseFloat(form.group_pay) || 0,
      };
      await api('/api/v1/containers', { method: 'POST', body: payload, token });
      setAddModal(false);
      load();
      showToast('卸柜记录已创建');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const completeContainer = async () => {
    if (!completeForm.end_time) { showToast('请填写结束时间', 'err'); return; }
    try {
      await api(`/api/v1/containers/${completeModal}/approve`, {
        method: 'PUT', body: completeForm, token,
      });
      setCompleteModal(null);
      load();
      showToast('已标记完成');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const splitContainer = async (id) => {
    try {
      const res = await api(`/api/v1/containers/${id}/split`, { method: 'POST', token });
      setSplitResult(res);
      load();
      showToast(`已拆分 ${res.created_timesheets} 条工时记录`);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const toggleWorker = (id) => {
    const ids = form.worker_ids.includes(id)
      ? form.worker_ids.filter(w => w !== id)
      : [...form.worker_ids, id];
    setForm({ ...form, worker_ids: ids });
  };

  return (
    <div>
      <div className="ab">
        <div className="ml">
          {canEdit && <button className="b bga" onClick={() => setAddModal(true)}>{t('ct.add')}</button>}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('ct.col_no')}</th><th>{t('ct.col_type')}</th><th>装/卸</th>
            <th>{t('ct.col_wh')}</th><th>{t('ct.col_date')}</th>
            <th>{t('ct.col_start')}</th><th>{t('ct.col_end')}</th>
            <th>{t('ct.col_hrs')}</th><th>{t('ct.col_workers')}</th>
            <th>客收(€)</th><th>{t('ct.col_video')}</th>
            <th>{t('ct.col_status')}</th><th></th>
          </tr></thead>
          <tbody>{containers.map(c => (
            <tr key={c.id}>
              <td className="fw6">{c.container_no}</td>
              <td>{c.container_type}</td>
              <td style={{ fontSize: 10, color: c.load_type === 'load' ? 'var(--gn)' : 'var(--og)' }}>
                {c.load_type === 'load' ? '装' : '卸'}
              </td>
              <td>{c.warehouse_code}</td>
              <td>{c.work_date}</td>
              <td>{c.start_time || '—'}</td>
              <td>{c.end_time || '—'}</td>
              <td className="mn">{computeHours(c.start_time, c.end_time) ? computeHours(c.start_time, c.end_time) + 'h' : '—'}</td>
              <td className="mn">{parseWorkerCount(c.worker_ids)}</td>
              <td className="mn">€{(c.client_revenue || 0).toFixed(0)}</td>
              <td>{c.video_recorded ? '✅' : '—'}</td>
              <td><StatusBadge value={c.approval_status} /></td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  {c.approval_status === 'pending' && canEdit && (
                    <button className="b bgn" style={{ fontSize: 9 }}
                      onClick={() => { setCompleteModal(c.id); setCompleteForm({ end_time: '', video_recorded: true }); }}>
                      {t('ct.complete')}
                    </button>
                  )}
                  {c.approval_status === 'wh_approved' && canEdit && !c.is_split_to_timesheet && (
                    <button className="b bga" style={{ fontSize: 9 }} onClick={() => splitContainer(c.id)}>
                      拆分
                    </button>
                  )}
                  {c.is_split_to_timesheet && (
                    <span style={{ fontSize: 9, color: 'var(--gn)' }}>✓ 已拆分</span>
                  )}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}

      {/* Add modal */}
      {addModal && (
        <Modal title={t('ct.add_title')} onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={addContainer}>{t('c.submit')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">{t('ct.f_no')}</label>
              <input className="fi" value={form.container_no} onChange={e => setForm({ ...form, container_no: e.target.value })} autoFocus />
            </div>
            <div className="fg"><label className="fl">{t('ct.f_type')}</label>
              <select className="fsl" value={form.container_type} onChange={e => setForm({ ...form, container_type: e.target.value })}>
                {['20GP', '40GP', '40HC', '45HC', 'LKW'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">装/卸</label>
              <select className="fsl" value={form.load_type} onChange={e => setForm({ ...form, load_type: e.target.value })}>
                <option value="load">装柜 (Load)</option>
                <option value="unload">卸柜 (Unload)</option>
              </select>
            </div>
            <div className="fg"><label className="fl">仓库代码</label>
              <input className="fi" value={form.warehouse_code} onChange={e => setForm({ ...form, warehouse_code: e.target.value })} placeholder="UNA / DHL / ..." />
            </div>
            <div className="fg"><label className="fl">{t('ct.f_date')}</label>
              <input className="fi" type="date" value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">{t('ct.f_seal')}</label>
              <input className="fi" value={form.seal_no} onChange={e => setForm({ ...form, seal_no: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">{t('ct.f_start')}</label>
              <input className="fi" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">{t('ct.f_revenue')}</label>
              <input className="fi" type="number" step="0.01" value={form.client_revenue}
                onChange={e => setForm({ ...form, client_revenue: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">组薪(€)</label>
              <input className="fi" type="number" step="0.01" value={form.group_pay}
                onChange={e => setForm({ ...form, group_pay: e.target.value })} />
            </div>
            <div className="fg ful">
              <label className="fl">{t('ct.f_workers')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {emps.map(e => (
                  <label key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer',
                    padding: '3px 8px', borderRadius: 6, border: '1px solid var(--bd)',
                    background: form.worker_ids.includes(e.id) ? 'var(--ac)20' : 'var(--bg3)',
                    color: form.worker_ids.includes(e.id) ? 'var(--ac2)' : 'var(--tx3)',
                  }}>
                    <input type="checkbox" style={{ display: 'none' }}
                      checked={form.worker_ids.includes(e.id)}
                      onChange={() => toggleWorker(e.id)} />
                    {e.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="fg ful"><label className="fl">{t('ct.f_notes')}</label>
              <textarea className="fta" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {/* Complete modal */}
      {completeModal && (
        <Modal title={t('ct.complete_title')} onClose={() => setCompleteModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setCompleteModal(null)}>{t('c.cancel')}</button>
            <button className="b bgn" onClick={completeContainer}>{t('ct.complete_btn')}</button>
          </>}
        >
          <div className="fg" style={{ marginBottom: 12 }}>
            <label className="fl">{t('ct.complete_end')}</label>
            <input className="fi" type="time" value={completeForm.end_time}
              onChange={e => setCompleteForm({ ...completeForm, end_time: e.target.value })} autoFocus />
          </div>
          <div className="alert alert-ac">{t('ct.complete_hint')}</div>
        </Modal>
      )}

      {/* Split result modal */}
      {splitResult && (
        <Modal title="拆分结果" onClose={() => setSplitResult(null)}
          footer={<button className="b bga" onClick={() => setSplitResult(null)}>{t('c.close')}</button>}
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>已成功拆分 {splitResult.created_timesheets} 条工时记录</div>
            {splitResult.ts_nos?.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                {splitResult.ts_nos.join(' · ')}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
