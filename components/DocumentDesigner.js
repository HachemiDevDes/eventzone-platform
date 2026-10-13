/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft, Plus, Trash2, Printer, Check, Copy,
  ArrowUp, ArrowDown, ChevronDown, ChevronUp, ZoomIn,
  ZoomOut, Maximize2, FileText, Search, Sparkles
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

  // Search filter in list mode
  const [listSearch, setListSearch] = useState("");

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

  // Filtered list
  const filteredDocs = useMemo(() => {
    if (!listSearch) return combinedDocuments;
    const q = listSearch.toLowerCase();
    return combinedDocuments.filter((d) =>
      (d.name || "").toLowerCase().includes(q)
    );
  }, [combinedDocuments, listSearch]);

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

    // Remove from local storage
    if (typeof window !== "undefined" && activeEventId) {
      setLocalDocs((prev) => {
        const next = prev.filter((d) => d.id !== docId);
        localStorage.setItem(`eventzone_designed_docs_${activeEventId}`, JSON.stringify(next));
        return next;
      });
    }

    // Call prop if provided
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

    // Also persist via props
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

  // =========================================================================
  // VIEW MODE: LIST (Document Hub)
  // =========================================================================
  if (viewMode === "list") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Document Studio
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Consultez vos documents, imprimez-les en format A4 ou composez de nouveaux documents officiels personnalisés.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowNewDocModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau Document A4
            </button>
          </div>
        </div>

        {/* Search & Counter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
            {filteredDocs.length} {filteredDocs.length > 1 ? "documents disponibles" : "document disponible"}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Aucun document pour le moment
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Commencez avec une feuille A4 vierge ou utilisez un modèle pour créer des lettres, conventions, programmes ou invitations.
            </p>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer mon premier document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                        A4 {item.orientation === "landscape" ? "Paysage" : "Portrait"}
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.name || "Document sans titre"}
                    </h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                      <span>{elementCount} {elementCount > 1 ? "éléments" : "élément"}</span>
                      <span>•</span>
                      <span>Modifié le {formattedDate}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEditDocument(item)}
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors text-center"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => {
                        setActiveDoc(item);
                        setTimeout(() => printVisualDocument(), 100);
                      }}
                      title="Imprimer / Exporter PDF"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicateDocument(item)}
                      title="Dupliquer"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Supprimer"
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">
                  Nouveau Document A4
                </h3>
                <button
                  onClick={() => setShowNewDocModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Choisissez comment vous souhaitez commencer votre document. Vous pourrez toujours ajouter ou modifier n&apos;importe quel élément par la suite.
              </p>

              <div className="space-y-2.5 pt-1">
                {STARTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleCreateNewDocument(preset.id)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-start gap-3.5 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {preset.id === "blank" ? <Plus className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
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
            className="font-bold text-base text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-hidden px-1 py-0.5 max-w-sm w-full transition-colors truncate"
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
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Basculer Portrait / Paysage"
          >
            <span>{activeDoc.orientation === "landscape" ? "Paysage" : "Portrait"}</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={() => printVisualDocument()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Imprimer / PDF</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveActiveDocument}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs rounded-lg shadow-xs transition-colors ${
              saveSuccessNotice
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {saveSuccessNotice ? (
              <>
                <Check className="w-4 h-4" />
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
                    className={`w-5 h-5 rounded-full transition-all ${
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
                buttonClassName="py-1.5 text-xs bg-white"
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
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + En-tête officiel
              </button>
              <button
                onClick={() => handleAddElement("heading")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + Titre / Section
              </button>
              <button
                onClick={() => handleAddElement("paragraph")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + Texte / Paragraphe
              </button>
              <button
                onClick={() => handleAddElement("callout")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + Encadré / Note
              </button>
              <button
                onClick={() => handleAddElement("info_grid")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + Infos Clés (Grille)
              </button>
              <button
                onClick={() => handleAddElement("table")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + Tableau / Programme
              </button>
              <button
                onClick={() => handleAddElement("signature")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                + Signatures & Cachet
              </button>
              <button
                onClick={() => handleAddElement("divider")}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
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
                        ? "border-indigo-500 bg-indigo-50/20 shadow-xs"
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
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Monter"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        {/* Move Down */}
                        <button
                          disabled={index === activeDoc.elements.length - 1}
                          onClick={() => handleMoveElement(index, "down")}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Descendre"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleRemoveElement(el.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              className="p-1 hover:bg-slate-100 rounded-md"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center text-[11px] font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-100 rounded-md"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setZoom(0.85)}
              className="px-1.5 py-0.5 hover:bg-slate-100 rounded-md text-[11px]"
            >
              Ajuster
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-1.5 py-0.5 hover:bg-slate-100 rounded-md text-[11px]"
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
              // scroll into view in left panel
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sous-titre / Lieu</label>
              <input
                type="text"
                value={el.subtitle || ""}
                onChange={(e) => update({ subtitle: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Référence</label>
              <input
                type="text"
                value={el.ref || ""}
                onChange={(e) => update({ ref: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
            <input
              type="text"
              value={el.date || ""}
              onChange={(e) => update({ date: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      );

    case "heading":
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Texte du titre</label>
            <input
              type="text"
              value={el.text || ""}
              onChange={(e) => update({ text: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Sous-titre (optionnel)</label>
            <input
              type="text"
              value={el.subtitle || ""}
              onChange={(e) => update({ subtitle: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Taille</label>
              <div className="flex gap-1 mt-1">
                {["sm", "md", "lg", "xl"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => update({ size: sz })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${
                      (el.size || "lg") === sz
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Alignement</label>
              <div className="flex gap-1 mt-1">
                {[
                  { id: "left", label: "Gauche" },
                  { id: "center", label: "Centre" },
                  { id: "right", label: "Droite" },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => update({ align: a.id })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${
                      (el.align || "left") === a.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Texte du paragraphe</label>
            <textarea
              rows={5}
              value={el.text || ""}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Rédigez ici..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Taille</label>
              <div className="flex gap-1 mt-1">
                {[
                  { id: "sm", label: "Petit" },
                  { id: "md", label: "Normal" },
                  { id: "lg", label: "Grand" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ size: s.id })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${
                      (el.size || "md") === s.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Alignement</label>
              <div className="flex gap-1 mt-1">
                {[
                  { id: "left", label: "Gauche" },
                  { id: "justify", label: "Justifié" },
                  { id: "center", label: "Centre" },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => update({ align: a.id })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${
                      (el.align || "left") === a.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Texte</label>
            <textarea
              rows={3}
              value={el.text || ""}
              onChange={(e) => update({ text: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
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
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${
                    (el.color || "slate") === c.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 border-slate-200 text-slate-600"
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
                className="w-1/3 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
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
                className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
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
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
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
                      className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded-md text-[11px]"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newRows = (el.rows || []).filter((_, idx) => idx !== rIdx);
                      update({ rows: newRows });
                    }}
                    className="p-1 text-red-400 hover:text-red-600"
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
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fonction / Titre</label>
              <input
                type="text"
                value={el.sign1Title || ""}
                onChange={(e) => update({ sign1Title: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
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
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fonction 2</label>
              <input
                type="text"
                value={el.sign2Title || ""}
                onChange={(e) => update({ sign2Title: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="stampCheckbox"
              checked={!!el.showStamp}
              onChange={(e) => update({ showStamp: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="stampCheckbox" className="text-xs font-semibold text-slate-700">
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
                className={`flex-1 py-1 text-[10px] font-bold rounded-md border ${
                  (el.style || "solid") === d.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50 border-slate-200 text-slate-600"
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
