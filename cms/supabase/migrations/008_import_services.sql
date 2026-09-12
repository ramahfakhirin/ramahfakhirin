-- =============================================================
-- RAMAHFAKHIRIN CMS - Import Services dari services.html
-- Jalankan di Supabase Dashboard > SQL Editor
--
-- Sumber:
--   #core       -> 4 layanan inti (svc-block)
--   #divisions  -> 3 divisi spesialis (spec-item)
-- Tag <b> dilepas supaya teks rapi saat diedit di CMS.
-- Aman dijalankan berulang.
-- =============================================================

-- -------------------------------------------------------------
-- Kolom tambahan agar seluruh detail kartu tersimpan
-- -------------------------------------------------------------
alter table public.services
  add column if not exists label     text,   -- "Service 01"
  add column if not exists kind      text,   -- core | division
  add column if not exists anchor    text,   -- id section di HTML
  add column if not exists tags      jsonb not null default '[]'::jsonb,
  add column if not exists meta      jsonb not null default '[]'::jsonb,
  add column if not exists dlv_note  text;   -- subjudul blok "What you get"

-- -------------------------------------------------------------
-- 1. LAYANAN INTI (4)
-- -------------------------------------------------------------
insert into public.services
  (slug, title, subtitle, label, kind, anchor, icon, description,
   tags, features, meta, dlv_note, is_published, sort_order)
values
  ('web-design-development', 'Web Design & Development', 'What you get',
   'Service 01', 'core', 'web', '🌐',
   'Landing pages, company profiles, yearbook sites, e-commerce, and custom web applications. Every build starts with the business goal, gets designed in Figma before a line of code is written, and ships fast, responsive, and search-ready.',
   jsonb_build_array('HTML/CSS/JS', 'Laravel', 'Next.js', 'CMS', 'PWA', 'E-commerce', 'REST API', 'Technical SEO'),
   jsonb_build_array(
     'Custom UI design in Figma, reviewed and approved before development',
     'Fully responsive build — tested on mobile, tablet, and desktop',
     'Domain and hosting configured for the first year, SSL active',
     'On-page SEO, sitemap, Google Analytics and Search Console setup',
     'CMS so your team can update content without touching code',
     'Contact forms, WhatsApp integration, and Google Maps embed',
     'Speed optimization and Core Web Vitals tuning',
     'Full source code handover plus a training session'
   ),
   jsonb_build_array(
     jsonb_build_object('label', 'Typical timeline', 'value', '7 days – 3 months'),
     jsonb_build_object('label', 'Starting from',   'value', 'Rp 5,000,000'),
     jsonb_build_object('label', 'Source code',     'value', '100% yours')
   ),
   'Deliverables included in every web project', true, 1),

  ('visual-creators', 'Visual Creators', 'What you get',
   'Service 02', 'core', 'visual', '📢',
   'Design and branding, motion and multimedia, social content, layout and graphic design. This is the division that turns a strategy deck into something people actually stop scrolling for — consistent across every channel you publish on.',
   jsonb_build_array('Graphic Design', 'Motion Graphics', 'Layout Design', 'Social Content', 'Adobe Suite', 'Illustration', 'Print Ready'),
   jsonb_build_array(
     'Social media kits — feed, story, reel covers, and carousel templates',
     'Motion graphics and animated explainers for campaigns',
     'Editorial layout for yearbooks, catalogues, magazines, and reports',
     'Marketing collateral: banners, posters, standees, merchandise mockups',
     'Presentation and pitch deck design',
     'Editable master files handed over (AI, PSD, AE, Figma)',
     'Print-ready exports with correct bleed, CMYK, and resolution',
     'Template systems so your team can keep producing on-brand'
   ),
   jsonb_build_array(
     jsonb_build_object('label', 'Typical timeline', 'value', '3 – 21 days'),
     jsonb_build_object('label', 'Formats',          'value', 'Digital + print'),
     jsonb_build_object('label', 'Revisions',        'value', 'Up to 4 rounds')
   ),
   'Visual assets built for consistency at scale', true, 2),

  ('brand-strategy', 'Brand Strategy', 'What you get',
   'Service 03', 'core', 'brand', '🎯',
   'Brand identity, positioning, messaging, visual direction, digital marketing, and Google Ads. I''ve spent nine years building a brand from zero, so strategy here is not a slide deck — it''s the decisions that determine whether the work sells.',
   jsonb_build_array('Brand Identity', 'Positioning', 'Messaging', 'Google Ads', 'SEO Strategy', 'Content Plan', 'Analytics'),
   jsonb_build_array(
     'Brand discovery workshop with your decision makers',
     'Competitive audit and market positioning statement',
     'Logo system, colour palette, typography, and usage rules',
     'Complete brand guideline document (PDF + editable source)',
     'Messaging framework: tone of voice, key lines, elevator pitch',
     'Google Ads campaign setup with keyword research and conversion tracking',
     'Content pillar plan and a 90-day publishing calendar',
     'Monthly performance reporting with plain-language recommendations'
   ),
   jsonb_build_array(
     jsonb_build_object('label', 'Typical timeline', 'value', '2 – 6 weeks'),
     jsonb_build_object('label', 'Certified in',     'value', 'Google Ads, HubSpot'),
     jsonb_build_object('label', 'Output',           'value', 'Guideline + playbook')
   ),
   'Strategy documents you can actually execute against', true, 3),

  ('photo-video', 'Photo & Video', 'What you get',
   'Service 04', 'core', 'photo', '📷',
   'Event photography, short-form video, content creation, film-making, commercial ads, product shoots, and company profiles. Full in-house production — from the first storyboard to the final colour grade, with no third-party hand-offs.',
   jsonb_build_array('Event Coverage', 'Product Photography', 'Company Profile', 'Short-form Video', 'Commercial Ads', 'Colour Grading', 'Aerial'),
   jsonb_build_array(
     'Pre-production: concept, storyboard, shot list, and scheduling',
     'Full-day event coverage with multi-camera and audio capture',
     'Studio product photography with retouching and clean cutouts',
     'Company profile videos, 60–90 seconds, fully produced',
     'Short-form vertical edits sized for Reels, TikTok, and Shorts',
     'Aerial and drone footage where the location permits',
     'Professional colour grading, sound mix, and subtitle burn-in',
     'Selected raw files delivered alongside the final edit'
   ),
   jsonb_build_array(
     jsonb_build_object('label', 'Typical timeline', 'value', '7 – 30 days'),
     jsonb_build_object('label', 'Crew',             'value', 'In-house team'),
     jsonb_build_object('label', 'Delivery',         'value', 'Raw + graded')
   ),
   'Production handled end to end', true, 4),

