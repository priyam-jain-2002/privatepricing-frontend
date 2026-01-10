"use client"

import Link from "next/link"
import posthog from "posthog-js"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/login"
                            onClick={() => posthog.capture('sign_in_clicked', { location: 'navbar' })}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/#early-access"
                            onClick={() => posthog.capture('book_demo_clicked', { location: 'navbar' })}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-primary/90 hover:shadow-sm"
                        >
                            Book Demo
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <div className="flex flex-col gap-8 mt-8">
                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href="/login"
                                            onClick={() => posthog.capture('sign_in_clicked', { location: 'mobile_navbar' })}
                                            className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/#early-access"
                                            onClick={() => posthog.capture('book_demo_clicked', { location: 'mobile_navbar' })}
                                            className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            Book Demo
                                        </Link>
                                    </div>
                                    <div className="border-t pt-8">
                                        <p className="text-sm text-muted-foreground">
                                            Pricing OS for the modern age.
                                        </p>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    )
}
