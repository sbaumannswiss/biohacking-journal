'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DisclaimerOverlay() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Prüfe ob Onboarding abgeschlossen wurde
        const hasOnboarded = localStorage.getItem('stax_onboarding_completed');
        const hasAccepted = localStorage.getItem('stax_disclaimer_accepted');
        
        // Nur für Legacy-User zeigen: Onboarding bereits gemacht, aber kein Disclaimer-Flag
        // Neue User gehen durch das Onboarding, das den Disclaimer einschließt
        if (hasOnboarded && !hasAccepted) {
            setIsOpen(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('stax_disclaimer_accepted', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-primary/20 shadow-2xl shadow-primary/10"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive ">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Legal Disclaimer</h2>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                STAX is for informational and tracking purposes only.
                                Use of this app does not constitute medical advice.
                                Always consult with your Swiss qualified healthcare professional before starting any new supplement regimen.
                            </p>

                            <button
                                onClick={handleAccept}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all "
                            >
                                <CheckCircle size={20} />
                                I Understand & Accept
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
