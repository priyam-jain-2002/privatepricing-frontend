"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateStore } from "@/lib/api"
import { toast } from "sonner"

interface OperationCostDialogProps {
    store: any
    onUpdate: (val: number) => void
}

export function OperationCostDialog({ store, onUpdate }: OperationCostDialogProps) {
    const [open, setOpen] = useState(false)
    const [cost, setCost] = useState(store?.operationCostPercentage || '')

    // Update local state when store changes
    useEffect(() => {
        if (store) {
            setCost(store.operationCostPercentage || 10)
        }
    }, [store])

    const handleSave = async () => {
        if (!store) return
        try {
            const updatedStore = await updateStore(store.id, { operationCostPercentage: parseFloat(cost) })
            onUpdate(updatedStore.operationCostPercentage)
            toast.success("Operation cost updated successfully")
            setOpen(false)
        } catch (err: any) {
            toast.error("Failed to update: " + err.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <button id="operation-cost-trigger" className="hidden" onClick={() => setOpen(true)} />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Store Operation Cost</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Operation Cost Percentage (%)</label>
                        <p className="text-sm text-gray-500">
                            what is your operation cost in percentage
                        </p>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
