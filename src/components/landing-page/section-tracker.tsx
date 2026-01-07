"use client"

import { useEffect, useRef, useState } from "react"
import posthog from "posthog-js"

interface SectionTrackerProps {
    name: string
    children: React.ReactNode
    threshold?: number
}

export function SectionTracker({ name, children, threshold = 0.5 }: SectionTrackerProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [hasViewed, setHasViewed] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasViewed) {
                    setHasViewed(true)
                    posthog.capture('section_viewed', {
                        section_name: name
                    })
                }
            },
            {
                threshold: threshold
            }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [name, hasViewed, threshold])

    return <div ref={ref}>{children}</div>
}
