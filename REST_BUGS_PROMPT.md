# 🔧 RESTLICHE BUGS - FIX PROMPT
## (Library ist bereits fertig - nur noch diese Bugs)

---

## 🔴 PRIORITÄT 1: KRITISCHE DATA-LOSS BUGS

### Bug 1: Journal speichert NICHT in Supabase
**Datei:** `app/journal/page.tsx` (Zeile 17-28)

**Problem:** `handleSave()` ist nur ein Mock mit `setTimeout` - ruft nie `saveDailyMetrics()` auf!

**Fix:**
```typescript
import { saveDailyMetrics } from '@/lib/supabaseService';
import { getAnonymousUserId } from '@/hooks/useAnonymousUser';

const handleSave = async () => {
    setIsSaving(true);
    try {
        const userId = getAnonymousUserId();
        const result = await saveDailyMetrics(userId, { 
            sleep, 
            energy, 
            focus 
        });
        
        if (result.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            console.error('Fehler beim Speichern:', result.error);
            alert(result.error || 'Fehler beim Speichern der Metriken');
        }
    } catch (error) {
        console.error('Journal Save Error:', error);
        alert('Fehler beim Speichern');
    } finally {
        setIsSaving(false);
    }
};
```

---

### Bug 2: Check-In State nicht persistent
**Datei:** `app/page.tsx` (Zeile 195)

**Problem:** `completedSupplements` ist nur `useState` - nach Page-Refresh sind alle Checkboxen wieder unchecked (obwohl in DB geloggt).

**Fix 1: Neue Funktion in `lib/supabaseService.ts`:**
```typescript
/**
 * Heutige Check-Ins für einen User holen (für State-Persistence)
 */
export async function getTodayCheckIns(userId: string): Promise<string[]> {
    if (!supabase) return [];
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('check_ins')
            .select('supplement_id')
            .eq('user_id', userId)
            .gte('checked_at', `${today}T00:00:00`)
            .lte('checked_at', `${today}T23:59:59`);

        if (error) throw error;

        return data?.map(c => c.supplement_id) || [];
    } catch (error) {
        console.error('getTodayCheckIns error:', error);
        return [];
    }
}
```

**Fix 2: In `app/page.tsx` bei `loadUserData`:**
```typescript
// In loadUserData Funktion, nach getUserStack:
const todayCheckIns = await getTodayCheckIns(userId);
setCompletedSupplements(new Set(todayCheckIns));
```

---

### Bug 3: ActivityGraph zeigt Fake-Daten
**Datei:** `components/dashboard/ActivityGraph.tsx` (Zeile 8)

**Problem:** `DATA_POINTS = [20, 45, 30, 60, 55, 80, 70]` ist hardcoded.

**Fix:**
```typescript
// Neue Props hinzufügen
interface ActivityGraphProps {
    data?: number[];
    days?: number;
}

export function ActivityGraph({ data, days = 7 }: ActivityGraphProps) {
    // Fallback auf leere Anzeige wenn keine Daten
    if (!data || data.length === 0) {
        return (
            <div className="w-full glass-panel rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Bio-Performance Trend
                </h3>
                <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">
                    Noch keine Daten verfügbar
                </div>
            </div>
        );
    }

    const DATA_POINTS = data; // Verwende echte Daten
    // ... rest bleibt gleich
}
```

**In `app/journal/page.tsx`:**
```typescript
import { getMetricsHistory } from '@/lib/supabaseService';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';

const { userId } = useAnonymousUser();
const [graphData, setGraphData] = useState<number[]>([]);

useEffect(() => {
    if (userId) {
        getMetricsHistory(userId, 7).then(metrics => {
            // Extrahiere energy_level Werte
            const energyData = metrics.map(m => m.energy_level || 0);
            setGraphData(energyData);
        });
    }
}, [userId]);

// Dann:
<ActivityGraph data={graphData} />
```

---

### Bug 4: DisclaimerOverlay wird NIE angezeigt
**Datei:** `components/ui/DisclaimerOverlay.tsx` existiert, wird aber nicht verwendet!

**Fix: In `app/layout.tsx`:**
```typescript
import { DisclaimerOverlay } from '@/components/ui/DisclaimerOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="de" className="dark" suppressHydrationWarning>
            <body className={...}>
                <HelixProvider>
                    <DisclaimerOverlay /> {/* ← HINZUFÜGEN */}
                    <div className="relative flex min-h-screen flex-col ...">
                        {children}
                    </div>
                </HelixProvider>
            </body>
        </html>
    );
}
```

---

### Bug 5: Profile-Seite komplett statisch
**Datei:** `app/profile/page.tsx` (Zeile 46-53)

**Problem:** Zeigt immer "12 Day Streak" und "84% Adherence" - keine echten Daten!

