
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, User, TrendingUp, FlaskConical } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/journal', label: 'Journal', icon: LineChart },
        { href: '/library', label: 'Library', icon: FlaskConical }, // New dedicated page
        { href: '/stats', label: 'Stats', icon: TrendingUp }, // Analytics & Tracking
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/5 sm:max-w-md sm:mx-auto overflow-hidden"
            role="navigation"
            aria-label="Hauptnavigation"
        >
            <div 
                className="flex justify-around items-center px-4"
                style={{ height: '72px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className="flex flex-col items-center justify-center gap-1"
                            aria-label={link.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={clsx(
                                "p-1.5 rounded-xl transition-all duration-300",
                                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                            </div>
                            <span className={clsx(
                                "text-[9px] font-medium transition-colors leading-none",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
