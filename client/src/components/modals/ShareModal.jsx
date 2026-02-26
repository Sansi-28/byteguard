import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  generateAESKey, exportAESKey, encryptAES, sha256Hex,
  wrapAESKeyWithKyber, uint8ToBase64, base64ToUint8
} from '../../crypto/pqc';
import { getKyberKeypair } from '../../crypto/keyStore';

export default function ShareModal({ onClose, onShared }) {
  const [myFiles, setMyFiles] = useState([]);
  const [fileId, setFileId] = useState('');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [permission, setPermission] = useState('download');
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    api.myFiles().then(setMyFiles).catch(() => {});
  }, []);

  // Search for recipients
  useEffect(() => {
    if (recipientQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchUsers(recipientQuery.trim()).then(setSearchResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [recipientQuery]);

  const submit = async (e) => {
    e.preventDefault();
    if (!fileId || !selectedRecipient) {
      showToast('Select a file and recipient', 'warning');
      return;
    }
    if (!selectedRecipient.hasKyberKey) {
      showToast('Recipient has no Kyber public key', 'error');
      return;
    }

    setSending(true);
    try {
      // 1. Fetch recipient's Kyber public key
      const { kyberPublicKey: recipPKb64 } = await api.getPublicKey(selectedRecipient.researcherId);
      const recipientPK = base64ToUint8(recipPKb64);

      // 2. Generate a fresh AES-256 key for this share
      const aesKey = await generateAESKey();
      const aesKeyBytes = await exportAESKey(aesKey);

      // 3. Wrap the AES key with Kyber KEM
      const { kemCiphertext, wrappedKey } = await wrapAESKeyWithKyber(aesKeyBytes, recipientPK);

      // 4. Combine kemCiphertext + wrappedKey into a single base64 payload
      const combined = new Uint8Array(kemCiphertext.length + wrappedKey.length);
      combined.set(kemCiphertext, 0);
      combined.set(wrappedKey, kemCiphertext.length);
      const kemPayloadB64 = uint8ToBase64(combined);

      // 5. Share on server
      const result = await api.shareFile({
        fileId: Number(fileId),
        recipientId: selectedRecipient.researcherId,
        kemCiphertext: kemPayloadB64,
        permission,
      });

      showToast(`File shared! Code: ${result.shareCode}`, 'success');
      onShared(result);
    } catch (err) {
      showToast(err.message || 'Sharing failed', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">📤 Share Encrypted File</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          {/* File select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">File</label>
            <select
              value={fileId}
              onChange={e => setFileId(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            >
              <option value="">Select an encrypted file…</option>
              {myFiles.map(f => (
                <option key={f.id} value={f.id}>{f.fileName}</option>
              ))}
            </select>
          </div>

          {/* Recipient search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Recipient</label>
            {selectedRecipient ? (
              <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-2">
                <div>
                  <span className="text-indigo-400 text-sm font-medium">{selectedRecipient.researcherId}</span>
                  {selectedRecipient.hasKyberKey && (
                    <span className="ml-2 text-xs text-emerald-400">🔑 Kyber key</span>
                  )}
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white text-sm"
                  onClick={() => { setSelectedRecipient(null); setRecipientQuery(''); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={recipientQuery}
                  onChange={e => setRecipientQuery(e.target.value)}
                  placeholder="Search researcher ID..."
                  className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 outline-none focus:border-indigo-500"
                />
                {searchResults.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-indigo-500/15 hover:text-indigo-400 transition flex justify-between"
                        onClick={() => { setSelectedRecipient(u); setSearchResults([]); }}
                      >
                        <span>{u.researcherId}</span>
                        {u.hasKyberKey && <span className="text-xs text-emerald-400">🔑</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Permission */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Permission</label>
            <select
              value={permission}
              onChange={e => setPermission(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            >
              <option value="view">View Only</option>
              <option value="download">Download</option>
              <option value="full">Full Access</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
              disabled={sending}
            >
              {sending ? 'Encrypting & Sharing…' : '🔐 Share with Kyber KEM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
