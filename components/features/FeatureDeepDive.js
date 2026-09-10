"use client";

import React from "react";
import { Check, Sparkles, Smartphone, Layers, Search, Eye, Share2, Compass, Shield } from "lucide-react";

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
                  <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    
                    {/* Visual Card Content based on type */}
                    {idx === 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Search size={14} className="text-blue-600" /> Moteur Vectoriel Ultra-Fluide
                          </span>
                          <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200/60">
                            Zoom x400% sans perte
                          </span>
                        </div>
                        <div className="h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100/70 border border-slate-200/90 p-4 text-slate-900 flex flex-col justify-between relative overflow-hidden shadow-inner">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              Hall B • Espace Numérique
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded text-[10px] font-bold">
                              120 Stands Actifs
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2.5 my-auto">
                            <div className="bg-white hover:bg-slate-50 p-2.5 rounded-xl text-center border border-emerald-200 shadow-xs transition-colors">
                              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-800">Stand B1</p>
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">Libre</span>
                            </div>
                            <div className="bg-blue-50/70 hover:bg-blue-50 p-2.5 rounded-xl text-center border border-blue-200 shadow-xs transition-colors">
                              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-800">Stand B2</p>
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded border border-blue-200/50">Réservé</span>
                            </div>
                            <div className="bg-amber-50/70 hover:bg-amber-50 p-2.5 rounded-xl text-center border border-amber-200 shadow-xs transition-colors">
                              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-800">Stand B3</p>
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded border border-amber-200/50">Sponsor</span>
                            </div>
                            <div className="bg-white hover:bg-slate-50 p-2.5 rounded-xl text-center border border-emerald-200 shadow-xs transition-colors">
                              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-800">Stand B4</p>
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">Libre</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200/80 pt-2 font-medium">
                            <span>Recherche textuelle instantanée</span>
                            <span className="text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">60 FPS fluide</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {idx === 1 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} className="text-blue-600" /> Synchronisation Commerciale
                          </span>
                          <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200/60">
                            Temps réel actif
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-emerald-500" />
                              <div>
                                <p className="text-xs font-bold text-slate-900">Stand A14 (24m²)</p>
                                <p className="text-[10px] text-slate-500">Disponible • Allée Centrale</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-600">Optionner</span>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-blue-600" />
                              <div>
                                <p className="text-xs font-bold text-slate-900">Stand A15 (18m²)</p>
                                <p className="text-[10px] text-slate-500">Réservé par Sonatrach</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Confirmé</span>
                          </div>
                          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-amber-500" />
                              <div>
                                <p className="text-xs font-bold text-slate-900">Stand VIP Plénière (36m²)</p>
                                <p className="text-[10px] text-slate-500">Pack Partenaire Platine</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Sponsor</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {idx === 2 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={14} className="text-blue-600" /> Vitrine Exposant Connectée
                          </span>
                          <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200/60">
                            Portail B2B
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                              EZ
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-extrabold text-slate-900">Eventzone Tech Solutions</h4>
                              <p className="text-xs text-slate-500">Stand B04 • Hall Innovation</p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                  📄 Plaquette PDF
                                </span>
                                <span className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                  📅 Prendre RDV
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {idx === 3 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Smartphone size={14} className="text-blue-600" /> Expérience Mobile Sans App
                          </span>
                          <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200/60">
                            Scan QR Totem
                          </span>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-200/70 text-slate-900 flex items-center justify-between shadow-xs">
                          <div>
                            <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              Orientation Instantanée
                            </p>
                            <p className="text-[11px] text-slate-600 mt-1 font-medium">Scannez le totem d'entrée pour ouvrir le plan sur votre mobile</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
                            <Compass size={22} className="text-blue-600" />
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
