import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  unwrapAESKeyWithKyber, importAESKey, decryptAES,
  base64ToUint8
} from '../../crypto/pqc';
import { getKyberKeypair } from '../../crypto/keyStore';

export default function ReceiveModal({ onClose, onReceived }) {
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const { showToast } = useToast();
  const { user } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    if (!shareCode.trim()) {
      showToast('Enter a share code', 'warning');
      return;
    }
    setLoading(true);
    try {
      // 1. Get share details (includes kemCiphertext, fileId, iv)
      setStatus('Fetching share details…');
      const share = await api.getShareByCode(shareCode.trim().toUpperCase());

      // 2. Get our Kyber private key from IndexedDB
      setStatus('Loading Kyber private key…');
      const kp = await getKyberKeypair(user.researcherId);
      if (!kp) {
        throw new Error('No Kyber keypair found. Please re-login to generate keys.');
      }

      // 3. Parse the KEM payload (kemCiphertext + wrappedKey)
      setStatus('Decapsulating KEM ciphertext…');
      const kemPayload = base64ToUint8(share.kemCiphertext);
      // Kyber-512 ciphertext is 768 bytes, wrappedKey is 32 bytes
      const kemCiphertext = kemPayload.slice(0, kemPayload.length - 32);
      const wrappedKey = kemPayload.slice(kemPayload.length - 32);

      // 4. Unwrap the AES key using Kyber decapsulation
      const aesKeyBytes = await unwrapAESKeyWithKyber(kemCiphertext, wrappedKey, kp.privateKey);

      // 5. Download the encrypted file blob
      setStatus('Downloading encrypted file…');
      const res = await api.downloadFile(share.fileId);
      const encryptedBlob = await res.blob();
      const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());

      // 6. Parse IV + ciphertext from the blob
      // Our upload format: first 12 bytes = IV, rest = AES-GCM ciphertext
      setStatus('Decrypting with AES-256-GCM…');
      const iv = encryptedBytes.slice(0, 12);
      const ciphertext = encryptedBytes.slice(12);

      // 7. Decrypt
      const aesKey = await importAESKey(aesKeyBytes);
      const plaintext = await decryptAES(aesKey, ciphertext, iv);

      // 8. Trigger download
      setStatus('Preparing download…');
      const blob = new Blob([plaintext]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = share.fileName || 'decrypted_file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('File decrypted and downloaded!', 'success');
      onReceived(share);
    } catch (err) {
      showToast(err.message || 'Failed to receive/decrypt', 'error');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">📥 Receive & Decrypt File</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Share Code</label>
            <input
              type="text"
              value={shareCode}
              onChange={e => setShareCode(e.target.value)}
              placeholder="Enter share code (e.g., A1B2C3D4)"
              autoFocus
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-center font-mono text-lg tracking-widest uppercase placeholder-gray-500 outline-none focus:border-indigo-500"
            />
          </div>

          {status && (
            <div className="flex items-center gap-2 text-xs text-indigo-400">
              <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              {status}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Decrypting…' : '🔓 Receive & Decrypt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
