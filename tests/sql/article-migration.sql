\set ON_ERROR_STOP on
-- Run only in a disposable test database after 001_portfolio.sql.

insert into public.projects (slug, title, category, summary, description, image_url, year)
select 'existing-' || row_number() over (), 'Existing post', category,
  'Existing summary', 'Existing body', '/images/project-placeholder.svg', 2026
from unnest(array['Web Development', 'IT Consulting', 'Video Editing', 'Graphic Design', 'AI Consulting']) as category;

create temporary table expected_projects as table public.projects;
create temporary table expected_policies as select * from pg_policies where schemaname = 'public';

\ir ../../supabase/migrations/002_article_category.sql
\ir ../../supabase/migrations/002_article_category.sql

do $$
begin
  if exists ((table expected_projects except table public.projects) union all (table public.projects except table expected_projects)) then
    raise exception 'Migration changed existing projects';
  end if;
  if exists ((select * from expected_policies except select * from pg_policies where schemaname = 'public')
    union all (select * from pg_policies where schemaname = 'public' except select * from expected_policies)) then
    raise exception 'Migration changed access policies';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.projects'::regclass) then
    raise exception 'Row level security must remain enabled';
  end if;
end;
$$;

insert into public.projects (slug, title, category, summary, description, image_url, year)
values ('article-test', 'Article test', 'Artikel', 'Summary', 'Article body', '/images/project-placeholder.svg', 2026);

do $$
begin
  begin
    update public.projects set category = 'Unknown' where slug = 'article-test';
    raise exception 'Unknown category was accepted';
  exception when check_violation then
    null;
  end;
  if (select published from public.projects where slug = 'article-test') then
    raise exception 'Articles must still default to draft';
  end if;
end;
$$;

\ir ../../supabase/migrations/002_article_category.sql

select 'Article migration passed: idempotent, existing data and policies preserved, unknown categories rejected.' as result;
