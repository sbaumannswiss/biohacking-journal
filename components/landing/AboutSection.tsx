'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface AboutSectionProps {
  t: {
    title: string;
    paragraphs: string[];
    signature: string;
    role: string;
  };
}

export function AboutSection({ t }: AboutSectionProps) {
  return (
    <section className="relative z-10 px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-12"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Zap size={48} className="text-black" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">
                {t.title}
              </h2>
              
              <div className="space-y-4 text-gray-400 leading-relaxed">
                {t.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white font-bold">{t.signature}</p>
                <p className="text-gray-500 text-sm">{t.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
