'use client';

import { motion } from 'framer-motion';
import { Download, Layers, TrendingUp } from 'lucide-react';

interface HowItWorksProps {
  t: {
    title: string;
    subtitle: string;
    steps: {
      download: { title: string; description: string };
      setup: { title: string; description: string };
      track: { title: string; description: string };
    };
  };
}

export function HowItWorks({ t }: HowItWorksProps) {
  const steps = [
    {
      icon: Download,
      number: '01',
      title: t.steps.download.title,
      description: t.steps.download.description,
    },
    {
      icon: Layers,
      number: '02',
      title: t.steps.setup.title,
      description: t.steps.setup.description,
    },
    {
      icon: TrendingUp,
      number: '03',
      title: t.steps.track.title,
      description: t.steps.track.description,
    },
  ];

  return (
    <section className="relative z-10 px-6 lg:px-12 py-16 lg:py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
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

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              {/* Number Badge */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-400/20 border border-primary/30 flex items-center justify-center">
                  <step.icon size={40} className="text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-black text-sm font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
