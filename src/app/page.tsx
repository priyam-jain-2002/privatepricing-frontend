"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginPage } from "@/components/login-page"
import { Loader2 } from "lucide-react"
// ...
export default function StorefrontPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check if already logged in
    const token = sessionStorage.getItem('access_token')
    const role = sessionStorage.getItem('user_role')

    if (token && role) {
      if (Number(role) === 0) {
        router.push('/dashboard')
      } else {
        router.push('/storefront')
      }
    } else {
      setLoading(false);
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return <LoginPage />
}
