'use client';

import { motion } from 'framer-motion';
import { 
  Check, Flame, Trophy, Sun, Coffee, Moon, Sunset,
  Brain, Droplet, Shield
} from 'lucide-react';

export function PhoneMockup() {
  const mockSupplements = [
    { name: 'Vitamin D3', dosage: '5000 IU', icon: Sun, checked: true },
    { name: 'Omega-3', dosage: '2g EPA/DHA', icon: Droplet, checked: true },
    { name: 'Lion\'s Mane', dosage: '1000mg', icon: Brain, checked: false },
    { name: 'Magnesium', dosage: '400mg', icon: Shield, checked: false },
  ];

  return (
    <div className="relative">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-cyan-500/20 blur-3xl scale-110 opacity-50" />
      
      {/* Phone Frame */}
      <div className="relative w-[280px] sm:w-[300px] h-[560px] sm:h-[620px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl shadow-black/50">
        {/* Inner Frame */}
        <div className="w-full h-full bg-[#0d0d14] rounded-[2.5rem] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-20" />
          
          {/* App Content */}
          <div className="h-full overflow-hidden px-4 pt-10 pb-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-base font-bold text-white">Good Morning,</h2>
                <span className="text-primary font-bold text-sm">User</span>
              </div>
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg">
                <Flame size={12} className="text-orange-400" fill="currentColor" />
                <span className="text-orange-400 font-bold text-xs">12</span>
              </div>
            </div>

            {/* XP Display */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-1 rounded-lg">
                    <Trophy size={12} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 uppercase font-bold block leading-tight">STAX Novize</span>
                    <span className="text-sm font-bold text-white leading-tight">Level 5</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-primary font-mono font-bold text-xs">127</span>
                  <span className="text-gray-500 text-[9px]">/230 XP</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '55%' }}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Time Tabs */}
            <div className="grid grid-cols-4 gap-1 mb-2">
              {[
                { id: 'morning', label: 'Morning', Icon: Sun, active: true, count: 4 },
                { id: 'noon', label: 'Noon', Icon: Coffee, active: false, count: 2 },
                { id: 'evening', label: 'Evening', Icon: Sunset, active: false, count: 1 },
                { id: 'bedtime', label: 'Bedtime', Icon: Moon, active: false, count: 2 },
              ].map((tab) => (
                <div
                  key={tab.id}
                  className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[7px] font-medium ${
                    tab.active
                      ? 'bg-primary text-black'
                      : 'bg-white/5 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    <tab.Icon size={8} />
                    <span>{tab.label}</span>
                  </div>
                  <span className={`min-w-[12px] h-[12px] flex items-center justify-center rounded-full text-[7px] font-bold ${
                    tab.active ? 'bg-white/20' : 'bg-primary/20 text-primary'
                  }`}>
                    {tab.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Stack Header */}
            <div className="flex items-center gap-1 text-gray-400 text-[9px] uppercase tracking-wider mb-1.5">
              <span>Morning Stack</span>
              <span className="text-primary text-[7px]">(jetzt)</span>
            </div>

            {/* Supplement Cards */}
            <div className="space-y-1.5">
              {mockSupplements.map((supp, idx) => (
                <motion.div
                  key={supp.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className={`flex items-center gap-2 p-2 rounded-xl border ${
                    supp.checked
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    supp.checked
                      ? 'bg-primary border-primary'
                      : 'border-white/20'
                  }`}>
                    {supp.checked && <Check size={12} className="text-black" strokeWidth={3} />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold text-[10px] block ${supp.checked ? 'text-primary' : 'text-white'}`}>
                      {supp.name}
                    </span>
                    <span className="text-[8px] text-gray-500">{supp.dosage}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Complete Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mt-2"
            >
              <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-black font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Check size={12} strokeWidth={3} />
                <span>Complete Stack (2/4)</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Nav Hint */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-1.5">
            <div className="w-28 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
