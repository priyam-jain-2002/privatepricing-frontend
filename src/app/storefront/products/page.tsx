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
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
                            Welcome back, <span className="text-blue-600">{customerDetails?.name || user?.name || "Customer"}</span>
                        </h1>
                        <p className="mt-4 text-lg text-slate-500">
                            Browse your exclusive catalog and negotiated pricing. All orders are processed within 24 hours.
                        </p>
                    </div>

                    <div className="mt-8 max-w-lg relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            className="pl-10 h-12 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                            // Use local state for filter if we want to impl it
                            onChange={(e) => {
                                // Basic impl: could filter `visibleProducts`
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Package className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">No products available</h3>
                        <p className="mt-2 text-gray-500 max-w-sm">
                            We couldn't find any products assigned to your account. Please contact support.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Card key={product.id} className="group overflow-hidden border-gray-100 transition-all duration-200 hover:shadow-lg hover:border-blue-100 flex flex-col h-full bg-white">
                                {/* Image Placeholder */}
                                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden flex items-center justify-center group-hover:bg-blue-50/30 transition-colors">
                                    <Package className="h-12 w-12 text-gray-300 group-hover:text-blue-200 transition-colors" />
                                    {product.minimumQuantity && product.minimumQuantity > 1 && (
                                        <Badge variant="secondary" className="absolute top-3 left-3 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                            Min Qty: {product.minimumQuantity}
                                        </Badge>
                                    )}
                                </div>

                                <CardContent className="p-5 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        {product.productSku && (
                                            <p className="text-xs font-medium text-gray-400 mb-1 tracking-wide uppercase">
                                                SKU: {product.productSku}
                                            </p>
                                        )}
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                            {product.description || "No description available."}
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                                {formatCurrency(product.price, product.currency)}
                                            </span>
                                            <span className="text-sm text-gray-400 font-medium">/ {product.unit}</span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="p-5 pt-0 mt-auto">
                                    {product.quantity === 0 ? (
                                        <Button
                                            className="w-full bg-slate-900 text-white hover:bg-slate-800 h-10 shadow-sm"
                                            onClick={() => updateQuantity(product.id, Math.max(1, product.minimumQuantity || 1))}
                                        >
                                            Add to Order
                                        </Button>
                                    ) : (
                                        <div className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-md bg-white shadow-sm hover:bg-gray-100 text-slate-700"
                                                onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="flex-1 text-center font-semibold text-slate-900 text-sm">
                                                {product.quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-md bg-white shadow-sm hover:bg-gray-100 text-slate-700"
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
