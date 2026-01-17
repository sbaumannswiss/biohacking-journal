'use client';

import { useState, useEffect, useCallback } from 'react';

export type SupportedLocale = 'en' | 'de' | 'es' | 'it';

const STORAGE_KEY = 'bioboost_language';
const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'de', 'es', 'it'];

// Language display names and flags
export const LANGUAGE_OPTIONS: { value: SupportedLocale; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'it', label: 'Italiano', flag: '🇮🇹' },
];

/**
 * Detect browser language and map to supported locale
 */
function detectBrowserLanguage(): SupportedLocale {
    if (typeof navigator === 'undefined') return 'en';
    
    const browserLang = navigator.language?.toLowerCase() || 'en';
    
    // Check exact match first
    if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
        return browserLang as SupportedLocale;
    }
    
    // Check language prefix (e.g., "de-DE" -> "de")
    const langPrefix = browserLang.split('-')[0];
    if (SUPPORTED_LOCALES.includes(langPrefix as SupportedLocale)) {
        return langPrefix as SupportedLocale;
    }
    
    // Default to English
    return 'en';
}

/**
 * Get saved language from localStorage or detect from browser
 */
export function getInitialLocale(): SupportedLocale {
    if (typeof window === 'undefined') return 'en';
    
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LOCALES.includes(saved as SupportedLocale)) {
            return saved as SupportedLocale;
        }
    } catch {
        // localStorage not available
    }
    
    return detectBrowserLanguage();
}

/**
 * Hook to manage language state
 */
export function useLanguage() {
    const [locale, setLocaleState] = useState<SupportedLocale>('en');
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Initialize from localStorage/browser on mount
    useEffect(() => {
        const initialLocale = getInitialLocale();
        setLocaleState(initialLocale);
        setIsLoaded(true);
    }, []);
    
    // Save language to localStorage and reload page
    const setLocale = useCallback((newLocale: SupportedLocale) => {
        try {
            localStorage.setItem(STORAGE_KEY, newLocale);
        } catch {
            // localStorage not available
        }
        
        // Update state and reload to apply new language
        setLocaleState(newLocale);
        
        // Reload page to apply translations everywhere
        window.location.reload();
    }, []);
    
    return {
        locale,
        setLocale,
        isLoaded,
        options: LANGUAGE_OPTIONS,
    };
}
