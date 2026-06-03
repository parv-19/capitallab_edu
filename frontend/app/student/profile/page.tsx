"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Eye, EyeOff, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

function PasswordStrength({ password }: { password: string }) {
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  if (!password) return null;
  return (
    <div className="mt-2 flex gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? colors[strength - 1] : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/student/profile", form);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
    setSaving(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/student/profile/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password updated!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Incorrect current password or server error.");
    }
    setSavingPw(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.put("/student/profile", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Avatar upload failed.");
    }
    e.target.value = "";
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">My Profile</h1>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="relative">
            <div
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-extrabold text-white"
              onClick={() => fileRef.current?.click()}
            >
              {user?.name?.charAt(0) ?? "S"}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50"
            >
              <Camera className="h-3.5 w-3.5 text-gray-500" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <div className="text-lg font-bold text-brand-navy">{user?.name ?? "Student"}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
            <div className="mt-1 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              Student
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="98765 43210"
              maxLength={10}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Email</label>
            <input
              value={user?.email ?? ""}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-6">
        <h2 className="mb-5 font-bold text-brand-navy">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Current Password</label>
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">New Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={pwForm.newPassword} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Confirm New Password</label>
            <input
              type="password"
              required
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
          >
            {savingPw ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : "Update Password"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-6">
        <h2 className="mb-4 font-bold text-brand-navy">Enrolled Courses</h2>
        {user?.enrollments?.length ? (
          <div className="space-y-2">
            {user.enrollments.map((course) => (
              <div key={course._id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-brand-navy">{course.title ?? course._id}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No courses enrolled yet.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-red-100 bg-white p-4 shadow-soft sm:p-6">
        <h2 className="mb-2 font-bold text-red-600">Danger Zone</h2>
        <p className="mb-5 text-sm text-gray-500">Permanently delete your account and all associated data. This action cannot be undone.</p>

        {logoutConfirm ? (
          <div className="rounded-xl bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-red-800">Are you absolutely sure?</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={async () => {
                  try {
                    await api.delete("/student/profile");
                    toast.success("Account deleted.");
                    logout();
                  } catch {
                    toast.error("Failed to delete account.");
                  }
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setLogoutConfirm(false)}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => logout()}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Sign Out
            </button>
            <button
              onClick={() => setLogoutConfirm(true)}
              className="rounded-xl bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
