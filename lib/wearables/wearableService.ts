/**
 * Wearable Service
 * 
 * Zentrale Schnittstelle für alle Wearable-Operationen.
 * Unterstützt sowohl echte APIs als auch Mock-Daten.
 */

import { supabase } from '@/lib/supabase';
import { NormalizedHealthData, WearableConnection } from '@/lib/garmin/types';
import { generateMockHealthHistory, calculateMockSleepSchedule } from './mockData';

// Feature Flag für Mock-Modus
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_WEARABLES === 'true' || true; // Default: Mock

export type WearableProvider = 'garmin' | 'whoop' | 'oura' | 'apple' | 'samsung';

// ============================================
// CONNECTION MANAGEMENT
// ============================================

/**
 * Prüft ob ein Provider verbunden ist
 */
export async function isProviderConnected(
  userId: string,
  provider: WearableProvider
): Promise<boolean> {
  if (USE_MOCK_DATA) {
    // Im Mock-Modus: Prüfe localStorage
    if (typeof window !== 'undefined') {
      const mockConnections = localStorage.getItem('mock_wearable_connections');
      if (mockConnections) {
        const connections = JSON.parse(mockConnections);
        return connections[provider] === true;
      }
    }
    return false;
  }

  if (!supabase) return false;

  const { data } = await supabase
    .from('wearable_connections')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single();

  return !!data;
}

/**
 * Holt alle verbundenen Provider für einen User
 */
export async function getConnectedProviders(userId: string): Promise<{
  provider: WearableProvider;
  connectedAt: string;
  lastSyncAt: string | null;
}[]> {
  if (USE_MOCK_DATA) {
    if (typeof window !== 'undefined') {
      const mockConnections = localStorage.getItem('mock_wearable_connections');
      if (mockConnections) {
        const connections = JSON.parse(mockConnections);
        return Object.entries(connections)
          .filter(([_, isConnected]) => isConnected)
          .map(([provider]) => ({
            provider: provider as WearableProvider,
            connectedAt: new Date().toISOString(),
            lastSyncAt: new Date().toISOString(),
          }));
      }
    }
    return [];
  }

  if (!supabase) return [];

  const { data } = await supabase
    .from('wearable_connections')
    .select('provider, connected_at, last_sync_at')
    .eq('user_id', userId)
    .eq('is_active', true);

  return (data || []).map(c => ({
    provider: c.provider as WearableProvider,
    connectedAt: c.connected_at,
    lastSyncAt: c.last_sync_at,
  }));
}

/**
 * Mock: Verbindung simulieren
 */
export function mockConnectProvider(provider: WearableProvider): void {
  if (typeof window !== 'undefined') {
    const mockConnections = JSON.parse(localStorage.getItem('mock_wearable_connections') || '{}');
    mockConnections[provider] = true;
    localStorage.setItem('mock_wearable_connections', JSON.stringify(mockConnections));
  }
}

/**
 * Mock: Verbindung trennen
 */
export function mockDisconnectProvider(provider: WearableProvider): void {
  if (typeof window !== 'undefined') {
    const mockConnections = JSON.parse(localStorage.getItem('mock_wearable_connections') || '{}');
    mockConnections[provider] = false;
    localStorage.setItem('mock_wearable_connections', JSON.stringify(mockConnections));
  }
}

/**
 * Verbindung trennen (echte API)
 */
export async function disconnectProvider(
  userId: string,
  provider: WearableProvider
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK_DATA) {
    mockDisconnectProvider(provider);
    return { success: true };
  }

  if (!supabase) return { success: false, error: 'Supabase nicht konfiguriert' };

  const { error } = await supabase
    .from('wearable_connections')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// HEALTH DATA
// ============================================

/**
 * Holt Gesundheitsdaten für einen Zeitraum
 */
