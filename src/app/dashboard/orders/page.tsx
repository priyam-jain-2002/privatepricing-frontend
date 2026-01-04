"use client"
import { useStore } from "@/contexts/store-context"
import { OrdersSection } from "@/components/owner-dashboard/orders-section"

export default function OrdersPage() {
    const { activeStore } = useStore()

    if (!activeStore) return null

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
            </div>
            <OrdersSection activeStore={activeStore} />
        </div>
    )
}
