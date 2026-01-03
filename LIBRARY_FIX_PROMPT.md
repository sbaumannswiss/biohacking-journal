# 🎴 SUPPLEMENT LIBRARY - FIX PROMPT

## 🎯 ZIEL
Die Supplement Library mit 3D-Karussell (Pokemon TCG Pocket Stil) funktioniert nicht richtig und sieht nicht gut aus. Alle Probleme beheben und optimieren.

---

## 🔴 IDENTIFIZIERTE PROBLEME

### Problem 1: Keyboard Navigation hat Dependency-Warnung
**Datei:** `components/library/Carousel3D.tsx` (Zeile 30-41)

**Problem:** `useEffect` für Keyboard-Navigation hat `goToNext` und `goToPrevious` in Dependencies, aber diese sind nicht inkludiert → React Warnung + mögliche Bugs.

**Fix:**
```typescript
// Keyboard Navigation
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
            if (navigator.vibrate) navigator.vibrate(10);
        } else if (e.key === 'ArrowRight' && activeIndex < supplements.length - 1) {
            setActiveIndex(prev => prev + 1);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeIndex, supplements.length]); // ← Nur State-Variablen, keine Callbacks
```

---

### Problem 2: Drag-Funktionalität funktioniert nicht richtig
**Datei:** `components/library/Carousel3D.tsx` (Zeile 64-87)

**Problem:** `handleDragMove` wird nur aufgerufen wenn `isDragging` true ist, aber `onPointerMove` wird auch ohne `isDragging` getriggert. Außerdem: `touchAction: 'pan-y'` verhindert horizontales Swiping!

**Fix:**
```typescript
// Touch/Mouse Drag Handling
const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragDelta.current = 0;
};

const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    dragDelta.current = clientX - dragStartX.current;
};

const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    if (dragDelta.current > threshold) {
        goToPrevious();
    } else if (dragDelta.current < -threshold) {
        goToNext();
    }
    dragDelta.current = 0;
};

// Im Container:
<div
    ref={containerRef}
    className="relative w-full h-[450px] perspective-1500 flex items-center justify-center"
    onPointerDown={(e) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    }}
    onPointerMove={(e) => {
        if (isDragging) {
            e.preventDefault();
            handleDragMove(e.clientX);
        }
    }}
    onPointerUp={handleDragEnd}
    onPointerCancel={handleDragEnd}
    style={{ touchAction: 'pan-x' }} // ← Geändert von 'pan-y' zu 'pan-x' für horizontales Swiping
>
```

---

### Problem 3: 3D-Transform funktioniert nicht richtig
**Datei:** `components/library/Carousel3D.tsx` (Zeile 160)

**Problem:** `preserve-3d` Klasse wird verwendet, aber die Karten haben `position: absolute` ohne richtigen 3D-Container.

**Fix:**
```typescript
{/* Cards Container - WICHTIG: preserve-3d hier! */}
<div 
    className="relative preserve-3d flex items-center justify-center"
    style={{ 
        width: '100%', 
        height: '100%',
        transformStyle: 'preserve-3d' // ← Explizit setzen
    }}
>
    <AnimatePresence mode="popLayout">
        {supplements.map((supplement, index) => {
            const offset = Math.abs(index - activeIndex);
            if (offset > 2) return null;

            return (
                <motion.div
                    key={supplement.id}
                    className="absolute"
                    style={{
                        ...getCardStyle(index),
                        transformStyle: 'preserve-3d', // ← Auch hier!
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                        opacity: getCardStyle(index).opacity, 
                        scale: 1 
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                >
                    <SupplementCard3D ... />
                </motion.div>
            );
        })}
    </AnimatePresence>
</div>
```

---

### Problem 4: Card Flip funktioniert nicht
**Datei:** `components/library/SupplementCard3D.tsx` (Zeile 86-91)

**Problem:** `card-flip` und `card-face` Klassen sind definiert, aber die Back-Face ist nicht richtig positioniert.

