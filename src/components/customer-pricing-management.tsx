"use client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { fetchProducts, getCustomerPricings, createCustomerPricing, updateCustomerPricing } from "@/lib/api"
import { Loader2, Save, Check, Plus, Search } from "lucide-react"

interface CustomerPricingManagementProps {
  storeId: string;
  customerId: string;
}

export function CustomerPricingManagement({ storeId, customerId }: CustomerPricingManagementProps) {
  // Main List State
  const [customerPricings, setCustomerPricings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Add Product State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    loadCustomerData()
  }, [storeId, customerId])

  // Load ONLY customer-specific pricing records (assigned products)
  async function loadCustomerData() {
    setLoading(true)
    try {
      const pricingData = await getCustomerPricings(storeId, customerId)
      // Sort: Most recently added first
      pricingData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setCustomerPricings(pricingData)
    } catch (error) {
      console.error("Failed to load customer pricing", error)
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

  const handleAddProduct = async (product: any) => {
    setAddingId(product.id)
    try {
      // Create a default pricing record to "Assign" the product
      const newPricing = await createCustomerPricing(storeId, {
        storeId,
        customerId,
        productId: product.id,
        sellingPrice: null, // Default: no override
        profitMarginPercent: null
      })

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

      setCustomerPricings(prev => prev.map(p =>
        p.productId === productId ? updated : p
      ))
      toast.success("Pricing updated")
    } catch (err) {
      console.error("Failed to save pricing", err)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Assigned Products</h2>
        <div className="flex gap-2">
          <Button onClick={loadCustomerData} variant="outline" size="sm">Refresh</Button>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cost Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Strategy</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Selling Price</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Visible</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customerPricings.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No products assigned. Click "Add Product" to start.</td></tr>
              ) : customerPricings.map((pricing) => (
                <PricingRow
                  key={pricing.id}
                  product={pricing.product} // Backend includes the relation
                  initialPricing={pricing}
                  onSave={(updates) => handleUpdate(pricing.id, pricing.productId, updates)}
                  savingId={savingId}
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
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-right">Base Price</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAvailable.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                      <td className="px-4 py-3 text-right">₹ {product.basePrice}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAddProduct(product)}
                          disabled={addingId === product.id}
                        >
                          {addingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                        </Button>
                      </td>
                    </tr>
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

function PricingRow({ product, initialPricing, onSave, savingId }: { product: any, initialPricing: any, onSave: (u: any) => void, savingId: string | null }) {
  if (!product) return null // Safety check

  const [pricingType, setPricingType] = useState(initialPricing?.pricingType || 'fixed')
  const [sellingPrice, setSellingPrice] = useState(initialPricing?.sellingPrice ?? '')
  const [profitMarginPercent, setProfitMarginPercent] = useState(initialPricing?.profitMarginPercent ?? '')
  const [visible, setVisible] = useState(initialPricing?.visible ?? true)
  const [isDirty, setIsDirty] = useState(false)

  // Sync state when initialPricing changes (e.g. after save)
  // Sync state when initialPricing changes (e.g. after save)
  useEffect(() => {
    setPricingType(initialPricing?.pricingType || 'fixed')
    setProfitMarginPercent(initialPricing?.profitMarginPercent ?? '')
    setVisible(initialPricing?.visible ?? true)
    setIsDirty(false)

    // Handle sellingPrice: Use stored value if available, otherwise calculate from margin (legacy support)
    if (initialPricing?.sellingPrice) {
      setSellingPrice(initialPricing.sellingPrice)
    } else if (initialPricing?.pricingType === 'profit_margin' && initialPricing?.profitMarginPercent) {
      // Fallback for legacy records: calculate dynamically for display
      const cost = parseFloat(product.costPrice) || 0;
      const margin = parseFloat(initialPricing.profitMarginPercent);
      if (!isNaN(cost) && !isNaN(margin)) {
        setSellingPrice((cost * (1 + margin / 100)).toFixed(2))
      } else {
        setSellingPrice('')
      }
    } else {
      setSellingPrice('')
    }
  }, [initialPricing, product.costPrice])

  const handleSave = () => {
    const updates: any = {
      pricingType,
      visible
    }
    if (pricingType === 'fixed') {
      updates.sellingPrice = sellingPrice === '' ? null : parseFloat(sellingPrice)
      updates.profitMarginPercent = null
    } else {
      const margin = profitMarginPercent === '' ? null : parseFloat(profitMarginPercent);
      updates.profitMarginPercent = margin;
      // We send the sellingPrice that is currently in state (calculated or loaded)
      updates.sellingPrice = sellingPrice === '' ? null : parseFloat(sellingPrice)
    }
    onSave(updates)
  }

  const handleChange = (setter: any, value: any) => {
    setter(value)
    setIsDirty(true)
  }

  const handleMarginChange = (value: string) => {
    setProfitMarginPercent(value);
    setIsDirty(true);
    if (value === '' || isNaN(parseFloat(value))) {
      // If clearing margin, keep price? Or clear? 
      // Let's keep price or maybe revert to default? 
      // Better to perhaps do nothing to price or clear it? 
      // If logic is "Margin drives Price", then no margin = no calculated price.
      // But we want to preserve "Stored Price". 
      // Let's leaves sellingPrice as is if invalid, OR recalculate if valid.
      return;
    }
    const margin = parseFloat(value);
    const cost = parseFloat(product.costPrice) || 0;
    const newPrice = (cost * (1 + margin / 100)).toFixed(2);
    setSellingPrice(newPrice);
  }

  const isSaving = savingId === product.id

  return (
    <tr className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${!visible ? 'opacity-60 bg-gray-50' : ''}`}>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{product.name}</div>
        <div className="text-xs text-gray-500">{product.sku}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        ₹ {product.costPrice || 0}
      </td>
      <td className="px-6 py-4 text-sm">
        <select
          className="text-xs border rounded p-1 w-32"
          value={pricingType}
          onChange={(e) => handleChange(setPricingType, e.target.value)}
        >
          <option value="fixed">Fixed Override</option>
          <option value="profit_margin">Profit Margin %</option>
        </select>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {pricingType === 'profit_margin' ? (
            <>
              <Input
                type="number"
                className="h-8 w-20 text-xs"
                placeholder="%"
                value={profitMarginPercent}
                onChange={(e) => handleMarginChange(e.target.value)}
              />
              <span className="text-xs text-gray-500">%</span>
              <span className="text-gray-400 text-xs ml-2">→</span>
              <span className="text-sm font-medium text-gray-900 ml-1">
                ₹ {sellingPrice}
              </span>
            </>
          ) : (
            <>
              <span className="text-gray-400 text-xs">₹</span>
              <Input
                type="number"
                className="h-8 w-24 text-right"
                placeholder={(product.costPrice || 0).toString()}
                value={sellingPrice}
                onChange={(e) => handleChange(setSellingPrice, e.target.value)}
              />
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => handleChange(setVisible, !visible)}
          className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${visible ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${visible ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </td>
      <td className="px-6 py-4 text-right min-w-[100px]">
        {isSaving ? (
          <Button disabled size="sm" variant="ghost" className="text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving
          </Button>
        ) : isDirty ? (
          <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs">
            <Save className="h-3 w-3 mr-1" /> Save
          </Button>
        ) : initialPricing ? (
          <span className="text-xs text-green-600 flex items-center justify-end gap-1 px-3 py-2">
            <Check className="h-3 w-3" /> Saved
          </span>
        ) : (
          <span className="text-xs text-gray-400 px-3 py-2">No changes</span>
        )}
      </td>
    </tr>
  )
}
