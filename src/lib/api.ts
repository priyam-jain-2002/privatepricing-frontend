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

export function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function getUserFromToken() {
    const token = getAuthToken();
    if (!token) return null;
    return parseJwt(token);
}

export function getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchStores() {
    return fetchAPI('/stores', { headers: getAuthHeaders() });
}

export async function fetchStoreBySubdomain(subdomain: string) {
    return fetchAPI(`/stores/subdomain/${subdomain}`);
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

export async function fetchBranches(customerId: string) {
    return fetchAPI(`/customers/${customerId}/branches`, { headers: getAuthHeaders() });
}

export async function createBranch(customerId: string, data: any) {
    return fetchAPI(`/customers/${customerId}/branches`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function fetchBranchUsers(customerId: string, branchId: string) {
    return fetchAPI(`/customers/${customerId}/branches/${branchId}/users`, { headers: getAuthHeaders() });
}

export async function fetchOrders() {
    return fetchAPI(`/orders`, { headers: getAuthHeaders() });
}

export async function loginStorefront(data: any) {
    return fetchAPI('/storefront/login', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