**Fix:**
```typescript
{/* Card Container with 3D Flip */}
<div
    className={cn(
        "card-flip w-full h-full",
        isFlipped && "flipped"
    )}
    style={{ transformStyle: 'preserve-3d' }} // ← Explizit
>
    {/* Front Face */}
    <div className={cn(
        "card-face w-full h-full rounded-3xl overflow-hidden",
        // ... rest
    )}>
        {/* Front Content */}
    </div>

    {/* Back Face */}
    <div className={cn(
        "card-face card-face-back w-full h-full rounded-3xl overflow-hidden",
        // ... rest
    )}>
        {/* Back Content */}
    </div>
</div>
```

**WICHTIG:** Stelle sicher dass `app/globals.css` diese Klassen hat:
```css
.card-flip {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-flip.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-face-back {
  transform: rotateY(180deg);
}
```

---

### Problem 5: Karten sind zu klein/zu groß oder falsch positioniert
**Datei:** `components/library/SupplementCard3D.tsx` (Zeile 77-84)

**Problem:** Feste Größe `280px x 380px` funktioniert nicht auf allen Bildschirmgrößen.

**Fix:**
```typescript
<div
    className="relative cursor-pointer select-none"
    style={{
        width: 'min(280px, 75vw)', // ← Responsive
        height: 'min(380px, 100vw)', // ← Responsive
        maxWidth: '280px',
        maxHeight: '380px',
        ...style,
    }}
    onClick={handleCardClick}
>
```

---

### Problem 6: Carousel-Glow fehlt oder ist nicht sichtbar
**Datei:** `components/library/Carousel3D.tsx` (Zeile 134)

**Problem:** `<div className="carousel-glow" />` existiert, aber CSS-Klasse fehlt oder ist nicht sichtbar.

**Fix in `app/globals.css`:**
```css
/* Ambient Glow for Carousel */
.carousel-glow {
  position: absolute;
  bottom: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 40%;
  background: radial-gradient(ellipse at center, rgba(167, 243, 208, 0.15) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(30px);
  z-index: 0; /* ← Wichtig: Hinter den Karten */
}
```

---

### Problem 7: Pagination Dots sind zu klein oder nicht klickbar
**Datei:** `components/library/Carousel3D.tsx` (Zeile 226-264)

**Problem:** Dots sind zu klein (`h-2`, `w-1.5`) und schwer zu klicken auf Mobile.

**Fix:**
```typescript
{/* Pagination Dots */}
<div className="flex gap-2 mt-6 flex-wrap justify-center max-w-full px-4">
    {supplements.length <= 20 ? (
        supplements.map((_, index) => (
            <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                    "h-2.5 rounded-full transition-all duration-300 touch-manipulation", // ← Größer + touch-friendly
                    index === activeIndex
                        ? "bg-primary w-10 shadow-lg shadow-primary/30"
                        : Math.abs(index - activeIndex) <= 2
                        ? "bg-white/30 w-3 hover:bg-white/50"
                        : "bg-white/10 w-2"
                )}
                aria-label={`Go to supplement ${index + 1}`}
            />
        ))
    ) : (
        // ... compact pagination bleibt gleich
    )}
</div>
```

---

### Problem 8: Leere State wenn keine Supplements
**Datei:** `components/library/Carousel3D.tsx` (Zeile 123-128)

**Problem:** Leere State ist zu simpel.

**Fix:**
```typescript
if (supplements.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-lg font-bold text-foreground mb-2">
                Keine Supplements gefunden
            </h3>
            <p className="text-sm text-muted-foreground">
                Versuche andere Suchbegriffe
            </p>
        </div>
    );
}
```

---

### Problem 9: Performance - zu viele Re-Renders
**Datei:** `components/library/Carousel3D.tsx`

**Problem:** `getCardStyle()` wird bei jedem Render neu berechnet.

**Fix:**
```typescript
// useMemo für Card Styles
const cardStyles = useMemo(() => {
    return supplements.map((_, index) => getCardStyle(index));
}, [activeIndex, supplements.length, isDragging]);

// Dann im Render:
{supplements.map((supplement, index) => {
    const offset = Math.abs(index - activeIndex);
    if (offset > 2) return null;

    return (
        <motion.div
            key={supplement.id}
            className="absolute"
            style={cardStyles[index]} // ← Verwende memoized styles
            // ...
        >
```

