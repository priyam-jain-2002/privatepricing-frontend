"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Package, Tag, LogOut, Loader2, User, ChevronLeft, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchStores, fetchCustomers, fetchProducts, createCustomer, createUser, updateUser, getUserFromToken, fetchBranches, createBranch, fetchBranchUsers } from "@/lib/api"
import { CustomerPricingManagement } from "./customer-pricing-management"

const menuItems = [
  { icon: Users, label: "Customers", id: "customers" },
  { icon: Package, label: "Products", id: "products" },
  { icon: Tag, label: "Global Pricing", id: "pricing" }, // Changed label to differentiate
  { icon: User, label: "Profile", id: "profile" },
]

export function StoreDashboard() {
  const [activeMenu, setActiveMenu] = useState("customers")
  const [stores, setStores] = useState<any[]>([])
  const [activeStore, setActiveStore] = useState<any>(null)

  // Data States
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Sub-view States for Customer Management
  const [activeCustomer, setActiveCustomer] = useState<any>(null)
  const [customerViewMode, setCustomerViewMode] = useState<'list' | 'admins' | 'pricing'>('list')

  // Admin Management State
  const [customerAdmins, setCustomerAdmins] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      try {
        const storesData = await fetchStores()
        setStores(storesData)
        if (storesData.length > 0) {
          setActiveStore(storesData[0])
        }
      } catch (error) {
        console.error("Failed to fetch stores", error)
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
        }
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeStore, activeMenu, customerViewMode])

  // Load admins when entering admins view
  useEffect(() => {
    if (customerViewMode === 'admins' && activeCustomer) {
      loadCustomerAdmins(activeCustomer.id)
    }
  }, [customerViewMode, activeCustomer])

  const loadCustomerAdmins = async (customerId: string) => {
    try {
      // 1. Get branches
      const branches = await fetchBranches(customerId)
      if (branches.length === 0) {
        setCustomerAdmins([])
        return
      }

      // 2. Aggregate users from all branches (simplified for now, usually just Head Office)
      // For V0, let's just fetch from the first branch
      const branchId = branches[0].id
      const users = await fetchBranchUsers(customerId, branchId)
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

      const data = await fetchCustomers();
      setCustomers(data);
      form.reset();
      alert("Customer created successfully!");
    } catch (err: any) {
      if (err.message.includes("409")) {
        alert("Error: A customer with this name or GSTIN already exists.");
      } else {
        alert("Failed to create customer: " + err.message);
      }
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!activeCustomer) return;

    try {
      // 1. Ensure branch exists
      let branches = await fetchBranches(activeCustomer.id);
      let branchId;
      if (branches.length === 0) {
        const newBranch = await createBranch(activeCustomer.id, {
          name: 'Head Office',
          street: 'Main St',
          city: 'City',
          state: 'State',
          zip: '00000',
          country: 'Country'
        });
        branchId = newBranch.id;
      } else {
        branchId = branches[0].id; // Use first branch
      }

      // 2. Create User
      await createUser({
        email,
        password,
        role: 1, // CUSTOMER_ADMIN
        storeId: activeStore.id,
        customerId: activeCustomer.id,
        branchId: branchId, // Required
        name
      });

      // Refresh
      await loadCustomerAdmins(activeCustomer.id);
      form.reset();
      alert("Admin user created successfully!");
    } catch (err: any) {
      alert("Failed to create admin: " + err.message);
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

        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">

          {/* Global Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">
              {activeMenu === "customers" && (
                customerViewMode === 'list' ? "Customers" :
                  customerViewMode === 'admins' ? `Admins: ${activeCustomer?.name}` :
                    `Pricing: ${activeCustomer?.name}`
              )}
              {activeMenu === "products" && "Products"}
              {activeMenu === "pricing" && "Global Pricing Rules"}
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
                </div>
              )}

              {/* MANAGE ADMINS VIEW */}
              {customerViewMode === 'admins' && activeCustomer && (
                <div className="space-y-6">
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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerAdmins.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No admins found for this customer.</td></tr>
                          ) : customerAdmins.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 last:border-0">
                              <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.role === 1 ? 'Admin' : 'User'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* MANAGE PRICING VIEW */}
              {customerViewMode === 'pricing' && activeCustomer && (
                // TODO: Pass customerId and storeId to this component to fetch real pricing
                <CustomerPricingManagement />
              )}
            </>
          )}

          {/* ---------------- OTHER SECTIONS ---------------- */}

          {/* Products View */}
          {activeMenu === "products" && (
            <Card className="border border-gray-200 bg-white shadow-none">
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SKU</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Base Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No products found.</td></tr>
                    ) : products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.sku || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {product.basePrice ? `${product.currency || 'USD'} ${product.basePrice}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pricing View (Global/Legacy) */}
          {activeMenu === "pricing" && (
            <div className="space-y-6">
              <div className="text-center text-gray-500">
                <p>Select a customer from the Customers section to manage their specific pricing.</p>
              </div>
            </div>
          )}

          {/* Settings / Profile View */}
          {activeMenu === "profile" && (
            <div className="max-w-2xl">
              <Card className="border border-gray-200 bg-white shadow-none">
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your personal information and password.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const password = formData.get('password') as string;
                    const name = formData.get('name') as string;
                    const user = getUserFromToken();
                    const userId = user?.id;

                    if (!userId) return;

                    try {
                      const payload: any = {};
                      if (password) payload.password = password;
                      if (name) payload.name = name;

                      await updateUser(userId, payload);
                      alert("Profile updated successfully!");
                      form.reset();
                    } catch (err: any) {
                      alert("Failed to update profile: " + err.message);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <Input name="name" placeholder="John Doe" defaultValue={getUserFromToken()?.name || ''} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input name="password" type="password" placeholder="Leave empty to keep current" minLength={8} />
                    </div>
                    <Button type="submit">Save Changes</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
