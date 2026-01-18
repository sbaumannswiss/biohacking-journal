'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Brain, 
  Moon, 
  Battery, 
  Zap, 
  Heart,
  Shield,
  Flame,
  Sun,
  Coffee,
  Activity,
  Loader2,
  Sparkles,
  User,
  Scale,
  Clock,
  Utensils,
  Pill,
  AlertTriangle,
  Watch,
  X,
  Search,
  Plus,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/lib/supabaseService';

// ============================================
// TYPES & INTERFACES
// ============================================

interface OnboardingData {
  // Step 2: Basics
  name: string;
  ageGroup: string;
  gender: string;
  weight: string; // optional
  
  // Step 3: Lifestyle
  bedtime: string;
  wakeTime: string;
  chronotype: string;
  activityLevel: string;
  caffeineLevel: string;
  
  // Step 4: Nutrition & Health
  dietType: string;
  customDiet: string;
  allergies: string[];
  customAllergies: string[];
  medications: string[];
  customMedications: string[];
  
  // Step 5: Goals & Stack
  goals: string[];
  currentSupplements: string[];
  wearables: string[];
}

// ============================================
// CONSTANTS
// ============================================

const TOTAL_STEPS = 7;

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '56+'];

const GENDERS = [
  { id: 'male', label: 'Männlich' },
  { id: 'female', label: 'Weiblich' },
  { id: 'diverse', label: 'Divers' },
];

const CHRONOTYPES = [
  { id: 'early', label: 'Frühaufsteher', desc: 'Vor 7 Uhr wach' },
  { id: 'normal', label: 'Normal', desc: '7-9 Uhr wach' },
  { id: 'late', label: 'Nachtmensch', desc: 'Nach 9 Uhr wach' },
  { id: 'irregular', label: 'Unregelmäßig', desc: 'Wechselnd' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Wenig aktiv', desc: 'Bürojob, kaum Sport' },
  { id: 'moderate', label: 'Moderat', desc: '2-3x Sport/Woche' },
  { id: 'active', label: 'Aktiv', desc: '4-5x Sport/Woche' },
  { id: 'athlete', label: 'Athlet', desc: 'Tägliches Training' },
];

const CAFFEINE_LEVELS = [
  { id: 'none', label: 'Kein Koffein' },
  { id: 'low', label: 'Wenig (50-100mg)' },
  { id: 'moderate', label: 'Moderat (100-300mg)' },
  { id: 'high', label: 'Viel (300mg+)' },
];

const DIET_TYPES = [
  { id: 'omnivore', label: 'Omnivor' },
  { id: 'vegetarian', label: 'Vegetarisch' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'keto', label: 'Keto/Low-Carb' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'fasting', label: 'Intervallfasten' },
];

const COMMON_ALLERGIES = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'lactose', label: 'Laktose' },
  { id: 'nuts', label: 'Nüsse' },
  { id: 'soy', label: 'Soja' },
  { id: 'shellfish', label: 'Meeresfrüchte' },
  { id: 'eggs', label: 'Eier' },
];

const COMMON_MEDICATIONS = [
  { id: 'blood-thinners', label: 'Blutverdünner', warning: true },
  { id: 'antidepressants', label: 'Antidepressiva', warning: true },
  { id: 'blood-pressure', label: 'Blutdruckmedikamente' },
  { id: 'thyroid', label: 'Schilddrüsenmedikamente' },
  { id: 'diabetes', label: 'Diabetes-Medikamente' },
  { id: 'birth-control', label: 'Verhütungsmittel' },
  { id: 'none', label: 'Keine Medikamente' },
];

