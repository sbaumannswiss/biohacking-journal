'use client';

import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';
import { XPDisplay } from '@/components/dashboard/XPDisplay';
import { StackItemCard } from '@/components/dashboard/StackItemCard';
import { Flame, Clock, Droplets, Plus, FlaskConical, Loader2, Sun, Coffee, Sunset, Moon, CheckCheck, Zap, X, Trophy, Camera } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SuccessOverlay } from '@/components/ui/SuccessOverlay';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getUserStack, getUserXP, getUserStreak, logCheckIn, getTodayCheckIns, StackItem, getOnboardingProfile } from '@/lib/supabaseService';
import { useHelix, getTimeBasedGreeting } from '@/components/coach';
import { calculateLevel, getLevelProgress, XP_VALUES } from '@/lib/xpSystem';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';
import { UserQuest, createQuest } from '@/lib/agent/questService';
import { QuestCatalogModal } from '@/components/quests/QuestCatalogModal';
import { QuestItem } from '@/components/quests/QuestItem';
import { QUESTS, Quest } from '@/data/quests';
import { ScanModal } from '@/components/ui/ScanModal';
import { StreakModal } from '@/components/dashboard/StreakModal';
import { addToStack } from '@/lib/supabaseService';
import { useTranslations } from 'next-intl';
import { EmailConfirmBanner } from '@/components/auth';
import { useTourSafe } from '@/components/tour';

// Zeit-Mapping für Supplement-Filterung
// Matches against best_time values from supplements.ts
const TIME_MAP: Record<string, string[]> = {
  morning: [
    'morning', 
    'with fat',        // "Morning (with fat)"
    'empty stomach',   // "Morning (Empty Stomach)"
    'pre-task',        // "Morning / Pre-Task"
    'with caffeine',   // "Morning (with Caffeine)"
  ],
  noon: [
    'noon',
    'any time',        // "Any time", "Any time (post-workout optimal)"
    'with food',       // "With Food"
    'with meals',      // "With Meals" (Custom Supplements)
    'mustard',         // "with Mustard Seed"
    'post-workout',    // "Any time (post-workout optimal)"
  ],
  evening: [
    'evening',         // Nur "Evening" ohne Bedtime
  ],
  bedtime: [
    'bedtime',         // Nur explizit "Bedtime"
  ],
};

// Hilfsfunktion: Prüft ob ein Supplement zur Tageszeit passt
const matchesTimeOfDay = (bestTime: string, timeOfDay: string): boolean => {
  const validPatterns = TIME_MAP[timeOfDay] || [];
  const lowerBestTime = bestTime.toLowerCase();
  
  // Spezialfall: "Evening / Bedtime" soll bei BEIDEN erscheinen
  if (lowerBestTime.includes('evening') && lowerBestTime.includes('bedtime')) {
    return timeOfDay === 'evening' || timeOfDay === 'bedtime';
  }
  
  return validPatterns.some(pattern => lowerBestTime.includes(pattern));
};

// Time keys for translation lookup
const TIME_KEYS = ['morning', 'noon', 'evening', 'bedtime'] as const;
type TimeKey = typeof TIME_KEYS[number];

// Button-Style für Complete Stack (einheitlich)
const COMPLETE_BUTTON_STYLE = {
  gradient: 'from-amber-600 to-orange-600',
  text: 'text-black font-extrabold',
  shadow: 'shadow-orange-600/40',
  border: 'border-orange-500/60',
};

