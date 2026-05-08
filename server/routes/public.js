const express = require('express');
const { db, getAllSettings } = require('../db');

const router = express.Router();

router.get('/site', (req, res) => {
  const settings = getAllSettings();
  const heroSlides = db.prepare('SELECT id, image_path, alt_uz, alt_ru FROM hero_slides ORDER BY sort_order ASC, id ASC').all();
  const marquee = db.prepare('SELECT id, text_uz, text_ru FROM marquee_items ORDER BY sort_order ASC, id ASC').all();
  const categories = db.prepare('SELECT id, slug, name_uz, name_ru, short_uz, short_ru FROM categories ORDER BY sort_order ASC, id ASC').all();
  const products = db.prepare(`
    SELECT p.id, p.name_uz, p.name_ru, p.alt_uz, p.alt_ru, p.image_path, p.price, p.price_ask,
           p.badge_type, p.badge_text, c.slug AS category_slug, c.short_uz AS cat_short_uz, c.short_ru AS cat_short_ru
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.visible = 1
    ORDER BY p.sort_order ASC, p.id ASC
  `).all();
  const testimonials = db.prepare('SELECT id, text_uz, text_ru, author_name, author_initials, city_uz, city_ru, stars FROM testimonials ORDER BY sort_order ASC, id ASC').all();

  res.json({
    settings,
    heroSlides,
    marquee,
    categories,
    products,
    testimonials,
  });
});

router.post('/orders', (req, res) => {
  const { name, phone, category, note, website } = req.body || {};

  if (website) return res.json({ ok: true });

  if (!name || name.length < 2) return res.status(400).json({ error: 'Ism noto\'g\'ri' });
  if (!phone || !/^\+?[\d\s\-]{9,}$/.test(phone)) return res.status(400).json({ error: 'Telefon raqam noto\'g\'ri' });

  const safeName = String(name).slice(0, 60);
  const safePhone = String(phone).slice(0, 20);
  const safeCategory = String(category || '').slice(0, 30);
  const safeNote = String(note || '').slice(0, 500);

  const result = db.prepare('INSERT INTO orders (name, phone, category, note) VALUES (?, ?, ?, ?)')
    .run(safeName, safePhone, safeCategory, safeNote);

  const { get } = require('../db');
  const botToken = get('contacts.bot_token');
  const chatId = get('contacts.bot_chat_id');

  if (botToken && chatId) {
    const phoneClean = safePhone.replace(/\D/g, '');
    const text = `🌸 <b>Yangi buyurtma #${result.lastInsertRowid}</b>\n\n` +
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
        console.error(`[Telegram] Order #${result.lastInsertRowid} send failed:`, j.description || ('HTTP ' + r.status));
      } else {
        console.log(`[Telegram] Order #${result.lastInsertRowid} sent OK`);
      }
    }).catch(err => console.error('[Telegram] Network error:', err.message));
  }

  res.json({ ok: true, id: result.lastInsertRowid });
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = router;
