"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Settings, Info } from "lucide-react"
import { fetchProducts, createProduct, updateProduct } from "@/lib/api"
import { toast } from "sonner"
import { OperationCostDialog } from "./operation-cost-dialog"
import { ProductRow } from "./product-row"
import { useStore } from "@/contexts/store-context"

interface ProductsSectionProps {
    activeStore: any
}

export function ProductsSection({ activeStore }: ProductsSectionProps) {
    // We can get global store actions from context if needed for updates
    const { stores, setActiveStore, refreshStores } = useStore()

    // Local state
    const [products, setProducts] = useState<any[]>([])
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)

    useEffect(() => {
        if (activeStore) {
            loadProducts()
        }
    }, [activeStore])

    const loadProducts = async () => {
        try {
            const data = await fetchProducts()
            setProducts(data)
        } catch (err) {
            console.error("Failed to fetch products", err)
        }
    }

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            const basePriceNum = parseFloat(formData.get('basePrice') as string || '0');
            const baseFreightNum = parseFloat(formData.get('baseFreight') as string || '0');
            const totalPercentage = baseFreightNum + (activeStore?.operationCostPercentage || 0);
            const calculatedCostPrice = basePriceNum * (1 + totalPercentage / 100);

            await createProduct({
                storeId: activeStore.id,
                name: formData.get('name'),
                sku: formData.get('sku'),
                hsnCode: formData.get('hsnCode'),
                basePrice: basePriceNum,
                baseFreight: baseFreightNum,
                costPrice: parseFloat(calculatedCostPrice.toFixed(2)),
                cgst: parseFloat(formData.get('cgst') as string || '0'),
                sgst: parseFloat(formData.get('sgst') as string || '0'),
                currency: 'INR'
            });
            await loadProducts();
            setIsAddProductOpen(false);
            form.reset();
            toast.success("Product created successfully!");
        } catch (err: any) {
            toast.error("Failed to create product: " + err.message);
        }
    }

    const handleUpdateProductDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            await updateProduct(editingProduct.id, {
                name: formData.get('name'),
                sku: formData.get('sku'),
            });
            await loadProducts();
            setEditingProduct(null);
            toast.success("Product updated successfully!");
        } catch (err: any) {
            toast.error("Failed to update product: " + err.message);
        }
    }

    return (
        <div className="space-y-4">
            <OperationCostDialog
                store={activeStore}
                onUpdate={async (newPercentage) => {
                    // Refresh stores to get updated percentage
                    await refreshStores();
                    toast.success("Operation cost updated");
                }}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => document.getElementById('operation-cost-trigger')?.click()} className="w-full sm:w-auto">
                        <Settings className="mr-2 h-4 w-4" />
                        Operation Cost ({activeStore?.operationCostPercentage || 10}%)
                    </Button>
                </div>
                <Button onClick={() => setIsAddProductOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProduct} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <Input name="name" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SKU</label>
                                <Input name="sku" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">HSN Code</label>
                                <Input name="hsnCode" placeholder="Optional" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Base Price</label>
                                <Input name="basePrice" type="number" step="0.01" min="0" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Incoming Freight (%)</label>
                                <Input name="baseFreight" type="number" step="0.01" min="0" placeholder="%" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">CGST (%)</label>
                                <Input name="cgst" type="number" step="0.01" min="0" defaultValue="0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SGST (%)</label>
                                <Input name="sgst" type="number" step="0.01" min="0" defaultValue="0" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Product</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                        <DialogTitle>Edit Product Details</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProductDetails} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <Input name="name" defaultValue={editingProduct?.name} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SKU</label>
                            <Input name="sku" defaultValue={editingProduct?.sku} required />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Card className="border border-gray-200 bg-white shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SKU / HSN</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Base Price (Global)</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Incoming Freight (%)</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1 cursor-help">
                                                    Cost Price
                                                    <Info className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Formula: Base Price + Incoming Freight + (Base Price * Operations Cost %)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">CGST %</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SGST %</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No products found.</td></tr>
                            ) : products.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onUpdate={loadProducts}
                                    onEditDetails={() => setEditingProduct(product)}
                                    operationCostPercentage={activeStore?.operationCostPercentage || 0}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <p className="text-sm text-gray-500 italic mt-2">* Cost Price includes operations cost</p>
        </div>
    )
}
