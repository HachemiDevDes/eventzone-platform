/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Plus, Trash2, Printer, Check, Copy,
  ArrowUp, ArrowDown, ZoomIn, ZoomOut, FileText,
  Search, Sparkles, Download, Mail, Award, Clock,
  ShieldCheck, CheckCircle2, X, FileEdit, Calendar,
  Upload, Image as ImageIcon, Type
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import A4VisualDocumentSheet, { printVisualDocument } from "./A4VisualDocumentSheet";
import {
  ELEMENT_TYPES,
  FONT_OPTIONS,
  COLOR_OPTIONS,
  STARTER_PRESETS,
  createEmptyDocument,
  createDocumentElement,
} from "../lib/documentDesignerPresets";

export default function DocumentDesigner({
  initialDocument = null,
  activeEventId = null,
  eventDetails = {},
  currentUser = {},
  documents = [],
  onBack,
  onSaveDocument,
  onSaveToDocuments,
  onDeleteDocument,
  effectivePermissions,
}) {
  // View mode: 'list' (consult documents) or 'editor' (edit single A4 document)
  const [viewMode, setViewMode] = useState(() => (initialDocument ? "editor" : "list"));

  // Active document being edited
  const [activeDoc, setActiveDoc] = useState(() => {
    if (initialDocument) return initialDocument;
    return createEmptyDocument(eventDetails, currentUser, "blank");
  });

  // Selected element ID in the editor
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Sub-tabs navigation in list mode: 'all' | 'letters' | 'agreements' | 'agendas' | 'blank'
  const [activeSubTab, setActiveSubTab] = useState("all");

  // Search filter and orientation filter in list mode
  const [listSearch, setListSearch] = useState("");
  const [orientationFilter, setOrientationFilter] = useState("all");

  // Editor zoom level
  const [zoom, setZoom] = useState(0.85);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Starter template modal
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // Local storage cache for designed documents
  const [localDocs, setLocalDocs] = useState([]);

  // Load local storage documents on mount
  useEffect(() => {
    if (typeof window === "undefined" || !activeEventId) return;
    try {
      const stored = localStorage.getItem(`eventzone_designed_docs_${activeEventId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setLocalDocs(parsed);
      }
    } catch (e) {
      console.error("Failed to load local designed docs:", e);
    }
  }, [activeEventId]);

  // Combined documents list: from props (supabase) + local storage
  const combinedDocuments = useMemo(() => {
    const map = new Map();

    // From Supabase props
    (documents || []).forEach((d) => {
      if (d.isDesignedDocument && d.designedDocumentData) {
        map.set(d.id, {
          ...d.designedDocumentData,
          id: d.id,
          name: d.name || d.designedDocumentData.name,
          updatedAt: d.updatedAt || d.createdAt,
        });
      }
    });

    // From local storage
    (localDocs || []).forEach((d) => {
      if (d && d.id) {
        map.set(d.id, d);
      }
    });

    const list = Array.from(map.values());
    // Sort newest first
    return list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [documents, localDocs]);

  // Categorization helper
  const getDocCategory = (doc) => {
    const name = (doc.name || "").toLowerCase();
    if (name.includes("lettre") || name.includes("invitation") || name.includes("courrier") || name.includes("letter")) return "letters";
    if (name.includes("convention") || name.includes("partenariat") || name.includes("contrat") || name.includes("accord") || name.includes("agreement")) return "agreements";
    if (name.includes("programme") || name.includes("horaire") || name.includes("agenda") || name.includes("planning")) return "agendas";
    return "blank";
  };

  // KPI Statistics
  const stats = useMemo(() => {
    let letters = 0;
    let agreements = 0;
    let agendas = 0;
    let blank = 0;

    combinedDocuments.forEach((d) => {
      const cat = getDocCategory(d);
      if (cat === "letters") letters++;
      else if (cat === "agreements") agreements++;
      else if (cat === "agendas") agendas++;
      else blank++;
    });

    return {
      total: combinedDocuments.length,
      letters,
      agreements,
      agendas,
      blank,
    };
  }, [combinedDocuments]);

  // Filtered documents by tab, search, and orientation
  const filteredDocs = useMemo(() => {
    return combinedDocuments.filter((d) => {
      // Sub-tab filter
      if (activeSubTab !== "all") {
        const cat = getDocCategory(d);
        if (cat !== activeSubTab) return false;
      }

      // Orientation filter
      if (orientationFilter !== "all") {
        const docOrient = d.orientation || "portrait";
        if (docOrient !== orientationFilter) return false;
      }

      // Search query
      if (listSearch) {
        const q = listSearch.toLowerCase();
        const matchName = (d.name || "").toLowerCase().includes(q);
        const matchContent = (d.elements || []).some((el) => {
          return (
            (el.text || "").toLowerCase().includes(q) ||
            (el.title || "").toLowerCase().includes(q) ||
            (el.orgName || "").toLowerCase().includes(q) ||
            (el.sign1Name || "").toLowerCase().includes(q)
          );
        });
        if (!matchName && !matchContent) return false;
      }

      return true;
    });
  }, [combinedDocuments, activeSubTab, orientationFilter, listSearch]);

  // Persist locally helper
  const saveToLocalStorage = (docToSave) => {
    if (typeof window === "undefined" || !activeEventId) return;
    try {
      setLocalDocs((prev) => {
        const exists = prev.some((d) => d.id === docToSave.id);
        const next = exists
          ? prev.map((d) => (d.id === docToSave.id ? docToSave : d))
          : [docToSave, ...prev];
        localStorage.setItem(`eventzone_designed_docs_${activeEventId}`, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.error("Local storage error:", e);
    }
  };

  // Open editor for a specific document
  const handleEditDocument = (docItem) => {
    setActiveDoc(docItem);
    setSelectedElementId(docItem.elements?.[0]?.id || null);
    setViewMode("editor");
  };

  // Create new document from preset
  const handleCreateNewDocument = (presetId = "blank") => {
    const newDoc = createEmptyDocument(eventDetails, currentUser, presetId);
    setActiveDoc(newDoc);
    setSelectedElementId(newDoc.elements?.[0]?.id || null);
    saveToLocalStorage(newDoc);
    setShowNewDocModal(false);
    setViewMode("editor");
  };

  // Duplicate a document
  const handleDuplicateDocument = (docItem) => {
    const duplicate = {
      ...docItem,
      id: `doc-${Date.now()}`,
      name: `${docItem.name} (Copie)`,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(duplicate);
  };

  // Delete a document
  const handleDelete = async (docId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    if (typeof window !== "undefined" && activeEventId) {
      setLocalDocs((prev) => {
        const next = prev.filter((d) => d.id !== docId);
        localStorage.setItem(`eventzone_designed_docs_${activeEventId}`, JSON.stringify(next));
        return next;
      });
    }

    if (onDeleteDocument) {
      try {
        await onDeleteDocument(docId);
      } catch (e) {
        console.error("Error deleting document:", e);
      }
    }
  };

  // Save active document
  const handleSaveActiveDocument = async () => {
    setIsSaving(true);
    const updated = {
      ...activeDoc,
      updatedAt: new Date().toISOString(),
    };
    setActiveDoc(updated);
    saveToLocalStorage(updated);

    try {
      if (onSaveDocument) {
        await onSaveDocument(updated);
      }

      if (onSaveToDocuments) {
        const publishedDoc = {
          id: updated.id,
          name: updated.name,
          fileName: `${updated.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
          fileType: "pdf",
          category: "Official",
          accessLevel: "team",
          description: `Document A4 créé avec Eventzone Document Studio.`,
          isDesignedDocument: true,
          designedDocumentData: updated,
          updatedAt: updated.updatedAt,
        };
        await onSaveToDocuments(publishedDoc);
      }

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (err) {
      console.error("Failed to save document:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Documents Manifest CSV
  const handleExportCSV = () => {
    let rows = [["Titre du Document", "Orientation", "Nombre d'elements", "Derniere Modification", "Type"]];
    combinedDocuments.forEach((d) => {
      rows.push([
        `"${(d.name || "").replace(/"/g, '""')}"`,
        d.orientation === "landscape" ? "A4 Paysage" : "A4 Portrait",
        d.elements?.length || 0,
        d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("fr-FR") : "",
        getDocCategory(d)
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Eventzone_Documents_${activeEventId || "Export"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add an element to active document
  const handleAddElement = (type) => {
    const newElement = createDocumentElement(type, eventDetails, currentUser);
    setActiveDoc((prev) => ({
      ...prev,
      elements: [...(prev.elements || []), newElement],
      updatedAt: new Date().toISOString(),
    }));
    setSelectedElementId(newElement.id);
  };

  // Update specific element
  const handleUpdateElement = (elementId, updater) => {
    setActiveDoc((prev) => ({
      ...prev,
      elements: (prev.elements || []).map((el) => {
        if (el.id === elementId) {
          return typeof updater === "function" ? updater(el) : { ...el, ...updater };
        }
        return el;
      }),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Remove element
  const handleRemoveElement = (elementId) => {
    setActiveDoc((prev) => ({
      ...prev,
      elements: (prev.elements || []).filter((el) => el.id !== elementId),
      updatedAt: new Date().toISOString(),
    }));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Move element up/down
  const handleMoveElement = (index, direction) => {
    setActiveDoc((prev) => {
      const items = [...(prev.elements || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, elements: items };
    });
  };

  // Navigation Sub-tabs definition (matching Logistics pattern)
  const SUB_TABS = [
    { id: "all", label: "Tous les documents", icon: FileText, count: stats.total },
    { id: "letters", label: "Lettres & Invitations", icon: Mail, count: stats.letters },
    { id: "agreements", label: "Conventions & Accords", icon: Award, count: stats.agreements },
    { id: "agendas", label: "Programmes & Horaires", icon: Clock, count: stats.agendas },
    { id: "blank", label: "Feuilles Vierges & Autres", icon: FileEdit, count: stats.blank },
  ];

  // =========================================================================
  // VIEW MODE: LIST (Document Hub with Logistics styling)
  // =========================================================================
  if (viewMode === "list") {
    return (
      <div className="space-y-6 animate-fade-in text-slate-800 pb-16">
        {/* ─────────────────────────────────────────────
            1. HEADER & GLOBAL ACTIONS
        ───────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Document Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Centre de conception de documents administratifs officiels, lettres, conventions et programmes au format A4.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleExportCSV}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Exporter la liste des documents (CSV)"
            >
              <Download size={14} />
              <span>Exporter la liste (CSV)</span>
            </button>

            <button
              onClick={() => setShowNewDocModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Nouveau Document A4</span>
            </button>
          </div>
        </header>

        {/* ─────────────────────────────────────────────
            2. EXECUTIVE KPI CARDS (Matching LogisticsView)
        ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Documents */}
          <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Documents</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.total}</bdi></div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
                <span className="text-blue-600 font-bold"><bdi dir="ltr">{stats.total}</bdi></span> prêts pour impression / export
              </div>
            </div>
          </div>

          {/* Card 2: Letters & Invitations */}
          <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Lettres & Invitations</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mail size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.letters}</bdi></div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 size={12} /> <bdi dir="ltr">{stats.letters}</bdi> courriers officiels
              </div>
            </div>
          </div>

          {/* Card 3: Agreements & Contracts */}
          <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Conventions & Accords</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.agreements}</bdi></div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-purple-600">
                <bdi dir="ltr">{stats.agreements}</bdi> protocoles & contrats
              </div>
            </div>
          </div>

          {/* Card 4: Format Readiness */}
          <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Format & Précision</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">100%</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  Norme A4 Prête
                </span>
              </div>
              <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            3. SUB-MODULE TABS NAVIGATION
        ───────────────────────────────────────────── */}
        <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
          {SUB_TABS.map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveSubTab(tab.id); }}
                className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
                  isActive
                    ? "text-blue-600 font-black bg-blue-50/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  <bdi dir="ltr">{tab.count}</bdi>
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
                )}
              </button>
            );
          })}
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
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Rechercher un document par titre, référence, signataire..."
              className="w-full ps-9 pe-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-colors"
            />
            {listSearch && (
              <button
                onClick={() => setListSearch("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Format Filter via SearchableSelect */}
          <div className="w-full sm:w-56">
            <SearchableSelect
              value={orientationFilter}
              onChange={(val) => setOrientationFilter(val || "all")}
              options={[
                { value: "all", label: "Toutes les orientations" },
                { value: "portrait", label: "Format Portrait (Vertical)" },
                { value: "landscape", label: "Format Paysage (Horizontal)" },
              ]}
              placeholder="Toutes les orientations"
              buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            5. DOCUMENTS GRID OR EMPTY STATE
        ───────────────────────────────────────────── */}
        {filteredDocs.length === 0 ? (
          <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center my-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Aucun document trouvé
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              Créez votre première lettre officielle, convention ou programme sur format A4 en un clic.
            </p>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Nouveau Document A4</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((item) => {
              const elementCount = item.elements?.length || 0;
              const formattedDate = item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Récemment";

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-md">
                        A4 {item.orientation === "landscape" ? "Paysage" : "Portrait"}
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {item.name || "Document sans titre"}
                    </h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                      <span>{elementCount} {elementCount > 1 ? "éléments" : "élément"}</span>
                      <span>•</span>
                      <span>Modifié le {formattedDate}</span>
                    </div>
                  </div>

                  {/* Actions Bar (Clean Eventzone blue) */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEditDocument(item)}
                      className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors text-center cursor-pointer"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => {
                        setActiveDoc(item);
                        setTimeout(() => printVisualDocument(), 100);
                      }}
                      title="Imprimer / Exporter PDF"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer size={16} />
                    </button>

                    <button
                      onClick={() => handleDuplicateDocument(item)}
                      title="Dupliquer"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Supprimer"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: New Document Starter Selector */}
        {showNewDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">
                  Nouveau Document A4
                </h3>
                <button
                  onClick={() => setShowNewDocModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Choisissez comment vous souhaitez commencer votre document. Vous pourrez toujours ajouter, modifier ou réorganiser n&apos;importe quel élément par la suite.
              </p>

              <div className="space-y-2.5 pt-1">
                {STARTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleCreateNewDocument(preset.id)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-start gap-3.5 group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {preset.id === "blank" ? <Plus size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowNewDocModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: EDITOR (A4 Visual Document Composer)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-xs">
        {/* Left: Back & Title input */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setViewMode("list")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Tous les documents</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Editable Document Title */}
          <input
            type="text"
            value={activeDoc.name || ""}
            onChange={(e) =>
              setActiveDoc((prev) => ({
                ...prev,
                name: e.target.value,
                updatedAt: new Date().toISOString(),
              }))
            }
            placeholder="Nom du document..."
            className="font-bold text-base text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-hidden px-1 py-0.5 max-w-sm w-full transition-colors truncate"
          />
        </div>

        {/* Center / Right: Page settings & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Orientation Toggle */}
          <button
            onClick={() =>
              setActiveDoc((prev) => ({
                ...prev,
                orientation: prev.orientation === "landscape" ? "portrait" : "landscape",
              }))
            }
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Basculer Portrait / Paysage"
          >
            <span>{activeDoc.orientation === "landscape" ? "Paysage" : "Portrait"}</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={() => printVisualDocument()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={16} className="text-slate-500" />
            <span className="hidden md:inline">Imprimer / PDF</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveActiveDocument}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer ${
              saveSuccessNotice
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {saveSuccessNotice ? (
              <>
                <Check size={16} />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <span>{isSaving ? "Enregistrement..." : "Enregistrer"}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Workspace: Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Clean Elements Panel */}
        <div className="w-full lg:w-[460px] bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-57px)] overflow-y-auto">
          {/* 1. Quick Style bar (Font & Theme color) */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Style du document</span>
              {/* Color swatches */}
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setActiveDoc((p) => ({ ...p, colorId: col.id }))}
                    title={col.name}
                    className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                      activeDoc.colorId === col.id
                        ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: col.primary }}
                  />
                ))}
              </div>
            </div>

            {/* Font Selector via SearchableSelect */}
            <div>
              <SearchableSelect
                value={activeDoc.fontId || "sans"}
                onChange={(val) => setActiveDoc((p) => ({ ...p, fontId: val }))}
                options={FONT_OPTIONS.map((f) => ({
                  value: f.id,
                  label: f.name,
                }))}
                placeholder="Choisir une typographie..."
                buttonClassName="py-1.5 text-xs bg-white border-slate-200"
              />
            </div>
          </div>

          {/* 2. Add Element Palette */}
          <div className="p-4 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              + Ajouter un élément à la page
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddElement("header")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + En-tête officiel
              </button>
              <button
                onClick={() => handleAddElement("heading")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Titre / Section
              </button>
              <button
                onClick={() => handleAddElement("paragraph")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Texte / Paragraphe
              </button>
              <button
                onClick={() => handleAddElement("custom_text")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Bloc de Texte Libre
              </button>
              <button
                onClick={() => handleAddElement("image")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Image / Photo
              </button>
              <button
                onClick={() => handleAddElement("callout")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Encadré / Note
              </button>
              <button
                onClick={() => handleAddElement("info_grid")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Infos Clés (Grille)
              </button>
              <button
                onClick={() => handleAddElement("table")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Tableau / Programme
              </button>
              <button
                onClick={() => handleAddElement("signature")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Signatures & Cachet
              </button>
              <button
                onClick={() => handleAddElement("divider")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                + Ligne de séparation
              </button>
            </div>
          </div>

          {/* 3. Elements On Page List */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <span>Éléments de la page ({activeDoc.elements?.length || 0})</span>
            </div>

            {(!activeDoc.elements || activeDoc.elements.length === 0) ? (
              <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                Aucun élément pour le moment. Cliquez sur un élément ci-dessus pour l&apos;ajouter à votre feuille A4.
              </div>
            ) : (
              activeDoc.elements.map((el, index) => {
                const isSelected = selectedElementId === el.id;

                return (
                  <div
                    key={el.id}
                    id={`editor-element-${el.id}`}
                    className={`border rounded-xl transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/20 shadow-xs"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Element header row */}
                    <div
                      onClick={() => setSelectedElementId(isSelected ? null : el.id)}
                      className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                          {ELEMENT_TYPES.find((t) => t.type === el.type)?.label?.split(" ")[0] || el.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {getElementSummary(el)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Move Up */}
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveElement(index, "up")}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Monter"
                        >
                          <ArrowUp size={14} />
                        </button>
                        {/* Move Down */}
                        <button
                          disabled={index === activeDoc.elements.length - 1}
                          onClick={() => handleMoveElement(index, "down")}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Descendre"
                        >
                          <ArrowDown size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleRemoveElement(el.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Element Editor (when expanded/selected) */}
                    {isSelected && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100/80 space-y-2.5 text-xs">
                        {renderElementEditForm(el, (updater) => handleUpdateElement(el.id, updater))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: A4 Live Preview Canvas */}
        <div className="flex-1 bg-slate-200/70 p-6 overflow-auto flex flex-col items-center justify-start relative">
          {/* Zoom toolbar */}
          <div className="sticky top-2 z-20 mb-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-100 rounded-md cursor-pointer"
              title="Zoom arrière"
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-12 text-center text-[11px] font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-100 rounded-md cursor-pointer"
              title="Zoom avant"
            >
              <ZoomIn size={14} />
            </button>
            <div className="h-3 w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setZoom(0.85)}
              className="px-1.5 py-0.5 hover:bg-slate-100 rounded-md text-[11px] cursor-pointer"
            >
              Ajuster
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-1.5 py-0.5 hover:bg-slate-100 rounded-md text-[11px] cursor-pointer"
            >
              100%
            </button>
          </div>

          {/* Real A4 Paper View */}
          <A4VisualDocumentSheet
            doc={activeDoc}
            zoom={zoom}
            selectedElementId={selectedElementId}
            onSelectElement={(id) => {
              setSelectedElementId(id);
              const node = document.getElementById(`editor-element-${id}`);
              if (node) node.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Summarize element in card header
 */
function getElementSummary(el) {
  switch (el.type) {
    case "header":
      return el.orgName || "Papier à en-tête";
    case "heading":
      return el.text || "Titre";
    case "paragraph":
      return el.text?.slice(0, 35) + "..." || "Texte";
    case "custom_text":
      return el.text?.slice(0, 35) + "..." || "Texte Libre";
    case "image":
      return el.caption ? `Image : ${el.caption}` : "Image / Photo";
    case "callout":
      return el.title || "Encadré";
    case "info_grid":
      return "Grille d'informations clés";
    case "table":
      return el.title || "Tableau";
    case "signature":
      return `Signatures (${el.sign1Name || "Responsable"})`;
    case "divider":
      return "Séparateur";
    default:
      return "Élément";
  }
}

/**
 * Clean inline edit form for each element type
 */
function renderElementEditForm(el, update) {
  switch (el.type) {
    case "header":
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Organisation</label>
            <input
              type="text"
              value={el.orgName || ""}
              onChange={(e) => update({ orgName: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sous-titre / Lieu</label>
              <input
                type="text"
                value={el.subtitle || ""}
                onChange={(e) => update({ subtitle: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Référence</label>
              <input
                type="text"
                value={el.ref || ""}
                onChange={(e) => update({ ref: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
            <input
              type="text"
              value={el.date || ""}
              onChange={(e) => update({ date: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      );

    case "heading":
    case "paragraph":
    case "custom_text":
      return (
        <div className="space-y-2.5">
          {/* Text Content */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              {el.type === "heading" ? "Texte du titre" : "Contenu du texte"}
            </label>
            {el.type === "heading" ? (
              <input
                type="text"
                value={el.text || ""}
                onChange={(e) => update({ text: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
              />
            ) : (
              <textarea
                rows={4}
                value={el.text || ""}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="Rédigez ici..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed focus:border-blue-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* Subtitle for heading */}
          {el.type === "heading" && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sous-titre (optionnel)</label>
              <input
                type="text"
                value={el.subtitle || ""}
                onChange={(e) => update({ subtitle: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Font / Typography */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Police / Typographie</label>
            <SearchableSelect
              value={el.fontId || "inherit"}
              onChange={(val) => update({ fontId: val })}
              options={[
                { value: "inherit", label: "Police par défaut du document" },
                ...FONT_OPTIONS.map((f) => ({ value: f.id, label: f.name })),
              ]}
              placeholder="Police de caractères..."
              buttonClassName="py-1 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          {/* Size / Taille */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Taille du texte</label>
            <div className="flex gap-1 mt-1">
              {["xs", "sm", "md", "lg", "xl", "2xl"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => update({ size: sz })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.size || (el.type === "heading" ? "lg" : "md")) === sz
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {sz.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Boldness / Weight */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Graisse / Boldness</label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "normal", label: "Normal" },
                { id: "medium", label: "Moyen" },
                { id: "semibold", label: "Semi" },
                { id: "bold", label: "Gras" },
                { id: "extrabold", label: "Black" },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => update({ weight: w.id })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.weight || (el.type === "heading" ? "bold" : "normal")) === w.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position / Alignement & Formatting */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Position / Alignement</label>
              <div className="flex gap-1 mt-1">
                {[
                  { id: "left", label: "Gauche" },
                  { id: "center", label: "Centre" },
                  { id: "right", label: "Droite" },
                  ...(el.type !== "heading" ? [{ id: "justify", label: "Justifié" }] : []),
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => update({ align: a.id })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                      (el.align || "left") === a.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Style & Décoration</label>
              <div className="flex gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => update({ italic: !el.italic })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    el.italic
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 italic"
                  }`}
                >
                  Italique
                </button>
                <button
                  type="button"
                  onClick={() => update({ underline: !el.underline })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    el.underline
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 underline"
                  }`}
                >
                  Souligné
                </button>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Couleur du texte</label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "default", label: "Défaut (Sombre)" },
                { id: "primary", label: "Bleu Eventzone" },
                { id: "muted", label: "Gris atténué" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update({ color: c.id })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.color || "default") === c.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-2.5">
          {/* File Upload Button */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Fichier Image / Photo</label>
            <div className="mt-1">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                <Upload size={14} />
                <span>Importer une photo depuis l&apos;ordinateur</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (uploadEvent) => {
                      update({ url: uploadEvent.target.result });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Direct Image URL */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Ou lien direct (URL)</label>
            <input
              type="text"
              value={el.url || ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://exemple.com/image.jpg ou /mon-image.png"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Position / Alignement */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Position / Alignement</label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "left", label: "Gauche" },
                { id: "center", label: "Centré" },
                { id: "right", label: "Droite" },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => update({ align: a.id })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.align || "center") === a.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size / Taille */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Taille de l&apos;image</label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "sm", label: "Petite (140px)" },
                { id: "md", label: "Moyenne (280px)" },
                { id: "lg", label: "Grande (460px)" },
                { id: "full", label: "Pleine largeur" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => update({ size: s.id })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.size || "md") === s.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shape / Forme */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Cadrage / Forme</label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "rounded", label: "Bords arrondis" },
                { id: "square", label: "Rectangle / Carré" },
                { id: "circle", label: "Cercle" },
              ].map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => update({ shape: sh.id })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.shape || "rounded") === sh.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {sh.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border & Shadow */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!el.border}
                onChange={(e) => update({ border: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Bordure fine</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!el.shadow}
                onChange={(e) => update({ shadow: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Ombre portée</span>
            </label>
          </div>

          {/* Caption */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Légende sous l&apos;image (optionnelle)</label>
            <input
              type="text"
              value={el.caption || ""}
              onChange={(e) => update({ caption: e.target.value })}
              placeholder="Légende ou description..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Titre de l&apos;encadré</label>
            <input
              type="text"
              value={el.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Texte</label>
            <textarea
              rows={3}
              value={el.text || ""}
              onChange={(e) => update({ text: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Couleur</label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "slate", label: "Gris" },
                { id: "blue", label: "Bleu" },
                { id: "emerald", label: "Vert" },
                { id: "amber", label: "Jaune" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update({ color: c.id })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                    (el.color || "slate") === c.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case "info_grid":
      return (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Données clés (2 à 4 éléments)</label>
          {(el.items || []).map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                placeholder="Libellé"
                value={item.label || ""}
                onChange={(e) => {
                  const newItems = [...(el.items || [])];
                  newItems[idx] = { ...newItems[idx], label: e.target.value };
                  update({ items: newItems });
                }}
                className="w-1/3 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="Valeur"
                value={item.value || ""}
                onChange={(e) => {
                  const newItems = [...(el.items || [])];
                  newItems[idx] = { ...newItems[idx], value: e.target.value };
                  update({ items: newItems });
                }}
                className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Titre du tableau (optionnel)</label>
            <input
              type="text"
              value={el.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Colonnes (séparées par une virgule)</label>
            <input
              type="text"
              value={(el.headers || []).join(", ")}
              onChange={(e) => {
                const arr = e.target.value.split(",").map((s) => s.trim());
                update({ headers: arr });
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Lignes ({el.rows?.length || 0})</label>
              <button
                type="button"
                onClick={() => {
                  const colCount = (el.headers || []).length || 3;
                  const newRow = new Array(colCount).fill("Nouvelle entrée");
                  update({ rows: [...(el.rows || []), newRow] });
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {(el.rows || []).map((row, rIdx) => (
                <div key={rIdx} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 w-4">{rIdx + 1}.</span>
                  {row.map((cell, cIdx) => (
                    <input
                      key={cIdx}
                      type="text"
                      value={cell || ""}
                      onChange={(e) => {
                        const newRows = [...(el.rows || [])];
                        newRows[rIdx] = [...newRows[rIdx]];
                        newRows[rIdx][cIdx] = e.target.value;
                        update({ rows: newRows });
                      }}
                      className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] focus:border-blue-500 focus:outline-hidden"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newRows = (el.rows || []).filter((_, idx) => idx !== rIdx);
                      update({ rows: newRows });
                    }}
                    className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "signature":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Signataire 1 (Nom)</label>
              <input
                type="text"
                value={el.sign1Name || ""}
                onChange={(e) => update({ sign1Name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fonction / Titre</label>
              <input
                type="text"
                value={el.sign1Title || ""}
                onChange={(e) => update({ sign1Title: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Signataire 2 (Optionnel)</label>
              <input
                type="text"
                value={el.sign2Name || ""}
                onChange={(e) => update({ sign2Name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fonction 2</label>
              <input
                type="text"
                value={el.sign2Title || ""}
                onChange={(e) => update({ sign2Title: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="stampCheckbox"
              checked={!!el.showStamp}
              onChange={(e) => update({ showStamp: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="stampCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Afficher le cachet officiel &apos;Eventzone Approuvé&apos;
            </label>
          </div>
        </div>
      );

    case "divider":
      return (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Style de ligne</label>
          <div className="flex gap-1 mt-1">
            {[
              { id: "solid", label: "Pleine" },
              { id: "dashed", label: "Pointillés" },
              { id: "double", label: "Double" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => update({ style: d.id })}
                className={`flex-1 py-1 text-[10px] font-bold rounded-md border cursor-pointer ${
                  (el.style || "solid") === d.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
