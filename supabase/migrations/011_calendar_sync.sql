-- ============================================
-- CALENDAR SYNC MIGRATION
-- Speichert Kalender-Einstellungen und Sync-Status
-- ============================================

-- Kalender-Einstellungen pro User
CREATE TABLE IF NOT EXISTS calendar_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    alert_minutes INTEGER DEFAULT 15,
    custom_times JSONB DEFAULT '{
        "morning": {"hour": 7, "minute": 0},
        "noon": {"hour": 12, "minute": 0},
        "evening": {"hour": 18, "minute": 0},
        "bedtime": {"hour": 22, "minute": 0}
    }'::jsonb,
    use_recurring_events BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Sync-Status für einzelne Supplements
-- Speichert welche Supplements im Kalender sind und deren Event-IDs
CREATE TABLE IF NOT EXISTS calendar_sync_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplement_id TEXT NOT NULL,
    calendar_event_id TEXT NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, supplement_id)
);

-- Indices für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id 
    ON calendar_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_items_user_id 
    ON calendar_sync_items(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_items_supplement 
    ON calendar_sync_items(user_id, supplement_id);

-- RLS Policies
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_items ENABLE ROW LEVEL SECURITY;

-- User kann nur eigene Einstellungen sehen/bearbeiten
CREATE POLICY "Users can view own calendar settings"
    ON calendar_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar settings"
    ON calendar_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar settings"
    ON calendar_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar settings"
    ON calendar_settings FOR DELETE
    USING (auth.uid() = user_id);

-- User kann nur eigene Sync-Items sehen/bearbeiten
CREATE POLICY "Users can view own calendar sync items"
    ON calendar_sync_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar sync items"
    ON calendar_sync_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar sync items"
    ON calendar_sync_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar sync items"
    ON calendar_sync_items FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_calendar_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_settings_updated_at
    BEFORE UPDATE ON calendar_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_settings_updated_at();
