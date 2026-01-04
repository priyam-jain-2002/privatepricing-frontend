'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogClientProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Initialize PostHog
        if (typeof window !== 'undefined' && !posthog.__loaded) {
            // Only run in production
            if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV === 'production') {
                posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
                    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
                    capture_pageview: false, // We manually capture pageviews
                })
            }
        }
    }, [])

    useEffect(() => {
        // Only track if key exists AND we are in production
        if (pathname && process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV === 'production') {
            let url = window.origin + pathname
            if (searchParams.toString()) {
                url = url + `?${searchParams.toString()}`
            }
            posthog.capture('$pageview', {
                '$current_url': url,
            })

            // Scroll Depth Tracking
            let maxScroll = 0
            const milestones = [25, 50, 75, 100]
            const reached = new Set<number>()

            const handleScroll = () => {
                const scrollTop = window.scrollY
                const docHeight = document.documentElement.scrollHeight
                const winHeight = window.innerHeight

                // Avoid division by zero
                if (docHeight === winHeight) return

                const scrollPercent = Math.min(100, Math.round((scrollTop / (docHeight - winHeight)) * 100))

                milestones.forEach(m => {
                    if (scrollPercent >= m && !reached.has(m)) {
                        reached.add(m)
                        posthog.capture('scroll_depth_reached', {
                            depth: m,
                            url: url
                        })
                    }
                })
            }

            window.addEventListener('scroll', handleScroll, { passive: true })
            return () => window.removeEventListener('scroll', handleScroll)
        }
    }, [pathname, searchParams])

    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NODE_ENV !== 'production') {
        // Did not init, just render children
        return <>{children}</>
    }

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
