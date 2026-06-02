const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use('/api/admin', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use(express.static(PUBLIC_DIR, {
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
}));

app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
  } else {
    res.status(404).json({ error: 'Topilmadi' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fayl 5MB dan katta' });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Server xatosi' });
});

module.exports = app;
