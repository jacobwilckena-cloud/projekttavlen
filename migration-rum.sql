-- Kør denne ÉN gang i Supabase SQL Editor for at tilføje rum-feltet
alter table projekter add column if not exists rum text not null default '';
