/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, Save, Share2, Download, Plus, Trash2, 
  GripVertical, Check, Upload, Copy, FileText, 
  Calendar, CheckCircle2, AlertCircle, Printer, Eye,
  Building2, X
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
import { fetchOrganizations } from "../lib/db";

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
  sponsors = [],
  exhibitors = [],
  invoices = [],
  activeEventId = null,
  onBack,
  onSave,
  onCopyShareLink,
  onDownloadPdf,
  canEdit = true,
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
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [directOrganizations, setDirectOrganizations] = useState([]);

  // Fetch direct organizations from DB / localStorage to guarantee options are always present
  useEffect(() => {
    let isMounted = true;
    const targetId = activeEventId || (typeof window !== "undefined" ? localStorage.getItem("eventzone_last_active_event") : null);

    if (typeof window !== "undefined" && targetId) {
      try {
        const cached = localStorage.getItem(`eventzone_cache_organizations_${targetId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            setDirectOrganizations(parsed);
          }
        }
      } catch (e) {}
    }

    if (targetId) {
      fetchOrganizations(targetId).then((orgs) => {
        if (isMounted && Array.isArray(orgs) && orgs.length > 0) {
          setDirectOrganizations(orgs);
        }
      }).catch(() => {});
    }

    return () => { isMounted = false; };
  }, [activeEventId]);

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

  // Merge prop organizations and directly fetched organizations
  const allOrganizations = useMemo(() => {
    const map = new Map();
    (directOrganizations || []).forEach(o => {
      if (o && (o.id || o.name)) map.set(String(o.id || o.name), o);
    });
    (organizations || []).forEach(o => {
      if (o && (o.id || o.name)) map.set(String(o.id || o.name), o);
    });
    return Array.from(map.values());
  }, [directOrganizations, organizations]);

  // Extract past invoiced clients so repeat customers appear automatically
  const pastInvoicedClients = useMemo(() => {
    const seen = new Set();
    const list = [];
    (invoices || []).forEach(inv => {
      const name = (inv.client_name || "").trim();
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      list.push({
        id: `past_${inv.id}`,
        company_name: name,
        contact_name: inv.client_contact_name || "",
        address: inv.client_address || "",
        email: inv.client_email || "",
        phone: inv.client_phone || "",
        nif: inv.client_nif || "",
        rc: inv.client_rc || "",
        nis: inv.client_nis || "",
        article_imposition: inv.client_article_imposition || "",
      });
    });
    return list;
  }, [invoices]);

  // Quick Client / Organization / Prospect Selector Handler
  const handleSelectClient = (selectedVal) => {
    if (!selectedVal) {
      setSelectedClientKey("");
      return;
    }
    setSelectedClientKey(selectedVal);

    // 1. Organization selection
    if (selectedVal.startsWith("org_")) {
      const orgId = selectedVal.replace("org_", "");
      const org = allOrganizations.find(o => String(o.id) === String(orgId));
      if (org) {
        const fiscal = org.fiscalDetails || org.fiscal_details || {};
        const nif = org.nif || fiscal.nif || "";
        const rc = org.rc || fiscal.rc || "";
        const nis = org.nis || fiscal.nis || "";
        const ai = org.articleImposition || org.article_imposition || fiscal.article_imposition || "";

        setDoc(prev => ({
          ...prev,
          client_name: org.legalName || org.legal_name || org.name || "",
          client_contact_name: org.contactPerson || org.contact || org.contactName || org.liaison_name || org.contact_person || "",
          client_address: org.legalAddress || org.legal_address || org.address || "",
          client_email: org.invoicingEmail || org.invoicing_email || org.email || org.contactEmail || "",
          client_phone: org.invoicingPhone || org.invoicing_phone || org.phone || org.contactPhone || "",
          client_nif: nif,
          client_rc: rc,
          client_nis: nis,
          client_article_imposition: ai,
        }));
        setAutofilledSource({
          type: "org",
          name: org.name || org.legalName || "Organisation",
          hasFiscal: Boolean(nif || rc || nis || ai),
        });
        return;
      }
    }

    // 2. Sponsor selection
    if (selectedVal.startsWith("sponsor_")) {
      const spId = selectedVal.replace("sponsor_", "");
      const sp = (sponsors || []).find(s => String(s.id) === String(spId));
      if (sp) {
        const org = allOrganizations.find(o => String(o.id) === String(sp.org_id || sp.orgId));
        const fiscal = sp.fiscalDetails || sp.fiscal_details || org?.fiscalDetails || org?.fiscal_details || {};
        const nif = sp.nif || fiscal.nif || org?.nif || "";
        const rc = sp.rc || fiscal.rc || org?.rc || "";
        const nis = sp.nis || fiscal.nis || org?.nis || "";
        const ai = sp.articleImposition || sp.article_imposition || fiscal.article_imposition || org?.articleImposition || org?.article_imposition || "";

        setDoc(prev => ({
          ...prev,
          client_name: sp.name || sp.company_name || sp.legalName || org?.legalName || org?.name || "",
          client_contact_name: sp.contact || sp.contactPerson || sp.contactName || org?.contactPerson || org?.contact || "",
          client_address: sp.address || sp.legalAddress || org?.legalAddress || org?.address || "",
          client_email: sp.invoicingEmail || sp.email || sp.contactEmail || org?.invoicingEmail || org?.email || "",
          client_phone: sp.invoicingPhone || sp.phone || sp.contactPhone || org?.invoicingPhone || org?.phone || "",
          client_nif: nif,
          client_rc: rc,
          client_nis: nis,
          client_article_imposition: ai,
        }));
        setAutofilledSource({
          type: "sponsor",
          name: sp.name || "Sponsor",
          hasFiscal: Boolean(nif || rc || nis || ai),
        });
        return;
      }
    }

    // 3. Exhibitor selection
    if (selectedVal.startsWith("exhibitor_")) {
      const exId = selectedVal.replace("exhibitor_", "");
      const ex = (exhibitors || []).find(e => String(e.id) === String(exId));
      if (ex) {
        const org = allOrganizations.find(o => String(o.id) === String(ex.org_id || ex.orgId));
        const fiscal = ex.fiscalDetails || ex.fiscal_details || org?.fiscalDetails || org?.fiscal_details || {};
        const nif = ex.nif || fiscal.nif || org?.nif || "";
        const rc = ex.rc || fiscal.rc || org?.rc || "";
        const nis = ex.nis || fiscal.nis || org?.nis || "";
        const ai = ex.articleImposition || ex.article_imposition || fiscal.article_imposition || org?.articleImposition || org?.article_imposition || "";

        setDoc(prev => ({
          ...prev,
          client_name: ex.name || ex.company_name || ex.legalName || org?.legalName || org?.name || "",
          client_contact_name: ex.contact || ex.contactPerson || ex.contactName || org?.contactPerson || org?.contact || "",
          client_address: ex.address || ex.legalAddress || org?.legalAddress || org?.address || "",
          client_email: ex.invoicingEmail || ex.email || ex.contactEmail || org?.invoicingEmail || org?.email || "",
          client_phone: ex.invoicingPhone || ex.phone || ex.contactPhone || org?.invoicingPhone || org?.phone || "",
          client_nif: nif,
          client_rc: rc,
          client_nis: nis,
          client_article_imposition: ai,
        }));
        setAutofilledSource({
          type: "exhibitor",
          name: ex.name || "Exposant",
          hasFiscal: Boolean(nif || rc || nis || ai),
        });
        return;
      }
    }

    // 4. Prospect / Opportunity selection
    if (selectedVal.startsWith("opp_")) {
      const oppId = selectedVal.replace("opp_", "");
      const opp = (opportunities || []).find(o => String(o.id) === String(oppId));
      if (opp) {
        const fiscal = opp.fiscalDetails || opp.fiscal_details || {};
        const nif = opp.nif || fiscal.nif || "";
        const rc = opp.rc || fiscal.rc || "";
        const nis = opp.nis || fiscal.nis || "";
        const ai = opp.articleImposition || opp.article_imposition || fiscal.article_imposition || "";

        setDoc(prev => ({
          ...prev,
          client_name: opp.legalName || opp.legal_name || opp.companyName || opp.name || "",
          client_contact_name: opp.contactName || opp.contactPerson || "",
          client_address: opp.legalAddress || opp.legal_address || "",
          client_email: opp.invoicingEmail || opp.invoicing_email || opp.contactEmail || opp.email || "",
          client_phone: opp.invoicingPhone || opp.invoicing_phone || opp.contactPhone || opp.phone || "",
          client_nif: nif,
          client_rc: rc,
          client_nis: nis,
          client_article_imposition: ai,
        }));
        setAutofilledSource({
          type: "opp",
          name: opp.companyName || opp.name || "Prospect",
          hasFiscal: Boolean(nif || rc || nis || ai),
        });
        return;
      }
    }

    // 5. Saved Client or Past Invoiced Client selection
    const cleanClientId = selectedVal.startsWith("client_") ? selectedVal.replace("client_", "") : selectedVal;
    const foundSaved = (savedClients || []).find(c => String(c.id) === String(cleanClientId));
    const foundPast = pastInvoicedClients.find(c => String(c.id) === String(selectedVal));
    const found = foundSaved || foundPast;

    if (found) {
      setDoc(prev => ({
        ...prev,
        client_name: found.company_name || found.name || "",
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
        name: found.company_name || found.name || "Client",
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
    const options = [];

    // 1. Organizations
    allOrganizations.forEach(o => {
      const name = o.name || o.legalName || o.legal_name || "";
      if (!name) return;
      const fiscal = o.fiscalDetails || o.fiscal_details || {};
      const hasFiscal = Boolean(o.nif || o.rc || o.nis || o.articleImposition || o.article_imposition || fiscal.nif || fiscal.rc);
      options.push({
        value: `org_${o.id}`,
        label: name,
        description: `🏢 Organisation${o.legalName && o.legalName !== name ? ` (${o.legalName})` : ""}${hasFiscal ? " • Fiscalité ✓" : ""}`,
      });
    });

    // 2. Sponsors
    (sponsors || []).forEach(sp => {
      const name = sp.name || sp.company_name || "";
      if (!name) return;
      options.push({
        value: `sponsor_${sp.id}`,
        label: name,
        description: `⭐ Sponsor (${sp.tier || "Partenaire"})`,
      });
    });

    // 3. Exhibitors
    (exhibitors || []).forEach(ex => {
      const name = ex.name || ex.company_name || "";
      if (!name) return;
      options.push({
        value: `exhibitor_${ex.id}`,
        label: name,
        description: `🎪 Exposant${ex.boothNumber ? ` • Stand ${ex.boothNumber}` : ""}`,
      });
    });

    // 4. CRM Prospects / Opportunities
    (opportunities || []).forEach(opp => {
      const name = opp.companyName || opp.name || "";
      if (!name) return;
      const fiscal = opp.fiscalDetails || opp.fiscal_details || {};
      const hasFiscal = Boolean(opp.nif || opp.rc || opp.nis || fiscal.nif || fiscal.rc);
      options.push({
        value: `opp_${opp.id}`,
        label: name,
        description: `🎯 Prospect${opp.contactName ? ` • ${opp.contactName}` : ""}${hasFiscal ? " • Fiscalité ✓" : ""}`,
      });
    });

    // 5. Saved Address Book Clients
    (savedClients || []).forEach(c => {
      const name = c.company_name || c.name || "";
      if (!name) return;
      const hasFiscal = Boolean(c.nif || c.rc || c.nis || c.article_imposition);
      options.push({
        value: `client_${c.id}`,
        label: name,
        description: `👤 Client enregistré${hasFiscal ? " • Fiscalité ✓" : ""}`,
      });
    });

    // 6. Past Invoiced Clients
    pastInvoicedClients.forEach(c => {
      if (options.some(opt => opt.label.toLowerCase() === c.company_name.toLowerCase())) return;
      const hasFiscal = Boolean(c.nif || c.rc || c.nis);
      options.push({
        value: c.id,
        label: c.company_name,
        description: `📋 Client précédent${hasFiscal ? " • Fiscalité ✓" : ""}`,
      });
    });

    return options;
  }, [allOrganizations, sponsors, exhibitors, opportunities, savedClients, pastInvoicedClients]);

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
          {!canEdit && (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200/80 flex items-center gap-1.5 shadow-xs">
              <Eye size={13} className="text-slate-500" />
              <span>Viewer Mode</span>
            </span>
          )}

          <button
            onClick={() => onCopyShareLink(doc)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Copier le lien public"
          >
            <Share2 size={13} />
            <span>Copier le lien</span>
          </button>

          {canEdit && (
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
          )}
        </div>
      </div>

      {/* 2. Split Screen: Left (Editor) vs Right (Live A4 Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Form Configuration (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-6">
          {!canEdit && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-xs font-medium">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Vous êtes en mode consultation. La modification, l'ajout et l'enregistrement sont désactivés pour votre rôle.</span>
            </div>
          )}

          <fieldset disabled={!canEdit} className="flex flex-col gap-6 border-0 p-0 m-0 min-w-0">
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
              {canEdit && (
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
              )}
            </div>
          </div>

          {/* Card 2: Délai de paiement */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Délai de paiement
            </h3>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
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
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Client Destinataire
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Sélectionnez une organisation, partenaire ou prospect pour importer ses coordonnées et informations fiscales, ou saisissez-les manuellement.
              </p>
            </div>

            {/* Quick Organisation / Client Selector */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-600" />
                  <span>CHOISIR UNE ORGANISATION / PARTENAIRE (IMPORT FISCAL AUTOMATIQUE)</span>
                </label>
                {selectedClientKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientKey("");
                      setAutofilledSource(null);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X size={11} />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>
              <SearchableSelect
                options={clientOptions}
                value={selectedClientKey}
                onChange={handleSelectClient}
                placeholder={
                  clientOptions.length > 0 
                    ? "Rechercher et choisir une organisation, sponsor, exposant ou prospect..." 
                    : "Aucune organisation enregistrée — saisissez directement les coordonnées ci-dessous"
                }
                searchPlaceholder="Taper le nom d'une organisation..."
                className="w-full"
              />
            </div>

            {autofilledSource && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Coordonnées et informations fiscales importées depuis <strong>{autofilledSource.name}</strong>
                    {autofilledSource.hasFiscal ? " (NIF, RC, NIS, AI inclus ✓)" : " (fiche sans NIF/RC)"}
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
          {canEdit && (
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
          )}
          </fieldset>
        </div>

        {/* RIGHT COLUMN: Sticky Live A4 Preview (6 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-4 self-start space-y-3 z-20">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              APERÇU DU DOCUMENT (FORMAT A4)
            </span>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSaveDocument}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Enregistrer"
                >
                  {saveSuccess ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Save size={13} />}
                  <span>{saveSuccess ? "Enregistré" : isSaving ? "..." : "Enregistrer"}</span>
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
                  title="Imprimer"
                >
                  <Printer size={13} />
                  <span>Imprimer</span>
                </button>
              )}

              {canEdit && (
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
              )}
            </div>
          </div>

          {/* Live Document Preview Workspace Canvas */}
          <div className="overflow-y-auto max-h-[calc(100vh-80px)] border border-slate-200/90 rounded-3xl shadow-inner bg-slate-200/60 p-2 sm:p-5 flex justify-center">
            <InvoicingDocumentPreview document={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}
