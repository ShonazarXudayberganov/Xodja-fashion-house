# Xodija Fashion House

Express API, statik frontend va admin paneldan iborat sayt. Loyiha Netlify deployga moslangan:

- statik sayt: `public/`
- API va admin backend: `netlify/functions/api.js`
- persistent data va rasm upload: Netlify Blobs
- local development data: `server/data.json`

## Local ishga tushirish

```bash
npm install
npm run seed
npm start
```

Sayt: `http://localhost:3000/`

Admin: `http://localhost:3000/admin/`

Default login: `admin / admin123`

Production deploydan keyin admin panelga kirib parolni darhol almashtiring.

## Netlify deploy

Netlify build sozlamalari `netlify.toml` ichida tayyor:

- Build command: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Node version: `22`
- API rewrite: `/api/* -> /.netlify/functions/api/:splat`

Netlify environment variables:

```text
JWT_SECRET=kamida-32-belgili-maxfiy-random-string
```

Optional environment variables:

```text
XFH_BLOBS_DATA_STORE=xfh-data
XFH_BLOBS_UPLOAD_STORE=xfh-uploads
XFH_DATA_KEY=site-data.json
```

`JWT_SECRET` qo'yilmasa, development fallback ishlaydi, lekin production uchun bu xavfsiz emas.

## Ma'lumot va rasmlar

Localda ma'lumotlar `server/data.json`ga yoziladi. Bu fayl `.gitignore`da.

Netlify'da ma'lumotlar va admin upload qilgan rasmlar Netlify Blobs ichida saqlanadi. Admin paneldagi rasm yuklash tugmalari o'zgarmaydi:

- local: rasm `public/images/`ga yoziladi va `images/...` path qaytadi
- Netlify: rasm Blobs'ga yoziladi va `/api/uploads/...` path qaytadi

Sayt ikkala holatda ham shu path orqali rasmni ko'rsatadi.

## Tekshirish

```bash
npm run build
npm audit --omit=dev
netlify dev --offline
```

`netlify dev` ochilgach:

- `http://localhost:8888/`
- `http://localhost:8888/api/site`
- `http://localhost:8888/admin/`

## Deploydan keyingi checklist

- Netlify'da `JWT_SECRET` qo'yilgan
- Admin parol `admin123`dan boshqasiga almashtirilgan
- Brand va kontaktlar admin paneldan tekshirilgan
- Telegram bot token va chat ID admin paneldan kiritilgan va test qilingan
- Forma orqali test buyurtma yuborilgan
- Admin paneldan rasm yuklab, rasm saytda ko'rinishi tekshirilgan
- `robots.txt` va `sitemap.xml` ichidagi domen production domeniga almashtirilgan
- `manifest.json` icon fayllari qo'shilgan yoki manifest icon pathlari yangilangan
