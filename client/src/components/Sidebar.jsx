import React from 'react';
import { NavLink } from 'react-router-dom';
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
    <aside
      className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <span className="font-bold text-white text-sm block">ByteGuard</span>
            <span className="text-[0.65rem] text-gray-500 block">Post-Quantum Secure</span>
          </div>
        </div>
        <button
          className="text-gray-400 hover:text-white lg:hidden text-lg"
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto flex flex-col gap-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
            onClick={onClose}
          >
            <span className="text-base w-6 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[0.65rem] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]" />
          <span>PQC Secured · AES-256-GCM</span>
        </div>
        <button
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-red-500/20 transition"
          onClick={logout}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
