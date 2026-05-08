const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'xodija-dev-secret-change-in-prod-please-2026';
const JWT_EXPIRES_IN = '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token noto\'g\'ri yoki muddati o\'tgan' });
  }
}

module.exports = { signToken, requireAuth };
