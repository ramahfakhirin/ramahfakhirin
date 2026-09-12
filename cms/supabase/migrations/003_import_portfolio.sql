-- =============================================================
-- RAMAHFAKHIRIN CMS - Import Portfolio (19 projects)
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================================

insert into public.projects (slug, title, category, client, year, summary, content,
  thumbnail, url, tags, is_featured, is_published, sort_order)
values
  ('nano-yearbook', 'Nano Yearbook', 'Yearbook', 'Nano Indonesia', '2017 — now',
   'Indonesia''s #1 Digital Yearbook Organizer, since 2017.',
   '<p>Indonesia''s #1 Digital Yearbook Organizer · Since 2017</p>',
   'assets/img/porto/1nanoyearbook.png', 'https://nanoyearbook.com',
   '["Yearbook", "Platform", "Branding"]', true, true, 1),

  ('cv-abinawa', 'CV. Abinawa', 'Web', 'CV. Abinawa', '2025',
   'Professional General Contractor & Supplier in Indonesia.',
   '<p>Professional General Contractor & Supplier in Indonesia</p>',
   'assets/img/porto/2abinawa.png', 'https://abinawa.co.id',
   '["Company Profile", "SEO"]', false, true, 2),

  ('dinchara-ma-ci-amanatul-ummah', 'DINCHARA — MA CI Amanatul Ummah', 'Yearbook', 'MA CI Amanatul Ummah', '2025',
   'HTML/CSS/JS · PDF Flipbook · Animated yearbook for MA CI Amanatul Ummah.',
   '<p>HTML/CSS/JS · PDF Flipbook · Animated</p>',
   'assets/img/porto/3dinchara.png', 'https://nano.co.id/ebook/ma-ci-amanatul-ummah-2025/',
   '["Flipbook", "Animation"]', false, true, 3),

  ('project-tracking-nanoidn', 'Project Tracking — Nanoidn', 'Web App', 'Nano Indonesia', '2025',
   'Internal project management, tracking, and CRM system for Nano Indonesia.',
   '<p>Management Project · Tracking · CRM</p>',
   'assets/img/porto/4trackingnano.png', 'https://tracking.nano.co.id/',
   '["Web App", "Dashboard"]', false, true, 4),

  ('pt-nano-indonesia-sakti', 'PT. Nano Indonesia Sakti', 'Web', 'PT Nano Indonesia Sakti', '2024',
   'Company website for Nano Indonesia Sakti — Production House & Event Organizer.',
   '<p>Production House · Yearbook & Event Organizer</p>',
   'assets/img/porto/5nanocoid.png', 'https://nano.co.id/',
   '["Company Profile", "CMS"]', false, true, 5),

  ('astra-najmia-smp-al-furqan', 'Astra Najmia — SMP AL-Furqan', 'Yearbook', 'SMP AL-Furqan', '2026',
   'HTML/CSS/JS · PDF Flipbook · Animated yearbook for SMP AL-Furqan (2026).',
   '<p>HTML/CSS/JS · PDF Flipbook · Animated</p>',
   'assets/img/porto/6astranajmia.png', 'https://nano.co.id/ebook/smp-al-furqan-2026',
   '["Flipbook", "Animation"]', false, true, 6),

  ('nanoidn-bisnis-crm', 'Nanoidn Bisnis CRM', 'Web App', 'Nano Indonesia', '2025',
   'Customer relationship management web application for Nano Indonesia business operations.',
   '<p>Web Application · Customer Relationship Management</p>',
   'assets/img/porto/7bisnisnano.png', 'https://bisnisup.nano.co.id',
   '["CRM", "Multi-role"]', false, true, 7),

  ('nanoidn-ar-integration', 'Nanoidn AR Integration', 'AR Tech', 'Nano Indonesia', '2025',
   'Augmented Reality integration providing interactive experiences for Nano Indonesia.',
   '<p>Augmented Reality · Interactive Experience</p>',
   'assets/img/porto/8arnano.png', 'https://ar.nano.co.id',
   '["Web AR", "Interactive"]', false, true, 8),

  ('hris-nanoidn-attendance-pwa', 'HRIS Nanoidn — Attendance PWA', 'Web App', 'Nano Indonesia', '2025',
   'Mobile-first progressive web app for HR attendance tracking at Nano Indonesia.',
   '<p>Web Application · Mobile-first</p>',
   'assets/img/porto/9hrisnano.png', 'https://hrisnano.nano.co.id',
   '["PWA", "Attendance"]', false, true, 9),

  ('uwu-trade-trash-bank', 'UWU Trade — Trash Bank', 'Web App', 'UWU Trade', '2026',
   'Mobile-first web application for waste bank (trash bank) trading platform.',
   '<p>Web Application · Mobile-first · Waste Bank</p>',
   'assets/img/porto/10uwu.png', 'https://uwu.ramahfakhirin.com',
   '["Web App", "Mobile-first"]', false, true, 10),

  ('rectovious-sman-1-kencong', 'RECTOVIOUS — SMAN 1 Kencong', 'Yearbook', 'SMAN 1 Kencong', '2024',
   'HTML/CSS/JS · PDF Flipbook · Animated yearbook with custom theme for SMAN 1 Kencong.',
   '<p>HTML/CSS/JS · PDF Flipbook · Animated</p>',
   null, null,
   '["Flipbook", "Custom Theme"]', false, true, 11),

  ('nano-ar-technology', 'Nano AR Technology', 'AR Tech', 'Nano Indonesia', '2025',
   'Augmented Reality Image-to-Video Engine with marker-based tracking technology.',
   '<p>Augmented Reality · Image-to-Video Engine</p>',
   null, null,
   '["Web AR", "Marker"]', false, true, 12),

  ('ascendants-2025-sma-shafta', 'ASCENDANTS 2025 — SMA SHAFTA', 'Yearbook', 'SMA SHAFTA Surabaya', '2025',
   'Harry Potter themed digital yearbook for SMA SHAFTA Surabaya class of 2025.',
   '<p>Harry Potter Theme · Surabaya · 2025</p>',
   null, null,
   '["Themed", "Flipbook"]', false, true, 13),

  ('nano-eo-graduation-events', 'Nano EO — Graduation Events', 'Event', 'Nano Indonesia', '2025',
   'Graduation and commencement event organizer covering Jember and East Java region.',
   '<p>Event Organizer · Jember & East Java</p>',
   null, null,
   '["Event", "Production"]', false, true, 14),

  ('sensi-nano-internal-pwa', 'SENSI — Nano Internal PWA', 'Web App', 'Nano Indonesia', '2025',
   'Internal progressive web app for Nano Indonesia with role-based access control.',
   '<p>Progressive Web App · Role-based Access</p>',
   null, null,
   '["PWA", "Multi-role"]', false, true, 15),

  ('carolusians-31', 'Carolusians 31 — Yearbook Site', 'Yearbook', 'Carolusians 31', '2025',
   'Multi-page digital flipbook yearbook with custom theme for Carolusians 31 class.',
   '<p>Multi-page Flipbook · Custom Theme</p>',
   null, null,
   '["Flipbook", "Custom Theme"]', false, true, 16),

  ('pancaastra-yearbook-website', 'Pancaastra — Yearbook Website', 'Yearbook', 'Pancaastra', '2025',
   'Responsive yearbook website with guestbook feature for Pancaastra class.',
   '<p>Responsive Layout · Guestbook Feature</p>',
   null, null,
   '["Responsive", "Guestbook"]', false, true, 17),

  ('azveron-ar-yearbook', 'AZVERON — AR Yearbook', 'AR Tech', 'AZVERON', '2025',
   'Augmented Reality integrated yearbook experience, mobile-first design.',
   '<p>Augmented Reality · Mobile-first</p>',
   null, null,
   '["Web AR", "Mobile-first"]', false, true, 18),

  ('dinchara-graduation-event', 'Dinchara — Graduation Event', 'Event', 'Dinchara', '2025',
   'Full production graduation event including stage setup and decoration services.',
   '<p>Full Production · Stage & Decor</p>',
   null, null,
   '["Event", "Decoration"]', false, true, 19)
on conflict (slug) do update
  set title = excluded.title, category = excluded.category, client = excluded.client,
      year = excluded.year, summary = excluded.summary, content = excluded.content,
      thumbnail = excluded.thumbnail, url = excluded.url, tags = excluded.tags,
      is_featured = excluded.is_featured, is_published = excluded.is_published,
      sort_order = excluded.sort_order;
