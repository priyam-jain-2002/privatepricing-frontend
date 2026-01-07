"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/landing-page/navbar"
import { Hero } from "@/components/landing-page/hero"
import { TraitsGrid } from "@/components/landing-page/traits-grid"
import { Perspective } from "@/components/landing-page/perspective"
import { Audience } from "@/components/landing-page/audience"
import { Footer } from "@/components/landing-page/footer"
import { LandingLayout } from "@/components/landing-page/landing-layout"
import { DemoSection } from "@/components/landing-page/demo-section"
import { SectionTracker } from "@/components/landing-page/section-tracker"

export default function StorefrontPage() {
  const router = useRouter()
  const [checkingSubdomain, setCheckingSubdomain] = useState(true)

  useEffect(() => {
    // Check hostname to see if we are on a subdomain
    const hostname = window.location.hostname
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost'

    const parts = hostname.split('.')
    const rootParts = rootDomain.split('.')

    // Heuristic:
    // If hostname is exactly rootDomain (or localhost), it's root.
    // If hostname ends with .rootDomain, it's a subdomain.

    let isSubdomain = false
    if (hostname === rootDomain || hostname === 'opbase.in' || hostname.startsWith('www.') || hostname === 'localhost') {
      isSubdomain = false
    } else if (hostname.endsWith(`.${rootDomain}`)) {
      isSubdomain = true
    } else {
      // Fallback for cases like 'sub.localhost' when rootDomain is 'localhost'
      isSubdomain = parts.length > rootParts.length
    }

    if (isSubdomain) {
      // Subdomain Logic: Check auth or redirect to storefront login
      const token = localStorage.getItem('access_token')
      const role = localStorage.getItem('user_role')

      if (token && role !== null) {
        const roleNum = Number(role)
        // If logged in as Store Owner (0) but on subdomain -> maybe redirect to dashboard? 
        // Or keep them on storefront if they want? 
        // Existing logic sent owners to dashboard and others to storefront.
        if (!isNaN(roleNum) && roleNum === 0) {
          router.push('/dashboard')
        } else {
          router.push('/storefront')
        }
      } else {
        router.push('/storefront/login')
      }
    } else {
      setCheckingSubdomain(false)
    }
  }, [router])

  useEffect(() => {
    if (!checkingSubdomain && window.location.hash) {
      const id = window.location.hash.substring(1)
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [checkingSubdomain])

  // If we are strictly checking for subdomain redirect, show loader.
  // Once we determine it is NOT a subdomain, we show the landing page.
  if (checkingSubdomain) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <LandingLayout>
      <Navbar />
      <SectionTracker name="hero">
        <Hero />
      </SectionTracker>
      <SectionTracker name="traits">
        <TraitsGrid />
      </SectionTracker>
      <SectionTracker name="demo">
        <DemoSection />
      </SectionTracker>
      <SectionTracker name="perspective">
        <Perspective />
      </SectionTracker>
      <SectionTracker name="audience">
        <Audience />
      </SectionTracker>
      <SectionTracker name="footer">
        <Footer />
      </SectionTracker>
    </LandingLayout>
  )
}
