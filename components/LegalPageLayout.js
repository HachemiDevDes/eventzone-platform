/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import Footer from "./Footer";

const LEGAL_NAV_ITEMS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Settings", href: "/cookie-settings" },
  { label: "Enterprise Security", href: "/enterprise-security" },
  { label: "Compliance & GDPR", href: "/compliance-gdpr" },
];

export default function LegalPageLayout({
  title,
  lastUpdated = "September 2026",
  description,
  activeHref,
  children
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Minimalist Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" title="Eventzone Home">
            <img
              src="https://i.imgur.com/jFDrQbM.png"
              alt="Eventzone"
              className="h-6 w-auto object-contain"
            />
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            ← Back to Eventzone
          </Link>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 sm:py-16">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Last updated: {lastUpdated}
          </p>
          {description && (
            <p className="text-sm text-slate-600 pt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="w-full h-px bg-slate-200 mb-10" />

        {/* Clean Article Content */}
        <article className="space-y-10 text-sm sm:text-[15px] leading-relaxed text-slate-700">
          {children}
        </article>
      </main>

      {/* Standard Eventzone Platform Footer */}
      <Footer cutoutBg="text-slate-50" />
    </div>
  );
}
