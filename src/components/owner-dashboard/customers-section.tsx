"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Settings, Plus, AlertTriangle } from "lucide-react"
import { fetchCustomers, createCustomer, fetchCustomerUsers, createCustomerUser, updateCustomerUser } from "@/lib/api"
import { toast } from "sonner"
import { EditCustomerDialog } from "../edit-customer-dialog"
import { CustomerPricingManagement } from "../customer-pricing-management"

interface CustomersSectionProps {
    activeStore: any
}

export function CustomersSection({ activeStore }: CustomersSectionProps) {
    const [customers, setCustomers] = useState<any[]>([])
    const [activeCustomer, setActiveCustomer] = useState<any>(null)
    const [editingCustomer, setEditingCustomer] = useState<any>(null)
    const [customerViewMode, setCustomerViewMode] = useState<'list' | 'admins' | 'pricing'>('list')
    const [customerAdmins, setCustomerAdmins] = useState<any[]>([])
    const [editingAdmin, setEditingAdmin] = useState<any>(null)

    useEffect(() => {
        loadCustomers()
    }, [activeStore])

    const loadCustomers = async () => {
        try {
            const data = await fetchCustomers()
            setCustomers(data)
        } catch (err) {
            console.error("Failed to fetch customers", err)
        }
    }

    // Sync activeCustomer when customers list updates
    useEffect(() => {
        if (activeCustomer && customers.length > 0) {
            const updated = customers.find(c => c.id === activeCustomer.id)
            if (updated) {
                if (JSON.stringify(updated) !== JSON.stringify(activeCustomer)) {
                    setActiveCustomer(updated)
                }
            }
        }
    }, [customers])

    // Load admins when entering admins view
    useEffect(() => {
        if (customerViewMode === 'admins' && activeCustomer) {
            loadCustomerAdmins(activeCustomer.id)
        }
    }, [customerViewMode, activeCustomer])

    const loadCustomerAdmins = async (customerId: string) => {
        try {
            const users = await fetchCustomerUsers(customerId)
            setCustomerAdmins(users)
        } catch (err) {
            console.error("Failed to load admins", err)
        }
    }

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const gstin = formData.get('gstin') as string;

        if (!name) return;

        try {
            await createCustomer({
                name,
                GSTIN: gstin || undefined, // Optional
                status: 'active'
            });

            await loadCustomers()
            form.reset();
            toast.success("Customer created successfully!");
        } catch (err: any) {
            if (err.message.includes("409")) {
                toast.error("Error: A customer with this name or GSTIN already exists.");
            } else {
                toast.error("Failed to create customer: " + err.message);
            }
        }
    }

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCustomer) return;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            await createCustomerUser(activeCustomer.id, {
                name,
                email,
                password,
                role: 1 // Customer Admin
            });
            await loadCustomerAdmins(activeCustomer.id);
            form.reset();
            toast.success("Admin created successfully!");
        } catch (err: any) {
            toast.error("Failed to create admin: " + err.message);
        }
    }

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAdmin || !activeCustomer) return;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const payload: any = { name, email };
            if (password) payload.password = password;

            await updateCustomerUser(activeCustomer.id, editingAdmin.id, payload);
            await loadCustomerAdmins(activeCustomer.id);
            setEditingAdmin(null);
            toast.success("User updated successfully!");
        } catch (err: any) {
            toast.error("Failed to update user: " + err.message);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-semibold text-gray-900">
                    {customerViewMode === 'list' ? "Customers" :
                        customerViewMode === 'admins' ? `Admins: ${activeCustomer?.name} ` :
                            `Pricing: ${activeCustomer?.name} `
                    }
                </h1>
                {/* Contextual Back Button */}
                {customerViewMode !== 'list' && (
                    <Button
                        variant="ghost"
                        className="text-gray-600 hover:bg-gray-100"
                        onClick={() => setCustomerViewMode('list')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customer List
                    </Button>
                )}
            </div>


            {/* LIST VIEW */}
            {customerViewMode === 'list' && (
                <div className="space-y-6">
                    {/* Add Customer Button */}
                    <div className="flex justify-end">
                        <Button onClick={() => setEditingCustomer({ isNew: true })}>
                            <Plus className="mr-2 h-4 w-4" /> Add New Customer
                        </Button>
                    </div>

                    <Card className="border border-gray-200 bg-white shadow-none">
                        <div className="overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">GSTIN</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Compliance</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No customers found.</td></tr>
                                    ) : customers.map((customer) => {
                                        // Compliance Check
                                        const missingBranches = !customer.branches || customer.branches.length === 0;
                                        const missingTerms = !customer.paymentTerms || !customer.deliveryTime;
                                        const hasWarning = missingBranches || missingTerms;

                                        return (
                                            <tr key={customer.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{customer.GSTIN || "-"}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                  ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {customer.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {hasWarning ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 cursor-help">
                                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                                        <span className="text-xs font-medium">Attention Needed</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs bg-slate-900 text-white border-slate-800">
                                                                    <p className="font-semibold mb-1">Missing Configuration:</p>
                                                                    <ul className="list-disc pl-4 space-y-1 text-xs">
                                                                        {missingBranches && <li>No branches configured</li>}
                                                                        {missingTerms && <li>Missing Payment Terms or Delivery Time</li>}
                                                                    </ul>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div> All Set
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActiveCustomer(customer);
                                                            setCustomerViewMode('admins');
                                                        }}
                                                    >
                                                        Manage Admins
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingCustomer(customer);
                                                        }}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActiveCustomer(customer);
                                                            setCustomerViewMode('pricing');
                                                        }}
                                                    >
                                                        Manage Pricing
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <EditCustomerDialog
                        customer={editingCustomer?.isNew ? null : editingCustomer}
                        open={!!editingCustomer}
                        onOpenChange={(open) => !open && setEditingCustomer(null)}
                        onUpdate={loadCustomers}
                    />
                </div>
            )
            }

            {/* MANAGE ADMINS VIEW */}
            {
                customerViewMode === 'admins' && activeCustomer && (
                    <div className="space-y-6">
                        {/* Edit User Dialog */}
                        <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit User: {editingAdmin?.name}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpdateAdmin} className="space-y-4 px-6 pb-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input name="name" required defaultValue={editingAdmin?.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input name="email" type="email" required defaultValue={editingAdmin?.email} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Password</label>
                                        <Input name="password" type="password" placeholder="Leave blank to keep" minLength={8} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setEditingAdmin(null)}>Cancel</Button>
                                        <Button type="submit">Update User</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Add User Form - Always Visible */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium mb-4">Add Customer Admin</h3>
                            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input name="name" required placeholder="John Admin" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input name="email" type="email" required placeholder="admin@client.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <Input name="password" type="password" required minLength={8} />
                                </div>
                                <Button type="submit">Create Admin</Button>
                            </form>
                        </div>

                        <Card className="border border-gray-200 bg-white shadow-none">
                            <CardHeader>
                                <CardTitle>Existing Admins</CardTitle>
                            </CardHeader>
                            <div className="overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerAdmins.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No admins found for this customer.</td></tr>
                                        ) : customerAdmins.map((user) => (
                                            <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize 
                                  ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} `}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right">
                                                    <Button variant="outline" size="sm" onClick={() => setEditingAdmin(user)}>Edit</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* MANAGE PRICING VIEW */}
            {
                customerViewMode === 'pricing' && activeCustomer && activeStore && (
                    <CustomerPricingManagement
                        storeId={activeStore.id}
                        customerId={activeCustomer.id}
                        customer={activeCustomer}
                    />
                )
            }
        </div>
    )
}
