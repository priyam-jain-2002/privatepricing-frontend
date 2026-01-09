import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { fetchAssets, deleteAsset, uploadAsset } from "@/lib/api"
import { Loader2, Check, FileText, Image as ImageIcon, Trash2, Upload, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Asset {
    id: string
    filename: string
    publicUrl: string
    mimeType: string
    createdAt: string
}

interface AssetLibraryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (url: string) => void
    allowedTypes?: string[] // e.g. ['image/', 'application/pdf']
}

export function AssetLibraryDialog({ open, onOpenChange, onSelect, allowedTypes }: AssetLibraryDialogProps) {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'IMAGE' | 'DOCUMENT'>('ALL')

    useEffect(() => {
        if (open) {
            loadAssets()
            setSelectedUrl(null)
            setSearchQuery("")
            setActiveFilter('ALL')
        }
    }, [open])

    const loadAssets = async () => {
        setLoading(true)
        try {
            const data = await fetchAssets()
            setAssets(data)
        } catch (error) {
            console.error("Failed to load assets", error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            await uploadAsset(file)
            toast.success("Asset uploaded successfully")
            await loadAssets()
        } catch (error: any) {
            toast.error("Failed to upload asset: " + error.message)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleDelete = async (e: React.MouseEvent, assetId: string) => {
        e.stopPropagation()
        if (!confirm("Are you sure you want to delete this asset?")) return

        try {
            await deleteAsset(assetId)
            toast.success("Asset deleted")
            setAssets(prev => prev.filter(a => a.id !== assetId))
            if (selectedUrl === assets.find(a => a.id === assetId)?.publicUrl) {
                setSelectedUrl(null)
            }
        } catch (error: any) {
            toast.error("Failed to delete asset: " + error.message)
        }
    }

    const filteredAssets = assets.filter(asset => {
        // 1. Type Filter from Props (if strict)
        if (allowedTypes && allowedTypes.length > 0) {
            const isAllowed = allowedTypes.some(type => {
                if (type.endsWith('/')) return asset.mimeType.startsWith(type)
                return asset.mimeType === type
            })
            if (!isAllowed) return false
        }

        // 2. UI Filter Tabs
        if (activeFilter === 'IMAGE' && !asset.mimeType.startsWith('image/')) return false
        if (activeFilter === 'DOCUMENT' && asset.mimeType.startsWith('image/')) return false

        // 3. Search
        if (searchQuery) {
            return asset.filename.toLowerCase().includes(searchQuery.toLowerCase())
        }

        return true
    })

    const handleSelect = () => {
        if (selectedUrl) {
            onSelect(selectedUrl)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="p-4 border-b flex flex-col gap-4 bg-background z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">Media Library</DialogTitle>
                        <div className="relative">
                            <Input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                onChange={handleUpload}
                                disabled={uploading}
                                accept={allowedTypes?.join(',')}
                            />
                            <Button disabled={uploading} className="shadow-sm">
                                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Upload New
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search assets..."
                                className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                            {['ALL', 'IMAGE', 'DOCUMENT'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter as any)}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                        activeFilter === filter
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    {filter === 'ALL' ? 'All' : filter === 'IMAGE' ? 'Images' : 'Documents'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/80">
                            <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
                            <p className="text-sm font-medium animate-pulse">Loading assets...</p>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/60">
                            <div className="bg-muted/50 p-6 rounded-full">
                                <ImageIcon className="w-12 h-12 opacity-50" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-foreground">No assets found</p>
                                <p className="text-sm">Upload a new file to get started</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {filteredAssets.map((asset) => {
                                const isSelected = selectedUrl === asset.publicUrl
                                const isImage = asset.mimeType.startsWith('image/')

                                return (
                                    <div
                                        key={asset.id}
                                        className={cn(
                                            "group relative aspect-square rounded-xl overflow-hidden border bg-background transition-all duration-200 cursor-pointer hover:shadow-md",
                                            isSelected ? "ring-2 ring-primary border-primary ring-offset-2" : "border-border/60 hover:border-border"
                                        )}
                                        onClick={() => setSelectedUrl(asset.publicUrl)}
                                    >
                                        {isImage ? (
                                            <div className="w-full h-full relative bg-gray-100">
                                                <img
                                                    src={asset.publicUrl}
                                                    alt={asset.filename}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gray-50/50 group-hover:bg-gray-100/50 transition-colors">
                                                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs font-medium text-foreground/80 line-clamp-2 px-2 break-all">
                                                    {asset.filename}
                                                </span>
                                            </div>
                                        )}

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-sm z-20 animate-in fade-in zoom-in duration-200">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}

                                        {/* Hover Actions / Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between z-10">
                                            {isImage && (
                                                <span className="text-[10px] text-white/90 truncate mr-2 font-medium">
                                                    {asset.filename}
                                                </span>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg shadow-sm ml-auto shrink-0 opacity-80 hover:opacity-100"
                                                onClick={(e) => handleDelete(e, asset.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-background flex justify-between items-center z-10">
                    <div className="text-xs text-muted-foreground pl-2">
                        {selectedUrl ? "1 asset selected" : "No asset selected"}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSelect} disabled={!selectedUrl}>
                            Select Asset
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
