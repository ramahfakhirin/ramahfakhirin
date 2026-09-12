-- =============================================================
-- RAMAHFAKHIRIN CMS - Supabase schema
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Helper: updated_at trigger
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- admins : whitelist user yang boleh menulis
-- -------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'editor' check (role in ('owner', 'editor')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

-- -------------------------------------------------------------
-- pages : daftar halaman statis
-- -------------------------------------------------------------
create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  file_name   text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -------------------------------------------------------------
-- sections : blok konten per halaman (hero, about, faq, dst)
-- body disimpan jsonb supaya fleksibel per tipe section
-- -------------------------------------------------------------
create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  page_slug   text not null references public.pages (slug) on update cascade on delete cascade,
  key         text not null,
  kind        text not null default 'rich' check (kind in ('rich', 'hero', 'list', 'stat', 'faq', 'cta', 'raw')),
  label       text,
  body        jsonb not null default '{}'::jsonb,
  sort_order  int  not null default 0,
  is_published boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (page_slug, key)
);

create index if not exists sections_page_idx on public.sections (page_slug, sort_order);

-- -------------------------------------------------------------
-- projects : portfolio
-- -------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  category     text,
  client       text,
  year         text,
  summary      text,
  content      text,
  thumbnail    text,
  gallery      jsonb not null default '[]'::jsonb,
  url          text,
  tags         jsonb not null default '[]'::jsonb,
  is_featured  boolean not null default false,
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists projects_pub_idx on public.projects (is_published, sort_order);

-- -------------------------------------------------------------
-- services
-- -------------------------------------------------------------
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  subtitle     text,
  description  text,
  icon         text,
  image        text,
  features     jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- pricing_plans + pricing_addons
-- -------------------------------------------------------------
create table if not exists public.pricing_plans (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  price        text,
  price_note   text,
  description  text,
  features     jsonb not null default '[]'::jsonb,
  cta_label    text,
  cta_url      text,
  is_popular   boolean not null default false,
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.pricing_addons (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  price        text,
  description  text,
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- posts : blog
-- -------------------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  content      text,
  cover        text,
  category     text,
  tags         jsonb not null default '[]'::jsonb,
  author       text default 'Ramah Fakhirin',
  read_minutes int default 5,
  views        int not null default 0,
  is_featured  boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_pub_idx on public.posts (is_published, published_at desc);

-- -------------------------------------------------------------
-- faqs
-- -------------------------------------------------------------
create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  page_slug    text not null default 'contact',
  question     text not null,
  answer       text not null,
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- messages : submission contact form
-- -------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  source     text default 'contact.html',
  created_at timestamptz not null default now()
);

create index if not exists messages_status_idx on public.messages (status, created_at desc);

-- -------------------------------------------------------------
-- settings : key/value global (kontak, sosial, SEO, dst)
-- -------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  label      text,
  "group"    text default 'general',
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- media : index file di storage
-- -------------------------------------------------------------
create table if not exists public.media (
  id         uuid primary key default gen_random_uuid(),
  path       text not null unique,
  url        text not null,
  file_name  text,
  mime_type  text,
  size_bytes bigint,
  alt        text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- activity_log : jejak perubahan
-- -------------------------------------------------------------
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  actor      text,
  action     text not null,
  entity     text not null,
  entity_id  text,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_created_idx on public.activity_log (created_at desc);

-- -------------------------------------------------------------
-- updated_at triggers
-- -------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'pages', 'sections', 'projects', 'services',
    'pricing_plans', 'pricing_addons', 'posts', 'faqs', 'settings'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$I
       for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.admins         enable row level security;
alter table public.pages          enable row level security;
alter table public.sections       enable row level security;
alter table public.projects       enable row level security;
alter table public.services       enable row level security;
alter table public.pricing_plans  enable row level security;
alter table public.pricing_addons enable row level security;
alter table public.posts          enable row level security;
alter table public.faqs           enable row level security;
alter table public.messages       enable row level security;
alter table public.settings       enable row level security;
alter table public.media          enable row level security;
alter table public.activity_log   enable row level security;

-- admins: hanya admin yang bisa baca daftar admin
drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins
  for select using (public.is_admin());

-- Konten publik: anon boleh SELECT, admin boleh semua
do $$
declare
  t text;
begin
  foreach t in array array['pages', 'services', 'pricing_plans', 'pricing_addons', 'media']
  loop
    execute format('drop policy if exists %1$s_public_read on public.%1$I', t);
    execute format('create policy %1$s_public_read on public.%1$I for select using (true)', t);

    execute format('drop policy if exists %1$s_admin_write on public.%1$I', t);
    execute format(
      'create policy %1$s_admin_write on public.%1$I
       for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

-- Konten dengan flag is_published
do $$
declare
  t text;
begin
  foreach t in array array['sections', 'projects', 'faqs']
  loop
    execute format('drop policy if exists %1$s_public_read on public.%1$I', t);
    execute format(
      'create policy %1$s_public_read on public.%1$I
       for select using (is_published = true or public.is_admin())', t);

    execute format('drop policy if exists %1$s_admin_write on public.%1$I', t);
    execute format(
      'create policy %1$s_admin_write on public.%1$I
       for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

-- posts: publik hanya lihat yang published & sudah waktunya terbit
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select using (
    (is_published = true and (published_at is null or published_at <= now()))
    or public.is_admin()
  );

drop policy if exists posts_admin_write on public.posts;
create policy posts_admin_write on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

-- settings: publik baca group non-private
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using ("group" <> 'private' or public.is_admin());

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- messages: anon boleh INSERT (contact form), hanya admin yang baca
drop policy if exists messages_public_insert on public.messages;
create policy messages_public_insert on public.messages
  for insert with check (true);

drop policy if exists messages_admin_read on public.messages;
create policy messages_admin_read on public.messages
  for select using (public.is_admin());

drop policy if exists messages_admin_update on public.messages;
create policy messages_admin_update on public.messages
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists messages_admin_delete on public.messages;
create policy messages_admin_delete on public.messages
  for delete using (public.is_admin());

-- activity_log: admin only
drop policy if exists activity_admin_all on public.activity_log;
create policy activity_admin_all on public.activity_log
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------
-- RPC: increment views post (aman dipanggil anon)
-- -------------------------------------------------------------
create or replace function public.increment_post_views(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set views = views + 1 where slug = p_slug and is_published = true;
$$;

grant execute on function public.increment_post_views(text) to anon, authenticated;

-- -------------------------------------------------------------
-- Realtime
-- -------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'pages', 'sections', 'projects', 'services', 'pricing_plans',
    'pricing_addons', 'posts', 'faqs', 'messages', 'settings', 'media', 'activity_log'
  ]
  loop
    execute format('alter table public.%I replica identity full', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end;
$$;

-- -------------------------------------------------------------
-- Storage bucket untuk media
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update set public = true;

drop policy if exists "cms media public read" on storage.objects;
create policy "cms media public read" on storage.objects
  for select using (bucket_id = 'cms-media');

drop policy if exists "cms media admin write" on storage.objects;
create policy "cms media admin write" on storage.objects
  for insert with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "cms media admin update" on storage.objects;
create policy "cms media admin update" on storage.objects
  for update using (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "cms media admin delete" on storage.objects;
create policy "cms media admin delete" on storage.objects
  for delete using (bucket_id = 'cms-media' and public.is_admin());
