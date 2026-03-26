import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge, fmt } from '../components/StatusBadge.jsx';

const GRADES = ['P1','P2','P3','P4','P5','P6','P7','P8','P9'];
const WHS = ['UNA','DHL','BGK','ESN','DBG','BOC','KLN','DUS','WPT','MGL'];

export default function Attendance({ token, user }) {
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({});
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','hr','mgr'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    api(`/api/v1/employees?q=${encodeURIComponent(search)}&status=${encodeURIComponent(filterStatus)}`, { token })
      .then(setEmps)
      .finally(() => setLoading(false));
  }, [token, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ biz_line:'渊博',source_type:'own',grade:'P1',settlement_type:'hourly',hourly_rate:13,status:'active',contract_hours:8 });
    setEditModal('new');
  };
  const openEdit = (e) => { setForm({ ...e }); setEditModal(e.id); };

  const save = async () => {
    try {
      if (editModal === 'new') {
        await api('/api/v1/employees', { method:'POST', body:form, token });
      } else {
        await api(`/api/v1/employees/${editModal}`, { method:'PUT', body:form, token });
      }
      setEditModal(null);
      load();
      showToast(editModal === 'new' ? '员工已创建' : '员工已更新');
    } catch (e) {
      showToast(e.message, 'err');
    }
  };

  return (
    <div>
      <div className="ab">
        <input className="si" placeholder={t('emp.search')} value={search}
          onChange={e => setSearch(e.target.value)} />
        {[['','c.all'],['active','emp.status_active'],['inactive','emp.status_left']].map(([s, tk]) => (
          <button key={s} className={`fb ${filterStatus===s?'on':''}`} onClick={() => setFilterStatus(s)}>
            {t(tk)}
          </button>
        ))}
        <div className="ml">
          {canEdit && <button className="b bga" onClick={openNew}>{t('emp.new')}</button>}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('emp.col_id')}</th><th>{t('emp.col_name')}</th><th>{t('emp.col_biz')}</th>
            <th>{t('emp.col_wh')}</th><th>{t('emp.col_pos')}</th><th>{t('emp.col_grade')}</th>
            <th>{t('emp.col_src')}</th><th>{t('emp.col_rate')}</th>
            <th>{t('emp.col_status')}</th><th>{t('emp.col_join')}</th>
            {canEdit && <th></th>}
          </tr></thead>
          <tbody>{emps.map(e => (
            <tr key={e.id}>
              <td className="mn gn">{e.id}</td>
              <td className="fw6">{e.name}</td>
              <td><StatusBadge value={e.biz_line} /></td>
              <td>{e.primary_warehouse}</td>
              <td>{e.position}</td>
              <td><span style={{ color:'var(--pp)',fontWeight:600 }}>{e.grade}</span></td>
              <td><StatusBadge value={e.source_type} /></td>
              <td className="mn">€{fmt(e.hourly_rate)}/h</td>
              <td><StatusBadge value={e.status} /></td>
              <td className="tm">{e.join_date}</td>
              {canEdit && <td><button className="b bgh" onClick={() => openEdit(e)}>{t('c.edit')}</button></td>}
            </tr>
          ))}</tbody>
        </table></div></div>
      )}

      {editModal && (
        <Modal
          title={editModal === 'new' ? t('emp.add_title') : t('emp.edit_title')}
          onClose={() => setEditModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setEditModal(null)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={save}>{t('c.save')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">{t('emp.f_name')}</label>
              <input className="fi" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_phone')}</label>
              <input className="fi" value={form.phone||''} onChange={e => setForm({...form,phone:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_biz')}</label>
              <select className="fsl" value={form.biz_line||'渊博'} onChange={e => setForm({...form,biz_line:e.target.value})}>
                <option>渊博</option><option>579</option>
              </select></div>
            <div className="fg"><label className="fl">{t('emp.f_wh')}</label>
              <select className="fsl" value={form.primary_warehouse||''} onChange={e => setForm({...form,primary_warehouse:e.target.value})}>
                <option value="">-</option>{WHS.map(w => <option key={w}>{w}</option>)}
              </select></div>
            <div className="fg"><label className="fl">{t('emp.f_pos')}</label>
              <input className="fi" value={form.position||''} onChange={e => setForm({...form,position:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_grade')}</label>
              <select className="fsl" value={form.grade||'P1'} onChange={e => setForm({...form,grade:e.target.value})}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select></div>
            <div className="fg"><label className="fl">{t('emp.f_src')}</label>
              <select className="fsl" value={form.source_type||'own'} onChange={e => setForm({...form,source_type:e.target.value})}>
                <option value="own">{t('emp.src_own')}</option>
                <option value="supplier">{t('emp.src_sup')}</option>
              </select></div>
            <div className="fg"><label className="fl">{t('emp.f_rate')}</label>
              <input className="fi" type="number" step="0.5" value={form.hourly_rate||13}
                onChange={e => setForm({...form,hourly_rate:+e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_settle')}</label>
              <select className="fsl" value={form.settlement_type||'hourly'} onChange={e => setForm({...form,settlement_type:e.target.value})}>
                <option value="hourly">按小时 (Hourly)</option><option value="piece">按件 (Piece)</option><option value="container">按柜 (Container)</option>
              </select></div>
            <div className="fg"><label className="fl">{t('emp.f_contract_hrs')}</label>
              <input className="fi" type="number" value={form.contract_hours||8}
                onChange={e => setForm({...form,contract_hours:+e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_nationality')}</label>
              <input className="fi" value={form.nationality||''} onChange={e => setForm({...form,nationality:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_join')}</label>
              <input className="fi" type="date" value={form.join_date||''} onChange={e => setForm({...form,join_date:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('emp.f_tax')}</label>
              <select className="fsl" value={form.tax_mode||'我方报税'} onChange={e => setForm({...form,tax_mode:e.target.value})}>
                <option>我方报税</option><option>供应商报税</option>
              </select></div>
            <div className="fg"><label className="fl">{t('emp.f_pin')}</label>
              <input className="fi" maxLength={4} value={form.pin||''}
                onChange={e => setForm({...form,pin:e.target.value.replace(/\D/g,'')})} /></div>
            <div className="fg ful"><label className="fl">{t('emp.f_notes')}</label>
              <textarea className="fta" value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
