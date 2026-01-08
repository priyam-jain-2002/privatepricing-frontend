"use client"
import { useStore } from "@/contexts/store-context"
import { ProductsSection } from "@/components/owner-dashboard/products-section"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export default function ProductsPage() {
    const { activeStore } = useStore()
    const router = useRouter()

    useEffect(() => {
        const role = localStorage.getItem('user_role')
        if (role === '5') {
            router.push('/dashboard/orders')
            toast.error("Access denied")
        }
    }, [])

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
