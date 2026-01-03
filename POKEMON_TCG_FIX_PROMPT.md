# 🎴 POKEMON TCG POCKET STIL - PRÄZISER FIX PROMPT
## 3D-Karussell mit korrekter Perspective & Animationen

---

## 🎯 ZIEL (Basierend auf Screenshot)
Die Supplement Library soll **genau** wie Pokemon TCG Pocket aussehen:
- **3D-Tiefe sichtbar** - Karten gehen klar nach hinten
- **Seitliche Karten sichtbar** - Links/rechts mit Peek-Effekt (nur Teil sichtbar)
- **Zentrum prominent** - Größer, rausgepoppt, fokussiert
- **Smooth Animationen** - Karten rutschen seitlich rein
- **Kein Durchschauen** - Vollständig deckend
- **Holografischer Effekt** - Glänzende Oberfläche

---

## 🔴 KRITISCHE PROBLEME

### Problem 1: 3D-Transform funktioniert nicht
**Symptom:** Karten sehen flach aus, keine Tiefe sichtbar

**Ursache:** `transform-style: preserve-3d` fehlt oder Perspective ist falsch

**Fix in `components/library/Carousel3D.tsx`:**

```typescript
{/* Carousel Container - WICHTIG: Perspective hier! */}
<div
    ref={containerRef}
    className="relative w-full h-[450px] flex items-center justify-center overflow-hidden"
    style={{
        perspective: '1500px', // ← Explizit als Style, nicht nur Klasse!
        perspectiveOrigin: '50% 50%',
        transformStyle: 'preserve-3d', // ← WICHTIG!
    }}
    // ... event handlers
>
    {/* Cards Container - preserve-3d MUSS hier sein */}
    <div 
        className="relative flex items-center justify-center"
        style={{ 
            width: '100%', 
            height: '100%',
            transformStyle: 'preserve-3d', // ← KRITISCH für 3D!
            position: 'relative',
        }}
    >
        <AnimatePresence mode="popLayout">
            {supplements.map((supplement, index) => {
                const offset = index - activeIndex;
                const absOffset = Math.abs(offset);
                
                if (absOffset > 1) return null;

                const cardStyle = getCardStyle(index);

                return (
                    <motion.div
                        key={supplement.id}
                        className="absolute"
                        style={{
                            ...cardStyle,
                            transformStyle: 'preserve-3d', // ← Auch auf jeder Karte!
                            willChange: 'transform', // Performance
                        }}
                        // ... animations
                    >
                        <SupplementCard3D ... />
                    </motion.div>
                );
            })}
        </AnimatePresence>
    </div>
</div>
```

---

### Problem 2: getCardStyle() - 3D-Werte falsch
**Symptom:** Karten haben keine richtige Tiefe, sehen flach aus

**Fix - Komplett neue getCardStyle() Funktion:**

```typescript
// Calculate card transforms - POKEMON TCG POCKET STIL
const getCardStyle = (index: number): React.CSSProperties => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);

    // Nur 1 Karte links, 1 rechts
    if (absOffset > 1) {
        return { display: 'none' };
    }

    const cardWidth = 280;
    const peekAmount = 60; // Wie viel von seitlicher Karte sichtbar

    // ZENTRUM-KARTE (absOffset === 0)
    if (absOffset === 0) {
        return {
            transform: `translate3d(0, 0, 50px) rotateY(0deg) scale(1.05)`, // ← translate3d für Hardware-Acceleration!
            opacity: 1,
            zIndex: 10,
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s',
            filter: 'none',
            transformStyle: 'preserve-3d',
        };
    }

    // SEITLICHE KARTEN (absOffset === 1)
    // Links: offset = -1, Rechts: offset = 1
    const translateX = offset > 0 
        ? (cardWidth / 2) - peekAmount  // Rechts: Karte ragt rein
        : -(cardWidth / 2) + peekAmount; // Links: Karte ragt rein
    
    // WICHTIG: translateZ für 3D-Tiefe!
    const translateZ = -120; // Karte geht NACH HINTEN (negativ = zurück)
    const rotateY = offset * -15; // Leichte Rotation für 3D-Effekt
    const scale = 0.85;
    const opacity = 0.65;

    return {
        // WICHTIG: translate3d() für Hardware-Acceleration!
        transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        zIndex: 9 - absOffset,
        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s',
        filter: `blur(0.5px)`, // Leichter Blur für Tiefe
        transformStyle: 'preserve-3d',
        willChange: 'transform', // Performance
    };
};
```

