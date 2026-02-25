/**
 * SQLite database setup using better-sqlite3.
 * All tables are created on first run. Data persists in data/halfbyte.db
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'halfbyte.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Researcher',
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS file_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_size INTEGER DEFAULT 0,
    encrypted_size INTEGER DEFAULT 0,
    type TEXT DEFAULT 'unknown',
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shared_files (
    id TEXT PRIMARY KEY,
    file_id INTEGER,
    file_name TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    permission TEXT DEFAULT 'view',
    share_code TEXT NOT NULL,
    encrypted INTEGER DEFAULT 1,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS received_files (
    id TEXT PRIMARY KEY,
    share_code TEXT,
    file_name TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    permission TEXT DEFAULT 'download',
    timestamp TEXT DEFAULT (datetime('now')),
    received_at TEXT DEFAULT (datetime('now')),
    encrypted INTEGER DEFAULT 1,
    content TEXT,
    viewed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    algorithm TEXT DEFAULT 'AES-256-GCM',
    key_size TEXT DEFAULT '512',
    auto_delete INTEGER DEFAULT 0,
    animations INTEGER DEFAULT 1,
    high_contrast INTEGER DEFAULT 0,
    session_timeout TEXT DEFAULT '30',
    two_factor INTEGER DEFAULT 0,
    audit_logging INTEGER DEFAULT 1
  );
`);

// ─── Prepared Statements ─────────────────────────────────

const stmts = {
  // Sessions
  insertSession: db.prepare('INSERT INTO sessions (token, user_id, user_json) VALUES (?, ?, ?)'),
  getSession: db.prepare('SELECT * FROM sessions WHERE token = ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),

  // File History
  getHistory: db.prepare('SELECT * FROM file_history WHERE user_id = ? ORDER BY id DESC LIMIT 50'),
  insertHistory: db.prepare('INSERT INTO file_history (user_id, name, original_size, encrypted_size, type) VALUES (?, ?, ?, ?, ?)'),
  deleteHistoryItem: db.prepare('DELETE FROM file_history WHERE id = ? AND user_id = ?'),
  clearHistory: db.prepare('DELETE FROM file_history WHERE user_id = ?'),

  // Shared Files
  getShared: db.prepare('SELECT * FROM shared_files WHERE sender = ? ORDER BY rowid DESC'),
  insertShared: db.prepare('INSERT INTO shared_files (id, file_id, file_name, sender, recipient, permission, share_code) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  deleteShared: db.prepare('DELETE FROM shared_files WHERE id = ? AND sender = ?'),

  // Received Files
  getReceived: db.prepare('SELECT * FROM received_files WHERE recipient = ? ORDER BY rowid DESC'),
  insertReceived: db.prepare('INSERT INTO received_files (id, share_code, file_name, sender, recipient, permission, content, viewed) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'),
  markViewed: db.prepare('UPDATE received_files SET viewed = 1 WHERE id = ? AND recipient = ?'),
  getReceivedItem: db.prepare('SELECT * FROM received_files WHERE id = ? AND recipient = ?'),

  // Settings
  getSettings: db.prepare('SELECT * FROM user_settings WHERE user_id = ?'),
  upsertSettings: db.prepare(`
    INSERT INTO user_settings (user_id, algorithm, key_size, auto_delete, animations, high_contrast, session_timeout, two_factor, audit_logging)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      algorithm = excluded.algorithm,
      key_size = excluded.key_size,
      auto_delete = excluded.auto_delete,
      animations = excluded.animations,
      high_contrast = excluded.high_contrast,
      session_timeout = excluded.session_timeout,
      two_factor = excluded.two_factor,
      audit_logging = excluded.audit_logging
  `)
};

module.exports = { db, stmts };
