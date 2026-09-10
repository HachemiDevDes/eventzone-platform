"use client";

import React from "react";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function FeatureComparison({ feature }) {
  if (!feature.comparison) return null;

  return (
    <section id="comparatif" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Comparatif de Performance
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Pourquoi Choisir Eventzone Face Aux Méthodes Traditionnelles ?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Comparez le gouffre d'efficacité entre la gestion manuelle sur tableurs et la puissance d'une plateforme unifiée.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Traditional Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-50/40 border border-rose-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-rose-200/60">
                <h3 className="text-base sm:text-lg font-black text-rose-950">
                  Méthodes Traditionnelles
                </h3>
                <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                  Fichiers Excel & PDF statiques
                </span>
              </div>

              <ul className="mt-6 space-y-4">
                {feature.comparison.traditional.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-rose-200/60 text-xs font-bold text-rose-800">
              Résultat : Perte de temps, risques de doublons et manque à gagner.
            </div>
          </div>

          {/* Eventzone Solution Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/50 border-2 border-blue-600 shadow-xl shadow-blue-600/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-xs">
              Recommandé Eventzone
            </div>

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                <h3 className="text-base sm:text-lg font-black text-blue-950">
                  Plateforme Eventzone
                </h3>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                  Solution 2D Temps Réel
                </span>
              </div>

              <ul className="mt-6 space-y-4">
                {feature.comparison.eventzone.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-blue-200/60 text-xs font-bold text-blue-800 flex items-center justify-between">
              <span>Résultat : Ventes accélérées, zéro erreur et satisfaction totale.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
