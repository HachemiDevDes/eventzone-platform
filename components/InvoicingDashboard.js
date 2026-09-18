/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, Clock, AlertCircle, FileText, Search, 
  Plus, Settings, Paperclip, ArrowRight, Pencil, 
  Copy, Trash2, ChevronDown, Check, Download, ExternalLink,
  Filter, Eye, MoreVertical, RefreshCw
} from "lucide-react";
import { formatCurrency, DOCUMENT_TYPES, DOCUMENT_STATUSES } from "../lib/invoicingConstants";
import SearchableSelect from "./SearchableSelect";

/**
 * InvoicingDashboard
 * Replicates the reference screenshot in Image 1:
 * - 4 Top KPI metric cards
 * - Document search and filter pills
 * - Interactive document history table with inline status changes
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
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'encaisse', 'en_attente', 'en_retard', 'partiel', 'brouillon'
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);

  // Filter documents based on profile, search, and status pill
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Profile filter
      if (selectedProfileId && selectedProfileId !== "all") {
        if (inv.profile_id && inv.profile_id !== selectedProfileId) return false;
      }

      // 2. Status filter
      if (activeFilter !== "all") {
        if (activeFilter === "encaisse" && inv.status !== "encaisse") return false;
        if (activeFilter === "en_attente" && !["envoye", "partiel"].includes(inv.status)) return false;
        if (activeFilter === "en_retard" && inv.status !== "en_retard") return false;
        if (activeFilter === "partiel" && inv.status !== "partiel") return false;
        if (activeFilter === "brouillon" && inv.status !== "brouillon") return false;
      }

      // 3. Search query
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
  }, [invoices, selectedProfileId, activeFilter, searchQuery]);

  // Compute KPI metrics
  const metrics = useMemo(() => {
    let totalEncaisse = 0;
    let totalEnAttente = 0;
    let totalEnRetard = 0;
    const count = invoices.length;

    invoices.forEach(inv => {
      const ttc = Number(inv.total_ttc) || 0;
      const paid = Number(inv.amount_paid) || 0;

      if (inv.status === "encaisse") {
        totalEncaisse += ttc;
      } else if (inv.status === "en_retard") {
        totalEnRetard += (ttc - paid);
      } else if (["envoye", "partiel"].includes(inv.status)) {
        totalEnAttente += (ttc - paid);
      }
    });

    return {
      totalEncaisse,
      totalEnAttente,
      totalEnRetard,
      count,
    };
  }, [invoices]);

  // Profile options for selector
  const profileOptions = useMemo(() => {
    const opts = [{ value: "all", label: "Tous les profils" }];
    profiles.forEach(p => {
      opts.push({ value: p.id, label: p.name || p.company_name || "Profil" });
    });
    return opts;
  }, [profiles]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Vue d&apos;ensemble de votre activité facturation
        </p>
      </div>

      {/* 2. Top 4 KPI Metric Cards (Image 1 reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ENCAISSÉ */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                TOTAL ENCAISSÉ
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
                {formatCurrency(metrics.totalEncaisse, "DZD")}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
                Factures payées
              </span>
            </div>
          </div>
        </div>

        {/* EN ATTENTE */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                EN ATTENTE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
                {formatCurrency(metrics.totalEnAttente, "DZD")}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
                Factures envoyées / partielles
              </span>
            </div>
          </div>
        </div>

        {/* EN RETARD */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                EN RETARD
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5 font-mono">
                {formatCurrency(metrics.totalEnRetard, "DZD")}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
                À relancer
              </span>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                DOCUMENTS
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
                {metrics.count}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
                Au total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section: Historique des documents */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Header of Section: Title + Profile Selector + Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Historique des documents
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Profile Dropdown Selector */}
            <div className="w-48">
              <SearchableSelect
                options={profileOptions}
                value={selectedProfileId}
                onChange={onSelectProfile}
                placeholder="Filtrer par profil"
                isClearable={false}
              />
            </div>

            {/* Profile Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
              title="Paramètres de facturation"
            >
              <Settings size={16} />
            </button>

            {/* + Nouveau Document Button (Eventzone blue) */}
            <div className="relative group">
              <button
                onClick={() => onCreateNewDocument("facture")}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus size={15} className="stroke-[3]" />
                <span>Nouveau document</span>
                <ChevronDown size={13} className="text-blue-200" />
              </button>

              {/* Hover Dropdown to quickly create Devis or Proforma */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 hidden group-hover:block z-20">
                <button
                  onClick={() => onCreateNewDocument("facture")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Nouvelle Facture</span>
                </button>
                <button
                  onClick={() => onCreateNewDocument("devis")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Nouveau Devis</span>
                </button>
                <button
                  onClick={() => onCreateNewDocument("proforma")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Facture Proforma</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Filter Pills (Matching Image 1) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, Nº..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all", label: "Tous" },
              { id: "encaisse", label: "Encaissés" },
              { id: "en_attente", label: "En attente" },
              { id: "en_retard", label: "En retard" },
              { id: "partiel", label: "Partiels" },
              { id: "brouillon", label: "Brouillons" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Table: Type, Profil, Numéro, Client, Date, Échéance, Montant TTC, Encaissé, Statut, Actions */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">TYPE</th>
                <th scope="col" className="px-3 py-3">PROFIL</th>
                <th scope="col" className="px-3 py-3 font-mono">NUMÉRO</th>
                <th scope="col" className="px-4 py-3">CLIENT</th>
                <th scope="col" className="px-3 py-3">DATE</th>
                <th scope="col" className="px-3 py-3">ÉCHÉANCE</th>
                <th scope="col" className="px-4 py-3">MONTANT TTC</th>
                <th scope="col" className="px-3 py-3">ENCAISSÉ</th>
                <th scope="col" className="px-4 py-3 text-center">STATUT</th>
                <th scope="col" className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const typeObj = DOCUMENT_TYPES.find(t => t.id === inv.document_type) || DOCUMENT_TYPES[0];
                  const statusObj = DOCUMENT_STATUSES.find(s => s.id === inv.status) || DOCUMENT_STATUSES[0];
                  const isMenuOpen = openStatusMenuId === inv.id;

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

                      {/* PROFIL */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-600">
                        {inv.profile_name || "Eventzone"}
                      </td>

                      {/* NUMÉRO */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                        {inv.document_number || "—"}
                      </td>

                      {/* CLIENT */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-[220px]">
                          <span className="font-extrabold text-slate-900 block truncate">
                            {inv.client_name || "—"}
                          </span>
                          {inv.client_contact_name && (
                            <span className="text-[10px] text-slate-400 font-medium block truncate">
                              {inv.client_contact_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                        {inv.issue_date || "—"}
                      </td>

                      {/* ÉCHÉANCE */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                        {inv.due_date || "—"}
                      </td>

                      {/* MONTANT TTC */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono font-black text-slate-900">
                        {formatCurrency(inv.total_ttc, inv.currency)}
                      </td>

                      {/* ENCAISSÉ */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-500">
                        {Number(inv.amount_paid) > 0 ? formatCurrency(inv.amount_paid, inv.currency) : "—"}
                      </td>

                      {/* STATUT (Dropdown button as seen in reference screenshot) */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenStatusMenuId(isMenuOpen ? null : inv.id)}
                            className="px-3 py-1 rounded-xl text-[11px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>{statusObj.label}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </button>

                          {/* Status Dropdown Popover */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-30 animate-scale-up">
                              {DOCUMENT_STATUSES.map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => {
                                    if (onStatusChange) onStatusChange(inv.id, st.id);
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                    inv.status === st.id
                                      ? "bg-blue-600 text-white font-bold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{st.label}</span>
                                  {inv.status === st.id && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          {/* Copy Link */}
                          <button
                            onClick={() => onCopyShareLink(inv)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Copier le lien public"
                          >
                            <Paperclip size={14} />
                          </button>

                          {/* Convert (if quote/proforma -> invoice) */}
                          {inv.document_type !== "facture" && (
                            <button
                              onClick={() => onConvertDocument(inv.id)}
                              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Convertir en Facture"
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}

                          {/* Download PDF */}
                          <button
                            onClick={() => onDownloadPdf(inv)}
                            className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Télécharger PDF"
                          >
                            <Download size={14} />
                          </button>

                          {/* Edit (Pencil) */}
                          <button
                            onClick={() => onEditDocument(inv)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifier le document"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicateDocument(inv.id)}
                            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Dupliquer"
                          >
                            <Copy size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteDocument(inv.id)}
                            className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-700">Aucun document trouvé</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Créez un devis, une facture ou une facture proforma pour commencer.
                    </p>
                    <button
                      onClick={() => onCreateNewDocument("facture")}
                      className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus size={14} />
                      <span>Créer une facture</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
