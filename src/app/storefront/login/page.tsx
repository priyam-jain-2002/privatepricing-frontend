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
            try {
                let currentStore: any = null;

                // 1. Try to get subdomain from hostname
                // e.g. store1.localhost -> store1
                const hostname = window.location.hostname;
                const parts = hostname.split('.');

                // If we have a subdomain (more than 1 part for localhost, or more than 2 for domain.com)
                // This logic might need tuning for production domains (e.g. app.domain.com)
                if (parts.length > 1 && parts[0] !== 'www') {
                    const subdomain = parts[0];
                    console.log("Detected subdomain:", subdomain);
                    try {
                        currentStore = await fetchStoreBySubdomain(subdomain);
                    } catch (e) {
                        console.warn("Failed to find store by subdomain", subdomain);
                    }
                }

                // 2. Fallback: Check Query Param ?store=...
                if (!currentStore) {
                    const params = new URLSearchParams(window.location.search);
                    const storeParam = params.get('store');
                    if (storeParam) {
                        try {
                            currentStore = await fetchStoreBySubdomain(storeParam);
                        } catch (e) {
                            console.warn("Failed to find store by param", storeParam);
                        }
                    }
                }

                // 3. Fallback: Default to first store (Dev Mode only)
                if (!currentStore) {
                    const stores = await fetchStores();
                    if (stores && stores.length > 0) {
                        currentStore = stores[0];
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
