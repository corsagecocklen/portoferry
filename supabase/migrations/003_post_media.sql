begin;

alter table public.projects
  add column if not exists body_images jsonb not null default '[]'::jsonb,
  add column if not exists thumbnail_crop jsonb;

create or replace function public.valid_project_body_images(images jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  image jsonb;
  image_url text;
  image_ids text[] := '{}'::text[];
  position numeric;
begin
  if jsonb_typeof(images) is distinct from 'array' then return false; end if;
  if jsonb_array_length(images) > 6 then return false; end if;

  for image in select value from jsonb_array_elements(images) loop
    if jsonb_typeof(image) is distinct from 'object'
      or jsonb_typeof(image->'id') is distinct from 'string'
      or jsonb_typeof(image->'url') is distinct from 'string'
      or jsonb_typeof(image->'alt') is distinct from 'string'
      or jsonb_typeof(image->'caption') is distinct from 'string'
      or jsonb_typeof(image->'after_paragraph') is distinct from 'number'
      or image - array['id', 'url', 'alt', 'caption', 'after_paragraph'] <> '{}'::jsonb
    then return false; end if;

    if image->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or image->>'id' = any(image_ids)
      or char_length(btrim(image->>'alt')) not between 1 and 300
      or char_length(image->>'caption') > 300
    then return false; end if;
    image_ids := array_append(image_ids, image->>'id');

    position := (image->>'after_paragraph')::numeric;
    if position < 0 or position > 10000 or position <> trunc(position) then return false; end if;

    image_url := image->>'url';
    if char_length(image_url) not between 1 and 2048
      or image_url ~ '(^|/)\.\.?(/|$)'
      or not (
        image_url ~ '^/images/[A-Za-z0-9][A-Za-z0-9._/-]*$'
        or image_url ~ '^https://[A-Za-z0-9.-]+\.supabase\.co/storage/v1/object/public/project-images/[A-Za-z0-9][A-Za-z0-9._/-]*$'
      )
    then return false; end if;
  end loop;
  return true;
end;
$$;

create or replace function public.valid_project_thumbnail_crop(crop jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  if crop is null then return true; end if;
  if jsonb_typeof(crop) is distinct from 'object'
    or jsonb_typeof(crop->'x') is distinct from 'number'
    or jsonb_typeof(crop->'y') is distinct from 'number'
    or jsonb_typeof(crop->'zoom') is distinct from 'number'
    or crop - array['x', 'y', 'zoom'] <> '{}'::jsonb
  then return false; end if;
  return (crop->>'x')::numeric between 0 and 100
    and (crop->>'y')::numeric between 0 and 100
    and (crop->>'zoom')::numeric between 1 and 3;
end;
$$;

alter table public.projects
  drop constraint if exists projects_body_images_valid,
  drop constraint if exists projects_thumbnail_crop_valid;

alter table public.projects
  add constraint projects_body_images_valid check (public.valid_project_body_images(body_images)),
  add constraint projects_thumbnail_crop_valid check (public.valid_project_thumbnail_crop(thumbnail_crop));

notify pgrst, 'reload schema';
commit;
