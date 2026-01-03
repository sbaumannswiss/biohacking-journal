
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalSelector } from '@/components/onboarding/GoalSelector';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useHelix } from '@/components/coach';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [goals, setGoals] = useState<string[]>([]);
    const { triggerMessage } = useHelix();

    const toggleGoal = (id: string) => {
        setGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(prev => prev + 1);
        } else {
            // Complete Onboarding
            localStorage.setItem('bioboost_disclaimer_accepted', 'true');
            localStorage.setItem('bioboost_onboarding_completed', 'true');
            localStorage.setItem('bioboost_goals', JSON.stringify(goals));
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-sm z-10">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-primary"> BioBoost Pro</h1>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Professional implementation of supplement protocols. <br />
                                <span className="text-primary/70">Bio-individual. Scientific. Swiss-Made.</span>
                            </p>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center">Define Your Target</h2>
                            <GoalSelector selectedGoals={goals} onToggle={toggleGoal} />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-center"
                        >
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ">
                                <Check size={48} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">All Set!</h2>
                            <p className="text-muted-foreground mb-8">
                                Your dashboard has been calibrated for <span className="text-primary font-mono">{goals.length}</span> objectives.
                            </p>

                            <div className="p-4 bg-card/50 rounded-xl border border-white/5 text-xs text-left mb-8 text-muted-foreground/70">
                                <strong>Disclaimer:</strong> This app is a tracking tool and does not replace medical advice. By continuing, you acknowledge that you are using this for self-optimization purposes only.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation */}
                <button
                    onClick={handleNext}
                    className="w-full mt-8 bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all "
                >
                    {step === 3 ? 'Start Optimizing' : 'Next Step'}
                    <ArrowRight size={20} />
                </button>

                {/* Step Indicator */}
                <div className="flex justify-center gap-2 mt-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={clsx("w-2 h-2 rounded-full transition-colors", i === step ? "bg-primary " : "bg-white/10")} />
                    ))}
                </div>
            </div>
        </div>
    );
}
