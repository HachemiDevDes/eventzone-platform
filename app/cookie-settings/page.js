"use client";

import React, { useState, useEffect } from "react";
import LegalPageLayout from "../../components/LegalPageLayout";

export default function CookieSettingsPage() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always true and locked
    functional: true,
    analytics: false,
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eventzone_cookie_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({
          ...prev,
          functional: parsed.functional ?? true,
          analytics: parsed.analytics ?? false,
        }));
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleToggle = (key) => {
    if (key === "essential") return; // cannot disable essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSavedNotice(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("eventzone_cookie_preferences", JSON.stringify({
        essential: true,
        functional: preferences.functional,
        analytics: preferences.analytics,
        updatedAt: new Date().toISOString(),
      }));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <LegalPageLayout
      title="Cookie Settings"
      lastUpdated="September 2026"
      description="Manage how Eventzone uses cookies and browser storage to deliver platform functionality."
      activeHref="/cookie-settings"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. How We Use Cookies</h2>
        <p>
          Eventzone uses essential cookies and browser storage mechanisms (such as localStorage) to keep you securely signed in, preserve your interface language (English, French, or Arabic), and ensure reliable ticket checkout.
        </p>
      </section>

      {/* Preferences Panel */}
      <section className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-slate-900">2. Cookie Preferences</h2>
        <p className="text-sm text-slate-600">
          You can customize which non-essential cookies are enabled. Essential cookies cannot be disabled as they are required for security and core event operations.
        </p>

        <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white overflow-hidden">
          {/* Essential Cookies */}
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Essential Cookies</span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Required for core authentication, session management, CSRF protection, and door check-in verification. The platform cannot function properly without these.
              </p>
            </div>
            <input
              type="checkbox"
              checked={true}
              disabled
              className="mt-1 h-4 w-4 text-blue-600 rounded cursor-not-allowed opacity-60"
            />
          </div>

          {/* Functional Preferences */}
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 text-sm">Functional Preferences</span>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Stores your selected interface language, view settings, and temporary registration wizard state between visits.
              </p>
            </div>
            <input
              type="checkbox"
              id="functional-cookie"
              checked={preferences.functional}
              onChange={() => handleToggle("functional")}
              className="mt-1 h-4 w-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* Analytics & Performance */}
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 text-sm">Analytics & Performance</span>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Helps us measure page load speeds and identify navigation friction to improve the attendee registration flow. No personal identity is sold or shared.
              </p>
            </div>
            <input
              type="checkbox"
              id="analytics-cookie"
              checked={preferences.analytics}
              onChange={() => handleToggle("analytics")}
              className="mt-1 h-4 w-4 text-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Save Preferences
          </button>
          {savedNotice && (
            <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
              Preferences saved successfully.
            </span>
          )}
        </div>
      </section>

      <section className="space-y-3 pt-4">
        <h2 className="text-lg font-bold text-slate-900">3. Browser Controls</h2>
        <p>
          You may also manage or delete cookies directly through your browser settings. Note that disabling all cookies will prevent you from signing in to your organizer account or accessing digital passes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Contact</h2>
        <p>
          For inquiries regarding our use of cookies, contact{" "}
          <a href="mailto:privacy@eventzone.pro" className="text-blue-600 font-medium hover:underline">
            privacy@eventzone.pro
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
