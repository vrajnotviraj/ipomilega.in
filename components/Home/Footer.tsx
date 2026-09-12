// components/layout/Footer.tsx (example path)
"use client";

import { Logo } from "@/components/Brand/Logo";

export function Footer() {
    return (
        <section>
            <hr className="border-border w-full mx-auto" />
            <footer className="py-6">
                <div className="text-center">
                    <Logo size="lg" className="justify-center mb-2" />
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