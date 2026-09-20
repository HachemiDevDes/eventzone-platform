/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  TrendingUp, Clock, AlertCircle, AlertTriangle, CheckCircle2,
  FileText, FileCheck, FileSpreadsheet, Layers, Search, 
  Plus, Settings, Paperclip, ArrowRight, Pencil, 
  Copy, Trash2, ChevronDown, Check, Download, ExternalLink,
  Filter, Eye, MoreVertical, RefreshCw, X, Receipt
} from "lucide-react";
import { formatCurrency, formatInvoicingDate, DOCUMENT_TYPES, DOCUMENT_STATUSES } from "../lib/invoicingConstants";
import SearchableSelect from "./SearchableSelect";
import { useLanguage } from "../lib/i18n";

/**
 * InvoicingDashboard
 * Redesigned to strictly match the Eventzone dashboard design standard (LogisticsView reference):
 * 1. Clean header with title, subtitle, and top-right actions (Export CSV, Settings, and New Document dropdown)
 * 2. 4 Executive KPI metric cards with top-right icons, bold metrics, and progress/rate badges
 * 3. Sub-module underline tabs navigation (Tous les documents, Factures, Devis, Factures Proforma)
 * 4. Dedicated standalone search & filter toolbar
 * 5. Clean, spacious table container and matching empty state
 */
