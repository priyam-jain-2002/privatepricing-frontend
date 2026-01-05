"use client"

import { useStorefront } from "@/components/storefront/storefront-context"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createStorefrontOrder } from "@/lib/api"
import { Package, ShoppingCart, Loader2, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

export default function StorefrontCheckoutPage() {
    const {
        products,
        setProducts, // Needed to clear cart
        setTotalItems, // Needed to update badge
        authContext,
        accessToken,
        storeId,
        user,
        customerDetails,
        branches,
        updateQuantity,
        formatCurrency,
        loading: contextLoading
    } = useStorefront()

    const router = useRouter()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedBillingBranch, setSelectedBillingBranch] = useState<string>("")
    const [selectedShippingBranch, setSelectedShippingBranch] = useState<string>("")
    const [customerPoNumber, setCustomerPoNumber] = useState<string>("")

    // Cart Items
    const orderItems = products.filter(p => p.quantity > 0)

    // Redirect if cart empty? optional, but good UX.
    // useEffect(() => {
    //     if (!contextLoading && orderItems.length === 0) {
    //          router.push('/storefront/products')
    //     }
    // }, [orderItems.length, contextLoading])


    // Calculate Totals
    const calculateTotals = () => {
        let baseTotal = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;

        const cgstRate = 9.00;
        const sgstRate = 9.00;

        orderItems.forEach(item => {
            const itemBase = item.price * item.quantity;
            baseTotal += itemBase;
            cgstTotal += (itemBase * cgstRate) / 100;
            sgstTotal += (itemBase * sgstRate) / 100;
        });

        return { baseTotal, cgstTotal, sgstTotal, finalTotal: baseTotal + cgstTotal + sgstTotal };
    }

    const { baseTotal, cgstTotal, sgstTotal, finalTotal } = calculateTotals();
    const orderCurrency = orderItems[0]?.currency || 'INR'

    const confirmOrder = async () => {
        if (!selectedBillingBranch || !selectedShippingBranch) {
            toast.error("Please select both Billing and Shipping branches.");
            return;
        }

        try {
            setIsSubmitting(true)
            const payload: any = {
                items: orderItems.map(p => ({
                    productId: p.id,
                    quantity: p.quantity
                })),
                billingBranchId: selectedBillingBranch,
                shippingBranchId: selectedShippingBranch,
                customerPoNumber: customerPoNumber || null,
            }

            if (user?.role === 0) {
                payload.placedByUserId = user.id;
            } else {
                payload.placedByCustomerUserId = user?.id;
            }

            const order = await createStorefrontOrder(storeId!, authContext!.customer!.id, authContext!.branch?.id, payload)

            toast.success(`Pay Order #${order.orderNumber} created successfully!`, {
                description: `Order for ${orderItems.length} items submitted.`
            })

            // Clear Cart
            setProducts(prev => prev.map(p => ({ ...p, quantity: 0 })))

            // Redirect to Orders
            router.push('/storefront/orders')

        } catch (err) {
            console.error("Failed to place order", err)
            toast.error("Failed to place order. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (contextLoading) return null;

    return (
        <>
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
                        Review & Confirm
                    </h1>
                    <p className="mt-4 text-lg text-slate-500">
                        Review your items and confirm your purchase order details.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Notes / PO Block */}
                        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                                <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Order Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Customer PO Number</label>
                                    <Input
                                        placeholder="e.g. PO-2024-001"
                                        value={customerPoNumber}
                                        onChange={(e) => setCustomerPoNumber(e.target.value)}
                                        className="h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-400 font-medium">Add your internal reference number for this order.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                            {customerDetails?.isBillToSameAsShipTo ? "Billing & Shipping Branch" : "Billing Branch"}
                                        </label>
                                        <Select
                                            value={selectedBillingBranch}
                                            onValueChange={(val) => {
                                                setSelectedBillingBranch(val);
                                                if (customerDetails?.isBillToSameAsShipTo) {
                                                    setSelectedShippingBranch(val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-base shadow-sm">
                                                <SelectValue placeholder="Select branch..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {!customerDetails?.isBillToSameAsShipTo && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Shipping Branch</label>
                                            <Select
                                                value={selectedShippingBranch}
                                                onValueChange={(val) => setSelectedShippingBranch(val)}
                                            >
                                                <SelectTrigger className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-base shadow-sm">
                                                    <SelectValue placeholder="Select shipping branch..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches.map(b => (
                                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Address Previews */}
                            {(selectedBillingBranch || selectedShippingBranch) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    {selectedBillingBranch && (
                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 transition-all">
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 flex-shrink-0">
                                                <MapPin className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Billing Address</p>
                                                <p className="font-bold text-slate-900 text-base">{branches.find(b => b.id === selectedBillingBranch)?.name}</p>
                                                <p className="text-sm text-slate-500 whitespace-pre-wrap mt-2 leading-relaxed">{branches.find(b => b.id === selectedBillingBranch)?.address || 'No address provided'}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedShippingBranch && !customerDetails?.isBillToSameAsShipTo && (
                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 transition-all">
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 flex-shrink-0">
                                                <MapPin className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Shipping Address</p>
                                                <p className="font-bold text-slate-900 text-base">{branches.find(b => b.id === selectedShippingBranch)?.name}</p>
                                                <p className="text-sm text-slate-500 whitespace-pre-wrap mt-2 leading-relaxed">{branches.find(b => b.id === selectedShippingBranch)?.address || 'No address provided'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Review Items</h2>
                            <Link href="/storefront/products">
                                <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    Add more items
                                </Button>
                            </Link>
                        </div>

                        {orderItems.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-4">
                                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                    <ShoppingCart className="h-10 w-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                                <Link href="/storefront/products">
                                    <Button>View Catalog</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orderItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">{item.name}</span>
                                                        {item.productSku && <span className="text-xs text-gray-400">SKU: {item.productSku}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-1 w-fit mx-auto border border-gray-100 shadow-sm">
                                                        <button
                                                            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >-</button>
                                                        <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                                                        <button
                                                            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right font-medium text-gray-600">
                                                    {formatCurrency(item.price, item.currency)}
                                                </td>
                                                <td className="px-6 py-6 text-right font-bold text-gray-900">
                                                    {formatCurrency(item.price * item.quantity, item.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Summary & Actions */}
                    <div className="space-y-6 lg:sticky lg:top-24">
                        <Card className="border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col bg-white">
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">Order Summary</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(baseTotal, orderCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>CGST (9%)</span>
                                        <span>{formatCurrency(cgstTotal, orderCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>SGST (9%)</span>
                                        <span>{formatCurrency(sgstTotal, orderCurrency)}</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</span>
                                            <span className="text-3xl font-black text-blue-600">{formatCurrency(finalTotal, orderCurrency)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Summary */}
                            {customerDetails && (
                                <div className="px-8 py-6 bg-amber-50/50 border-t border-amber-100 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                                        <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Agreed Commercials</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-amber-600 font-bold uppercase">Payment</span>
                                            <span className="text-sm font-bold text-amber-900">{customerDetails.paymentTerms ? `Net ${customerDetails.paymentTerms} Days` : 'Standard'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-amber-600 font-bold uppercase">Delivery</span>
                                            <span className="text-sm font-bold text-amber-900">{customerDetails.deliveryTime ? `${customerDetails.deliveryTime} Days` : 'Standard'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-8 pt-4">
                                <Button
                                    onClick={confirmOrder}
                                    disabled={isSubmitting || orderItems.length === 0 || !selectedBillingBranch || !selectedShippingBranch}
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg transition-all duration-200 rounded-lg"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>PROCESSING...</span>
                                        </div>
                                    ) : (
                                        "Place Purchase Order"
                                    )}
                                </Button>
                                <Link href="/storefront/products">
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-3 h-10 text-gray-500 font-medium hover:text-red-600 hover:bg-red-50 transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancel and Return to Catalog
                                    </Button>
                                </Link>
                            </div>
                        </Card>

                        {/* Trust/Policy Card */}
                        <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
                            <div className="h-2 w-2 mt-2 bg-blue-400 rounded-full flex-shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                <span className="font-semibold block mb-0.5 text-blue-900">Formal Order Protocol</span>
                                By placing this order, you confirm a binding purchase agreement. An official copy will be emailed to your procurement department.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
