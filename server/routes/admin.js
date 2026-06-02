const express = require('express');
const multer = require('multer');
const {
  createRow,
  deleteRow,
  getAllSettings,
  listOrders,
  listRows,
  reorderRows,
  setMany,
  updateOrderStatus,
  updateRow,
} = require('../dataStore');
const { requireAuth } = require('../middleware/auth');
const { MAX_FILE_SIZE, saveUpload } = require('../uploadStore');

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat JPG/PNG/WebP/GIF rasmlar yuklanadi'));
  },
});

router.post('/upload', upload.single('image'), async (req, res, next) => {
  try {
    res.json(await saveUpload(req.file));
  } catch (err) {
    next(err);
  }
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

router.get('/settings', async (req, res, next) => {
  try {
    res.json(await getAllSettings());
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const updates = req.body || {};
    const allowed = {};
    for (const [k, v] of Object.entries(updates)) {
      if (typeof k === 'string' && /^[a-z_]+\.[a-z0-9_]+$/i.test(k)) {
        allowed[k] = v == null ? '' : String(v);
      }
    }
    res.json(await setMany(allowed));
  } catch (err) {
    next(err);
  }
});

function makeCRUD(table, columns) {
  router.get(`/${table}`, async (req, res, next) => {
    try {
      res.json(await listRows(table));
    } catch (err) {
      next(err);
    }
  });

  router.post(`/${table}`, async (req, res, next) => {
    try {
      res.json(await createRow(table, columns, req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put(`/${table}/:id`, async (req, res, next) => {
    try {
      const row = await updateRow(table, parseInt(req.params.id, 10), columns, req.body || {});
      if (!row) return res.status(404).json({ error: 'Topilmadi' });
      res.json(row);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete(`/${table}/:id`, async (req, res, next) => {
    try {
      res.json(await deleteRow(table, parseInt(req.params.id, 10)));
    } catch (err) {
      next(err);
    }
  });

  router.post(`/${table}/reorder`, async (req, res, next) => {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array kerak' });
      res.json(await reorderRows(table, ids));
    } catch (err) {
      next(err);
    }
  });
}

makeCRUD('hero_slides', ['image_path', 'alt_uz', 'alt_ru', 'sort_order']);
makeCRUD('marquee_items', ['text_uz', 'text_ru', 'sort_order']);
makeCRUD('categories', ['slug', 'name_uz', 'name_ru', 'short_uz', 'short_ru', 'sort_order']);
makeCRUD('testimonials', ['text_uz', 'text_ru', 'author_name', 'author_initials', 'city_uz', 'city_ru', 'stars', 'sort_order']);
makeCRUD('products', ['category_id', 'name_uz', 'name_ru', 'alt_uz', 'alt_ru', 'image_path', 'price', 'price_ask', 'badge_type', 'badge_text', 'visible', 'sort_order']);

router.get('/orders', async (req, res, next) => {
  try {
    res.json(await listOrders({ limit: req.query.limit, status: req.query.status }));
  } catch (err) {
    next(err);
  }
});

router.put('/orders/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body.status || '').slice(0, 20);
    if (!['new', 'contacted', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'status noto\'g\'ri' });
    }
    await updateOrderStatus(id, status);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/orders/:id', async (req, res, next) => {
  try {
    res.json(await deleteRow('orders', parseInt(req.params.id, 10)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
