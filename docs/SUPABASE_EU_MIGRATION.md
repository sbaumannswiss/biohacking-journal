# Supabase EU-Migration Anleitung

## Übersicht

Diese Anleitung beschreibt die Migration des Supabase-Projekts nach **EU Central (Frankfurt)** für DSGVO/DSG-Compliance.

## Voraussetzungen

- Supabase Account
- Zugriff auf das aktuelle Projekt
- Lokales Supabase CLI installiert

## Schritt 1: Neues EU-Projekt erstellen

1. Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klicke auf "New Project"
3. Wähle **Frankfurt (eu-central-1)** als Region
4. Projektname: `stax-eu` (oder ähnlich)
5. Generiere ein starkes Datenbank-Passwort

## Schritt 2: Schema migrieren

```bash
# Alle Migrations aus dem Ordner anwenden
cd supabase/migrations

# Verbinde mit neuem Projekt
supabase link --project-ref <NEUE_PROJECT_REF>

# Migriere Schema
supabase db push
```

Oder manuell im SQL-Editor alle Migrations ausführen:
- `003_supplement_submissions.sql`
- `004_custom_supplements.sql`
- `004_waitlist_emails.sql`
- `005_wearable_connections.sql`
- `006_workout_tracking.sql`
- `007_auth_rls_policies.sql`

## Schritt 3: Daten exportieren (altes Projekt)

```bash
# Via Supabase CLI
supabase db dump -f backup.sql --project-ref <ALTE_PROJECT_REF>

# Oder via pg_dump
pg_dump -h db.<ALTE_REF>.supabase.co -U postgres -d postgres -F c -f backup.dump
```

## Schritt 4: Daten importieren (neues Projekt)

```bash
# Via psql
psql -h db.<NEUE_REF>.supabase.co -U postgres -d postgres -f backup.sql

# Oder via pg_restore
pg_restore -h db.<NEUE_REF>.supabase.co -U postgres -d postgres backup.dump
```

**Wichtig:** Auth-Daten (users, sessions) werden NICHT migriert. User müssen sich neu registrieren.

## Schritt 5: Environment-Variablen aktualisieren

### Vercel

1. Gehe zu Vercel Dashboard → Projekt → Settings → Environment Variables
2. Aktualisiere:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<NEUE_REF>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Neuer Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY` = Neuer Service Role Key (falls verwendet)

### Lokal (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<NEUE_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEUER_ANON_KEY>
```

## Schritt 6: Auth-Konfiguration

Im neuen Supabase-Projekt unter Authentication → URL Configuration:

1. **Site URL:** `https://your-domain.vercel.app`
2. **Redirect URLs:**
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/auth/reset-password`
   - `http://localhost:3000/auth/callback` (für Entwicklung)

## Schritt 7: E-Mail Templates

Unter Authentication → Email Templates:

1. **Confirm Signup:** Deutsche Bestätigungs-E-Mail
2. **Magic Link:** Deutsche Magic-Link-E-Mail
3. **Reset Password:** Deutsche Passwort-Reset-E-Mail

## Schritt 8: Testen

```bash
# Lokale Entwicklung
npm run dev

# Prüfen:
# - Login funktioniert
# - Daten werden gespeichert
# - RLS Policies greifen
```

## Schritt 9: Deployment

```bash
# Vercel deployment triggern
git add .
git commit -m "chore: update Supabase to EU region"
git push
```

## Schritt 10: Altes Projekt löschen

Erst wenn alles funktioniert:
1. Supabase Dashboard → Old Project → Settings → General
2. "Delete Project" am Ende der Seite

## Checkliste

- [ ] Neues EU-Projekt erstellt
- [ ] Schema migriert (alle SQL-Dateien)
- [ ] Daten exportiert/importiert (falls vorhanden)
- [ ] Vercel Environment Variables aktualisiert
- [ ] Auth URLs konfiguriert
- [ ] E-Mail Templates auf Deutsch
- [ ] Lokale Tests erfolgreich
- [ ] Production deployment erfolgreich
- [ ] Altes Projekt gelöscht

## Hinweise zur Datenmigration

### Was wird migriert:
- Alle Tabellendaten
- Schema und Constraints
- Funktionen und Trigger

### Was wird NICHT migriert:
- Auth Users (müssen sich neu registrieren)
- Storage Buckets (müssen neu erstellt werden)
- Edge Functions (müssen neu deployed werden)
- RLS Policies (werden durch Migration erstellt)

## Support

Bei Problemen:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
