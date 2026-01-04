"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function StorefrontPage() {
  const router = useRouter()

  useEffect(() => {
    // 1. Check if already logged in
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('user_role')

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
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';

      const parts = hostname.split('.');
      const rootParts = rootDomain.split('.');

      // Heuristic:
      // If hostname is exactly rootDomain (or localhost), it's root.
      // If hostname ends with .rootDomain, it's a subdomain.

      let isSubdomain = false;
      if (hostname === rootDomain || hostname === 'localhost') {
        isSubdomain = false;
      } else if (hostname.endsWith(`.${rootDomain}`)) {
        isSubdomain = true;
      } else {
        // Fallback for cases like 'sub.localhost' when rootDomain is 'localhost'
        isSubdomain = parts.length > rootParts.length;
      }

      if (isSubdomain) {
        router.push('/storefront/login');
      } else {
        router.push('/login');
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
