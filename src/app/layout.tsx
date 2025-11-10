import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creative Stationary - Shop Management",
  description: "Creative Stationary - a complete shop management application.",
  keywords: ["Creative Stationary", "Shop Management", "POS", "Inventory", "Sales", "Employees"],
  authors: [{ name: "The Moshiul" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Creative Stationary - Shop Management",
    description: "Manage products, employees and sales with Creative Stationary.",
    url: "https://example.com",
    siteName: "Creative Stationary",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Stationary - Shop Management",
    description: "Manage products, employees and sales with Creative Stationary.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
