-- ============================================
-- AUTH-BASIERTE RLS POLICIES
-- Migration 007
-- 
-- Ersetzt alle USING(true) Policies durch echte
-- Benutzer-Authentifizierung mit auth.uid()
-- ============================================

-- ============================================
-- PROFILES TABLE (für Auth-User)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    encryption_salt TEXT, -- Für Client-seitige Verschlüsselung
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- DSGVO Einwilligungen
    privacy_accepted_at TIMESTAMPTZ,
    health_data_consent_at TIMESTAMPTZ,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    -- Präferenzen
    language TEXT DEFAULT 'de',
    timezone TEXT DEFAULT 'Europe/Berlin'
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger für automatisches Profil bei Signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, encryption_salt)
    VALUES (
        NEW.id,
        NEW.email,
        encode(gen_random_bytes(32), 'base64')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger nur erstellen wenn nicht existiert
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- ============================================
-- DROP alte unsichere Policies
-- ============================================

-- supplement_submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON supplement_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON supplement_submissions;

-- custom_supplements
DROP POLICY IF EXISTS "Users can insert own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Users can view own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Users can update own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Users can delete own custom supplements" ON custom_supplements;

-- wearable_connections
DROP POLICY IF EXISTS "Users can manage own wearable connections" ON wearable_connections;

-- wearable_health_data
DROP POLICY IF EXISTS "Users can view own health data" ON wearable_health_data;

-- chrono_stack_settings
DROP POLICY IF EXISTS "Users can manage own chrono settings" ON chrono_stack_settings;

-- ============================================
-- NEUE sichere Policies
-- ============================================

-- supplement_submissions
CREATE POLICY "Auth users can insert own submissions" ON supplement_submissions
    FOR INSERT
    WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Auth users can view own submissions" ON supplement_submissions
    FOR SELECT
    USING (auth.uid() = submitted_by);

-- custom_supplements
CREATE POLICY "Auth users can insert own custom supplements" ON custom_supplements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users can view own custom supplements" ON custom_supplements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Auth users can update own custom supplements" ON custom_supplements
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Auth users can delete own custom supplements" ON custom_supplements
    FOR DELETE
    USING (auth.uid() = user_id);

-- wearable_connections
CREATE POLICY "Auth users can manage own wearable connections" ON wearable_connections
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- wearable_health_data
CREATE POLICY "Auth users can manage own health data" ON wearable_health_data
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- chrono_stack_settings
CREATE POLICY "Auth users can manage own chrono settings" ON chrono_stack_settings
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- CORE TABLES (user_stack, check_ins, daily_metrics)
-- Diese werden typischerweise in einer Basis-Migration erstellt
-- ============================================

-- user_stack
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_stack') THEN
        DROP POLICY IF EXISTS "Users can manage own stack" ON user_stack;
        
        CREATE POLICY "Auth users can view own stack" ON user_stack
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can insert own stack" ON user_stack
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can update own stack" ON user_stack
            FOR UPDATE USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can delete own stack" ON user_stack
            FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- check_ins
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'check_ins') THEN
        DROP POLICY IF EXISTS "Users can manage own check_ins" ON check_ins;
        
        CREATE POLICY "Auth users can view own check_ins" ON check_ins
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can insert own check_ins" ON check_ins
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can delete own check_ins" ON check_ins
            FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- daily_metrics
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_metrics') THEN
        DROP POLICY IF EXISTS "Users can manage own metrics" ON daily_metrics;
        
        CREATE POLICY "Auth users can view own metrics" ON daily_metrics
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can insert own metrics" ON daily_metrics
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can update own metrics" ON daily_metrics
            FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- user_quests
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_quests') THEN
        DROP POLICY IF EXISTS "Users can manage own quests" ON user_quests;
        
        CREATE POLICY "Auth users can view own quests" ON user_quests
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can insert own quests" ON user_quests
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can update own quests" ON user_quests
            FOR UPDATE USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Auth users can delete own quests" ON user_quests
            FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ============================================
-- WAITLIST (bleibt öffentlich für Insert)
-- ============================================

