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

// Lazy initialization - nur Server-Side
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

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

// OCR-Ergebnis von GPT (nur was auf dem Etikett steht)
export interface OCRResult {
  certifications: string[];
  ingredients: {
    name: string;
    form: string;
    dosage?: string;
  }[];
}

// Bewertetes Ergebnis nach Lookup in unserer DB
export interface IngredientAnalysis {
  ingredient: string;
  form: string;
  dosage?: string;
  bioavailability: 'low' | 'medium' | 'high' | 'unknown';
  betterAlternatives?: string[];
  reasoning: string;
  isKnown: boolean; // false = muss geloggt werden
}

// Typen
export interface QualityAnalysis {
  certifications: {
    detected: CertificationType[];
    unknown: string[]; // Zertifizierungen die GPT erkannt hat aber nicht in unserer DB sind
    source: 'label' | 'unknown';
  };
  ingredients: IngredientAnalysis[];
  // Legacy-Support für einzelne ingredientForm
  ingredientForm: {
    ingredient: string;
    form: string;
    bioavailability: 'low' | 'medium' | 'high';
    betterAlternatives?: string[];
    reasoning: string;
  } | null;
  disclaimer: string;
  // Logging-Info
  hasUnknownData: boolean;
}

/**
 * OCR-MODUS PROMPT
 * 
 * GPT soll NUR lesen was auf dem Etikett steht.
 * KEINE Bewertungen, KEINE Interpretationen.
 * Die Bewertung erfolgt durch unsere lokale Datenbank.
 */
const OCR_PROMPT = `Du bist ein OCR-System für Supplement-Etiketten. 
Deine EINZIGE Aufgabe: Lies was auf dem Bild steht und extrahiere die Informationen.

## REGELN:
1. Lies NUR was TATSÄCHLICH auf dem Etikett/Bild zu sehen ist
2. ERFINDE NICHTS - wenn du etwas nicht siehst, gib es nicht an
3. Keine Bewertungen, keine Interpretationen, keine Empfehlungen
4. Bei Unsicherheit: lieber weglassen als raten

## ZERTIFIZIERUNGS-LOGOS die du erkennen sollst:
- NSF (blauer Kreis mit "NSF" oder "NSF Certified for Sport")
- USP (gelbes/goldenes "USP Verified" Logo)
- GMP (verschiedene GMP Siegel)
- Informed Sport (blaues Logo)
- Bio/Organic (grünes EU-Bio-Logo, USDA Organic)
- Vegan (V-Label, Vegan Society Logo)
- Non-GMO (Schmetterling-Logo)

## INHALTSSTOFFE:
Lies die genaue chemische Form wie sie auf dem Etikett steht, z.B.:
- "Magnesium (als Magnesiumoxid)" → ingredient: "Magnesium", form: "Oxid"
- "Vitamin B12 (Methylcobalamin)" → ingredient: "B12", form: "Methylcobalamin"
- "Zink-Bisglycinat" → ingredient: "Zink", form: "Bisglycinat"

## ANTWORT-FORMAT (NUR JSON, sonst nichts):

{
  "certifications": ["NSF", "VEGAN"],
  "ingredients": [
    { "name": "Magnesium", "form": "Oxid", "dosage": "400mg" },
    { "name": "Zink", "form": "Gluconat", "dosage": "15mg" }
  ]
}

Wenn keine Zertifizierungen sichtbar: certifications = []
Wenn keine Inhaltsstoffe lesbar: ingredients = []
`;

const DISCLAIMER = 'Zertifizierungen wie auf dem Produkt angegeben. Für unabhängige Laboranalysen: ConsumerLab.com oder Labdoor.com';

/**
 * Schritt 1: OCR - GPT liest nur was auf dem Etikett steht
 */
async function performOCR(base64Image: string): Promise<OCRResult> {
  // Detect image type
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  let imageData = base64Image;
  
  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:(image\/[a-z]+);base64,/);
    if (match) {
      mediaType = match[1] as typeof mediaType;
      imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    }
  }

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: OCR_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageData}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: 'Lies das Etikett und extrahiere Zertifizierungen und Inhaltsstoffe.',
          },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0.1, // Niedrig für konsistente OCR
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Keine Antwort von Vision API');
  }

  // Parse JSON
  const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(jsonContent);

  return {
    certifications: parsed.certifications || [],
    ingredients: parsed.ingredients || [],
  };
}

