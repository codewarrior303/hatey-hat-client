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
} from "lucide-react";
import toast from "react-hot-toast";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { cn, getFallbackAvatar } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

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
    <header className="sticky top-3 z-50 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div
        className={cn(
          "container mx-auto max-w-5xl pointer-events-auto rounded-full transition-colors duration-200 px-4 sm:px-6 h-14 flex items-center justify-between",
          isScrolled ? "glass-strong shadow-md" : "glass shadow-xs"
        )}
      >
        {/* Brand Logo */}
        <BrandLogo />

        {/* Desktop Navigation (Centered) */}
        <nav className="hidden md:flex items-center gap-1">
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
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />

          {isPending ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-neutral-200/50 dark:bg-white/10" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Profile dropdown */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <DropdownMenu>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-transform hover:scale-105"
                          aria-label={`User menu for ${user.name || user.email}`}
                        >
                          <Avatar className="h-9 w-9 border border-foreground/20">
                            {user.image && (
                              <AvatarImage
                                src={user.image}
                                alt={user.name || "User"}
                              />
                            )}
                            <AvatarFallback className="text-xs font-semibold">
                              {getFallbackAvatar(user.name || user.email)}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="font-medium">{user.name || user.email}</p>
                    </TooltipContent>

                    <DropdownMenuContent
                      align="end"
                      className="w-56 glass border-border/60 p-2 shadow-xl"
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
                </Tooltip>
              </TooltipProvider>

              {/* Direct Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs h-8 px-3"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
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
                    <BrandLogo />
                  </SheetTitle>
                </SheetHeader>

                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                    <Avatar className="h-10 w-10 border border-foreground/20">
                      {user.image && (
                        <AvatarImage src={user.image} alt={user.name || "User"} />
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
                            : "hover:bg-foreground/5 text-foreground"
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
                              : "hover:bg-foreground/5 text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
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
    </header>
  );
}
