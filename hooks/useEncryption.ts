'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  isCryptoAvailable,
  deriveKey,
  encryptHealthData,
  decryptHealthData,
  clearKeyCache,
  type HealthDataPayload,
} from '@/lib/crypto';

interface EncryptionState {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
}

interface EncryptionActions {
  encrypt: (data: HealthDataPayload) => Promise<string | null>;
  decrypt: (encryptedData: string) => Promise<HealthDataPayload | null>;
  initialize: (password: string) => Promise<boolean>;
  clear: () => void;
}

/**
 * Hook für Client-seitige Verschlüsselung von Gesundheitsdaten
 * 
 * Verwendung:
 * 1. initialize(password) aufrufen nach Login
 * 2. encrypt(data) vor dem Speichern
 * 3. decrypt(encryptedData) nach dem Laden
 * 4. clear() bei Logout
 */
export function useEncryption(): EncryptionState & EncryptionActions {
  const { user } = useAuth();
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Salt aus Profil laden
  useEffect(() => {
    if (!user || !supabase) return;

    const loadSalt = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('encryption_salt')
        .eq('id', user.id)
        .single();

      if (data?.encryption_salt) {
        setSalt(data.encryption_salt);
      }
    };

    loadSalt();
  }, [user, supabase]);

  /**
   * Initialisiert die Verschlüsselung mit dem Benutzerpasswort
   */
  const initialize = useCallback(async (password: string): Promise<boolean> => {
    if (!isCryptoAvailable()) {
      setError('Verschlüsselung nicht verfügbar');
      return false;
    }

    if (!salt) {
      setError('Encryption Salt nicht gefunden');
      return false;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const derivedKey = await deriveKey(password, salt);
      setKey(derivedKey);
      return true;
    } catch (err) {
      setError('Schlüsselableitung fehlgeschlagen');
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [salt]);

  /**
   * Verschlüsselt Health-Daten
   */
  const encrypt = useCallback(async (
    data: HealthDataPayload
  ): Promise<string | null> => {
    if (!key) {
      console.warn('Encryption not initialized');
      return null;
    }

    try {
      return await encryptHealthData(data, key);
    } catch (err) {
      console.error('Encryption failed:', err);
      return null;
    }
  }, [key]);

  /**
   * Entschlüsselt Health-Daten
   */
  const decrypt = useCallback(async (
    encryptedData: string
  ): Promise<HealthDataPayload | null> => {
    if (!key) {
      console.warn('Encryption not initialized');
      return null;
    }

    try {
      return await decryptHealthData(encryptedData, key);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  }, [key]);

  /**
   * Löscht den Schlüssel (bei Logout)
   */
  const clear = useCallback(() => {
    setKey(null);
    clearKeyCache();
  }, []);

  return {
    isReady: !!key,
    isInitializing,
    error,
    encrypt,
    decrypt,
    initialize,
    clear,
  };
}
