"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, LogOut, Package, Search, Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { fetchAPI, getUserFromToken } from "@/lib/api"
import { cn } from "@/lib/utils"

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

  // Auth State
  const [user, setUser] = useState<User | null>(null)
  const [authContext, setAuthContext] = useState<AuthContext | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Initialization: Check Session & Fetch Store Info (optional if we have storeId from session)
  useEffect(() => {

    async function init() {
      // 1. Check Session & Decode Token
      const token = sessionStorage.getItem('access_token')
      const decodedUser = getUserFromToken()

      if (!token || !decodedUser) {
        router.push('/')
        return
      }

      setAccessToken(token)

      const { storeId: tokStoreId, id: userId, role: userRole, email, customerId, branchId } = decodedUser;

      if (tokStoreId) setStoreId(tokStoreId)

      if (userId && userRole !== undefined) {
        setUser({
          id: userId,
          email: email || '',
          role: Number(userRole),
          name: decodedUser.name // Assuming name is in token or we might miss it if not added to payload
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
          const stores = await fetchAPI('/stores', {
            headers: { Authorization: `Bearer ${token}` }
          })
          const currentStore = stores.find((s: any) => s.id === tokStoreId)
          if (currentStore) {
            setStoreName(currentStore.name)
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
          currency: p.currency,
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

  const handleOrder = () => {
    const orderItems = products.filter(p => p.quantity > 0)
    console.log("Order placed:", orderItems)
    alert(`Order request placed for ${orderItems.length} items! (Demo)`)
    setProducts(products.map(p => ({ ...p, quantity: 0 })))
  }

  const handleLogout = () => {
    sessionStorage.clear()
    router.push('/')
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
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                {storeName.charAt(0)}
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">{storeName}</span>
            </div>

            {/* Desktop Nav Actions */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-slate-800">{user.name || user.email || 'User'}</span>
                {authContext?.customer?.name && (
                  <span className="text-xs text-slate-500">{authContext.customer.name}</span>
                )}
              </div>

              <div className="h-8 w-px bg-gray-200"></div>

              <Button
                onClick={handleOrder}
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
      </nav>

      {/* Hero / Welcome Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
              Welcome back, <span className="text-blue-600">{user.name || "Valued Customer"}</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500">
              Browse your exclusive catalog and negotiated pricing. All orders are processed within 24 hours.
            </p>
          </div>
          {/* Search Bar Placeholder */}
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
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
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
      </main>
    </div>
  )
}
