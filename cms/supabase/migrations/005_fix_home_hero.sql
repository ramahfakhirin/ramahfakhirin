-- =============================================================
-- Menyelaraskan section home.hero dengan desain asli index.html
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================================

update public.sections
set body = jsonb_build_object(
      'eyebrow',   '&#10022; Founder & Visual Communication Creators',
      'title',     'Turning Ideas<br><span style="color:#7463FF">Into Digital</span><br>Experiences.',
      'subtitle',  'Entrepreneur, creative director,<br>and builder from Jember. 9 years<br>creating digital experiences.',
      'cta_label', 'Let''s collaborate',
      'cta_url',   'mailto:ramafakhirin@gmail.com'
    )
where page_slug = 'home' and key = 'hero';

-- Kalau baris hero belum ada, buat baru
insert into public.sections (page_slug, key, kind, label, body, sort_order, is_published)
select 'home', 'hero', 'hero', 'Hero Home',
       jsonb_build_object(
         'eyebrow',   '&#10022; Founder & Visual Communication Creators',
         'title',     'Turning Ideas<br><span style="color:#7463FF">Into Digital</span><br>Experiences.',
         'subtitle',  'Entrepreneur, creative director,<br>and builder from Jember. 9 years<br>creating digital experiences.',
         'cta_label', 'Let''s collaborate',
         'cta_url',   'mailto:ramafakhirin@gmail.com'
       ),
       1, true
where not exists (
  select 1 from public.sections where page_slug = 'home' and key = 'hero'
);
