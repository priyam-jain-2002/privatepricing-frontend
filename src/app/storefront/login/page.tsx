"use client"

import { useEffect, useState } from "react"
import { StorefrontLoginPage } from "@/components/storefront-login-page"
import { fetchStores, fetchStoreBySubdomain } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function StorefrontLoginRoute() {
    const [storeId, setStoreId] = useState<string | null>(null)
    const [storeName, setStoreName] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadContext() {
            // 0. Check for existing session
            const token = sessionStorage.getItem('access_token');
            const role = sessionStorage.getItem('user_role');

            if (token) {
                if (role && Number(role) === 0) {
                    // Owner logged in, go to dashboard
                    // But dashboard is on a different subdomain potentially?
                    // Dashboard is supported on subdomains too now via middleware/rewrite preservation?
                    // Actually, next.config rewrites / -> /storefront on subdomain.
                    // /dashboard is NOT rewritten. So it should work.
                    // However, if we are on 'firstly.localhost', /dashboard works.
                    window.location.href = '/dashboard';
                    return;
                } else {
                    // Customer user, go to storefront
                    window.location.href = '/storefront';
                    return;
                }
            }

            try {
                let currentStore: any = null;

                // 1. Try to get subdomain from hostname
                const hostname = window.location.hostname;
                const parts = hostname.split('.');

                // Check for localhost or production domain structure
                const isLocalhost = hostname.includes('localhost');
                const hasSubdomain = isLocalhost ? parts.length > 1 : parts.length > 2;

                if (isLocalhost ? parts.length > 1 : parts.length > 2) {
                    // Check 'www'
                    if (parts[0] !== 'www') {
                        const subdomain = parts[0];
                        console.log(`[Login] Detected subdomain: ${subdomain} from host: ${hostname}`);
                        try {
                            currentStore = await fetchStoreBySubdomain(subdomain);
                            console.log(`[Login] Fetched store for subdomain ${subdomain}:`, currentStore);
                        } catch (e) {
                            console.warn(`[Login] Failed to find store by subdomain ${subdomain}`, e);
                        }
                    }
                }

                // 2. Fallback: Check Query Param ?store=...
                // STRICT REDIRECT: If found via param, redirect to subdomain URL.
                if (!currentStore) {
                    const params = new URLSearchParams(window.location.search);
                    const storeParam = params.get('store');
                    if (storeParam) {
                        try {
                            const storeByParam = await fetchStoreBySubdomain(storeParam);
                            if (storeByParam && storeByParam.subdomain) {
                                // Redirect to canonical subdomain
                                const protocol = window.location.protocol;
                                const port = window.location.port ? `:${window.location.port}` : '';
                                const rootDomain = isLocalhost ? 'localhost' : parts.slice(hasSubdomain ? 1 : 0).join('.');

                                // Logic to construct new host
                                // If currently localhost:3000, make it store.localhost:3000
                                // If currently domain.com, make it store.domain.com

                                const newHost = `${storeByParam.subdomain}.${rootDomain}${port}`;

                                // Prevent infinite reload if we are already there (should be caught by step 1, but safety check)
                                if (window.location.host !== newHost) {
                                    window.location.href = `${protocol}//${newHost}/storefront/login`;
                                    return; // Stop execution
                                }
                                currentStore = storeByParam;
                            }
                        } catch (e) {
                            console.warn("Failed to find store by param", storeParam);
                        }
                    }
                }

                // 3. Fallback: Default to first store (Dev Mode only)
                if (!currentStore) {
                    const stores = await fetchStores();
                    if (stores && stores.length > 0) {
                        // Optional: Redirect to first store's subdomain if available?
                        // Maybe checking if it has a subdomain
                        if (stores[0].subdomain) {
                            currentStore = stores[0];
                            // We could redirect here too, but let's be careful about dev loop
                        } else {
                            currentStore = stores[0];
                        }
                    }
                }

                if (currentStore) {
                    setStoreId(currentStore.id)
                    setStoreName(currentStore.name)
                }
            } catch (err) {
                console.error("Failed to load store context", err)
            } finally {
                setLoading(false)
            }
        }
        loadContext()
    }, [])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!storeId) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
                Store context not found.
            </div>
        )
    }

    return <StorefrontLoginPage storeId={storeId} storeName={storeName || "Storefront"} />
}
