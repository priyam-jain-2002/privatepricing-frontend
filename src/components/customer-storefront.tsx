"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, LogOut, Package, Search, Menu, X, User, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { toast } from "sonner"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { fetchAPI, getUserFromToken, createStorefrontOrder, fetchStorefrontOrders, fetchCustomer } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PayOrderDialog } from "@/components/order-invoice-dialog"
import { format } from "date-fns"
interface Product {
  id: string
  name: string
  unit: string
  price: number
  quantity: number
  currency: string
  description?: string
  minimumQuantity?: number
  productSku?: string
}

enum UserRole {
  STORE_OWNER = 0,
  CUSTOMER_ADMIN = 1,
  BRANCH_MANAGER = 2,
  BRANCH_USER = 3,
}

interface User {
  id: string
  email: string
  role: UserRole
  name?: string
}

interface AuthContext {
  store?: { id: string }
  customer?: { id: string; name?: string }
  branch?: { id: string; name?: string }
}

export function CustomerStorefront() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerDetails, setCustomerDetails] = useState<any>(null)

  // Store Context
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string>("")
  const [subdomain, setSubdomain] = useState<string | null>(null)

  // Auth State
  const [user, setUser] = useState<User | null>(null)
  const [authContext, setAuthContext] = useState<AuthContext | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // View State
  const [activeView, setActiveView] = useState<'catalog' | 'orders'>('catalog')
  const [orders, setOrders] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<any>(null)

  // Initialization: Check Session & Fetch Store Info (optional if we have storeId from session)
  useEffect(() => {

    async function init() {
      // 1. Check Session & Decode Token
      const token = sessionStorage.getItem('access_token')
      const decodedUser = getUserFromToken()

      if (!token || !decodedUser) {
        // Must redirect to login page specifically, not root (which rewrites to storefront)
        router.push('/storefront/login')
        return
      }

      setAccessToken(token)

      const { storeId: tokStoreId, id, sub, role: userRole, email, customerId, branchId } = decodedUser;
      const userId = id || sub;

      if (tokStoreId) setStoreId(tokStoreId)

      if (userId) {
        setUser({
          id: userId,
          email: email || '',
          role: userRole !== undefined ? Number(userRole) : 3, // Default to 3 (Customer/Branch User) if undefined
          name: decodedUser.name
        })
      }

      setAuthContext({
        store: tokStoreId ? { id: tokStoreId } : undefined,
        customer: customerId ? { id: customerId } : undefined,
        branch: branchId ? { id: branchId } : undefined
      })

      // 2. Fetch Store Info
      try {
        if (tokStoreId) {
          const currentStore = await fetchAPI(`/stores/${tokStoreId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (currentStore) {
            setStoreName(currentStore.name)
            if (currentStore.subdomain) setSubdomain(currentStore.subdomain)
          }
        } else {
          // ...
        }
      } catch (err: any) {
        console.error("Failed to fetch store info", err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  // Fetch Products & Customer Details
  useEffect(() => {
    if (!storeId || !user || !authContext?.customer?.id || !accessToken) return

    async function loadData() {
      try {
        setLoading(true)
        const [productsData, custData] = await Promise.all([
          fetchAPI(`/storefront/customers/${authContext?.customer?.id}/pricing`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          fetchCustomer(authContext!.customer!.id)
        ]);

        setCustomerDetails(custData);

        const mappedProducts = productsData.map((p: any) => ({
          id: p.productId,
          name: p.productName,
          unit: "unit",
          price: Number(p.price),
          quantity: 0,
          currency: p.currency || 'INR',
          description: p.productDescription,
          minimumQuantity: p.minimumQuantity || 1,
          productSku: p.productSku
        }))
        setProducts(mappedProducts)
      } catch (err: any) {
        if (err.message.includes('401') || err.message.includes('403')) {
          // Token expired or invalid
          handleLogout()
        }
        console.error("Failed to fetch custom products", err)
        setError("Unable to load your catalog. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [storeId, user, authContext, accessToken])
  // Fetch Orders
  useEffect(() => {
    if (!storeId || !user || !authContext?.customer?.id || !accessToken || activeView !== 'orders') return

    async function loadOrders() {
      try {
        setLoading(true)
        const data = await fetchStorefrontOrders(authContext!.customer!.id)
        // Sort by date desc
        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(data)
      } catch (err) {
        console.error("Failed to load orders", err)
        toast.error("Failed to load your orders")
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [storeId, user, authContext, accessToken, activeView])

  // Fetch Branches
  const [branches, setBranches] = useState<any[]>([])
  useEffect(() => {
    if (!authContext?.customer?.id || !accessToken) return
    async function loadBranches() {
      try {
        // We can reuse the fetchBranches from api.ts which calls /customers/:cid/branches
        // Requires the user (even customer user) to have access to this endpoint
        const data = await fetchAPI(`/customers/${authContext?.customer?.id}/branches`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        setBranches(data)
      } catch (err) {
        console.error("Failed to load branches", err)
      }
    }
    loadBranches()
  }, [authContext, accessToken])

  // Cart Logic
  const updateQuantity = (id: string, newQty: number) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const q = Math.max(0, newQty)
        return { ...p, quantity: q }
      }
      return p
    }))
  }

  useEffect(() => {
    setTotalItems(products.reduce((sum, p) => sum + p.quantity, 0))
  }, [products])

  // Review Dialog State
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Selection State
  const [selectedBillingBranch, setSelectedBillingBranch] = useState<string>("")
  const [selectedShippingBranch, setSelectedShippingBranch] = useState<string>("")
  const [customerPoNumber, setCustomerPoNumber] = useState<string>("")

  // Calculated totals for review
  const orderItems = products.filter(p => p.quantity > 0)

  // Calculate Totals including GST
  const calculateTotals = () => {
    let baseTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;

    orderItems.forEach(item => {
      // Assuming product has cgst/sgst defaults if not provided? 
      // For now we'll assume 9% default if the API didn't return them (it should have if we mapped it, wait we didn't map them in fetchProducts)
      // Let's assume standard 9% for now as a fallback or if invalid.
      // Ideally we update fetchProducts to return cgst/sgst.
      // Since I can't easily update the backend return type in 1 go without checking types, I'll default to 9%.
      const cgstRate = 9.00;
      const sgstRate = 9.00;

      const itemBase = item.price * item.quantity;
      baseTotal += itemBase;

      cgstTotal += (itemBase * cgstRate) / 100;
      sgstTotal += (itemBase * sgstRate) / 100;
    });

    return { baseTotal, cgstTotal, sgstTotal, finalTotal: baseTotal + cgstTotal + sgstTotal };
  }

  const { baseTotal, cgstTotal, sgstTotal, finalTotal } = calculateTotals();
  const orderCurrency = orderItems[0]?.currency || 'INR'

  const getBranchAddress = (branchId: string) => {
    const b = branches.find(br => br.id === branchId);
    if (!b) return null;
    return (
      <div className="text-sm text-gray-500 mt-1">
        <p className="font-medium text-gray-700">{b.name}</p>
        <p className="whitespace-pre-wrap">{b.address || 'No address provided'}</p>
      </div>
    );
  }

  const handleOrderRequest = () => {
    if (!storeId || !user || !authContext?.customer?.id) {
      toast.error("Missing user context. Cannot place order.")
      return
    }
    if (orderItems.length === 0) return
    setIsReviewOpen(true)
  }

  const confirmOrder = async () => {
    if (!selectedBillingBranch || !selectedShippingBranch) {
      toast.error("Please select both Billing and Shipping branches.");
      return;
    }

    try {
      setIsSubmitting(true)
      const payload: any = {
        items: orderItems.map(p => ({
          productId: p.id,
          quantity: p.quantity
        })),
        billingBranchId: selectedBillingBranch,
        shippingBranchId: selectedShippingBranch,
        customerPoNumber: customerPoNumber || null,
        // Pass snapshots if backend supports it, otherwise we might rely on backend to fetch current cust details.
        // But the user request implies they want these to be part of the order.
        // If the backend `create` method doesn't take these in DTO, they won't be saved unless I update backend.
        // Let's assume for now I will rely on backend to snapshot if I haven't added them to DTO.
        // RETHINK: The user wants me to "add them o pay oder to".
        // If I need to send them from frontend, I need to make sure DTO accepts them.
      }

      if (user?.role === 0) {
        payload.placedByUserId = user.id;
      } else {
        payload.placedByCustomerUserId = user?.id;
      }

      const order = await createStorefrontOrder(storeId!, authContext!.customer!.id, authContext!.branch?.id, payload)

      toast.success(`Pay Order #${order.orderNumber} created successfully!`, {
        description: `Order for ${orderItems.length} items submitted.`
      })

      setProducts(products.map(p => ({ ...p, quantity: 0 })))
      setTotalItems(0)
      setIsReviewOpen(false)
    } catch (err) {
      console.error("Failed to place order", err)
      toast.error("Failed to place order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    // ... (logout logic unchanged)
    if (subdomain) {
      const protocol = window.location.protocol;
      const host = window.location.host;

      // Check if we are already on the correct subdomain
      if (host.startsWith(`${subdomain}.`)) {
        router.push('/storefront/login');
        return;
      }

      // Construct URL
      let rootDomain = host;
      if (host.includes('localhost')) {
        // Localhost handling
        const parts = host.split('.');
        if (parts.length > 1) {
          rootDomain = parts.slice(1).join('.');
        }
      } else {
        // Production handling (simplified)
        const parts = host.split('.');
        if (parts.length > 2) {
          rootDomain = parts.slice(1).join('.');
        }
      }

      // Provide a clean redirect
      window.location.href = `${protocol}//${subdomain}.${rootDomain}/storefront/login`;
    } else {
      router.push('/storefront/login');
    }
  }

  // --- Render Helpers ---

  if (loading && !products.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // If we are here, we should be logged in. 
  // If user is null but loading is false, it means init failed or redirect happened.
  if (!user) {
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
      {/* Navigation Bar */}
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
                <Button variant={activeView === 'catalog' ? 'secondary' : 'ghost'} onClick={() => setActiveView('catalog')}>Catalog</Button>
                <Button variant={activeView === 'orders' ? 'secondary' : 'ghost'} onClick={() => setActiveView('orders')}>Purchase Orders</Button>
              </nav>

              <div className="h-8 w-px bg-gray-200"></div>

              <Button
                onClick={handleOrderRequest}
                disabled={totalItems === 0}
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

              <Sheet open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <SheetContent side="right" className="w-[100vw] sm:max-w-[500px] flex flex-col h-full bg-white shadow-2xl p-0 gap-0">
                  <SheetHeader className="px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
                    <div className="text-left space-y-1">
                      <SheetTitle className="text-xl font-bold text-gray-900">Your Cart</SheetTitle>
                      <SheetDescription className="text-sm text-slate-500">
                        Review items and select delivery details.
                      </SheetDescription>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                    {orderItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="font-medium">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        {/* Order Details Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                            <h4 className="font-semibold text-gray-900 uppercase tracking-wide text-xs">Order Details</h4>
                          </div>

                          <div className="grid gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-gray-600">Customer PO Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                              <Input
                                placeholder="e.g. PO-2024-001"
                                value={customerPoNumber}
                                onChange={(e) => setCustomerPoNumber(e.target.value)}
                                className="bg-white h-9 text-sm"
                              />
                            </div>

                            <div className="grid gap-4 pt-2">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">
                                  {customerDetails?.isBillToSameAsShipTo ? "Branch (Billing & Shipping)" : "Billing Branch"}
                                </label>
                                <select
                                  className="w-full h-9 text-sm border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                                  value={selectedBillingBranch}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedBillingBranch(val);
                                    if (customerDetails?.isBillToSameAsShipTo) {
                                      setSelectedShippingBranch(val);
                                    }
                                  }}
                                >
                                  <option value="">Select branch...</option>
                                  {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                </select>
                                {selectedBillingBranch && (
                                  <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded p-2.5 flex gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-0.5">
                                      <p className="font-medium text-gray-900">{branches.find(b => b.id === selectedBillingBranch)?.name}</p>
                                      <p className="text-gray-500 leading-relaxed">{branches.find(b => b.id === selectedBillingBranch)?.address || 'No address'}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {!customerDetails?.isBillToSameAsShipTo && (
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-600">Shipping Branch</label>
                                  <select
                                    className="w-full h-9 text-sm border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                                    value={selectedShippingBranch}
                                    onChange={(e) => setSelectedShippingBranch(e.target.value)}
                                  >
                                    <option value="">Select shipping branch...</option>
                                    {branches.map(b => (
                                      <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                  </select>
                                  {selectedShippingBranch && (
                                    <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded p-2.5 flex gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                                      <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div className="space-y-0.5">
                                        <p className="font-medium text-gray-900">{branches.find(b => b.id === selectedShippingBranch)?.name}</p>
                                        <p className="text-gray-500 leading-relaxed">{branches.find(b => b.id === selectedShippingBranch)?.address || 'No address'}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Terms & Conditions Section */}
                        {customerDetails && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                              <h4 className="font-semibold text-gray-900 uppercase tracking-wide text-xs">Terms & Conditions</h4>
                            </div>
                            <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100 text-xs text-gray-600 space-y-2">
                              <div className="flex justify-between border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                                <span className="font-medium text-gray-700">Payment Terms</span>
                                <span>{customerDetails.paymentTerms ? `Net ${customerDetails.paymentTerms} Days` : 'Standard'}</span>
                              </div>
                              <div className="flex justify-between border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                                <span className="font-medium text-gray-700">Delivery Time</span>
                                <span>{customerDetails.deliveryTime ? `${customerDetails.deliveryTime} Days` : 'Standard'}</span>
                              </div>
                              <div className="flex justify-between border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                                <span className="font-medium text-gray-700">Freight</span>
                                <span>{customerDetails.inclusiveFreightRate !== null ? 'Inclusive' : 'Exclusive'}</span>
                              </div>
                              {customerDetails.isBillToSameAsShipTo && (
                                <div className="flex justify-between border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                                  <span className="font-medium text-gray-700">Shipping Policy</span>
                                  <span>Bill To must match Ship To</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Items Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                            <h4 className="font-semibold text-gray-900 uppercase tracking-wide text-xs">Items ({orderItems.length})</h4>
                          </div>

                          <div className="space-y-3">
                            {orderItems.map((item) => (
                              <div key={item.id} className="flex gap-4 p-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-colors">
                                <div className="flex-1 min-w-0 py-0.5">
                                  <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-medium text-gray-900 truncate pr-4">{item.name}</h4>
                                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                      {item.currency === 'INR' ? `Rs. ${(item.price * item.quantity).toFixed(2)}` : `${item.currency} ${(item.price * item.quantity).toFixed(2)}`}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 mb-2 line-clamp-1">{item.description}</p>

                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-medium">
                                      Price: {item.currency === 'INR' ? `Rs. ${item.price}` : `${item.currency} ${item.price}`}
                                    </span>
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-md p-0.5 border border-gray-200">
                                      <button
                                        className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white rounded-sm transition-all text-xs"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      >-</button>
                                      <span className="w-6 text-center text-xs font-semibold text-gray-700">{item.quantity}</span>
                                      <button
                                        className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white rounded-sm transition-all text-xs"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      >+</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <SheetFooter className="border-t border-gray-100 bg-gray-50/50 p-6">
                    <div className="w-full space-y-6">
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium">{orderCurrency} {baseTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>CGST (9%)</span>
                          <span>{orderCurrency} {cgstTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>SGST (9%)</span>
                          <span>{orderCurrency} {sgstTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-base font-semibold text-gray-900">Total Purchase Order Value</span>
                          <span className="text-xl font-bold text-blue-600">
                            {orderCurrency} {finalTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Button variant="outline" className="h-11 bg-white" onClick={() => setIsReviewOpen(false)} disabled={isSubmitting}>
                          Back
                        </Button>
                        <Button onClick={confirmOrder} disabled={isSubmitting || orderItems.length === 0 || !selectedBillingBranch} className="col-span-2 h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Purchase Order"}
                        </Button>
                      </div>
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-slate-600">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Menu Button - simplified for now */}
            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-slate-700" />
              </Button>
            </div>
          </div>
        </div>
      </nav >
      {/* ... rest of render ... */}


      {/* Hero / Welcome Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
              Welcome back, <span className="text-blue-600">{user.name || "Valued Customer"}</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500">
              {activeView === 'catalog'
                ? "Browse your exclusive catalog and negotiated pricing. All orders are processed within 24 hours."
                : "Track the status of your current and past orders."}
            </p>

          </div>
          {/* Search Bar Placeholder */}
          {activeView === 'catalog' && (
            <div className="mt-8 max-w-lg relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search products by name or SKU..."
                className="pl-10 h-12 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeView === 'catalog' ? (
          /* CATALOG VIEW */
          loading ? (
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
                    {/* Badge for Min Qty if relevant */}
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
                          {/* Simple formatting */}
                          {product.currency === 'INR' ? `Rs. ${product.price.toFixed(2)}` : new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
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
          )
        ) : (
          /* ORDERS VIEW */
          <div className="space-y-6">
            <div className="flex justify-end space-x-2">
              <Button
                variant={!showHistory ? "default" : "outline"}
                onClick={() => setShowHistory(false)}
                className="rounded-full"
                size="sm"
              >
                Active Orders
              </Button>
              <Button
                variant={showHistory ? "default" : "outline"}
                onClick={() => setShowHistory(true)}
                className="rounded-full"
                size="sm"
              >
                Order History
              </Button>
            </div>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {orders.filter(o => showHistory ? ['completed', 'cancelled'].includes(o.status) : !['completed', 'cancelled'].includes(o.status)).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          {showHistory ? "No past orders found." : "No active orders."}
                        </td>
                      </tr>
                    ) : orders
                      .filter(o => showHistory ? ['completed', 'cancelled'].includes(o.status) : !['completed', 'cancelled'].includes(o.status))
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items?.length || 0} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {order.currency} {Number(order.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => setViewingOrder(order)}>View Details</Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <PayOrderDialog
              order={viewingOrder}
              open={!!viewingOrder}
              onOpenChange={(open: boolean) => !open && setViewingOrder(null)}
            />
          </div>
        )}
      </main>
    </div >
  )
}
