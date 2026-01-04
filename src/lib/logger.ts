import { API_URL } from './api';

type LogLevel = 'info' | 'warn' | 'error';

interface LogData {
    message: string;
    level: LogLevel;
    timestamp: string;
    url?: string;
    userAgent?: string;
    stack?: string;
    context?: any;
}

interface LogEntry extends LogData {
    hash: string;
}

class Logger {
    private queue: LogEntry[] = [];
    private processing = false;
    private batchSize = 10;
    private flushInterval = 5000;
    private dedupeSet = new Set<string>();
    private dedupeWindow = 10000; // 10 seconds
    private initialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            setInterval(() => this.processQueue(), this.flushInterval);
        }
    }

    public init() {
        if (this.initialized || typeof window === 'undefined') return;

        // Capture uncaught errors
        window.addEventListener('error', (event) => {
            this.error(event.message, event.error?.stack, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'uncaught_exception'
            });
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            // Unhandled rejections often allow you to prevent default console error
            // event.preventDefault(); 
            let message = 'Unhandled Rejection';
            let stack: string | undefined;
            let context: any = { type: 'unhandled_rejection' };

            if (event.reason instanceof Error) {
                message = event.reason.message;
                stack = event.reason.stack;
            } else {
                // If the rejection reason is not an Error, it might be a string or object
                try {
                    message = typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason);
                } catch {
                    message = 'Unknown Unhandled Rejection';
                }
            }

            this.error(message, stack, context);
        });

        this.initialized = true;
    }

    private generateHash(data: LogData): string {
        // Simple hash based on content to identify duplicates
        // We focus on message and stack as the unique fingerprint
        return `${data.level}:${data.message}:${data.stack || ''}`;
    }

    private sanitize(data: any): any {
        if (!data) return data;
        try {
            const str = JSON.stringify(data);
            // Simple regex to mask common sensitive keys if they appear in context
            // Note: This is a basic safety net.
            const sanitized = str.replace(/("password"|"token"|"secret"|"authorization")\s*:\s*"[^"]+"/gi, '$1:"***"');
            return JSON.parse(sanitized);
        } catch {
            return '[Circular or Non-Serializable Data]';
        }
    }

    private log(level: LogLevel, rawMessage: string, context?: any, stack?: string) {
        if (typeof window === 'undefined') return; // Frontend logger only runs in browser

        const timestamp = new Date().toISOString();
        const url = window.location.href;
        const userAgent = navigator.userAgent;

        // Sanitize context
        const safeContext = this.sanitize(context);

        const data: LogData = {
            message: rawMessage,
            level,
            timestamp,
            url,
            userAgent,
            stack,
            context: safeContext
        };

        const hash = this.generateHash(data);

        // Deduplication
        if (this.dedupeSet.has(hash)) {
            return;
        }

        this.dedupeSet.add(hash);
        setTimeout(() => this.dedupeSet.delete(hash), this.dedupeWindow);

        this.queue.push({ ...data, hash });

        // Force flush if queue gets too big
        if (this.queue.length >= this.batchSize) {
            this.processQueue();
        }

        // Also log to console for local DX
        const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        consoleMethod(`[${level.toUpperCase()}]`, rawMessage, safeContext || '', stack || '');
    }

    public info(message: string, context?: any) {
        this.log('info', message, context);
    }

    public warn(message: string, context?: any) {
        this.log('warn', message, context);
    }

    public error(message: string, stack?: string, context?: any) {
        this.log('error', message, context, stack);
    }

    // Capture failed network requests (can be used in fetch wrappers or interceptors)
    public captureNetworkError(url: string, method: string, status: number, statusText: string, responseBody?: any) {
        this.error(`Network Error: ${method} ${url}`, undefined, {
            status,
            statusText,
            responseBody: this.sanitize(responseBody),
            type: 'network_error'
        });
    }

    private async processQueue() {
        if (this.queue.length === 0 || this.processing) return;

        this.processing = true;
        const batch = [...this.queue];
        this.queue = [];

        try {
            // Use sendBeacon for single small payloads during unload, but for batching we use fetch
            // We'll create a single batch endpoint call if backend supports it, 
            // OR just loop through (not ideal) OR send as a wrapper 'logs' array.
            // Assuming the existing backend expects a single log object based on previous file,
            // but for a "batching" requirement, ideally we send an array.
            // Since I am constrained to "Assume a /log HTTP endpoint already exists" and "Do NOT explain backend",
            // I will assume the /log endpoint might handle a single entry. 
            // HOWEVER, sending 10 requests is not "batching".
            // If strictly constrained to an existing single-log endpoint, I have to loop.
            // But usually /logs (plural) implies array or the user wants me to minimize network traffic.
            // I will err on the side of dispatching them individually but throttled OR 
            // if I can, I'd wrap them. 
            // Let's stick to sending them individually for compatibility with the likely existing endpoint, 
            // but doing it here allows us to control the concurrency aka 'throttling'.

            // Actually, the previous implementation used `/logs`.
            // Let's try to send one by one for now to ensure compatibility if the backend is rigid,
            // but we do it in this background flush process so it doesn't block UI.

            // Optimization: If `navigator.sendBeacon` is more appropriate for unload, we use it. 
            // But here we use fetch.

            await Promise.allSettled(batch.map(entry => {
                return fetch(`${API_URL}/logs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                    keepalive: true
                });
            }));

        } catch (e) {
            // Fallback: put failed items back in queue? 
            // No, to avoid infinite loops of logging logging errors, we just drop them and log to console.
            console.error('Failed to send logs to backend', e);
        } finally {
            this.processing = false;
        }
    }
}

export const logger = new Logger();
