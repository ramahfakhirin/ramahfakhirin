// src/routes/contact.js
const router = require('express').Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── Nodemailer setup ─────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
}

// ── PUBLIC ───────────────────────────────────────────────────────────────────

// POST /api/contact — submit form
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Nama, email, dan pesan wajib diisi' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }
  if (message.length < 10) {
    return res.status(400).json({ success: false, message: 'Pesan terlalu pendek (min 10 karakter)' });
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  // Save to DB
  const result = db.prepare(`
    INSERT INTO contacts (name, email, subject, message, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), email.trim().toLowerCase(), subject?.trim()||null, message.trim(), ip, userAgent);

  // Send email notification (async, don't block response)
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const siteUrl = process.env.SITE_URL || 'https://ramahfakhirin.com';

  if (notifyEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
    (async () => {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `"${process.env.site_name || 'Portfolio'}" <${process.env.SMTP_USER}>`,
          to: notifyEmail,
          subject: `📩 Pesan baru dari ${name} — ${subject || 'No Subject'}`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9">
              <div style="background:#7463FF;padding:20px 32px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0;font-size:18px">📩 Pesan Baru dari Contact Form</h2>
              </div>
              <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e8e8f0">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 0;color:#666;width:100px;font-size:14px">Nama</td><td style="padding:8px 0;font-weight:600;font-size:14px">${name}</td></tr>
                  <tr><td style="padding:8px 0;color:#666;font-size:14px">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${email}" style="color:#7463FF">${email}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#666;font-size:14px">Subject</td><td style="padding:8px 0;font-size:14px">${subject || '-'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
                <h3 style="font-size:14px;color:#444;margin:0 0 12px">Pesan:</h3>
                <div style="background:#f7f7fd;padding:16px;border-radius:8px;font-size:14px;line-height:1.7;color:#333">${message.replace(/\n/g, '<br>')}</div>
                <div style="margin-top:24px;text-align:center">
                  <a href="${siteUrl}/admin" style="background:#7463FF;color:#fff;padding:12px 24px;border-radius:99px;text-decoration:none;font-size:14px;font-weight:600">Buka Admin Dashboard</a>
                </div>
              </div>
              <p style="text-align:center;font-size:12px;color:#999;margin-top:16px">Contact #${result.lastInsertRowid} — ${new Date().toLocaleString('id-ID')}</p>
            </div>
          `,
        });
      } catch (err) {
        console.error('Email notification failed:', err.message);
      }
    })();
  }

  res.json({
    success: true,
    message: 'Terima kasih! Pesan kamu sudah kami terima. Akan kami balas secepatnya.',
    id: result.lastInsertRowid
  });
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/contact/admin — list all contacts
router.get('/admin', requireAuth, (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;
  let sql = 'SELECT * FROM contacts';
  const params = [];
  if (status) { sql += ' WHERE status=?'; params.push(status); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const rows = db.prepare(sql).all(...params);
  const counts = db.prepare(`
    SELECT status, COUNT(*) as count FROM contacts GROUP BY status
  `).all();
  res.json({ success: true, data: rows, counts });
});

// PUT /api/contact/admin/:id/status — update status
router.put('/admin/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const valid = ['new', 'read', 'replied', 'archived'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid' });
  db.prepare('UPDATE contacts SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true, message: 'Status diupdate' });
});

// DELETE /api/contact/admin/:id
router.delete('/admin/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id=?').run(req.params.id);
  res.json({ success: true, message: 'Contact dihapus' });
});

// GET /api/contact/admin/stats
router.get('/admin/stats', requireAuth, (req, res) => {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as c FROM contacts').get().c,
    new: db.prepare("SELECT COUNT(*) as c FROM contacts WHERE status='new'").get().c,
    today: db.prepare("SELECT COUNT(*) as c FROM contacts WHERE date(created_at)=date('now')").get().c,
  };
  res.json({ success: true, data: stats });
});

module.exports = router;
