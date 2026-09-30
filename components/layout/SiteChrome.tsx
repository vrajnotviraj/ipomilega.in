"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { LineChart, Menu, X, Home, BookOpen, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Logo } from "@/components/layout/Logo";

const DESKTOP_LINKS = [
  { href: "/", label: "Home" },
  { href: "/ipos", label: "IPO list" },
  { href: "/blogs", label: "Blogs" },
  { href: "/analysis", label: "Analysis" },
];

const MOBILE_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/blogs", label: "Blogs", icon: BookOpen },
  { href: "/ipos", label: "IPOs", icon: LineChart },
  { href: "/analysis", label: "Analysis", icon: BarChart },
];

function MobileSidebar({ isOpen, onClose, pathname }: { isOpen: boolean; onClose: () => void; pathname: string }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 sm:hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        inert={!isOpen}
        className={`fixed left-0 top-0 h-full w-80 bg-card shadow-2xl z-50 sm:hidden transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Logo size="lg" />
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" aria-label="Close menu">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 py-6">
            <nav className="space-y-2 px-4">
              {MOBILE_LINKS.map((link) => (
                <ProgressLink
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className="flex items-center space-x-3 px-4 py-3 text-foreground/80 rounded-lg hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-foreground transition-colors font-medium"
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </ProgressLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProgressProvider>
      <a
        href="#main"
        className="skip-link"
      >
        Skip to content
      </a>
      <header className="fixed font-sans top-0 z-50 w-full backdrop-blur-md bg-background/85 border-b border-border">
        <div className="app-container flex items-center h-16 justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              className="sm:hidden h-8 w-8 p-0 text-foreground hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <ProgressLink href="/" className="flex items-center transition-opacity hover:opacity-80" aria-label="IPO Milega home">
              <Logo size="sm" showTagline />
            </ProgressLink>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="hidden sm:flex items-center gap-6">
              {DESKTOP_LINKS.map((link) => (
                <ProgressLink
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className="underline-grow py-1 text-sm text-muted-foreground hover:text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground transition-colors"
                >
                  {link.label}
                </ProgressLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} pathname={pathname} />

      <main id="main">
        {children}
        <Toaster position="top-right" richColors />
      </main>
    </ProgressProvider>
  );
}
