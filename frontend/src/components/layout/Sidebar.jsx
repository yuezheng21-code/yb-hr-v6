import { useLang, LangSwitcher } from '../../context/LangContext.jsx';
import { NAV_ITEMS } from '../../router/index.jsx';

const ROLE_COLORS = { admin:'#4f6ef7',hr:'#a78bfa',wh:'#f5a623',fin:'#2dd4a0',mgr:'#ff6b9d',sup:'#f0526c',worker:'#38bdf8' };

export default function Sidebar({ user, currentPage, onNavigate, onLogout }) {
  const { t } = useLang();
  const roleColor = user ? (ROLE_COLORS[user.role] || '#6a7498') : '#6a7498';

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
                <span>{t(n.labelKey)}</span>
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
