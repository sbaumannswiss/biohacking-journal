-- ============================================
-- WORKOUT TRACKING TABLES
-- ============================================

-- Scheduled/Manual Workouts
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  planned_time TIMESTAMPTZ NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'cardio', 'hiit', 'yoga', 'running', 'cycling', 'swimming', 'other')),
  estimated_duration INT NOT NULL DEFAULT 45,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detected/Completed Workouts (from wearables or manual end)
CREATE TABLE IF NOT EXISTS detected_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  workout_type TEXT CHECK (workout_type IN ('strength', 'cardio', 'hiit', 'yoga', 'running', 'cycling', 'swimming', 'other')),
  duration_minutes INT,
  calories_burned INT,
  avg_heart_rate INT,
  max_heart_rate INT,
  source TEXT NOT NULL CHECK (source IN ('garmin', 'healthconnect', 'apple_health', 'manual')),
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Supplement Logs (which supplements were taken for which workout phase)
CREATE TABLE IF NOT EXISTS workout_supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES detected_workouts(id) ON DELETE SET NULL,
  supplement_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('pre', 'intra', 'post')),
  taken_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Hydration Tracking
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ml INT NOT NULL DEFAULT 0,
  goal_ml INT NOT NULL DEFAULT 2000,
  workout_id UUID REFERENCES detected_workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_planned_time ON scheduled_workouts(planned_time);

CREATE INDEX IF NOT EXISTS idx_detected_workouts_user_id ON detected_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_detected_workouts_start_time ON detected_workouts(start_time);
CREATE INDEX IF NOT EXISTS idx_detected_workouts_source ON detected_workouts(source);

CREATE INDEX IF NOT EXISTS idx_workout_supplement_logs_user_id ON workout_supplement_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_supplement_logs_workout_id ON workout_supplement_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_supplement_logs_phase ON workout_supplement_logs(phase);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON hydration_logs(user_id, date);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- Scheduled Workouts Policies
CREATE POLICY "Users can view own scheduled workouts"
  ON scheduled_workouts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own scheduled workouts"
  ON scheduled_workouts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scheduled workouts"
  ON scheduled_workouts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own scheduled workouts"
  ON scheduled_workouts FOR DELETE
  USING (user_id = auth.uid());

-- Detected Workouts Policies
CREATE POLICY "Users can view own detected workouts"
  ON detected_workouts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own detected workouts"
  ON detected_workouts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own detected workouts"
  ON detected_workouts FOR UPDATE
  USING (user_id = auth.uid());

-- Workout Supplement Logs Policies
CREATE POLICY "Users can view own workout supplement logs"
  ON workout_supplement_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own workout supplement logs"
  ON workout_supplement_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workout supplement logs"
  ON workout_supplement_logs FOR UPDATE
  USING (user_id = auth.uid());

-- Hydration Logs Policies
CREATE POLICY "Users can view own hydration logs"
  ON hydration_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own hydration logs"
  ON hydration_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own hydration logs"
  ON hydration_logs FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update hydration for today
CREATE OR REPLACE FUNCTION upsert_hydration(
  p_user_id UUID,
  p_ml INT,
  p_goal_ml INT DEFAULT 2000
)
RETURNS hydration_logs AS $$
DECLARE
  result hydration_logs;
BEGIN
  INSERT INTO hydration_logs (user_id, date, total_ml, goal_ml, updated_at)
  VALUES (p_user_id, CURRENT_DATE, p_ml, p_goal_ml, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    total_ml = hydration_logs.total_ml + p_ml,
    goal_ml = p_goal_ml,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
