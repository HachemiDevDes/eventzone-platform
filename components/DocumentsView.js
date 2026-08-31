/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useRef } from "react";
import { 
  FileText, UploadCloud, Plus, Search, Filter, Sparkles, 
  Trash2, Copy, Download, Eye, Star, Lock, Globe, Mic2, 
  Building2, ShieldCheck, Check, X, AlertCircle, RefreshCw, 
  Paperclip, FileSpreadsheet, Presentation, LayoutGrid, 
  List, ChevronDown, ArrowUpDown, FileCode, Archive, 
  Info, ExternalLink, HardDrive, Share2, Pencil, Layers, CheckSquare,
  Package, CheckCircle2, AlertTriangle, Printer, Files, RotateCcw
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import { DocumentsSkeleton } from "./SkeletonLoaders";
import { uploadMedia } from "@/lib/storage";

// ─────────────────────────────────────────────
//  CONSTANTS & CONFIGURATIONS
// ─────────────────────────────────────────────

export const MAX_ORGANIZER_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB total organizer storage quota
export const MAX_SINGLE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB individual file limit

export const DOCUMENT_CATEGORIES = [
  "Contracts & Legal",
  "Permits & Licenses",
  "Sponsorship & Media",
  "Speaker Presentations",
  "Floor Plans & Tech",
  "Press & Marketing",
  "Vendor & Invoices",
  "Guidelines & Policies",
  "General"
];

export const ACCESS_LEVELS = [
  { value: "team", label: "Organizers & Team Only", icon: Lock, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "public", label: "Public & Attendees", icon: Globe, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "speakers", label: "Speakers & VIPs", icon: Mic2, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "sponsors", label: "Sponsors & Exhibitors", icon: Building2, color: "bg-blue-50 text-blue-700 border-blue-200" },
];

export const FILE_TYPE_MAP = {
  pdf: { label: "PDF Document", ext: "PDF", color: "rose", bg: "bg-rose-50 border-rose-200 text-rose-700", iconColor: "text-rose-600", icon: FileText },
  word: { label: "Word Document", ext: "DOCX", color: "blue", bg: "bg-blue-50 border-blue-200 text-blue-700", iconColor: "text-blue-600", icon: FileText },
  docx: { label: "Word Document", ext: "DOCX", color: "blue", bg: "bg-blue-50 border-blue-200 text-blue-700", iconColor: "text-blue-600", icon: FileText },
  doc: { label: "Word Document", ext: "DOC", color: "blue", bg: "bg-blue-50 border-blue-200 text-blue-700", iconColor: "text-blue-600", icon: FileText },
  excel: { label: "Excel Sheet", ext: "XLSX", color: "emerald", bg: "bg-emerald-50 border-emerald-200 text-emerald-700", iconColor: "text-emerald-600", icon: FileSpreadsheet },
  xlsx: { label: "Excel Sheet", ext: "XLSX", color: "emerald", bg: "bg-emerald-50 border-emerald-200 text-emerald-700", iconColor: "text-emerald-600", icon: FileSpreadsheet },
  xls: { label: "Excel Sheet", ext: "XLS", color: "emerald", bg: "bg-emerald-50 border-emerald-200 text-emerald-700", iconColor: "text-emerald-600", icon: FileSpreadsheet },
  csv: { label: "CSV Data", ext: "CSV", color: "teal", bg: "bg-teal-50 border-teal-200 text-teal-700", iconColor: "text-teal-600", icon: FileSpreadsheet },
  pptx: { label: "Presentation", ext: "PPTX", color: "amber", bg: "bg-amber-50 border-amber-200 text-amber-700", iconColor: "text-amber-600", icon: Presentation },
  ppt: { label: "Presentation", ext: "PPT", color: "amber", bg: "bg-amber-50 border-amber-200 text-amber-700", iconColor: "text-amber-600", icon: Presentation },
  image: { label: "Image Asset", ext: "IMG", color: "indigo", bg: "bg-indigo-50 border-indigo-200 text-indigo-700", iconColor: "text-indigo-600", icon: Paperclip },
  png: { label: "PNG Image", ext: "PNG", color: "indigo", bg: "bg-indigo-50 border-indigo-200 text-indigo-700", iconColor: "text-indigo-600", icon: Paperclip },
  jpg: { label: "JPG Image", ext: "JPG", color: "indigo", bg: "bg-indigo-50 border-indigo-200 text-indigo-700", iconColor: "text-indigo-600", icon: Paperclip },
  jpeg: { label: "JPEG Image", ext: "JPG", color: "indigo", bg: "bg-indigo-50 border-indigo-200 text-indigo-700", iconColor: "text-indigo-600", icon: Paperclip },
  zip: { label: "Archive File", ext: "ZIP", color: "purple", bg: "bg-purple-50 border-purple-200 text-purple-700", iconColor: "text-purple-600", icon: Archive },
  txt: { label: "Plain Text", ext: "TXT", color: "slate", bg: "bg-slate-100 border-slate-200 text-slate-700", iconColor: "text-slate-600", icon: FileText },
  other: { label: "Document", ext: "FILE", color: "slate", bg: "bg-slate-100 border-slate-200 text-slate-700", iconColor: "text-slate-600", icon: Paperclip }
};

export function formatBytes(bytes = 0) {
  if (!bytes || isNaN(bytes) || bytes === 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function detectFileType(fileName = "", mimeType = "") {
  const ext = (fileName.split('.').pop() || "").toLowerCase();
  if (ext === 'pdf' || mimeType.includes('pdf')) return 'pdf';
  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) return 'word';
  if (['xls', 'xlsx'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (ext === 'csv' || mimeType.includes('csv')) return 'csv';
  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'pptx';
  if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext) || mimeType.startsWith('image/')) return 'image';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext) || mimeType.includes('zip')) return 'zip';
  if (ext === 'txt' || mimeType.startsWith('text/')) return 'txt';
  return 'other';
}

