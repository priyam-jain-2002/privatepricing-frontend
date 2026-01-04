"use client"

import { Users, Package, ShoppingCart, User, Briefcase, Loader2, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { StoreProvider, useStore } from "@/contexts/store-context"

const menuItems = [
    { icon: ShoppingCart, label: "Orders", href: "/dashboard/orders" },
    { icon: Users, label: "Customers", href: "/dashboard/customers" },
    { icon: Package, label: "Products", href: "/dashboard/products" },
    { icon: Briefcase, label: "Team", href: "/dashboard/team" },
    { icon: User, label: "Profile", href: "/dashboard/profile" },
]

function DashboardSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { activeStore, stores, loading } = useStore()

    if (loading) {
        return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
    }

    // Determine active menu item based on current path
    // e.g. /dashboard/orders -> orders
    const isActive = (href: string) => pathname.startsWith(href)

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user_role');
        window.location.href = '/login';
    }

    return (
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900">{activeStore?.name || "Loading..."}</h2>
                    <p className="text-sm text-gray-500">{activeStore?.description || "Dashboard"}</p>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>


        </div>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { activeStore, loading } = useStore()

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!activeStore) {
        return (
            <div className="flex h-screen items-center justify-center text-gray-500">
                No active store found.
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-auto bg-white">
            <div className="mx-auto max-w-7xl px-8 py-8">
                {children}
            </div>
        </div>
    )
}


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <StoreProvider>
            <div className="flex h-screen bg-white overflow-hidden">
                <DashboardSidebar />
                <DashboardContent>
                    {children}
                </DashboardContent>
            </div>
        </StoreProvider>
    )
}
