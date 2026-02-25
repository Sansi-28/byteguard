import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export default function ShareModal({ onClose, onShared }) {
  const [history, setHistory] = useState([]);
  const [fileId, setFileId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [permission, setPermission] = useState('view');
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.getHistory().then(setHistory).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!fileId || !recipient.trim()) {
      showToast('Select a file and enter a recipient', 'warning');
      return;
    }
    setSending(true);
    try {
      const selected = history.find(h => String(h.id) === String(fileId));
      const result = await api.shareFile({
        fileId: Number(fileId),
        fileName: selected?.name || 'File',
        recipient: recipient.trim(),
        permission
      });
      showToast(`File shared! Code: ${result.shareCode}`, 'success');
      onShared(result);
    } catch (err) {
      showToast(err.message || 'Sharing failed', 'error');
    } finally { setSending(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📤 Share File</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="modal-body">
          <div className="input-group">
            <label>File</label>
            <select value={fileId} onChange={e => setFileId(e.target.value)}>
              <option value="">Select a file…</option>
              {history.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Recipient ID</label>
            <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Enter researcher ID" />
          </div>
          <div className="input-group">
            <label>Permission</label>
            <select value={permission} onChange={e => setPermission(e.target.value)}>
              <option value="view">View Only</option>
              <option value="download">Download</option>
              <option value="full">Full Access</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Sharing…' : 'Share File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
