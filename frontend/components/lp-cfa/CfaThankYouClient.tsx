"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Home, Phone } from "lucide-react";
import { checkLeadSubmission } from "@/lib/leadThankYou";
import { companyInfo } from "@/lib/site-content";

const REDIRECT_SECONDS = 10;

export default function CfaThankYouClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "valid">("checking");
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode's double effect invocation in dev —
    // checkLeadSubmission() consumes the flag on read, so a second call
    // would always see it as missing and bounce the visitor immediately.
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!checkLeadSubmission()) {
      router.replace("/lp-cfa");
      return;
    }
    setStatus("valid");
  }, [router]);

  useEffect(() => {
    if (status !== "valid") return;

    if (secondsLeft <= 0) {
      router.replace("/lp-cfa");
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, secondsLeft, router]);

  if (status !== "valid") return null;

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-cfa-cream px-6 py-16 text-center">
      <Image
        src="/api/site-assets/logo"
        alt={companyInfo.name}
        width={200}
        height={200}
        className="h-16 w-auto rounded-sm bg-white p-1.5 shadow-soft"
      />

      <div className="mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="mt-6 font-jakarta text-3xl font-bold text-cfa-navy sm:text-4xl">
        Thank You!
      </h1>
      <p className="mt-3 max-w-md text-base text-gray-600 sm:text-lg">
        Your enquiry has been received. Our mentor will call you back within
        24 hours.
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-4 sm:w-auto sm:flex-row">
        <a
          href={companyInfo.phoneHref}
          className="flex items-center justify-center gap-2 rounded-sm bg-cfa-gold px-8 py-3.5 text-base font-semibold text-cfa-navy transition-colors hover:bg-cfa-goldLight"
        >
          <Phone className="h-5 w-5" /> Call Us Now
        </a>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-sm border border-cfa-navy/20 px-8 py-3.5 text-base font-semibold text-cfa-navy transition-colors hover:bg-cfa-navy/5"
        >
          <Home className="h-5 w-5" /> Back to Home
        </Link>
      </div>

      <p className="mt-8 text-sm text-gray-400">
        Redirecting you back in {secondsLeft}s...
      </p>
    </section>
  );
}
