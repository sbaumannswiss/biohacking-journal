-- Supplement Submissions Table
-- Stores user-suggested supplements for review

CREATE TABLE IF NOT EXISTS supplement_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Supplement data
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT[] NOT NULL DEFAULT '{}',
    evidence_level INTEGER NOT NULL CHECK (evidence_level >= 1 AND evidence_level <= 5),
    optimal_dosage TEXT NOT NULL,
    best_time TEXT NOT NULL,
    warnings TEXT,
    emoji TEXT NOT NULL DEFAULT '💊',
    
    -- Affects metrics (stored as JSONB)
    affects_metrics JSONB DEFAULT '[]',
    
    -- Synergies (array of supplement IDs)
    synergies TEXT[] DEFAULT '{}',
    
    -- Submission metadata
    submitted_by UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    agent_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_supplement_submissions_status ON supplement_submissions(status);
CREATE INDEX IF NOT EXISTS idx_supplement_submissions_user ON supplement_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_supplement_submissions_name ON supplement_submissions(name);

-- Enable Row Level Security
ALTER TABLE supplement_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert own submissions" ON supplement_submissions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON supplement_submissions
    FOR SELECT
    USING (true);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_supplement_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplement_submissions_updated_at
    BEFORE UPDATE ON supplement_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_supplement_submissions_updated_at();

-- Comment on table
COMMENT ON TABLE supplement_submissions IS 'User-submitted supplement suggestions for review and approval';

