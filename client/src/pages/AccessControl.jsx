import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export default function AccessControl() {
  const [shared, setShared] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([api.getShared(), api.getReceived()])
      .then(([s, r]) => { setShared(s); setReceived(r); })
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const revoke = async (id) => {
    try {
      await api.revokeShare(id);
      setShared(prev => prev.filter(i => i.id !== id));
      showToast('Access revoked', 'success');
    } catch { showToast('Failed to revoke', 'error'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast('Share code copied', 'success');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
      <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
      <p>Loading…</p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">🔑 Access Control</h2>
        <p className="text-gray-400 text-sm mt-1">Manage file permissions and access rights</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Shares', value: shared.length, color: 'indigo' },
          { label: 'Received', value: received.length, color: 'emerald' },
          { label: 'Unread', value: received.filter(r => !r.viewed).length, color: 'amber' },
          { label: 'Security', value: 'PQC', color: 'violet' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-4 text-center">
            <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</span>
            <span className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Active permissions */}
      <section className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">Active Permissions</h3>
        {shared.length === 0 ? (
          <p className="text-gray-500 py-4">No active shares</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800">File</th>
                  <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800">Recipient</th>
                  <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800 hidden md:table-cell">Code</th>
                  <th className="px-3 py-2 border-b border-gray-800"></th>
                </tr>
              </thead>
              <tbody>
                {shared.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2 border-b border-gray-800 max-w-[160px] truncate text-white">{s.fileName}</td>
                    <td className="px-3 py-2 border-b border-gray-800 text-gray-400">{s.recipient}</td>
                    <td className="px-3 py-2 border-b border-gray-800 hidden md:table-cell">
                      <button className="font-mono text-xs text-emerald-400 hover:underline" onClick={() => copyCode(s.shareCode)}>
                        {s.shareCode}
                      </button>
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800 text-right">
                      <button className="px-3 py-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition" onClick={() => revoke(s.id)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Security info */}
      <section className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Security Protocols</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: 'Symmetric Cipher', value: 'AES-256-GCM', icon: '🔐' },
            { label: 'Key Encapsulation', value: 'CRYSTALS-Kyber-512 (ML-KEM)', icon: '🔑' },
            { label: 'Hash Function', value: 'SHA-256 (WebCrypto)', icon: '🧬' },
            { label: 'Key Storage', value: 'Browser IndexedDB (local)', icon: '💾' },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
              <span className="text-xl">{p.icon}</span>
              <div>
                <span className="block text-gray-500 text-xs">{p.label}</span>
                <span className="text-white text-sm font-medium">{p.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
