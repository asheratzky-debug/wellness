import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import SWUpdater from "@/components/SWUpdater";
import { Analytics } from "@vercel/analytics/next";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heebo",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Wellness",
  description: "מעקב אימונים ושינה",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wellness',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="theme-color" content="#22c55e" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${heebo.variable} font-sans min-h-screen bg-gray-50 antialiased`}
        style={{ fontFamily: "var(--font-heebo), sans-serif" }}
      >
        <SWUpdater />
        <main className="pb-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}><ErrorBoundary>{children}</ErrorBoundary></main>
        <Navbar />
        <Analytics />
      </body>
    </html>
  );
}
