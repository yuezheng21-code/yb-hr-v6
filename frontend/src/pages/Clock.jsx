import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { LogIn, LogOut } from 'lucide-react';

export default function Clock({ token, user }) {
  const [now, setNow] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const { t } = useLang();
  const showToast = useToast();
  const [opTypes, setOpTypes] = useState([]);
  const [mine, setMine] = useState(null);
  const [rep, setRep] = useState({ op_type_id: '', qty: '', hours: '', ref_no: '' });

  const loadMine = () => api('/api/v1/ops/my', { token }).then(setMine).catch(() => setMine(null));

  useEffect(() => {
    loadMine();
    api('/api/v1/ops/types?active_only=true', { token }).then(setOpTypes).catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReport = async () => {
    if (!rep.op_type_id || !(parseFloat(rep.qty) > 0)) { showToast('请选择作业并填写数量', 'err'); return; }
    try {
      await api('/api/v1/ops/report', {
        method: 'POST', token,
        body: { op_type_id: parseInt(rep.op_type_id), qty: parseFloat(rep.qty), hours: parseFloat(rep.hours) || 0, ref_no: rep.ref_no || null },
      });
      setRep({ ...rep, qty: '', hours: '', ref_no: '' });
      showToast('报工成功');
      loadMine();
    } catch (e) { showToast(e.message, 'err'); }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api('/api/v1/clock/today', { token }).then(setLogs).catch(() => {});
  }, [token]);

  const last = logs[logs.length - 1];
  const isIn = last?.clock_type === 'in';

  const punch = async (type) => {
    await api('/api/v1/clock', { method:'POST', body:{ clock_type:type }, token });
    const r = await api('/api/v1/clock/today', { token });
    setLogs(r);
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0' }}>
      <div style={{ fontSize:56,fontWeight:300,color:'var(--tx)',letterSpacing:-1,fontVariantNumeric:'tabular-nums' }}>
        {now.toTimeString().slice(0, 8)}
      </div>
      <div style={{ color:'var(--tx3)',marginBottom:24 }}>
        {now.toLocaleDateString('de-DE')} · {user?.display_name}
      </div>

      <div
        onClick={() => punch(isIn ? 'out' : 'in')}
        style={{
          width:148, height:148, borderRadius:'50%',
          border: `1.5px solid ${isIn ? 'var(--rd)' : 'var(--ac)'}`,
          background: isIn ? 'color-mix(in srgb, var(--rd) 6%, transparent)' : 'var(--ac)',
          color: isIn ? 'var(--rd)' : '#fff',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          justifyContent:'center', cursor:'pointer', transition:'transform .15s', userSelect:'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isIn ? <LogOut size={28} strokeWidth={1.5} /> : <LogIn size={28} strokeWidth={1.5} />}
        <div style={{ fontSize:14,fontWeight:500 }}>{isIn ? t('clock.clock_out') : t('clock.clock_in')}</div>
      </div>

      <div style={{ marginTop:20,fontSize:12,color:'var(--tx3)' }}>
        {isIn ? `${t('clock.clocked_in')} ${last.clock_time}` : t('clock.not_clocked')}
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop:16,width:'100%',maxWidth:400 }}>
          {logs.map((l, i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--bd)',fontSize:12 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:l.clock_type === 'in' ? 'var(--gn)' : 'var(--rd)' }} />
              <span style={{ flex:1 }}>{l.clock_type === 'in' ? t('clock.clock_in') : t('clock.clock_out')}</span>
              <span className="tm mn">{l.clock_time}</span>
            </div>
          ))}
        </div>
      )}
      {mine && (
        <div style={{ marginTop:24,width:'100%',maxWidth:400 }}>
          <div className="fw6" style={{ marginBottom:8 }}>报工（产量登记）</div>
          <div style={{ display:'flex',flexDirection:'column',gap:6,padding:16,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12 }}>
            <select className="fsl" value={rep.op_type_id} onChange={e => setRep({ ...rep, op_type_id: e.target.value })}>
              <option value="">选择作业 / Tätigkeit</option>
              {opTypes.map(o => <option key={o.id} value={o.id}>{o.name}{o.name_de ? ` · ${o.name_de}` : ''} ({o.unit})</option>)}
            </select>
            <div style={{ display:'flex',gap:6 }}>
              <input className="fi" type="number" inputMode="decimal" placeholder="数量 Menge" value={rep.qty} onChange={e => setRep({ ...rep, qty: e.target.value })} />
              <input className="fi" type="number" inputMode="decimal" step="0.25" placeholder="工时 Std." value={rep.hours} onChange={e => setRep({ ...rep, hours: e.target.value })} />
            </div>
            <input className="fi" placeholder="单号/柜号（可选）" value={rep.ref_no} onChange={e => setRep({ ...rep, ref_no: e.target.value })} />
            <button className="b bga" onClick={submitReport}>提交 / Senden</button>
          </div>
          {mine.today.length > 0 && (
            <div style={{ marginTop:8 }}>
              {mine.today.map(l => (
                <div key={l.id} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:8,marginBottom:4,fontSize:12 }}>
                  <span>{l.op_name || l.op_label}</span>
                  <span className="mn">{l.qty} {l.unit}{l.hours ? ` · ${l.hours}h` : ''}</span>
                </div>
              ))}
            </div>
          )}
          {mine.month && (
            <div style={{ marginTop:8,padding:16,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12,fontSize:12,display:'flex',justifyContent:'space-around',textAlign:'center' }}>
              <div><div className="tm" style={{ fontSize:10 }}>本月效率</div><div className="fw6">{mine.month.efficiency != null ? `${mine.month.efficiency}%` : '—'}</div></div>
              <div><div className="tm" style={{ fontSize:10 }}>质量分</div><div className="fw6">{mine.month.quality_score}</div></div>
              <div><div className="tm" style={{ fontSize:10 }}>等级</div><div className="fw6">{mine.month.grade}</div></div>
              <div><div className="tm" style={{ fontSize:10 }}>计件</div><div className="fw6">€{mine.month.piece_amount}</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
