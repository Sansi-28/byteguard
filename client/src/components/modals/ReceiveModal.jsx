import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export default function ReceiveModal({ onClose, onReceived }) {
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!shareCode.trim()) {
      showToast('Enter a share code', 'warning');
      return;
    }
    setLoading(true);
    try {
      const result = await api.receiveFile({ shareCode: shareCode.trim().toUpperCase() });
      onReceived(result);
    } catch (err) {
      showToast(err.message || 'Failed to receive', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Receive File</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="modal-body">
          <div className="input-group">
            <label>Share Code</label>
            <input
              type="text"
              value={shareCode}
              onChange={e => setShareCode(e.target.value)}
              placeholder="Enter share code (e.g., A1B2C3)"
              autoFocus
              className="share-code-input"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Receiving…' : 'Receive File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
