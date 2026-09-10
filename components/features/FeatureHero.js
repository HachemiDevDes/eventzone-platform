"use client";

import React from "react";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Play, Zap } from "lucide-react";

export default function FeatureHero({ feature }) {
  return (
    <section id="apercu" className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -top-20 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Eyebrow Tag */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-extrabold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{feature.badge || `Module ${feature.moduleNumber} • ${feature.category}`}</span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400">•</span>
          <span className="text-xs font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            Proposition Commerciale Eventzone
          </span>
        </div>

        {/* Hero Main Heading & Pitch */}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            {feature.title}
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
            {feature.tagline}
          </p>

          <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
            {feature.heroDescription}
          </p>

          {/* CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="#contact"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Demander une démo personnalisée</span>
              <ArrowRight size={16} />
            </a>

            <a
              href="#simulateur"
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-blue-600" />
              <span>Tester le simulateur en direct</span>
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              100% interactif & responsive
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              Aucune application à installer
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              Import CAD & plans d'architecte
            </span>
          </div>

        </div>

        {/* Floating Key Metrics Strip */}
        {feature.keyMetrics && feature.keyMetrics.length > 0 && (
          <div className="mt-12 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {feature.keyMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-md transition-all text-center group"
              >
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-600 tracking-tight group-hover:scale-105 transition-transform">
                  {metric.value}
                </p>
                <p className="text-xs sm:text-xs font-bold text-slate-700 mt-1.5">
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
