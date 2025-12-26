"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Package, Tag, LogOut, Loader2, User } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchStores, fetchCustomers, fetchProducts, createCustomer, createUser, updateUser, getUserFromToken } from "@/lib/api"

const menuItems = [
  { icon: Users, label: "Customers", id: "customers" },
  { icon: Package, label: "Products", id: "products" },
  { icon: Tag, label: "Pricing", id: "pricing" },
  { icon: User, label: "Profile", id: "profile" },
]

export function StoreDashboard() {
  const [activeMenu, setActiveMenu] = useState("customers")
  const [stores, setStores] = useState<any[]>([])
  const [activeStore, setActiveStore] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        if (activeMenu === "customers") {
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
  }, [activeStore, activeMenu])

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
                onClick={() => setActiveMenu(item.id)}
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">
              {activeMenu === "customers" && "Customers"}
              {activeMenu === "products" && "Products"}
              {activeMenu === "pricing" && "Pricing Management"}
            </h1>
            <p className="mt-2 text-gray-500">
              {activeMenu === "customers" && "Manage your customer accounts and access"}
              {activeMenu === "products" && "View and organize your product catalog"}
              {activeMenu === "pricing" && "Configure pricing rules and customer-specific rates"}
            </p>
          </div>

          {/* Customers View */}
          {activeMenu === "customers" && (
            <div className="space-y-6">
              {/* Create Customer Form */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Add New Customer</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const name = formData.get('name') as string;
                  const email = formData.get('email') as string;
                  const password = formData.get('password') as string;

                  if (!name || !email || !password) return;

                  try {
                    // 1. Create Customer Entity
                    const customer = await createCustomer({ name, status: 'active' });

                    // 2. Create User Entity
                    await createUser({
                      email,
                      password,
                      role: 1, // CUSTOMER_ADMIN
                      storeId: activeStore.id,
                      customerId: customer.id,
                      name
                    });

                    // Refresh
                    const data = await fetchCustomers();
                    setCustomers(data);
                    form.reset();
                    alert("Customer created successfully!");
                  } catch (err: any) {
                    alert("Failed to create customer: " + err.message);
                  }
                }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input name="name" required placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Email</label>
                    <Input name="email" type="email" required placeholder="admin@acme.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Password</label>
                    <Input name="password" type="password" required placeholder="Secret123" minLength={8} />
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
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No customers found.</td></tr>
                      ) : customers.map((customer) => (
                        <tr key={customer.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-6 py-4 text-sm text-gray-900">{customer.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{customer.email || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || "-"}</td>
                          <td className="px-6 py-4 text-sm">
                            <Button variant="ghost" size="sm" className="text-blue-600">
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

          {/* Pricing View */}
          {activeMenu === "pricing" && (
            <div className="space-y-6">
              <div className="text-center text-gray-500">
                <p>Select a customer from the Customers section to manage their pricing</p>
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
