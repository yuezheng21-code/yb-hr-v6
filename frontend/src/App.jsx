import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useLang } from './context/LangContext.jsx';
import { AppShell } from './components/layout/index.js';
import { pollHealth } from './services/api.js';
import { logout } from './services/auth.js';
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
import Recruit from './pages/Recruit.jsx';
import Messages from './pages/Messages.jsx';
import Admin from './pages/Admin.jsx';
import Integrations from './pages/Integrations.jsx';

const PATH_TO_KEY = {
  '/': 'dashboard', '/employees': 'employees', '/timesheets': 'timesheets',
  '/schedules': 'schedules', '/clock': 'clock', '/settlements': 'settlements',
  '/containers': 'containers', '/quotations': 'quotations', '/cost-calc': 'cost_calc',
  '/referrals': 'referrals',
  '/commissions': 'commissions', '/suppliers': 'suppliers', '/warehouses': 'warehouses',
  '/logs': 'logs', '/dispatch': 'dispatch', '/talent': 'talent',
  '/recruit': 'recruit', '/messages': 'messages', '/integrations': 'integrations', '/admin': 'admin',
};
const KEY_TO_PATH = Object.fromEntries(Object.entries(PATH_TO_KEY).map(([p, k]) => [k, p]));

function ProtectedRoute({ children }) {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token, user, setAuth, clearAuth } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [srvReady, setSrvReady] = useState(false);
  const [srvStatus, setSrvStatus] = useState('');
  const [srvErrDetail, setSrvErrDetail] = useState('');

  const currentPage = PATH_TO_KEY[location.pathname] || 'dashboard';
  const props = { token, user };

  useEffect(() => {
    return pollHealth(
      () => setSrvReady(true),
      (status, detail) => { setSrvStatus(status); if (detail) setSrvErrDetail(detail); }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onLogin = (tk, u) => {
    setAuth(tk, u);
    navigate(u.role === 'worker' ? '/clock' : '/');
  };

  const onLogout = async () => {
    await logout(token);
    clearAuth();
    navigate('/login');
  };

  if (!token || !user) {
    return <Login onLogin={onLogin} srvReady={srvReady} srvStatus={srvStatus} srvErrDetail={srvErrDetail} />;
  }

  if (!srvReady) {
    const isErr = srvStatus === 'error' || srvStatus === 'timeout';
    return (
      <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',gap:16 }}>
        {isErr
          ? <div style={{ fontSize:24 }}>⚠</div>
          : <div style={{ width:32,height:32,border:'3px solid var(--bd)',borderTopColor:'var(--ac)',borderRadius:'50%',animation:'spin 1s linear infinite' }}/>
        }
        <div style={{ fontSize:12,color:'var(--tx3)' }}>{isErr ? t('c.srv_error') : t('c.starting')}</div>
        {srvStatus && !isErr && <div style={{ fontSize:10,color:'var(--tx3)',opacity:.6 }}>{srvStatus}</div>}
        {isErr && <button className="b bga" style={{ marginTop:8,fontSize:11 }} onClick={() => window.location.reload()}>{t('c.retry')}</button>}
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      currentPage={currentPage}
      onNavigate={(key) => navigate(KEY_TO_PATH[key] || '/')}
      onLogout={onLogout}
    >
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard {...props} /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Attendance {...props} /></ProtectedRoute>} />
        <Route path="/timesheets" element={<ProtectedRoute><Timesheets {...props} /></ProtectedRoute>} />
        <Route path="/schedules" element={<ProtectedRoute><Schedules {...props} /></ProtectedRoute>} />
        <Route path="/clock" element={<ProtectedRoute><Clock {...props} /></ProtectedRoute>} />
        <Route path="/settlements" element={<ProtectedRoute><Settlements {...props} /></ProtectedRoute>} />
        <Route path="/containers" element={<ProtectedRoute><Containers {...props} /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute><Quotations {...props} /></ProtectedRoute>} />
        <Route path="/cost-calc" element={<ProtectedRoute><Quotations {...props} /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute><Referrals {...props} /></ProtectedRoute>} />
        <Route path="/commissions" element={<ProtectedRoute><Commissions {...props} /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><Suppliers {...props} /></ProtectedRoute>} />
        <Route path="/warehouses" element={<ProtectedRoute><WarehouseRates {...props} /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><AuditLogs {...props} /></ProtectedRoute>} />
        <Route path="/dispatch" element={<ProtectedRoute><Dispatch {...props} /></ProtectedRoute>} />
        <Route path="/talent" element={<ProtectedRoute><Talent {...props} /></ProtectedRoute>} />
        <Route path="/recruit" element={<ProtectedRoute><Recruit {...props} /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages {...props} /></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><Integrations {...props} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin {...props} /></ProtectedRoute>} />
        <Route path="/login" element={<Login onLogin={onLogin} srvReady={srvReady} srvStatus={srvStatus} srvErrDetail={srvErrDetail} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
