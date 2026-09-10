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
                  {item.subtitle && (
                    <div className="text-xs font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>{item.subtitle}</span>
                    </div>
                  )}

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
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Search size={14} className="text-blue-600" /> Moteur Vectoriel Ultra-Fluide
                          </span>
                          <span className="text-[11px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            Zoom x400% sans perte
                          </span>
                        </div>
                        <div className="h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 text-white flex flex-col justify-between relative overflow-hidden">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-blue-400">Hall B - Espace Numérique</span>
                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">120 Stands Actifs</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 my-auto">
                            <div className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-center border border-white/10">
                              <p className="text-[10px] font-bold">Stand B1</p>
                              <p className="text-[8px] text-emerald-300">Libre</p>
                            </div>
                            <div className="bg-blue-600/40 p-2 rounded-lg text-center border border-blue-400/30">
                              <p className="text-[10px] font-bold">Stand B2</p>
                              <p className="text-[8px] text-blue-300">Réservé</p>
                            </div>
                            <div className="bg-amber-500/30 p-2 rounded-lg text-center border border-amber-400/30">
                              <p className="text-[10px] font-bold">Stand B3</p>
                              <p className="text-[8px] text-amber-300">Sponsor</p>
                            </div>
                            <div className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-center border border-white/10">
                              <p className="text-[10px] font-bold">Stand B4</p>
                              <p className="text-[8px] text-emerald-300">Libre</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/10 pt-2">
                            <span>Recherche textuelle instantanée</span>
                            <span className="text-white font-mono">60 FPS fluide</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {idx === 1 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} className="text-blue-600" /> Synchronisation Commerciale
                          </span>
                          <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
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
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={14} className="text-blue-600" /> Vitrine Exposant Connectée
                          </span>
                          <span className="text-[11px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
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
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Smartphone size={14} className="text-blue-600" /> Expérience Mobile Sans App
                          </span>
                          <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                            Scan QR Totem
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                          <div>
                            <p className="text-xs font-extrabold">Orientation Instantanée</p>
                            <p className="text-[11px] text-blue-100 mt-0.5">Scannez le totem d'entrée pour ouvrir le plan sur votre mobile</p>
                          </div>
                          <Compass size={32} className="text-blue-200 shrink-0" />
                        </div>
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
