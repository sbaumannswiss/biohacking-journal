/**
 * Garmin Health API Types
 * 
 * Dokumentation: https://developer.garmin.com/health-api/
 */

// OAuth Token Response
export interface GarminTokens {
  access_token: string;
  access_token_secret: string;
  user_id: string;
}

// Sleep Data
export interface GarminSleepData {
  summaryId: string;
  calendarDate: string; // YYYY-MM-DD
  startTimeInSeconds: number;
  durationInSeconds: number;
  startTimeOffsetInSeconds: number;
  
  // Schlafphasen in Sekunden
  deepSleepDurationInSeconds: number;
  lightSleepDurationInSeconds: number;
  remSleepInSeconds: number;
  awakeDurationInSeconds: number;
  
  // Schlafqualität
  sleepScores: {
    overall: number; // 0-100
    quality: number;
    recovery: number;
    restfulness: number;
  };
  
  // HRV während Schlaf
  averageHRV?: number;
  
  // Herzfrequenz
  averageSleepHeartRate?: number;
  lowestSleepHeartRate?: number;
  
  // Respiration
  averageRespirationValue?: number;
  
  // SpO2
  averageSpO2Value?: number;
}

// Daily Summary
export interface GarminDailySummary {
  summaryId: string;
  calendarDate: string;
  
  // Aktivität
  steps: number;
  distanceInMeters: number;
  activeTimeInSeconds: number;
  activeKilocalories: number;
  
  // Herzfrequenz
  restingHeartRateInBeatsPerMinute: number;
  maxHeartRateInBeatsPerMinute: number;
  averageHeartRateInBeatsPerMinute: number;
  
  // Stress
  averageStressLevel: number; // 0-100
  maxStressLevel: number;
  stressDurationInSeconds: number;
  restStressDurationInSeconds: number;
  
  // Body Battery
  bodyBatteryChargedValue: number;
  bodyBatteryDrainedValue: number;
  bodyBatteryHighestValue: number;
  bodyBatteryLowestValue: number;
}

// HRV Data (separate endpoint)
export interface GarminHRVData {
  summaryId: string;
  calendarDate: string;
  weeklyAverage: number;
  lastNightAverage: number;
  lastNightFiveMinuteHigh: number;
  hrvStatus: 'BALANCED' | 'UNBALANCED' | 'LOW' | 'POOR';
  baseline: {
    lowUpper: number;
    balancedLow: number;
    balancedUpper: number;
  };
}

// Respiration
export interface GarminRespirationData {
  summaryId: string;
  calendarDate: string;
  avgWakingRespirationValue: number;
  highestRespirationValue: number;
  lowestRespirationValue: number;
}

// Pulse Ox (SpO2)
export interface GarminPulseOxData {
  summaryId: string;
  calendarDate: string;
  averageSpO2: number;
  lowestSpO2: number;
  onDemandReadings?: {
    timestampGMT: string;
    readingValue: number;
  }[];
}

// Stress Details
export interface GarminStressData {
  summaryId: string;
  calendarDate: string;
  overallStressLevel: number;
  highStressDurationInSeconds: number;
  mediumStressDurationInSeconds: number;
  lowStressDurationInSeconds: number;
  restStressDurationInSeconds: number;
}

// Normalisierte Daten für unsere App
export interface NormalizedHealthData {
  date: string;
  source: 'garmin' | 'healthconnect' | 'apple_health';
  
  // Schlaf
  sleepScore: number | null; // 0-10 (normalisiert von 0-100)
  sleepDurationHours: number | null;
  deepSleepMinutes: number | null;
  remSleepMinutes: number | null;
  
  // HRV
  hrvAverage: number | null;
  hrvStatus: string | null;
  
  // Herzfrequenz
  restingHeartRate: number | null;
  
  // Energie/Erholung
  bodyBatteryHigh: number | null;
  bodyBatteryLow: number | null;
  recoveryScore: number | null; // 0-10
  
  // Stress
  stressLevel: number | null; // 0-10 (normalisiert von 0-100)
  
  // Aktivität
  steps: number | null;
  activeMinutes: number | null;
  
  // SpO2
  spo2Average: number | null;
}

// Supabase Table Type
export interface WearableConnection {
  id: string;
  user_id: string;
  provider: 'garmin' | 'whoop' | 'oura' | 'apple' | 'samsung' | 'healthconnect' | 'apple_health';
  access_token: string;
  access_token_secret?: string; // Für OAuth 1.0a (Garmin)
  refresh_token?: string;
  expires_at?: string;
  provider_user_id: string;
  connected_at: string;
  last_sync_at?: string;
  is_active: boolean;
}

export interface WearableHealthData {
  id: string;
  user_id: string;
  provider: string;
  date: string;
  data: NormalizedHealthData;
  raw_data?: Record<string, unknown>;
  synced_at: string;
}

