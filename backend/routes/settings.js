const express = require('express');
const authMiddleware = require('../middleware/auth');
const { stmts } = require('../db');

const router = express.Router();
router.use(authMiddleware);

const defaults = {
  algorithm: 'AES-256-GCM', keySize: '512', autoDelete: false,
  animations: true, highContrast: false, sessionTimeout: '30',
  twoFactor: false, auditLogging: true
};

router.get('/', (req, res) => {
  const row = stmts.getSettings.get(req.user.id);
  if (!row) return res.json({ ...defaults });
  res.json({
    algorithm: row.algorithm, keySize: row.key_size,
    autoDelete: !!row.auto_delete, animations: !!row.animations,
    highContrast: !!row.high_contrast, sessionTimeout: row.session_timeout,
    twoFactor: !!row.two_factor, auditLogging: !!row.audit_logging
  });
});

router.put('/', (req, res) => {
  const s = { ...defaults, ...req.body };
  stmts.upsertSettings.run(
    req.user.id, s.algorithm, s.keySize,
    s.autoDelete ? 1 : 0, s.animations ? 1 : 0, s.highContrast ? 1 : 0,
    s.sessionTimeout, s.twoFactor ? 1 : 0, s.auditLogging ? 1 : 0
  );
  res.json(s);
});

module.exports = router;
