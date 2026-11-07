"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Heart, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/icons/social-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto pb-10 sm:pb-12 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl rounded-[32px] glass p-8 sm:p-12 shadow-xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo showTagline scrollToTop />
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-sm pt-1">
              Hatey Hat is an open community platform connecting neighbours across Dhaka to organize,
              discover, and join local grassroots relief, cleanup, and educational initiatives.
            </p>

            {/* Social Links with Custom Tooltips and Non-Inverting Hover */}
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-3 pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full glass border border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/10 hover:border-foreground/30 hover:scale-110 active:scale-95 transition-all shadow-xs"
                      aria-label="Follow Hatey Hat on Facebook"
                    >
                      <FacebookIcon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>Facebook</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full glass border border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/10 hover:border-foreground/30 hover:scale-110 active:scale-95 transition-all shadow-xs"
                      aria-label="Follow Hatey Hat on Instagram"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>Instagram</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://x.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full glass border border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/10 hover:border-foreground/30 hover:scale-110 active:scale-95 transition-all shadow-xs"
                      aria-label="Follow Hatey Hat on X (Twitter)"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>X (Twitter)</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-[14px] text-muted-foreground">
              <li>
                <Link href="/events" className="hover:text-foreground transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/events/create" className="hover:text-foreground transition-colors">
                  Start an Initiative
                </Link>
              </li>
              <li>
                <Link href="/events/joined" className="hover:text-foreground transition-colors">
                  Joined Activities
                </Link>
              </li>
              <li>
                <Link href="/events/manage" className="hover:text-foreground transition-colors">
                  Manage Events
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                  Volunteer Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Coverage & Community */}
          <div className="space-y-3">
            <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider">
              Community
            </h4>
            <div className="space-y-2.5 text-[14px] text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-foreground/70 shrink-0 mt-0.5" />
                <span>Dhaka Metropolitan Area, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Hatey Hat. Built for the communities of Dhaka.</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 font-medium text-foreground/80 cursor-pointer select-none"
              aria-label="Scroll back to top"
            >
              <span>Hatey hat, ekshathe poth chola</span>
              <Heart className="h-3.5 w-3.5 text-foreground fill-foreground" />
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium glass border border-border/60 hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all shadow-xs cursor-pointer active:scale-95 select-none"
              aria-label="Back to top"
            >
              <ArrowUp className="h-3 w-3" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
