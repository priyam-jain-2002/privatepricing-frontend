"use client"

import { Users, Package, ShoppingCart, User, Briefcase, Loader2, Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { StoreProvider, useStore } from "@/contexts/store-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const menuItems = [
    { icon: ShoppingCart, label: "Orders", href: "/dashboard/orders" },
    { icon: Users, label: "Customers", href: "/dashboard/customers" },
    { icon: Package, label: "Products", href: "/dashboard/products" },
    { icon: Briefcase, label: "Team", href: "/dashboard/team" },
    { icon: User, label: "Profile", href: "/dashboard/profile" },
]

function DashboardSidebar({ className, onFormatChange }: { className?: string, onFormatChange?: () => void }) {
    const pathname = usePathname()
    const { activeStore, loading } = useStore()
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        setRole(localStorage.getItem('user_role'))
    }, [])

    if (loading) {
        return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
    }

    const isActive = (href: string) => pathname.startsWith(href)

    const filteredItems = menuItems.filter(item => {
        if (item.label === "Team") {
            return role === '0'; // Only visible to Store Owner
        }
        return true;
    });

    return (
        <div className={cn("flex flex-col h-full bg-gray-50", className)}>
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900">{activeStore?.name || "Loading..."}</h2>
                    <p className="text-sm text-gray-500">{activeStore?.description || "Dashboard"}</p>
                </div>

                <nav className="space-y-2">
                    {filteredItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onFormatChange}
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
        <div className="flex-1 overflow-auto bg-white w-full">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
    const [open, setOpen] = useState(false)

    return (
        <StoreProvider>
            <div className="flex h-screen bg-white overflow-hidden flex-col md:flex-row">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-64 border-r border-gray-200">
                    <DashboardSidebar />
                </aside>

                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 border-b border-gray-200 bg-gray-50">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-4">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-80">
                            <DashboardSidebar onFormatChange={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    <span className="font-semibold text-lg text-gray-900">Dashboard</span>
                </div>

                <DashboardContent>
                    {children}
                </DashboardContent>
            </div>
        </StoreProvider>
    )
}
