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
    catch { showToast('Failed to load history', 'error'); }
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
    const header = 'Name,Original Size,Encrypted Size,Type,Operation,Timestamp\n';
    const rows = items.map(i =>
      `"${i.name}",${i.originalSize},${i.encryptedSize},${i.type},${i.operation},${i.timestamp}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'encryption-history.csv';
    a.click();
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
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">📋 File History</h2>
          <p className="text-gray-400 text-sm mt-1">Record of all encryption operations</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs border border-gray-700 text-gray-400 rounded-lg hover:border-indigo-500 hover:text-indigo-400 transition disabled:opacity-50" onClick={exportCSV} disabled={!items.length}>
            📊 Export
          </button>
          <button className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50" onClick={clearAll} disabled={!items.length}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          <p>Loading history…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📋</span>
          <h3 className="text-white font-semibold mb-1">No encryption history</h3>
          <p className="text-gray-400 text-sm">Files you encrypt will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800">File Name</th>
                <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800 hidden md:table-cell">Original</th>
                <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800 hidden md:table-cell">Encrypted</th>
                <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800 hidden md:table-cell">Operation</th>
                <th className="text-left px-3 py-2 text-[0.65rem] text-gray-500 uppercase tracking-wider border-b border-gray-800">Date</th>
                <th className="px-3 py-2 border-b border-gray-800"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2 border-b border-gray-800 max-w-[200px] truncate text-white">{item.name}</td>
                  <td className="px-3 py-2 border-b border-gray-800 text-gray-400 hidden md:table-cell">{fmtSize(item.originalSize)}</td>
                  <td className="px-3 py-2 border-b border-gray-800 text-gray-400 hidden md:table-cell">{fmtSize(item.encryptedSize)}</td>
                  <td className="px-3 py-2 border-b border-gray-800 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      {item.operation}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-gray-800 text-gray-500 text-xs whitespace-nowrap">{fmtDate(item.timestamp)}</td>
                  <td className="px-3 py-2 border-b border-gray-800">
                    <button className="text-gray-500 hover:text-red-400 transition" onClick={() => deleteItem(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
