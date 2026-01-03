/**
 * Korrelationsanalyse: Supplements ↔ Wearable-Daten
 * 
 * Analysiert Zusammenhänge zwischen Supplement-Einnahme und
 * Gesundheitsmetriken aus Wearables.
 */

import { NormalizedHealthData } from '@/lib/garmin/types';

// Supplement-Kategorien und ihre erwarteten Effekte
const SUPPLEMENT_EFFECTS: Record<string, {
  expectedMetrics: string[];
  direction: 'positive' | 'negative'; // positive = erhöht, negative = senkt
  lagDays: number; // Wie viele Tage bis Effekt sichtbar
}> = {
  'magnesium': {
    expectedMetrics: ['sleepScore', 'deepSleepMinutes', 'hrvAverage'],
    direction: 'positive',
    lagDays: 0,
  },
  'magnesium-glycinate': {
    expectedMetrics: ['sleepScore', 'deepSleepMinutes', 'hrvAverage'],
    direction: 'positive',
    lagDays: 0,
  },
  'omega-3': {
    expectedMetrics: ['hrvAverage', 'recoveryScore'],
    direction: 'positive',
    lagDays: 7,
  },
  'vitamin-d3': {
    expectedMetrics: ['recoveryScore', 'sleepScore'],
    direction: 'positive',
    lagDays: 14,
  },
  'ashwagandha': {
    expectedMetrics: ['stressLevel', 'sleepScore', 'recoveryScore'],
    direction: 'positive', // positive für Sleep/Recovery, "senkt" Stress
    lagDays: 7,
  },
  'creatine': {
    expectedMetrics: ['activeMinutes', 'steps'],
    direction: 'positive',
    lagDays: 7,
  },
  'l-theanine': {
    expectedMetrics: ['stressLevel', 'sleepScore'],
    direction: 'positive',
    lagDays: 0,
  },
  'glycine': {
    expectedMetrics: ['sleepScore', 'deepSleepMinutes'],
    direction: 'positive',
    lagDays: 0,
  },
  'zinc': {
    expectedMetrics: ['recoveryScore', 'sleepScore'],
    direction: 'positive',
    lagDays: 7,
  },
  'b-complex': {
    expectedMetrics: ['recoveryScore'],
    direction: 'positive',
    lagDays: 3,
  },
};

export interface SupplementCorrelation {
  supplementId: string;
  supplementName: string;
  metric: string;
  metricLabel: string;
  
  // Statistische Werte
  withSupplementAvg: number;
  withoutSupplementAvg: number;
  differencePercent: number;
  sampleSizeWith: number;
  sampleSizeWithout: number;
  
  // Bewertung
  direction: 'positive' | 'negative' | 'neutral';
  significance: 'high' | 'medium' | 'low' | 'none';
  confidence: number; // 0-100%
  
  // Darstellung
  emoji: string;
  message: string;
}

export interface CorrelationInsight {
  type: 'positive' | 'negative' | 'suggestion' | 'warning';
  title: string;
  description: string;
  supplementId?: string;
  metric?: string;
  actionLabel?: string;
}

const METRIC_LABELS: Record<string, string> = {
  sleepScore: 'Schlafqualität',
  sleepDurationHours: 'Schlafdauer',
  deepSleepMinutes: 'Tiefschlaf',
  remSleepMinutes: 'REM-Schlaf',
  hrvAverage: 'HRV',
  restingHeartRate: 'Ruhepuls',
  recoveryScore: 'Erholung',
  stressLevel: 'Stress',
  steps: 'Schritte',
  activeMinutes: 'Aktivität',
  bodyBatteryHigh: 'Energie-Peak',
};

const METRIC_UNITS: Record<string, string> = {
  sleepScore: '/10',
  sleepDurationHours: 'h',
  deepSleepMinutes: 'min',
  remSleepMinutes: 'min',
  hrvAverage: 'ms',
  restingHeartRate: 'bpm',
  recoveryScore: '/10',
  stressLevel: '/10',
  steps: '',
  activeMinutes: 'min',
  bodyBatteryHigh: '%',
};

/**
 * Berechnet Korrelationen zwischen Supplements und Metriken
 */
