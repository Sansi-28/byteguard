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

  return (
    <div className="page shared-page">
      <div className="page-header">
        <div>
          <h2>📤 Shared Files</h2>
          <p>Files you've shared with other researchers</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowShareModal(true)}>+ Share File</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /><p>Loading…</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📤</span>
          <h3>No shared files</h3>
          <p>Share encrypted files using the button above</p>
        </div>
      ) : (
        <div className="card-grid">
          {items.map(item => (
            <div key={item.id} className="glass-card file-card">
              <div className="file-card-header">
                <span className="file-card-icon">📄</span>
                <div className="file-card-info">
                  <strong>{item.fileName}</strong>
                  <span className="text-muted">To: {item.recipient}</span>
                </div>
              </div>
              <div className="file-card-meta">
                <span className="badge">{item.permission}</span>
                <span className="badge badge-accent">Code: {item.shareCode}</span>
              </div>
              <div className="file-card-footer">
                <span className="text-muted">{new Date(item.timestamp).toLocaleDateString()}</span>
                <button className="btn btn-danger btn-sm" onClick={() => revoke(item.id)}>Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} onShared={onShared} />}
    </div>
  );
}
