# Ramahfakhirin CMS

Admin panel untuk mengelola konten `ramahfakhirin.com`.
Tema disamakan persis dengan website utama: accent `#7463FF`, background `#F7F7FD`, font Phudu + Onest.

## Stack

- React 18 + Vite
- React Router (SPA, base path `/admin`)
- Supabase — Postgres, Auth, Storage, Realtime

## Fitur

| Menu | Isi |
|------|-----|
| Dashboard | Ringkasan konten, pesan terbaru, aktivitas |
| Halaman & Section | Edit hero, judul, paragraf, list, statistik, FAQ, CTA per halaman |
| Portfolio | CRUD project + upload thumbnail + tag + unggulan |
| Services | CRUD layanan + daftar fitur |
| Pricelist | Paket harga dan add-on |
| Blog | Tulis artikel, jadwal terbit, draft/tayang, hitung views |
| FAQ | Tanya jawab per halaman |
| Pesan Masuk | Submission form kontak, status, export CSV |
| Media | Galeri file di Supabase Storage |
| Pengaturan | Kontak, sosial media, SEO, ganti password |

Semua daftar memakai Supabase Realtime — perubahan dari perangkat lain langsung tampil tanpa refresh.

---

## Setup

### 1. Jalankan migration di Supabase

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan berurutan:

1. `supabase/migrations/001_schema.sql` — tabel, RLS, storage bucket, realtime
2. `supabase/migrations/002_seed.sql` — data awal sesuai isi website sekarang

### 2. Buat akun admin

**a.** Di **Authentication → Users → Add user**, buat user baru
(isi email + password, centang *Auto Confirm User*).

**b.** Salin `User UID` dari user tadi, lalu jalankan di SQL Editor:

```sql
insert into public.admins (id, email, full_name, role)
values ('PASTE-USER-UID-DI-SINI', 'email@kamu.com', 'Nama Kamu', 'owner');
```

Tanpa baris di tabel `admins`, login akan ditolak meski password benar.

### 3. Konfigurasi environment

```powershell
Copy-Item .env.example .env
```

Isi `.env` dengan nilai dari **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_SUPABASE_BUCKET=cms-media
VITE_SITE_URL=https://ramahfakhirin.com
```

> Gunakan **anon key**, bukan `service_role`. Anon key memang dirancang untuk
> dipakai di browser dan dibatasi oleh RLS. `service_role` melewati semua RLS,
> jadi jangan pernah dimasukkan ke file `.env` frontend atau di-commit.

### 4. Jalankan

```powershell
npm install
npm run dev      # http://localhost:5174/admin
```

### 5. Build untuk produksi

```powershell
npm run build
```

Hasil ada di `cms/dist/`. Upload isinya ke folder `/admin` di hosting.

Karena ini SPA, tambahkan rewrite di `.htaccess` root supaya refresh di
`/admin/portfolio` tidak menghasilkan 404:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/admin
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /admin/index.html [L]
```

---

## Menghubungkan website statis ke CMS

Loader ada di `assets/js/rf-cms.js`. Tambahkan sebelum `</body>` pada tiap halaman:

```html
<script>
  window.RF_CMS_CONFIG = {
    url: 'https://xxxxxxxx.supabase.co',
    anonKey: 'eyJhbGciOi...',
    page: 'home'   // home | about | services | portfolio | pricelist | blog | contact
  };
</script>
<script src="assets/js/rf-cms.js" defer></script>
```

### Menandai elemen

Isi HTML yang sudah ada berfungsi sebagai fallback. Kalau CMS kosong atau
koneksi gagal, halaman tetap tampil seperti sekarang.

```html
<h1 data-cms="home.hero.title">Turning Ideas<br>Into Impact.</h1>
<p  data-cms="home.hero.subtitle">Entrepreneur, creative director…</p>

<a  data-cms="home.hero.cta_label"
    data-cms-attr="href:home.hero.cta_url">Let's Talk</a>

<img data-cms-attr="src:home.hero.image" src="assets/img/update/hero/hero-thumb-1.jpg">

<span data-cms="settings.contact_phone">+62 822 4471 9826</span>
```

Format kunci: `<page>.<section_key>.<field>`, atau `settings.<key>` untuk
pengaturan global. Kunci setiap section terlihat di menu **Halaman & Section**.

### Data list (portfolio, blog, harga)

Untuk daftar yang butuh markup khusus, ambil datanya lalu bangun DOM sendiri:

```html
<script>
document.addEventListener('rf-cms:rendered', function () {
  RFCMS.projects(12).then(function (rows) {
    var wrap = document.querySelector('#portfolio-grid');
    if (!wrap || !rows.length) return;   // tanpa data, markup statis dibiarkan
    wrap.innerHTML = rows.map(function (p) {
      return '<div class="rf-porto-card">' +
               '<img src="' + p.thumbnail + '" alt="">' +
               '<h3>' + p.title + '</h3>' +
               '<p>' + (p.summary || '') + '</p>' +
             '</div>';
    }).join('');
  });
});
</script>
```

Method tersedia: `RFCMS.projects()`, `.posts()`, `.services()`, `.plans()`,
`.addons()`, `.faqs()`, `.value(key)`, `.get(path)`.

### Form kontak

```html
<script>
document.querySelector('#contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var f = e.target;
  RFCMS.sendMessage({
    name: f.name.value,
    email: f.email.value,
    phone: f.phone ? f.phone.value : '',
    subject: f.subject ? f.subject.value : '',
    message: f.message.value
  })
  .then(function () { alert('Pesan terkirim. Terima kasih!'); f.reset(); })
  .catch(function () { alert('Gagal mengirim. Coba lagi nanti.'); });
});
</script>
```

Pesan langsung muncul di menu **Pesan Masuk** secara realtime.

---

## Catatan keamanan

- Anon key hanya bisa membaca konten `is_published = true` dan menulis ke tabel `messages`.
- Semua operasi tulis lain butuh user yang terdaftar di tabel `admins` (dicek fungsi `is_admin()`).
- Field judul mengizinkan HTML sederhana (`<br>`, `<span>`, `<em>`) karena hanya
  bisa diisi admin terautentikasi. Jangan menambahkan role publik yang bisa
  menulis ke tabel `sections`.
- `.env` sudah masuk `.gitignore`. Jangan commit credential.

---

## Struktur

```
cms/
├── index.html
├── vite.config.js
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/theme.css        # palet identik ramah.css
│   ├── lib/
│   │   ├── supabase.js         # client
│   │   ├── AuthContext.jsx     # auth + cek admin
│   │   ├── ToastContext.jsx
│   │   ├── useRealtimeTable.js # fetch + subscription realtime
│   │   ├── api.js              # CRUD, upload, activity log
│   │   └── utils.js
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── ui.jsx              # Card, Button, Modal, Repeater, dll
│   │   ├── ImageField.jsx
│   │   └── Icons.jsx
│   └── pages/                  # Login, Dashboard, PagesEditor, Portfolio,
│                               # Services, Pricing, Blog, Faq, Messages,
│                               # Media, Settings
└── supabase/migrations/
    ├── 001_schema.sql
    └── 002_seed.sql
```
