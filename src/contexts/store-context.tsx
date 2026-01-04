"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { fetchStores } from "@/lib/api"
import { logger } from "@/lib/logger"
import { usePathname, useRouter } from "next/navigation"

interface StoreContextType {
    stores: any[]
    activeStore: any
    setActiveStore: (store: any) => void
    loading: boolean
    refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
    const [stores, setStores] = useState<any[]>([])
    const [activeStore, setActiveStore] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    // Protected routes check
    useEffect(() => {
        const token = sessionStorage.getItem('access_token');
        if (!token && !pathname.includes('/login')) {
            // Let the layout or individual pages handle redirect if needed, 
            // but strictly speaking we should probably do it here or in middleware.
            // For now, mirroring existing behavior:
            if (window) window.location.href = '/login';
        }
    }, [pathname])

    const loadStores = async () => {
        setLoading(true)
        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) return;

            const storesData = await fetchStores()
            setStores(storesData)

            // Should we persist selected store? For now, default to first or stay content
            // If activeStore is already set, verify it still exists
            if (activeStore) {
                const stillExists = storesData.find((s: any) => s.id === activeStore.id)
                if (stillExists) {
                    setActiveStore(stillExists)
                } else if (storesData.length > 0) {
                    setActiveStore(storesData[0])
                }
            } else if (storesData.length > 0) {
                setActiveStore(storesData[0])
            }
        } catch (error: any) {
            logger.error("Failed to fetch stores", error.stack, { error })
            if (error.message?.includes('401') || error.message?.includes('403')) {
                if (window) window.location.href = '/login';
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStores()
    }, [])

    return (
        <StoreContext.Provider value={{ stores, activeStore, setActiveStore, loading, refreshStores: loadStores }}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStore() {
    const context = useContext(StoreContext)
    if (context === undefined) {
        throw new Error("useStore must be used within a StoreProvider")
    }
    return context
}
