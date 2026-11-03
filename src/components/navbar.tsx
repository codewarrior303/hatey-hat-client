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
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-foreground/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {isPending ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Profile dropdown with Tooltip on hover for display name */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <DropdownMenu>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
                          aria-label={`User menu for ${user.name || user.email}`}
                        >
                          <Avatar className="h-10 w-10 border-2 border-primary/30">
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
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="font-medium">{user.name || user.email}</p>
                    </TooltipContent>

                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none text-foreground">
                            {user.name || "Community Member"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link
                              href={item.href}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Icon className="h-4 w-4 text-primary" />
                              <span>{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
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
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Button asChild size="default" className="gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Hamburger & Drawer */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open mobile menu"
                className="rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <SheetTitle>
                    <BrandLogo />
                  </SheetTitle>
                </SheetHeader>

                {user && (
                  <div className="flex items-center gap-3 p-3 my-4 rounded-xl bg-muted/60">
                    <Avatar className="h-11 w-11 border-2 border-primary/40">
                      {user.image && (
                        <AvatarImage src={user.image} alt={user.name || "User"} />
                      )}
                      <AvatarFallback>
                        {getFallbackAvatar(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {user.name || "Community Member"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-1.5 py-4">
                  <Link
                    href="/events"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                      pathname === "/events"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground"
                    )}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Upcoming Events
                  </Link>

                  {user && (
                    <>
                      <div className="pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
                        My Activity
                      </div>
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4 text-primary" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-border pt-4">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      className="w-full gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/login">
                        <LogIn className="h-4 w-4" />
                        Login
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
