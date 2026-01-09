"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Check, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { ExpiryIndicator } from "@/components/expiry-indicator"

interface PricingRowProps {
    product: any
    initialPricing: any
    onSave: (updates: any) => void
    savingId: string | null
    freightRate?: number
    returnUrl: string | null
}

export function PricingRow({ product, initialPricing, onSave, savingId, freightRate, returnUrl }: PricingRowProps) {
    if (!product) return null // Safety check
    const router = useRouter()

    const [pricingType, setPricingType] = useState(initialPricing?.pricingType || 'fixed')
    const [sellingPrice, setSellingPrice] = useState(initialPricing?.sellingPrice ?? '')
    const [profitMarginPercent, setProfitMarginPercent] = useState(initialPricing?.profitMarginPercent ?? '')
    const [visible, setVisible] = useState(initialPricing?.visible ?? true)
    const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(initialPricing?.effectiveTo ? new Date(initialPricing.effectiveTo) : undefined)
    const [isDirty, setIsDirty] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Sync state when initialPricing changes (e.g. after save)
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
            // Fallback for legacy records: calculate dynamically for display
            const baseCost = parseFloat(product.basePrice) || 0;
            // Ensure product object has it.
            const effectiveCost = parseFloat(product.costPrice || product.basePrice || '0') * (1 + (freightRate || 0) / 100);

            const margin = parseFloat(initialPricing.profitMarginPercent);
            if (!isNaN(effectiveCost) && !isNaN(margin)) {
                // Calculate Price from Effective Cost and Margin
                const price = effectiveCost * (1 + margin / 100);
                setSellingPrice(price.toFixed(2))
            } else {
                setSellingPrice('')
            }
        } else {
            setSellingPrice('')
        }
    }, [initialPricing, product, freightRate])

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
            return;
        }
        const margin = parseFloat(value);
        const baseCost = parseFloat(product.costPrice || product.basePrice || '0');
        // Effective Cost includes freight
        const effectiveCost = baseCost * (1 + (freightRate || 0) / 100);

        // Base Calculation: Effective Cost + Margin
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
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.category === 0 && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${product.id}?returnUrl=${encodeURIComponent(returnUrl || '')}`); }}
                                    className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] border border-red-100 font-medium hover:bg-red-100"
                                >
                                    Incomplete
                                </div>
                            )}
                            {product.category === 1 && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${product.id}?returnUrl=${encodeURIComponent(returnUrl || '')}`); }}
                                    className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] border border-yellow-100 font-medium hover:bg-yellow-100"
                                >
                                    Unpublishable
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-col">
                    <span>₹ {(!!freightRate ? (parseFloat(product.basePrice || product.costPrice || 0) * (1 + freightRate / 100)).toFixed(2) : (product.basePrice || product.costPrice || 0))}</span>
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
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    {pricingType === 'profit_margin' ? (
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
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-sm font-medium text-gray-900">
                                    ₹ {sellingPrice}
                                </span>

                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-gray-400 text-xs">₹</span>
                            <Input
                                type="number"
                                className="h-8 w-24 text-right"
                                placeholder={(product.basePrice || 0).toString()}
                                value={sellingPrice}
                                onChange={(e) => handleChange(setSellingPrice, e.target.value)}
                            />
                        </>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[140px] pl-3 text-left font-normal h-8 text-xs",
                                !effectiveTo && "text-muted-foreground"
                            )}
                        >
                            {effectiveTo ? (
                                format(effectiveTo, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={effectiveTo}
                            onSelect={(date) => handleChange(setEffectiveTo, date)}
                            disabled={(date) =>
                                date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
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
        </tr>
    )
}
