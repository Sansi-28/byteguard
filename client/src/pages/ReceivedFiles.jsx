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

  const markViewed = async (id) => {
    try {
      await api.markViewed(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, viewed: true } : i));
    } catch { /* ignore */ }
  };

  const onReceived = (item) => {
    setItems(prev => [item, ...prev]);
    setShowReceive(false);
    showToast('File received successfully', 'success');
  };

  return (
    <div className="page received-page">
      <div className="page-header">
        <div>
          <h2>📥 Received Files</h2>
          <p>Encrypted files shared with you</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowReceive(true)}>+ Receive File</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /><p>Loading…</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📥</span>
          <h3>No received files</h3>
          <p>Files shared with you will appear here</p>
        </div>
      ) : (
        <div className="card-grid">
          {items.map(item => (
            <div key={item.id} className={`glass-card file-card ${!item.viewed ? 'unread' : ''}`}>
              <div className="file-card-header">
                <span className="file-card-icon">{item.viewed ? '📄' : '🔔'}</span>
                <div className="file-card-info">
                  <strong>{item.fileName}</strong>
                  <span className="text-muted">From: {item.sender}</span>
                </div>
              </div>
              <div className="file-card-meta">
                <span className="badge">{item.permission}</span>
                {!item.viewed && <span className="badge badge-new">New</span>}
              </div>
              <div className="file-card-footer">
                <span className="text-muted">{new Date(item.timestamp).toLocaleDateString()}</span>
                {!item.viewed && (
                  <button className="btn btn-primary btn-sm" onClick={() => markViewed(item.id)}>Mark Read</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showReceive && <ReceiveModal onClose={() => setShowReceive(false)} onReceived={onReceived} />}
    </div>
  );
}
