-- Custom Supplements Table
-- Persönliche Kombi-Präparate von Usern

CREATE TABLE IF NOT EXISTS custom_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Produkt-Daten
    name TEXT NOT NULL,
    brand TEXT,
    emoji TEXT NOT NULL DEFAULT '💊',
    description TEXT,
    serving_size TEXT,
    
    -- Inhaltsstoffe als JSONB Array
    -- Format: [{"name": "Vitamin D3", "dosage": "5000", "unit": "IU"}, ...]
    ingredients JSONB NOT NULL DEFAULT '[]',
    
    best_time TEXT DEFAULT 'With Meals',
    warnings TEXT,
    
    -- Optional: Produktbild (Base64, max ~1MB empfohlen)
    image_base64 TEXT,
    
    -- Zentrales System
    submitted_to_central BOOLEAN NOT NULL DEFAULT FALSE,
    central_submission_id UUID REFERENCES supplement_submissions(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_supplements_user ON custom_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_supplements_submitted ON custom_supplements(submitted_to_central);

-- Enable Row Level Security
ALTER TABLE custom_supplements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own custom supplements
CREATE POLICY "Users can insert own custom supplements" ON custom_supplements
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own custom supplements" ON custom_supplements
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update own custom supplements" ON custom_supplements
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete own custom supplements" ON custom_supplements
    FOR DELETE
    USING (true);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_custom_supplements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_supplements_updated_at
    BEFORE UPDATE ON custom_supplements
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_supplements_updated_at();

-- Comment
COMMENT ON TABLE custom_supplements IS 'Persönliche Kombi-Präparate von Usern (gescannte Multivitamine etc.)';

