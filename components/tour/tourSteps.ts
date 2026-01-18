export interface TourStep {
  id: string;
  targetId: string;  // data-tour-id attribute value
  title: string;
  description: string;
  route: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home-dashboard',
    targetId: 'home-dashboard',
    title: 'Dein Dashboard',
    description: 'Hier siehst du deinen Fortschritt, XP und deine Supplements für die aktuelle Tageszeit. Hake ab, was du genommen hast.',
    route: '/',
    position: 'center',
    icon: '🏠',
  },
  {
    id: 'library-biolab',
    targetId: 'library-carousel',
    title: 'Das BioLab',
    description: 'Entdecke über 50 Supplements. Swipe durch die Karten, tippe zum Hinzufügen und baue deinen persönlichen Stack.',
    route: '/library',
    position: 'center',
    icon: '🧪',
  },
  {
    id: 'journal-tracking',
    targetId: 'journal-sliders',
    title: 'Dein Journal',
    description: 'Tracke täglich Schlaf, Energie und Fokus. So erkennst du, welche Supplements wirklich wirken.',
    route: '/journal',
    position: 'center',
    icon: '📊',
  },
  {
    id: 'workout-training',
    targetId: 'workout-main',
    title: 'Workout & Timing',
    description: 'Plane dein Training und erhalte optimierte Supplement-Empfehlungen für Pre- und Post-Workout.',
    route: '/workout',
    position: 'center',
    icon: '💪',
  },
  {
    id: 'stats-progress',
    targetId: 'stats-graph',
    title: 'Deine Statistiken',
    description: 'Analysiere deine Fortschritte, entdecke Trends und verstehe die Zusammenhänge zwischen Supplements und Wohlbefinden.',
    route: '/stats',
    position: 'center',
    icon: '📈',
  },
  {
    id: 'helix-coach',
    targetId: 'helix-chat',
    title: 'Helix - Dein Coach',
    description: 'Frag Helix jederzeit um Rat. Dein persönlicher AI-Coach hilft dir mit Dosierungen, Timings und Empfehlungen.',
    route: '/',
    position: 'center',
    icon: '🧬',
  },
];
