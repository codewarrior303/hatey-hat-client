import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/icons/social-icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 pb-12 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl rounded-[32px] glass p-8 sm:p-12 shadow-xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo showTagline />
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-sm pt-1">
              Hatey Hat is an open community platform connecting neighbours across Dhaka to organize,
              discover, and join local grassroots relief, cleanup, and educational initiatives.
            </p>
            {/* Social Links: Facebook, Instagram, X (Twitter) */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full glass border-border hover:bg-foreground hover:text-background transition-all"
                aria-label="Follow Hatey Hat on Facebook"
                title="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full glass border-border hover:bg-foreground hover:text-background transition-all"
                aria-label="Follow Hatey Hat on Instagram"
                title="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full glass border-border hover:bg-foreground hover:text-background transition-all"
                aria-label="Follow Hatey Hat on X (Twitter)"
                title="X (Twitter)"
              >
                <XIcon className="h-3.5 w-3.5" />
              </a>
            </div>
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
          <p className="flex items-center gap-1.5 font-medium text-foreground/80">
            <span>Hate hat, ekshathe poth chola</span>
            <Heart className="h-3.5 w-3.5 text-foreground fill-foreground" />
          </p>
        </div>
      </div>
    </footer>
  );
}
