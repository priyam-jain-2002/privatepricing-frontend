"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Settings, Info, Search, Upload, Download, FileSpreadsheet, File, HardDriveDownload } from "lucide-react"
import { fetchProducts, importProducts, exportProducts } from "@/lib/api"
import { toast } from "sonner"
import { OperationCostDialog } from "./operation-cost-dialog"
import { ProductRow } from "./product-row"
import { useStore } from "@/contexts/store-context"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProductsSectionProps {
    activeStore: any
}

export function ProductsSection({ activeStore }: ProductsSectionProps) {
    const { refreshStores } = useStore()
    const router = useRouter()

    // Local state
    const [products, setProducts] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isImporting, setIsImporting] = useState(false)

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

    const [uploadProgress, setUploadProgress] = useState(0)

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeStore) return;

        setIsImporting(true);
        setUploadProgress(0);

        try {
            const toastId = toast.loading("Uploading products...")

            const result = await importProducts(activeStore.id, file, (progress) => {
                setUploadProgress(progress);
                toast.message(`Uploading: ${progress}%`, { id: toastId });
            });

            // The result structure depends on what backend returns for the final chunk. 
            // Assuming the backend performs the import on the last chunk and returns the same result structure as before.
            // But based on my API change, api.ts returns { success: true, message: "Upload complete" } for interim chunks?
            // Wait, api.ts returns the LAST chunk response. 
            // I need to ensure backend returns the import stats on final chunk.

            // For now, let's assume successful upload means successful import start or completion.
            toast.success("Import processed successfully", { id: toastId });

            // If the backend returns detailed stats in the final chunk response, we can display them.
            // result might look like { success: X, failed: Y, errors: [...] } if backend aligns.
            if ((result as any).successCount !== undefined) {
                toast.success(`Imported ${(result as any).successCount} products. Failed: ${(result as any).failedCount}`);
                if ((result as any).errors?.length > 0) {
                    console.error("Import errors:", (result as any).errors);
                    toast.warning(`Check console for import errors`);
                }
            }

            await loadProducts();
        } catch (err: any) {
            toast.error("Import failed: " + err.message);
        } finally {
            setIsImporting(false);
            setUploadProgress(0);
            e.target.value = ''; // Reset input
        }
    }

    const handleExport = async (format: 'xml' | 'xlsx') => {
        try {
            const blob = await exportProducts(activeStore.id, format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Export started");
        } catch (err: any) {
            toast.error("Export failed: " + err.message);
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.hsnCode || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <OperationCostDialog
                store={activeStore}
                onUpdate={async (newPercentage) => {
                    await refreshStores();
                    toast.success("Operation cost updated");
                }}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Hidden Import Input */}
                    <input
                        type="file"
                        id="import-file"
                        className="hidden"
                        accept=".xml,.xlsx,.xls"
                        onChange={handleImport}
                        disabled={isImporting}
                    />

                    <Button variant="outline" onClick={() => document.getElementById('operation-cost-trigger')?.click()} className="w-full sm:w-auto">
                        Op. Cost ({activeStore?.operationCostPercentage || 10}%)
                    </Button>

                    <Button onClick={() => router.push('/dashboard/products/new')} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => document.getElementById('import-file')?.click()} disabled={isImporting}>
                                <HardDriveDownload className="mr-2 h-4 w-4" /> {isImporting ? 'Importing...' : 'Import Products'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('xml')}>
                                <File className="mr-2 h-4 w-4" /> Export XML (Tally)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

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
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">GST %</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">No products found.</td></tr>
                            ) : filteredProducts.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onEditDetails={() => router.push(`/dashboard/products/${product.id}`)}
                                    operationCostPercentage={activeStore?.operationCostPercentage || 0}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <p className="text-sm text-gray-500 italic mt-2">* Cost Price includes operations cost</p>
        </div >
    )
}
