const { stmts } = require('../db');

/**
 * Token-based auth middleware.
 * Expects header: Authorization: Bearer <sessionToken>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const session = stmts.getSession.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.user = JSON.parse(session.user_json);
  req.token = token;
  next();
}

module.exports = authMiddleware;
