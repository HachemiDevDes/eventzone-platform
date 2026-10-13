/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ArrowLeft, Save, Share2, Download, Plus, Trash2,
  Check, Upload, Copy, FileText, Calendar, CheckCircle2,
  AlertCircle, Printer, Eye, Building2, X, Package, Zap,
  Tv, Coffee, Search, Palette, Type, ShieldCheck, Sparkles,
  Layers, ArrowUp, ArrowDown, LayoutTemplate, AlignLeft,
  BarChart2, Scale, CheckSquare, Quote, Move, ZoomIn, ZoomOut,
  Maximize2, RotateCcw, Image as ImageIcon, ExternalLink, MapPin
} from "lucide-react";
import { toPng } from "html-to-image";
import SearchableSelect from "./SearchableSelect";
import A4VisualDocumentSheet, { printVisualDocument } from "./A4VisualDocumentSheet";
import {
  DOCUMENT_CATEGORIES,
  COLOR_THEMES,
  FONT_PAIRINGS,
  CALLIGRAPHY_SIGNATURES,
  BLOCK_TYPES_CATALOG,
  DOCUMENT_TEMPLATES,
  createDefaultDocument,
} from "../lib/documentDesignerPresets";
import { ALGERIAN_WILAYAS } from "../lib/invoicingConstants";
import { uploadMedia } from "../lib/storage";
import { useLanguage } from "../lib/i18n";

