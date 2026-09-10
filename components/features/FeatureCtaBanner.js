"use client";

import React, { useState } from "react";
import { Mail, Phone, Globe, Send, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function FeatureCtaBanner({ featureTitle }) {
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventName: "",
    notes: ""
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
    }, 800);
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-[#081431] text-white relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Proposition Message & Contact Information from PDF Page 5 */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Préparez Votre Prochain Événement en Toute Sérénité.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Notre équipe d'experts vous accompagne à chaque étape pour configurer votre plan interactif, former vos équipes et garantir une expérience mémorable le jour J.
            </p>

            {/* Direct Contact Cards */}
            <div className="pt-4 space-y-3">
              <a
                href="mailto:contact@eventzone.pro"
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Officiel</p>
                  <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    contact@eventzone.pro
                  </p>
                </div>
              </a>

              <a
                href="https://wa.me/213781457511?text=Bonjour%20Eventzone%2C%20je%20souhaite%20un%20devis%20pour%20notre%20%C3%A9v%C3%A9nement"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Téléphone / WhatsApp Direct</p>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    +213 781 45 75 11
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plateforme Web</p>
                  <p className="text-sm font-bold text-white">
                    www.eventzone.pro
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Devis / Demo Form */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Demander une proposition chiffrée
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Recevez sous 24h une simulation complète adaptée à la taille de votre événement.
                </p>
              </div>

              {status === "success" ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-900">Demande transmise avec succès !</h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    Un conseiller Eventzone prendra contact avec vous dans les plus brefs délais pour vous faire une démonstration personnalisée.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950 mt-2 cursor-pointer"
                  >
                    Envoyer une autre demande
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom complet ou Société *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.fullName}
                      onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                      placeholder="Ex: Mohamed Benali / Agence Horizon"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email professionnel *
                      </label>
                      <input
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="contact@entreprise.dz"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Numéro de téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        placeholder="+213 5XX XX XX XX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom du salon ou de l'événement
                    </label>
                    <input
                      type="text"
                      value={formState.eventName}
                      onChange={(e) => setFormState({ ...formState, eventName: e.target.value })}
                      placeholder="Ex: Salon International de l'Industrie 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Détails ou besoins particuliers
                    </label>
                    <textarea
                      rows={3}
                      value={formState.notes}
                      onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                      placeholder="Nombre approximatif de stands, date prévue de l'événement..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>{status === "loading" ? "Transmission en cours..." : "Demander un devis"}</span>
                    <span className="font-mono tracking-tighter"> &gt;&gt;&gt;&gt;</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Réponse garantie sous 24 heures ouvrées • Confidentialité assurée
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
