import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [researcherId, setResearcherId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!researcherId.trim() || !accessKey.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(researcherId.trim(), accessKey.trim());
      showToast('Secure session established', 'success');
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1>Half Byte</h1>
          <p className="login-subtitle">Post-Quantum Research Vault</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="researcherId">Researcher ID</label>
            <input
              id="researcherId"
              type="text"
              value={researcherId}
              onChange={e => setResearcherId(e.target.value)}
              placeholder="Enter your researcher ID"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="accessKey">Access Key</label>
            <input
              id="accessKey"
              type="password"
              value={accessKey}
              onChange={e => setAccessKey(e.target.value)}
              placeholder="Enter your quantum access key"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Authenticating...' : 'Initialize Secure Session'}
          </button>
        </form>

        <div className="login-footer">
          <div className="security-badges">
            <span className="badge">AES-256-GCM</span>
            <span className="badge">CRYSTALS-Kyber</span>
            <span className="badge">Post-Quantum</span>
          </div>
        </div>
      </div>
    </div>
  );
}
