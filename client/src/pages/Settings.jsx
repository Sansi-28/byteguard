import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

const defaultSettings = {
  algorithm: 'AES-256-GCM', keySize: '512', autoDelete: false,
  animations: true, highContrast: false, sessionTimeout: '30',
  twoFactor: false, auditLogging: true
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.getSettings()
      .then(s => setSettings({ ...defaultSettings, ...s }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      await api.updateSettings(next);
      showToast('Settings saved', 'success');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-state"><div className="loading-spinner" /><p>Loading settings…</p></div>;

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h2>⚙️ Settings</h2>
        <p>Configure encryption parameters and preferences</p>
      </div>

      {/* Encryption Settings */}
      <section className="settings-section glass-card">
        <h3>🔐 Encryption Configuration</h3>
        <div className="settings-grid">
          <div className="setting-row">
            <div className="setting-info">
              <label>Algorithm</label>
              <span className="setting-desc">Primary encryption algorithm</span>
            </div>
            <select value={settings.algorithm} onChange={e => update({ algorithm: e.target.value })}>
              <option>AES-256-GCM</option>
              <option>AES-128-GCM</option>
              <option>ChaCha20-Poly1305</option>
            </select>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <label>Key Size</label>
              <span className="setting-desc">Post-quantum key size in bits</span>
            </div>
            <select value={settings.keySize} onChange={e => update({ keySize: e.target.value })}>
              <option value="256">256 bits</option>
              <option value="512">512 bits</option>
              <option value="1024">1024 bits</option>
            </select>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <label>Auto-Delete Originals</label>
              <span className="setting-desc">Remove original after encryption</span>
            </div>
            <ToggleSwitch value={settings.autoDelete} onChange={v => update({ autoDelete: v })} />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="settings-section glass-card">
        <h3>🛡️ Security</h3>
        <div className="settings-grid">
          <div className="setting-row">
            <div className="setting-info">
              <label>Session Timeout</label>
              <span className="setting-desc">Auto-lock after inactivity</span>
            </div>
            <select value={settings.sessionTimeout} onChange={e => update({ sessionTimeout: e.target.value })}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <label>Two-Factor Authentication</label>
              <span className="setting-desc">Require 2FA for login</span>
            </div>
            <ToggleSwitch value={settings.twoFactor} onChange={v => update({ twoFactor: v })} />
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <label>Audit Logging</label>
              <span className="setting-desc">Log all encryption operations</span>
            </div>
            <ToggleSwitch value={settings.auditLogging} onChange={v => update({ auditLogging: v })} />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="settings-section glass-card">
        <h3>🎨 Appearance</h3>
        <div className="settings-grid">
          <div className="setting-row">
            <div className="setting-info">
              <label>Animations</label>
              <span className="setting-desc">Enable smooth transitions</span>
            </div>
            <ToggleSwitch value={settings.animations} onChange={v => update({ animations: v })} />
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <label>High Contrast</label>
              <span className="setting-desc">Enhanced visibility mode</span>
            </div>
            <ToggleSwitch value={settings.highContrast} onChange={v => update({ highContrast: v })} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      className={`toggle-switch ${value ? 'on' : 'off'}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
