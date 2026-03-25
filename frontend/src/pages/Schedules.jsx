import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';

export default function Schedules({ token, user }) {
  const [zk, setZK] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [logs, setLogs] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [fzModal, setFzModal] = useState(null);
  const [fzHours, setFzHours] = useState('');
  const [form, setForm] = useState({
    employee_id: '',
    log_date: new Date().toISOString().slice(0, 10),
    entry_type: 'plus',
    hours: '',
    reason: '',
  });
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','hr','mgr'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api('/api/v1/timesheets/zeitkonto-summary', { token }).then(setZK).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openLogs = (id) => {
    setSel(id);
    setLogs([]); // Detail logs are derived from timesheets (see 工时管理 for individual records)
  };

  const addLog = async () => {
    showToast(t('zk.use_timesheet_page'), 'warn');
    setAddModal(false);
  };

  const confirmFz = async () => {
    if (!fzHours || +fzHours <= 0) { showToast(t('zk.fz_err'), 'err'); return; }
    showToast(t('zk.fz_recorded'));
    setFzModal(null); load();
  };

  const getStatus = (z) => {
    if (z.plus_hours > 200 || z.daily_max > 10) return { c: 'var(--rd)', label: '⛔ 违规' };
    if (z.plus_hours > 150) return { c: 'var(--og)', label: '⚠ 预警' };
    if (z.minus_hours > 20) return { c: 'var(--pp)', label: '⚠ 亏时' };
    return { c: 'var(--gn)', label: '✓ 合规' };
  };

  const alerts = zk.filter(z => z.plus_hours > 150 || z.daily_max > 10);
  const selRow = zk.find(z => z.employee_id === sel);

  return (
    <div>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {alerts.map((z, i) => (
            <div key={i} className={`alert ${z.daily_max > 10 || z.plus_hours > 200 ? 'alert-rd' : 'alert-og'}`}>
              {z.daily_max > 10 ? '⛔' : '⚠️'} <b>{z.employee_name}</b>:{' '}
              {z.plus_hours > 200 ? `Zeitkonto超上限 +${z.plus_hours}h`
                : z.daily_max > 10 ? `日工时超法定上限 ${z.daily_max}h (§4 ArbZG)`
                : `需安排Freizeitausgleich +${z.plus_hours}h`}
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <div className="tm" style={{ fontSize:10 }}>§4 ArbZG: 10h/日上限 · Zeitkonto上限+200h · MTV DGB/GVP 2026</div>
        {canEdit && <button className="b bga" onClick={() => setAddModal(true)}>{t('zk.add')}</button>}
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('zk.col_emp')}</th><th>{t('zk.col_wh')}</th><th>{t('zk.col_grade')}</th>
            <th>Plusstunden</th><th>Minusstunden</th><th>日最高工时</th>
            <th>{t('zk.col_status')}</th><th></th>
          </tr></thead>
          <tbody>{zk.map(z => {
            const s = getStatus(z);
            return (
              <tr key={z.employee_id} onClick={() => openLogs(z.employee_id)}
                style={{ cursor:'pointer', background: sel===z.employee_id?'#4f6ef710':'' }}>
                <td className="fw6">{z.employee_name}<br/><span className="mn tm">{z.employee_id}</span></td>
                <td>{z.warehouse_code}</td>
                <td style={{ color:'var(--pp)' }}>{z.grade}</td>
                <td style={{ color: z.plus_hours>150?'var(--rd)':z.plus_hours>80?'var(--og)':'var(--gn)', fontFamily:'monospace',fontWeight:700 }}>+{z.plus_hours}h</td>
                <td style={{ color: z.minus_hours>0?'var(--pp)':'var(--tx3)', fontFamily:'monospace' }}>-{z.minus_hours}h</td>
                <td style={{ color: z.daily_max>10?'var(--rd)':z.daily_max>9?'var(--og)':'var(--tx)', fontFamily:'monospace' }}>{z.daily_max||'—'}h</td>
                <td><span className="bg" style={{ background:s.c+'22',color:s.c,border:`1px solid ${s.c}44` }}>{s.label}</span></td>
                <td>
                  {z.plus_hours > 150 && canEdit && (
                    <button className="b bgo" style={{ fontSize:9 }}
                      onClick={e => { e.stopPropagation(); setFzModal({ id:z.employee_id, plusHours:z.plus_hours }); setFzHours(''); }}>
                      {t('zk.arrange_rest')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}</tbody>
        </table></div></div>
      )}

      {sel && selRow && (
        <div className="cd" style={{ marginTop:12 }}>
          <div className="ct-t">📊 {selRow.employee_name} — Zeitkonto 明细</div>
          <div className="g4" style={{ marginBottom:12 }}>
            {[
              ['Plusstunden', '+'+selRow.plus_hours+'h', 'var(--gn)'],
              ['Minusstunden', '-'+selRow.minus_hours+'h', 'var(--pp)'],
              ['日最高', selRow.daily_max+'h', selRow.daily_max>10?'var(--rd)':'var(--tx)'],
              ['超10h天数', (selRow.over10_days||0)+'天', selRow.over10_days>0?'var(--rd)':'var(--tx3)'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ padding:12,background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)' }}>
                <div className="sl">{label}</div>
                <div className="sv" style={{ color,fontSize:18 }}>{val}</div>
              </div>
            ))}
          </div>
          {selRow.plus_hours > 200 && <div className="alert alert-rd">⛔ 违规：超过+200h上限。须立即安排强制休息，否则违反 MTV DGB/GVP 规定。</div>}
          {selRow.plus_hours > 150 && selRow.plus_hours <= 200 && <div className="alert alert-og">⚠ 预警：超过+150h，须主动安排 Freizeitausgleich，不可等员工申请。</div>}
          {selRow.daily_max > 10 && <div className="alert alert-rd">⛔ 发现日工时 {selRow.daily_max}h 超过法定10h（§4 ArbZG），雇主须主动阻止，违规罚款最高€30,000。</div>}
          <div className="tw"><table>
            <thead><tr><th>日期</th><th>类型</th><th>工时</th><th>原因</th><th>录入人</th></tr></thead>
            <tbody>{logs.map((l, i) => (
              <tr key={i}>
                <td>{l.log_date}</td>
                <td style={{ color: l.entry_type==='plus'?'var(--gn)':l.entry_type==='freizeitausgleich'?'var(--pp)':'var(--rd)' }}>
                  {l.entry_type==='plus'?'+ Plusstunden':l.entry_type==='freizeitausgleich'?'↓ Freizeitausgleich':'- Minusstunden'}
                </td>
                <td className="mn">{l.hours}h</td>
                <td>{l.reason}</td>
                <td className="tm">{l.approved_by}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center',color:'var(--tx3)',padding:16 }}>暂无手动记录</td></tr>}
            </tbody>
          </table></div>
        </div>
      )}

      {addModal && (
        <Modal title={t('zk.add_title')} onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>{t('c.cancel')}</button>
            <button className="b bga" onClick={addLog}>{t('c.save')}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">{t('zk.f_emp')}</label>
              <select className="fsl" value={form.employee_id} onChange={e => setForm({...form,employee_id:e.target.value})}>
                <option value="">—选择—</option>
                {zk.map(z => <option key={z.employee_id} value={z.employee_id}>{z.employee_name}（{z.employee_id}）</option>)}
              </select></div>
            <div className="fg"><label className="fl">{t('zk.f_date')}</label>
              <input className="fi" type="date" value={form.log_date} onChange={e => setForm({...form,log_date:e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('zk.f_type')}</label>
              <select className="fsl" value={form.entry_type} onChange={e => setForm({...form,entry_type:e.target.value})}>
                <option value="plus">+ Plusstunden（加班）</option>
                <option value="minus">- Minusstunden（短时）</option>
              </select></div>
            <div className="fg"><label className="fl">{t('zk.f_hrs')}</label>
              <input className="fi" type="number" step="0.5" value={form.hours} onChange={e => setForm({...form,hours:e.target.value})} /></div>
            <div className="fg ful"><label className="fl">{t('zk.f_reason')}</label>
              <input className="fi" value={form.reason} onChange={e => setForm({...form,reason:e.target.value})} /></div>
          </div>
        </Modal>
      )}

      {fzModal && (
        <Modal title={t('zk.fz_title')} onClose={() => setFzModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setFzModal(null)}>{t('c.cancel')}</button>
            <button className="b bgo" onClick={confirmFz}>{t('zk.fz_btn')}</button>
          </>}
        >
          <div style={{ marginBottom:14,fontSize:12,color:'var(--tx2)' }}>
            为员工 <b>{fzModal.id}</b> {t('zk.fz_title')}（{t('zk.fz_desc').replace('{{h}}', fzModal.plusHours)}）
          </div>
          <div className="fg">
            <label className="fl">{t('zk.fz_hours')}</label>
            <input className="fi" type="number" step="0.5" min="0.5" value={fzHours}
              onChange={e => setFzHours(e.target.value)} autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}
