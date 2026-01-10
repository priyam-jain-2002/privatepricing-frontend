import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "./orders/document-upload"
import { Printer, FileText, ListChecks } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface PayOrderDialogProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onOrderUpdated?: (uploadedType?: string) => void
    canUploadDocuments?: boolean
    initialTab?: "details" | "documents"
    requiredDocumentType?: string
    userRole?: number
}

export function PayOrderDialog({
    order,
    open,
    onOpenChange,
    onOrderUpdated,
    canUploadDocuments = false,
    initialTab = "details",
    requiredDocumentType,
    userRole
}: PayOrderDialogProps) {
    if (!order) return null

    // For Pay Order:
    // Base Amount = totalAmount (as per new service logic)
    // Taxes = totalCgstAmount + totalSgstAmount
    // Final = finalAmount

    const baseAmount = Number(order.totalAmount || 0);
    const gstAmount = Number(order.totalGstAmount || 0);
    const grandTotal = Number(order.finalAmount || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="flex flex-col border-b px-6 py-4 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</DialogTitle>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-500">
                                <span>{format(new Date(order.createdAt), "MMMM dd, yyyy")}</span>
                                {order.customerPoNumber && (
                                    <>
                                        <span className="hidden sm:inline text-gray-300">•</span>
                                        <span className="font-medium text-gray-700">PO: {order.customerPoNumber}</span>
                                    </>
                                )}
                            </div>
                            <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1
                    ${order.status === 5 ? 'bg-green-100 text-green-800' :
                                    order.status === 6 ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'}`}>
                                {['Requested', 'Pending', 'Processing', 'Shipped', 'PI', 'Completed', 'Cancelled'][order.status] || order.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="self-end sm:self-auto gap-2">
                                <Printer className="h-4 w-4" /> Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue={initialTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-white">
                        <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger
                                value="details"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-1"
                            >
                                <ListChecks className="w-4 h-4 mr-2" />
                                Order Details
                            </TabsTrigger>
                            <TabsTrigger
                                value="documents"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-1"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Documents & Attachments
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-6 mt-0">
                        {/* Summary Header */}
                        <div className="mt-0 pt-0 border-t-0 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</p>
                                <p className="font-medium text-gray-900">{order.customerNameSnapshot || order.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">GSTIN</p>
                                <p className="font-medium text-gray-900">{order.customerGstinSnapshot || order.customer?.GSTIN || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Bill To / Ship To Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-8">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill To</h4>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {order.billingAddressSnapshot || "N/A"}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ship To</h4>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {order.shippingAddressSnapshot || (
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-500 italic">Picked up in store</span>
                                            {(order.contactPerson || order.contactPhone) && (
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                    {order.contactPerson && <div><span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mr-2">Contact:</span> {order.contactPerson}</div>}
                                                    {order.contactPhone && <div><span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mr-2">Phone:</span> {order.contactPhone}</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="border rounded-lg overflow-hidden mb-8 overflow-x-auto">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700 w-[40%]">Item</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Qty</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Unit Price</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">GST</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item: any) => {
                                        const unitPrice = Number(item.unitPriceAtTime);
                                        const qty = item.quantity;
                                        const lineBase = unitPrice * qty;
                                        const lineGst = Number(item.gstAmountAtTime || 0);
                                        const lineTotal = lineBase + lineGst;

                                        return (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900">{item.product?.name}</p>
                                                    <p className="text-xs text-gray-500">{item.product?.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right">{qty}</td>
                                                <td className="px-4 py-3 text-right">{order.currency} {unitPrice.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {order.currency} {lineGst.toFixed(2)}
                                                    <div className="text-[10px] text-gray-400">({item.gstRateAtTime}%)</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">{order.currency} {lineTotal.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full sm:w-1/2 max-w-sm space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal (Base)</span>
                                    <span>{order.currency} {baseAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span className="font-medium">Total GST</span>
                                    <span>{order.currency} {gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3 mt-1">
                                    <span>Purchase Order Total</span>
                                    <span>{order.currency} {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        {order.termsAndConditionsSnapshot && (
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h4>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-mono">
                                    {order.termsAndConditionsSnapshot}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="documents" className="flex-1 overflow-y-auto px-6 py-6 mt-0">
                        <DocumentUpload
                            storeId={order.storeId}
                            orderId={order.id}
                            invoices={order.invoices || []}
                            receivings={order.receivings || []}
                            onUploadSuccess={(type) => onOrderUpdated && onOrderUpdated(type)}
                            canUpload={canUploadDocuments}
                            requiredDocumentType={requiredDocumentType}
                            userRole={userRole}
                            isPickup={!order.shippingAddressSnapshot && !order.shippingBranchId}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
