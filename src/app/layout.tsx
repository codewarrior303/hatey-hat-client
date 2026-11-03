import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

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
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased transition-colors">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--card)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                borderRadius: "0.75rem",
                padding: "12px 16px",
                fontSize: "0.875rem",
              },
              success: {
                iconTheme: {
                  primary: "var(--primary)",
                  secondary: "var(--primary-foreground)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--destructive)",
                  secondary: "var(--destructive-foreground)",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
