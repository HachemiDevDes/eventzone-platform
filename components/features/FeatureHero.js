"use client";

import React, { useState, useRef } from "react";
import { ArrowRight, CheckCircle2, Play, Pause, Sun, Moon, Sparkles, SlidersHorizontal, Droplets, Type } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { getLocalizedFeature, getFeaturesUI } from "../../lib/featuresData";

const OVERLAY_STYLES = {
  reference: {
    scrim: "bg-black/60 backdrop-blur-[0.5px]",
    gradient: "bg-gradient-to-r from-black/85 via-black/60 to-black/35",
    isDarkText: false,
  },
  light: {
    scrim: "bg-white/60 backdrop-blur-[2px]",
    gradient: "bg-gradient-to-b from-white/65 via-white/15 to-white/95",
    isDarkText: true,
  },
  dark: {
    scrim: "bg-slate-950/70 backdrop-blur-[2px]",
    gradient: "bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-slate-950/95",
    isDarkText: false,
  },
  vibrant: {
    scrim: "bg-white/20 backdrop-blur-[0.5px]",
    gradient: "bg-gradient-to-b from-white/50 via-transparent to-white/80",
    isDarkText: true,
  },
  frosted: {
    scrim: "bg-white/75 backdrop-blur-[12px]",
    gradient: "bg-gradient-to-b from-white/80 via-white/50 to-white",
    isDarkText: true,
  },
};

