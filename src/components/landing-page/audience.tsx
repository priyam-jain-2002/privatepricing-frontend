export function Audience() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border/40 pt-16">
                    <div className="p-6 rounded-lg bg-white/50 border border-border/40">
                        <h3 className="font-serif text-lg text-foreground mb-3">For Repeat Business</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Designed for businesses with recurring customers and negotiated pricing, not one-off retail sales.
                        </p>
                    </div>

                    <div className="p-6 rounded-lg bg-white/50 border border-border/40">
                        <h3 className="font-serif text-lg text-foreground mb-3">For Manual Teams</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Perfect for operations teams currently managing orders via spreadsheets, calls, and chat groups.
                        </p>
                    </div>

                    <div className="p-6 rounded-lg bg-white/50 border border-border/40">
                        <h3 className="font-serif text-lg text-foreground mb-3">For Owners</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            For owners who want visibility and control over their order-to-cash cycle without enterprise bloat.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
