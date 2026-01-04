"use client"
import { useStore } from "@/contexts/store-context"
import { TeamSection } from "@/components/owner-dashboard/team-section"

export default function TeamPage() {
    const { activeStore } = useStore()

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
