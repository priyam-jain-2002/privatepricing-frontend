"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Minus, Search, Loader2, ShoppingCart, Receipt, Building2, User, X } from "lucide-react"
import { toast } from "sonner"
import {
    fetchCustomers,
    fetchBranches,
    getCustomerPricingsView,
    fetchProducts,
    updateTeamOrder,
} from "@/lib/api"
import { useStore } from "@/contexts/store-context"
import { API_URL, getAuthHeaders } from "@/lib/api"
import { analytics } from "@/lib/analytics"

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
    initialOrder?: any
}

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated, initialOrder }: CreateOrderDialogProps) {
    const { activeStore } = useStore()

    const [customers, setCustomers] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [customerPricings, setCustomerPricings] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(false)

    // Order Type State
    const [orderType, setOrderType] = useState<'customer' | 'quick'>('quick')
    const [quickOrderSource, setQuickOrderSource] = useState<string>("walkin")
    const [showConfirm, setShowConfirm] = useState(false)

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedBranchId, setSelectedBranchId] = useState<string>("no-branch")
    const [billingBranchId, setBillingBranchId] = useState<string>("no-branch")
    const [isPickup, setIsPickup] = useState(false)

    // Cart logic
    const [cart, setCart] = useState<{ productId: string, quantity: number, customPrice?: number }[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // PO Number & Contact
    const [poNumber, setPoNumber] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [deliveryAddress, setDeliveryAddress] = useState("")
    // const [showContactInfo, setShowContactInfo] = useState(false) // Removed in favor of dialog
    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog')

    // Clear cart on mode switch
    // MOVED to manual handlers to prevent clearing on init
    // useEffect(() => {
    //     setCart([])
    //     setSearchQuery("")
    // }, [orderType])

    useEffect(() => {
        if (open && activeStore) {
            loadCustomers()
            loadAllProducts()

            if (initialOrder) {
                // Populate form for editing
                setOrderType(initialOrder.customerId ? 'customer' : 'quick')
                if (initialOrder.customerId) setSelectedCustomerId(initialOrder.customerId)

                // Set branches
                if (initialOrder.shippingBranchId) setSelectedBranchId(initialOrder.shippingBranchId)
                if (initialOrder.billingBranchId) setBillingBranchId(initialOrder.billingBranchId)

                // Quick Order fields
                if (initialOrder.orderSource) setQuickOrderSource(initialOrder.orderSource)
                if (initialOrder.contactPerson) setContactPerson(initialOrder.contactPerson)
                if (initialOrder.contactPhone) setContactPhone(initialOrder.contactPhone)
                if (initialOrder.shippingAddressSnapshot) setDeliveryAddress(initialOrder.shippingAddressSnapshot)

                if (initialOrder.customerPoNumber) setPoNumber(initialOrder.customerPoNumber)

                // Populate Cart
                // Map existing items to cart structure
                if (initialOrder.items && Array.isArray(initialOrder.items)) {
                    const mappedCart = initialOrder.items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        customPrice: item.priceSource === 'override' ? item.unitPriceAtTime : undefined
                    }))
                    setCart(mappedCart)
                }
            }
        } else {
            // Reset State
            setOrderType('quick')
            setIsPickup(false)
            setQuickOrderSource("walkin")
            setSelectedCustomerId("")
            setSelectedBranchId("no-branch")
            setBillingBranchId("no-branch")
            setCart([])
            setSearchQuery("")
            setBranches([])
            setCustomerPricings([])
            setPoNumber("")
            setContactPerson("")
            setContactPhone("")
            setContactPhone("")
            setDeliveryAddress("")
            // setShowContactInfo(false)
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
                getCustomerPricingsView(activeStore.id, customerId).catch(() => []),
                fetchProducts().catch(() => [])
            ])
            setBranches(Array.isArray(branchesData) ? branchesData : [])

            // Default to first branch if available AND no branch currently selected (and not editing an existing selection)
            // We check if selectedBranchId is 'no-branch' to decide if we should default. 
            // BUT beware of race conditions with initialOrder setting it.
            // If initialOrder set it, selectedBranchId is NOT 'no-branch'.
            if (selectedBranchId === 'no-branch' && Array.isArray(branchesData) && branchesData.length > 0) {
                setSelectedBranchId(branchesData[0].id)
                // Also default billing to first if not already set (or reset it)
                // Logic elsewhere handles separate billing visibility, but good to have a valid ID selected underneath
                setBillingBranchId(branchesData[0].id)
            } else if (!branchesData.find((b: any) => b.id === selectedBranchId)) {
                // If selected branch is not in the new list (e.g. customer changed), reset
                if (selectedBranchId !== 'no-branch') {
                    setSelectedBranchId("no-branch")
                    setBillingBranchId("no-branch")
                }
            }

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

    // Unified Order Type Logic
    // Default to 'quick'
    // If customer selected -> 'customer'
    useEffect(() => {
        if (selectedCustomerId) {
            setOrderType('customer')
        } else {
            setOrderType('quick')
        }
        // Clear cart on context switch to prevent cross-customer data leaks or pricing issues
        setCart([])
    }, [selectedCustomerId])

    // Load available products
    const availableProducts = useMemo(() => {
        if (!Array.isArray(products) || !products.length) return []

        return products.map(p => {
            let effectivePrice = Number(p.basePrice) || 0

            if (orderType === 'customer') {
                const pricing = Array.isArray(customerPricings) ? customerPricings.find((cp: any) => cp.productId === p.id) : null

                // Strict filtering: Only show if pricing exists and is visible
                if (!pricing || !pricing.visible) return null

                if (pricing.sellingPrice !== null && pricing.sellingPrice !== undefined) {
                    effectivePrice = Number(pricing.sellingPrice)
                }
                return { ...p, effectivePrice, hasCustomPrice: true } // Mark as having custom/assigned price
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

    const setItemQuantity = (productId: string, qty: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity: Math.max(0, qty) }
            }
            return item
        }).filter(item => item.quantity > 0 || qty === 0)) // Keep item if qty is 0 temporarily? No, standard logic removes it. 
        // User wants to edit quantity. If they type 0 it removes? Maybe better to allow 0 while typing? 
        // For now, let's just use standard filter > 0. If they type 0, it removes.
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
            const product = availableProducts.find(p => p?.id === item.productId) || products.find(p => p.id === item.productId)
            if (product) {
                const finalPrice = (item.customPrice !== undefined) ? item.customPrice : (product.effectivePrice || product.basePrice || 0)
                const lineTotal = finalPrice * item.quantity

                // Tax Calculation (Exclusive)
                const gstRate = Number(product.gst) || 18
                const taxAmount = lineTotal * (gstRate / 100)

                subtotal += lineTotal
                tax += taxAmount
                itemCount += item.quantity
            }
        })
        return { subtotal, tax, total: subtotal + tax, itemCount }
    }, [cart, availableProducts])

    const executeOrderSubmission = async () => {
        setSubmitting(true)
        try {
            // If Pickup is enabled, force shipping/billing branch to null (or rely on them being ignored if not sent, but let's be explicit logic-wise)
            // Actually, if isPickup, we just send null/undefined for shippingBranchId.
            const finalShippingBranchId = (isPickup || selectedBranchId === "no-branch") ? null : selectedBranchId
            const finalBillingBranchId = (isPickup || billingBranchId === "no-branch") ? null : billingBranchId

            const payload: any = {
                items: cart.filter(i => i.quantity > 0).map(item => ({
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

            if (orderType === 'customer') {
                const customer = customers.find(c => c.id === selectedCustomerId)
                const useSame = customer?.isBillToSameAsShipTo ?? false

                payload.shippingBranchId = finalShippingBranchId

                if (useSame) {
                    payload.billingBranchId = finalShippingBranchId
                } else {
                    payload.billingBranchId = finalBillingBranchId || finalShippingBranchId
                }
            } else if (finalShippingBranchId) {
                payload.shippingBranchId = finalShippingBranchId;
                payload.billingBranchId = finalShippingBranchId;
            }

            if (initialOrder) {
                await updateTeamOrder(activeStore.id, initialOrder.id, payload)
                toast.success("Order updated successfully")

                analytics.capture('order_edited', {
                    store_id: activeStore.id,
                    order_id: initialOrder.id,
                    actor_role: 'store_team'
                })
            } else {
                const newOrder = await createTeamOrder(activeStore.id, orderType === 'customer' ? selectedCustomerId : null, finalShippingBranchId, payload)
                toast.success("Order punched successfully")

                analytics.capture('order_created', {
                    store_id: activeStore.id,
                    order_id: newOrder.id,
                    actor_role: 'store_team',
                    order_source: 'store_team'
                })
            }

            onOrderCreated()
            onOpenChange(false)
        } catch (err: any) {
            toast.error(`Failed to ${initialOrder ? 'update' : 'create'} order: ` + err.message)
        } finally {
            setSubmitting(false)
            setShowConfirm(false)
        }
    }

    const handleSubmit = async () => {
        if (orderType === 'customer' && !selectedCustomerId) {
            toast.error("Please select a customer")
            return
        }
        if (cart.length === 0) {
            toast.error("Cart is empty")
            return
        }

        if (initialOrder) {
            setShowConfirm(true)
        } else {
            await executeOrderSubmission()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[98vw] w-full h-[95vh] p-0 gap-0 overflow-hidden flex flex-col bg-gray-50/50">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">{initialOrder ? 'Edit Order' : 'Add Order'}</DialogTitle>
                        <DialogDescription className="text-gray-500 mt-1">Create a new purchase order.</DialogDescription>
                    </div>
                    {orderType === 'customer' && selectedCustomerId && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                            <User className="w-4 h-4" />
                            {customers.find(c => c.id === selectedCustomerId)?.name}
                        </div>
                    )}
                </div>

                {/* Mobile Tabs */}
                <div className="md:hidden flex border-b bg-gray-50">
                    <button
                        onClick={() => setMobileTab('catalog')}
                        className={`flex-1 py-3 text-sm font-semibold ${mobileTab === 'catalog' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    >
                        Catalog
                    </button>
                    <button
                        onClick={() => setMobileTab('cart')}
                        className={`flex-1 py-3 text-sm font-semibold relative ${mobileTab === 'cart' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    >
                        Cart ({cartSummary.itemCount})
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* LEFT: Selection & Catalog */}
                    <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 border-r bg-white`}>

                        {/* 1. Context Pickers */}
                        <div className="p-6 border-b space-y-6 shrink-0 bg-white z-10 w-full relative">

                            {/* UNIFIED CUSTOMER SELECTOR */}
                            <div className="space-y-1.5 w-full">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Customer / Account</Label>
                                    {selectedCustomerId && (
                                        <button
                                            onClick={() => {
                                                setSelectedCustomerId('')
                                                setOrderType('quick')
                                            }}
                                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                        >
                                            Clear Selection (Walk-in)
                                        </button>
                                    )}
                                </div>
                                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                    <SelectTrigger className={`bg-gray-50 border-gray-200 ${!selectedCustomerId ? 'text-gray-500 font-normal italic' : 'text-gray-900 font-medium'}`}>
                                        <SelectValue placeholder="Quick Order / Walk-in Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quick_order_placeholder" disabled className="text-gray-400 italic text-xs py-1">Select a generic source beneath for Walk-ins</SelectItem>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {orderType === 'customer' ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center space-x-2 pt-1">
                                            <input
                                                type="checkbox"
                                                id="pickup-mode"
                                                checked={isPickup}
                                                onChange={(e) => setIsPickup(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                            />
                                            <label
                                                htmlFor="pickup-mode"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 select-none cursor-pointer"
                                            >
                                                Pickup in store
                                            </label>
                                        </div>

                                        {!isPickup && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Destination / Shipping Branch</Label>
                                                    <Select
                                                        value={selectedBranchId}
                                                        onValueChange={(val) => {
                                                            setSelectedBranchId(val)
                                                        }}
                                                        disabled={!selectedCustomerId || branches.length === 0}
                                                    >
                                                        <SelectTrigger className="bg-gray-50 border-gray-200">
                                                            <SelectValue placeholder="Head Office / Default" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {branches.map(b => (
                                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {(() => {
                                                    const customer = customers.find(c => c.id === selectedCustomerId)
                                                    // Only show separate billing if isBillToSameAsShipTo is FALSE
                                                    if (customer && !customer.isBillToSameAsShipTo && !isPickup) {
                                                        return (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Billing Branch</Label>
                                                                <Select
                                                                    value={billingBranchId}
                                                                    onValueChange={setBillingBranchId}
                                                                    disabled={!selectedCustomerId || branches.length === 0}
                                                                >
                                                                    <SelectTrigger className="bg-gray-50 border-gray-200">
                                                                        <SelectValue placeholder="Head Office / Default" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {branches.map(b => (
                                                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Quick Order Controls
                                    <div className="space-y-1.5 animate-in fade-in duration-300">
                                        <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Source</Label>
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

                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={orderType === 'customer' ? `Search ${customers.find(c => c.id === selectedCustomerId)?.name || 'customer'}'s catalog...` : "Search global catalog..."}
                                    className="pl-9 bg-gray-50 border-gray-200"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                // Auto-focus only if we aren't interacting with selects above constantly
                                />
                            </div>
                        </div>

                        {/* 2. Product List */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/30">
                            {(orderType === 'customer' && !selectedCustomerId) ? (
                                // This state should largely be impossible now unless clearing selection, 
                                // but if it happens, we guide them
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                    <Building2 className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Select a customer above or switch to Quick Order.</p>
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
                                                        <div className="flex items-center gap-1 bg-white border shadow-sm rounded-lg p-0.5">
                                                            <button
                                                                className="w-6 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                                                                onClick={() => updateQuantity(product.id, -1)}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <input
                                                                className="w-16 text-center font-semibold text-sm border-x py-1 focus:outline-none"
                                                                value={inCart.quantity === 0 ? '' : inCart.quantity}
                                                                onChange={(e) => setItemQuantity(product.id, parseInt(e.target.value) || 0)}
                                                                type="number"
                                                                min="0"
                                                                onWheel={(e) => e.currentTarget.blur()}
                                                            />
                                                            <button
                                                                className="w-6 h-7 flex items-center justify-center rounded-md hover:bg-black hover:text-white text-gray-900 transition-colors"
                                                                onClick={() => updateQuantity(product.id, 1)}
                                                            >
                                                                <Plus className="w-3 h-3" />
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

                    {/* RIGHT: Cart Summary - Fluid width */}
                    <div className={`${mobileTab === 'cart' ? 'flex' : 'hidden'} md:flex flex-[1.3] min-w-0 md:min-w-[320px] flex-col bg-white border-l shadow-xl shadow-gray-200/50 z-20`}>
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
                                        // Fallback to main products list if not in availableProducts (e.g. filtered out by search or visibility)
                                        const product = availableProducts.find(p => p?.id === item.productId) || products.find(p => p.id === item.productId)
                                        if (!product) return null
                                        const basePrice = typeof product.effectivePrice === 'number' ? product.effectivePrice : 0
                                        const currentPrice = (item.customPrice !== undefined) ? item.customPrice : basePrice
                                        const lineTotal = currentPrice * item.quantity

                                        // Calculate Item Tax
                                        const gstRate = Number(product.gst) || 18
                                        const itemTax = lineTotal * (gstRate / 100)

                                        return (
                                            <div key={item.productId} className="flex flex-col gap-3 text-base bg-gray-50 p-4 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-3">
                                                        <div className="font-medium text-gray-900 line-clamp-2">{product.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            + GST ({gstRate}%): {product.currency} {itemTax.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <div className="font-semibold text-gray-900 tabular-nums text-lg">
                                                        {(lineTotal).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="text-gray-600 flex items-center gap-3 w-full">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                className="w-20 text-center font-semibold text-base border rounded bg-white py-1 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                                                value={item.quantity === 0 ? '' : item.quantity}
                                                                onChange={(e) => setItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                                type="number"
                                                                min="0"
                                                                onWheel={(e) => e.currentTarget.blur()}
                                                                placeholder="Qty"
                                                            />
                                                            <span className="text-sm font-medium">units</span>
                                                        </div>

                                                        <span className="text-gray-300">|</span>

                                                        {orderType === 'quick' ? (
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <span className="text-gray-500 font-medium">{product.currency}</span>
                                                                <input
                                                                    type="number"
                                                                    className="flex-1 w-full px-3 py-1 border rounded font-semibold text-gray-900 text-base focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                                                                    placeholder="Unit Price"
                                                                    value={currentPrice === 0 ? '' : currentPrice}
                                                                    onChange={(e) => updateCartItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                                                    min="0"
                                                                    onWheel={(e) => e.currentTarget.blur()}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span>{product.currency} {basePrice.toFixed(2)} / unit</span>
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
                                    <div className="space-y-3">
                                        {(!contactPerson && !contactPhone && !deliveryAddress) ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-black font-bold border-gray-200 hover:bg-gray-50"
                                                onClick={() => setShowDeliveryDialog(true)}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Delivery & Contact Info
                                            </Button>
                                        ) : (
                                            <div className="relative group rounded-lg border border-dashed border-gray-200 p-3 bg-gray-50/50 hover:bg-gray-50 transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Details</h4>

                                                        {contactPerson && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="font-medium">{contactPerson}</span>
                                                            </div>
                                                        )}

                                                        {contactPhone && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <span className="text-gray-400">Ph:</span>
                                                                <span className="font-mono">{contactPhone}</span>
                                                            </div>
                                                        )}

                                                        {deliveryAddress && (
                                                            <div className="flex items-start gap-2 text-xs text-gray-600 mt-1">
                                                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                                <span className="line-clamp-2">{deliveryAddress}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => setShowDeliveryDialog(true)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                                                            onClick={() => {
                                                                setContactPerson("")
                                                                setContactPhone("")
                                                                setDeliveryAddress("")
                                                            }}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                    <span>GST</span>
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
                                {initialOrder ? 'Update Order' : 'Add Order'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Order?</DialogTitle>
                        <DialogDescription>
                            WARNING: You are editing an existing order. This will overwrite the existing order detials.
                            <br /><br />
                            The previous audit trail will note these changes.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                        <Button onClick={executeOrderSubmission} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Nested Delivery Dialog */}
            <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delivery Details</DialogTitle>
                        <DialogDescription>
                            Enter contact and shipping information for this order.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input
                                    placeholder="Name"
                                    value={contactPerson}
                                    onChange={e => setContactPerson(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Mobile (10 digits)"
                                        value={contactPhone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                            setContactPhone(val)
                                        }}
                                        type="tel"
                                        maxLength={10}
                                    />
                                    {contactPhone.length > 0 && contactPhone.length < 10 && (
                                        <p className="text-[10px] text-red-500">Must be 10 digits</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Shipping Address</Label>
                            <div className="space-y-1">
                                <Textarea
                                    placeholder="Full Address, Landmark, etc."
                                    value={deliveryAddress}
                                    onChange={e => setDeliveryAddress(e.target.value.slice(0, 200))}
                                    className="min-h-[100px] resize-none"
                                />
                                <div className="text-[10px] text-gray-400 text-right">
                                    {deliveryAddress.length}/200
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => setShowDeliveryDialog(false)}
                            disabled={contactPhone.length > 0 && contactPhone.length < 10}
                        >
                            Save Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog >
    )
}
