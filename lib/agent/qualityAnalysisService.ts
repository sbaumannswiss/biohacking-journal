/**
 * Quality Analysis Service
 * 
 * Analysiert Supplement-Qualität:
 * - Zertifizierungen erkennen (NSF, USP, GMP, etc.)
 * - Inhaltsstoff-Form Bioverfügbarkeit bewerten
 * 
 * KEINE Markenbewertung/-reputation!
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Bekannte Zertifizierungen
export const CERTIFICATIONS = {
  NSF: {
    name: 'NSF Certified for Sport',
    description: 'Unabhängig auf verbotene Substanzen getestet',
    color: 'blue',
  },
  USP: {
    name: 'USP Verified',
    description: 'US Pharmacopeia verifiziert Reinheit und Potenz',
    color: 'green',
  },
  GMP: {
    name: 'GMP Certified',
    description: 'Good Manufacturing Practice Standards',
    color: 'gray',
  },
  INFORMED_SPORT: {
    name: 'Informed Sport',
    description: 'Auf WADA-verbotene Substanzen getestet',
    color: 'purple',
  },
  ORGANIC: {
    name: 'Bio/Organic',
    description: 'Biologisch zertifiziert',
    color: 'green',
  },
  VEGAN: {
    name: 'Vegan',
    description: 'Keine tierischen Inhaltsstoffe',
    color: 'emerald',
  },
  NON_GMO: {
    name: 'Non-GMO',
    description: 'Keine gentechnisch veränderten Organismen',
    color: 'yellow',
  },
} as const;

export type CertificationType = keyof typeof CERTIFICATIONS;

// Bioverfügbarkeits-Datenbank für Inhaltsstoff-Formen
export const BIOAVAILABILITY_DATA: Record<string, {
  high: string[];
  medium: string[];
  low: string[];
}> = {
  magnesium: {
    high: ['Glycinat', 'Bisglycinat', 'Taurinat', 'L-Threonat', 'Malat'],
    medium: ['Citrat', 'Orotat', 'Chlorid'],
    low: ['Oxid', 'Carbonat', 'Sulfat'],
  },
  zinc: {
    high: ['Picolinat', 'Bisglycinat', 'Monomethionin'],
    medium: ['Citrat', 'Gluconat', 'Acetat'],
    low: ['Oxid', 'Sulfat'],
  },
  iron: {
    high: ['Bisglycinat', 'Ferrochelat'],
    medium: ['Fumarat', 'Gluconat'],
    low: ['Sulfat', 'Oxid'],
  },
  calcium: {
    high: ['Citrat', 'Malat', 'Bisglycinat'],
    medium: ['Lactat', 'Gluconat'],
    low: ['Carbonat', 'Phosphat'],
  },
  b12: {
    high: ['Methylcobalamin', 'Adenosylcobalamin'],
    medium: ['Hydroxocobalamin'],
    low: ['Cyanocobalamin'],
  },
  folate: {
    high: ['Methylfolat', '5-MTHF', 'L-Methylfolat', 'Quatrefolic'],
    medium: ['Folinsäure', 'Calciumfolinat'],
    low: ['Folsäure', 'Pteroylglutaminsäure'],
  },
  coq10: {
    high: ['Ubiquinol'],
    medium: ['Ubiquinon'],
    low: [],
  },
  omega3: {
    high: ['Triglycerid-Form', 'rTG', 'natürliche Triglyceride'],
    medium: ['Phospholipid-Form', 'Krill'],
    low: ['Ethylester', 'EE'],
  },
  curcumin: {
    high: ['Meriva', 'Longvida', 'BCM-95', 'Mit Piperin', 'Liposomal'],
    medium: ['Mizellär', 'Nano'],
    low: ['Standard', 'Pulver ohne Zusatz'],
  },
  vitamin_d: {
    high: ['D3 Cholecalciferol', 'Lanolin D3', 'Lichen D3'],
    medium: ['D3 mit Öl'],
    low: ['D2 Ergocalciferol'],
  },
};

// Typen
export interface QualityAnalysis {
  certifications: {
    detected: CertificationType[];
    source: 'label' | 'unknown';
  };
  ingredientForm: {
    ingredient: string;
    form: string;
    bioavailability: 'low' | 'medium' | 'high';
    betterAlternatives?: string[];
    reasoning: string;
  } | null;
  disclaimer: string;
}

const QUALITY_ANALYSIS_PROMPT = `Du analysierst ein Supplement auf Qualitätsmerkmale.

## Deine Aufgaben:

### 1. Zertifizierungen erkennen
Suche auf dem Bild/in der Beschreibung nach:
- NSF Certified for Sport
- USP Verified
- GMP (Good Manufacturing Practice)
- Informed Sport
- Bio/Organic
- Vegan
- Non-GMO

### 2. Inhaltsstoff-Form analysieren
Bewerte die Bioverfügbarkeit der verwendeten Form:

**Magnesium:**
- HIGH: Glycinat, Bisglycinat, Taurinat, L-Threonat, Malat
- MEDIUM: Citrat, Orotat
- LOW: Oxid, Carbonat, Sulfat

**Zink:**
- HIGH: Picolinat, Bisglycinat
- MEDIUM: Citrat, Gluconat
- LOW: Oxid, Sulfat

**B12:**
- HIGH: Methylcobalamin, Adenosylcobalamin
- MEDIUM: Hydroxocobalamin
- LOW: Cyanocobalamin

**Folat:**
- HIGH: Methylfolat, 5-MTHF, Quatrefolic
- MEDIUM: Folinsäure
- LOW: Folsäure

**CoQ10:**
- HIGH: Ubiquinol
- MEDIUM: Ubiquinon

**Omega-3:**
- HIGH: Triglycerid-Form (TG, rTG)
- MEDIUM: Phospholipid (Krill)
- LOW: Ethylester (EE)

**Vitamin D:**
- HIGH: D3 (Cholecalciferol)
- LOW: D2 (Ergocalciferol)

## Antwort-Format (NUR JSON):

{
  "certifications": ["NSF", "GMP"],
  "ingredientForm": {
    "ingredient": "Magnesium",
    "form": "Glycinat",
    "bioavailability": "high",
    "betterAlternatives": null,
    "reasoning": "Magnesium-Glycinat hat eine hohe Bioverfügbarkeit und ist gut verträglich."
  }
}

Wenn keine Form erkennbar: ingredientForm = null
Wenn keine Zertifizierungen: certifications = []

WICHTIG: KEINE Markenbewertung! Nur objektive Fakten.
`;

const DISCLAIMER = 'Zertifizierungen wie auf dem Produkt angegeben. Für unabhängige Laboranalysen: ConsumerLab.com oder Labdoor.com';

/**
 * Analysiert Supplement-Qualität aus einem Bild
 */
