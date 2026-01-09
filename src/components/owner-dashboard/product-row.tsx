"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, X, Check, AlertCircle, AlertTriangle } from "lucide-react"
import { updateProductPricing } from "@/lib/api"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProductRowProps {
    product: any
    onUpdate: () => void
    onEditDetails: () => void
    operationCostPercentage: number
}

import { useRouter } from "next/navigation"

export function ProductRow({ product, onEditDetails, operationCostPercentage }: Omit<ProductRowProps, 'onUpdate'>) {
    const router = useRouter()
    const costPrice = product.costPrice

    return (
        <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 group">
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]" title={product.name}>{product.name}</span>
                    {product.category === 0 && (
                        <div
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${product.id}`); }}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] border border-red-100 font-medium hover:bg-red-100"
                        >
                            Incomplete
                        </div>
                    )}
                    {product.category === 1 && (
                        <div
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${product.id}`); }}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] border border-yellow-100 font-medium hover:bg-yellow-100"
                        >
                            Unpublishable
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-col">
                    <span>{product.sku || "-"}</span>
                    <span className="text-[10px] text-gray-400">HSN: {product.hsnCode || "-"}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {product.currency || 'INR'} {product.basePrice || 0}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {product.baseFreight || 0}%
            </td>
            <td className="px-6 py-4 text-sm text-gray-600 font-medium" title={`Formula: Base Price * (1 + (${product.baseFreight || 0}% + ${operationCostPercentage}%)/100)`}>
                {product.currency || 'INR'} {costPrice}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {product.gst || 0}%
            </td>
            <td className="px-6 py-4 text-sm text-right">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/products/${product.id}`)} className="h-8 w-8 hover:bg-gray-100">
                    <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                </Button>
            </td>
        </tr>
    )
}
