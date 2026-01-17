'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Check, Flame, Trophy, Sun, Coffee, Moon, Sunset,
  Zap, Brain, Droplet, Shield, Loader2, Sparkles, Users
} from 'lucide-react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [signupCount, setSignupCount] = useState(847);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        setSignupCount(prev => prev + 1);
      } else {
        setError(data.error || 'Etwas ist schiefgelaufen');
      }
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[20%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-100px] right-[10%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <Zap size={22} className="text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight">STAX</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            <span>{signupCount.toLocaleString()}+ auf der Warteliste</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 lg:px-12 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center justify-center">
            
            {/* Left Side - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative order-2 lg:order-1 flex-shrink-0"
            >
              <PhoneMockup />
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 max-w-xl"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>Bald verfügbar</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">Dein </span>
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
                  Performance
                </span>
                <br />
                <span className="text-white">Tracker</span>
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                Tracke deine Supplements, optimiere dein Timing und erreiche neue Levels. 
                Die intelligente App für deine Performance.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-3 mb-8">
                {['Smart Tracking', 'XP & Levels', 'AI Coach', 'Wearable Sync'].map((feature) => (
                  <span 
                    key={feature}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Email Form */}
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="deine@email.de"
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
                    >
                      {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <span>Early Access</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-3 text-red-400 text-sm">{error}</p>
                  )}
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-6 rounded-xl bg-primary/10 border border-primary/30"
                >
                  <div className="flex items-center gap-3 text-primary mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check size={18} className="text-black" />
                    </div>
                    <span className="font-bold text-lg">Du bist dabei!</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Wir benachrichtigen dich, sobald STAX startet. 
                    Check deine Inbox für Updates!
                  </p>
                </motion.div>
              )}

              {/* Social Proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-bold"
                    >
                      {['🧬', '💊', '🧠', '⚡'][i - 1]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="text-white font-semibold">{signupCount.toLocaleString()}+</span> User warten bereits
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2026 STAX. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-white transition-colors">Impressum</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Phone Mockup Component with App Preview
function PhoneMockup() {
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