export default function FeatureHero({ feature }) {
  const { lang, isRTL } = useLanguage();
  const localized = getLocalizedFeature(feature, lang) || feature;
  const ui = getFeaturesUI(lang);
  const heroVideo = localized.heroVideo || feature.heroVideo;

  const HEADLINE_OPTIONS = [
    {
      id: "social-clients",
      label: "Social → Clients",
      lines: ["TURN  SOCIAL", "TRAFFIC", "INTO  CLIENTS"],
      subtitle: "Stop losing 80% of your social media visitors. Eventzone converts your Instagram, TikTok, and LinkedIn traffic into confirmed ticket buyers and corporate clients with 1-click in-app checkout and automated WhatsApp recovery.",
      primaryBtn: "START CONVERTING NOW",
    },
    {
      id: "social-attendees",
      label: "Social → Attendees",
      lines: ["CONVERT  MORE", "ATTENDEES", "FROM  SOCIAL"],
      subtitle: "Frictionless in-app browser checkout funnels, automated WhatsApp cart abandonment recovery, and creator affiliate tracking to pack your event.",
      primaryBtn: "BOOST ATTENDANCE NOW",
    },
    {
      id: "reference-image",
      label: "Original Tech Style",
      lines: ["EXPECT  MORE", "ATTENDEES", "FROM  YOUR  EVENTS"],
      subtitle: "Purpose-built and AI-powered – with the data insights, ecosystem, and expertise to deliver real event outcomes.",
      primaryBtn: "EXPLORE THE PLATFORM",
    },
  ];

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // Default to "reference" mode when hero video is present
  const [designMode, setDesignMode] = useState(heroVideo ? "reference" : "light");
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const currentOverlay = OVERLAY_STYLES[designMode] || OVERLAY_STYLES.reference;
  const isDark = !currentOverlay.isDarkText;
  const activeHeadline = HEADLINE_OPTIONS[headlineIndex] || HEADLINE_OPTIONS[0];

  const cycleHeadline = () => {
    setHeadlineIndex((prev) => (prev + 1) % HEADLINE_OPTIONS.length);
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section id="apercu" className="relative pt-8 sm:pt-14 pb-14 sm:pb-24 overflow-hidden bg-transparent transition-colors duration-500 min-h-[500px] flex flex-col justify-center">

      {/* Hero Video Background */}
      {heroVideo && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          {/* Dynamic Backdrop Scrim & Gradient Overlay */}
          <div className={`absolute inset-0 transition-all duration-500 ${currentOverlay.scrim}`} />
          <div className={`absolute inset-0 transition-all duration-500 ${currentOverlay.gradient}`} />
          {/* Subtle Top & Bottom Vignette for Cinematic Depth */}
          {designMode === "reference" && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75 pointer-events-none" />
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">

        {/* Interactive Design Lab Toolbar (when hero video is present) */}
        {heroVideo && (
          <div className="mb-8 max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 shadow-2xl text-white">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#00E575] px-2 flex items-center gap-1.5 font-mono">
              <Sparkles size={13} />
              Design Lab
            </span>

            <div className="h-4 w-px bg-white/20" />

            {/* Design Mode Selectors */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDesignMode("reference")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-mono ${
                  designMode === "reference"
                    ? "bg-[#00E575] text-black shadow-xs font-black"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Exact reference style from your image"
              >
                <span>Neon Tech</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignMode("dark")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "dark"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Cinematic dark glass with glowing highlights"
              >
                <Moon size={12} />
                <span>Cinema Glass</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignMode("light")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "light"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Bright glassmorphism with maximum text legibility"
              >
                <Sun size={12} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignMode("vibrant")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "vibrant"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Minimal scrim, high video prominence"
              >
                <SlidersHorizontal size={12} />
                <span>Vibrant</span>
              </button>
            </div>

            <div className="h-4 w-px bg-white/20" />

            {/* Cycle Headline Copy */}
            <button
              type="button"
              onClick={cycleHeadline}
              className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-mono"
              title="Cycle headline messaging (Social Conversion / Attendees / Original Image)"
            >
              <Type size={12} />
              <span>{activeHeadline.label}</span>
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlayback}
              className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-mono"
              title={isPlaying ? "Pause video background" : "Resume video background"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STYLE A: REFERENCE NEON TECH HERO (Matching User Image)
            ═══════════════════════════════════════════════════════════════ */}
        {designMode === "reference" ? (
          <div className="pt-4 sm:pt-10 lg:pt-14 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-10 xl:gap-14">
              
              {/* Left Column: Bold Technical All-Caps Typography */}
              <div className="flex-1 max-w-3xl text-start">
                <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[52px] font-bold text-white uppercase tracking-[0.14em] sm:tracking-[0.17em] leading-[1.15] select-none drop-shadow-md">
                  <span className="block whitespace-nowrap">{activeHeadline.lines[0]}</span>
                  <span className="block mt-1 sm:mt-1.5 whitespace-nowrap">
                    <span>{activeHeadline.lines[1]}</span>
                    <span className="inline-flex items-center ml-1 sm:ml-2 align-middle">
                      <svg 
                        className="w-5 h-5 sm:w-7 sm:h-7 text-[#00E575] shrink-0" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.2" 
                        strokeLinecap="square"
                      >
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                      </svg>
                    </span>
                  </span>
                  <span className="block mt-1 sm:mt-1.5 whitespace-nowrap">
                    <span>{activeHeadline.lines[2]}</span>
                    <span className="text-[0.38em] font-sans font-bold tracking-normal text-white/90 align-super ml-1.5 leading-none inline-block">
                      ™
                    </span>
                  </span>
                </h1>

                <p className="mt-5 sm:mt-6 text-xs sm:text-[14px] font-semibold text-white/95 leading-relaxed max-w-[460px] font-sans drop-shadow-xs">
                  {activeHeadline.subtitle}
                </p>
              </div>

              {/* Right Column: Exact Reference Buttons */}
              <div className="flex flex-row flex-wrap items-center gap-3 shrink-0 self-start lg:self-center mt-2 lg:mt-0">
                <a
                  href="#benefices"
                  className="px-5 sm:px-6 py-3 bg-[#00E575] hover:bg-[#00c965] active:scale-95 text-black font-mono font-bold text-xs sm:text-[13px] uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-[#00E575]/25 border border-[#00E575] whitespace-nowrap rounded-[1px]"
                >
                  {activeHeadline.primaryBtn}
                </a>

                <a
                  href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20convertir%20mon%20trafic%20social%20en%20clients"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 sm:px-6 py-3 bg-black/40 hover:bg-white/10 active:scale-95 text-white font-mono font-medium text-xs sm:text-[13px] uppercase tracking-wider border border-white/40 hover:border-white/80 transition-all flex items-center justify-center cursor-pointer backdrop-blur-xs whitespace-nowrap rounded-[1px]"
                >
                  REQUEST A DEMO
                </a>
              </div>

            </div>

            {/* Reference Style Key Metrics */}
            {localized.keyMetrics && localized.keyMetrics.length > 0 && (
              <div className="mt-14 sm:mt-20 max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-start">
                {localized.keyMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-[#00E575]/40 transition-all group"
                  >
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#00E575] font-mono group-hover:scale-105 transition-transform">
                      {metric.value}
                    </p>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mt-1.5 font-medium">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             STYLE B: CENTERED EVENTZONE HERO (Light / Dark Cinema / Vibrant)
             ═══════════════════════════════════════════════════════════════ */
          <div className="pt-2">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] transition-colors duration-300 ${
                isDark ? "text-white drop-shadow-md" : "text-slate-900"
              }`}>
                {localized.title}
              </h1>

              <p className={`mt-4 sm:mt-5 text-base sm:text-lg font-bold leading-relaxed max-w-2xl mx-auto transition-colors duration-300 ${
                isDark ? "text-blue-400 drop-shadow-xs" : "text-blue-600"
              }`}>
                {localized.tagline}
              </p>

              {localized.heroDescription && (
                <p className={`mt-3 text-sm sm:text-base font-normal leading-relaxed max-w-2xl mx-auto transition-colors duration-300 ${
                  isDark ? "text-slate-200 drop-shadow-xs" : "text-slate-600"
                }`}>
                  {localized.heroDescription}
                </p>
              )}

              {/* CTAs */}
              <div className="mt-8 flex items-center justify-center">
                <a
                  href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20une%20d%C3%A9mo%20personnalis%C3%A9e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{ui.requestDemo}</span>
                  <ArrowRight size={16} className="rtl:rotate-180" />
                </a>
              </div>

              {/* Trust points */}
              <div className={`mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs font-medium transition-colors duration-300 ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}>
                {ui.trustPoints.map((point, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating Key Metrics Strip */}
            {localized.keyMetrics && localized.keyMetrics.length > 0 && (
              <div className="mt-12 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {localized.keyMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl backdrop-blur-md transition-all text-center group ${
                      isDark
                        ? "bg-slate-900/80 border border-white/15 shadow-xl hover:border-blue-400/40 hover:bg-slate-900/90"
                        : "bg-white/90 border border-slate-200/90 shadow-sm hover:shadow-md hover:bg-white"
                    }`}
                  >
                    <p className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight group-hover:scale-105 transition-transform ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}>
                      {metric.value}
                    </p>
                    <p className={`text-xs sm:text-xs font-bold mt-1.5 ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}>
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
