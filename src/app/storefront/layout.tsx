"use client"

import { ReactNode, useState } from "react"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { Button } from "@/components/ui/button"
import { LogOut, ShoppingCart, Menu, Package, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        <div className="min-h-screen bg-white font-sans selection:bg-primary/10">
            <nav className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-serif font-bold text-lg">
                                {storeName ? storeName.charAt(0) : 'S'}
                            </div>
                            <span className="font-serif font-medium text-xl tracking-tight text-foreground">{storeName || 'Storefront'}</span>
                        </div>

                        {/* Desktop Nav Actions */}
                        <div className="hidden md:flex items-center gap-8">
                            <nav className="flex items-center gap-6">
                                <Link
                                    href="/storefront/products"
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-foreground",
                                        pathname.includes('/products') ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    Catalog
                                </Link>
                                <Link
                                    href="/storefront/orders"
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-foreground",
                                        pathname.includes('/orders') ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    Purchase Orders
                                </Link>
                            </nav>

                            <div className="h-4 w-px bg-border/60"></div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-foreground leading-none">{user.name || user.email}</span>
                                    {authContext?.customer?.name && (
                                        <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{authContext.customer.name}</span>
                                    )}
                                </div>

                                <Link href="/storefront/checkout">
                                    <Button
                                        disabled={totalItems === 0 && !pathname.includes('/checkout')}
                                        className={cn(
                                            "relative transition-all duration-200 shadow-sm rounded-full px-5 h-10",
                                            totalItems > 0
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5"
                                                : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-transparent"
                                        )}
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        <span className="font-medium">Cart</span>
                                        {totalItems > 0 && (
                                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-background">
                                                {totalItems}
                                            </span>
                                        )}
                                    </Button>
                                </Link>

                                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground rounded-full">
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Menu Button  */}
                        <div className="md:hidden flex items-center gap-4">
                            <Link href="/storefront/checkout">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="relative text-foreground"
                                >
                                    <ShoppingCart className="h-6 w-6" />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-background">
                                            {totalItems}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-mr-2">
                                        <Menu className="h-6 w-6 text-foreground" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                                    <div className="flex flex-col h-full mt-6">
                                        {/* User Info Mobile */}
                                        <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border/50">
                                            <div className="font-medium text-foreground">{user.name || user.email}</div>
                                            {authContext?.customer?.name && (
                                                <div className="text-sm text-muted-foreground">{authContext.customer.name}</div>
                                            )}
                                        </div>

                                        <nav className="flex flex-col space-y-2">
                                            <Link href="/storefront/products" onClick={() => setMobileMenuOpen(false)}>
                                                <Button variant={pathname.includes('/products') ? 'secondary' : 'ghost'} className="w-full justify-start h-12">
                                                    <Package className="mr-3 h-4 w-4 text-muted-foreground" />
                                                    Catalog
                                                </Button>
                                            </Link>
                                            <Link href="/storefront/orders" onClick={() => setMobileMenuOpen(false)}>
                                                <Button variant={pathname.includes('/orders') ? 'secondary' : 'ghost'} className="w-full justify-start h-12">
                                                    <FileText className="mr-3 h-4 w-4 text-muted-foreground" />
                                                    Purchase Orders
                                                </Button>
                                            </Link>
                                            <Link href="/storefront/checkout" onClick={() => setMobileMenuOpen(false)}>
                                                <Button variant={pathname.includes('/checkout') ? 'secondary' : 'ghost'} className="w-full justify-start h-12">
                                                    <ShoppingCart className="mr-3 h-4 w-4 text-muted-foreground" />
                                                    Cart
                                                    {totalItems > 0 && <span className="ml-auto bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">{totalItems}</span>}
                                                </Button>
                                            </Link>
                                        </nav>

                                        <div className="mt-auto pt-6 border-t border-border/50">
                                            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log Out
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </nav>

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
