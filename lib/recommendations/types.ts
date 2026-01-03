/**
 * Recommendation System Types
 * Typen für das personalisierte Empfehlungssystem
 */

// Zeitraum für Analysen
export type AnalysisPeriod = 'week' | 'month' | 'quarter' | 'all';

// Korrelationsrichtung
export type CorrelationDirection = 'positive' | 'negative' | 'neutral';

// Empfehlungstyp
export type RecommendationType = 
  | 'timing'      // Optimale Einnahmezeit
  | 'dosage'      // Dosierungsanpassung
  | 'synergy'     // Stack-Synergien
  | 'lifestyle'   // Lifestyle-Tipps
  | 'warning';    // Warnungen

// Prioritätsstufe
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

// Basistyp für eine Empfehlung
export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  supplement?: string;
  confidence: number; // 0-1
  dataPoints: number; // Anzahl der analysierten Datenpunkte
  createdAt: Date;
}

// Journal-Eintrag für Analyse
export interface JournalEntry {
  date: string;
  sleep: number;
  energy: number;
  focus: number;
  mood: number;
  stress?: number;
  exercise?: boolean;
  meditation?: boolean;
}

// Check-In für Analyse
export interface CheckInData {
  supplementId: string;
  supplementName: string;
  checkedAt: string;
  time: 'morning' | 'noon' | 'evening' | 'bedtime';
  dosage?: string;
}

// Korrelation zwischen Supplement und Metrik
export interface SupplementMetricCorrelation {
  supplementId: string;
  supplementName: string;
  metric: 'sleep' | 'energy' | 'focus' | 'mood';
  correlation: number; // -1 bis +1
  direction: CorrelationDirection;
  sampleSize: number;
  significance: number; // p-value
}

// Timing-Analyse
export interface TimingAnalysis {
  supplementId: string;
  supplementName: string;
  optimalTime: 'morning' | 'noon' | 'evening' | 'bedtime';
  currentTime?: 'morning' | 'noon' | 'evening' | 'bedtime';
  improvement: number; // Erwartete Verbesserung in %
  metric: 'sleep' | 'energy' | 'focus' | 'mood';
  confidence: number;
}

// Dosierungs-Analyse
export interface DosageAnalysis {
  supplementId: string;
  supplementName: string;
  currentDosage: string;
  suggestedDosage: string;
  reason: string;
  metricImpact: {
    metric: 'sleep' | 'energy' | 'focus' | 'mood';
    change: number; // Erwartete Änderung
  }[];
}

// Stack-Synergie
export interface StackSynergy {
  supplements: [string, string];
  supplementNames: [string, string];
  type: 'synergistic' | 'antagonistic' | 'neutral';
  description: string;
  recommendation: string;
}

// Lifestyle-Pattern
export interface LifestylePattern {
  pattern: string;
  impact: {
    metric: 'sleep' | 'energy' | 'focus' | 'mood';
    change: number;
  }[];
  recommendation: string;
  confidence: number;
}

// Warnung
export interface SupplementWarning {
  supplementId: string;
  supplementName: string;
  type: 'interaction' | 'timing' | 'dosage' | 'contraindication';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  affectedSupplements?: string[];
}

// User-Analyse-Kontext
export interface UserAnalysisContext {
  userId: string;
  journalHistory: JournalEntry[];
  checkInHistory: CheckInData[];
  currentStack: {
    supplementId: string;
    supplementName: string;
    dosage?: string;
    time?: string;
  }[];
  goals?: string[];
}

// Analyse-Ergebnis
export interface AnalysisResult {
  userId: string;
  analyzedAt: Date;
  period: AnalysisPeriod;
  recommendations: Recommendation[];
  correlations: SupplementMetricCorrelation[];
  timingAnalysis: TimingAnalysis[];
  dosageAnalysis: DosageAnalysis[];
  synergies: StackSynergy[];
  lifestylePatterns: LifestylePattern[];
  warnings: SupplementWarning[];
}

