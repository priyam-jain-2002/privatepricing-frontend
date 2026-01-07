export function Mission() {
    return (
        <section className="py-24 bg-white border-y border-border/40">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-serif text-foreground mb-12 text-center">
                    What this system helps you do
                </h2>

                <div className="space-y-12">
                    {/* Item 1 */}
                    <div className="flex gap-6 items-start">
                        <span className="flex-shrink-0 w-6 h-px bg-primary mt-3" />
                        <div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Capture orders from your team or customers</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Centralize order intake from WhatsApp, phone calls, and direct entry into a single, reliable stream. No more lost messages.
                            </p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex gap-6 items-start">
                        <span className="flex-shrink-0 w-6 h-px bg-primary mt-3" />
                        <div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Maintain customer-specific pricing without confusion</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Automatically apply the right price list for every customer. Eliminate manual lookups and pricing errors.
                            </p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex gap-6 items-start">
                        <span className="flex-shrink-0 w-6 h-px bg-primary mt-3" />
                        <div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Track delivery and invoicing without ERP complexity</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                See exactly what needs to be packed, shipped, and billed. Simple status tracking that anyone on your team can understand.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
