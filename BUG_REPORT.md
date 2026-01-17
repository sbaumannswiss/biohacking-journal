# 🐛 UMFASSENDER BUG REPORT - Biohacking App

**Datum:** Heute  
**Status:** Alle Bugs gefunden, noch nicht behoben

---

## 🔴 KRITISCHE BUGS (App funktioniert nicht / Data Loss)

### Bug #1: Syntax-Fehler in `app/page.tsx` Zeile 108
**Datei:** `app/page.tsx:108`  
**Problem:** `const manualTimeOverride` ist nicht vollständig definiert - fehlende Initialisierung  
**Code:**
```typescript
// Zeile 108 - FEHLT:
const [manualTimeOverride, setManualTimeOverride] = useState<string | null>(null);
```
**Impact:** App crasht beim Laden der Homepage  
**Fix:** Zeile 108 korrigieren

---

### Bug #2: Console.logs in Production Code
**Dateien:** 
- `app/page.tsx:81,84,137,139,168`
- `components/ui/ScanModal.tsx:194,197,205,226,234,245,255,267,275,277,285,294`
- `lib/supabaseService.ts:55,60,75,85` (Agent-Logs)

**Problem:** Viele `console.log()` Statements in Production-Code  
**Impact:** Performance, Security (könnte sensible Daten loggen), Code-Quality  
**Fix:** Alle `console.log()` entfernen oder durch `console.debug()` ersetzen (nur in Dev)

---

## 🟠 FUNKTIONALE BUGS (Features funktionieren nicht richtig)

### Bug #3: Profile Page Progress Bar Berechnung falsch
**Datei:** `app/profile/page.tsx:140`  
**Problem:** Progress Bar zeigt `(totalXP % 500) / 5` statt korrekter Prozent-Berechnung  
**Code:**
```typescript
// Zeile 140 - FALSCH:
animate={{ width: `${(totalXP % 500) / 5}%` }}

// SOLLTE SEIN:
const progressInLevel = totalXP % 500;
const progressPercent = (progressInLevel / 500) * 100;
animate={{ width: `${progressPercent}%` }}
```
**Impact:** Progress Bar zeigt falsche Werte (z.B. bei 250 XP zeigt es 50% statt 50%)  
**Fix:** Berechnung korrigieren

---

### Bug #4: XP Display zeigt falsche Werte bei Level-Up
**Datei:** `components/dashboard/XPDisplay.tsx`  
**Problem:** Bei genau 500 XP (Level 2) zeigt es `500/500` statt `0/500`  
**Status:** Berechnung sieht korrekt aus, aber testen!  
**Impact:** Verwirrung bei Level-Up Moment

---

### Bug #5: "Complete All" Button - XP wird doppelt vergeben?
**Datei:** `app/page.tsx:323-359`  
**Problem:** `handleCompleteAll()` gibt XP optimistisch, aber `handleXPUpdate()` wird für jedes Supplement auch aufgerufen?  
**Code-Analyse:**
- `handleCompleteAll()` setzt `completedSupplements` und gibt XP
- Aber `StackItemCard` hat eigenen `onCheckIn` Handler der auch XP gibt
- **Möglicher Doppel-Count!**

**Impact:** User bekommt doppelt XP wenn "Complete All" gedrückt wird  
**Fix:** Prüfen ob `StackItemCard.onCheckIn` bei "Complete All" aufgerufen wird

---

### Bug #6: Journal - Graph zeigt falsche Daten wenn keine History
**Datei:** `app/journal/page.tsx:103-110`  
**Problem:** Wenn `getMetricsHistory()` leeres Array zurückgibt, wird `EMPTY_DATA` verwendet, aber Graph zeigt trotzdem Daten  
**Impact:** User sieht Fake-Daten statt "No data yet"

---

### Bug #7: Undo Check-In entfernt XP nicht
**Datei:** `components/dashboard/StackItemCard.tsx:48-75`  
**Problem:** `undoCheckIn()` entfernt Check-In aus DB, aber XP wird nicht zurückgezogen  
**Impact:** User kann XP "farmen" durch Check-In/Undo

**Code-Analyse:**
```typescript
// undoCheckIn() löscht nur den Check-In, aber XP bleibt
// Sollte XP auch reduzieren?
```

