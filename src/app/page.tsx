"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
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

  useEffect(() => {
    // Check for hash navigation
    if (window.location.hash) {
      const id = window.location.hash.substring(1)
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [])

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