export default function DocumentsView({
  documents = [],
  isLoading = false,
  onSaveDocument,
  onDeleteDocument,
  onTogglePin,
  onUploadFile,
  activeEventId,
  eventDetails = {},
  onRefreshData
}) {
  const { t, isRTL } = useLanguage();

  // Active Sub-Tab (Matches LogisticsView sub-tabs)
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'contracts' | 'sponsorship' | 'presentations' | 'technical' | 'policies'

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'name_asc' | 'size_desc'

  // Modals & Drawers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Upload Form State
  const fileInputRef = useRef(null);
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    category: "General",
    accessLevel: "team",
    description: "",
    isPinned: false
  });
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Active & Archived documents
  const activeDocs = useMemo(() => {
    return documents.filter(d => !d.isArchived);
  }, [documents]);

  const archivedDocs = useMemo(() => {
    return documents.filter(d => d.isArchived);
  }, [documents]);

  // Tab categorization filter mapping
  const getTabCategoryMatches = (doc, tab) => {
    if (tab === "archived") return true;
    const cat = doc.category || "General";
    if (tab === "all") return true;
    if (tab === "contracts") return cat === "Contracts & Legal" || cat === "Permits & Licenses";
    if (tab === "sponsorship") return cat === "Sponsorship & Media" || cat === "Press & Marketing";
    if (tab === "presentations") return cat === "Speaker Presentations";
    if (tab === "technical") return cat === "Floor Plans & Tech" || cat === "Vendor & Invoices";
    if (tab === "policies") return cat === "Guidelines & Policies" || cat === "Permits & Licenses" || cat === "General";
    return true;
  };

  // Sub-tab counts
  const tabCounts = useMemo(() => {
    return {
      all: activeDocs.length,
      contracts: activeDocs.filter(d => getTabCategoryMatches(d, "contracts")).length,
      sponsorship: activeDocs.filter(d => getTabCategoryMatches(d, "sponsorship")).length,
      presentations: activeDocs.filter(d => getTabCategoryMatches(d, "presentations")).length,
      technical: activeDocs.filter(d => getTabCategoryMatches(d, "technical")).length,
      policies: activeDocs.filter(d => getTabCategoryMatches(d, "policies")).length,
      archived: archivedDocs.length,
    };
  }, [activeDocs, archivedDocs]);

  // Filtered & Sorted Documents
  const filteredDocs = useMemo(() => {
    const sourceDocs = activeTab === "archived" ? archivedDocs : activeDocs;
    return sourceDocs.filter(doc => {
      // 1. Sub-Tab filter
      if (!getTabCategoryMatches(doc, activeTab)) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (doc.name || "").toLowerCase().includes(query);
        const matchFileName = (doc.fileName || "").toLowerCase().includes(query);
        const matchCat = (doc.category || "").toLowerCase().includes(query);
        const matchDesc = (doc.description || "").toLowerCase().includes(query);
        const matchAuthor = (doc.uploadedBy || "").toLowerCase().includes(query);
        if (!matchTitle && !matchFileName && !matchCat && !matchDesc && !matchAuthor) return false;
      }

      // 3. Audience / Access Level filter
      if (audienceFilter !== "all" && doc.accessLevel !== audienceFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned items stay on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "size_desc") {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      return 0;
    });
  }, [activeDocs, activeTab, searchQuery, audienceFilter, sortBy]);

  // Executive KPI Stats
  const stats = useMemo(() => {
    const totalBytes = activeDocs.reduce((sum, d) => sum + (Number(d.fileSize) || 0), 0);
    const pinnedCount = activeDocs.filter(d => d.isPinned).length;
    const publicCount = activeDocs.filter(d => d.accessLevel === 'public').length;
    const teamOnlyCount = activeDocs.filter(d => d.accessLevel === 'team').length;
    const vipCount = activeDocs.filter(d => d.accessLevel === 'speakers' || d.accessLevel === 'sponsors').length;

    // Storage capacity stats (100 MB max storage quota per organizer)
    const percentStorageUsed = Math.min(100, Math.round((totalBytes / MAX_ORGANIZER_STORAGE_BYTES) * 100));
    const remainingBytes = Math.max(0, MAX_ORGANIZER_STORAGE_BYTES - totalBytes);

    return {
      totalDocs: activeDocs.length,
      totalBytes,
      formattedStorage: formatBytes(totalBytes),
      remainingBytes,
      formattedRemaining: formatBytes(remainingBytes),
      percentStorageUsed,
      pinnedCount,
      publicCount,
      teamOnlyCount,
      vipCount,
    };
  }, [activeDocs]);

  // Options for SearchableSelect
  const audienceSelectOptions = useMemo(() => {
    return [
      { value: "all", label: "All Audiences" },
      ...ACCESS_LEVELS.map(a => ({ value: a.value, label: a.label }))
    ];
  }, []);

  const formCategoryOptions = useMemo(() => {
    return DOCUMENT_CATEGORIES.map(c => ({ value: c, label: c }));
  }, []);

  const formAccessOptions = useMemo(() => {
    return ACCESS_LEVELS.map(a => ({ value: a.value, label: a.label }));
  }, []);

  const sortSelectOptions = [
    { value: "newest", label: "Date: Newest First" },
    { value: "oldest", label: "Date: Oldest First" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "size_desc", label: "File Size: Largest" }
  ];

  // Drag & Drop / File Select validation (100 MB organizer storage limit)
  const handleValidateAndSelectFile = (file) => {
    if (!file) return;

    if (file.size > MAX_SINGLE_FILE_BYTES) {
      setUploadError(
        `File size (${formatBytes(file.size)}) exceeds the maximum 10 MB per-file limit. Please select a file under 10 MB.`
      );
      setUploadFileObj(null);
      return;
    }

    // Check against remaining organizer quota
    const currentUsageWithoutEdit = activeDocs
      .filter(d => !editingDoc || d.id !== editingDoc.id)
      .reduce((sum, d) => sum + (Number(d.fileSize) || 0), 0);

    const projectedUsage = currentUsageWithoutEdit + file.size;

    if (projectedUsage > MAX_ORGANIZER_STORAGE_BYTES) {
      const remaining = Math.max(0, MAX_ORGANIZER_STORAGE_BYTES - currentUsageWithoutEdit);
      setUploadError(
        `Organizer storage limit exceeded! You have ${formatBytes(remaining)} remaining out of your 100 MB quota. Uploading this file (${formatBytes(file.size)}) requires ${formatBytes(projectedUsage - MAX_ORGANIZER_STORAGE_BYTES)} more space.`
      );
      setUploadFileObj(null);
      return;
    }

    setUploadError(null);
    setUploadFileObj(file);

    // Auto-fill title if empty
    if (!uploadForm.name.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setUploadForm(prev => ({
        ...prev,
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Submit Upload / Edit Form
  const handlePerformUpload = async () => {
    if (!uploadFileObj && !editingDoc) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    if (!uploadForm.name.trim()) {
      setUploadError("Please provide a document title.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      let finalUrl = editingDoc?.fileUrl || "";
      let finalSize = editingDoc?.fileSize || 0;
      let finalName = editingDoc?.fileName || "";
      let finalType = editingDoc?.fileType || "pdf";
      let finalMime = editingDoc?.mimeType || "";

      if (uploadFileObj) {
        if (onUploadFile) {
          finalUrl = await onUploadFile(uploadFileObj, 'documents', activeEventId);
        } else {
          finalUrl = await uploadMedia(uploadFileObj, 'documents', activeEventId);
        }
        finalSize = uploadFileObj.size;
        finalName = uploadFileObj.name;
        finalType = detectFileType(uploadFileObj.name, uploadFileObj.type);
        finalMime = uploadFileObj.type;
      }

      const docPayload = {
        id: editingDoc?.id,
        eventId: activeEventId,
        name: uploadForm.name.trim(),
        fileName: finalName,
        fileUrl: finalUrl,
        fileSize: finalSize,
        fileType: finalType,
        mimeType: finalMime,
        category: uploadForm.category || "General",
        accessLevel: uploadForm.accessLevel || "team",
        description: uploadForm.description || "",
        uploadedBy: editingDoc?.uploadedBy || "Event Organizer",
        isPinned: Boolean(uploadForm.isPinned),
        isArchived: false,
      };

      if (onSaveDocument) {
        await onSaveDocument(docPayload);
      }

      setShowUploadModal(false);
      setEditingDoc(null);
      setUploadFileObj(null);
      setUploadForm({
        name: "",
        category: "General",
        accessLevel: "team",
        description: "",
        isPinned: false
      });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setUploadForm({
      name: doc.name || "",
      category: doc.category || "General",
      accessLevel: doc.accessLevel || "team",
      description: doc.description || "",
      isPinned: Boolean(doc.isPinned)
    });
    setUploadFileObj(null);
    setUploadError(null);
    setShowUploadModal(true);
  };

  const handleCopyLink = (doc) => {
    if (!doc.fileUrl) return;
    navigator.clipboard.writeText(doc.fileUrl);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (doc) => {
    if (!doc.fileUrl) return;
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName || `${doc.name}.${doc.fileType || 'pdf'}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export CSV Manifest
  const handleExportCSV = () => {
    if (activeDocs.length === 0) return;
    const headers = ["ID", "Title", "File Name", "Category", "Access Level", "File Size (Bytes)", "File Type", "Uploaded By", "Created At", "URL"];
    const rows = activeDocs.map(d => [
      `"${d.id || ""}"`,
      `"${(d.name || "").replace(/"/g, '""')}"`,
      `"${(d.fileName || "").replace(/"/g, '""')}"`,
      `"${d.category || ""}"`,
      `"${d.accessLevel || ""}"`,
      d.fileSize || 0,
      `"${d.fileType || ""}"`,
      `"${(d.uploadedBy || "").replace(/"/g, '""')}"`,
      `"${d.createdAt || ""}"`,
      `"${d.fileUrl || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_documents_manifest_${activeEventId || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSubTabCategoryForUpload = (tab) => {
    if (tab === "contracts") return "Contracts & Legal";
    if (tab === "sponsorship") return "Sponsorship & Media";
    if (tab === "presentations") return "Speaker Presentations";
    if (tab === "technical") return "Floor Plans & Tech";
    if (tab === "policies") return "Guidelines & Policies";
    return "General";
  };

  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* ─────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS (Logistics style)
      ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("docs.title", "Documents & Media Assets")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("docs.subtitle", "Centralized repository for official event contracts, municipal permits, sponsorship decks, speaker slides, and attendee guidelines. (100 MB Organizer Storage Limit)")}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Export CSV Manifest"
          >
            <Download size={14} />
            <span>Export Manifest (CSV)</span>
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Refresh Data"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold p-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          )}

          <button
            onClick={() => {
              setEditingDoc(null);
              setUploadFileObj(null);
              setUploadError(null);
              setUploadForm({
                name: "",
                category: getSubTabCategoryForUpload(activeTab),
                accessLevel: "team",
                description: "",
                isPinned: false
              });
              setShowUploadModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>{t("docs.uploadBtn", "Add Document")}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. EXECUTIVE KPI CARDS (Logistics style)
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("docs.totalFiles", "Total Documents")}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.totalDocs}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-blue-600 font-bold">{stats.pinnedCount}</span> pinned items across sections
            </div>
          </div>
        </div>

        {/* Card 2: Storage Consumed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("docs.storageUsed", "Storage Used")}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.formattedStorage}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 size={12} /> {stats.percentStorageUsed}% of 100 MB used ({stats.formattedRemaining} free)
            </div>
          </div>
        </div>

        {/* Card 3: Target Audiences */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Audiences</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">4 Levels</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-indigo-600">
              Team, Public, VIPs, Sponsors
            </div>
          </div>
        </div>

        {/* Card 4: Organizer Storage Quota Gauge */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Organizer Storage Quota</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.percentStorageUsed > 90 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">100 MB</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                stats.percentStorageUsed > 90 ? 'bg-rose-100 text-rose-700' : stats.percentStorageUsed > 75 ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
              }`}>
                {stats.formattedRemaining} Free
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  stats.percentStorageUsed > 90 ? 'bg-rose-500' : stats.percentStorageUsed > 75 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.max(2, stats.percentStorageUsed)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. SUB-MODULE TABS NAVIGATION (Logistics style)
      ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveTab("all"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "all"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Files size={15} />
          <span>All Documents</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.all}
          </span>
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("contracts"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "contracts"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck size={15} />
          <span>Contracts & Legal</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "contracts" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.contracts}
          </span>
          {activeTab === "contracts" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("sponsorship"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "sponsorship"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Sparkles size={15} />
          <span>Sponsorship & Media</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "sponsorship" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.sponsorship}
          </span>
          {activeTab === "sponsorship" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("presentations"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "presentations"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Presentation size={15} />
          <span>Speaker Presentations</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "presentations" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.presentations}
          </span>
          {activeTab === "presentations" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("technical"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "technical"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Layers size={15} />
          <span>Technical & Floor Plans</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "technical" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.technical}
          </span>
          {activeTab === "technical" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("policies"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "policies"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Permits & Policies</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "policies" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.policies}
          </span>
          {activeTab === "policies" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("archived"); setAudienceFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "archived"
              ? "text-amber-600 font-black bg-amber-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Archive size={15} />
          <span>Archived</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "archived" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabCounts.archived}
          </span>
          {activeTab === "archived" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-600" />
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          4. SEARCH & FILTER TOOLBAR (Logistics style)
      ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, contracts, presentations, permits, or file names..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Quick Audience / Access & Sort filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-48">
            <SearchableSelect
              value={audienceFilter}
              onChange={(val) => setAudienceFilter(val || "all")}
              options={audienceSelectOptions}
              placeholder="All Audiences"
              buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="w-44">
            <SearchableSelect
              value={sortBy}
              onChange={(val) => setSortBy(val || "newest")}
              options={sortSelectOptions}
              placeholder="Sort by"
              buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          5. DOCUMENT CARDS GRID (Logistics style)
      ───────────────────────────────────────────── */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-150 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || audienceFilter !== "all" || activeTab !== "all"
              ? "No files match your current search and filter combination."
              : "Upload contracts, presentation templates, floor plans, and guidelines to share with your team and attendees."}
          </p>
          <button
            onClick={() => {
              setEditingDoc(null);
              setUploadFileObj(null);
              setUploadError(null);
              setUploadForm({
                name: "",
                category: getSubTabCategoryForUpload(activeTab),
                accessLevel: "team",
                description: "",
                isPinned: false
              });
              setShowUploadModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Add First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const fileCfg = FILE_TYPE_MAP[doc.fileType?.toLowerCase()] || FILE_TYPE_MAP.other;
            const accessCfg = ACCESS_LEVELS.find(a => a.value === doc.accessLevel) || ACCESS_LEVELS[0];
            const percentOfQuota = Math.min(100, Math.max(1, ((Number(doc.fileSize) || 0) / MAX_ORGANIZER_STORAGE_BYTES) * 100));

            return (
              <div
                key={doc.id}
                className={`bg-white p-5 rounded-3xl border shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 group ${
                  doc.isPinned ? "border-amber-300 bg-amber-50/10" : "border-slate-150"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top row: Category pill on left, Access Badge on right */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {doc.category || "General"}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${accessCfg.color}`}>
                      {accessCfg.label}
                    </span>
                  </div>

                  {/* Title and metadata */}
                  <div>
                    <h4 
                      onClick={() => setPreviewDoc(doc)}
                      className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <FileText size={12} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-600 truncate max-w-[150px]">
                        {doc.fileName || `${doc.name}.${fileCfg.ext.toLowerCase()}`}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-slate-700">{formatBytes(doc.fileSize)}</span>
                    </div>
                  </div>

                  {/* Description / Notes bubble */}
                  {doc.description ? (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl line-clamp-2 border border-slate-100 min-h-[42px] leading-relaxed">
                      {doc.description}
                    </p>
                  ) : (
                    <div className="text-[11px] text-slate-400 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 min-h-[42px] flex items-center italic">
                      Uploaded by {doc.uploadedBy || "Event Organizer"}
                    </div>
                  )}
                </div>

                {/* Progress / File Size Bar (Logistics style) */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">File Size:</span>
                      <span className="font-bold text-slate-800">
                        {formatBytes(doc.fileSize)} <span className="text-slate-400 font-normal">({((Number(doc.fileSize) || 0) / MAX_ORGANIZER_STORAGE_BYTES * 100).toFixed(1)}% of 100 MB)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-150 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.max(2, percentOfQuota)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action row at bottom */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePin && onTogglePin(doc.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          doc.isPinned ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                        title={doc.isPinned ? "Unpin document" : "Pin to top"}
                      >
                        <Star size={14} className={doc.isPinned ? "fill-amber-500" : ""} />
                      </button>
                      <button
                        onClick={() => handleCopyLink(doc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy document URL"
                      >
                        {copiedId === doc.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      {!doc.isArchived && (
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit metadata"
                        >
                          <Pencil size={14} />
                        </button>
                      )}

                      {doc.isArchived ? (
                        <button
                          onClick={async () => {
                            if (onSaveDocument) {
                              await onSaveDocument({ ...doc, isArchived: false, status: 'published' });
                            }
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                          title="Restore document"
                        >
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (confirm(`Archive document "${doc.name}"? (Preserved safely in archives)`)) {
                              if (onSaveDocument) {
                                await onSaveDocument({ ...doc, isArchived: true, status: 'archived' });
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Archive Document"
                        >
                          <Archive size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={doc.isArchived ? "Delete permanently" : "Delete document"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: Upload / Edit Document
      ───────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setEditingDoc(null);
                setUploadFileObj(null);
                setUploadError(null);
              }}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <UploadCloud size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingDoc ? "Edit Document Metadata" : "Upload Event Document"}
                </h3>
                <p className="text-xs text-slate-500">
                  Organizer storage quota: 100 MB total capacity.
                </p>
              </div>
            </div>

            {/* Live Storage Meter in Modal */}
            <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Storage Usage:</span>
                <span className="font-bold text-slate-900">
                  {stats.formattedStorage} / 100 MB ({stats.percentStorageUsed}% used)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    stats.percentStorageUsed > 90 ? 'bg-rose-500' : stats.percentStorageUsed > 75 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.max(2, stats.percentStorageUsed)}%` }}
                />
              </div>
            </div>

            {/* Error Banner */}
            {uploadError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Dropzone */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document File <span className="text-rose-500">*</span>
                </label>

                {uploadFileObj ? (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={22} className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {uploadFileObj.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatBytes(uploadFileObj.size)} • {detectFileType(uploadFileObj.name, uploadFileObj.type).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadFileObj(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : editingDoc?.fileUrl ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={22} className="text-slate-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {editingDoc.fileName || editingDoc.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatBytes(editingDoc.fileSize)} • Current Attached File
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-blue-400 bg-slate-50/60"
                    }`}
                  >
                    <UploadCloud size={32} className="mx-auto text-blue-600 mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Click to browse or drag and drop file here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PDF, Word, Excel, PPTX, CSV, Images, or ZIP (Max 10 MB per file)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleValidateAndSelectFile(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.txt,.zip,.png,.jpg,.jpeg,.svg"
                  className="hidden"
                />
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g. Algiers CIC Venue Lease Contract 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              {/* Category Dropdown (SearchableSelect) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category / Classification
                </label>
                <SearchableSelect
                  options={formCategoryOptions}
                  value={uploadForm.category}
                  onChange={(val) => setUploadForm({ ...uploadForm, category: val })}
                  placeholder="Select Category"
                  buttonClassName="py-2.5 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              {/* Audience & Access Level (SearchableSelect) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Audience / Visibility
                </label>
                <SearchableSelect
                  options={formAccessOptions}
                  value={uploadForm.accessLevel}
                  onChange={(val) => setUploadForm({ ...uploadForm, accessLevel: val })}
                  placeholder="Select Access Level"
                  buttonClassName="py-2.5 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description / Operational Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={2}
                  placeholder="Add details, clauses, contact references, or version notes..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium resize-none"
                />
              </div>

              {/* Pin Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinDocumentCheck"
                  checked={uploadForm.isPinned}
                  onChange={(e) => setUploadForm({ ...uploadForm, isPinned: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pinDocumentCheck" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>Pin this document to the top of the dashboard</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setEditingDoc(null);
                  setUploadFileObj(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={handlePerformUpload}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{editingDoc ? "Save Changes" : "Upload Document"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: Document Preview
      ───────────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-7 shadow-2xl border border-slate-200 relative my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 truncate">
                    {previewDoc.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{previewDoc.fileName}</span>
                    <span>•</span>
                    <span>{formatBytes(previewDoc.fileSize)}</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-600">{previewDoc.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyLink(previewDoc)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Copy Link"
                >
                  {copiedId === previewDoc.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Preview Area */}
            <div className="flex-1 overflow-y-auto my-4 bg-slate-950/5 rounded-2xl border border-slate-200 min-h-[360px] flex items-center justify-center p-4">
              {previewDoc.fileType === 'pdf' ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.name}
                  className="w-full h-[540px] rounded-xl bg-white border border-slate-200"
                />
              ) : previewDoc.fileType === 'image' ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.name}
                  className="max-h-[500px] max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : (
                <div className="text-center p-8 max-w-md bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    {previewDoc.name}
                  </h4>
                  <p className="text-xs text-slate-500 mb-5">
                    This file format ({previewDoc.fileType?.toUpperCase()}) can be downloaded or shared directly with authorized recipients.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Download size={14} className="inline mr-1" />
                      Download File ({formatBytes(previewDoc.fileSize)})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Notes */}
            {previewDoc.description && (
              <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Notes: </span>
                {previewDoc.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: Delete Confirmation
      ───────────────────────────────────────────── */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Delete Document?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-800 font-bold">{deletingDoc.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onDeleteDocument) await onDeleteDocument(deletingDoc.id);
                  setDeletingDoc(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
