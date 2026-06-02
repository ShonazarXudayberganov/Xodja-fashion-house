const express = require('express');
const { getSetting, getSiteData, insertOrder } = require('../dataStore');
const { readUpload } = require('../uploadStore');

const router = express.Router();

router.get('/site', async (req, res, next) => {
  try {
    res.json(await getSiteData());
  } catch (err) {
    next(err);
  }
});

router.get('/uploads/:filename', async (req, res, next) => {
  try {
    const upload = await readUpload(req.params.filename);
    if (!upload) return res.status(404).json({ error: 'Rasm topilmadi' });
    res.setHeader('Content-Type', upload.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(upload.data);
  } catch (err) {
    next(err);
  }
});

router.post('/orders', async (req, res, next) => {
  try {
    const { name, phone, category, note, website } = req.body || {};

    if (website) return res.json({ ok: true });
    if (!name || name.length < 2) return res.status(400).json({ error: 'Ism noto\'g\'ri' });
    if (!phone || !/^\+?[\d\s\-]{9,}$/.test(phone)) return res.status(400).json({ error: 'Telefon raqam noto\'g\'ri' });

    const safeName = String(name).slice(0, 60);
    const safePhone = String(phone).slice(0, 20);
    const safeCategory = String(category || '').slice(0, 30);
    const safeNote = String(note || '').slice(0, 500);

    const order = await insertOrder({ name: safeName, phone: safePhone, category: safeCategory, note: safeNote });

    const botToken = await getSetting('contacts.bot_token');
    const chatId = await getSetting('contacts.bot_chat_id');

    if (botToken && chatId) {
      const phoneClean = safePhone.replace(/\D/g, '');
      const text = `🌸 <b>Yangi buyurtma #${order.id}</b>\n\n` +
        `👤 <b>Ism:</b> ${escapeHtml(safeName)}\n` +
        `📞 <b>Tel:</b> <a href="tel:+${phoneClean}">${escapeHtml(safePhone)}</a>\n` +
        `👗 <b>Kategoriya:</b> ${escapeHtml(safeCategory)}` +
        (safeNote ? `\n📝 <b>Izoh:</b> ${escapeHtml(safeNote)}` : '');

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      }).then(async r => {
        const j = await r.json().catch(() => ({}));
        if (!j.ok) {
          console.error(`[Telegram] Order #${order.id} send failed:`, j.description || ('HTTP ' + r.status));
        } else {
          console.log(`[Telegram] Order #${order.id} sent OK`);
        }
      }).catch(err => console.error('[Telegram] Network error:', err.message));
    }

    res.json({ ok: true, id: order.id });
  } catch (err) {
    next(err);
  }
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = router;
