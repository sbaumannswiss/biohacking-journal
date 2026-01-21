'use client';

import { motion } from 'framer-motion';
import { Zap, Users, Download } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';

interface HeroSectionProps {
  t: {
    badge: string;
    headline1: string;
    headline2: string;
    headline3: string;
    description: string;
    features: string[];
    appStore: string;
    playStore: string;
    usersCount: string;
  };
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative z-10 px-6 lg:px-12 py-8 lg:py-16">
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
              <Download size={16} />
              <span>{t.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-white">{t.headline1} </span>
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
                {t.headline2}
              </span>
              <br />
              <span className="text-white">{t.headline3}</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-400 mb-8 max-w-lg">
              {t.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-3 mb-8">
              {t.features.map((feature) => (
                <span 
                  key={feature}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href="#"
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="text-sm font-bold">{t.appStore}</div>
                </div>
              </a>
              <a
                href="#"
                className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/15 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="text-sm font-bold">{t.playStore}</div>
                </div>
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-[#0a0a0f] flex items-center justify-center"
                  >
                    <Users size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                <span className="text-white font-semibold">1.000+</span> {t.usersCount}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
