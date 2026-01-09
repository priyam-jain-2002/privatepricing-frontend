"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, AlertTriangle, Plus, X, ArrowLeft, Loader2, Save } from "lucide-react"
import { createProduct, updateProduct } from "@/lib/api"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { number } from "framer-motion"

interface ProductFormProps {
    initialData?: any
    storeId: string
    operationCostPercentage: number
    onSuccess?: () => void
}

export function ProductForm({ initialData, storeId, operationCostPercentage, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isEdit = !!initialData
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

    const [newImageUrl, setNewImageUrl] = useState("")

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                sku: initialData.sku || "",
                hsnCode: initialData.hsnCode || "",
                basePrice: initialData.basePrice?.toString() || "",
                baseFreight: initialData.baseFreight?.toString() || "",
                gst: initialData.gst?.toString() || "18",
                description: initialData.description || "",
                technicalSheet: initialData.technicalSheet || "",
                images: initialData.images || []
            })
        }
    }, [initialData])

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
            const totalPercentage = baseFreightNum + Number(operationCostPercentage)
            console.log(totalPercentage)
            const costPrice = parseFloat((basePriceNum * (1 + totalPercentage / 100)).toFixed(2))

            const payload = {
                name: formData.name,
                sku: formData.sku,
                hsnCode: formData.hsnCode,
                basePrice: basePriceNum,
                baseFreight: baseFreightNum,
                gst: parseFloat(formData.gst || "0"),
                description: formData.description,
                technicalSheet: formData.technicalSheet,
                images: formData.images,
                costPrice,
                currency: 'INR'
            }

            if (isEdit) {
                // Remove storeId for updates as it's forbidden in DTO
                const { storeId: _, ...updatePayload } = payload as any
                await updateProduct(initialData.id, updatePayload)
                toast.success("Product updated successfully")
            } else {
                // For create, include storeId
                await createProduct({ ...payload, storeId })
                toast.success("Product created successfully")
            }

            if (onSuccess) {
                onSuccess()
            } else {
                const returnUrl = searchParams.get('returnUrl')
                if (returnUrl) {
                    router.push(returnUrl)
                } else {
                    router.push('/dashboard/products')
                }
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    // Calculated Status Logic (Frontend Replica)
    const getStatus = () => {
        const { name, basePrice, gst, hsnCode, description, images } = formData
        if (!name || !basePrice || !gst || !hsnCode) return 0 // Incomplete
        if (!description || images.length === 0) return 1 // Unpublishable
        return 2 // Publishable
    }

    const status = getStatus()

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Product" : "Create Product"}</h1>
                        <p className="text-sm text-muted-foreground">{isEdit ? `Manage details for ${formData.name}` : "Add a new product to your catalog"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-2">
                        {status === 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
                                <AlertCircle className="w-4 h-4" /> Incomplete
                            </Badge>
                        )}
                        {status === 1 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex items-center gap-1.5 px-3 py-1">
                                <AlertTriangle className="w-4 h-4" /> Unpublishable
                            </Badge>
                        )}
                        {status === 2 && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1.5 px-3 py-1">
                                <CheckCircle2 className="w-4 h-4" /> Publishable
                            </Badge>
                        )}
                    </div>
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Discard</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isEdit ? "Save Changes" : "Create Product"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Core product details required for identification.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Product Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    required
                                    placeholder="e.g. Industrial Widget X-200"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>SKU *</Label>
                                    <Input
                                        value={formData.sku}
                                        onChange={(e) => handleChange("sku", e.target.value)}
                                        required
                                        placeholder="Unique Stock Keeping Unit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>HSN Code *</Label>
                                    <Input
                                        value={formData.hsnCode}
                                        onChange={(e) => handleChange("hsnCode", e.target.value)}
                                        required
                                        placeholder="Harmonized System Nomenclature"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="Detailed product description, features, and specifications..."
                                    rows={5}
                                />
                                {!formData.description && (
                                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Required for publishing
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                            <CardDescription>Product images and technical documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <Label>Product Images</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        placeholder="Paste image URL (http://...)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddImage()
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={handleAddImage} variant="secondary">Add</Button>
                                </div>

                                {formData.images.length === 0 && (
                                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Minimum 1 image required for publishing
                                    </p>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                    {formData.images.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square border rounded-lg overflow-hidden bg-gray-50">
                                            <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => removeImage(idx)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Technical Sheet URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.technicalSheet}
                                        onChange={(e) => handleChange("technicalSheet", e.target.value)}
                                        placeholder="https://example.com/spec-sheet.pdf"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Pricing */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Tax</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Base Price (INR) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <Input
                                        type="number"
                                        className="pl-7"
                                        value={formData.basePrice}
                                        onChange={(e) => handleChange("basePrice", e.target.value)}
                                        required
                                        min="0" step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>GST Rate (%) *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={formData.gst}
                                        onChange={(e) => handleChange("gst", e.target.value)}
                                        required
                                        min="0" step="0.01"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Incoming Freight</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <AlertCircle className="w-3 h-3 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>Added to cost calculation</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.baseFreight}
                                            onChange={(e) => handleChange("baseFreight", e.target.value)}
                                            placeholder="0"
                                            min="0" step="0.01"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border">
                                    <div className="flex justify-between text-gray-500">
                                        <span>Base Price</span>
                                        <span>₹{parseFloat(formData.basePrice || '0').toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>+ Base Freight</span>
                                        <span>{formData.baseFreight || 0}%</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>+ Op. Cost</span>
                                        <span>{operationCostPercentage}%</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-medium text-gray-900 pt-1">
                                        <span>Final Cost Price</span>
                                        <span>
                                            ₹{(parseFloat(formData.basePrice || '0') * (1 + (parseFloat(formData.baseFreight || '0') + Number(operationCostPercentage)) / 100)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    )
}
