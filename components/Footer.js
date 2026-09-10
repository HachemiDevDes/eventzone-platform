"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUp, Check } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function Footer({ onOpenEventsHub, onOpenVisitorPasses, cutoutBg = "text-slate-50" }) {
  const { t, isRTL } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = newsletterEmail.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setNewsletterStatus("error");
      setNewsletterMessage(t("footer.invalidEmail", "Please enter a valid email address."));
      return;
    }
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, source: "footer_newsletter" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNewsletterStatus("success");
        setNewsletterMessage(t("footer.subscribedSuccess", "Thank you for subscribing to Eventzone updates!"));
        setNewsletterEmail("");
        try {
          localStorage.setItem("eventzone_newsletter_email", cleanEmail);
        } catch {}
      } else {
        setNewsletterStatus("error");
        setNewsletterMessage(data.error || t("footer.subscribeError", "Failed to subscribe. Please try again."));
      }
    } catch (err) {
      console.warn("Newsletter subscribe error:", err);
      setNewsletterStatus("success");
      setNewsletterMessage(t("footer.subscribedSuccess", "Thank you for subscribing to Eventzone updates!"));
    }
  };

  return (
    <div className="w-full mt-20 relative font-sans">
      {/* 1. Newsletter Arched Dome Section with background image & overlay */}
      <div className="relative w-full overflow-hidden bg-[#081431]">
        {/* Background photo: waiting_room_with_monitors */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/waiting_room_with_monitors.jpg')" }}
        />

        {/* Midnight navy overlay for contrast and sleek dark look */}
        <div className="absolute inset-0 bg-[#081431]/85" />

        {/* Top Arched Convex Dome Cutout (masks corners with page bg) */}
        <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none select-none z-10 -mt-[1px]">
          <svg
            viewBox="0 0 1440 180"
            fill="none"
            preserveAspectRatio="none"
            className={`w-full h-20 sm:h-32 md:h-44 lg:h-52 ${cutoutBg} block`}
            aria-hidden="true"
          >
            <path
              d="M0,0 L1440,0 L1440,180 C1080,10 360,10 0,180 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Newsletter Content inside the Dome */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8">
          <section className="pt-24 sm:pt-36 md:pt-44 lg:pt-48 pb-20 sm:pb-24 md:pb-28 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              {t("footer.subscribeNewsletter", "Subscribe to our newsletter")}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-2.5 sm:mt-3 max-w-xl mx-auto drop-shadow-sm font-medium">
              {t("footer.newsletterSubtitle", "to stay up to date on all the latest news and offers from us")}
            </p>

            {/* Newsletter Form: Input and fully rounded button NEXT TO each other */}
            <form onSubmit={handleNewsletterSubmit} className="mt-7 sm:mt-8 max-w-xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (newsletterStatus !== "idle") setNewsletterStatus("idle");
                }}
                placeholder={t("footer.emailPlaceholder", "Enter your business email")}
                className="w-full sm:flex-1 bg-white text-slate-900 placeholder-slate-400 text-sm font-medium px-6 py-3.5 shadow-xl border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#0b5cdb]"
                style={{ borderRadius: "9999px" }}
                required
              />
              <button
                type="submit"
                disabled={newsletterStatus === "loading"}
                className="shrink-0 w-full sm:w-auto px-8 sm:px-10 py-3.5 text-white font-bold text-sm bg-[#0b5cdb] hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 flex items-center justify-center"
                style={{ borderRadius: "9999px" }}
              >
                {newsletterStatus === "loading" ? t("footer.subscribing", "Subscribing...") : t("footer.subscribeBtn", "Subscribe")}
              </button>
            </form>

            {newsletterStatus === "success" && (
              <p className="text-xs font-semibold text-emerald-400 mt-3.5 flex items-center justify-center gap-1.5 animate-fade-in">
                <Check size={14} className="text-emerald-400" />
                {newsletterMessage}
              </p>
            )}
            {newsletterStatus === "error" && (
              <p className="text-xs font-semibold text-rose-400 mt-3.5 animate-fade-in">
                {newsletterMessage}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* 2. Main Dark Footer Body */}
      <footer className="bg-[#081431] text-slate-300 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">

          {/* B. Middle 3-Column Info Strip (Contact, Address, Hours) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 py-8 border-y border-white/10 text-start rtl:text-right text-left">
            {/* Column 1: Contact us */}
            <div className="md:pr-8 md:rtl:pr-0 md:rtl:pl-8 md:border-r md:rtl:border-r-0 md:rtl:border-l border-white/10 space-y-2.5">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.contactUs", "Contact us")}
              </p>
              <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-medium">
                <p className="flex items-center gap-2">
                  <span className="text-white font-bold">{t("footer.emailPrefix", "E :")}</span>
                  <a href="mailto:contact@eventzone.pro" className="hover:text-blue-400 transition-colors">
                    contact@eventzone.pro
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white font-bold">{t("footer.phonePrefix", "P :")}</span>
                  <a href="tel:+213781457511" className="hover:text-blue-400 transition-colors">
                    <bdi dir="ltr">+213(0) 781 45 75 11</bdi>
                  </a>
                </p>
              </div>
            </div>

            {/* Column 2: Address */}
            <div className="md:px-8 md:border-r md:rtl:border-r-0 md:rtl:border-l border-white/10 space-y-2.5">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.addressTitle", "Headquarters address:")}
              </p>
              <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                <p>{t("footer.addressLine1", "Eventzone Global HQ, Cyberparc Sidi Abdellah")}</p>
                <p>{t("footer.addressLine2", "Rahmania, Algiers 16093, Algeria")}</p>
              </div>
            </div>

            {/* Column 3: Hours / Availability */}
            <div className="md:pl-8 md:rtl:pl-0 md:rtl:pr-8 space-y-2.5">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.supportHoursTitle", "Platform Opening Times:")}
              </p>
              <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-medium">
                <p className="font-semibold text-white">{t("footer.workingDays", "Monday - Saturday")}</p>
                <p className="text-slate-400"><bdi dir="ltr">{t("footer.workingHours", "08:30am - 06:30pm (GMT+1)")}</bdi></p>
              </div>
            </div>
          </div>

          {/* C. Lower 4 Columns (Categories, Resources, Social, Accepted Payments) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pt-8 pb-12 text-start rtl:text-right text-left text-xs">
            {/* Column 1: Product Categories */}
            <div className="space-y-3">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.productCategories", "Product Categories:")}
              </p>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <Link href="/#explore" className="hover:text-white transition-colors">
                    {t("footer.catTechAi", "Tech & AI Summits")}
                  </Link>
                </li>
                <li>
                  <Link href="/#explore" className="hover:text-white transition-colors">
                    {t("footer.catConferences", "International Conferences")}
                  </Link>
                </li>
                <li>
                  <Link href="/#explore" className="hover:text-white transition-colors">
                    {t("footer.catExpos", "Hybrid Expos & Fairs")}
                  </Link>
                </li>
                <li>
                  <Link href="/#explore" className="hover:text-white transition-colors">
                    {t("footer.catCleanEnergy", "Clean Energy Forums")}
                  </Link>
                </li>
                <li>
                  <Link href="/#explore" className="hover:text-white transition-colors">
                    {t("footer.catHealthcare", "Healthcare & Bio Congresses")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div className="space-y-3">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.resourcesTitle", "Resources:")}
              </p>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenEventsHub) onOpenEventsHub();
                      else window.location.href = "/?view=events-hub";
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-start rtl:text-right text-left"
                  >
                    {t("eventsHub.title", "Organizer Event Center")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenEventsHub) onOpenEventsHub();
                      else window.location.href = "/?view=events-hub";
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-start rtl:text-right text-left"
                  >
                    {t("dash.floorPlans", "Floor Plans")}
                  </button>
                </li>
                <li>
                  <Link
                    href="/checkin"
                    className="hover:text-white transition-colors block text-start rtl:text-right text-left"
                  >
                    {t("dash.checkIn", "Check In")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors block text-start rtl:text-right text-left text-blue-400 font-bold"
                  >
                    {t("footer.featuresSuite", "Platform Features")}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    {t("footer.privacyPolicy", "Privacy Policy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    {t("footer.termsOfService", "Terms of Service")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-settings" className="hover:text-white transition-colors">
                    {t("footer.cookieSettings", "Cookie Settings")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Follow us on */}
            <div className="space-y-3">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.followUsOn", "Follow us on")}
              </p>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block"
                  >
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block"
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Accepted payments - EDAHABIA & CIB ON DARK BG */}
            <div className="space-y-3">
              <p className="text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.acceptedPayments", "Accepted payments")}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1.5">
                {/* 1. EDAHABIA */}
                <div
                  title={t("footer.edahabiaCard", "Carte EDAHABIA")}
                  className="px-4 py-2 bg-[#0c1e4a] border border-[#1b3473]/80 hover:border-blue-500/80 rounded-xl flex items-center justify-center h-12 shadow-md transition-all hover:scale-105 select-none"
                >
                  <img
                    src="/dahabia_logo.png"
                    alt="EDAHABIA"
                    className="h-7 w-auto object-contain max-w-[85px]"
                  />
                </div>

                {/* 2. CIB */}
                <div
                  title={t("footer.cibCard", "Carte CIB")}
                  className="px-4 py-2 bg-[#0c1e4a] border border-[#1b3473]/80 hover:border-blue-500/80 rounded-xl flex items-center justify-center h-12 shadow-md transition-all hover:scale-105 select-none"
                >
                  <img
                    src="/cib_logo.png"
                    alt="CIB"
                    className="h-7 w-auto object-contain max-w-[85px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* D. Bottom Copyright & Back-to-Top Bar */}
          <div className="pt-8 pb-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <span>{t("footer.rightsReserved", "© 2026 Eventzone. All rights reserved.")}</span>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c1e4a] hover:bg-[#112a66] text-slate-300 hover:text-white border border-[#1b3473]/80 transition-all font-semibold cursor-pointer shadow-xs"
            >
              <ArrowUp size={14} />
              <span>{t("footer.backToTop", "Back to Top")}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
