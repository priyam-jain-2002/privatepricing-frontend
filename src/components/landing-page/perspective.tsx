import Image from "next/image";

export function Perspective() {
    return (
        <section id="how-it-works" className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <div className="order-2 lg:order-1">
                        <h2 className="text-3xl font-serif text-foreground mb-6">
                            Not a replacement. <br /> A layer of structure.
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            This is not a replacement for your people or processes. It’s a layer of structure that sits quietly behind them, ensuring nothing slips through the cracks.
                        </p>

                        <ul className="space-y-4 text-left">
                            <li className="flex items-center gap-3 text-foreground/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                Works alongside WhatsApp-style workflows
                            </li>
                            <li className="flex items-center gap-3 text-foreground/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                Orders can be created by your team or your customers
                            </li>
                            <li className="flex items-center gap-3 text-foreground/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                Details can be filled gradually, not just upfront
                            </li>
                        </ul>
                    </div>

                    <div className="order-1 lg:order-2 relative h-[400px] w-full rounded-lg overflow-hidden hidden md:block">
                        <Image
                            src="/workspace_context_photo_1767739277047.png"
                            alt="Workspace Context"
                            fill
                            className="object-cover grayscale-[20%] opacity-90"
                        />
                        <div className="absolute inset-0 ring-1 ring-black/5 rounded-lg" />
                    </div>

                </div>
            </div>
        </section>
    );
}
