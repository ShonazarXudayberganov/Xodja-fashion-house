const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, getAllSettings, set, setMany } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
    const safeBase = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40) || 'img';
    const stamp = Date.now().toString(36);
    cb(null, `${safeBase}-${stamp}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat JPG/PNG/WebP/GIF rasmlar yuklanadi'));
  },
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Rasm yuklanmadi' });
  res.json({ path: `images/${req.file.filename}` });
});

router.post('/test-bot', async (req, res) => {
  const { token, chat_id } = req.body || {};
  if (!token || !chat_id) {
    return res.status(400).json({ error: 'Token va Chat ID kerak' });
  }
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token.trim())) {
    return res.status(400).json({ error: 'Token formati noto\'g\'ri (123456:AAH... ko\'rinishida bo\'lishi kerak)' });
  }
  try {
    const text = '✅ <b>Sinov xabari</b>\n\n' +
      'Xodija Fashion House admin paneli sizning Telegram botingiz bilan muvaffaqiyatli ulandi.\n\n' +
      'Endi sayt orqali kelgan buyurtmalar shu yerga keladi.';
    const r = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat_id.trim(), text, parse_mode: 'HTML' }),
    });
    const j = await r.json();
    if (!j.ok) {
      const desc = j.description || ('HTTP ' + r.status);
      let hint = '';
      if (desc.includes('chat not found')) hint = ' (Chat ID noto\'g\'ri yoki bot bilan suhbatni boshlamadingiz — botga /start yuboring)';
      else if (desc.includes('Unauthorized')) hint = ' (Bot token noto\'g\'ri)';
      else if (desc.includes('bot was blocked')) hint = ' (Bot bloklangan)';
      return res.status(400).json({ error: 'Telegram: ' + desc + hint });
    }
    res.json({ ok: true, message: 'Sinov xabari yuborildi! Telegram ga qarang.' });
  } catch (e) {
    res.status(500).json({ error: 'Tarmoq xatosi: ' + e.message });
  }
});

router.get('/settings', (req, res) => {
  res.json(getAllSettings());
});

router.put('/settings', (req, res) => {
  const updates = req.body || {};
  const allowed = {};
  for (const [k, v] of Object.entries(updates)) {
    if (typeof k === 'string' && /^[a-z_]+\.[a-z0-9_]+$/i.test(k)) {
      allowed[k] = v == null ? '' : String(v);
    }
  }
  setMany(allowed);
  res.json({ ok: true, count: Object.keys(allowed).length });
});

function makeCRUD(table, columns, opts = {}) {
  const { orderBy = 'sort_order ASC, id ASC' } = opts;
  const colList = columns.join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const updateSet = columns.map(c => `${c} = ?`).join(', ');

  router.get(`/${table}`, (req, res) => {
    const rows = db.prepare(`SELECT id, ${colList} FROM ${table} ORDER BY ${orderBy}`).all();
    res.json(rows);
  });

  router.post(`/${table}`, (req, res) => {
    const values = columns.map(c => req.body[c] == null ? null : req.body[c]);
    try {
      const result = db.prepare(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`).run(...values);
      const row = db.prepare(`SELECT id, ${colList} FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
      res.json(row);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.put(`/${table}/:id`, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const values = columns.map(c => req.body[c] == null ? null : req.body[c]);
    try {
      db.prepare(`UPDATE ${table} SET ${updateSet} WHERE id = ?`).run(...values, id);
      const row = db.prepare(`SELECT id, ${colList} FROM ${table} WHERE id = ?`).get(id);
      if (!row) return res.status(404).json({ error: 'Topilmadi' });
      res.json(row);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.delete(`/${table}/:id`, (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    res.json({ ok: true });
  });

  router.post(`/${table}/reorder`, (req, res) => {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array kerak' });
    const stmt = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
    const tx = db.transaction(() => {
      ids.forEach((id, idx) => stmt.run(idx + 1, id));
    });
    tx();
    res.json({ ok: true });
  });
}

makeCRUD('hero_slides', ['image_path', 'alt_uz', 'alt_ru', 'sort_order']);
makeCRUD('marquee_items', ['text_uz', 'text_ru', 'sort_order']);
makeCRUD('categories', ['slug', 'name_uz', 'name_ru', 'short_uz', 'short_ru', 'sort_order']);
makeCRUD('testimonials', ['text_uz', 'text_ru', 'author_name', 'author_initials', 'city_uz', 'city_ru', 'stars', 'sort_order']);
makeCRUD('products', ['category_id', 'name_uz', 'name_ru', 'alt_uz', 'alt_ru', 'image_path', 'price', 'price_ask', 'badge_type', 'badge_text', 'visible', 'sort_order']);

router.get('/orders', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const status = req.query.status;
  let sql = 'SELECT id, name, phone, category, note, status, created_at FROM orders';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  res.json(db.prepare(sql).all(...params));
});

router.put('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const status = String(req.body.status || '').slice(0, 20);
  if (!['new', 'contacted', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'status noto\'g\'ri' });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  res.json({ ok: true });
});

router.delete('/orders/:id', (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(parseInt(req.params.id, 10));
  res.json({ ok: true });
});

module.exports = router;
