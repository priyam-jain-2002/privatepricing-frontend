"use client"

import { useStorefront } from "@/components/storefront/storefront-context"
import { Package, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function StorefrontProductsPage() {
    const {
        products,
        loading,
        updateQuantity,
        customerDetails,
        user,
        formatCurrency
    } = useStorefront()

    // Filter logic can be added here if needed (using search state)
    // For now, mirroring original simple search UI (just UI, no local filtered state yet, user didn't have it fully impl in orig file it seems, 
    // actually orig file had a search input but didn't filter the `products` array. 
    // I will implement client-side filtering for better UX.

    // Actually, let's keep it simple first as per refactor.

    return (
        <>
            {/* Hero Section for Catalog */}
            <div className="bg-background border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight sm:text-5xl mb-6">
                            Welcome back, <br className="hidden sm:block" />
                            <span className="text-muted-foreground">{customerDetails?.name || user?.name || "Customer"}</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
                            Browse your exclusive catalog and negotiated pricing. <br className="hidden sm:block" />
                            All orders are processed efficiently within 24 hours.
                        </p>
                    </div>

                    <div className="mt-10 max-w-lg relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search products by name, SKU, or category..."
                            className="pl-12 h-14 border-transparent bg-secondary/50 focus:bg-background focus:ring-1 focus:ring-primary/10 transition-all text-base rounded-xl"
                            onChange={(e) => {
                                // Basic impl: could filter `visibleProducts`
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[400px] bg-muted rounded-xl"></div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl border-dashed border-border/60 bg-muted/5">
                        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                            <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-serif font-medium text-foreground">No products available</h3>
                        <p className="mt-2 text-muted-foreground max-w-sm">
                            We couldn't find any products assigned to your account. Please contact your account manager.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <Card key={product.id} className="group overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 flex flex-col h-full rounded-xl">
                                {/* Image Placeholder */}
                                <div className="aspect-[4/3] bg-secondary/30 relative overflow-hidden flex items-center justify-center group-hover:bg-secondary/50 transition-colors">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <Package className="h-10 w-10 text-muted-foreground/40 group-hover:text-primary/40 transition-colors duration-500" />
                                    )}
                                    {product.minimumQuantity && product.minimumQuantity > 1 && (
                                        <Badge variant="outline" className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm text-xs font-normal border-border/60">
                                            Min Qty: {product.minimumQuantity}
                                        </Badge>
                                    )}
                                </div>

                                <CardContent className="p-6 flex-1 flex flex-col">
                                    <div className="flex-1 mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            {product.productSku && (
                                                <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                                                    {product.productSku}
                                                </p>
                                            )}
                                            {product.hsnCode && (
                                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-normal text-muted-foreground bg-muted/50 border-border/50">
                                                    HSN: {product.hsnCode}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-lg text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed mb-4">
                                            {product.description || "Premium quality product."}
                                        </p>
                                        {product.technicalSheet && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs w-full sm:w-auto"
                                                onClick={() => window.open(product.technicalSheet!, '_blank')}
                                            >
                                                View Technical Sheet
                                            </Button>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-border/40 flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-serif text-foreground tracking-tight">
                                                {formatCurrency(product.price, product.currency)}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">/ {product.unit}</span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="p-6 pt-0">
                                    {product.quantity === 0 ? (
                                        <Button
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-medium shadow-sm transition-all hover:translate-y-px active:translate-y-0"
                                            onClick={() => updateQuantity(product.id, Math.max(1, product.minimumQuantity || 1))}
                                        >
                                            Add to Order
                                        </Button>
                                    ) : (
                                        <div className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/20 p-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 rounded-sm bg-background shadow-sm hover:bg-muted text-foreground"
                                                onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="flex-1 text-center font-semibold text-foreground text-sm">
                                                {product.quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 rounded-sm bg-background shadow-sm hover:bg-muted text-foreground"
                                                onClick={() => updateQuantity(product.id, product.quantity + 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
