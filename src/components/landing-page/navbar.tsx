import Link from "next/link"

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-primary">
                            opbase
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/#book-demo"
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-primary/90 hover:shadow-sm"
                        >
                            Book Demo
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
