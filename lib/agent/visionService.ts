import OpenAI from 'openai';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';

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

// Einzelner Inhaltsstoff eines Kombi-Präparats
export interface ComboIngredient {
  name: string;
  dosage: string;
  unit: string;
}

export interface ScanResult {
  success: boolean;
  error?: string;
  
  // Erkannte Daten
  detected: {
    name: string;
    brand?: string;
    dosage?: string;
    servingSize?: string;
    ingredients?: string[];
    warnings?: string;
  } | null;
  
  // Evidenz-Level basierend auf wissenschaftlicher Forschung (1-5)
  evidenceLevel?: number;
  
  // Kombi-Präparat Erkennung
  isComboProduct: boolean;
  comboIngredients?: ComboIngredient[];
  needsIngredientPhoto?: boolean; // Wenn Mengenangaben nicht lesbar
  
  // Kein Supplement erkannt
  isNotSupplement?: boolean;
  
  // Match mit Library
  match: {
    found: boolean;
    supplement?: {
      id: string;
      name: string;
      emoji: string;
      description: string;
      optimal_dosage: string;
      best_time: string;
    };
    confidence: 'high' | 'medium' | 'low';
  };
  
  // Helix Kommentar
  helixComment: string;
}

const VISION_SYSTEM_PROMPT = `Du bist ein Supplement-Scanner mit wissenschaftlicher Expertise. Analysiere das Bild eines Supplement-Produkts und extrahiere die Informationen.

WICHTIG: Antworte NUR im folgenden JSON-Format, keine andere Ausgabe!

## Evidenz-Level Bewertung (1-5):
- 5 = Starke Evidenz (viele RCTs, Meta-Analysen) - z.B. Vitamin D, Omega-3, Magnesium, Kreatin
- 4 = Gute Evidenz (mehrere Studien) - z.B. Ashwagandha, Zink, B-Vitamine
- 3 = Moderate Evidenz (einige Studien) - z.B. L-Theanin, Rhodiola, CoQ10
- 2 = Limitierte Evidenz (wenige Studien) - z.B. viele Pflanzenextrakte
- 1 = Kaum Evidenz (hauptsächlich traditionell) - z.B. exotische Kräuter

## Für EINZEL-Supplements (1 Hauptwirkstoff):
{
  "detected": {
    "name": "Name des Supplements (z.B. 'Magnesium Glycinate')",
    "brand": "Markenname (z.B. 'NOW Foods')",
    "dosage": "Dosierung pro Portion (z.B. '400mg')",
    "servingSize": "Portionsgröße (z.B. '1 Kapsel')",
    "ingredients": ["Hauptwirkstoff"],
    "warnings": "Wichtige Warnhinweise falls sichtbar"
  },
  "isComboProduct": false,
  "evidenceLevel": 4,
  "primarySupplement": "Der Hauptwirkstoff in einfacher Form (z.B. 'magnesium')",
  "confidence": "high/medium/low",
  "helixComment": "Kurzer Kommentar auf Deutsch"
}

## Für KOMBI-Präparate (2+ aktive Wirkstoffe, z.B. Multivitamine):
{
  "detected": {
    "name": "Produktname (z.B. 'Daily Multivitamin Complex')",
    "brand": "Markenname",
    "dosage": "Gesamte Portion (z.B. '2 Kapseln')",
    "servingSize": "Portionsgröße",
    "ingredients": ["Vitamin D3", "Vitamin K2", "Magnesium", "Zink"],
    "warnings": "Warnhinweise"
  },
  "isComboProduct": true,
  "evidenceLevel": 4,
  "comboIngredients": [
    {"name": "Vitamin D3", "dosage": "5000", "unit": "IU"},
    {"name": "Vitamin K2", "dosage": "100", "unit": "mcg"},
    {"name": "Magnesium", "dosage": "400", "unit": "mg"},
    {"name": "Zink", "dosage": "15", "unit": "mg"}
  ],
  "needsIngredientPhoto": false,
  "primarySupplement": null,
  "confidence": "high/medium/low",
  "helixComment": "Das ist ein Kombi-Präparat mit X Wirkstoffen!"
}

## Wenn Mengenangaben NICHT lesbar sind:
{
  "detected": { "name": "...", "brand": "...", ... },
  "isComboProduct": true,
  "comboIngredients": [],
  "needsIngredientPhoto": true,
  "primarySupplement": null,
  "confidence": "medium",
  "helixComment": "Das sieht nach einem Kombi-Präparat aus! Kannst du noch ein Foto von den Mengenangaben machen? 📋"
}

## Falls unleserlich:
{
  "detected": null,
  "isComboProduct": false,
  "isNotSupplement": false,
  "primarySupplement": null,
  "confidence": "low",
  "helixComment": "Hmm, ich kann das leider nicht erkennen. Kannst du ein klareres Foto machen? 📸"
}

## Falls KEIN Supplement (z.B. Essen, Tiere, Menschen, Gegenstände):
{
  "detected": null,
  "isComboProduct": false,
  "isNotSupplement": true,
  "primarySupplement": null,
  "confidence": "high",
  "helixComment": "Hey, das sieht nicht nach einem Supplement aus! 😄 Ich kann nur Nahrungsergänzungsmittel scannen. Probiere es mit einer Supplement-Dose oder -Verpackung! 💊"
}

Erkenne als KOMBI-Präparat wenn:
- "Multivitamin", "Multi", "Complex", "Stack", "Blend" im Namen
- Mehr als 2 verschiedene aktive Wirkstoffe
- Typische Kombinationen: D3+K2, Zink+Kupfer, B-Complex, etc.

Erkenne gängige Supplement-Typen:
- Vitamine (D3, B12, C, E, A, K2, B-Complex)
- Mineralien (Magnesium, Zink, Eisen, Selen, Calcium)
- Omega-3 / Fischöl
- Aminosäuren (BCAA, EAA, Glutamin, Kreatin)
- Adaptogene (Ashwagandha, Rhodiola)
- Nootropika (Alpha-GPC, Lion's Mane)
`;

