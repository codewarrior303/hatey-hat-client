"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  PlusCircle,
  FolderKanban,
  CheckCircle2,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import toast, { useToaster, resolveValue } from "react-hot-toast";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { invalidateCache } from "@/lib/api";
import { cn, getFallbackAvatar } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Subscribe to react-hot-toast notifications with deduplication and max 2 cap
  const { toasts } = useToaster();
  const activeToasts = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: typeof toasts = [];
    for (const t of toasts) {
      const msg = String(resolveValue(t.message, t));
      if (!seen.has(msg)) {
        seen.add(msg);
        unique.push(t);
      }
      if (unique.length >= 2) break;
    }
    return unique;
  }, [toasts]);

  // Auto-close dropdown when changing route or returning, and ensure document body styles are never locked
  React.useEffect(() => {
    setDropdownOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    }
  }, [pathname]);

  React.useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const user = session?.user;

  const handleLogout = async () => {
    try {
      await signOut();
      invalidateCache();
      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  };

  const navLinks = [
    {
      href: "/events",
      label: "Upcoming Events",
      icon: CalendarDays,
    },
  ];

  const userMenuItems = [
    { href: "/events/create", label: "Create Event", icon: PlusCircle },
    { href: "/events/manage", label: "Manage Events", icon: FolderKanban },
    { href: "/events/joined", label: "Joined Events", icon: CheckCircle2 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-3 z-50 w-full px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="relative mx-auto max-w-2xl">
        <div
          className={cn(
            "relative pointer-events-auto rounded-full transition-colors duration-200 px-3.5 sm:px-6 h-14 flex items-center justify-between w-full",
            isScrolled ? "glass-strong shadow-md" : "glass shadow-xs",
          )}
        >
          {/* Brand Logo with fixed minimum width for symmetry */}
          <div className="flex items-center shrink-0 min-w-[130px]">
            <BrandLogo />
          </div>

          {/* Desktop Navigation (Pinned to exact dead center of navbar pill - never shifts on refresh) */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] font-medium transition-all",
                    isActive
                      ? "bg-foreground/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                  )}
                >
                  <Icon className="h-4 w-4 opacity-70" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions (Desktop) with fixed minimum width to eliminate layout shift */}
          <div className="hidden md:flex items-center justify-end gap-2.5 min-w-[130px] shrink-0">
            <ThemeToggle />

            {isPending && !user ? (
              <div className="h-8 w-20 rounded-full bg-foreground/5 animate-pulse shrink-0" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Profile dropdown */}
                <div className="relative group">
                  <DropdownMenu
                    modal={false}
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="relative rounded-full focus:outline-none focus-visible:outline-none transition-transform hover:scale-105"
                        aria-label={`User menu for ${user.name || user.email}`}
                      >
                        <Avatar className="h-9 w-9 border border-foreground/15">
                          {user.image && (
                            <AvatarImage
                              src={user.image}
                              alt={user.name || "User"}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <AvatarFallback className="text-xs font-semibold">
                            {getFallbackAvatar(user.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-56 glass-menu p-2 shadow-2xl"
                    >
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none text-foreground">
                            {user.name || "Community Member"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-foreground/10 my-1" />

                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem
                            key={item.href}
                            asChild
                            onSelect={() => setDropdownOpen(false)}
                            className="rounded-xl px-2.5 py-2 cursor-pointer focus:bg-foreground/10"
                          >
                            <Link
                              href={item.href}
                              className="flex items-center gap-2.5 text-sm"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}

                      {user.email?.toLowerCase().trim() ===
                        "abirahnafshahriar@gmail.com" && (
                        <>
                          <DropdownMenuSeparator className="bg-foreground/10 my-1" />
                          <DropdownMenuItem
                            asChild
                            onSelect={() => setDropdownOpen(false)}
                            className="rounded-xl px-2.5 py-2 cursor-pointer focus:bg-foreground/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          >
                            <Link
                              href="/admin"
                              className="flex items-center gap-2.5 text-sm"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              <span>Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator className="bg-foreground/10 my-1" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-xl px-2.5 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2.5 text-sm"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Clean Hover Tooltip: Only on mouse hover, zero interference with dropdown */}
                  {!dropdownOpen && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 opacity-0 group-hover:opacity-100 transition-all duration-150 transform scale-95 group-hover:scale-100 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border border-white/10 dark:border-black/10 select-none"
                    >
                      {user.name || user.email}
                    </div>
                  )}
                </div>

                {/* Direct Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-xs h-8 px-3 rounded-full transition-colors hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 group"
                >
                  <LogOut className="h-3.5 w-3.5 transition-colors group-hover:text-red-500" />
                  <span className="transition-colors group-hover:text-red-500">
                    Logout
                  </span>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="gap-2 h-9 px-4 font-medium">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-72 glass-strong border-border/40 p-6 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <SheetHeader className="text-left pb-4 border-b border-border/40">
                    <SheetTitle>
                      <BrandLogo onClick={() => setMobileOpen(false)} />
                    </SheetTitle>
                  </SheetHeader>

                  {user && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                      <Avatar className="h-10 w-10 border border-foreground/20">
                        {user.image && (
                          <AvatarImage
                            src={user.image}
                            alt={user.name || "User"}
                          />
                        )}
                        <AvatarFallback>
                          {getFallbackAvatar(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">
                          {user.name || "Community Member"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                      Explore
                    </p>
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                            isActive
                              ? "bg-foreground text-background"
                              : "hover:bg-foreground/5 text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {user && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                        Dashboard
                      </p>
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                              isActive
                                ? "bg-foreground text-background"
                                : "hover:bg-foreground/5 text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}

                      {user.email?.toLowerCase().trim() ===
                        "abirahnafshahriar@gmail.com" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-colors text-emerald-600 dark:text-emerald-400 hover:bg-foreground/5",
                            pathname === "/admin" && "bg-emerald-500/15"
                          )}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-border/40">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full justify-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/login">
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Live Notification Container - Sits side-by-side with navbar on desktop (left: 100% + 12px), centered below on smaller screens */}
        {activeToasts.length > 0 && (
          <div className="pointer-events-none z-50 flex flex-col items-center xl:items-start gap-2 absolute top-full mt-2.5 left-1/2 -translate-x-1/2 xl:top-0 xl:mt-0 xl:left-full xl:ml-3 xl:translate-x-0 max-w-[calc(100vw-2rem)]">
            {activeToasts.map((t) => (
              <div
                key={t.id}
                role="alert"
                className={cn(
                  "pointer-events-auto flex items-center justify-between gap-3 rounded-full pl-4 pr-3 h-14 min-h-14 max-h-14 py-1.5 text-xs sm:text-sm font-medium border shadow-lg backdrop-blur-2xl transition-all duration-300",
                  isScrolled ? "glass-strong shadow-md" : "glass shadow-xs",
                  "max-w-[calc(100vw-3rem)] xl:max-w-none whitespace-nowrap",
                  t.type === "error"
                    ? "border-red-500/50 text-foreground"
                    : "border-foreground/15 text-foreground",
                  t.visible
                    ? "toast-enter-animation"
                    : "toast-exit-animation pointer-events-none",
                )}
              >
                {/* Clean notification message text - single line, never awkwardly wrapping on desktop or mobile */}
                <span className="text-foreground font-medium text-xs sm:text-sm select-none whitespace-nowrap truncate max-w-[280px] sm:max-w-xs xl:max-w-sm">
                  {resolveValue(t.message, t)}
                </span>

                {/* Cross Button to instantly dismiss notification */}
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer shrink-0 ml-1"
                  aria-label="Remove notification"
                  title="Remove notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
