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

  if (loading) return <div className="loading-state"><div className="loading-spinner" /><p>Loading…</p></div>;

  return (
    <div className="page access-page">
      <div className="page-header">
        <h2>🔑 Access Control</h2>
        <p>Manage file permissions and access rights</p>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Active Shares</span>
          <span className="stat-value">{shared.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Received</span>
          <span className="stat-value">{received.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unread</span>
          <span className="stat-value">{received.filter(r => !r.viewed).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Security Level</span>
          <span className="stat-value">PQC-5</span>
        </div>
      </div>

      {/* Active permissions */}
      <section className="glass-card">
        <h3>Active Permissions</h3>
        {shared.length === 0 ? (
          <p className="text-muted" style={{ padding: '1rem 0' }}>No active shares</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Recipient</th>
                  <th>Permission</th>
                  <th className="hide-mobile">Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shared.map(s => (
                  <tr key={s.id}>
                    <td className="cell-name">{s.fileName}</td>
                    <td>{s.recipient}</td>
                    <td><span className="badge">{s.permission}</span></td>
                    <td className="hide-mobile"><code>{s.shareCode}</code></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => revoke(s.id)}>Revoke</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Security info */}
      <section className="glass-card">
        <h3>Security Protocols</h3>
        <div className="meta-grid">
          <div><span className="meta-label">Encryption</span><span>AES-256-GCM</span></div>
          <div><span className="meta-label">Key Exchange</span><span>CRYSTALS-Kyber-1024</span></div>
          <div><span className="meta-label">Signature</span><span>CRYSTALS-Dilithium</span></div>
          <div><span className="meta-label">Hash</span><span>SHA-3-512</span></div>
        </div>
      </section>
    </div>
  );
}
