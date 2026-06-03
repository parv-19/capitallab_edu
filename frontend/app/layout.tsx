import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { companyInfo } from "@/lib/site-content";
import { absoluteUrl, getBaseUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Capital Lab Education - CMA US and CFA Coaching",
    template: "%s | Capital Lab Education",
  },
  icons: {
    icon: "/LOGO.PNG",
    shortcut: "/LOGO.PNG",
    apple: "/LOGO.PNG",
  },
  description:
    "Capital Lab Education offers expert coaching for CMA US and CFA with finance-focused instruction, small batches, and globally relevant preparation.",
  keywords: [
    "CMA US coaching",
    "CFA coaching",
    "finance certification classes",
    "Ahmedabad finance coaching",
    "Capital Lab Education",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: companyInfo.name,
    images: [{ url: absoluteUrl("/LOGO.PNG"), width: 1200, height: 1200, alt: companyInfo.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Capital Lab Education - CMA US and CFA Coaching",
    description:
      "Capital Lab Education offers expert coaching for CMA US and CFA with finance-focused instruction, small batches, and globally relevant preparation.",
    images: [absoluteUrl("/LOGO.PNG")],
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
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
