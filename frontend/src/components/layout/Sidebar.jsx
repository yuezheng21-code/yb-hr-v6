import { useState, useEffect } from 'react';
import { useLang, LangSwitcher } from '../../context/LangContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { NAV_ITEMS } from '../../router/index.jsx';

const ROLE_COLORS = { admin:'#4f6ef7',hr:'#a78bfa',wh:'#f5a623',fin:'#2dd4a0',mgr:'#ff6b9d',sup:'#f0526c',worker:'#38bdf8' };

function useUnreadCount(token) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!token) return;
    const fetch_ = () => {
      api('/api/v1/messages/unread-count', { token })
        .then(d => setCount(d.unread || 0))
        .catch(() => {});
    };
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, [token]);
  return count;
}

export default function Sidebar({ user, currentPage, onNavigate, onLogout }) {
  const { t } = useLang();
  const { token } = useAuth();
  const roleColor = user ? (ROLE_COLORS[user.role] || '#6a7498') : '#6a7498';
  const unreadCount = useUnreadCount(token);

  const navItems = user
    ? NAV_ITEMS.filter(n => n.sep || !n.roles || n.roles.includes(user.role))
    : [];

  return (
    <>
      <div className="sb-hd">
        <div className="sb-logo">渊</div>
        <div><div className="sb-t">渊博+579</div><div className="sb-s">HR V7 · LIVE</div></div>
      </div>
      <div className="nav">
        {navItems.map((n, i) =>
          n.sep
            ? <div key={i} className="nsep" />
            : <button key={n.key} className={`ni ${currentPage === n.key ? 'on' : ''}`} onClick={() => onNavigate(n.key)}>
                <span className="ni-i">{n.icon}</span>
                <span style={{ flex:1 }}>{t(n.labelKey)}</span>
                {n.key === 'messages' && unreadCount > 0 && (
                  <span style={{
                    background: 'var(--rd)', color: '#fff', borderRadius: 10,
                    fontSize: 9, fontWeight: 700, padding: '1px 5px', minWidth: 16,
                    textAlign: 'center', lineHeight: '14px',
                  }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
        )}
      </div>
      <div className="sb-ft">
        <div className="sb-btn" style={{ cursor:'default',marginBottom:6 }}>
          <div className="ua" style={{ background:roleColor }}>{user?.display_name?.[0] || '?'}</div>
          <div>
            <div style={{ fontSize:10,fontWeight:600,color:'var(--tx)' }}>{user?.display_name}</div>
            <div style={{ fontSize:8,color:'var(--tx3)' }}>{user?.role}</div>
          </div>
        </div>
        <div style={{ padding:'4px 8px 8px' }}><LangSwitcher /></div>
        <button className="sb-btn dg" onClick={onLogout}>🚪 {t('c.logout')}</button>
      </div>
    </>
  );
}
