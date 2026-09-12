-- =============================================================
-- RAMAHFAKHIRIN CMS - Import Pricelist dari pricelist.html
-- Jalankan di Supabase Dashboard > SQL Editor
--
-- Sumber: section #paket (5 kartu) dan #addon (16 kartu).
-- Tag <b> dilepas supaya teks fitur rapi saat diedit di CMS.
-- Aman dijalankan berulang.
-- =============================================================

-- -------------------------------------------------------------
-- Kolom tambahan agar seluruh detail kartu tersimpan
-- -------------------------------------------------------------
alter table public.pricing_plans
  add column if not exists icon     text,
  add column if not exists subtitle text,
  add column if not exists meta     jsonb not null default '{}'::jsonb;

alter table public.pricing_addons
  add column if not exists icon       text,
  add column if not exists price_note text;

-- -------------------------------------------------------------
-- 1. PAKET HARGA
-- -------------------------------------------------------------
insert into public.pricing_plans
  (slug, name, icon, price, price_note, subtitle, description, features,
   meta, cta_label, cta_url, is_popular, is_published, sort_order)
values
  ('starter', 'Starter', '🚀', 'Rp 5.000.000', 'Starting from',
   'One-time payment • includes domain & 1-year hosting',
   'Landing page & mini company profile for UMKM, personal brand, and events.',
   jsonb_build_array(
     '1–3 pages (One Page / Landing)',
     'Premium template design customized to your brand',
     '100% mobile responsive & lightweight',
     '.com domain + 1-year SSD hosting',
     'Active SSL certificate (HTTPS)',
     'Contact form + floating WhatsApp button',
     'Google Maps & social media integration',
     'Basic on-page SEO + Google Analytics',
     'Basic copywriting for 1 page',
     '2 design revisions'
   ),
   jsonb_build_object('estimate', '7–10 working days', 'revisions', '2x',
                      'warranty', '1 month', 'button_class', 'btn-ghost'),
   'Get Starter Package',
   'https://wa.me/6282244719826?text=Hi%2C%20I%20am%20interested%20in%20the%20STARTER%20package',
   false, true, 1),

  ('business', 'Business', '🏢', 'Rp 12.500.000', 'Starting from',
   'One-time payment • custom design, not template',
   'Complete company profile with CMS — manage content yourself.',
   jsonb_build_array(
     '6–10 custom pages',
     'Custom UI design (Figma) per brand guideline',
     'CMS — manage content without coding',
     'Blog / articles module + categories & tags',
     'Product or service catalog (non-transaction)',
     'Bilingual Indonesian & English',
     'On-page SEO + Search Console + sitemap',
     '5 business email accounts (nama@domain.com)',
     'Domain + 1-year SSD hosting',
     '1-session CMS usage training'
   ),
   jsonb_build_object('estimate', '14–21 working days', 'revisions', '4x',
                      'warranty', '3 months', 'button_class', 'btn-purple'),
   'Get Business Package',
   'https://wa.me/6282244719826?text=Hi%2C%20I%20am%20interested%20in%20the%20BUSINESS%20package',
   false, true, 2),

  ('professional', 'Professional', '🛒', 'Rp 27.500.000', 'Starting from',
   'One-time payment • includes VPS & payment gateway',
   'Online store & lightweight web app with automatic payment and admin dashboard.',
   jsonb_build_array(
     'Unlimited pages',
     'UI/UX design from scratch + Figma prototype',
     'E-commerce: cart, checkout, coupons, stock',
     'Payment gateway (Midtrans / Xendit / QRIS)',
     'Shipping integration & automatic invoices',
     'Admin dashboard + multi-role users',
     'Automatic WhatsApp & email notifications',
     'PWA — installable on phones like an app',
     'Technical SEO, schema markup, speed optimization',
     '1-year VPS hosting + daily backup'
   ),
   jsonb_build_object('estimate', '30–45 working days', 'revisions', '6x',
                      'warranty', '6 months', 'button_class', 'btn-grad'),
   'Get Professional Package',
   'https://wa.me/6282244719826?text=Hi%2C%20I%20am%20interested%20in%20the%20PROFESSIONAL%20package',
   true, true, 3),

  ('custom-apps', 'Custom Apps', '⚙️', 'Rp 55.000.000', 'Starting from',
   'Phased payments • scope determined by analysis results',
   'Custom web apps & internal systems built for your workflow.',
   jsonb_build_array(
     'Needs analysis + BRD document & system flow',
     'Custom web app (Laravel / Next.js)',
     'Database design, multi-role, granular access rights',
     'Modules as needed: POS, inventory, attendance, booking, LMS',
     'REST API + documentation for integration',
     'Analytics dashboard & Excel/PDF report export',
     'Third-party integration (WA API, accounting, payment)',
     'PWA / Android hybrid app version',
     'UAT testing with your team',
     'Server setup, basic CI/CD, automatic backup'
   ),
   jsonb_build_object('estimate', '2–3 months', 'revisions', 'Unlimited during development',
                      'warranty', '12 months', 'button_class', 'btn-purple'),
   'Discuss Your Needs',
   'https://wa.me/6282244719826?text=Hi%2C%20I''d%20like%20to%20discuss%20the%20CUSTOM%20APPS%20package',
   false, true, 4),

  ('enterprise', 'Enterprise', '🏆', 'Rp 120.000.000', 'Starting from',
   'Proposal prepared per project after workshop',
   'Android & iOS mobile apps plus large-scale digital ecosystem.',
   jsonb_build_array(
     'Product discovery workshop with stakeholders',
     'Mobile app Flutter/Native — Android & iOS',
     'Publication to Play Store & App Store',
     'Scalable backend + cloud infrastructure',
     'Admin panel, CMS, and integrated analytics',
     'Advanced features: AR/3D, realtime, chat, push notification',
     'Security audit + load testing before release',
     'CI/CD pipeline & 24/7 uptime monitoring',
     'Dedicated team: PM, designer, frontend, backend, QA',
     'Complete documentation + source code handover'
   ),
   jsonb_build_object('estimate', '4–6 months', 'revisions', 'Per sprint',
                      'warranty', '12 months + SLA', 'button_class', 'btn-ghost'),
   'Request Proposal',
   'https://wa.me/6282244719826?text=Hi%2C%20I''d%20like%20to%20request%20an%20ENTERPRISE%20proposal',
   false, true, 5)
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, price = excluded.price,
      price_note = excluded.price_note, subtitle = excluded.subtitle,
      description = excluded.description, features = excluded.features,
      meta = excluded.meta, cta_label = excluded.cta_label, cta_url = excluded.cta_url,
      is_popular = excluded.is_popular, is_published = excluded.is_published,
      sort_order = excluded.sort_order;

