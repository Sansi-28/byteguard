import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: '🔐', label: 'Encryption Lab' },
  { to: '/history', icon: '📋', label: 'File History' },
  { to: '/shared', icon: '📤', label: 'Shared Files' },
  { to: '/received', icon: '📥', label: 'Received Files' },
  { to: '/access', icon: '🔑', label: 'Access Control' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🔐</span>
          <div>
            <span className="brand-name">Half Byte</span>
            <span className="brand-sub">Post-Quantum Vault</span>
          </div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="security-badge">
          <span className="sec-dot" />
          <span>PQC Secured · AES-256-GCM</span>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
