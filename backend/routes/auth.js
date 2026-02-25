const express = require('express');
const crypto = require('crypto');
const { stmts } = require('../db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { researcherId, accessKey } = req.body;

  if (!researcherId || !accessKey) {
    return res.status(400).json({ error: 'Researcher ID and Access Key are required' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const user = {
    id: researcherId,
    name: researcherId,
    role: 'Researcher',
    loginTime: new Date().toISOString(),
    profileId: 'RES-' + crypto.randomBytes(3).toString('hex').toUpperCase()
  };

  stmts.insertSession.run(token, user.id, JSON.stringify(user));

  res.json({ token, user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    stmts.deleteSession.run(token);
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/session
router.get('/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No session' });
  }

  const token = authHeader.split(' ')[1];
  const session = stmts.getSession.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Session expired' });
  }

  res.json({ user: JSON.parse(session.user_json) });
});

module.exports = router;
