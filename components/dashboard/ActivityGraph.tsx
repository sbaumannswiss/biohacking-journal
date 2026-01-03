'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';

interface ActivityGraphProps {
    data?: number[];
    loading?: boolean;
}

export function ActivityGraph({ data = [], loading = false }: ActivityGraphProps) {
    const height = 150;
    const width = 350;

    // Mindestens 2 Datenpunkte für sinnvollen Graph
    const hasRealData = data.length >= 2;
    const dataPoints = hasRealData ? data : [];

    // Calculate SVG Path - nur wenn echte Daten vorhanden
    const pathData = useMemo(() => {
        if (!hasRealData) return '';
        
        const max = Math.max(...dataPoints, 100);
        const min = Math.min(...dataPoints, 0);
        const range = max - min || 1;
        
        const points = dataPoints.map((val, index) => {
            const x = (index / (dataPoints.length - 1)) * width;
            const normalizedVal = (val - min) / range;
            const y = height - (normalizedVal * (height * 0.6)) - (height * 0.2);
            return { x, y };
        });

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            const controlX1 = current.x + (next.x - current.x) * 0.5;
            const controlY1 = current.y;
            const controlX2 = current.x + (next.x - current.x) * 0.5;
            const controlY2 = next.y;

            d += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
        }

        return d;
    }, [dataPoints, hasRealData]);

    // Berechne Y-Position für letzten Punkt
    const lastPointY = useMemo(() => {
        if (!hasRealData) return height / 2;
        
        const max = Math.max(...dataPoints, 100);
        const min = Math.min(...dataPoints, 0);
        const range = max - min || 1;
        const lastVal = dataPoints[dataPoints.length - 1];
        return height - ((lastVal - min) / range) * (height * 0.6) - (height * 0.2);
    }, [dataPoints, hasRealData]);

    // Wochentage Labels
    const dayLabels = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            labels.push(days[(today - i + 7) % 7]);
        }
        return labels;
    }, []);

    return (
        <div className="w-full glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Bio-Performance Trend
                </h3>
            </div>

            <div className="relative h-[150px] w-full flex items-center justify-center">
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">Loading data...</span>
                    </div>
                ) : !hasRealData ? (
                    /* Empty State - Kein Graph wenn keine echten Daten */
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <BarChart3 size={24} className="text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">Noch keine Daten</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                            Logge deine Metriken im Journal
                        </p>
                    </div>
                ) : (
                    <svg 
                        width="100%" 
                        height="100%" 
                        viewBox={`0 0 ${width} ${height}`} 
                        preserveAspectRatio="none" 
                        className="overflow-visible"
                        aria-label="Bio-Performance Graph"
                    >
                        <defs>
                            <linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <motion.path
                            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
                            fill="url(#activityGradient)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5 }}
                        />

                        {/* Stroke Line */}
                        <motion.path
                            d={pathData}
                            fill="none"
                            stroke="#A7F3D0"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            style={{ filter: "drop-shadow(0 0 10px rgba(167, 243, 208, 0.5))" }}
                        />

                        {/* Current Point Indicator */}
                        <motion.circle 
                            cx={width} 
                            cy={lastPointY} 
                            r="5" 
                            fill="#A7F3D0" 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.5, type: "spring" }}
                            className="animate-pulse"
                            style={{ filter: "drop-shadow(0 0 8px rgba(167, 243, 208, 0.8))" }}
                        />
                    </svg>
                )}
            </div>

            {/* Day Labels - nur wenn echte Daten vorhanden */}
            {hasRealData && (
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                    {dayLabels.map((day, i) => (
                        <span key={i} className={i === 6 ? "text-primary font-bold" : ""}>
                            {day}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
