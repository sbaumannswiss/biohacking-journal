'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <Moon size={18} className="text-muted-foreground" />
          </div>
          <span className="text-sm font-medium">Dark Mode</span>
        </div>
        <div className="w-11 h-6 rounded-full bg-white/10" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg">
          {isDark ? (
            <Moon size={18} className="text-indigo-400" />
          ) : (
            <Sun size={18} className="text-amber-400" />
          )}
        </div>
        <span className="text-sm font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>
      
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`w-11 h-6 rounded-full transition-colors relative ${
          isDark ? 'bg-primary' : 'bg-amber-400'
        }`}
        aria-label={isDark ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center"
          animate={{ left: isDark ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? (
            <Moon size={12} className="text-primary" />
          ) : (
            <Sun size={12} className="text-amber-500" />
          )}
        </motion.div>
      </button>
    </div>
  );
}
