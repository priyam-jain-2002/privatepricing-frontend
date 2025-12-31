"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { History } from "lucide-react"
import { fetchAllOrders, updateOrderStatus } from "@/lib/api"
import { OrderInvoiceDialog } from "../order-invoice-dialog"
import { toast } from "sonner"

interface OrdersSectionProps {
    activeStore: any
}

export function OrdersSection({ activeStore }: OrdersSectionProps) {
    const [orders, setOrders] = useState<any[]>([])
    const [showCompletedOrders, setShowCompletedOrders] = useState(false)
    const [viewingInvoice, setViewingInvoice] = useState<any>(null)

    useEffect(() => {
        if (activeStore) {
            loadOrders()
        }
    }, [activeStore])

    const loadOrders = async () => {
        try {
            const data = await fetchAllOrders(activeStore.id)
            setOrders(data)
        } catch (err) {
            console.error("Failed to fetch orders", err)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex space-x-2 border-b border-gray-200 pb-2">
                <Button
                    variant={!showCompletedOrders ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowCompletedOrders(false)}
                    className="rounded-full"
                >
                    Active Orders
                </Button>
                <Button
                    variant={showCompletedOrders ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowCompletedOrders(true)}
                    className="rounded-full"
                >
                    <History className="mr-2 h-3 w-3" /> History
                </Button>
            </div>

            <Card className="border border-gray-200 bg-white shadow-none">
                <div className="overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Placed By</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.filter(o => showCompletedOrders ? (o.status === 'completed' || o.status === 'cancelled') : (o.status !== 'completed' && o.status !== 'cancelled')).length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No orders found.</td></tr>
                            ) : orders.filter(o => showCompletedOrders ? (o.status === 'completed' || o.status === 'cancelled') : (o.status !== 'completed' && o.status !== 'cancelled')).map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    onClick={() => setViewingInvoice(order)}
                                >
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900 font-semibold">#{order.orderNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.placedByUser?.name || order.placedByCustomerUser?.name}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.currency} {order.totalAmount}</td>
                                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 ring-1 ring-inset focus:ring-2 
                              ${order.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                    order.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                }`}
                                            value={order.status}
                                            onChange={async (e) => {
                                                try {
                                                    await updateOrderStatus(activeStore.id, order.id, e.target.value);
                                                    await loadOrders();
                                                    toast.success("Order status updated");
                                                } catch (err: any) {
                                                    toast.error("Failed to update status: " + err.message);
                                                }
                                            }}
                                        >
                                            <option value="requested">Requested</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <OrderInvoiceDialog
                order={viewingInvoice}
                open={!!viewingInvoice}
                onOpenChange={(open) => !open && setViewingInvoice(null)}
            />
        </div>
    )
}
