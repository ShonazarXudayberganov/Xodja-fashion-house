# Xodija Fashion House — Prod Deploy Yo'riqnomasi

Saytni internetga chiqarish uchun quyidagi 3 qadamni bajaring.

## 1. Rasmlarni qo'shish

`images/` papkasiga quyidagi fayllarni qo'ying (JPG/WebP, optimallashtirilgan, ~150-300 KB):

| Fayl nomi | O'lcham | Tavsif |
|-----------|---------|--------|
| `hero-1.jpg` | 800×1000 | Hero slider — 1-rasm (LCP, eng muhim) |
| `hero-2.jpg` | 800×1000 | Hero slider — 2-rasm |
| `hero-3.jpg` | 800×1000 | Hero slider — 3-rasm |
| `hero-4.jpg` | 800×1000 | Hero slider — 4-rasm |
| `about-designer.jpg` | 800×1000 | Dizayner ish jarayonida |
| `og-cover.jpg` | 1200×630 | Open Graph (ijtimoiy tarmoqlar preview) |
| `apple-touch-icon.png` | 180×180 | iOS home screen ikonkasi |
| `icon-192.png` | 192×192 | PWA ikonkasi |
| `icon-512.png` | 512×512 | PWA ikonkasi (yuqori sifat) |
| `product-evening-zulfiya.jpg` | 600×750 | Oqshom libos «Zulfiya» |
| `product-evening-malika.jpg` | 600×750 | Oqshom libos «Malika» |
| `product-ensemble-set.jpg` | 600×750 | Ansabil to'plami |
| `product-ensemble-summer.jpg` | 600×750 | Ansabil yozgi |
| `product-daily-dress.jpg` | 600×750 | Kundalik ko'ylak |
| `product-daily-set.jpg` | 600×750 | Kundalik to'plam |
| `product-bridal-classic.jpg` | 600×750 | Kelin sarposi klassik |
| `product-bridal-modern.jpg` | 600×750 | Kelin sarposi zamonaviy |
| `product-tiara-gulnora.jpg` | 600×750 | Diodema «Gulnora» |
| `product-tiara-shahzoda.jpg` | 600×750 | Diodema «Shahzoda» |

**Tavsiya:** rasmlarni [tinypng.com](https://tinypng.com) yoki [squoosh.app](https://squoosh.app) orqali siqing.

## 2. Telegram Bot sozlash (forma uchun)

1. Telegramda **@BotFather**'ga yozing → `/newbot` → bot nomi va username bering
2. Olingan **bot token**ni saqlang (masalan: `7123456789:AAH...xyz`)
3. **@userinfobot**'ga yozib, o'z **chat_id**'ingizni oling (masalan: `987654321`)
4. Yaratgan botingizga **/start** bosing (bot sizga yoza olishi uchun)
5. [`script.js`](script.js) faylining 1-bo'limida `CONFIG`'ni to'ldiring:

```js
const CONFIG = {
  TELEGRAM_BOT_TOKEN: '7123456789:AAH...xyz',  // ← bu yerga
  TELEGRAM_CHAT_ID: '987654321',                // ← bu yerga
  TELEGRAM_FALLBACK_USERNAME: 'xodija_fashion',
};
```

> **Diqqat:** bot token ochiq HTML/JS'da turadi — bu sodda variant. Yuqori xavfsizlik kerak bo'lsa, kichik backend (Cloudflare Worker, Vercel Function) yarating va tokenni o'sha yerda saqlang.

## 3. Domen va deploy

Domen tanlangach, quyidagi joylarni yangilang:

| Fayl | Qator | O'zgartirish |
|------|-------|--------------|
| [`index.html`](index.html) | `<link rel="canonical">` qo'shing | `<link rel="canonical" href="https://SIZNING-DOMEN.uz/" />` |
| [`index.html`](index.html) | `og:url` qo'shing | `<meta property="og:url" content="https://SIZNING-DOMEN.uz/" />` |
| [`robots.txt`](robots.txt) | Sitemap qatori | Komment olib tashlang va domenni yozing |
| [`sitemap.xml`](sitemap.xml) | Hamma `<loc>` | `xodija-fashion.uz` → o'z domeningiz |

### Hosting variantlari (bepul)

- **Netlify** — drag-and-drop / GitHub
- **Vercel** — GitHub integratsiya
- **Cloudflare Pages** — eng tezkor CDN
- **GitHub Pages** — eng oddiy

### Server konfiguratsiya tavsiyalari

`_headers` (Netlify) yoki `vercel.json` orqali:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: public, max-age=3600

/images/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

## Tekshirish ro'yxati (deploy oldidan)

- [ ] `images/` papkadagi barcha rasmlar joylashtirilgan
- [ ] `script.js` ichida `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` to'ldirilgan
- [ ] Telegram bot `/start` bosilgan
- [ ] Forma orqali test buyurtma yuborilgan
- [ ] UZ ↔ RU til almashtirish ishlayapti
- [ ] Mobil va desktopda test qilingan
- [ ] [PageSpeed Insights](https://pagespeed.web.dev) — 90+ ball
- [ ] [Google Search Console](https://search.google.com/search-console) sitemap.xml qo'shilgan
