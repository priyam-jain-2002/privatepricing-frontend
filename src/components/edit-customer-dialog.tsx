
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { updateCustomer } from "@/lib/api"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"

export function EditCustomerDialog({ customer, open, onOpenChange, onUpdate }: { customer: any, open: boolean, onOpenChange: (open: boolean) => void, onUpdate: () => void }) {
    const [loading, setLoading] = useState(false)
    const [freightType, setFreightType] = useState<'exclusive' | 'inclusive'>('exclusive')

    useEffect(() => {
        if (customer) {
            setFreightType(customer.inclusiveFreightRate !== null ? 'inclusive' : 'exclusive')
        }
    }, [customer])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!customer) return;

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

            await updateCustomer(customer.id, payload)
            toast.success("Customer updated successfully")
            onUpdate()
            onOpenChange(false)
        } catch (err: any) {
            toast.error("Failed to update customer: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Customer Settings</DialogTitle>
                    <DialogDescription>
                        Configure global settings and terms for {customer.name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Basic Details</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {customer.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input name="name" defaultValue={customer.name} required className="font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label>GSTIN</Label>
                                <Input name="GSTIN" defaultValue={customer.GSTIN || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select name="status" defaultValue={customer.status}>
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
                    {/* Terms and Conditions */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Terms & Conditions</h4>
                        {(!customer.deliveryTime || !customer.paymentTerms) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2 text-amber-800 text-xs">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Missing Configuration</p>
                                    <p>Please add delivery and payment terms to ensure invoices are generated correctly.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Delivery Time (Days)</Label>
                                <Input name="deliveryTime" type="number" min="0" placeholder="e.g. 7" defaultValue={customer.deliveryTime || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Payment Terms (Days)</Label>
                                <Input name="paymentTerms" type="number" min="0" placeholder="e.g. 30" defaultValue={customer.paymentTerms || ''} />
                            </div>
                            <div className="col-span-2 bg-gray-50 p-3 rounded-md border flex items-center gap-3">
                                <Checkbox name="isBillToSameAsShipTo" defaultChecked={customer.isBillToSameAsShipTo} id="billTo" />
                                <div className="space-y-0.5">
                                    <Label htmlFor="billTo" className="cursor-pointer font-medium text-gray-900">Same Bill-To/Ship-To Address</Label>
                                    <p className="text-xs text-muted-foreground">Automatically copy shipping address to billing address for invoices.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Additional Terms</Label>
                                <Textarea name="additionalTerms" placeholder="Enter specific contractual terms here..." defaultValue={customer.additionalTerms || ''} className="min-h-[80px] text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Freight Settings */}
                    {/* Freight Settings */}
                    <div className="rounded-lg border p-4 space-y-4 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Freight Configuration</h4>
                            {freightType === 'inclusive' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Inclusive Active</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-start">
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
                                            defaultValue={customer.inclusiveFreightRate || ''}
                                            required
                                            className="bg-white pr-8"
                                        />
                                        <span className="absolute right-3 top-2.5 text-sm text-gray-500 font-medium">%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {freightType === 'exclusive' && (
                            <p className="text-xs text-muted-foreground">Freight will be calculated and added separately on invoices.</p>
                        )}
                        {freightType === 'inclusive' && (
                            <p className="text-xs text-muted-foreground">Product prices will be treated as including this freight percentage.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>Save Changes</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
