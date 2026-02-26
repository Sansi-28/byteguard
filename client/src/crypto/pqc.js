/**
 * ByteGuard — Client-Side Cryptography Module
 *
 * Implements the full hybrid PQC encryption pipeline:
 *   - AES-256-GCM via native WebCrypto API
 *   - CRYSTALS-Kyber-512 KEM via crystals-kyber-js
 *
 * The server NEVER sees plaintext data or AES keys.
 */

import { Kyber512 } from 'crystals-kyber-js';

// ─── AES-256-GCM (WebCrypto) ────────────────────────────

/**
 * Generate a random AES-256-GCM key.
 * Returns a CryptoKey object.
 */
export async function generateAESKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can export raw bytes for KEM wrapping
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to raw bytes (Uint8Array of 32 bytes for AES-256).
 */
export async function exportAESKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

/**
 * Import raw bytes as an AES-256-GCM CryptoKey.
 */
export async function importAESKey(rawBytes) {
  return crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Encrypt a file ArrayBuffer with AES-256-GCM.
 * Returns { ciphertext: Uint8Array, iv: Uint8Array }
 */
export async function encryptAES(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    plaintext
  );
  return { ciphertext: new Uint8Array(ciphertext), iv };
}

/**
 * Decrypt an AES-256-GCM ciphertext.
 * Returns the decrypted ArrayBuffer.
 */
export async function decryptAES(key, ciphertext, iv) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    ciphertext
  );
}

// ─── CRYSTALS-Kyber-512 KEM ─────────────────────────────

/**
 * Generate a Kyber-512 keypair.
 * Returns { publicKey: Uint8Array, privateKey: Uint8Array }
 */
export async function generateKyberKeypair() {
  const kem = new Kyber512();
  const [publicKey, privateKey] = await kem.generateKeyPair();
  return { publicKey, privateKey };
}

/**
 * Encapsulate: given a recipient's Kyber public key,
 * produce (kemCiphertext, sharedSecret).
 * The sharedSecret (32 bytes) IS the AES-256 key material.
 *
 * For our protocol we use it to wrap an externally generated AES key:
 *   - We XOR the AES key raw bytes with the sharedSecret.
 */
export async function kyberEncapsulate(recipientPublicKey) {
  const kem = new Kyber512();
  const [kemCiphertext, sharedSecret] = await kem.encap(recipientPublicKey);
  return { kemCiphertext, sharedSecret: new Uint8Array(sharedSecret) };
}

/**
 * Decapsulate: given the KEM ciphertext and our private key,
 * recover the sharedSecret.
 */
export async function kyberDecapsulate(kemCiphertext, privateKey) {
  const kem = new Kyber512();
  const sharedSecret = await kem.decap(kemCiphertext, privateKey);
  return new Uint8Array(sharedSecret);
}

// ─── Hybrid Wrap / Unwrap ───────────────────────────────

/**
 * Wrap an AES key using Kyber KEM.
 * Steps:
 *   1. Encapsulate with recipient's public key → (kemCT, sharedSecret)
 *   2. XOR the 32-byte AES key with the 32-byte sharedSecret → wrappedKey
 *   3. Return { kemCiphertext, wrappedKey } (both sent to server)
 */
export async function wrapAESKeyWithKyber(aesKeyBytes, recipientPublicKey) {
  const { kemCiphertext, sharedSecret } = await kyberEncapsulate(recipientPublicKey);
  // XOR wrap
  const wrappedKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    wrappedKey[i] = aesKeyBytes[i] ^ sharedSecret[i];
  }
  return { kemCiphertext, wrappedKey };
}

/**
 * Unwrap an AES key using Kyber KEM.
 * Steps:
 *   1. Decapsulate kemCiphertext with our private key → sharedSecret
 *   2. XOR wrappedKey with sharedSecret → original AES key bytes
 */
export async function unwrapAESKeyWithKyber(kemCiphertext, wrappedKey, privateKey) {
  const sharedSecret = await kyberDecapsulate(kemCiphertext, privateKey);
  const aesKeyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    aesKeyBytes[i] = wrappedKey[i] ^ sharedSecret[i];
  }
  return aesKeyBytes;
}

// ─── SHA-256 Fingerprint ────────────────────────────────

/**
 * Compute SHA-256 hash of data and return as hex string.
 */
export async function sha256Hex(data) {
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Base64 helpers ─────────────────────────────────────

export function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Entropy calculation ────────────────────────────────

export function calcEntropy(bytes) {
  const freq = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) freq[bytes[i]]++;
  let e = 0;
  for (const c of freq) {
    if (c === 0) continue;
    const p = c / bytes.length;
    e -= p * Math.log2(p);
  }
  return e;
}