/**
 * Schritt 2: Lookup - Bewerte OCR-Ergebnisse gegen unsere Datenbank
 */
function lookupIngredient(name: string, form: string, dosage?: string): IngredientAnalysis {
  const bioResult = analyzeBioavailability(name, form);
  
  return {
    ingredient: name,
    form: form,
    dosage: dosage,
    bioavailability: bioResult.bioavailability,
    betterAlternatives: bioResult.betterAlternatives,
    reasoning: bioResult.reasoning,
    isKnown: bioResult.bioavailability !== 'unknown',
  };
}

/**
 * Schritt 3: Zertifizierungen validieren
 */
function validateCertifications(detected: string[]): {
  known: CertificationType[];
  unknown: string[];
} {
  const known: CertificationType[] = [];
  const unknown: string[] = [];

  for (const cert of detected) {
    const upperCert = cert.toUpperCase().replace(/[^A-Z_]/g, '_');
    if (upperCert in CERTIFICATIONS) {
      known.push(upperCert as CertificationType);
    } else {
      // Fuzzy match
      const matchedKey = Object.keys(CERTIFICATIONS).find(key => 
        cert.toUpperCase().includes(key) || key.includes(cert.toUpperCase())
      );
      if (matchedKey) {
        known.push(matchedKey as CertificationType);
      } else {
        unknown.push(cert);
      }
    }
  }

  return { known, unknown };
}

/**
 * Analysiert Supplement-Qualität aus einem Bild
 * 
 * Ablauf:
 * 1. GPT liest Etikett (OCR-Modus)
 * 2. Lookup in unserer Datenbank
 * 3. Unbekannte Daten werden markiert für Logging
 */
export async function analyzeQuality(
  base64Image: string,
  supplementName?: string,
  detectedIngredients?: string[]
): Promise<QualityAnalysis> {
  const emptyResult: QualityAnalysis = {
    certifications: { detected: [], unknown: [], source: 'unknown' },
    ingredients: [],
    ingredientForm: null,
    disclaimer: DISCLAIMER,
    hasUnknownData: false,
  };

  try {
    if (!process.env.OPENAI_API_KEY) {
      return emptyResult;
    }

    // Schritt 1: OCR
    const ocrResult = await performOCR(base64Image);

    // Schritt 2: Zertifizierungen validieren
    const certValidation = validateCertifications(ocrResult.certifications);

    // Schritt 3: Inhaltsstoffe bewerten
    const analyzedIngredients = ocrResult.ingredients.map(ing => 
      lookupIngredient(ing.name, ing.form, ing.dosage)
    );

    // Prüfe ob unbekannte Daten vorhanden
    const hasUnknownIngredients = analyzedIngredients.some(ing => !ing.isKnown);
    const hasUnknownCerts = certValidation.unknown.length > 0;
    const hasUnknownData = hasUnknownIngredients || hasUnknownCerts;

    // Legacy: Erste Ingredient als ingredientForm
    const firstKnownIngredient = analyzedIngredients.find(ing => ing.isKnown && ing.bioavailability !== 'unknown');
    const legacyIngredientForm = firstKnownIngredient ? {
      ingredient: firstKnownIngredient.ingredient,
      form: firstKnownIngredient.form,
      bioavailability: firstKnownIngredient.bioavailability as 'low' | 'medium' | 'high',
      betterAlternatives: firstKnownIngredient.betterAlternatives,
      reasoning: firstKnownIngredient.reasoning,
    } : null;

    return {
      certifications: {
        detected: certValidation.known,
        unknown: certValidation.unknown,
        source: certValidation.known.length > 0 ? 'label' : 'unknown',
      },
      ingredients: analyzedIngredients,
      ingredientForm: legacyIngredientForm,
      disclaimer: DISCLAIMER,
      hasUnknownData,
    };

  } catch (error: any) {
    console.error('Quality Analysis Error:', error);
    return emptyResult;
  }
}

/**
 * Gibt unbekannte Daten zurück für Logging
 */
export function getUnknownData(analysis: QualityAnalysis): {
  unknownIngredients: { name: string; form: string }[];
  unknownCertifications: string[];
} {
  return {
    unknownIngredients: analysis.ingredients
      .filter(ing => !ing.isKnown)
      .map(ing => ({ name: ing.ingredient, form: ing.form })),
    unknownCertifications: analysis.certifications.unknown,
  };
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
