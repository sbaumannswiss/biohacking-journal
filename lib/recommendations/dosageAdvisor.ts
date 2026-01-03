/**
 * Dosage Advisor
 * Analysiert und empfiehlt optimale Dosierungen basierend auf User-Feedback
 */

import {
  DosageAnalysis,
  Recommendation,
  UserAnalysisContext,
  JournalEntry,
} from './types';
import { calculateStats } from './patternAnalyzer';

// Standard-Dosierungsbereiche (wissenschaftlich basiert)
const DOSAGE_RANGES: Record<string, {
  min: number;
  max: number;
  unit: string;
  optimalRange: { low: number; high: number };
}> = {
  'creatine': { min: 3, max: 10, unit: 'g', optimalRange: { low: 3, high: 5 } },
  'magnesium': { min: 200, max: 600, unit: 'mg', optimalRange: { low: 300, high: 450 } },
  'vitamin-d': { min: 1000, max: 10000, unit: 'IU', optimalRange: { low: 2000, high: 5000 } },
  'omega-3': { min: 1, max: 5, unit: 'g', optimalRange: { low: 2, high: 3 } },
  'zinc': { min: 15, max: 50, unit: 'mg', optimalRange: { low: 25, high: 40 } },
  'vitamin-c': { min: 500, max: 2000, unit: 'mg', optimalRange: { low: 500, high: 1000 } },
  'b-complex': { min: 1, max: 3, unit: 'Kapseln', optimalRange: { low: 1, high: 2 } },
  'ashwagandha': { min: 300, max: 900, unit: 'mg', optimalRange: { low: 300, high: 600 } },
  'l-theanine': { min: 100, max: 400, unit: 'mg', optimalRange: { low: 100, high: 200 } },
  'caffeine': { min: 50, max: 400, unit: 'mg', optimalRange: { low: 100, high: 200 } },
};

/**
 * Parst eine Dosierung aus einem String
 */
function parseDosage(dosageStr: string): { value: number; unit: string } | null {
  if (!dosageStr) return null;
  
  const match = dosageStr.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
  if (!match) return null;
  
  return {
    value: parseFloat(match[1]),
    unit: match[2].toLowerCase(),
  };
}

/**
 * Findet den Dosierungsbereich für ein Supplement
 */
function getDosageRange(supplementId: string, supplementName: string): {
  min: number;
  max: number;
  unit: string;
  optimalRange: { low: number; high: number };
} | null {
  const idLower = supplementId.toLowerCase();
  const nameLower = supplementName.toLowerCase();
  
  for (const [key, range] of Object.entries(DOSAGE_RANGES)) {
    if (idLower.includes(key) || nameLower.includes(key)) {
      return range;
    }
  }
  
  return null;
}

/**
 * Analysiert Dosierung für ein Supplement basierend auf Daten
 */
export function analyzeDosageForSupplement(
  supplementId: string,
  supplementName: string,
  currentDosage: string | undefined,
  journalHistory: JournalEntry[],
  checkInDates: string[]
): DosageAnalysis | null {
  const range = getDosageRange(supplementId, supplementName);
  const parsed = currentDosage ? parseDosage(currentDosage) : null;
  
  // Ohne bekannten Bereich oder geparste Dosierung, keine Empfehlung
  if (!range) return null;
  
  // Wenn keine aktuelle Dosierung, empfehle optimal
  if (!parsed || !currentDosage) {
    return {
      supplementId,
      supplementName,
      currentDosage: 'nicht angegeben',
      suggestedDosage: `${range.optimalRange.low}-${range.optimalRange.high}${range.unit}`,
      reason: 'Wissenschaftlich empfohlener Bereich',
      metricImpact: [],
    };
  }
  
  // Prüfe ob Dosierung im sicheren Bereich
  if (parsed.value < range.min) {
    return {
      supplementId,
      supplementName,
      currentDosage,
      suggestedDosage: `mindestens ${range.min}${range.unit}`,
      reason: `Deine aktuelle Dosierung ist unter dem empfohlenen Minimum von ${range.min}${range.unit}`,
      metricImpact: [],
    };
  }
  
  if (parsed.value > range.max) {
    return {
      supplementId,
      supplementName,
      currentDosage,
      suggestedDosage: `maximal ${range.max}${range.unit}`,
      reason: `Deine Dosierung überschreitet das empfohlene Maximum von ${range.max}${range.unit}`,
      metricImpact: [],
    };
  }
  
  // Prüfe ob Dosierung im optimalen Bereich
  if (parsed.value < range.optimalRange.low) {
    return {
      supplementId,
      supplementName,
      currentDosage,
      suggestedDosage: `${range.optimalRange.low}${range.unit}`,
      reason: `Eine leichte Erhöhung auf ${range.optimalRange.low}${range.unit} könnte effektiver sein`,
      metricImpact: [],
    };
  }
  
  if (parsed.value > range.optimalRange.high) {
    // Über optimal, aber noch im sicheren Bereich
    return {
      supplementId,
      supplementName,
      currentDosage,
      suggestedDosage: `${range.optimalRange.high}${range.unit}`,
      reason: `Eine Reduktion auf ${range.optimalRange.high}${range.unit} ist meist genauso effektiv`,
      metricImpact: [],
    };
  }
  
  // Dosierung ist optimal
  return null;
}

/**
 * Analysiert Dosierungen für den gesamten Stack
 */
export function analyzeDosagesForStack(
  context: UserAnalysisContext
): DosageAnalysis[] {
  const analyses: DosageAnalysis[] = [];
  
  // Gruppiere Check-Ins nach Supplement
  const checkInsBySupp = new Map<string, string[]>();
  for (const checkIn of context.checkInHistory) {
    const dates = checkInsBySupp.get(checkIn.supplementId) || [];
    dates.push(checkIn.checkedAt.split('T')[0]);
    checkInsBySupp.set(checkIn.supplementId, dates);
  }
  
  for (const stackItem of context.currentStack) {
    const checkInDates = checkInsBySupp.get(stackItem.supplementId) || [];
    
    const analysis = analyzeDosageForSupplement(
      stackItem.supplementId,
      stackItem.supplementName,
      stackItem.dosage,
      context.journalHistory,
      checkInDates
    );
    
    if (analysis) {
      analyses.push(analysis);
    }
  }
  
  return analyses;
}

/**
 * Generiert Dosierungs-Empfehlungen
 */
export function generateDosageRecommendations(
  context: UserAnalysisContext
): Recommendation[] {
  const analyses = analyzeDosagesForStack(context);
  const recommendations: Recommendation[] = [];
  
  for (const analysis of analyses) {
    const isUnderDosed = analysis.reason.includes('Minimum') || analysis.reason.includes('Erhöhung');
    const isOverDosed = analysis.reason.includes('Maximum') || analysis.reason.includes('überschreitet');
    
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (isOverDosed && analysis.reason.includes('Maximum')) {
      priority = 'high';
    }
    
    recommendations.push({
      id: `dosage-${analysis.supplementId}`,
      type: 'dosage',
      priority,
      title: `💊 Dosierung: ${analysis.supplementName}`,
      message: `${analysis.reason}. Vorschlag: ${analysis.suggestedDosage}`,
      supplement: analysis.supplementName,
      confidence: 0.8, // Wissenschaftsbasiert
      dataPoints: 0,
      createdAt: new Date(),
    });
  }
  
  return recommendations;
}

