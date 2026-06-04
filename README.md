# ramahfakhirin-backend — Deployment Guide (cPanel)

## Stack
- Node.js 18+ + Express
- SQLite (better-sqlite3) — zero config, file-based
- Nodemailer — email notif
- JWT auth
- Admin dashboard di `/admin`

---

## Cara Deploy ke Shared Hosting (cPanel)

### 1. Upload files
Upload seluruh folder ini ke server via cPanel File Manager atau FTP.
**Rekomendasi path:** `/home/username/ramahfakhirin-backend/`

### 2. Setup Node.js App di cPanel
1. Buka **cPanel → Setup Node.js App**
2. Klik **Create Application**
3. Isi:
   - Node.js version: **18.x** atau lebih baru
   - Application mode: **Production**
   - Application root: `ramahfakhirin-backend`
   - Application URL: domain atau subdomain (misal `api.ramahfakhirin.com`)
   - Application startup file: `src/app.js`
4. Klik **Create**

### 3. Install dependencies
Di terminal cPanel (SSH atau Terminal):
```bash
cd ~/ramahfakhirin-backend
npm install --production
```

### 4. Setup environment variables
Di cPanel Node.js App → klik **Edit** → tambahkan env vars:
```
PORT=3000
NODE_ENV=production
JWT_SECRET=isi_dengan_random_string_64_karakter
ADMIN_USERNAME=rama
ADMIN_PASSWORD=password_aman_kamu
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ramafakhirin@gmail.com
SMTP_PASS=gmail_app_password
NOTIFY_EMAIL=ramafakhirin@gmail.com
SITE_URL=https://ramahfakhirin.com
DB_PATH=database/app.db
UPLOAD_DIR=public/uploads
```

Atau copy `.env.example` → `.env` dan edit:
```bash
cp .env.example .env
nano .env
```

### 5. Setup database + seed data
```bash
npm run setup
```
Ini akan membuat database, admin account, dan sample data.

### 6. Start app
Di cPanel Node.js App → klik **Run JS Script** → pilih `src/setup.js` (sekali)
Lalu klik **Restart** untuk start server.

---

## Gmail App Password (untuk email)
1. Aktifkan 2FA di akun Gmail kamu
2. Buka https://myaccount.google.com/apppasswords
3. Buat app password baru → pilih "Mail"
4. Copy 16-digit password → isi ke `SMTP_PASS`

---

## Struktur API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/projects` | List projects (public) |
| POST | `/api/projects` | Buat project (auth) |
| PUT | `/api/projects/:id` | Update project (auth) |
| DELETE | `/api/projects/:id` | Hapus project (auth) |
| GET | `/api/posts` | List blog posts (public) |
| GET | `/api/posts/:slug` | Detail post + views++ |
| POST | `/api/posts` | Buat post (auth) |
| POST | `/api/contact` | Submit contact form (public) |
| GET | `/api/contact/admin` | List contacts (auth) |
| POST | `/api/analytics/view` | Track page view (public) |
| POST | `/api/analytics/event` | Track event (public) |
| GET | `/api/analytics/admin/summary` | Dashboard data (auth) |
| GET | `/api/settings` | Public settings |
| PUT | `/api/settings/admin` | Update settings (auth) |

---

## Connect Frontend

### Contact form
Di `index.html`, tambahkan submit handler untuk form contact:
```javascript
document.querySelector('#contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('https://api.ramahfakhirin.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: e.target.name.value,
      email: e.target.email.value,
      subject: e.target.subject?.value,
      message: e.target.message.value,
    })
  });
  const data = await res.json();
  alert(data.message);
});
```

### Analytics tracking
Tambahkan sebelum `</body>` di frontend:
```html
<script src="https://api.ramahfakhirin.com/rf-analytics.js"></script>
```

### Load dynamic projects
```javascript
fetch('https://api.ramahfakhirin.com/api/projects')
  .then(r => r.json())
  .then(({ data }) => {
    // render projects ke DOM
  });
```

---

## Admin Dashboard
Akses: `https://api.ramahfakhirin.com/admin`

Login dengan username/password yang di-set di `.env`

### Fitur Dashboard:
- 📊 **Analytics** — page views, unique visitors, realtime active, chart 14 hari
- 📁 **Portfolio CMS** — tambah/edit/hapus project, upload thumbnail, set featured
- 📝 **Blog** — tulis/edit artikel dengan HTML editor
- 📩 **Pesan** — lihat semua contact form, update status, balas via email
- ⚙️ **Settings** — edit hero text, stats, social links, ganti password

---

## File Structure
```
ramahfakhirin-backend/
├── src/
│   ├── app.js           # Main Express server
│   ├── database.js      # SQLite setup + schema
│   ├── setup.js         # Seed script (run once)
│   ├── middleware/
│   │   └── auth.js      # JWT middleware
│   └── routes/
│       ├── auth.js      # Login, change password
│       ├── projects.js  # Portfolio CRUD
│       ├── posts.js     # Blog CRUD
│       ├── contact.js   # Contact form + email
│       ├── analytics.js # Tracking + dashboard
│       └── settings.js  # Site settings
├── public/
│   ├── admin/
│   │   └── index.html   # Admin dashboard SPA
│   ├── uploads/         # User-uploaded images (auto-created)
│   └── rf-analytics.js  # Frontend tracking snippet
├── database/            # SQLite files (auto-created)
├── package.json
├── .env.example
└── README.md
```
