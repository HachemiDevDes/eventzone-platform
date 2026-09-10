"use client";

import React from "react";
import { 
  Zap, Building2, Compass, CreditCard, 
  FileCheck, ShieldCheck, QrCode, WifiOff, 
  Printer, UploadCloud, Sparkles, Users, 
  Plane, Hotel, Layers, Link2, BarChart3, 
  DollarSign, Activity, Award, FileDown, CheckCircle 
} from "lucide-react";

// Icon mapping helper
const ICON_MAP = {
  Zap, Building2, Compass, CreditCard,
  FileCheck, ShieldCheck, QrCode, WifiOff,
  Printer, UploadCloud, Sparkles, Users,
  Plane, Hotel, Layers, Link2, BarChart3,
  DollarSign, Activity, Award, FileDown
};

export default function FeatureBenefitsGrid({ feature }) {
  if (!feature.valuePillars || feature.valuePillars.length === 0) return null;

  return (
    <section id="benefices" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Impact Direct & Rentabilité
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Votre Valeur Ajoutée & Bénéfices Concrets
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Adoptez une solution moderne qui simplifie votre organisation, sécurise votre événement et rentabilise chaque m² d'exposition.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {feature.valuePillars.map((pillar, idx) => {
            const IconComponent = ICON_MAP[pillar.icon] || Zap;

            return (
              <div
                key={idx}
                className="relative p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all duration-200 hover:shadow-xl group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <IconComponent size={22} />
                  </div>

                  <h3 className="mt-6 text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-bold text-blue-600">
                  <CheckCircle size={14} />
                  <span>Avantage concurrentiel prouvé</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
