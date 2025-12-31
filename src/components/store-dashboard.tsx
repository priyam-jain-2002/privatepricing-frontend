"use client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, Package, Tag, LogOut, Loader2, User, ChevronLeft, ArrowLeft, ShoppingCart, Check, X, Plus, History, Edit2, ExternalLink, Settings, Info, Briefcase, Mail, Shield, Calendar, Lock } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchStores, fetchCustomers, fetchProducts, createCustomer, updateCustomer, createUser, createCustomerUser, updateCustomerUser, updateUser, getUserFromToken, fetchBranches, createBranch, fetchBranchUsers, fetchCustomerUsers, fetchAllOrders, updateOrderStatus, updateProductPricing, createProduct, updateProduct, updateStore, fetchStoreUsers, fetchUser } from "@/lib/api"
import { CustomerPricingManagement } from "./customer-pricing-management"
import { OrderInvoiceDialog } from "./order-invoice-dialog"
import { EditCustomerDialog } from "./edit-customer-dialog"

const menuItems = [
  { icon: ShoppingCart, label: "Orders", id: "orders" },
  { icon: Users, label: "Customers", id: "customers" },
  { icon: Package, label: "Products", id: "products" },
  { icon: Briefcase, label: "Team", id: "team" },
  { icon: User, label: "Profile", id: "profile" },
]

