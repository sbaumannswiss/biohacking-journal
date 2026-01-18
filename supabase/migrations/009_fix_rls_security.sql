-- ============================================
-- FIX RLS SECURITY ISSUES
-- Migration 009
-- 
-- Behebt Vercel Security Warnungen:
-- - Entfernt alle USING(true) Policies
-- - Erstellt sichere auth.uid() basierte Policies
-- ============================================

-- ============================================
-- DAILY_METRICS - Fix "Allow all" und "Enable insert" Policies
-- ============================================

-- Alle existierenden Policies droppen (verschiedene mögliche Namen)
DROP POLICY IF EXISTS "Allow all" ON daily_metrics;
DROP POLICY IF EXISTS "Enable insert" ON daily_metrics;
DROP POLICY IF EXISTS "Enable insert for all" ON daily_metrics;
DROP POLICY IF EXISTS "Users can manage own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Auth users can view own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Auth users can insert own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Auth users can update own metrics" ON daily_metrics;

-- Neue sichere Policies
CREATE POLICY "Secure: Users can view own metrics" ON daily_metrics
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Secure: Users can insert own metrics" ON daily_metrics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Secure: Users can update own metrics" ON daily_metrics
    FOR UPDATE USING (auth.uid()::text = user_id);

-- ============================================
-- INTAKE_LOGS - Fix "Enable insert" Policy
-- ============================================

-- Prüfen ob Tabelle existiert und Policies fixen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intake_logs') THEN
        -- Alle Policies droppen
        DROP POLICY IF EXISTS "Enable insert" ON intake_logs;
        DROP POLICY IF EXISTS "Enable insert for all" ON intake_logs;
        DROP POLICY IF EXISTS "Allow all" ON intake_logs;
        DROP POLICY IF EXISTS "Users can manage intake logs" ON intake_logs;
        
        -- Sichere Policies erstellen
        CREATE POLICY "Secure: Users can view own intake logs" ON intake_logs
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can insert own intake logs" ON intake_logs
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can update own intake logs" ON intake_logs
            FOR UPDATE USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can delete own intake logs" ON intake_logs
            FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ============================================
-- SUPPLEMENT_SUBMISSIONS - Fix "Allow" Policy
-- ============================================

DROP POLICY IF EXISTS "Users can insert own submissions" ON supplement_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON supplement_submissions;
DROP POLICY IF EXISTS "Auth users can insert own submissions" ON supplement_submissions;
DROP POLICY IF EXISTS "Auth users can view own submissions" ON supplement_submissions;
DROP POLICY IF EXISTS "Allow all" ON supplement_submissions;

CREATE POLICY "Secure: Users can insert own submissions" ON supplement_submissions
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Secure: Users can view own submissions" ON supplement_submissions
    FOR SELECT USING (auth.uid() = submitted_by);

-- ============================================
-- USER_QUESTS - Fix "Users can manage" Policy
-- ============================================

DROP POLICY IF EXISTS "Users can manage their own quests" ON user_quests;
DROP POLICY IF EXISTS "Users can manage own quests" ON user_quests;
DROP POLICY IF EXISTS "Auth users can view own quests" ON user_quests;
DROP POLICY IF EXISTS "Auth users can insert own quests" ON user_quests;
DROP POLICY IF EXISTS "Auth users can update own quests" ON user_quests;
DROP POLICY IF EXISTS "Auth users can delete own quests" ON user_quests;

CREATE POLICY "Secure: Users can view own quests" ON user_quests
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Secure: Users can insert own quests" ON user_quests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Secure: Users can update own quests" ON user_quests
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Secure: Users can delete own quests" ON user_quests
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- CUSTOM_SUPPLEMENTS - Sicherstellen dass sicher
-- ============================================

DROP POLICY IF EXISTS "Users can insert own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Users can view own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Users can update own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Users can delete own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Auth users can insert own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Auth users can view own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Auth users can update own custom supplements" ON custom_supplements;
DROP POLICY IF EXISTS "Auth users can delete own custom supplements" ON custom_supplements;

CREATE POLICY "Secure: Users can insert own custom supplements" ON custom_supplements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Secure: Users can view own custom supplements" ON custom_supplements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can update own custom supplements" ON custom_supplements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can delete own custom supplements" ON custom_supplements
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- WEARABLE_CONNECTIONS - Sicherstellen dass sicher
-- ============================================

DROP POLICY IF EXISTS "Users can manage own wearable connections" ON wearable_connections;
DROP POLICY IF EXISTS "Auth users can manage own wearable connections" ON wearable_connections;

CREATE POLICY "Secure: Users can manage own wearable connections" ON wearable_connections
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- WEARABLE_HEALTH_DATA - Sicherstellen dass sicher
-- ============================================

DROP POLICY IF EXISTS "Users can view own health data" ON wearable_health_data;
DROP POLICY IF EXISTS "Auth users can manage own health data" ON wearable_health_data;

CREATE POLICY "Secure: Users can manage own health data" ON wearable_health_data
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- CHRONO_STACK_SETTINGS - Sicherstellen dass sicher
-- ============================================

DROP POLICY IF EXISTS "Users can manage own chrono settings" ON chrono_stack_settings;
DROP POLICY IF EXISTS "Auth users can manage own chrono settings" ON chrono_stack_settings;

CREATE POLICY "Secure: Users can manage own chrono settings" ON chrono_stack_settings
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- USER_STACK - Sicherstellen dass sicher
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_stack') THEN
        DROP POLICY IF EXISTS "Users can manage own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can view own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can insert own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can update own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can delete own stack" ON user_stack;
        
        CREATE POLICY "Secure: Users can view own stack" ON user_stack
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can insert own stack" ON user_stack
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can update own stack" ON user_stack
            FOR UPDATE USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can delete own stack" ON user_stack
            FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ============================================
-- CHECK_INS - Sicherstellen dass sicher
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'check_ins') THEN
        DROP POLICY IF EXISTS "Users can manage own check_ins" ON check_ins;
        DROP POLICY IF EXISTS "Auth users can view own check_ins" ON check_ins;
        DROP POLICY IF EXISTS "Auth users can insert own check_ins" ON check_ins;
        DROP POLICY IF EXISTS "Auth users can delete own check_ins" ON check_ins;
        
        CREATE POLICY "Secure: Users can view own check_ins" ON check_ins
            FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can insert own check_ins" ON check_ins
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Secure: Users can delete own check_ins" ON check_ins
            FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ============================================
-- AUDIT_LOG - Fix Service Role Insert Policy
-- ============================================

DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_log;

-- Service Role Insert nur von authentifizierten Usern oder Service
CREATE POLICY "Secure: Authenticated can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');

-- Migration 009 complete: All USING(true) policies replaced with auth.uid() checks