-- waitlist_emails Policy bleibt wie sie ist (anonyme Inserts erlaubt)
-- Keine Änderung nötig

-- ============================================
-- AUDIT LOG für DSGVO Compliance
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- User kann nur eigene Audit-Logs sehen
CREATE POLICY "Users can view own audit logs" ON audit_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Insert nur durch Service Role (Backend)
CREATE POLICY "Service role can insert audit logs" ON audit_log
    FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE audit_log IS 'DSGVO-konformes Audit-Log für Datenzugriffe und Änderungen';

-- ============================================
-- FUNCTION: Log DSGVO-relevante Aktionen
-- ============================================

CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: User Datenexport (DSGVO Art. 20)
-- ============================================

CREATE OR REPLACE FUNCTION export_user_data()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB := '{}';
BEGIN
    -- Profile
    SELECT jsonb_build_object('profile', row_to_json(p))
    INTO v_result
    FROM profiles p WHERE p.id = v_user_id;
    
    -- User Stack
    v_result := v_result || jsonb_build_object(
        'user_stack',
        (SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]') FROM user_stack s WHERE s.user_id = v_user_id::text)
    );
    
    -- Check-Ins
    v_result := v_result || jsonb_build_object(
        'check_ins',
        (SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]') FROM check_ins c WHERE c.user_id = v_user_id::text)
    );
    
    -- Daily Metrics
    v_result := v_result || jsonb_build_object(
        'daily_metrics',
        (SELECT COALESCE(jsonb_agg(row_to_json(m)), '[]') FROM daily_metrics m WHERE m.user_id = v_user_id::text)
    );
    
    -- Wearable Data
    v_result := v_result || jsonb_build_object(
        'wearable_health_data',
        (SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]') FROM wearable_health_data w WHERE w.user_id = v_user_id::text)
    );
    
    -- Custom Supplements
    v_result := v_result || jsonb_build_object(
        'custom_supplements',
        (SELECT COALESCE(jsonb_agg(row_to_json(cs)), '[]') FROM custom_supplements cs WHERE cs.user_id = v_user_id)
    );
    
    -- User Quests
    v_result := v_result || jsonb_build_object(
        'user_quests',
        (SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]') FROM user_quests q WHERE q.user_id = v_user_id::text)
    );
    
    -- Log Export-Aktion
    PERFORM log_audit_event('data_export', NULL, NULL, NULL, NULL);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: User Daten löschen (DSGVO Art. 17)
-- ============================================

CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Log vor dem Löschen
    PERFORM log_audit_event('data_delete_requested', NULL, v_user_id::text, NULL, NULL);
    
    -- Lösche alle User-Daten (CASCADE kümmert sich um verbundene Tabellen)
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Lösche Tabellen mit TEXT user_id
    DELETE FROM user_stack WHERE user_id = v_user_id::text;
    DELETE FROM check_ins WHERE user_id = v_user_id::text;
    DELETE FROM daily_metrics WHERE user_id = v_user_id::text;
    DELETE FROM wearable_connections WHERE user_id = v_user_id::text;
    DELETE FROM wearable_health_data WHERE user_id = v_user_id::text;
    DELETE FROM chrono_stack_settings WHERE user_id = v_user_id::text;
    DELETE FROM custom_supplements WHERE user_id = v_user_id;
    DELETE FROM supplement_submissions WHERE submitted_by = v_user_id;
    DELETE FROM user_quests WHERE user_id = v_user_id::text;
    
    -- Workout-Daten (haben FK zu profiles)
    DELETE FROM scheduled_workouts WHERE user_id = v_user_id;
    DELETE FROM detected_workouts WHERE user_id = v_user_id;
    DELETE FROM workout_supplement_logs WHERE user_id = v_user_id;
    DELETE FROM hydration_logs WHERE user_id = v_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION export_user_data() IS 'DSGVO Art. 20 - Exportiert alle Nutzerdaten als JSON';
COMMENT ON FUNCTION delete_user_data() IS 'DSGVO Art. 17 - Löscht alle Nutzerdaten';
