# Projekttavlen

Fælles projekttavle til lejligheden – prioriteret rækkefølge, afhængigheder mellem
projekter (låste projekter kan ikke startes, før forgængerne er færdige), budget,
udgifter og indkøbslister. Realtids-synkronisering mellem flere telefoner via Supabase.

## Teknologi
- React 18 + Vite
- Supabase (Postgres + Realtime) som backend
- Ingen login – adgang styres af, hvem der kender appens URL

## Kom i gang

### 1. Supabase
Appen deler Supabase-projekt med navnevælgeren.
1. Åbn projektet på supabase.com → **SQL Editor** → New query → indsæt indholdet af `schema.sql` → Run
2. Find **Project Settings → API** og notér `Project URL` og `anon public`-nøglen

### 2. Lokalt
```bash
cp .env.example .env    # og indsæt jeres URL + anon key
npm install
npm run dev
```

### 3. Udrulning (Netlify)
1. Push dette repo til GitHub
2. Gå til app.netlify.com → **Add new site → Import an existing project** → vælg repo'et
3. Byg-indstillingerne læses automatisk fra `netlify.toml` (build: `npm run build`, publish: `dist`)
4. Under **Site configuration → Environment variables** tilføjes:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy – og gem URL'en på begge telefoners hjemmeskærm (Safari → Del → Føj til hjemmeskærm)

Herefter deployes automatisk ved hvert push til `main`.

## Datamodel
Én tabel, `projekter`:

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | Primærnøgle |
| navn | text | Projektets navn |
| status | text | `ide`, `igang` eller `faerdig` |
| prioritet | int | 1 = vigtigst; appen omnummererer altid til 1..n |
| kraever | uuid[] | Projekter der skal være færdige først |
| budget / brugt | int | Kroner |
| noter | text | Mål, links, beslutninger |
| liste | jsonb | Indkøbsliste: `[{tekst, koebt}]` |

## Bemærkninger om adgang
RLS-politikkerne i `schema.sql` tillader læsning/skrivning for alle med anon-nøglen.
Det er bevidst simpelt til en privat app for to personer. Skal det strammes, slå
Supabase Auth til og udskift politikkerne med `auth.uid()`-baserede regler.
