/**
 * Mock Wearable Data für Entwicklung
 * 
 * Simuliert realistische Garmin/Whoop/Oura Daten
 * für UI-Entwicklung ohne API-Zugang.
 */

import { NormalizedHealthData } from '@/lib/garmin/types';

// Realistische Baseline-Werte für einen typischen User
const BASELINE = {
  sleepScore: 7.2,
  sleepDuration: 7.5,
  deepSleep: 85,
  remSleep: 95,
  hrv: 45,
  restingHR: 58,
  bodyBatteryHigh: 85,
  bodyBatteryLow: 25,
  recovery: 7.5,
  stress: 3.5,
  steps: 8500,
  activeMinutes: 45,
  spo2: 97.5,
};

// Variation für natürliche Schwankungen
function vary(base: number, variance: number): number {
  return Math.round((base + (Math.random() - 0.5) * 2 * variance) * 10) / 10;
}

function varyInt(base: number, variance: number): number {
  return Math.round(base + (Math.random() - 0.5) * 2 * variance);
}

/**
 * Generiert Mock-Daten für einen bestimmten Tag
 * 
 * Simuliert auch Korrelationen:
 * - Schlechter Schlaf → niedrigere Recovery, höherer Stress
 * - Mehr Aktivität → besserer Schlaf in der nächsten Nacht
 */
export function generateMockDayData(
  date: string,
  dayIndex: number = 0,
  supplements: string[] = []
): NormalizedHealthData {
  // Wochenrhythmus: Wochenende etwas besser
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendBonus = isWeekend ? 0.5 : 0;

  // Supplement-Effekte simulieren
  const magnesiumBonus = supplements.includes('magnesium') ? 0.8 : 0;
  const ashwagandhaBonus = supplements.includes('ashwagandha') ? -0.5 : 0; // Stress-Reduktion
  const creatineBonus = supplements.includes('creatine') ? 0.3 : 0;
  const omega3Bonus = supplements.includes('omega-3') ? 0.4 : 0;

  // Basis-Schlafqualität
  const sleepScore = Math.min(10, Math.max(1, 
    vary(BASELINE.sleepScore + weekendBonus + magnesiumBonus, 1.5)
  ));

  // Recovery korreliert mit Schlaf
  const recoveryBase = sleepScore * 0.8 + vary(2, 0.5);
  const recoveryScore = Math.min(10, Math.max(1, recoveryBase));

  // Stress invers korreliert mit Schlaf + Ashwagandha-Effekt
  const stressBase = 10 - sleepScore * 0.6 + vary(0, 1) + ashwagandhaBonus;
  const stressLevel = Math.min(10, Math.max(1, stressBase));

  // HRV korreliert mit Recovery + Omega-3 Effekt
  const hrvBase = BASELINE.hrv + (recoveryScore - 7.5) * 5 + omega3Bonus * 3;
  const hrvAverage = varyInt(hrvBase, 8);

  return {
    date,
    source: 'garmin',
    
    sleepScore,
    sleepDurationHours: vary(BASELINE.sleepDuration + weekendBonus * 0.5 + magnesiumBonus * 0.3, 1),
    deepSleepMinutes: varyInt(BASELINE.deepSleep + magnesiumBonus * 10, 20),
    remSleepMinutes: varyInt(BASELINE.remSleep, 15),
    
    hrvAverage,
    hrvStatus: hrvAverage > 50 ? 'BALANCED' : hrvAverage > 35 ? 'UNBALANCED' : 'LOW',
    
    restingHeartRate: varyInt(BASELINE.restingHR - creatineBonus * 2, 5),
    
    bodyBatteryHigh: varyInt(BASELINE.bodyBatteryHigh + recoveryScore * 2, 10),
    bodyBatteryLow: varyInt(BASELINE.bodyBatteryLow - stressLevel * 2, 8),
    recoveryScore,
    
    stressLevel,
    
    steps: varyInt(BASELINE.steps + (isWeekend ? -2000 : 0), 3000),
    activeMinutes: varyInt(BASELINE.activeMinutes + creatineBonus * 5, 20),
    
    spo2Average: vary(BASELINE.spo2, 1),
  };
}

/**
 * Generiert Mock-Daten für mehrere Tage
 */
export function generateMockHealthHistory(
  days: number = 14,
  supplements: string[] = []
): NormalizedHealthData[] {
  const data: NormalizedHealthData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    data.push(generateMockDayData(dateStr, i, supplements));
  }

  return data;
}

/**
 * Berechnet durchschnittliche Schlaf/Aufwachzeiten aus Mock-Daten
 */
export function calculateMockSleepSchedule(): {
  avgSleepTime: string;
  avgWakeTime: string;
  lastCaffeineTime: string;
} {
  // Simuliere typische User-Zeiten
  const sleepHour = 22 + Math.random() * 2; // 22:00 - 00:00
  const wakeHour = 6 + Math.random() * 1.5; // 06:00 - 07:30
  
  const sleepTime = `${Math.floor(sleepHour).toString().padStart(2, '0')}:${Math.floor((sleepHour % 1) * 60).toString().padStart(2, '0')}`;
  const wakeTime = `${Math.floor(wakeHour).toString().padStart(2, '0')}:${Math.floor((wakeHour % 1) * 60).toString().padStart(2, '0')}`;
  
  // Letztes Koffein 6h vor Schlaf
  const lastCaffeineHour = sleepHour - 6;
  const lastCaffeineTime = `${Math.floor(lastCaffeineHour).toString().padStart(2, '0')}:00`;

  return {
    avgSleepTime: sleepTime,
    avgWakeTime: wakeTime,
    lastCaffeineTime,
  };
}

/**
 * Mock Wearable Connection Status
 */
export interface MockWearableStatus {
  provider: 'garmin' | 'whoop' | 'oura';
  isConnected: boolean;
  lastSync: string | null;
  userName: string;
}

export function getMockWearableStatus(provider: 'garmin' | 'whoop' | 'oura'): MockWearableStatus {
  return {
    provider,
    isConnected: true,
    lastSync: new Date().toISOString(),
    userName: 'Demo User',
  };
}

