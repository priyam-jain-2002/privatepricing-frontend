"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"

const mockPricingData = [
  {
    id: 1,
    product: "Premium Widget A",
    basePrice: 50.0,
    mode: "Fixed",
    finalPrice: 49.99,
    visible: true,
  },
  {
    id: 2,
    product: "Standard Widget B",
    basePrice: 30.0,
    mode: "Discount",
    finalPrice: 29.99,
    visible: true,
  },
  {
    id: 3,
    product: "Bulk Supply Pack",
    basePrice: 210.0,
    mode: "Fixed",
    finalPrice: 199.0,
    visible: true,
  },
  {
    id: 4,
    product: "Service Consultation",
    basePrice: 200.0,
    mode: "Discount",
    finalPrice: 150.0,
    visible: false,
  },
]

export function CustomerPricingManagement() {
  const [items, setItems] = useState(mockPricingData)
  const [savedFeedback, setSavedFeedback] = useState<number | null>(null)

  const updateItem = (id: number, updates: Partial<(typeof items)[0]>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    setSavedFeedback(id)
    setTimeout(() => setSavedFeedback(null), 2000)
  }

  const toggleVisibility = (id: number) => {
    updateItem(id, { visible: !items.find((i) => i.id === id)?.visible })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Acme Corp</h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  Active
                </span>
              </div>
            </div>
            <Button className="bg-blue-600 px-6 py-2 hover:bg-blue-700">Open Customer Storefront</Button>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="mx-auto max-w-6xl px-8 py-12">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Product Pricing</h2>
        <Card className="border border-gray-200 bg-white shadow-none">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Base Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Final Price</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Visible</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">${item.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={item.mode}
                        onChange={(e) => updateItem(item.id, { mode: e.target.value })}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      >
                        <option>Fixed</option>
                        <option>Discount</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${item.finalPrice.toFixed(2)}
                      {savedFeedback === item.id && <span className="ml-2 text-xs text-green-600">Saved</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleVisibility(item.id)}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          item.visible ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            item.visible ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Empty State Message */}
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-12">
          <p className="text-sm text-gray-500">
            Changes are saved automatically. Toggle visibility to control what appears on the customer storefront.
          </p>
        </div>
      </div>
    </div>
  )
}
