import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="bg-background px-4 pt-32 pb-24 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center relative overflow-hidden">
            {/* Subtle mesh gradient background effect - Optional but nice for "modern" touch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-3xl rounded-full -z-10 opacity-50 pointer-events-none" />

            <div className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-medium text-primary tracking-tight leading-[1.05] mb-8">
                    Operational clarity <br className="hidden sm:block" />
                    for growing businesses.
                </h1>

                <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                    A structured way to receive orders, manage pricing, and deliver consistently—without changing how your team works.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <Link
                        href="/#book-demo"
                        className="bg-primary text-primary-foreground px-10 py-4 rounded-md text-[16px] font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Book a Demo
                    </Link>
                    <Link
                        href="/#how-it-works"
                        className="text-muted-foreground hover:text-foreground text-[16px] transition-colors flex items-center gap-2 group px-6 py-4"
                    >
                        See how it works
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Product Pillars / Abstract Visual Replacement */}
            <div className="w-full max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: "Order Management",
                        value: "Streamlined",
                        desc: "Centralize input from WhatsApp, Email, and Direct Entry.",
                        meta: "Live Sync"
                    },
                    {
                        title: "Pricing Engine",
                        value: "Dynamic",
                        desc: "Region-based logic with instant global updates.",
                        meta: "0.05s Latency"
                    },
                    {
                        title: "Customer Insights",
                        value: "Deep",
                        desc: "Retention tracking and purchasing power analysis.",
                        meta: "Real-time"
                    }
                ].map((item, idx) => (
                    <div key={idx} className="group relative bg-white border border-border p-8 rounded-xl hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border border-border px-2 py-1 rounded-full">
                                {item.meta}
                            </div>
                        </div>
                        <div className="h-full flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">{item.title}</h3>
                                <div className="text-2xl font-serif text-primary mb-4">{item.value}</div>
                                <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-[90%]">
                                    {item.desc}
                                </p>
                            </div>
                            <div className="mt-8 h-1 w-full bg-muted overflow-hidden rounded-full">
                                <div className="h-full bg-primary/20 w-1/3 group-hover:w-full transition-all duration-1000 ease-in-out" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
