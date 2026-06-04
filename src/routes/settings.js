// src/routes/settings.js
const router = require('express').Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// GET /api/settings — public settings (non-sensitive only)
const PUBLIC_KEYS = ['site_name','site_tagline','hero_badge','hero_title','hero_subtitle',
                     'stats_schools','stats_years','stats_team','stats_deals',
                     'contact_email','whatsapp','instagram','linkedin'];

router.get('/', (req, res) => {
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_KEYS.map(()=>'?').join(',')})`)
    .all(...PUBLIC_KEYS);
  const data = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({ success: true, data });
});

// GET /api/settings/admin/all — all settings for admin
router.get('/admin/all', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key').all();
  const data = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({ success: true, data });
});

// PUT /api/settings/admin — update settings (batch)
router.put('/admin', requireAuth, (req, res) => {
  const updates = req.body; // { key: value, ... }
  if (typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }
  const upsert = db.prepare(`
    INSERT INTO settings(key, value, updated_at) VALUES(?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
  `);
  const tx = db.transaction((obj) => {
    for (const [key, value] of Object.entries(obj)) upsert.run(key, String(value));
  });
  tx(updates);
  res.json({ success: true, message: 'Settings disimpan' });
});

module.exports = router;
