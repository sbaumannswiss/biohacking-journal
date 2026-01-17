/**
 * Native Health Service
 * 
 * Abstrahiert Health Connect (Android) und HealthKit (iOS) über Capacitor.
 * Fallback auf Mock-Daten im Web.
 */

import { Capacitor } from '@capacitor/core';
import { NormalizedHealthData } from '@/lib/garmin/types';

// Dynamischer Import für das Health Plugin (nur native)
let HealthPlugin: typeof import('@capgo/capacitor-health').Health | null = null;

// Verfügbare Datentypen
export const HEALTH_DATA_TYPES = {
  read: [
    'steps',
    'heartRate',
    'restingHeartRate', 
    'heartRateVariability',
    'sleepAnalysis',
    'oxygenSaturation',
    'activeEnergyBurned',
    'basalEnergyBurned',
    'distanceWalkingRunning',
    'workout',
  ],
  write: [] as string[], // Wir schreiben keine Daten
} as const;

export type HealthDataType = typeof HEALTH_DATA_TYPES.read[number];

export interface HealthAvailability {
  available: boolean;
  platform: 'android' | 'ios' | 'web';
  reason?: string;
}

export interface HealthPermissionStatus {
  granted: boolean;
  denied: string[];
}

/**
 * Initialisiert das Health Plugin (lazy loading)
 */
async function getHealthPlugin() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  
  if (!HealthPlugin) {
    try {
      const module = await import('@capgo/capacitor-health');
      HealthPlugin = module.Health;
    } catch (e) {
      console.warn('Health Plugin nicht verfügbar:', e);
      return null;
    }
  }
  
  return HealthPlugin;
}

/**
 * Prüft ob Health APIs verfügbar sind
 */
export async function checkHealthAvailability(): Promise<HealthAvailability> {
  const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  
  if (platform === 'web') {
    return {
      available: false,
      platform: 'web',
      reason: 'Health APIs nur auf nativen Geräten verfügbar',
    };
  }

  const Health = await getHealthPlugin();
  if (!Health) {
    return {
      available: false,
      platform,
      reason: 'Health Plugin nicht geladen',
    };
  }

  try {
    const result = await Health.isAvailable();
    return {
      available: result.available,
      platform,
      reason: result.available ? undefined : 'Health Connect nicht installiert',
    };
  } catch (e) {
    return {
      available: false,
      platform,
      reason: `Fehler: ${e}`,
    };
  }
}

/**
 * Fordert Berechtigungen für Health-Daten an
 */
export async function requestHealthPermissions(): Promise<HealthPermissionStatus> {
  const Health = await getHealthPlugin();
  if (!Health) {
    return { granted: false, denied: ['Plugin nicht verfügbar'] };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Health.requestAuthorization({
      read: HEALTH_DATA_TYPES.read as any,
      write: [],
    });
    
    return { granted: true, denied: [] };
  } catch (e) {
    console.error('Berechtigungsfehler:', e);
    return { granted: false, denied: ['Berechtigungen abgelehnt'] };
  }
}

/**
 * Öffnet Health Connect App (Android) zum Installieren
 */
export function openHealthConnectStore(): void {
  window.open(
    'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
    '_blank'
  );
}

/**
 * Holt Schritt-Daten für einen Zeitraum
 */
export async function getStepsData(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; steps: number }[]> {
  const Health = await getHealthPlugin();
  if (!Health) return [];

  try {
    const result = await Health.queryAggregated({
      dataType: 'steps',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bucket: 'day',
    });

    return (result.data || []).map((item: { startDate: string; value: number }) => ({
      date: item.startDate.split('T')[0],
      steps: Math.round(item.value),
    }));
  } catch (e) {
    console.error('Fehler beim Laden der Schritte:', e);
    return [];
  }
}

/**
 * Holt Herzfrequenz-Daten
 */
export async function getHeartRateData(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; avgHeartRate: number; restingHeartRate?: number }[]> {
  const Health = await getHealthPlugin();
  if (!Health) return [];

  try {
    const [hrResult, restingResult] = await Promise.all([
      Health.queryAggregated({
        dataType: 'heartRate',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucket: 'day',
      }),
      Health.queryAggregated({
        dataType: 'restingHeartRate',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucket: 'day',
      }).catch(() => ({ data: [] })),
    ]);

    const restingMap = new Map(
      (restingResult.data || []).map((item: { startDate: string; value: number }) => [
        item.startDate.split('T')[0],
        item.value,
      ])
    );

    return (hrResult.data || []).map((item: { startDate: string; value: number }) => ({
      date: item.startDate.split('T')[0],
      avgHeartRate: Math.round(item.value),
      restingHeartRate: restingMap.get(item.startDate.split('T')[0]) as number | undefined,
    }));
  } catch (e) {
    console.error('Fehler beim Laden der Herzfrequenz:', e);
    return [];
  }
}

/**
 * Holt Schlaf-Daten
 */
