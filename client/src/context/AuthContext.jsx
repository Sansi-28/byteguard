import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { generateKyberKeypair, uint8ToBase64 } from '../crypto/pqc';
import { storeKyberKeypair, getKyberKeypair, clearKeyStore } from '../crypto/keyStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) { setLoading(false); return; }

    api.getSession()
      .then(data => setUser(data.user))
      .catch(() => api.clearToken())
      .finally(() => setLoading(false));
  }, []);

  /**
   * Generate Kyber keypair, store private key in IndexedDB,
   * and return the base64-encoded public key for the server.
   */
  const ensureKyberKeys = async (researcherId) => {
    let kp = await getKyberKeypair(researcherId);
    if (!kp) {
      kp = await generateKyberKeypair();
      await storeKyberKeypair(researcherId, kp.publicKey, kp.privateKey);
    }
    return uint8ToBase64(kp.publicKey);
  };

  const register = async (researcherId, password) => {
    const pubKeyB64 = await ensureKyberKeys(researcherId);
    const data = await api.register(researcherId, password, pubKeyB64);
    api.setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (researcherId, password) => {
    const data = await api.login(researcherId, password);
    api.setToken(data.token);
    setUser(data.user);

    // Ensure Kyber keys exist locally and push pubkey if needed
    const pubKeyB64 = await ensureKyberKeys(researcherId);
    if (!data.user.hasKyberKey) {
      try { await api.updateKyberKey(pubKeyB64); } catch { /* non-critical */ }
    }

    return data.user;
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    api.clearToken();
    setUser(null);
    // Don't clear key store on logout to preserve keys across sessions
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-400 gap-4">
        <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        <p>Initializing secure vault...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
