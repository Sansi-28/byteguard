import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  unwrapAESKeyWithKyber, importAESKey, decryptAES,
  base64ToUint8
} from '../../crypto/pqc';
import { getKyberKeypair } from '../../crypto/keyStore';

/**
 * FileViewer — inline viewer for decrypted files (PDF, images, text).
 * Downloads encrypted blob → decrypts in-browser → renders inline.
 *
 * Props:
 *   fileId      — ID of the file to view
 *   shareCode   — (optional) share code if viewing a shared file
 *   kemPayload  — (optional) base64 KEM payload for shared/group files
 *   iv          — (optional) base64 IV override
 *   fileName    — display name
 *   contentType — MIME type of original file
 *   onClose     — callback to close viewer
 */
export default function FileViewer({ fileId, shareCode, kemPayload, iv: ivProp, fileName, contentType, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Preparing…');
  const { showToast } = useToast();
  const { user } = useAuth();
  const iframeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus('Downloading encrypted file…');
        const res = await api.viewFile(fileId);
        const encryptedBlob = await res.blob();
        const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());

        // Parse IV + ciphertext: first 12 bytes = IV, rest = AES-GCM ciphertext
        const iv = encryptedBytes.slice(0, 12);
        const ciphertext = encryptedBytes.slice(12);

        let aesKeyBytes;

        if (kemPayload) {
          // Shared / group file — need to decapsulate
          setStatus('Decapsulating KEM ciphertext…');
          const kp = await getKyberKeypair(user.researcherId);
          if (!kp) throw new Error('No Kyber keypair found. Please re-login.');

          const kemFull = base64ToUint8(kemPayload);
          const kemCiphertext = kemFull.slice(0, kemFull.length - 32);
          const wrappedKey = kemFull.slice(kemFull.length - 32);
          aesKeyBytes = await unwrapAESKeyWithKyber(kemCiphertext, wrappedKey, kp.privateKey);
        } else {
          // Own file — AES key must be recovered from owner's own KEM
          // For owner viewing their own files, we need to handle this differently
          // The file was encrypted with a key that's not stored on server
          // This viewer is primarily for shared files with KEM payload
          throw new Error('File viewer requires a KEM ciphertext for decryption. Use the Receive flow for shared files.');
        }

        setStatus('Decrypting with AES-256-GCM…');
        const aesKey = await importAESKey(aesKeyBytes);
        const plaintext = await decryptAES(aesKey, ciphertext, iv);

        if (cancelled) return;

        // Create blob URL with proper content type
        const mimeType = contentType || 'application/octet-stream';
        const blob = new Blob([plaintext], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setStatus('');
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileId]);

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'decrypted_file';
    a.click();
    showToast('File downloaded', 'success');
  };

  const isPDF = contentType === 'application/pdf';
  const isImage = contentType?.startsWith('image/');
  const isText = contentType?.startsWith('text/') || contentType === 'application/json';

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/95 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">📄</span>
          <div className="min-w-0">
            <h3 className="text-white text-sm font-medium truncate">{fileName || 'File Viewer'}</h3>
            <span className="text-gray-500 text-xs">{contentType || 'unknown type'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {blobUrl && (
            <button className="px-3 py-1.5 text-xs bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/25 transition" onClick={download}>
              ⬇️ Download
            </button>
          )}
          <button className="px-3 py-1.5 text-xs border border-gray-700 text-gray-400 rounded-lg hover:border-red-500 hover:text-red-400 transition" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <div className="w-12 h-12 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm">{status}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <span className="text-4xl">❌</span>
            <p className="text-red-400 text-sm">{error}</p>
            <button className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:text-white transition" onClick={onClose}>
              Close
            </button>
          </div>
        ) : blobUrl && isPDF ? (
          <embed
            ref={iframeRef}
            src={blobUrl}
            type="application/pdf"
            className="w-full h-full rounded-lg border border-gray-800"
          />
        ) : blobUrl && isImage ? (
          <img src={blobUrl} alt={fileName} className="max-w-full max-h-full rounded-lg shadow-2xl" />
        ) : blobUrl && isText ? (
          <TextViewer url={blobUrl} />
        ) : blobUrl ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">📄</span>
            <p className="text-gray-400 text-sm">Preview not available for this file type</p>
            <button className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition" onClick={download}>
              ⬇️ Download File
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}


function TextViewer({ url }) {
  const [text, setText] = useState('');

  useEffect(() => {
    fetch(url).then(r => r.text()).then(setText).catch(() => setText('Failed to load text content'));
  }, [url]);

  return (
    <pre className="w-full max-w-4xl max-h-full overflow-auto bg-gray-950 border border-gray-800 rounded-lg p-6 text-sm text-gray-300 font-mono whitespace-pre-wrap">
      {text}
    </pre>
  );
}
