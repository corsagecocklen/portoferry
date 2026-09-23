\set ON_ERROR_STOP on
-- WARNING: Run only in a disposable PostgreSQL/Supabase database after 001_portfolio.sql and 002_article_category.sql. This applies 003_post_media.sql permanently; never run against production.

create temporary table post_media_fixture_ids as
select gen_random_uuid() as legacy_a_id, gen_random_uuid() as legacy_b_id, gen_random_uuid() as media_id;

insert into public.projects (
  id, slug, title, category, summary, description, image_url, project_url, year,
  tags, featured, published, is_concept, sort_order, created_at
)
select fixture.legacy_a_id, 'post-media-legacy-' || left(fixture.legacy_a_id::text, 8),
  'Legacy project A', 'Web Development', 'Legacy summary A', 'Legacy description A',
  '/images/project-placeholder.svg', '', 2024, array['legacy', 'web'], true, true, false, 17,
  '2024-01-02T03:04:05Z'::timestamptz
from post_media_fixture_ids as fixture
union all
select fixture.legacy_b_id, 'post-media-legacy-' || left(fixture.legacy_b_id::text, 8),
  'Legacy project B', 'Artikel', 'Legacy summary B', 'Legacy description B',
  '/images/project-placeholder.svg', 'https://example.com/legacy', 2025, array['legacy', 'article'],
  false, false, true, 29, '2025-02-03T04:05:06Z'::timestamptz
from post_media_fixture_ids as fixture;

create temporary table post_media_expected_projects as
select project.id, to_jsonb(project) - array['body_images', 'thumbnail_crop'] as row_json
from public.projects as project;

create temporary table post_media_expected_rls as
select namespace.nspname, relation.relname, relation.relrowsecurity, relation.relforcerowsecurity
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where relation.oid in (
  'public.projects'::regclass,
  'storage.buckets'::regclass,
  'storage.objects'::regclass
);

create temporary table post_media_expected_policies as
select to_jsonb(policy) as row_json
from pg_policies as policy
where policy.schemaname in ('public', 'storage');

create temporary table post_media_expected_buckets as
select to_jsonb(bucket) as row_json from storage.buckets as bucket;

\ir ../../supabase/migrations/003_post_media.sql
\ir ../../supabase/migrations/003_post_media.sql

do $$
begin
  if exists (
    select 1
    from post_media_expected_projects as before_migration
    left join public.projects as after_migration using (id)
    where after_migration.id is null
      or (to_jsonb(after_migration) - array['body_images', 'thumbnail_crop']) is distinct from before_migration.row_json
  ) then
    raise exception 'Migration changed or removed an existing project field';
  end if;

  if (select count(*) from post_media_expected_projects) <> (select count(*) from public.projects) then
    raise exception 'Migration changed the number of existing project rows';
  end if;

  if exists (
    select 1
    from public.projects as project
    where project.id in (
      select legacy_a_id from post_media_fixture_ids
      union all
      select legacy_b_id from post_media_fixture_ids
    )
      and (project.body_images is distinct from '[]'::jsonb or project.thumbnail_crop is not null)
  ) then
    raise exception 'Legacy rows must receive [] body_images and NULL thumbnail_crop defaults';
  end if;

  if exists (
    (select * from post_media_expected_rls except select
      namespace.nspname, relation.relname, relation.relrowsecurity, relation.relforcerowsecurity
      from pg_class as relation join pg_namespace as namespace on namespace.oid = relation.relnamespace
      where relation.oid in ('public.projects'::regclass, 'storage.buckets'::regclass, 'storage.objects'::regclass))
    union all
    (select namespace.nspname, relation.relname, relation.relrowsecurity, relation.relforcerowsecurity
      from pg_class as relation join pg_namespace as namespace on namespace.oid = relation.relnamespace
      where relation.oid in ('public.projects'::regclass, 'storage.buckets'::regclass, 'storage.objects'::regclass)
      except select * from post_media_expected_rls)
  ) then
    raise exception 'Migration changed RLS settings on projects or Storage tables';
  end if;

  if exists (
    (select row_json from post_media_expected_policies except
      select to_jsonb(policy) from pg_policies as policy where policy.schemaname in ('public', 'storage'))
    union all
    (select to_jsonb(policy) from pg_policies as policy where policy.schemaname in ('public', 'storage')
      except select row_json from post_media_expected_policies)
  ) then
    raise exception 'Migration changed public or Storage policies';
  end if;

  if exists (
    (select row_json from post_media_expected_buckets except select to_jsonb(bucket) from storage.buckets as bucket)
    union all
    (select to_jsonb(bucket) from storage.buckets as bucket except select row_json from post_media_expected_buckets)
  ) then
    raise exception 'Migration changed Storage buckets';
  end if;
