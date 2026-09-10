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
                    
                    <VisualGraphicCard item={item} idx={idx} featureSlug={feature.slug} />

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

function VisualGraphicCard({ item, idx, featureSlug }) {
  const type = item.visualType;

  // 1. Plan 2D Interactif
  if (type === "canvas-zoom" || (featureSlug === "plan-2d-interactif" && idx === 0)) {
    return (
      <div className="space-y-4">
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
        <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-500 font-medium">
          <span>Sélection : <strong className="text-slate-900 font-semibold">Stand A02</strong></span>
          <span className="text-blue-600 font-semibold">Cliquer pour optionner</span>
        </div>
      </div>
    );
  }

  if (type === "status-grid" || (featureSlug === "plan-2d-interactif" && idx === 1)) {
    return (
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
    );
  }

  if (type === "exhibitor-card" || (featureSlug === "plan-2d-interactif" && idx === 2)) {
    return (
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
    );
  }

  if (type === "mobile-guidance" || (featureSlug === "plan-2d-interactif" && idx === 3)) {
    return (
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
    );
  }

  // 2. Billetterie & Inscriptions
  if (type === "ticket-pricing") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            Pass VIP Accès Total
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Early Bird
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-3xl font-black text-slate-900 block">4 500 DZD</span>
            <span className="text-xs text-slate-500 font-medium">TTC • Facture automatique</span>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            Quota 120/150
          </span>
        </div>
        <div className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl text-center shadow-xs cursor-pointer hover:bg-blue-700 transition-colors">
          Sélectionner ce pass
        </div>
      </div>
    );
  }

  if (type === "dynamic-form") {
    return (
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500">Nom & Prénom</span>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
            Amina Benali
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500">Organisation</span>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
            Sonatrach Innovation Lab
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Accès Ateliers & Conférences</span>
          <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Inclus</span>
        </div>
      </div>
    );
  }

  if (type === "payment-methods") {
    return (
      <div className="space-y-5">
        <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Montant Net</span>
          <span className="text-2xl font-black text-slate-900">4 500 DZD</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-blue-50/80 border-2 border-blue-600 text-center shadow-xs">
            <span className="text-xs font-black text-blue-900 block">Carte Edahabia</span>
            <span className="text-[10px] text-blue-600 font-bold">Instantané</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-slate-700 block">Carte CIB</span>
            <span className="text-[10px] text-slate-400 font-medium">Toutes banques</span>
          </div>
        </div>
        <div className="pt-1 text-center">
          <span className="text-xs font-semibold text-slate-500">
            🔒 Transaction certifiée 3D-Secure
          </span>
        </div>
      </div>
    );
  }

  if (type === "digital-pass") {
    return (
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
          <Check size={12} className="stroke-[3]" />
          <span>Billet Confirmé • #EZ-8842</span>
        </div>
        <div className="w-28 h-28 mx-auto rounded-2xl bg-slate-900 text-white p-3 flex flex-col items-center justify-center shadow-md">
          <div className="w-full h-full border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center text-xs font-black tracking-widest">
            QR CODE
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">
          Envoyé instantanément par e-mail & WhatsApp
        </div>
      </div>
    );
  }

  // 3. Émargement Express
  if (type === "scan-success") {
    return (
      <div className="space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
          <Check size={32} className="stroke-[3]" />
        </div>
        <div>
          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Entrée Validée • 0.8s
          </span>
          <h4 className="text-base font-black text-slate-900 mt-2">Karim Mansouri</h4>
          <span className="text-xs text-slate-500 font-medium">Pass VIP • Porte Principale</span>
        </div>
      </div>
    );
  }

  if (type === "offline-resilience") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              Mode Hors-Ligne Actif
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">100% Autonome</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
          <span className="text-3xl font-black text-slate-900 block">1 240</span>
          <span className="text-xs text-slate-500 font-medium mt-0.5 block">Scans locaux prêts pour synchronisation</span>
        </div>
        <div className="text-center text-xs text-slate-500 font-medium">
          Zéro interruption des entrées sur site
        </div>
      </div>
    );
  }

  if (type === "anti-fraud") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
            Alerte Détection Doublon
          </span>
          <span className="text-xs font-bold text-rose-600">Accès Refusé</span>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1">
          <p className="text-xs font-bold text-rose-900">Billet déjà scanné</p>
          <p className="text-[11px] text-rose-700">Premier passage à 09:14 (Porte 01)</p>
        </div>
        <div className="text-center text-xs text-slate-500 font-medium">
          Protection infalsifiable contre les photocopies
        </div>
      </div>
    );
  }

  if (type === "badge-print") {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Exposant</span>
            <span className="text-[10px] text-slate-400 font-bold">Stand A14</span>
          </div>
          <h4 className="text-sm font-black text-slate-900">Yacine Brahimi</h4>
          <p className="text-xs text-slate-500">Directeur Général • Tech Solutions</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <span>Impression sur site</span>
          <strong className="text-blue-600 font-bold">2.5 secondes</strong>
        </div>
      </div>
    );
  }

  // 4. CRM & Easy Upload
  if (type === "easy-upload") {
    return (
      <div className="space-y-5 text-center">
        <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
          <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block shadow-2xs">
            contacts_salon_2026.xlsx
          </div>
          <span className="text-3xl font-black text-blue-600 block pt-1">2 840</span>
          <span className="text-xs text-slate-500 font-medium block">Contacts détectés & vérifiés</span>
        </div>
        <div className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-blue-700 transition-colors">
          Valider l'importation
        </div>
      </div>
    );
  }

  if (type === "deduplication") {
    return (
      <div className="space-y-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualité des données</span>
          <span className="text-2xl font-black text-emerald-600">100% Saine</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-2xl font-black text-slate-900 block">2 840</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Lignes importées</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-2xl font-black text-emerald-700 block">64</span>
            <span className="text-xs text-emerald-700 font-medium mt-0.5 block">Doublons fusionnés</span>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 font-medium">
          Numéros et adresses normalisés sans perte
        </div>
      </div>
    );
  }

  if (type === "segmentation") {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">VIP & Officiels</span>
          <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">142</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Acheteurs & Décideurs</span>
          <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">580</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Presse & Médias</span>
          <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">45</span>
        </div>
        <div className="pt-2 text-center text-xs text-slate-500 font-medium">
          Ciblage précis pour vos campagnes d'invitation
        </div>
      </div>
    );
  }

  if (type === "participant-360") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            SB
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Dr. Selim Benali</h4>
            <span className="text-xs text-blue-600 font-bold">Intervenant International</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Historique participations</span>
          <span className="font-bold text-slate-900">3 Éditions • 100% présence</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Santé</span>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">VIP</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Badge Émis</span>
        </div>
      </div>
    );
  }

  // 5. Logistique VIP
  if (type === "flight-transfers") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500">Vol AH1003 • CDG ➔ ALG</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Atterri</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Chauffeur : Véhicule VIP 01</span>
            <span className="text-blue-600 font-bold">En route</span>
          </div>
          <p className="text-[11px] text-slate-500">Prise en charge terminal international</p>
        </div>
        <div className="text-center text-xs text-slate-500 font-medium">
          Temps estimé vers l'hôtel : 18 minutes
        </div>
      </div>
    );
  }

  if (type === "hotel-rooms") {
    return (
      <div className="space-y-5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hôtel El Aurassi</span>
          <span className="text-2xl font-black text-slate-900">88% Attribué</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-2xl font-black text-slate-900 block">28</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Confirmées</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
            <span className="text-2xl font-black text-amber-700 block">4</span>
            <span className="text-xs text-amber-700 font-medium mt-0.5 block">En attente RSVP</span>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 font-medium">
          Rooming list synchronisée en temps réel
        </div>
      </div>
    );
  }

  if (type === "technical-gear") {
    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-500 pb-1">Salle Plénière • Régie A</div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Micro HF Cravate (x4)</span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">En service</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Écran retour & Clicker</span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Vérifié</span>
        </div>
        <div className="pt-1 text-center text-xs text-slate-500 font-medium">
          Inventaire scanné par le régisseur
        </div>
      </div>
    );
  }

  if (type === "vip-protocol") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            Fiche Protocolaire
          </span>
          <span className="text-xs font-bold text-slate-400">Ordre #01</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <h4 className="text-sm font-black text-slate-900">S.E. Monsieur l'Ambassadeur</h4>
          <p className="text-xs text-slate-600 font-medium">Salon d'Honneur • Porte B</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <span>Hôtesse dédiée</span>
          <strong className="text-slate-900 font-bold">Yasmine B.</strong>
        </div>
      </div>
    );
  }

  // 6. Marketing d'Influence
  if (type === "tracked-links") {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500">Lien Partenaire Dédié</span>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-blue-600 truncate">
            eventzone.app/billets?ref=tech-dz
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-2xl font-black text-slate-900 block">2 450</span>
            <span className="text-[11px] text-slate-500 font-medium">Clics uniques</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-2xl font-black text-emerald-700 block">185</span>
            <span className="text-[11px] text-emerald-700 font-medium">Ventes générées</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "roi-attribution") {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CA Généré</span>
            <span className="text-2xl font-black text-slate-900">740 000 DZD</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "75%" }} />
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
          <span className="text-slate-600">Top Partenaire : <strong className="text-slate-900">Tech DZ</strong></span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">+24% ROI</span>
        </div>
      </div>
    );
  }

  if (type === "commission-engine") {
    return (
      <div className="space-y-5">
        <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500">Commission Partenaire (10%)</span>
          <span className="text-2xl font-black text-emerald-600">74 000 DZD</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">Statut du règlement</span>
          <span className="text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded">Validée</span>
        </div>
        <div className="text-center text-xs text-slate-500 font-medium">
          Calcul automatique sans tableur manuel
        </div>
      </div>
    );
  }

  if (type === "partner-portal") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900">Espace Ambassadeur</h4>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">Rang #1</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">Ventes cette semaine</span>
          <span className="font-bold text-slate-900">32 Billets</span>
        </div>
        <div className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl text-center cursor-pointer hover:bg-slate-200 transition-colors">
          Télécharger le kit visuels & bannières
        </div>
      </div>
    );
  }

  // 7. Dashboard Analytics & Certificats
  if (type === "attendance-analytics") {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taux de présence</span>
            <span className="text-3xl font-black text-slate-900">89.2%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "89%" }} />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">Pic d'affluence</span>
          <span className="font-bold text-slate-900">09:45 • 540 entrées / 15min</span>
        </div>
      </div>
    );
  }

  if (type === "certificate-preview") {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
            Certificat Officiel
          </span>
          <h4 className="text-sm font-black text-slate-900">Nour El Houda Belkacem</h4>
          <p className="text-xs text-slate-500">Congrès International de Médecine 2026</p>
        </div>
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-block">
          ✓ Présence 100% validée par émargement
        </div>
      </div>
    );
  }

  if (type === "qr-verification") {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
          <Check size={24} className="stroke-[2.5]" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900">Attestation Certifiée Conforme</h4>
          <span className="text-xs font-mono text-slate-500">#CERT-EZ-2026-881</span>
        </div>
        <div className="text-xs font-medium text-slate-500">
          Vérification publique infalsifiable hébergée par Eventzone
        </div>
      </div>
    );
  }

  if (type === "export-pack") {
    return (
      <div className="space-y-3">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Rapport_Affluence_HD.pdf</span>
          <span className="text-blue-600 font-bold">2.4 MB</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Listing_Emargement_Complet.xlsx</span>
          <span className="text-emerald-600 font-bold">3 120 lignes</span>
        </div>
        <div className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl text-center shadow-xs cursor-pointer hover:bg-blue-700 transition-colors">
          Télécharger le pack complet
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
      <Sparkles size={28} className="text-blue-600 mx-auto mb-2" />
      <p className="text-sm font-bold text-slate-800">{item.title}</p>
      <p className="text-xs text-slate-500 mt-1">{item.subtitle || item.description}</p>
    </div>
  );
}
