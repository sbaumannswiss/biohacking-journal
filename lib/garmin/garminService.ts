/**
 * Garmin Health API Service
 * 
 * Garmin verwendet OAuth 1.0a (nicht OAuth 2.0!)
 * Dokumentation: https://developer.garmin.com/health-api/
 */

import crypto from 'crypto';
import { 
  GarminSleepData, 
  GarminDailySummary, 
  GarminHRVData,
  GarminTokens,
  NormalizedHealthData 
} from './types';

// Garmin API Endpoints
const GARMIN_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
const GARMIN_AUTHORIZE_URL = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
const GARMIN_API_BASE = 'https://apis.garmin.com/wellness-api/rest';

// Environment Variables
const CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET || '';

/**
 * OAuth 1.0a Signature Generator
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  tokenSecret: string = ''
): string {
  // Sort params alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // Create signing key
  const signingKey = `${encodeURIComponent(CONSUMER_SECRET)}&${encodeURIComponent(tokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const hmac = crypto.createHmac('sha1', signingKey);
  hmac.update(signatureBase);
  return hmac.digest('base64');
}

/**
 * Generate OAuth 1.0a Header
 */
function generateOAuthHeader(
  method: string,
  url: string,
  accessToken?: string,
  tokenSecret?: string,
  additionalParams?: Record<string, string>
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
    ...additionalParams
  };

  if (accessToken) {
    oauthParams.oauth_token = accessToken;
  }

  // Merge with any query params for signature
  const allParams = { ...oauthParams };
  
  // Generate signature
  const signature = generateOAuthSignature(method, url, allParams, tokenSecret || '');
  oauthParams.oauth_signature = signature;

  // Build header string
  const headerString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerString}`;
}

/**
 * Step 1: Get Request Token
 */
export async function getRequestToken(callbackUrl: string): Promise<{
  oauth_token: string;
  oauth_token_secret: string;
}> {
  const oauthParams = {
    oauth_callback: callbackUrl
  };

  const authHeader = generateOAuthHeader('POST', GARMIN_REQUEST_TOKEN_URL, undefined, undefined, oauthParams);

  const response = await fetch(GARMIN_REQUEST_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get request token: ${error}`);
  }

  const text = await response.text();
  const params = new URLSearchParams(text);

  return {
    oauth_token: params.get('oauth_token') || '',
    oauth_token_secret: params.get('oauth_token_secret') || ''
  };
}

/**
 * Step 2: Get Authorization URL
 */
export function getAuthorizationUrl(oauthToken: string): string {
  return `${GARMIN_AUTHORIZE_URL}?oauth_token=${oauthToken}`;
}

/**
 * Step 3: Exchange for Access Token
 */
