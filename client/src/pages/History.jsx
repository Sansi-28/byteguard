import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getHistory()); }
    catch (e) { showToast('Failed to load history', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteItem = async (id) => {
    try {
      await api.deleteHistory(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Entry removed', 'success');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const clearAll = async () => {
    try {
      await api.clearHistory();
      setItems([]);
      showToast('History cleared', 'success');
    } catch { showToast('Failed to clear', 'error'); }
  };

  const exportCSV = () => {
    if (!items.length) return;
    const header = 'Name,Original Size,Encrypted Size,Type,Timestamp\n';
    const rows = items.map(i => `"${i.name}",${i.originalSize},${i.encryptedSize},${i.type},${i.timestamp}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'encryption-history.csv'; a.click();
    URL.revokeObjectURL(a.href);
    showToast('History exported', 'success');
  };

  const fmtSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  const fmtDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="page history-page">
      <div className="page-header">
        <div>
          <h2>📋 File History</h2>
          <p>Record of all encryption operations</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={exportCSV} disabled={!items.length}>📊 Export</button>
          <button className="btn btn-danger btn-sm" onClick={clearAll} disabled={!items.length}>🗑️ Clear All</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /><p>Loading history…</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No encryption history</h3>
          <p>Files you encrypt will appear here</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th className="hide-mobile">Original</th>
                <th className="hide-mobile">Encrypted</th>
                <th className="hide-mobile">Type</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="cell-name" title={item.name}>{item.name}</td>
                  <td className="hide-mobile">{fmtSize(item.originalSize)}</td>
                  <td className="hide-mobile">{fmtSize(item.encryptedSize)}</td>
                  <td className="hide-mobile"><span className="badge">{item.type}</span></td>
                  <td className="cell-date">{fmtDate(item.timestamp)}</td>
                  <td><button className="btn-icon" title="Delete" onClick={() => deleteItem(item.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
