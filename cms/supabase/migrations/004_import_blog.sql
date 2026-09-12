-- =============================================================
-- RAMAHFAKHIRIN CMS - Import Blog Posts (13 articles)
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================================

insert into public.posts (slug, title, excerpt, content, cover, category, tags,
  author, read_minutes, is_featured, is_published, published_at)
values
  ('nine-years-building-a-creative-agency-from-a-city-nobody-bets-on',
   'Nine Years Building a Creative Agency From a City Nobody Bets On',
   'Everyone tells you to move to Jakarta. I stayed in Jember and built a 40-person company anyway.',
   '<p>Everyone tells you to move to Jakarta. I stayed in Jember and built a 40-person company anyway. Here is the unglamorous version — the cash flow gaps, the clients who ghosted, the hires that failed, and the handful of decisions that actually compounded.</p>',
   null, 'Business', '["Journey", "Agency"]', 'Ramah Fakhirin', 12, true, true, '2026-03-01T00:00:00.000Z'),

  ('why-we-built-web-ar-instead-of-a-native-app',
   'Why We Built Web AR Instead of a Native App',
   'Every school asked for an AR feature. Nobody wanted to download an app for it.',
   '<p>Every school asked for an AR feature. Nobody wanted to download an app for it. Here is how we shipped marker-based AR that runs in a mobile browser — and what it cost us in trade-offs.</p>',
   null, 'Technology', '["Web AR", "Mobile", "Engineering"]', 'Ramah Fakhirin', 8, false, true, '2026-03-08T00:00:00.000Z'),

  ('how-i-price-projects-without-undercutting-myself',
   'How I Price Projects Without Undercutting Myself',
   'For years I quoted by feeling and lost money on half my projects.',
   '<p>For years I quoted by feeling and lost money on half my projects. Switching to a package model with a published pricelist changed the conversation — and the client quality.</p>',
   null, 'Business', '["Pricing", "Sales", "Freelance"]', 'Ramah Fakhirin', 7, false, true, '2026-02-01T00:00:00.000Z'),

  ('a-design-system-is-not-a-style-guide',
   'A Design System Is Not a Style Guide',
   'We shipped 40 yearbook sites in one cycle — the only reason a component system made that possible.',
   '<p>We shipped 40 yearbook sites in one cycle. The only reason that was possible: a component system the whole team could build against without asking permission.</p>',
   null, 'Design', '["Design System", "Figma", "Workflow"]', 'Ramah Fakhirin', 6, false, true, '2026-02-15T00:00:00.000Z'),

  ('building-a-tech-team-outside-jakarta',
   'Building a Tech Team Outside Jakarta',
   'The talent is here. The pipeline is not.',
   '<p>The talent is here. The pipeline is not. What it actually takes to hire, train, and keep good people in a city where nobody else is competing for them.</p>',
   null, 'Journey', '["Hiring", "Culture", "Jember"]', 'Ramah Fakhirin', 9, false, true, '2026-01-04T00:00:00.000Z'),

  ('we-replaced-our-hr-software-with-a-pwa-we-built-in-three-weeks',
   'We Replaced Our HR Software With a PWA We Built in Three Weeks',
   'Nothing off the shelf fit how our team actually works.',
   '<p>Nothing off the shelf fit how our team actually works. So we built an attendance PWA — offline-first, installable, and cheaper than the subscription we cancelled.</p>',
   null, 'Technology', '["PWA", "Internal Tools", "Laravel"]', 'Ramah Fakhirin', 10, false, true, '2026-01-18T00:00:00.000Z'),

  ('nano-indonesia-crosses-231-clients-served',
   'Nano Indonesia Crosses 231 Clients Served',
   'A milestone worth writing down on where the numbers came from and what we are building next.',
   '<p>A milestone worth writing down. Where the numbers came from, which divisions grew fastest, and what we are building next across yearbook, AR, and event production.</p>',
   null, 'News', '["Milestone", "Company", "Growth"]', 'Ramah Fakhirin', 4, false, true, '2025-12-01T00:00:00.000Z'),

  ('core-web-vitals-are-a-business-metric-not-a-dev-metric',
   'Core Web Vitals Are a Business Metric, Not a Dev Metric',
   'A 2-second delay cost one client roughly a third of their inbound leads.',
   '<p>A 2-second delay cost one client roughly a third of their inbound leads. What we changed, in what order, and how much each fix actually moved the number.</p>',
   null, 'Technology', '["SEO", "Performance", "Analytics"]', 'Ramah Fakhirin', 7, false, true, '2025-12-15T00:00:00.000Z'),

  ('the-revision-clause-that-saved-my-sanity',
   'The Revision Clause That Saved My Sanity',
   'Scope creep is not a client problem, it is a contract problem.',
   '<p>Scope creep is not a client problem, it is a contract problem. The exact wording we now put in every proposal — and the conversation it makes easy instead of awkward.</p>',
   null, 'Business', '["Contracts", "Client Work", "Process"]', 'Ramah Fakhirin', 6, false, true, '2025-11-01T00:00:00.000Z'),

  ('designing-a-yearbook-students-actually-want-to-open',
   'Designing a Yearbook Students Actually Want to Open',
   'Themed worlds beat pretty layouts.',
   '<p>Themed worlds beat pretty layouts. How we take a school''s inside jokes and turn them into a concept that still holds up ten years later.</p>',
   null, 'Design', '["Creative Direction", "Yearbook", "Storytelling"]', 'Ramah Fakhirin', 8, false, true, '2025-11-15T00:00:00.000Z'),

  ('the-year-i-stopped-answering-whatsapp-at-midnight',
   'The Year I Stopped Answering WhatsApp at Midnight',
   'Being always available felt like dedication. It was actually the reason my judgement got worse.',
   '<p>Being always available felt like dedication. It was actually the reason my judgement got worse. What changed when I set an actual cut-off time.</p>',
   null, 'Journey', '["Founder Life", "Boundaries", "Habits"]', 'Ramah Fakhirin', 5, false, true, '2025-10-04T00:00:00.000Z'),

  ('where-ai-actually-helps-a-creative-team-and-where-it-doesnt',
   'Where AI Actually Helps a Creative Team (And Where It Doesn''t)',
   'We tested AI across copy, design, and code for six months — two workflows got dramatically faster, three got quietly worse.',
   '<p>We tested AI across copy, design, and code for six months. Two workflows got dramatically faster. Three got quietly worse. Here is the honest split.</p>',
   null, 'Technology', '["AI", "Workflow", "Tools"]', 'Ramah Fakhirin', 9, false, true, '2025-10-18T00:00:00.000Z'),

  ('everything-that-can-go-wrong-at-a-graduation-event',
   'Everything That Can Go Wrong at a Graduation Event',
   'Rain, a dead generator, a missing MC, and 600 guests already seated.',
   '<p>Rain, a dead generator, a missing MC, and 600 guests already seated. A field guide to event contingency planning, written from actual scars.</p>',
   null, 'Business', '["Events", "Operations", "Risk"]', 'Ramah Fakhirin', 7, false, true, '2025-09-01T00:00:00.000Z')
on conflict (slug) do update
  set title = excluded.title, excerpt = excluded.excerpt, content = excluded.content,
      category = excluded.category, tags = excluded.tags, read_minutes = excluded.read_minutes,
      is_featured = excluded.is_featured, is_published = excluded.is_published,
      published_at = excluded.published_at;
