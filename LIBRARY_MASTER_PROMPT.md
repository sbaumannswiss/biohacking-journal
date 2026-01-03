# 🎴 SUPPLEMENT LIBRARY - MASTER FIX PROMPT
## Pokemon TCG Pocket Stil - Komplett-Überarbeitung

---

## 🎯 ZIEL
Die Supplement Library soll wie **Pokemon TCG Pocket** aussehen und funktionieren:
- Karten kommen **seitlich rein** (slide-in Animation)
- Karten am Rand sind **leicht sichtbar** (nicht durchsichtig!)
- **Kein Durchschauen** durch Karten (undurchsichtige Hintergründe)
- Smooth Slide-Animationen
- Premium 3D-Effekt mit Tiefe

---

## 🔴 KRITISCHE PROBLEME

### Problem 1: Durchschauen durch Karten
**Datei:** `components/library/SupplementCard3D.tsx` (Zeile 94-101)

**Problem:** Karten haben transparente Hintergründe → man sieht durch sie hindurch zur nächsten Karte.

**Fix:**
```typescript
{/* Front Face */}
<div className={cn(
    "card-face w-full h-full rounded-3xl overflow-hidden",
    "bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a]", // ← Bereits gut
    "border border-white/10",
    "shadow-2xl shadow-black/50",
    isHighEvidence && "holo-effect border-primary/30",
    isCenter && "ring-2 ring-primary/20 shadow-primary/10"
)}>
    {/* WICHTIG: Vollständig undurchsichtiger Hintergrund */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a] z-0" />
    
    {/* Inner Glow - NUR auf der Vorderseite, nicht durchscheinend */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />
    
    {/* Rest des Contents mit z-20+ */}
    <div className="relative z-20 p-6 flex flex-col items-center h-full">
        {/* Content */}
    </div>
</div>
```

**WICHTIG:** Stelle sicher dass der Hintergrund **vollständig deckend** ist:
```css
/* In globals.css - Card Background sollte deckend sein */
.card-face {
    background: linear-gradient(to bottom right, #1a1a2e, #16162a, #0f0f1a) !important;
    opacity: 1 !important; /* ← Keine Transparenz! */
}
```

---

### Problem 2: Karten kommen nicht seitlich rein
**Datei:** `components/library/Carousel3D.tsx` (Zeile 89-121, 162-186)

**Problem:** Karten sind immer da und werden nur transformiert. Sie sollten **von außen reinkommen** (slide-in).

**Fix - Neue Animation mit Slide-in:**
```typescript
// Calculate card transforms - POKEMON TCG STIL
const getCardStyle = (index: number): React.CSSProperties => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);

    // Mehr Karten sichtbar machen (3 auf jeder Seite)
    if (absOffset > 3) {
        return { display: 'none' };
    }

    // Pokemon TCG Stil: Karten seitlich, leicht sichtbar
    let translateX = offset * 200; // Horizontal spacing
    let translateZ = -absOffset * 100; // Weniger Tiefe
    let rotateY = offset * -15; // Weniger Rotation
    let scale = 1 - absOffset * 0.12; // Weniger Skalierung
    let opacity = 1 - absOffset * 0.15; // WICHTIG: Höhere Opacity für Sichtbarkeit!
    let zIndex = 10 - absOffset;

    // Clamp values - Karten am Rand sollen SICHTBAR sein
    scale = Math.max(0.7, scale); // ← Größer (0.7 statt 0.55)
    opacity = Math.max(0.6, opacity); // ← WICHTIG: Mindestens 60% sichtbar!

    // Keine vertikale Verschiebung (flacher)
    const translateY = 0;

    return {
        transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        zIndex,
        transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth, kein Bounce
        filter: absOffset > 1 ? `blur(${absOffset * 0.3}px)` : 'none', // Weniger Blur
    };
};

// Im Render - SLIDE-IN ANIMATION:
<AnimatePresence mode="popLayout">
    {supplements.map((supplement, index) => {
        const offset = index - activeIndex;
        const absOffset = Math.abs(offset);
        
        // Mehr Karten sichtbar
        if (absOffset > 3) return null;

        // Slide-in von links/rechts basierend auf Richtung
        const slideDirection = offset > 0 ? 1 : -1; // 1 = rechts, -1 = links
        
        return (
            <motion.div
                key={supplement.id}
                className="absolute"
                style={getCardStyle(index)}
                initial={{ 
                    opacity: 0,
                    x: slideDirection * 400, // Start außerhalb (links/rechts)
                    scale: 0.8,
                    rotateY: slideDirection * 45 // Start mit Rotation
                }}
                animate={{ 
                    opacity: getCardStyle(index).opacity,
                    x: 0, // Endposition (wird durch transform überschrieben)
                    scale: 1,
                    rotateY: 0
                }}
                exit={{ 
                    opacity: 0,
                    x: -slideDirection * 400, // Raus nach außen
                    scale: 0.8,
                    rotateY: -slideDirection * 45
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                }}
            >
                <SupplementCard3D
                    supplement={supplement}
                    isInStack={userStackIds.has(supplement.id)}
                    isCenter={index === activeIndex}
                    onAddToStack={() => onAddToStack(supplement)}
                    onRemoveFromStack={() => onRemoveFromStack(supplement)}
                    onClick={() => goToIndex(index)}
                />
            </motion.div>
        );
    })}
</AnimatePresence>
```

