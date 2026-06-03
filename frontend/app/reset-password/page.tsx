"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import * as authApi from "@/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match."); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password, form.confirmPassword);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      toast.error("Reset link is invalid or expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-brand-navy mb-3">Password Updated!</h2>
        <p className="text-gray-500">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold text-brand-navy mb-2">Set new password</h1>
      <p className="text-gray-500 mb-8">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">New Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-colors bg-white" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
          <input type="password" required value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-colors bg-white" />
        </div>
        <button type="submit" disabled={loading || !token}
          className="w-full py-3 bg-brand-navy text-white font-bold rounded-xl hover:bg-brand-navyDark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : "Update Password"}
        </button>
        {!token && <p className="text-red-500 text-sm text-center">Invalid reset link. <Link href="/forgot-password" className="font-semibold underline">Request new one</Link></p>}
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/api/site-assets/logo"
            alt="Capital Lab Education"
            className="h-12 w-auto rounded-sm bg-white p-1 shadow-sm"
          />
        </div>
        <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
