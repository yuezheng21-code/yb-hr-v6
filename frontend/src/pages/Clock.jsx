import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';

export default function Clock({ token, user }) {
  const [now, setNow] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const { t } = useLang();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api('/api/clock/today', { token }).then(setLogs).catch(() => {});
  }, [token]);

  const last = logs[logs.length - 1];
  const isIn = last?.clock_type === 'in';

  const punch = async (type) => {
    await api('/api/clock', { method:'POST', body:{ clock_type:type }, token });
    const r = await api('/api/clock/today', { token });
    setLogs(r);
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0' }}>
      <div style={{ fontSize:64,fontWeight:800,color:'var(--ac2)',letterSpacing:-2 }}>
        {now.toTimeString().slice(0, 8)}
      </div>
      <div style={{ color:'var(--tx3)',marginBottom:24 }}>
        {now.toLocaleDateString('de-DE')} · {user?.display_name}
      </div>

      <div
        onClick={() => punch(isIn ? 'out' : 'in')}
        style={{
          width:160, height:160, borderRadius:'50%',
          border: `4px solid ${isIn ? 'var(--rd)' : 'var(--gn)'}`,
          background: isIn ? '#f0526c10' : '#2dd4a010',
          display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', cursor:'pointer', transition:'all .3s', userSelect:'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <div style={{ fontSize:36,marginBottom:4 }}>{isIn ? '👋' : '👆'}</div>
        <div style={{ fontSize:14,fontWeight:700 }}>{isIn ? t('clock.clock_out') : t('clock.clock_in')}</div>
      </div>

      <div style={{ marginTop:20,fontSize:12,color:isIn?'var(--gn)':'var(--og)' }}>
        {isIn ? `${t('clock.clocked_in')} ${last.clock_time}` : t('clock.not_clocked')}
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop:16,width:'100%',maxWidth:400 }}>
          {logs.map((l, i) => (
            <div key={i} style={{ display:'flex',gap:12,padding:'10px 14px',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:10,marginBottom:6 }}>
              <span style={{ fontSize:20 }}>{l.clock_type === 'in' ? '🟢' : '🔴'}</span>
              <div>
                <div style={{ fontWeight:600,fontSize:12 }}>
                  {l.clock_type === 'in' ? t('clock.clock_in') : t('clock.clock_out')}
                </div>
                <div className="tm" style={{ fontSize:10 }}>{l.clock_time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
