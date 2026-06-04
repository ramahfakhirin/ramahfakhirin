// src/routes/analytics.js
const router = require('express').Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function getDevice(ua) {
  if (!ua) return 'desktop';
  if (/Mobile|Android|iPhone|iPod/.test(ua)) return 'mobile';
  if (/iPad|Tablet/.test(ua)) return 'tablet';
  return 'desktop';
}

function getBrowser(ua) {
  if (!ua) return 'unknown';
  if (/Chrome/.test(ua) && !/Chromium|Edg/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Edg/.test(ua)) return 'Edge';
  if (/OPR|Opera/.test(ua)) return 'Opera';
  return 'Other';
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
}

// ── PUBLIC: tracking endpoints ────────────────────────────────────────────────

// POST /api/analytics/view — track page view
router.post('/view', (req, res) => {
  const { page, referrer, session_id } = req.body;
  if (!page) return res.status(400).json({ success: false });

  const ua = req.headers['user-agent'] || '';
  const ip = getClientIp(req);
  const device = getDevice(ua);
  const browser = getBrowser(ua);
  const sid = session_id || uuidv4();
  const today = new Date().toISOString().split('T')[0];

  // Insert raw view
  db.prepare(`
    INSERT INTO analytics_views (page, referrer, device, browser, session_id, ip)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(page, referrer||null, device, browser, sid, ip);

  // Upsert daily summary
  const existing = db.prepare('SELECT * FROM analytics_daily WHERE date=? AND page=?').get(today, page);
  if (!existing) {
    db.prepare('INSERT INTO analytics_daily (date, page, views, unique_ips) VALUES (?,?,1,?)').run(today, page, JSON.stringify([ip]));
  } else {
    const ips = JSON.parse(existing.unique_ips || '[]');
    if (!ips.includes(ip)) ips.push(ip);
    db.prepare('UPDATE analytics_daily SET views=views+1, unique_ips=? WHERE date=? AND page=?')
      .run(JSON.stringify(ips), today, page);
  }

  res.json({ success: true, session_id: sid });
});

// POST /api/analytics/event — track click/event
router.post('/event', (req, res) => {
  const { event_name, event_data, page, session_id } = req.body;
  if (!event_name) return res.status(400).json({ success: false });

  const ip = getClientIp(req);
  db.prepare(`
    INSERT INTO analytics_events (event_name, event_data, page, session_id, ip)
    VALUES (?, ?, ?, ?, ?)
  `).run(event_name, JSON.stringify(event_data||{}), page||null, session_id||null, ip);

  res.json({ success: true });
});

// ── ADMIN: dashboard data ─────────────────────────────────────────────────────

// GET /api/analytics/admin/summary — main dashboard stats
router.get('/admin/summary', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
  const last7 = new Date(Date.now()-7*86400000).toISOString().split('T')[0];
  const last30 = new Date(Date.now()-30*86400000).toISOString().split('T')[0];

  const totalViews     = db.prepare("SELECT COUNT(*) as c FROM analytics_views").get().c;
  const todayViews     = db.prepare("SELECT COUNT(*) as c FROM analytics_views WHERE date(created_at)=?").get(today).c;
  const yesterdayViews = db.prepare("SELECT COUNT(*) as c FROM analytics_views WHERE date(created_at)=?").get(yesterday).c;
  const last7Views     = db.prepare("SELECT COUNT(*) as c FROM analytics_views WHERE date(created_at)>=?").get(last7).c;
  const last30Views    = db.prepare("SELECT COUNT(*) as c FROM analytics_views WHERE date(created_at)>=?").get(last30).c;

  // Unique visitors (by IP) last 30 days
  const uniqueVisitors = db.prepare("SELECT COUNT(DISTINCT ip) as c FROM analytics_views WHERE date(created_at)>=?").get(last30).c;

  // Top pages last 30 days
  const topPages = db.prepare(`
    SELECT page, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors
    FROM analytics_views WHERE date(created_at)>=?
    GROUP BY page ORDER BY views DESC LIMIT 10
  `).all(last30);

  // Views by day (last 14 days)
  const byDay = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as views, COUNT(DISTINCT ip) as unique
    FROM analytics_views WHERE date(created_at)>=?
    GROUP BY date(created_at) ORDER BY date ASC
  `).all(new Date(Date.now()-14*86400000).toISOString().split('T')[0]);

  // Device breakdown last 30 days
  const byDevice = db.prepare(`
    SELECT device, COUNT(*) as count FROM analytics_views
    WHERE date(created_at)>=? GROUP BY device
  `).all(last30);

  // Browser breakdown
  const byBrowser = db.prepare(`
    SELECT browser, COUNT(*) as count FROM analytics_views
    WHERE date(created_at)>=? GROUP BY browser ORDER BY count DESC
  `).all(last30);

  // Top events last 30 days
  const topEvents = db.prepare(`
    SELECT event_name, COUNT(*) as count FROM analytics_events
    WHERE date(created_at)>=? GROUP BY event_name ORDER BY count DESC LIMIT 10
  `).all(last30);

  // Contact stats
  const contactStats = {
    total: db.prepare("SELECT COUNT(*) as c FROM contacts").get().c,
    new:   db.prepare("SELECT COUNT(*) as c FROM contacts WHERE status='new'").get().c,
    today: db.prepare("SELECT COUNT(*) as c FROM contacts WHERE date(created_at)=?").get(today).c,
  };

  // Content stats
  const contentStats = {
    projects:  db.prepare("SELECT COUNT(*) as c FROM projects WHERE published=1").get().c,
    posts:     db.prepare("SELECT COUNT(*) as c FROM posts WHERE published=1").get().c,
    totalBlogViews: db.prepare("SELECT SUM(views) as c FROM posts").get().c || 0,
  };

  res.json({
    success: true,
    data: {
      views: { total: totalViews, today: todayViews, yesterday: yesterdayViews, last7: last7Views, last30: last30Views },
      uniqueVisitors,
      topPages, byDay, byDevice, byBrowser, topEvents,
      contactStats, contentStats
    }
  });
});

// GET /api/analytics/admin/realtime — last 30 minutes
router.get('/admin/realtime', requireAuth, (req, res) => {
  const recent = db.prepare(`
    SELECT page, device, browser, referrer, created_at
    FROM analytics_views
    WHERE created_at >= datetime('now', '-30 minutes')
    ORDER BY created_at DESC LIMIT 50
  `).all();
  const active = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as c FROM analytics_views
    WHERE created_at >= datetime('now', '-5 minutes')
  `).get().c;
  res.json({ success: true, data: { recentViews: recent, activeNow: active } });
});

module.exports = router;
