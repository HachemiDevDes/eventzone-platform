"use client";

import React, { useState } from "react";
import { 
  ZoomIn, ZoomOut, RotateCcw, CheckCircle2, 
  Building2, Sparkles, PhoneCall, ExternalLink, 
  Eye, Filter, Layers, ArrowRight, ShieldCheck, MapPin
} from "lucide-react";

const INITIAL_BOOTHS = [
  // Hall A - Top Row
  { id: "A01", label: "Stand A01", size: "18 m²", dim: "3m × 6m", status: "reserved", exhibitor: "Algérie Télécom", industry: "Télécom & Fibre", price: "280 000 DZD", featured: true, col: 1, row: 1 },
  { id: "A02", label: "Stand A02", size: "18 m²", dim: "3m × 6m", status: "reserved", exhibitor: "Yassir Inc.", industry: "Mobilité & FinTech", price: "280 000 DZD", col: 2, row: 1 },
  { id: "A03", label: "Stand A03", size: "12 m²", dim: "3m × 4m", status: "available", exhibitor: null, industry: "Emplacement libre", price: "190 000 DZD", col: 3, row: 1 },
  { id: "A04", label: "Stand A04", size: "12 m²", dim: "3m × 4m", status: "available", exhibitor: null, industry: "Emplacement libre", price: "190 000 DZD", col: 4, row: 1 },
  { id: "A05", label: "Stand A05", size: "24 m²", dim: "4m × 6m", status: "vip", exhibitor: "Sonatrach Digital", industry: "Énergie & Cloud", price: "450 000 DZD", featured: true, col: 5, row: 1 },

  // Hall A - Bottom Row
  { id: "A06", label: "Stand A06", size: "18 m²", dim: "3m × 6m", status: "available", exhibitor: null, industry: "Emplacement libre", price: "280 000 DZD", col: 1, row: 2 },
  { id: "A07", label: "Stand A07", size: "18 m²", dim: "3m × 6m", status: "reserved", exhibitor: "Ooredoo Business", industry: "Cloud & 5G", price: "280 000 DZD", col: 2, row: 2 },
  { id: "A08", label: "Stand A08", size: "12 m²", dim: "3m × 4m", status: "reserved", exhibitor: "Djezzy Entreprise", industry: "Services Numériques", price: "190 000 DZD", col: 3, row: 2 },
  { id: "A09", label: "Stand A09", size: "12 m²", dim: "3m × 4m", status: "available", exhibitor: null, industry: "Emplacement libre", price: "190 000 DZD", col: 4, row: 2 },
  { id: "A10", label: "Stand A10", size: "24 m²", dim: "4m × 6m", status: "vip", exhibitor: "CPA Banque", industry: "Banque & FinTech", price: "450 000 DZD", featured: true, col: 5, row: 2 },

  // Hall B - Central Island
  { id: "B01", label: "Stand B01", size: "36 m²", dim: "6m × 6m", status: "vip", exhibitor: "BNA Digital Hub", industry: "Solutions Paiement CIB", price: "680 000 DZD", featured: true, col: 1, row: 3 },
  { id: "B02", label: "Stand B02", size: "18 m²", dim: "3m × 6m", status: "reserved", exhibitor: "Air Algérie Cargo", industry: "Transport & Fret", price: "280 000 DZD", col: 2, row: 3 },
  { id: "B03", label: "Stand B03", size: "18 m²", dim: "3m × 6m", status: "available", exhibitor: null, industry: "Emplacement libre", price: "280 000 DZD", col: 3, row: 3 },
  { id: "B04", label: "Stand B04", size: "18 m²", dim: "3m × 6m", status: "reserved", exhibitor: "Cosider Ingénierie", industry: "BTP & Smarthome", price: "280 000 DZD", col: 4, row: 3 },
  { id: "B05", label: "Stand B05", size: "36 m²", dim: "6m × 6m", status: "vip", exhibitor: "Saidal Pharma", industry: "Santé & Biotech", price: "680 000 DZD", featured: true, col: 5, row: 3 },
];

