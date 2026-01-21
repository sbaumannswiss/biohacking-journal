'use client';

import { motion } from 'framer-motion';
import { Pill, BookHeart, Bot, ScanBarcode } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

interface FeatureShowcaseProps {
  t: {
    title: string;
    subtitle: string;
    features: {
      supplements: { title: string; description: string };
      journal: { title: string; description: string };
      ai: { title: string; description: string };
      library: { title: string; description: string };
    };
  };
}

export function FeatureShowcase({ t }: FeatureShowcaseProps) {
  const features = [
    {
      icon: Pill,
      title: t.features.supplements.title,
      description: t.features.supplements.description,
      gradient: 'from-primary to-cyan-400',
    },
    {
      icon: BookHeart,
      title: t.features.journal.title,
      description: t.features.journal.description,
      gradient: 'from-purple-400 to-pink-400',
    },
    {
      icon: Bot,
      title: t.features.ai.title,
      description: t.features.ai.description,
      gradient: 'from-cyan-400 to-blue-400',
    },
    {
      icon: ScanBarcode,
      title: t.features.library.title,
      description: t.features.library.description,
      gradient: 'from-orange-400 to-amber-400',
    },
  ];

  return (
    <section className="relative z-10 px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">{t.title.split(' ')[0]} </span>
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
              {t.title.split(' ').slice(1).join(' ')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
