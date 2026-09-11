"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronDown, Menu, X, ArrowRight, Check,
  Map, Ticket, QrCode, Users, Shield, 
  Building2, Calendar, HelpCircle, FileText, Sparkles,
  Plane, Link2, BarChart3, Globe, Handshake, Smartphone
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { getFeaturesUI, getLocalizedAllFeatures } from "../../lib/featuresData";

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
  "portail-participant": Smartphone,
};

export default function FeatureNavbar({ featureTitle, category }) {
  const languageContext = useLanguage();
  const lang = languageContext?.lang || "en";
  const setLang = languageContext?.setLang;
  const isRTL = languageContext?.isRTL || false;
  const languages = languageContext?.languages || [
    { code: "en", label: "English", short: "EN", icon: "https://i.imgur.com/NXtMImD.png" },
    { code: "fr", label: "Français", short: "FR", icon: "https://i.imgur.com/yS9Hjy9.png" },
    { code: "ar", label: "العربية", short: "AR", icon: "https://i.imgur.com/MolxgOM.png" },
  ];

  const curLang = languages.find(l => l.code === lang) || languages[0];
  const ui = getFeaturesUI(lang);
  const localizedFeatures = getLocalizedAllFeatures(lang);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (menuName) => {
    setLangMenuOpen(false);
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };
  return (
    <div ref={navRef} className="sticky top-3 sm:top-4 z-50 w-[95%] mx-auto">
      <header 
        className="bg-white rounded-[18px] sm:rounded-[20px] border border-slate-200/90 shadow-[0_2px_16px_rgba(0,0,0,0.06)] pl-4 sm:pl-6 pr-2.5 sm:pr-3.5 rtl:pr-4 sm:rtl:pr-6 rtl:pl-2.5 sm:rtl:pl-3.5 h-16 sm:h-[70px] flex items-center justify-between transition-all relative w-full squircle-smooth"
        style={{
          cornerSmoothing: "1",
          WebkitCornerSmoothing: "1",
          cornerShape: "squircle",
        }}
      >
        
        {/* Left Side: Logo & Main Navigation Links */}
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 min-w-0">
          {/* Logo */}
          <Link 
            href="/"
            className="flex items-center gap-2 shrink-0"
            title="Eventzone"
          >
            <img 
              src="https://i.imgur.com/jFDrQbM.png" 
              alt="eventzone" 
              style={{ height: '22px', width: 'auto', maxWidth: '120px' }}
              className="h-5 sm:h-[22px] w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation Links (Calendly Style) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[13px] xl:text-[14px] font-medium text-slate-700">
            
            {/* Product Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => toggleDropdown("product")}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2 cursor-pointer focus:outline-hidden"
              >
                <span>{ui.product}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "product" ? "rotate-180 text-slate-900" : "group-hover:text-slate-600"
                  }`} 
                />
              </button>

              {/* Product Flyout Menu */}
              {activeDropdown === "product" && (
                <div className={`absolute top-full ${isRTL ? "right-0" : "left-0"} mt-2 w-84 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 text-start">
                    {ui.allModules}
                  </div>
                  <div className="space-y-1 mt-1 max-h-80 overflow-y-auto pr-1">
                    {localizedFeatures.map((f) => {
                      const IconComp = FEATURE_ICONS[f.slug] || Sparkles;

                      return (
                        <Link
                          key={f.slug}
                          href={`/features/${f.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-blue-50/60 transition-colors group/item text-start"
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
                      <span>{ui.exploreCatalog}</span>
                      <ArrowRight size={14} className="rtl:rotate-180" />
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
                <span>{ui.solutions}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "solutions" ? "rotate-180 text-slate-900" : "group-hover:text-slate-600"
                  }`} 
                />
              </button>

              {activeDropdown === "solutions" && (
                <div className={`absolute top-full ${isRTL ? "right-0" : "left-0"} mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 text-start">
                    {ui.useCases}
                  </div>
                  <div className="space-y-1 mt-1 text-start">
                    <a
                      href="#details"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Building2 size={16} className="text-blue-600 shrink-0" />
                      <span>{ui.tradeShows}</span>
                    </a>
                    <a
                      href="#details"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Calendar size={16} className="text-blue-600 shrink-0" />
                      <span>{ui.conferences}</span>
                    </a>
                    <a
                      href="#details"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Sparkles size={16} className="text-blue-600 shrink-0" />
                      <span>{ui.corporateVip}</span>
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
                <span>{ui.resources}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    activeDropdown === "resources" ? "rotate-180 text-slate-900" : "group-hover:text-slate-600"
                  }`} 
                />
              </button>

              {activeDropdown === "resources" && (
                <div className={`absolute top-full ${isRTL ? "right-0" : "left-0"} mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 text-start">
                    {ui.guidesAndDocs}
                  </div>
                  <div className="space-y-1 mt-1 text-start">
                    <a
                      href="#faq"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <HelpCircle size={16} className="text-blue-600 shrink-0" />
                      <span>{ui.faqNav}</span>
                    </a>
                    <Link
                      href="/compliance-gdpr"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Shield size={16} className="text-blue-600 shrink-0" />
                      <span>{ui.securityGdpr}</span>
                    </Link>
                    <Link
                      href="/features"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <span>{ui.productOverview}</span>
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
              <span>{ui.pricing}</span>
            </a>
          </nav>
        </div>

        {/* Right Side: Language Switcher, Talk to sales, Log In & Get started */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          
          {/* Language Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(o => !o);
                setActiveDropdown(null);
              }}
              className="h-9 sm:h-10 flex items-center gap-1.5 px-2.5 rounded-[10px] hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer shrink-0"
              title="Change Language"
            >
              <img 
                src={curLang?.icon || "https://i.imgur.com/NXtMImD.png"} 
                alt={lang} 
                className="w-4 h-4 object-contain shrink-0" 
              />
              <span className="uppercase tracking-wide font-black text-[11px]">{curLang?.short || lang}</span>
            </button>

            {langMenuOpen && (
              <div className={`absolute top-full ${isRTL ? "left-0" : "right-0"} mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-0.5`}>
                {languages.map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      if (setLang) setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      lang === item.code 
                        ? "bg-blue-50 text-blue-600 font-bold" 
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={item.icon} alt={item.code} className="w-4 h-4 object-contain shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Request a Quote Button */}
          <Link
            href="/request-quote"
            className="h-[44px] sm:h-[48px] px-5 sm:px-6 text-[13px] sm:text-[14px] font-semibold text-white bg-[#0c1a30] hover:bg-[#162b4c] rounded-[14px] shadow-sm transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 squircle-button squircle-smooth"
            style={{
              cornerSmoothing: "1",
              WebkitCornerSmoothing: "1",
              cornerShape: "squircle",
            }}
          >
            <span>{ui.requestQuote || "Request a Quote"}</span>
          </Link>
        </div>

        {/* Mobile Actions: Language + Quote + Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Mobile Quick Language Toggle */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(o => !o);
                setMobileMenuOpen(false);
              }}
              className="h-8 flex items-center gap-1 px-1.5 rounded-lg hover:bg-slate-100/80 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <img src={curLang?.icon} alt={lang} className="w-3.5 h-3.5 object-contain shrink-0" />
              <span className="uppercase text-[10px] font-black">{curLang?.short || lang}</span>
            </button>

            {langMenuOpen && (
              <div className={`absolute top-full ${isRTL ? "left-0" : "right-0"} mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150`}>
                {languages.map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      if (setLang) setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-start px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      lang === item.code ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <img src={item.icon} alt={item.code} className="w-3.5 h-3.5 object-contain shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/request-quote"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-[#0c1a30] hover:bg-[#162b4c] active:scale-95 rounded-xl shadow-xs transition-all shrink-0 squircle-button squircle-smooth"
            style={{
              cornerSmoothing: "1",
              WebkitCornerSmoothing: "1",
              cornerShape: "squircle",
            }}
          >
            <span className="hidden xs:inline sm:inline">{ui.requestQuote || "Request a Quote"}</span>
            <span className="xs:hidden sm:hidden">{lang === "fr" ? "Devis" : lang === "ar" ? "طلب سعر" : "Quote"}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setLangMenuOpen(false);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 z-50 flex flex-col gap-3 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150 text-start">
            <div className="space-y-1">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                {ui.product} & {ui.allModules}
              </Link>
              <a
                href="#details"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {ui.solutions}
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {ui.resources} & {ui.faqNav}
              </a>
              <a
                href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20conna%C3%AEtre%20les%20tarifs"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {ui.pricing}
              </a>
            </div>

            {/* Mobile Language Switcher Options */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Language / Langue / اللغة
              </p>
              <div className="grid grid-cols-3 gap-1.5 px-2">
                {languages.map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      if (setLang) setLang(item.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      lang === item.code 
                        ? "border-blue-600 bg-blue-50 text-blue-600" 
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <img src={item.icon} alt={item.code} className="w-3.5 h-3.5 object-contain" />
                    <span>{item.short}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/request-quote"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-[#0c1a30] hover:bg-[#162b4c] rounded-[10px] shadow-sm transition-all"
              >
                {ui.requestQuote || "Request a Quote"}
              </Link>
            </div>
          </div>
        )}

      </header>
    </div>
  );
}
