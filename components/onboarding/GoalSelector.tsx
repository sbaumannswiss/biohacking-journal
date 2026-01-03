
'use client';

import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Brain, Moon, Battery, Zap } from 'lucide-react';

interface GoalSelectorProps {
    selectedGoals: string[];
    onToggle: (goal: string) => void;
}

const GOALS = [
    { id: 'focus', label: 'Deep Focus', icon: Brain, color: 'text-blue-400' },
    { id: 'sleep', label: 'Restorative Sleep', icon: Moon, color: 'text-indigo-400' },
    { id: 'energy', label: 'Peak Energy', icon: Zap, color: 'text-yellow-400' },
    { id: 'recovery', label: 'Fast Recovery', icon: Battery, color: 'text-green-400' },
];

export function GoalSelector({ selectedGoals, onToggle }: GoalSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                const Icon = goal.icon;

                return (
                    <motion.button
                        key={goal.id}
                        onClick={() => onToggle(goal.id)}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                            "relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300",
                            isSelected
                                ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(167,243,208,0.15)]"
                                : "bg-card border-white/5 hover:bg-white/5"
                        )}
                    >
                        <div className={clsx(
                            "p-3 rounded-full bg-background/50",
                            isSelected ? "text-primary scale-110" : goal.color
                        )}>
                            <Icon size={28} />
                        </div>
                        <span className={clsx(
                            "font-medium text-sm",
                            isSelected ? "text-primary" : "text-muted-foreground"
                        )}>
                            {goal.label}
                        </span>

                        {isSelected && (
                            <motion.div
                                layoutId="check"
                                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary "
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
