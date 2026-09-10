"use client";

import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function FeatureHero({ feature }) {
  return (
    <section id="apercu" className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 overflow-hidden bg-transparent">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Main Heading & Pitch */}
        <div className="max-w-4xl mx-auto text-center pt-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            {feature.title}
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-blue-600 font-bold leading-relaxed max-w-2xl mx-auto">
            {feature.tagline}
          </p>

          {feature.heroDescription && (
            <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {feature.heroDescription}
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
              <span>Demander une démo</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              100% interactif & responsive
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              Zéro application à installer
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              Mise à jour en direct
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
