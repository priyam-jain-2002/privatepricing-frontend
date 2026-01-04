"use client"
import { useStore } from "@/contexts/store-context"
import { CustomersSection } from "@/components/owner-dashboard/customers-section"

export default function CustomersPage() {
    const { activeStore } = useStore()

    if (!activeStore) return null

    return (
        // Header is handled specifically inside CustomersSection for sub-views
        <CustomersSection activeStore={activeStore} />
    )
}
