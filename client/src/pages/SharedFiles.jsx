import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import ShareModal from '../components/modals/ShareModal';

export default function SharedFiles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getShared()); }
    catch { showToast('Failed to load shared files', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id) => {
    try {
      await api.revokeShare(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Access revoked', 'success');
    } catch { showToast('Failed to revoke', 'error'); }
  };

  const onShared = (item) => {
    setItems(prev => [item, ...prev]);
    setShowShareModal(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast('Share code copied', 'success');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">📤 Shared Files</h2>
          <p className="text-gray-400 text-sm mt-1">Files you've shared with other researchers</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition" onClick={() => setShowShareModal(true)}>
          + Share File
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          <p>Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📤</span>
          <h3 className="text-white font-semibold mb-1">No shared files</h3>
          <p className="text-gray-400 text-sm">Share encrypted files using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-4 hover:border-indigo-500/30 transition group">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">📄</span>
                <div className="min-w-0 flex-1">
                  <strong className="text-white text-sm block truncate">{item.fileName}</strong>
                  <span className="text-gray-500 text-xs">To: {item.recipient}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">{item.permission || 'view'}</span>
                <button
                  className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                  onClick={() => copyCode(item.shareCode)}
                  title="Click to copy"
                >
                  🔑 {item.shareCode}
                </button>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <span className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
                <button className="px-3 py-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition" onClick={() => revoke(item.id)}>
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} onShared={onShared} />}
    </div>
  );
}
