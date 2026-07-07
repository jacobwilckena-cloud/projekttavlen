-- Projekttavlen: kør denne én gang i Supabase (SQL Editor -> New query -> Run)
-- Sikker at køre i et projekt med eksisterende tabeller (fx navnevælgeren):
-- alt er afgrænset til tabellen "projekter".

create table if not exists projekter (
  id uuid primary key default gen_random_uuid(),
  navn text not null,
  status text not null default 'igang' check (status in ('ide','igang','faerdig')),
  prioritet integer not null default 1,
  kraever uuid[] not null default '{}',
  budget integer not null default 0,
  brugt integer not null default 0,
  noter text not null default '',
  liste jsonb not null default '[]',
  oprettet timestamptz not null default now(),
  opdateret timestamptz not null default now()
);

-- Opdaterer "opdateret" automatisk
create or replace function saet_opdateret() returns trigger as $$
begin
  new.opdateret = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_opdateret on projekter;
create trigger trg_opdateret before update on projekter
  for each row execute function saet_opdateret();

-- Adgang: alle med appens anon-nøgle kan læse og skrive.
-- Det er fint til en privat familie-app, hvor kun I to har URL'en.
-- Vil I stramme det senere, kan I slå Supabase Auth til og erstatte
-- politikkerne med auth.uid()-baserede regler.
alter table projekter enable row level security;

drop policy if exists "alle kan laese" on projekter;
create policy "alle kan laese" on projekter for select using (true);

drop policy if exists "alle kan skrive" on projekter;
create policy "alle kan skrive" on projekter for insert with check (true);

drop policy if exists "alle kan opdatere" on projekter;
create policy "alle kan opdatere" on projekter for update using (true);

drop policy if exists "alle kan slette" on projekter;
create policy "alle kan slette" on projekter for delete using (true);

-- Realtime: gør ændringer synlige for den anden telefon med det samme
alter publication supabase_realtime add table projekter;
