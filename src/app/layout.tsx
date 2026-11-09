import type { Metadata } from "next";
import { Jost } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/context/notification-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CustomScrollbar } from "@/components/custom-scrollbar";
import { InteractionProtection } from "@/components/interaction-protection";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hatey Hat – Community-Driven Social Events Platform",
    template: "%s | Hatey Hat",
  },
  description:
    "Hatey Hat, ekshathe poth chola. The unified platform to organize, join, and support community social events and disaster relief across Bangladesh — from flood relief and emergency response to cleanups, tree plantations, blood donation, and winter relief events.",
  keywords: [
    "social service Bangladesh",
    "disaster relief platform",
    "flood relief Bangladesh",
    "emergency response volunteers",
    "community events",
    "winter clothes distribution",
    "tree plantation",
    "blood donation",
    "cleanup events",
    "grassroots initiatives",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  verification: {
    google: "cwxA_7eQGZh2sP-o-oefpqBvNhe90rd5ts3z-twR_KQ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={jost.variable}>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-background text-foreground antialiased relative font-sans selection:bg-foreground selection:text-background"
      >
        {/* Fixed Ambient Background (Subtle Grayscale Blobs for Liquid Glass Depth) */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
        >
          {/* Light Mode Grayscale Blobs (GPU-accelerated Radial Gradients without costly blur filters) */}
          <div
            className="absolute top-[-10%] left-[-5%] w-[650px] h-[650px] rounded-full dark:opacity-0 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(220, 220, 225, 0.5) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] rounded-full dark:opacity-0 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(220, 220, 225, 0.4) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full dark:opacity-0 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(220, 220, 225, 0.4) 0%, transparent 70%)",
            }}
          />

          {/* Dark Mode Grayscale Ambient Blobs */}
          <div
            className="absolute top-[-10%] left-[10%] w-[650px] h-[650px] rounded-full opacity-0 dark:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-[40%] right-[-5%] w-[700px] h-[700px] rounded-full opacity-0 dark:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.035) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-5%] left-[25%] w-[600px] h-[600px] rounded-full opacity-0 dark:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* ThemeProvider initialized to match user's OS/device theme */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          <NotificationProvider>
            <CustomScrollbar />
            <InteractionProtection />
            <div className="relative z-10 flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
            </div>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
