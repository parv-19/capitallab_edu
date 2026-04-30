"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Eye, EyeOff, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

function PasswordStrength({ password }: { password: string }) {
  const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  if (!password) return null;
  return (
    <div className="mt-2 flex gap-1">
      {[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? colors[strength-1] : "bg-gray-200"}`} />)}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuth();

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/student/profile", form);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile."); }
    setSaving(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("New passwords do not match."); return; }
    setSavingPw(true);
    try {
      await api.put("/student/profile/password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password updated!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch { toast.error("Incorrect current password or server error."); }
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
    } catch { toast.error("Avatar upload failed."); }
    e.target.value = "";
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">My Profile</h1>

      {/* Avatar & Basic Info */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white cursor-pointer" onClick={() => fileRef.current?.click()}>
              {user?.name?.charAt(0) ?? "S"}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow hover:bg-gray-50">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <div className="font-bold text-brand-navy text-lg">{user?.name ?? "Student"}</div>
            <div className="text-gray-400 text-sm">{user?.email}</div>
            <div className="mt-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full inline-block">Student</div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="98765 43210" maxLength={10}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Email</label>
            <input value={user?.email ?? ""} disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <h2 className="font-bold text-brand-navy mb-5">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Current Password</label>
            <input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">New Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={pwForm.newPassword} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Confirm New Password</label>
            <input type="password" required value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <button type="submit" disabled={savingPw} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70">
            {savingPw ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : "Update Password"}
          </button>
        </form>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <h2 className="font-bold text-brand-navy mb-4">Enrolled Courses</h2>
        {user?.enrollments?.length ? (
          <div className="space-y-2">
            {user.enrollments.map((course) => (
              <div key={course._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-brand-navy font-medium">{course.title ?? course._id}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm">No courses enrolled yet.</p>}
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-red-100 mt-6">
        <h2 className="font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-5">Permanently delete your account and all associated data. This action cannot be undone.</p>
        
        {logoutConfirm ? (
          <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl">
            <p className="text-sm text-red-800 font-medium flex-1">Are you absolutely sure?</p>
            <button onClick={async () => {
              try {
                await api.delete("/student/profile");
                toast.success("Account deleted.");
                logout();
              } catch {
                toast.error("Failed to delete account.");
              }
            }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Yes, Delete Account</button>
            <button onClick={() => setLogoutConfirm(false)} className="px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100">Cancel</button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button onClick={() => logout()} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              Sign Out
            </button>
            <button onClick={() => setLogoutConfirm(true)} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
