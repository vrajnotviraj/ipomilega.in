"use client";

// Extracted from app/layout.tsx, which was itself marked "use client". A client root layout
// drags the entire app shell (better-auth session hook, framer-motion, radix dropdowns) into
// every route's bundle and blocks the layout from exporting `metadata`. Keeping the
// interactive chrome here lets the real layout stay a server component.

import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useState, Suspense } from "react";
import { LoginDialog } from "@/components/ui/login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  LogOut,
  TrendingUp,
  LineChart,
  Menu,
  X,
  Home,
  BookOpen,
  BarChart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageLoader } from "@/components/ui/loader";
import { ProgressProvider } from "@/components/Progressbar/ProgressProvider";
import { ProgressLink } from "@/components/Progressbar/ProgressLink";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Mobile Navigation Sidebar Component
function MobileSidebar({ isOpen, onClose, isAdmin }: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const { data: session } = useSession();
  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/blogs", label: "Blogs", icon: BookOpen },
    { href: "/ipos", label: "IPOs", icon: LineChart },
    { href: "/analysis", label: "Analysis", icon: BarChart },
  ];

  if (isAdmin) {
    navItems.unshift({ href: "/admin", label: "Admin", icon: TrendingUp });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 bg-card shadow-2xl z-50 sm:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-semibold font-serif text-foreground tracking-tight">
                    IPO Milega
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex-1 py-6">
                <nav className="space-y-2 px-4">
                  {navItems.map((item) => (
                    <ProgressLink
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center space-x-3 px-4 py-3 text-foreground/80 rounded-lg hover:bg-accent transition-colors font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </ProgressLink>
                  ))}
                </nav>
              </div>

              {/* User Section */}
              <div className="border-t border-border p-6">
                {session ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="text-sm">
                          {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session?.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session?.user?.email}
                        </p>
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
                  <Button
                    onClick={onClose}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Layout content component
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const isAdmin = ["admin@gmail.com", "snehshah7634@gmail.com", "shahvraj114@gmail.com", "devanshisoni2004@gmail.com", "devanshisoni2311@gmail.com"].includes(
    session?.user?.email || ""
  );

  const pathname = usePathname();

  return (
    <ProgressProvider>
      <header className="fixed font-sans top-0 z-50 w-full backdrop-blur-md bg-background/85 border-b border-border">
        <div className="w-full">
          <div
            className="app-container flex items-center h-16 justify-between"
          >
            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="sm:hidden h-8 w-8 p-0 text-foreground hover:bg-accent"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Logo */}
              <ProgressLink
                href="/"
                className="flex items-baseline gap-2 transition-opacity hover:opacity-80"
              >
                <span className="text-lg sm:text-xl font-semibold font-serif text-foreground tracking-tight">
                  IPO Milega
                </span>
                <span className="hidden sm:inline text-xs italic text-muted-foreground font-sans">
                  § Prospectus Analysis
                </span>
              </ProgressLink>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop Navigation */}
              <nav className="hidden sm:flex items-center gap-6">
                {isAdmin && (
                  <ProgressLink
                    href="/admin"
                    className={`text-sm transition-colors ${pathname === '/admin' ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'}`}
                  >
                    Admin
                  </ProgressLink>
                )}
                <ProgressLink
                  href="/"
                  className={`text-sm transition-colors ${pathname === '/' ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'}`}
                >
                  Home
                </ProgressLink>
                <ProgressLink
                  href="/ipos"
                  className={`text-sm transition-colors ${pathname === '/ipos' ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'}`}
                >
                  IPO list
                </ProgressLink>
                <ProgressLink
                  href="/blogs"
                  className={`text-sm transition-colors ${pathname === '/blogs' ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'}`}
                >
                  Blogs
                </ProgressLink>
                <ProgressLink
                  href="/analysis"
                  className={`text-sm transition-colors ${pathname === '/analysis' ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'}`}
                >
                  Analysis
                </ProgressLink>
              </nav>

              {/* User Section */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-auto px-3 rounded-full hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={session?.user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {session?.user.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-medium text-foreground">
                          {session?.user.name}
                        </span>
                        <ChevronDown className="h-4 w-4 text-foreground/60" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 mt-2 backdrop-blur-md bg-popover"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session?.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session?.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowLoginDialog(true)}
                  className="px-6 py-2 rounded-full font-medium transition-all hover:shadow-md"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAdmin={isAdmin}
      />

      <main>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
        <Toaster position="top-right" richColors />
      </main>
      <LoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} />
    </ProgressProvider>
  );
}
