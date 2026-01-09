"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface AddProductRowProps {
    product: any
    onAssign: (price: number | null, date: Date | undefined) => void
    isAdding: boolean
    returnUrl: string | null
}

export function AddProductRow({ product, onAssign, isAdding, returnUrl }: AddProductRowProps) {
    const [overridePrice, setOverridePrice] = useState<string>('')
    const router = useRouter()
    const [validUntil, setValidUntil] = useState<Date | undefined>(undefined)

    return (
        <tr className="hover:bg-gray-50 group">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                            {product.name}
                            {product.category === 0 && <span onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${product.id}?returnUrl=${encodeURIComponent(returnUrl || '')}`); }} className="cursor-pointer text-red-600 text-[10px] font-medium hover:underline">(Incomplete)</span>}
                            {product.category === 1 && <span onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${product.id}?returnUrl=${encodeURIComponent(returnUrl || '')}`); }} className="cursor-pointer text-yellow-600 text-[10px] font-medium hover:underline">(Unpublishable)</span>}
                        </div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                    </div>
                </div>
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal h-8 text-xs",
                                !validUntil && "text-muted-foreground"
                            )}
                        >
                            {validUntil ? (
                                format(validUntil, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={validUntil}
                            onSelect={setValidUntil}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
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
