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
import { Plus, Minus, Search, Loader2, ShoppingCart, Receipt, Building2, User, X } from "lucide-react"
import { toast } from "sonner"
import {
    fetchCustomers,
    fetchBranches,
    getCustomerPricings,
    fetchProducts,
} from "@/lib/api"
import { useStore } from "@/contexts/store-context"
import { API_URL, getAuthHeaders } from "@/lib/api"

async function createTeamOrder(storeId: string, customerId: string | null, branchId: string | null, data: any) {
    let url = `${API_URL}/stores/${storeId}`;

    if (customerId) {
        url += `/customers/${customerId}`;
        if (branchId) {
            url += `/branches/${branchId}/orders`;
        } else {
            url += `/orders`;
        }
    } else {
        // Quick Order Endpoint
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

    // Order Type State
    const [orderType, setOrderType] = useState<'customer' | 'quick'>('quick')
    const [quickOrderSource, setQuickOrderSource] = useState<string>("walkin")

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedBranchId, setSelectedBranchId] = useState<string>("no-branch")

    // Cart logic
    const [cart, setCart] = useState<{ productId: string, quantity: number, customPrice?: number }[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // PO Number & Contact
    const [poNumber, setPoNumber] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [showContactInfo, setShowContactInfo] = useState(false)

    // Clear cart on mode switch
    useEffect(() => {
        setCart([])
        setSearchQuery("")
    }, [orderType])

    useEffect(() => {
        if (open && activeStore) {
            loadCustomers()
            // Always load products for Quick Order mode immediately
            loadAllProducts()
        } else {
            // Reset State
            setOrderType('quick')
            setQuickOrderSource("walkin")
            setSelectedCustomerId("")
            setSelectedBranchId("no-branch")
            setCart([])
            setSearchQuery("")
            setBranches([])
            setCustomerPricings([])
            setPoNumber("")
            setContactPerson("")
            setContactPhone("")
            setDeliveryAddress("")
            setShowContactInfo(false)
        }
    }, [open, activeStore])

    useEffect(() => {
        if (orderType === 'customer' && selectedCustomerId && activeStore) {
            loadCustomerData(selectedCustomerId)
        } else if (orderType === 'quick') {
            // Ensure products are loaded (might have been loaded on open, but ensure)
            if (products.length === 0) loadAllProducts()
        }
    }, [orderType, selectedCustomerId, activeStore])

    const loadCustomers = async () => {
        try {
            const data = await fetchCustomers()
            setCustomers(data)
        } catch (err) {
            console.error(err)
            toast.error("Failed to load customers")
        }
    }

    const loadAllProducts = async () => {
        try {
            const data = await fetchProducts()
            setProducts(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error(err)
            // toast.error("Failed to load products")
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
            let effectivePrice = p.basePrice || 0
            let isVisible = true

            if (orderType === 'customer') {
                const pricing = Array.isArray(customerPricings) ? customerPricings.find((cp: any) => cp.productId === p.id) : null
                if (pricing && !pricing.visible) isVisible = false

                if (pricing && pricing.sellingPrice !== null && pricing.sellingPrice !== undefined) {
                    effectivePrice = pricing.sellingPrice
                }
                return isVisible ? { ...p, effectivePrice, hasCustomPrice: !!pricing } : null
            } else {
                // Quick Order: Show all, use base price
                return { ...p, effectivePrice }
            }
        }).filter(Boolean)
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [products, customerPricings, searchQuery, orderType])

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { productId: product.id, quantity: 1, customPrice: orderType === 'quick' ? 0 : undefined }]
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

    const updateCartItemPrice = (productId: string, price: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, customPrice: price }
            }
            return item
        }))
    }

    const cartSummary = useMemo(() => {
        let subtotal = 0
        let tax = 0
        let itemCount = 0
        cart.forEach(item => {
            const product = availableProducts.find(p => p?.id === item.productId)
            if (product) {
                const finalPrice = (item.customPrice !== undefined) ? item.customPrice : product.effectivePrice
                const lineTotal = finalPrice * item.quantity

                // Tax Calculation (Exclusive)
                const cgst = Number(product.cgst) || 9
                const sgst = Number(product.sgst) || 9
                const taxRate = cgst + sgst
                const taxAmount = lineTotal * (taxRate / 100)

                subtotal += lineTotal
                tax += taxAmount
                itemCount += item.quantity
            }
        })
        return { subtotal, tax, total: subtotal + tax, itemCount }
    }, [cart, availableProducts])

    const handleSubmit = async () => {
        if (orderType === 'customer' && !selectedCustomerId) {
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
                    quantity: item.quantity,
                    customUnitPrice: (orderType === 'quick' && item.customPrice !== undefined) ? item.customPrice : undefined
                })),
                customerPoNumber: poNumber,
                orderSource: orderType === 'quick' ? quickOrderSource : 'storefront',
                customerId: orderType === 'customer' ? selectedCustomerId : undefined,
                contactPerson: orderType === 'quick' ? contactPerson : undefined,
                contactPhone: orderType === 'quick' ? contactPhone : undefined,
                deliveryAddress: orderType === 'quick' ? deliveryAddress : undefined
            }

            if (finalBranchId) {
                payload.shippingBranchId = finalBranchId;
                payload.billingBranchId = finalBranchId;
            }

            await createTeamOrder(activeStore.id, orderType === 'customer' ? selectedCustomerId : null, finalBranchId, payload)
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
            <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-gray-50/50">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">Add Order</DialogTitle>
                        <DialogDescription className="text-gray-500 mt-1">Create a new purchase order.</DialogDescription>
                    </div>
                    {orderType === 'customer' && selectedCustomerId && (
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

                            {/* Order Type Toggle */}
                            <div className="flex p-1 bg-gray-100 rounded-lg w-full mb-4">
                                <button
                                    onClick={() => setOrderType('quick')}
                                    className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${orderType === 'quick' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Quick Order
                                </button>
                                <button
                                    onClick={() => setOrderType('customer')}
                                    className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${orderType === 'customer' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Customer Order
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {orderType === 'customer' ? (
                                    <>
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
                                    </>
                                ) : (
                                    // Quick Order Controls
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Order Source</Label>
                                        <Select value={quickOrderSource} onValueChange={setQuickOrderSource}>
                                            <SelectTrigger className="bg-gray-50 border-gray-200">
                                                <SelectValue placeholder="Select Source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="walkin">Walk-in</SelectItem>
                                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                <SelectItem value="phone">Phone</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {(selectedCustomerId || orderType === 'quick') && (
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
                            {(orderType === 'customer' && !selectedCustomerId) ? (
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
                                                        {orderType !== 'quick' && (
                                                            <span className="font-semibold text-gray-900">{product.currency} {price.toFixed(2)}</span>
                                                        )}
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
                    <div className="w-[500px] flex flex-col bg-white border-l shadow-xl shadow-gray-200/50 z-20">
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
                                        const basePrice = typeof product.effectivePrice === 'number' ? product.effectivePrice : 0
                                        const currentPrice = (item.customPrice !== undefined) ? item.customPrice : basePrice

                                        return (
                                            <div key={item.productId} className="flex flex-col gap-2 text-sm bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-3">
                                                        <div className="font-medium text-gray-900 line-clamp-2">{product.name}</div>
                                                    </div>

                                                    <div className="font-semibold text-gray-900 tabular-nums">
                                                        {(currentPrice * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="text-gray-500 text-xs flex items-center gap-1">
                                                        {item.quantity} x
                                                        {orderType === 'quick' ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-400 font-medium">{product.currency}</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-32 px-2 py-1 border rounded font-semibold text-gray-900 text-base focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                                                                    placeholder="0.00"
                                                                    value={currentPrice === 0 ? '' : currentPrice}
                                                                    onChange={(e) => updateCartItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                                                    min="0"
                                                                    autoFocus={currentPrice === 0}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span>{product.currency} {basePrice.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="p-6 bg-white border-t space-y-4">
                            {orderType === 'quick' && (
                                <div className="space-y-3">
                                    {!showContactInfo ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                            onClick={() => setShowContactInfo(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Delivery & Contact Info
                                        </Button>
                                    ) : (
                                        <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Delivery & Contact</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-100"
                                                    onClick={() => setShowContactInfo(false)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Contact Person"
                                                    className="h-8 bg-white text-xs"
                                                    value={contactPerson}
                                                    onChange={e => setContactPerson(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Phone Number"
                                                    className="h-8 bg-white text-xs"
                                                    value={contactPhone}
                                                    onChange={e => setContactPhone(e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Delivery Address"
                                                className="h-8 bg-white text-xs"
                                                value={deliveryAddress}
                                                onChange={e => setDeliveryAddress(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

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
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{activeStore?.currency || 'INR'} {(typeof cartSummary.subtotal === 'number' ? cartSummary.subtotal : 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>GST (18%)</span>
                                    <span>{activeStore?.currency || 'INR'} {(typeof cartSummary.tax === 'number' ? cartSummary.tax : 0).toFixed(2)}</span>
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
