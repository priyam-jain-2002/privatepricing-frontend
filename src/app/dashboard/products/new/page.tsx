"use client"
import { ProductForm } from "@/components/forms/product-form"
import { useStore } from "@/contexts/store-context"
import { Loader2 } from "lucide-react"

export default function NewProductPage() {
    const { activeStore, loading } = useStore()

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!activeStore) return <div>Store not found</div>

    return (
        <div className="p-8">
            <ProductForm
                storeId={activeStore.id}
                operationCostPercentage={activeStore.operationCostPercentage}
            />
        </div>
    )
}