-- -------------------------------------------------------------
-- 2. ADD-ON  (16 item, ditulis ulang penuh)
-- -------------------------------------------------------------
delete from public.pricing_addons;

insert into public.pricing_addons (name, icon, price, price_note, description, is_published, sort_order)
values
  ('Additional .com/.id domain',  '🌐', 'Rp 250k',  '/year',          'Annual renewal',                          true,  1),
  ('Upgrade hosting to VPS',      '🖥️', 'Rp 2.5m',  '/year',          '2 vCPU, 4 GB RAM, SSD NVMe',              true,  2),
  ('Professional copywriting',    '✍️', 'Rp 350k',  '/page',          'Research + writing per page',             true,  3),
  ('Studio product photos',       '📷', 'Rp 1.5m',  '/package',       '10 ready-to-use photos + retouch',        true,  4),
  ('Company profile video',       '🎬', 'Rp 4.5m',  '/video',         '60–90 seconds, full production',          true,  5),
  ('Logo & brand identity',       '🎨', 'Rp 3.5m',  'starting from',  'Logo, colors, typography, guideline',     true,  6),
  ('Monthly maintenance',         '🛠️', 'Rp 750k',  '/month',         'Updates, backup, monitoring, minor fixes',true,  7),
  ('Additional payment gateway',  '💳', 'Rp 2m',    'one-time setup', 'Second provider integration',             true,  8),
  ('WhatsApp Business API',       '💬', 'Rp 3m',    'starting from',  'Automated notifications & chatbot',       true,  9),
  ('Additional language',         '🌏', 'Rp 1.5m',  '/language',      'Includes content translation',            true, 10),
  ('Google Ads setup',            '📈', 'Rp 2.5m',  'one-time setup', 'Keyword research, campaigns, tracking',   true, 11),
  ('Monthly SEO',                 '🔍', 'Rp 3m',    '/month',         'Content, backlinks, performance reports', true, 12),
  ('Old website migration',       '📦', 'Rp 1.5m',  'one-time',       'Data, content, and domain transfer',      true, 13),
  ('Web AR / interactive filter', '🕶️', 'Rp 7.5m',  'starting from',  'AR marker, 3D viewer, IG filter',         true, 14),
  ('Digital yearbook',            '📖', 'Rp 9m',    'starting from',  'Interactive yearbook + AR',               true, 15),
  ('Fast track processing',       '⚡', '+30%',     'of package value','Queue priority, timeline reduced',        true, 16);

-- -------------------------------------------------------------
-- Verifikasi
-- -------------------------------------------------------------
select sort_order, name, price, price_note,
       jsonb_array_length(features) as jumlah_fitur, is_popular
from public.pricing_plans order by sort_order;

select sort_order, icon, name, price, price_note from public.pricing_addons order by sort_order;