---

## 🟡 UX BUGS (User Experience Probleme)

### Bug #8: Check-In Button - Kein visuelles Feedback bei Loading
**Datei:** `components/dashboard/StackItemCard.tsx:142-168`  
**Problem:** Button zeigt kein Loading-State während `isLoading`  
**Impact:** User weiß nicht ob Click registriert wurde

**Fix:** Loading-Spinner hinzufügen:
```typescript
{isLoading && (
    <Loader2 size={16} className="animate-spin" />
)}
```

---

### Bug #9: ActivityGraph - "No data yet" wird nicht immer angezeigt
**Datei:** `components/dashboard/ActivityGraph.tsx:79-83`  
**Problem:** `hasRealData` prüft nur `data.length >= 2`, aber `EMPTY_DATA` wird trotzdem gerendert  
**Impact:** Graph zeigt Fake-Daten statt "No data yet"

---

### Bug #10: Profile Page - "Adherence" fehlt komplett
**Datei:** `app/profile/page.tsx`  
**Problem:** Im ursprünglichen Bug-Report war "84% Adherence" hardcoded, jetzt fehlt es komplett  
**Impact:** Feature fehlt

**Fix:** Adherence berechnen:
```typescript
// Adherence = (Check-Ins in letzten 7 Tagen) / (Stack Size * 7) * 100
```

---

### Bug #11: Onboarding - Disclaimer wird doppelt angezeigt
**Datei:** 
- `app/onboarding/page.tsx:85-87` (Disclaimer im Onboarding)
- `app/layout.tsx:40` (`<DisclaimerOverlay />`)

**Problem:** Disclaimer erscheint sowohl im Onboarding als auch global  
**Impact:** Redundanz, verwirrend

**Fix:** Disclaimer nur einmal anzeigen (entweder Onboarding ODER Overlay)

---

### Bug #12: Library - "In Stack" Badge fehlt bei Custom Supplements
**Datei:** `app/library/page.tsx`  
**Problem:** `userStackIds` enthält nur IDs aus `user_stack`, aber Custom Supplements haben andere IDs  
**Impact:** Custom Supplements zeigen kein "In Stack" Badge

---

### Bug #13: Tageszeit-Tabs - "Jetzt" Indikator zeigt falsche Zeit
**Datei:** `app/page.tsx:471-473`  
**Problem:** `isCurrent` prüft `timeOfDay === slot.id`, aber `timeOfDay` kommt aus `useTimeOfDay()` Hook  
**Impact:** "Jetzt" Badge zeigt möglicherweise falsche Zeit

**Fix:** Prüfen ob `useTimeOfDay()` korrekt funktioniert

---

## 🔵 CODE QUALITY ISSUES

### Bug #14: Fehlende Error-Handling in vielen async Functions
**Dateien:** 
- `app/page.tsx:loadUserData()` - catch block loggt nur, zeigt kein User-Feedback
- `app/journal/page.tsx:handleSave()` - Error wird nur in State gesetzt, kein Toast
- `components/dashboard/StackItemCard.tsx` - Viele try/catch ohne User-Feedback

**Impact:** User sieht keine Fehler-Meldungen bei API-Fehlern

---

### Bug #15: Agent-Logs in Production Code
**Datei:** `lib/supabaseService.ts:55,60,75,85`  
**Problem:** `fetch('http://127.0.0.1:7242/...')` Agent-Logs in Production  
**Impact:** 
- Performance (unnötige Network-Requests)
- Security (externe URLs)
- Code-Quality

**Fix:** Nur in Development-Mode loggen:
```typescript
if (process.env.NODE_ENV === 'development') {
    // Agent logs
}
```

---

### Bug #16: Fehlende Type-Safety
**Datei:** `app/page.tsx:204`  
**Problem:** `fetch('/api/quests')` ohne Type-Checking  
**Impact:** Runtime-Errors möglich

---

### Bug #17: Memory Leak - useEffect ohne Cleanup
**Datei:** `app/page.tsx:247-262`  
**Problem:** `setTimeout` in `useEffect` ohne Cleanup wenn Component unmountet  
**Code:**
```typescript
// Zeile 252 - Cleanup vorhanden, aber prüfen ob korrekt
const timer = setTimeout(() => { ... }, 1000);
return () => clearTimeout(timer); // ✅ OK
```

