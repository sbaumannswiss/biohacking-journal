/**
 * Pattern Analyzer
 * Analysiert Journal- und Check-In-Daten um Muster zu erkennen
 */

import {
  JournalEntry,
  CheckInData,
  UserAnalysisContext,
  SupplementMetricCorrelation,
  CorrelationDirection,
  AnalysisPeriod,
} from './types';

// Metriken die analysiert werden
type Metric = 'sleep' | 'energy' | 'focus' | 'mood';
const METRICS: Metric[] = ['sleep', 'energy', 'focus', 'mood'];

/**
 * Berechnet den Pearson-Korrelationskoeffizienten
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Bestimmt die Korrelationsrichtung
 */
function getCorrelationDirection(correlation: number): CorrelationDirection {
  if (correlation > 0.2) return 'positive';
  if (correlation < -0.2) return 'negative';
  return 'neutral';
}

/**
 * Berechnet einen einfachen p-Wert (Approximation)
 */
function calculateSignificance(correlation: number, sampleSize: number): number {
  if (sampleSize < 3) return 1;
  
  const t = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
  // Vereinfachte p-Wert Schätzung
  const p = Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t);
  return Math.min(1, Math.max(0, p));
}

/**
 * Gruppiert Check-Ins nach Datum
 */
function groupCheckInsByDate(checkIns: CheckInData[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  for (const checkIn of checkIns) {
    const date = checkIn.checkedAt.split('T')[0];
    const existing = grouped.get(date) || [];
    existing.push(checkIn.supplementId);
    grouped.set(date, existing);
  }
  
  return grouped;
}

/**
 * Analysiert Korrelationen zwischen Supplements und Metriken
 */
export function analyzeSupplementMetricCorrelations(
  context: UserAnalysisContext
): SupplementMetricCorrelation[] {
  const correlations: SupplementMetricCorrelation[] = [];
  const checkInsByDate = groupCheckInsByDate(context.checkInHistory);
  
  // Für jedes Supplement im Stack
  for (const stackItem of context.currentStack) {
    // Für jede Metrik
    for (const metric of METRICS) {
      // Sammle Daten: Tage an denen Supplement genommen wurde vs. nicht
      const withSupplement: number[] = [];
      const withoutSupplement: number[] = [];
      
      for (const journal of context.journalHistory) {
        const date = journal.date;
        const supplements = checkInsByDate.get(date) || [];
        const metricValue = journal[metric];
        
        if (metricValue === undefined || metricValue === null) continue;
        
        if (supplements.includes(stackItem.supplementId)) {
          withSupplement.push(metricValue);
        } else {
          withoutSupplement.push(metricValue);
        }
      }
      
      // Brauchen mindestens 5 Datenpunkte in jeder Gruppe
      if (withSupplement.length < 5 || withoutSupplement.length < 3) continue;
      
      // Berechne Durchschnittsdifferenz als einfache Korrelation
      const avgWith = withSupplement.reduce((a, b) => a + b, 0) / withSupplement.length;
      const avgWithout = withoutSupplement.reduce((a, b) => a + b, 0) / withoutSupplement.length;
      const diff = avgWith - avgWithout;
      
      // Normalisiere auf -1 bis 1 (max diff wäre 10 bei 0-10 Skala)
      const normalizedCorrelation = Math.max(-1, Math.min(1, diff / 3));
      
      const sampleSize = withSupplement.length + withoutSupplement.length;
      
      correlations.push({
        supplementId: stackItem.supplementId,
        supplementName: stackItem.supplementName,
        metric,
        correlation: normalizedCorrelation,
        direction: getCorrelationDirection(normalizedCorrelation),
        sampleSize,
        significance: calculateSignificance(normalizedCorrelation, sampleSize),
      });
    }
  }
  
  return correlations;
}

/**
 * Analysiert Timing-Patterns für Supplements
 */
export function analyzeTimingPatterns(
  context: UserAnalysisContext
): Map<string, Map<string, number[]>> {
  // supplement -> time -> metric values
  const timingData = new Map<string, Map<string, number[]>>();
  
  // Journal-Daten nach Datum indexieren
  const journalByDate = new Map<string, JournalEntry>();
  for (const entry of context.journalHistory) {
    journalByDate.set(entry.date, entry);
  }
  
  // Check-Ins analysieren
  for (const checkIn of context.checkInHistory) {
    const date = checkIn.checkedAt.split('T')[0];
    const journal = journalByDate.get(date);
    
    if (!journal) continue;
    
    const supplementId = checkIn.supplementId;
    const time = checkIn.time;
    
    if (!timingData.has(supplementId)) {
      timingData.set(supplementId, new Map());
    }
    
    const supplementTimings = timingData.get(supplementId)!;
    
    if (!supplementTimings.has(time)) {
      supplementTimings.set(time, []);
    }
    
    // Speichere einen kombinierten Score
    const combinedScore = (journal.sleep + journal.energy + journal.focus + journal.mood) / 4;
    supplementTimings.get(time)!.push(combinedScore);
  }
  
  return timingData;
}

/**
 * Berechnet den Durchschnitt und die Varianz
 */
export function calculateStats(values: number[]): { mean: number; variance: number; count: number } {
  if (values.length === 0) return { mean: 0, variance: 0, count: 0 };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return { mean, variance, count: values.length };
}

/**
 * Findet die beste Zeit für ein Supplement basierend auf Daten
 */
export function findOptimalTiming(
  timingData: Map<string, number[]>
): { time: string; score: number; confidence: number } | null {
  let bestTime: string | null = null;
  let bestScore = -Infinity;
  let totalSamples = 0;
  
  for (const [time, scores] of timingData) {
    if (scores.length < 3) continue;
    
    const stats = calculateStats(scores);
    totalSamples += stats.count;
    
    if (stats.mean > bestScore) {
      bestScore = stats.mean;
      bestTime = time;
    }
  }
  
  if (!bestTime) return null;
  
  // Confidence basierend auf Sample-Größe
  const confidence = Math.min(1, totalSamples / 30);
  
  return { time: bestTime, score: bestScore, confidence };
}

/**
 * Analysiert Lifestyle-Patterns (Schlaf, Bewegung, etc.)
 */
export function analyzeLifestylePatterns(
  journalHistory: JournalEntry[]
): { pattern: string; impact: number; confidence: number }[] {
  const patterns: { pattern: string; impact: number; confidence: number }[] = [];
  
  if (journalHistory.length < 7) return patterns;
  
  // Schlaf-Qualität vs. andere Metriken
  const goodSleepDays = journalHistory.filter(j => j.sleep >= 7);
  const badSleepDays = journalHistory.filter(j => j.sleep < 5);
  
  if (goodSleepDays.length >= 3 && badSleepDays.length >= 3) {
    const avgEnergyGoodSleep = goodSleepDays.reduce((s, j) => s + j.energy, 0) / goodSleepDays.length;
    const avgEnergyBadSleep = badSleepDays.reduce((s, j) => s + j.energy, 0) / badSleepDays.length;
    const impact = Math.round((avgEnergyGoodSleep - avgEnergyBadSleep) * 10);
    
    if (Math.abs(impact) > 10) {
      patterns.push({
        pattern: 'sleep_energy',
        impact,
        confidence: Math.min(1, (goodSleepDays.length + badSleepDays.length) / 20),
      });
    }
  }
  
  // Bewegung vs. Stimmung (wenn Exercise-Daten vorhanden)
  const exerciseDays = journalHistory.filter(j => j.exercise);
  const noExerciseDays = journalHistory.filter(j => j.exercise === false);
  
  if (exerciseDays.length >= 3 && noExerciseDays.length >= 3) {
    const avgMoodExercise = exerciseDays.reduce((s, j) => s + j.mood, 0) / exerciseDays.length;
    const avgMoodNoExercise = noExerciseDays.reduce((s, j) => s + j.mood, 0) / noExerciseDays.length;
    const impact = Math.round((avgMoodExercise - avgMoodNoExercise) * 10);
    
    if (Math.abs(impact) > 10) {
      patterns.push({
        pattern: 'exercise_mood',
        impact,
        confidence: Math.min(1, (exerciseDays.length + noExerciseDays.length) / 20),
      });
    }
  }
  
  return patterns;
}

/**
 * Lädt den Analyse-Kontext für einen User
 */
export async function loadUserAnalysisContext(
  userId: string,
  period: AnalysisPeriod = 'month'
): Promise<UserAnalysisContext | null> {
  // Diese Funktion wird von den spezifischen Recommendern implementiert
  // Sie ruft Supabase-Funktionen auf um die Daten zu laden
  
  // Placeholder - wird in der Integration implementiert
  return null;
}

