"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Archive, DollarSign, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const demos = [
    {
        id: "orders",
        label: "Order Management",
        icon: Archive,
        description: "Receive orders from WhatsApp, verify inventory, and process them in seconds.",
        content: (
            <div className="w-full h-full bg-white rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-4">
                    <h3 className="text-lg font-medium text-foreground">Recent Orders</h3>
                    <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-medium">Live Feed</div>
                </div>
                {/* Mock Table */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <div>
                                    <div className="text-sm font-medium text-foreground">Order #{2400 + i}</div>
                                    <div className="text-xs text-muted-foreground">Just now • WhatsApp</div>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-foreground">$1,2{i}0.00</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: "pricing",
        label: "Complex Pricing",
        icon: DollarSign,
        description: "Set different price lists for different regions, customer tiers, or specific products.",
        content: (
            <div className="w-full h-full bg-white rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-4">
                    <h3 className="text-lg font-medium text-foreground">Price Lists</h3>
                    <button className="text-primary text-sm font-medium hover:underline">Effect a change</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-md bg-muted/20">
                        <div className="text-sm text-muted-foreground mb-1">Wholesale Tier A</div>
                        <div className="text-2xl font-serif text-foreground">Active</div>
                        <div className="mt-2 text-xs text-emerald-600 font-medium">+124 Products</div>
                    </div>
                    <div className="p-4 border border-border rounded-md bg-muted/20">
                        <div className="text-sm text-muted-foreground mb-1">Regional (North)</div>
                        <div className="text-2xl font-serif text-foreground">Active</div>
                        <div className="mt-2 text-xs text-emerald-600 font-medium">+85 Products</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "customers",
        label: "Customer Insights",
        icon: Users,
        description: "Know exactly what they buy, how often, and when they last ordered.",
        content: (
            <div className="w-full h-full bg-white rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-4">
                    <h3 className="text-lg font-medium text-foreground">Customer Health</h3>
                </div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif italic text-xl">A</div>
                    <div>
                        <div className="font-medium text-foreground">Acme Corp Ltd.</div>
                        <div className="text-xs text-muted-foreground">High Volume • Loyal</div>
                    </div>
                </div>
                <div className="h-32 w-full bg-slate-50 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                    Activity Graph Placeholder
                </div>
            </div>
        )
    }
]

export function DemoSection() {
    const [activeTab, setActiveTab] = useState(demos[0].id)

    return (
        <section className="py-24 px-4 bg-muted/30 border-y border-border/40" id="how-it-works">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif text-primary mb-6">
                        Designed for the details.
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Most tools are too simple or too complex. We built the middle ground for serious operators.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Sidebar / Tabs */}
                    <div className="lg:col-span-4 flex flex-col gap-2">
                        {demos.map((demo) => (
                            <button
                                key={demo.id}
                                onClick={() => setActiveTab(demo.id)}
                                className={cn(
                                    "flex items-start gap-4 p-6 text-left rounded-xl transition-all duration-200 border",
                                    activeTab === demo.id
                                        ? "bg-white border-primary/10 shadow-sm ring-1 ring-primary/5"
                                        : "bg-transparent border-transparent hover:bg-white/50"
                                )}
                            >
                                <div className={cn(
                                    "mt-1 p-2 rounded-lg transition-colors",
                                    activeTab === demo.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    <demo.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <div className={cn("font-medium transition-colors", activeTab === demo.id ? "text-primary" : "text-foreground")}>
                                        {demo.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        {demo.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-border shadow-xl shadow-primary/5 min-h-[500px] p-2 relative overflow-hidden">
                        {/* Simple Window Chrome */}
                        <div className="absolute top-0 left-0 right-0 h-8 bg-muted/30 border-b border-border flex items-center px-4 gap-2 z-10">
                            <div className="h-2.5 w-2.5 rounded-full bg-border" />
                            <div className="h-2.5 w-2.5 rounded-full bg-border" />
                            <div className="h-2.5 w-2.5 rounded-full bg-border" />
                        </div>

                        <div className="mt-8 h-full p-4 bg-muted/10 h-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    {demos.find(d => d.id === activeTab)?.content}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