export default function InvoicingDashboard({
  invoices = [],
  profiles = [],
  selectedProfileId = "all",
  onSelectProfile,
  onOpenSettings,
  onCreateNewDocument,
  onEditDocument,
  onDeleteDocument,
  onDuplicateDocument,
  onConvertDocument,
  onStatusChange,
  onCopyShareLink,
  onDownloadPdf,
  canEdit = true,
}) {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'facture' | 'devis' | 'proforma'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'encaisse' | 'envoye' | 'en_retard' | 'partiel' | 'brouillon'
  const [statusMenuState, setStatusMenuState] = useState(null); // { id, currentStatus, top, bottom, left, right, openUpwards }
  const [isNewDocMenuOpen, setIsNewDocMenuOpen] = useState(false);

  // Close portaled status dropdown on scroll, window resize, click outside, or Escape
  useEffect(() => {
    if (!statusMenuState) return;
    const handleClose = (e) => {
      if (e?.target && e.target.closest && e.target.closest('.portaled-status-menu')) {
        return;
      }
      setStatusMenuState(null);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setStatusMenuState(null);
    };

    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    document.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      document.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleKey);
    };
  }, [statusMenuState]);

  // Open portaled status dropdown with boundary detection
  const handleOpenStatusMenu = (e, inv) => {
    e.stopPropagation();
    if (statusMenuState?.id === inv.id) {
      setStatusMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 240;
    const menuWidth = 176;
    const margin = 12;

    let left = undefined;
    let right = undefined;

    const fitsRightAligned = (rect.right - menuWidth) >= margin;
    const fitsLeftAligned = (rect.left + menuWidth) <= (window.innerWidth - margin);

    if (isRTL) {
      if (fitsLeftAligned) {
        left = Math.max(margin, rect.left);
      } else {
        right = Math.max(margin, window.innerWidth - rect.right);
      }
    } else {
      if (fitsRightAligned) {
        right = Math.max(margin, window.innerWidth - rect.right);
      } else if (fitsLeftAligned) {
        left = Math.max(margin, rect.left);
      } else {
        left = margin;
      }
    }

    setStatusMenuState({
      id: inv.id,
      currentStatus: inv.status,
      top: openUpwards ? undefined : rect.bottom + 6,
      bottom: openUpwards ? (window.innerHeight - rect.top + 6) : undefined,
      left,
      right,
      openUpwards,
    });
  };

  // Profile options for selector
  const profileOptions = useMemo(() => {
    const opts = [{ value: "all", label: t("invoicing.allProfiles", "Tous les profils") }];
    profiles.forEach(p => {
      opts.push({ value: p.id, label: p.name || p.company_name || "Profil fiscal" });
    });
    return opts;
  }, [profiles, t]);

  // Status options for selector
  const statusOptions = useMemo(() => [
    { value: "all", label: t("invoicing.allStatuses", "Tous les statuts") },
    { value: "encaisse", label: t("invoicing.statusPaid", "Encaissés (Payés)") },
    { value: "envoye", label: t("invoicing.statusPending", "Envoyés (En attente)") },
    { value: "en_retard", label: t("invoicing.statusOverdue", "En retard") },
    { value: "partiel", label: t("invoicing.statusPartial", "Partiels") },
    { value: "brouillon", label: t("invoicing.statusDraft", "Brouillons") },
  ], [t]);

  // Compute KPI metrics & tab counts
  const stats = useMemo(() => {
    let totalEncaisse = 0;
    let totalEnAttente = 0;
    let totalEnRetard = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let factureCount = 0;
    let devisCount = 0;
    let proformaCount = 0;

    invoices.forEach(inv => {
      const ttc = Number(inv.total_ttc) || 0;
      const paid = Number(inv.amount_paid) || 0;

      if (inv.document_type === "facture") factureCount++;
      else if (inv.document_type === "devis") devisCount++;
      else if (inv.document_type === "proforma") proformaCount++;

      if (inv.status === "encaisse") {
        totalEncaisse += ttc;
        paidCount++;
      } else if (inv.status === "en_retard") {
        totalEnRetard += Math.max(0, ttc - paid);
        overdueCount++;
      } else if (["envoye", "partiel"].includes(inv.status)) {
        totalEnAttente += Math.max(0, ttc - paid);
        pendingCount++;
      }
    });

    const totalBilled = totalEncaisse + totalEnAttente + totalEnRetard;
    const collectionRate = totalBilled > 0 ? Math.round((totalEncaisse / totalBilled) * 100) : 0;

    return {
      totalEncaisse,
      totalEnAttente,
      totalEnRetard,
      paidCount,
      pendingCount,
      overdueCount,
      factureCount,
      devisCount,
      proformaCount,
      collectionRate,
      count: invoices.length,
    };
  }, [invoices]);

  // Filter documents based on tab, profile, search, and status selector
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Tab filter (Document Type)
      if (activeTab !== "all" && inv.document_type !== activeTab) {
        return false;
      }

      // 2. Profile filter
      if (selectedProfileId && selectedProfileId !== "all") {
        if (inv.profile_id && inv.profile_id !== selectedProfileId) return false;
      }

      // 3. Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "encaisse" && inv.status !== "encaisse") return false;
        if (statusFilter === "envoye" && !["envoye", "partiel"].includes(inv.status)) return false;
        if (statusFilter === "en_retard" && inv.status !== "en_retard") return false;
        if (statusFilter === "partiel" && inv.status !== "partiel") return false;
        if (statusFilter === "brouillon" && inv.status !== "brouillon") return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const client = (inv.client_name || "").toLowerCase();
        const contact = (inv.client_contact_name || "").toLowerCase();
        const num = (inv.document_number || "").toLowerCase();
        const prof = (inv.profile_name || "").toLowerCase();
        if (!client.includes(q) && !contact.includes(q) && !num.includes(q) && !prof.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, activeTab, selectedProfileId, statusFilter, searchQuery]);

  // Export CSV Manifest (matches LogisticsView export mechanism with BOM for Excel compatibility)
  const handleExportCSV = () => {
    const rows = [];
    const filename = `Eventzone_Facturation_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;

    rows.push([
      "Numéro de document",
      "Type",
      "Client",
      "Nom du contact",
      "Profil émetteur",
      "Date d'émission",
      "Date d'échéance",
      "Montant Total TTC",
      "Montant Encaissé",
      "Reste à payer",
      "Statut",
      "Devise"
    ]);

    filteredInvoices.forEach(inv => {
      const typeObj = DOCUMENT_TYPES.find(t => t.id === inv.document_type) || { label: inv.document_type || "Facture" };
      const statusObj = DOCUMENT_STATUSES.find(s => s.id === inv.status) || { label: inv.status || "Statut" };
      const ttc = Number(inv.total_ttc) || 0;
      const paid = Number(inv.amount_paid) || 0;
      const balance = Math.max(0, ttc - paid);

      rows.push([
        `"${inv.document_number || ''}"`,
        `"${typeObj.label}"`,
        `"${(inv.client_name || '').replace(/"/g, '""')}"`,
        `"${(inv.client_contact_name || '').replace(/"/g, '""')}"`,
        `"${(inv.profile_name || '').replace(/"/g, '""')}"`,
        `"${inv.issue_date || ''}"`,
        `"${inv.due_date || ''}"`,
        ttc,
        paid,
        balance,
        `"${statusObj.label}"`,
        `"${inv.currency || 'DZD'}"`
      ]);
    });

    const csvContent = "\uFEFF" + rows.map(e => e.join(";")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* ─────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
      ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("dash.invoicing", "Facturation & Devis")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("invoicing.subtitle", "Command center pour la facturation certifiée, devis commerciaux, factures proforma et suivi des encaissements.")}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {!canEdit && (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200/80 flex items-center gap-1.5 shadow-xs">
              <Eye size={13} className="text-slate-500" />
              <span>Viewer Mode</span>
            </span>
          )}

          {/* Export Manifest CSV */}
          {canEdit && (
            <button
              onClick={handleExportCSV}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-full text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title={t("invoicing.exportCsv", "Exporter en CSV")}
            >
              <Download size={14} />
              <span>{t("invoicing.exportCsv", "Exporter (CSV)")}</span>
            </button>
          )}

          {/* Profile Settings Modal Trigger */}
          {canEdit && (
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer bg-white shadow-xs"
              title={t("invoicing.fiscalSettings", "Paramètres fiscaux & profil")}
            >
              <Settings size={16} />
            </button>
          )}

          {/* Primary Create Button with dropdown */}
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setIsNewDocMenuOpen(!isNewDocMenuOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-full text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>
                  {activeTab === "facture" && t("invoicing.newFacture", "Nouvelle facture")}
                  {activeTab === "devis" && t("invoicing.newDevis", "Nouveau devis")}
                  {activeTab === "proforma" && t("invoicing.newProforma", "Nouvelle proforma")}
                  {activeTab === "all" && t("invoicing.newDoc", "Nouveau document")}
                </span>
                <ChevronDown size={13} className="opacity-80" />
              </button>

              {/* Click Dropdown Menu */}
              {isNewDocMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20"
                    onClick={() => setIsNewDocMenuOpen(false)}
                  />
                  <div className="absolute end-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-30 animate-scale-up">
                    <button
                      onClick={() => {
                        onCreateNewDocument("facture");
                        setIsNewDocMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={14} className="text-blue-600" />
                      <span>{t("invoicing.invoice", "Facture")}</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateNewDocument("devis");
                        setIsNewDocMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileCheck size={14} className="text-amber-600" />
                      <span>{t("invoicing.quote", "Devis")}</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateNewDocument("proforma");
                        setIsNewDocMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={14} className="text-purple-600" />
                      <span>{t("invoicing.proforma", "Facture Proforma")}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. EXECUTIVE KPI CARDS (Logistics Anatomy)
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Encaissé */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("invoicing.totalCollected", "Total Encaissé")}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              <bdi dir="ltr">{formatCurrency(stats.totalEncaisse, "DZD")}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 size={12} />
              <span><bdi dir="ltr">{stats.paidCount}</bdi> {t("invoicing.paidInvoicesCount", "factures réglées")}</span>
            </div>
          </div>
        </div>

        {/* Card 2: En Attente */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("invoicing.pending", "En Attente")}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              <bdi dir="ltr">{formatCurrency(stats.totalEnAttente, "DZD")}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-blue-600 font-bold"><bdi dir="ltr">{stats.pendingCount}</bdi></span>
              <span>{t("invoicing.pendingDocsSub", "en attente de règlement")}</span>
            </div>
          </div>
        </div>

        {/* Card 3: En Retard */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("invoicing.overdue", "En Retard")}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.overdueCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"}`}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono ${stats.totalEnRetard > 0 ? "text-rose-600" : "text-slate-900"}`}>
              <bdi dir="ltr">{formatCurrency(stats.totalEnRetard, "DZD")}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-rose-600">
              {stats.overdueCount > 0 ? (
                <>
                  <AlertTriangle size={12} />
                  <span><bdi dir="ltr">{stats.overdueCount}</bdi> {t("invoicing.overdueDocsAction", "factures à relancer")}</span>
                </>
              ) : (
                <span className="text-slate-400 font-medium">{t("invoicing.noOverdue", "Aucun impayé à signaler")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Taux d'encaissement / Collection Readiness */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("invoicing.collectionRate", "Taux d'encaissement")}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.collectionRate >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono"><bdi dir="ltr">{stats.collectionRate}%</bdi></span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                <bdi dir="ltr">{stats.count}</bdi> {t("invoicing.docsTotal", "documents")}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${stats.collectionRate >= 80 ? "bg-emerald-500" : "bg-blue-600"}`}
                style={{ width: `${stats.collectionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. SUB-MODULE TABS NAVIGATION (Underline Bar)
      ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto select-none">
        {/* Tab 1: All Documents */}
        <button
          onClick={() => { setActiveTab("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "all"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Layers size={15} />
          <span>{t("invoicing.tabAll", "Tous les documents")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{stats.count}</bdi>
          </span>
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        {/* Tab 2: Factures */}
        <button
          onClick={() => { setActiveTab("facture"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "facture"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileText size={15} />
          <span>{t("invoicing.tabInvoices", "Factures")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "facture" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{stats.factureCount}</bdi>
          </span>
          {activeTab === "facture" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        {/* Tab 3: Devis */}
        <button
          onClick={() => { setActiveTab("devis"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "devis"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileCheck size={15} />
          <span>{t("invoicing.tabQuotes", "Devis")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "devis" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{stats.devisCount}</bdi>
          </span>
          {activeTab === "devis" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        {/* Tab 4: Factures Proforma */}
        <button
          onClick={() => { setActiveTab("proforma"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "proforma"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>{t("invoicing.tabProforma", "Factures Proforma")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "proforma" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{stats.proformaCount}</bdi>
          </span>
          {activeTab === "proforma" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          4. SEARCH & FILTER TOOLBAR
      ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("invoicing.searchPlaceholder", "Rechercher par client, contact, numéro de document...")}
            className="w-full ps-9 pe-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="w-48">
            <SearchableSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "all")}
              options={statusOptions}
              placeholder={t("invoicing.allStatuses", "Tous les statuts")}
              buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          {/* Profile Filter */}
          <div className="w-48">
            <SearchableSelect
              value={selectedProfileId}
              onChange={(val) => onSelectProfile && onSelectProfile(val || "all")}
              options={profileOptions}
              placeholder={t("invoicing.allProfiles", "Tous les profils")}
              buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
              isClearable={false}
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          5. DOCUMENT TABLE / EMPTY STATE WORKSPACE
      ───────────────────────────────────────────── */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-150 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === "facture"
              ? t("invoicing.noFactureFound", "Aucune facture enregistrée")
              : activeTab === "devis"
              ? t("invoicing.noDevisFound", "Aucun devis enregistré")
              : activeTab === "proforma"
              ? t("invoicing.noProformaFound", "Aucune facture proforma enregistrée")
              : t("invoicing.noDocFound", "Aucun document trouvé")}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t("invoicing.emptyDesc", "Générez des devis certifiés, émettez vos factures conformes et suivez vos encaissements en temps réel.")}
          </p>
          {canEdit && (
            <button
              onClick={() => onCreateNewDocument(activeTab === "all" ? "facture" : activeTab)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>
                {activeTab === "devis"
                  ? t("invoicing.createFirstQuote", "Créer un devis")
                  : activeTab === "proforma"
                  ? t("invoicing.createFirstProforma", "Créer une proforma")
                  : t("invoicing.createFirstInvoice", "Créer une facture")}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden">
          {/* Master Table Header Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                {activeTab === "facture"
                  ? t("invoicing.tableTitleFacture", "Registre des factures émises")
                  : activeTab === "devis"
                  ? t("invoicing.tableTitleDevis", "Registre des devis & propositions")
                  : activeTab === "proforma"
                  ? t("invoicing.tableTitleProforma", "Registre des factures proforma")
                  : t("invoicing.tableTitleAll", "Registre officiel des documents")}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              <bdi dir="ltr">{filteredInvoices.length}</bdi> {filteredInvoices.length > 1 ? t("invoicing.docsPlural", "documents répertoriés") : t("invoicing.docsSingular", "document répertorié")}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[160px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-150 text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">TYPE</th>
                  <th scope="col" className="px-3 py-3 font-mono">NUMÉRO</th>
                  <th scope="col" className="px-4 py-3">CLIENT</th>
                  <th scope="col" className="px-3 py-3">PROFIL</th>
                  <th scope="col" className="px-3 py-3">DATE</th>
                  <th scope="col" className="px-3 py-3">ÉCHÉANCE</th>
                  <th scope="col" className="px-4 py-3">MONTANT TTC</th>
                  <th scope="col" className="px-3 py-3">ENCAISSÉ</th>
                  <th scope="col" className="px-4 py-3 text-center">STATUT</th>
                  <th scope="col" className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const typeObj = DOCUMENT_TYPES.find(t => t.id === inv.document_type) || DOCUMENT_TYPES[0];
                  const statusObj = DOCUMENT_STATUSES.find(s => s.id === inv.status) || DOCUMENT_STATUSES[0];
                  const isMenuOpen = statusMenuState?.id === inv.id;

                  return (
                    <tr 
                      key={inv.id} 
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* TYPE Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${typeObj.badgeClass}`}>
                          {typeObj.label}
                        </span>
                      </td>

                      {/* NUMÉRO */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                        {inv.document_number || "—"}
                      </td>

                      {/* CLIENT */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-[220px]">
                          <span className="font-bold text-slate-900 block truncate">
                            {inv.client_name || "—"}
                          </span>
                          {inv.client_contact_name && (
                            <span className="text-[10px] text-slate-400 font-medium block truncate">
                              {inv.client_contact_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PROFIL */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-600">
                        {inv.profile_name || "Eventzone"}
                      </td>

                      {/* DATE */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                        {formatInvoicingDate(inv.issue_date)}
                      </td>

                      {/* ÉCHÉANCE */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                        {formatInvoicingDate(inv.due_date)}
                      </td>

                      {/* MONTANT TTC */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono font-black text-slate-900">
                        {formatCurrency(inv.total_ttc, inv.currency)}
                      </td>

                      {/* ENCAISSÉ */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-600 font-semibold">
                        {Number(inv.amount_paid) > 0 ? (
                          <span className="text-emerald-600 font-bold">{formatCurrency(inv.amount_paid, inv.currency)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* STATUT (Dropdown button or Read-Only Badge) */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        {canEdit ? (
                          <div className="relative inline-block text-center">
                            <button
                              type="button"
                              onClick={(e) => handleOpenStatusMenu(e, inv)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                                isMenuOpen ? "ring-2 ring-blue-500/20 border-blue-400 bg-blue-50/30" : ""
                              }`}
                            >
                              <span>{statusObj.label}</span>
                              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180 text-blue-600" : ""}`} />
                            </button>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 text-slate-700 inline-block shadow-2xs">
                            {statusObj.label}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          {/* Copy Link */}
                          <button
                            onClick={() => onCopyShareLink && onCopyShareLink(inv)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("invoicing.copyLink", "Copier le lien public")}
                          >
                            <Paperclip size={14} />
                          </button>

                          {/* Convert (if quote/proforma -> invoice) */}
                          {canEdit && inv.document_type !== "facture" && (
                            <button
                              onClick={() => onConvertDocument && onConvertDocument(inv.id)}
                              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title={t("invoicing.convertToInvoice", "Convertir en Facture")}
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}

                          {/* Download PDF */}
                          {canEdit && (
                            <button
                              onClick={() => onDownloadPdf && onDownloadPdf(inv)}
                              className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t("invoicing.downloadPdf", "Télécharger PDF")}
                            >
                              <Download size={14} />
                            </button>
                          )}

                          {/* Edit / View */}
                          <button
                            onClick={() => onEditDocument && onEditDocument(inv)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={canEdit ? t("common.edit", "Modifier") : t("common.view", "Consulter")}
                          >
                            {canEdit ? <Pencil size={14} /> : <Eye size={14} />}
                          </button>

                          {/* Duplicate */}
                          {canEdit && (
                            <button
                              onClick={() => onDuplicateDocument && onDuplicateDocument(inv.id)}
                              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title={t("common.duplicate", "Dupliquer")}
                            >
                              <Copy size={14} />
                            </button>
                          )}

                          {/* Delete */}
                          {canEdit && (
                            <button
                              onClick={() => onDeleteDocument && onDeleteDocument(inv.id)}
                              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={t("common.delete", "Supprimer")}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portaled Status Dropdown Menu (Escapes table overflow-x-auto & card overflow-hidden boundaries) */}
      {statusMenuState && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setStatusMenuState(null)}
          />
          <div
            style={{
              position: "fixed",
              top: statusMenuState.top,
              bottom: statusMenuState.bottom,
              left: statusMenuState.left,
              right: statusMenuState.right,
              zIndex: 99999,
            }}
            dir={isRTL ? "rtl" : "ltr"}
            className="portaled-status-menu w-44 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 p-1.5 animate-scale-up select-none flex flex-col gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {DOCUMENT_STATUSES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  if (onStatusChange) onStatusChange(statusMenuState.id, st.id);
                  setStatusMenuState(null);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  statusMenuState.currentStatus === st.id
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{st.label}</span>
                {statusMenuState.currentStatus === st.id && <Check size={13} className="shrink-0" />}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