/**
 * Analysiert ein Supplement-Bild mit GPT-4 Vision
 */
export async function analyzeSupplementImage(base64Image: string): Promise<ScanResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API Key nicht konfiguriert',
        detected: null,
        isComboProduct: false,
        match: { found: false, confidence: 'low' },
        helixComment: 'Ich bin gerade nicht verbunden. Bitte später nochmal versuchen! 🔌',
      };
    }

    // Detect image type from base64 header or default to jpeg
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (base64Image.startsWith('data:')) {
      const match = base64Image.match(/^data:(image\/[a-z]+);base64,/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        base64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      }
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: VISION_SYSTEM_PROMPT,
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
              text: 'Analysiere dieses Supplement-Produkt.',
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von Vision API');
    }

    // Parse JSON response
    let parsed;
    try {
      // Clean up potential markdown code blocks
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse Vision response:', content);
      return {
        success: false,
        error: 'Konnte Antwort nicht verarbeiten',
        detected: null,
        isComboProduct: false,
        match: { found: false, confidence: 'low' },
        helixComment: 'Hmm, da ist etwas schiefgegangen. Versuch es nochmal! 🔄',
      };
    }

    // Check if it's not a supplement at all
    if (parsed.isNotSupplement) {
      return {
        success: true,
        detected: null,
        isComboProduct: false,
        isNotSupplement: true,
        match: { found: false, confidence: 'high' as const },
        helixComment: parsed.helixComment || 'Das sieht nicht nach einem Supplement aus! 😄 Probiere es mit einer Supplement-Verpackung! 💊',
      };
    }

    // Match against library (only for single supplements)
    const match = parsed.isComboProduct 
      ? { found: false, confidence: 'low' as const }
      : findLibraryMatch(parsed.primarySupplement, parsed.detected?.name);

    return {
      success: true,
      detected: parsed.detected,
      isComboProduct: parsed.isComboProduct || false,
      comboIngredients: parsed.comboIngredients || [],
      needsIngredientPhoto: parsed.needsIngredientPhoto || false,
      isNotSupplement: false,
      evidenceLevel: parsed.evidenceLevel || undefined,
      match,
      helixComment: parsed.helixComment || 'Supplement erkannt!',
    };

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler',
      detected: null,
      isComboProduct: false,
      match: { found: false, confidence: 'low' },
      helixComment: 'Ups, da ist ein Fehler aufgetreten. Bitte nochmal versuchen! 😅',
    };
  }
}

/**
 * Analysiert ein Foto der Mengenangaben für Kombi-Präparate
 */
