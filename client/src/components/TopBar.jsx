import React from 'react';

export default function TopBar({ user, onMenuToggle, onProfileClick }) {
  return (
    <header className="top-bar">
      <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <div className="top-bar-title">
        <span className="top-bar-icon">🔐</span>
        <span>Half Byte</span>
      </div>

      <div className="top-bar-right">
        <span className="quantum-status">
          <span className="status-dot online" />
          Quantum Safe
        </span>
        <button className="profile-btn" onClick={onProfileClick}>
          <span className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'R'}</span>
          <span className="profile-name hide-mobile">{user?.name || 'Researcher'}</span>
        </button>
      </div>
    </header>
  );
}
