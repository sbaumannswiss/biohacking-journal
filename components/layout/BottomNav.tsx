
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { HomeIcon, JournalIcon, LibraryIcon, StatsIcon, WorkoutIcon } from '@/components/icons/NavIcons';

export function BottomNav() {
    const pathname = usePathname();
    const t = useTranslations('nav');

    const links = [
        { href: '/', labelKey: 'home' as const, icon: HomeIcon },
        { href: '/journal', labelKey: 'journal' as const, icon: JournalIcon },
        { href: '/workout', labelKey: 'workout' as const, icon: WorkoutIcon },
        { href: '/library', labelKey: 'library' as const, icon: LibraryIcon },
        { href: '/stats', labelKey: 'stats' as const, icon: StatsIcon },
    ];

    return (
        <nav 
            data-bottom-nav
            className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/5 sm:max-w-md sm:mx-auto overflow-hidden"
            role="navigation"
            aria-label="Hauptnavigation"
        >
            <div 
                className="flex justify-around items-center px-2"
                style={{ height: '88px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    const label = t(link.labelKey);

                    return (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className="flex flex-col items-center justify-center gap-1.5 min-w-[56px] py-2"
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={clsx(
                                "p-2.5 rounded-xl transition-all duration-300",
                                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}>
                                <Icon size={28} aria-hidden="true" />
                            </div>
                            <span className={clsx(
                                "text-[11px] font-medium transition-colors leading-none",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
