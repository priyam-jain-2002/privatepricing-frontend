
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { AlertCircle, MapPin, Plus, Trash2, AlertTriangle } from "lucide-react"
import { updateCustomer, fetchBranches, createBranch, createCustomer } from "@/lib/api"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EditCustomerDialogProps {
    customer: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate: () => void
}

export function EditCustomerDialog({ customer, open, onOpenChange, onUpdate }: EditCustomerDialogProps) {
    const [loading, setLoading] = useState(false)
    const [freightType, setFreightType] = useState<'exclusive' | 'inclusive'>('exclusive')

    // Local Customer State (to handle transition from Create -> Edit)
    const [activeCustomer, setActiveCustomer] = useState<any>(null)

    // Branch State
    const [branches, setBranches] = useState<any[]>([])
    const [newBranchName, setNewBranchName] = useState('')
    const [newBranchAddress, setNewBranchAddress] = useState('')
    const [isAddingBranch, setIsAddingBranch] = useState(false)

    useEffect(() => {
        if (open) {
            // If customer passed, use it. If null, we are in "Create Mode" (so initialize empty)
            if (customer) {
                setActiveCustomer(customer)
                setFreightType(customer.inclusiveFreightRate !== null ? 'inclusive' : 'exclusive')
                fetchBranches(customer.id).then(setBranches).catch(console.error)
            } else {
                setActiveCustomer({
                    name: '',
                    GSTIN: '',
                    status: 'active',
                    paymentTerms: null,
                    deliveryTime: null,
                    inclusiveFreightRate: null,
                    isBillToSameAsShipTo: false,
                    additionalTerms: ''
                })
                setFreightType('exclusive')
                setBranches([])
            }
        }
    }, [customer, open])

    const loadBranches = async () => {
        if (!activeCustomer?.id) return
        try {
            const data = await fetchBranches(activeCustomer.id);
            setBranches(data);
        } catch (err) {
            console.error("Failed to load branches", err);
        }
    }

    const handleAddBranch = async () => {
        if (!newBranchName || !newBranchAddress) {
            toast.error("Please provide both name and address");
            return;
        }
        try {
            await createBranch(activeCustomer.id, { customerId: activeCustomer.id, name: newBranchName, address: newBranchAddress });
            toast.success("Branch added successfully");
            setNewBranchName('');
            setNewBranchAddress('');
            setIsAddingBranch(false);
            loadBranches();
        } catch (err: any) {
            toast.error("Failed to add branch: " + err.message);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeCustomer) return;

        setLoading(true)
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)

        try {
            const inclusiveRate = freightType === 'inclusive' ? parseFloat(formData.get('inclusiveFreightRate') as string) : null;

            const payload = {
                name: formData.get('name'),
                GSTIN: formData.get('GSTIN') || null,
                status: formData.get('status'),
                additionalTerms: formData.get('additionalTerms') || null,
                deliveryTime: formData.get('deliveryTime') ? parseInt(formData.get('deliveryTime') as string) : null,
                paymentTerms: formData.get('paymentTerms') ? parseInt(formData.get('paymentTerms') as string) : null,
                isBillToSameAsShipTo: formData.get('isBillToSameAsShipTo') === 'on',
                inclusiveFreightRate: inclusiveRate
            }

            if (activeCustomer.id) {
                // Update
                await updateCustomer(activeCustomer.id, payload)
                toast.success("Customer updated successfully")
                onUpdate()
                onOpenChange(false)
            } else {
                // Create
                const newCustomer = await createCustomer(payload)
                toast.success("Customer created! You can now add branches.")
                setActiveCustomer(newCustomer) // Switch to Edit Mode with new ID
                onUpdate() // Refresh list background
                // Keep dialog open
            }
        } catch (err: any) {
            toast.error("Failed to save customer: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null; // Using open prop to control visibility
    if (!activeCustomer) return null;

    const isEditMode = !!activeCustomer.id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Customer Settings' : 'Add New Customer'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? `Configure global settings and terms for ${activeCustomer.name}.`
                            : "Enter customer details to get started. You can add branches after creating."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Basic Details</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${activeCustomer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {activeCustomer.status || 'Active'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name *</Label>
                                <Input name="name" defaultValue={activeCustomer.name} required className="font-medium" placeholder="Acme Corp" />
                            </div>
                            <div className="space-y-2">
                                <Label>GSTIN</Label>
                                <Input name="GSTIN" defaultValue={activeCustomer.GSTIN || ''} placeholder="Optional" />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select name="status" defaultValue={activeCustomer.status || 'active'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Terms & Conditions</h4>
                        {isEditMode && (!activeCustomer.deliveryTime || !activeCustomer.paymentTerms) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2 text-amber-800 text-xs">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Missing Configuration</p>
                                    <p>Please add delivery and payment terms to ensure invoices are generated correctly.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Delivery Time (Days)</Label>
                                <Input name="deliveryTime" type="number" min="0" placeholder="e.g. 7" defaultValue={activeCustomer.deliveryTime || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Payment Terms (Days)</Label>
                                <Input name="paymentTerms" type="number" min="0" placeholder="e.g. 30" defaultValue={activeCustomer.paymentTerms || ''} />
                            </div>
                            <div className="col-span-1 sm:col-span-2 bg-gray-50 p-3 rounded-md border flex items-center gap-3">
                                <Checkbox name="isBillToSameAsShipTo" defaultChecked={activeCustomer.isBillToSameAsShipTo} id="billTo" />
                                <div className="space-y-0.5">
                                    <Label htmlFor="billTo" className="cursor-pointer font-medium text-gray-900">Same Bill-To/Ship-To Address</Label>
                                    <p className="text-xs text-muted-foreground">Automatically copy shipping address to billing address for invoices.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Additional Terms</Label>
                                <Textarea name="additionalTerms" placeholder="Enter specific contractual terms here..." defaultValue={activeCustomer.additionalTerms || ''} className="min-h-[80px] text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Freight Settings */}
                    <div className="rounded-lg border p-4 space-y-4 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Freight Configuration</h4>
                            {freightType === 'inclusive' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Inclusive Active</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Policy</Label>
                                <Select value={freightType} onValueChange={(v: any) => setFreightType(v)}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="exclusive">Exclusive (Charged Extra)</SelectItem>
                                        <SelectItem value="inclusive">Inclusive (Built-in Price)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {freightType === 'inclusive' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rate Percentage</Label>
                                    <div className="relative">
                                        <Input
                                            name="inclusiveFreightRate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="5.00"
                                            defaultValue={activeCustomer.inclusiveFreightRate || ''}
                                            required
                                            className="bg-white pr-8"
                                        />
                                        <span className="absolute right-3 top-2.5 text-sm text-gray-500 font-medium">%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Branch Management */}
                    <div className={isEditMode ? "rounded-lg border p-4 space-y-4" : "rounded-lg border p-4 space-y-4 opacity-50 pointer-events-none relative"}>
                        {!isEditMode && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 z-10 backdrop-blur-[1px]">
                                <div className="bg-white px-4 py-2 rounded-md shadow-sm border text-sm font-medium text-gray-600">
                                    Create customer to manage branches
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Branches</h4>
                            <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingBranch(!isAddingBranch)}>
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Branch
                            </Button>
                        </div>

                        {isAddingBranch && (
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-md space-y-3 animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Branch Name</Label>
                                    <Input
                                        placeholder="e.g. Main HQ"
                                        value={newBranchName}
                                        onChange={e => setNewBranchName(e.target.value)}
                                        className="h-8 bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Address</Label>
                                    <Textarea
                                        placeholder="Full address..."
                                        value={newBranchAddress}
                                        onChange={e => setNewBranchAddress(e.target.value)}
                                        className="min-h-[60px] text-xs bg-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingBranch(false)} className="h-7 text-xs">Cancel</Button>
                                    <Button type="button" size="sm" onClick={handleAddBranch} className="h-7 text-xs">Save Branch</Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {branches.length === 0 ? (
                                <p className="text-xs text-gray-500 italic text-center py-2">No branches configured.</p>
                            ) : branches.map(branch => (
                                <div key={branch.id} className="flex items-start gap-3 p-3 rounded-md border border-gray-100 bg-white group hover:border-blue-100 transition-colors">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                                        <p className="text-xs text-gray-500 whitespace-pre-wrap">{branch.address}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {isEditMode ? "Save Changes" : "Create Customer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
