"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, X, Check } from "lucide-react"
import { updateProductPricing } from "@/lib/api"
import { toast } from "sonner"

interface ProductRowProps {
    product: any
    onUpdate: () => void
    onEditDetails: () => void
    operationCostPercentage: number
}

export function ProductRow({ product, onUpdate, onEditDetails, operationCostPercentage }: ProductRowProps) {
    const [basePrice, setBasePrice] = useState(product.basePrice || '')
    const [baseFreight, setBaseFreight] = useState(product.baseFreight || '')
    const [gst, setGst] = useState(product.gst || '')
    const [hsnCode, setHsnCode] = useState(product.hsnCode || '')
    const [isEditing, setIsEditing] = useState(false)

    const handleSave = async () => {
        try {
            const basePriceNum = parseFloat(basePrice || '0')
            const baseFreightNum = parseFloat(baseFreight || '0')
            const totalPercentage = baseFreightNum + operationCostPercentage
            const calculatedCostPrice = basePriceNum * (1 + totalPercentage / 100)

            await updateProductPricing(product.id, {
                basePrice: basePriceNum,
                baseFreight: baseFreightNum,
                costPrice: parseFloat(calculatedCostPrice.toFixed(2)),
                gst: parseFloat(gst || '0'),
            })
            setIsEditing(false)
            onUpdate()
            toast.success("Pricing updated successfully")
        } catch (err: any) {
            toast.error("Failed to update pricing: " + err.message)
        }
    }

    return (
        <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                    {product.name}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={onEditDetails}>
                        <Edit2 className="h-3 w-3" />
                    </Button>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-col">
                    <span>SKU: {product.sku || "-"}</span>
                    <span className="text-[10px] text-gray-400">HSN: {product.hsnCode || "-"}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {isEditing ? (
                    <Input
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="h-8 w-24 px-2"
                    />
                ) : (
                    <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
                        {product.currency || 'INR'} {product.basePrice || 0}
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            value={baseFreight}
                            onChange={(e) => setBaseFreight(e.target.value)}
                            className="h-8 w-16 px-2"
                        />
                        <span className="text-xs">%</span>
                    </div>
                ) : (
                    <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
                        {product.baseFreight || 0}%
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600 font-medium" title={`Formula: Base Price * (1 + (${baseFreight || 0}% + ${operationCostPercentage}%)/100)`}>
                {product.currency || 'INR'} {(parseFloat(basePrice || '0') * (1 + (parseFloat(baseFreight || '0') + operationCostPercentage) / 100)).toFixed(2)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {isEditing ? (
                    <Input
                        type="number"
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        className="h-8 w-16 px-2"
                    />
                ) : (
                    <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
                        {product.gst || 0}%
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-right">
                {isEditing ? (
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                        <Button size="sm" onClick={handleSave}><Check className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
            </td>
        </tr>
    )
}
