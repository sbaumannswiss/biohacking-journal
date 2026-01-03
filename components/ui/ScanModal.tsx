'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, Check, RefreshCw, Plus, AlertCircle, Sparkles, FileText, Edit3, Send, Package, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScanResult, ComboIngredient } from '@/lib/agent/visionService';
import { saveCustomSupplement, submitToCentralSystem, addCustomToStack } from '@/lib/customSupplementService';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToStack?: (supplementId: string, dosage?: string) => void;
  onSuggestNew?: (detected: ScanResult['detected']) => void;
  onSaveComplete?: () => void; // Callback nach erfolgreichem Speichern (für Auto-Refresh)
  userId?: string;
}

type ScanState = 
  | 'idle' 
  | 'preview' 
  | 'scanning' 
  | 'result' 
  | 'combo-detected'      // Kombi erkannt, Mengenangaben-Foto nötig?
  | 'ingredient-photo'     // Foto der Mengenangaben machen
  | 'ingredient-scanning'  // Mengenangaben analysieren
  | 'ingredient-manual'    // Manuell Inhaltsstoffe eingeben
  | 'combo-result'         // Kombi-Ergebnis mit allen Zutaten
  | 'saving'               // Speichern
  | 'error';

export function ScanModal({ 
  isOpen, 
  onClose, 
  onAddToStack,
  onSuggestNew,
  onSaveComplete,
  userId 
}: ScanModalProps) {
  const router = useRouter();
  const [state, setState] = useState<ScanState>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [comboIngredients, setComboIngredients] = useState<ComboIngredient[]>([]);
  const [manualIngredient, setManualIngredient] = useState({ name: '', dosage: '', unit: 'mg' });
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState('idle');
    setImagePreview(null);
    setScanResult(null);
    setComboIngredients([]);
    setManualIngredient({ name: '', dosage: '', unit: 'mg' });
    setError(null);
    setSavedId(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte ein Bild auswählen');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Bild ist zu groß (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setState('preview');
      setError(null);
    };
    reader.onerror = () => {
      setError('Fehler beim Laden des Bildes');
    };
    reader.readAsDataURL(file);
    
    // Reset input for re-use
    e.target.value = '';
  }, []);

  const handleScan = useCallback(async () => {
    if (!imagePreview) return;

    setState('scanning');
    setError(null);

    try {
      const response = await fetch('/api/supplements/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview, userId }),
      });

      const result: ScanResult = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Scan fehlgeschlagen');
      }

      setScanResult(result);

      // Check if combo product
      if (result.isComboProduct) {
        if (result.comboIngredients && result.comboIngredients.length > 0) {
          // Ingredients already detected
          setComboIngredients(result.comboIngredients);
          setState('combo-result');
        } else if (result.needsIngredientPhoto) {
          // Need photo of ingredient list
          setState('combo-detected');
        } else {
          // Combo but no details - ask for photo or manual
          setState('combo-detected');
        }
      } else {
        // Single supplement
        setState('result');
      }

      if (navigator.vibrate) {
        navigator.vibrate(result.match.found ? [50, 30, 50] : [100]);
      }

    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Scan fehlgeschlagen');
      setState('error');
    }
  }, [imagePreview, userId]);

  const handleIngredientPhotoScan = useCallback(async () => {
    if (!imagePreview) return;

    setState('ingredient-scanning');

    try {
      const response = await fetch('/api/supplements/scan-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      });

      const result = await response.json();

      if (result.success && result.ingredients?.length > 0) {
        setComboIngredients(result.ingredients);
        setState('combo-result');
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      } else {
        // Fallback to manual
        setError('Konnte Mengenangaben nicht lesen. Bitte manuell eingeben.');
        setState('ingredient-manual');
      }

    } catch (err: any) {
      console.error('Ingredient scan error:', err);
      setError('Fehler beim Scannen. Bitte manuell eingeben.');
      setState('ingredient-manual');
    }
  }, [imagePreview]);

  const addManualIngredient = useCallback(() => {
    if (!manualIngredient.name.trim() || !manualIngredient.dosage.trim()) return;

    setComboIngredients(prev => [...prev, {
      name: manualIngredient.name.trim(),
      dosage: manualIngredient.dosage.trim(),
      unit: manualIngredient.unit,
    }]);
    setManualIngredient({ name: '', dosage: '', unit: 'mg' });
  }, [manualIngredient]);

  const removeIngredient = useCallback((index: number) => {
    setComboIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveCombo = useCallback(async () => {
    if (!userId || !scanResult?.detected || comboIngredients.length === 0) {
      return;
    }

    setState('saving');

    try {
      // 1. Generate AI analysis for the combo
      let aiDescription = `Kombi-Präparat mit ${comboIngredients.length} Wirkstoffen: ${comboIngredients.map(i => i.name).join(', ')}`;
      
      try {
        const analysisResponse = await fetch('/api/supplements/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: scanResult.detected.name,
            description: `Kombi-Präparat von ${scanResult.detected.brand || 'unbekannt'}`,
            benefits: comboIngredients.slice(0, 5).map(i => `${i.name} ${i.dosage}${i.unit}`),
            evidence_level: scanResult.evidenceLevel || 3,
            isCombo: true,
            ingredients: comboIngredients,
          }),
        });
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.evidence) {
            aiDescription = analysisData.evidence;
          }
        }
      } catch {
        // AI analysis failed - use default description
      }

      // 2. Save to personal library with AI description
      const saveResult = await saveCustomSupplement(userId, {
        name: scanResult.detected.name,
        brand: scanResult.detected.brand,
        emoji: '💊',
        description: aiDescription,
        serving_size: scanResult.detected.servingSize,
        ingredients: comboIngredients,
        best_time: 'With Meals',
        warnings: scanResult.detected.warnings,
        evidence_level: scanResult.evidenceLevel,
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Speichern fehlgeschlagen');
      }

      setSavedId(saveResult.id || null);

      // Submit to central system (optional, don't fail if this fails)
      if (saveResult.id) {
        try {
          await submitToCentralSystem(userId, saveResult.id, {
            user_id: userId,
            name: scanResult.detected.name,
            brand: scanResult.detected.brand,
            emoji: '💊',
            description: `Kombi-Präparat mit ${comboIngredients.length} Wirkstoffen`,
            serving_size: scanResult.detected.servingSize,
            ingredients: comboIngredients,
            submitted_to_central: true,
          });
        } catch {
          // Central submission failed - non-critical
        }
      }

      // Add to stack
      if (saveResult.id) {
        await addCustomToStack(userId, saveResult.id, scanResult.detected.dosage);
      }

      setState('combo-result');
      if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
      
      // Auto-Refresh Callback aufrufen
      if (onSaveComplete) {
        onSaveComplete();
      }

    } catch (err: any) {
      console.error('🔴 Save error:', err);
      setError(err.message || 'Speichern fehlgeschlagen');
      setState('error');
    }
  }, [userId, scanResult, comboIngredients, onSaveComplete]);

  const handleAddToStack = useCallback(() => {
    if (scanResult?.match.found && scanResult.match.supplement && onAddToStack) {
      onAddToStack(scanResult.match.supplement.id, scanResult.detected?.dosage);
      handleClose();
    }
  }, [scanResult, onAddToStack, handleClose]);

  const handleSuggestNew = useCallback(async () => {
    if (!scanResult?.detected || !userId) return;
    
    setState('saving');
    
    try {
      // Generate AI analysis for single supplement
      let aiDescription = scanResult.detected.name;
      
      try {
        const analysisResponse = await fetch('/api/supplements/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: scanResult.detected.name,
            description: `Supplement von ${scanResult.detected.brand || 'unbekannt'}`,
            benefits: [scanResult.detected.dosage || 'Dosierung unbekannt'],
            evidence_level: scanResult.evidenceLevel || 3,
          }),
        });
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.evidence) {
            aiDescription = analysisData.evidence;
          }
        }
      } catch {
        // AI analysis failed - use default description
      }

      // Save as custom supplement
      const saveResult = await saveCustomSupplement(userId, {
        name: scanResult.detected.name,
        brand: scanResult.detected.brand,
        emoji: '💊',
        description: aiDescription,
        serving_size: scanResult.detected.dosage,
        ingredients: [], // Kein Kombi
        best_time: 'With Meals',
        warnings: scanResult.detected.warnings,
        evidence_level: scanResult.evidenceLevel,
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Speichern fehlgeschlagen');
      }

      // Add to stack
      if (saveResult.id) {
        await addCustomToStack(userId, saveResult.id, scanResult.detected.dosage);
      }

      // Submit to central system
      if (saveResult.id) {
        try {
          await submitToCentralSystem(userId, saveResult.id, {
            user_id: userId,
            name: scanResult.detected.name,
            brand: scanResult.detected.brand,
            emoji: '💊',
            description: aiDescription,
            ingredients: [],
            submitted_to_central: true,
          });
        } catch {
          // Central submission failed - non-critical
        }
      }

      if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
      
      // Callback for refresh
      if (onSaveComplete) {
        onSaveComplete();
      }
      
      handleClose();
      
    } catch (err: any) {
      console.error('Suggest error:', err);
      setError(err.message || 'Vorschlagen fehlgeschlagen');
      setState('error');
    }
  }, [scanResult, userId, onSaveComplete, handleClose]);

  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const startIngredientPhoto = useCallback(() => {
    setImagePreview(null);
    setState('ingredient-photo');
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Supplement Scanner</h3>
                  <p className="text-xs text-muted-foreground">Powered by Helix AI</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* ===== IDLE STATE ===== */}
              {state === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <motion.button
                    onClick={openCamera}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-32 h-32 rounded-full bg-primary/20 border-2 border-dashed border-primary/50 flex items-center justify-center mb-4 hover:bg-primary/30 transition-colors"
                  >
                    <Camera size={48} className="text-primary" />
                  </motion.button>
                  <p className="text-muted-foreground text-sm text-center">
                    Fotografiere das Etikett deines Supplements
                  </p>
                  <p className="text-muted-foreground/60 text-xs mt-2 text-center">
                    Auch Kombi-Präparate werden erkannt.
                  </p>
                </motion.div>
              )}

              {/* ===== PREVIEW STATE ===== */}
              {(state === 'preview' || state === 'ingredient-photo') && imagePreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-black/20">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} />
                      Neu
                    </button>
                    <button
                      onClick={state === 'ingredient-photo' ? handleIngredientPhotoScan : handleScan}
                      className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      Analysieren
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== SCANNING STATE ===== */}
              {(state === 'scanning' || state === 'ingredient-scanning' || state === 'saving') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                      <Loader2 size={40} className="text-primary animate-spin" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-foreground font-medium mt-4">
                    {state === 'saving' ? 'Speichere...' : 'Helix analysiert...'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {state === 'saving' ? 'Einen Moment...' : 'Einen Moment Geduld...'}
                  </p>
                </motion.div>
              )}

              {/* ===== SINGLE SUPPLEMENT RESULT ===== */}
              {state === 'result' && scanResult && !scanResult.isComboProduct && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-sm text-foreground">{scanResult.helixComment}</p>
                    </div>
                  </div>

                  {scanResult.detected && (
                    <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Erkannt</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          scanResult.match.confidence === 'high' ? "bg-green-500/20 text-green-400" :
                          scanResult.match.confidence === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {scanResult.match.confidence === 'high' ? 'Sicher' : 
                           scanResult.match.confidence === 'medium' ? 'Wahrscheinlich' : 'Unsicher'}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{scanResult.detected.name}</p>
                      {scanResult.detected.brand && (
                        <p className="text-sm text-muted-foreground">{scanResult.detected.brand}</p>
                      )}
                      {scanResult.detected.dosage && (
                        <p className="text-sm text-primary">💊 {scanResult.detected.dosage}</p>
                      )}
                    </div>
                  )}

                  {scanResult.match.found && scanResult.match.supplement ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{scanResult.match.supplement.emoji}</span>
                        <div>
                          <p className="font-bold text-foreground">{scanResult.match.supplement.name}</p>
                          <p className="text-xs text-green-400">✓ Bereits in deiner Library!</p>
                        </div>
                        <Check className="ml-auto text-green-400" size={24} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-400" size={24} />
                        <div>
                          <p className="font-medium text-foreground">Nicht in Library</p>
                          <p className="text-xs text-muted-foreground">Du kannst es vorschlagen!</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={reset} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                      <RefreshCw size={18} />
                      Nochmal
                    </button>
                    {scanResult.match.found && scanResult.match.supplement ? (
                      <button 
                        onClick={() => {
                          handleClose();
                          router.push(`/library?highlight=${scanResult.match.supplement?.id}`);
                        }} 
                        className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={18} />
                        In Library
                      </button>
                    ) : (
                      <button onClick={handleSuggestNew} className="flex-1 py-3 px-4 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2">
                        <Sparkles size={18} />
                        Vorschlagen
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== COMBO DETECTED - NEED INGREDIENT PHOTO ===== */}
              {state === 'combo-detected' && scanResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Package className="text-purple-400 mt-0.5" size={24} />
                      <div>
                        <p className="font-bold text-foreground mb-1">Kombi-Präparat erkannt</p>
                        <p className="text-sm text-muted-foreground">{scanResult.helixComment}</p>
                      </div>
                    </div>
                  </div>

                  {scanResult.detected && (
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <p className="text-lg font-bold text-foreground">{scanResult.detected.name}</p>
                      {scanResult.detected.brand && (
                        <p className="text-sm text-muted-foreground">{scanResult.detected.brand}</p>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Um die Inhaltsstoffe zu erfassen, mach ein Foto der Nährwerttabelle oder gib sie manuell ein.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={startIngredientPhoto}
                      className="py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera size={18} />
                      Mengenangaben fotografieren
                    </button>
                    <button
                      onClick={() => setState('ingredient-manual')}
                      className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit3 size={18} />
                      Manuell eingeben
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== MANUAL INGREDIENT INPUT ===== */}
              {state === 'ingredient-manual' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <p className="font-bold text-foreground mb-1">{scanResult?.detected?.name || 'Kombi-Präparat'}</p>
                    <p className="text-xs text-muted-foreground">Füge die Inhaltsstoffe hinzu</p>
                  </div>

                  {/* Added ingredients */}
                  {comboIngredients.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {comboIngredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
                          <span className="text-sm text-foreground">{ing.name} - {ing.dosage}{ing.unit}</span>
                          <button onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-300">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add ingredient form */}
                  <div className="space-y-3 mb-4">
                    <input
                      ref={ingredientInputRef}
                      type="text"
                      placeholder="Name (z.B. Vitamin D3)"
                      value={manualIngredient.name}
                      onChange={(e) => setManualIngredient(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Menge"
                        value={manualIngredient.dosage}
                        onChange={(e) => setManualIngredient(p => ({ ...p, dosage: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                      />
                      <select
                        value={manualIngredient.unit}
                        onChange={(e) => setManualIngredient(p => ({ ...p, unit: e.target.value }))}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-primary/50"
                      >
                        <option value="mg">mg</option>
                        <option value="mcg">mcg</option>
                        <option value="g">g</option>
                        <option value="IU">IU</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                    <button
                      onClick={addManualIngredient}
                      disabled={!manualIngredient.name.trim() || !manualIngredient.dosage.trim()}
                      className="w-full py-2 px-4 bg-white/10 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Hinzufügen
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={reset} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors">
                      Abbrechen
                    </button>
                    <button
                      onClick={() => setState('combo-result')}
                      disabled={comboIngredients.length === 0}
                      className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Fertig
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== COMBO RESULT ===== */}
              {state === 'combo-result' && scanResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💊</span>
                      <div>
                        <p className="font-bold text-foreground">{scanResult.detected?.name}</p>
                        <p className="text-xs text-muted-foreground">{comboIngredients.length} Wirkstoffe</p>
                      </div>
                      {savedId && <Check className="ml-auto text-green-400" size={24} />}
                    </div>
                  </div>

                  {/* Ingredients list */}
                  <div className="bg-white/5 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Inhaltsstoffe</p>
                    <div className="space-y-1">
                      {comboIngredients.map((ing, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-foreground">{ing.name}</span>
                          <span className="text-primary">{ing.dosage}{ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {savedId ? (
                    // Already saved
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-medium text-foreground">Gespeichert & eingereicht!</p>
                          <p className="text-xs text-muted-foreground">
                            Zur persönlichen Library hinzugefügt und ans zentrale System gesendet.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Not saved yet
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Send className="text-cyan-400 mt-0.5" size={20} />
                        <div>
                          <p className="font-medium text-foreground text-sm">Was passiert beim Speichern?</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            • Wird zu deiner persönlichen Library hinzugefügt<br />
                            • Wird ans zentrale System zur Prüfung gesendet
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {savedId ? (
                      <button onClick={handleClose} className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <Check size={18} />
                        Fertig
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setState('ingredient-manual')} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                          <Edit3 size={18} />
                          Bearbeiten
                        </button>
                        <button onClick={handleSaveCombo} className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                          <Send size={18} />
                          Speichern
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== ERROR STATE ===== */}
              {state === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-red-400" />
                  </div>
                  <p className="text-foreground font-medium mb-2">Fehler</p>
                  <p className="text-muted-foreground text-sm text-center mb-4">{error}</p>
                  <button onClick={reset} className="py-3 px-6 bg-white/10 rounded-xl font-medium text-foreground hover:bg-white/20 transition-colors flex items-center gap-2">
                    <RefreshCw size={18} />
                    Nochmal versuchen
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
