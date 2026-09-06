"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUp, Check } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function Footer({ onOpenEventsHub, onOpenVisitorPasses }) {
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !/^\S+@\S+\.\S+$/.test(newsletterEmail.trim())) {
      setNewsletterStatus("error");
      setNewsletterMessage(t("footer.invalidEmail", "Please enter a valid email address."));
      return;
    }
    setNewsletterStatus("success");
    setNewsletterMessage(t("footer.subscribedSuccess", "Thank you for subscribing to Eventzone updates!"));
    try {
      localStorage.setItem("eventzone_newsletter_email", newsletterEmail.trim());
    } catch {}
  };

  return (
    <div className="w-full mt-20 relative font-sans">
      {/* 1. Top Arched Convex Dome Transition */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none -mb-[1px] bg-slate-50">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-12 sm:h-20 md:h-28 text-[#0a0d14] block"
          aria-hidden="true"
        >
          <path
            d="M0,100 C360,10 1080,10 1440,100 L1440,100 L0,100 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* 2. Main Dark Footer Body */}
      <footer className="bg-[#0a0d14] text-slate-300 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* A. Hero Newsletter Section inside the Dome */}
          <section className="relative pt-2 sm:pt-4 pb-12 sm:pb-16 text-center max-w-3xl mx-auto">
            {/* Ambient decorative glow */}
            <div
              className="absolute inset-0 pointer-events-none -z-10 opacity-35"
              style={{
                background: "radial-gradient(circle at 50% 30%, rgba(220, 38, 38, 0.18), transparent 70%)",
              }}
            />

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {t("footer.subscribeNewsletter", "Subscribe to our newsletter")}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-2.5 sm:mt-3 max-w-xl mx-auto">
              {t("footer.newsletterSubtitle", "to stay up to date on all the latest news and offers from us")}
            </p>

            {/* Newsletter Pill Capsule */}
            <form onSubmit={handleNewsletterSubmit} className="mt-7 sm:mt-8 max-w-xl mx-auto">
              <div className="bg-white rounded-full p-1 sm:p-1.5 pl-5 sm:pl-6 flex items-center shadow-2xl border border-white/20 transition-all focus-within:ring-2 focus-within:ring-red-500/60">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterStatus !== "idle") setNewsletterStatus("idle");
                  }}
                  placeholder={t("footer.emailPlaceholder", "Enter your email address")}
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none pr-3"
                  required
                />
                <button
                  type="submit"
                  className="shrink-0 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-white font-bold text-xs sm:text-sm bg-red-600 hover:bg-red-700 transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
                >
                  {t("footer.subscribeBtn", "Subscribe")}
                </button>
              </div>

              {newsletterStatus === "success" && (
                <p className="text-xs font-semibold text-emerald-400 mt-3 flex items-center justify-center gap-1.5 animate-fade-in">
                  <Check size={14} className="text-emerald-400" />
                  {newsletterMessage}
                </p>
              )}
              {newsletterStatus === "error" && (
                <p className="text-xs font-semibold text-rose-400 mt-3 animate-fade-in">
                  {newsletterMessage}
                </p>
              )}
            </form>
          </section>

          {/* B. Middle 3-Column Info Strip (Contact, Address, Hours) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 py-8 border-y border-slate-800/80 text-start rtl:text-right text-left">
            {/* Column 1: Contact us */}
            <div className="md:pr-8 md:border-r border-slate-800/80 space-y-2.5">
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.contactUs", "Contact us")}
              </p>
              <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-medium">
                <p className="flex items-center gap-2">
                  <span className="text-white font-bold">E :</span>
                  <a href="mailto:support@eventzone.io" className="hover:text-red-400 transition-colors">
                    support@eventzone.io
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white font-bold">P :</span>
                  <a href="tel:+21323000000" className="hover:text-red-400 transition-colors">
                    +213 (0) 23 00 00 00
                  </a>
                </p>
              </div>
            </div>

            {/* Column 2: Address */}
            <div className="md:px-8 md:border-r border-slate-800/80 space-y-2.5">
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.addressTitle", "Headquarters address:")}
              </p>
              <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                <p>Eventzone Global HQ, Cyberparc Sidi Abdellah</p>
                <p>Rahmania, Algiers 16093, Algeria</p>
              </div>
            </div>

            {/* Column 3: Hours / Availability */}
            <div className="md:pl-8 space-y-2.5">
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.supportHoursTitle", "Platform Opening Times:")}
              </p>
              <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-medium">
                <p className="font-semibold text-white">Monday - Saturday</p>
                <p className="text-slate-400">08:30am - 06:30pm (GMT+1)</p>
              </div>
            </div>
          </div>

          {/* C. Lower 4 Columns (Categories, Resources, Social, Accepted Payments) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pt-8 pb-12 text-start rtl:text-right text-left text-xs">
            {/* Column 1: Product Categories */}
            <div className="space-y-3">
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.productCategories", "Product Categories:")}
              </p>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <a href="#explore" className="hover:text-white transition-colors">
                    Tech &amp; AI Summits
                  </a>
                </li>
                <li>
                  <a href="#explore" className="hover:text-white transition-colors">
                    International Conferences
                  </a>
                </li>
                <li>
                  <a href="#explore" className="hover:text-white transition-colors">
                    Hybrid Expos &amp; Fairs
                  </a>
                </li>
                <li>
                  <a href="#explore" className="hover:text-white transition-colors">
                    Clean Energy Forums
                  </a>
                </li>
                <li>
                  <a href="#explore" className="hover:text-white transition-colors">
                    Healthcare &amp; Bio Congresses
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div className="space-y-3">
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.resourcesTitle", "Resources:")}
              </p>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenEventsHub && onOpenEventsHub()}
                    className="hover:text-white transition-colors cursor-pointer text-start rtl:text-right text-left"
                  >
                    {t("eventsHub.title", "Organizer Event Center")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenEventsHub && onOpenEventsHub()}
                    className="hover:text-white transition-colors cursor-pointer text-start rtl:text-right text-left"
                  >
                    {t("dash.floorPlans", "2D Floor Plan Builder")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenEventsHub && onOpenEventsHub()}
                    className="hover:text-white transition-colors cursor-pointer text-start rtl:text-right text-left"
                  >
                    {t("dash.checkIn", "Check-In Command")}
                  </button>
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
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
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

            {/* Column 4: Accepted payments */}
            <div className="space-y-3">
              <p className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">
                {t("footer.acceptedPayments", "Accepted payments")}
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1 max-w-[260px]">
                {/* 1. VISA */}
                <div
                  title="Visa"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-white rounded-md flex items-center justify-center shadow-xs border border-white/20 select-none p-1"
                >
                  <span className="text-[#1a1f71] font-black italic text-xs tracking-tighter">VISA</span>
                </div>

                {/* 2. Mastercard */}
                <div
                  title="Mastercard"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-white rounded-md flex items-center justify-center shadow-xs border border-white/20 select-none p-1"
                >
                  <div className="flex items-center -space-x-2">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#eb001b]" />
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#f79e1b] opacity-90" />
                  </div>
                </div>

                {/* 3. American Express */}
                <div
                  title="American Express"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-[#006fcf] rounded-md flex items-center justify-center shadow-xs border border-white/20 select-none p-0.5"
                >
                  <span className="text-white font-black text-[8px] sm:text-[9px] tracking-tight">AMEX</span>
                </div>

                {/* 4. Discover */}
                <div
                  title="Discover"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-white rounded-md flex items-center justify-center shadow-xs border border-white/20 select-none p-1"
                >
                  <span className="text-slate-900 font-extrabold text-[7px] sm:text-[8px] tracking-tight flex items-center">
                    DISC<span className="w-1.5 h-1.5 rounded-full bg-[#ff6000] inline-block mx-0.5" />VER
                  </span>
                </div>

                {/* 5. Edahabia */}
                <div
                  title="Carte Edahabia"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-md flex items-center justify-center shadow-xs border border-amber-400/30 select-none p-0.5"
                >
                  <span className="text-white font-black text-[7px] sm:text-[8px] tracking-tighter uppercase">
                    Edahabia
                  </span>
                </div>

                {/* 6. CIB */}
                <div
                  title="Carte CIB"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-[#008752] rounded-md flex items-center justify-center shadow-xs border border-emerald-400/30 select-none p-1"
                >
                  <span className="text-white font-black text-[8px] sm:text-[9px] tracking-wider">CIB</span>
                </div>

                {/* 7. PayPal */}
                <div
                  title="PayPal"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-white rounded-md flex items-center justify-center shadow-xs border border-white/20 select-none p-1"
                >
                  <span className="text-[#003087] font-black italic text-[9px] sm:text-[10px] tracking-tighter">
                    Pay<span className="text-[#0079c1]">Pal</span>
                  </span>
                </div>

                {/* 8. Apple Pay */}
                <div
                  title="Apple Pay"
                  className="w-12 h-7 sm:w-14 sm:h-8 bg-black rounded-md flex items-center justify-center shadow-xs border border-white/20 select-none p-1"
                >
                  <span className="text-white font-semibold text-[8px] sm:text-[9px] tracking-tight">Pay</span>
                </div>
              </div>
            </div>
          </div>

          {/* D. Bottom Copyright & Back-to-Top Bar */}
          <div className="pt-8 pb-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <span>{t("footer.rightsReserved", "© 2026 Eventzone. All rights reserved.")}</span>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all font-semibold cursor-pointer shadow-xs"
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
