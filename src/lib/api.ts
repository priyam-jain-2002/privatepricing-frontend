export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchAPI(path: string, options: RequestInit = {}) {
    const url = path.startsWith('/') ? `${API_URL}${path}` : `${API_URL}/${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        // Try to parse error message from JSON, fallback to status text
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || `Request failed with status ${res.status}`);
    }

    return res.json();
}
