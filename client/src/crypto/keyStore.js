/**
 * ByteGuard — Kyber Key Store
 *
 * Manages the user's Kyber-512 private key in IndexedDB.
 * The private key NEVER leaves the browser.
 * The public key is sent to the server for other users to encapsulate to.
 */

const DB_NAME = 'ByteGuardKeyStore';
const DB_VERSION = 1;
const STORE_NAME = 'kyberKeys';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store a Kyber keypair for the given user.
 * @param {string} userId - The researcher ID
 * @param {Uint8Array} publicKey
 * @param {Uint8Array} privateKey
 */
export async function storeKyberKeypair(userId, publicKey, privateKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: userId,
      publicKey: Array.from(publicKey),
      privateKey: Array.from(privateKey),
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve the stored Kyber keypair for a user.
 * Returns { publicKey: Uint8Array, privateKey: Uint8Array } or null.
 */
export async function getKyberKeypair(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(userId);
    req.onsuccess = () => {
      if (!req.result) {
        resolve(null);
        return;
      }
      resolve({
        publicKey: new Uint8Array(req.result.publicKey),
        privateKey: new Uint8Array(req.result.privateKey),
      });
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Check if a user has a stored keypair.
 */
export async function hasKyberKeypair(userId) {
  const kp = await getKyberKeypair(userId);
  return kp !== null;
}

/**
 * Delete all stored keys (for logout/cleanup).
 */
export async function clearKeyStore() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
