"use client";

import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function FeatureHero({ feature }) {
  return (
    <section id="apercu" className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -top-20 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Main Heading & Pitch */}
        <div className="max-w-4xl mx-auto text-center pt-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            {feature.title}
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {feature.tagline}
          </p>

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
