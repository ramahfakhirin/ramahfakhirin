-- =============================================================
-- RAMAHFAKHIRIN CMS - seed data awal
-- Jalankan SETELAH 001_schema.sql
-- =============================================================

-- -------------------------------------------------------------
-- pages
-- -------------------------------------------------------------
insert into public.pages (slug, title, file_name, sort_order) values
  ('home',      'Home',       'index.html',     1),
  ('about',     'About',      'about.html',     2),
  ('services',  'Services',   'services.html',  3),
  ('portfolio', 'Portfolio',  'portfolio.html', 4),
  ('pricelist', 'Pricelist',  'pricelist.html', 5),
  ('blog',      'Blog',       'blog.html',      6),
  ('contact',   'Contact',    'contact.html',   7)
on conflict (slug) do update
  set title = excluded.title,
      file_name = excluded.file_name,
      sort_order = excluded.sort_order;

-- -------------------------------------------------------------
-- sections
-- -------------------------------------------------------------
insert into public.sections (page_slug, key, kind, label, body, sort_order) values
  ('home', 'hero', 'hero', 'Hero Home', jsonb_build_object(
      'eyebrow', 'Founder & Visual Communication Creators',
      'title', 'Turning Ideas<br>Into Impact.',
      'subtitle', 'Entrepreneur, creative director, and builder from Jember. Founder of PT Nano Indonesia Sakti.',
      'cta_label', 'Let''s Talk',
      'cta_url', 'contact.html'
    ), 1),
  ('home', 'announcement', 'raw', 'Announcement Bar', jsonb_build_object(
      'text', 'Nano Indonesia — Digital Yearbook • Creative Production House • AR Technology • Event Organizer',
      'is_active', true
    ), 2),
  ('home', 'about_intro', 'rich', 'About Intro', jsonb_build_object(
      'title', 'Builder.',
      'content', 'Nine years building a creative agency from a city nobody bets on.'
    ), 3),
  ('home', 'skills', 'list', 'What I Do Best', jsonb_build_object(
      'title', 'WHAT I<br>DO BEST',
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Web Design & Development', 'value', '95'),
        jsonb_build_object('label', 'Visual Creators', 'value', '90'),
        jsonb_build_object('label', 'Brand Strategy', 'value', '88'),
        jsonb_build_object('label', 'Photo & Video', 'value', '85')
      )
    ), 4),
  ('about', 'hero', 'hero', 'Hero About', jsonb_build_object(
      'title', 'Builder. Creator.<br><em>Problem Solver.</em>',
      'subtitle', 'From Jember, to the country.'
    ), 1),
  ('about', 'stats', 'stat', 'Stats', jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object('label', 'PT Nano Indonesia Sakti', 'value', '2016', 'note', 'Founded'),
        jsonb_build_object('label', 'Schools & Companies', 'value', '231+', 'note', 'Clients served'),
        jsonb_build_object('label', 'Certifications', 'value', '10+', 'note', 'Professional')
      )
    ), 2),
  ('about', 'timeline', 'list', 'Journey Timeline', jsonb_build_object(
      'title', 'From Jember,<br>To The Country.',
      'items', jsonb_build_array(
        jsonb_build_object('title', 'Pasuruan → Jember', 'text', 'Where it started.'),
        jsonb_build_object('title', 'Nano Indonesia is born', 'text', 'First studio, first clients.'),
        jsonb_build_object('title', 'From yearbooks to full production', 'text', 'Scope grows.'),
        jsonb_build_object('title', 'A team of 40, a country of clients', 'text', 'Scaling up.'),
        jsonb_build_object('title', '231+ clients and still building', 'text', 'Present day.')
      )
    ), 3),
  ('services', 'hero', 'hero', 'Hero Services', jsonb_build_object(
      'title', 'Services I''m<br>Always <span>Delivering.</span>',
      'subtitle', 'Web, visual, brand, and production under one roof.'
    ), 1),
  ('services', 'process', 'list', 'Five Steps', jsonb_build_object(
      'title', 'Five Steps From<br>Idea To <span>Live</span>',
      'items', jsonb_build_array(
        jsonb_build_object('num', '01', 'title', 'Consultation', 'text', 'Free 30-minute discussion to map goals, target users, and visual references.'),
        jsonb_build_object('num', '02', 'title', 'Proposal & Deal', 'text', 'Proposal, scope of work, and written timeline. Down payment marks kickoff.'),
        jsonb_build_object('num', '03', 'title', 'Design', 'text', 'Wireframe then UI design, reviewed until approved.'),
        jsonb_build_object('num', '04', 'title', 'Development', 'text', 'Coding, integration, and testing with weekly progress reports.'),
        jsonb_build_object('num', '05', 'title', 'Launch', 'text', 'Go live, handover, and support.')
      )
    ), 2),
  ('portfolio', 'hero', 'hero', 'Hero Portfolio', jsonb_build_object(
      'title', 'Every Project,<br><span>One Page.</span>',
      'subtitle', 'Selected work from Nano Indonesia.'
    ), 1),
  ('pricelist', 'hero', 'hero', 'Hero Pricelist', jsonb_build_object(
      'title', 'Clear Pricing,<br><span>Premium Results.</span>',
      'subtitle', 'Choose the package that fits your business scale.'
    ), 1),
  ('blog', 'hero', 'hero', 'Hero Blog', jsonb_build_object(
      'title', 'Notes From<br>The <span>Build.</span>',
      'subtitle', 'Lessons from nine years of running a creative agency.'
    ), 1),
  ('contact', 'hero', 'hero', 'Hero Contact', jsonb_build_object(
      'title', 'Let''s Build<br><span>Something Together.</span>',
      'subtitle', 'Tell me about your project.'
    ), 1),
  ('contact', 'cta', 'cta', 'Closing CTA', jsonb_build_object(
      'title', 'Still Curious<span>.</span>',
      'cta_label', 'Send a Message',
      'cta_url', '#contact-form'
    ), 2)
