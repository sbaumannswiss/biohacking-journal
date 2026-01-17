'use client';

import { useState, useEffect } from 'react';

const USER_ID_KEY = 'stax_user_id';

/**
 * Hook für anonyme User-Identifikation.
 * Generiert eine persistente UUID beim ersten App-Start.
 * Diese ID wird für alle Supabase-Operationen verwendet (ohne Auth).
 */
export function useAnonymousUser() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Client-side only
        let id = localStorage.getItem(USER_ID_KEY);
        
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(USER_ID_KEY, id);
        }
        
        setUserId(id);
        setIsLoading(false);
    }, []);

    return { userId, isLoading };
}

/**
 * Synchrone Variante für Server Actions oder außerhalb von React.
 * Achtung: Nur client-side verfügbar!
 */
export function getAnonymousUserId(): string {
    if (typeof window === 'undefined') {
        throw new Error('getAnonymousUserId kann nur client-side aufgerufen werden');
    }
    
    let id = localStorage.getItem(USER_ID_KEY);
    
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, id);
    }
    
    return id;
}

