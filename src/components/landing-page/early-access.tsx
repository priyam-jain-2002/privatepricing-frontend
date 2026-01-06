"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

export function EarlyAccess() {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setStatus("success")
        setEmail("")
    }

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="early-access">
            <div className="bg-primary text-primary-foreground rounded-none sm:rounded-md p-12 sm:p-20 relative overflow-hidden flex flex-col items-center text-center shadow-2xl ring-1 ring-white/10">

                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl sm:text-4xl font-serif mb-6 tracking-tight text-white">
                        See it in action.
                    </h2>
                    <p className="text-primary-foreground/70 text-lg mb-12 font-light leading-relaxed max-w-xl mx-auto">
                        Opbase is designed for complex operations. <br />
                        Book a demo to see how it fits your workflow.
                    </p>

                    {status === "success" ? (
                        <div className="bg-white/5 border border-white/10 rounded-md p-8 w-full max-w-md mx-auto flex flex-col items-center animate-in fade-in duration-500">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Request Sent</h3>
                            <p className="text-white/60 text-sm">We will be in touch with {email} to schedule.</p>
                            <button
                                onClick={() => setStatus("idle")}
                                className="mt-6 text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Reset
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-0 sm:gap-0">
                                <input
                                    type="email"
                                    required
                                    placeholder="work@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === "loading"}
                                    className="flex-1 bg-white text-primary rounded-t-md sm:rounded-l-md sm:rounded-tr-none px-6 py-4 placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50 min-w-0"
                                />
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="bg-white/10 text-white border border-white/10 border-t-0 sm:border-t sm:border-l-0 rounded-b-md sm:rounded-r-md sm:rounded-bl-none px-8 py-4 font-medium hover:bg-white/20 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all disabled:opacity-70 flex items-center justify-center gap-2 min-w-[170px]"
                                >
                                    {status === "loading" ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Book Demo
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="text-xs text-primary-foreground/30 text-center uppercase tracking-widest font-medium">
                                Institutional use only
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}
