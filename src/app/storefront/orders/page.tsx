"use client"

import { useStorefront } from "@/components/storefront/storefront-context"
import { useState, useEffect } from "react"
import { fetchStorefrontOrders } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { PayOrderDialog } from "@/components/order-invoice-dialog"

export default function StorefrontOrdersPage() {
    const { authContext, accessToken, loading: contextLoading } = useStorefront()

    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showHistory, setShowHistory] = useState(false)
    const [viewingOrder, setViewingOrder] = useState<any>(null)

    useEffect(() => {
        if (!authContext?.customer?.id || !accessToken) return

        async function loadOrders() {
            try {
                setLoading(true)
                const data = await fetchStorefrontOrders(authContext!.customer!.id)
                // Sort by date desc
                data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                setOrders(data)
            } catch (err) {
                console.error("Failed to load orders", err)
                toast.error("Failed to load your orders")
            } finally {
                setLoading(false)
            }
        }
        loadOrders()
    }, [authContext, accessToken])


    const filteredOrders = orders.filter(o =>
        showHistory
            ? ['completed', 'cancelled'].includes(o.status)
            : !['completed', 'cancelled'].includes(o.status)
    )

    if (contextLoading) return null; // Let layout handle loading spinner

    return (
        <>
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
                        Purchase Orders
                    </h1>
                    <p className="mt-4 text-lg text-slate-500">
                        Top track the status of your current and past orders.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-6">
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant={!showHistory ? "default" : "outline"}
                            onClick={() => setShowHistory(false)}
                            className="rounded-full"
                            size="sm"
                        >
                            Active Orders
                        </Button>
                        <Button
                            variant={showHistory ? "default" : "outline"}
                            onClick={() => setShowHistory(true)}
                            className="rounded-full"
                            size="sm"
                        >
                            Order History
                        </Button>
                    </div>

                    <Card className="border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 animate-pulse">
                                                Loading orders...
                                            </td>
                                        </tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                                {showHistory ? "No past orders found." : "No active orders."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{order.orderNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.items?.length || 0} items
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                    {order.currency} {Number(order.totalAmount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Button variant="ghost" size="sm" onClick={() => setViewingOrder(order)}>View Details</Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <PayOrderDialog
                        order={viewingOrder}
                        open={!!viewingOrder}
                        onOpenChange={(open: boolean) => !open && setViewingOrder(null)}
                    />
                </div>
            </main>
        </>
    )
}
