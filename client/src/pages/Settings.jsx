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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
      <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
      <p>Loading settings…</p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">⚙️ Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Configure encryption parameters and preferences</p>
        {saving && <span className="text-indigo-400 text-xs mt-1 inline-block animate-pulse">Saving…</span>}
      </div>

      {/* Encryption Settings */}
      <section className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">🔐 Encryption Configuration</h3>
        <div className="space-y-4">
          <SettingRow label="Algorithm" desc="Primary encryption algorithm">
            <Select value={settings.algorithm} onChange={v => update({ algorithm: v })} options={['AES-256-GCM', 'AES-128-GCM', 'ChaCha20-Poly1305']} />
          </SettingRow>
          <SettingRow label="Kyber Key Size" desc="Post-quantum KEM parameter set">
            <Select value={settings.keySize} onChange={v => update({ keySize: v })} options={[
              { value: '512', label: 'ML-KEM-512 (128-bit PQ)' },
              { value: '768', label: 'ML-KEM-768 (192-bit PQ)' },
              { value: '1024', label: 'ML-KEM-1024 (256-bit PQ)' },
            ]} />
          </SettingRow>
          <SettingRow label="Auto-Delete Originals" desc="Remove plaintext after encryption">
            <ToggleSwitch value={settings.autoDelete} onChange={v => update({ autoDelete: v })} />
          </SettingRow>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">🛡️ Security</h3>
        <div className="space-y-4">
          <SettingRow label="Session Timeout" desc="Auto-lock after inactivity">
            <Select value={settings.sessionTimeout} onChange={v => update({ sessionTimeout: v })} options={[
              { value: '15', label: '15 min' },
              { value: '30', label: '30 min' },
              { value: '60', label: '60 min' },
              { value: '120', label: '120 min' },
            ]} />
          </SettingRow>
          <SettingRow label="Two-Factor Authentication" desc="Require 2FA for login">
            <ToggleSwitch value={settings.twoFactor} onChange={v => update({ twoFactor: v })} />
          </SettingRow>
          <SettingRow label="Audit Logging" desc="Log all encryption operations">
            <ToggleSwitch value={settings.auditLogging} onChange={v => update({ auditLogging: v })} />
          </SettingRow>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">🎨 Appearance</h3>
        <div className="space-y-4">
          <SettingRow label="Animations" desc="Enable smooth transitions">
            <ToggleSwitch value={settings.animations} onChange={v => update({ animations: v })} />
          </SettingRow>
          <SettingRow label="High Contrast" desc="Enhanced visibility mode">
            <ToggleSwitch value={settings.highContrast} onChange={v => update({ highContrast: v })} />
          </SettingRow>
        </div>
      </section>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
      <div>
        <label className="text-white text-sm font-medium">{label}</label>
        <span className="block text-gray-500 text-xs mt-0.5">{desc}</span>
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
    >
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-indigo-600' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  );
}