export async function getAccessToken(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<GarminTokens> {
  const oauthParams = {
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier
  };

  const authHeader = generateOAuthHeader(
    'POST', 
    GARMIN_ACCESS_TOKEN_URL, 
    oauthToken, 
    oauthTokenSecret,
    { oauth_verifier: oauthVerifier }
  );

  const response = await fetch(GARMIN_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const text = await response.text();
  const params = new URLSearchParams(text);

  return {
    access_token: params.get('oauth_token') || '',
    access_token_secret: params.get('oauth_token_secret') || '',
    user_id: params.get('user_id') || ''
  };
}

/**
 * Make authenticated API request
 */
async function makeGarminRequest<T>(
  endpoint: string,
  accessToken: string,
  tokenSecret: string,
  queryParams?: Record<string, string>
): Promise<T> {
  let url = `${GARMIN_API_BASE}${endpoint}`;
  
  if (queryParams) {
    const searchParams = new URLSearchParams(queryParams);
    url += `?${searchParams.toString()}`;
  }

  const authHeader = generateOAuthHeader('GET', url.split('?')[0], accessToken, tokenSecret);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Garmin API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get Sleep Data for a date range
 */
export async function getSleepData(
  accessToken: string,
  tokenSecret: string,
  startDate: string, // YYYY-MM-DD
  endDate: string
): Promise<GarminSleepData[]> {
  return makeGarminRequest<GarminSleepData[]>(
    '/sleeps',
    accessToken,
    tokenSecret,
    {
      uploadStartTimeInSeconds: String(Math.floor(new Date(startDate).getTime() / 1000)),
      uploadEndTimeInSeconds: String(Math.floor(new Date(endDate).getTime() / 1000))
    }
  );
}

/**
 * Get Daily Summaries for a date range
 */
export async function getDailySummaries(
  accessToken: string,
  tokenSecret: string,
  startDate: string,
  endDate: string
): Promise<GarminDailySummary[]> {
  return makeGarminRequest<GarminDailySummary[]>(
    '/dailies',
    accessToken,
    tokenSecret,
    {
      uploadStartTimeInSeconds: String(Math.floor(new Date(startDate).getTime() / 1000)),
      uploadEndTimeInSeconds: String(Math.floor(new Date(endDate).getTime() / 1000))
    }
  );
}

/**
 * Get HRV Data
 */
export async function getHRVData(
  accessToken: string,
  tokenSecret: string,
  startDate: string,
  endDate: string
): Promise<GarminHRVData[]> {
  return makeGarminRequest<GarminHRVData[]>(
    '/hrv',
    accessToken,
    tokenSecret,
    {
      uploadStartTimeInSeconds: String(Math.floor(new Date(startDate).getTime() / 1000)),
      uploadEndTimeInSeconds: String(Math.floor(new Date(endDate).getTime() / 1000))
    }
  );
}

/**
 * Normalize Garmin data to our standard format
 */
export function normalizeGarminData(
  sleepData: GarminSleepData | null,
  dailyData: GarminDailySummary | null,
  hrvData: GarminHRVData | null,
  date: string
): NormalizedHealthData {
  return {
    date,
    source: 'garmin',
    
    // Schlaf (0-100 → 0-10)
    sleepScore: sleepData?.sleepScores?.overall 
      ? Math.round(sleepData.sleepScores.overall / 10) 
      : null,
    sleepDurationHours: sleepData?.durationInSeconds 
      ? Math.round((sleepData.durationInSeconds / 3600) * 10) / 10 
      : null,
    deepSleepMinutes: sleepData?.deepSleepDurationInSeconds 
      ? Math.round(sleepData.deepSleepDurationInSeconds / 60) 
      : null,
    remSleepMinutes: sleepData?.remSleepInSeconds 
      ? Math.round(sleepData.remSleepInSeconds / 60) 
      : null,
    
    // HRV
    hrvAverage: hrvData?.lastNightAverage || sleepData?.averageHRV || null,
    hrvStatus: hrvData?.hrvStatus || null,
    
    // Herzfrequenz
    restingHeartRate: dailyData?.restingHeartRateInBeatsPerMinute || null,
    
    // Body Battery / Recovery
    bodyBatteryHigh: dailyData?.bodyBatteryHighestValue || null,
    bodyBatteryLow: dailyData?.bodyBatteryLowestValue || null,
    recoveryScore: sleepData?.sleepScores?.recovery 
      ? Math.round(sleepData.sleepScores.recovery / 10) 
      : null,
    
    // Stress (0-100 → 0-10)
    stressLevel: dailyData?.averageStressLevel 
      ? Math.round(dailyData.averageStressLevel / 10) 
      : null,
    
    // Aktivität
    steps: dailyData?.steps || null,
    activeMinutes: dailyData?.activeTimeInSeconds 
      ? Math.round(dailyData.activeTimeInSeconds / 60) 
      : null,
    
    // SpO2 (direkt)
    spo2Average: null // Separate API-Call wenn nötig
  };
}

/**
 * Sync all health data for a user
 */
export async function syncHealthData(
  accessToken: string,
  tokenSecret: string,
  days: number = 7
): Promise<NormalizedHealthData[]> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  try {
    // Parallel API calls
    const [sleepData, dailyData, hrvData] = await Promise.all([
      getSleepData(accessToken, tokenSecret, startStr, endStr).catch(() => []),
      getDailySummaries(accessToken, tokenSecret, startStr, endStr).catch(() => []),
      getHRVData(accessToken, tokenSecret, startStr, endStr).catch(() => [])
    ]);

    // Create a map by date
    const dataByDate = new Map<string, NormalizedHealthData>();

    // Process each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      const sleep = sleepData.find(s => s.calendarDate === dateStr) || null;
      const daily = dailyData.find(s => s.calendarDate === dateStr) || null;
      const hrv = hrvData.find(s => s.calendarDate === dateStr) || null;
      
      if (sleep || daily || hrv) {
        dataByDate.set(dateStr, normalizeGarminData(sleep, daily, hrv, dateStr));
      }
    }

    return Array.from(dataByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error syncing Garmin data:', error);
    throw error;
  }
}

/**
 * Verify if tokens are still valid
 */
export async function verifyTokens(
  accessToken: string,
  tokenSecret: string
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    await getDailySummaries(accessToken, tokenSecret, today, today);
    return true;
  } catch {
    return false;
  }
}

