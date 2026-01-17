'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS, SupportedLocale } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function LanguageSwitcher() {
    const t = useTranslations('profile');
    const { locale, setLocale, isLoaded } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    
    const currentLanguage = LANGUAGE_OPTIONS.find(opt => opt.value === locale) || LANGUAGE_OPTIONS[0];
    
    const handleSelect = (newLocale: SupportedLocale) => {
        if (newLocale !== locale) {
            setLocale(newLocale);
        }
        setIsOpen(false);
    };
    
    if (!isLoaded) {
        return (
            <div className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 animate-pulse">
                <div className="p-2 bg-white/5 rounded-lg">
                    <Globe size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <div className="h-4 w-20 bg-white/10 rounded" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
                <div className="p-2 bg-white/5 rounded-lg group-hover:text-primary transition-colors">
                    <Globe size={20} />
                </div>
                <div className="flex-1">
                    <span className="font-medium">{t('language')}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{currentLanguage.flag}</span>
                        <span>{currentLanguage.label}</span>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-muted-foreground"
                >
                    <ChevronDown size={18} />
                </motion.div>
            </button>
            
            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel rounded-xl border border-white/10 overflow-hidden shadow-xl"
                        >
                            <div className="p-1">
                                {LANGUAGE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                            option.value === locale
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-white/5 text-foreground"
                                        )}
                                    >
                                        <span className="text-xl">{option.flag}</span>
                                        <span className="flex-1 text-left font-medium">{option.label}</span>
                                        {option.value === locale && (
                                            <Check size={18} className="text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
