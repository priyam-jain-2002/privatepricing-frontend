"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, LogOut, Package, Search, Menu, X, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { toast } from "sonner"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { fetchAPI, getUserFromToken, createStorefrontOrder, fetchStorefrontOrders } from "@/lib/api"
import { cn } from "@/lib/utils"
import { OrderInvoiceDialog } from "@/components/order-invoice-dialog"
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

  // Fetch Products
  useEffect(() => {
    if (!storeId || !user || !authContext?.customer?.id || !accessToken) return

    async function fetchProducts() {
      try {
        setLoading(true)
        const data = await fetchAPI(`/storefront/customers/${authContext?.customer?.id}/pricing`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        const mappedProducts = data.map((p: any) => ({
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

    fetchProducts()
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

  // Calculated totals for review
  const orderItems = products.filter(p => p.quantity > 0)
  const orderTotal = orderItems.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  const orderCurrency = orderItems[0]?.currency || 'INR'

  const handleOrderRequest = () => {
    if (!storeId || !user || !authContext?.customer?.id) {
      toast.error("Missing user context. Cannot place order.")
      return
    }
    if (orderItems.length === 0) return
    setIsReviewOpen(true)
  }

  const confirmOrder = async () => {
    try {
      setIsSubmitting(true)
      const payload: any = {
        items: orderItems.map(p => ({
          productId: p.id,
          quantity: p.quantity
        }))
      }

      if (user?.role === 0) {
        payload.placedByUserId = user.id;
      } else {
        payload.placedByCustomerUserId = user?.id;
      }

      const order = await createStorefrontOrder(storeId!, authContext!.customer!.id, authContext!.branch?.id, payload)

      toast.success(`Order #${order.orderNumber} placed successfully!`, {
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
                <Button variant={activeView === 'orders' ? 'secondary' : 'ghost'} onClick={() => setActiveView('orders')}>Orders</Button>
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
                <span className="font-medium">Request Order</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </Button>

              <Sheet open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <SheetContent side="right" className="w-[100vw] sm:max-w-[540px] flex flex-col h-full bg-white shadow-2xl border-l border-gray-100">
                  <SheetHeader className="border-b border-gray-100 pb-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <SheetTitle className="text-xl">Your Cart</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500">
                          Review your items before placing the order.
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    {orderItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                        <p>Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                            <div className="h-16 w-16 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-8 w-8 text-gray-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-gray-900 truncate pr-2">{item.name}</h4>
                                <span className="font-semibold text-gray-900 flex-shrink-0">
                                  {item.currency === 'INR' ? `Rs. ${(item.price * item.quantity).toFixed(2)}` : `${item.currency} ${(item.price * item.quantity).toFixed(2)}`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                                  {item.quantity} x {item.currency === 'INR' ? `Rs. ${item.price}` : `${item.currency} ${item.price}`}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                                  <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <SheetFooter className="mt-auto border-t border-gray-100 pt-6">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-slate-500 font-medium">Subtotal</span>
                        <span className="text-xl font-bold text-slate-900">
                          {orderCurrency === 'INR'
                            ? `Rs. ${orderTotal.toFixed(2)}`
                            : `${orderCurrency} ${orderTotal.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => setIsReviewOpen(false)} disabled={isSubmitting}>
                          Continue Shopping
                        </Button>
                        <Button onClick={confirmOrder} disabled={isSubmitting || orderItems.length === 0} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-lg shadow-blue-200 shadow-lg">
                          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm Order"}
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

            <OrderInvoiceDialog
              order={viewingOrder}
              open={!!viewingOrder}
              onOpenChange={(open) => !open && setViewingOrder(null)}
            />
          </div>
        )}
      </main>
    </div >
  )
}