const GOALS = [
  { id: 'focus', label: 'Fokus & Konzentration', icon: Brain, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { id: 'sleep', label: 'Besserer Schlaf', icon: Moon, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  { id: 'energy', label: 'Mehr Energie', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { id: 'recovery', label: 'Schnelle Erholung', icon: Battery, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { id: 'stress', label: 'Stress reduzieren', icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { id: 'immunity', label: 'Immunsystem stärken', icon: Shield, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { id: 'longevity', label: 'Longevity', icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { id: 'fitness', label: 'Fitness & Muskel', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
];

const WEARABLES = [
  { id: 'apple-watch', label: 'Apple Watch' },
  { id: 'garmin', label: 'Garmin' },
  { id: 'oura', label: 'Oura Ring' },
  { id: 'whoop', label: 'WHOOP' },
  { id: 'fitbit', label: 'Fitbit' },
  { id: 'samsung', label: 'Samsung Galaxy' },
  { id: 'none', label: 'Keins' },
];

// Quick-Add Supplements (die beliebtesten)
const QUICK_SUPPLEMENTS = [
  'vit-d3', 'magnesium', 'omega-3', 'creatine', 'ashwagandha', 
  'zinc', 'b12', 'vitamin-c', 'theanine', 'caffeine'
];

// ============================================
// HELPER COMPONENTS
// ============================================

function ProgressBar({ step, total }: { step: number; total: number }) {
  const progress = (step / total) * 100;
  
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-cyan-400"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

function HelixMascot({ mood = 'happy', size = 'md' }: { mood?: 'happy' | 'thinking' | 'celebrating'; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };
  
  return (
    <motion.div
      className={cn("relative", sizeClasses[size])}
      animate={
        mood === 'celebrating' 
          ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }
          : mood === 'thinking'
          ? { y: [0, -5, 0] }
          : { scale: [1, 1.02, 1] }
      }
      transition={{ 
        duration: mood === 'celebrating' ? 0.5 : 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <Image
        src="/helix-mascot.svg"
        alt="Helix - Dein STAX Coach"
        fill
        className="object-contain drop-shadow-[0_0_15px_rgba(167,243,208,0.3)]"
        priority
      />
    </motion.div>
  );
}

function SpeechBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        "relative bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl",
        "before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2",
        "before:border-8 before:border-transparent before:border-t-card/80",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function ChipSelector({ 
  options, 
  selected, 
  onSelect, 
  multiple = false,
  columns = 2 
}: { 
  options: { id: string; label: string; icon?: string; emoji?: string; desc?: string; warning?: boolean }[];
  selected: string | string[];
  onSelect: (id: string) => void;
  multiple?: boolean;
  columns?: number;
}) {
  const isSelected = (id: string) => 
    multiple ? (selected as string[]).includes(id) : selected === id;
  
  return (
    <div className={cn(
      "grid gap-2",
      columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-1"
    )}>
      {options.map((option) => (
        <motion.button
          key={option.id}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(option.id)}
          className={cn(
            "relative p-3 rounded-xl border transition-all text-left",
            isSelected(option.id)
              ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(167,243,208,0.15)]"
              : "bg-card/50 border-white/10 hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-2">
            {option.emoji && <span className="text-lg">{option.emoji}</span>}
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <span className={cn(
              "font-medium text-sm",
              isSelected(option.id) ? "text-primary" : "text-foreground"
            )}>
              {option.label}
            </span>
            {option.warning && (
              <AlertTriangle size={14} className="text-amber-400 ml-auto" />
            )}
          </div>
          {option.desc && (
            <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
          )}
          {isSelected(option.id) && (
            <motion.div
              layoutId={multiple ? undefined : "chip-check"}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
            >
              <Check size={12} className="text-primary-foreground" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function CustomEntryModal({
  isOpen,
  onClose,
  onAdd,
  title,
  placeholder
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (value: string) => void;
  title: string;
  placeholder: string;
}) {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background/50 border border-white/10 rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl disabled:opacity-50 transition-opacity"
        >
          Hinzufügen
        </button>
      </motion.div>
    </motion.div>
  );
}

function AddCustomButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="p-3 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
    >
      <Plus size={16} />
      <span className="text-xs font-medium">Eigene</span>
    </motion.button>
  );
}

function CustomEntryChip({ 
  label, 
  onRemove 
}: { 
  label: string; 
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-primary/20 border border-primary rounded-xl"
    >
      <span className="text-sm font-medium text-primary">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
      >
        <X size={12} className="text-primary" />
      </button>
    </motion.div>
  );
}

function TimeSlider({ 
  label, 
  value, 
  onChange,
  icon
}: { 
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) {
  // Generate time options (every 30 min)
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    times.push(`${h.toString().padStart(2, '0')}:00`);
    times.push(`${h.toString().padStart(2, '0')}:30`);
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card/50 border border-white/10 rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {times.map((time) => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
    </div>
  );
}

function SupplementSearch({ 
  selectedIds, 
  onToggle 
}: { 
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const filtered = search
    ? SUPPLEMENT_LIBRARY.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.benefits.some(b => b.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 10)
    : [];
  
  const quickSupplements = SUPPLEMENT_LIBRARY.filter(s => QUICK_SUPPLEMENTS.includes(s.id));
  
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="Supplement suchen..."
          className="w-full bg-card/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      {/* Search Results */}
      <AnimatePresence>
        {isExpanded && search && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card/80 border border-white/10 rounded-xl overflow-hidden"
          >
            {filtered.map((supp) => (
              <button
                key={supp.id}
                type="button"
                onClick={() => {
                  onToggle(supp.id);
                  setSearch('');
                }}
                className={cn(
                  "w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3",
                  selectedIds.includes(supp.id) && "bg-primary/10"
                )}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{supp.name}</div>
                  <div className="text-xs text-muted-foreground">{supp.benefits.slice(0, 2).join(', ')}</div>
                </div>
                {selectedIds.includes(supp.id) && (
                  <Check size={16} className="text-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quick Add */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Schnell hinzufügen:</p>
        <div className="flex flex-wrap gap-2">
          {quickSupplements.map((supp) => (
            <button
              key={supp.id}
              type="button"
              onClick={() => onToggle(supp.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedIds.includes(supp.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-muted-foreground hover:bg-white/20"
              )}
            >
              {supp.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected Count */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Check size={14} />
          <span>{selectedIds.length} Supplement{selectedIds.length !== 1 ? 's' : ''} ausgewählt</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

function Step1Welcome({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      {/* Helix Mascot */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-8"
      >
        <HelixMascot mood="happy" size="lg" />
      </motion.div>
      
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <SpeechBubble className="max-w-sm">
          <h1 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
            Hi, ich bin Helix!
          </h1>
          <p className="text-muted-foreground">
            Lass uns gemeinsam dein <span className="text-primary font-semibold">Potential freischalten</span>. 
            Ich helfe dir, die perfekte Supplement-Routine zu finden.
          </p>
        </SpeechBubble>
      </motion.div>
      
      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onNext}
        className="w-full max-w-sm bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
      >
        <span>Los geht&apos;s!</span>
        <ArrowRight size={20} />
      </motion.button>
      
      {/* Subtle info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs text-muted-foreground mt-6"
      >
        Dauert nur 2 Minuten • 100% personalisiert
      </motion.p>
    </motion.div>
  );
}

function Step2Basics({ 
  data, 
  onChange 
}: { 
  data: OnboardingData; 
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Helix asks */}
      <div className="flex items-start gap-3">
        <HelixMascot mood="thinking" size="sm" />
        <SpeechBubble className="flex-1">
          <p className="text-sm">Erzähl mir ein bisschen über dich, damit ich dich besser kennenlernen kann.</p>
        </SpeechBubble>
      </div>
      
      {/* Name Input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <User size={16} />
          Wie darf ich dich nennen?
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Dein Name oder Spitzname"
          className="w-full bg-card/50 border border-white/10 rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      {/* Age Group */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={16} />
          Altersgruppe
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => onChange({ ageGroup: age })}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                data.ageGroup === age
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/50 border border-white/10 text-muted-foreground hover:bg-white/5"
              )}
            >
              {age}
            </button>
          ))}
        </div>
      </div>
      
      {/* Gender */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Geschlecht</label>
        <ChipSelector
          options={GENDERS}
          selected={data.gender}
          onSelect={(id) => onChange({ gender: id })}
          columns={3}
        />
      </div>
      
      {/* Weight (Optional) */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Scale size={16} />
          Gewicht (optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={data.weight}
            onChange={(e) => onChange({ weight: e.target.value })}
            placeholder="75"
            className="flex-1 bg-card/50 border border-white/10 rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="text-muted-foreground">kg</span>
        </div>
        <p className="text-xs text-muted-foreground">Hilft bei der Dosierungsberechnung</p>
      </div>
    </motion.div>
  );
}

function Step3Lifestyle({ 
  data, 
  onChange 
}: { 
  data: OnboardingData; 
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Helix asks */}
      <div className="flex items-start gap-3">
        <HelixMascot mood="thinking" size="sm" />
        <SpeechBubble className="flex-1">
          <p className="text-sm">Wie sieht dein typischer Tag aus? Das hilft mir, die perfekten Einnahmezeiten zu finden.</p>
        </SpeechBubble>
      </div>
      
      {/* Sleep Times */}
      <div className="grid grid-cols-2 gap-4">
        <TimeSlider
          label="Schlafenszeit"
          value={data.bedtime}
          onChange={(v) => onChange({ bedtime: v })}
          icon={<Moon size={14} />}
        />
        <TimeSlider
          label="Aufstehzeit"
          value={data.wakeTime}
          onChange={(v) => onChange({ wakeTime: v })}
          icon={<Sun size={14} />}
        />
      </div>
      
      {/* Chronotype */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Dein Chronotyp</label>
        <ChipSelector
          options={CHRONOTYPES}
          selected={data.chronotype}
          onSelect={(id) => onChange({ chronotype: id })}
          columns={2}
        />
      </div>
      
      {/* Activity Level */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity size={16} />
          Aktivitätslevel
        </label>
        <ChipSelector
          options={ACTIVITY_LEVELS}
          selected={data.activityLevel}
          onSelect={(id) => onChange({ activityLevel: id })}
          columns={2}
        />
      </div>
      
      {/* Caffeine */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coffee size={16} />
          Koffein-Konsum
        </label>
        <ChipSelector
          options={CAFFEINE_LEVELS}
          selected={data.caffeineLevel}
          onSelect={(id) => onChange({ caffeineLevel: id })}
          columns={2}
        />
      </div>
    </motion.div>
  );
}

function Step4Nutrition({ 
  data, 
  onChange 
}: { 
  data: OnboardingData; 
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  const [showDietModal, setShowDietModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  
  const toggleAllergy = (id: string) => {
    const current = data.allergies;
    if (current.includes(id)) {
      onChange({ allergies: current.filter(a => a !== id) });
    } else {
      onChange({ allergies: [...current, id] });
    }
  };
  
  const toggleMedication = (id: string) => {
    if (id === 'none') {
      onChange({ medications: ['none'], customMedications: [] });
      return;
    }
    const current = data.medications.filter(m => m !== 'none');
    if (current.includes(id)) {
      onChange({ medications: current.filter(m => m !== id) });
    } else {
      onChange({ medications: [...current, id] });
    }
  };
  
  const addCustomDiet = (value: string) => {
    onChange({ customDiet: value, dietType: 'custom' });
  };
  
  const addCustomAllergy = (value: string) => {
    onChange({ customAllergies: [...data.customAllergies, value] });
  };
  
  const removeCustomAllergy = (value: string) => {
    onChange({ customAllergies: data.customAllergies.filter(a => a !== value) });
  };
  
  const addCustomMedication = (value: string) => {
    onChange({ 
      customMedications: [...data.customMedications, value],
      medications: data.medications.filter(m => m !== 'none')
    });
  };
  
  const removeCustomMedication = (value: string) => {
    onChange({ customMedications: data.customMedications.filter(m => m !== value) });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Modals */}
      <AnimatePresence>
        {showDietModal && (
          <CustomEntryModal
            isOpen={showDietModal}
            onClose={() => setShowDietModal(false)}
            onAdd={addCustomDiet}
            title="Eigene Ernährungsform"
            placeholder="z.B. Flexitarier, Roh-Vegan..."
          />
        )}
        {showAllergyModal && (
          <CustomEntryModal
            isOpen={showAllergyModal}
            onClose={() => setShowAllergyModal(false)}
            onAdd={addCustomAllergy}
            title="Eigene Allergie/Unverträglichkeit"
            placeholder="z.B. Histamin, Fructose..."
          />
        )}
        {showMedicationModal && (
          <CustomEntryModal
            isOpen={showMedicationModal}
            onClose={() => setShowMedicationModal(false)}
            onAdd={addCustomMedication}
            title="Eigenes Medikament"
            placeholder="z.B. Metformin, L-Thyroxin..."
          />
        )}
      </AnimatePresence>
      
      {/* Helix asks */}
      <div className="flex items-start gap-3">
        <HelixMascot mood="thinking" size="sm" />
        <SpeechBubble className="flex-1">
          <p className="text-sm">Ernährung und Medikamente beeinflussen, welche Supplements für dich geeignet sind.</p>
        </SpeechBubble>
      </div>
      
      {/* Diet Type */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Utensils size={16} />
          Ernährungsform
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIET_TYPES.map((diet) => (
            <motion.button
              key={diet.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ dietType: diet.id, customDiet: '' })}
              className={cn(
                "relative p-3 rounded-xl border transition-all text-left",
                data.dietType === diet.id
                  ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(167,243,208,0.15)]"
                  : "bg-card/50 border-white/10 hover:bg-white/5"
              )}
            >
              <span className={cn(
                "font-medium text-sm",
                data.dietType === diet.id ? "text-primary" : "text-foreground"
              )}>
                {diet.label}
              </span>
              {data.dietType === diet.id && (
                <motion.div
                  layoutId="diet-check"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check size={12} className="text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
          <AddCustomButton onClick={() => setShowDietModal(true)} />
        </div>
        {data.customDiet && (
          <div className="flex flex-wrap gap-2 mt-2">
            <CustomEntryChip 
              label={data.customDiet} 
              onRemove={() => onChange({ customDiet: '', dietType: '' })} 
            />
          </div>
        )}
      </div>
      
      {/* Allergies */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Allergien/Unverträglichkeiten (optional)</label>
        <div className="grid grid-cols-3 gap-2">
          {COMMON_ALLERGIES.map((allergy) => (
            <motion.button
              key={allergy.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleAllergy(allergy.id)}
              className={cn(
                "relative p-3 rounded-xl border transition-all text-left",
                data.allergies.includes(allergy.id)
                  ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(167,243,208,0.15)]"
                  : "bg-card/50 border-white/10 hover:bg-white/5"
              )}
            >
              <span className={cn(
                "font-medium text-sm",
                data.allergies.includes(allergy.id) ? "text-primary" : "text-foreground"
              )}>
                {allergy.label}
              </span>
              {data.allergies.includes(allergy.id) && (
                <motion.div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check size={12} className="text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
          <AddCustomButton onClick={() => setShowAllergyModal(true)} />
        </div>
        {data.customAllergies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <AnimatePresence>
              {data.customAllergies.map((allergy) => (
                <CustomEntryChip 
                  key={allergy}
                  label={allergy} 
                  onRemove={() => removeCustomAllergy(allergy)} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Medications */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Pill size={16} />
          Nimmst du regelmäßig Medikamente?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_MEDICATIONS.map((med) => (
            <motion.button
              key={med.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMedication(med.id)}
              className={cn(
                "relative p-3 rounded-xl border transition-all text-left",
                data.medications.includes(med.id)
                  ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(167,243,208,0.15)]"
                  : "bg-card/50 border-white/10 hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium text-sm",
                  data.medications.includes(med.id) ? "text-primary" : "text-foreground"
                )}>
                  {med.label}
                </span>
                {med.warning && (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
              </div>
              {data.medications.includes(med.id) && (
                <motion.div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check size={12} className="text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
          <AddCustomButton onClick={() => setShowMedicationModal(true)} />
        </div>
        {data.customMedications.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <AnimatePresence>
              {data.customMedications.map((med) => (
                <CustomEntryChip 
                  key={med}
                  label={med} 
                  onRemove={() => removeCustomMedication(med)} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        {(data.medications.some(m => 
          COMMON_MEDICATIONS.find(med => med.id === m)?.warning
        ) || data.customMedications.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs"
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Helix wird bei Supplement-Empfehlungen mögliche Wechselwirkungen berücksichtigen.</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function Step5Goals({ 
  data, 
  onChange 
}: { 
  data: OnboardingData; 
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  const toggleGoal = (id: string) => {
    const current = data.goals;
    if (current.includes(id)) {
      onChange({ goals: current.filter(g => g !== id) });
    } else if (current.length < 3) {
      onChange({ goals: [...current, id] });
    }
  };
  
  const toggleSupplement = (id: string) => {
    const current = data.currentSupplements;
    if (current.includes(id)) {
      onChange({ currentSupplements: current.filter(s => s !== id) });
    } else {
      onChange({ currentSupplements: [...current, id] });
    }
  };
  
  const toggleWearable = (id: string) => {
    if (id === 'none') {
      onChange({ wearables: ['none'] });
      return;
    }
    const current = data.wearables.filter(w => w !== 'none');
    if (current.includes(id)) {
      onChange({ wearables: current.filter(w => w !== id) });
    } else {
      onChange({ wearables: [...current, id] });
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Helix asks */}
      <div className="flex items-start gap-3">
        <HelixMascot mood="happy" size="sm" />
        <SpeechBubble className="flex-1">
          <p className="text-sm">Fast geschafft. Was möchtest du optimieren? Wähle bis zu 3 Ziele.</p>
        </SpeechBubble>
      </div>
      
      {/* Goals */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          Deine Top-Ziele ({data.goals.length}/3)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = data.goals.includes(goal.id);
            const isDisabled = !isSelected && data.goals.length >= 3;
            
            return (
              <motion.button
                key={goal.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => !isDisabled && toggleGoal(goal.id)}
                disabled={isDisabled}
                className={cn(
                  "p-3 rounded-xl border transition-all flex items-center gap-2",
                  isSelected
                    ? "bg-primary/20 border-primary"
                    : isDisabled
                    ? "bg-card/30 border-white/5 opacity-50 cursor-not-allowed"
                    : "bg-card/50 border-white/10 hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-lg", goal.bgColor)}>
                  <Icon size={16} className={goal.color} />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {goal.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Current Supplements */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          Nimmst du bereits Supplements?
        </label>
        <SupplementSearch 
          selectedIds={data.currentSupplements}
          onToggle={toggleSupplement}
        />
        <p className="text-xs text-muted-foreground/70">
          Eigene Supplements kannst du später in der App hinzufügen.
        </p>
      </div>
      
      {/* Wearables */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Watch size={16} />
          Nutzt du Wearables?
        </label>
        <ChipSelector
          options={WEARABLES}
          selected={data.wearables}
          onSelect={toggleWearable}
          multiple
          columns={3}
        />
      </div>
    </motion.div>
  );
}

// ============================================
// STEP 6: SIGNUP (NEU)
// ============================================

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptedPrivacy: boolean;
  acceptedHealthData: boolean;
}

function Step6Signup({ 
  data,
  signupData,
  onSignupChange,
  onSignup,
  onSkip,
  isLoading,
  error,
  isAuthenticated
}: { 
  data: OnboardingData;
  signupData: SignupData;
  onSignupChange: (updates: Partial<SignupData>) => void;
  onSignup: () => Promise<void>;
  onSkip: () => void;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const canSubmit = 
    signupData.email.trim() !== '' &&
    signupData.password.length >= 8 &&
    signupData.password === signupData.confirmPassword &&
    signupData.acceptedPrivacy &&
    signupData.acceptedHealthData;

  // Wenn bereits eingeloggt, zeige Erfolgsanzeige
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex flex-col items-center text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4"
          >
            <Check size={40} className="text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Konto erstellt!</h2>
          <p className="text-muted-foreground text-sm">
            Wir haben dir eine Bestätigungs-E-Mail gesendet.
            Du kannst die App sofort nutzen.
          </p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Helix asks */}
      <div className="flex items-start gap-3">
        <HelixMascot mood="happy" size="sm" />
        <SpeechBubble className="flex-1">
          <p className="text-sm">
            Super, {data.name || 'Biohacker'}! Erstelle jetzt dein Konto, 
            um deine Daten zu sichern und auf allen Geräten zu synchronisieren.
          </p>
        </SpeechBubble>
      </div>
      
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}
      
      {/* Email Input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail size={16} />
          E-Mail
        </label>
        <input
          type="email"
          value={signupData.email}
          onChange={(e) => onSignupChange({ email: e.target.value })}
          placeholder="deine@email.de"
          className="w-full bg-card/50 border border-white/10 rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoComplete="email"
        />
      </div>
      
      {/* Password Input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock size={16} />
          Passwort
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={signupData.password}
            onChange={(e) => onSignupChange({ password: e.target.value })}
            placeholder="Mindestens 8 Zeichen"
            className="w-full bg-card/50 border border-white/10 rounded-xl p-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoComplete="new-password"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {signupData.password.length > 0 && signupData.password.length < 8 && (
          <p className="text-xs text-amber-400">Mindestens 8 Zeichen erforderlich</p>
        )}
      </div>
      
      {/* Confirm Password */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock size={16} />
          Passwort bestätigen
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={signupData.confirmPassword}
            onChange={(e) => onSignupChange({ confirmPassword: e.target.value })}
            placeholder="Passwort wiederholen"
            className="w-full bg-card/50 border border-white/10 rounded-xl p-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {signupData.confirmPassword.length > 0 && signupData.password !== signupData.confirmPassword && (
          <p className="text-xs text-red-400">Passwörter stimmen nicht überein</p>
        )}
      </div>
      
      {/* DSGVO Checkboxes */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={signupData.acceptedPrivacy}
            onChange={(e) => onSignupChange({ acceptedPrivacy: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-card/50 accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            Ich akzeptiere die{' '}
            <Link href="/privacy" className="text-primary underline" target="_blank">
              Datenschutzerklärung
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={signupData.acceptedHealthData}
            onChange={(e) => onSignupChange({ acceptedHealthData: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-card/50 accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            Ich stimme der Verarbeitung meiner Gesundheitsdaten gemäß Art. 9 DSGVO zu
          </span>
        </label>
      </div>
      
      {/* Submit Button */}
      <button
        type="button"
        onClick={onSignup}
        disabled={!canSubmit || isLoading}
        className={cn(
          "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
          canSubmit && !isLoading
            ? "bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
            : "bg-white/10 text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Konto wird erstellt...</span>
          </>
        ) : (
          <>
            <User size={20} />
            <span>Konto erstellen</span>
          </>
        )}
      </button>
      
      {/* Info Text */}
      <p className="text-xs text-center text-muted-foreground">
        Du erhältst eine Bestätigungs-E-Mail. Du kannst die App trotzdem sofort nutzen.
      </p>
      
      {/* Skip Button (Dev/Test only) */}
      <button
        type="button"
        onClick={onSkip}
        className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-4"
      >
        Ohne Konto fortfahren (Test)
      </button>
    </motion.div>
  );
}

// ============================================
// STEP 7: PAYWALL
// ============================================

function Step7Paywall({ 
  data, 
  onComplete,
  isLoading 
}: { 
  data: OnboardingData;
  onComplete: (plan: 'yearly' | 'monthly' | 'skip') => void;
  isLoading: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Helix celebrates */}
      <div className="flex flex-col items-center text-center">
        <HelixMascot mood="celebrating" size="lg" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
            Perfekt, {data.name || 'User'}!
          </h2>
          <p className="text-muted-foreground mt-2">
            Dein personalisierter Plan ist bereit.
          </p>
        </motion.div>
      </div>
      
      {/* Features Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card/50 border border-white/10 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Personalisierte Empfehlungen</p>
            <p className="text-xs text-muted-foreground">Basierend auf deinen {data.goals.length} Zielen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Brain size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="font-medium text-sm">Helix AI-Coach</p>
            <p className="text-xs text-muted-foreground">24/7 Fragen beantworten</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Activity size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-sm">Gesundheits-Insights</p>
            <p className="text-xs text-muted-foreground">Trends & Korrelationen entdecken</p>
          </div>
        </div>
      </motion.div>
      
      {/* Pricing Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        {/* Yearly Plan */}
        <button
          type="button"
          onClick={() => setSelectedPlan('yearly')}
          className={cn(
            "w-full p-4 rounded-2xl border-2 transition-all text-left",
            selectedPlan === 'yearly'
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-card/50"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold">Jahresabo</p>
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase">
              Beste Wahl
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold text-primary">72€<span className="text-sm font-normal text-muted-foreground">/Jahr</span></p>
              <p className="text-xs text-muted-foreground">= 6€/Monat</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-primary font-medium">1 Tag kostenlos</p>
              <p className="text-xs text-muted-foreground">Spare 29%</p>
            </div>
          </div>
        </button>
        
        {/* Monthly Plan */}
        <button
          type="button"
          onClick={() => setSelectedPlan('monthly')}
          className={cn(
            "w-full p-4 rounded-2xl border-2 transition-all text-left",
            selectedPlan === 'monthly'
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-card/50"
          )}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">Monatsabo</p>
              <p className="text-2xl font-bold">7€<span className="text-sm font-normal text-muted-foreground">/Monat</span></p>
            </div>
            <p className="text-xs text-muted-foreground">1 Tag kostenlos</p>
          </div>
        </button>
      </motion.div>
      
      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="space-y-3"
      >
        <button
          type="button"
          onClick={() => onComplete(selectedPlan)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <Flame size={20} />
              <span>Free Trial starten</span>
            </>
          )}
        </button>
        
        <p className="text-[10px] text-center text-muted-foreground">
          Jederzeit kündbar • Keine Kosten während der Testphase
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// LOADING SCREEN
// ============================================

function LoadingScreen({ name }: { name: string }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Analysiere dein Profil...');
  
  useEffect(() => {
    const statuses = [
      'Analysiere dein Profil...',
      'Berechne optimale Dosierungen...',
      'Erstelle personalisierte Empfehlungen...',
      'Konfiguriere Helix AI...',
      'Fast fertig...'
    ];
    
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress(Math.min(current * 5, 100));
      
      if (current === 20) setStatus(statuses[1]);
      if (current === 40) setStatus(statuses[2]);
      if (current === 60) setStatus(statuses[3]);
      if (current === 80) setStatus(statuses[4]);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <HelixMascot mood="thinking" size="lg" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 w-full max-w-xs"
      >
        <h2 className="text-lg font-bold mb-2">
          Einen Moment, {name || 'User'}...
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{status}</p>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function OnboardingPage() {
  const router = useRouter();
  const { signUp, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  
  // Onboarding Data
  const [data, setData] = useState<OnboardingData>({
    name: '',
    ageGroup: '',
    gender: '',
    weight: '',
    bedtime: '23:00',
    wakeTime: '07:00',
    chronotype: '',
    activityLevel: '',
    caffeineLevel: '',
    dietType: '',
    customDiet: '',
    allergies: [],
    customAllergies: [],
    medications: [],
    customMedications: [],
    goals: [],
    currentSupplements: [],
    wearables: [],
  });
  
  // Signup Data
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    acceptedPrivacy: false,
    acceptedHealthData: false,
  });
  
  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateSignupData = useCallback((updates: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...updates }));
    // Fehler zurücksetzen wenn User tippt
    if (signupError) setSignupError(null);
  }, [signupError]);
  
  const canProceed = useCallback(() => {
    switch (step) {
      case 1: return true;
      case 2: return data.name.trim() !== '' && data.ageGroup !== '' && data.gender !== '';
      case 3: return data.chronotype !== '' && data.activityLevel !== '' && data.caffeineLevel !== '';
      case 4: return data.dietType !== '';
      case 5: return data.goals.length > 0;
      case 6: return isAuthenticated; // Nur weiter wenn eingeloggt
      case 7: return true;
      default: return true;
    }
  }, [step, data, isAuthenticated]);
  
  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };
  
  // Signup Handler
  const handleSignup = async () => {
    setIsLoading(true);
    setSignupError(null);
    
    try {
      // Validierung
      if (signupData.password !== signupData.confirmPassword) {
        setSignupError('Passwörter stimmen nicht überein');
        setIsLoading(false);
        return;
      }
      
      if (signupData.password.length < 8) {
        setSignupError('Passwort muss mindestens 8 Zeichen haben');
        setIsLoading(false);
        return;
      }
      
      if (!signupData.acceptedPrivacy) {
        setSignupError('Bitte akzeptiere die Datenschutzerklärung');
        setIsLoading(false);
        return;
      }
      
      if (!signupData.acceptedHealthData) {
        setSignupError('Bitte stimme der Verarbeitung deiner Gesundheitsdaten zu');
        setIsLoading(false);
        return;
      }
      
      // Supabase SignUp
      const { error } = await signUp(signupData.email, signupData.password);
      
      if (error) {
        // Fehler übersetzen
        const errorMap: Record<string, string> = {
          'User already registered': 'Diese E-Mail ist bereits registriert',
          'Invalid email': 'Ungültige E-Mail-Adresse',
          'Password should be at least 6 characters': 'Passwort zu kurz',
          'Email rate limit exceeded': 'Zu viele Anfragen, bitte warte kurz',
        };
        setSignupError(errorMap[error.message] || error.message);
        setIsLoading(false);
        return;
      }
      
      // Erfolg - automatisch weiter nach kurzer Verzögerung
      setTimeout(() => {
        handleNext();
      }, 1500);
      
    } catch (err) {
      setSignupError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleComplete = async (plan: 'yearly' | 'monthly' | 'skip') => {
    setIsLoading(true);
    setShowLoading(true);
    
    try {
      // Profil in Supabase speichern wenn User authentifiziert ist
      if (user?.id) {
        await updateUserProfile(user.id, {
          name: data.name,
          ageGroup: data.ageGroup,
          gender: data.gender,
          weight: data.weight,
          chronotype: data.chronotype,
          activityLevel: data.activityLevel,
          caffeineLevel: data.caffeineLevel,
          dietType: data.dietType || data.customDiet,
          allergies: [...data.allergies, ...data.customAllergies],
          medications: [...data.medications, ...data.customMedications],
          goals: data.goals,
          wearables: data.wearables,
        });
      }
      
      // Simulate additional processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save onboarding data to localStorage (backup/offline)
      localStorage.setItem('stax_onboarding_completed', 'true');
      localStorage.setItem('stax_disclaimer_accepted', 'true');
      localStorage.setItem('stax_user_profile', JSON.stringify(data));
      localStorage.setItem('stax_goals', JSON.stringify(data.goals));
      localStorage.setItem('stax_subscription_plan', plan);
      
      // Trigger app tour after onboarding
      localStorage.setItem('stax_start_tour', 'true');
      
      // Navigate to home
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Trotzdem weitermachen - localStorage hat Daten
      router.push('/');
    }
  };
  
  // Show loading screen
  if (showLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <LoadingScreen name={data.name} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>
      
      {/* Header */}
      {step > 1 && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Schritt {step} von {TOTAL_STEPS}
            </span>
            <div className="w-8" /> {/* Spacer */}
          </div>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </motion.header>
      )}
      
      {/* Content */}
      <main className="flex-1 px-4 py-6 relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && <Step1Welcome key="step1" onNext={handleNext} />}
          {step === 2 && <Step2Basics key="step2" data={data} onChange={updateData} />}
          {step === 3 && <Step3Lifestyle key="step3" data={data} onChange={updateData} />}
          {step === 4 && <Step4Nutrition key="step4" data={data} onChange={updateData} />}
          {step === 5 && <Step5Goals key="step5" data={data} onChange={updateData} />}
          {step === 6 && (
            <Step6Signup 
              key="step6" 
              data={data}
              signupData={signupData}
              onSignupChange={updateSignupData}
              onSignup={handleSignup}
              onSkip={handleNext}
              isLoading={isLoading}
              error={signupError}
              isAuthenticated={isAuthenticated}
            />
          )}
          {step === 7 && <Step7Paywall key="step7" data={data} onComplete={handleComplete} isLoading={isLoading} />}
        </AnimatePresence>
      </main>
      
      {/* Footer Navigation (Steps 2-5) */}
      {step >= 2 && step <= 5 && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/5 px-4 py-4"
        >
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
              canProceed()
                ? "bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                : "bg-white/10 text-muted-foreground cursor-not-allowed"
            )}
          >
            <span>Weiter</span>
            <ArrowRight size={20} />
          </button>
        </motion.footer>
      )}
      
      {/* Footer for Step 6 (after signup success) */}
      {step === 6 && isAuthenticated && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/5 px-4 py-4"
        >
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
          >
            <span>Weiter zur App</span>
            <ArrowRight size={20} />
          </button>
        </motion.footer>
      )}
    </div>
  );
}
