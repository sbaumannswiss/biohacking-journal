
'use client';

import { useState, useEffect } from 'react';
import type { TimeOfDay } from '@/types';

export function useTimeOfDay() {
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

    useEffect(() => {
        const updateTime = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 11) setTimeOfDay('morning');
            else if (hour >= 11 && hour < 17) setTimeOfDay('noon');
            else if (hour >= 17 && hour < 22) setTimeOfDay('evening');
            else setTimeOfDay('bedtime');
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    return timeOfDay;
}
