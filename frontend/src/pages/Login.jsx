import { useState } from 'react';
import { useLang, LangSwitcher } from '../context/LangContext.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { loginAdmin, loginPin, persistSession } from '../services/auth.js';

export default function Login({ onLogin, srvReady = true, srvStatus = '' }) {
  const [mode, setMode] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLang();

  const doLogin = async () => {
    if (!username || !password) { setErr(t('login.err_empty')); return; }
    setLoading(true); setErr('');
    try {
      const r = await loginAdmin(username, password);
      persistSession(r.token, r.user);
      onLogin(r.token, r.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doPin = async () => {
    if (pin.length < 4) { setErr(t('login.err_pin')); return; }
    setLoading(true); setErr('');
    try {
      const r = await loginPin(pin);
      persistSession(r.token, r.user);
      onLogin(r.token, r.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',zIndex:9999 }}>
      <div style={{ position:'absolute',inset:0,overflow:'hidden' }}>
        <div style={{ position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,#4f6ef720,transparent 70%)',top:-100,right:-100 }}/>
      </div>
      <div style={{ position:'relative',width:380,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:'var(--R3)',padding:'32px',boxShadow:'0 8px 40px #0008',animation:'fadeUp .4s ease' }}>
        <div style={{ position:'absolute',top:16,right:16 }}><LangSwitcher /></div>
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
          <div className="sb-logo" style={{ width:44,height:44,fontSize:20 }}>渊</div>
          <div>
            <div style={{ fontSize:18,fontWeight:700 }}>{t('login.title')}</div>
            <div style={{ fontSize:10,color:'var(--tx3)',letterSpacing:2 }}>V7 · HR Dispatch System</div>
          </div>
        </div>

        {!srvReady && (
          <div style={{ marginBottom:16,padding:'8px 12px',background:'var(--og)15',border:'1px solid var(--og)40',borderRadius:'var(--R2)',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ animation:'spin 1s linear infinite',display:'inline-block',fontSize:14 }}>⟳</span>
            <div>
              <div style={{ fontSize:11,color:'var(--og)',fontWeight:600 }}>{t('c.starting')}</div>
              {srvStatus && <div style={{ fontSize:10,color:'var(--tx3)' }}>{srvStatus}</div>}
            </div>
          </div>
        )}

        <div className="tb" style={{ marginBottom:20,width:'100%' }}>
          <button className={`tbn ${mode==='admin'?'on':''}`} style={{ flex:1 }} onClick={() => setMode('admin')}>{t('login.admin')}</button>
          <button className={`tbn ${mode==='worker'?'on':''}`} style={{ flex:1 }} onClick={() => setMode('worker')}>{t('login.worker')}</button>
        </div>

        {mode === 'admin' ? (
          <>
            <div style={{ marginBottom:12 }}>
              <label className="fl">{t('login.username')}</label>
              <input className="fi" value={username} onChange={e => { setUsername(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && doLogin()} autoFocus />
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="fl">{t('login.password')}</label>
              <input className="fi" type="password" value={password} onChange={e => { setPassword(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && doLogin()} />
            </div>
            <button className="b bga bl" style={{ width:'100%' }} onClick={doLogin} disabled={loading}>
              {loading ? <Spinner /> : t('login.btn')}
            </button>
            <div style={{ marginTop:10,fontSize:9,color:'var(--tx3)',textAlign:'center' }}>{t('login.hint')}</div>
          </>
        ) : (
          <>
            <div style={{ marginBottom:16 }}>
              <label className="fl">{t('login.pin_label')}</label>
              <input className="fi" type="tel" maxLength={4}
                style={{ fontSize:24,textAlign:'center',letterSpacing:12 }}
                value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g,'')); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && doPin()} placeholder="••••" />
            </div>
            <button className="b bga bl" style={{ width:'100%' }} onClick={doPin} disabled={loading}>
              {loading ? <Spinner /> : t('login.pin_btn')}
            </button>
            <div style={{ marginTop:10,fontSize:9,color:'var(--tx3)',textAlign:'center' }}>{t('login.pin_hint')}</div>
          </>
        )}

        {err && <div style={{ marginTop:8,fontSize:11,color:'var(--rd)',textAlign:'center' }}>{err}</div>}
      </div>
    </div>
  );
}
