
'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error(error.message, error.stack, { digest: error.digest });
    }, [error]);

    return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">Something went wrong!</h2>
            <p className="text-sm text-gray-500">We've been notified about this issue.</p>
            <Button
                onClick={() => reset()}
                variant="outline"
            >
                Try again
            </Button>
        </div>
    );
}
