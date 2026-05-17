import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomizationProvider } from "@/lib/hooks/useCustomization";

/**
 * Primary sans-serif font - Inter
 * Clean, modern, highly legible at all sizes
 */
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevent FOUT
});

/**
 * Geist Sans - Vercel's design system font
 * Modern, geometric, excellent for UI
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/**
 * Geist Mono - For timestamps, code, technical info
 */
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * JetBrains Mono - Alternative monospace
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "KappaChat - YouTube Live Chat Viewer",
  description: "A premium, customizable YouTube Live Chat viewer. Built for streamers and viewers alike.",
  keywords: ["YouTube", "Live Chat", "Streamer", "OBS", "Chat Viewer", "KappaChat"],
  authors: [{ name: "KappaChat" }],
  creator: "KappaChat",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "KappaChat",
    title: "KappaChat - YouTube Live Chat Viewer",
    description: "Premium YouTube Live Chat viewer with customizable themes and zero-cost demo mode.",
  },
  twitter: {
    card: "summary",
    title: "KappaChat - YouTube Live Chat Viewer",
    description: "Premium YouTube Live Chat viewer. Perfect for streamers and chat enthusiasts.",
    creator: "@DiluteOxygen",
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
    <html lang="en" className={`${inter.variable} ${geist.variable} ${geistMono.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <CustomizationProvider>
          {children}
        </CustomizationProvider>
      </body>
    </html>
  );
}
