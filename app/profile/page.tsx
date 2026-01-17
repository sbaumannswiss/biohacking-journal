'use client';

import { BottomNav } from '@/components/layout/BottomNav';
import { User, Settings, Shield, Award, Flame, Zap, Calendar, Loader2, TrendingUp, Watch, Scale, BarChart3, Download, Trash2, LogOut } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getUserStreak, getUserXP, getUserStack, getCheckInHistory } from '@/lib/supabaseService';
import { calculateLevel, getLevelProgress, getLevelTitle } from '@/lib/xpSystem';
import { WearableConnectCard } from '@/components/wearables';
import { getConnectedProviders, WearableProvider } from '@/lib/wearables';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const t = useTranslations('profile');
    const tCommon = useTranslations('common');
    const { user, isLoading: userLoading, signOut } = useAuth();
    const userId = user?.id || null;
    const router = useRouter();
    const [toast, setToast] = useState<string | null>(null);
    
    // DSGVO Actions
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Echte Daten aus Supabase
    const [streak, setStreak] = useState(0);
    const [totalXP, setTotalXP] = useState(0);
    const [stackSize, setStackSize] = useState(0);
    const [adherence, setAdherence] = useState(0); // Prozentuale Einhaltung
    const [dataLoading, setDataLoading] = useState(true);
    
    // Wearable State
    const [connectedWearables, setConnectedWearables] = useState<{
        provider: WearableProvider;
        connectedAt: string;
        lastSyncAt: string | null;
    }[]>([]);
    const [showWearables, setShowWearables] = useState(false);
    
    // Body metrics
    const [bodyWeight, setBodyWeight] = useState<number>(70);
    const [editingWeight, setEditingWeight] = useState(false);

    // Level Berechnung aus neuem XP-System
    const levelProgress = getLevelProgress(totalXP);
    const level = levelProgress.currentLevel;
    const levelTitle = getLevelTitle(level);
    
    // Wearables laden
    const loadWearables = useCallback(async () => {
        if (!userId) return;
        const connected = await getConnectedProviders(userId);
        setConnectedWearables(connected);
    }, [userId]);
    
    useEffect(() => {
        loadWearables();
    }, [loadWearables]);
    
    // Load body weight from localStorage
    useEffect(() => {
        const savedWeight = localStorage.getItem('user_body_weight');
        if (savedWeight) {
            const weight = parseFloat(savedWeight);
            if (weight > 0 && weight < 300) {
                setBodyWeight(weight);
            }
        }
    }, []);
    
    // Save body weight to localStorage
    const saveBodyWeight = useCallback((weight: number) => {
        if (weight > 20 && weight < 300) {
            setBodyWeight(weight);
            localStorage.setItem('user_body_weight', weight.toString());
            setEditingWeight(false);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            setDataLoading(true);
            Promise.all([
                getUserStreak(userId),
                getUserXP(userId),
                getUserStack(userId),
                getCheckInHistory(userId, 30) // Letzte 30 Tage
            ]).then(([streakData, xpData, stackData, checkInHistory]) => {
                setStreak(streakData);
                setTotalXP(xpData);
                setStackSize(stackData.length);
                
                // Adherence berechnen: Check-Ins / (Stack-Size * Tage mit mindestens einem Check-In)
                if (stackData.length > 0 && checkInHistory.length > 0) {
                    // Finde unique Tage mit Check-Ins
                    const uniqueDays = new Set(
                        checkInHistory.map(c => c.checkedAt.split('T')[0])
                    );
                    const daysWithCheckIns = uniqueDays.size;
                    
                    // Erwartete Check-Ins = Stack-Size * Tage aktiv
                    const expectedCheckIns = stackData.length * daysWithCheckIns;
                    const actualCheckIns = checkInHistory.length;
                    
                    // Adherence als Prozent (max 100%)
                    const adherencePercent = Math.min(100, Math.round((actualCheckIns / expectedCheckIns) * 100));
                    setAdherence(adherencePercent);
                } else {
                    setAdherence(0);
                }
                
                setDataLoading(false);
            }).catch(error => {
                console.error('Error loading profile data:', error);
                setDataLoading(false);
            });
        }
    }, [userId]);

    const handleInteraction = (feature: string) => {
        setToast(tCommon('comingSoon', { feature }));
        setTimeout(() => setToast(null), 2000);
    };

    // DSGVO: Datenexport
    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/user/export');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stax-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setToast('Daten wurden exportiert');
            } else {
                setToast('Export fehlgeschlagen');
            }
        } catch (error) {
            setToast('Export fehlgeschlagen');
        } finally {
            setIsExporting(false);
            setTimeout(() => setToast(null), 2000);
        }
    };

    // DSGVO: Konto löschen
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
            });
            
            if (response.ok) {
                setToast('Konto wurde gelöscht');
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            } else {
                setToast('Löschen fehlgeschlagen');
            }
        } catch (error) {
            setToast('Löschen fehlgeschlagen');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setTimeout(() => setToast(null), 2000);
        }
    };

    // Logout
    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="flex flex-col min-h-screen pb-28 relative">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-20 left-1/2 bg-primary/20 backdrop-blur-md border border-primary/50 text-foreground px-4 py-2 rounded-full text-sm font-medium z-50 pointer-events-none "
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="px-6 pt-8 pb-8 flex flex-col items-center text-center">
                <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/20 p-[2px] mb-4 "
                >
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <User size={40} className="text-muted-foreground" />
                    </div>
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-sm text-primary font-mono">
                    {dataLoading ? (
                        <span className="animate-pulse">{tCommon('loading')}</span>
                    ) : (
                        <>{t('level', { level })} • {totalXP} XP</>
                    )}
                </p>
            </header>

            <main className="flex-1 px-6 space-y-6">
                {/* Stats Grid */}
                {dataLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Flame size={18} className="text-orange-400" />
                                <span className="text-2xl font-bold text-foreground">{streak}</span>
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('dayStreak')}</div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <TrendingUp size={18} className="text-emerald-400" />
                                <span className="text-2xl font-bold text-foreground">{adherence}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('adherence')}</div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Zap size={18} className="text-primary" />
                                <span className="text-2xl font-bold text-foreground">{totalXP}</span>
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('totalXP')}</div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Award size={18} className="text-yellow-400" />
                                <span className="text-2xl font-bold text-foreground">{level}</span>
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{levelTitle}</div>
                        </div>
                    </motion.div>
                )}

                {/* XP Progress - Neues System mit steigenden Level-Anforderungen */}
                {!dataLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-4 rounded-xl"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Level {level} → {level + 1}</span>
                            <span className="text-xs text-primary font-mono">
                                {levelProgress.xpInCurrentLevel}/{levelProgress.xpRequiredForNextLevel} XP
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary/70 to-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${levelProgress.progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Wearables Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    {/* Wearables Header */}
                    <button
                        onClick={() => setShowWearables(!showWearables)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Watch size={20} className="text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium text-foreground">{t('wearables')}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {connectedWearables.length > 0 
                                        ? t('connected', { count: connectedWearables.length })
                                        : t('noWearablesConnected')}
                                </p>
                            </div>
                        </div>
                        <motion.div
                            animate={{ rotate: showWearables ? 180 : 0 }}
                            className="text-muted-foreground"
                        >
                            ▼
                        </motion.div>
                    </button>

                    {/* Wearables Content */}
                    <AnimatePresence>
                        {showWearables && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                {/* Connect Cards */}
                                {(['garmin', 'whoop', 'oura'] as WearableProvider[]).map((provider) => (
                                    <WearableConnectCard
                                        key={provider}
                                        provider={provider}
                                        isConnected={connectedWearables.some(w => w.provider === provider)}
                                        lastSync={connectedWearables.find(w => w.provider === provider)?.lastSyncAt}
                                        onConnect={loadWearables}
                                        onDisconnect={loadWearables}
                                        onSync={loadWearables}
                                        userId={userId || ''}
                                    />
                                ))}

                                {/* Hinweis: Daten sind bei Stats */}
                                {connectedWearables.length > 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                        <BarChart3 size={12} className="inline mr-1" /> {t('wearableDataHint')} <span className="text-primary font-medium">Stats</span>
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Language Switcher */}
                <div className="space-y-2">
                    <LanguageSwitcher />
                </div>
                
                {/* Body Weight */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-4 rounded-xl"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Scale size={20} className="text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-sm">Körpergewicht</h3>
                                <p className="text-xs text-muted-foreground">Für Hydration & Dosierungen</p>
                            </div>
                        </div>
                        
                        {editingWeight ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={bodyWeight}
                                    onChange={(e) => setBodyWeight(Number(e.target.value))}
                                    className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-center text-foreground font-mono"
                                    min={20}
                                    max={300}
                                    autoFocus
                                />
                                <span className="text-sm text-muted-foreground">kg</span>
                                <button
                                    onClick={() => saveBodyWeight(bodyWeight)}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingWeight(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <span className="text-lg font-bold text-foreground">{bodyWeight}</span>
                                <span className="text-sm text-muted-foreground">kg</span>
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Menu */}
                <div className="space-y-2">
                    <button
                        onClick={() => handleInteraction(t('accountSettings'))}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                        <div className="p-2 bg-white/5 rounded-lg group-hover:text-primary transition-colors">
                            <Settings size={20} />
                        </div>
                        <span className="font-medium">{t('accountSettings')}</span>
                    </button>
                    
                    <button
                        onClick={() => handleInteraction(t('achievements'))}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                        <div className="p-2 bg-white/5 rounded-lg group-hover:text-primary transition-colors">
                            <Award size={20} />
                        </div>
                        <span className="font-medium">{t('achievements')}</span>
                    </button>
                </div>

                {/* DSGVO Section */}
                <div className="space-y-2 pt-4">
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1 mb-3">
                        Datenschutz & Daten
                    </h3>
                    
                    {/* Datenexport */}
                    <button
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            {isExporting ? (
                                <Loader2 size={20} className="text-emerald-400 animate-spin" />
                            ) : (
                                <Download size={20} className="text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <span className="font-medium block">Meine Daten exportieren</span>
                            <span className="text-xs text-muted-foreground">DSGVO Art. 20 - Datenportabilität</span>
                        </div>
                    </button>

                    {/* Datenschutzerklärung */}
                    <a
                        href="/privacy"
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                        <div className="p-2 bg-white/5 rounded-lg group-hover:text-primary transition-colors">
                            <Shield size={20} />
                        </div>
                        <span className="font-medium">Datenschutzerklärung</span>
                    </a>

                    {/* Konto löschen */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-500/10 transition-colors text-left group"
                    >
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <Trash2 size={20} className="text-red-400" />
                        </div>
                        <div>
                            <span className="font-medium text-red-400 block">Konto löschen</span>
                            <span className="text-xs text-muted-foreground">DSGVO Art. 17 - Recht auf Löschung</span>
                        </div>
                    </button>
                </div>

                {/* Logout & User Info */}
                <div className="pt-8 text-center space-y-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut size={16} />
                        <span>{t('logOut')}</span>
                    </button>
                    <div className="text-[10px] text-muted-foreground/50 font-mono space-y-1">
                        <p>{user?.email}</p>
                        <p>{t('userId')}: {userId?.slice(0, 8)}...</p>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <Trash2 size={32} className="text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">Konto wirklich löschen?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Alle deine Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={18} className="animate-spin" />
                                                Wird gelöscht...
                                            </span>
                                        ) : (
                                            'Ja, Konto löschen'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="w-full py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
}