export default function DocumentDesigner({
  initialDocument = null,
  activeEventId = null,
  eventDetails = {},
  currentUser = {},
  speakers = [],
  sponsors = [],
  exhibitors = [],
  organizations = [],
  opportunities = [],
  onBack,
  onSaveDocument,
  onSaveToDocuments,
  effectivePermissions,
}) {
  const { t } = useLanguage();

  // Document state
  const [doc, setDoc] = useState(() => {
    if (initialDocument) return initialDocument;
    return createDefaultDocument("sponsorship-one-pager", eventDetails, currentUser);
  });

  // Studio inspector tabs: 'templates' | 'blocks' | 'design' | 'brand'
  const [activeStudioTab, setActiveStudioTab] = useState("templates");
  const [selectedBlockId, setSelectedBlockId] = useState(() => doc.blocks?.[0]?.id || null);

  // Template browser state
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("all");
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");

  // Canvas zoom
  const [zoom, setZoom] = useState(0.85);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);

  // Responsive mobile view toggle: 'editor' | 'preview'
  const [mobileViewMode, setMobileViewMode] = useState("editor");

  const logoInputRef = useRef(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return DOCUMENT_TEMPLATES.filter((tpl) => {
      const matchCat = templateCategoryFilter === "all" || tpl.category === templateCategoryFilter;
      const matchSearch =
        !templateSearchTerm ||
        tpl.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
        tpl.description.toLowerCase().includes(templateSearchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templateCategoryFilter, templateSearchTerm]);

  // Handle template selection
  const handleApplyTemplate = (templateId) => {
    const freshDoc = createDefaultDocument(templateId, eventDetails, currentUser);
    setDoc({
      ...freshDoc,
      id: doc.id, // keep document ID
    });
    setSelectedBlockId(freshDoc.blocks?.[0]?.id || null);
    setActiveStudioTab("blocks");
  };

  // Update root document property
  const updateDocProp = (key, value) => {
    setDoc((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Block management
  const updateBlock = (blockId, updater) => {
    setDoc((prev) => {
      const updatedBlocks = prev.blocks.map((b) => {
        if (b.id === blockId) {
          return typeof updater === "function" ? updater(b) : { ...b, ...updater };
        }
        return b;
      });
      return { ...prev, blocks: updatedBlocks };
    });
  };

  const removeBlock = (blockId) => {
    setDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(doc.blocks.find((b) => b.id !== blockId)?.id || null);
    }
  };

  const moveBlock = (blockId, direction) => {
    setDoc((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.blocks.length) return prev;

      const newBlocks = [...prev.blocks];
      const [moved] = newBlocks.splice(index, 1);
      newBlocks.splice(newIndex, 0, moved);
      return { ...prev, blocks: newBlocks };
    });
  };

  const addBlock = (blockType) => {
    const newId = `block-${Date.now()}`;
    let newBlock = { id: newId, type: blockType };

    switch (blockType) {
      case "hero_banner":
        newBlock = {
          ...newBlock,
          badge: "NEW SECTION",
          title: "{{event_name}}",
          subtitle: "Executive Highlight & Subtitle",
          date: "{{event_date}}",
          location: "{{venue}}, {{wilaya}}",
        };
        break;
      case "executive_summary":
        newBlock = {
          ...newBlock,
          heading: "Executive Summary",
          content: "Enter your summary or introductory announcement here.",
        };
        break;
      case "stats_grid":
        newBlock = {
          ...newBlock,
          items: [
            { number: "1,000+", label: "Participants", icon: "Users" },
            { number: "25+", label: "Speakers", icon: "Mic2" },
            { number: "50+", label: "Exhibitors", icon: "Building2" },
          ],
        };
        break;
      case "content_section":
        newBlock = {
          ...newBlock,
          badge: "INFO",
          heading: "Article / Section Title",
          content: "Detailed description and informative text for the document.",
        };
        break;
      case "tiers_grid":
        newBlock = {
          ...newBlock,
          heading: "Partnership Packages",
          tiers: [
            { name: "Gold", price: "450 000 DZD", badge: "Primary", featured: true, perks: ["Perk 1", "Perk 2"] },
            { name: "Silver", price: "250 000 DZD", badge: "Standard", featured: false, perks: ["Perk 1", "Perk 2"] },
          ],
        };
        break;
      case "schedule_table":
        newBlock = {
          ...newBlock,
          heading: "Program Schedule",
          sessions: [
            { time: "09:00 - 10:00", title: "Opening Session", stage: "Main Hall", speaker: "Host" },
            { time: "10:00 - 11:30", title: "Keynote Talk", stage: "Plenary", speaker: "Keynote" },
          ],
        };
        break;
      case "quote_callout":
        newBlock = {
          ...newBlock,
          quote: "A powerful visionary quote that emphasizes the event mission.",
          author: "{{organizer_name}}",
          authorTitle: "President",
        };
        break;
      case "terms_clauses":
        newBlock = {
          ...newBlock,
          heading: "General Terms & Clauses",
          clauses: [
            { title: "Article 1 : Scope of Agreement", text: "Terms and conditions governing the event participation." },
            { title: "Article 2 : Mutual Obligations", text: "Deliverables and timelines committed by each party." },
          ],
        };
        break;
      case "signature_block":
        newBlock = {
          ...newBlock,
          signatory1Name: "{{organizer_name}}",
          signatory1Title: "Authorized Organizer",
          signatory1Org: "Eventzone Platform",
          date: "{{current_date}}",
        };
        break;
      default:
        break;
    }

    setDoc((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setSelectedBlockId(newId);
    setActiveStudioTab("blocks");
  };

  // Upload organizer logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const eventId = activeEventId || "general";
      const uploadedUrl = await uploadMedia(file, "documents", eventId, "logo");
      if (uploadedUrl) {
        updateDocProp("organizerLogo", uploadedUrl);
      }
    } catch (err) {
      console.error("Logo upload error:", err);
    }
  };

  // Save document draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        const key = `eventzone_designed_doc_${doc.id}`;
        localStorage.setItem(key, JSON.stringify(doc));
      }
      if (onSaveDocument) {
        await onSaveDocument(doc);
      }
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err) {
      console.error("Save document error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save as managed document in DocumentsView
  const handlePublishToEventDocuments = async () => {
    setIsSaving(true);
    try {
      // Create a managed document object compatible with DocumentsView
      const categoryMap = {
        sponsorship: "Sponsorship & Media",
        agendas: "Guidelines & Policies",
        press: "Press & Marketing",
        contracts: "Contracts & Legal",
        permits: "Permits & Licenses",
        promotional: "Press & Marketing",
        vip: "General",
      };

      const publishedDoc = {
        id: doc.id,
        name: doc.title,
        fileName: `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
        fileType: "pdf",
        category: categoryMap[doc.category] || "General",
        accessLevel: "team",
        description: `Visual document generated via Eventzone Document Studio (${doc.category}).`,
        fileSize: 185000, // Estimated representation
        fileUrl: "#", // In-app generated
        isDesignedDocument: true,
        designedDocumentData: doc,
        createdAt: new Date().toISOString(),
      };

      if (onSaveToDocuments) {
        await onSaveToDocuments(publishedDoc);
      }

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    } catch (err) {
      console.error("Publish to documents error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Download high-resolution PNG
  const handleDownloadPng = async () => {
    const element = document.getElementById("a4-visual-document-sheet");
    if (!element) return;

    setIsGeneratingPng(true);
    try {
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_") || "document"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export error:", err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Share link
  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/documents?docId=${doc.id}`;
      navigator.clipboard?.writeText(url);
      setShareNotice(true);
      setTimeout(() => setShareNotice(false), 3000);
    }
  };

  // Currently selected block
  const selectedBlock = useMemo(() => {
    return doc.blocks?.find((b) => b.id === selectedBlockId) || doc.blocks?.[0] || null;
  }, [doc.blocks, selectedBlockId]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-50 overflow-hidden select-none">
      {/* ─────────────────────────────────────────────
          1. TOP NAVIGATION & ACTION BAR
          ───────────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Back to Documents"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Editable Document Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={doc.title}
                onChange={(e) => updateDocProp("title", e.target.value)}
                placeholder="Document Title"
                className="font-black text-sm text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 outline-hidden truncate max-w-[200px] sm:max-w-xs md:max-w-sm transition-all"
              />
              <span className="text-[10px] font-bold text-slate-400 block px-2 -mt-0.5">
                Eventzone Document Studio
              </span>
            </div>
          </div>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => updateDocProp("orientation", "portrait")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                doc.orientation === "portrait"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => updateDocProp("orientation", "landscape")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                doc.orientation === "landscape"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Landscape
            </button>
          </div>

          {/* Mobile view switch */}
          <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setMobileViewMode("editor")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mobileViewMode === "editor"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobileViewMode("preview")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mobileViewMode === "preview"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Live A4
            </button>
          </div>

          {/* Save to Event Documents Button */}
          <button
            onClick={handlePublishToEventDocuments}
            disabled={isSaving}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            title="Save into Event Documents asset directory"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add to Documents</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={() => printVisualDocument(doc)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Download PNG Button */}
          <button
            onClick={handleDownloadPng}
            disabled={isGeneratingPng}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isGeneratingPng ? "Exporting..." : "PNG"}</span>
          </button>

          {/* Save Draft Button */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleCopyShareLink}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Copy Share Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Alerts */}
      {saveSuccessNotice && (
        <div className="absolute top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Document saved successfully!</span>
        </div>
      )}
      {shareNotice && (
        <div className="absolute top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Copy className="w-4 h-4" />
          <span>Shareable link copied to clipboard!</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          2. MAIN SPLIT-SCREEN WORKSPACE
          ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ────────── LEFT STUDIO INSPECTOR ────────── */}
        <aside
          className={`w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden ${
            mobileViewMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 px-3 bg-slate-50/50 shrink-0">
            <button
              onClick={() => setActiveStudioTab("templates")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all cursor-pointer ${
                activeStudioTab === "templates"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Templates</span>
              </div>
            </button>

            <button
              onClick={() => setActiveStudioTab("blocks")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all cursor-pointer ${
                activeStudioTab === "blocks"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Content & Blocks</span>
              </div>
            </button>

            <button
              onClick={() => setActiveStudioTab("design")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all cursor-pointer ${
                activeStudioTab === "design"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Theme & Style</span>
              </div>
            </button>

            <button
              onClick={() => setActiveStudioTab("brand")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all cursor-pointer ${
                activeStudioTab === "brand"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Brand & Stamp</span>
              </div>
            </button>
          </div>

          {/* Tab 1: Templates Gallery */}
          {activeStudioTab === "templates" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Category selector using SearchableSelect */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document Category
                </label>
                <SearchableSelect
                  value={templateCategoryFilter}
                  onChange={setTemplateCategoryFilter}
                  options={DOCUMENT_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
                  placeholder="Select Category"
                />
              </div>

              {/* Template search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={templateSearchTerm}
                  onChange={(e) => setTemplateSearchTerm(e.target.value)}
                  placeholder="Search preset templates..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Template Cards Grid */}
              <div className="space-y-3 pt-1">
                {filteredTemplates.map((tpl) => {
                  const isActive = doc.templateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                        isActive
                          ? "border-blue-600 bg-blue-50/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-extrabold text-xs text-slate-900 leading-snug">
                          {tpl.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600 shrink-0">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                        {tpl.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {tpl.blocks?.length || 0} visual blocks
                        </span>
                        <span
                          className={`text-xs font-bold inline-flex items-center gap-1 ${
                            isActive ? "text-blue-600" : "text-slate-600"
                          }`}
                        >
                          {isActive ? "Currently Active" : "Apply Template →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Content & Blocks */}
          {activeStudioTab === "blocks" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Add New Block Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Add Content Block</label>
                  <span className="text-[10px] text-slate-400 font-medium">Click to append</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_TYPES_CATALOG.map((cat) => (
                    <button
                      key={cat.type}
                      onClick={() => addBlock(cat.type)}
                      className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all cursor-pointer flex items-center gap-2 group"
                    >
                      <div className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 truncate">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Block List Reordering */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Active Document Blocks ({doc.blocks?.length || 0})
                </label>
                <div className="space-y-1.5">
                  {doc.blocks?.map((block, idx) => {
                    const isSelected = block.id === selectedBlockId;
                    const catInfo = BLOCK_TYPES_CATALOG.find((c) => c.type === block.type);

                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/30 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 font-bold w-4">
                            {idx + 1}.
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {block.title || block.heading || catInfo?.label || block.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => moveBlock(block.id, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveBlock(block.id, "down")}
                            disabled={idx === doc.blocks.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeBlock(block.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Remove Block"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Block Field Inspector */}
              {selectedBlock && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Edit Block: {selectedBlock.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{selectedBlock.id}</span>
                  </div>

                  {/* Variables quick insertion pills */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Insert Event Tags:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {["{{event_name}}", "{{event_date}}", "{{venue}}", "{{wilaya}}", "{{organizer_name}}", "{{current_date}}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (selectedBlock.content !== undefined) {
                              updateBlock(selectedBlock.id, {
                                content: (selectedBlock.content || "") + ` ${tag} `,
                              });
                            } else if (selectedBlock.title !== undefined) {
                              updateBlock(selectedBlock.id, {
                                title: (selectedBlock.title || "") + ` ${tag} `,
                              });
                            }
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 cursor-pointer transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fields based on block type */}
                  {selectedBlock.badge !== undefined && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={selectedBlock.badge || ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { badge: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  )}

                  {selectedBlock.title !== undefined && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={selectedBlock.title || ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                  )}

                  {selectedBlock.subtitle !== undefined && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={selectedBlock.subtitle || ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { subtitle: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  )}

                  {selectedBlock.heading !== undefined && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Heading</label>
                      <input
                        type="text"
                        value={selectedBlock.heading || ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { heading: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                  )}

                  {selectedBlock.content !== undefined && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Content / Paragraph</label>
                      <textarea
                        rows={5}
                        value={selectedBlock.content || ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white leading-relaxed resize-y"
                      />
                    </div>
                  )}

                  {selectedBlock.quote !== undefined && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Quote</label>
                        <textarea
                          rows={3}
                          value={selectedBlock.quote || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { quote: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white italic"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Author Name</label>
                        <input
                          type="text"
                          value={selectedBlock.author || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { author: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.signatory1Name !== undefined && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Signatory Name</label>
                        <input
                          type="text"
                          value={selectedBlock.signatory1Name || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { signatory1Name: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Signatory Title</label>
                        <input
                          type="text"
                          value={selectedBlock.signatory1Title || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { signatory1Title: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Design & Styling */}
          {activeStudioTab === "design" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Color Themes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Color DNA Palette
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = doc.themeId === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => updateDocProp("themeId", theme.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <div
                            className="w-4 h-4 rounded-full shadow-2xs"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full shadow-2xs"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {theme.name.split(" ")[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {theme.name.split("(")[1]?.replace(")", "") || ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Font Pairings */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Typography Pairing
                </label>
                <div className="space-y-2">
                  {FONT_PAIRINGS.map((font) => {
                    const isSelected = doc.fontPairingId === font.id;
                    return (
                      <div
                        key={font.id}
                        onClick={() => updateDocProp("fontPairingId", font.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <span
                            className="text-sm font-bold text-slate-900 block"
                            style={{ fontFamily: font.titleFont }}
                          >
                            {font.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Headings in {font.name.split("(")[1]?.split("&")[0] || "Font"}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calligraphy Signature Script */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Calligraphic Signature Script
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CALLIGRAPHY_SIGNATURES.map((sig) => {
                    const isSelected = doc.calligraphySignatureId === sig.id;
                    return (
                      <button
                        key={sig.id}
                        type="button"
                        onClick={() => updateDocProp("calligraphySignatureId", sig.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="text-lg text-slate-800 block truncate mb-1"
                          style={{ fontFamily: sig.fontFamily }}
                        >
                          Signature
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block truncate">
                          {sig.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                  <span>Show Formal Letterhead</span>
                  <input
                    type="checkbox"
                    checked={doc.showLetterhead}
                    onChange={(e) => updateDocProp("showLetterhead", e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                  <span>Show Official Stamp & Seal</span>
                  <input
                    type="checkbox"
                    checked={doc.showStamp}
                    onChange={(e) => updateDocProp("showStamp", e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                  <span>Background Watermark</span>
                  <input
                    type="checkbox"
                    checked={doc.showWatermark}
                    onChange={(e) => updateDocProp("showWatermark", e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Brand & Authority */}
          {activeStudioTab === "brand" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Organizer Logo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Organizer Logo
                </label>
                <div className="flex items-center gap-3">
                  {doc.organizerLogo ? (
                    <img
                      src={doc.organizerLogo}
                      alt="Logo"
                      className="h-12 w-28 object-contain border border-slate-200 rounded-xl p-1 bg-white"
                    />
                  ) : (
                    <div className="h-12 w-28 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                      No Logo
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  value={doc.organizerName || ""}
                  onChange={(e) => updateDocProp("organizerName", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                />
              </div>

              {/* Wilaya Selector using SearchableSelect */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wilaya / Jurisdiction
                </label>
                <SearchableSelect
                  value={doc.variables?.wilaya || "16 - Alger"}
                  onChange={(newWilaya) => {
                    const cleanWilaya = newWilaya.replace(/^[0-9]+\s*-\s*/, "");
                    setDoc((prev) => ({
                      ...prev,
                      variables: { ...prev.variables, wilaya: cleanWilaya },
                    }));
                  }}
                  options={ALGERIAN_WILAYAS}
                  placeholder="Select Wilaya"
                />
              </div>

              {/* Legal Tax / RC Registration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legal Registration (RC, NIF, NIS)
                </label>
                <input
                  type="text"
                  value={doc.organizerTaxId || ""}
                  onChange={(e) => updateDocProp("organizerTaxId", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                  placeholder="e.g., NIF: 001616012345678 • RC: 16/00-987654"
                />
              </div>

              {/* Official Stamp Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Seal Text
                </label>
                <input
                  type="text"
                  value={doc.stampText || ""}
                  onChange={(e) => updateDocProp("stampText", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  placeholder="Eventzone Certified Document"
                />
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Coordinates
                </label>
                <input
                  type="text"
                  value={doc.organizerContact || ""}
                  onChange={(e) => updateDocProp("organizerContact", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-600"
                  placeholder="contact@eventzone.pro • +213 550 00 00 00"
                />
              </div>
            </div>
          )}
        </aside>

        {/* ────────── RIGHT LIVE A4 CANVAS ────────── */}
        <main
          className={`flex-1 bg-slate-100 overflow-auto flex flex-col items-center p-4 sm:p-8 relative ${
            mobileViewMode === "editor" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Sticky Floating Zoom & Controller Bar */}
          <div className="sticky top-0 z-20 mb-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs font-bold text-slate-700 min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => setZoom(0.7)}
              className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              70%
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              85%
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              100%
            </button>
          </div>

          {/* Render the Live Sheet */}
          <div className="flex justify-center w-full pb-16">
            <A4VisualDocumentSheet
              doc={doc}
              zoom={zoom}
              selectedBlockId={selectedBlockId}
              onSelectBlock={(blockId) => {
                setSelectedBlockId(blockId);
                setActiveStudioTab("blocks");
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
