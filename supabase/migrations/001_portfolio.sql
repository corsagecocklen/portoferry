-- Portoferry: katalog proyek, pengaturan situs, dan allowlist admin.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in (
    'Web Development',
    'IT Consulting',
    'Video Editing',
    'Graphic Design',
    'AI Consulting'
  )),
  summary text not null,
  description text not null,
  image_url text not null,
  project_url text not null default '',
  year integer not null,
  tags text[] not null default '{}'::text[],
  featured boolean not null default false,
  published boolean not null default false,
  is_concept boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint projects_slug_format check (
    char_length(slug) between 1 and 80
    and slug = btrim(slug)
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint projects_title_length check (
    char_length(title) between 1 and 120 and title = btrim(title)
  ),
  constraint projects_summary_length check (
    char_length(summary) between 1 and 300 and summary = btrim(summary)
  ),
  constraint projects_description_length check (
    char_length(description) between 1 and 10000
  ),
  constraint projects_image_url check (
    (image_url ~ '^/images/[A-Za-z0-9][A-Za-z0-9._/-]*$'
    and image_url !~ '(^|/)\.\.?(/|$)')
    or image_url ~ '^https://[A-Za-z0-9.-]+\.supabase\.co/storage/v1/object/public/project-images/[A-Za-z0-9][A-Za-z0-9._/-]*$'
  ),
  constraint projects_project_url check (
    project_url = '' or project_url ~* '^https://[^[:space:]]+$'
  ),
  constraint projects_year_range check (year between 1900 and 2200),
  constraint projects_tags_count check (cardinality(tags) between 0 and 20),
  constraint projects_sort_order_range check (sort_order between 0 and 100000)
);

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  whatsapp text not null default '',
  email text not null default '',
  instagram text not null default '',
  available boolean not null default true,
  constraint site_settings_whatsapp_length check (char_length(whatsapp) <= 15),
  constraint site_settings_whatsapp check (
    whatsapp = '' or whatsapp ~ '^[1-9][0-9]{6,14}$'
  ),
  constraint site_settings_email check (
    email = '' or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint site_settings_email_length check (char_length(email) <= 254),
  constraint site_settings_instagram_length check (char_length(instagram) <= 2048),
  constraint site_settings_instagram check (
    instagram = '' or instagram ~* '^https://(www\.)?instagram\.com(/[^[:space:]]*)?$'
  )
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

-- Jalankan manual setelah user Auth dibuat:
-- insert into public.admin_users (user_id)
-- values ('UUID_USER_AUTH')
-- on conflict (user_id) do nothing;
-- Tidak ada service-role key yang dibutuhkan oleh aplikasi.

alter table public.projects enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

drop policy if exists "projects_public_read_published" on public.projects;
create policy "projects_public_read_published"
  on public.projects
  for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists "projects_admin_insert" on public.projects;
create policy "projects_admin_insert"
  on public.projects
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update"
  on public.projects
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete"
  on public.projects
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_admin_insert" on public.site_settings;
create policy "site_settings_admin_insert"
  on public.site_settings
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update"
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "site_settings_admin_delete" on public.site_settings;
create policy "site_settings_admin_delete"
  on public.site_settings
  for delete
  to authenticated
  using (public.is_admin());

-- Bucket publik hanya untuk membaca gambar; perubahan tetap admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project_images_public_read" on storage.objects;
create policy "project_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'project-images');

drop policy if exists "project_images_admin_insert" on storage.objects;
create policy "project_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'project-images' and public.is_admin());

drop policy if exists "project_images_admin_update" on storage.objects;
create policy "project_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'project-images' and public.is_admin())
  with check (bucket_id = 'project-images' and public.is_admin());

drop policy if exists "project_images_admin_delete" on storage.objects;
create policy "project_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'project-images' and public.is_admin());
