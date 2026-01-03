'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, Loader2, AlertTriangle, Trash2, Sparkles, Camera, Package } from 'lucide-react';
import { SUPPLEMENT_LIBRARY, Supplement } from '@/data/supplements';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/layout/BottomNav';
import { Carousel3D } from '@/components/library/Carousel3D';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { addToStack, removeFromStack, getUserStackIds } from '@/lib/supabaseService';
import { getUserCustomSupplements, CustomSupplement, deleteCustomSupplement } from '@/lib/customSupplementService';
import { useHelix } from '@/components/coach';
import { motion, AnimatePresence } from 'framer-motion';
import { DosageModal } from '@/components/ui/DosageModal';
import { ScanModal } from '@/components/ui/ScanModal';

function LibraryContent() {
    const { userId } = useAnonymousUser();
    const { triggerMessage } = useHelix();
    const searchParams = useSearchParams();
    const highlightId = searchParams?.get('highlight') || null;
    
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [userStackIds, setUserStackIds] = useState<Set<string>>(new Set());
    const [customSupplements, setCustomSupplements] = useState<CustomSupplement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [initialIndex, setInitialIndex] = useState<number | undefined>(undefined);

    // Supplement-Typ Kategorien (basierend auf Namen/ID)
    const CATEGORY_RULES: { name: string; match: (s: Supplement) => boolean }[] = [
        { name: 'Vitamine', match: (s) => /vitamin|b12|b6|b1|b2|b3|b5|b7|b9|folat|biotin|niacin|pantothen|riboflavin|thiamin|cobalamin/i.test(s.name + s.id) },
        { name: 'Aminosäuren', match: (s) => /glycine|theanine|taurine|tyrosine|carnitine|glutamine|bcaa|eaa|leucine|arginine|citrulline|ornithine|methionine|cysteine|tryptophan|gaba|nac|amino/i.test(s.name + s.id) },
        { name: 'Mineralien', match: (s) => /magnesium|zinc|iron|calcium|potassium|selenium|iodine|copper|chromium|boron|electrolyte/i.test(s.name + s.id) },
        { name: 'Adaptogene', match: (s) => /ashwagandha|rhodiola|ginseng|maca|cordyceps|reishi|lion|shilajit|schisandra|eleuthero|holy basil|tulsi/i.test(s.name + s.id) },
        { name: 'Nootropika', match: (s) => /alpha.?gpc|cdp.?choline|citicoline|bacopa|ginkgo|phosphatidyl|lion|racetam|modafinil|noopept|huperzine/i.test(s.name + s.id) },
        { name: 'Omega & Fette', match: (s) => /omega|fish.?oil|krill|dha|epa|mct|cla/i.test(s.name + s.id) },
        { name: 'Proteine', match: (s) => /whey|casein|collagen|protein|peptide/i.test(s.name + s.id) },
        { name: 'Antioxidantien', match: (s) => /coq10|glutathione|astaxanthin|resveratrol|quercetin|curcumin|turmeric|nac|alpha.?lipoic/i.test(s.name + s.id) },
        { name: 'Schlaf', match: (s) => /melatonin|valerian|passionflower|chamomile|apigenin|gaba|glycine|magnesium.*glycinate/i.test(s.name + s.id) || s.benefits.includes('Sleep') },
        { name: 'Performance', match: (s) => /creatine|beta.?alanine|caffeine|citrulline|nitrate|beetroot|pre.?workout/i.test(s.name + s.id) || s.benefits.includes('Performance') || s.benefits.includes('Endurance') },
    ];

    // Kategorien mit Counts berechnen
    const categoryTags = useMemo(() => {
        return CATEGORY_RULES.map(rule => ({
            name: rule.name,
            count: SUPPLEMENT_LIBRARY.filter(rule.match).length
        })).filter(c => c.count > 0);
    }, []);

    // Benefit-Tags (die häufigsten, für nach den Kategorien)
    const benefitTags = useMemo(() => {
        const benefitCounts = new Map<string, number>();
        SUPPLEMENT_LIBRARY.forEach(s => {
            s.benefits.forEach(b => {
                benefitCounts.set(b, (benefitCounts.get(b) || 0) + 1);
            });
        });
        return Array.from(benefitCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15) // Top 15 Benefits
            .map(([benefit]) => benefit);
    }, []);

    // Aktiver Filter kann Kategorie oder Benefit sein
    const getFilteredByCategory = (supplements: Supplement[], filter: string | null) => {
        if (!filter) return supplements;
        
        // Prüfe ob es eine Kategorie ist
        const categoryRule = CATEGORY_RULES.find(r => r.name === filter);
        if (categoryRule) {
            return supplements.filter(categoryRule.match);
        }
        
        // Sonst ist es ein Benefit
        return supplements.filter(s => s.benefits.includes(filter));
    };
    
    // Modal States
    const [showDosageModal, setShowDosageModal] = useState(false);
    const [selectedForAdd, setSelectedForAdd] = useState<Supplement | null>(null);
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const [selectedForRemove, setSelectedForRemove] = useState<Supplement | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState<Supplement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);

    // Lade User Stack IDs und Custom Supplements
    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            Promise.all([
                getUserStackIds(userId),
                getUserCustomSupplements(userId)
            ])
                .then(([ids, customs]) => {
                    setUserStackIds(new Set(ids));
                    setCustomSupplements(customs);
                })
                .finally(() => setIsLoading(false));
        }
    }, [userId]);

    // Kombiniere SUPPLEMENT_LIBRARY mit Custom Supplements
    const allSupplements = useMemo(() => {
        // Konvertiere Custom Supplements zu Supplement-Format
        const customAsSupplements: Supplement[] = customSupplements.map(cs => ({
            id: `custom:${cs.id}`,
            name: cs.name,
            description: cs.description || `Kombi-Präparat mit ${cs.ingredients?.length || 0} Wirkstoffen`,
            benefits: cs.ingredients?.slice(0, 3).map(i => i.name) || [],
            evidence_level: 3 as const,
            optimal_dosage: cs.serving_size || '1 Portion',
            best_time: cs.best_time || 'With Meals',
            icon: 'Package',
            emoji: cs.emoji || '💊',
            affects_metrics: [],
            isCustom: true, // Marker für Custom
        }));

        // Custom zuerst, dann Library
        return [...customAsSupplements, ...SUPPLEMENT_LIBRARY];
    }, [customSupplements]);

    // Erweiterte Suche + Filter: Name, Benefits, Description, ID, Emoji
    const filteredSupplements = useMemo(() => {
        // Zuerst: Kategorie/Benefit-Filter anwenden
        let result = getFilteredByCategory(allSupplements, activeFilter);
        
        // Dann: Suchtext prüfen
        const searchLower = search.toLowerCase().trim();
        if (!searchLower) return result;
        
        return result.filter(s => 
            s.name.toLowerCase().includes(searchLower) ||
            s.id.toLowerCase().includes(searchLower) ||
            s.description.toLowerCase().includes(searchLower) ||
            s.benefits.some(b => b.toLowerCase().includes(searchLower)) ||
            s.optimal_dosage.toLowerCase().includes(searchLower) ||
            s.best_time.toLowerCase().includes(searchLower) ||
            s.emoji.includes(search) || // Emoji-Suche (case-sensitive)
            // Auch nach Metriken suchen
            s.affects_metrics?.some(m => m.metric.toLowerCase().includes(searchLower)) ||
            // Custom Supplements mit "custom" oder "kombi" finden
            ((s as any).isCustom && ('custom kombi eigene'.includes(searchLower)))
        );
    }, [allSupplements, activeFilter, search]);

    // Wenn highlight Parameter vorhanden, finde den Index
    useEffect(() => {
        if (highlightId && !isLoading && filteredSupplements.length > 0) {
            const index = filteredSupplements.findIndex(s => s.id === highlightId);
            if (index >= 0) {
                setInitialIndex(index);
            }
        }
    }, [highlightId, isLoading, filteredSupplements]);

    // Add to Stack Handler
    const handleAddToStack = (supplement: Supplement) => {
        setSelectedForAdd(supplement);
        setShowDosageModal(true);
    };

    const handleConfirmAdd = async (dosage: string, time?: string) => {
        if (!userId || !selectedForAdd || isProcessing) return;
        
        setShowDosageModal(false);
        setIsProcessing(true);
        
        try {
            const result = await addToStack(
                userId, 
                selectedForAdd.id,
                dosage,
                time || selectedForAdd.best_time
            );
            
            if (result.success) {
                setUserStackIds(prev => new Set([...prev, selectedForAdd.id]));
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                triggerMessage('supplementAdded', { supplement: selectedForAdd.name });
            } else {
                triggerMessage('error');
            }
        } catch (error) {
            console.error('Error adding to stack:', error);
            triggerMessage('error');
        } finally {
            setIsProcessing(false);
            setSelectedForAdd(null);
        }
    };

    // Remove from Stack Handler
    const handleRemoveFromStack = (supplement: Supplement) => {
        setSelectedForRemove(supplement);
        setShowConfirmRemove(true);
    };

    const handleConfirmRemove = async () => {
        if (!userId || !selectedForRemove || isProcessing) return;
        
        setShowConfirmRemove(false);
        setIsProcessing(true);
        
        try {
            const result = await removeFromStack(userId, selectedForRemove.id);
            
            if (result.success) {
                setUserStackIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedForRemove.id);
                    return newSet;
                });
                if (navigator.vibrate) navigator.vibrate([100]);
                triggerMessage('supplementRemoved', { supplement: selectedForRemove.name });
            } else {
                triggerMessage('error');
            }
        } catch (error) {
            console.error('Error removing from stack:', error);
            triggerMessage('error');
        } finally {
            setIsProcessing(false);
            setSelectedForRemove(null);
        }
    };

    // Delete from Library Handler (for custom/scanned supplements)
    const handleDeleteFromLibrary = (supplement: Supplement) => {
        setSelectedForDelete(supplement);
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = async () => {
        if (!userId || !selectedForDelete || isProcessing) return;
        
        setShowConfirmDelete(false);
        setIsProcessing(true);
        
        try {
            // Extract the actual ID (remove "custom:" prefix)
            const customId = selectedForDelete.id.replace('custom:', '');
            
            // First remove from stack if it's there
            if (userStackIds.has(selectedForDelete.id)) {
                await removeFromStack(userId, selectedForDelete.id);
                setUserStackIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedForDelete.id);
                    return newSet;
                });
            }
            
            // Then delete from library
            const result = await deleteCustomSupplement(userId, customId);
            
            if (result.success) {
                // Remove from local state
                setCustomSupplements(prev => prev.filter(cs => cs.id !== customId));
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                triggerMessage('supplementRemoved', { supplement: selectedForDelete.name });
            } else {
                console.error('Failed to delete:', result.error);
                triggerMessage('error');
            }
        } catch (error) {
            console.error('Error deleting from library:', error);
            triggerMessage('error');
        } finally {
            setIsProcessing(false);
            setSelectedForDelete(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen pb-28 relative overflow-hidden">

            {/* Header */}
            <div className="relative z-20 px-6 pt-8 pb-4">
                <div className="flex flex-col items-center text-center mb-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black tracking-tighter text-white"
                    >
                        BIO<span className="text-primary">LAB</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-primary/60 font-mono text-[10px] uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5"
                    >
                        <Sparkles size={10} />
                        {filteredSupplements.length} Supplements
                    </motion.p>
                </div>

                {/* Search */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative group"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search supplements..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-14 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    />
                    {/* Camera Scan Button */}
                    <button
                        onClick={() => setShowScanModal(true)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                        title="Supplement scannen"
                    >
                        <Camera size={16} />
                    </button>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-14 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </motion.div>

                {/* Filter Tags */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 overflow-x-auto scrollbar-hide"
                >
                    <div className="flex gap-2 pb-2">
                        {/* "Alle" Button */}
                        <button
                            onClick={() => setActiveFilter(null)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                                activeFilter === null
                                    ? "bg-primary text-black"
                                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            Alle
                        </button>
                        
                        {/* Typ-Kategorien (Vitamine, Aminosäuren, etc.) */}
                        {categoryTags.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveFilter(activeFilter === cat.name ? null : cat.name)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                                    activeFilter === cat.name
                                        ? "bg-primary text-black"
                                        : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white border border-white/10"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                        
                        {/* Trenner */}
                        <div className="w-px bg-white/20 mx-1" />
                        
                        {/* Benefit-Tags (Sleep, Energy, etc.) */}
                        {benefitTags.map(benefit => (
                            <button
                                key={benefit}
                                onClick={() => setActiveFilter(activeFilter === benefit ? null : benefit)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                                    activeFilter === benefit
                                        ? "bg-primary text-black"
                                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {benefit}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* 3D Carousel */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1 relative z-10"
            >
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Carousel3D
                        supplements={filteredSupplements}
                        userStackIds={userStackIds}
                        onAddToStack={handleAddToStack}
                        onRemoveFromStack={handleRemoveFromStack}
                        onDeleteFromLibrary={handleDeleteFromLibrary}
                        initialIndex={initialIndex}
                    />
                )}
            </motion.div>

            {/* Dosage Modal */}
            {selectedForAdd && (
                <DosageModal
                    isOpen={showDosageModal}
                    onClose={() => {
                        setShowDosageModal(false);
                        setSelectedForAdd(null);
                    }}
                    onSave={handleConfirmAdd}
                    supplementName={selectedForAdd.name}
                    supplementIcon={selectedForAdd.icon}
                    defaultDosage={selectedForAdd.optimal_dosage}
                    defaultTime={undefined}
                    mode="add"
                />
            )}

            {/* Remove Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmRemove && selectedForRemove && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
                        onClick={() => setShowConfirmRemove(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-red-500/30 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                    Aus Stack entfernen?
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    <span className="text-2xl mr-2">{selectedForRemove.emoji}</span>
                                    {selectedForRemove.name} wird aus deinem Stack entfernt.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmRemove(false)}
                                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleConfirmRemove}
                                    disabled={isProcessing}
                                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                    Entfernen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete from Library Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmDelete && selectedForDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
                        onClick={() => setShowConfirmDelete(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-red-500/30 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                    Aus Library löschen?
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <span className="text-2xl mr-2">{selectedForDelete.emoji}</span>
                                    {selectedForDelete.name}
                                </p>
                                <p className="text-xs text-red-400/80">
                                    Dieses Produkt wird permanent gelöscht und kann nicht wiederhergestellt werden.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isProcessing}
                                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                    Löschen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scan Modal */}
            <ScanModal
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
                userId={userId || undefined}
                onAddToStack={async (supplementId, dosage) => {
                    if (!userId) return;
                    try {
                        await addToStack(userId, supplementId, dosage);
                        setUserStackIds(prev => new Set([...prev, supplementId]));
                        triggerMessage('supplementAdded', { supplement: supplementId });
                        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                    } catch (error) {
                        console.error('Error adding from scan:', error);
                        triggerMessage('error');
                    }
                }}
                onSaveComplete={async () => {
                    // Auto-Refresh: Custom-Supplements und Stack neu laden
                    if (!userId) return;
                    const [ids, customs] = await Promise.all([
                        getUserStackIds(userId),
                        getUserCustomSupplements(userId)
                    ]);
                    setUserStackIds(new Set(ids));
                    setCustomSupplements(customs);
                    triggerMessage('supplementAdded', { supplement: 'Kombi-Präparat' });
                }}
            />

            <BottomNav />
        </div>
    );
}

// Wrapper mit Suspense für useSearchParams
export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}
