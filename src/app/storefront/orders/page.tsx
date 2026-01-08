"use client"

import { useStorefront } from "@/components/storefront/storefront-context"
import { useState, useEffect } from "react"
import { fetchStorefrontOrders } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { PayOrderDialog } from "@/components/order-invoice-dialog"
import { STATUS_CONFIG, COMPLETED_STATUSES } from "@/lib/order-status"
import { Badge } from "@/components/ui/badge"

export default function StorefrontOrdersPage() {
    const { authContext, accessToken, loading: contextLoading } = useStorefront()

    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'requested' | 'active' | 'pi' | 'history'>('active')
    const [viewingOrder, setViewingOrder] = useState<any>(null)


    useEffect(() => {
        if (!authContext?.customer?.id || !accessToken) return



        async function loadOrders() {
            try {
                setLoading(true)
                // Tabs & Statuses:
                // Requested: 0
                // Active: 1 (Pending), 2 (Processing), 3 (Shipped)
                // PI: 4
                // History: 5 (Completed), 6 (Cancelled)

                let statuses: number[] = [];
                switch (activeTab) {
                    case 'requested': statuses = [0]; break;
                    case 'active': statuses = [1, 2, 3]; break;
                    case 'pi': statuses = [4]; break;
                    case 'history': statuses = [5, 6]; break;
                    default: statuses = [1, 2, 3]; break;
                }

                console.log("Fetching orders for tab:", activeTab, "Statuses:", statuses);

                const data = await fetchStorefrontOrders(authContext!.customer!.id, statuses)
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
    }, [authContext, accessToken, activeTab])

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
                            variant={activeTab === 'requested' ? "default" : "outline"}
                            onClick={() => setActiveTab('requested')}
                            className="rounded-full relative"
                            size="sm"
                        >
                            Requested

                        </Button>
                        <Button
                            variant={activeTab === 'active' ? "default" : "outline"}
                            onClick={() => setActiveTab('active')}
                            className="rounded-full"
                            size="sm"
                        >
                            Active
                        </Button>
                        <Button
                            variant={activeTab === 'pi' ? "default" : "outline"}
                            onClick={() => setActiveTab('pi')}
                            className="rounded-full"
                            size="sm"
                        >
                            Pending Invoice
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? "default" : "outline"}
                            onClick={() => setActiveTab('history')}
                            className="rounded-full"
                            size="sm"
                        >
                            History
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
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                                {activeTab === 'history' ? "No past orders found." : "No orders found in this category."}
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => {
                                            const status = STATUS_CONFIG[order.status] || { label: 'Unknown', variant: 'secondary' }
                                            return (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        #{order.orderNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={status.variant}>
                                                            {status.label}
                                                        </Badge>
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
                                            )
                                        })
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
