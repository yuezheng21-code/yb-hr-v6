import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import MobileNav from './MobileNav.jsx';

export default function AppShell({ user, currentPage, onNavigate, onLogout, children }) {
  const [mobNav, setMobNav] = useState(false);

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
      <MobileNav isOpen={mobNav} onClose={() => setMobNav(false)} />
      <div className="main">
        <Header
          user={user}
          currentPage={currentPage}
          onMobileMenuOpen={() => setMobNav(true)}
        />
        <div className="ct">
          {children}
        </div>
      </div>
    </div>
  );
}
