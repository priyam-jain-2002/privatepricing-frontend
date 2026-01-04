"use client"
import { ProfileSection } from "@/components/owner-dashboard/profile-section"

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Profile</h1>
            </div>
            <ProfileSection />
        </div>
    )
}
