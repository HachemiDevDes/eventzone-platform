"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n";
import { getLocalizedAllFeatures, getFeaturesUI } from "../../lib/featuresData";
import FeatureNavbar from "./FeatureNavbar";
import AnimatedMeshBackground from "./AnimatedMeshBackground";
import Footer from "../Footer";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function FeaturesIndexClient() {
  const { lang, isRTL } = useLanguage();
  const ui = getFeaturesUI(lang);
  const features = getLocalizedAllFeatures(lang);
  const premierFeature = features.find(f => f.slug === "plan-2d-interactif") || features[0];

  return (
    <div className="min-h-screen flex flex-col relative bg-white/40 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Blurry Low-Opacity Animated Blue Mesh */}
      <AnimatedMeshBackground />

      {/* Top Bar */}
      <FeatureNavbar 
        featureTitle={ui.catalogNavTitle} 
        category={ui.overviewCategory} 
      />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="py-16 sm:py-24 bg-transparent border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              {ui.catalogTitle}
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
              {ui.catalogDescription}
            </p>

            {/* Featured Hero Card (Premier Feature) */}
            <div className="mt-12 max-w-5xl mx-auto text-start">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#081431] to-slate-900 text-white shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-3 max-w-2xl">
                    <span className="inline-block text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                      {ui.flagshipBadge}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {premierFeature.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      {premierFeature.tagline}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300 pt-2">
                      {ui.flagshipPoints.map((point, idx) => (
                        <span key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`/features/${premierFeature.slug}`}
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group-hover:scale-105"
                    >
                      <span>{ui.flagshipCta}</span>
                      <ArrowRight size={16} className="rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Full Features Grid */}
        <section className="py-16 sm:py-24 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {ui.gridHeading}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {ui.gridSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feat) => (
                <Link
                  key={feat.slug}
                  href={`/features/${feat.slug}`}
                  className="p-6 sm:p-7 rounded-2xl bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-200/70 hover:border-blue-400/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between text-start"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide bg-blue-50/80 px-2.5 py-0.5 rounded-full">
                        {ui.moduleWord} {feat.moduleNumber}
                      </span>
                      <span className="text-xs font-medium text-slate-400 truncate">
                        {feat.category}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug tracking-tight">
                      {feat.title}
                    </h3>

                    <p className="mt-2.5 text-sm text-slate-500 leading-relaxed font-normal">
                      {feat.tagline}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                    <span>{ui.exploreModuleCard}</span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all" />
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
