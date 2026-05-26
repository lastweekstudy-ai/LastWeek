import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();

  // Check if user has admin label
  const isAdmin = user?.labels?.includes('admin');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/testing-users', label: 'Testing Users', icon: '🎁' },
    { path: '/admin/pre-reg', label: 'Pre-Registrations', icon: '📋' },
    { path: '/admin/daily-slots', label: 'Daily Slots', icon: '🎫' },
    { path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      display: 'flex',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        padding: '1.5rem 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            Admin Panel
          </h1>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            margin: '0.25rem 0 0',
          }}>
            LastWeek Management
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                color: isActive ? '#a855f7' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                backgroundColor: isActive ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #a855f7' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{
          padding: '1.5rem',
          marginTop: 'auto',
          borderTop: '1px solid var(--color-border)',
          margin: '2rem 1rem 0',
        }}>
          <a
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '2rem',
        maxWidth: '1200px',
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
