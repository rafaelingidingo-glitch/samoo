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
    default: "SAWEE CARS — Vintage & Classic Automobiles in Tanzania",
    template: "%s | SAWEE CARS",
  },
  description:
    "Explore a distinctive collection of vintage and classic automobiles at SAWEE CARS, Tanzania. Browse our inventory and enquire directly via WhatsApp.",
  keywords: [
    "vintage cars Tanzania",
    "classic cars for sale",
    "SAWEE CARS",
    "classic car dealership Dar es Salaam",
    "vintage automobiles",
  ],
  openGraph: {
    type: "website",
    siteName: "SAWEE CARS",
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