export async function getSleepData(
  startDate: Date,
  endDate: Date
): Promise<{
  date: string;
  sleepDurationHours: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
}[]> {
  const Health = await getHealthPlugin();
  if (!Health) return [];

  try {
    const result = await Health.queryAggregated({
      dataType: 'sleepAnalysis',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bucket: 'day',
    });

    return (result.data || []).map((item: { startDate: string; value: number }) => ({
      date: item.startDate.split('T')[0],
      sleepDurationHours: Math.round((item.value / 60) * 10) / 10, // Minuten zu Stunden
    }));
  } catch (e) {
    console.error('Fehler beim Laden der Schlafdaten:', e);
    return [];
  }
}

/**
 * Holt HRV-Daten
 */
export async function getHRVData(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; hrvAverage: number }[]> {
  const Health = await getHealthPlugin();
  if (!Health) return [];

  try {
    const result = await Health.queryAggregated({
      dataType: 'heartRateVariability',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bucket: 'day',
    });

    return (result.data || []).map((item: { startDate: string; value: number }) => ({
      date: item.startDate.split('T')[0],
      hrvAverage: Math.round(item.value),
    }));
  } catch (e) {
    console.error('Fehler beim Laden der HRV-Daten:', e);
    return [];
  }
}

/**
 * Holt SpO2-Daten (Sauerstoffsättigung)
 */
export async function getSpO2Data(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; spo2Average: number }[]> {
  const Health = await getHealthPlugin();
  if (!Health) return [];

  try {
    const result = await Health.queryAggregated({
      dataType: 'oxygenSaturation',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bucket: 'day',
    });

    return (result.data || []).map((item: { startDate: string; value: number }) => ({
      date: item.startDate.split('T')[0],
      spo2Average: Math.round(item.value * 100), // 0-1 zu Prozent
    }));
  } catch (e) {
    console.error('Fehler beim Laden der SpO2-Daten:', e);
    return [];
  }
}

/**
 * Holt alle Health-Daten und normalisiert sie
 */
export async function syncAllHealthData(days: number = 14): Promise<NormalizedHealthData[]> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const platform = getPlatform();

  // Parallel alle Datentypen laden
  const [steps, heartRate, sleep, hrv, spo2] = await Promise.all([
    getStepsData(startDate, endDate),
    getHeartRateData(startDate, endDate),
    getSleepData(startDate, endDate),
    getHRVData(startDate, endDate),
    getSpO2Data(startDate, endDate),
  ]);

  // Daten nach Datum gruppieren
  const dataByDate = new Map<string, NormalizedHealthData>();

  // Initialisiere alle Tage
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dataByDate.set(dateStr, {
      date: dateStr,
      source: platform === 'android' ? 'healthconnect' : 'apple_health',
      sleepScore: null,
      sleepDurationHours: null,
      deepSleepMinutes: null,
      remSleepMinutes: null,
      hrvAverage: null,
      hrvStatus: null,
      restingHeartRate: null,
      bodyBatteryHigh: null,
      bodyBatteryLow: null,
      recoveryScore: null,
      stressLevel: null,
      steps: null,
      activeMinutes: null,
      spo2Average: null,
    });
  }

  // Schritte einfügen
  steps.forEach(s => {
    const data = dataByDate.get(s.date);
    if (data) data.steps = s.steps;
  });

  // Herzfrequenz einfügen
  heartRate.forEach(hr => {
    const data = dataByDate.get(hr.date);
    if (data) {
      data.restingHeartRate = hr.restingHeartRate || null;
    }
  });

  // Schlaf einfügen
  sleep.forEach(s => {
    const data = dataByDate.get(s.date);
    if (data) {
      data.sleepDurationHours = s.sleepDurationHours;
      data.deepSleepMinutes = s.deepSleepMinutes || null;
      data.remSleepMinutes = s.remSleepMinutes || null;
      // Einfacher Schlaf-Score basierend auf Dauer (7-9h = optimal)
      if (s.sleepDurationHours) {
        const optimalDiff = Math.abs(s.sleepDurationHours - 8);
        data.sleepScore = Math.max(1, Math.round(10 - optimalDiff * 2));
      }
    }
  });

  // HRV einfügen
  hrv.forEach(h => {
    const data = dataByDate.get(h.date);
    if (data) {
      data.hrvAverage = h.hrvAverage;
      // HRV Status basierend auf Wert
      if (h.hrvAverage > 60) data.hrvStatus = 'HIGH';
      else if (h.hrvAverage > 40) data.hrvStatus = 'BALANCED';
      else data.hrvStatus = 'LOW';
    }
  });

  // SpO2 einfügen
  spo2.forEach(s => {
    const data = dataByDate.get(s.date);
    if (data) data.spo2Average = s.spo2Average;
  });

  return Array.from(dataByDate.values())
    .filter(d => d.steps || d.sleepDurationHours || d.hrvAverage) // Nur Tage mit Daten
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Prüft ob Health Connect installiert ist (Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'android' | 'ios' | 'web' {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
}
