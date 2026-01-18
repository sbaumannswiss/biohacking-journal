-- ============================================
-- ONBOARDING PROFILE DATA
-- Speichert alle Onboarding-Daten als JSONB
-- ============================================

-- Füge JSONB-Spalte für Onboarding-Daten hinzu
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- Kommentar für Dokumentation
COMMENT ON COLUMN profiles.onboarding_data IS 'Stores onboarding data: age_group, gender, weight, chronotype, activity_level, caffeine_level, diet_type, allergies, medications, goals, wearables';

-- Index für schnelle Abfragen auf goals (häufig abgefragt)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_goals 
    ON profiles USING GIN ((onboarding_data -> 'goals'));

-- Index für Medikamente (für Warnungs-Checks)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_medications 
    ON profiles USING GIN ((onboarding_data -> 'medications'));