**Fix:**
```typescript
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { getUserStreak, getUserXP, getUserStack } from '@/lib/supabaseService';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { userId } = useAnonymousUser();
    const [streak, setStreak] = useState(0);
    const [totalXP, setTotalXP] = useState(0);
    const [stackSize, setStackSize] = useState(0);
    const [adherence, setAdherence] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            Promise.all([
                getUserStreak(userId),
                getUserXP(userId),
                getUserStack(userId),
            ]).then(([streakData, xpData, stackData]) => {
                setStreak(streakData);
                setTotalXP(xpData);
                setStackSize(stackData.length);
                
                // Adherence: Placeholder für jetzt (kann später berechnet werden)
                setAdherence(84); // TODO: Echte Berechnung
                setIsLoading(false);
            });
        }
    }, [userId]);

    // ... im Render:
    {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
    ) : (
        <>
            <div className="text-2xl font-bold text-foreground">{streak}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
        </>
    )}
```

---

## 🟠 PRIORITÄT 2: FUNKTIONALE BUGS

### Bug 6: XP Progress-Bar Berechnung falsch
**Datei:** `app/page.tsx` (Zeile 108-109)

**Problem:** Bei 500 XP = Level 2, aber `nextLevelXP(2) = 1000`. Progress zeigt `500/1000 = 50%` statt `0/500 = 0%`.

**Fix in `components/dashboard/XPDisplay.tsx`:**
```typescript
export function XPDisplay({ xp, level, nextLevelXp }: XPDisplayProps) {
    // Korrigierte Berechnung
    const currentLevelStart = (level - 1) * 500;
    const currentLevelEnd = level * 500;
    const progressInLevel = xp - currentLevelStart;
    const progress = Math.min((progressInLevel / 500) * 100, 100);

    return (
        // ... rest bleibt gleich, nur progress verwenden
    );
}
```

---

### Bug 7: Supabase ohne Error-Handling
**Datei:** `lib/supabase.ts`

**Problem:** App crasht wenn ENV Vars fehlen.

**Fix:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials missing - running in offline mode');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
```

**Dann in `lib/supabaseService.ts` überall prüfen:**
```typescript
if (!supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
}
```

---

## 🟡 PRIORITÄT 3: UX VERBESSERUNGEN

### Fix 8: CheckInButton Plus-Icon verwirrend
**Datei:** `components/dashboard/CheckInButton.tsx` (Zeile 97-104)

**Problem:** Unchecked zeigt `+` Icon - sieht aus wie "Add new" statt "Mark as done".

**Fix:**
```typescript
// Statt Plus-Icon: Leerer Kreis/Ring
{!isChecked && (
    <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-transparent flex items-center justify-center" />
)}
```

---

### Fix 9: Fortschrittsindikator für Stack
**Datei:** `app/page.tsx`

**Hinzufügen über der Supplement-Liste:**
```typescript
{relevantSupplements.length > 0 && (
    <div className="mb-4 px-6">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
                {completedCount} / {relevantSupplements.length} erledigt
            </span>
            <span className="text-xs text-primary font-mono">
                {Math.round((completedCount / relevantSupplements.length) * 100)}%
            </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-primary transition-all"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / relevantSupplements.length) * 100}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>
    </div>
)}
```

---

## 🔵 PRIORITÄT 4: CODE QUALITY

### Fix 10: Doppeltes Semikolon
**Datei:** `components/supplements/SupplementDrawer.tsx` Zeile 6
```typescript
import { cn } from '@/lib/utils';  // ← Entferne doppeltes ;;
```

### Fix 11: Console.log entfernen
**Datei:** `components/supplements/SupplementDrawer.tsx` Zeile 52
```typescript
// console.log("SupplementDrawer Rendered. isOpen:", isOpen); // ← Entfernen
```

### Fix 12: Typo in Supplement Name
**Datei:** `data/supplements.ts` Zeile 123-124
```typescript
id: 'rhodiola',  // ← Korrigiert von 'rodiola'
name: 'Rhodiola Rosea',  // ← Korrigiert von 'Rodiola Rosea'
```

---

## ✅ CHECKLISTE

Nach allen Fixes sollte:
- [ ] Journal speichert in Supabase
- [ ] Check-In Status bleibt nach Refresh erhalten
- [ ] ActivityGraph zeigt echte Daten
- [ ] Disclaimer wird beim ersten Start angezeigt
- [ ] Profile zeigt echte Statistiken
- [ ] XP Progress-Bar ist korrekt
- [ ] Supabase hat Error-Handling
- [ ] CheckInButton hat besseres Icon
- [ ] Stack hat Fortschrittsindikator
- [ ] Code-Quality Issues behoben

---

## 📝 HINWEISE

- **Library ist bereits fertig** - keine Änderungen nötig
- Alle Fixes sind vollständig dokumentiert
- Teste nach jedem Fix die Funktionalität