export function StoreDashboard() {
  const [activeMenu, setActiveMenu] = useState("orders")
  const [stores, setStores] = useState<any[]>([])
  const [activeStore, setActiveStore] = useState<any>(null)

  // Data States
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [storeUsers, setStoreUsers] = useState<any[]>([]) // State for store users
  const [loading, setLoading] = useState(true)

  // Sub-view States for Customer Management
  const [activeCustomer, setActiveCustomer] = useState<any>(null)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [customerViewMode, setCustomerViewMode] = useState<'list' | 'admins' | 'pricing'>('list')

  // Admin Management State
  const [customerAdmins, setCustomerAdmins] = useState<any[]>([])
  const [editingAdmin, setEditingAdmin] = useState<any>(null)

  // Team Management State
  // Team Management State
  // storeUsers already declared above
  const [editingStoreUser, setEditingStoreUser] = useState<any>(null)

  // Profile State
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Order Management State
  const [showCompletedOrders, setShowCompletedOrders] = useState(false)

  // Product Management State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null) // For editing name/sku

  // Invoice State
  const [viewingInvoice, setViewingInvoice] = useState<any>(null)

  useEffect(() => {
    async function init() {
      const token = sessionStorage.getItem('access_token');

      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      try {
        const storesData = await fetchStores()
        setStores(storesData)
        if (storesData.length > 0) {
          setActiveStore(storesData[0])
        }
      } catch (error: any) {
        console.error("Failed to fetch stores", error)
        if (error.message.includes('401') || error.message.includes('403')) {
          window.location.href = '/auth/login';
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!activeStore) return

    async function fetchData() {
      setLoading(true)
      try {
        if (activeMenu === "customers" && customerViewMode === 'list') {
          const data = await fetchCustomers()
          setCustomers(data)
        } else if (activeMenu === "products") {
          const data = await fetchProducts()
          setProducts(data)
        } else if (activeMenu === "orders") {
          const data = await fetchAllOrders(activeStore.id)
          setOrders(data)
        } else if (activeMenu === "team") {
          const data = await fetchStoreUsers()
          setStoreUsers(data)
        } else if (activeMenu === "profile") {
          const tokenUser = getUserFromToken();
          if (tokenUser?.sub) {
            const userData = await fetchUser(tokenUser.sub);
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeStore, activeMenu, customerViewMode])

  // Sync activeCustomer when customers list updates
  useEffect(() => {
    if (activeCustomer && customers.length > 0) {
      const updated = customers.find(c => c.id === activeCustomer.id)
      if (updated) {
        // Only update if there are actual changes to avoid loops
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await createProduct({
        storeId: activeStore.id,
        name: formData.get('name'),
        sku: formData.get('sku'),
        basePrice: parseFloat(formData.get('basePrice') as string || '0'),
        baseFreight: parseFloat(formData.get('baseFreight') as string || '0'),
        cgst: parseFloat(formData.get('cgst') as string || '0'),
        sgst: parseFloat(formData.get('sgst') as string || '0'),
        currency: 'INR'
      });
      const data = await fetchProducts();
      setProducts(data);
      setIsAddProductOpen(false);
      form.reset();
      toast.success("Product created successfully!");
    } catch (err: any) {
      toast.error("Failed to create product: " + err.message);
    }
  }

  const handleUpdateProductDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await updateProduct(editingProduct.id, {
        name: formData.get('name'),
        sku: formData.get('sku'),
      });
      const data = await fetchProducts();
      setProducts(data);
      setEditingProduct(null);
      toast.success("Product updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update product: " + err.message);
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
      await loadCustomerAdmins(activeCustomer.id);
      setEditingAdmin(null);
      toast.success("User updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update user: " + err.message);
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

      const data = await fetchCustomers();
      setCustomers(data);
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

  const handleCreateStoreUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const roleStr = formData.get('role') as string;
    const roleId = parseInt(roleStr);

    try {
      await createUser({
        email,
        password,
        name,
        role: roleId,
        storeId: activeStore.id
      });

      const data = await fetchStoreUsers();
      setStoreUsers(data);
      form.reset();
      toast.success("Team member created successfully!");
    } catch (err: any) {
      toast.error("Failed to create user: " + err.message);
    }
  }

  const handleUpdateStoreUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoreUser) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    try {
      const payload: any = { name };
      if (password) payload.password = password;

      await updateUser(editingStoreUser.id, payload);

      const data = await fetchStoreUsers();
      setStoreUsers(data);
      setEditingStoreUser(null);
      toast.success("User updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update user: " + err.message);
    }
  }

  if (loading && !activeStore && stores.length === 0) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 p-6">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900">{activeStore?.name || "Select Store"}</h2>
          <p className="text-sm text-gray-500">{activeStore?.description || "Dashboard"}</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id)
                  setCustomerViewMode('list') // Reset sub-view logic
                  setActiveCustomer(null)
                  setEditingAdmin(null)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeMenu === item.id ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>


      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">

          {/* Global Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">
              {activeMenu === "orders" && "Orders"}
              {activeMenu === "customers" && (
                customerViewMode === 'list' ? "Customers" :
                  customerViewMode === 'admins' ? `Admins: ${activeCustomer?.name} ` :
                    `Pricing: ${activeCustomer?.name} `
              )}
              {activeMenu === "products" && "Products"}
              {activeMenu === "profile" && "Profile"}
            </h1>

            {/* Contextual Back Button */}
            {activeMenu === "customers" && customerViewMode !== 'list' && (
              <Button
                variant="ghost"
                className="mt-2 -ml-2 text-gray-600 hover:bg-gray-100"
                onClick={() => setCustomerViewMode('list')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customer List
              </Button>
            )}
          </div>

          {/* ---------------- CUSTOMERS SECTION ---------------- */}
          {activeMenu === "customers" && (
            <>
              {/* LIST VIEW */}
              {customerViewMode === 'list' && (
                <div className="space-y-6">
                  {/* Create Customer Form */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Add New Customer</h3>
                    <form onSubmit={handleCreateCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company Name *</label>
                        <Input name="name" required placeholder="Acme Corp" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">GSTIN (Optional)</label>
                        <Input name="gstin" placeholder="22AAAAA0000A1Z5" />
                      </div>
                      <Button type="submit">Create Customer</Button>
                    </form>
                  </div>

                  <Card className="border border-gray-200 bg-white shadow-none">
                    <div className="overflow-hidden">
                      <table className="w-full">

                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">GSTIN</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No customers found.</td></tr>
                          ) : customers.map((customer) => (
                            <tr key={customer.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{customer.GSTIN || "-"}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                  ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {customer.status}
                                </span>
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <EditCustomerDialog
                    customer={editingCustomer}
                    open={!!editingCustomer}
                    onOpenChange={(open) => !open && setEditingCustomer(null)}
                    onUpdate={async () => {
                      const data = await fetchCustomers()
                      setCustomers(data)
                    }}
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
                        <form onSubmit={handleUpdateAdmin} className="space-y-4">
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
            </>
          )}

          {/* ---------------- OTHER SECTIONS ---------------- */}

          {/* Products View */}
          {
            activeMenu === "products" && (
              <div className="space-y-4">
                <OperationCostDialog
                  store={activeStore}
                  onUpdate={(newPercentage) => {
                    const updatedStore = { ...activeStore, operationCostPercentage: newPercentage };
                    const updatedStores = stores.map(s => s.id === activeStore.id ? updatedStore : s);
                    setStores(updatedStores);
                    setActiveStore(updatedStore);
                  }}
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => document.getElementById('operation-cost-trigger')?.click()}>
                      <Settings className="mr-2 h-4 w-4" />
                      Operation Cost ({activeStore?.operationCostPercentage || 10}%)
                    </Button>
                  </div>
                  <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </div>

                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProduct} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Product Name</label>
                        <Input name="name" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">SKU</label>
                          <Input name="sku" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Base Price</label>
                          <Input name="basePrice" type="number" step="0.01" min="0" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Incoming Freight</label>
                        <Input name="baseFreight" type="number" step="0.01" min="0" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CGST (%)</label>
                          <Input name="cgst" type="number" step="0.01" min="0" defaultValue="0" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">SGST (%)</label>
                          <Input name="sgst" type="number" step="0.01" min="0" defaultValue="0" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Product</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Product Details</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProductDetails} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Product Name</label>
                        <Input name="name" defaultValue={editingProduct?.name} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">SKU</label>
                        <Input name="sku" defaultValue={editingProduct?.sku} required />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Card className="border border-gray-200 bg-white shadow-none">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SKU</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Base Price (Global)</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Incoming Freight</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">CGST %</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SGST %</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    Cost Price
                                    <Info className="h-4 w-4 text-gray-400" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Formula: Base Price + Incoming Freight + (Base Price * Operations Cost %)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr><td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No products found.</td></tr>
                        ) : products.map((product) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            onUpdate={async () => {
                              const data = await fetchProducts()
                              setProducts(data)
                            }}
                            onEditDetails={() => setEditingProduct(product)}
                            operationCostPercentage={activeStore?.operationCostPercentage || 0}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <p className="text-sm text-gray-500 italic mt-2">* Cost Price includes operations cost</p>
              </div>
            )
          }

          {/* ORDERS VIEW */}
          {
            activeMenu === "orders" && (
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
                                className={`text - xs font - medium rounded - full px - 2 py - 1 border - 0 ring - 1 ring - inset focus: ring - 2 
                              ${order.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    order.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                      'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                  } `}
                                value={order.status}
                                onChange={async (e) => {
                                  try {
                                    await updateOrderStatus(activeStore.id, order.id, e.target.value);
                                    const data = await fetchAllOrders(activeStore.id);
                                    setOrders(data);
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

                {/* Invoice Dialog */}
                <OrderInvoiceDialog
                  order={viewingInvoice}
                  open={!!viewingInvoice}
                  onOpenChange={(open) => !open && setViewingInvoice(null)}
                />
              </div>
            )
          }



          {/* TEAM VIEW */}
          {activeMenu === "team" && (
            <div className="space-y-6">
              {/* Add Team Member Form */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Add Team Member</h3>
                <form onSubmit={handleCreateStoreUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input name="name" required placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input name="email" type="email" required placeholder="manager@store.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input name="password" type="password" required minLength={8} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      name="role"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      defaultValue="4"
                    >
                      <option value="4">Store Manager</option>
                    </select>
                  </div>
                  <Button type="submit">Add Member</Button>
                </form>
              </div>

              <Card className="border border-gray-200 bg-white shadow-none">
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage users who have access to this store.</CardDescription>
                </CardHeader>
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeUsers.filter(u => u.role === 0 || u.role === 4).length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No team members found.</td></tr>
                      ) : storeUsers.filter(u => u.role === 0 || u.role === 4).map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.role === 0 ? 'Store Owner' :
                              user.role === 4 ? 'Store Manager' :
                                user.role === 3 ? 'Branch User' :
                                  user.role === 1 ? 'Customer Admin' : 'Unknown'}
                          </td>

                          <td className="px-6 py-4 text-sm text-right">
                            {user.role !== 0 && ( /* Cannot edit Store Owner from here usually, or checking against current user id */
                              <Button variant="outline" size="sm" onClick={() => setEditingStoreUser(user)}>Edit</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Edit Store User Dialog */}
              <Dialog open={!!editingStoreUser} onOpenChange={(open) => !open && setEditingStoreUser(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateStoreUser} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input name="name" defaultValue={editingStoreUser?.name} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input name="password" type="password" placeholder="Leave blank to keep" minLength={8} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setEditingStoreUser(null)}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Settings / Profile View */}
          {
            activeMenu === "profile" && (
              <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} />
            )
          }
        </div >
      </div >
    </div >
  )

}

function ProductRow({ product, onUpdate, onEditDetails, operationCostPercentage }: { product: any, onUpdate: () => void, onEditDetails: () => void, operationCostPercentage: number }) {
  const [basePrice, setBasePrice] = useState(product.basePrice || '')
  const [baseFreight, setBaseFreight] = useState(product.baseFreight || '')
  const [cgst, setCgst] = useState(product.cgst || '')
  const [sgst, setSgst] = useState(product.sgst || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = async () => {
    try {
      const calculatedCostPrice = (parseFloat(basePrice || '0') + parseFloat(baseFreight || '0') + (parseFloat(basePrice || '0') * (operationCostPercentage / 100)))

      await updateProductPricing(product.id, {
        basePrice: parseFloat(basePrice),
        baseFreight: parseFloat(baseFreight || '0'),
        costPrice: parseFloat(calculatedCostPrice.toFixed(2)),
        cgst: parseFloat(cgst || '0'),
        sgst: parseFloat(sgst || '0')
      })
      setIsEditing(false)
      onUpdate()
      toast.success("Pricing updated successfully")
    } catch (err: any) {
      toast.error("Failed to update pricing: " + err.message)
    }
  }

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        <div className="flex items-center gap-2">
          {product.name}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={onEditDetails}>
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{product.sku || "-"}</td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {isEditing ? (
          <Input
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="h-8 w-24"
          />
        ) : (
          <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
            {product.currency || 'INR'} {product.basePrice || 0}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {isEditing ? (
          <Input
            type="number"
            value={baseFreight}
            onChange={(e) => setBaseFreight(e.target.value)}
            className="h-8 w-24"
          />
        ) : (
          <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
            {product.currency || 'INR'} {product.baseFreight || 0}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {isEditing ? (
          <Input
            type="number"
            value={cgst}
            onChange={(e) => setCgst(e.target.value)}
            className="h-8 w-20"
          />
        ) : (
          <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
            {product.cgst || 0}%
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {isEditing ? (
          <Input
            type="number"
            value={sgst}
            onChange={(e) => setSgst(e.target.value)}
            className="h-8 w-20"
          />
        ) : (
          <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline decoration-dashed decoration-gray-400">
            {product.sgst || 0}%
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 font-medium" title={`Formula: Base Price + Incoming Freight + (Base Price * ${operationCostPercentage}%)`}>
        {product.currency || 'INR'} {(parseFloat(basePrice || '0') + parseFloat(baseFreight || '0') + (parseFloat(basePrice || '0') * (operationCostPercentage / 100))).toFixed(2)}
      </td>
      <td className="px-6 py-4 text-sm text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Check className="h-4 w-4" /></Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </td>
    </tr>
  )
}

function OperationCostDialog({ store, onUpdate }: { store: any, onUpdate: (val: number) => void }) {
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


function ProfileSection({ currentUser, setCurrentUser }: { currentUser: any, setCurrentUser: (user: any) => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize name
  useEffect(() => {
    // Note: name is not usually in the token payload, so this fallback is likely just undefined
    const initialName = currentUser?.name || ''
    setName(initialName)
  }, [currentUser])

  // Get other user details safely
  const userRole = currentUser?.role === 0 ? 'Store Owner' :
    currentUser?.role === 4 ? 'Store Manager' :
      currentUser?.role === 3 ? 'Branch User' :
        currentUser?.role === 1 ? 'Customer Admin' : 'User';

  const userEmail = currentUser?.email || 'N/A'; // Email is not reliably in token payload either based on auth.service
  const joinedDate = currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';
  const userStatus = currentUser?.status || 'active';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokenUser = getUserFromToken();
    // Prefer currentUser.id (loaded from DB), fallback to token sub
    const userId = currentUser?.id || tokenUser?.sub;

    if (!userId) {
      toast.error("User session invalid. Please log in again.");
      return;
    }

    setLoading(true)
    try {
      const payload: any = {};
      if (password) payload.password = password;
      if (name && name !== currentUser?.name) payload.name = name;

      if (Object.keys(payload).length === 0) {
        toast.info("Profile is up to date.");
        setLoading(false);
        return;
      }

      await updateUser(userId, payload);
      const updatedUser = await fetchUser(userId);
      setCurrentUser(updatedUser);
      toast.success("Profile updated successfully!");

      setPassword('');
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Profile Header */}
      <div className="flex items-center gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold border-4 border-white shadow-sm">
          {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <User className="h-10 w-10" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{name || 'User'}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {userRole}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {userEmail}</span>
          </div>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => {
              sessionStorage.clear();
              window.location.href = '/auth/login';
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Personal Information Card */}
          <Card className="border border-gray-200 bg-white shadow-none h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Manage your public profile details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Email Address
                  <span className="text-xs text-gray-400 font-normal ml-auto flex items-center gap-1"><Lock className="h-3 w-3" /> Read-only</span>
                </label>
                <Input
                  value={userEmail}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 uppercase font-semibold">Role</label>
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs box-decoration-clone">{userRole}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                  <div className="font-medium text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                        ${userStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {userStatus}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-500 uppercase font-semibold">Joined On</label>
                  <div className="font-medium text-sm flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {joinedDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border border-gray-200 bg-white shadow-none h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Change Password</h4>
                  <p className="text-xs text-yellow-700">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Enter new password to change"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Leave blank if you don't want to change it.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={loading} size="lg" className="min-w-[150px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

