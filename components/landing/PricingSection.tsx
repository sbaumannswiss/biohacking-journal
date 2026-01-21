'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

interface PricingSectionProps {
  t: {
    title: string;
    subtitle: string;
    free: {
      name: string;
      price: string;
      description: string;
      features: string[];
      cta: string;
    };
    premium: {
      name: string;
      price: string;
      period: string;
      description: string;
      features: string[];
      cta: string;
      badge: string;
    };
  };
}

export function PricingSection({ t }: PricingSectionProps) {
  return (
    <section className="relative z-10 px-6 lg:px-12 py-16 lg:py-24 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {t.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8"
          >
            <h3 className="text-xl font-bold text-white mb-2">{t.free.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-white">{t.free.price}</span>
            </div>
            <p className="text-gray-400 mb-6">{t.free.description}</p>
            
            <ul className="space-y-3 mb-8">
              {t.free.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-300">
                  <Check size={18} className="text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#"
              className="block w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-center hover:bg-white/15 transition-all"
            >
              {t.free.cta}
            </a>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative bg-gradient-to-b from-primary/10 to-transparent border border-primary/30 rounded-2xl p-6 lg:p-8"
          >
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-black text-sm font-bold">
              {t.premium.badge}
            </div>

            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={20} className="text-primary" />
              {t.premium.name}
            </h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-white">{t.premium.price}</span>
              <span className="text-gray-400">/{t.premium.period}</span>
            </div>
            <p className="text-gray-400 mb-6">{t.premium.description}</p>
            
            <ul className="space-y-3 mb-8">
              {t.premium.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-300">
                  <Check size={18} className="text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold text-center hover:opacity-90 transition-all"
            >
              {t.premium.cta}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
