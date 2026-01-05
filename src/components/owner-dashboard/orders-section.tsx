"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { History } from "lucide-react"
import { fetchAllOrders, updateOrderStatus } from "@/lib/api"
import { PayOrderDialog } from "../order-invoice-dialog"
import { analytics } from "@/lib/analytics"
import { toast } from "sonner"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface OrdersSectionProps {
    activeStore: any
}

const statusConfig: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    requested: { label: "Requested", variant: "warning" },
    pending: { label: "Pending", variant: "secondary" },
    processing: { label: "Processing", variant: "default" },
    completed: { label: "Completed", variant: "success" },
    cancelled: { label: "Cancelled", variant: "destructive" },
}

export function OrdersSection({ activeStore }: OrdersSectionProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [orders, setOrders] = useState<any[]>([])
    const [showCompletedOrders, setShowCompletedOrders] = useState(false)

    // URL State
    const activeOrderId = searchParams.get('orderId')

    const viewingPayOrder = useMemo(() => {
        if (!activeOrderId || orders.length === 0) return null
        return orders.find(o => o.id === activeOrderId) || null
    }, [activeOrderId, orders])

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

    const setViewingPayOrder = (order: any | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (order) {
            params.set('orderId', order.id)
        } else {
            params.delete('orderId')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 border-b border-gray-200 pb-2">
                <Button
                    variant={!showCompletedOrders ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowCompletedOrders(false)}
                    className="rounded-full w-full sm:w-auto"
                >
                    Active Pay Orders
                </Button>
                <Button
                    variant={showCompletedOrders ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowCompletedOrders(true)}
                    className="rounded-full w-full sm:w-auto"
                >
                    <History className="mr-2 h-3 w-3" /> History
                </Button>
            </div>

            <Card className="border border-gray-200 bg-white shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">PO #</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Placed By</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.filter(o => showCompletedOrders ? (o.status === 'completed' || o.status === 'cancelled') : (o.status !== 'completed' && o.status !== 'cancelled')).length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No pay orders found.</td></tr>
                            ) : orders.filter(o => showCompletedOrders ? (o.status === 'completed' || o.status === 'cancelled') : (o.status !== 'completed' && o.status !== 'cancelled')).map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    onClick={() => setViewingPayOrder(order)}
                                >
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900 font-semibold">#{order.orderNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.placedByUser?.name || order.placedByCustomerUser?.name}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.currency} {order.finalAmount || order.totalAmount}</td>
                                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                        <Select
                                            value={order.status}
                                            onValueChange={async (value) => {
                                                try {
                                                    await updateOrderStatus(activeStore.id, order.id, value);

                                                    const props: any = {
                                                        orderId: order.id,
                                                        oldStatus: order.status,
                                                        newStatus: value
                                                    }

                                                    if (value === 'completed' || value === 'cancelled') {
                                                        const created = new Date(order.createdAt).getTime()
                                                        const now = new Date().getTime()
                                                        const durationSeconds = Math.floor((now - created) / 1000)
                                                        props.duration_seconds = durationSeconds
                                                    }

                                                    analytics.capture('order_status_updated', props);

                                                    await loadOrders();
                                                    toast.success("Order status updated");
                                                } catch (err: any) {
                                                    toast.error("Failed to update status: " + err.message);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-[130px] h-8 text-xs font-medium rounded-full border-gray-200">
                                                <SelectValue>
                                                    <Badge variant={statusConfig[order.status]?.variant || "secondary"} className="h-5">
                                                        {statusConfig[order.status]?.label || order.status}
                                                    </Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(statusConfig).map(([value, { label }]) => (
                                                    <SelectItem key={value} value={value} className="text-xs">
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <PayOrderDialog
                order={viewingPayOrder}
                open={!!viewingPayOrder}
                onOpenChange={(open: boolean) => !open && setViewingPayOrder(null)}
            />
        </div>
    )
}
