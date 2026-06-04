// src/routes/projects.js
const router = require('express').Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const slugify = require('slugify');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Multer config for thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(process.env.UPLOAD_DIR || 'public/uploads', 'projects');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Hanya file gambar yang diizinkan'));
    cb(null, true);
  }
});

// ── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/projects — list published projects
router.get('/', (req, res) => {
  const { category, featured, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT id,title,slug,category,description,thumbnail,url,tags,featured,sort_order,created_at FROM projects WHERE published=1';
  const params = [];
  if (category) { sql += ' AND category=?'; params.push(category); }
  if (featured) { sql += ' AND featured=1'; }
  sql += ' ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const rows = db.prepare(sql).all(...params);
  rows.forEach(r => { try { r.tags = JSON.parse(r.tags); } catch { r.tags = []; } });
  res.json({ success: true, data: rows });
});

// GET /api/projects/:slug — single project
router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE slug=? AND published=1').get(req.params.slug);
  if (!row) return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
  try { row.tags = JSON.parse(row.tags); } catch { row.tags = []; }
  res.json({ success: true, data: row });
});

// ── ADMIN (requires JWT) ───────────────────────────────────────────────────

// GET /api/projects/admin/all
router.get('/admin/all', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC').all();
  rows.forEach(r => { try { r.tags = JSON.parse(r.tags); } catch { r.tags = []; } });
  res.json({ success: true, data: rows });
});

// POST /api/projects — create
router.post('/', requireAuth, upload.single('thumbnail'), (req, res) => {
  const { title, category, description, content, url, tags, featured, published, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ success: false, message: 'Title dan category wajib diisi' });

  let slug = slugify(title, { lower: true, strict: true });
  // Ensure unique slug
  const existing = db.prepare('SELECT id FROM projects WHERE slug=?').get(slug);
  if (existing) slug += `-${Date.now()}`;

  const thumbnail = req.file ? `/uploads/projects/${req.file.filename}` : null;
  const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

  const result = db.prepare(`
    INSERT INTO projects (title,slug,category,description,content,thumbnail,url,tags,featured,published,sort_order,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?, datetime('now'))
  `).run(title, slug, category, description||null, content||null, thumbnail, url||null, tagsStr,
         featured?1:0, published!==undefined?parseInt(published):1, parseInt(sort_order)||0);

  res.json({ success: true, id: result.lastInsertRowid, slug });
});

// PUT /api/projects/:id — update
router.put('/:id', requireAuth, upload.single('thumbnail'), (req, res) => {
  const { title, category, description, content, url, tags, featured, published, sort_order } = req.body;
  const proj = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });

  const thumbnail = req.file ? `/uploads/projects/${req.file.filename}` : proj.thumbnail;
  const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

  db.prepare(`
    UPDATE projects SET
      title=?, category=?, description=?, content=?, thumbnail=?, url=?, tags=?,
      featured=?, published=?, sort_order=?, updated_at=datetime('now')
    WHERE id=?
  `).run(title||proj.title, category||proj.category, description||null, content||null,
         thumbnail, url||null, tagsStr, featured?1:0,
         published!==undefined?parseInt(published):proj.published,
         parseInt(sort_order)||proj.sort_order, req.params.id);

  res.json({ success: true, message: 'Project berhasil diupdate' });
});

// DELETE /api/projects/:id
router.delete('/:id', requireAuth, (req, res) => {
  const proj = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
  db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  // Clean up thumbnail file
  if (proj.thumbnail) {
    const file = path.resolve('public', proj.thumbnail.replace(/^\//, ''));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  res.json({ success: true, message: 'Project berhasil dihapus' });
});

// PUT /api/projects/reorder — update sort order
router.put('/admin/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // [{ id, sort_order }]
  if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Invalid order data' });
  const update = db.prepare('UPDATE projects SET sort_order=? WHERE id=?');
  const tx = db.transaction((items) => items.forEach(i => update.run(i.sort_order, i.id)));
  tx(order);
  res.json({ success: true });
});

module.exports = router;
