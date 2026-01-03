-- User Quests Tabelle
-- Speichert von Helix generierte und aktivierte Quests

CREATE TABLE IF NOT EXISTS user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    duration TEXT, -- z.B. "7 Tage", "1 Woche"
    category TEXT, -- z.B. "Sleep", "Focus", "Streak"
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
    progress INTEGER DEFAULT 0, -- 0-100 Prozent
    target_value INTEGER, -- z.B. 7 für "7 Tage"
    current_value INTEGER DEFAULT 0, -- Aktueller Fortschritt
    source TEXT DEFAULT 'helix', -- 'helix', 'system', 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Index für schnelle User-Abfragen
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);

-- RLS aktivieren
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann seine eigenen Quests lesen/schreiben
CREATE POLICY "Users can manage their own quests" ON user_quests
    FOR ALL USING (true);

