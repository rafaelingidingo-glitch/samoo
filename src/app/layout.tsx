import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/env";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sawee Vintage & Classic Cars — Vintage & Classic Automobiles in Tanzania",
    template: "%s | Sawee Vintage & Classic Cars",
  },
  description:
    "Explore a distinctive collection of vintage and classic automobiles at Sawee Vintage & Classic Cars, Tanzania. Browse our inventory and enquire directly via WhatsApp.",
  keywords: [
    "vintage cars Tanzania",
    "classic cars for sale",
    "Sawee Vintage & Classic Cars",
    "classic car dealership Dar es Salaam",
    "vintage automobiles",
  ],
  openGraph: {
    type: "website",
    siteName: "Sawee Vintage & Classic Cars",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
