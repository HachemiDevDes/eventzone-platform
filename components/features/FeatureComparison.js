"use client";

import React from "react";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function FeatureComparison({ feature }) {
  if (!feature.comparison) return null;

  return (
    <section id="comparatif" className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Pourquoi Choisir Eventzone ?
          </h2>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Traditional Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-rose-50/40 border border-rose-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-rose-200/60">
              <h3 className="text-base font-black text-rose-950">
                Méthodes Traditionnelles
              </h3>
              <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                Excel & PDF
              </span>
            </div>

            <ul className="mt-5 space-y-3">
              {feature.comparison.traditional.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Eventzone Solution Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-blue-50/50 border-2 border-blue-600 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
              <h3 className="text-base font-black text-blue-950">
                Plateforme Eventzone
              </h3>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                2D Temps Réel
              </span>
            </div>

            <ul className="mt-5 space-y-3">
              {feature.comparison.eventzone.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
