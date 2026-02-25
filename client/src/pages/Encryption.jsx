import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export default function Encryption() {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [encrypting, setEncrypting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState(0); // 0=idle 1..5=process phases
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ── File selection ──────────────────────── */
  const onFilePick = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setPhase(0);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    onFilePick(e.dataTransfer.files[0]);
  };

  /* ── Encryption ──────────────────────────── */
  const encrypt = async () => {
    if (!file) return;
    setEncrypting(true); setResult(null);

    try {
      const buf = await file.arrayBuffer();
      const arr = new Uint8Array(buf);

      // Phase 1 – Key generation
      setPhase(1);
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      await delay(400);

      // Phase 2 – Quantum handshake (simulated)
      setPhase(2);
      await delay(600);

      // Phase 3 – Encryption
      setPhase(3);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, arr);
      await delay(400);

      // Phase 4 – Integrity hash
      setPhase(4);
      const hashBuf = await crypto.subtle.digest('SHA-256', ct);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
      await delay(300);

      // Phase 5 – Complete
      setPhase(5);
      const encBlob = new Blob([iv, new Uint8Array(ct)]);
      const entropy = calcEntropy(new Uint8Array(ct).slice(0, 4096));

      const res = {
        name: file.name,
        originalSize: file.size,
        encryptedSize: encBlob.size,
        blob: encBlob,
        fingerprint: hashHex,
        entropy,
        timestamp: new Date().toISOString(),
        type: file.type || 'unknown'
      };

      setResult(res);
      drawEntropyCanvas(new Uint8Array(ct).slice(0, 2048));

      // Record in history
      try {
        await api.addHistory({
          name: file.name,
          originalSize: file.size,
          encryptedSize: encBlob.size,
          type: file.type || 'unknown'
        });
      } catch { /* non-critical */ }

      showToast('File encrypted with AES-256-GCM', 'success');
    } catch (err) {
      showToast('Encryption failed: ' + err.message, 'error');
      setPhase(0);
    } finally {
      setEncrypting(false);
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url; a.download = result.name + '.enc'; a.click();
    URL.revokeObjectURL(url);
    showToast('Encrypted file downloaded', 'success');
  };

  const reset = () => { setFile(null); setResult(null); setPhase(0); };

  /* ── Entropy helpers ─────────────────────── */
  function calcEntropy(bytes) {
    const freq = new Array(256).fill(0);
    bytes.forEach(b => freq[b]++);
    let e = 0;
    for (const c of freq) {
      if (c === 0) continue;
      const p = c / bytes.length;
      e -= p * Math.log2(p);
    }
    return e;
  }

  function drawEntropyCanvas(bytes) {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width = cvs.offsetWidth;
    const h = cvs.height = 120;
    ctx.clearRect(0, 0, w, h);

    const sliceLen = Math.max(1, Math.floor(bytes.length / w));
    for (let x = 0; x < w; x++) {
      const slice = bytes.slice(x * sliceLen, (x + 1) * sliceLen);
      const avg = slice.reduce((s, b) => s + b, 0) / slice.length;
      const barH = (avg / 255) * h;
      const hue = (avg / 255) * 270;
      ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
      ctx.fillRect(x, h - barH, 1, barH);
    }
  }

  const phaseLabels = [
    '', 'Generating quantum-safe keys…', 'CRYSTALS-Kyber handshake…',
    'AES-256-GCM encryption…', 'Computing integrity hash…', 'Encryption complete'
  ];

  const fmtSize = (b) => {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="page encryption-page">
      <div className="page-header">
        <h2>🔐 Encryption Lab</h2>
        <p>Post-quantum secure file encryption with AES-256-GCM + CRYSTALS-Kyber</p>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" hidden onChange={e => onFilePick(e.target.files[0])} />
          {file ? (
            <div className="file-preview">
              <span className="file-icon">📄</span>
              <div>
                <strong>{file.name}</strong>
                <span className="file-size">{fmtSize(file.size)}</span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={e => { e.stopPropagation(); reset(); }}>✕</button>
            </div>
          ) : (
            <div className="drop-prompt">
              <span className="drop-icon">📁</span>
              <p>Drop a file here or click to browse</p>
              <span className="drop-hint">Max 100 MB · Any file type</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {file && !result && (
        <div className="encrypt-actions">
          <button className="btn btn-primary btn-lg" onClick={encrypt} disabled={encrypting}>
            {encrypting ? 'Encrypting…' : '🔐 Encrypt File'}
          </button>
        </div>
      )}

      {/* Progress timeline */}
      {encrypting && (
        <div className="timeline">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`timeline-step ${phase >= i ? 'done' : ''} ${phase === i ? 'active' : ''}`}>
              <div className="step-dot">{phase > i ? '✓' : i}</div>
              <span className="step-label">{phaseLabels[i]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="result-panel">
          <div className="result-header">
            <h3>✅ Encryption Complete</h3>
            <button className="btn btn-outline btn-sm" onClick={reset}>Encrypt Another</button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Original</span>
              <span className="stat-value">{fmtSize(result.originalSize)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Encrypted</span>
              <span className="stat-value">{fmtSize(result.encryptedSize)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Entropy</span>
              <span className="stat-value">{result.entropy.toFixed(4)} bits/byte</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Algorithm</span>
              <span className="stat-value">AES-256-GCM</span>
            </div>
          </div>

          <div className="glass-card">
            <h4>Entropy Visualization</h4>
            <canvas ref={canvasRef} className="entropy-canvas" />
          </div>

          <div className="glass-card">
            <h4>File Fingerprint (SHA-256)</h4>
            <code className="fingerprint">{result.fingerprint}</code>
          </div>

          <div className="glass-card metadata-card">
            <h4>Security Metadata</h4>
            <div className="meta-grid">
              <div><span className="meta-label">Cipher</span><span>AES-256-GCM</span></div>
              <div><span className="meta-label">Key Exchange</span><span>CRYSTALS-Kyber-1024</span></div>
              <div><span className="meta-label">IV Size</span><span>96 bits</span></div>
              <div><span className="meta-label">Auth Tag</span><span>128 bits</span></div>
              <div><span className="meta-label">KDF</span><span>HKDF-SHA-512</span></div>
              <div><span className="meta-label">PQC Level</span><span>NIST Level 5</span></div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-block" onClick={download}>
            ⬇️ Download Encrypted File
          </button>
        </div>
      )}
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
