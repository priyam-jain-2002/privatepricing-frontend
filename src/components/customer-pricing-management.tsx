"use client"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { fetchProducts, getCustomerPricings, getCustomerPricingsView, createCustomerPricing, updateCustomerPricing, fetchCustomer } from "@/lib/api"
import { analytics } from "@/lib/analytics"
import { logger } from "@/lib/logger"
import { Loader2, Save, Check, Plus, Search, Calendar as CalendarIcon } from "lucide-react"
import { PricingRow } from "./customer-pricing/pricing-row"
import { AddProductRow } from "./customer-pricing/add-product-row"
interface CustomerPricingManagementProps {
  storeId: string;
  customerId: string;
  customer?: any;
  operationCostPercentage?: number;
}

export function CustomerPricingManagement({ storeId, customerId, customer, operationCostPercentage = 0 }: CustomerPricingManagementProps) {
  // Main List State
  const [customerPricings, setCustomerPricings] = useState<any[]>([])
  const [currentCustomer, setCurrentCustomer] = useState<any>(customer || null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  // Add Product State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [addingId, setAddingId] = useState<string | null>(null)

  const [listSearchQuery, setListSearchQuery] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setUserRole(localStorage.getItem('user_role'))
    loadCustomerData()
    analytics.capture('customer_pricing_viewed', {
      customerId,
      storeId
    })
  }, [storeId, customerId])

  // Load ONLY customer-specific pricing records (assigned products)
  async function loadCustomerData() {
    setLoading(true)
    const role = localStorage.getItem('user_role');
    console.log("Loading pricing for role:", role); // Debug log

    try {
      const pricingPromise = role === '5'
        ? getCustomerPricingsView(storeId, customerId)
        : getCustomerPricings(storeId, customerId);

      const [pricingData, fetchedCustomer] = await Promise.all([
        pricingPromise,
        !currentCustomer ? fetchCustomer(customerId) : Promise.resolve(null)
      ]);

      if (fetchedCustomer) {
        setCurrentCustomer(fetchedCustomer);
      }

      setCustomerPricings(pricingData)
    } catch (error) {
      logger.error("Failed to load customer pricing", (error as any).stack, { error })
    } finally {
      setLoading(false)
    }
  }

  // Load ALL store products for the "Add Product" dialog
  async function openAddDialog() {
    setIsAddOpen(true)
    try {
      // Fetch all products
      const allProducts = await fetchProducts()

      // Filter out products that are already assigned
      const assignedProductIds = new Set(customerPricings.map(p => p.productId))
      const available = allProducts.filter((p: any) => !assignedProductIds.has(p.id))

      setAvailableProducts(available)
    } catch (error) {
      toast.error("Failed to load available products")
    }
  }

  const handleAddProduct = async (product: any, price: number | null, validUntil: Date | undefined) => {
    setAddingId(product.id)
    try {
      // Create pricing with specific values if provided
      const newPricing = await createCustomerPricing(storeId, customerId, {
        storeId,
        customerId,
        productId: product.id,
        sellingPrice: price,
        profitMarginPercent: null,
        effectiveTo: validUntil ? validUntil.toISOString() : undefined
      })

      if (validUntil) {
        analytics.capture('pricing_validity_updated', {
          productId: product.id,
          customerId,
          newDate: validUntil.toISOString()
        })
      }

      // Add to list and remove from available
      setCustomerPricings(prev => [newPricing, ...prev])
      setAvailableProducts(prev => prev.filter(p => p.id !== product.id))
      toast.success(`${product.name} assigned to customer`)
    } catch (err: any) {
      toast.error("Failed to assign product")
    } finally {
      setAddingId(null)
    }
  }

  const handleUpdate = async (pricingId: string, productId: string, updates: any) => {
    setSavingId(productId)
    try {
      const updated = await updateCustomerPricing(storeId, customerId, productId, updates)

      if (updates.effectiveTo) {
        analytics.capture('pricing_validity_updated', {
          productId,
          customerId,
          newDate: updates.effectiveTo
        })
      }

      setCustomerPricings(prev => prev.map(p =>
        p.productId === productId ? updated : p
      ))
      toast.success("Pricing updated")
    } catch (err) {
      logger.error("Failed to save pricing", (err as any).stack, { err })
      toast.error("Failed to save change")
    } finally {
      setTimeout(() => setSavingId(null), 1000)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const filteredAvailable = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPricing = customerPricings.filter(p =>
    p.product?.name.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
    p.product?.sku.toLowerCase().includes(listSearchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Assigned Products</h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search assigned products..."
              className="pl-9 bg-white"
              value={listSearchQuery}
              onChange={(e) => setListSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={loadCustomerData} variant="outline" size="icon">
            <Loader2 className="h-4 w-4" />
          </Button>
          {userRole !== '5' && (
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                {userRole !== '5' && (
                  <>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cost Price (incl. Freight %)</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Strategy</th>
                  </>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Selling Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valid Until</th>
                {userRole !== '5' && (
                  <>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Visible</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPricing.length === 0 ? (
                <tr><td colSpan={userRole === '5' ? 3 : 7} className="px-6 py-12 text-center text-gray-500">No products match your search.</td></tr>
              ) : filteredPricing.map((pricing) => (
                <PricingRow
                  key={pricing.id}
                  product={pricing.product} // Backend includes the relation
                  initialPricing={pricing}
                  onSave={(updates) => handleUpdate(pricing.id, pricing.productId, updates)}
                  savingId={savingId}
                  freightRate={currentCustomer?.inclusiveFreightRate ? parseFloat(currentCustomer.inclusiveFreightRate) : 0}
                  returnUrl={pathname}
                  userRole={userRole}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800">
        <p><strong>Note:</strong> Only products listed here are visible to the customer (unless "Visible" is unchecked).</p>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Product to Customer</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search available products..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto flex-1 border rounded-md">
            {filteredAvailable.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No available products found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Base Price</th>
                    <th className="px-4 py-3 text-right w-[140px]">Override Price</th>
                    <th className="px-4 py-3 text-left w-[180px]">Valid Until</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAvailable.map(product => (
                    <AddProductRow
                      key={product.id}
                      product={product}
                      onAssign={(price, date) => handleAddProduct(product, price, date)}
                      isAdding={addingId === product.id}
                      returnUrl={pathname}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}




