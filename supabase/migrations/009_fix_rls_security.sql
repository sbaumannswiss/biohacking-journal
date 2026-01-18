-- ============================================
-- FIX RLS SECURITY ISSUES - SAFE VERSION
-- Migration 009
-- ============================================

-- DAILY_METRICS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_metrics') THEN
        DROP POLICY IF EXISTS "Allow all" ON daily_metrics;
        DROP POLICY IF EXISTS "Enable insert" ON daily_metrics;
        DROP POLICY IF EXISTS "Enable insert for all" ON daily_metrics;
        DROP POLICY IF EXISTS "Users can manage own metrics" ON daily_metrics;
        DROP POLICY IF EXISTS "Auth users can view own metrics" ON daily_metrics;
        DROP POLICY IF EXISTS "Auth users can insert own metrics" ON daily_metrics;
        DROP POLICY IF EXISTS "Auth users can update own metrics" ON daily_metrics;

        CREATE POLICY "Secure: Users can view own metrics" ON daily_metrics
            FOR SELECT USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can insert own metrics" ON daily_metrics
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can update own metrics" ON daily_metrics
            FOR UPDATE USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- INTAKE_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'intake_logs') THEN
        DROP POLICY IF EXISTS "Enable insert" ON intake_logs;
        DROP POLICY IF EXISTS "Enable insert for all" ON intake_logs;
        DROP POLICY IF EXISTS "Allow all" ON intake_logs;
        DROP POLICY IF EXISTS "Users can manage intake logs" ON intake_logs;
        
        CREATE POLICY "Secure: Users can view own intake logs" ON intake_logs
            FOR SELECT USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can insert own intake logs" ON intake_logs
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can update own intake logs" ON intake_logs
            FOR UPDATE USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can delete own intake logs" ON intake_logs
            FOR DELETE USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- SUPPLEMENT_SUBMISSIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplement_submissions') THEN
        DROP POLICY IF EXISTS "Users can insert own submissions" ON supplement_submissions;
        DROP POLICY IF EXISTS "Users can view own submissions" ON supplement_submissions;
        DROP POLICY IF EXISTS "Auth users can insert own submissions" ON supplement_submissions;
        DROP POLICY IF EXISTS "Auth users can view own submissions" ON supplement_submissions;
        DROP POLICY IF EXISTS "Allow all" ON supplement_submissions;

        CREATE POLICY "Secure: Users can insert own submissions" ON supplement_submissions
            FOR INSERT WITH CHECK (auth.uid() = submitted_by);
        CREATE POLICY "Secure: Users can view own submissions" ON supplement_submissions
            FOR SELECT USING (auth.uid() = submitted_by);
    END IF;
END $$;

-- USER_QUESTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_quests') THEN
        DROP POLICY IF EXISTS "Users can manage their own quests" ON user_quests;
        DROP POLICY IF EXISTS "Users can manage own quests" ON user_quests;
        DROP POLICY IF EXISTS "Auth users can view own quests" ON user_quests;
        DROP POLICY IF EXISTS "Auth users can insert own quests" ON user_quests;
        DROP POLICY IF EXISTS "Auth users can update own quests" ON user_quests;
        DROP POLICY IF EXISTS "Auth users can delete own quests" ON user_quests;

        CREATE POLICY "Secure: Users can view own quests" ON user_quests
            FOR SELECT USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can insert own quests" ON user_quests
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can update own quests" ON user_quests
            FOR UPDATE USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can delete own quests" ON user_quests
            FOR DELETE USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- CUSTOM_SUPPLEMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_supplements') THEN
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
    END IF;
END $$;

-- WEARABLE_CONNECTIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wearable_connections') THEN
        DROP POLICY IF EXISTS "Users can manage own wearable connections" ON wearable_connections;
        DROP POLICY IF EXISTS "Auth users can manage own wearable connections" ON wearable_connections;

        CREATE POLICY "Secure: Users can manage own wearable connections" ON wearable_connections
            FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- WEARABLE_HEALTH_DATA
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wearable_health_data') THEN
        DROP POLICY IF EXISTS "Users can view own health data" ON wearable_health_data;
        DROP POLICY IF EXISTS "Auth users can manage own health data" ON wearable_health_data;

        CREATE POLICY "Secure: Users can manage own health data" ON wearable_health_data
            FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- CHRONO_STACK_SETTINGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chrono_stack_settings') THEN
        DROP POLICY IF EXISTS "Users can manage own chrono settings" ON chrono_stack_settings;
        DROP POLICY IF EXISTS "Auth users can manage own chrono settings" ON chrono_stack_settings;

        CREATE POLICY "Secure: Users can manage own chrono settings" ON chrono_stack_settings
            FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- USER_STACK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stack') THEN
        DROP POLICY IF EXISTS "Users can manage own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can view own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can insert own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can update own stack" ON user_stack;
        DROP POLICY IF EXISTS "Auth users can delete own stack" ON user_stack;
        
        CREATE POLICY "Secure: Users can view own stack" ON user_stack
            FOR SELECT USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can insert own stack" ON user_stack
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can update own stack" ON user_stack
            FOR UPDATE USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can delete own stack" ON user_stack
            FOR DELETE USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- CHECK_INS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'check_ins') THEN
        DROP POLICY IF EXISTS "Users can manage own check_ins" ON check_ins;
        DROP POLICY IF EXISTS "Auth users can view own check_ins" ON check_ins;
        DROP POLICY IF EXISTS "Auth users can insert own check_ins" ON check_ins;
        DROP POLICY IF EXISTS "Auth users can delete own check_ins" ON check_ins;
        
        CREATE POLICY "Secure: Users can view own check_ins" ON check_ins
            FOR SELECT USING (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can insert own check_ins" ON check_ins
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        CREATE POLICY "Secure: Users can delete own check_ins" ON check_ins
            FOR DELETE USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- AUDIT_LOG
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
        DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_log;
        
        CREATE POLICY "Secure: Authenticated can insert audit logs" ON audit_log
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;
