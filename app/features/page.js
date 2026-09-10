import React from "react";
import Link from "next/link";
import { ALL_FEATURES } from "../../lib/featuresData";
import FeatureNavbar from "../../components/features/FeatureNavbar";
import Footer from "../../components/Footer";
import { 
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, 
  Layers, Zap, CreditCard, QrCode, Users, Plane, Link2, Activity 
} from "lucide-react";

export const metadata = {
  title: "Toutes les Fonctionnalités | Eventzone",
  description: "Découvrez l'ensemble des modules et fonctionnalités de la plateforme Eventzone : Plans 2D interactifs, billetterie multi-tarifs, check-in QR code, CRM et logistique VIP.",
  alternates: {
    canonical: "https://eventzone.pro/features",
  },
};

export default function FeaturesIndexPage() {
  const premierFeature = ALL_FEATURES.find(f => f.slug === "plan-2d-interactif") || ALL_FEATURES[0];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <FeatureNavbar 
        featureTitle="Catalogue des Fonctionnalités" 
        category="Vue d'ensemble" 
      />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Toutes les Fonctionnalités Eventzone
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
              Une suite logicielle complète conçue pour digitaliser chaque étape de votre événement : de la commercialisation des stands à la billetterie jusqu'au contrôle d'accès sur le terrain.
            </p>

            {/* Featured Hero Card (Premier Feature) */}
            <div className="mt-12 max-w-5xl mx-auto text-left">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#081431] to-slate-900 text-white shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-3 max-w-2xl">
                    <span className="inline-block text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                      Module Flagship en Vedette
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {premierFeature.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      {premierFeature.tagline}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300 pt-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" /> Cartographie 2D vectorielle
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" /> Disponibilité en direct
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" /> Guidage mobile sans appli
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`/features/${premierFeature.slug}`}
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group-hover:scale-105"
                    >
                      <span>Découvrir la page dédiée</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Full Features Grid */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Chaque Besoin a Sa Solution Dédiée
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Explorez nos modules et découvrez comment chaque brique logicielle s'intègre harmonieusement à vos opérations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {ALL_FEATURES.map((feat) => (
                <Link
                  key={feat.slug}
                  href={`/features/${feat.slug}`}
                  className="p-6 sm:p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-blue-300 transition-all duration-200 hover:shadow-xl group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                        Module {feat.moduleNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {feat.category}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {feat.title}
                    </h3>

                    <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-medium">
                      {feat.tagline}
                    </p>

                    {feat.keyMetrics && feat.keyMetrics.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                        {feat.keyMetrics.slice(0, 2).map((m, idx) => (
                          <div key={idx}>
                            <p className="text-sm font-black text-blue-600">{m.value}</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600">
                    <span>Explorer le module</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