---

### Problem 3: Opacity zu niedrig - Karten nicht sichtbar
**Datei:** `components/library/Carousel3D.tsx` (Zeile 104, 109)

**Problem:** `opacity = Math.max(0.2, opacity)` → Karten am Rand sind zu durchsichtig!

**Fix:**
```typescript
// In getCardStyle():
let opacity = 1 - absOffset * 0.12; // ← Weniger Opacity-Verlust

// Clamp - Karten sollen IMMER gut sichtbar sein
opacity = Math.max(0.65, opacity); // ← Mindestens 65% sichtbar (statt 20%!)
```

---

### Problem 4: Karten-Hintergrund ist durchscheinend
**Datei:** `components/library/SupplementCard3D.tsx`

**Problem:** `bg-gradient-to-br from-[#1a1a2e]` könnte durchscheinend sein.

**Fix:**
```typescript
{/* Front Face - VOLLSTÄNDIG UNDURCHSICHTIG */}
<div className={cn(
    "card-face w-full h-full rounded-3xl overflow-hidden",
    "border border-white/10",
    "shadow-2xl shadow-black/50",
    isHighEvidence && "holo-effect border-primary/30",
    isCenter && "ring-2 ring-primary/20 shadow-primary/10"
)} style={{
    background: 'linear-gradient(to bottom right, #1a1a2e, #16162a, #0f0f1a)',
    opacity: 1, // ← Explizit 100% undurchsichtig
}}>
    {/* Deckender Hintergrund-Layer */}
    <div 
        className="absolute inset-0 z-0"
        style={{
            background: 'linear-gradient(to bottom right, #1a1a2e, #16162a, #0f0f1a)',
            opacity: 1,
        }}
    />
    
    {/* Content Layer */}
    <div className="relative z-10 p-6 flex flex-col items-center h-full">
        {/* Alle Inhalte hier */}
    </div>
</div>
```

---

### Problem 5: Keine Slide-in Animation beim Wechseln
**Datei:** `components/library/Carousel3D.tsx`

**Problem:** Karten "teleportieren" nur, keine smooth Slide-Animation.

**Fix - Bessere Transition:**
```typescript
// In getCardStyle() - Transition verbessern:
return {
    transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
    transition: isDragging 
        ? 'none' 
        : 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth, kein Bounce
    filter: absOffset > 1 ? `blur(${absOffset * 0.2}px)` : 'none',
};
```

---

## 🎨 POKEMON TCG STIL - SPEZIFISCHE ANFORDERUNGEN

### Anforderung 1: Karten seitlich sichtbar
- **Links:** Vorherige Karten leicht sichtbar (60-70% Opacity)
- **Rechts:** Nächste Karten leicht sichtbar (60-70% Opacity)
- **Zentrum:** Aktive Karte 100% sichtbar

### Anforderung 2: Slide-in Animation
- **Beim Wechseln:** Neue Karte kommt von außen (links/rechts)
- **Alte Karte:** Geht nach außen (Gegenseite)
- **Smooth:** Spring-Animation, nicht linear

