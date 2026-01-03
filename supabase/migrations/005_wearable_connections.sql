-- ============================================
-- Wearable Connections & Health Data
-- Migration 005
-- ============================================

-- Tabelle für Wearable-Verbindungen (OAuth Tokens)
CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('garmin', 'whoop', 'oura', 'apple', 'samsung')),
    
    -- OAuth Tokens (verschlüsselt speichern in Produktion!)
    access_token TEXT NOT NULL,
    access_token_secret TEXT, -- Für OAuth 1.0a (Garmin)
    refresh_token TEXT, -- Für OAuth 2.0
    expires_at TIMESTAMPTZ,
    
    -- Provider-spezifische User ID
    provider_user_id TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id, provider),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_wearable_connections_user_id ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_provider ON wearable_connections(provider);

-- Tabelle für synchronisierte Gesundheitsdaten
CREATE TABLE IF NOT EXISTS wearable_health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Normalisierte Daten (alle Werte 0-10 oder absolute Werte)
    -- Schlaf
    sleep_score DECIMAL(3,1), -- 0-10
    sleep_duration_hours DECIMAL(4,2),
    deep_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    
    -- HRV
    hrv_average INTEGER,
    hrv_status TEXT,
    
    -- Herzfrequenz
    resting_heart_rate INTEGER,
    
    -- Energie/Erholung
    body_battery_high INTEGER,
    body_battery_low INTEGER,
    recovery_score DECIMAL(3,1), -- 0-10
    
    -- Stress
    stress_level DECIMAL(3,1), -- 0-10
    
    -- Aktivität
    steps INTEGER,
    active_minutes INTEGER,
    
    -- SpO2
    spo2_average DECIMAL(4,1),
    
    -- Rohdaten für Debugging (optional)
    raw_data JSONB,
    
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ein Eintrag pro User/Provider/Tag
    UNIQUE(user_id, provider, date)
);

-- Indices für Analytics
CREATE INDEX IF NOT EXISTS idx_wearable_health_user_date ON wearable_health_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_health_provider ON wearable_health_data(provider);

-- Tabelle für Chrono-Stack Einstellungen (personalisiertes Timing)
CREATE TABLE IF NOT EXISTS chrono_stack_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    
    -- Schlaf-Zeiten (automatisch aus Wearable oder manuell)
    avg_sleep_time TIME, -- z.B. 23:15
    avg_wake_time TIME, -- z.B. 06:45
    
    -- Berechnete Fenster
    morning_window_start TIME,
    morning_window_end TIME,
    noon_window_start TIME,
    noon_window_end TIME,
    evening_window_start TIME,
    evening_window_end TIME,
    bedtime_window_start TIME,
    bedtime_window_end TIME,
    
    -- Letzte Koffein-Zeit (basierend auf Schlafzeit)
    last_caffeine_time TIME,
    
    -- Quelle der Daten
    data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'garmin', 'whoop', 'oura', 'apple', 'samsung')),
    
    -- Automatische Aktualisierung
    auto_update BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chrono_stack_settings ENABLE ROW LEVEL SECURITY;

-- Policies für anonyme User (user_id = anon_xxx)
CREATE POLICY "Users can manage own wearable connections"
    ON wearable_connections
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view own health data"
    ON wearable_health_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can manage own chrono settings"
    ON chrono_stack_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wearable_connections_updated_at
    BEFORE UPDATE ON wearable_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chrono_stack_settings_updated_at
    BEFORE UPDATE ON chrono_stack_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

