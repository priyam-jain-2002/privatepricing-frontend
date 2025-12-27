"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { format } from "date-fns"

interface OrderInvoiceDialogProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function OrderInvoiceDialog({ order, open, onOpenChange }: OrderInvoiceDialogProps) {
    if (!order) return null

    // Calculate taxes if not explicitly available at order level (though items have tax info)
    // Assuming order.items has tax info or we derive from product details snapshotted
    // Ideally, Order entity should have totalTax. For now, we sum up from items or display roughly.
    // Actually, let's keep it simple: Show Unit Price, Qty, Total.

    const subtotal = order.items.reduce((acc: number, item: any) => acc + (Number(item.unitPriceAtTime) * item.quantity), 0)
    const freightTotal = order.items.reduce((acc: number, item: any) => acc + (Number(item.freightAtTime) * item.quantity), 0)
    // Assuming tax is included or calculated. Backend currently doesn't snapshot Tax Amount per item explicitly in OrderItem?
    // Checking OrderItem entity: unitPriceAtTime, freightAtTime. No taxAtTime.
    // We might have to rely on Product's current Tax % if not snapshotted, OR if unitPriceAtTime is inclusive/exclusive.
    // Standard practice: unitPrice is usually base. Let's assume standard breakdown.

    // For this MVP Invoice, we'll display what we have.
    const grandTotal = Number(order.totalAmount)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="text-2xl font-bold">Invoice #{order.orderNumber}</DialogTitle>
                        <span className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "MMMM dd, yyyy")}</span>
                        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1
                ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                            {order.status}
                        </span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-8 py-6 text-sm">
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Billed To:</h4>
                        <div className="text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{order.customer?.name}</p>
                            <p>{order.branch?.name}</p>
                            <p className="text-xs text-gray-400 mt-2">GSTIN: {order.customer?.GSTIN || "N/A"}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h4 className="font-semibold text-gray-900 mb-2">Order Details:</h4>
                        <div className="text-gray-600 space-y-1">
                            <p>Placed By: {order.placedByUser?.name || "N/A"}</p>
                            {/* Add Store Info if needed */}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Item</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">Qty</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">Unit Price</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">Freight</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.items.map((item: any) => {
                                const itemTotal = (Number(item.unitPriceAtTime) + Number(item.freightAtTime)) * item.quantity;
                                return (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{item.product?.name}</p>
                                            <p className="text-xs text-gray-500">{item.product?.sku}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">{order.currency} {parseFloat(item.unitPriceAtTime).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{order.currency} {parseFloat(item.freightAtTime).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{order.currency} {itemTotal.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="flex justify-end">
                    <div className="w-1/2 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600 border-t pt-3">
                            <span>Subtotal (Excl. Tax)</span>
                            {/* Note: This is an approximation since unitPrice might currently include/exclude tax based on logic, but totalAmount is final. */}
                            {/* We will rely on totalAmount for now as the source of truth. */}
                            <span>{order.currency} {(subtotal + freightTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-3">
                            <span>Grand Total</span>
                            <span>{order.currency} {parseFloat(order.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
