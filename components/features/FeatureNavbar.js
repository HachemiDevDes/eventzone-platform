"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Phone, Calendar } from "lucide-react";

export default function FeatureNavbar({ featureTitle, category }) {

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 group shrink-0"
            title="Retour à l'accueil Eventzone"
          >
            <img 
              src="https://i.imgur.com/jFDrQbM.png" 
              alt="eventzone" 
              style={{ height: '26px', width: 'auto' }}
              className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium pl-3 border-l border-slate-200">
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Accueil
            </Link>
            <ChevronRight size={13} className="text-slate-300" />
            <Link href="/features" className="hover:text-slate-700 transition-colors">
              Fonctionnalités
            </Link>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="text-slate-900 font-bold truncate max-w-[220px]">
              {featureTitle}
            </span>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20une%20d%C3%A9mo%20du%20plan%20interactif"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <Phone size={13} className="text-emerald-600" />
            <span>+213 781 45 75 11</span>
          </a>

          <a
            href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20une%20d%C3%A9mo%20personnalis%C3%A9e"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar size={14} />
            <span>Demander une démo</span>
          </a>

        </div>

      </div>
    </header>
  );
}
