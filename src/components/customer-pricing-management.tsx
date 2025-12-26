"use client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { fetchProducts, getCustomerPricings, createCustomerPricing, updateCustomerPricing } from "@/lib/api"
import { Loader2, Save, Check } from "lucide-react"

interface CustomerPricingManagementProps {
  storeId: string;
  customerId: string;
}

export function CustomerPricingManagement({ storeId, customerId }: CustomerPricingManagementProps) {
  const [products, setProducts] = useState<any[]>([])
  const [pricingMap, setPricingMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [storeId, customerId])

  async function loadData() {
    setLoading(true)
    try {
      const [productsData, pricingData] = await Promise.all([
        fetchProducts(),
        getCustomerPricings(storeId, customerId)
      ])
      setProducts(productsData)

      const pMap: Record<string, any> = {}
      pricingData.forEach((p: any) => {
        pMap[p.productId] = p
      })
      setPricingMap(pMap)
    } catch (error) {
      console.error("Failed to load pricing data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (productId: string, updates: any) => {
    setSavingId(productId)
    try {
      const existingPricing = pricingMap[productId]

      if (existingPricing) {
        // Update
        const updated = await updateCustomerPricing(storeId, customerId, productId, updates)
        setPricingMap(prev => ({ ...prev, [productId]: updated }))
      } else {
        // Create
        const created = await createCustomerPricing(storeId, {
          storeId,
          customerId,
          productId,
          ...updates
        })
        setPricingMap(prev => ({ ...prev, [productId]: created }))
      }
    } catch (err) {
      console.error("Failed to save pricing", err)
      toast.error("Failed to save change")
    } finally {
      setTimeout(() => setSavingId(null), 1000)
    }
  }

  const getPricingValue = (productId: string, field: string, defaultValue: any) => {
    return pricingMap[productId]?.[field] ?? defaultValue
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Manage Customer Pricing</h2>
        <Button onClick={loadData} variant="outline" size="sm">Refresh</Button>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Base Price (Global)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Strategy</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Value / Result</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Visible</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <PricingRow
                  key={product.id}
                  product={product}
                  initialPricing={pricingMap[product.id]}
                  onSave={(updates) => handleUpdate(product.id, updates)}
                  savingId={savingId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800">
        <p><strong>Note:</strong> Changes are only applied when you click the "Save" button.</p>
      </div>
    </div>
  )
}

function PricingRow({ product, initialPricing, onSave, savingId }: { product: any, initialPricing: any, onSave: (u: any) => void, savingId: string | null }) {
  const [pricingType, setPricingType] = useState(initialPricing?.pricingType || 'fixed')
  const [priceOverride, setPriceOverride] = useState(initialPricing?.priceOverride ?? '')
  const [profitMarginPercent, setProfitMarginPercent] = useState(initialPricing?.profitMarginPercent ?? '')
  const [visible, setVisible] = useState(initialPricing?.visible ?? true)
  const [isDirty, setIsDirty] = useState(false)

  // Sync state when initialPricing changes (e.g. after save)
  useEffect(() => {
    setPricingType(initialPricing?.pricingType || 'fixed')
    setPriceOverride(initialPricing?.priceOverride ?? '')
    setProfitMarginPercent(initialPricing?.profitMarginPercent ?? '')
    setVisible(initialPricing?.visible ?? true)
    setIsDirty(false)
  }, [initialPricing])

  const handleSave = () => {
    const updates: any = {
      pricingType,
      visible
    }
    if (pricingType === 'fixed') {
      updates.priceOverride = priceOverride === '' ? null : parseFloat(priceOverride)
      updates.profitMarginPercent = null
    } else {
      updates.profitMarginPercent = profitMarginPercent === '' ? null : parseFloat(profitMarginPercent)
      updates.priceOverride = null
    }
    onSave(updates)
  }

  const handleChange = (setter: any, value: any) => {
    setter(value)
    setIsDirty(true)
  }

  const isSaving = savingId === product.id

  return (
    <tr className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${!visible ? 'opacity-60 bg-gray-50' : ''}`}>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{product.name}</div>
        <div className="text-xs text-gray-500">{product.sku}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        ₹ {product.basePrice}
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
                onChange={(e) => handleChange(setProfitMarginPercent, e.target.value)}
              />
              <span className="text-xs text-gray-500">%</span>
              <span className="text-gray-400 text-xs ml-2">→</span>
              <span className="text-sm font-medium text-gray-900 ml-1">
                ₹ {(product.basePrice * (1 + (parseFloat(profitMarginPercent) || 0) / 100)).toFixed(2)}
              </span>
            </>
          ) : (
            <>
              <span className="text-gray-400 text-xs">₹</span>
              <Input
                type="number"
                className="h-8 w-24 text-right"
                placeholder={product.basePrice.toString()}
                value={priceOverride}
                onChange={(e) => handleChange(setPriceOverride, e.target.value)}
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
