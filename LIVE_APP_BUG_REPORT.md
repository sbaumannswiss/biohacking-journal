# 🐛 LIVE APP BUG REPORT
**URL:** https://stax.vercel.app  
**Datum:** Heute  
**Getestet:** Homepage, Library, Journal, Navigation

---

## 🔴 KRITISCHE BUGS (App funktioniert nicht richtig)

### ~~Bug #1: XP Display zeigt falsche Werte~~ ✅ KORREKT
**Status:** FALSCHER ALARM - XP System ist korrekt!  
**Erklärung:** Das XP-System verwendet eine steigende Kurve: `100 * (level - 1)^1.2`
- Level 1 → 2: 100 XP ✅ (zeigt "0/100" - KORREKT!)
- Level 2 → 3: ~230 XP
- Level 5 → 6: ~530 XP
- **NICHT** 500 XP pro Level (das war meine falsche Annahme)

**Code:** `lib/xpSystem.ts` - System ist korrekt implementiert

---

### Bug #2: Library - 3D-Carousel zeigt keine Tiefe
**Seite:** Library (`/library`)  
**Problem:** Karten sehen flach aus, keine 3D-Perspektive sichtbar  
**Erwartet:** Pokemon TCG Stil mit klarer 3D-Tiefe (Karten gehen nach hinten)  
**Impact:** Visuell nicht wie gewünscht, fehlt der "Wow"-Effekt

**Mögliche Ursachen:**
- `perspective` CSS fehlt oder ist zu niedrig
- `transform-style: preserve-3d` nicht richtig gesetzt
- `translateZ` Werte zu klein

**Fix:** Siehe `POKEMON_TCG_FIX_PROMPT.md`

---

## 🟠 FUNKTIONALE BUGS

### Bug #3: Journal - Metriken-Anzeige entfernen
**Seite:** Journal (`/journal`)  
**Problem:** Zeigt "Metriken (28/40)" - soll komplett entfernt werden  
**Code-Stelle:** `app/journal/page.tsx:491`  
**Impact:** User braucht diese Anzeige nicht

**Fix:**
```typescript
// Zeile 490-491 entfernen:
// <span className="text-xs font-normal text-primary">({sleep + energy + focus + mood}/40)</span>
```

---

### Bug #4: Journal - "+50 XP" wird vor dem Speichern angezeigt
**Seite:** Journal (`/journal`)  
**Problem:** Button zeigt "+50 XP" bevor User gespeichert hat  
**Erwartet:** "+50 XP" sollte erst NACH erfolgreichem Speichern erscheinen  
**Impact:** Verwirrend - User denkt vielleicht XP wurde schon vergeben

**Fix:**
```typescript
// Button Text ändern:
{saved ? (
    <span>Gespeichert! +50 XP</span>
) : (
    <span>Speichern</span>
)}
```

---

### Bug #5: Library - Pagination zeigt "1/96" aber nur 2-3 Karten sichtbar
**Seite:** Library (`/library`)  
**Problem:** Zeigt "1/96" aber nur 2-3 Karten sind gleichzeitig sichtbar (Pokemon TCG Stil)  
**Erwartet:** Pagination sollte klar machen dass es 96 Karten gibt, aber nur 3 gleichzeitig sichtbar  
**Impact:** Verwirrend - User denkt vielleicht es gibt nur 1 Karte

**Fix:** Pagination-Text ändern:
```typescript
// Statt "1/96" → "Karte 1 von 96" oder "1-3 von 96"
```

---

## 🟡 UX BUGS (User Experience)

### Bug #6: Homepage - "Evening Stack(jetzt)" - Leerzeichen fehlt
**Seite:** Homepage (`/`)  
**Problem:** Zeigt "Evening Stack(jetzt)" - sollte "Evening Stack (jetzt)" sein  
**Impact:** Kleiner Typo, sieht unprofessionell aus

---

### ~~Bug #7: Library - Filter-Buttons scrollen nicht~~ ✅ BEREITS IMPLEMENTIERT
**Status:** Filter-Scroll existiert bereits!  
**Code:** `app/library/page.tsx:343` - `overflow-x-auto scrollbar-hide`  
**Note:** Scrollbar ist versteckt (`scrollbar-hide`), aber Scrollen funktioniert

---

### Bug #8: Journal - "0/15 beantwortet" - Text ist korrekt, aber könnte klarer sein
**Seite:** Journal (`/journal`)  
**Problem:** Zeigt "0/15 beantwortet" - korrekt, aber könnte "0 von 15 Fragen beantwortet" sein  
**Impact:** Minor - könnte klarer sein

---

### Bug #9: Homepage - Leerer Stack zeigt große leere Fläche
**Seite:** Homepage (`/`)  
**Problem:** Wenn Stack leer ist, zeigt es große leere Fläche mit "Dein Stack ist leer"  
**Impact:** Viel leerer Raum - könnte kompakter sein

**UI-Optimierung:** 
- Leere Fläche kleiner machen
- Vielleicht Vorschläge für erste Supplements zeigen

---

### Bug #10: Library - Karten-Animation nicht smooth
**Seite:** Library (`/library`)  
**Problem:** Beim Klicken auf "Next" springt die Karte, keine smooth Slide-Animation  
**Impact:** Fühlt sich nicht premium an

**Fix:** Siehe `POKEMON_TCG_FIX_PROMPT.md` - Animationen verbessern

---

## 🔵 VISUELLE BUGS

