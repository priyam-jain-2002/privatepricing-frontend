
import { PropsWithChildren } from "react"

export function LandingLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10">
            {children}
        </div>
    )
}
