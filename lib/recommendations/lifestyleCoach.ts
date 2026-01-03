/**
 * Lifestyle Coach
 * Generiert personalisierte Lifestyle-Empfehlungen basierend auf Journal-Daten
 */

import {
  LifestylePattern,
  Recommendation,
  UserAnalysisContext,
  JournalEntry,
} from './types';
import { analyzeLifestylePatterns, calculateStats } from './patternAnalyzer';

// Lifestyle-Empfehlungen basierend auf erkannten Mustern
const PATTERN_RECOMMENDATIONS: Record<string, {
  positive: string;
  negative: string;
  tip: string;
}> = {
  sleep_energy: {
    positive: 'Deine Daten zeigen: Guter Schlaf (7+h) = deutlich mehr Energie am nächsten Tag.',
    negative: 'An Tagen mit wenig Schlaf hast du merkbar weniger Energie.',
    tip: 'Priorisiere 7-8 Stunden Schlaf für optimale Energie.',
  },
  sleep_focus: {
    positive: 'Ausreichend Schlaf korreliert stark mit deiner Fokus-Fähigkeit.',
    negative: 'Schlafmangel beeinträchtigt deinen Fokus messbar.',
    tip: 'Für maximale Konzentration: Schlaf vor Mitternacht beginnen.',
  },
  exercise_mood: {
    positive: 'Bewegung hebt deine Stimmung zuverlässig.',
    negative: 'An Tagen ohne Bewegung ist deine Stimmung tendenziell niedriger.',
    tip: 'Schon 20 Minuten Bewegung können die Stimmung für den ganzen Tag heben.',
  },
  exercise_energy: {
    positive: 'Sport gibt dir mehr Energie, nicht weniger.',
    negative: 'Ohne Bewegung tendierst du zu niedrigerer Energie.',
    tip: 'Morgendliche Bewegung kann den ganzen Tag energetisieren.',
  },
  meditation_stress: {
    positive: 'Meditation reduziert deinen Stress-Level messbar.',
    negative: 'Ohne Meditation ist dein Stress-Level höher.',
    tip: '10 Minuten tägliche Meditation können Stress signifikant reduzieren.',
  },
};

/**
 * Analysiert Schlaf-bezogene Patterns
 */
function analyzeSleepPatterns(journalHistory: JournalEntry[]): LifestylePattern[] {
  const patterns: LifestylePattern[] = [];
  
  if (journalHistory.length < 7) return patterns;
  
  // Gruppiere nach Schlafqualität
  const goodSleep = journalHistory.filter(j => j.sleep >= 7);
  const badSleep = journalHistory.filter(j => j.sleep <= 4);
  const normalSleep = journalHistory.filter(j => j.sleep > 4 && j.sleep < 7);
  
  // Schlaf -> Energie Korrelation
  if (goodSleep.length >= 3 && badSleep.length >= 3) {
    const energyGood = calculateStats(goodSleep.map(j => j.energy));
    const energyBad = calculateStats(badSleep.map(j => j.energy));
    const diff = energyGood.mean - energyBad.mean;
    
    if (Math.abs(diff) >= 1) {
      patterns.push({
        pattern: 'sleep_energy',
        impact: [{ metric: 'energy', change: Math.round(diff * 10) }],
        recommendation: diff > 0 
          ? PATTERN_RECOMMENDATIONS.sleep_energy.positive
          : PATTERN_RECOMMENDATIONS.sleep_energy.negative,
        confidence: Math.min(1, (goodSleep.length + badSleep.length) / 14),
      });
    }
    
    // Schlaf -> Fokus
    const focusGood = calculateStats(goodSleep.map(j => j.focus));
    const focusBad = calculateStats(badSleep.map(j => j.focus));
    const focusDiff = focusGood.mean - focusBad.mean;
    
    if (Math.abs(focusDiff) >= 1) {
      patterns.push({
        pattern: 'sleep_focus',
        impact: [{ metric: 'focus', change: Math.round(focusDiff * 10) }],
        recommendation: focusDiff > 0
          ? PATTERN_RECOMMENDATIONS.sleep_focus.positive
          : PATTERN_RECOMMENDATIONS.sleep_focus.negative,
        confidence: Math.min(1, (goodSleep.length + badSleep.length) / 14),
      });
    }
  }
  
  // Optimale Schlafmenge finden
  const sleepGroups = new Map<number, { energy: number[]; focus: number[]; mood: number[] }>();
  
  for (const entry of journalHistory) {
    const sleepHours = Math.round(entry.sleep);
    if (!sleepGroups.has(sleepHours)) {
      sleepGroups.set(sleepHours, { energy: [], focus: [], mood: [] });
    }
    const group = sleepGroups.get(sleepHours)!;
    group.energy.push(entry.energy);
    group.focus.push(entry.focus);
    group.mood.push(entry.mood);
  }
  
  // Finde optimale Schlafmenge
  let bestSleepHours = 7;
  let bestScore = 0;
  
  for (const [hours, data] of sleepGroups) {
    if (data.energy.length < 3) continue;
    
    const avgScore = (
      calculateStats(data.energy).mean +
      calculateStats(data.focus).mean +
      calculateStats(data.mood).mean
    ) / 3;
    
    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestSleepHours = hours;
    }
  }
  
  if (bestSleepHours !== 7) {
    patterns.push({
      pattern: 'optimal_sleep',
      impact: [
        { metric: 'energy', change: Math.round((bestScore - 5) * 10) },
        { metric: 'focus', change: Math.round((bestScore - 5) * 10) },
      ],
      recommendation: `Deine optimale Schlafdauer scheint bei ${bestSleepHours} Stunden zu liegen.`,
      confidence: Math.min(1, journalHistory.length / 21),
    });
  }
  
  return patterns;
}

