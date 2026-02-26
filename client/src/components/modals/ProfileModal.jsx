import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Researcher Profile</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="w-18 h-18 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
            {user?.researcherId?.charAt(0)?.toUpperCase() || 'R'}
          </div>

          <div className="flex flex-col gap-3">
            {[
              ['Researcher ID', user?.researcherId || '—'],
              ['Role', user?.role || 'Researcher'],
              ['Kyber-512 Key', user?.hasKyberKey ? '✅ Registered' : '❌ Not set'],
              ['Account Created', user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800 text-sm last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="text-gray-500">Security Clearance</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                PQC Level 5
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-800">
          <button className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition" onClick={onClose}>
            Close
          </button>
          <button className="px-4 py-2 rounded-lg text-sm bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
