const express = require('express');
const bcrypt = require('bcryptjs');
const { findAdminById, findAdminByUsername, updateAdminPassword } = require('../dataStore');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Login va parol kerak' });
    }

    const user = await findAdminByUsername(username);
    if (!user) return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });

    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lsin' });
    }

    const user = await findAdminById(req.user.id);
    if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(401).json({ error: 'Hozirgi parol noto\'g\'ri' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    await updateAdminPassword(req.user.id, hash);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
