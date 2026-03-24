import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const WV_PHASES = ['立项','测算','报价','合规','备人','培训','运营','撤离'];

export default function Quotations({ token, user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [newModal, setNewModal] = useState(false);
  const [form, setForm] = useState({ name:'', client:'', service_type:'', region:'', project_manager:'' });
  const { t } = useLang();
  const showToast = useToast();

  const SERVICES = ['卸柜承包','装卸承包','入库承包','出库承包','区域承包','快转/分拣承包','综合承包'];
  const REGIONS = ['南部大区 (Köln/Düsseldorf)','鲁尔西大区 (Duisburg/Essen)','鲁尔东大区 (Dortmund/Unna)'];
  const canEdit = ['admin','hr','mgr'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api('/api/werkvertrag', { token }).then(setProjects).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selP = projects.find(p => p.id === selId);

  const createProj = async () => {
    if (!form.name) { showToast('请填写项目名称', 'err'); return; }
    try {
      const r = await api('/api/werkvertrag', { method:'POST', body:form, token });
      setSelId(r.id); setCurrentPhase(0); setNewModal(false); load(); showToast('项目已创建');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const updatePhase = async (phase) => {
    if (!selId) return;
    try {
      await api(`/api/werkvertrag/${selId}`, { method:'PUT', body:{ phase }, token });
      load(); showToast('阶段已更新');
    } catch (e) { showToast(e.message, 'err'); }
  };

  return (
    <div style={{ display:'flex', gap:12, height:'calc(100vh - 140px)', overflow:'hidden' }}>
      {/* Project list */}
      <div style={{ width:280, flexShrink:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:11, color:'var(--tx3)' }}>项目列表 ({projects.length})</span>
          {canEdit && <button className="b bga" style={{ fontSize:11, padding:'4px 10px' }} onClick={() => setNewModal(true)}>+ 新建</button>}
        </div>
        {loading ? <Loading /> : projects.map(p => (
          <div key={p.id}
            onClick={() => { setSelId(p.id); setCurrentPhase(WV_PHASES.indexOf(p.phase) || 0); }}
            style={{
              padding:'10px 12px', borderRadius:'var(--R2)', cursor:'pointer',
              border: `1px solid ${selId===p.id ? 'var(--ac)' : 'var(--bd)'}`,
              background: selId===p.id ? 'var(--ac)10' : 'var(--bg2)',
            }}
          >
            <div style={{ fontWeight:600, fontSize:12, marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:10, color:'var(--tx3)' }}>{p.client}</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, alignItems:'center' }}>
              <StatusBadge value={p.status} />
              <span style={{ fontSize:9, color:'var(--tx3)' }}>
                {WV_PHASES.indexOf(p.phase)+1}/{WV_PHASES.length} {p.phase}
              </span>
            </div>
          </div>
        ))}
        {!loading && projects.length === 0 && (
          <div style={{ textAlign:'center', padding:20, color:'var(--tx3)', fontSize:11 }}>暂无项目</div>
        )}
      </div>

      {/* Project detail */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {selP ? (
          <>
            <div className="cd" style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700 }}>{selP.name}</div>
                  <div style={{ fontSize:11, color:'var(--tx3)', marginTop:2 }}>{selP.client} · {selP.service_type} · {selP.region}</div>
                </div>
                <StatusBadge value={selP.status} />
              </div>
              {/* Phase progress */}
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {WV_PHASES.map((ph, i) => {
                  const curIdx = WV_PHASES.indexOf(selP.phase);
                  const done = i < curIdx;
                  const active = i === curIdx;
                  return (
                    <div key={ph} style={{
                      padding:'4px 10px', borderRadius:20, fontSize:10, cursor: canEdit ? 'pointer' : 'default',
                      background: active?'var(--ac)':done?'var(--gn)20':'var(--bg3)',
                      color: active?'#fff':done?'var(--gn)':'var(--tx3)',
                      border: `1px solid ${active?'var(--ac)':done?'var(--gn)30':'var(--bd)'}`,
                      fontWeight: active ? 700 : 400,
                    }} onClick={() => canEdit && updatePhase(ph)}>
                      {i+1}. {ph}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="cd">
              <div className="ct-t">项目信息</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12 }}>
                {[
                  ['项目经理', selP.project_manager],
                  ['创建时间', selP.created_at?.slice(0,10)],
                  ['服务类型', selP.service_type],
                  ['地区', selP.region],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding:10, background:'var(--bg3)', borderRadius:8, border:'1px solid var(--bd)' }}>
                    <div className="sl">{label}</div>
                    <div style={{ marginTop:4, fontWeight:500 }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--tx3)', fontSize:12 }}>
            ← 从左侧选择项目查看详情
          </div>
        )}
      </div>

      {newModal && (
        <Modal title="新建 Werkvertrag 项目" onClose={() => setNewModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setNewModal(false)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={createProj}>{t('c.save')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg ful"><label className="fl">项目名称 *</label>
              <input className="fi" value={form.name} onChange={e => setForm({...form,name:e.target.value})} autoFocus /></div>
            <div className="fg"><label className="fl">客户</label>
              <input className="fi" value={form.client} onChange={e => setForm({...form,client:e.target.value})} /></div>
            <div className="fg"><label className="fl">服务类型</label>
              <select className="fsl" value={form.service_type} onChange={e => setForm({...form,service_type:e.target.value})}>
                <option value="">—选择—</option>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select></div>
            <div className="fg"><label className="fl">地区</label>
              <select className="fsl" value={form.region} onChange={e => setForm({...form,region:e.target.value})}>
                <option value="">—选择—</option>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select></div>
            <div className="fg"><label className="fl">项目经理</label>
              <input className="fi" value={form.project_manager} onChange={e => setForm({...form,project_manager:e.target.value})} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
