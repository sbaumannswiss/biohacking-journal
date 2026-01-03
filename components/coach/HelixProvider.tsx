'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getHelixMessage, HelixTrigger, HelixMessageData } from './helixMessages';

interface HelixContextType {
    // Current message state
    currentMessage: HelixMessageData | null;
    isVisible: boolean;
    
    // Actions
    triggerMessage: (trigger: HelixTrigger, context?: Record<string, string | number>) => void;
    showCustomMessage: (message: string, mood?: HelixMessageData['mood']) => void;
    hideMessage: () => void;
    
    // Animation state
    helixMood: 'idle' | 'happy' | 'excited' | 'thinking' | 'sad';
}

const HelixContext = createContext<HelixContextType | null>(null);

export function useHelix() {
    const context = useContext(HelixContext);
    if (!context) {
        throw new Error('useHelix must be used within a HelixProvider');
    }
    return context;
}

interface HelixProviderProps {
    children: ReactNode;
}

export function HelixProvider({ children }: HelixProviderProps) {
    const [currentMessage, setCurrentMessage] = useState<HelixMessageData | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [helixMood, setHelixMood] = useState<HelixContextType['helixMood']>('idle');
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const hideMessage = useCallback(() => {
        setIsVisible(false);
        setHelixMood('idle');
        // Clear message after animation
        setTimeout(() => setCurrentMessage(null), 300);
    }, []);

    const showMessage = useCallback((messageData: HelixMessageData, duration: number = 5000) => {
        // Clear existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        setCurrentMessage(messageData);
        setHelixMood(messageData.mood);
        setIsVisible(true);

        // Auto-hide after duration
        const newTimeout = setTimeout(() => {
            hideMessage();
        }, duration);
        
        setTimeoutId(newTimeout);
    }, [timeoutId, hideMessage]);

    const triggerMessage = useCallback((trigger: HelixTrigger, context?: Record<string, string | number>) => {
        const messageData = getHelixMessage(trigger, context);
        
        // Bestimmte Trigger haben längere Anzeigedauer
        const duration = ['levelUp', 'streakMilestone', 'welcome'].includes(trigger) ? 7000 : 5000;
        
        showMessage(messageData, duration);
    }, [showMessage]);

    const showCustomMessage = useCallback((message: string, mood: HelixMessageData['mood'] = 'happy') => {
        showMessage({
            message,
            mood,
            emoji: ''
        }, 5000);
    }, [showMessage]);

    return (
        <HelixContext.Provider value={{
            currentMessage,
            isVisible,
            triggerMessage,
            showCustomMessage,
            hideMessage,
            helixMood
        }}>
            {children}
        </HelixContext.Provider>
    );
}

