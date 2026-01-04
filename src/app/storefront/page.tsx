"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function StorefrontPage() {
    const router = useRouter()

    useEffect(() => {
        router.push('/storefront/products')
    }, [router])

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
    )
}