end;
$$;

begin;
insert into public.projects (
  id, slug, title, category, summary, description, image_url, project_url, year, body_images, thumbnail_crop
)
select fixture.media_id, 'post-media-content-' || left(fixture.media_id::text, 8),
  'Post media validation', 'Artikel', 'Media summary', 'Media description',
  '/images/project-placeholder.svg', '', 2026,
  jsonb_build_array(
    jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('1', 12, '0'), 'url', '/images/body-one.webp',
      'alt', 'First body image', 'caption', 'First caption', 'after_paragraph', 1),
    jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('2', 12, '0'), 'url', '/images/body-two.webp',
      'alt', 'Second body image', 'caption', 'Second caption', 'after_paragraph', 3)
  ),
  jsonb_build_object('x', 50, 'y', 50, 'zoom', 1)
from post_media_fixture_ids as fixture;
commit;

begin;
update public.projects
set body_images = jsonb_build_array(
      jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('1', 12, '0'), 'url', '/images/body-one.webp',
        'alt', 'First body image', 'caption', 'First caption', 'after_paragraph', 1),
      jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('2', 12, '0'), 'url', '/images/body-two.webp',
        'alt', 'Second body image', 'caption', 'Second caption', 'after_paragraph', 3),
      jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('3', 12, '0'), 'url', '/images/body-three.webp',
        'alt', 'Third body image', 'caption', 'Third caption', 'after_paragraph', 5)
    ),
    thumbnail_crop = jsonb_build_object('x', 37.5, 'y', 62, 'zoom', 1.8)
where id = (select media_id from post_media_fixture_ids);

do $$
begin
  if not exists (
    select 1 from public.projects
    where id = (select media_id from post_media_fixture_ids)
      and jsonb_array_length(body_images) = 3
      and thumbnail_crop = '{"x": 37.5, "y": 62, "zoom": 1.8}'::jsonb
  ) then
    raise exception 'Valid media update did not persist all body images and crop values';
  end if;
end;
$$;
commit;

create temporary table post_media_expected_content as
select id, body_images, thumbnail_crop
from public.projects
where id = (select media_id from post_media_fixture_ids);

\ir ../../supabase/migrations/003_post_media.sql

do $$
begin
  if exists (
    select 1
    from post_media_expected_content as before_rerun
    left join public.projects as after_rerun using (id)
    where after_rerun.id is null
      or after_rerun.body_images is distinct from before_rerun.body_images
      or after_rerun.thumbnail_crop is distinct from before_rerun.thumbnail_crop
  ) then
    raise exception 'Re-running 003_post_media.sql changed saved media';
  end if;
end;
$$;

begin;
update public.projects
set body_images = '[]'::jsonb, thumbnail_crop = null
where id = (select media_id from post_media_fixture_ids);

do $$
begin
  if not exists (
    select 1 from public.projects
    where id = (select media_id from post_media_fixture_ids)
      and body_images = '[]'::jsonb
      and thumbnail_crop is null
  ) then
    raise exception 'Explicit []/NULL media reset was not accepted';
  end if;
end;
$$;
rollback;

begin;
do $$
declare
  fixture_id uuid := (select media_id from post_media_fixture_ids);
  invalid_images jsonb;
  invalid_crop jsonb;
  too_many_images jsonb := '[]'::jsonb;
  image_index integer;