**WICHTIGE ÄNDERUNGEN:**
- `translate3d()` statt `translateX/translateZ` - Hardware-Acceleration!
- `translateZ: -120` - Karten gehen klar nach hinten
- `transformStyle: 'preserve-3d'` - Auf jedem Element!
- `willChange: 'transform'` - Performance-Optimierung

---

### Problem 3: Slide-in Animation funktioniert nicht
**Symptom:** Karten "teleportieren" statt smooth zu rutschen

**Fix - Komplett neue Animation mit translate3d:**

```typescript
<AnimatePresence mode="popLayout">
    {supplements.map((supplement, index) => {
        const offset = index - activeIndex;
        const absOffset = Math.abs(offset);
        
        if (absOffset > 1) return null;

        const slideDirection = offset > 0 ? 1 : -1;
        const cardStyle = getCardStyle(index);

        return (
            <motion.div
                key={supplement.id}
                className="absolute"
                style={{
                    ...cardStyle,
                    transformStyle: 'preserve-3d',
                }}
                initial={{ 
                    opacity: 0,
                    x: slideDirection * 500, // Start weit außen
                    z: -200, // Start weit hinten
                    scale: 0.7,
                    rotateY: slideDirection * 25
                }}
                animate={{ 
                    opacity: cardStyle.opacity,
                    x: 0, // Wird durch transform überschrieben
                    z: absOffset === 0 ? 50 : -120, // 3D-Position
                    scale: absOffset === 0 ? 1.05 : 0.85,
                    rotateY: absOffset === 0 ? 0 : slideDirection * -15
                }}
                exit={{ 
                    opacity: 0,
                    x: -slideDirection * 500, // Raus nach außen
                    z: -200,
                    scale: 0.7,
                    rotateY: -slideDirection * 25
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                }}
            >
                <SupplementCard3D ... />
            </motion.div>
        );
    })}
</AnimatePresence>
```

**WICHTIG:**
- `x` und `z` in `initial/animate/exit` - Framer Motion animiert diese
- `transform` in `style` wird von Framer Motion überschrieben
- Spring-Animation für smooth Bewegung

---

### Problem 4: Karten-Hintergrund durchscheinend
**Symptom:** Man sieht durch Karten hindurch

**Fix in `components/library/SupplementCard3D.tsx`:**

```typescript
{/* Front Face - VOLLSTÄNDIG UNDURCHSICHTIG */}
<div 
    className={cn(
        "card-face w-full h-full rounded-3xl overflow-hidden",
        "border border-white/10",
        "shadow-2xl shadow-black/50",
        isHighEvidence && "holo-effect border-primary/30",
        isCenter && "ring-2 ring-primary/20 shadow-primary/10"
    )}
    style={{
        // WICHTIG: Vollständig deckender Hintergrund
        background: 'linear-gradient(to bottom right, #1a1a2e, #16162a, #0f0f1a)',
        opacity: 1,
        backfaceVisibility: 'hidden', // ← WICHTIG für Flip!
        WebkitBackfaceVisibility: 'hidden',
    }}
>
    {/* Deckender Hintergrund-Layer - Z-Index 0 */}
    <div 
        className="absolute inset-0 z-0"
        style={{
            background: 'linear-gradient(to bottom right, #1a1a2e, #16162a, #0f0f1a)',
            opacity: 1,
            borderRadius: '1.5rem', // rounded-3xl
        }}
    />
    
    {/* Inner Glow - Z-Index 10 */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />
    
    {/* Content - Z-Index 20 */}
    <div className="relative z-20 p-6 flex flex-col items-center h-full">
        {/* Alle Inhalte hier */}
    </div>
</div>
```

---

### Problem 5: CSS für 3D fehlt oder ist falsch
**Fix in `app/globals.css`:**

