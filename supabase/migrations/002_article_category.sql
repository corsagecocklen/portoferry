-- Tambahkan kategori tulisan tanpa mengubah data atau kebijakan akses.
begin;

alter table public.projects
  drop constraint if exists projects_category_check;

alter table public.projects
  add constraint projects_category_check check (category in (
    'Web Development',
    'IT Consulting',
    'Video Editing',
    'Graphic Design',
    'AI Consulting',
    'Artikel'
  ));

commit;
