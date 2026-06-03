"use client";

import { useState } from "react";
import { Save, User, Bell, Shield, Key } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully.");
    }, 800);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Platform Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your admin preferences and platform configurations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-1 md:sticky md:top-24 md:self-start">
          {[
            { icon: User, label: "Profile", active: true },
            { icon: Shield, label: "Security", active: false },
            { icon: Bell, label: "Notifications", active: false },
            { icon: Key, label: "API Keys", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${item.active ? "bg-brand-navy text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-6 md:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
            <div className="border-b border-gray-50 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-brand-navy">Profile Settings</h2>
              <p className="mt-1 text-sm text-gray-500">Update your admin contact information.</p>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">First Name</label>
                  <input
                    defaultValue="Admin"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Last Name</label>
                  <input
                    defaultValue="Harsh"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">Email Address</label>
                <input
                  defaultValue="admin@capitallabedu.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
                />
              </div>
            </div>

            <div className="flex justify-stretch border-t border-gray-100 bg-gray-50 px-4 py-4 sm:justify-end sm:px-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navyDark disabled:opacity-70 sm:w-auto"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