on conflict (page_slug, key) do nothing;

-- -------------------------------------------------------------
-- services
-- -------------------------------------------------------------
insert into public.services (slug, title, subtitle, description, features, sort_order) values
  ('web-design-development', 'Web Design & Development', 'Websites that convert',
   'Company profile, landing page, web app, and PWA built for speed and clarity.',
   '["UI/UX design", "Responsive build", "SEO ready", "Core Web Vitals tuned"]'::jsonb, 1),
  ('visual-creators', 'Visual Creators', 'Design that communicates',
   'Digital yearbook, layout, illustration, and print-ready artwork.',
   '["Digital yearbook", "Editorial layout", "Illustration", "Print production"]'::jsonb, 2),
  ('brand-strategy', 'Brand Strategy', 'Identity with direction',
   'Positioning, naming, logo system, and full brand guideline.',
   '["Brand audit", "Logo system", "Guideline", "Collateral"]'::jsonb, 3),
  ('photo-video', 'Photo & Video', 'Production end to end',
   'Documentation, commercial video, aerial, and post-production.',
   '["Event documentation", "Commercial video", "Aerial", "Editing"]'::jsonb, 4),
  ('ar-technology', 'AR Technology', 'Web-based augmented reality',
   'Marker-based and markerless web AR without native app install.',
   '["Web AR", "3D asset", "Marker design", "Analytics"]'::jsonb, 5),
  ('event-organizer', 'Event Organizer', 'Graduation and corporate events',
   'Concept, vendor, rundown, and on-site execution.',
   '["Concept", "Vendor management", "Rundown", "On-site crew"]'::jsonb, 6)
on conflict (slug) do nothing;

