"use client"
import { useStore } from "@/contexts/store-context"
import { TeamSection } from "@/components/owner-dashboard/team-section"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export default function TeamPage() {
    const { activeStore } = useStore()
    const router = useRouter()

    useEffect(() => {
        const role = localStorage.getItem('user_role')
        // Hide if Order Manager (5). (Also, Team page was restricted to 0/4 in sidebar, so checking others too?)
        // The request specifically mentioned Order Manager not allowed.
        // Sidebar logic was: role === '0' || role === '4' (Only Owner/Manager see Team).
        // So everyone else (1, 3, 5) should be redirected.
        // Let's align with Sidebar logic: If NOT (0 or 4), redirect.
        if (role !== '0' && role !== '4') {
            router.push('/dashboard/orders')
            toast.error("Access denied")
        }
    }, [])

    if (!activeStore) return null

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Team Management</h1>
            </div>
            <TeamSection activeStore={activeStore} />
        </div>
    )
}
