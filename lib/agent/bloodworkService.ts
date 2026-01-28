/**
 * Bloodwork Analysis Service
 * 
 * Analysiert Blutbilder via GPT-4 Vision und extrahiert
 * supplement-relevante Biomarker.
 * 
 * WICHTIG: Keine medizinische Diagnose - nur Supplement-Orientierung!
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Biomarker mit Supplement-Relevanz
export interface Biomarker {
  name: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'low' | 'normal' | 'high' | 'optimal';
  supplementRelevance: string | null;
}

export interface BloodworkAnalysisResult {
  success: boolean;
  error?: string;
  
  // Erkannte Biomarker
  biomarkers: Biomarker[];
  
  // Supplement-Empfehlungen
  supplementSuggestions: {
    name: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  
  // Helix Zusammenfassung
  summary: string;
  
  // Disclaimer (immer vorhanden)
  disclaimer: string;
}

const BLOODWORK_VISION_PROMPT = `Du analysierst ein Blutbild-Dokument (Laborbefund) und extrahierst supplement-relevante Biomarker.

WICHTIG: Du gibst KEINE medizinische Diagnose! Du identifizierst nur Werte, die für die Supplement-Planung relevant sein könnten.

## Relevante Biomarker (falls im Bild sichtbar):

### Vitamine & Mineralstoffe
- Vitamin D (25-OH-Vitamin-D3) - Referenz: 30-60 ng/ml (optimal: 40-60)
- Vitamin B12 - Referenz: 300-900 pg/ml (optimal: >500)
- Folsäure/Folat - Referenz: 3-17 ng/ml
- Ferritin (Eisenspeicher) - Referenz: 30-300 µg/L (Frauen), 30-400 µg/L (Männer)
- Eisen - Referenz: 60-170 µg/dl
- Zink - Referenz: 70-120 µg/dl
- Magnesium - Referenz: 1.6-2.6 mg/dl
- Selen - Referenz: 50-120 µg/L

### Schilddrüse
- TSH - Referenz: 0.4-4.0 mU/L (optimal: 0.5-2.5)
- fT3 - Referenz: 2.0-4.4 pg/ml
- fT4 - Referenz: 0.9-1.7 ng/dl

### Stoffwechsel
- Homocystein - Referenz: <10 µmol/L (optimal: <8)
- HbA1c - Referenz: <5.7%
- Nüchternglukose - Referenz: 70-100 mg/dl

### Fettwerte
- Omega-3-Index - Referenz: >8% (optimal)
- Triglyceride - Referenz: <150 mg/dl
- HDL-Cholesterin - Referenz: >40 mg/dl (Männer), >50 mg/dl (Frauen)
- LDL-Cholesterin - Referenz: <100 mg/dl

### Entzündung
- CRP / hs-CRP - Referenz: <3 mg/L (optimal: <1)

## Antwort-Format (NUR JSON!):

{
  "biomarkers": [
    {
      "name": "Vitamin D (25-OH)",
      "value": 18,
      "unit": "ng/ml",
      "referenceRange": "30-60 ng/ml",
      "status": "low",
      "supplementRelevance": "Vitamin D3 + K2 Supplementierung könnte sinnvoll sein"
    }
  ],
  "supplementSuggestions": [
    {
      "name": "Vitamin D3 + K2",
      "reason": "Vitamin D bei 18 ng/ml - unter optimalem Bereich",
      "priority": "high"
    }
  ],
  "summary": "Kurze Zusammenfassung der supplement-relevanten Erkenntnisse (2-3 Sätze, sachlich)"
}

## Regeln:

1. NUR Werte extrahieren die du SICHER lesen kannst
2. Status bewerten: "low", "normal", "high", "optimal"
3. Supplement-Relevanz NUR bei auffälligen Werten
4. Bei normalen Werten: supplementRelevance = null
5. Priorität: high = deutlich außerhalb, medium = grenzwertig, low = leicht auffällig
6. KEINE medizinischen Diagnosen oder Krankheitsvermutungen
7. Sachlicher Ton, keine Panikmache
8. Wenn unleserlich: leeres biomarkers-Array und entsprechende summary

## Falls das Bild KEIN Blutbild ist:

{
  "biomarkers": [],
  "supplementSuggestions": [],
  "summary": "Das Bild scheint kein Blutbild/Laborbefund zu sein. Bitte lade ein Foto oder Screenshot deines Blutbilds hoch."
}
`;

const DISCLAIMER_TEXT = `HINWEIS: Diese Analyse dient ausschließlich der Orientierung für deine Supplement-Planung. Sie ersetzt KEINE medizinische Beurteilung oder ärztliche Beratung. Bei auffälligen Werten oder gesundheitlichen Bedenken wende dich bitte an deinen Arzt.`;

/**
 * Analysiert ein Blutbild-Bild mit GPT-4 Vision
 */
export async function analyzeBloodwork(base64Image: string): Promise<BloodworkAnalysisResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API Key nicht konfiguriert',
        biomarkers: [],
        supplementSuggestions: [],
        summary: '',
        disclaimer: DISCLAIMER_TEXT,
      };
    }

    // Detect image type from base64 header
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (base64Image.startsWith('data:')) {
      const match = base64Image.match(/^data:(image\/[a-z]+);base64,/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        base64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: BLOODWORK_VISION_PROMPT,
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
              text: 'Analysiere dieses Blutbild und extrahiere supplement-relevante Biomarker.',
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von Vision API');
    }

    // Parse JSON response
    let parsed;
    try {
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse Bloodwork response:', content);
      return {
        success: false,
        error: 'Konnte Antwort nicht verarbeiten',
        biomarkers: [],
        supplementSuggestions: [],
        summary: 'Die Analyse konnte nicht durchgeführt werden. Bitte versuche es mit einem klareren Bild.',
        disclaimer: DISCLAIMER_TEXT,
      };
    }

    return {
      success: true,
      biomarkers: parsed.biomarkers || [],
      supplementSuggestions: parsed.supplementSuggestions || [],
      summary: parsed.summary || 'Keine supplement-relevanten Auffälligkeiten erkannt.',
      disclaimer: DISCLAIMER_TEXT,
    };

  } catch (error: any) {
    console.error('Bloodwork Analysis Error:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler',
      biomarkers: [],
      supplementSuggestions: [],
      summary: '',
      disclaimer: DISCLAIMER_TEXT,
    };
  }
}

/**
 * Validiert ob ein Base64 String ein gültiges Bild ist
 */
export function isValidBloodworkImage(base64: string): boolean {
  // Check for data URL format
  if (base64.startsWith('data:image/')) {
    return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(base64);
  }
  // Check for raw base64
  return /^[A-Za-z0-9+/]+={0,2}$/.test(base64) && base64.length > 100;
}

/**
 * Gibt den Status-Farbcode zurück
 */
export function getStatusColor(status: Biomarker['status']): string {
  switch (status) {
    case 'optimal':
      return 'text-green-400';
    case 'normal':
      return 'text-blue-400';
    case 'low':
    case 'high':
      return 'text-yellow-400';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Gibt die Prioritäts-Farbe zurück
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'low':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  }
}
