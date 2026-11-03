import Link from "next/link";
import { Mail, MapPin, Phone, Heart, Globe } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { XIcon } from "@/components/icons/x-icon";
import { FacebookIcon, InstagramIcon, GithubIcon } from "@/components/icons/social-icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card text-card-foreground transition-colors mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo showTagline />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Hatey Hat is a community-driven grassroots platform uniting neighbours across Dhaka.
              We make it effortless to organize, discover, and take part in local relief drives,
              tree planting, cleanups, and social welfare programs.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                aria-label="X (formerly Twitter)"
              >
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-semibold text-foreground">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/events" className="hover:text-primary transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/events/create" className="hover:text-primary transition-colors">
                  Start an Event
                </Link>
              </li>
              <li>
                <Link href="/events/joined" className="hover:text-primary transition-colors">
                  Joined Activities
                </Link>
              </li>
              <li>
                <Link href="/events/manage" className="hover:text-primary transition-colors">
                  Manage Events
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Volunteer Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Impact Areas */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-semibold text-foreground">
              Impact Areas
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/events?type=Donation" className="hover:text-primary transition-colors">
                  Winter Relief & Clothes
                </Link>
              </li>
              <li>
                <Link href="/events?type=Food+Distribution" className="hover:text-primary transition-colors">
                  Food Distribution
                </Link>
              </li>
              <li>
                <Link href="/events?type=Plantation" className="hover:text-primary transition-colors">
                  Tree Plantation
                </Link>
              </li>
              <li>
                <Link href="/events?type=Blood+Donation" className="hover:text-primary transition-colors">
                  Blood Donation Drives
                </Link>
              </li>
              <li>
                <Link href="/events?type=Cleanup" className="hover:text-primary transition-colors">
                  Neighbourhood Cleanups
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Local Office */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-semibold text-foreground">
              Connect With Us
            </h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Mirpur 10 Circle & Dhanmondi 27, Dhaka, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href="mailto:contact@hateyhat.org" className="hover:text-primary transition-colors">
                  contact@hateyhat.org
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+880 1700-000000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <span>Dhaka Metropolitan Area</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Hatey Hat. Built with dedication for the communities of Bangladesh.</p>
          <p className="flex items-center gap-1.5">
            <span>Hate hat, ekshathe poth chola</span>
            <Heart className="h-3.5 w-3.5 text-accent fill-accent" />
          </p>
        </div>
      </div>
    </footer>
  );
}
