import { logger } from './logger';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getAuthToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
}

export function getRefreshToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refresh_token');
    }
    return null;
}

export function setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', token);
    }
}

export function setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', token);
    }
}

export function clearTokens() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
    }
}

async function refreshAuthToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_URL}/users/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.accessToken) {
                setAuthToken(data.accessToken);
                if (data.refreshToken) {
                    setRefreshToken(data.refreshToken);
                }
                return data.accessToken;
            }
        } else {
            logger.warn('Token refresh failed', { status: res.status });
            clearTokens();
        }
    } catch (e: any) {
        logger.error('Token refresh error', e?.stack, e);
        clearTokens();
    }
    return null;
}

export async function fetchAPI(path: string, options: RequestInit = {}) {
    const url = path.startsWith('/') ? `${API_URL}${path}` : `${API_URL}/${path}`;

    const makeRequest = async (token?: string) => {
        const headers: any = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const authToken = token || getAuthToken();
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        return fetch(url, {
            ...options,
            headers,
        });
    };

    try {
        let res = await makeRequest();

        if (res.status === 401) {
            // Attempt refresh
            logger.info('401 received, attempting refresh...');
            const newToken = await refreshAuthToken();
            if (newToken) {
                logger.info('Refresh successful, retrying request...');
                res = await makeRequest(newToken);
            } else {
                // Refresh failed or no token, throw original error or redirect
                // We don't directty redirect here to avoid hooks issue, but error will bubble up
            }
        }

        if (!res.ok) {
            // Try to parse error message from JSON, fallback to status text
            const errorData = await res.json().catch(() => null);
            const errorMessage = errorData?.message || errorData?.error || `Request failed with status ${res.status}`;
            const requestId = res.headers.get('X-Request-ID') || errorData?.requestId;

            // Log the API error
            logger.error(`API Error: ${path}`, undefined, {
                requestId,
                status: res.status,
                statusText: res.statusText,
                error: errorMessage
            });

            throw new Error(errorMessage);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : {};
    } catch (error: any) {
        // Log network errors or other fetch exceptions (that weren't thrown above)
        if (error.message && error.message.includes('fetch')) {
            logger.error(`API Network Error: ${path}`, error.stack, { url });
        }
        throw error;
    }
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
    logger.info(`[API] fetchStoreBySubdomain calling: /stores/subdomain/${subdomain}`);
    return fetchAPI(`/stores/subdomain/${subdomain}`);
}

export async function updateStore(storeId: string, data: any) {
    return fetchAPI(`/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

// fetchCustomers(storeId) -> no longer needs storeId
export async function fetchCustomers() {
    return fetchAPI(`/customers`, { headers: getAuthHeaders() });
}

export async function fetchCustomer(customerId: string) {
    return fetchAPI(`/customers/${customerId}`, { headers: getAuthHeaders() });
}

export async function fetchProducts() {
    return fetchAPI(`/products`, { headers: getAuthHeaders() });
}

export async function createProduct(data: any) {
    return fetchAPI(`/products`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function updateProduct(productId: string, data: any) {
    return fetchAPI(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function createCustomer(data: any) {
    return fetchAPI(`/customers`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function updateCustomer(customerId: string, data: any) {
    return fetchAPI(`/customers/${customerId}`, {
        method: 'PATCH',
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

export async function fetchStoreUsers() {
    return fetchAPI('/users', { headers: getAuthHeaders() });
}

export async function fetchUser(userId: string) {
    return fetchAPI(`/users/${userId}`, { headers: getAuthHeaders() });
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


export async function createCustomerUser(customerId: string, data: any) {
    return fetchAPI(`/customers/${customerId}/users`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function fetchCustomerUsers(customerId: string) {
    return fetchAPI(`/customers/${customerId}/users`, { headers: getAuthHeaders() });
}

export async function updateCustomerUser(customerId: string, userId: string, data: any) {
    return fetchAPI(`/customers/${customerId}/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function fetchBranchUsers(customerId: string, branchId: string) {
    return fetchAPI(`/customers/${customerId}/branches/${branchId}/users`, { headers: getAuthHeaders() });
}

export async function loginStorefront(data: any) {
    return fetchAPI('/storefront/login', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function fetchAllOrders(storeId: string) {
    return fetchAPI(`/stores/${storeId}/orders`, { headers: getAuthHeaders() });
}

export async function updateOrderStatus(storeId: string, orderId: string, status: string) {
    return fetchAPI(`/stores/${storeId}/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: getAuthHeaders()
    });
}

export async function updateProductPricing(productId: string, data: any) {
    return fetchAPI(`/products/${productId}/pricing`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function getCustomerPricings(storeId: string, customerId: string) {
    return fetchAPI(`/stores/${storeId}/customer-product-pricings/customers/${customerId}`, { headers: getAuthHeaders() });
}

export async function createCustomerPricing(storeId: string, data: any) {
    return fetchAPI(`/stores/${storeId}/customer-product-pricings`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}

export async function updateCustomerPricing(storeId: string, customerId: string, productId: string, data: any) {
    return fetchAPI(`/stores/${storeId}/customer-product-pricings/customers/${customerId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: getAuthHeaders()
    });
}
export async function createStorefrontOrder(storeId: string, customerId: string, branchId: string | undefined | null, data: any) {
    if (branchId) {
        return fetchAPI(`/stores/${storeId}/customers/${customerId}/branches/${branchId}/orders`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getAuthHeaders()
        });
    } else {
        return fetchAPI(`/stores/${storeId}/customers/${customerId}/orders`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getAuthHeaders()
        });
    }
}

export async function fetchStorefrontOrders(customerId: string) {
    return fetchAPI(`/storefront/customers/${customerId}/orders`, { headers: getAuthHeaders() });
}

export async function fetchStorefrontCustomer(customerId: string) {
    return fetchAPI(`/storefront/customers/${customerId}`, { headers: getAuthHeaders() });
}

export async function fetchStorefrontBranches(customerId: string) {
    return fetchAPI(`/storefront/customers/${customerId}/branches`, { headers: getAuthHeaders() });
}

export async function fetchStorefrontStore(storeId: string) {
    return fetchAPI(`/storefront/stores/${storeId}`, { headers: getAuthHeaders() });
}

export async function deleteUser(userId: string) {
    return fetchAPI(`/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
}

export async function deleteCustomerUser(customerId: string, userId: string) {
    return fetchAPI(`/customers/${customerId}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
}
