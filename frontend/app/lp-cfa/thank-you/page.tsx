import type { Metadata } from "next";
import CfaThankYouClient from "@/components/lp-cfa/CfaThankYouClient";

export const metadata: Metadata = {
  title: "Thank You | Capital Lab Education",
  robots: { index: false, follow: false },
};

export default function CfaThankYouPage() {
  return <CfaThankYouClient />;
}
