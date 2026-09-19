/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  X, ChevronDown, Upload, CheckCircle2, ShieldCheck
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { 
  ALGERIAN_WILAYAS, 
  ALGERIAN_BANKS, 
  DEFAULT_INVOICING_PROFILE, 
  TVA_RATES 
} from "../lib/invoicingConstants";
import { uploadMedia } from "../lib/storage";
import { useLanguage } from "../lib/i18n";

/**
 * InvoicingProfileSettingsModal
 * Manages company profile, Algerian fiscal identifiers, default sequence prefixes, and bank accounts.
 * Rendered as a sleek right-side slide-over drawer panel matching the platform's standard UI.
 */
export default function InvoicingProfileSettingsModal({
  isOpen = false,
  onClose,
  currentProfile = null,
  onSaveProfile,
  userId = null,
}) {
  const { t, isRTL } = useLanguage();
  const [profile, setProfile] = useState(DEFAULT_INVOICING_PROFILE);
  const [activeSection, setActiveSection] = useState("company"); // 'company', 'fiscal', 'defaults', 'treasury', 'bank', 'taxes'
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      setProfile({
        ...DEFAULT_INVOICING_PROFILE,
        ...currentProfile,
      });
    } else {
      setProfile(DEFAULT_INVOICING_PROFILE);
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleSection = (sec) => {
    setActiveSection(prev => (prev === sec ? null : sec));
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadMedia(file, "event-images", null, "invoice-logos", { preset: "logo" });
      if (url) {
        handleFieldChange("logo_url", url);
      }
    } catch (err) {
      console.error("Logo upload failed:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Signature / Stamp Upload
  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStamp(true);
    try {
      const url = await uploadMedia(file, "event-images", null, "invoice-stamps", { preset: "logo" });
      if (url) {
        handleFieldChange("signature_url", url);
      }
    } catch (err) {
      console.error("Stamp upload failed:", err);
    } finally {
      setIsUploadingStamp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const toSave = {
        ...profile,
        user_id: userId || profile.user_id,
      };
      if (onSaveProfile) {
        await onSaveProfile(toSave);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onClose) onClose();
      }, 700);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in font-sans">
      {/* Blurry Backdrop with click to close */}
      <div
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
      />

      {/* Slide-over Drawer on the Right */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="relative w-full max-w-2xl lg:max-w-3xl bg-white h-full shadow-2xl z-10 flex flex-col border-inline-start border-slate-200 overflow-hidden animate-slide-in-right"
      >
        {/* Drawer Header */}
        <header className="px-6 sm:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white select-none shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {t("invoicing.fiscalProfileTitle", "Profil de facturation & Paramètres")}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t("invoicing.fiscalProfileDesc", "Configurez l'identité légale, la fiscalité et les coordonnées bancaires de votre organisation.")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t("common.close", "Fermer")}
          >
            <X size={18} />
          </button>
        </header>

        {/* Form wrapping scrollable content and sticky footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
          {/* NOM DU PROFIL */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              NOM DU PROFIL
            </label>
            <input
              type="text"
              value={profile.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Ex: Eventzone ou Filiale Ouest"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Accordion 1: Informations de l'entreprise */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("company")}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Informations de l&apos;entreprise
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${activeSection === "company" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "company" && (
              <div className="p-4 space-y-3.5 border-t border-slate-200 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      RAISON SOCIALE *
                    </label>
                    <input
                      type="text"
                      value={profile.company_name || ""}
                      onChange={(e) => handleFieldChange("company_name", e.target.value)}
                      placeholder="Ex: SPASU Eventzone"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      NOM DU GÉRANT
                    </label>
                    <input
                      type="text"
                      value={profile.manager_name || ""}
                      onChange={(e) => handleFieldChange("manager_name", e.target.value)}
                      placeholder="Ex: Hachemi Mohamed"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      placeholder="contact@eventzone.pro"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      TÉLÉPHONE
                    </label>
                    <input
                      type="text"
                      value={profile.phone || ""}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      placeholder="0781457511"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    ADRESSE
                  </label>
                  <textarea
                    rows={2}
                    value={profile.address || ""}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="Lotissement Pons N° 80, 2ème étage, Bureau N° 16, Commune de Kouba, Wilaya d'Alger"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      WILAYA
                    </label>
                    <SearchableSelect
                      options={ALGERIAN_WILAYAS}
                      value={profile.wilaya || "16 - Alger"}
                      onChange={(val) => handleFieldChange("wilaya", val)}
                      placeholder="Sélectionner une wilaya"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      SECTEUR D&apos;ACTIVITÉ
                    </label>
                    <input
                      type="text"
                      value={profile.activity_sector || ""}
                      onChange={(e) => handleFieldChange("activity_sector", e.target.value)}
                      placeholder="Ex: Events Management"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Logo & Stamp Uploader Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Logo de l'entreprise */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                      LOGO DE L&apos;ENTREPRISE
                    </label>
                    {profile.logo_url ? (
                      <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-xl bg-slate-50">
                        <img
                          src={profile.logo_url}
                          alt="Logo"
                          className="h-10 w-24 object-contain rounded-lg bg-white p-1 border border-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange("logo_url", "")}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 bg-slate-50/50 cursor-pointer transition-colors text-xs font-bold text-slate-600">
                        <Upload size={14} className="text-slate-400" />
                        <span>{isUploadingLogo ? "Téléchargement..." : "Choisir un logo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Cachet / Signature */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                      CACHET / SIGNATURE
                    </label>
                    {profile.signature_url ? (
                      <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-xl bg-slate-50">
                        <img
                          src={profile.signature_url}
                          alt="Cachet"
                          className="h-10 w-16 object-contain rounded-lg bg-white p-1 border border-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange("signature_url", "")}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 bg-slate-50/50 cursor-pointer transition-colors text-xs font-bold text-slate-600">
                        <Upload size={14} className="text-slate-400" />
                        <span>{isUploadingStamp ? "Téléchargement..." : "Choisir un cachet"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStampUpload}
                          disabled={isUploadingStamp}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: DZ Identification fiscale */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("fiscal")}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800">
                  DZ Identification fiscale
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${activeSection === "fiscal" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "fiscal" && (
              <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      NIF (NUMÉRO D&apos;IDENTIFICATION FISCALE)
                    </label>
                    <input
                      type="text"
                      value={profile.nif || ""}
                      onChange={(e) => handleFieldChange("nif", e.target.value)}
                      placeholder="002616124370413"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      NIS (NUMÉRO D&apos;IDENTIFICATION STATISTIQUE)
                    </label>
                    <input
                      type="text"
                      value={profile.nis || ""}
                      onChange={(e) => handleFieldChange("nis", e.target.value)}
                      placeholder="002616124370413"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      RC (REGISTRE DU COMMERCE)
                    </label>
                    <input
                      type="text"
                      value={profile.rc || ""}
                      onChange={(e) => handleFieldChange("rc", e.target.value)}
                      placeholder="26B1243704-00/16"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      ARTICLE D&apos;IMPOSITION (ART. IMP.)
                    </label>
                    <input
                      type="text"
                      value={profile.article_imposition || ""}
                      onChange={(e) => handleFieldChange("article_imposition", e.target.value)}
                      placeholder="1618480001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: Paramètres par défaut */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("defaults")}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Paramètres par défaut
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${activeSection === "defaults" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "defaults" && (
              <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      PRÉFIXE FACTURE
                    </label>
                    <input
                      type="text"
                      value={profile.invoice_prefix || "EZ-26-"}
                      onChange={(e) => handleFieldChange("invoice_prefix", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      PRÉFIXE DEVIS
                    </label>
                    <input
                      type="text"
                      value={profile.quote_prefix || "DEV-26-"}
                      onChange={(e) => handleFieldChange("quote_prefix", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      PRÉFIXE PROFORMA
                    </label>
                    <input
                      type="text"
                      value={profile.proforma_prefix || "PRO-26-"}
                      onChange={(e) => handleFieldChange("proforma_prefix", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      DÉLAI DE PAIEMENT PAR DÉFAUT (JOURS)
                    </label>
                    <input
                      type="number"
                      value={profile.default_payment_delay_days || 30}
                      onChange={(e) => handleFieldChange("default_payment_delay_days", parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      TAUX DE TVA PAR DÉFAUT
                    </label>
                    <SearchableSelect
                      options={TVA_RATES}
                      value={String(profile.default_tva_rate || 19)}
                      onChange={(val) => handleFieldChange("default_tva_rate", Number(val))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    CONDITIONS DE PAIEMENT PAR DÉFAUT
                  </label>
                  <textarea
                    rows={2}
                    value={profile.default_notes || ""}
                    onChange={(e) => handleFieldChange("default_notes", e.target.value)}
                    placeholder="Ex: Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accordion 4: Trésorerie — Solde Bancaire Initial */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("treasury")}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Trésorerie — Solde Bancaire Initial
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${activeSection === "treasury" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "treasury" && (
              <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    SOLDE BANCAIRE INITIAL (DZD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.initial_balance || 0}
                    onChange={(e) => handleFieldChange("initial_balance", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Utilisé pour calculer votre balance de trésorerie nette et les encaissements.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 5: Compte bancaire */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("bank")}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Compte bancaire
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${activeSection === "bank" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "bank" && (
              <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      BANQUE
                    </label>
                    <SearchableSelect
                      options={ALGERIAN_BANKS}
                      value={profile.bank_name || ""}
                      onChange={(val) => handleFieldChange("bank_name", val)}
                      placeholder="BNA, CPA, BEA, CNEP, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      TITULAIRE DU COMPTE
                    </label>
                    <input
                      type="text"
                      value={profile.account_holder || ""}
                      onChange={(e) => handleFieldChange("account_holder", e.target.value)}
                      placeholder="Nom complet ou Raison sociale"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      NUMÉRO DE COMPTE
                    </label>
                    <input
                      type="text"
                      value={profile.account_number || ""}
                      onChange={(e) => handleFieldChange("account_number", e.target.value)}
                      placeholder="00X XXXXX XXXXXXXXXX XX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      RIB (RELEVÉ D&apos;IDENTITÉ BANCAIRE)
                    </label>
                    <input
                      type="text"
                      value={profile.rib || ""}
                      onChange={(e) => handleFieldChange("rib", e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX XXXX XXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      IBAN (SI DISPONIBLE)
                    </label>
                    <input
                      type="text"
                      value={profile.iban || ""}
                      onChange={(e) => handleFieldChange("iban", e.target.value)}
                      placeholder="DZ XXXX XXXX..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      CODE SWIFT / BIC
                    </label>
                    <input
                      type="text"
                      value={profile.swift_bic || ""}
                      onChange={(e) => handleFieldChange("swift_bic", e.target.value)}
                      placeholder="BNAADZXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    ADRESSE DE L&apos;AGENCE BANCAIRE
                  </label>
                  <input
                    type="text"
                    value={profile.bank_agency_address || ""}
                    onChange={(e) => handleFieldChange("bank_agency_address", e.target.value)}
                    placeholder="Agence d'Alger-Centre"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accordion 6: Fiscalité & Déclarations (G50 / IBS / IRG) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("taxes")}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Fiscalité & Déclarations (G50 / IBS / IRG)
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${activeSection === "taxes" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "taxes" && (
              <div className="p-4 space-y-2 border-t border-slate-200 bg-white text-xs text-slate-600">
                <p>
                  Les factures générées dans ce module appliquent automatiquement le taux de TVA en vigueur (19% ou 9%), le calcul du droit de timbre fiscal algérien (1% plafonné à 2 500 DA), et les mentions obligatoires requises par la Direction Générale des Impôts (DGI).
                </p>
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-800 font-semibold">
                  <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                  <span>Tous vos documents sont conformes aux normes de comptabilité algériennes (SCF).</span>
                </div>
              </div>
            )}
          </div>

          </div>

          {/* Sticky Bottom Footer */}
          <footer className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-lg select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={16} className="text-white" />
                  <span>{t("common.saved", "Enregistré !")}</span>
                </>
              ) : (
                <span>{isSaving ? t("common.saving", "Enregistrement...") : t("invoicing.saveProfile", "Enregistrer le profil")}</span>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