export default function Home() {
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useAuth();
  const userId = user?.id || null;
  const timeOfDay = useTimeOfDay();
  const { triggerMessage } = useHelix();
  const tour = useTourSafe();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  
  // Helper function to get translated time label
  const getTimeLabel = (time: string) => t(`timeSlots.${time as TimeKey}`);
  
  // User Data State
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [userStack, setUserStack] = useState<StackItem[]>([]);
  const [userName, setUserName] = useState<string>('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [completedSupplements, setCompletedSupplements] = useState<Set<string>>(new Set());
  const [showQuests, setShowQuests] = useState(false);
  const [showQuestCatalog, setShowQuestCatalog] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [helixQuests, setHelixQuests] = useState<UserQuest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [activeQuestIds, setActiveQuestIds] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false); // Race condition prevention
  
  // Manuelle Tageszeit-Auswahl (null = automatisch basierend auf Uhrzeit)
  const [manualTimeOverride, setManualTimeOverride] = useState<string | null>(null);
  
  // BottomNav Höhe für dynamische Positionierung
  const [bottomNavHeight, setBottomNavHeight] = useState(100);
  
  // BottomNav Höhe messen
  useEffect(() => {
    const measureBottomNav = () => {
      const nav = document.querySelector('[data-bottom-nav]');
      if (nav) {
        const rect = nav.getBoundingClientRect();
        setBottomNavHeight(rect.height + 16);
      }
    };
    
    measureBottomNav();
    window.addEventListener('resize', measureBottomNav);
    const timer = setTimeout(measureBottomNav, 100);
    
    return () => {
      window.removeEventListener('resize', measureBottomNav);
      clearTimeout(timer);
    };
  }, []);
  
  // Aktive Zeit: Manuelle Auswahl oder automatisch
  const activeTime = manualTimeOverride || timeOfDay;
  
  // Handler für Tab-Klick
  const handleTimeSelect = (time: string) => {
    if (time === timeOfDay) {
      // Zurück zu automatisch wenn aktuelle Zeit gewählt
      setManualTimeOverride(null);
    } else {
      setManualTimeOverride(time);
    }
  };

  // Tageszeit-Tabs Konfiguration
  const TIME_SLOTS = [
    { id: 'morning' as const, icon: Sun, emoji: '☀️' },
    { id: 'noon' as const, icon: Coffee, emoji: '🌤️' },
    { id: 'evening' as const, icon: Sunset, emoji: '🌅' },
    { id: 'bedtime' as const, icon: Moon, emoji: '🌙' },
  ];

  // Level-Berechnung jetzt aus @/lib/xpSystem importiert
  // getNextLevelXP nicht mehr benötigt - XPDisplay berechnet alles intern

  // Daten laden
  const loadUserData = useCallback(async () => {
    if (!userId) return;
    
    setDataLoading(true);
    
    try {
      const [stackData, xpData, streakData, todayCheckIns, profileData] = await Promise.all([
        getUserStack(userId),
        getUserXP(userId),
        getUserStreak(userId),
        getTodayCheckIns(userId),
        getOnboardingProfile(userId)
      ]);
      
      // Namen aus Profil setzen
      if (profileData?.name) {
        setUserName(profileData.name);
      }
      
      // Stack-Einträge mit lokalen Supplement-Daten anreichern
      // ABER: Custom-Supplements behalten ihre Daten aus getUserStack
      const enrichedStack = stackData.map(item => {
        // Wenn schon Supplement-Daten vorhanden (z.B. Custom), nicht überschreiben
        if (item.supplement) {
          return item;
        }
        // Sonst aus lokaler Library laden
        const supplement = SUPPLEMENT_LIBRARY.find(s => s.id === item.supplement_id);
        return {
          ...item,
          supplement: supplement || undefined
        };
      });
      
      setUserStack(enrichedStack);
      setUserXP(xpData);
      setUserLevel(calculateLevel(xpData));
      setStreak(streakData);
      
      // Bereits heute abgehakte Supplements setzen
      setCompletedSupplements(new Set(todayCheckIns));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [userId]);

  // Onboarding & Auth Check
  useEffect(() => {
    // Warte bis Auth-Loading abgeschlossen ist
    if (userLoading) return;
    
    const hasOnboarded = localStorage.getItem('stax_onboarding_completed');
    
    // Wenn nicht onboarded, zum Onboarding
    if (!hasOnboarded) {
      router.push('/onboarding');
      return;
    }
    
    // Kein Auth-Redirect - Login findet im Onboarding statt, anonyme Nutzung erlaubt
    setLoading(false);
  }, [router, userLoading, isAuthenticated]);

  // Daten laden wenn User-ID verfügbar
  useEffect(() => {
    if (!loading) {
      if (userId) {
        loadUserData();
      } else {
        // Keine userId - trotzdem dataLoading beenden
        setDataLoading(false);
      }
    }
  }, [userId, loading, loadUserData]);

  // Lade Helix-Quests wenn Modal geöffnet wird
  useEffect(() => {
    if ((showQuests || showQuestCatalog) && userId) {
      setLoadingQuests(true);
      fetch(`/api/quests?userId=${userId}`)
        .then(res => {
          if (!res.ok) throw new Error('Quest API request failed');
          return res.json();
        })
        .then(data => {
          setHelixQuests(data.quests || []);
          // Extrahiere IDs für aktive Quests (sowohl Helix als auch aus Katalog)
          const ids = (data.quests || []).map((q: UserQuest) => q.id);
          setActiveQuestIds(ids);
        })
        .catch(err => {
          console.error('Failed to load quests:', err);
          setHelixQuests([]);
          setActiveQuestIds([]);
        })
        .finally(() => setLoadingQuests(false));
    }
  }, [showQuests, showQuestCatalog, userId]);

  // Quest aus Katalog annehmen
  const handleAcceptCatalogQuest = async (quest: Quest) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quest: {
            title: quest.title,
            description: quest.description,
            xp_reward: quest.xp,
            duration: quest.duration,
            category: quest.category,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Quest API request failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setActiveQuestIds(prev => [...prev, quest.id]);
        triggerMessage('questUnlocked', { questName: quest.title });
      } else {
        console.error('Quest accept failed:', data.error);
        triggerMessage('error');
      }
    } catch (error) {
      console.error('Error accepting quest:', error);
      triggerMessage('error');
    }
  };

  // Helix Greeting beim ersten Laden
  useEffect(() => {
    if (!dataLoading && !hasGreeted && userStack.length >= 0) {
      setHasGreeted(true);
      
      // Kurze Verzögerung für bessere UX
      const timer = setTimeout(() => {
        if (userStack.length === 0) {
          triggerMessage('emptyStack');
        } else {
          triggerMessage(getTimeBasedGreeting(timeOfDay));
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dataLoading, hasGreeted, userStack.length, timeOfDay, triggerMessage]);

  // Supplements nach ausgewählter Tageszeit filtern
  const getRelevantSupplements = (forTime: string) => {
    if (!userStack.length) return [];
    
    return userStack.filter(item => {
      const bestTime = item.custom_time || item.supplement?.best_time || '';
      return matchesTimeOfDay(bestTime, forTime);
    });
  };

  const relevantSupplements = getRelevantSupplements(activeTime);
  
  // Zähle Supplements pro Zeitslot für Badge-Anzeige
  const getCountForTime = (time: string) => getRelevantSupplements(time).length;

  // Fortschritt berechnen
  const completedCount = useMemo(() => 
    relevantSupplements.filter(item => completedSupplements.has(item.supplement_id)).length,
    [relevantSupplements, completedSupplements]
  );
  
  const progressPercent = relevantSupplements.length > 0 
    ? (completedCount / relevantSupplements.length) * 100 
    : 0;
  
  // Prüfen ob alle Supplements für die aktive Zeit abgehakt sind
  const allCompleted = relevantSupplements.length > 0 && completedCount === relevantSupplements.length;

  // Einzelnes Supplement abhaken
  // NEUES XP-SYSTEM: XP wird nicht mehr pro Supplement vergeben!
  // XP basiert auf: Journal (50) + Stack Complete (25) + Streak Boni
  const handleXPUpdate = async (supplementName?: string, supplementId?: string) => {
    if (supplementId) {
      setCompletedSupplements(prev => new Set([...prev, supplementId]));
    }
    
    setShowSuccess(true);
    
    // Normaler Check-in ohne XP-Anzeige
    triggerMessage('checkIn', { 
      supplement: supplementName || 'Supplement'
    });
    
    // Reload data to sync (XP wird neu berechnet)
    setTimeout(() => loadUserData(), 1000);
  };

  // Alle Supplements auf einmal abhaken
  // NEUES XP-SYSTEM: XP wird nicht mehr pro Supplement vergeben!
  // XP basiert auf: Journal (50) + Stack Complete (25) + Streak Boni
  const handleCompleteAll = async () => {
    // Race condition prevention
    if (isCompleting || relevantSupplements.length === 0 || allCompleted) return;
    
    // Nur nicht-erledigte Supplements
    const uncompletedSupplements = relevantSupplements.filter(
      item => !completedSupplements.has(item.supplement_id)
    );
    
    if (uncompletedSupplements.length === 0) return;
    
    setIsCompleting(true);
    
    // Haptic Feedback
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
    
    // Alle als completed markieren
    const allIds = uncompletedSupplements.map(item => item.supplement_id);
    setCompletedSupplements(prev => new Set([...prev, ...allIds]));
    
    setShowSuccess(true);
    
    // Stack Complete Nachricht
    triggerMessage('allDone');
    
    // Supabase Logging nur für neue Check-Ins
    if (userId) {
      for (const item of uncompletedSupplements) {
        logCheckIn(userId, item.supplement_id).catch(console.error);
      }
    }
    
    // Reload data to sync und isCompleting zurücksetzen
    // XP wird bei loadUserData() neu berechnet
    setTimeout(() => {
      loadUserData();
      setIsCompleting(false);
    }, 1500);
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28">
      <SuccessOverlay
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        streak={streak}
      />

      {/* Header Section */}
      <header data-tour-id="home-dashboard" className="px-4 pt-8 pb-4 relative">
        {/* E-Mail Bestätigungs-Banner */}
        <EmailConfirmBanner className="mb-4" />
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Profile Avatar */}
            <button
              type="button"
              onClick={() => router.push('/profile')}
              aria-label="Profil öffnen"
              className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {userName ? userName.charAt(0).toUpperCase() : 'B'}
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary/80">
                {t(`greeting.${timeOfDay as TimeKey}`)},
              </h1>
              <span className="text-primary font-bold text-xl">{userName || t('biohacker')}</span>
            </div>
          </div>
        </div>

        {/* XP Display + Buttons - Grid Layout für gleiche Höhe */}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          {/* XP Display - links */}
          <XPDisplay xp={userXP} />

          {/* Buttons - rechts, 3er Grid */}
          <div className="grid grid-rows-3 gap-1.5">
            <button
              type="button"
              onClick={() => setShowQuests(true)}
              aria-label={t('quests.active')}
              className="flex items-center justify-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-all min-w-[90px]"
            >
              <Zap size={12} fill="currentColor" />
              <span className="text-[11px] font-bold">{t('quests.active')}</span>
              {helixQuests.length > 0 && (
                <span className="min-w-[14px] h-[14px] flex items-center justify-center bg-purple-500 text-white text-[8px] font-bold rounded-full" aria-hidden="true">
                  {helixQuests.length}
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setShowQuestCatalog(true)}
              aria-label={t('quests.catalog')}
              className="flex items-center justify-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
            >
              <Trophy size={12} />
              <span className="text-[11px] font-bold">{t('quests.catalog')}</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowStreakModal(true)}
              aria-label={t('streak.daysStreak', { count: streak })}
              className="flex items-center justify-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl text-orange-400 hover:bg-orange-500/20 active:scale-95 transition-all"
            >
              <Flame size={12} fill="currentColor" className="animate-pulse-slow" aria-hidden="true" />
              <span className="font-mono font-bold text-[11px]">{streak}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tageszeit-Tabs - Grid für volle Sichtbarkeit */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-4 gap-2">
          {TIME_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const count = getCountForTime(slot.id);
            const isActive = activeTime === slot.id;
            const isCurrent = timeOfDay === slot.id;
            
            return (
              <button
                type="button"
                key={slot.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTimeSelect(slot.id);
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl font-medium text-xs transition-all relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                  isCurrent && !isActive && "ring-1 ring-primary/30"
                )}
              >
                <div className="flex items-center gap-1">
                  <Icon size={14} className={isActive ? "text-primary-foreground" : ""} />
                  <span>{getTimeLabel(slot.id)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {count > 0 && (
                    <span className={cn(
                      "min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold",
                      isActive ? "bg-white/20 text-primary-foreground" : "bg-primary/20 text-primary"
                    )}>
                      {count}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Jetzt" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stack Header Row */}
      <div className="px-4 flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={14} />
          <h2 className="text-xs font-semibold uppercase tracking-wider">
            {t('stack', { time: getTimeLabel(activeTime) })}
            {activeTime === timeOfDay && (
              <span className="ml-1.5 text-[10px] text-primary font-normal"> {t('stackNow')}</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="p-3 min-w-11 min-h-11 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center justify-center"
            title={t('scanSupplement')}
            aria-label={t('scanSupplement')}
          >
            <Camera size={22} aria-hidden="true" />
          </button>
          <Link 
            href="/library" 
            className="p-3 min-w-11 min-h-11 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 active:scale-95 transition-all flex items-center justify-center"
            aria-label={t('addSupplement')}
          >
            <Plus size={22} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 space-y-4">
        {dataLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <section>
            <div className="space-y-3">
              {relevantSupplements.length > 0 ? (
                <>
                  {/* Supplement List with Stagger Animation */}
                  {relevantSupplements.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <StackItemCard
                        supplementId={item.supplement_id}
                        supplementName={item.supplement?.name || 'Unknown'}
                        dosage={item.custom_dosage || item.supplement?.optimal_dosage || ''}
                        icon={item.supplement?.icon}
                        isCompleted={completedSupplements.has(item.supplement_id)}
                        defaultTime={item.custom_time}
                        isMedication={item.isMedication}
                        onCheckIn={() => handleXPUpdate(item.supplement?.name, item.supplement_id)}
                        onUndoCheckIn={async () => {
                          // Entferne aus completedSupplements
                          setCompletedSupplements(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(item.supplement_id);
                            return newSet;
                          });
                          // Reload data to update XP
                          await loadUserData();
                        }}
                        onRemove={async () => {
                          // Supabase Remove wird bereits in StackItemCard aufgerufen
                          // Hier nur State-Update und Reload
                          setUserStack(prev => prev.filter(s => s.id !== item.id));
                          await loadUserData(); // Daten neu laden
                          triggerMessage('supplementRemoved', { supplement: item.supplement?.name || 'Supplement' });
                        }}
                        onDosageUpdate={async (newDosage, newTime) => {
                          // Update local state
                          setUserStack(prev => prev.map(s => 
                            s.id === item.id 
                              ? { ...s, custom_dosage: newDosage, custom_time: newTime } 
                              : s
                          ));
                        }}
                      />
                    </motion.div>
                  ))}
                  
                  
                </>
              ) : userStack.length > 0 ? (
                // User hat Supplements, aber keine für diese Tageszeit
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                    <Droplets size={24} />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {t('noSupplementsForTime', { time: getTimeLabel(activeTime) })}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {activeTime === timeOfDay ? t('hydrateAndBreathe') : t('switchTime')}
                  </p>
                </div>
              ) : (
                // User hat noch keine Supplements im Stack
                <Link 
                  href="/library"
                  className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-primary/30 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors group"
                >
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <FlaskConical size={32} />
                  </div>
                  <p className="text-foreground font-semibold mb-1">{t('emptyStackTitle')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('emptyStackSubtitle')}</p>
                  <span className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Plus size={16} />
                    {t('openBioLab')}
                  </span>
                </Link>
              )}
            </div>
          </section>
        )}

      </div>

      {/* Sticky Complete All Button - IMMER fixed über BottomNav */}
      <AnimatePresence mode="wait">
        {relevantSupplements.length > 0 && !allCompleted && (
          <motion.div
            key="complete-button"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-0 right-0 px-4 z-40 sm:max-w-md sm:mx-auto"
            style={{ bottom: bottomNavHeight }}
          >
            <button
              type="button"
              onClick={handleCompleteAll}
              disabled={isCompleting}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all",
                "flex items-center justify-center gap-3",
                "bg-gradient-to-r",
                COMPLETE_BUTTON_STYLE.gradient,
                COMPLETE_BUTTON_STYLE.text,
                "shadow-lg",
                COMPLETE_BUTTON_STYLE.shadow,
                "hover:opacity-95 active:scale-[0.98]",
                "border",
                COMPLETE_BUTTON_STYLE.border,
                isCompleting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isCompleting ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <CheckCheck size={22} strokeWidth={2.5} />
              )}
              <span>
                {t('completeStack')}
                <span className="ml-2 opacity-80">({completedCount}/{relevantSupplements.length})</span>
              </span>
            </button>
          </motion.div>
        )}

        {/* Success State - immer fixed über BottomNav */}
        {relevantSupplements.length > 0 && allCompleted && (
          <motion.div
            key="complete-success"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-0 right-0 px-4 z-40 sm:max-w-md sm:mx-auto"
            style={{ bottom: bottomNavHeight }}
          >
            <div className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 bg-primary/20 text-primary border border-primary/30">
              <CheckCheck size={22} strokeWidth={2.5} />
              <span>{t('stackComplete')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quests Modal */}
      <AnimatePresence>
        {showQuests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowQuests(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-panel rounded-2xl p-6 border border-purple-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t('quests.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('quests.subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuests(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* Standard Quest Items - dynamisch basierend auf User-Daten */}
              {/* NEUES XP-SYSTEM: Nur Journal (50 XP) + Stack Complete (25 XP) + Streak Boni */}
              <div className="space-y-3">
                {/* Morning Routine - Fortschrittsanzeige ohne separates XP */}
                {getRelevantSupplements('morning').length > 0 && (
                  <QuestItem 
                    title={t('quests.morningRoutine')}
                    description={t('quests.morningRoutineDesc')}
                    xp={0}
                    progress={getRelevantSupplements('morning').filter(s => completedSupplements.has(s.supplement_id)).length}
                    total={getRelevantSupplements('morning').length}
                    completed={getRelevantSupplements('morning').every(s => completedSupplements.has(s.supplement_id))}
                  />
                )}
                
                {/* Journal Entry - 50 XP im neuen System */}
                <QuestItem 
                  title={t('quests.journalEntry')}
                  description={t('quests.journalEntryDesc')}
                  xp={XP_VALUES.JOURNAL_LOGGED}
                  progress={0}
                  total={1}
                  completed={false}
                />
                
                {/* Full Stack Day - 25 XP im neuen System */}
                {userStack.length > 0 && (
                  <QuestItem 
                    title={t('quests.fullStackDay')}
                    description={t('quests.fullStackDayDesc')}
                    xp={XP_VALUES.STACK_COMPLETE}
                    progress={completedSupplements.size}
                    total={userStack.length}
                    completed={completedSupplements.size === userStack.length}
                  />
                )}
                
                {/* Streak Quest - Bonus bei Meilensteinen */}
                {streak > 0 && (
                  <QuestItem 
                    title={t('quests.streakKeeper')}
                    description={t('quests.streakKeeperDesc', { streak })}
                    xp={streak % 7 === 0 ? XP_VALUES.STREAK_7_DAYS : 0}
                    progress={completedSupplements.size > 0 ? 1 : 0}
                    total={1}
                    completed={completedSupplements.size > 0}
                  />
                )}
              </div>

              {/* Helix Quests */}
              {helixQuests.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Helix Quests
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {helixQuests.map((quest) => (
                      <QuestItem
                        key={quest.id}
                        title={quest.title}
                        description={quest.description}
                        xp={quest.xp_reward}
                        progress={quest.current_value}
                        total={quest.target_value || 1}
                        completed={quest.status === 'completed'}
                        isHelix
                      />
                    ))}
                  </div>
                </div>
              )}

              {loadingQuests && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-muted-foreground">
                  {t('quests.resetInfo')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest Katalog Modal */}
      <QuestCatalogModal
        isOpen={showQuestCatalog}
        onClose={() => setShowQuestCatalog(false)}
        userLevel={userLevel}
        onAcceptQuest={handleAcceptCatalogQuest}
        activeQuestIds={activeQuestIds}
      />

      {/* Streak Modal */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streak={streak}
      />

      {/* Scan Modal */}
      <ScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        userId={userId || undefined}
        onAddToStack={async (supplementId, dosage) => {
          if (!userId) return;
          try {
            await addToStack(userId, supplementId, dosage);
            await loadUserData();
            triggerMessage('supplementAdded', { supplement: supplementId });
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          } catch (error) {
            console.error('Error adding from scan:', error);
          }
        }}
        onSaveComplete={async () => {
          // Auto-Refresh nach Speichern eines Kombi-Präparats
          await loadUserData();
          triggerMessage('supplementAdded', { supplement: 'Kombi-Präparat' });
        }}
      />

      {/* DEBUG: Tour starten Button - später entfernen */}
      {tour && !tour.isActive && (
        <button
          onClick={() => tour.startTour()}
          className="fixed top-20 right-4 z-50 px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg"
        >
          Tour starten
        </button>
      )}

      <BottomNav />
    </div>
  );
}
