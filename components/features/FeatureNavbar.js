"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronDown, Menu, X, ArrowRight, 
  Map, Ticket, QrCode, Users, Shield, 
  Building2, Calendar, HelpCircle, FileText, Sparkles,
  Plane, Link2, BarChart3, Globe, Handshake
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { ALL_FEATURES } from "../../lib/featuresData";

const FEATURE_ICONS = {
  "site-web-evenementiel": Globe,
  "programme-agenda-interactif": Calendar,
  "billetterie-inscriptions": Ticket,
  "crm-participants": Users,
  "logistique-vip": Plane,
  "emargement-express-qr": QrCode,
  "multi-gate-check-in": Shield,
  "controle-acces-securite": Shield,
  "plan-2d-interactif": Map,
  "b2b-matchmaking-networking": Handshake,
  "marketing-influence-affiliation": Link2,
  "dashboard-analytics-certificats": BarChart3,
};

export default function FeatureNavbar({ featureTitle, category }) {
  const languageContext = useLanguage();
  const lang = languageContext?.lang || "en";
  const isFr = lang === "fr";

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (menuName) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  return (
    <div ref={navRef} className="sticky top-3 sm:top-4 z-50 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <header className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.05)] px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between transition-all relative">
        
        {/* Left Side: Logo & Main Navigation Links */}
        <div className="flex items-center gap-6 xl:gap-8">
          {/* Logo */}
          <Link 
            href="/"
            className="flex items-center gap-2 group shrink-0"
            title="Eventzone"
          >
            <img 
              src="https://i.imgur.com/jFDrQbM.png" 
              alt="eventzone" 
              style={{ height: '28px', width: 'auto' }}
              className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>

          {/* Desktop Navigation Links (Calendly Style) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] xl:text-[14px] font-medium text-slate-700">
            
            {/* Product Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => toggleDropdown("product")}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2 cursor-pointer focus:outline-hidden"
              >
                <span>{isFr ? "Produit" : "Product"}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "product" ? "rotate-180 text-slate-900" : "group-hover:text-slate-600"
                  }`} 
                />
              </button>

              {/* Product Flyout Menu */}
              {activeDropdown === "product" && (
                <div className="absolute top-full left-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    {isFr ? "Tous les Modules Eventzone" : "All Eventzone Modules"}
                  </div>
                  <div className="space-y-1 mt-1 max-h-80 overflow-y-auto pr-1">
                    {ALL_FEATURES.map((f) => {
                      const IconComp = FEATURE_ICONS[f.slug] || Sparkles;

                      return (
                        <Link
                          key={f.slug}
                          href={`/features/${f.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-blue-50/60 transition-colors group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors mt-0.5">
                            <IconComp size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover/item:text-blue-600 transition-colors truncate">
                              {f.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {f.tagline}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                    <Link
                      href="/features"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center justify-between p-2 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50/70 transition-colors"
                    >
                      <span>{isFr ? "Voir le catalogue complet" : "Explore full catalog"}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => toggleDropdown("solutions")}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2 cursor-pointer focus:outline-hidden"
              >
                <span>Solutions</span>
                <ChevronDown 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "solutions" ? "rotate-180 text-slate-900" : "group-hover:text-slate-600"
                  }`} 
                />
              </button>

              {activeDropdown === "solutions" && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    {isFr ? "Cas d'usage" : "Use Cases"}
                  </div>
                  <div className="space-y-1 mt-1">
                    <a
                      href="#details"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Building2 size={16} className="text-blue-600" />
                      <span>{isFr ? "Salons Professionnels & Foires" : "Trade Shows & Expos"}</span>
                    </a>
                    <a
                      href="#details"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Calendar size={16} className="text-blue-600" />
                      <span>{isFr ? "Congrès & Conférences" : "Conferences & Summits"}</span>
                    </a>
                    <a
                      href="#details"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Sparkles size={16} className="text-blue-600" />
                      <span>{isFr ? "Séminaires & Événements VIP" : "Corporate & VIP Events"}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => toggleDropdown("resources")}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2 cursor-pointer focus:outline-hidden"
              >
                <span>{isFr ? "Ressources" : "Resources"}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "resources" ? "rotate-180 text-slate-900" : "group-hover:text-slate-600"
                  }`} 
                />
              </button>

              {activeDropdown === "resources" && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    {isFr ? "Guides & Documentation" : "Help & Documentation"}
                  </div>
                  <div className="space-y-1 mt-1">
                    <a
                      href="#faq"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <HelpCircle size={16} className="text-blue-600" />
                      <span>{isFr ? "Questions Fréquentes (FAQ)" : "Frequently Asked Questions"}</span>
                    </a>
                    <Link
                      href="/compliance-gdpr"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Shield size={16} className="text-blue-600" />
                      <span>{isFr ? "Sécurité & Conformité RGPD" : "Security & GDPR"}</span>
                    </Link>
                    <Link
                      href="/features"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <FileText size={16} className="text-blue-600" />
                      <span>{isFr ? "Plaquette Commerciale" : "Product Overview"}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Direct Link */}
            <a
              href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20recevoir%20votre%20grille%20tarifaire"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors py-2 cursor-pointer"
            >
              <span>{isFr ? "Tarifs" : "Pricing"}</span>
            </a>
          </nav>
        </div>

        {/* Right Side: Talk to sales, Log In & Get started for free */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-5">
          {/* Talk to sales */}
          <a
            href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20%C3%A9changer%20avec%20un%20conseiller%20commercial"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] xl:text-[14px] font-medium text-slate-700 hover:text-slate-950 transition-colors"
          >
            {isFr ? "Contact commercial" : "Talk to sales"}
          </a>

          {/* Log In (Outlined White Button) */}
          <Link
            href="/checkin"
            className="px-4 py-2 text-[13px] xl:text-[14px] font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            {isFr ? "Connexion" : "Log In"}
          </Link>

          {/* Get started for free (Dark Navy Solid Button) */}
          <a
            href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20d%C3%A9marrer%20ou%20demander%20une%20d%C3%A9mo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 xl:px-5 py-2 text-[13px] xl:text-[14px] font-semibold text-white bg-[#0c1a30] hover:bg-[#162b4c] rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {isFr ? "Démarrer gratuitement" : "Get started for free"}
          </a>
        </div>

        {/* Mobile Actions: Get started + Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2.5">
          <a
            href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20une%20d%C3%A9mo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0c1a30] hover:bg-[#162b4c] rounded-lg shadow-sm transition-all"
          >
            {isFr ? "Démarrer" : "Get started"}
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 flex flex-col gap-3 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                {isFr ? "Produit & Fonctionnalités" : "Product & Features"}
              </Link>
              <a
                href="#details"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Solutions
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {isFr ? "Ressources & FAQ" : "Resources & FAQ"}
              </a>
              <a
                href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20conna%C3%AEtre%20les%20tarifs"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {isFr ? "Tarifs" : "Pricing"}
              </a>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a
                href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20un%20devis"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200"
              >
                {isFr ? "Contact commercial" : "Talk to sales"}
              </a>
              <Link
                href="/checkin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-300"
              >
                {isFr ? "Connexion" : "Log In"}
              </Link>
            </div>
          </div>
        )}

      </header>
    </div>
  );
}
