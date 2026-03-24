import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const RATINGS = ['A','B','C'];

export default function Suppliers({ token, user }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({});
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','hr','mgr'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api('/api/suppliers', { token }).then(setSuppliers).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = suppliers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({ biz_line:'渊博', rating:'B', status:'合作中', tax_handle:'供应商自行报税' });
    setEditModal('new');
  };
  const openEdit = (s) => { setForm({ ...s }); setEditModal(s.id); };

  const save = async () => {
    try {
      if (editModal === 'new') {
        await api('/api/suppliers', { method:'POST', body:form, token });
      } else {
        await api(`/api/suppliers/${editModal}`, { method:'PUT', body:form, token });
      }
      setEditModal(null); load(); showToast(editModal === 'new' ? '供应商已创建' : '供应商已更新');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const del = async (id) => {
    if (!confirm('确认删除该供应商？')) return;
    try {
      await api(`/api/suppliers/${id}`, { method:'DELETE', token });
      load(); showToast('已删除');
    } catch (e) { showToast(e.message, 'err'); }
  };

  return (
    <div>
      <div className="ab">
        <input className="si" placeholder={t('sup.search')} value={search}
          onChange={e => setSearch(e.target.value)} />
        <div className="ml">
          {canEdit && <button className="b bga" onClick={openNew}>{t('sup.add')}</button>}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><table>
          <thead><tr>
            <th>{t('sup.col_id')}</th><th>{t('sup.col_name')}</th><th>{t('sup.col_biz')}</th>
            <th>{t('sup.col_contact')}</th><th>{t('sup.col_phone')}</th>
            <th>{t('sup.col_email')}</th><th>{t('sup.col_rating')}</th>
            <th>{t('sup.col_status')}</th>{canEdit && <th></th>}
          </tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id}>
              <td className="mn tm">{s.id}</td>
              <td className="fw6">{s.name}</td>
              <td><StatusBadge value={s.biz_line} /></td>
              <td>{s.contact_name}</td>
              <td className="mn">{s.phone}</td>
              <td className="tm" style={{ fontSize:10 }}>{s.email}</td>
              <td><span style={{ color:s.rating==='A'?'var(--gn)':s.rating==='B'?'var(--og)':'var(--rd)',fontWeight:700 }}>{s.rating}</span></td>
              <td><StatusBadge value={s.status} /></td>
              {canEdit && (
                <td style={{ display:'flex',gap:4 }}>
                  <button className="b bgh" style={{ fontSize:9 }} onClick={() => openEdit(s)}>{t('c.edit')}</button>
                  <button className="b bgr" style={{ fontSize:9 }} onClick={() => del(s.id)}>删除</button>
                </td>
              )}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign:'center',color:'var(--tx3)',padding:20 }}>{t('c.no_data')}</td></tr>
          )}
          </tbody>
        </table></div>
      )}

      {editModal && (
        <Modal
          title={editModal === 'new' ? t('sup.add_title') : t('sup.edit_title')}
          onClose={() => setEditModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setEditModal(null)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={save}>{t('c.save')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg ful"><label className="fl">{t('sup.f_name')}</label>
              <input className="fi" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} autoFocus /></div>
            <div className="fg"><label className="fl">{t('sup.f_biz')}</label>
              <select className="fsl" value={form.biz_line||'渊博'} onChange={e => setForm({...form,biz_line:e.target.value})}>
                <option>渊博</option><option>579</option>
              </select></div>
            <div className="fg"><label className="fl">{t('sup.f_contact')}</label>
              <input className="fi" value={form.contact_name||''} onChange={e => setForm({...form,contact_name:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('sup.f_phone')}</label>
              <input className="fi" value={form.phone||''} onChange={e => setForm({...form,phone:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('sup.f_email')}</label>
              <input className="fi" type="email" value={form.email||''} onChange={e => setForm({...form,email:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('sup.f_tax')}</label>
              <select className="fsl" value={form.tax_handle||'供应商自行报税'} onChange={e => setForm({...form,tax_handle:e.target.value})}>
                <option>供应商自行报税</option><option>我方代报税</option>
              </select></div>
            <div className="fg"><label className="fl">{t('sup.f_rating')}</label>
              <select className="fsl" value={form.rating||'B'} onChange={e => setForm({...form,rating:e.target.value})}>
                {RATINGS.map(r => <option key={r}>{r}</option>)}
              </select></div>
            <div className="fg"><label className="fl">{t('c.status')}</label>
              <select className="fsl" value={form.status||'合作中'} onChange={e => setForm({...form,status:e.target.value})}>
                <option>合作中</option><option>停止合作</option>
              </select></div>
            <div className="fg ful"><label className="fl">{t('sup.f_notes')}</label>
              <textarea className="fta" value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
