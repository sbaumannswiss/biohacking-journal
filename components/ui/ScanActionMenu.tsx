'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Activity, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScanActionMenuProps {
  onSupplementScan: () => void;
  onBloodworkAnalysis: () => void;
  className?: string;
}

export function ScanActionMenu({ 
  onSupplementScan, 
  onBloodworkAnalysis,
  className 
}: ScanActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSupplementScan = () => {
    setIsOpen(false);
    onSupplementScan();
  };

  const handleBloodworkAnalysis = () => {
    setIsOpen(false);
    onBloodworkAnalysis();
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isOpen 
            ? "bg-white/20 text-foreground" 
            : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
        )}
        title="Scannen"
      >
        {isOpen ? <X size={20} /> : <Camera size={20} />}
      </motion.button>

      {/* Menu Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-full left-0 mb-2 w-56 glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Supplement Scan */}
            <button
              onClick={handleSupplementScan}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Package size={20} className="text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Supplement scannen</p>
                <p className="text-xs text-muted-foreground">Produkt fotografieren</p>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Bloodwork Analysis */}
            <button
              onClick={handleBloodworkAnalysis}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Activity size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Blutbild analysieren</p>
                <p className="text-xs text-muted-foreground">Laborbefund hochladen</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
