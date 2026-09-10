"use client";

import React from "react";
import { Check, Sparkles, Compass, Search, Calendar, FileText, ArrowRight, ShieldCheck } from "lucide-react";

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
                  <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    
                    {/* Visual Card 1: Interactive Floor Plan Canvas */}
                    {idx === 0 && (
                      <div className="space-y-3.5">
                        {/* Mini Search & Filter Bar */}
                        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                          <div className="flex items-center gap-2 text-slate-400 text-xs flex-1">
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <span className="text-slate-500 font-medium">Rechercher un stand, exposant...</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md shrink-0">
                            Hall A & B
                          </span>
                        </div>

                        {/* Clean Booth Layout */}
                        <div className="bg-slate-50/60 rounded-2xl border border-slate-200/70 p-3 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                            <span>Allée Centrale</span>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Disponibilité en direct
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {/* Booth 1 */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-all cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-slate-900">A01</span>
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Réservé</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 truncate">Sonatrach</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">18 m² • Énergie</p>
                            </div>

                            {/* Booth 2 - Available */}
                            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-300 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer ring-2 ring-emerald-500/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-emerald-900">A02</span>
                                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Libre</span>
                              </div>
                              <p className="text-xs font-bold text-emerald-800 truncate">Stand Disponible</p>
                              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">18 m² • Optionner ➔</p>
                            </div>

                            {/* Booth 3 */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-all cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-slate-900">A03</span>
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Réservé</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 truncate">Ooredoo</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">18 m² • Télécom</p>
                            </div>

                            {/* Booth 4 - VIP Sponsor */}
                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-300 shadow-2xs col-span-2 sm:col-span-3 hover:border-amber-400 transition-all cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">B01 • Pavillon Central</span>
                                    <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Sponsor</span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 mt-0.5">CPA Banque & FinTech Hub</p>
                                </div>
                                <span className="text-xs font-bold text-amber-900 bg-white/90 border border-amber-200 px-2.5 py-1 rounded-lg">
                                  36 m²
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Card 2: Commercial Zoning & Real-Time Availability */}
                    {idx === 1 && (
                      <div className="space-y-3.5">
                        {/* Occupancy Progress Gauge */}
                        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5">
                          <div className="flex items-center justify-between text-xs font-bold mb-2">
                            <span className="text-slate-800">Taux d'occupation commercial</span>
                            <span className="text-blue-700 font-extrabold">78% commercialisé</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden flex gap-0.5">
                            <div className="h-full bg-blue-600 rounded-l-full" style={{ width: "60%" }} />
                            <div className="h-full bg-amber-500" style={{ width: "18%" }} />
                            <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: "22%" }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-2.5 pt-1.5 border-t border-slate-200/60">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> 48 Confirmés</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 12 Sponsors</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 16 Disponibles</span>
                          </div>
                        </div>

                        {/* Live Inventory Cards */}
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-emerald-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center border border-emerald-200">
                                A14
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Stand Standard • 24 m²</p>
                                <p className="text-[10px] text-slate-500 font-medium">Allée Centrale • Traversant</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                              Optionner
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-blue-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200">
                                A15
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Sonatrach Digital • 18 m²</p>
                                <p className="text-[10px] text-slate-500 font-medium">Contrat validé</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-md">
                              Réservé
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Card 3: Exhibitor B2B Showcase Profile */}
                    {idx === 2 && (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                        {/* Banner */}
                        <div className="h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 flex items-end justify-between pb-2">
                          <span className="text-[10px] font-bold text-white/95 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">
                            Hall Innovation • Stand B04
                          </span>
                          <span className="text-[10px] font-bold text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded">
                            Exposant Vérifié
                          </span>
                        </div>

                        {/* Profile Details */}
                        <div className="p-4 sm:p-5 pt-0">
                          <div className="flex items-end gap-3 -mt-5 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-white p-0.5 shadow-md border border-slate-100 flex items-center justify-center">
                              <div className="w-full h-full rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                                EZ
                              </div>
                            </div>
                            <div className="pb-0.5">
                              <h4 className="text-sm font-black text-slate-900 leading-tight">Eventzone Tech Solutions</h4>
                              <p className="text-[11px] text-slate-500 font-medium">Solutions Logicielles & Billetterie</p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            Plateforme tout-en-un de gestion d'événements : plans vectoriels 2D dynamiques, billetterie et contrôle d'accès.
                          </p>

                          <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                            <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center">
                              <Calendar size={13} />
                              <span>Prendre RDV</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center">
                              <FileText size={13} />
                              <span>Plaquette PDF</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Card 4: Mobile Web Guidance */}
                    {idx === 3 && (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                        {/* Simulated Mobile Browser URL */}
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200/80 flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                          </div>
                          <div className="flex-1 bg-white rounded-md py-1 px-2.5 text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1 border border-slate-200">
                            <span className="text-emerald-600 font-bold">🔒</span> eventzone.app/salon/hall-b
                          </div>
                        </div>

                        {/* Navigation Interface */}
                        <div className="p-4 sm:p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Itinéraire Visiteur</span>
                              <h4 className="text-sm font-black text-slate-900 mt-0.5">Vers Stand B04 • Eventzone</h4>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
                              <Compass size={20} />
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              ➔
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">Prendre l'Allée Centrale</p>
                              <p className="text-[11px] text-slate-600 font-medium">Votre stand est à 35 mètres sur votre gauche</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1">
                            <span className="flex items-center gap-1 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 100% Web (Safari & Chrome)
                            </span>
                            <span className="text-slate-400">Zéro téléchargement</span>
                          </div>
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
