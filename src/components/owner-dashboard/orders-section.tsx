"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { History, Plus, Search, Filter, Pencil, ArrowRight } from "lucide-react"
import { fetchAllOrders, updateOrderStatus, fetchStoreStats, getUserFromToken } from "@/lib/api"
import { PayOrderDialog } from "../order-invoice-dialog"
import { analytics } from "@/lib/analytics"
import { toast } from "sonner"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"

// Select imports removed
import { Badge } from "@/components/ui/badge"

import { CreateOrderDialog } from "./create-order-dialog"
import { STATUS_CONFIG } from "@/lib/order-status"

interface OrdersSectionProps {
    activeStore: any
}



export function OrdersSection({ activeStore }: OrdersSectionProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [orders, setOrders] = useState<any[]>([])
    const [showCreateOrder, setShowCreateOrder] = useState(false)
    const [editingOrder, setEditingOrder] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<'active' | 'requested' | 'pending' | 'processing' | 'shipped' | 'pi' | 'history'>('active')
    const [stats, setStats] = useState<{ requestedCount: number } | null>(null)
    const [dialogTab, setDialogTab] = useState<"details" | "documents">("details")
    const [requiredDocType, setRequiredDocType] = useState<string | undefined>(undefined)
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: number } | null>(null)

    // URL State
    const activeOrderId = searchParams.get('orderId')

    const viewingPayOrder = useMemo(() => {
        if (!activeOrderId || orders.length === 0) return null
        return orders.find(o => o.id === activeOrderId) || null
    }, [activeOrderId, orders])

    useEffect(() => {
        if (activeStore) {
            loadOrders()
            loadStats()
        }
    }, [activeStore, activeTab]) // Reload when tab changes

    const loadStats = async () => {
        try {
            const data = await fetchStoreStats(activeStore.id)
            setStats(data)
        } catch (err) {
            console.error("Failed to fetch stats", err)
        }
    }

    const loadOrders = async () => {
        try {
            let statuses: number[] = [];
            switch (activeTab) {
                case 'active': statuses = [1, 2, 3, 4]; break;
                case 'requested': statuses = [0]; break;
                case 'pending': statuses = [1]; break;
                case 'processing': statuses = [2]; break;
                case 'shipped': statuses = [3]; break;
                case 'pi': statuses = [4]; break;
                case 'history': statuses = [5, 6]; break;
                default: statuses = [1, 2, 3, 4]; break;
            }
            const data = await fetchAllOrders(activeStore.id, statuses)
            setOrders(data)
        } catch (err) {
            console.error("Failed to fetch orders", err)
        }
    }

    const setViewingPayOrder = (order: any | null, tab?: "details" | "documents") => {
        if (tab) setDialogTab(tab);
        else setDialogTab("details");

        const params = new URLSearchParams(searchParams.toString())
        if (order) {
            params.set('orderId', order.id)
        } else {
            params.delete('orderId')
            setRequiredDocType(undefined)
            setPendingStatusUpdate(null) // Clear pending on close
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleOrderUpdated = async (uploadedType?: string) => {
        await loadOrders(); // Refresh orders

        // Check for Pending Status Update
        if (pendingStatusUpdate && uploadedType && uploadedType === requiredDocType && viewingPayOrder) {
            if (pendingStatusUpdate.id === viewingPayOrder.id) {
                // Add a small delay so user sees the "Upload Successful" state
                setTimeout(async () => {
                    try {
                        await updateOrderStatus(activeStore.id, pendingStatusUpdate.id, pendingStatusUpdate.status);
                        toast.success(`Document verified. Order moved to ${STATUS_CONFIG[pendingStatusUpdate.status]?.label}.`);
                        setViewingPayOrder(null); // Close dialog
                        setPendingStatusUpdate(null);
                        loadOrders(); // Refresh again to show new status
                    } catch (error) {
                        console.error("Auto-update status failed", error);
                        toast.error("Failed to update status automatically.");
                    }
                }, 500);
            }
        }
    }

    // Filter Logic
    // Filter Logic (Search only, status is server-side)
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // 1. Search Filter
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                (order.orderNumber?.toString() || "").includes(query) ||
                (order.customer?.name || "").toLowerCase().includes(query) ||
                (order.customerPoNumber || "").toLowerCase().includes(query) ||
                (order.finalAmount?.toString() || "").includes(query);

            return matchesSearch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [orders, searchQuery]);


    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-4">
                {/* Top Bar: Search and Add Order */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setShowCreateOrder(true)
                            analytics.capture('order_create_started', {
                                store_id: activeStore.id,
                                actor_role: 'store_team'
                            })
                        }}
                        className="rounded-full w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Order
                    </Button>
                </div>

                {/* Filter Pills (Production Grade) */}
                <div className="pb-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Requested (With Red Dot) */}
                        <button
                            onClick={() => setActiveTab('requested')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'requested'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            Requests
                            {stats && stats.requestedCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </button>

                        {/* Active (Default) */}
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'active'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            Active
                        </button>

                        {/* Granular Statuses */}
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'pending'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('processing')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'processing'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            Processing
                        </button>
                        <button
                            onClick={() => setActiveTab('shipped')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'shipped'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            Shipped
                        </button>
                        <button
                            onClick={() => setActiveTab('pi')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'pi'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            Pending Invoice
                        </button>

                        {/* History */}
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`
                                relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out rounded-full border
                                ${activeTab === 'history'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md active:scale-95"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                }
                            `}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            <Card className="border border-gray-200 bg-white shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
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
                            {filteredOrders.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No orders found.</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    onClick={() => setViewingPayOrder(order)}
                                >
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900 font-semibold">
                                        #{order.orderNumber}
                                        {order.customerPoNumber && (
                                            <span className="block text-xs text-gray-500 font-sans mt-0.5">PO: {order.customerPoNumber}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.placedByUser?.name || order.placedByCustomerUser?.name}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.currency} {order.finalAmount || order.totalAmount}</td>
                                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={STATUS_CONFIG[order.status]?.variant || "secondary"} className="h-6 px-2.5 text-xs font-medium border-0">
                                                {STATUS_CONFIG[order.status]?.label || order.status}
                                            </Badge>

                                            {/* One-Click Next Status Button */}
                                            {(() => {
                                                const getNextStatus = (current: any) => {
                                                    const statusInt = parseInt(current);
                                                    switch (statusInt) {
                                                        case 0: return 1; // Requested -> Pending
                                                        case 1: return 2; // Pending -> Processing
                                                        case 2: return 3; // Processing -> Shipped
                                                        case 3: return 4; // Shipped -> PI
                                                        case 4: return 5; // PI -> Completed
                                                        default: return null;
                                                    }
                                                }
                                                // Force parse to ensure we don't have string/number mismatch
                                                const statusInt = parseInt(order.status);
                                                const nextStatus = getNextStatus(statusInt);

                                                if (nextStatus !== null) {
                                                    const nextLabel = STATUS_CONFIG[nextStatus]?.label;
                                                    return (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs gap-1.5 px-3 hover:bg-primary hover:text-primary-foreground border-dashed border-gray-300"
                                                            title={`Move to ${nextLabel}`}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();

                                                                // Document Check Logic
                                                                // 3 = Shipped (Requires Challan)
                                                                // 4 = PI (Requires GRN)
                                                                if (nextStatus === 3) {
                                                                    const hasChallan = order.receivings?.some((d: any) => d.type === 'challan');
                                                                    if (!hasChallan) {
                                                                        toast.error("Please upload a Challan to mark as Shipped");
                                                                        setRequiredDocType('challan');
                                                                        setPendingStatusUpdate({ id: order.id, status: nextStatus });
                                                                        setViewingPayOrder(order, "documents");
                                                                        return;
                                                                    }
                                                                } else if (nextStatus === 4) {
                                                                    const hasGrn = order.receivings?.some((d: any) => d.type === 'grn');
                                                                    if (!hasGrn) {
                                                                        toast.error("Please upload a GRN to mark as PI");
                                                                        setRequiredDocType('grn');
                                                                        setPendingStatusUpdate({ id: order.id, status: nextStatus });
                                                                        setViewingPayOrder(order, "documents");
                                                                        return;
                                                                    }
                                                                }

                                                                try {
                                                                    await updateOrderStatus(activeStore.id, order.id, nextStatus);

                                                                    // Analytics
                                                                    const props: any = {
                                                                        orderId: order.id,
                                                                        oldStatus: order.status,
                                                                        newStatus: nextStatus,
                                                                        method: 'one_click'
                                                                    }

                                                                    if (nextStatus === 5) {
                                                                        const created = new Date(order.createdAt).getTime()
                                                                        const now = new Date().getTime()
                                                                        const durationSeconds = Math.floor((now - created) / 1000)
                                                                        props.duration_seconds = durationSeconds
                                                                    }

                                                                    analytics.capture('order_status_updated', props);

                                                                    if (nextStatus === 5) {
                                                                        analytics.capture('order_delivered', {
                                                                            store_id: activeStore.id,
                                                                            order_id: order.id,
                                                                            actor_role: 'store_team'
                                                                        })
                                                                    }

                                                                    await loadOrders();
                                                                    if (activeTab === 'requested') loadStats();
                                                                    toast.success(`Order moved to ${nextLabel}`);

                                                                } catch (err: any) {
                                                                    toast.error(err.message);
                                                                }
                                                            }}
                                                        >
                                                            <span>Move to {nextLabel}</span>
                                                            <ArrowRight className="h-3 w-3" />
                                                        </Button>
                                                    )
                                                }
                                                return null;
                                            })()}



                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-black"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingOrder(order);
                                                    setShowCreateOrder(true);
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card >

            {viewingPayOrder && (
                <PayOrderDialog
                    order={viewingPayOrder}
                    open={!!viewingPayOrder}
                    onOpenChange={(open: boolean) => !open && setViewingPayOrder(null)}
                    onOrderUpdated={handleOrderUpdated}
                    canUploadDocuments={true}
                    initialTab={dialogTab}
                    requiredDocumentType={requiredDocType}
                    userRole={getUserFromToken()?.role}
                />
            )}

            <CreateOrderDialog
                open={showCreateOrder}
                onOpenChange={(open) => {
                    setShowCreateOrder(open)
                    if (!open) setEditingOrder(null)
                }}
                onOrderCreated={loadOrders}
                initialOrder={editingOrder}
            />
        </div >
    )
}
