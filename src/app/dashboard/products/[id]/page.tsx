"use client"
import { ProductForm } from "@/components/forms/product-form"
import { useStore } from "@/contexts/store-context"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchProducts } from "@/lib/api"
import { useParams } from "next/navigation"

export default function EditProductPage() {
    const { activeStore, loading: storeLoading } = useStore()
    const params = useParams()
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (activeStore && params.id) {
            loadProduct()
        }
    }, [activeStore, params.id])

    async function loadProduct() {
        try {
            // Ideally we should have fetchProduct(id) but fetchProducts returns all.
            // For now, filter from all (or implement fetchProduct(id) in api.ts later for efficiency)
            const allProducts = await fetchProducts()
            const found = allProducts.find((p: any) => p.id === params.id)
            if (found) {
                setProduct(found)
            }
        } catch (e) {
            console.error("Failed to load product", e)
        } finally {
            setLoading(false)
        }
    }

    if (storeLoading || loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!activeStore) return <div>Store not found</div>
    if (!product) return <div>Product not found</div>

    return (
        <div className="p-8">
            <ProductForm
                storeId={activeStore.id}
                initialData={product}
                operationCostPercentage={activeStore.operationCostPercentage}
            />
        </div>
    )
}