-- -------------------------------------------------------------
-- pricing_plans
-- -------------------------------------------------------------
insert into public.pricing_plans (slug, name, price, price_note, description, features, is_popular, sort_order) values
  ('starter', 'Starter', 'Rp 3.500.000', 'per project', 'Landing page for a first online presence.',
   '["1-3 sections", "Responsive", "Contact form", "1 revision round"]'::jsonb, false, 1),
  ('business', 'Business', 'Rp 7.500.000', 'per project', 'Company profile with full page set.',
   '["Up to 7 pages", "CMS ready", "SEO basic", "2 revision rounds"]'::jsonb, true, 2),
  ('professional', 'Professional', 'Rp 15.000.000', 'per project', 'Custom design with advanced interaction.',
   '["Custom design", "Animation", "Blog & portfolio", "3 revision rounds"]'::jsonb, false, 3),
  ('custom-apps', 'Custom Apps', 'Rp 25.000.000', 'starting from', 'Web application built to your workflow.',
   '["Custom feature", "Database", "User role", "Deployment"]'::jsonb, false, 4),
  ('enterprise', 'Enterprise', 'Custom', 'by scope', 'Long term partnership and dedicated team.',
   '["Dedicated team", "SLA support", "Integration", "Training"]'::jsonb, false, 5)
on conflict (slug) do nothing;

insert into public.pricing_addons (name, price, description, sort_order) values
  ('Extra Page', 'Rp 500.000', 'Additional page beyond package quota.', 1),
  ('Copywriting', 'Rp 350.000', 'Per page professional copy.', 2),
  ('Photo Session', 'Rp 2.500.000', 'Half day product or profile shoot.', 3),
  ('Maintenance', 'Rp 750.000', 'Monthly update, backup, and monitoring.', 4),
  ('Domain & Hosting', 'Rp 1.200.000', 'One year, managed setup.', 5)
on conflict do nothing;

-- -------------------------------------------------------------
-- faqs
-- -------------------------------------------------------------
insert into public.faqs (page_slug, question, answer, sort_order) values
  ('contact', 'How long does a project take?', 'Landing page 1-2 weeks, company profile 3-4 weeks, custom app 6-12 weeks depending on scope.', 1),
  ('contact', 'What is the payment scheme?', '50% down payment to kick off, 50% on handover. Enterprise scope can be split per milestone.', 2),
  ('contact', 'Do you work outside Jember?', 'Yes. Most clients are remote across Indonesia. On-site visits are arranged for production work.', 3),
  ('contact', 'How many revisions are included?', 'Depends on package, 1 to 3 rounds. Extra rounds are billed per round and stated upfront.', 4),
  ('contact', 'Do you provide maintenance?', 'Yes, monthly maintenance covering update, backup, monitoring, and minor content changes.', 5)
on conflict do nothing;

-- -------------------------------------------------------------
-- settings
-- -------------------------------------------------------------
insert into public.settings (key, value, label, "group") values
  ('site_title',   '"Ramahfakhirin — Founder & Visual Communication Creators"'::jsonb, 'Site Title', 'seo'),
  ('site_description', '"Entrepreneur, creative director, and builder from Jember. Founder of PT Nano Indonesia Sakti."'::jsonb, 'Meta Description', 'seo'),
  ('site_url',     '"https://ramahfakhirin.com"'::jsonb, 'Site URL', 'seo'),
  ('brand_name',   '"Ramahf"'::jsonb, 'Brand Name', 'general'),
  ('contact_email','"ramafakhirin@gmail.com"'::jsonb, 'Email', 'contact'),
  ('contact_phone','"+62 822 4471 9826"'::jsonb, 'Phone', 'contact'),
  ('contact_address', '"Jember & Makassar, Indonesia"'::jsonb, 'Address', 'contact'),
  ('social_links', '{"linkedin":"https://www.linkedin.com/in/ramahfakhirin","instagram":"https://www.instagram.com/nanoidn","whatsapp":"https://wa.me/6282244719826"}'::jsonb, 'Social Links', 'contact'),
  ('footer_tagline', '"Entrepreneur, creative director & builder from Jember."'::jsonb, 'Footer Tagline', 'general')
on conflict (key) do nothing;
