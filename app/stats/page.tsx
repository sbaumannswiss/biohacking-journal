'use client';

import { useState, useEffect, useMemo } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { getDailyStats, getSupplementStats, DailyStats, SupplementStats, getUserStreak, getUserStack, getMetricsHistory, getQuestStats } from '@/lib/supabaseService';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';
import { TrendingUp, Filter, Award, Flame, Target, Loader2, ChevronDown, Lock, X, Info, Sparkles, Check, Watch, Activity } from 'lucide-react';
import { calculateBadges, getUnlockedBadges, getInProgressBadges, Badge } from '@/lib/badges';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHelix } from '@/components/coach';
import { WearableHealthSummary, ChronoStackDisplay, CorrelationInsights } from '@/components/wearables';
import { getConnectedProviders, WearableProvider } from '@/lib/wearables';

// Zeitraum-Optionen
const TIME_RANGES = [
    { label: '7T', days: 7 },
    { label: '30T', days: 30 },
    { label: '90T', days: 90 },
    { label: 'Alles', days: 365 },
];

// Farben für Supplements
const CHART_COLORS = [
    '#A7F3D0', // Primary Mint
    '#FCD34D', // Amber
    '#F472B6', // Pink
    '#60A5FA', // Blue
    '#C084FC', // Purple
    '#FB923C', // Orange
    '#4ADE80', // Green
    '#F87171', // Red
];

// Farben für Wohlbefinden
const METRIC_COLORS = {
    sleep: '#818CF8', // Indigo
    energy: '#FBBF24', // Yellow
    focus: '#34D399', // Emerald
};