---

### Problem 10: Touch-Gesten funktionieren nicht auf Mobile
**Datei:** `components/library/Carousel3D.tsx`

**Problem:** Pointer Events funktionieren nicht gut auf Touch-Geräten.

**Fix:**
```typescript
// Zusätzlich Touch-Events hinzufügen:
<div
    ref={containerRef}
    className="relative w-full h-[450px] perspective-1500 flex items-center justify-center"
    onPointerDown={(e) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    }}
    onPointerMove={(e) => {
        if (isDragging) {
            e.preventDefault();
            handleDragMove(e.clientX);
        }
    }}
    onPointerUp={handleDragEnd}
    onPointerCancel={handleDragEnd}
    onTouchStart={(e) => {
        e.preventDefault();
        handleDragStart(e.touches[0].clientX);
    }}
    onTouchMove={(e) => {
        if (isDragging) {
            e.preventDefault();
            handleDragMove(e.touches[0].clientX);
        }
    }}
    onTouchEnd={handleDragEnd}
    style={{ 
        touchAction: 'pan-x',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
    }}
>
```

---

## 🎨 VISUELLE VERBESSERUNGEN

### Verbesserung 1: Bessere Karten-Animationen
**Datei:** `components/library/SupplementCard3D.tsx`

**Hinzufügen:**
```typescript
// Smooth Hover-Effekt
<motion.div
    whileHover={isCenter ? { scale: 1.02 } : {}}
    whileTap={isCenter ? { scale: 0.98 } : {}}
    className="relative cursor-pointer select-none"
    // ...
>
```

---

### Verbesserung 2: Bessere Spotlight-Animation
**Datei:** `components/library/Carousel3D.tsx` (Zeile 137-147)

**Verbessern:**
```typescript
{/* Center Spotlight - Pulsierend */}
<motion.div 
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[450px] pointer-events-none z-0"
    animate={{
        background: [
            'radial-gradient(ellipse at center, rgba(167,243,208,0.08) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(167,243,208,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(167,243,208,0.08) 0%, transparent 70%)',
        ],
        scale: [1, 1.1, 1],
    }}
    transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: 'easeInOut' 
    }}
/>
```

---

### Verbesserung 3: Loading State verbessern
**Datei:** `app/library/page.tsx` (Zeile 208-211)

**Verbessern:**
```typescript
{isLoading ? (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Lade Supplements...</p>
    </div>
) : (
    <Carousel3D ... />
)}
```

---

## ✅ CHECKLISTE NACH FIXES

- [ ] Keyboard Navigation funktioniert (Pfeiltasten)
- [ ] Drag/Swipe funktioniert auf Desktop und Mobile
- [ ] 3D-Transform zeigt richtige Tiefe
- [ ] Card Flip funktioniert (Tap auf Zentrum-Karte)
- [ ] Karten sind responsive (verschiedene Bildschirmgrößen)
- [ ] Carousel-Glow ist sichtbar
- [ ] Pagination Dots sind klickbar
- [ ] Leere State sieht gut aus
- [ ] Performance ist gut (keine Lag)
- [ ] Touch-Gesten funktionieren auf Mobile

---

## 🚀 TESTEN

Nach allen Fixes:
1. Öffne `/library` Route
2. Teste Swipe/Drag auf Desktop (Maus) und Mobile (Touch)
3. Teste Keyboard-Navigation (Pfeiltasten)
4. Teste Card Flip (Tap auf Zentrum-Karte)
5. Teste Pagination Dots
6. Teste Search-Funktion
7. Teste Add/Remove aus Stack

**Erwartetes Ergebnis:**
- Smooth 3D-Karussell mit Pokemon TCG Pocket Stil
- Karten haben richtige Tiefe und Rotation
- Flip-Animation funktioniert perfekt
- Touch-Gesten sind responsive
- Alles sieht premium aus!

