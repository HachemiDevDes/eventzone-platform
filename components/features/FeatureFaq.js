"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FeatureFaq({ feature }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!feature.faq || feature.faq.length === 0) return null;

  return (
    <section id="faq" className="py-16 sm:py-24 bg-slate-50 relative border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Questions Fréquentes
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tout Ce Que Vous Devez Savoir
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Des réponses claires à vos questions techniques, logistiques et commerciales.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {feature.faq.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-blue-600 shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
