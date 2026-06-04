// src/app.js — Main Express application
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // allow admin dashboard inline scripts
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: function(origin, cb) {
    const allowed = [
      process.env.SITE_URL,
      'https://ramahfakhirin.com',
      'https://www.ramahfakhirin.com',
      'http://localhost:3000',
      'http://localhost:5500',
    ].filter(Boolean);
    if (!origin || allowed.some(a => origin.startsWith(a))) return cb(null, true);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true, legacyHeaders: false });
const contactLimiter = rateLimit({ windowMs: 60*60*1000, max: 5, message: { success:false, message:'Terlalu banyak request. Coba lagi dalam 1 jam.' } });
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { success:false, message:'Terlalu banyak percobaan login.' } });

app.use('/api/', apiLimiter);
app.use('/api/contact', contactLimiter);
app.use('/api/auth/login', loginLimiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Static files ─────────────────────────────────────────────────────────────
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'public/uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/posts',     require('./routes/posts'));
app.use('/api/contact',   require('./routes/contact'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/settings',  require('./routes/settings'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
});

// ── Admin SPA fallback ───────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File terlalu besar' });
  }
  res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Ramahfakhirin Backend running on port ${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api/health`);
  console.log(`   Admin:  http://localhost:${PORT}/admin\n`);
});

module.exports = app;
