import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Researcher Profile</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="profile-avatar-large">
            {user?.name?.charAt(0)?.toUpperCase() || 'R'}
          </div>

          <div className="profile-details">
            <div className="profile-field">
              <span className="meta-label">Researcher ID</span>
              <span>{user?.name || '—'}</span>
            </div>
            <div className="profile-field">
              <span className="meta-label">Role</span>
              <span>{user?.role || 'Researcher'}</span>
            </div>
            <div className="profile-field">
              <span className="meta-label">Profile ID</span>
              <code>{user?.profileId || '—'}</code>
            </div>
            <div className="profile-field">
              <span className="meta-label">Session Started</span>
              <span>{user?.loginTime ? new Date(user.loginTime).toLocaleString() : '—'}</span>
            </div>
            <div className="profile-field">
              <span className="meta-label">Security Clearance</span>
              <span className="badge">Level 5 — Top Secret</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-danger" onClick={logout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
