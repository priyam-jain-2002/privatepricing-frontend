"use client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { fetchProducts, getCustomerPricings, getCustomerPricingsView, createCustomerPricing, updateCustomerPricing, fetchCustomer } from "@/lib/api"
import { analytics } from "@/lib/analytics"
import { logger } from "@/lib/logger"
import { Loader2, Save, Check, Plus, Search, Calendar as CalendarIcon } from "lucide-react"
import { SmartDatePicker } from "@/components/ui/smart-date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ExpiryIndicator } from "./expiry-indicator"

interface CustomerPricingManagementProps {
  storeId: string;
  customerId: string;
  customer?: any;
}

export function CustomerPricingManagement({ storeId, customerId, customer }: CustomerPricingManagementProps) {
  // Main List State
  const [customerPricings, setCustomerPricings] = useState<any[]>([])
  const [currentCustomer, setCurrentCustomer] = useState<any>(customer || null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

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


function PricingRow({ product, initialPricing, onSave, savingId, freightRate, userRole }: { product: any, initialPricing: any, onSave: (u: any) => void, savingId: string | null, freightRate?: number, userRole: string | null }) {
  if (!product) return null // Safety check

  const [pricingType, setPricingType] = useState(initialPricing?.pricingType || 'fixed')
  // ... (keep state)
  const [sellingPrice, setSellingPrice] = useState(initialPricing?.sellingPrice ?? '')
  const [profitMarginPercent, setProfitMarginPercent] = useState(initialPricing?.profitMarginPercent ?? '')
  const [visible, setVisible] = useState(initialPricing?.visible ?? true)
  const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(initialPricing?.effectiveTo ? new Date(initialPricing.effectiveTo) : undefined)
  const [isDirty, setIsDirty] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ... (keep useEffect)
  useEffect(() => {
    setPricingType(initialPricing?.pricingType || 'fixed')
    setProfitMarginPercent(initialPricing?.profitMarginPercent ?? '')
    setVisible(initialPricing?.visible ?? true)
    setEffectiveTo(initialPricing?.effectiveTo ? new Date(initialPricing.effectiveTo) : undefined)
    setIsDirty(false)

    // Handle sellingPrice: Use stored value if available, otherwise calculate from margin (legacy support)
    if (initialPricing?.sellingPrice) {
      setSellingPrice(initialPricing.sellingPrice)
    } else if (initialPricing?.pricingType === 'profit_margin' && initialPricing?.profitMarginPercent) {
      // Fallback: calculate dynamically for display
      const baseCost = parseFloat(product.costPrice) || 0;
      const effectiveCost = !!freightRate ? baseCost * (1 + freightRate / 100) : baseCost;
      const margin = parseFloat(initialPricing.profitMarginPercent);
      if (!isNaN(effectiveCost) && !isNaN(margin)) {
        const price = effectiveCost * (1 + margin / 100);
        setSellingPrice(price.toFixed(2))
      } else {
        setSellingPrice('')
      }
    } else {
      setSellingPrice('')
    }
  }, [initialPricing, product.costPrice, freightRate])

  // ... (keep logic)
  const handleSaveAttempt = () => {
    if (initialPricing?.effectiveTo) {
      const validUntil = new Date(initialPricing.effectiveTo);
      const now = new Date();
      if (validUntil > now) {
        setShowConfirm(true);
        return;
      }
    }
    proceedWithSave();
  }

  const proceedWithSave = () => {
    setShowConfirm(false);
    const updates: any = {
      pricingType,
      visible,
      effectiveTo: effectiveTo ? effectiveTo.toISOString() : null
    }
    if (pricingType === 'fixed') {
      updates.sellingPrice = sellingPrice === '' ? null : parseFloat(sellingPrice)
      updates.profitMarginPercent = null
    } else {
      const margin = profitMarginPercent === '' ? null : parseFloat(profitMarginPercent);
      updates.profitMarginPercent = margin;
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
      return;
    }
    const margin = parseFloat(value);
    const baseCost = parseFloat(product.costPrice) || 0;
    const effectiveCost = !!freightRate ? baseCost * (1 + freightRate / 100) : baseCost;
    const newPrice = effectiveCost * (1 + margin / 100);
    setSellingPrice(newPrice.toFixed(2));
  }

  const isSaving = savingId === product.id

  return (
    <tr className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${!visible ? 'opacity-60 bg-gray-50' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <ExpiryIndicator
            expiryStatus={initialPricing.expiryStatus}
            earliestExpiryDate={initialPricing.expiryDate || initialPricing.effectiveTo}
            type="product"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-500">{product.sku}</div>
          </div>
        </div>
      </td>
      {userRole !== '5' && (
        <>
          <td className="px-6 py-4 text-sm text-gray-600">
            <div className="flex flex-col">
              <span>₹ {(!!freightRate ? (parseFloat(product.costPrice || 0) * (1 + freightRate / 100)).toFixed(2) : (product.costPrice || 0))}</span>
              {!!freightRate && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  (incl. {freightRate}% Delivery)
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 text-sm">
            <Select
              value={pricingType}
              onValueChange={(value) => handleChange(setPricingType, value)}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Override</SelectItem>
                <SelectItem value="profit_margin">Profit Margin %</SelectItem>
              </SelectContent>
            </Select>
          </td>
        </>
      )}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {pricingType === 'profit_margin' ? (
            <>
              {userRole !== '5' && (
                <>
                  <Input
                    type="number"
                    className="h-8 w-16 text-xs text-right"
                    placeholder="%"
                    value={profitMarginPercent}
                    onChange={(e) => handleMarginChange(e.target.value)}
                  />
                  <span className="text-xs text-gray-500">%</span>
                  <span className="text-gray-400 text-xs mx-1">→</span>
                </>
              )}
              <div className="flex flex-col items-end leading-none">
                <span className="text-sm font-medium text-gray-900">
                  ₹ {sellingPrice}
                </span>

              </div>
            </>
          ) : (
            <>
              {userRole !== '5' ? (
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
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  ₹ {sellingPrice}
                </span>
              )}
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <SmartDatePicker
          date={effectiveTo}
          onDateChange={value => handleChange(setEffectiveTo, value)}
          disabled={userRole === '5' || (effectiveTo !== undefined && effectiveTo < new Date("1900-01-01"))}
        />
      </td>
      {userRole !== '5' && (
        <>
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
              <>
                <Button onClick={handleSaveAttempt} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs">
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Active Price?</DialogTitle>
                      <DialogDescription>
                        This pricing is valid until <strong>{initialPricing?.effectiveTo ? new Date(initialPricing.effectiveTo).toLocaleDateString() : ''}</strong>.
                        Changing it now might affect agreements. Are you sure?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                      <Button onClick={proceedWithSave}>Confirm Update</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : initialPricing ? (
              <span className="text-xs text-green-600 flex items-center justify-end gap-1 px-3 py-2">
                <Check className="h-3 w-3" /> Saved
              </span>
            ) : (
              <span className="text-xs text-gray-400 px-3 py-2">No changes</span>
            )}
          </td>
        </>
      )}
    </tr>
  )
}

function AddProductRow({ product, onAssign, isAdding }: { product: any, onAssign: (price: number | null, date: Date | undefined) => void, isAdding: boolean }) {
  const [overridePrice, setOverridePrice] = useState<string>('')
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined)

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{product.name}</div>
        <div className="text-xs text-gray-500">{product.sku}</div>
      </td>
      <td className="px-4 py-3 text-right text-sm text-gray-600">
        ₹ {product.basePrice}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-gray-400 text-xs">₹</span>
          <Input
            type="number"
            placeholder="Default"
            className="h-8 w-24 text-right text-xs"
            value={overridePrice}
            onChange={(e) => setOverridePrice(e.target.value)}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <SmartDatePicker
          date={validUntil}
          onDateChange={setValidUntil}
          disabled={false} // Adjust disabled logic if needed
          placeholder="Pick a date"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          onClick={() => onAssign(overridePrice ? parseFloat(overridePrice) : null, validUntil)}
          disabled={isAdding}
          className="h-8 text-xs"
        >
          {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
        </Button>
      </td>
    </tr>
  )
}

