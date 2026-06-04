// src/routes/posts.js
const router = require('express').Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const slugify = require('slugify');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(process.env.UPLOAD_DIR || 'public/uploads', 'blog');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Hanya file gambar'));
    cb(null, true);
  }
});

// ── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/posts
router.get('/', (req, res) => {
  const { tag, limit = 10, offset = 0 } = req.query;
  let sql = 'SELECT id,title,slug,excerpt,thumbnail,tags,views,created_at FROM posts WHERE published=1';
  const params = [];
  if (tag) { sql += " AND tags LIKE ?"; params.push(`%"${tag}"%`); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const rows = db.prepare(sql).all(...params);
  rows.forEach(r => { try { r.tags = JSON.parse(r.tags); } catch { r.tags = []; } });

  const total = db.prepare('SELECT COUNT(*) as c FROM posts WHERE published=1').get().c;
  res.json({ success: true, data: rows, total, hasMore: parseInt(offset)+rows.length < total });
});

// GET /api/posts/:slug — single post + increment views
router.get('/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE slug=? AND published=1').get(req.params.slug);
  if (!post) return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });
  // Increment views
  db.prepare("UPDATE posts SET views=views+1 WHERE id=?").run(post.id);
  post.views += 1;
  try { post.tags = JSON.parse(post.tags); } catch { post.tags = []; }
  res.json({ success: true, data: post });
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/posts/admin/all
router.get('/admin/all', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  rows.forEach(r => { try { r.tags = JSON.parse(r.tags); } catch { r.tags = []; } });
  res.json({ success: true, data: rows });
});

// POST /api/posts
router.post('/', requireAuth, upload.single('thumbnail'), (req, res) => {
  const { title, excerpt, content, tags, published } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, message: 'Title dan content wajib diisi' });

  let slug = slugify(title, { lower: true, strict: true });
  const existing = db.prepare('SELECT id FROM posts WHERE slug=?').get(slug);
  if (existing) slug += `-${Date.now()}`;

  const thumbnail = req.file ? `/uploads/blog/${req.file.filename}` : null;
  const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

  const result = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, thumbnail, tags, published, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(title, slug, excerpt||null, content, thumbnail, tagsStr, published?1:0);

  res.json({ success: true, id: result.lastInsertRowid, slug });
});

// PUT /api/posts/:id
router.put('/:id', requireAuth, upload.single('thumbnail'), (req, res) => {
  const { title, excerpt, content, tags, published } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });

  const thumbnail = req.file ? `/uploads/blog/${req.file.filename}` : post.thumbnail;
  const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

  db.prepare(`
    UPDATE posts SET title=?, excerpt=?, content=?, thumbnail=?, tags=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(title||post.title, excerpt||null, content||post.content, thumbnail, tagsStr,
         published!==undefined?parseInt(published):post.published, req.params.id);

  res.json({ success: true, message: 'Post berhasil diupdate' });
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });
  db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  if (post.thumbnail) {
    const file = path.resolve('public', post.thumbnail.replace(/^\//, ''));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  res.json({ success: true, message: 'Post berhasil dihapus' });
});

module.exports = router;
