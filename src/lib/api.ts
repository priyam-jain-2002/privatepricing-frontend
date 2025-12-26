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
// ... keep existing fetchAPI ...

export function getAuthToken() {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('access_token');
    }
    return null;
}

export function getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchStores() {
    return fetchAPI('/stores', { headers: getAuthHeaders() });
}

// fetchCustomers(storeId) -> no longer needs storeId
export async function fetchCustomers() {
    return fetchAPI(`/customers`, { headers: getAuthHeaders() });
}

export async function fetchProducts() {
    return fetchAPI(`/products`, { headers: getAuthHeaders() });
}

export async function createCustomer(data: any) {
    return fetchAPI(`/customers`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function createUser(data: any) {
    return fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function updateUser(userId: string, data: any) {
    return fetchAPI(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}
