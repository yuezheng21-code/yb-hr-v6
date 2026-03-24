import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export default function Containers({ token, user }) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [form, setForm] = useState({
    container_no: '', container_type: '20GP', work_date: new Date().toISOString().slice(0,10),
    start_time: '08:00', seal_no: '', client_revenue: '', notes: '', worker_ids: [],
  });
  const [completeForm, setCompleteForm] = useState({ end_time: '', video_recorded: true });
  const [emps, setEmps] = useState([]);
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','hr','wh','mgr'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api('/api/containers', { token }).then(setContainers).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api('/api/employees?status=在职', { token }).then(setEmps);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addContainer = async () => {
    if (!form.container_no) { showToast('请填写柜号', 'err'); return; }
    try {
      await api('/api/containers', { method:'POST', body:form, token });
      setAddModal(false); load(); showToast('卸柜记录已创建');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const completeContainer = async () => {
    try {
      await api(`/api/containers/${completeModal}/complete`, {
        method:'PUT', body:completeForm, token,
      });
      setCompleteModal(null); load(); showToast('已标记完成');
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
            <th>{t('ct.col_no')}</th><th>{t('ct.col_type')}</th><th>{t('ct.col_wh')}</th>
            <th>{t('ct.col_date')}</th><th>{t('ct.col_start')}</th><th>{t('ct.col_end')}</th>
            <th>{t('ct.col_hrs')}</th><th>{t('ct.col_workers')}</th>
            <th>{t('ct.col_video')}</th><th>{t('ct.col_status')}</th><th></th>
          </tr></thead>
          <tbody>{containers.map(c => (
            <tr key={c.id}>
              <td className="fw6">{c.container_no}</td>
              <td>{c.container_type}</td>
              <td>{c.warehouse_code}</td>
              <td>{c.work_date}</td>
              <td>{c.start_time}</td>
              <td>{c.end_time || '—'}</td>
              <td className="mn">{c.total_hours ? c.total_hours+'h' : '—'}</td>
              <td className="mn">{c.worker_count || 0}</td>
              <td>{c.video_recorded ? '✅' : '—'}</td>
              <td><StatusBadge value={c.status} /></td>
              <td>
                {c.status === '进行中' && canEdit && (
                  <button className="b bgn" style={{ fontSize:9 }}
                    onClick={() => { setCompleteModal(c.id); setCompleteForm({ end_time:'', video_recorded:true }); }}>
                    {t('ct.complete')}
                  </button>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}

      {addModal && (
        <Modal title={t('ct.add_title')} onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={addContainer}>{t('c.submit')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">{t('ct.f_no')}</label>
              <input className="fi" value={form.container_no} onChange={e => setForm({...form,container_no:e.target.value})} autoFocus /></div>
            <div className="fg"><label className="fl">{t('ct.f_type')}</label>
              <select className="fsl" value={form.container_type} onChange={e => setForm({...form,container_type:e.target.value})}>
                {['20GP','40GP','40HC','45HC'].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div className="fg"><label className="fl">{t('ct.f_date')}</label>
              <input className="fi" type="date" value={form.work_date} onChange={e => setForm({...form,work_date:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ct.f_seal')}</label>
              <input className="fi" value={form.seal_no} onChange={e => setForm({...form,seal_no:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ct.f_start')}</label>
              <input className="fi" type="time" value={form.start_time} onChange={e => setForm({...form,start_time:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('ct.f_revenue')}</label>
              <input className="fi" type="number" step="0.01" value={form.client_revenue}
                onChange={e => setForm({...form,client_revenue:e.target.value})} /></div>
            <div className="fg ful">
              <label className="fl">{t('ct.f_workers')}</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:4 }}>
                {emps.map(e => (
                  <label key={e.id} style={{ display:'flex',alignItems:'center',gap:4,fontSize:11,cursor:'pointer',
                    padding:'3px 8px',borderRadius:6,border:'1px solid var(--bd)',
                    background: form.worker_ids.includes(e.id)?'var(--ac)20':'var(--bg3)',
                    color: form.worker_ids.includes(e.id)?'var(--ac2)':'var(--tx3)' }}>
                    <input type="checkbox" style={{ display:'none' }}
                      checked={form.worker_ids.includes(e.id)}
                      onChange={() => toggleWorker(e.id)} />
                    {e.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="fg ful"><label className="fl">{t('ct.f_notes')}</label>
              <textarea className="fta" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} /></div>
          </div>
        </Modal>
      )}

      {completeModal && (
        <Modal title={t('ct.complete_title')} onClose={() => setCompleteModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setCompleteModal(null)}>{t('c.cancel')}</button>
            <button className="b bgn" onClick={completeContainer}>{t('ct.complete_btn')}</button>
          </>}
        >
          <div className="fg" style={{ marginBottom:12 }}>
            <label className="fl">{t('ct.complete_end')}</label>
            <input className="fi" type="time" value={completeForm.end_time}
              onChange={e => setCompleteForm({...completeForm,end_time:e.target.value})} autoFocus />
          </div>
          <div className="alert alert-ac">{t('ct.complete_hint')}</div>
        </Modal>
      )}
    </div>
  );
}
