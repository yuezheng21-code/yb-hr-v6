import { useState, useEffect, useCallback } from 'react';
import { useLang, LangSwitcher } from './context/LangContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import { NAV_ITEMS } from './router/index.jsx';
import { logout } from './services/auth.js';
import { pollHealth } from './services/api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Attendance from './pages/Attendance.jsx';
import Timesheets from './pages/Timesheets.jsx';
import Schedules from './pages/Schedules.jsx';
import Clock from './pages/Clock.jsx';
import Settlements from './pages/Settlements.jsx';
import Containers from './pages/Containers.jsx';
import Quotations from './pages/Quotations.jsx';
import Referrals from './pages/Referrals.jsx';
import Commissions from './pages/Commissions.jsx';
import Suppliers from './pages/Suppliers.jsx';
import WarehouseRates from './pages/WarehouseRates.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Dispatch from './pages/Dispatch.jsx';
import Talent from './pages/Talent.jsx';

const ROLE_COLORS = { admin:'#4f6ef7',hr:'#a78bfa',wh:'#f5a623',fin:'#2dd4a0',mgr:'#ff6b9d',sup:'#f0526c',worker:'#38bdf8' };

function PageContent({ page, token, user }) {
  const props = { token, user };
  switch (page) {
    case 'dashboard':      return <Dashboard {...props} />;
    case 'attendance':     return <Attendance {...props} />;
    case 'timesheets':     return <Timesheets {...props} />;
    case 'schedules':      return <Schedules {...props} />;
    case 'clock':          return <Clock {...props} />;
    case 'settlements':    return <Settlements {...props} />;
    case 'containers':     return <Containers {...props} />;
    case 'quotations':     return <Quotations {...props} />;
    case 'referrals':      return <Referrals {...props} />;
    case 'commissions':    return <Commissions {...props} />;
    case 'suppliers':      return <Suppliers {...props} />;
    case 'warehouse_rates':return <WarehouseRates {...props} />;
    case 'logs':           return <AuditLogs {...props} />;
    case 'cost_calc':      return <Commissions {...props} />;
    case 'dispatch':       return <Dispatch {...props} />;
    case 'talent':         return <Talent {...props} />;
    default:               return <Dashboard {...props} />;
  }
}

export default function App() {
  const { token, user, setAuth, clearAuth } = useAuth();
  const { t } = useLang();
  const [page, setPage] = useState('dashboard');
  const [mobNav, setMobNav] = useState(false);
  const [srvReady, setSrvReady] = useState(false);
  const [srvStatus, setSrvStatus] = useState('');

  useEffect(() => {
    return pollHealth(
      () => setSrvReady(true),
      (status) => { setSrvStatus(status); clearAuth(); }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onLogin = (tk, u) => {
    setAuth(tk, u);
    setPage(u.role === 'worker' ? 'clock' : 'dashboard');
  };

  const onLogout = async () => {
    await logout(token);
    clearAuth();
  };

  const go = (key) => { setPage(key); setMobNav(false); };

  const navItems = token && user
    ? NAV_ITEMS.filter(n => !n.key || !n.roles || n.roles.includes(user.role))
    : [];

  const pageLabel = NAV_ITEMS.find(n => n.key === page)?.labelKey
    ? t(NAV_ITEMS.find(n => n.key === page).labelKey)
    : page;

  const roleColor = user ? (ROLE_COLORS[user.role] || '#6a7498') : '#6a7498';

  if (!srvReady) {
    return (
      <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',gap:16 }}>
        <div style={{ width:32,height:32,border:'3px solid var(--bd)',borderTopColor:'var(--ac)',borderRadius:'50%',animation:'spin 1s linear infinite' }}/>
        <div style={{ fontSize:12,color:'var(--tx3)' }}>{t('c.starting')}</div>
        {srvStatus && <div style={{ fontSize:10,color:'var(--tx3)',opacity:.6 }}>{srvStatus}</div>}
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLogin={onLogin} />;
  }

  const sidebar = (
    <>
      <div className="sb-hd">
        <div className="sb-logo">渊</div>
        <div><div className="sb-t">渊博+579</div><div className="sb-s">HR V7 · LIVE</div></div>
      </div>
      <div className="nav">
        {navItems.map((n, i) =>
          n.sep
            ? <div key={i} className="nsep" />
            : <button key={n.key} className={`ni ${page === n.key ? 'on' : ''}`} onClick={() => go(n.key)}>
                <span className="ni-i">{n.icon}</span>
                <span>{t(n.labelKey)}</span>
              </button>
        )}
      </div>
      <div className="sb-ft">
        <div className="sb-btn" style={{ cursor:'default',marginBottom:6 }}>
          <div className="ua" style={{ background:roleColor }}>{user.display_name?.[0] || '?'}</div>
          <div>
            <div style={{ fontSize:10,fontWeight:600,color:'var(--tx)' }}>{user.display_name}</div>
            <div style={{ fontSize:8,color:'var(--tx3)' }}>{user.role}</div>
          </div>
        </div>
        <div style={{ padding:'4px 8px 8px' }}><LangSwitcher /></div>
        <button className="sb-btn dg" onClick={onLogout}>🚪 {t('c.logout')}</button>
      </div>
    </>
  );

  return (
    <div className="app">
      <div className={`sidebar ${mobNav ? 'open' : ''}`}>{sidebar}</div>
      <div className={`mob-overlay ${mobNav ? 'show' : ''}`} onClick={() => setMobNav(false)} />
      <div className="main">
        <div className="mob-hdr">
          <button className="mob-menu-btn" onClick={() => setMobNav(true)}>☰</button>
          <h1 style={{ fontSize:14,fontWeight:700 }}>{pageLabel}</h1>
        </div>
        <div className="hdr">
          <h1>{pageLabel}</h1>
          <div className="hdr-r">
            <div className="uc">
              <div className="ua" style={{ background:roleColor }}>{user.display_name?.[0]}</div>
              <div><div className="un">{user.display_name}</div><div className="ur">{user.role}</div></div>
            </div>
          </div>
        </div>
        <div className="ct">
          <PageContent page={page} token={token} user={user} />
        </div>
      </div>
    </div>
  );
}
