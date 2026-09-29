"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { ChevronDown, LogOut, TrendingUp, LineChart, Menu, X, Home, BookOpen, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/ui/login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut, isAdminEmail } from "@/lib/auth-client";
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

const initial = (name?: string | null) => name?.charAt(0)?.toUpperCase() || "U";

function MobileSidebar({ isOpen, onClose, isAdmin }: { isOpen: boolean; onClose: () => void; isAdmin: boolean }) {
  const { data: session } = useSession();
  const links = isAdmin ? [{ href: "/admin", label: "Admin", icon: TrendingUp }, ...MOBILE_LINKS] : MOBILE_LINKS;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

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
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 py-6">
            <nav className="space-y-2 px-4">
              {links.map((link) => (
                <ProgressLink
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center space-x-3 px-4 py-3 text-foreground/80 rounded-lg hover:bg-accent transition-colors font-medium"
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </ProgressLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-border p-6">
            {session ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="text-sm">{initial(session.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={onClose} className="w-full">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = isAdminEmail(session?.user?.email);
  const desktopLinks = isAdmin ? [{ href: "/admin", label: "Admin" }, ...DESKTOP_LINKS] : DESKTOP_LINKS;

  return (
    <ProgressProvider>
      <header className="fixed font-sans top-0 z-50 w-full backdrop-blur-md bg-background/85 border-b border-border">
        <div className="app-container flex items-center h-16 justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
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
              {desktopLinks.map((link) => (
                <ProgressLink
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${pathname === link.href ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"}`}
                >
                  {link.label}
                </ProgressLink>
              ))}
            </nav>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-3 rounded-full hover:bg-accent transition-colors">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback className="text-xs">{initial(session.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium text-foreground">{session.user.name}</span>
                      <ChevronDown className="h-4 w-4 text-foreground/60" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 backdrop-blur-md bg-popover" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setShowLoginDialog(true)} className="px-6 py-2 rounded-full font-medium transition-all hover:shadow-md">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isAdmin={isAdmin} />

      <main>
        {children}
        <Toaster position="top-right" richColors />
      </main>
      <LoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} />
    </ProgressProvider>
  );
}
