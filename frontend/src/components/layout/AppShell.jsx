import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import MobileNav from './MobileNav.jsx';

export default function AppShell({ user, currentPage, onNavigate, onLogout, children }) {
  const [mobNav, setMobNav] = useState(false);
  const openedAt = useRef(0);

  const openNav = useCallback(() => { openedAt.current = Date.now(); setMobNav(true); }, []);
  // Some mobile browsers (e.g. Samsung Internet) deliver a delayed "ghost" click after the tap
  // that opened the drawer. It lands on the overlay that just appeared under the finger and would
  // close the drawer immediately, so overlay clicks right after opening are ignored.
  const closeFromOverlay = useCallback(() => {
    if (Date.now() - openedAt.current < 400) return;
    setMobNav(false);
  }, []);

  // Close the mobile drawer whenever the page changes, and on Escape.
  useEffect(() => { setMobNav(false); }, [currentPage]);
  useEffect(() => {
    if (!mobNav) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMobNav(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobNav]);

  return (
    <div className="app">
      <div className={`sidebar ${mobNav ? 'open' : ''}`}>
        <Sidebar
          user={user}
          currentPage={currentPage}
          onNavigate={(key) => { onNavigate(key); setMobNav(false); }}
          onLogout={onLogout}
        />
      </div>
      <MobileNav isOpen={mobNav} onClose={closeFromOverlay} />
      <div className="main">
        <Header
          user={user}
          currentPage={currentPage}
          onMobileMenuOpen={openNav}
        />
        <div className="ct">
          {children}
        </div>
      </div>
    </div>
  );
}