export async function analyzeIngredientLabel(base64Image: string): Promise<{
  success: boolean;
  ingredients: ComboIngredient[];
  helixComment: string;
  error?: string;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        ingredients: [],
        helixComment: 'Ich bin gerade nicht verbunden.',
        error: 'OpenAI API Key nicht konfiguriert',
      };
    }

    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (base64Image.startsWith('data:')) {
      const match = base64Image.match(/^data:(image\/[a-z]+);base64,/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        base64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      }
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du extrahierst Supplement-Inhaltsstoffe aus einem Nährwert-Etikett.

Antworte NUR im JSON-Format:
{
  "ingredients": [
    {"name": "Vitamin D3", "dosage": "5000", "unit": "IU"},
    {"name": "Magnesium (als Glycinat)", "dosage": "400", "unit": "mg"}
  ],
  "helixComment": "Perfekt! X Wirkstoffe erkannt. 💊"
}

Extrahiere ALLE Wirkstoffe mit ihrer Menge und Einheit.
Ignoriere Füllstoffe wie Cellulose, Gelatine, etc.
Fokus auf: Vitamine, Mineralien, Aminosäuren, Pflanzenextrakte.`,
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
              text: 'Extrahiere alle Inhaltsstoffe mit Mengenangaben.',
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort');
    }

    const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonContent);

    return {
      success: true,
      ingredients: parsed.ingredients || [],
      helixComment: parsed.helixComment || 'Inhaltsstoffe erkannt!',
    };

  } catch (error: any) {
    console.error('Ingredient Label Analysis Error:', error);
    return {
      success: false,
      ingredients: [],
      helixComment: 'Konnte die Mengenangaben nicht lesen. Bitte manuell eingeben.',
      error: error.message,
    };
  }
}

/**
 * Findet ein passendes Supplement in der Library
 */
function findLibraryMatch(
  primarySupplement: string | null,
  detectedName: string | null
): ScanResult['match'] {
  if (!primarySupplement && !detectedName) {
    return { found: false, confidence: 'low' };
  }

  const searchTerms = [
    primarySupplement?.toLowerCase(),
    detectedName?.toLowerCase(),
  ].filter(Boolean) as string[];

  // Direct ID match
  for (const term of searchTerms) {
    const directMatch = SUPPLEMENT_LIBRARY.find(s => 
      s.id === term.replace(/\s+/g, '-')
    );
    if (directMatch) {
      return {
        found: true,
        supplement: {
          id: directMatch.id,
          name: directMatch.name,
          emoji: directMatch.emoji,
          description: directMatch.description,
          optimal_dosage: directMatch.optimal_dosage,
          best_time: directMatch.best_time,
        },
        confidence: 'high',
      };
    }
  }

  // Name contains match
  for (const term of searchTerms) {
    const nameMatch = SUPPLEMENT_LIBRARY.find(s =>
      s.name.toLowerCase().includes(term) ||
      s.id.includes(term.replace(/\s+/g, '-'))
    );
    if (nameMatch) {
      return {
        found: true,
        supplement: {
          id: nameMatch.id,
          name: nameMatch.name,
          emoji: nameMatch.emoji,
          description: nameMatch.description,
          optimal_dosage: nameMatch.optimal_dosage,
          best_time: nameMatch.best_time,
        },
        confidence: 'high',
      };
    }
  }

  // Fuzzy matching - check if any search term is contained in supplement names
  for (const term of searchTerms) {
    const words = term.split(/[\s-]+/).filter(w => w.length > 2);
    for (const word of words) {
      const fuzzyMatch = SUPPLEMENT_LIBRARY.find(s =>
        s.name.toLowerCase().includes(word) ||
        s.id.includes(word)
      );
      if (fuzzyMatch) {
        return {
          found: true,
          supplement: {
            id: fuzzyMatch.id,
            name: fuzzyMatch.name,
            emoji: fuzzyMatch.emoji,
            description: fuzzyMatch.description,
            optimal_dosage: fuzzyMatch.optimal_dosage,
            best_time: fuzzyMatch.best_time,
          },
          confidence: 'medium',
        };
      }
    }
  }

  return { found: false, confidence: 'low' };
}

/**
 * Validiert ob ein Base64 String ein gültiges Bild ist
 */
export function isValidBase64Image(base64: string): boolean {
  // Check for data URL format
  if (base64.startsWith('data:image/')) {
    return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(base64);
  }
  // Check for raw base64
  return /^[A-Za-z0-9+/]+={0,2}$/.test(base64) && base64.length > 100;
}

