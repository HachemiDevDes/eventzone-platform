"use client";

import React, { useState, useRef } from "react";
import { ArrowRight, CheckCircle2, Play, Pause, Sun, Moon, Sparkles, SlidersHorizontal, Droplets } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { getLocalizedFeature, getFeaturesUI } from "../../lib/featuresData";

const OVERLAY_STYLES = {
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
    scrim: "bg-white/25 backdrop-blur-[0.5px]",
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

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [designMode, setDesignMode] = useState("light");

  const currentOverlay = OVERLAY_STYLES[designMode] || OVERLAY_STYLES.light;
  const isDark = !currentOverlay.isDarkText;

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
    <section id="apercu" className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 overflow-hidden bg-transparent transition-colors duration-500">

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
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Interactive Design Lab Toolbar (when hero video is present) */}
        {heroVideo && (
          <div className="mb-6 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 shadow-md">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 px-2 flex items-center gap-1.5">
              <Sparkles size={13} />
              Design Lab
            </span>

            <div className="h-4 w-px bg-slate-200" />

            {/* Design Mode Selectors */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDesignMode("light")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "light"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Bright glassmorphism with maximum text legibility"
              >
                <Sun size={12} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignMode("dark")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "dark"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Cinematic dark glass with glowing highlights"
              >
                <Moon size={12} />
                <span>Dark Cinema</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignMode("vibrant")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "vibrant"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Minimal scrim, high video prominence"
              >
                <SlidersHorizontal size={12} />
                <span>Vibrant</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignMode("frosted")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  designMode === "frosted"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Heavy frosted glass blur"
              >
                <Droplets size={12} />
                <span>Frosted</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlayback}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title={isPlaying ? "Pause video background" : "Resume video background"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
          </div>
        )}
        
        {/* Hero Main Heading & Pitch */}
        <div className="max-w-4xl mx-auto text-center pt-2">
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
    </section>
  );
}
