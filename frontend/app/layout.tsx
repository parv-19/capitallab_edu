import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Capital Lab Education — Premier Coaching in Ahmedabad",
    template: "%s | Capital Lab Education",
  },
  description:
    "Capital Lab Education offers expert CA coaching in Ahmedabad with 500+ students, 98% success rate, and personal attention from experienced faculty.",
  keywords: ["CA coaching Ahmedabad", "CA Foundation", "CA Intermediate", "coaching classes"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Capital Lab Education",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
          <Toaster position="top-right" richColors />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
