"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";

export default function FeatureDeepDive({ feature }) {
  if (!feature.deepDiveFeatures || feature.deepDiveFeatures.length === 0) return null;

  return (
    <section id="details" className="py-20 sm:py-32 lg:py-40 bg-transparent relative border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24 lg:mb-28">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Fonctionnalités Clés
          </h2>
        </div>

        {/* Alternating Deep-Dive Rows with generous breathing room */}
        <div className="space-y-24 sm:space-y-36 lg:space-y-44">
          {feature.deepDiveFeatures.map((item, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <div 
                key={idx}
                className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-10 sm:gap-16 lg:gap-24`}
              >
                {/* Text Description Column */}
                <div className="w-full lg:w-1/2 space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>

                  {item.checklist && item.checklist.length > 0 && (
                    <ul className="pt-2 space-y-2.5">
                      {item.checklist.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200/60">
                            <Check size={12} className="stroke-[2.5]" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Graphic Visual Representation Column */}
                <div className="w-full lg:w-1/2">
                  <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    
                    {/* Visual Card 1: Interactive Floor Plan Canvas */}
                    {idx === 0 && (
                      <div className="space-y-4">
                        {/* Floor Plan Grid */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="h-24 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex flex-col justify-between">
                            <span className="text-xs font-bold text-slate-400">A01</span>
                            <span className="text-xs font-medium text-slate-500">Réservé</span>
                          </div>

                          <div className="h-24 rounded-xl bg-blue-50/60 border-2 border-blue-500 p-3.5 flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-blue-700">A02</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">18 m²</span>
                              <span className="text-xs font-semibold text-blue-600">Disponible</span>
                            </div>
                          </div>

                          <div className="h-24 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex flex-col justify-between">
                            <span className="text-xs font-bold text-slate-400">A03</span>
                            <span className="text-xs font-medium text-slate-500">Réservé</span>
                          </div>

                          <div className="h-24 rounded-xl bg-amber-50/50 border border-amber-200 p-3.5 flex flex-col justify-between">
                            <span className="text-xs font-bold text-amber-700">B01</span>
                            <span className="text-xs font-semibold text-amber-800">Sponsor</span>
                          </div>
                        </div>

                        {/* Minimal Status Hint */}
                        <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-500 font-medium">
                          <span>Sélection : <strong className="text-slate-900 font-semibold">Stand A02</strong></span>
                          <span className="text-blue-600 font-semibold">Cliquer pour optionner</span>
                        </div>
                      </div>
                    )}

                    {/* Visual Card 2: Commercial Zoning & Real-Time Availability */}
                    {idx === 1 && (
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-baseline justify-between mb-2.5">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commercialisation</span>
                            <span className="text-3xl font-black text-slate-900">82%</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: "82%" }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                            <span className="text-2xl font-black text-slate-900 block">48</span>
                            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Stands réservés</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-center">
                            <span className="text-2xl font-black text-emerald-700 block">12</span>
                            <span className="text-xs text-emerald-700 font-medium mt-0.5 block">Stands libres</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Card 3: Exhibitor B2B Showcase Profile */}
                    {idx === 2 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                            EZ
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-900">Eventzone</h4>
                            <span className="inline-block mt-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                              Stand B04 • Tech
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs text-center cursor-pointer hover:bg-blue-700 transition-colors">
                            Prendre RDV
                          </div>
                          <div className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold text-center cursor-pointer hover:bg-slate-200 transition-colors">
                            Documentation
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Card 4: Mobile Web Guidance */}
                    {idx === 3 && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itinéraire</span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">35 mètres</span>
                        </div>

                        <div className="space-y-3 py-1">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                              1
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Entrée Principale</span>
                          </div>

                          <div className="ml-3.5 h-6 border-l-2 border-dashed border-slate-200" />

                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                              2
                            </div>
                            <span className="text-sm font-bold text-slate-900">Stand B04 (Eventzone)</span>
                          </div>
                        </div>

                        <div className="pt-2 text-center border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">
                            Accès direct par QR Code • Sans téléchargement
                          </span>
                        </div>
                      </div>
                    )}

                    {idx > 3 && (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                        <Sparkles size={28} className="text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
