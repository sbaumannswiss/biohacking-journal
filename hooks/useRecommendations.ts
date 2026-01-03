'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Recommendation, 
  UserAnalysisContext,
  RecommendationService,
  createRecommendationService,
  JournalEntry,
  CheckInData,
} from '@/lib/recommendations';
import { getUserStack, getCheckInHistory, StackItem } from '@/lib/supabaseService';
import { getMetricsHistory } from '@/lib/supabaseService';

interface UseRecommendationsResult {
  recommendations: Recommendation[];
  topRecommendation: Recommendation | null;
  isLoading: boolean;
  hasEnoughData: boolean;
  dataStatus: { journalDays: number; checkIns: number; recommendation: string };
  refresh: () => Promise<void>;
}

/**
 * Hook für Recommendations
 */
export function useRecommendations(userId: string | null): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [dataStatus, setDataStatus] = useState({
    journalDays: 0,
    checkIns: 0,
    recommendation: 'Lade Daten...',
  });

  const loadRecommendations = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Lade alle benötigten Daten parallel
      const [stackData, checkInData, metricsData] = await Promise.all([
        getUserStack(userId),
        getCheckInHistory(userId, 90), // Letzte 90 Tage
        getMetricsHistory(userId, 90),
      ]);

      // Transformiere Stack-Daten
      const currentStack = stackData.map((item: StackItem) => ({
        supplementId: item.supplement_id,
        supplementName: item.supplement?.name || item.supplement_id,
        dosage: item.custom_dosage,
        time: item.custom_time,
      }));

      // Transformiere Check-In-Daten
      const checkInHistory: CheckInData[] = checkInData.map((c: { supplementId: string; checkedAt: string }) => ({
        supplementId: c.supplementId,
        supplementName: c.supplementId, // Wird später enriched
        checkedAt: c.checkedAt,
        time: getTimeFromDate(c.checkedAt),
      }));

      // Transformiere Journal-Daten
      const journalHistory: JournalEntry[] = metricsData.map((m: {
        date: string;
        sleep: number;
        energy: number;
        focus: number;
      }) => ({
        date: m.date,
        sleep: m.sleep,
        energy: m.energy,
        focus: m.focus,
        mood: 5, // Default-Wert, da mood nicht in daily_metrics gespeichert wird
      }));

      // Erstelle Service
      const service = createRecommendationService(
        userId,
        journalHistory,
        checkInHistory,
        currentStack
      );

      // Prüfe Daten-Status
      const status = service.hasEnoughData();
      setHasEnoughData(status.ready);
      setDataStatus(status);

      // Generiere Empfehlungen
      const recs = service.getTopRecommendations(10);
      setRecommendations(recs);

    } catch (error) {
      console.error('Error loading recommendations:', error);
      setDataStatus({
        journalDays: 0,
        checkIns: 0,
        recommendation: 'Fehler beim Laden der Empfehlungen',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    topRecommendation: recommendations.length > 0 ? recommendations[0] : null,
    isLoading,
    hasEnoughData,
    dataStatus,
    refresh: loadRecommendations,
  };
}

/**
 * Bestimmt Tageszeit aus Timestamp
 */
function getTimeFromDate(dateStr: string): 'morning' | 'noon' | 'evening' | 'bedtime' {
  const date = new Date(dateStr);
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'bedtime';
}

/**
 * Hook für schnelle Recommendation (für Helix)
 */
export function useQuickRecommendation(userId: string | null): {
  recommendation: string | null;
  isLoading: boolean;
} {
  const { topRecommendation, isLoading, hasEnoughData, dataStatus } = useRecommendations(userId);

  if (isLoading) {
    return { recommendation: null, isLoading: true };
  }

  if (!hasEnoughData) {
    return { recommendation: dataStatus.recommendation, isLoading: false };
  }

  if (topRecommendation) {
    return { recommendation: topRecommendation.message, isLoading: false };
  }

  return { recommendation: 'Alles sieht gut aus! Weiter so.', isLoading: false };
}

