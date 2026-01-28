'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  X, 
  Loader2, 
  RefreshCw, 
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pill,
  Activity,
  CheckCircle,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  BloodworkAnalysisResult, 
  Biomarker,
  getStatusColor,
  getPriorityColor 
} from '@/lib/agent/bloodworkService';

interface BloodworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

type ModalState = 
  | 'disclaimer'      // Disclaimer bestätigen
  | 'upload'          // Bild hochladen
  | 'preview'         // Vorschau
  | 'analyzing'       // Analyse läuft
  | 'result'          // Ergebnis anzeigen
  | 'error';          // Fehler

export function BloodworkModal({ isOpen, onClose, userId }: BloodworkModalProps) {
  const [state, setState] = useState<ModalState>('disclaimer');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<BloodworkAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [expandedBiomarkers, setExpandedBiomarkers] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState('disclaimer');
    setImagePreview(null);
    setResult(null);
    setError(null);
    setDisclaimerAccepted(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte ein Bild auswählen (Screenshot oder Foto)');
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
    
    e.target.value = '';
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imagePreview) return;

    setState('analyzing');
    setError(null);

    try {
      const response = await fetch('/api/bloodwork/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview, userId }),
      });

      const data: BloodworkAnalysisResult = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analyse fehlgeschlagen');
      }

      setResult(data);
      setState('result');

      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

    } catch (err: any) {
      console.error('Bloodwork analysis error:', err);
      setError(err.message || 'Analyse fehlgeschlagen');
      setState('error');
    }
  }, [imagePreview, userId]);

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const acceptDisclaimer = useCallback(() => {
    setDisclaimerAccepted(true);
    setState('upload');
  }, []);

  const getStatusLabel = (status: Biomarker['status']) => {
    switch (status) {
      case 'optimal': return 'Optimal';
      case 'normal': return 'Normal';
      case 'low': return 'Niedrig';
      case 'high': return 'Erhöht';
    }
  };

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
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Activity className="text-red-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Blutbild-Analyse</h3>
                  <p className="text-xs text-muted-foreground">Supplement-Relevanz prüfen</p>
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

              {/* ===== DISCLAIMER STATE ===== */}
              {state === 'disclaimer' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col"
                >
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={24} />
                      <div>
                        <p className="font-bold text-foreground mb-2">Wichtiger Hinweis</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Diese Analyse dient <strong>nur zur Orientierung</strong> für deine Supplement-Planung. 
                          Sie ersetzt <strong>keine medizinische Beurteilung</strong> oder ärztliche Beratung.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Bei auffälligen Werten oder gesundheitlichen Bedenken wende dich bitte an deinen Arzt.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm text-foreground">
                      Ich verstehe, dass dies keine medizinische Diagnose ist
                    </span>
                  </label>

                  <button
                    onClick={acceptDisclaimer}
                    disabled={!disclaimerAccepted}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Weiter zur Analyse
                  </button>
                </motion.div>
              )}

              {/* ===== UPLOAD STATE ===== */}
              {state === 'upload' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <motion.button
                    onClick={openFileSelector}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-32 h-32 rounded-full bg-red-500/20 border-2 border-dashed border-red-500/50 flex items-center justify-center mb-4 hover:bg-red-500/30 transition-colors"
                  >
                    <Camera size={48} className="text-red-400" />
                  </motion.button>
                  <p className="text-foreground font-medium text-center mb-2">
                    Blutbild hochladen
                  </p>
                  <p className="text-muted-foreground text-sm text-center">
                    Foto oder Screenshot deines Laborbefunds
                  </p>
                  <p className="text-muted-foreground/60 text-xs mt-4 text-center px-4">
                    Tipp: Bei PDF-Dokumenten einen Screenshot machen
                  </p>
                </motion.div>
              )}

              {/* ===== PREVIEW STATE ===== */}
              {state === 'preview' && imagePreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-black/20">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setState('upload')}
                      className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} />
                      Neu
                    </button>
                    <button
                      onClick={handleAnalyze}
                      className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      Analysieren
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== ANALYZING STATE ===== */}
              {state === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Loader2 size={40} className="text-red-400 animate-spin" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-500/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-foreground font-medium mt-4">Analysiere Blutbild...</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Extrahiere supplement-relevante Werte
                  </p>
                </motion.div>
              )}

              {/* ===== RESULT STATE ===== */}
              {state === 'result' && result && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col"
                >
                  {/* Summary */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="text-primary shrink-0 mt-0.5" size={20} />
                      <p className="text-sm text-foreground">{result.summary}</p>
                    </div>
                  </div>

                  {/* Biomarkers */}
                  {result.biomarkers.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedBiomarkers(!expandedBiomarkers)}
                        className="w-full flex items-center justify-between py-2 text-sm font-medium text-foreground"
                      >
                        <span>Erkannte Werte ({result.biomarkers.length})</span>
                        {expandedBiomarkers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      <AnimatePresence>
                        {expandedBiomarkers && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {result.biomarkers.map((marker, i) => (
                              <div 
                                key={i}
                                className="bg-white/5 rounded-lg p-3 border border-white/10"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground">{marker.name}</span>
                                  <span className={cn("text-xs px-2 py-0.5 rounded-full", 
                                    marker.status === 'optimal' && "bg-green-500/20 text-green-400",
                                    marker.status === 'normal' && "bg-blue-500/20 text-blue-400",
                                    (marker.status === 'low' || marker.status === 'high') && "bg-yellow-500/20 text-yellow-400"
                                  )}>
                                    {getStatusLabel(marker.status)}
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className={cn("text-lg font-bold", getStatusColor(marker.status))}>
                                    {marker.value} {marker.unit}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Ref: {marker.referenceRange}
                                  </span>
                                </div>
                                {marker.supplementRelevance && (
                                  <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                                    <Pill size={12} className="shrink-0 mt-0.5 text-primary" />
                                    {marker.supplementRelevance}
                                  </p>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Supplement Suggestions */}
                  {result.supplementSuggestions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">Supplement-Hinweise</p>
                      <div className="space-y-2">
                        {result.supplementSuggestions.map((sugg, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "rounded-lg p-3 border",
                              getPriorityColor(sugg.priority)
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Pill size={14} />
                              <span className="font-medium text-sm">{sugg.name}</span>
                            </div>
                            <p className="text-xs opacity-80">{sugg.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No findings */}
                  {result.biomarkers.length === 0 && result.supplementSuggestions.length === 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-400" size={24} />
                        <div>
                          <p className="font-medium text-foreground">Keine Auffälligkeiten</p>
                          <p className="text-xs text-muted-foreground">
                            Keine supplement-relevanten Abweichungen erkannt
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 mb-4">
                    <p className="text-xs text-yellow-400/80 leading-relaxed">
                      {result.disclaimer}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setState('upload')}
                      className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} />
                      Neues Blutbild
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                      Fertig
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== ERROR STATE ===== */}
              {state === 'error' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-red-400" />
                  </div>
                  <p className="text-foreground font-medium mb-2">Fehler</p>
                  <p className="text-muted-foreground text-sm text-center mb-4">{error}</p>
                  <button 
                    onClick={() => setState('upload')} 
                    className="py-3 px-6 bg-white/10 rounded-xl font-medium text-foreground hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
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