begin
  begin
    update public.projects set body_images = 'not-json'::jsonb where id = fixture_id;
    raise exception 'Syntactically invalid JSON was accepted';
  exception when invalid_text_representation then
    null;
  end;

  for image_index in 1..7 loop
    too_many_images := too_many_images || jsonb_build_array(jsonb_build_object(
      'id', '00000000-0000-4000-8000-' || lpad(image_index::text, 12, '0'),
      'url', '/images/body.webp', 'alt', 'Body image', 'caption', '', 'after_paragraph', image_index
    ));
  end loop;

  foreach invalid_images in array array[
    '{}'::jsonb,
    'null'::jsonb,
    too_many_images,
    jsonb_build_array(
      jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('4', 12, '0'), 'url', '/images/one.webp', 'alt', 'One', 'caption', '', 'after_paragraph', 1),
      jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('4', 12, '0'), 'url', '/images/two.webp', 'alt', 'Two', 'caption', '', 'after_paragraph', 2)
    ),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('5', 12, '0'), 'url', 'https://evil.example/body.webp', 'alt', 'Unsafe URL', 'caption', '', 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('6', 12, '0'), 'url', 'https://demo.supabase.co/storage/v1/object/sign/project-images/body.webp?token=secret', 'alt', 'Signed URL', 'caption', '', 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('7', 12, '0'), 'url', 'data:image/svg+xml;base64,PHN2Zz4=', 'alt', 'SVG URL', 'caption', '', 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('8', 12, '0'), 'url', '/images/safe/../private.webp', 'alt', 'Traversing URL', 'caption', '', 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('9', 12, '0'), 'url', '/images/body.webp', 'alt', ' ', 'caption', '', 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('10', 12, '0'), 'url', '/images/body.webp', 'alt', repeat('a', 301), 'caption', '', 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('11', 12, '0'), 'url', '/images/body.webp', 'alt', 'Body image', 'caption', repeat('c', 301), 'after_paragraph', 1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('12', 12, '0'), 'url', '/images/body.webp', 'alt', 'Body image', 'caption', '', 'after_paragraph', -1)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('13', 12, '0'), 'url', '/images/body.webp', 'alt', 'Body image', 'caption', '', 'after_paragraph', 1.5)),
    jsonb_build_array(jsonb_build_object('id', '00000000-0000-4000-8000-' || lpad('14', 12, '0'), 'url', '/images/body.webp', 'alt', 'Body image', 'caption', '', 'after_paragraph', 1, 'extra', true))
  ] loop
    begin
      update public.projects set body_images = invalid_images where id = fixture_id;
      raise exception 'Invalid body_images value was accepted: %', invalid_images;
    exception when check_violation then
      null;
    end;
  end loop;

  foreach invalid_crop in array array[
    'null'::jsonb,
    '[]'::jsonb,
    '"not an object"'::jsonb,
    '{"x": 50, "y": 50}'::jsonb,
    '{"x": 50, "y": 50, "zoom": 1, "extra": true}'::jsonb,
    '{"x": "50", "y": 50, "zoom": 1}'::jsonb,
    '{"x": -0.01, "y": 50, "zoom": 1}'::jsonb,
    '{"x": 100.01, "y": 50, "zoom": 1}'::jsonb,
    '{"x": 50, "y": -0.01, "zoom": 1}'::jsonb,
    '{"x": 50, "y": 100.01, "zoom": 1}'::jsonb,
    '{"x": 50, "y": 50, "zoom": 0.99}'::jsonb,
    '{"x": 50, "y": 50, "zoom": 3.01}'::jsonb
  ] loop
    begin
      update public.projects set thumbnail_crop = invalid_crop where id = fixture_id;
      raise exception 'Invalid thumbnail_crop value was accepted: %', invalid_crop;
    exception when check_violation then
      null;
    end;
  end loop;

  if not exists (
    select 1 from public.projects as project
    join post_media_expected_content as expected using (id)
    where project.id = fixture_id
      and project.body_images = expected.body_images
      and project.thumbnail_crop = expected.thumbnail_crop
  ) then
    raise exception 'A rejected media update changed persisted values';
  end if;
end;
$$;
rollback;

begin;
delete from public.projects
where id in (
  select legacy_a_id from post_media_fixture_ids
  union all
  select legacy_b_id from post_media_fixture_ids
  union all
  select media_id from post_media_fixture_ids
);
commit;

select 'Post media migration passed: idempotent, safe defaults, preserved data/RLS/Storage, and media constraints verified.' as result;
