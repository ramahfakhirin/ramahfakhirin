// src/setup.js — Run once: node src/setup.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');
const slugify = require('slugify');

console.log('🚀 Setting up Ramahfakhirin Backend...\n');

// ── 1. Admin account ────────────────────────────────────────────────────────
const username = process.env.ADMIN_USERNAME || 'rama';
const rawPass  = process.env.ADMIN_PASSWORD || 'admin123';
const hashed   = bcrypt.hashSync(rawPass, 12);

const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
if (!existing) {
  db.prepare('INSERT INTO admins (username, password) VALUES (?,?)').run(username, hashed);
  console.log(`✅ Admin created: ${username}`);
} else {
  db.prepare('UPDATE admins SET password = ? WHERE username = ?').run(hashed, username);
  console.log(`✅ Admin password updated: ${username}`);
}

// ── 2. Default settings ──────────────────────────────────────────────────────
const defaults = {
  site_name:        'Rama Hadyan Fakhirin',
  site_tagline:     'Founder & Creative Director',
  contact_email:    'ramafakhirin@gmail.com',
  whatsapp:         '6282244719826',
  instagram:        'nanoidn',
  linkedin:         'ramahfakhirin',
  hero_badge:       '✦ Founder of Nano Indonesia Sakti',
  hero_title:       'Turning Ideas Into Digital Experiences.',
  hero_subtitle:    'Entrepreneur, creative director, and builder from Jember. 8 years creating digital experiences.',
  stats_schools:    '231',
  stats_years:      '8',
  stats_team:       '14',
  stats_deals:      '50',
  maintenance_mode: '0',
};

const upsertSetting = db.prepare(`
  INSERT INTO settings(key, value, updated_at) VALUES(?,?, datetime('now'))
  ON CONFLICT(key) DO NOTHING
`);
for (const [key, value] of Object.entries(defaults)) {
  upsertSetting.run(key, value);
}
console.log('✅ Default settings seeded');

// ── 3. Sample portfolio projects ─────────────────────────────────────────────
const sampleProjects = [
  {
    title: 'Nano Yearbook Platform',
    category: 'yearbook',
    description: "Indonesia's #1 Digital Yearbook Studio. Serving 231+ schools since 2017.",
    url: 'https://nanoyearbook.com',
    tags: JSON.stringify(['yearbook', 'web', 'platform']),
    featured: 1,
  },
  {
    title: 'Nano AR Technology',
    category: 'ar',
    description: 'Augmented Reality image-to-video engine for school yearbooks.',
    tags: JSON.stringify(['ar', 'technology', 'mobile']),
    featured: 1,
  },
  {
    title: 'RECTOVIOUS — SMAN 1 Kencong',
    category: 'web',
    description: 'Premium yearbook website with Phoenix theme, PDF flipbook, and animations.',
    tags: JSON.stringify(['yearbook', 'html', 'animation']),
    featured: 0,
  },
  {
    title: 'ASCENDANTS 2025 — SMA SHAFTA',
    category: 'yearbook',
    description: 'Harry Potter themed yearbook website for SMA SHAFTA Surabaya.',
    tags: JSON.stringify(['yearbook', 'themed', 'surabaya']),
    featured: 0,
  },
  {
    title: 'Nano EO — Graduation Events',
    category: 'event',
    description: 'Full-service graduation event organizer for schools across East Java.',
    tags: JSON.stringify(['event', 'graduation', 'organizer']),
    featured: 0,
  },
  {
    title: 'SENSI — Internal Attendance PWA',
    category: 'web',
    description: 'Progressive Web App for internal HR attendance with role-based access.',
    tags: JSON.stringify(['pwa', 'hr', 'internal']),
    featured: 0,
  },
];

const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (title, slug, category, description, url, tags, featured, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleProjects.forEach((p, i) => {
  const slug = slugify(p.title, { lower: true, strict: true });
  insertProject.run(p.title, slug, p.category, p.description, p.url || null, p.tags, p.featured, i + 1);
});
console.log('✅ Sample projects seeded');

// ── 4. Sample blog post ──────────────────────────────────────────────────────
const samplePost = db.prepare(`
  INSERT OR IGNORE INTO posts (title, slug, excerpt, content, tags, published)
  VALUES (?, ?, ?, ?, ?, ?)
`);
samplePost.run(
  'Membangun Digital Yearbook Pertama di Jember',
  'membangun-digital-yearbook-pertama-di-jember',
  'Cerita di balik lahirnya Nano Yearbook — dari ide sederhana hingga melayani 231+ sekolah.',
  `<h2>Awal Mula</h2><p>Tahun 2017, aku mulai dengan sebuah pertanyaan sederhana: <em>"Kenapa buku tahunan sekolah masih cetak semua?"</em></p><p>Dari sana lahirlah Nano Yearbook...</p>`,
  JSON.stringify(['nano', 'yearbook', 'entrepreneurship', 'story']),
  1
);
console.log('✅ Sample blog post seeded');

console.log('\n✨ Setup complete! Run: npm start\n');
process.exit(0);
