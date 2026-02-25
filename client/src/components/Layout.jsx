import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from './Toast';
import ProfileModal from './modals/ProfileModal';

export default function Layout({ children }) {
  const { user } = useAuth();
  const { toasts, removeToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
           onClick={() => setSidebarOpen(false)} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <TopBar
          user={user}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          onProfileClick={() => setProfileOpen(true)}
        />
        <main className="page-content">
          {children}
        </main>
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}

      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}
