'use client';

import { useState, useEffect, useMemo } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { ActivityGraph } from '@/components/dashboard/ActivityGraph';
import { MetricSlider } from '@/components/journal/MetricSlider';
import { Moon, Zap, Target, Save, Check, AlertCircle, X, ChevronDown, Pencil, Clock, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { saveDailyMetrics, getMetricsHistory, getTodayMetrics } from '@/lib/supabaseService';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHelix } from '@/components/coach';
import { useTranslations } from 'next-intl';

// Question IDs and categories - questions are translated via i18n
const JOURNAL_QUESTION_STRUCTURE = {
    'sleepRecovery': [
        { id: 'slept_well', positive: true },
        { id: 'slept_through', positive: true },
        { id: 'woke_rested', positive: true },
    ],
    'lifestyle': [
        { id: 'training', positive: true },
        { id: 'alcohol', positive: false },
        { id: 'caffeine_late', positive: false },
        { id: 'morning_sun', positive: true },
        { id: 'screen_before_bed', positive: false },
    ],
    'mental': [
        { id: 'stressed', positive: false },
        { id: 'focused', positive: true },
        { id: 'good_mood', positive: true },
        { id: 'anxious', positive: false },
    ],
    'body': [
        { id: 'digestion_ok', positive: true },
        { id: 'hydrated', positive: true },
        { id: 'sick', positive: false },
    ],
} as const;

type QuestionId = typeof JOURNAL_QUESTION_STRUCTURE[keyof typeof JOURNAL_QUESTION_STRUCTURE][number]['id'];
type CategoryKey = keyof typeof JOURNAL_QUESTION_STRUCTURE;

const ALL_QUESTION_IDS = Object.values(JOURNAL_QUESTION_STRUCTURE).flat();


