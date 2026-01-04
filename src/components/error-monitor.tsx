'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ErrorMonitor() {
    useEffect(() => {
        logger.init();
        // Optional: Log a session start for debugging/analytics if needed, 
        // but skipping to keep logs clean as per "Avoid logging sensitive data/duplicates"
    }, []);

    return null; // This component handles side effects only
}
