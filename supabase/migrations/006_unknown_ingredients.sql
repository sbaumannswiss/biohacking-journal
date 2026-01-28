-- Unknown Ingredients Logging
-- Speichert Inhaltsstoffe/Zertifizierungen die GPT erkannt hat, 
-- aber nicht in unserer Datenbank sind.
-- Ermöglicht spätere Ergänzung der Datenbank.

CREATE TABLE IF NOT EXISTS unknown_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Was wurde erkannt?
  ingredient_name TEXT NOT NULL,
  form TEXT,
  
  -- Kontext für Debugging
  context TEXT,  -- z.B. "Supplement: XY Brand Magnesium"
  
  -- Tracking
  occurrences INT DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Review Status
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_action TEXT,  -- 'added_to_db', 'ignored', 'invalid_ocr'
  
  -- Deduplizierung
  UNIQUE(ingredient_name, form)
);

-- Index für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_unknown_ingredients_occurrences 
  ON unknown_ingredients(occurrences DESC);
CREATE INDEX IF NOT EXISTS idx_unknown_ingredients_reviewed 
  ON unknown_ingredients(reviewed);

-- Unknown Certifications
CREATE TABLE IF NOT EXISTS unknown_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  certification_name TEXT NOT NULL UNIQUE,
  
  occurrences INT DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_action TEXT
);

CREATE INDEX IF NOT EXISTS idx_unknown_certifications_occurrences 
  ON unknown_certifications(occurrences DESC);

-- Funktion zum Upsert mit Increment
CREATE OR REPLACE FUNCTION upsert_unknown_ingredient(
  p_ingredient_name TEXT,
  p_form TEXT,
  p_context TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO unknown_ingredients (ingredient_name, form, context)
  VALUES (p_ingredient_name, p_form, p_context)
  ON CONFLICT (ingredient_name, form) 
  DO UPDATE SET 
    occurrences = unknown_ingredients.occurrences + 1,
    last_seen_at = NOW(),
    context = COALESCE(EXCLUDED.context, unknown_ingredients.context)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_unknown_certification(
  p_certification_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO unknown_certifications (certification_name)
  VALUES (p_certification_name)
  ON CONFLICT (certification_name) 
  DO UPDATE SET 
    occurrences = unknown_certifications.occurrences + 1,
    last_seen_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
