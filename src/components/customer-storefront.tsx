"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"



export function CustomerStorefront() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch initial data
  useEffect(() => {
    async function init() {
      try {
        // 1. Fetch available stores
        const stores = await fetchAPI('/stores')
        if (!stores || stores.length === 0) {
          setError("No stores found. Please create a store first.")
          setIsLoading(false)
          return
        }

        // Use the first store for now
        const currentStoreId = stores[0].id
        setStoreId(currentStoreId)
        setStoreName(stores[0].name)

        // 2. Fetch products for this store
        const productsData = await fetchAPI(`/stores/${currentStoreId}/products`)

        // Map backend product data to frontend format
        // Backend: { id, name, basePrice, ... }
        // Frontend expects: { id, name, unit, price, quantity }
        const formattedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          unit: "Per Unit", // Default unit for now as backend doesn't have it yet
          price: p.basePrice ? Number(p.basePrice) : 0,
          quantity: 0
        }))

        setProducts(formattedProducts)
      } catch (err: any) {
        console.error("Failed to fetch data:", err)
        setError(err.message || "Failed to load store data")
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const updateQuantity = (id: string, quantity: number) => {
    const updated = products.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, quantity) } : p))
    setProducts(updated)
    setTotalItems(updated.reduce((sum, p) => sum + p.quantity, 0))
  }

  const handleRequestOrder = () => {
    const items = products.filter((p) => p.quantity > 0)
    if (items.length === 0) {
      alert("Please select at least one item")
      return
    }
    // Handle order request
    alert(`Order request submitted for ${items.length} items.`)
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading store...</div>
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{storeName}</h1>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-600">
              Contact Store
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-center text-gray-500">No products available in this store.</p>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="border border-gray-200 bg-white p-6 shadow-none">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{product.unit}</p>
                  </div>
                  <div className="ml-8 flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="text-2xl font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex w-28 items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                      <button
                        onClick={() => updateQuantity(product.id, product.quantity - 1)}
                        className="text-lg text-gray-600 hover:text-gray-900"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium text-gray-900">{product.quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, product.quantity + 1)}
                        className="text-lg text-gray-600 hover:text-gray-900"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary and CTA */}
        <div className="mt-12 space-y-4">
          <div className="flex justify-end gap-4 border-t border-gray-200 pt-8">
            <div className="text-right">
              <p className="text-sm text-gray-500">Items Selected</p>
              <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
            </div>
            <Button
              onClick={handleRequestOrder}
              disabled={totalItems === 0}
              className="bg-blue-600 px-8 py-6 text-base font-medium hover:bg-blue-700"
            >
              Request Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
