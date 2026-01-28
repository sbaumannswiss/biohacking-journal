/**
 * Bloodwork Analysis Types
 * 
 * Typen und Hilfsfunktionen für die Blutbild-Analyse.
 * Diese Datei kann sicher clientseitig importiert werden.
 */

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
