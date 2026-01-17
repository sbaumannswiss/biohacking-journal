/**
 * Client-seitige Verschlüsselung für Gesundheitsdaten
 * 
 * Verwendet AES-256-GCM für symmetrische Verschlüsselung.
 * Der Schlüssel wird aus dem Benutzerpasswort + Salt abgeleitet (PBKDF2).
 * 
 * WICHTIG: Der Verschlüsselungsschlüssel verlässt nie den Client.
 * Der Server speichert nur verschlüsselte Daten.
 */

// Konstanten
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits für GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Prüft ob Web Crypto API verfügbar ist
 */
export function isCryptoAvailable(): boolean {
  return typeof window !== 'undefined' && 
         !!window.crypto && 
         !!window.crypto.subtle;
}

/**
 * Generiert einen zufälligen Salt (Base64-encoded)
 */
export function generateSalt(): string {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return uint8ArrayToBase64(salt);
}

/**
 * Leitet einen Verschlüsselungsschlüssel aus Passwort + Salt ab
 */
export async function deriveKey(
  password: string, 
  saltBase64: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const salt = base64ToUint8Array(saltBase64);

  // Passwort als Key-Material importieren
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // AES-GCM Schlüssel ableiten
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // nicht exportierbar
    ['encrypt', 'decrypt']
  );
}

/**
 * Verschlüsselt Daten mit AES-256-GCM
 * 
 * @returns Base64-encoded String: IV (12 bytes) + Ciphertext
 */
export async function encryptData(
  data: object,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Zufälliger IV für jeden Verschlüsselungsvorgang
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  // Verschlüsseln
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext
  );

  // IV + Ciphertext kombinieren
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return uint8ArrayToBase64(combined);
}

/**
 * Entschlüsselt Daten
 * 
 * @param encryptedBase64 Base64-encoded String: IV + Ciphertext
 */
export async function decryptData<T = object>(
  encryptedBase64: string,
  key: CryptoKey
): Promise<T> {
  const combined = base64ToUint8Array(encryptedBase64);

  // IV und Ciphertext trennen
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  // Entschlüsseln
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}

/**
 * Verschlüsselt Health-Daten für die Speicherung
 */
export async function encryptHealthData(
  healthData: HealthDataPayload,
  key: CryptoKey
): Promise<string> {
  return encryptData(healthData, key);
}

/**
 * Entschlüsselt Health-Daten nach dem Laden
 */
export async function decryptHealthData(
  encryptedData: string,
  key: CryptoKey
): Promise<HealthDataPayload> {
  return decryptData<HealthDataPayload>(encryptedData, key);
}

// ============================================
// HELPER FUNKTIONEN
// ============================================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============================================
// TYPES
// ============================================

export interface HealthDataPayload {
  // Schlaf
  sleepScore?: number;
  sleepDurationHours?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  
  // HRV
  hrvAverage?: number;
  hrvStatus?: string;
  
  // Herzfrequenz
  restingHeartRate?: number;
  
  // Energie
  bodyBatteryHigh?: number;
  bodyBatteryLow?: number;
  recoveryScore?: number;
  
  // Stress
  stressLevel?: number;
  
  // Aktivität
  steps?: number;
  activeMinutes?: number;
  
  // SpO2
  spo2Average?: number;
  
  // Metadaten
  date: string;
  source: string;
}

// ============================================
// KEY MANAGEMENT
// ============================================

const KEY_CACHE = new Map<string, CryptoKey>();

/**
 * Cached Key-Ableitung (Performance-Optimierung)
 */
export async function getCachedKey(
  password: string,
  salt: string
): Promise<CryptoKey> {
  const cacheKey = `${salt}:${password.length}`; // Nicht das Passwort selbst cachen
  
  if (KEY_CACHE.has(cacheKey)) {
    return KEY_CACHE.get(cacheKey)!;
  }
  
  const key = await deriveKey(password, salt);
  KEY_CACHE.set(cacheKey, key);
  
  return key;
}

/**
 * Löscht gecachte Keys (z.B. bei Logout)
 */
export function clearKeyCache(): void {
  KEY_CACHE.clear();
}

// ============================================
// RE-ENCRYPTION (für Passwort-Änderung)
// ============================================

/**
 * Re-verschlüsselt Daten mit einem neuen Schlüssel
 */
export async function reEncryptData(
  encryptedData: string,
  oldKey: CryptoKey,
  newKey: CryptoKey
): Promise<string> {
  const decrypted = await decryptData(encryptedData, oldKey);
  return encryptData(decrypted, newKey);
}
