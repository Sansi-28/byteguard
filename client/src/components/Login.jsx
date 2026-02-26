import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [researcherId, setResearcherId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!researcherId.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(researcherId.trim(), password.trim());
        showToast('Account created · Kyber-512 keypair generated', 'success');
      } else {
        await login(researcherId.trim(), password.trim());
        showToast('Secure session established', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.06),transparent_50%)]" />
      </div>

      <div className="relative z-10 bg-gray-900/80 border border-gray-700/50 rounded-xl p-8 w-full max-w-md backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-white">ByteGuard</h1>
          <p className="text-gray-400 text-sm mt-1">Post-Quantum Secure Data Sharing</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="researcherId" className="text-sm font-medium text-gray-400">
              Researcher ID
            </label>
            <input
              id="researcherId"
              type="text"
              value={researcherId}
              onChange={e => setResearcherId(e.target.value)}
              placeholder="Enter your researcher ID"
              autoFocus
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isRegister ? 'Create a secure password (6+ chars)' : 'Enter your password'}
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            disabled={loading}
          >
            {loading
              ? (isRegister ? 'Creating Account...' : 'Authenticating...')
              : (isRegister ? 'Create Account & Generate Keys' : 'Initialize Secure Session')
            }
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              AES-256-GCM
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              CRYSTALS-Kyber-512
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              Post-Quantum
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
