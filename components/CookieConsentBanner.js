"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function CookieConsentBanner() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkConsent() {
      try {
        // Fast local check: if user has already made a selection in this browser, don't show
        const localConsent = localStorage.getItem("eventzone_cookie_consent");
        if (localConsent) {
          return;
        }

        // Check backend to verify if this machine IP has already been shown the banner
        const res = await fetch("/api/cookies/consent", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.showBanner && isMounted) {
          setTimeout(() => {
            if (isMounted) setIsVisible(true);
          }, 500);
        } else if (!data.showBanner && data.status) {
          // Sync local storage so subsequent renders in this browser don't query the API again
          localStorage.setItem("eventzone_cookie_consent", data.status);
        }
      } catch (err) {
        console.warn("Cookie consent check failed:", err);
      }
    }

    checkConsent();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveConsent = async (status) => {
    setIsVisible(false);
    try {
      localStorage.setItem("eventzone_cookie_consent", status);
      localStorage.setItem(
        "eventzone_cookie_preferences",
        JSON.stringify({
          essential: true,
          functional: true,
          analytics: status === "accepted",
          updatedAt: new Date().toISOString(),
        })
      );

      // Report updated consent status to server for this machine IP
      await fetch("/api/cookies/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn("Error saving cookie consent:", err);
    }
  };

  const handleAcceptAll = () => saveConsent("accepted");
  const handleEssentialOnly = () => saveConsent("essential");

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie Consent"
      className="fixed bottom-0 inset-x-0 z-[9999] p-3 sm:p-5 pointer-events-none transition-all duration-300 font-sans"
    >
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
        {/* Cookie Text & Links */}
        <div className="flex items-start gap-3 flex-1 text-start rtl:text-right text-left">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <Cookie size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                "cookies.bannerText",
                "We use cookies to improve your experience, maintain your session, and secure event passes. By continuing, you agree to our use of cookies."
              )}
            </p>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <Link
                href="/cookie-settings"
                className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
              >
                {t("cookies.settings", "Cookie Settings")}
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/privacy"
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                {t("footer.privacyPolicy", "Privacy Policy")}
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-center"
          >
            {t("cookies.essentialOnly", "Essential Only")}
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer text-center"
          >
            {t("cookies.acceptAll", "Accept All")}
          </button>
        </div>
      </div>
    </aside>
  );
}
