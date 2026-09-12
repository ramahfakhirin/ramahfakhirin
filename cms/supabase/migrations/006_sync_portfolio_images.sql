-- =============================================================
-- Sinkronisasi thumbnail portfolio dari portfolio.html ke CMS
-- Jalankan di Supabase Dashboard > SQL Editor
--
-- Sumber: 11 tag <img> pada portfolio.html.
-- Ditulis ulang lengkap (bukan hanya yang kurang) supaya aman
-- dijalankan berkali-kali dan mudah diaudit.
-- =============================================================

update public.projects as p
set thumbnail = v.thumbnail
from (values
  ('nano-yearbook',                 'assets/img/porto/1nanoyearbook.png'),
  ('cv-abinawa',                    'assets/img/porto/2abinawa.png'),
  ('dinchara-ma-ci-amanatul-ummah', 'assets/img/porto/3dinchara.png'),
  ('project-tracking-nanoidn',      'assets/img/porto/4trackingnano.png'),
  ('pt-nano-indonesia-sakti',       'assets/img/porto/5nanocoid.png'),
  ('astra-najmia-smp-al-furqan',    'assets/img/porto/6astranajmia.png'),
  ('nanoidn-bisnis-crm',            'assets/img/porto/7bisnisnano.png'),
  ('nanoidn-ar-integration',        'assets/img/porto/8arnano.png'),
  ('hris-nanoidn-attendance-pwa',   'assets/img/porto/9hrisnano.png'),
  ('uwu-trade-trash-bank',          'assets/img/porto/10uwu.png'),
  -- Ini yang sebelumnya terlewat dan masih null di CMS
  ('rectovious-sman-1-kencong',     'assets/img/porto/1119rectovious.png')
) as v(slug, thumbnail)
where p.slug = v.slug;

-- Cek hasil: 11 baris terisi, 8 sisanya memang belum punya gambar
select
  sort_order,
  title,
  coalesce(thumbnail, '— belum ada gambar —') as thumbnail
from public.projects
order by sort_order;
