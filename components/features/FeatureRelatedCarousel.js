"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { getLocalizedAllFeatures, getFeaturesUI } from "../../lib/featuresData";

export default function FeatureRelatedCarousel({ currentSlug }) {
  const { lang, isRTL } = useLanguage();
  const allFeatures = getLocalizedAllFeatures(lang);
  const otherFeatures = allFeatures.filter(f => f.slug !== currentSlug);
  const ui = getFeaturesUI(lang);

  return (
    <section className="py-20 sm:py-28 bg-transparent border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 text-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {ui.relatedModulesHeading}
            </h2>
          </div>
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>{ui.viewAllModules}</span>
            <ArrowRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {otherFeatures.slice(0, 3).map((item) => (
            <Link
              key={item.slug}
              href={`/features/${item.slug}`}
              className="p-6 sm:p-7 rounded-[26px] bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-200/70 hover:border-blue-400/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between text-start module-card-squircle squircle-smooth"
              style={{
                cornerSmoothing: 1,
                WebkitCornerSmoothing: 1,
                cornerShape: "squircle",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide bg-blue-50/80 px-2.5 py-0.5 rounded-full">
                    {ui.moduleWord} {item.moduleNumber}
                  </span>
                  <span className="text-xs font-medium text-slate-400 truncate">
                    {item.category}
                  </span>
                </div>

                <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug tracking-tight">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal">
                  {item.tagline}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                <span>{ui.discoverModule}</span>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
