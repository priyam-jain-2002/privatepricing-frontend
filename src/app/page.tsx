"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
// ...
export default function StorefrontPage() {
  const router = useRouter()

  useEffect(() => {
    // 1. Check if already logged in
    const token = sessionStorage.getItem('access_token')
    const role = sessionStorage.getItem('user_role')

    if (token && role !== null) {
      const roleNum = Number(role)
      // Role 0 is Store Owner
      if (!isNaN(roleNum) && roleNum === 0) {
        router.push('/dashboard')
      } else {
        router.push('/storefront')
      }
    } else {
      // 2. Not logged in - check for subdomain
      const hostname = window.location.hostname;
      // Heuristic: 
      // - 'localhost' -> Root
      // - '*.localhost' -> Subdomain
      // - '*.domain.com' -> Subdomain (parts > 2)
      // - 'domain.com' -> Root
      const isLocalhostRoot = hostname === 'localhost';
      // For production, assume 2 parts is root (e.g. example.com). 
      // Adjust if using a domain like co.uk or similiar in future.
      const parts = hostname.split('.');
      const isSubdomain = !isLocalhostRoot && (hostname.endsWith('.localhost') || parts.length > 2);

      if (isSubdomain) {
        router.push('/storefront/login');
      } else {
        router.push('/auth/login');
      }
    }
  }, [router])

  // Show loader while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )


}
