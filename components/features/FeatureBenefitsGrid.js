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
    <section id="benefices" className="py-20 sm:py-32 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Valeur Ajoutée & Bénéfices
          </h2>
        </div>

        {/* 3 Pillars Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {feature.valuePillars.map((pillar, idx) => {
            const IconComponent = ICON_MAP[pillar.icon] || Zap;

            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all duration-200 hover:shadow-xl group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
                  <IconComponent size={22} />
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-slate-900 tracking-tight">
                  {pillar.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