export async function getHealthData(
  userId: string,
  days: number = 14,
  provider?: WearableProvider
): Promise<NormalizedHealthData[]> {
  if (USE_MOCK_DATA) {
    // Hole Supplements aus localStorage für realistische Korrelationen
    const supplements: string[] = [];
    // TODO: Supplement-Liste aus aktuellem Stack holen
    return generateMockHealthHistory(days, supplements);
  }

  if (!supabase) return [];

  let query = supabase
    .from('wearable_health_data')
    .select('*')
    .eq('user_id', userId)
    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map(d => ({
    date: d.date,
    source: d.provider as 'garmin',
    sleepScore: d.sleep_score,
    sleepDurationHours: d.sleep_duration_hours,
    deepSleepMinutes: d.deep_sleep_minutes,
    remSleepMinutes: d.rem_sleep_minutes,
    hrvAverage: d.hrv_average,
    hrvStatus: d.hrv_status,
    restingHeartRate: d.resting_heart_rate,
    bodyBatteryHigh: d.body_battery_high,
    bodyBatteryLow: d.body_battery_low,
    recoveryScore: d.recovery_score,
    stressLevel: d.stress_level,
    steps: d.steps,
    activeMinutes: d.active_minutes,
    spo2Average: d.spo2_average,
  }));
}

/**
 * Speichert synchronisierte Gesundheitsdaten
 */
