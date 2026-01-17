-- Waitlist E-Mails Tabelle
-- Speichert E-Mails von Interessenten für die App

CREATE TABLE IF NOT EXISTS waitlist_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'waitlist_page',
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index für schnelle E-Mail-Lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_email ON waitlist_emails(email);

-- Index für Datum (für Statistiken)
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_created_at ON waitlist_emails(created_at);

-- Row Level Security (optional, aber empfohlen)
ALTER TABLE waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Nur Insert erlaubt (kein Read von außen)
CREATE POLICY "Allow anonymous inserts" ON waitlist_emails
    FOR INSERT
    WITH CHECK (true);

-- Policy: Nur authentifizierte Admins können lesen (für Dashboard später)
-- CREATE POLICY "Allow admin reads" ON waitlist_emails
--     FOR SELECT
--     USING (auth.role() = 'authenticated');

COMMENT ON TABLE waitlist_emails IS 'E-Mail-Adressen von Nutzern auf der Warteliste';
COMMENT ON COLUMN waitlist_emails.source IS 'Woher kam die Anmeldung (waitlist_page, twitter, etc.)';
COMMENT ON COLUMN waitlist_emails.notified_at IS 'Wann wurde die Person über den Launch benachrichtigt';


