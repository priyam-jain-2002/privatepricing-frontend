export const API_BASE_URL = 'http://localhost:3000';

export async function fetchStores() {
    const res = await fetch(`${API_BASE_URL}/stores`);
    if (!res.ok) throw new Error('Failed to fetch stores');
    return res.json();
}

export async function fetchStore(id: string) {
    const res = await fetch(`${API_BASE_URL}/stores/${id}`);
    if (!res.ok) throw new Error('Failed to fetch store');
    return res.json();
}

export async function fetchCustomers(storeId: string) {
    const res = await fetch(`${API_BASE_URL}/stores/${storeId}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
}

export async function fetchProducts(storeId: string) {
    const res = await fetch(`${API_BASE_URL}/stores/${storeId}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function fetchCustomerPricing(storeId: string, customerId: string) {
    const res = await fetch(`${API_BASE_URL}/stores/${storeId}/storefront/customers/${customerId}/pricing`);
    if (!res.ok) throw new Error('Failed to fetch pricing');
    return res.json();
}
