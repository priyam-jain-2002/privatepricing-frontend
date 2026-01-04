"use client"
import { useStore } from "@/contexts/store-context"
import { ProductsSection } from "@/components/owner-dashboard/products-section"

export default function ProductsPage() {
    const { activeStore } = useStore()

    if (!activeStore) return null

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Products</h1>
            </div>
            <ProductsSection activeStore={activeStore} />
        </div>
    )
}
