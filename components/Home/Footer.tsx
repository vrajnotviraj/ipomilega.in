// components/layout/Footer.tsx (example path)
"use client";

export function Footer() {
    return (
        <section>
            <hr className="border-border w-full mx-auto" />
            <footer className="py-6">
                <div className="text-center">
                    <h2 className="text-2xl font-serif text-foreground mb-2 font-semibold">
                        IPO Milega
                    </h2>
                    <div className="w-full overflow-hidden">
                        <p className="text-muted-foreground font-sans text-sm">
                            © <span className="font-mono">{new Date().getFullYear()}</span> IPO Milega. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </section>
    );
}