/**
 * Analysiert Aktivitäts-bezogene Patterns
 */
function analyzeActivityPatterns(journalHistory: JournalEntry[]): LifestylePattern[] {
  const patterns: LifestylePattern[] = [];
  
  // Nur wenn Exercise-Daten vorhanden
  const withExercise = journalHistory.filter(j => j.exercise === true);
  const withoutExercise = journalHistory.filter(j => j.exercise === false);
  
  if (withExercise.length >= 3 && withoutExercise.length >= 3) {
    // Bewegung -> Stimmung
    const moodWith = calculateStats(withExercise.map(j => j.mood));
    const moodWithout = calculateStats(withoutExercise.map(j => j.mood));
    const moodDiff = moodWith.mean - moodWithout.mean;
    
    if (Math.abs(moodDiff) >= 0.5) {
      patterns.push({
        pattern: 'exercise_mood',
        impact: [{ metric: 'mood', change: Math.round(moodDiff * 10) }],
        recommendation: moodDiff > 0
          ? PATTERN_RECOMMENDATIONS.exercise_mood.positive
          : 'Interessant: An Tagen mit Bewegung fühlst du dich ruhiger.',
        confidence: Math.min(1, (withExercise.length + withoutExercise.length) / 14),
      });
    }
    
    // Bewegung -> Energie
    const energyWith = calculateStats(withExercise.map(j => j.energy));
    const energyWithout = calculateStats(withoutExercise.map(j => j.energy));
    const energyDiff = energyWith.mean - energyWithout.mean;
    
    if (Math.abs(energyDiff) >= 0.5) {
      patterns.push({
        pattern: 'exercise_energy',
        impact: [{ metric: 'energy', change: Math.round(energyDiff * 10) }],
        recommendation: energyDiff > 0
          ? PATTERN_RECOMMENDATIONS.exercise_energy.positive
          : 'Deine Energie ist etwas niedriger an Trainingstagen - vielleicht Zeit für mehr Recovery?',
        confidence: Math.min(1, (withExercise.length + withoutExercise.length) / 14),
      });
    }
  }
  
  return patterns;
}

/**
 * Analysiert Trends über Zeit
 */