export default function JournalPage() {
    const { userId, isLoading: userLoading } = useAnonymousUser();
    const { triggerMessage } = useHelix();
    const t = useTranslations('journal');
    const tCommon = useTranslations('common');
    
    // State für bereits geloggt
    const [hasLoggedToday, setHasLoggedToday] = useState(false);
    const [todayData, setTodayData] = useState<{
        sleep: number;
        energy: number;
        focus: number;
        mood?: number;
    } | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isFirstLog, setIsFirstLog] = useState(true);
    
    // Slider Metrics (0-10)
    const [sleep, setSleep] = useState(7);
    const [energy, setEnergy] = useState(7);
    const [focus, setFocus] = useState(7);
    const [mood, setMood] = useState(7);
    
    // Toggle Answers (Whoop-Style)
    const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
    
    // Notes
    const [notes, setNotes] = useState('');
    
    // UI State
    const [showSliders, setShowSliders] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    
    // Graph Daten
    const [graphData, setGraphData] = useState<number[]>([]);
    const [graphLoading, setGraphLoading] = useState(true);
    const [previousDayData, setPreviousDayData] = useState<{ sleep: number; energy: number; focus: number } | null>(null);
    
    // Countdown bis Mitternacht
    const [timeUntilMidnight, setTimeUntilMidnight] = useState('');
    

    // Toggle Answer
    const setAnswer = (questionId: string, value: boolean) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: prev[questionId] === value ? null : value
        }));
    };
    
    // Berechne Score
    const getAnswerScore = () => {
        let positive = 0;
        let negative = 0;
        
        ALL_QUESTION_IDS.forEach(q => {
            const answer = answers[q.id];
            if (answer === null || answer === undefined) return;
            
            if (q.positive) {
                if (answer) positive++;
                else negative++;
            } else {
                if (!answer) positive++;
                else negative++;
            }
        });
        
        return { positive, negative, total: positive + negative };
    };

    // Berechne Gesamtscore (0-100%)
    const totalScore = useMemo(() => {
        if (!todayData) return 0;
        const sliderAvg = ((todayData.sleep || 5) + (todayData.energy || 5) + (todayData.focus || 5) + (todayData.mood || 5)) / 4;
        return Math.round(sliderAvg * 10);
    }, [todayData]);

    // Trend vs gestern berechnen
    const trend = useMemo(() => {
        if (!todayData || !previousDayData) return null;
        const todayAvg = ((todayData.sleep || 5) + (todayData.energy || 5) + (todayData.focus || 5)) / 3;
        const prevAvg = ((previousDayData.sleep || 5) + (previousDayData.energy || 5) + (previousDayData.focus || 5)) / 3;
        const diff = todayAvg - prevAvg;
        return { diff: Math.round(diff * 10) / 10, direction: diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'stable' };
    }, [todayData, previousDayData]);

    // Update Countdown
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            setTimeUntilMidnight(`${hours}h ${minutes}m`);
        };
        
        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, []);

    // Lade Daten beim Start
    useEffect(() => {
        if (userId) {
            setPageLoading(true);
            
            Promise.all([
                getTodayMetrics(userId),
                getMetricsHistory(userId, 7)
            ]).then(([todayResult, historyData]) => {
                // Prüfe ob heute bereits geloggt
                if (todayResult.exists && todayResult.data) {
                    setHasLoggedToday(true);
                    setIsFirstLog(false);
                    setTodayData({
                        sleep: todayResult.data.sleep,
                        energy: todayResult.data.energy,
                        focus: todayResult.data.focus,
                        mood: todayResult.data.mood,
                    });
                    // Fülle Formular mit gespeicherten Daten
                    setSleep(todayResult.data.sleep);
                    setEnergy(todayResult.data.energy);
                    setFocus(todayResult.data.focus);
                    setMood(todayResult.data.mood || 7);
                    if (todayResult.data.tags) {
                        const answersFromTags: Record<string, boolean | null> = {};
                        todayResult.data.tags.forEach(tag => {
                            answersFromTags[tag] = true;
                        });
                        setAnswers(answersFromTags);
                    }
                    if (todayResult.data.notes) {
                        setNotes(todayResult.data.notes);
                    }
                }
                
                // Graph Daten
                const averages = historyData.map(d => 
                    Math.round(((d.sleep || 5) + (d.energy || 5) + (d.focus || 5)) / 3 * 10)
                );
                setGraphData(averages.length > 0 ? averages : []);
                
                // Vorheriger Tag für Trend
                if (historyData.length >= 2) {
                    const yesterday = historyData[historyData.length - 2];
                    setPreviousDayData({
                        sleep: yesterday.sleep,
                        energy: yesterday.energy,
                        focus: yesterday.focus,
                    });
                }
                
                setGraphLoading(false);
                setPageLoading(false);
            }).catch(err => {
                console.error('Error loading journal data:', err);
                setPageLoading(false);
                setGraphLoading(false);
            });
        }
    }, [userId]);

    const handleSave = async () => {
        if (!userId) return;
        
        setIsSaving(true);
        setError(null);
        
        const stressScore = (answers['stressed'] ? 7 : 3) + (answers['anxious'] ? 2 : 0);
        const motivationScore = answers['focused'] ? 8 : answers['good_mood'] ? 7 : 5;
        const digestionScore = answers['digestion_ok'] ? 8 : 4;

        const result = await saveDailyMetrics(userId, { 
            sleep, 
            energy, 
            focus,
            mood,
            stress: stressScore,
            motivation: motivationScore,
            digestion: digestionScore,
            tags: Object.entries(answers)
                .filter(([_, v]) => v === true)
                .map(([k]) => k),
            notes: notes.trim() || undefined,
        });

        setIsSaving(false);

        if (result.success) {
            setSaved(true);
            if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
            
            // Update lokaler State
            setTodayData({ sleep, energy, focus, mood });
            setHasLoggedToday(true);
            setIsEditMode(false);
            
            // XP nur beim ersten Log
            if (isFirstLog) {
                triggerMessage('journalComplete');
                setIsFirstLog(false);
            }
            
            // Update Graph
            const newAverage = Math.round(((sleep + energy + focus + mood) / 4) * 10);
            setGraphData(prev => [...prev.slice(-6), newAverage]);
            
            setTimeout(() => setSaved(false), 2000);
        } else {
            setError(result.error || 'Fehler beim Speichern');
        }
    };

    const answeredCount = Object.values(answers).filter(v => v !== null && v !== undefined).length;
    const { positive, negative } = getAnswerScore();

    // Loading State
    if (pageLoading || userLoading) {
        return (
            <div className="flex flex-col min-h-screen pb-28">
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                    />
                </div>
                <BottomNav />
            </div>
        );
    }

    // ========================================
    // BEREITS GELOGGT - Success State
    // ========================================
    if (hasLoggedToday && !isEditMode) {
        return (
            <div className="flex flex-col min-h-screen pb-28">
                <header className="px-6 pt-8 pb-4">
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </header>

                <main className="flex-1 px-6 space-y-6">
                    {/* Success Header */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-2xl p-6 border border-primary/30 text-center relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                        
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="relative z-10"
                        >
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Check size={40} className="text-primary" strokeWidth={3} />
                                </motion.div>
                            </div>
                            
                            <h2 className="text-xl font-bold text-foreground mb-1">
                                {t('alreadyLogged')}
                            </h2>
                        </motion.div>
                    </motion.section>

                    {/* Score Card */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel rounded-2xl p-5 border border-white/5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('yourScoreToday')}
                            </h3>
                            {trend && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                                    trend.direction === 'up' && "bg-green-500/20 text-green-400",
                                    trend.direction === 'down' && "bg-red-500/20 text-red-400",
                                    trend.direction === 'stable' && "bg-white/10 text-muted-foreground"
                                )}>
                                    {trend.direction === 'up' && <TrendingUp size={12} />}
                                    {trend.direction === 'down' && <TrendingDown size={12} />}
                                    {trend.direction === 'stable' && <Minus size={12} />}
                                    {trend.diff > 0 ? '+' : ''}{trend.diff} {t('vsYesterday')}
                                </div>
                            )}
                        </div>
                        
                        {/* Big Score */}
                        <div className="text-center mb-6">
                            <motion.div 
                                className="text-6xl font-black text-primary"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                            >
                                {totalScore}%
                            </motion.div>
                            <div className="text-xs text-muted-foreground mt-1">{t('bioPerformance')}</div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: 'Sleep', value: todayData?.sleep || 0, icon: Moon, color: 'text-indigo-400' },
                                { label: 'Energy', value: todayData?.energy || 0, icon: Zap, color: 'text-amber-400' },
                                { label: 'Focus', value: todayData?.focus || 0, icon: Target, color: 'text-emerald-400' },
                                { label: 'Mood', value: todayData?.mood || 0, icon: Sparkles, color: 'text-pink-400' },
                            ].map((metric, i) => (
                                <motion.div
                                    key={metric.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    className="bg-white/5 rounded-xl p-3 text-center"
                                >
                                    <metric.icon size={16} className={cn("mx-auto mb-1", metric.color)} />
                                    <div className="text-lg font-bold text-foreground">{metric.value}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{metric.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Graph */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <ActivityGraph data={graphData} loading={graphLoading} />
                    </motion.div>

                    {/* Countdown & Edit */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel rounded-2xl p-5 border border-white/5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Clock size={18} className="text-primary" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-foreground">{t('nextLog')}</div>
                                    <div className="text-xs text-muted-foreground">{t('inTime', { time: timeUntilMidnight })}</div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-foreground hover:bg-white/10 transition-colors"
                            >
                                <Pencil size={14} />
                                {tCommon('edit')}
                            </button>
                        </div>
                    </motion.section>

                    {/* Motivation Footer */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-center py-4"
                    >
                        <p className="text-sm text-muted-foreground">
                            {t('untilTomorrow')}
                        </p>
                    </motion.div>
                </main>

                <BottomNav />
            </div>
        );
    }

    // ========================================
    // LOGGING / EDIT MODE - Normal Form
    // ========================================
    return (
        <div className="flex flex-col min-h-screen pb-28">
            <header className="px-6 pt-8 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {isEditMode ? t('editTitle') : t('title')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditMode ? t('subtitleEdit') : t('subtitle')}
                        </p>
                    </div>
                    {isEditMode && (
                        <button
                            onClick={() => setIsEditMode(false)}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-muted-foreground" />
                        </button>
                    )}
                </div>
                
                {/* Beschreibung für Zeitraum */}
                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs text-primary/80">
                        Reflektiere: Wie war dein <strong>gestriger Tag</strong> und deine <strong>Nacht auf heute</strong>?
                    </p>
                </div>
            </header>

                <main className="flex-1 px-6 space-y-6">
                    <ActivityGraph data={graphData} loading={graphLoading} />

                {/* Slider Section */}
                <section className="glass-panel rounded-2xl p-5 border border-white/5">
                    <button
                        type="button"
                        onClick={() => setShowSliders(!showSliders)}
                        className="w-full flex items-center justify-between mb-4"
                        aria-expanded={showSliders}
                        aria-label="Metriken anzeigen/verbergen"
                    >
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            {t('metrics')}
                        </h3>
                        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", showSliders && "rotate-180")} />
                    </button>
                    
                    <AnimatePresence>
                        {showSliders && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <MetricSlider label={t('sleepQuality')} value={sleep} onChange={setSleep} icon={<Moon size={18} />} />
                                <MetricSlider label={t('energy')} value={energy} onChange={setEnergy} icon={<Zap size={18} />} />
                                <MetricSlider label={t('focus')} value={focus} onChange={setFocus} icon={<Target size={18} />} />
                                <MetricSlider label={t('mood')} value={mood} onChange={setMood} icon={<Sparkles size={18} />} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Whoop-Style Questions */}
                {(Object.entries(JOURNAL_QUESTION_STRUCTURE) as [CategoryKey, typeof JOURNAL_QUESTION_STRUCTURE[CategoryKey]][]).map(([categoryKey, questions]) => (
                    <section key={categoryKey} className="glass-panel rounded-2xl p-5 border border-white/5">
                        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                            {t(`categories.${categoryKey}`)}
                        </h3>
                        <div className="space-y-3">
                            {questions.map((q) => (
                                <motion.div 
                                    key={q.id} 
                                    className="flex items-center justify-between"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    <span className="text-sm text-foreground">{t(`questions.${q.id}`)}</span>
                                    <div className="flex gap-2">
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setAnswer(q.id, false);
                                                if (navigator.vibrate) navigator.vibrate(15);
                                            }}
                                            aria-label={`${t(`questions.${q.id}`)} - No`}
                                            aria-pressed={answers[q.id] === false}
                                            className={cn(
                                                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors relative overflow-hidden",
                                                answers[q.id] === false
                                                    ? "bg-white/20 text-white"
                                                    : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
                                            )}
                                            whileTap={{ scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <motion.div animate={answers[q.id] === false ? { rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                                                <X size={18} strokeWidth={2.5} aria-hidden="true" />
                                            </motion.div>
                                        </motion.button>
                                        
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setAnswer(q.id, true);
                                                if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                                            }}
                                            aria-label={`${t(`questions.${q.id}`)} - Yes`}
                                            aria-pressed={answers[q.id] === true}
                                            className={cn(
                                                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors relative overflow-hidden",
                                                answers[q.id] === true
                                                    ? q.positive 
                                                        ? "bg-primary text-primary-foreground" 
                                                        : "bg-orange-500 text-white"
                                                    : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
                                            )}
                                            whileTap={{ scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                            style={answers[q.id] === true && q.positive ? { boxShadow: '0 0 20px rgba(167,243,208,0.4)' } : {}}
                                        >
                                            <motion.div animate={answers[q.id] === true ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                                                <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                                            </motion.div>
                                            {answers[q.id] === true && q.positive && (
                                                <motion.div
                                                    className="absolute inset-0 bg-white/20 rounded-xl"
                                                    initial={{ scale: 0, opacity: 0.5 }}
                                                    animate={{ scale: 2, opacity: 0 }}
                                                    transition={{ duration: 0.4 }}
                                                />
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                ))}
                
                {/* Notes Section */}
                <section className="glass-panel rounded-2xl p-5 border border-white/5">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                        {t('notes')}
                    </h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                        placeholder={t('notesPlaceholder')}
                        aria-label={t('notes')}
                        className="w-full h-20 p-3 bg-white/5 border border-white/10 rounded-xl text-foreground text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{answeredCount}/{ALL_QUESTION_IDS.length} {t('answered')}</span>
                        <span>{notes.length}/280</span>
                    </div>
                </section>
                
                {/* Summary & Save */}
                <section className="space-y-3">
                    <AnimatePresence>
                        {answeredCount > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex justify-center gap-6 text-sm"
                            >
                                <motion.span className="flex items-center gap-1.5 text-primary" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.3 }} key={`pos-${positive}`}>
                                    <Check size={16} strokeWidth={3} aria-hidden="true" />
                                    {positive} {t('positive')}
                                </motion.span>
                                <motion.span className="flex items-center gap-1.5 text-muted-foreground" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.3 }} key={`neg-${negative}`}>
                                    <X size={16} strokeWidth={3} aria-hidden="true" />
                                    {negative} {t('negative')}
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <motion.button
                        onClick={() => {
                            handleSave();
                            if (navigator.vibrate) navigator.vibrate([20, 40, 20, 40, 20]);
                        }}
                        disabled={isSaving || saved}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        aria-label={isEditMode ? 'Änderungen speichern' : 'Journal speichern'}
                        className={cn(
                            "w-full font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed relative overflow-hidden",
                            saved 
                                ? "bg-green-500 text-white" 
                                : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isSaving ? (
                                <motion.div key="saving" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                        <Save size={20} aria-hidden="true" />
                                    </motion.div>
                                    <span>{t('saving')}</span>
                                </motion.div>
                            ) : saved ? (
                                <motion.div key="saved" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-2">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.4 }}>
                                        <Check size={24} strokeWidth={3} aria-hidden="true" />
                                    </motion.div>
                                    <span>{t('saved')}</span>
                                </motion.div>
                            ) : (
                                <motion.div key="save" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                                    <Save size={20} aria-hidden="true" />
                                    <span>{isEditMode ? t('saveChanges') : t('saveEntry')}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {saved && (
                            <>
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-white rounded-full"
                                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                        animate={{ x: Math.cos(i * 45 * Math.PI / 180) * 60, y: Math.sin(i * 45 * Math.PI / 180) * 30, opacity: 0, scale: 0 }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                    />
                                ))}
                            </>
                        )}
                    </motion.button>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm"
                            role="alert"
                        >
                            <AlertCircle size={16} aria-hidden="true" />
                            {error}
                        </motion.div>
                    )}
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
