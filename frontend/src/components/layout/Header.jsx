import { useLang } from '../../context/LangContext.jsx';
import { NAV_ITEMS } from '../../router/index.jsx';

const ROLE_COLORS = { admin:'#4f6ef7',hr:'#a78bfa',wh:'#f5a623',fin:'#2dd4a0',mgr:'#ff6b9d',sup:'#f0526c',worker:'#38bdf8' };

export default function Header({ user, currentPage, onMobileMenuOpen }) {
  const { t } = useLang();
  const roleColor = user ? (ROLE_COLORS[user.role] || '#6a7498') : '#6a7498';
  const navItem = NAV_ITEMS.find(n => n.key === currentPage);
  const pageLabel = navItem?.labelKey ? t(navItem.labelKey) : currentPage;

  return (
    <>
      <div className="mob-hdr">
        <button className="mob-menu-btn" onClick={onMobileMenuOpen}>☰</button>
        <h1 style={{ fontSize:14,fontWeight:700 }}>{pageLabel}</h1>
      </div>
      <div className="hdr">
        <h1>{pageLabel}</h1>
        <div className="hdr-r">
          <div className="uc">
            <div className="ua" style={{ background:roleColor }}>{user?.display_name?.[0]}</div>
            <div>
              <div className="un">{user?.display_name}</div>
              <div className="ur">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
