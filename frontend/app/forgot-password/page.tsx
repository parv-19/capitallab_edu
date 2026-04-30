"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import * as authApi from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("No account found with that email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-brand-navy text-lg">Capital<span className="text-brand-gold">Lab</span></span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
              <Mail className="w-8 h-8 text-brand-navy" />
            </div>
            <h1 className="text-2xl font-bold text-brand-navy mb-3">Check your inbox</h1>
            <p className="text-gray-500 mb-2">We&apos;ve sent a password reset link to</p>
            <p className="font-semibold text-brand-navy mb-6">{email}</p>
            <p className="text-gray-400 text-sm mb-6">Didn&apos;t receive the email? Check spam or try again.</p>
            <button onClick={() => setSent(false)} className="text-brand-navy font-semibold hover:text-brand-gold transition-colors text-sm">
              Try a different email →
            </button>
          </div>
        ) : (
          <>
            <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-navy mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
            <h1 className="text-3xl font-extrabold text-brand-navy mb-2">Reset your password</h1>
            <p className="text-gray-500 mb-8">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-colors bg-white" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-brand-navy text-white font-bold rounded-xl hover:bg-brand-navyDark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
