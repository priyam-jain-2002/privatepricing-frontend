"use client"

import { CustomerPricingManagement } from "@/components/customer-pricing-management"
import { useStore } from "@/contexts/store-context"
import { fetchCustomer } from "@/lib/api"
import { Loader2, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function CustomerPricingPage() {
    const params = useParams()
    const router = useRouter()
    const { activeStore, loading: storeLoading } = useStore()
    const [customer, setCustomer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const customerId = params.id as string

    useEffect(() => {
        // We need activeStore to be ready to get storeId, and customerId from params
        if (!storeLoading && activeStore && customerId) {
            loadCustomer()
        } else if (!storeLoading && !activeStore) {
            setLoading(false) // Store missing
        }
    }, [activeStore, storeLoading, customerId])

    async function loadCustomer() {
        try {
            const data = await fetchCustomer(customerId)
            setCustomer(data)
        } catch (e) {
            console.error("Failed to load customer", e)
        } finally {
            setLoading(false)
        }
    }

    if (storeLoading || loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!activeStore) return <div className="p-8">Store not found</div>
    if (!customer) return <div className="p-8">Customer not found</div>

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/customers')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Pricing</h1>
                    <p className="text-sm text-gray-500">for {customer.name}</p>
                </div>
            </div>

            <CustomerPricingManagement
                storeId={activeStore.id}
                customerId={customer.id}
                customer={customer}
                operationCostPercentage={activeStore.operationCostPercentage || 0}
            />
        </div>
    )
}