```css
/* 3D Carousel Utilities - POKEMON TCG STIL */
.preserve-3d {
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
}

.perspective-1500 {
  perspective: 1500px;
  -webkit-perspective: 1500px;
  perspective-origin: 50% 50%;
}

/* Card Flip Container */
.card-flip {
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  height: 100%;
}

.card-flip.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
}

.card-face-back {
  transform: rotateY(180deg);
}

/* WICHTIG: Hardware-Acceleration für Performance */
.card-face,
.card-flip,
.preserve-3d {
  will-change: transform;
  transform: translateZ(0); /* Force GPU acceleration */
}
```

---

### Problem 6: Container hat keine Perspective
**Fix in `components/library/Carousel3D.tsx`:**

```typescript
{/* Carousel Container - Perspective MUSS hier sein! */}
<div
    ref={containerRef}
    className="relative w-full h-[450px] flex items-center justify-center overflow-hidden"
    style={{
        // WICHTIG: Perspective auf Container!
        perspective: '1500px',
        WebkitPerspective: '1500px',
        perspectiveOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
    }}
    // ... handlers
>
```

---

## 🎨 POKEMON TCG STIL - SPEZIFISCHE WERTE

### Zentrum-Karte:
- `scale: 1.05` - Größer
- `translateZ: 50px` - Rausgepoppt
- `opacity: 1` - Voll sichtbar
- `rotateY: 0deg` - Gerade

### Seitliche Karten (links/rechts):
- `scale: 0.85` - Kleiner
- `translateZ: -120px` - Nach hinten
- `opacity: 0.65` - 65% sichtbar
- `rotateY: ±15deg` - Leichte Rotation
- `translateX: ±110px` - Peek-Effekt (nur 60px sichtbar)
- `blur: 0.5px` - Leichter Blur für Tiefe

---

## 🔧 TECHNISCHE CHECKLISTE

### CSS/3D:
- [ ] `perspective: 1500px` auf Container
- [ ] `transform-style: preserve-3d` auf Container UND Karten
- [ ] `backface-visibility: hidden` auf Card Faces
- [ ] `translate3d()` statt `translateX/translateZ` (Hardware-Acceleration)
- [ ] `will-change: transform` für Performance

### Animationen:
- [ ] `initial/animate/exit` mit `x` und `z` Werten
- [ ] Spring-Animation (stiffness: 400, damping: 35)
- [ ] Smooth Transitions (0.4s cubic-bezier)

### Rendering:
- [ ] Karten sind vollständig deckend (opacity: 1)
- [ ] Z-Index Layering korrekt (Zentrum: 10, Seiten: 9)
- [ ] Overflow hidden auf Container

---

## 🚀 IMPLEMENTIERUNG

### Schritt 1: Container Perspective setzen
```typescript
style={{
    perspective: '1500px',
    perspectiveOrigin: '50% 50%',
    transformStyle: 'preserve-3d',
}}
```

### Schritt 2: getCardStyle() mit translate3d
```typescript
transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`
```

### Schritt 3: Framer Motion mit x/z Animation
```typescript
initial={{ x: slideDirection * 500, z: -200 }}
animate={{ x: 0, z: absOffset === 0 ? 50 : -120 }}
```

### Schritt 4: Deckender Hintergrund
```typescript
style={{ background: '...', opacity: 1, backfaceVisibility: 'hidden' }}
```

---

## ✅ ERGEBNIS

**Nach Fixes sollte:**
- ✅ 3D-Tiefe klar sichtbar sein (Karten gehen nach hinten)
- ✅ Seitliche Karten mit Peek-Effekt sichtbar
- ✅ Zentrum-Karte größer und rausgepoppt
- ✅ Smooth Slide-in Animationen
- ✅ Kein Durchschauen durch Karten
- ✅ Wie im Pokemon TCG Pocket Screenshot

---

## 🎯 TESTEN

1. Öffne `/library`
2. **3D-Tiefe prüfen:** Seitliche Karten sollten klar nach hinten gehen
3. **Peek-Effekt:** Nur 60px von seitlichen Karten sichtbar
4. **Animation:** Karten rutschen smooth seitlich rein
5. **Zentrum:** Größer, rausgepoppt, fokussiert
6. **Kein Durchschauen:** Hintergrund vollständig deckend

**Wenn 3D nicht sichtbar:**
- Prüfe Browser DevTools → Computed Styles → `transform-style: preserve-3d`?
- Prüfe `perspective` auf Container
- Prüfe ob `translate3d()` verwendet wird (nicht `translateX/translateZ`)