export async function saveHealthData(
  userId: string,
  provider: WearableProvider,
  data: NormalizedHealthData[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase nicht konfiguriert' };

  const records = data.map(d => ({
    user_id: userId,
    provider,
    date: d.date,
    sleep_score: d.sleepScore,
    sleep_duration_hours: d.sleepDurationHours,
    deep_sleep_minutes: d.deepSleepMinutes,
    rem_sleep_minutes: d.remSleepMinutes,
    hrv_average: d.hrvAverage,
    hrv_status: d.hrvStatus,
    resting_heart_rate: d.restingHeartRate,
    body_battery_high: d.bodyBatteryHigh,
    body_battery_low: d.bodyBatteryLow,
    recovery_score: d.recoveryScore,
    stress_level: d.stressLevel,
    steps: d.steps,
    active_minutes: d.activeMinutes,
    spo2_average: d.spo2Average,
  }));

  const { error } = await supabase
    .from('wearable_health_data')
    .upsert(records, { onConflict: 'user_id,provider,date' });

  if (error) {
    return { success: false, error: error.message };
  }

  // Update last_sync_at
  await supabase
    .from('wearable_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider);

  return { success: true };
}

// ============================================
// CHRONO-STACK OPTIMIZER
// ============================================

export interface ChronoStackSettings {
  avgSleepTime: string; // HH:MM
  avgWakeTime: string;
  morningWindowStart: string;
  morningWindowEnd: string;
  noonWindowStart: string;
  noonWindowEnd: string;
  eveningWindowStart: string;
  eveningWindowEnd: string;
  bedtimeWindowStart: string;
  bedtimeWindowEnd: string;
  lastCaffeineTime: string;
  dataSource: 'manual' | WearableProvider;
}

/**
 * Berechnet optimale Supplement-Fenster basierend auf Schlafzeiten
 */
export function calculateChronoWindows(
  avgSleepTime: string,
  avgWakeTime: string
): Omit<ChronoStackSettings, 'dataSource'> {
  // Parse Zeiten
  const [sleepHour, sleepMin] = avgSleepTime.split(':').map(Number);
  const [wakeHour, wakeMin] = avgWakeTime.split(':').map(Number);

  const sleepMinutes = sleepHour * 60 + sleepMin;
  const wakeMinutes = wakeHour * 60 + wakeMin;

  // Berechne Fenster
  const morningStart = wakeMinutes; // Direkt nach Aufwachen
  const morningEnd = wakeMinutes + 120; // 2h nach Aufwachen
  
  const noonStart = 12 * 60; // 12:00
  const noonEnd = 14 * 60; // 14:00
  
  const eveningStart = sleepMinutes - 240; // 4h vor Schlaf
  const eveningEnd = sleepMinutes - 120; // 2h vor Schlaf
  
  const bedtimeStart = sleepMinutes - 90; // 1.5h vor Schlaf
  const bedtimeEnd = sleepMinutes - 30; // 30min vor Schlaf
  
  const lastCaffeine = sleepMinutes - 360; // 6h vor Schlaf

  const formatTime = (minutes: number): string => {
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalizedMinutes / 60);
    const m = normalizedMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return {
    avgSleepTime,
    avgWakeTime,
    morningWindowStart: formatTime(morningStart),
    morningWindowEnd: formatTime(morningEnd),
    noonWindowStart: formatTime(noonStart),
    noonWindowEnd: formatTime(noonEnd),
    eveningWindowStart: formatTime(eveningStart),
    eveningWindowEnd: formatTime(eveningEnd),
    bedtimeWindowStart: formatTime(bedtimeStart),
    bedtimeWindowEnd: formatTime(bedtimeEnd),
    lastCaffeineTime: formatTime(lastCaffeine),
  };
}

/**
 * Holt oder berechnet Chrono-Stack Einstellungen
 */
export async function getChronoStackSettings(
  userId: string
): Promise<ChronoStackSettings> {
  if (USE_MOCK_DATA) {
    const mockSchedule = calculateMockSleepSchedule();
    return {
      ...calculateChronoWindows(mockSchedule.avgSleepTime, mockSchedule.avgWakeTime),
      dataSource: 'garmin',
    };
  }

  if (!supabase) {
    // Fallback: Standard-Zeiten
    return {
      ...calculateChronoWindows('23:00', '07:00'),
      dataSource: 'manual',
    };
  }

  // Erst versuchen, gespeicherte Einstellungen zu laden
  const { data: savedSettings } = await supabase
    .from('chrono_stack_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (savedSettings) {
    return {
      avgSleepTime: savedSettings.avg_sleep_time,
      avgWakeTime: savedSettings.avg_wake_time,
      morningWindowStart: savedSettings.morning_window_start,
      morningWindowEnd: savedSettings.morning_window_end,
      noonWindowStart: savedSettings.noon_window_start,
      noonWindowEnd: savedSettings.noon_window_end,
      eveningWindowStart: savedSettings.evening_window_start,
      eveningWindowEnd: savedSettings.evening_window_end,
      bedtimeWindowStart: savedSettings.bedtime_window_start,
      bedtimeWindowEnd: savedSettings.bedtime_window_end,
      lastCaffeineTime: savedSettings.last_caffeine_time,
      dataSource: savedSettings.data_source,
    };
  }

  // Berechne aus Wearable-Daten
  const healthData = await getHealthData(userId, 14);
  
  if (healthData.length > 0) {
    // Durchschnittliche Schlafdauer → ungefähre Schlafzeiten schätzen
    const avgDuration = healthData.reduce((sum, d) => sum + (d.sleepDurationHours || 0), 0) / healthData.length;
    // Annahme: Aufwachzeit ~07:00, Schlafzeit berechnen
    const wakeTime = '07:00';
    const sleepHour = 7 - avgDuration;
    const sleepTime = `${Math.floor(sleepHour + 24) % 24}:00`;
    
    return {
      ...calculateChronoWindows(sleepTime, wakeTime),
      dataSource: 'garmin',
    };
  }

  // Fallback
  return {
    ...calculateChronoWindows('23:00', '07:00'),
    dataSource: 'manual',
  };
}

/**
 * Speichert Chrono-Stack Einstellungen
 */
export async function saveChronoStackSettings(
  userId: string,
  settings: ChronoStackSettings
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase nicht konfiguriert' };

  const { error } = await supabase
    .from('chrono_stack_settings')
    .upsert({
      user_id: userId,
      avg_sleep_time: settings.avgSleepTime,
      avg_wake_time: settings.avgWakeTime,
      morning_window_start: settings.morningWindowStart,
      morning_window_end: settings.morningWindowEnd,
      noon_window_start: settings.noonWindowStart,
      noon_window_end: settings.noonWindowEnd,
      evening_window_start: settings.eveningWindowStart,
      evening_window_end: settings.eveningWindowEnd,
      bedtime_window_start: settings.bedtimeWindowStart,
      bedtime_window_end: settings.bedtimeWindowEnd,
      last_caffeine_time: settings.lastCaffeineTime,
      data_source: settings.dataSource,
    }, { onConflict: 'user_id' });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// EXPORT
// ============================================

export { USE_MOCK_DATA };

