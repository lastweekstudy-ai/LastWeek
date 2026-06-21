import { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './admin.css';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: 'DB' },
  { path: '/admin/testing-users', label: 'Testing Users', icon: 'TU' },
  { path: '/admin/pre-reg', label: 'Pre-Registrations', icon: 'PR' },
  { path: '/admin/daily-slots', label: 'Daily Slots', icon: 'DS' },
  { path: '/admin/billing', label: 'Billing', icon: 'BL' },
  { path: '/admin/reviews', label: 'Reviews', icon: 'RV' },
  { path: '/admin/settings', label: 'Settings', icon: 'ST' },
];

const AdminLayout = () => {
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const isAdmin = user?.labels?.includes('admin');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`admin-shell ${navOpen ? 'nav-open' : ''}`}>
      {navOpen && (
        <button
          className="admin-scrim"
          type="button"
          onClick={() => setNavOpen(false)}
          aria-label="Close admin menu"
        />
      )}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">LW</div>
          <div>
            <p className="admin-eyebrow">Admin</p>
            <h1 className="admin-title">LastWeek Control</h1>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a className="admin-btn" href="/dashboard">
            Back to Dashboard
          </a>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-mobile-bar">
          <button className="admin-btn" type="button" onClick={() => setNavOpen(true)}>
            Menu
          </button>
          <a className="admin-btn" href="/dashboard">
            Dashboard
          </a>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