function analyzeTrends(journalHistory: JournalEntry[]): LifestylePattern[] {
  const patterns: LifestylePattern[] = [];
  
  if (journalHistory.length < 14) return patterns;
  
  // Sortiere nach Datum
  const sorted = [...journalHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Vergleiche erste und letzte Woche
  const firstWeek = sorted.slice(0, 7);
  const lastWeek = sorted.slice(-7);
  
  const metrics: ('sleep' | 'energy' | 'focus' | 'mood')[] = ['sleep', 'energy', 'focus', 'mood'];
  
  for (const metric of metrics) {
    const firstAvg = calculateStats(firstWeek.map(j => j[metric])).mean;
    const lastAvg = calculateStats(lastWeek.map(j => j[metric])).mean;
    const change = lastAvg - firstAvg;
    
    if (Math.abs(change) >= 1) {
      patterns.push({
        pattern: `trend_${metric}`,
        impact: [{ metric, change: Math.round(change * 10) }],
        recommendation: change > 0
          ? `Dein ${metric === 'sleep' ? 'Schlaf' : metric === 'energy' ? 'Energie-Level' : metric === 'focus' ? 'Fokus' : 'Stimmung'} hat sich in den letzten Wochen verbessert! Weiter so.`
          : `Dein ${metric === 'sleep' ? 'Schlaf' : metric === 'energy' ? 'Energie-Level' : metric === 'focus' ? 'Fokus' : 'Stimmung'} zeigt einen Abwärtstrend. Zeit für Adjustments?`,
        confidence: 0.6,
      });
    }
  }
  
  return patterns;
}

/**
 * Analysiert alle Lifestyle-Patterns
 */
export function analyzeAllLifestylePatterns(
  context: UserAnalysisContext
): LifestylePattern[] {
  const allPatterns: LifestylePattern[] = [];
  
  allPatterns.push(...analyzeSleepPatterns(context.journalHistory));
  allPatterns.push(...analyzeActivityPatterns(context.journalHistory));
  allPatterns.push(...analyzeTrends(context.journalHistory));
  
  // Sortiere nach Confidence
  return allPatterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generiert Lifestyle-Empfehlungen
 */
export function generateLifestyleRecommendations(
  context: UserAnalysisContext
): Recommendation[] {
  const patterns = analyzeAllLifestylePatterns(context);
  const recommendations: Recommendation[] = [];
  
  const patternEmojis: Record<string, string> = {
    sleep_energy: '😴',
    sleep_focus: '🎯',
    optimal_sleep: '⏰',
    exercise_mood: '🏃',
    exercise_energy: '💪',
    trend_sleep: '📈',
    trend_energy: '📈',
    trend_focus: '📈',
    trend_mood: '📈',
  };
  
  for (const pattern of patterns) {
    // Nur Top-Patterns mit hoher Confidence
    if (pattern.confidence < 0.4) continue;
    if (recommendations.length >= 5) break;
    
    const emoji = patternEmojis[pattern.pattern] || '💡';
    const isPositive = pattern.impact.some(i => i.change > 0);
    
    recommendations.push({
      id: `lifestyle-${pattern.pattern}`,
      type: 'lifestyle',
      priority: Math.abs(pattern.impact[0]?.change || 0) > 15 ? 'medium' : 'low',
      title: `${emoji} Lifestyle Insight`,
      message: pattern.recommendation,
      confidence: pattern.confidence,
      dataPoints: context.journalHistory.length,
      createdAt: new Date(),
    });
  }
  
  return recommendations;
}

/**
 * Generiert personalisierte Tipps basierend auf aktuellen Metriken
 */
export function generatePersonalizedTips(
  todayJournal: JournalEntry | null,
  averages: { sleep: number; energy: number; focus: number; mood: number }
): string[] {
  const tips: string[] = [];
  
  if (!todayJournal) {
    tips.push('Logge deine täglichen Metriken für personalisierte Insights.');
    return tips;
  }
  
  // Schlaf-basierte Tipps
  if (todayJournal.sleep < 5) {
    tips.push('Schlaf war heute niedrig. Versuche heute Abend früher ins Bett zu gehen.');
  } else if (todayJournal.sleep < averages.sleep - 1) {
    tips.push('Dein Schlaf war unter deinem Durchschnitt. Ein Power-Nap könnte helfen.');
  }
  
  // Energie-basierte Tipps
  if (todayJournal.energy < 4) {
    tips.push('Energie niedrig? Probiere einen kurzen Spaziergang oder Sonnenlicht.');
  }
  
  // Fokus-basierte Tipps
  if (todayJournal.focus < 4) {
    tips.push('Fokus-Probleme? Reduziere Multitasking und versuche Pomodoro-Sessions.');
  }
  
  // Stimmungs-basierte Tipps
  if (todayJournal.mood < 4) {
    tips.push('Stimmung könnte besser sein? Bewegung, Natur oder soziale Kontakte helfen.');
  }
  
  return tips;
}

