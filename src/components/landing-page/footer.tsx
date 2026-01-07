"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import posthog from "posthog-js"

export function Footer() {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")

        posthog.capture('demo_requested', { email })

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setStatus("success")
        setEmail("")
    }

    return (
        <footer className="bg-primary text-primary-foreground border-t border-white/10 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Book a Demo Section (Merged from Early Access) */}
                {/* Book a Demo Section (Merged from Early Access) */}
                <div id="early-access" className="mb-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-12 scroll-mt-24">
                    <div className="max-w-xl">
                        <h2 className="text-3xl sm:text-4xl font-serif mb-6 tracking-tight text-white">
                            Book a Demo.
                        </h2>
                        <p className="text-primary-foreground/70 text-lg font-light leading-relaxed">
                            Opbase is designed for complex operations. <br className="hidden sm:block" />
                            Book a demo to see how it fits your workflow.
                        </p>
                    </div>

                    <div className="w-full max-w-md">
                        {status === "success" ? (
                            <div className="bg-white/5 border border-white/10 rounded-md p-6 w-full flex flex-col items-center animate-in fade-in duration-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    <h3 className="text-lg font-medium text-white">Request Sent</h3>
                                </div>
                                <p className="text-white/60 text-sm text-center mb-4">We will be in touch with {email} to schedule.</p>
                                <button
                                    onClick={() => setStatus("idle")}
                                    className="text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <div className="flex font-light">
                                    <input
                                        type="email"
                                        required
                                        placeholder="work@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={status === "loading"}
                                        className="flex-1 bg-white text-primary rounded-l-md px-6 py-4 placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50 min-w-0"
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="bg-white/10 text-white border border-white/10 border-l-0 rounded-r-md px-8 py-4 font-medium hover:bg-white/20 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {status === "loading" ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Book
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="text-xs text-primary-foreground/30 uppercase tracking-widest font-medium pl-1">
                                    Institutional use only
                                </div>
                            </form>
                        )}
                    </div>
                </div>



                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <span className="font-serif font-bold text-white tracking-tight text-xl block mb-2">opbase</span>
                        <p className="text-primary-foreground/50 text-xs leading-relaxed max-w-xs">
                            The operating system for modern private pricing.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10">
                    <div className="text-primary-foreground/40 text-xs flex items-center gap-8">
                        <span>&copy; {new Date().getFullYear()} Opbase Inc.</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-emerald-400/80 font-medium">All systems normal</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
