/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { 
  Globe, ChevronDown, User, Ticket, 
  Building2, LogOut, Plus, Check 
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { smoothScrollTo } from "../lib/smoothScroll";

export default function UniversalTopBar({
  currentUser,
  registrations = [],
  onGoToHome,
  onOpenAuth,
  onOpenProfile,
  onOpenPassesModal,
  onOpenCreationWizard,
  onOpenEventsHub,
  onSignOut,
  rightExtra = null,
}) {
  const { lang, setLang, t, languages } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleBrandClick = () => {
    if (onGoToHome) {
      onGoToHome();
      smoothScrollTo(0, { duration: 900, easing: "easeInOutCubic" });
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleExploreClick = (e) => {
    if (onGoToHome) {
      e.preventDefault();
      onGoToHome();
      setTimeout(() => {
        smoothScrollTo("#explore", { duration: 900, offset: 70, easing: "easeInOutCubic" });
      }, 50);
    }
  };

  const handleFeaturedClick = (e) => {
    if (onGoToHome) {
      e.preventDefault();
      onGoToHome();
      setTimeout(() => {
        smoothScrollTo("#featured", { duration: 900, offset: 70, easing: "easeInOutCubic" });
      }, 50);
    }
  };

  const handleCategoriesClick = (e) => {
    if (onGoToHome) {
      e.preventDefault();
      onGoToHome();
      setTimeout(() => {
        smoothScrollTo("#categories", { duration: 900, offset: 70, easing: "easeInOutCubic" });
      }, 50);
    }
  };

  const handleMobileAppClick = (e) => {
    if (onGoToHome) {
      e.preventDefault();
      onGoToHome();
      setTimeout(() => {
        smoothScrollTo("#mobile-app", { duration: 900, offset: 70, easing: "easeInOutCubic" });
      }, 50);
    }
  };

  const handleForOrganizersClick = () => {
    if (onOpenCreationWizard) {
      onOpenCreationWizard();
    } else if (onOpenEventsHub) {
      onOpenEventsHub();
    }
  };

  const curLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Left: Eventzone Original Blue Logo Alone */}
      <div className="flex items-center">
        <div 
          onClick={handleBrandClick}
          className="flex items-center cursor-pointer select-none group"
          title="Eventzone Home"
        >
          <img 
            src="https://i.imgur.com/jFDrQbM.png" 
            alt="eventzone" 
            style={{ height: '28px', width: 'auto', maxWidth: '160px' }}
            className="h-7 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </div>
      </div>

      {/* Center: Quick Links in the middle */}
      <nav className="hidden md:flex items-center gap-7">
        <a 
          href="#explore" 
          onClick={handleExploreClick}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          {t("nav.exploreEvents", "Explore Events")}
        </a>
        <a 
          href="#featured" 
          onClick={handleFeaturedClick}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          {t("nav.featuredSummits", "Featured Summits")}
        </a>
        <a 
          href="#categories" 
          onClick={handleCategoriesClick}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          {t("nav.categories", "Categories")}
        </a>
        <a 
          href="#mobile-app" 
          onClick={handleMobileAppClick}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          {t("nav.mobileApp", "Mobile App")}
        </a>
        <button 
          onClick={handleForOrganizersClick}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-0"
        >
          {t("nav.forOrganizers", "Organise an event")}
        </button>
      </nav>

      {/* Right: Actions, Language Toggle & Auth / Profile Controls */}
      <div className="flex items-center gap-2.5">
        {rightExtra}

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setLangMenuOpen(o => !o);
              setProfileOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Change Language"
          >
            <img src={curLang?.icon || "https://i.imgur.com/NXtMImD.png"} alt={lang} className="w-5 h-5 object-contain shrink-0" />
            <span className="uppercase tracking-wide font-extrabold text-[11px]">{lang}</span>
            <ChevronDown size={11} className={`text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {langMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5">
              {languages.map(item => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLang(item.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    lang === item.code 
                      ? "bg-blue-50 text-blue-600 font-bold" 
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={item.icon} alt={item.code} className="w-5 h-5 object-contain shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(o => !o);
                setLangMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer shadow-xs"
            >
              <img 
                src={currentUser.avatar || currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || currentUser.full_name || "User")}&background=0b5cdb&color=fff`} 
                alt="Avatar" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || currentUser.full_name || "User")}&background=0b5cdb&color=fff`;
                }}
                className="w-7 h-7 rounded-full object-cover border border-blue-500/40"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{currentUser.fullName || currentUser.full_name || currentUser.email?.split("@")[0] || "User"}</span>
                <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">
                  {currentUser.role === "organizer" ? "Organizer" : "Visitor"}
                </span>
              </div>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-scale-up space-y-1">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="text-xs font-bold text-slate-900 block truncate">{currentUser.fullName || currentUser.full_name}</span>
                  <span className="text-[10px] text-slate-400 truncate block">{currentUser.email}</span>
                </div>

                {/* 1. My Profile Button */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User size={15} className="text-slate-500 shrink-0" />
                  <span>{t("nav.myProfile", "My Profile")}</span>
                </button>

                {/* 2. My Tickets Button */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onOpenPassesModal) {
                      onOpenPassesModal();
                    } else if (typeof window !== "undefined") {
                      window.location.href = "/?view=my-tickets";
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Ticket size={15} className="text-emerald-600 shrink-0" />
                    <span>{t("nav.myTickets", "My Tickets")}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px]">
                    {registrations.length}
                  </span>
                </button>

                {/* 3. Add an Event Button in Menu */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onOpenCreationWizard) {
                      onOpenCreationWizard();
                    } else if (onOpenEventsHub) {
                      onOpenEventsHub();
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Plus size={15} className="text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>{t("nav.addEvent", "Add an Event")}</span>
                </button>

                {/* 4. Event Manager Center Button */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onOpenEventsHub) onOpenEventsHub();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Building2 size={15} className="text-slate-600 shrink-0" />
                  <span>{t("nav.eventManagerCenter", "Event Manager Center")}</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut size={15} className="text-rose-500 shrink-0" />
                  <span>{t("nav.signOut", "Sign Out")}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth && onOpenAuth("signin")}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 rounded-xl transition-all cursor-pointer"
            >
              {t("nav.signIn", "Sign In")}
            </button>
            <button
              onClick={() => onOpenAuth && onOpenAuth("signup")}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 hover:shadow transition-all cursor-pointer"
            >
              {t("nav.signUp", "Sign Up")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
