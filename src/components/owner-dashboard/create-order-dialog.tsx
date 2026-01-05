"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Search, Loader2, ShoppingCart, Receipt, Building2, User } from "lucide-react"
import { toast } from "sonner"
import {
    fetchCustomers,
    fetchBranches,
    getCustomerPricings,
    fetchProducts,
} from "@/lib/api"
import { useStore } from "@/contexts/store-context"
import { API_URL, getAuthHeaders } from "@/lib/api"

async function createTeamOrder(storeId: string, customerId: string, branchId: string | null, data: any) {
    let url = `${API_URL}/stores/${storeId}/customers/${customerId}`;
    if (branchId) {
        url += `/branches/${branchId}/orders`;
    } else {
        url += `/orders`;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create order");
    }
    return res.json();
}

interface CreateOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onOrderCreated: () => void
}

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
    const { activeStore } = useStore()

    const [customers, setCustomers] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [customerPricings, setCustomerPricings] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(false)

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedBranchId, setSelectedBranchId] = useState<string>("no-branch")

    // Cart logic
    const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // PO Number
    const [poNumber, setPoNumber] = useState("")

    useEffect(() => {
        if (open && activeStore) {
            loadCustomers()
        } else {
            setSelectedCustomerId("")
            setSelectedBranchId("no-branch")
            setCart([])
            setSearchQuery("")
            setBranches([])
            setCustomerPricings([])
            setPoNumber("")
        }
    }, [open, activeStore])

    useEffect(() => {
        if (selectedCustomerId && activeStore) {
            loadCustomerData(selectedCustomerId)
        } else {
            setBranches([])
            setCustomerPricings([])
            setProducts([])
        }
    }, [selectedCustomerId, activeStore])

    const loadCustomers = async () => {
        setLoadingData(true)
        try {
            const data = await fetchCustomers()
            setCustomers(data)
        } catch (err) {
            console.error(err)
            toast.error("Failed to load customers")
        } finally {
            setLoadingData(false)
        }
    }

    const loadCustomerData = async (customerId: string) => {
        setLoadingData(true)
        try {
            const [branchesData, pricingsData, productsData] = await Promise.all([
                fetchBranches(customerId).catch(() => []),
                getCustomerPricings(activeStore.id, customerId).catch(() => []),
                fetchProducts().catch(() => [])
            ])
            setBranches(Array.isArray(branchesData) ? branchesData : [])
            setCustomerPricings(Array.isArray(pricingsData) ? pricingsData : [])
            setProducts(Array.isArray(productsData) ? productsData : [])
        } catch (err) {
            console.error(err)
            toast.error("Failed to load customer details")
            setBranches([])
            setCustomerPricings([])
            setProducts([])
        } finally {
            setLoadingData(false)
        }
    }

    const availableProducts = useMemo(() => {
        if (!Array.isArray(products) || !products.length) return []
        return products.map(p => {
            const pricing = Array.isArray(customerPricings) ? customerPricings.find((cp: any) => cp.productId === p.id) : null
            if (pricing && !pricing.visible) return null
            let effectivePrice = p.basePrice || 0
            if (pricing && pricing.sellingPrice !== null && pricing.sellingPrice !== undefined) {
                effectivePrice = pricing.sellingPrice
            }
            return { ...p, effectivePrice: effectivePrice, hasCustomPrice: !!pricing }
        }).filter(Boolean)
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [products, customerPricings, searchQuery])

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { productId: product.id, quantity: 1 }]
        })
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(0, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }).filter(item => item.quantity > 0))
    }

    const cartSummary = useMemo(() => {
        let total = 0
        let itemCount = 0
        cart.forEach(item => {
            const product = availableProducts.find(p => p?.id === item.productId)
            if (product) {
                total += product.effectivePrice * item.quantity
                itemCount += item.quantity
            }
        })
        return { total, itemCount }
    }, [cart, availableProducts])

    const handleSubmit = async () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer")
            return
        }
        if (cart.length === 0) {
            toast.error("Cart is empty")
            return
        }

        setSubmitting(true)
        try {
            const finalBranchId = selectedBranchId === "no-branch" ? null : selectedBranchId
            const payload: any = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                customerPoNumber: poNumber
            }
            if (finalBranchId) {
                payload.shippingBranchId = finalBranchId;
                payload.billingBranchId = finalBranchId;
            }

            await createTeamOrder(activeStore.id, selectedCustomerId, finalBranchId, payload)
            toast.success("Order punched successfully")
            onOrderCreated()
            onOpenChange(false)
        } catch (err: any) {
            toast.error("Failed to create order: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] w-[1000px] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-gray-50/50">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">Add Order</DialogTitle>
                        <DialogDescription className="text-gray-500 mt-1">Create a new purchase order for a customer.</DialogDescription>
                    </div>
                    {selectedCustomerId && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                            <User className="w-4 h-4" />
                            {customers.find(c => c.id === selectedCustomerId)?.name}
                        </div>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: Selection & Catalog */}
                    <div className="flex-1 flex flex-col min-w-0 border-r bg-white">

                        {/* 1. Context Pickers */}
                        <div className="p-6 border-b space-y-4 shrink-0 bg-white z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Customer</Label>
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger className="bg-gray-50 border-gray-200">
                                            <SelectValue placeholder="Select Customer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Destination Branch</Label>
                                    <Select
                                        value={selectedBranchId}
                                        onValueChange={setSelectedBranchId}
                                        disabled={!selectedCustomerId || branches.length === 0}
                                    >
                                        <SelectTrigger className="bg-gray-50 border-gray-200">
                                            <SelectValue placeholder="Head Office / Default" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no-branch" className="text-gray-500">Head Office / Default</SelectItem>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {selectedCustomerId && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search product catalog..."
                                        className="pl-9 bg-gray-50 border-gray-200"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        {/* 2. Product List */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/30">
                            {!selectedCustomerId ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                    <Building2 className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Select a customer to view their catalog.</p>
                                </div>
                            ) : loadingData ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                                </div>
                            ) : availableProducts.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <p>No products found matching &quot;{searchQuery}&quot;</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {availableProducts.map((product: any) => {
                                        const inCart = cart.find(c => c.productId === product.id)
                                        const price = typeof product.effectivePrice === 'number' ? product.effectivePrice : 0
                                        return (
                                            <div key={product.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors group">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{product.sku}</span>
                                                        <span className="font-semibold text-gray-900">{product.currency} {price.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <div className="shrink-0">
                                                    {inCart ? (
                                                        <div className="flex items-center gap-3 bg-white border shadow-sm rounded-lg p-1">
                                                            <button
                                                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                                                                onClick={() => updateQuantity(product.id, -1)}
                                                            >
                                                                <Minus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <span className="w-6 text-center font-semibold text-sm">{inCart.quantity}</span>
                                                            <button
                                                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black hover:text-white text-gray-900 transition-colors"
                                                                onClick={() => updateQuantity(product.id, 1)}
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            className="text-gray-500 hover:text-black hover:bg-gray-100"
                                                            onClick={() => addToCart(product)}
                                                        >
                                                            Add to PO
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Cart Summary - Fixed width */}
                    <div className="w-[380px] flex flex-col bg-white border-l shadow-xl shadow-gray-200/50 z-20">
                        <div className="p-6 bg-gray-50/50 border-b flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-gray-500" />
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-600">Purchase Order</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                        <ShoppingCart className="w-8 h-8 opacity-40" />
                                    </div>
                                    <div className="max-w-[200px]">
                                        <p className="font-medium text-gray-600">Cart is empty</p>
                                        <p className="text-sm mt-1">Add items from the catalog on the left to start building the PO.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => {
                                        const product = availableProducts.find(p => p?.id === item.productId)
                                        if (!product) return null
                                        const price = typeof product.effectivePrice === 'number' ? product.effectivePrice : 0
                                        return (
                                            <div key={item.productId} className="flex justify-between items-start text-sm bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                                                <div className="flex-1 pr-3">
                                                    <div className="font-medium text-gray-900 line-clamp-2">{product.name}</div>
                                                    <div className="text-gray-500 text-xs mt-1">
                                                        {item.quantity} x {product.currency} {price.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-gray-900 tabular-nums">
                                                    {(price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="p-6 bg-white border-t space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">PO Number (Optional)</Label>
                                <Input
                                    placeholder="e.g. PO-2024-001"
                                    className="h-9 bg-gray-50"
                                    value={poNumber}
                                    onChange={e => setPoNumber(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Total Items</span>
                                    <span>{cartSummary.itemCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold text-gray-900 border-t pt-3">
                                    <span>Total</span>
                                    <span>{activeStore?.currency || 'INR'} {(typeof cartSummary.total === 'number' ? cartSummary.total : 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full h-11 text-base bg-black hover:bg-gray-800 shadow-lg shadow-gray-200"
                                disabled={submitting || cart.length === 0}
                                onClick={handleSubmit}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Order
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
