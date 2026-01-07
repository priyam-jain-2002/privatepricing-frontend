import { Share2, Lock, Smartphone, Zap } from "lucide-react";

export function TraitsGrid() {
    return (
        <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-background">
            <div className="mb-20 max-w-2xl">
                <h2 className="text-4xl font-serif text-primary mb-6">
                    Built for the reality of operations.
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-light">
                    We ignored the standard "growth" playbook and built what actually works for teams moving products every day.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

                {/* Large Item - WhatsApp First */}
                <div className="md:col-span-2 rounded-xl border border-border bg-white p-10 flex flex-col justify-between relative overflow-hidden group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-auto group-hover:bg-primary/5 transition-colors">
                            <Smartphone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-medium text-foreground mb-3">WhatsApp-First Workflow</h3>
                            <p className="text-muted-foreground max-w-sm text-lg">
                                Don't force your customers to login. Capture orders from text, voice notes, or photos directly into the system.
                            </p>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Smartphone className="w-48 h-48" />
                    </div>
                </div>

                {/* Standard Item - Privacy */}
                <div className="rounded-xl border border-border bg-white p-10 flex flex-col justify-between relative overflow-hidden group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-auto group-hover:bg-primary/5 transition-colors">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-medium text-foreground mb-3">Your Data, Isolated</h3>
                            <p className="text-muted-foreground">
                                Single-tenant architecture available. Your pricing philosophy is your trade secret.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Standard Item - No Training */}
                <div className="rounded-xl border border-border bg-white p-10 flex flex-col justify-between relative overflow-hidden group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-auto group-hover:bg-primary/5 transition-colors">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-medium text-foreground mb-3">Zero Training Wheels</h3>
                            <p className="text-muted-foreground">
                                Designed for high-speed entry. Keyboard shortcuts for everything. No lagging animations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Large Item - Flexible Pricing */}
                <div className="md:col-span-2 rounded-xl border border-border bg-white p-10 flex flex-col justify-between relative overflow-hidden group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-auto group-hover:bg-primary/5 transition-colors">
                            <Share2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-medium text-foreground mb-3">Complex Pricing, Simplified</h3>
                            <p className="text-muted-foreground max-w-md text-lg">
                                Handle customer-specific price lists, bulk tiers, and regional variations without spreadsheet chaos.
                            </p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Share2 className="w-48 h-48" />
                    </div>
                </div>

            </div>
        </section>
    );
}
