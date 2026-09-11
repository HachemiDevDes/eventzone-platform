"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n";
import { getLocalizedAllFeatures, getFeaturesUI } from "../../lib/featuresData";
import FeatureNavbar from "./FeatureNavbar";
import AnimatedMeshBackground from "./AnimatedMeshBackground";
import Footer from "../Footer";
import { ArrowRight } from "lucide-react";

export default function FeaturesIndexClient() {
  const { lang, isRTL } = useLanguage();
  const ui = getFeaturesUI(lang);
  const features = getLocalizedAllFeatures(lang);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col relative bg-white/40 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Blurry Low-Opacity Animated Blue Mesh */}
      <AnimatedMeshBackground />

      {/* Top Bar */}
      <FeatureNavbar 
        featureTitle={ui.catalogNavTitle} 
        category={ui.overviewCategory} 
      />

      <main className="flex-1">
        {/* Full Features Grid */}
        <section className="py-8 sm:py-20 bg-transparent">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16 pt-2">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight px-1">
                {ui.gridHeading}
              </h1>
              <p className="mt-2.5 sm:mt-4 text-xs sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-1">
                {ui.gridSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {features.map((feat) => (
                <Link
                  key={feat.slug}
                  href={`/features/${feat.slug}`}
                  className="p-5 sm:p-7 rounded-2xl sm:rounded-[26px] bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-200/70 hover:border-blue-400/50 shadow-xs hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between text-start module-card-squircle squircle-smooth"
                  style={{
                    cornerSmoothing: 1,
                    WebkitCornerSmoothing: 1,
                    cornerShape: "squircle",
                  }}
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