export default function StatsPage() {
    const { userId } = useAnonymousUser();
    const { triggerMessage } = useHelix();
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState(30);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [supplementStats, setSupplementStats] = useState<SupplementStats[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [visibleMetrics, setVisibleMetrics] = useState({
        sleep: true,
        energy: true,
        focus: true,
    });
    const [visibleSupplements, setVisibleSupplements] = useState<Set<string>>(new Set());
    const [badges, setBadges] = useState<Badge[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [isCollectingData, setIsCollectingData] = useState(false);
    const [dataPointsNeeded, setDataPointsNeeded] = useState<{ days: number; checkIns: number } | null>(null);
    
    // Wearable State
    const [hasWearableConnection, setHasWearableConnection] = useState(false);
    const [showWearableSection, setShowWearableSection] = useState(true);

    // Wearable-Verbindungen laden
    useEffect(() => {
        if (userId) {
            getConnectedProviders(userId).then(providers => {
                setHasWearableConnection(providers.length > 0);
            });
        }
    }, [userId]);

    // Daten laden
    useEffect(() => {
        if (userId) {
            setLoading(true);
            Promise.all([
                getDailyStats(userId, selectedRange),
                getSupplementStats(userId, selectedRange),
                getUserStreak(userId),
                getUserStack(userId),
                getMetricsHistory(userId, 30),
                getQuestStats(userId)
            ]).then(([daily, supps, streak, stack, metrics, questStats]) => {
                setDailyStats(daily);
                setSupplementStats(supps);
                // Alle Supplements initial sichtbar
                setVisibleSupplements(new Set(supps.map(s => s.supplementId)));
                
                // Badges berechnen
                const totalCheckIns = supps.reduce((sum, s) => sum + s.totalCheckIns, 0);
                const avgAdherence = supps.length > 0 
                    ? supps.reduce((sum, s) => sum + s.adherencePercent, 0) / supps.length 
                    : 0;
                const longestStreak = Math.max(0, ...supps.map(s => s.longestStreak));
                
                const calculatedBadges = calculateBadges({
                    currentStreak: streak,
                    longestStreak: longestStreak,
                    totalCheckIns: totalCheckIns,
                    adherencePercent: avgAdherence,
                    stackSize: stack.length,
                    journalDays: metrics.length,
                    quests: questStats,
                });
                setBadges(calculatedBadges);
                
                // Stats für AI-Zusammenfassung speichern
                const avgSleep = metrics.length > 0 
                    ? metrics.reduce((sum, m) => sum + (m.sleep || 0), 0) / metrics.length 
                    : 0;
                const avgEnergy = metrics.length > 0 
                    ? metrics.reduce((sum, m) => sum + (m.energy || 0), 0) / metrics.length 
                    : 0;
                const avgFocus = metrics.length > 0 
                    ? metrics.reduce((sum, m) => sum + (m.focus || 0), 0) / metrics.length 
                    : 0;
                
                setSummaryStats({
                    currentStreak: streak,
                    longestStreak: longestStreak,
                    totalCheckIns: totalCheckIns,
                    adherencePercent: Math.round(avgAdherence),
                    stackSize: stack.length,
                    journalDays: metrics.length,
                    questsCompleted: questStats.totalCompleted,
                    avgSleep,
                    avgEnergy,
                    avgFocus,
                });
                
                setLoading(false);
            });
        }
    }, [userId, selectedRange]);

    // AI-Zusammenfassung laden
    useEffect(() => {
        if (summaryStats && !aiSummary && !summaryLoading) {
            setSummaryLoading(true);
            fetch('/api/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stats: summaryStats }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.summary) {
                        setAiSummary(data.summary);
                    }
                    // Tracking ob noch Daten gesammelt werden
                    setIsCollectingData(data.isCollecting || false);
                    if (data.isCollecting) {
                        setDataPointsNeeded({
                            days: data.daysNeeded || 0,
                            checkIns: data.checkInsNeeded || 0
                        });
                    }
                })
                .catch(err => console.error('Summary error:', err))
                .finally(() => setSummaryLoading(false));
        }
    }, [summaryStats, aiSummary, summaryLoading]);

    // Graph-Daten berechnen
    const graphData = useMemo(() => {
        if (dailyStats.length === 0) return { labels: [], datasets: [] };

        const labels = dailyStats.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        });

        const datasets: { label: string; data: (number | null)[]; color: string; type: 'metric' | 'supplement' }[] = [];

        // Wohlbefinden-Metriken
        if (visibleMetrics.sleep) {
            datasets.push({
                label: 'Schlaf',
                data: dailyStats.map(d => d.sleep ?? null),
                color: METRIC_COLORS.sleep,
                type: 'metric'
            });
        }
        if (visibleMetrics.energy) {
            datasets.push({
                label: 'Energie',
                data: dailyStats.map(d => d.energy ?? null),
                color: METRIC_COLORS.energy,
                type: 'metric'
            });
        }
        if (visibleMetrics.focus) {
            datasets.push({
                label: 'Fokus',
                data: dailyStats.map(d => d.focus ?? null),
                color: METRIC_COLORS.focus,
                type: 'metric'
            });
        }

        // Supplements (binär: 1 wenn genommen, 0 sonst - skaliert auf 10 für Vergleichbarkeit)
        supplementStats.forEach((supp, idx) => {
            if (visibleSupplements.has(supp.supplementId)) {
                datasets.push({
                    label: supp.supplementName,
                    data: dailyStats.map(d => 
                        d.supplements.includes(supp.supplementId) ? 10 : 0
                    ),
                    color: CHART_COLORS[idx % CHART_COLORS.length],
                    type: 'supplement'
                });
            }
        });

        return { labels, datasets };
    }, [dailyStats, supplementStats, visibleMetrics, visibleSupplements]);

    // Toggle Supplement Visibility
    const toggleSupplement = (id: string) => {
        setVisibleSupplements(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Gesamt-Adherence berechnen
    const overallAdherence = useMemo(() => {
        if (supplementStats.length === 0) return 0;
        const avg = supplementStats.reduce((sum, s) => sum + s.adherencePercent, 0) / supplementStats.length;
        return Math.round(avg);
    }, [supplementStats]);

    // Längster Streak über alle Supplements
    const longestOverallStreak = useMemo(() => {
        return Math.max(0, ...supplementStats.map(s => s.longestStreak));
    }, [supplementStats]);

    return (
        <div className="flex flex-col min-h-screen pb-28">
            {/* Header */}
            <header className="px-6 pt-8 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Stats</h1>
                        <p className="text-sm text-muted-foreground">Deine Supplement-Analyse</p>
                    </div>
                </div>
            </header>

            {/* Zeitraum-Buttons */}
            <div className="px-6 mb-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.days}
                            onClick={() => setSelectedRange(range.days)}
                            className={cn(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                                selectedRange === range.days
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <main data-tour-id="stats-graph" className="flex-1 px-6 space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="glass-panel p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-primary">{overallAdherence}%</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Adherence</div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
                                <Flame size={18} fill="currentColor" />
                                {longestOverallStreak}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Längster Streak</div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-foreground">{supplementStats.length}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Supplements</div>
                        </div>
                    </div>

                    {/* Wearable Section */}
                    {hasWearableConnection && userId && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => setShowWearableSection(!showWearableSection)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Watch size={18} className="text-primary" />
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Wearable-Daten
                                    </h3>
                                </div>
                                <motion.div
                                    animate={{ rotate: showWearableSection ? 180 : 0 }}
                                    className="text-muted-foreground text-sm"
                                >
                                    ▼
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {showWearableSection && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        {/* Health Summary */}
                                        <WearableHealthSummary userId={userId} />

                                        {/* Chrono Stack */}
                                        <ChronoStackDisplay userId={userId} />

                                        {/* Korrelationen */}
                                        <CorrelationInsights userId={userId} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Wearable Hinweis wenn nicht verbunden */}
                    {!hasWearableConnection && (
                        <div className="glass-panel rounded-2xl p-4 border border-dashed border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Activity size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-foreground">Wearable verbinden</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Verbinde Garmin, Whoop oder Oura im <span className="text-primary">Profil</span> für tiefere Insights
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Multigraph */}
                    <div className="glass-panel rounded-2xl p-4 overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Verlauf
                            </h3>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    showFilters ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                <Filter size={14} />
                                Filter
                                <ChevronDown size={14} className={cn("transition-transform", showFilters && "rotate-180")} />
                            </button>
                        </div>

                        {/* Filter Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-4"
                                >
                                    <div className="p-3 bg-white/5 rounded-xl space-y-3">
                                        {/* Metriken */}
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-2">Wohlbefinden</div>
                                            <div className="flex gap-2 flex-wrap">
                                                {Object.entries(METRIC_COLORS).map(([key, color]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                                                            visibleMetrics[key as keyof typeof visibleMetrics]
                                                                ? "bg-white/10 text-foreground"
                                                                : "bg-transparent text-muted-foreground/50"
                                                        )}
                                                    >
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                        {key === 'sleep' ? 'Schlaf' : key === 'energy' ? 'Energie' : 'Fokus'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Supplements */}
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-2">Supplements</div>
                                            <div className="flex gap-2 flex-wrap">
                                                {supplementStats.map((supp, idx) => (
                                                    <button
                                                        key={supp.supplementId}
                                                        onClick={() => toggleSupplement(supp.supplementId)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                                                            visibleSupplements.has(supp.supplementId)
                                                                ? "bg-white/10 text-foreground"
                                                                : "bg-transparent text-muted-foreground/50"
                                                        )}
                                                    >
                                                        <div 
                                                            className="w-2 h-2 rounded-full" 
                                                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                                                        />
                                                        {supp.supplementName.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Graph */}
                        <div className="h-48 relative">
                            {graphData.datasets.length > 0 ? (
                                <MultiLineGraph data={graphData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Keine Daten für diesen Zeitraum
                                </div>
                            )}
                        </div>

                        {/* Legende */}
                        <div className="flex gap-3 flex-wrap mt-4 pt-3 border-t border-white/5">
                            {graphData.datasets.map((ds) => (
                                <div key={ds.label} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.color }} />
                                    <span className="text-[10px] text-muted-foreground">{ds.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Zusammenfassung */}
                    <div className={cn(
                        "glass-panel rounded-2xl p-5 relative overflow-hidden border",
                        isCollectingData 
                            ? "border-amber-500/30" 
                            : "border-primary/20"
                    )}>
                        {/* Glow Effect */}
                        <div className={cn(
                            "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none",
                            isCollectingData ? "bg-amber-500/10" : "bg-primary/10"
                        )} />
                        
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                isCollectingData 
                                    ? "bg-amber-500/20 text-amber-400" 
                                    : "bg-primary/20 text-primary"
                            )}>
                                {isCollectingData ? (
                                    <Target size={16} />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">
                                    {isCollectingData ? 'Daten sammeln' : 'Helix Analyse'}
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {isCollectingData 
                                        ? `Noch ${dataPointsNeeded?.days || 0} Tage für statistische Signifikanz`
                                        : 'KI-generierte Zusammenfassung'
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <div className="relative z-10">
                            {summaryLoading ? (
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Analysiere deine Daten...</span>
                                </div>
                            ) : aiSummary ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap"
                                >
                                    {aiSummary}
                                </motion.div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sammle mehr Daten für eine personalisierte Analyse...
                                </p>
                            )}
                        </div>
                        
                        {/* Progress Bar wenn Daten gesammelt werden */}
                        {isCollectingData && dataPointsNeeded && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                    <span>Fortschritt zur Analyse</span>
                                    <span>{Math.max(0, 7 - (dataPointsNeeded.days || 0))}/7 Tage</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((7 - (dataPointsNeeded.days || 0)) / 7) * 100}%` }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {aiSummary && !isCollectingData && (
                            <button
                                onClick={() => {
                                    setAiSummary(null);
                                    setSummaryLoading(false);
                                    setIsCollectingData(false);
                                }}
                                className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                                🔄 Neue Analyse generieren
                            </button>
                        )}
                    </div>

                    {/* Supplement Stats Cards */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Supplement-Details
                        </h3>
                        <div className="space-y-2">
                            {supplementStats.map((supp, idx) => {
                                const supplement = SUPPLEMENT_LIBRARY.find(s => s.id === supp.supplementId);
                                return (
                                    <motion.div
                                        key={supp.supplementId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="glass-panel p-4 rounded-xl"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {supplement?.emoji && <span>{supplement.emoji}</span>}
                                                <span className="font-semibold text-foreground">{supp.supplementName}</span>
                                            </div>
                                            <div className="text-primary font-bold">{supp.adherencePercent}%</div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${supp.adherencePercent}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                            />
                                        </div>

                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{supp.totalCheckIns} Check-ins</span>
                                            <span className="flex items-center gap-1">
                                                <Flame size={12} className="text-orange-400" />
                                                {supp.currentStreak} Tage Streak
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {supplementStats.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Noch keine Check-ins in diesem Zeitraum</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badges Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Award size={16} className="text-primary" />
                            Badges ({getUnlockedBadges(badges).length}/{badges.length})
                        </h3>
                        
                        {/* Unlocked Badges */}
                        {getUnlockedBadges(badges).length > 0 && (
                            <div className="mb-4">
                                <div className="text-xs text-muted-foreground mb-2">Freigeschaltet (tippen für Details)</div>
                                <div className="flex flex-wrap gap-2">
                                    {getUnlockedBadges(badges).map((badge) => (
                                        <motion.button
                                            key={badge.id}
                                            type="button"
                                            onClick={() => setSelectedBadge(badge)}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 border border-primary/20 hover:bg-primary/5 transition-colors text-left"
                                        >
                                            <span className="text-xl">{badge.icon}</span>
                                            <div>
                                                <div className="text-xs font-semibold text-foreground">{badge.name}</div>
                                                <div className="text-[10px] text-muted-foreground">{badge.description}</div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* In Progress Badges */}
                        {getInProgressBadges(badges).length > 0 && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-2">In Arbeit (tippen für Details)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {getInProgressBadges(badges).slice(0, 4).map((badge) => (
                                        <button
                                            key={badge.id}
                                            type="button"
                                            onClick={() => setSelectedBadge(badge)}
                                            className="glass-panel p-3 rounded-xl relative overflow-hidden text-left hover:bg-white/5 transition-colors active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg grayscale opacity-50">{badge.icon}</span>
                                                <div className="flex-1">
                                                    <div className="text-xs font-medium text-foreground/70">{badge.name}</div>
                                                </div>
                                                <Lock size={12} className="text-muted-foreground" />
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-primary/50 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${badge.progress}%` }}
                                                    transition={{ duration: 0.8 }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 text-right">
                                                {badge.progress}%
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {badges.length === 0 && (
                            <div className="glass-panel rounded-2xl p-4 text-center text-muted-foreground">
                                <p className="text-sm">Keine Badges verfügbar</p>
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* Badge Detail Modal */}
            <AnimatePresence>
                {selectedBadge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setSelectedBadge(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-primary/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{selectedBadge.icon}</span>
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{selectedBadge.name}</h3>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full capitalize",
                                            selectedBadge.category === 'streak' && "bg-orange-500/20 text-orange-400",
                                            selectedBadge.category === 'milestone' && "bg-blue-500/20 text-blue-400",
                                            selectedBadge.category === 'consistency' && "bg-green-500/20 text-green-400",
                                            selectedBadge.category === 'special' && "bg-purple-500/20 text-purple-400",
                                            selectedBadge.category === 'quest' && "bg-amber-500/20 text-amber-400"
                                        )}>
                                            {selectedBadge.category === 'streak' ? 'Streak' : 
                                             selectedBadge.category === 'milestone' ? 'Meilenstein' :
                                             selectedBadge.category === 'consistency' ? 'Konsistenz' : 
                                             selectedBadge.category === 'quest' ? 'Quest' : 'Special'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedBadge(null)}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} className="text-muted-foreground" />
                                </button>
                            </div>

                            {/* Description */}
                            <div className="bg-white/5 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {selectedBadge.description}
                                    </p>
                                </div>
                            </div>

                            {/* Requirement */}
                            <div className="mb-4">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                    Herausforderung
                                </div>
                                <div className="text-foreground font-medium">
                                    {selectedBadge.category === 'streak' && (
                                        <>{selectedBadge.requirement} Tage in Folge Supplements nehmen</>
                                    )}
                                    {selectedBadge.category === 'milestone' && (
                                        <>{selectedBadge.requirement} Check-ins erreichen</>
                                    )}
                                    {selectedBadge.category === 'consistency' && (
                                        <>{selectedBadge.requirement}% Adherence in 30 Tagen</>
                                    )}
                                    {selectedBadge.category === 'special' && selectedBadge.id.startsWith('stack-') && (
                                        <>{selectedBadge.requirement} Supplements im Stack haben</>
                                    )}
                                    {selectedBadge.category === 'special' && selectedBadge.id.startsWith('journal-') && (
                                        <>{selectedBadge.requirement} Journal-Einträge machen</>
                                    )}
                                    {selectedBadge.category === 'quest' && (
                                        <>{selectedBadge.description}</>
                                    )}
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Fortschritt</span>
                                    <span className="font-bold text-primary">{selectedBadge.progress}%</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${selectedBadge.progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>

                            {/* Unlock Status */}
                            {selectedBadge.unlocked ? (
                                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
                                    <span className="text-primary font-bold text-sm flex items-center justify-center gap-1">
                                        <Check size={14} /> Freigeschaltet
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                                    <span className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                                        <Lock size={14} />
                                        Noch nicht freigeschaltet
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

// Simple Multi-Line Graph Component
function MultiLineGraph({ data }: { data: { labels: string[]; datasets: { label: string; data: (number | null)[]; color: string }[] } }) {
    const width = 350;
    const height = 180;
    const padding = { top: 10, right: 10, bottom: 25, left: 30 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Y-Achse: 0-10
    const yScale = (val: number) => padding.top + chartHeight - (val / 10) * chartHeight;
    const xScale = (idx: number) => padding.left + (idx / Math.max(1, data.labels.length - 1)) * chartWidth;

    // Nur jeden n-ten Label anzeigen
    const labelStep = Math.ceil(data.labels.length / 7);

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 2.5, 5, 7.5, 10].map((val) => (
                <g key={val}>
                    <line
                        x1={padding.left}
                        y1={yScale(val)}
                        x2={width - padding.right}
                        y2={yScale(val)}
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2,2"
                    />
                    <text
                        x={padding.left - 5}
                        y={yScale(val)}
                        fill="rgba(255,255,255,0.3)"
                        fontSize="8"
                        textAnchor="end"
                        dominantBaseline="middle"
                    >
                        {val}
                    </text>
                </g>
            ))}

            {/* X-Achsen Labels */}
            {data.labels.map((label, idx) => {
                if (idx % labelStep !== 0 && idx !== data.labels.length - 1) return null;
                return (
                    <text
                        key={idx}
                        x={xScale(idx)}
                        y={height - 5}
                        fill="rgba(255,255,255,0.3)"
                        fontSize="8"
                        textAnchor="middle"
                    >
                        {label}
                    </text>
                );
            })}

            {/* Linien */}
            {data.datasets.map((ds) => {
                const points = ds.data
                    .map((val, idx) => val !== null ? { x: xScale(idx), y: yScale(val) } : null)
                    .filter(Boolean) as { x: number; y: number }[];

                if (points.length < 2) return null;

                const pathD = points.reduce((acc, pt, idx) => {
                    if (idx === 0) return `M ${pt.x} ${pt.y}`;
                    return `${acc} L ${pt.x} ${pt.y}`;
                }, '');

                return (
                    <motion.path
                        key={ds.label}
                        d={pathD}
                        fill="none"
                        stroke={ds.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 4px ${ds.color}40)` }}
                    />
                );
            })}

            {/* Punkte am Ende jeder Linie */}
            {data.datasets.map((ds) => {
                let lastValidIdx = -1;
                let lastValidValue: number | null = null;
                
                ds.data.forEach((val, idx) => {
                    if (val !== null) {
                        lastValidIdx = idx;
                        lastValidValue = val;
                    }
                });
                
                if (lastValidIdx < 0 || lastValidValue === null) return null;

                return (
                    <motion.circle
                        key={`${ds.label}-dot`}
                        cx={xScale(lastValidIdx)}
                        cy={yScale(lastValidValue)}
                        r="3"
                        fill={ds.color}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 }}
                        style={{ filter: `drop-shadow(0 0 4px ${ds.color})` }}
                    />
                );
            })}
        </svg>
    );
}

