import { useState, useEffect } from 'react';
import { useLang, LangSwitcher } from '../../context/LangContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { NAV_ITEMS } from '../../router/index.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { LogOut, Moon, Sun } from 'lucide-react';

const ROLE_COLORS = { client:'#0ea5a4',admin:'#4f6ef7',hr:'#a78bfa',wh:'#f5a623',fin:'#2dd4a0',mgr:'#ff6b9d',sup:'#f0526c',worker:'#38bdf8' };

function useUnreadCount(token, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!token || !enabled) return;
    const fetch_ = () => {
      api('/api/v1/messages/unread-count', { token })
        .then(d => setCount(d.unread || 0))
        .catch(() => {});
    };
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, [token, enabled]);
  return count;
}

export default function Sidebar({ user, currentPage, onNavigate, onLogout }) {
  const { t } = useLang();
  const { token } = useAuth();
  const roleColor = user ? (ROLE_COLORS[user.role] || '#6a7498') : '#6a7498';
  const unreadCount = useUnreadCount(token, user?.role !== 'client');
  const { theme, toggle } = useTheme();

  // Keep a separator only between two groups that both have visible items
  const navItems = user
    ? NAV_ITEMS.filter(n => n.sep || !n.roles || n.roles.includes(user.role))
        .filter((n, i, arr) => !n.sep || (i > 0 && !arr[i - 1].sep && arr.slice(i + 1).some(x => !x.sep)))
    : [];

  return (
    <>
      <div className="sb-hd">
        <div className="sb-logo">渊</div>
        <div><div className="sb-t">渊博+579</div><div className="sb-s">HR V7</div></div>
      </div>
      <div className="nav">
        {navItems.map((n, i) => {
          if (n.sep) return <div key={i} className="nsep" />;
          const Icon = n.icon;
          return (
            <button key={n.key} className={`ni ${currentPage === n.key ? 'on' : ''}`} onClick={() => onNavigate(n.key)}>
              <span className="ni-i">{Icon && <Icon size={16} strokeWidth={1.75} />}</span>
              <span style={{ flex: 1 }}>{t(n.labelKey)}</span>
              {n.key === 'messages' && unreadCount > 0 && (
                <span className="ni-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="sb-ft">
        <div className="sb-user">
          <div className="ua" style={{ background: roleColor }}>{user?.display_name?.[0] || '?'}</div>
          <div style={{ minWidth: 0 }}>
            <div className="un" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.display_name}</div>
            <div className="ur">{user?.role}</div>
          </div>
        </div>
        <div className="sb-tools">
          <LangSwitcher />
          <button className="icon-btn" onClick={toggle} title={theme === 'light' ? '深色模式' : '浅色模式'}>
            {theme === 'light' ? <Moon size={15} strokeWidth={1.75} /> : <Sun size={15} strokeWidth={1.75} />}
          </button>
        </div>
        <button className="sb-btn dg" onClick={onLogout}><LogOut size={15} strokeWidth={1.75} />{t('c.logout')}</button>
      </div>
    </>
  );
}
