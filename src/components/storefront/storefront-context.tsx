"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserFromToken, fetchStorefrontStore, fetchStorefrontCustomer, fetchStorefrontBranches, fetchAPI } from "@/lib/api"
import { toast } from "sonner"

// --- Types ---

export interface Product {
    id: string
    name: string
    unit: string
    price: number
    quantity: number
    currency: string
    description?: string
    minimumQuantity?: number
    productSku?: string
    images: string[]
    technicalSheet: string | null
    hsnCode: string | null
}

export enum UserRole {
    STORE_OWNER = 0,
    CUSTOMER_ADMIN = 1,
    BRANCH_MANAGER = 2,
    BRANCH_USER = 3,
}

export interface User {
    id: string
    email: string
    role: UserRole
    name?: string
}

export interface AuthContextType {
    store?: { id: string }
    customer?: { id: string; name?: string }
    branch?: { id: string; name?: string }
}

interface StorefrontContextValue {
    // Auth & Store State
    user: User | null
    authContext: AuthContextType | null
    accessToken: string | null
    storeId: string | null
    storeName: string
    subdomain: string | null
    loading: boolean

    // Customer Data
    customerDetails: any
    branches: any[]

    // Product & Cart State
    products: Product[]
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>
    totalItems: number
    setTotalItems: React.Dispatch<React.SetStateAction<number>>
    updateQuantity: (id: string, newQty: number) => void
    refreshProducts: () => Promise<void>

    // Helpers
    handleLogout: () => void
    formatCurrency: (amount: number, currency?: string) => string
}

const StorefrontContext = createContext<StorefrontContextValue | undefined>(undefined)

export function useStorefront() {
    const context = useContext(StorefrontContext)
    if (!context) {
        throw new Error("useStorefront must be used within a StorefrontProvider")
    }
    return context
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    // --- State ---
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [authContext, setAuthContext] = useState<AuthContextType | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)

    const [storeId, setStoreId] = useState<string | null>(null)
    const [storeName, setStoreName] = useState<string>("")
    const [subdomain, setSubdomain] = useState<string | null>(null)

    const [customerDetails, setCustomerDetails] = useState<any>(null)
    const [branches, setBranches] = useState<any[]>([])

    const [products, setProducts] = useState<Product[]>([])
    const [totalItems, setTotalItems] = useState(0)


    // --- Initialization ---

    const checkAuth = async () => {
        // If we already have a user, we assume logic is fine. 
        // We could verify token expiry here too, but for now let's focus on "missing user" restoration.
        if (user) return;

        try {
            // We set loading true ONLY if we think we might find something?
            // Or always? If we set it true, UI flashes "loading".
            // If we don't, UI shows "Access Problem".
            // Let's set it true to try.
            setLoading(true)

            const token = localStorage.getItem('access_token')
            const decodedUser = getUserFromToken()

            if (!token || !decodedUser) {
                setLoading(false)
                return
            }

            setAccessToken(token)
            const { storeId: tokStoreId, id, sub, role: userRole, email, customerId, branchId } = decodedUser;
            const userId = id || sub;

            if (tokStoreId) setStoreId(tokStoreId)

            if (userId) {
                setUser({
                    id: userId,
                    email: email || '',
                    role: userRole !== undefined ? Number(userRole) : 3,
                    name: decodedUser.name
                })
            }

            setAuthContext({
                store: tokStoreId ? { id: tokStoreId } : undefined,
                customer: customerId ? { id: customerId } : undefined,
                branch: branchId ? { id: branchId } : undefined
            })

            // Fetch Store Info
            if (tokStoreId) {
                const currentStore = await fetchStorefrontStore(tokStoreId)
                if (currentStore) {
                    setStoreName(currentStore.name)
                    if (currentStore.subdomain) setSubdomain(currentStore.subdomain)
                }
            }
        } catch (err) {
            console.error("Failed to check auth", err)
        } finally {
            setLoading(false)
        }
    }

    // Check auth on mount and on route change
    useEffect(() => {
        checkAuth()
    }, [pathname])

    // --- Data Fetching ---

    // Load Customer & Branches
    useEffect(() => {
        if (!authContext?.customer?.id || !accessToken) return

        async function loadCustomerData() {
            try {
                const [custData, branchData] = await Promise.all([
                    fetchStorefrontCustomer(authContext!.customer!.id),
                    fetchStorefrontBranches(authContext!.customer!.id)
                ])
                setCustomerDetails(custData)
                setBranches(branchData)
            } catch (err) {
                console.error("Failed to load customer data", err)
            }
        }
        loadCustomerData()
    }, [authContext, accessToken])

    // Load Products (Logic extracted)
    const fetchProducts = async () => {
        if (!storeId || !user || !authContext?.customer?.id || !accessToken) return

        try {
            const productsData = await fetchAPI(`/storefront/customers/${authContext?.customer?.id}/pricing`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            const mappedProducts = productsData.map((p: any) => ({
                id: p.productId,
                name: p.productName,
                unit: "unit",
                price: Number(p.price),
                quantity: 0, // Reset to 0 initially
                currency: p.currency || 'INR',
                description: p.productDescription,
                minimumQuantity: p.minimumQuantity || 1,
                productSku: p.productSku,
                images: p.images || [],
                technicalSheet: p.technicalSheet || null,
                hsnCode: p.hsnCode || null
            }))

            // Re-hydrate quantities if we have them in state (if we are just refreshing data)
            setProducts(current => {
                if (current.length === 0) return mappedProducts;

                // Merge quantities
                const qtyMap = new Map(current.map(p => [p.id, p.quantity]));
                return mappedProducts.map((p: Product) => ({
                    ...p,
                    quantity: qtyMap.get(p.id) || 0
                }));
            })

        } catch (err: any) {
            console.error("Failed to load products", err)
            if (err.message?.includes('401') || err.message?.includes('403')) {
                handleLogout()
            }
        }
    }

    // Initial Product Load
    useEffect(() => {
        fetchProducts()
    }, [storeId, user, authContext, accessToken])


    // --- Cart Logic ---

    const updateQuantity = (id: string, newQty: number) => {
        setProducts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, quantity: Math.max(0, newQty) }
            }
            return p
        }))
    }

    useEffect(() => {
        setTotalItems(products.reduce((sum, p) => sum + p.quantity, 0))
    }, [products])


    // --- Actions ---

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');

        if (subdomain) {
            const protocol = window.location.protocol;
            const host = window.location.host;
            // Logic to construct redirect URL
            if (host.startsWith(`${subdomain}.`)) {
                window.location.href = `${protocol}//${host}/storefront/login`;
                return;
            }
            // Fallback
            router.push('/storefront/login');
        } else {
            router.push('/storefront/login');
        }
    }

    const formatCurrency = (amount: number, currency: string = 'INR') => {
        if (currency === 'INR') {
            return `Rs. ${amount.toFixed(2)}`
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    }


    return (
        <StorefrontContext.Provider value={{
            user,
            authContext,
            accessToken,
            storeId,
            storeName,
            subdomain,
            loading,
            customerDetails,
            branches,
            products,
            setProducts,
            totalItems,
            setTotalItems,
            updateQuantity,
            refreshProducts: fetchProducts,
            handleLogout,
            formatCurrency
        }}>
            {children}
        </StorefrontContext.Provider>
    )
}
