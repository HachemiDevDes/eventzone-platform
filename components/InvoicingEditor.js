/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, Save, Share2, Download, Plus, Trash2, 
  GripVertical, Check, Upload, Copy, FileText, 
  Calendar, CheckCircle2, AlertCircle, Printer
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import InvoicingDocumentPreview from "./InvoicingDocumentPreview";
import { 
  DOCUMENT_TYPES, 
  DOCUMENT_STATUSES, 
  PAYMENT_DELAYS, 
  TVA_RATES, 
  CURRENCIES, 
  calculateFiscalStamp, 
  DEFAULT_INVOICING_PROFILE 
} from "../lib/invoicingConstants";
import { numberToAlgerianWords } from "../lib/numberToWords";
import { uploadMedia } from "../lib/storage";

/**
 * InvoicingEditor
 * Split-screen Document Editor with Live A4 Preview matching Images 2 & 3.
 */
export default function InvoicingEditor({
  initialDocument = null,
  activeProfile = null,
  savedClients = [],
  organizations = [],
  opportunities = [],
  onBack,
  onSave,
  onCopyShareLink,
  onDownloadPdf,
}) {
  const [doc, setDoc] = useState(() => {
    if (initialDocument) return initialDocument;

    const prof = activeProfile || DEFAULT_INVOICING_PROFILE;
    const now = new Date();
    const issueDate = now.toISOString().split("T")[0];
    
    // Default 30 days due date
    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + (prof.default_payment_delay_days || 30));
    const dueDate = dueDateObj.toISOString().split("T")[0];

    const prefix = prof.invoice_prefix || "EZ-26-";
    const seq = String(prof.next_invoice_seq || 1).padStart(4, "0");

    return {
      document_type: "facture",
      document_number: `${prefix}${seq}`,
      status: "brouillon",
      issue_date: issueDate,
      due_date: dueDate,
      payment_terms_type: "30_jours",
      currency: prof.default_currency || "DZD",
      logo_url: prof.logo_url || "",

      // Issuer snapshot
      emitter_company_name: prof.company_name || "SPASU Eventzone",
      emitter_manager_name: prof.manager_name || "Hachemi Mohamed",
      emitter_address: prof.address || "Lotissement Pons N° 80, 2ème étage, Bureau N° 16, Commune de Kouba, Wilaya d'Alger",
      emitter_email: prof.email || "contact@eventzone.pro",
      emitter_phone: prof.phone || "0781457511",
      emitter_nif: prof.nif || "002616124370413",
      emitter_rc: prof.rc || "26B1243704-00/16",
      emitter_nis: prof.nis || "002616124370413",
      emitter_article_imposition: prof.article_imposition || "1618480001",
      emitter_bank_details: {
        bank_name: prof.bank_name || "BNA",
        account_holder: prof.account_holder || prof.company_name || "SPASU Eventzone",
        account_number: prof.account_number || "",
        rib: prof.rib || "",
        iban: prof.iban || "",
        swift_bic: prof.swift_bic || "",
        bank_agency_address: prof.bank_agency_address || "",
      },

      // Recipient
      client_name: "",
      client_contact_name: "",
      client_address: "",
      client_email: "",
      client_phone: "",
      client_nif: "",
      client_rc: "",
      client_nis: "",
      client_article_imposition: "",

      // Line items
      line_items: [
        { id: "item-1", description: "", quantity: 1, unit_price: 0, total_ht: 0 }
      ],

      // Taxes & calculations
      subtotal_ht: 0,
      discount_type: "percentage",
      discount_value: 0,
      discount_amount: 0,
      tva_rate: prof.default_tva_rate || 19,
      tva_amount: 0,
      has_fiscal_stamp: false,
      fiscal_stamp_amount: 0,
      total_ttc: 0,
      amount_paid: 0,
      amount_words: "Zéro dinars algériens",

      // Options
      show_signature_stamp: false,
      signature_stamp_url: prof.signature_url || "",
      notes: prof.default_notes || "Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu.",
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [autofilledSource, setAutofilledSource] = useState(null);

  // Recalculate financial totals whenever line items, discount, TVA, or stamp change
  useEffect(() => {
    let subtotal = 0;
    (doc.line_items || []).forEach(item => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unit_price) || 0;
      subtotal += (q * p);
    });

    let discountAmount = 0;
    const discVal = Number(doc.discount_value) || 0;
    if (doc.discount_type === "percentage") {
      discountAmount = (subtotal * discVal) / 100;
    } else {
      discountAmount = Math.min(subtotal, discVal);
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const tvaRate = Number(doc.tva_rate) || 0;
    const tvaAmount = (discountedSubtotal * tvaRate) / 100;

    const stampAmount = doc.has_fiscal_stamp ? calculateFiscalStamp(discountedSubtotal) : 0;
    const totalTtc = discountedSubtotal + tvaAmount + stampAmount;
    const words = numberToAlgerianWords(totalTtc, doc.currency);

    setDoc(prev => ({
      ...prev,
      subtotal_ht: subtotal,
      discount_amount: discountAmount,
      tva_amount: tvaAmount,
      fiscal_stamp_amount: stampAmount,
      total_ttc: totalTtc,
      amount_words: words,
    }));
  }, [
    doc.line_items, 
    doc.discount_type, 
    doc.discount_value, 
    doc.tva_rate, 
    doc.has_fiscal_stamp, 
    doc.currency
  ]);

  const handleFieldChange = (field, value) => {
    setDoc(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Payment delay quick selector handler
  const handlePaymentDelaySelect = (delayId, days) => {
    if (days !== null) {
      const base = new Date(doc.issue_date || new Date());
      base.setDate(base.getDate() + days);
      const newDueDate = base.toISOString().split("T")[0];
      setDoc(prev => ({
        ...prev,
        payment_terms_type: delayId,
        due_date: newDueDate,
      }));
    } else {
      setDoc(prev => ({
        ...prev,
        payment_terms_type: "custom",
      }));
    }
  };

  // Line item handlers
  const handleLineItemChange = (index, field, value) => {
    setDoc(prev => {
      const updated = [...prev.line_items];
      const item = { ...updated[index], [field]: value };
      const q = field === "quantity" ? Number(value) || 0 : Number(item.quantity) || 0;
      const p = field === "unit_price" ? Number(value) || 0 : Number(item.unit_price) || 0;
      item.total_ht = q * p;
      updated[index] = item;
      return { ...prev, line_items: updated };
    });
  };

  const handleAddLineItem = () => {
    setDoc(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { id: `item-${Date.now()}`, description: "", quantity: 1, unit_price: 0, total_ht: 0 }
      ]
    }));
  };

  const handleRemoveLineItem = (index) => {
    setDoc(prev => {
      if (prev.line_items.length <= 1) return prev;
      return {
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index),
      };
    });
  };

  // Quick Client / Organization / Prospect Selector Handler
  const handleSelectClient = (selectedVal) => {
    if (!selectedVal) return;

    // 1. Organization selection
    if (selectedVal.startsWith("org_")) {
      const orgId = selectedVal.replace("org_", "");
      const org = (organizations || []).find(o => String(o.id) === String(orgId));
      if (org) {
        setDoc(prev => ({
          ...prev,
          client_name: org.legalName || org.legal_name || org.name || "",
          client_contact_name: org.contactPerson || org.contact || org.contactName || org.liaison_name || "",
          client_address: org.legalAddress || org.legal_address || org.address || "",
          client_email: org.invoicingEmail || org.invoicing_email || org.email || "",
          client_phone: org.invoicingPhone || org.invoicing_phone || org.phone || "",
          client_nif: org.nif || org.fiscalDetails?.nif || "",
          client_rc: org.rc || org.fiscalDetails?.rc || "",
          client_nis: org.nis || org.fiscalDetails?.nis || "",
          client_article_imposition: org.articleImposition || org.article_imposition || org.fiscalDetails?.article_imposition || "",
        }));
        setAutofilledSource({
          type: "org",
          name: org.name || org.legalName || "Organisation",
          hasFiscal: Boolean(org.nif || org.rc || org.nis || org.articleImposition || org.article_imposition),
        });
        return;
      }
    }

    // 2. Prospect / Opportunity selection
    if (selectedVal.startsWith("opp_")) {
      const oppId = selectedVal.replace("opp_", "");
      const opp = (opportunities || []).find(o => String(o.id) === String(oppId));
      if (opp) {
        setDoc(prev => ({
          ...prev,
          client_name: opp.legalName || opp.legal_name || opp.companyName || opp.name || "",
          client_contact_name: opp.contactName || opp.contactPerson || "",
          client_address: opp.legalAddress || opp.legal_address || "",
          client_email: opp.invoicingEmail || opp.invoicing_email || opp.contactEmail || opp.email || "",
          client_phone: opp.invoicingPhone || opp.invoicing_phone || opp.contactPhone || opp.phone || "",
          client_nif: opp.nif || opp.fiscalDetails?.nif || "",
          client_rc: opp.rc || opp.fiscalDetails?.rc || "",
          client_nis: opp.nis || opp.fiscalDetails?.nis || "",
          client_article_imposition: opp.articleImposition || opp.article_imposition || opp.fiscalDetails?.article_imposition || "",
        }));
        setAutofilledSource({
          type: "opp",
          name: opp.companyName || opp.name || "Prospect",
          hasFiscal: Boolean(opp.nif || opp.rc || opp.nis || opp.articleImposition || opp.article_imposition),
        });
        return;
      }
    }

    // 3. Saved Client selection
    const cleanClientId = selectedVal.startsWith("client_") ? selectedVal.replace("client_", "") : selectedVal;
    const found = (savedClients || []).find(c => String(c.id) === String(cleanClientId));
    if (found) {
      setDoc(prev => ({
        ...prev,
        client_name: found.company_name || "",
        client_contact_name: found.contact_name || "",
        client_address: found.address || "",
        client_email: found.email || "",
        client_phone: found.phone || "",
        client_nif: found.nif || "",
        client_rc: found.rc || "",
        client_nis: found.nis || "",
        client_article_imposition: found.article_imposition || "",
      }));
      setAutofilledSource({
        type: "client",
        name: found.company_name || "Client",
        hasFiscal: Boolean(found.nif || found.rc || found.nis || found.article_imposition),
      });
    }
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
      console.error("Logo upload error:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Save document
  const handleSaveDocument = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(doc);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Print directly from browser
  const handlePrintDocument = () => {
    window.print();
  };

  // Aggregated Client, Organization & Prospect options for SearchableSelect
  const clientOptions = useMemo(() => {
    const orgOptions = (organizations || []).map(o => {
      const hasFiscal = Boolean(o.nif || o.rc || o.nis || o.articleImposition || o.article_imposition);
      return {
        value: `org_${o.id}`,
        label: o.name || o.legalName || "Organisation sans nom",
        description: `🏢 Organisation${o.legalName && o.legalName !== o.name ? ` (${o.legalName})` : ""}${hasFiscal ? " • Détails fiscaux ✓" : ""}`,
      };
    });

    const oppOptions = (opportunities || []).map(o => {
      const hasFiscal = Boolean(o.nif || o.rc || o.nis || o.articleImposition || o.article_imposition);
      return {
        value: `opp_${o.id}`,
        label: o.companyName || o.name || "Prospect sans nom",
        description: `🎯 Prospect${o.contactName ? ` • ${o.contactName}` : ""}${hasFiscal ? " • Détails fiscaux ✓" : ""}`,
      };
    });

    const savedOptions = (savedClients || []).map(c => ({
      value: `client_${c.id}`,
      label: c.company_name || "Client",
      description: `👤 Client${c.contact_name ? ` • ${c.contact_name}` : (c.email ? ` • ${c.email}` : "")}`,
    }));

    return [...orgOptions, ...oppOptions, ...savedOptions];
  }, [organizations, opportunities, savedClients]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Top Action Bar matching Image 2 */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onCopyShareLink(doc)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Copier le lien public"
          >
            <Share2 size={13} />
            <span>Copier le lien</span>
          </button>

          <button
            onClick={handleSaveDocument}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 size={14} />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{isSaving ? "Enregistrement..." : "Enregistrer"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Split Screen: Left (Editor) vs Right (Live A4 Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Form Configuration (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          {/* Card 1: Configuration du document */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Configuration du document
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type de document */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  TYPE DE DOCUMENT
                </label>
                <SearchableSelect
                  options={DOCUMENT_TYPES}
                  value={doc.document_type}
                  onChange={(val) => handleFieldChange("document_type", val)}
                  isClearable={false}
                  showSearch={false}
                />
              </div>

              {/* Numéro */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  NUMÉRO
                </label>
                <input
                  type="text"
                  value={doc.document_number || ""}
                  onChange={(e) => handleFieldChange("document_number", e.target.value)}
                  placeholder="EZ-26-0003"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Statut */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  STATUT
                </label>
                <SearchableSelect
                  options={DOCUMENT_STATUSES}
                  value={doc.status}
                  onChange={(val) => handleFieldChange("status", val)}
                  isClearable={false}
                  showSearch={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date d'émission */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  DATE D&apos;ÉMISSION
                </label>
                <input
                  type="date"
                  value={doc.issue_date || ""}
                  onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Devise */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  DEVISE
                </label>
                <SearchableSelect
                  options={CURRENCIES}
                  value={doc.currency || "DZD"}
                  onChange={(val) => handleFieldChange("currency", val)}
                  isClearable={false}
                  showSearch={false}
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  LOGO
                </label>
                <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                  <Upload size={13} />
                  <span>{isUploadingLogo ? "Upload..." : "Changer"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Délai de paiement */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Délai de paiement
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {PAYMENT_DELAYS.map(del => {
                const isSelected = doc.payment_terms_type === del.id;
                return (
                  <button
                    key={del.id}
                    type="button"
                    onClick={() => handlePaymentDelaySelect(del.id, del.days)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {del.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Due Date Picker if personalized */}
            {doc.payment_terms_type === "custom" && (
              <div className="pt-2 max-w-xs">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  DATE D&apos;ÉCHÉANCE PERSONNALISÉE
                </label>
                <input
                  type="date"
                  value={doc.due_date || ""}
                  onChange={(e) => handleFieldChange("due_date", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            )}
          </div>

          {/* Card 3: Émetteur (Company info) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Émetteur
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  RAISON SOCIALE
                </label>
                <input
                  type="text"
                  value={doc.emitter_company_name || ""}
                  onChange={(e) => handleFieldChange("emitter_company_name", e.target.value)}
                  placeholder="SPASU Eventzone"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  NOM DU CONTACT
                </label>
                <input
                  type="text"
                  value={doc.emitter_manager_name || ""}
                  onChange={(e) => handleFieldChange("emitter_manager_name", e.target.value)}
                  placeholder="Hachemi Mohamed"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                ADRESSE
              </label>
              <textarea
                rows={2}
                value={doc.emitter_address || ""}
                onChange={(e) => handleFieldChange("emitter_address", e.target.value)}
                placeholder="Adresse de l'entreprise..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={doc.emitter_email || ""}
                  onChange={(e) => handleFieldChange("emitter_email", e.target.value)}
                  placeholder="contact@eventzone.pro"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  TÉLÉPHONE
                </label>
                <input
                  type="text"
                  value={doc.emitter_phone || ""}
                  onChange={(e) => handleFieldChange("emitter_phone", e.target.value)}
                  placeholder="0781457511"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  NIF
                </label>
                <input
                  type="text"
                  value={doc.emitter_nif || ""}
                  onChange={(e) => handleFieldChange("emitter_nif", e.target.value)}
                  placeholder="002616124370413"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  RC
                </label>
                <input
                  type="text"
                  value={doc.emitter_rc || ""}
                  onChange={(e) => handleFieldChange("emitter_rc", e.target.value)}
                  placeholder="26B1243704-00/16"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Client (Customer info) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Client Destinataire
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Sélectionnez une organisation ou un prospect pour auto-remplir ses coordonnées fiscales.
                </p>
              </div>

              {clientOptions.length > 0 && (
                <div className="w-full sm:w-72 shrink-0">
                  <SearchableSelect
                    options={clientOptions}
                    value=""
                    onChange={handleSelectClient}
                    placeholder="Choisir organisation / prospect..."
                  />
                </div>
              )}
            </div>

            {autofilledSource && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Auto-rempli depuis {autofilledSource.type === "org" ? "l'organisation" : autofilledSource.type === "opp" ? "le prospect" : "le client"}{" "}
                    <strong className="font-bold text-emerald-950">{autofilledSource.name}</strong>
                    {autofilledSource.hasFiscal ? " (détails fiscaux inclus)" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutofilledSource(null)}
                  className="text-emerald-700 hover:text-emerald-950 text-[11px] font-bold underline ml-2 shrink-0 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  RAISON SOCIALE / NOM *
                </label>
                <input
                  type="text"
                  value={doc.client_name || ""}
                  onChange={(e) => handleFieldChange("client_name", e.target.value)}
                  placeholder="Client SARL"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  NOM DU CONTACT
                </label>
                <input
                  type="text"
                  value={doc.client_contact_name || ""}
                  onChange={(e) => handleFieldChange("client_contact_name", e.target.value)}
                  placeholder="M. Benali"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                ADRESSE
              </label>
              <textarea
                rows={2}
                value={doc.client_address || ""}
                onChange={(e) => handleFieldChange("client_address", e.target.value)}
                placeholder="Adresse complète du client..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={doc.client_email || ""}
                  onChange={(e) => handleFieldChange("client_email", e.target.value)}
                  placeholder="contact@client.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  TÉLÉPHONE
                </label>
                <input
                  type="text"
                  value={doc.client_phone || ""}
                  onChange={(e) => handleFieldChange("client_phone", e.target.value)}
                  placeholder="0555 00 00 00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  NIF
                </label>
                <input
                  type="text"
                  value={doc.client_nif || ""}
                  onChange={(e) => handleFieldChange("client_nif", e.target.value)}
                  placeholder="NIF Client"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  RC / N° C.A.E
                </label>
                <input
                  type="text"
                  value={doc.client_rc || ""}
                  onChange={(e) => handleFieldChange("client_rc", e.target.value)}
                  placeholder="RC ou N° C.A.E"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  NIS
                </label>
                <input
                  type="text"
                  value={doc.client_nis || ""}
                  onChange={(e) => handleFieldChange("client_nis", e.target.value)}
                  placeholder="Numéro d'Identification Statistique"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  ARTICLE D&apos;IMPOSITION
                </label>
                <input
                  type="text"
                  value={doc.client_article_imposition || ""}
                  onChange={(e) => handleFieldChange("client_article_imposition", e.target.value)}
                  placeholder="Article d'imposition (AI)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Articles / Prestations (Table matching Image 3) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Articles / Prestations
            </h3>

            <div className="space-y-3">
              {doc.line_items.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                >
                  <div className="text-slate-400 hidden sm:block">
                    <GripVertical size={16} />
                  </div>

                  {/* Description */}
                  <div className="flex-1">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 sm:hidden">
                      DESCRIPTION
                    </label>
                    <textarea
                      rows={1}
                      value={item.description || ""}
                      onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                      placeholder="Description du produit ou service..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-y"
                    />
                  </div>

                  {/* Quantité */}
                  <div className="w-full sm:w-20">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 sm:hidden">
                      QTÉ
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(idx, "quantity", parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-center font-bold text-slate-900"
                    />
                  </div>

                  {/* Prix Unitaire HT */}
                  <div className="w-full sm:w-28">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 sm:hidden">
                      PRIX UNITAIRE HT
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(idx, "unit_price", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-right font-bold text-slate-900"
                    />
                  </div>

                  {/* Montant HT Display */}
                  <div className="w-full sm:w-28 text-right font-mono font-black text-xs text-slate-900 pr-2">
                    <span className="sm:hidden text-[9px] font-normal text-slate-400 block">TOTAL: </span>
                    {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(idx)}
                    disabled={doc.line_items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddLineItem}
              className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-xs font-bold text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Ajouter une ligne</span>
            </button>
          </div>

          {/* Card 6: Taxes et réductions */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Taxes et réductions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Taux TVA */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  TAUX TVA
                </label>
                <SearchableSelect
                  options={TVA_RATES}
                  value={String(doc.tva_rate || 19)}
                  onChange={(val) => handleFieldChange("tva_rate", Number(val))}
                  isClearable={false}
                  showSearch={false}
                />
              </div>

              {/* Remise */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  REMISE ({doc.discount_type === "percentage" ? "%" : "DA"})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={doc.discount_value || 0}
                    onChange={(e) => handleFieldChange("discount_value", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange("discount_type", doc.discount_type === "percentage" ? "fixed" : "percentage")}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {doc.discount_type === "percentage" ? "%" : "DA"}
                  </button>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={doc.has_fiscal_stamp}
                  onChange={(e) => handleFieldChange("has_fiscal_stamp", e.target.checked)}
                  className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Droit de timbre (1% plafonné à 2 500 DA pour paiements en espèces)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={doc.show_signature_stamp}
                  onChange={(e) => handleFieldChange("show_signature_stamp", e.target.checked)}
                  className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Afficher le cachet / signature</span>
              </label>
            </div>
          </div>

          {/* Card 7: Notes / Conditions de paiement */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Notes / Conditions de paiement
            </h3>
            <textarea
              rows={3}
              value={doc.notes || ""}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Bottom Save Action Button (Eventzone blue) */}
          <div>
            <button
              onClick={handleSaveDocument}
              disabled={isSaving}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Document enregistré !</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isSaving ? "Enregistrement en cours..." : "Enregistrer le document"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Live A4 Preview (6 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-6 sticky top-20 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              APERÇU DU DOCUMENT (FORMAT A4)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintDocument}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
                title="Imprimer"
              >
                <Printer size={13} />
                <span>Imprimer</span>
              </button>

              <button
                type="button"
                disabled={isDownloading}
                onClick={async () => {
                  if (isDownloading) return;
                  setIsDownloading(true);
                  try {
                    await onDownloadPdf(doc);
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
              >
                <Download size={13} />
                <span>{isDownloading ? "Téléchargement..." : "Télécharger PDF"}</span>
              </button>
            </div>
          </div>

          {/* Live Document Preview Workspace Canvas */}
          <div className="overflow-y-auto max-h-[calc(100vh-140px)] border border-slate-200/90 rounded-3xl shadow-inner bg-slate-200/60 p-2 sm:p-5 flex justify-center">
            <InvoicingDocumentPreview document={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}
