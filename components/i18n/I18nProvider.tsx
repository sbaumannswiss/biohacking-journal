'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { getInitialLocale, SupportedLocale } from '@/hooks/useLanguage';

// Import all messages
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import es from '@/messages/es.json';
import it from '@/messages/it.json';

const messages: Record<SupportedLocale, typeof en> = {
    en,
    de,
    es,
    it,
};

interface I18nProviderProps {
    children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [locale, setLocale] = useState<SupportedLocale>('en');
    const [isHydrated, setIsHydrated] = useState(false);
    
    useEffect(() => {
        // Get locale from localStorage/browser after hydration
        const initialLocale = getInitialLocale();
        setLocale(initialLocale);
        setIsHydrated(true);
    }, []);
    
    // Show nothing different during SSR to avoid hydration mismatch
    // The initial render will be in English, then update on client
    
    return (
        <NextIntlClientProvider 
            locale={isHydrated ? locale : 'en'} 
            messages={isHydrated ? messages[locale] : messages.en}
            timeZone="Europe/Berlin"
        >
            {children}
        </NextIntlClientProvider>
    );
}