export function analyzeSupplementCorrelations(
  healthData: NormalizedHealthData[],
  checkInsByDate: Map<string, string[]>, // date → supplement IDs
  supplementNames: Map<string, string> // supplement ID → name
): SupplementCorrelation[] {
  const correlations: SupplementCorrelation[] = [];
  
  if (healthData.length < 7) {
    return correlations; // Nicht genug Daten
  }

  // Alle eingenommenen Supplements sammeln
  const allSupplements = new Set<string>();
  checkInsByDate.forEach(supplements => {
    supplements.forEach(s => allSupplements.add(s));
  });

  // Metriken die wir analysieren
  const metricsToAnalyze = [
    'sleepScore', 
    'deepSleepMinutes', 
    'hrvAverage', 
    'recoveryScore', 
    'stressLevel'
  ];

  // Für jedes Supplement
  allSupplements.forEach(supplementId => {
    const supplementName = supplementNames.get(supplementId) || supplementId;
    const supplementKey = supplementId.toLowerCase().replace(/\s+/g, '-');

    // Für jede Metrik
    metricsToAnalyze.forEach(metric => {
      const withSupplement: number[] = [];
      const withoutSupplement: number[] = [];

      // Daten aufteilen
      healthData.forEach(day => {
        const value = day[metric as keyof NormalizedHealthData] as number | null;
        if (value === null || value === undefined) return;

        const supplements = checkInsByDate.get(day.date) || [];
        if (supplements.includes(supplementId)) {
          withSupplement.push(value);
        } else {
          withoutSupplement.push(value);
        }
      });

      // Nur analysieren wenn genug Daten
      if (withSupplement.length < 3 || withoutSupplement.length < 3) {
        return;
      }

      // Durchschnitte berechnen
      const avgWith = withSupplement.reduce((a, b) => a + b, 0) / withSupplement.length;
      const avgWithout = withoutSupplement.reduce((a, b) => a + b, 0) / withoutSupplement.length;

      // Differenz berechnen
      const diff = avgWith - avgWithout;
      const diffPercent = avgWithout !== 0 ? (diff / avgWithout) * 100 : 0;

      // Richtung bestimmen (für Stress ist negativ = gut)
      let direction: 'positive' | 'negative' | 'neutral';
      const isStressMetric = metric === 'stressLevel';
      
      if (Math.abs(diffPercent) < 5) {
        direction = 'neutral';
      } else if (isStressMetric) {
        direction = diff < 0 ? 'positive' : 'negative'; // Weniger Stress = positiv
      } else {
        direction = diff > 0 ? 'positive' : 'negative';
      }

      // Signifikanz basierend auf Differenz und Sample Size
      let significance: 'high' | 'medium' | 'low' | 'none';
      const totalSamples = withSupplement.length + withoutSupplement.length;
      
      if (Math.abs(diffPercent) >= 15 && totalSamples >= 14) {
        significance = 'high';
      } else if (Math.abs(diffPercent) >= 10 && totalSamples >= 10) {
        significance = 'medium';
      } else if (Math.abs(diffPercent) >= 5 && totalSamples >= 7) {
        significance = 'low';
      } else {
        significance = 'none';
      }

      // Nur signifikante Korrelationen speichern
      if (significance === 'none') return;

      // Confidence Score
      const confidence = Math.min(100, Math.round(
        (totalSamples / 30) * 50 + 
        (Math.abs(diffPercent) / 20) * 50
      ));

      // Emoji basierend auf Metrik und Richtung
      let emoji = '📊';
      if (direction === 'positive') {
        if (metric.includes('sleep') || metric.includes('Sleep')) emoji = '😴';
        else if (metric.includes('hrv') || metric.includes('recovery')) emoji = '💪';
        else if (metric.includes('stress')) emoji = '🧘';
        else emoji = '✨';
      } else if (direction === 'negative') {
        emoji = '⚠️';
      }

      // Message generieren
      const metricLabel = METRIC_LABELS[metric] || metric;
      const unit = METRIC_UNITS[metric] || '';
      let message: string;
      
      if (direction === 'positive') {
        message = `${supplementName} korreliert mit ${Math.abs(Math.round(diffPercent))}% besserer ${metricLabel}`;
      } else if (direction === 'negative') {
        message = `${supplementName} zeigt ${Math.abs(Math.round(diffPercent))}% schlechtere ${metricLabel}`;
      } else {
        message = `${supplementName} hat keinen messbaren Effekt auf ${metricLabel}`;
      }

      correlations.push({
        supplementId,
        supplementName,
        metric,
        metricLabel,
        withSupplementAvg: Math.round(avgWith * 10) / 10,
        withoutSupplementAvg: Math.round(avgWithout * 10) / 10,
        differencePercent: Math.round(diffPercent),
        sampleSizeWith: withSupplement.length,
        sampleSizeWithout: withoutSupplement.length,
        direction,
        significance,
        confidence,
        emoji,
        message,
      });
    });
  });

  // Nach Signifikanz und Confidence sortieren
  return correlations.sort((a, b) => {
    const sigOrder = { high: 3, medium: 2, low: 1, none: 0 };
    const sigDiff = sigOrder[b.significance] - sigOrder[a.significance];
    if (sigDiff !== 0) return sigDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * Generiert actionable Insights aus Korrelationen
 */
export function generateInsights(
  correlations: SupplementCorrelation[]
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  // Top positive Korrelationen
  const positiveCorrelations = correlations
    .filter(c => c.direction === 'positive' && c.significance !== 'none')
    .slice(0, 3);

  positiveCorrelations.forEach(c => {
    insights.push({
      type: 'positive',
      title: `${c.emoji} ${c.supplementName} wirkt!`,
      description: c.message,
      supplementId: c.supplementId,
      metric: c.metric,
    });
  });

  // Negative Korrelationen (Warnungen)
  const negativeCorrelations = correlations
    .filter(c => c.direction === 'negative' && c.significance !== 'none');

  negativeCorrelations.forEach(c => {
    insights.push({
      type: 'warning',
      title: `⚠️ Überprüfe ${c.supplementName}`,
      description: `${c.message}. Möglicherweise Timing oder Dosierung anpassen.`,
      supplementId: c.supplementId,
      metric: c.metric,
      actionLabel: 'Timing prüfen',
    });
  });

  // Vorschläge basierend auf bekannten Effekten
  const supplementIds = new Set(correlations.map(c => c.supplementId));
  
  Object.entries(SUPPLEMENT_EFFECTS).forEach(([suppKey, effect]) => {
    // Prüfen ob User dieses Supplement nimmt
    const userHasSupplement = Array.from(supplementIds).some(
      id => id.toLowerCase().includes(suppKey)
    );

    if (!userHasSupplement) {
      // Vorschlag machen basierend auf schlechten Metriken
      const badMetrics = correlations.filter(
        c => c.direction === 'negative' && effect.expectedMetrics.includes(c.metric)
      );

      if (badMetrics.length > 0) {
        insights.push({
          type: 'suggestion',
          title: `💡 Erwäge ${suppKey.replace('-', ' ')}`,
          description: `Könnte deine ${METRIC_LABELS[badMetrics[0].metric]} verbessern.`,
          actionLabel: 'Zur Library',
        });
      }
    }
  });

  return insights;
}

/**
 * Berechnet einen "Stack Effectiveness Score"
 */
export function calculateStackEffectiveness(
  correlations: SupplementCorrelation[]
): {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
} {
  if (correlations.length === 0) {
    return {
      score: 50,
      grade: 'C',
      summary: 'Nicht genug Daten für Bewertung',
    };
  }

  // Berechne gewichteten Score
  let totalWeight = 0;
  let weightedSum = 0;

  correlations.forEach(c => {
    const weight = c.significance === 'high' ? 3 : c.significance === 'medium' ? 2 : 1;
    const value = c.direction === 'positive' ? 1 : c.direction === 'negative' ? -1 : 0;
    
    weightedSum += value * weight * (c.confidence / 100);
    totalWeight += weight;
  });

  // Normalisieren auf 0-100
  const rawScore = totalWeight > 0 ? (weightedSum / totalWeight + 1) * 50 : 50;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Grade bestimmen
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';
  else grade = 'F';

  // Summary
  const positiveCount = correlations.filter(c => c.direction === 'positive').length;
  const negativeCount = correlations.filter(c => c.direction === 'negative').length;

  let summary: string;
  if (score >= 75) {
    summary = `Dein Stack zeigt ${positiveCount} positive Korrelationen! Weiter so.`;
  } else if (score >= 50) {
    summary = `Solide Basis mit Optimierungspotenzial. ${negativeCount > 0 ? `${negativeCount} Supplements prüfen.` : ''}`;
  } else {
    summary = `Dein Stack könnte optimiert werden. Prüfe Timing und Dosierungen.`;
  }

  return { score, grade, summary };
}

