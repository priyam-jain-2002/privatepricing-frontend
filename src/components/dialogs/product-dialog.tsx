"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react"
import { createProduct, updateProduct } from "@/lib/api"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { basename } from "path"

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: any // If null, we are adding
    onSuccess: () => void
    storeId: string
    operationCostPercentage: number
}

export function ProductDialog({ open, onOpenChange, product, onSuccess, storeId, operationCostPercentage }: ProductDialogProps) {
    const isEdit = !!product
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        hsnCode: "",
        basePrice: "",
        baseFreight: "",
        gst: "18",
        description: "",
        technicalSheet: "",
        images: [] as string[]
    })

    // Image input state
    const [newImageUrl, setNewImageUrl] = useState("")

    // Initialize form on open/product change
    useEffect(() => {
        if (open) {
            if (product) {
                setFormData({
                    name: product.name || "",
                    sku: product.sku || "",
                    hsnCode: product.hsnCode || "",
                    basePrice: product.basePrice?.toString() || "",
                    baseFreight: product.baseFreight?.toString() || "",
                    gst: product.gst?.toString() || "18",
                    description: product.description || "",
                    technicalSheet: product.technicalSheet || "",
                    images: product.images || []
                })
            } else {
                setFormData({
                    name: "",
                    sku: "",
                    hsnCode: "",
                    basePrice: "",
                    baseFreight: "",
                    gst: "18",
                    description: "",
                    technicalSheet: "",
                    images: []
                })
            }
            setNewImageUrl("")
        }
    }, [open, product])

    const handleAddImage = () => {
        if (newImageUrl.trim()) {
            setFormData(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }))
            setNewImageUrl("")
        }
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const basePriceNum = parseFloat(formData.basePrice || "0")
            const baseFreightNum = parseFloat(formData.baseFreight || "0")
            // Cost price calculation: Base Price + (Base Price * (Freight% + OpCost%))? 
            // Previous logic was: calculatedCostPrice = basePriceNum * (1 + totalPercentage / 100);
            const totalPercentage = baseFreightNum + operationCostPercentage
            const costPrice = parseFloat(basePriceNum + (basePriceNum * (baseFreightNum / 100)) + ((basePriceNum * (operationCostPercentage / 100))).toFixed(2));

            const payload = {
                storeId,
                name: formData.name,
                sku: formData.sku,
                hsnCode: formData.hsnCode,
                basePrice: basePriceNum,
                baseFreight: baseFreightNum,
                gst: parseFloat(formData.gst || "0"),
                description: formData.description,
                technicalSheet: formData.technicalSheet,
                images: formData.images,
                costPrice, // Calculated
                currency: 'INR'
            }

            if (isEdit) {
                await updateProduct(product.id, payload)
                toast.success("Product updated successfully")
            } else {
                await createProduct(payload)
                toast.success("Product created successfully")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to save product")
        } finally {
            setIsLoading(false)
        }
    }

    // Calculated Status Logic (Frontend Replica for immediate feedback)
    // 0: Incomplete, 1: Unpublishable, 2: Publishable
    const getStatus = () => {
        const { name, basePrice, gst, hsnCode, description, images } = formData

        if (!name || !basePrice || !gst || !hsnCode) return 0 // Incomplete
        if (!description || images.length === 0) return 1 // Unpublishable
        return 2 // Publishable
    }

    const status = getStatus()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <div className="flex items-center gap-2 mr-8">
                        {status === 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Incomplete
                            </Badge>
                        )}
                        {status === 1 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Unpublishable
                            </Badge>
                        )}
                        {status === 2 && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Publishable
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Product Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                required
                                placeholder="Enter product name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SKU *</Label>
                            <Input
                                value={formData.sku}
                                onChange={(e) => handleChange("sku", e.target.value)}
                                required
                                placeholder="Unique SKU"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Base Price (INR) *</Label>
                            <Input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => handleChange("basePrice", e.target.value)}
                                required
                                min="0" step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>GST (%) *</Label>
                            <Input
                                type="number"
                                value={formData.gst}
                                onChange={(e) => handleChange("gst", e.target.value)}
                                required
                                min="0" step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>HSN Code *</Label>
                            <Input
                                value={formData.hsnCode}
                                onChange={(e) => handleChange("hsnCode", e.target.value)}
                                required
                                placeholder="HSN"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Incoming Freight (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={formData.baseFreight}
                                    onChange={(e) => handleChange("baseFreight", e.target.value)}
                                    placeholder="0"
                                    min="0" step="0.01"
                                />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <InfoIcon className="w-4 h-4 text-gray-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>Operational Cost ({operationCostPercentage}%) will be added to calculate final Cost Price.</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Technical Sheet URL</Label>
                            <Input
                                value={formData.technicalSheet}
                                onChange={(e) => handleChange("technicalSheet", e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Rich Content */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Detailed product description..."
                            rows={3}
                        />
                        {!formData.description && (
                            <p className="text-xs text-yellow-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Required for publishing
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label>Images</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="Image URL (http://...)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddImage()
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddImage} variant="secondary" size="icon">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {formData.images.length === 0 && (
                            <p className="text-xs text-yellow-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Min 1 image required for publishing
                            </p>
                        )}

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                            {formData.images.map((url, idx) => (
                                <div key={idx} className="relative group aspect-square border rounded-md overflow-hidden bg-gray-50">
                                    <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : (isEdit ? "Update Product" : "Create Product")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function InfoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}