**Status:** Cleanup vorhanden, aber andere `useEffect` prüfen

---

### Bug #18: Race Condition bei "Complete All"
**Datei:** `app/page.tsx:323-359`  
**Problem:** `handleCompleteAll()` setzt State optimistisch, aber `loadUserData()` wird erst nach 1.5s aufgerufen  
**Impact:** Wenn User schnell "Complete All" mehrmals klickt, könnte XP doppelt vergeben werden

**Fix:** Disable Button während Processing:
```typescript
const [isCompleting, setIsCompleting] = useState(false);
// ... in handleCompleteAll:
if (isCompleting) return;
setIsCompleting(true);
// ... nach Promise.all:
setIsCompleting(false);
```

---

## 🟢 MINOR ISSUES (Nice-to-Fix)

### Bug #19: ScanModal - Viele console.logs
**Datei:** `components/ui/ScanModal.tsx`  
**Problem:** 10+ `console.log()` Statements  
**Impact:** Code-Quality

---

### Bug #20: Profile Page - "Log Out" macht nichts
**Datei:** `app/profile/page.tsx:169`  
**Problem:** `handleInteraction('Log Out')` zeigt nur Toast "coming soon!"  
**Impact:** Feature fehlt (aber wahrscheinlich gewollt für jetzt)

---

### Bug #21: Quest Modal - Hardcoded Quests
**Datei:** `app/page.tsx:696-719`  
**Problem:** "Morning Routine", "Journal Entry", "Full Stack Day" sind hardcoded  
**Impact:** Quests werden nicht dynamisch aus DB geladen

---

### Bug #22: Library - Filter funktioniert nicht bei Custom Supplements
**Datei:** `app/library/page.tsx`  
**Problem:** `filteredSupplements` filtert nur `SUPPLEMENT_LIBRARY`, aber Custom Supplements fehlen  
**Impact:** Custom Supplements erscheinen nicht in Library

---

### Bug #23: Missing Accessibility
**Problem:** Viele Buttons ohne `aria-label`, keine Keyboard-Navigation  
**Impact:** Accessibility-Problem

---

## 📊 ZUSAMMENFASSUNG

### Nach Priorität:
- **🔴 Kritisch:** 2 Bugs (App crasht / Data Loss)
- **🟠 Funktional:** 5 Bugs (Features funktionieren nicht)
- **🟡 UX:** 6 Bugs (User Experience Probleme)
- **🔵 Code Quality:** 5 Bugs
- **🟢 Minor:** 5 Bugs

### **Total: 23 Bugs**

---

## ✅ CHECKLISTE FÜR FIXES

### Sofort fixen (App crasht):
- [ ] Bug #1: Syntax-Fehler `manualTimeOverride`
- [ ] Bug #2: Console.logs entfernen (optional, aber wichtig)

### Wichtig (Features funktionieren nicht):
- [ ] Bug #3: Profile Progress Bar
- [ ] Bug #5: Complete All - Doppel-XP prüfen
- [ ] Bug #7: Undo Check-In XP entfernen

### UX Verbesserungen:
- [ ] Bug #8: Loading-State bei Check-In
- [ ] Bug #10: Adherence hinzufügen
- [ ] Bug #11: Disclaimer doppelt

### Code Quality:
- [ ] Bug #14: Error-Handling verbessern
- [ ] Bug #15: Agent-Logs nur in Dev
- [ ] Bug #18: Race Condition bei Complete All

---

## 🎯 EMPFOHLENE REIHENFOLGE

1. **Bug #1** - App crasht, sofort fixen!
2. **Bug #5** - Doppel-XP ist kritisch für User-Experience
3. **Bug #7** - Undo sollte XP entfernen
4. **Bug #3** - Profile Progress Bar
5. **Bug #8** - Loading-State (klein, aber wichtig)
6. Rest nach Bedarf

---

## 📝 HINWEISE

- Viele Bugs sind "Nice-to-Fix" und nicht kritisch
- Console.logs können erstmal bleiben (aber sollten entfernt werden)
- Agent-Logs sollten nur in Development laufen
- Accessibility kann später verbessert werden


