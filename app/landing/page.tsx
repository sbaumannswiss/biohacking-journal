'use client';

import { useState } from 'react';
import { Zap, Globe } from 'lucide-react';
import {
  HeroSection,
  FeatureShowcase,
  HowItWorks,
  AboutSection,
  PricingSection,
  FAQSection,
  FeatureRequestForm,
  LandingFooter,
} from '@/components/landing';

type Locale = 'de' | 'en';

const translations = {
  de: {
    header: {
      badge: 'Jetzt verfuegbar',
    },
    hero: {
      badge: 'Jetzt verfuegbar',
      headline1: 'Dein',
      headline2: 'Performance',
      headline3: 'Tracker',
      description: 'Tracke deine Supplements, optimiere dein Timing und erreiche neue Levels. Die intelligente App fuer deine Performance.',
      features: ['Smart Tracking', 'XP & Levels', 'AI Coach', 'Wearable Sync'],
      appStore: 'App Store',
      playStore: 'Google Play',
      usersCount: 'User nutzen STAX',
    },
    features: {
      title: 'Alles was du brauchst',
      subtitle: 'Vier leistungsstarke Features, die deinen Alltag optimieren',
      features: {
        supplements: {
          title: 'Supplement-Tracking',
          description: 'Verwalte deine Stacks, tracke Dosierungen und behalte den Ueberblick ueber deine taegliche Einnahme. Nie wieder vergessen.',
        },
        journal: {
          title: 'Health Journal',
          description: 'Dokumentiere taegliche Metriken wie Schlaf, Energie und Stimmung. Erkenne Muster und optimiere deine Routine.',
        },
        ai: {
          title: 'AI Coach Helix',
          description: 'Erhalte personalisierte Empfehlungen basierend auf deinen Daten. Dein intelligenter Begleiter fuer optimale Performance.',
        },
        library: {
          title: 'Supplement-Bibliothek',
          description: 'Durchsuche unsere Datenbank oder scanne Barcodes. Finde Infos zu Wirkung, Dosierung und Interaktionen.',
        },
      },
    },
    howItWorks: {
      title: 'So funktioniert es',
      subtitle: 'In drei einfachen Schritten zu deiner optimalen Routine',
      steps: {
        download: {
          title: 'App herunterladen',
          description: 'Lade STAX kostenlos im App Store oder Google Play herunter und erstelle dein Profil.',
        },
        setup: {
          title: 'Stack einrichten',
          description: 'Fuege deine Supplements hinzu - manuell oder per Barcode-Scan. Lege Zeiten und Dosierungen fest.',
        },
        track: {
          title: 'Taeglich tracken',
          description: 'Markiere erledigte Einnahmen, sammle XP und beobachte deine Fortschritte ueber die Zeit.',
        },
      },
    },
    about: {
      title: 'Die Vision hinter STAX',
      paragraphs: [
        'STAX entstand aus der Frustration, keine einfache Loesung zum Tracken von Supplements zu finden. Bestehende Apps waren entweder zu kompliziert oder zu simpel.',
        'Unser Ziel: Eine App, die sich so gut anfuehlt, dass du sie gerne jeden Tag oeffnest. Mit Gamification-Elementen, die motivieren - ohne zu nerven.',
        'Wir glauben daran, dass kleine, konsistente Handlungen zu grossen Veraenderungen fuehren. STAX hilft dir dabei, diese Konsistenz zu halten.',
      ],
      signature: 'Das STAX Team',
      role: 'Entwickler & Biohacker',
    },
    pricing: {
      title: 'Einfache Preise',
      subtitle: 'Starte kostenlos, upgrade wenn du bereit bist',
      free: {
        name: 'Free',
        price: '0 EUR',
        description: 'Alles was du brauchst um zu starten',
        features: [
          'Unbegrenzte Supplements',
          'Taegliches Tracking',
          'Basis-Statistiken',
          'Barcode-Scanner',
        ],
        cta: 'Kostenlos starten',
      },
      premium: {
        name: 'Premium',
        price: '4,99 EUR',
        period: 'Monat',
        description: 'Fuer ernsthafte Biohacker',
        features: [
          'Alles aus Free',
          'AI Coach Helix',
          'Erweiterte Analysen',
          'Wearable-Integration',
          'Prioritaets-Support',
        ],
        cta: 'Premium holen',
        badge: 'Beliebt',
      },
    },
    faq: {
      title: 'Haeufige Fragen',
      subtitle: 'Alles was du wissen musst',
      items: [
        {
          question: 'Ist STAX wirklich kostenlos?',
          answer: 'Ja, die Grundfunktionen von STAX sind komplett kostenlos. Du kannst unbegrenzt Supplements tracken, den Barcode-Scanner nutzen und deine Basis-Statistiken einsehen. Premium-Features wie der AI Coach sind optional.',
        },
        {
          question: 'Wie schuetzt ihr meine Daten?',
          answer: 'Deine Daten werden verschluesselt uebertragen und auf EU-Servern gespeichert. Wir verkaufen keine Daten an Dritte. Du kannst deine Daten jederzeit exportieren oder loeschen lassen.',
        },
        {
          question: 'Welche Wearables werden unterstuetzt?',
          answer: 'Aktuell unterstuetzen wir Apple Health, Google Fit und Garmin. Weitere Integrationen wie Whoop und Oura sind in Planung.',
        },
        {
          question: 'Kann ich meine eigenen Supplements hinzufuegen?',
          answer: 'Ja, du kannst jedes Supplement manuell hinzufuegen oder per Barcode scannen. Falls ein Produkt nicht in unserer Datenbank ist, kannst du es selbst anlegen.',
        },
        {
          question: 'Wie funktioniert das XP-System?',
          answer: 'Du sammelst XP fuer konsistentes Tracking, abgeschlossene Quests und taegliche Streaks. Mit jedem Level schaltest du neue Features frei und siehst deinen Fortschritt.',
        },
        {
          question: 'Gibt es eine Web-Version?',
          answer: 'STAX ist aktuell als Mobile-App verfuegbar. Eine Web-Version ist in Entwicklung und wird in Zukunft verfuegbar sein.',
        },
      ],
    },
    featureRequest: {
      title: 'Feature-Wunsch?',
      subtitle: 'Sag uns was du dir wuenschst - wir hoeren zu',
      fields: {
        name: 'Name',
        namePlaceholder: 'Dein Name (optional)',
        email: 'E-Mail',
        emailPlaceholder: 'deine@email.de',
        category: 'Kategorie',
        categoryPlaceholder: 'Waehle eine Kategorie',
        categories: ['Neues Feature', 'Verbesserung', 'Integration', 'Design', 'Sonstiges'],
        description: 'Beschreibung',
        descriptionPlaceholder: 'Beschreibe deine Idee...',
      },
      submit: 'Absenden',
      success: {
        title: 'Danke!',
        message: 'Wir haben deinen Vorschlag erhalten und werden ihn pruefen.',
      },
      errors: {
        email: 'Bitte gib eine gueltige E-Mail-Adresse ein',
        description: 'Bitte beschreibe deine Idee',
        generic: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
      },
    },
    footer: {
      copyright: '2026 STAX. Alle Rechte vorbehalten.',
      links: {
        privacy: 'Datenschutz',
        imprint: 'Impressum',
      },
      appStore: 'App Store',
      playStore: 'Google Play',
    },
    nav: {
      features: 'Features',
      pricing: 'Preise',
      faq: 'FAQ',
    },
  },
  en: {
    header: {
      badge: 'Available Now',
    },
    hero: {
      badge: 'Available Now',
      headline1: 'Your',
      headline2: 'Performance',
      headline3: 'Tracker',
      description: 'Track your supplements, optimize your timing and reach new levels. The intelligent app for your performance.',
      features: ['Smart Tracking', 'XP & Levels', 'AI Coach', 'Wearable Sync'],
      appStore: 'App Store',
      playStore: 'Google Play',
      usersCount: 'users trust STAX',
    },
    features: {
      title: 'Everything you need',
      subtitle: 'Four powerful features that optimize your daily routine',
      features: {
        supplements: {
          title: 'Supplement Tracking',
          description: 'Manage your stacks, track dosages and keep track of your daily intake. Never forget again.',
        },
        journal: {
          title: 'Health Journal',
          description: 'Document daily metrics like sleep, energy and mood. Recognize patterns and optimize your routine.',
        },
        ai: {
          title: 'AI Coach Helix',
          description: 'Get personalized recommendations based on your data. Your intelligent companion for optimal performance.',
        },
        library: {
          title: 'Supplement Library',
          description: 'Browse our database or scan barcodes. Find info on effects, dosage and interactions.',
        },
      },
    },
    howItWorks: {
      title: 'How it works',
      subtitle: 'Three simple steps to your optimal routine',
      steps: {
        download: {
          title: 'Download the app',
          description: 'Download STAX for free from App Store or Google Play and create your profile.',
        },
        setup: {
          title: 'Set up your stack',
          description: 'Add your supplements - manually or by barcode scan. Set times and dosages.',
        },
        track: {
          title: 'Track daily',
          description: 'Mark completed intakes, collect XP and watch your progress over time.',
        },
      },
    },
    about: {
      title: 'The vision behind STAX',
      paragraphs: [
        'STAX was born from the frustration of not finding a simple solution for tracking supplements. Existing apps were either too complicated or too simple.',
        'Our goal: An app that feels so good that you want to open it every day. With gamification elements that motivate - without being annoying.',
        'We believe that small, consistent actions lead to big changes. STAX helps you maintain that consistency.',
      ],
      signature: 'The STAX Team',
      role: 'Developers & Biohackers',
    },
    pricing: {
      title: 'Simple pricing',
      subtitle: 'Start free, upgrade when ready',
      free: {
        name: 'Free',
        price: '0 EUR',
        description: 'Everything you need to get started',
        features: [
          'Unlimited supplements',
          'Daily tracking',
          'Basic statistics',
          'Barcode scanner',
        ],
        cta: 'Start free',
      },
      premium: {
        name: 'Premium',
        price: '4.99 EUR',
        period: 'month',
        description: 'For serious biohackers',
        features: [
          'Everything in Free',
          'AI Coach Helix',
          'Advanced analytics',
          'Wearable integration',
          'Priority support',
        ],
        cta: 'Get Premium',
        badge: 'Popular',
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know',
      items: [
        {
          question: 'Is STAX really free?',
          answer: 'Yes, the basic features of STAX are completely free. You can track unlimited supplements, use the barcode scanner and view your basic statistics. Premium features like the AI Coach are optional.',
        },
        {
          question: 'How do you protect my data?',
          answer: 'Your data is encrypted in transit and stored on EU servers. We do not sell data to third parties. You can export or delete your data at any time.',
        },
        {
          question: 'Which wearables are supported?',
          answer: 'We currently support Apple Health, Google Fit and Garmin. Additional integrations like Whoop and Oura are planned.',
        },
        {
          question: 'Can I add my own supplements?',
          answer: 'Yes, you can add any supplement manually or by barcode scan. If a product is not in our database, you can create it yourself.',
        },
        {
          question: 'How does the XP system work?',
          answer: 'You collect XP for consistent tracking, completed quests and daily streaks. With each level you unlock new features and see your progress.',
        },
        {
          question: 'Is there a web version?',
          answer: 'STAX is currently available as a mobile app. A web version is in development and will be available in the future.',
        },
      ],
    },
    featureRequest: {
      title: 'Feature Request?',
      subtitle: 'Tell us what you want - we are listening',
      fields: {
        name: 'Name',
        namePlaceholder: 'Your name (optional)',
        email: 'Email',
        emailPlaceholder: 'your@email.com',
        category: 'Category',
        categoryPlaceholder: 'Select a category',
        categories: ['New Feature', 'Improvement', 'Integration', 'Design', 'Other'],
        description: 'Description',
        descriptionPlaceholder: 'Describe your idea...',
      },
      submit: 'Submit',
      success: {
        title: 'Thank you!',
        message: 'We have received your suggestion and will review it.',
      },
      errors: {
        email: 'Please enter a valid email address',
        description: 'Please describe your idea',
        generic: 'Something went wrong. Please try again.',
      },
    },
    footer: {
      copyright: '2026 STAX. All rights reserved.',
      links: {
        privacy: 'Privacy',
        imprint: 'Imprint',
      },
      appStore: 'App Store',
      playStore: 'Google Play',
    },
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
    },
  },
};

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>('de');
  const t = translations[locale];

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
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">{t.nav.features}</a>
              <a href="#pricing" className="hover:text-white transition-colors">{t.nav.pricing}</a>
              <a href="#faq" className="hover:text-white transition-colors">{t.nav.faq}</a>
            </nav>
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Globe size={14} />
              <span className="uppercase font-medium">{locale}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <HeroSection t={t.hero} />
        
        <div id="features">
          <FeatureShowcase t={t.features} />
        </div>
        
        <HowItWorks t={t.howItWorks} />
        
        <AboutSection t={t.about} />
        
        <div id="pricing">
          <PricingSection t={t.pricing} />
        </div>
        
        <div id="faq">
          <FAQSection t={t.faq} />
        </div>
        
        <FeatureRequestForm t={t.featureRequest} />
      </main>

      <LandingFooter t={t.footer} />
    </div>
  );
}
