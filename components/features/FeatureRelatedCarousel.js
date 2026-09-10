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
              className="p-6 rounded-2xl bg-white/80 backdrop-blur-md hover:bg-white border border-slate-200/90 hover:border-blue-300 transition-all duration-200 hover:shadow-xl group flex flex-col justify-between text-start"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                    {ui.moduleWord} {item.moduleNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    {isRTL ? "←" : "→"}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.tagline}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{ui.discoverModule}</span>
                <ArrowRight size={14} className="text-blue-600 rtl:rotate-180" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