export default function InteractiveFloorPlanPreview({ onSelectBooth }) {
  const [filter, setFilter] = useState("all"); // all | available | reserved | vip
  const [selectedBooth, setSelectedBooth] = useState(INITIAL_BOOTHS[0]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredBooth, setHoveredBooth] = useState(null);

  const filteredBooths = INITIAL_BOOTHS.filter(b => {
    if (filter === "available") return b.status === "available";
    if (filter === "reserved") return b.status === "reserved";
    if (filter === "vip") return b.status === "vip";
    return true;
  });

  const availableCount = INITIAL_BOOTHS.filter(b => b.status === "available").length;
  const reservedCount = INITIAL_BOOTHS.filter(b => b.status === "reserved").length;
  const vipCount = INITIAL_BOOTHS.filter(b => b.status === "vip").length;

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.85), 1.25));
  };

  const resetZoom = () => setZoomLevel(1);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all">
      {/* Header bar of the interactive simulator */}
      <div className="bg-slate-900 px-4 sm:px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            Simulateur Dynamique 2D • Salon International Tech & Industrie 2026
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
            <Layers size={12} /> Hall A & B
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Tous ({INITIAL_BOOTHS.length})
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filter === "available"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800 text-emerald-300 hover:bg-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Disponibles ({availableCount})
          </button>
          <button
            onClick={() => setFilter("reserved")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filter === "reserved"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-800 text-blue-300 hover:bg-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Réservés ({reservedCount})
          </button>
          <button
            onClick={() => setFilter("vip")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filter === "vip"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-800 text-amber-300 hover:bg-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            VIP & Sponsors ({vipCount})
          </button>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px] bg-slate-50">
        
        {/* Left: 2D Exhibition Floor Canvas */}
        <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden select-none">
          
          {/* Controls Bar floating top */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs flex items-center gap-1.5">
                <MapPin size={12} className="text-blue-600" /> Hall Central d'Exposition
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Cliquez sur un stand pour voir sa fiche en temps réel
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
              <button 
                onClick={() => handleZoom(0.1)} 
                title="Zoom Avant"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <button 
                onClick={() => handleZoom(-0.1)} 
                title="Zoom Arrière"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <button 
                onClick={resetZoom} 
                title="Réinitialiser la vue"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Exhibition Map Layout */}
          <div 
            className="flex-1 w-full flex flex-col justify-center items-center py-2 transition-transform duration-200 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Stage / Plenary Banner */}
            <div className="w-full max-w-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl py-2 px-4 mb-4 text-center border border-indigo-800/40 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-bold tracking-wide uppercase">Grande Scène Keynote & Conférences</span>
              </div>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-semibold px-2 py-0.5 rounded-full">
                Capacité 800 places
              </span>
            </div>

            {/* Booths Grid */}
            <div className="w-full max-w-xl grid grid-cols-5 gap-2.5 sm:gap-3.5 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-md">
              {INITIAL_BOOTHS.map((booth) => {
                const isSelected = selectedBooth?.id === booth.id;
                const isHovered = hoveredBooth?.id === booth.id;
                const isDimmed = filter !== "all" && booth.status !== filter;

                // Status theme styling
                let bgStyle = "bg-slate-100 border-slate-300 text-slate-700";
                let badgeStyle = "bg-slate-200 text-slate-700";

                if (booth.status === "available") {
                  bgStyle = isSelected 
                    ? "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-400/50 shadow-md"
                    : "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 border-emerald-300 hover:border-emerald-400";
                  badgeStyle = isSelected ? "bg-white/20 text-white" : "bg-emerald-200/60 text-emerald-800";
                } else if (booth.status === "reserved") {
                  bgStyle = isSelected
                    ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/50 shadow-md"
                    : "bg-blue-50/90 hover:bg-blue-100 text-blue-950 border-blue-300 hover:border-blue-400";
                  badgeStyle = isSelected ? "bg-white/20 text-white" : "bg-blue-200/60 text-blue-800";
                } else if (booth.status === "vip") {
                  bgStyle = isSelected
                    ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/50 shadow-md"
                    : "bg-amber-50/90 hover:bg-amber-100 text-amber-950 border-amber-300 hover:border-amber-400";
                  badgeStyle = isSelected ? "bg-white/20 text-white" : "bg-amber-200/60 text-amber-800";
                }

                return (
                  <div
                    key={booth.id}
                    onClick={() => setSelectedBooth(booth)}
                    onMouseEnter={() => setHoveredBooth(booth)}
                    onMouseLeave={() => setHoveredBooth(null)}
                    className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[82px] sm:min-h-[92px] ${bgStyle} ${
                      isDimmed ? "opacity-25 grayscale pointer-events-none" : "opacity-100 hover:scale-[1.03]"
                    } ${isSelected ? "scale-[1.03] z-10" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-[11px] sm:text-xs tracking-tight">
                        {booth.id}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${badgeStyle}`}>
                        {booth.size}
                      </span>
                    </div>

                    <div className="my-auto py-1">
                      {booth.exhibitor ? (
                        <p className="text-[10px] sm:text-[11px] font-bold truncate leading-tight">
                          {booth.exhibitor}
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-emerald-700/80 italic">
                          Disponible
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-medium opacity-80 pt-0.5 border-t border-current/10">
                      <span>{booth.dim}</span>
                      {booth.status === "vip" && <Sparkles size={10} className="text-amber-500" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Aisle & Entrance Bar */}
            <div className="w-full max-w-xl flex items-center justify-between gap-3 mt-4 text-xs font-bold text-slate-500">
              <div className="flex-1 h-8 bg-slate-200/80 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-[11px]">
                🚪 Entrée Principale & Accueil Badges
              </div>
              <div className="flex-1 h-8 bg-slate-200/80 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-[11px]">
                ☕ Espace Networking & Cafétéria
              </div>
            </div>
          </div>

          {/* Interactive Footer Legend */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="font-semibold text-slate-700">Disponible</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span className="font-semibold text-slate-700">Réservé / Occupé</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="font-semibold text-slate-700">Sponsor Majeur (VIP)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Synchronisation instantanée ⚡
            </span>
          </div>
        </div>

        {/* Right: Selected Stand Detailed Sheet */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fiche Stand Connectée
              </span>
              {selectedBooth.status === "available" && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Emplacement Libre
                </span>
              )}
              {selectedBooth.status === "reserved" && (
                <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Stand Attribué
                </span>
              )}
              {selectedBooth.status === "vip" && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={12} /> Pack Sponsor VIP
                </span>
              )}
            </div>

            {/* Stand Title & Dimensions */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-extrabold text-slate-900">
                  {selectedBooth.label}
                </h4>
                <span className="text-base font-extrabold text-blue-600">
                  {selectedBooth.size}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dimensions au sol : {selectedBooth.dim} • Hall Central A
              </p>
            </div>

            {/* Exhibitor / Assignment Info */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {selectedBooth.exhibitor ? "Exposant Officiel" : "Disponibilité Commerciale"}
              </p>
              
              {selectedBooth.exhibitor ? (
                <div className="mt-2 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-extrabold text-blue-600 text-sm shadow-xs shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 leading-tight">
                      {selectedBooth.exhibitor}
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {selectedBooth.industry}
                    </p>
                    <span className="inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1.5 border border-blue-100">
                      Catalogue B2B & Rendez-vous actifs
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-800">
                    Cet espace est immédiatement disponible à la réservation.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tarif d'exposition indicatif : <span className="font-bold text-slate-800">{selectedBooth.price}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Inclusions checklist */}
            <div className="mt-5 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Équipements & Prestations Incluses
              </p>
              <ul className="text-xs space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Moquette ignifugée M3 & cloisons modulaires</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Branchement électrique monophasé 3 kW</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Enseigne avec nom de l'entreprise & QR code vitrine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Accès illimité portail exposant & gestion des badges</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            {selectedBooth.status === "available" ? (
              <a
                href="#contact"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Optionner le stand {selectedBooth.id}</span>
                <ArrowRight size={14} />
              </a>
            ) : (
              <a
                href="#contact"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Demander une démo organisateur</span>
                <ArrowRight size={14} />
              </a>
            )}
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Modélisation 100% vectorielle sans aucun temps de chargement
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
