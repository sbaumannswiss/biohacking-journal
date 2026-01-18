'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pill, AlertTriangle, Info, Sun, Coffee, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tageszeiten für Medikamente
const TIME_SLOTS = [
    { id: 'morning', label: 'Morgens', icon: Sun },
    { id: 'noon', label: 'Mittags', icon: Coffee },
    { id: 'evening', label: 'Abends', icon: Sunset },
    { id: 'bedtime', label: 'Nachts', icon: Moon },
] as const;

type TimeSlot = typeof TIME_SLOTS[number]['id'];

// Bekannte Medikamenten-Kategorien (für Interaktions-Checks)
const KNOWN_MEDICATIONS = [
    { id: 'blood-thinners', label: 'Blutverdünner', examples: 'Aspirin, Warfarin, Marcumar' },
    { id: 'antidepressants', label: 'Antidepressiva', examples: 'SSRI, SNRI, MAO-Hemmer' },
    { id: 'blood-pressure', label: 'Blutdruckmedikamente', examples: 'ACE-Hemmer, Betablocker' },
    { id: 'thyroid', label: 'Schilddrüsenmedikamente', examples: 'L-Thyroxin, Euthyrox' },
    { id: 'diabetes', label: 'Diabetes-Medikamente', examples: 'Metformin, Insulin' },
    { id: 'birth-control', label: 'Verhütungsmittel', examples: 'Pille, Hormonpflaster' },
];

// Medikament mit Tageszeit für Stack
export interface StackMedication {
    name: string;
    time: TimeSlot;
}

interface MedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMedications: string[];
    stackMedications?: StackMedication[]; // Medikamente die bereits im Stack sind (mit Zeit)
    onSave: (medications: string[], addToStack?: StackMedication[]) => Promise<void>;
}

export function MedicationModal({
    isOpen,
    onClose,
    currentMedications,
    stackMedications = [],
    onSave,
}: MedicationModalProps) {
    const [medications, setMedications] = useState<string[]>(
        currentMedications.filter(m => m !== 'none')
    );
    const [customInput, setCustomInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(true);
    // Track which medications should be added to stack for check-in (with time)
    const [medsForStack, setMedsForStack] = useState<Map<string, TimeSlot>>(
        new Map(stackMedications.map(m => [m.name, m.time]))
    );

    const toggleMedication = (id: string) => {
        if (medications.includes(id)) {
            setMedications(medications.filter(m => m !== id));
        } else {
            setMedications([...medications, id]);
        }
    };

    const addCustomMedication = () => {
        const trimmed = customInput.trim();
        if (trimmed && !medications.includes(trimmed)) {
            setMedications([...medications, trimmed]);
            setCustomInput('');
        }
    };

    const removeCustomMedication = (med: string) => {
        setMedications(medications.filter(m => m !== med));
    };

    const toggleStackMedication = (med: string) => {
        setMedsForStack(prev => {
            const newMap = new Map(prev);
            if (newMap.has(med)) {
                newMap.delete(med);
            } else {
                // Default to morning when first adding
                newMap.set(med, 'morning');
            }
            return newMap;
        });
    };

    const setMedicationTime = (med: string, time: TimeSlot) => {
        setMedsForStack(prev => {
            const newMap = new Map(prev);
            newMap.set(med, time);
            return newMap;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const stackArray: StackMedication[] = Array.from(medsForStack.entries()).map(
                ([name, time]) => ({ name, time })
            );
            await onSave(medications.length > 0 ? medications : ['none'], stackArray);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    // Custom medications (not in known list)
    const customMedications = medications.filter(
        m => !KNOWN_MEDICATIONS.some(km => km.id === m)
    );

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Pill size={18} className="text-amber-400" />
                        </div>
                        <h2 className="font-semibold">Medikamente verwalten</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Disclaimer */}
                <AnimatePresence>
                    {showDisclaimer && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-amber-200 font-medium mb-1">
                                            Wichtiger Hinweis
                                        </p>
                                        <p className="text-xs text-amber-200/80">
                                            Medikamente werden <strong>nur</strong> für Interaktions-Warnungen mit Supplements verwendet. 
                                            STAX gibt <strong>keine</strong> Empfehlungen zu Dosierung oder Einnahmezeiten für Medikamente. 
                                            Folge immer den Anweisungen deines Arztes.
                                        </p>
                                        <button
                                            onClick={() => setShowDisclaimer(false)}
                                            className="text-xs text-amber-400 mt-2 hover:underline"
                                        >
                                            Verstanden
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Info */}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <span>
                            Wähle Kategorien aus oder füge eigene Medikamente hinzu. 
                            So können wir dich vor möglichen Wechselwirkungen warnen.
                        </span>
                    </div>

                    {/* Known Medication Categories */}
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Medikamenten-Kategorien
                        </p>
                        <div className="grid gap-2">
                            {KNOWN_MEDICATIONS.map((med) => (
                                <button
                                    key={med.id}
                                    onClick={() => toggleMedication(med.id)}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all",
                                        medications.includes(med.id)
                                            ? "bg-amber-500/20 border-amber-500/50"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "font-medium text-sm",
                                            medications.includes(med.id) ? "text-amber-400" : "text-foreground"
                                        )}>
                                            {med.label}
                                        </span>
                                        {medications.includes(med.id) && (
                                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        z.B. {med.examples}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Medications */}
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Eigene Medikamente
                        </p>
                        
                        {/* Custom list */}
                        {customMedications.length > 0 && (
                            <div className="space-y-2 mb-2">
                                {customMedications.map((med) => (
                                    <div
                                        key={med}
                                        className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-amber-400 font-medium">{med}</span>
                                                <button
                                                    onClick={() => removeCustomMedication(med)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <X size={12} className="text-amber-400/60" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => toggleStackMedication(med)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all",
                                                    medsForStack.has(med)
                                                        ? "bg-amber-500/30 text-amber-300"
                                                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                                )}
                                            >
                                                {medsForStack.has(med) ? (
                                                    <>
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                        Im Stack
                                                    </>
                                                ) : (
                                                    'Zum Stack'
                                                )}
                                            </button>
                                        </div>
                                        
                                        {/* Time Selection - only shown when added to stack */}
                                        <AnimatePresence>
                                            {medsForStack.has(med) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="flex gap-1 mt-2 pt-2 border-t border-amber-500/20">
                                                        {TIME_SLOTS.map((slot) => {
                                                            const Icon = slot.icon;
                                                            const isSelected = medsForStack.get(med) === slot.id;
                                                            return (
                                                                <button
                                                                    key={slot.id}
                                                                    onClick={() => setMedicationTime(med, slot.id)}
                                                                    className={cn(
                                                                        "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs transition-all",
                                                                        isSelected
                                                                            ? "bg-amber-500/30 text-amber-300"
                                                                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <Icon size={14} />
                                                                    <span className="text-[10px]">{slot.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add custom input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomMedication()}
                                placeholder="Medikament eingeben..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                            <button
                                onClick={addCustomMedication}
                                disabled={!customInput.trim()}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 space-y-3">
                    {/* Summary */}
                    {medications.length > 0 && (
                        <p className="text-xs text-center text-muted-foreground">
                            {medications.length} Medikament{medications.length !== 1 ? 'e' : ''} für Interaktions-Check
                        </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
