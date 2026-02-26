import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import ReceiveModal from '../components/modals/ReceiveModal';

export default function ReceivedFiles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getReceived()); }
    catch { showToast('Failed to load received files', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onReceived = () => {
    load();
    setShowReceive(false);
    showToast('File decrypted & downloaded', 'success');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">📥 Received Files</h2>
          <p className="text-gray-400 text-sm mt-1">Encrypted files shared with you</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition" onClick={() => setShowReceive(true)}>
          + Receive File
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          <p>Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📥</span>
          <h3 className="text-white font-semibold mb-1">No received files</h3>
          <p className="text-gray-400 text-sm">Enter a share code to decrypt files sent to you</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className={`bg-white/[0.03] backdrop-blur-md border rounded-xl p-4 transition ${!item.viewed ? 'border-indigo-500/40 shadow-md shadow-indigo-500/10' : 'border-white/[0.06]'}`}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{item.viewed ? '📄' : '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <strong className="text-white text-sm block truncate">{item.fileName}</strong>
                  <span className="text-gray-500 text-xs">From: {item.sender}</span>
                </div>
                {!item.viewed && (
                  <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold bg-indigo-500 text-white animate-pulse">NEW</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">{item.permission || 'view'}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/15 text-gray-400 border border-gray-500/20">Kyber-512 KEM</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <span className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReceive && <ReceiveModal onClose={() => setShowReceive(false)} onReceived={onReceived} />}
    </div>
  );
}
