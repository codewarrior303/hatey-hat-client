import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hatey Hat – Community-Driven Social Events Platform",
    template: "%s | Hatey Hat",
  },
  description:
    "Hate hat, ekshathe poth chola. Join, create, and track social service events in Dhaka — from winter clothes drives to neighbourhood cleanups and tree plantations.",
  keywords: [
    "social service",
    "community events",
    "Dhaka volunteers",
    "winter clothes distribution",
    "tree plantation",
    "blood donation",
    "cleanup drives",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased relative selection:bg-foreground selection:text-background">
        {/* Fixed Ambient Background (Subtle Grayscale Blobs for Liquid Glass Depth) */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        >
          {/* Light Mode Grayscale Blobs */}
          <div className="absolute top-[-10%] left-[-5%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-neutral-200/50 to-neutral-100/20 blur-[130px] dark:opacity-0 transition-opacity duration-500" />
          <div className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-neutral-200/40 to-neutral-100/10 blur-[150px] dark:opacity-0 transition-opacity duration-500" />
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-neutral-200/40 to-neutral-100/20 blur-[140px] dark:opacity-0 transition-opacity duration-500" />

          {/* Dark Mode Grayscale Ambient Blobs */}
          <div className="absolute top-[-10%] left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-white/[0.04] to-transparent blur-[140px] opacity-0 dark:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-[40%] right-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-white/[0.035] to-transparent blur-[160px] opacity-0 dark:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-[-5%] left-[25%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-white/[0.03] to-transparent blur-[150px] opacity-0 dark:opacity-100 transition-opacity duration-500" />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 pt-6">{children}</main>
            <Footer />
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "glass !text-foreground !rounded-full !px-5 !py-3 !shadow-lg text-sm font-medium",
              style: {
                background: "var(--card)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
              },
              success: {
                iconTheme: {
                  primary: "var(--foreground)",
                  secondary: "var(--background)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--destructive)",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