export async function analyzeQuality(
  base64Image: string,
  supplementName?: string,
  detectedIngredients?: string[]
): Promise<QualityAnalysis> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        certifications: { detected: [], source: 'unknown' },
        ingredientForm: null,
        disclaimer: DISCLAIMER,
      };
    }

    // Detect image type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (base64Image.startsWith('data:')) {
      const match = base64Image.match(/^data:(image\/[a-z]+);base64,/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        base64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      }
    }

    const contextInfo = supplementName 
      ? `Supplement: ${supplementName}${detectedIngredients?.length ? `, Inhaltsstoffe: ${detectedIngredients.join(', ')}` : ''}`
      : 'Analysiere das Supplement auf dem Bild.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: QUALITY_ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: contextInfo,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von Vision API');
    }

    // Parse JSON
    let parsed;
    try {
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse quality analysis:', content);
      return {
        certifications: { detected: [], source: 'unknown' },
        ingredientForm: null,
        disclaimer: DISCLAIMER,
      };
    }

    // Validate certifications
    const validCerts = (parsed.certifications || []).filter(
      (cert: string) => cert in CERTIFICATIONS
    ) as CertificationType[];

    return {
      certifications: {
        detected: validCerts,
        source: validCerts.length > 0 ? 'label' : 'unknown',
      },
      ingredientForm: parsed.ingredientForm || null,
      disclaimer: DISCLAIMER,
    };

  } catch (error: any) {
    console.error('Quality Analysis Error:', error);
    return {
      certifications: { detected: [], source: 'unknown' },
      ingredientForm: null,
      disclaimer: DISCLAIMER,
    };
  }
}

/**
 * Analysiert Bioverfügbarkeit einer Inhaltsstoff-Form (ohne Bild)
 */
export function analyzeBioavailability(
  ingredient: string,
  form: string
): {
  bioavailability: 'low' | 'medium' | 'high' | 'unknown';
  betterAlternatives?: string[];
  reasoning: string;
} {
  const ingredientLower = ingredient.toLowerCase();
  const formLower = form.toLowerCase();

  // Finde passenden Eintrag in der Datenbank
  for (const [key, data] of Object.entries(BIOAVAILABILITY_DATA)) {
    if (ingredientLower.includes(key) || key.includes(ingredientLower)) {
      // Prüfe Bioverfügbarkeit
      for (const highForm of data.high) {
        if (formLower.includes(highForm.toLowerCase())) {
          return {
            bioavailability: 'high',
            reasoning: `${form} hat eine hohe Bioverfügbarkeit.`,
          };
        }
      }
      for (const medForm of data.medium) {
        if (formLower.includes(medForm.toLowerCase())) {
          return {
            bioavailability: 'medium',
            betterAlternatives: data.high,
            reasoning: `${form} hat eine mittlere Bioverfügbarkeit. Besser wären: ${data.high.join(', ')}.`,
          };
        }
      }
      for (const lowForm of data.low) {
        if (formLower.includes(lowForm.toLowerCase())) {
          return {
            bioavailability: 'low',
            betterAlternatives: data.high,
            reasoning: `${form} hat eine niedrige Bioverfügbarkeit. Besser wären: ${data.high.join(', ')}.`,
          };
        }
      }
    }
  }

  return {
    bioavailability: 'unknown',
    reasoning: 'Keine Bioverfügbarkeitsdaten für diese Form verfügbar.',
  };
}

/**
 * Gibt Farbe für Bioverfügbarkeit zurück
 */
export function getBioavailabilityColor(level: 'low' | 'medium' | 'high' | 'unknown'): string {
  switch (level) {
    case 'high':
      return 'text-green-400 bg-green-500/10 border-green-500/30';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'low':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    default:
      return 'text-muted-foreground bg-white/5 border-white/10';
  }
}

/**
 * Gibt Label für Bioverfügbarkeit zurück
 */
export function getBioavailabilityLabel(level: 'low' | 'medium' | 'high' | 'unknown'): string {
  switch (level) {
    case 'high':
      return 'Hoch';
    case 'medium':
      return 'Mittel';
    case 'low':
      return 'Niedrig';
    default:
      return 'Unbekannt';
  }
}
