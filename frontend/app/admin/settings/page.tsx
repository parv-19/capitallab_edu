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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your admin preferences and platform configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {[
            { icon: User, label: "Profile", active: true },
            { icon: Shield, label: "Security", active: false },
            { icon: Bell, label: "Notifications", active: false },
            { icon: Key, label: "API Keys", active: false },
          ].map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.active ? "bg-brand-navy text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-brand-navy">Profile Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Update your admin contact information.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">First Name</label>
                  <input defaultValue="Admin" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Last Name</label>
                  <input defaultValue="Harsh" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Email Address</label>
                <input defaultValue="admin@capitallabedu.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-navyDark transition-colors disabled:opacity-70">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