-- -------------------------------------------------------------
-- 2. DIVISI SPESIALIS (3)
-- -------------------------------------------------------------
  ('digital-yearbook', 'Digital Yearbook', null,
   null, 'division', 'divisions', '📖',
   'One of the leading digital yearbook organizers in Indonesia. Interactive flipbooks, custom-themed microsites, and printed companions — handled from photoshoot to launch day.',
   '[]'::jsonb,
   jsonb_build_array(
     'Custom-themed yearbook website per school',
     'Animated PDF flipbook with page-turn engine',
     'Class photoshoot, styling, and retouching',
     'Guestbook, profile pages, and memory galleries',
     'Printed book production and delivery'
   ),
   '[]'::jsonb, null, true, 5),

  ('ar-technology', 'AR Technology', null,
   null, 'division', 'divisions', '🕶️',
   'Web-based augmented reality that runs in a browser — no app download. Point a phone at a printed page and it plays. The feature that made client yearbooks stand out from every other school in the region.',
   '[]'::jsonb,
   jsonb_build_array(
     'Image-to-video AR engine (marker based)',
     'Runs in mobile browser, no install needed',
     '3D model viewer and product try-on',
     'Interactive filters for social campaigns',
     'Printed marker design included'
   ),
   '[]'::jsonb, null, true, 6),

  ('event-organizer', 'Event Organizer', null,
   null, 'division', 'divisions', '🎪',
   'Graduation ceremonies, school events, and corporate productions across East Java and beyond. Rundown, stage, décor, documentation — one team accountable for the whole day.',
   '[]'::jsonb,
   jsonb_build_array(
     'Concept, rundown, and full event planning',
     'Stage design, décor, and set production',
     'Lighting, sound, and multimedia operation',
     'MC coordination and talent booking',
     'Photo and video documentation on the day'
   ),
   '[]'::jsonb, null, true, 7)

on conflict (slug) do update
  set title = excluded.title, subtitle = excluded.subtitle, label = excluded.label,
      kind = excluded.kind, anchor = excluded.anchor, icon = excluded.icon,
      description = excluded.description, tags = excluded.tags,
      features = excluded.features, meta = excluded.meta,
      dlv_note = excluded.dlv_note, is_published = excluded.is_published,
      sort_order = excluded.sort_order;

-- -------------------------------------------------------------
-- Verifikasi
-- -------------------------------------------------------------
select sort_order, kind, icon, title, label,
       jsonb_array_length(tags)     as jumlah_tag,
       jsonb_array_length(features) as jumlah_deliverable,
       jsonb_array_length(meta)     as jumlah_meta
from public.services
order by sort_order;
