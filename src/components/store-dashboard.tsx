"use client"
import { useState, useEffect } from "react"
import { Users, Package, ShoppingCart, User, Briefcase, Loader2 } from "lucide-react"
import { fetchStores } from "@/lib/api"
import { OrdersSection } from "./owner-dashboard/orders-section"
import { CustomersSection } from "./owner-dashboard/customers-section"
import { ProductsSection } from "./owner-dashboard/products-section"
import { TeamSection } from "./owner-dashboard/team-section"
import { ProfileSection } from "./owner-dashboard/profile-section"

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
  const [loading, setLoading] = useState(true)

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
              {/* Customers header is handled inside CustomersSection now to support sub-headers */}
              {activeMenu === "products" && "Products"}
              {activeMenu === "team" && "Team Management"}
              {activeMenu === "profile" && "Profile"}
            </h1>
          </div>

          {activeMenu === "orders" && activeStore && (
            <OrdersSection activeStore={activeStore} />
          )}

          {activeMenu === "customers" && activeStore && (
            <CustomersSection activeStore={activeStore} />
          )}

          {activeMenu === "products" && activeStore && (
            <ProductsSection
              activeStore={activeStore}
              stores={stores}
              setStores={setStores}
              setActiveStore={setActiveStore}
            />
          )}

          {activeMenu === "team" && activeStore && (
            <TeamSection activeStore={activeStore} />
          )}

          {activeMenu === "profile" && (
            <ProfileSection />
          )}

        </div>
      </div>
    </div>
  )
}