### Bug #11: Library - Seitliche Karten nicht klar sichtbar
**Seite:** Library (`/library`)  
**Problem:** Seitliche Karten (links/rechts) sind nicht klar sichtbar - fehlt der "Peek"-Effekt  
**Erwartet:** Wie Pokemon TCG - seitliche Karten sollten einen kleinen Teil zeigen  
**Impact:** User sieht nicht dass es mehr Karten gibt

---

### Bug #12: Homepage - XP Progress Bar fehlt visuell
**Seite:** Homepage (`/`)  
**Problem:** XP zeigt nur Text "0/100", keine visuelle Progress Bar  
**Erwartet:** Sollte Progress Bar zeigen (wie in XPDisplay Component)  
**Impact:** Weniger visuell ansprechend

**Note:** XPDisplay Component existiert, aber vielleicht wird es nicht richtig gerendert?

---

### Bug #13: Journal - Graph zeigt "Noch keine Daten" - korrekt, aber könnte besser sein
**Seite:** Journal (`/journal`)  
**Problem:** Graph zeigt "Noch keine Daten" mit Icon - korrekt, aber könnte animierter sein  
**Impact:** Minor - sieht aber gut aus

---

## 🟢 MINOR ISSUES

### Bug #14: Navigation - Bottom Nav Icons könnten größer sein
**Problem:** Icons in Bottom Navigation sind relativ klein  
**Impact:** Auf Mobile schwerer zu tippen

---

### Bug #15: Library - Search-Bar könnte Placeholder-Text haben
**Seite:** Library (`/library`)  
**Problem:** Search-Bar hat Placeholder "Search supplements..." aber könnte besser sein  
**Impact:** Minor

---

### Bug #16: Homepage - "Good Evening," - Komma könnte weg
**Seite:** Homepage (`/`)  
**Problem:** "Good Evening," mit Komma - könnte "Good Evening" sein  
**Impact:** Sehr minor, aber könnte natürlicher sein

---

## 📊 ZUSAMMENFASSUNG

### Nach Priorität:
- **🔴 Kritisch:** 2 Bugs (XP falsch, 3D fehlt)
- **🟠 Funktional:** 3 Bugs (Metriken, XP-Anzeige, Pagination)
- **🟡 UX:** 5 Bugs (Typo, Scroll, Leerer Raum, etc.)
- **🔵 Visuell:** 3 Bugs (Karten, Progress Bar, Graph)
- **🟢 Minor:** 3 Bugs

### **Total: 15 Bugs gefunden** (1 war falscher Alarm)

---

## ✅ EMPFOHLENE FIXES (Top 5)

1. **Bug #2: 3D-Carousel** - Wichtig für Premium-Feel
2. **Bug #3: Metriken-Anzeige entfernen** - User braucht es nicht
3. **Bug #4: Journal XP-Anzeige** - Verwirrend
4. **Bug #7: Filter-Scroll** - Mobile UX Problem
5. **Bug #11: Seitliche Karten** - Peek-Effekt fehlt

---

## 🎯 UI-OPTIMIERUNGEN (Nicht Bugs, aber Verbesserungen)

1. **Library:** Karten könnten größer sein für bessere Lesbarkeit
2. **Homepage:** Leerer Stack könnte Vorschläge zeigen
3. **Journal:** Graph könnte animierter sein wenn Daten vorhanden
4. **Navigation:** Bottom Nav könnte aktive Seite deutlicher markieren
5. **Library:** Filter könnten kategorisiert sein (Kategorien vs. Benefits)

---

## 📝 HINWEISE

- **3D-Carousel:** Siehe `POKEMON_TCG_FIX_PROMPT.md` für detaillierte Fixes
- **XP System:** Prüfen ob überall 500 XP pro Level verwendet wird
- **Mobile:** Viele Bugs betreffen Mobile UX - sollte getestet werden
- **Performance:** 3D-Animationen könnten Performance-Probleme verursachen

---

## 🔍 GETESTETE FEATURES

✅ Onboarding Flow  
✅ Homepage Navigation  
✅ Library 3D-Carousel  
✅ Journal Form  
✅ Bottom Navigation  
✅ Tageszeit-Tabs  
✅ Empty States  

❌ Check-In Flow (kein Stack vorhanden)  
❌ Supplement hinzufügen (nicht getestet)  
❌ Stats Page (nicht getestet)  
❌ Profile Page (ignoriert wie gewünscht)  

---

## 🚀 NÄCHSTE SCHRITTE

1. ✅ **FIXED:** Bug #3 (Metriken-Anzeige entfernt)
2. ✅ **FIXED:** Bug #6 (Leerzeichen hinzugefügt)
3. **Wichtig:** Bug #2 (3D-Carousel) - siehe separaten Prompt
4. **UX:** Bug #4, #7
5. **Visuell:** Bug #11, #12
6. **Rest:** Nach Bedarf

---

## ❓ FRAGEN ZU UNKLAREN BUGS

### Bug #4: Journal "+50 XP" Button
**Frage:** Soll "+50 XP" komplett entfernt werden, oder erst nach dem Speichern anzeigen?

### Bug #5: Library Pagination "1/96"
**Frage:** Soll es bleiben, oder umformulieren (z.B. "Karte 1 von 96")?

### Bug #7: Library Filter-Scroll
**Frage:** Soll horizontales Scrollen hinzugefügt werden, oder Filter anders anordnen?

### Bug #12: XP Progress Bar
**Frage:** XPDisplay Component wird verwendet - sollte die Progress Bar sichtbar sein? Oder fehlt sie visuell?

### Bug #10 & #11: Library Animationen
**Frage:** Sollen die 3D-Animationen und Peek-Effekt wie im Pokemon TCG Stil sein? (Siehe `POKEMON_TCG_FIX_PROMPT.md`)

