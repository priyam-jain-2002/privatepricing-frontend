"use client"

import { ReactNode } from "react"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { Button } from "@/components/ui/button"
import { LogOut, ShoppingCart, Menu, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// Inner component to use the hook
function StorefrontLayoutContent({ children }: { children: ReactNode }) {
    const {
        storeName,
        user,
        authContext,
        totalItems,
        handleLogout,
        loading
    } = useStorefront()

    const pathname = usePathname()
    const router = useRouter()

    // Exclude public paths from auth guard
    if (pathname.includes('/login') || pathname.includes('/auth') || pathname.includes('/password-reset')) {
        return <>{children}</>
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!user) {
        // Redirection should have happened in Context or Page, but show fallback here
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Problem</h2>
                <p className="text-gray-500 mb-4">We couldn't verify your session. Please log in again.</p>
                <Button onClick={() => router.push('/storefront/login')}>Go to Login</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {storeName ? storeName.charAt(0) : 'S'}
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">{storeName || 'Store'}</span>
                        </div>

                        {/* Desktop Nav Actions */}
                        <div className="hidden md:flex items-center space-x-6">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-medium text-slate-800">{user.name || user.email}</span>
                                {authContext?.customer?.name && (
                                    <span className="text-xs text-slate-500">{authContext.customer.name}</span>
                                )}
                            </div>

                            <div className="h-8 w-px bg-gray-200"></div>

                            <nav className="flex space-x-1">
                                <Link href="/storefront/products">
                                    <Button variant={pathname.includes('/products') ? 'secondary' : 'ghost'}>Catalog</Button>
                                </Link>
                                <Link href="/storefront/orders">
                                    <Button variant={pathname.includes('/orders') ? 'secondary' : 'ghost'}>Purchase Orders</Button>
                                </Link>
                            </nav>

                            <div className="h-8 w-px bg-gray-200"></div>

                            <Link href="/storefront/checkout">
                                <Button
                                    disabled={totalItems === 0 && !pathname.includes('/checkout')}
                                    className={cn(
                                        "relative transition-all duration-200 shadow-sm",
                                        totalItems > 0 ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Create Pay Order</span>
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                            {totalItems}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-slate-600">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Mobile Menu Button  */}
                        <div className="md:hidden flex items-center">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6 text-slate-700" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero / Welcome Section - Contextual based on page? 
                 Actually, the design had a hero that changed text based on view.
                 We can leave it in the individual pages OR keep it here.
                 Let's keep it in individual pages for flexibility.
              */}

            <main>
                {children}
            </main>
        </div>
    )
}

export default function StorefrontLayout({ children }: { children: ReactNode }) {
    return (
        <StorefrontProvider>
            <StorefrontLayoutContent>
                {children}
            </StorefrontLayoutContent>
        </StorefrontProvider>
    )
}