### Anforderung 3: Kein Durchschauen
- **Hintergrund:** Vollständig deckend (#1a1a2e)
- **Opacity:** Mindestens 60% für sichtbare Karten
- **Z-Index:** Korrekte Layering

### Anforderung 4: Tiefe-Effekt
- **Zentrum:** Karte "poppt" raus (translateZ positiv)
- **Seiten:** Karten gehen zurück (translateZ negativ)
- **Rotation:** Leichte Rotation für 3D-Effekt

---

## 🔧 IMPLEMENTIERUNG

### Schritt 1: Opacity erhöhen
```typescript
// In getCardStyle():
opacity = Math.max(0.65, opacity); // ← Statt 0.2
```

### Schritt 2: Slide-in Animation hinzufügen
```typescript
// In Render mit AnimatePresence:
initial={{ x: slideDirection * 400, opacity: 0 }}
animate={{ x: 0, opacity: getCardStyle(index).opacity }}
exit={{ x: -slideDirection * 400, opacity: 0 }}
```

### Schritt 3: Hintergrund undurchsichtig machen
```typescript
// In SupplementCard3D:
style={{ background: '...', opacity: 1 }}
```

### Schritt 4: Mehr Karten sichtbar machen
```typescript
// In getCardStyle():
if (absOffset > 3) return { display: 'none' }; // ← Statt 2
```

---

## ✅ CHECKLISTE

Nach den Fixes sollte:
- [ ] **Keine Durchsichtigkeit** - Karten sind vollständig deckend
- [ ] **Karten seitlich sichtbar** - Links/rechts leicht sichtbar (60%+ Opacity)
- [ ] **Slide-in Animation** - Karten kommen von außen rein
- [ ] **Smooth Transitions** - Keine ruckeligen Bewegungen
- [ ] **Pokemon TCG Stil** - Wie im Screenshot (seitlich, leicht sichtbar)
- [ ] **Kein Durchschauen** - Hintergrund ist deckend
- [ ] **Mehr Karten sichtbar** - 3-4 Karten auf jeder Seite

---

## 📝 ZUSÄTZLICHE VERBESSERUNGEN

### Verbesserung 1: Bessere Blur-Werte
```typescript
filter: absOffset > 1 ? `blur(${absOffset * 0.2}px)` : 'none', // Weniger Blur
```

### Verbesserung 2: Bessere Scale-Werte
```typescript
scale = Math.max(0.7, scale); // Größere Karten am Rand
```

### Verbesserung 3: Bessere Spacing
```typescript
let translateX = offset * 180; // Etwas enger zusammen
```

---

## 🎯 ERGEBNIS

**Vorher:**
- Karten durchsichtig → Durchschauen möglich
- Karten "teleportieren" → Keine Animation
- Karten am Rand unsichtbar → Opacity zu niedrig

**Nachher:**
- Karten deckend → Kein Durchschauen
- Karten slide-in → Smooth Animation
- Karten seitlich sichtbar → Wie Pokemon TCG

---

## ✅ FINALE KONFIGURATION (Implementiert)

1. **Anzahl Karten seitlich:** ✅ 1 links, 1 rechts (absOffset > 1)
2. **Opacity seitliche Karten:** ✅ 65% (0.65)
3. **Animation-Dauer:** ✅ 0.4s
4. **Peek-Effekt:** ✅ Ja - nur 60px von seitlichen Karten sichtbar
5. **Zentrum-Karte größer:** ✅ Scale 1.05 mit Pop-Animation
6. **Stack-Effekt:** ✅ Leicht (translateZ -80px)

---

## 🎯 IMPLEMENTIERTE FEATURES

✅ **Kein Durchschauen** - Deckender Hintergrund (opacity: 1)
✅ **Slide-in Animation** - Karten kommen von außen (400px offset)
✅ **Peek-Effekt** - Seitliche Karten zeigen nur 60px
✅ **Zentrum größer** - Scale 1.05 mit Pop-Animation
✅ **65% Opacity** - Seitliche Karten gut sichtbar
✅ **Leichter Stack** - translateZ für Tiefe
✅ **Smooth Transitions** - 0.4s Spring-Animation

