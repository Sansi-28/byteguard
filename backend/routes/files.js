const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const { stmts } = require('../db');

const router = express.Router();
router.use(authMiddleware);

// ─── File History ────────────────────────────────────────

router.get('/history', (req, res) => {
  const rows = stmts.getHistory.all(req.user.id);
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    originalSize: r.original_size,
    encryptedSize: r.encrypted_size,
    type: r.type,
    timestamp: r.timestamp
  })));
});

router.post('/history', (req, res) => {
  const { name, originalSize, encryptedSize, type } = req.body;
  const info = stmts.insertHistory.run(req.user.id, name, originalSize || 0, encryptedSize || 0, type || 'unknown');
  res.json({
    id: Number(info.lastInsertRowid),
    name,
    originalSize,
    encryptedSize,
    type: type || 'unknown',
    timestamp: new Date().toISOString()
  });
});

router.delete('/history/:id', (req, res) => {
  const info = stmts.deleteHistoryItem.run(Number(req.params.id), req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

router.delete('/history', (req, res) => {
  stmts.clearHistory.run(req.user.id);
  res.json({ message: 'History cleared' });
});

// ─── Sharing ─────────────────────────────────────────────

router.get('/shared', (req, res) => {
  const rows = stmts.getShared.all(req.user.id);
  res.json(rows.map(r => ({
    id: r.id, fileId: r.file_id, fileName: r.file_name,
    sender: r.sender, recipient: r.recipient, permission: r.permission,
    shareCode: r.share_code, encrypted: !!r.encrypted, timestamp: r.timestamp
  })));
});

router.post('/share', (req, res) => {
  const { fileId, fileName, recipient, permission } = req.body;
  if (!recipient || !fileId) return res.status(400).json({ error: 'Recipient and fileId required' });

  const shareId = 'SHARE-' + Date.now();
  const shareCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  const perm = permission || 'view';

  stmts.insertShared.run(shareId, fileId, fileName, req.user.id, recipient, perm, shareCode);

  const recvId = 'RECV-' + Date.now();
  stmts.insertReceived.run(recvId, shareCode, fileName, req.user.id, recipient, perm, null);

  res.json({ id: shareId, fileId, fileName, sender: req.user.id, recipient, permission: perm, shareCode, encrypted: true, timestamp: new Date().toISOString() });
});

router.delete('/shared/:id', (req, res) => {
  const info = stmts.deleteShared.run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Revoked' });
});

// ─── Received ────────────────────────────────────────────

router.get('/received', (req, res) => {
  const rows = stmts.getReceived.all(req.user.id);
  res.json(rows.map(r => ({
    id: r.id, shareCode: r.share_code, fileName: r.file_name,
    sender: r.sender, recipient: r.recipient, permission: r.permission,
    timestamp: r.timestamp, receivedAt: r.received_at,
    encrypted: !!r.encrypted, content: r.content, viewed: !!r.viewed
  })));
});

router.post('/receive', (req, res) => {
  const { shareCode, content } = req.body;
  const recvId = 'RECV-' + Date.now();
  const code = shareCode || 'MANUAL-' + Date.now();
  const fileName = 'Received File ' + new Date().toLocaleDateString();

  stmts.insertReceived.run(recvId, code, fileName, 'Unknown', req.user.id, 'download', content || null);
  const row = stmts.getReceivedItem.get(recvId, req.user.id);

  res.json({
    id: row.id, shareCode: row.share_code, fileName: row.file_name,
    sender: row.sender, recipient: row.recipient, permission: row.permission,
    timestamp: row.timestamp, receivedAt: row.received_at,
    encrypted: !!row.encrypted, content: row.content, viewed: false
  });
});

router.patch('/received/:id/view', (req, res) => {
  stmts.markViewed.run(req.params.id, req.user.id);
  const row = stmts.getReceivedItem.get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ id: row.id, viewed: true });
});

module.exports = router;
