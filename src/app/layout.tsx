import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { ErrorMonitor } from "@/components/error-monitor";
import { Suspense } from "react";
import { PostHogClientProvider } from "@/components/providers/posthog-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://opbase.in'),
  title: {
    default: "Opbase - Order Operations Platform",
    template: "%s | Opbase"
  },
  description: "The unified solution to manage orders without ERP. Simplify your workflow with WhatsApp order management, customer specific pricing, and precise partial delivery tracking.",
  keywords: [
    "order operations platform",
    "manage orders without ERP",
    "whatsapp order management",
    "customer specific pricing",
    "order tracking for distributors",
    "partial delivery tracking",
    "ERP alternative SME"
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://opbase.in',
    title: "Opbase - Order Operations Platform",
    description: "The unified solution to manage orders without ERP. Simplify your workflow with WhatsApp order management, customer specific pricing, and precise partial delivery tracking.",
    siteName: "Opbase",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <PostHogClientProvider>
            {children}
            <ErrorMonitor />
            <Toaster />
            <ShadcnToaster />
          </PostHogClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
