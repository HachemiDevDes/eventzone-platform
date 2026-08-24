/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  FileText, Plus, Search, Filter, Sparkles, Check, 
  Trash2, Copy, ExternalLink, Eye, Settings, Share2, 
  Download, ChevronDown, ChevronUp, ArrowLeft, BarChart2, 
  ListChecks, MessageSquare, HelpCircle, Send, Smartphone, 
  Monitor, Star, ToggleLeft, ToggleRight, CheckSquare, 
  Radio, Calendar, Hash, Type, AlignLeft, Mail, Phone,
  QrCode, Award, UserCheck, AlertCircle, X, Layers, RefreshCw,
  Lock, Archive, RotateCcw, Globe, MapPin, Camera, Users,
  Briefcase, Megaphone, Target, Presentation, FileSpreadsheet, Paperclip,
  Pencil, Building2, FoldVertical, UnfoldVertical, ArrowUp, ArrowDown
} from "lucide-react";
import QRCode from "qrcode";
import CountryPhoneInput from "./CountryPhoneInput";
import { CountrySelect, CitySelect } from "./LocationInputs";
import SearchableSelect from "./SearchableSelect";
import FormImageUploader from "./FormImageUploader";
import FormFileUploader, { formatFileSize } from "./FormFileUploader";
import { PRESET_SMART_FIELDS, getFormSections } from "../lib/formPresets";

// Available field types in the toolbox
const FIELD_TYPES = [
  // Standard Elements
  { type: "text", label: "Short Text", icon: Type, description: "Single line input for names, titles, URLs", category: "Standard" },
  { type: "textarea", label: "Paragraph", icon: AlignLeft, description: "Multi-line text for feedback and notes", category: "Standard" },
  { type: "phone", label: "Phone Number", icon: Phone, description: "International phone with country code selector", category: "Standard" },
  { type: "country", label: "Country Selector", icon: Globe, description: "Searchable country selector (all world countries)", category: "Standard" },
  { type: "city", label: "City", icon: MapPin, description: "Dynamic city dropdown linked to selected country", category: "Standard" },
  { type: "picture", label: "Badge Picture", icon: Camera, description: "Attendee photo displayed and printed on the official badge", category: "Standard" },
  { type: "email", label: "Email Address", icon: Mail, description: "Validated email input", category: "Standard" },
  { type: "number", label: "Number", icon: Hash, description: "Numeric values, age, quantities", category: "Standard" },
  { type: "date", label: "Date Picker", icon: Calendar, description: "Calendar date selection", category: "Standard" },

  // Files & Documents Elements (Max 10 MB limit)
  { type: "pdf", label: "PDF Document", icon: FileText, description: "Upload PDF files (.pdf) up to 10 MB", category: "Files & Docs" },
  { type: "pptx", label: "PowerPoint Presentation", icon: Presentation, description: "Upload presentation decks (.pptx, .ppt) up to 10 MB", category: "Files & Docs" },
  { type: "excel", label: "Excel Spreadsheet", icon: FileSpreadsheet, description: "Upload spreadsheets (.xlsx, .xls) up to 10 MB", category: "Files & Docs" },
  { type: "csv", label: "CSV Data File", icon: FileSpreadsheet, description: "Upload data files (.csv) up to 10 MB", category: "Files & Docs" },
  { type: "word", label: "Word Document", icon: FileText, description: "Upload text documents (.docx, .doc) up to 10 MB", category: "Files & Docs" },
  { type: "file", label: "Any Document / Attachment", icon: Paperclip, description: "Upload PDF, Word, Excel, PPT, ZIP up to 10 MB", category: "Files & Docs" },

  // Choices & Feedback
  { type: "select", label: "Dropdown Menu", icon: ChevronDown, description: "Single option from a dropdown list", category: "Choices" },
  { type: "radio", label: "Single Choice", icon: Radio, description: "Radio buttons where one option is selected", category: "Choices" },
  { type: "checkbox", label: "Checkboxes", icon: CheckSquare, description: "Multi-select list of checkboxes", category: "Choices" },
  { type: "switch", label: "Yes / No Toggle", icon: ToggleRight, description: "Boolean switch for consent or opt-in", category: "Choices" },
  { type: "rating", label: "5-Star Rating", icon: Star, description: "Interactive 1 to 5 star rating for reviews", category: "Feedback" },
  { type: "nps", label: "NPS Scale (0-10)", icon: BarChart2, description: "Net Promoter Score recommendation scale", category: "Feedback" },
  { type: "section", label: "Section Header", icon: Layers, description: "Splits form into multi-page steps with Next & Back", category: "Layout" },
];

// Core identity fields that are permanently locked and required in every form
export const CORE_LOCKED_FIELDS = [
  {
    id: "f_core_name",
    type: "text",
    label: "Full Name",
    placeholder: "e.g. Alex Morgan",
    required: true,
    isLocked: true,
    options: []
  },
  {
    id: "f_core_email",
    type: "email",
    label: "Email Address",
    placeholder: "alex@company.com",
    required: true,
    isLocked: true,
    options: []
  },
  {
    id: "f_core_phone",
    type: "phone",
    label: "Phone Number",
    placeholder: "550 12 34 56",
    required: true,
    isLocked: true,
    options: []
  }
];

export function ensureCoreLockedFields(fields = []) {
  const current = Array.isArray(fields) ? [...fields] : [];
  
  const hasName = current.some(f => f.id === "f_core_name" || (f.isLocked && f.label?.toLowerCase().includes("name")));
  const hasEmail = current.some(f => f.id === "f_core_email" || (f.isLocked && f.type === "email"));
  const hasPhone = current.some(f => f.id === "f_core_phone" || (f.isLocked && (f.type === "phone" || f.label?.toLowerCase().includes("phone"))));

  const missing = [];
  if (!hasName) missing.push({ ...CORE_LOCKED_FIELDS[0] });
  if (!hasEmail) missing.push({ ...CORE_LOCKED_FIELDS[1] });
  if (!hasPhone) missing.push({ ...CORE_LOCKED_FIELDS[2] });

  const sanitized = current.map(f => {
    if (f.id === "f_core_name" || f.id === "f_core_email") {
      return { ...f, isLocked: true, required: true };
    }
    if (f.id === "f_core_phone") {
      return { ...f, type: "phone", isLocked: true, required: true };
    }
    return f;
  });

  return [...missing, ...sanitized];
}

export default function FormsView({
  forms = [],
  submissions = [],
  tickets = [],
  onSaveForm,
  onDeleteForm,
  onArchiveForm,
  onRestoreForm,
  onSubmitResponse,
  activeEventTitle = "Eventzone Conference"
}) {
  // Mode: "hub" (list) | "builder" (edit/create) | "responses" (view submissions)
  const [viewMode, setViewMode] = useState("hub");
  const [activeFormId, setActiveFormId] = useState(null);

  // Filters in Hub
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Share / QR Modal
  const [shareModalForm, setShareModalForm] = useState(null);
  const [shareQrUrl, setShareQrUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Active form being edited in Builder
  const [editingForm, setEditingForm] = useState(null);
  const [builderTab, setBuilderTab] = useState("fields"); // "fields" | "settings" | "preview" | "submissions"
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "mobile"
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewOtherTexts, setPreviewOtherTexts] = useState({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [previewSectionIdx, setPreviewSectionIdx] = useState(0);
  const [previewSectionErrors, setPreviewSectionErrors] = useState({});

  const isOtherOption = (opt) => {
    if (!opt || typeof opt !== "string") return false;
    const clean = opt.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other") || clean === "autre" || clean.startsWith("autre");
  };

  const isOtherValue = (val) => {
    if (!val || typeof val !== "string") return false;
    const clean = val.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other:") || clean.startsWith("other (") || clean === "autre" || clean.startsWith("autre:") || clean.startsWith("autre (");
  };

  const getOtherTextForPreview = (fieldId, val) => {
    if (previewOtherTexts[fieldId] !== undefined) return previewOtherTexts[fieldId];
    if (typeof val === "string") {
      if (val.toLowerCase().startsWith("other:")) return val.slice(6).trim();
      if (val.toLowerCase().startsWith("autre:")) return val.slice(6).trim();
    }
    return "";
  };

  const handlePreviewSelect = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = previewOtherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      setPreviewAnswers(prev => ({ ...prev, [fieldId]: fullVal }));
    } else {
      setPreviewAnswers(prev => ({ ...prev, [fieldId]: selectedOpt }));
    }
    if (previewSectionErrors[fieldId]) {
      setPreviewSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handlePreviewRadio = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = previewOtherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      setPreviewAnswers(prev => ({ ...prev, [fieldId]: fullVal }));
    } else {
      setPreviewAnswers(prev => ({ ...prev, [fieldId]: selectedOpt }));
    }
    if (previewSectionErrors[fieldId]) {
      setPreviewSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handlePreviewOtherText = (fieldId, text) => {
    setPreviewOtherTexts(prev => ({ ...prev, [fieldId]: text }));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : "Other";
    setPreviewAnswers(prev => ({ ...prev, [fieldId]: fullVal }));
    if (previewSectionErrors[fieldId]) {
      setPreviewSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handlePreviewCheckbox = (fieldId, opt, isChecked) => {
    const currentVals = previewAnswers[fieldId] || [];
    let next;
    if (isChecked) {
      if (isOtherOption(opt)) {
        const existingText = previewOtherTexts[`${fieldId}__other`] || "";
        const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : opt;
        const withoutOther = currentVals.filter(v => !isOtherValue(v));
        next = [...withoutOther, fullVal];
      } else {
        next = [...currentVals, opt];
      }
    } else {
      if (isOtherOption(opt)) {
        next = currentVals.filter(v => !isOtherValue(v));
      } else {
        next = currentVals.filter(v => v !== opt);
      }
    }
    setPreviewAnswers(prev => ({ ...prev, [fieldId]: next }));
    if (previewSectionErrors[fieldId]) {
      setPreviewSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handlePreviewCheckboxOtherText = (fieldId, opt, text) => {
    setPreviewOtherTexts(prev => ({ ...prev, [`${fieldId}__other`]: text }));
    const currentVals = previewAnswers[fieldId] || [];
    const withoutOther = currentVals.filter(v => !isOtherValue(v));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : (opt || "Other");
    setPreviewAnswers(prev => ({ ...prev, [fieldId]: [...withoutOther, fullVal] }));
    if (previewSectionErrors[fieldId]) {
      setPreviewSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  // Multi-page form sections parsed from fields
  const formSections = useMemo(() => {
    return getFormSections(editingForm?.fields || []);
  }, [editingForm?.fields]);

  const safeSectionIdx = Math.min(previewSectionIdx, Math.max(0, formSections.length - 1));
  const currentSec = formSections[safeSectionIdx] || formSections[0] || { fields: [] };
  const isLastSection = safeSectionIdx === formSections.length - 1;
  const isFirstSection = safeSectionIdx === 0;
  const isMultiSection = formSections.length > 1;

  // Question Card Accordion Collapse/Expand States in Canvas
  const [collapsedFields, setCollapsedFields] = useState({});

  const toggleFieldCollapse = (fieldId) => {
    setCollapsedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const collapseAllFields = () => {
    const all = {};
    (editingForm?.fields || []).forEach(f => {
      all[f.id] = true;
    });
    setCollapsedFields(all);
  };

  const expandAllFields = () => {
    setCollapsedFields({});
  };

  const areAllCollapsed = useMemo(() => {
    const fields = editingForm?.fields || [];
    if (fields.length === 0) return false;
    return fields.every(f => Boolean(collapsedFields[f.id]));
  }, [editingForm?.fields, collapsedFields]);

  const onSaveFormRef = useRef(onSaveForm);
  useEffect(() => {
    onSaveFormRef.current = onSaveForm;
  }, [onSaveForm]);

  const saveTimeoutRef = useRef(null);
  const lastSavedJsonRef = useRef(null);

  // Selected Submission Detail Modal
  const [inspectSubmission, setInspectSubmission] = useState(null);

  // Real-time automatic background synchronization of form changes
  useEffect(() => {
    if (!editingForm) return;
    const currentJson = JSON.stringify(editingForm);
    if (lastSavedJsonRef.current === currentJson) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      lastSavedJsonRef.current = currentJson;
      if (onSaveFormRef.current) {
        onSaveFormRef.current(editingForm);
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editingForm]);

  // Submissions for active form
  const activeSubmissions = useMemo(() => {
    if (!activeFormId) return [];
    return submissions.filter(s => s.formId === activeFormId);
  }, [activeFormId, submissions]);

  // Global KPIs across all forms
  const stats = useMemo(() => {
    const nonArchived = forms.filter(f => f.status !== "archived" && !f.isArchived);
    const archivedCount = forms.filter(f => f.status === "archived" || f.isArchived).length;
    const total = nonArchived.length;
    const activeCount = nonArchived.filter(f => f.status === "active").length;
    const ticketForms = nonArchived.filter(f => f.type === "ticket_registration").length;
    const feedbackForms = nonArchived.filter(f => f.type === "feedback_survey" || f.type === "session_survey").length;
    const totalSubs = submissions.length;

    // Calculate average rating across all feedback forms
    const ratingValues = [];
    submissions.forEach(sub => {
      if (sub.answers) {
        Object.values(sub.answers).forEach(val => {
          if (typeof val === "number" && val >= 1 && val <= 5) {
            ratingValues.push(val);
          }
        });
      }
    });

    const avgRating = ratingValues.length > 0
      ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
      : "4.8";

    return { total, activeCount, archivedCount, ticketForms, feedbackForms, totalSubs, avgRating, totalRatings: ratingValues.length };
  }, [forms, submissions]);

  // Filtered forms in Hub
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const isArchived = form.status === "archived" || form.isArchived;
      const matchesSearch = (form.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (form.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCat = true;
      if (selectedCategory === "Ticket Registration") matchesCat = form.type === "ticket_registration";
      else if (selectedCategory === "Feedback & Survey") matchesCat = form.type === "feedback_survey" || form.type === "session_survey";
      else if (selectedCategory === "Inquiries & Proposals") matchesCat = form.type === "general_inquiry";

      let matchesStatus = true;
      if (selectedStatus === "All") matchesStatus = !isArchived;
      else if (selectedStatus === "Archived") matchesStatus = isArchived;
      else if (selectedStatus === "Active") matchesStatus = !isArchived && form.status === "active";
      else if (selectedStatus === "Draft") matchesStatus = !isArchived && form.status === "draft";

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [forms, searchQuery, selectedCategory, selectedStatus]);

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

  // Handle Opening Builder with Blank or Existing Form
  const handleOpenCreateBlank = () => {
    const newForm = {
      id: generateUuid(),
      title: "New Custom Form",
      description: "Enter instructions or context for this form...",
      type: "ticket_registration",
      ticketId: "all",
      status: "active",
      settings: {
        submitButtonText: "Submit",
        successMessage: "Thank you! Your response has been recorded.",
        allowAnonymous: false,
        accentColor: "blue"
      },
      fields: ensureCoreLockedFields([])
    };
    setEditingForm(newForm);
    setActiveFormId(newForm.id);
    setViewMode("builder");
    setBuilderTab("fields");
    if (onSaveForm) onSaveForm(newForm);
  };

  const handleEditForm = (form) => {
    const sanitizedForm = {
      ...JSON.parse(JSON.stringify(form)),
      fields: ensureCoreLockedFields(form.fields)
    };
    setEditingForm(sanitizedForm);
    setActiveFormId(form.id);
    setViewMode("builder");
    setBuilderTab("fields");
  };

  const handleViewResponses = (form) => {
    setEditingForm(JSON.parse(JSON.stringify(form)));
    setActiveFormId(form.id);
    setViewMode("builder");
    setBuilderTab("submissions");
  };

  const handleDuplicateForm = (form) => {
    const cloned = {
      ...JSON.parse(JSON.stringify(form)),
      id: generateUuid(),
      title: `${form.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    if (onSaveForm) onSaveForm(cloned);
  };


  const handleBackToHub = () => {
    if (editingForm && onSaveForm) {
      onSaveForm(editingForm);
    }
    setViewMode("hub");
    setEditingForm(null);
    setActiveFormId(null);
  };

  const handleSaveCurrentForm = () => {
    if (!editingForm) return;
    if (onSaveForm) onSaveForm(editingForm);
  };

  // Field Editor Operations
  const handleAddField = (type) => {
    if (!editingForm) return;
    const typeDef = FIELD_TYPES.find(t => t.type === type) || FIELD_TYPES[0];
    const isSection = type === "section";
    const existingSectionsCount = (editingForm.fields || []).filter(f => f.type === "section").length;

    const newField = {
      id: isSection ? `f_sec_${Date.now()}` : `field_${Date.now()}`,
      type: type,
      label: isSection ? `Section ${existingSectionsCount + 2}: Section Title` : `New ${typeDef.label}`,
      placeholder: isSection ? "" : (type === "text" ? "Type answer here..." : ""),
      helpText: isSection ? "Section instructions or description..." : "",
      required: false,
      options: ["select", "radio", "checkbox"].includes(type) 
        ? ["Option 1", "Option 2", "Option 3"] 
        : [],
      maxRating: type === "rating" ? 5 : undefined,
      defaultValue: type === "switch" ? false : undefined
    };

    setEditingForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleAppendPresetField = (preset) => {
    if (!editingForm) return;
    const newField = {
      id: `f_${preset.id.replace('preset_', '')}_${Date.now()}`,
      type: preset.type,
      label: preset.label,
      placeholder: preset.placeholder || "",
      helpText: preset.description || "",
      required: preset.required ?? false,
      showsOnBadge: Boolean(preset.showsOnBadge),
      options: preset.options ? [...preset.options] : [],
      isLocked: false
    };

    setEditingForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleUpdateField = (fieldId, updates) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const isLocked = f.isLocked || ["f_core_name", "f_core_email", "f_core_phone"].includes(fieldId);
        return {
          ...f,
          ...updates,
          required: isLocked ? true : (updates.required !== undefined ? updates.required : f.required),
          isLocked: isLocked
        };
      })
    }));
  };

  const handleDeleteField = (fieldId) => {
    setEditingForm(prev => {
      const fieldToDelete = (prev.fields || []).find(f => f.id === fieldId);
      if (fieldToDelete?.isLocked || ["f_core_name", "f_core_email", "f_core_phone"].includes(fieldId)) {
        return prev; // Core identity fields cannot be deleted
      }
      return {
        ...prev,
        fields: (prev.fields || []).filter(f => f.id !== fieldId)
      };
    });
  };

  const handleMoveField = (index, direction) => {
    if (!editingForm) return;
    const fields = [...(editingForm.fields || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;
    setEditingForm(prev => ({ ...prev, fields }));
  };

  const handleAddOption = (fieldId) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const currentOpts = f.options || [];
        return {
          ...f,
          options: [...currentOpts, `Option ${currentOpts.length + 1}`]
        };
      })
    }));
  };

  const handleUpdateOption = (fieldId, optIndex, value) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const newOpts = [...(f.options || [])];
        newOpts[optIndex] = value;
        return { ...f, options: newOpts };
      })
    }));
  };

  const handleDeleteOption = (fieldId, optIndex) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const newOpts = (f.options || []).filter((_, i) => i !== optIndex);
        return { ...f, options: newOpts };
      })
    }));
  };

  // Open Share Modal & generate QR
  const handleOpenShare = async (form) => {
    setShareModalForm(form);
    setCopiedLink(false);
    try {
      const shareData = JSON.stringify({
        event: activeEventTitle,
        formId: form.id,
        formTitle: form.title,
        type: form.type,
        url: typeof window !== "undefined" ? `${window.location.origin}/?formId=${form.id}` : ""
      });
      const url = await QRCode.toDataURL(shareData, { width: 240, margin: 1, color: { dark: "#0b5cdb", light: "#ffffff" } });
      setShareQrUrl(url);
    } catch (e) {
      console.warn("QR generation error:", e);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined" && shareModalForm) {
      const shareUrl = `${window.location.origin}/?formId=${shareModalForm.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Export Submissions to CSV
  const handleExportCSV = () => {
    if (!editingForm || activeSubmissions.length === 0) {
      alert("No submissions available to export yet.");
      return;
    }

    const headers = ["Submission ID", "Submitted At", "Respondent Name", "Respondent Email", "Ticket Tier"];
    (editingForm.fields || []).forEach(f => {
      if (f.type !== "section") headers.push(`"${f.label.replace(/"/g, '""')}"`);
    });

    const rows = activeSubmissions.map(sub => {
      const rowData = [
        sub.id,
        new Date(sub.createdAt).toLocaleString(),
        `"${(sub.respondentName || '').replace(/"/g, '""')}"`,
        `"${(sub.respondentEmail || '').replace(/"/g, '""')}"`,
        `"${(sub.ticketTier || '').replace(/"/g, '""')}"`
      ];

      (editingForm.fields || []).forEach(f => {
        if (f.type !== "section") {
          const val = sub.answers ? sub.answers[f.id] : "";
          let formattedVal = "";
          if (Array.isArray(val)) formattedVal = val.join("; ");
          else if (typeof val === "boolean") formattedVal = val ? "Yes" : "No";
          else formattedVal = val !== undefined && val !== null ? String(val) : "";
          rowData.push(`"${formattedVal.replace(/"/g, '""')}"`);
        }
      });

      return rowData.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${editingForm.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Test Form Navigation & Submission in Preview
  const handlePreviewNextSection = (e) => {
    e?.preventDefault?.();
    const safeIdx = Math.min(previewSectionIdx, Math.max(0, formSections.length - 1));
    const currentSec = formSections[safeIdx];
    if (!currentSec) return;

    // Validate required fields in the current section
    const errors = {};
    (currentSec.fields || []).forEach(f => {
      if (f.required && f.type !== "section") {
        const val = previewAnswers[f.id];
        const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          errors[f.id] = "This question requires an answer.";
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setPreviewSectionErrors(errors);
      return;
    }

    setPreviewSectionErrors({});
    setPreviewSectionIdx(prev => Math.min(formSections.length - 1, prev + 1));
  };

  const handlePreviewPrevSection = () => {
    setPreviewSectionErrors({});
    setPreviewSectionIdx(prev => Math.max(0, prev - 1));
  };

  const handlePreviewClearForm = () => {
    setPreviewAnswers({});
    setPreviewSectionErrors({});
    setPreviewSectionIdx(0);
  };

  const handlePreviewSubmit = (e) => {
    e.preventDefault();
    const safeIdx = Math.min(previewSectionIdx, Math.max(0, formSections.length - 1));
    const currentSec = formSections[safeIdx];

    // Validate required fields in final section
    const errors = {};
    (currentSec?.fields || []).forEach(f => {
      if (f.required && f.type !== "section") {
        const val = previewAnswers[f.id];
        const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          errors[f.id] = "This question requires an answer.";
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setPreviewSectionErrors(errors);
      return;
    }

    setPreviewSectionErrors({});
    setPreviewSubmitted(true);
    if (onSubmitResponse && editingForm) {
      onSubmitResponse({
        formId: editingForm.id,
        respondentName: previewAnswers["f_core_name"] || "Preview Test User",
        respondentEmail: previewAnswers["f_core_email"] || "test@eventzone.io",
        ticketTier: editingForm.ticketId === "all" ? "Standard Admission" : editingForm.ticketId,
        answers: previewAnswers
      });
    }
  };

  // =========================================================================
  // VIEW MODE: BUILDER (Visual Drag & Drop, Settings, Preview, Analytics)
  // =========================================================================
  if (viewMode === "builder" && editingForm) {
    return (
      <div className="flex flex-col gap-6 w-full pb-16 animate-fade-in">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-200/80 pb-4">
          {/* Left: Simple Go Back Arrow + Form Title & Meta Info */}
          <div className="flex items-center gap-1.5 min-w-[220px]">
            <button
              type="button"
              onClick={handleBackToHub}
              className="p-1 -ml-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Back to Forms list"
              aria-label="Back to Forms list"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={editingForm.title}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-2 py-0.5 outline-none transition-all"
                  placeholder="Untitled Form"
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium px-2">
                <span>{editingForm.fields?.length || 0} Questions</span>
                <span>•</span>
                <span>{activeSubmissions.length} Submissions</span>
              </div>
            </div>
          </div>

          {/* Right: Builder Navigation Tabs & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-2xs">
              {/* Questions Tab */}
              <button
                onClick={() => setBuilderTab("fields")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  builderTab === "fields" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText size={13} />
                <span>Questions</span>
              </button>

              {/* Responses Tab */}
              <button
                onClick={() => setBuilderTab("submissions")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  builderTab === "submissions" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart2 size={13} />
                <span>Responses</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  builderTab === "submissions" ? "bg-blue-100 text-blue-700" : "bg-slate-200/80 text-slate-600"
                }`}>
                  {activeSubmissions.length}
                </span>
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1"></div>

              {/* Form Settings (Icon Only) */}
              <button
                onClick={() => setBuilderTab("settings")}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                  builderTab === "settings" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
                title="Form Settings"
                aria-label="Form Settings"
              >
                <Settings size={15} />
              </button>

              {/* Live Simulator (Icon Only) */}
              <button
                onClick={() => {
                  setBuilderTab("preview");
                  setPreviewSubmitted(false);
                  setPreviewAnswers({});
                }}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                  builderTab === "preview" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
                title="Live Simulator Preview"
                aria-label="Live Simulator"
              >
                <Eye size={15} />
              </button>

              {/* Share & QR (Icon Only) */}
              <button
                onClick={() => handleOpenShare(editingForm)}
                className="p-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-500 hover:text-slate-900 hover:bg-white/50 relative group"
                title="Share & QR Code"
                aria-label="Share & QR Code"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* =================================================================== */}
        {/* SUB-TAB 1: QUESTIONS BUILDER (Toolbox + Canvas)                      */}
        {/* =================================================================== */}
        {builderTab === "fields" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Toolbox to Add Fields */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-5 sticky top-28">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Question Elements
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click any element to append it to your form.
                </p>
              </div>

              {/* Pre-made Fields & Smart Suggestions */}
              <div className="flex flex-col gap-2.5 bg-gradient-to-b from-blue-50/80 to-indigo-50/40 p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
                    Pre-Made Smart Fields
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_SMART_FIELDS.map(preset => {
                    const PresetIcon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAppendPresetField(preset)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-blue-100/90 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-xs text-left transition-all group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {PresetIcon && <PresetIcon size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                              {preset.label}
                            </span>
                            {preset.showsOnBadge && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[9px] font-extrabold tracking-wide uppercase shadow-2xs">
                                <Award size={9} className="text-amber-600 shrink-0" />
                                <span>Shows on Badge</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {preset.description}
                          </div>
                        </div>
                        <Plus size={13} className="text-blue-400 group-hover:text-blue-700 transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Grouped Field Types */}
              {["Standard", "Files & Docs", "Choices", "Feedback", "Layout"].map(cat => (
                <div key={cat} className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    {cat} Elements
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {FIELD_TYPES.filter(t => t.category === cat).map(ft => {
                      const IconComponent = ft.icon;
                      return (
                        <button
                          key={ft.type}
                          onClick={() => handleAddField(ft.type)}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all shrink-0">
                            {IconComponent && <IconComponent size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {ft.label}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {ft.description}
                            </div>
                          </div>
                          <Plus size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Questions Canvas */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Form Description & Instructions Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col gap-2 relative">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">
                    Form Description & Instructions
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Shown to respondents at the top of the form</span>
                </div>
                <textarea
                  value={editingForm.description}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter greeting, instructions, or context for respondents..."
                  rows={2}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-2xl p-3 outline-none placeholder:text-slate-400 transition-all resize-none shadow-2xs"
                />
              </div>

              {/* Questions List Header with Collapse / Expand All */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ListChecks size={15} className="text-blue-600" />
                    <span>Form Elements & Questions</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {editingForm.fields?.length || 0}
                  </span>
                </div>

                {editingForm.fields?.length > 0 && (
                  <button
                    type="button"
                    onClick={areAllCollapsed ? expandAllFields : collapseAllFields}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:border-slate-300"
                  >
                    {areAllCollapsed ? (
                      <>
                        <UnfoldVertical size={13} className="text-blue-600" />
                        <span>Expand All</span>
                      </>
                    ) : (
                      <>
                        <FoldVertical size={13} className="text-blue-600" />
                        <span>Collapse All</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Questions List */}
              {editingForm.fields?.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ListChecks size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Your form has no questions yet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Choose an element from the toolbox on the left to start building your questions.
                    </p>
                  </div>
                </div>
              ) : (
                editingForm.fields.map((field, index) => {
                  const isLockedField = CORE_LOCKED_FIELDS.some(cf => cf.id === field.id) || field.isLocked;
                  const fieldDef = FIELD_TYPES.find(t => t.type === field.type) || { icon: HelpCircle };
                  const FieldIcon = fieldDef.icon;
                  const isChoice = ["select", "radio", "checkbox"].includes(field.type);
                  const isCollapsed = Boolean(collapsedFields[field.id]);
                  const isShowsOnBadgeField = Boolean(
                    field.showsOnBadge ||
                    field.type === "picture" ||
                    field.id?.includes("picture") ||
                    field.id?.includes("company") ||
                    field.id?.includes("function") ||
                    (field.label && ["badge picture", "attendee photo", "company", "organization", "job function", "job role", "job title"].some(k => field.label.toLowerCase().includes(k)))
                  );

                  if (field.type === "section") {
                    const sectionNumber = (editingForm.fields.slice(0, index).filter(f => f.type === "section").length) + 2;

                    // Collapsed Section Header Card
                    if (isCollapsed) {
                      return (
                        <div
                          key={field.id}
                          onClick={() => toggleFieldCollapse(field.id)}
                          className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-2xl p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group/item"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                              §
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider shrink-0 shadow-2xs">
                              Page Break {sectionNumber}
                            </span>
                            <span className="text-xs font-bold text-blue-950 truncate">
                              {field.label || `Section ${sectionNumber}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleMoveField(index, -1)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveField(index, 1)}
                              disabled={index === editingForm.fields.length - 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <div className="h-4 w-px bg-blue-200 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer font-bold text-xs transition-colors"
                              title="Delete Section Header"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFieldCollapse(field.id)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors"
                              title="Expand Section Header"
                            >
                              <UnfoldVertical size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Expanded Section Header Card
                    return (
                      <div
                        key={field.id}
                        className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border-2 border-dashed border-blue-300 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5 relative group/item hover:border-blue-400 transition-all"
                      >
                        {/* Top Bar: Section Badge, Reorder, Delete, Collapse */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                              §
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                              Page Break & Section Header
                            </span>
                            <span className="text-xs font-bold text-blue-900">
                              (Starts Page {sectionNumber})
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveField(index, -1)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveField(index, 1)}
                              disabled={index === editingForm.fields.length - 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <div className="h-4 w-px bg-blue-200 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer font-bold text-xs transition-colors"
                              title="Delete Section Header"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFieldCollapse(field.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                              title="Collapse Section Header"
                            >
                              <FoldVertical size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Section Title Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                            Section / Page Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            placeholder="e.g. Professional Details or Dietary Preferences"
                            className="w-full px-3.5 py-2 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all shadow-2xs"
                          />
                        </div>

                        {/* Section Subtitle / HelpText Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Section Description / Subtitle (Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={field.helpText || ""}
                            onChange={(e) => handleUpdateField(field.id, { helpText: e.target.value })}
                            placeholder="Provide extra instructions or context for this step..."
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-medium text-slate-800 outline-none transition-all resize-none shadow-2xs"
                          />
                        </div>

                        <div className="text-[11px] text-blue-800 font-medium bg-blue-100/60 rounded-xl p-2.5 flex items-center gap-2">
                          <Layers size={14} className="shrink-0 text-blue-600" />
                          <span>Respondents will fill preceding questions on Page {sectionNumber - 1}, then click <strong>Next</strong> to navigate to this section.</span>
                        </div>
                      </div>
                    );
                  }

                  // Collapsed Question Card (Compact Row View)
                  if (isCollapsed) {
                    return (
                      <div
                        key={field.id}
                        onClick={() => toggleFieldCollapse(field.id)}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group/item"
                      >
                        {/* Left: Number, Icon, Title, Badges */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            {FieldIcon && <FieldIcon size={14} />}
                          </div>
                          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {field.label || "Untitled Question"}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 hidden sm:inline-block">
                              {fieldDef.label}
                            </span>
                            {isLockedField ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                                <Lock size={9} />
                                <span>Core Required</span>
                              </span>
                            ) : (
                              <>
                                {isShowsOnBadgeField && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[9px] font-extrabold uppercase tracking-wider shrink-0 shadow-2xs">
                                    <Award size={9} className="text-amber-600" />
                                    <span>Shows on Badge</span>
                                  </span>
                                )}
                                {field.required && (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60 shrink-0">
                                    Required
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: Reorder Buttons, Delete, Expand */}
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleMoveField(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveField(index, 1)}
                            disabled={index === editingForm.fields.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={13} />
                          </button>

                          <div className="h-4 w-px bg-slate-200 mx-1" />

                          {isLockedField ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 px-1.5 py-1 select-none"
                              title="Core locked identity field"
                            >
                              <Lock size={12} className="text-blue-500" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer font-bold text-xs transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleFieldCollapse(field.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="Expand Question Details"
                          >
                            <UnfoldVertical size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Expanded Question Card (Full Editing View)
                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4 relative group/item hover:border-slate-300 transition-all"
                    >
                      {/* Top Bar: Drag Handle, Number, Title, Actions, Collapse */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            {FieldIcon && <FieldIcon size={14} />}
                          </div>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            className="text-xs font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border-b border-transparent focus:border-blue-600 rounded px-1.5 py-0.5 outline-none flex-1 transition-all"
                            placeholder="Enter question title..."
                          />
                          {isLockedField ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                              <Lock size={10} />
                              <span>Core Required</span>
                            </span>
                          ) : isShowsOnBadgeField ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider shrink-0 shadow-2xs">
                              <Award size={10} className="text-amber-600" />
                              <span>Shows on Badge</span>
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reorder Buttons */}
                          <button
                            type="button"
                            onClick={() => handleMoveField(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveField(index, 1)}
                            disabled={index === editingForm.fields.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={13} />
                          </button>

                          <div className="h-4 w-px bg-slate-200 mx-1" />

                          {/* Delete Field / Locked State */}
                          {isLockedField ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 px-2 py-1 select-none"
                              title="This core attendee identity field is required across all forms and cannot be deleted"
                            >
                              <Lock size={12} className="text-blue-500" />
                              <span>Locked</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer font-bold text-xs transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleFieldCollapse(field.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="Collapse Question"
                          >
                            <FoldVertical size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Question Label Input */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Question Title / Label <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                          placeholder="e.g. Dietary Requirements or Keynote Rating"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                        />
                      </div>

                      {/* Choice Options Manager (for select, radio, checkbox) */}
                      {isChoice && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Answer Choices / Options
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {optIdx + 1}
                                </div>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                                />
                                {(field.options || []).length > 1 && (
                                  <button
                                    onClick={() => handleDeleteOption(field.id, optIdx)}
                                    className="px-1.5 py-0.5 text-slate-400 hover:text-rose-600 font-bold text-sm rounded-md hover:bg-slate-100"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleAddOption(field.id)}
                            className="self-start text-xs font-bold text-blue-600 hover:text-blue-700 mt-1 cursor-pointer"
                          >
                            Add Another Choice
                          </button>
                        </div>
                      )}

                      {/* Placeholder field (for text/textarea/number/email/phone) */}
                      {["text", "textarea", "number", "email", "phone"].includes(field.type) && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {field.type === "phone" ? "Sample / Format Hint" : "Input Placeholder Hint"}
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                            placeholder={field.type === "phone" ? "e.g. 550 12 34 56" : "e.g. Enter your details..."}
                            className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-700 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Country Field Preview Card */}
                      {field.type === "country" && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 font-semibold">
                          <Globe size={16} className="text-blue-600 shrink-0" />
                          <span>Includes all 240+ world countries with instant search autocomplete.</span>
                        </div>
                      )}

                      {/* City Field Preview Card */}
                      {field.type === "city" && (
                        <div className="flex items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-semibold">
                          <MapPin size={16} className="text-indigo-600 shrink-0" />
                          <span>Dynamically populates cities based on the respondent&apos;s selected Country.</span>
                        </div>
                      )}

                      {/* Badge Picture Upload Preview Card */}
                      {field.type === "picture" && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-xs text-emerald-900 font-semibold">
                          <Camera size={16} className="text-emerald-600 shrink-0" />
                          <span>Attendee photo displayed and printed directly on the official conference badge.</span>
                        </div>
                      )}

                      {/* Shows on Badge Notice Card (for non-picture badge fields like Company and Job Function) */}
                      {isShowsOnBadgeField && field.type !== "picture" && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 font-semibold shadow-2xs">
                          <Award size={16} className="text-amber-600 shrink-0" />
                          <span>This information is automatically formatted and printed directly on the attendee&apos;s conference badge.</span>
                        </div>
                      )}

                      {/* PDF Document Preview Card */}
                      {field.type === "pdf" && (
                        <div className="flex items-center justify-between p-3 bg-rose-50/60 border border-rose-100 rounded-2xl text-xs text-rose-900 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <FileText size={16} className="text-rose-600 shrink-0" />
                            <span>PDF Document Upload (.pdf)</span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-700 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                            Max 10 MB
                          </span>
                        </div>
                      )}

                      {/* Word Document Preview Card */}
                      {field.type === "word" && (
                        <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <FileText size={16} className="text-blue-600 shrink-0" />
                            <span>Microsoft Word Document (.docx, .doc)</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                            Max 10 MB
                          </span>
                        </div>
                      )}

                      {/* Excel Spreadsheet Preview Card */}
                      {field.type === "excel" && (
                        <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-xs text-emerald-900 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
                            <span>Excel Spreadsheet (.xlsx, .xls)</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                            Max 10 MB
                          </span>
                        </div>
                      )}

                      {/* CSV Data File Preview Card */}
                      {field.type === "csv" && (
                        <div className="flex items-center justify-between p-3 bg-teal-50/60 border border-teal-100 rounded-2xl text-xs text-teal-900 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <FileSpreadsheet size={16} className="text-teal-600 shrink-0" />
                            <span>CSV Data File (.csv)</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-700 bg-white px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                            Max 10 MB
                          </span>
                        </div>
                      )}

                      {/* PowerPoint Presentation Preview Card */}
                      {field.type === "pptx" && (
                        <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs text-amber-900 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <Presentation size={16} className="text-amber-600 shrink-0" />
                            <span>PowerPoint Presentation (.pptx, .ppt)</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                            Max 10 MB
                          </span>
                        </div>
                      )}

                      {/* Any Document / Attachment Preview Card */}
                      {field.type === "file" && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <Paperclip size={16} className="text-indigo-600 shrink-0" />
                            <span>Supporting Document (PDF, Word, Excel, PPT, ZIP)</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                            Max 10 MB
                          </span>
                        </div>
                      )}

                      {/* Rating Scale Details */}
                      {field.type === "rating" && (
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3">
                          <Star size={16} className="text-amber-500 fill-amber-500" />
                          <span>5-Star Interactive Rating Scale with live score analytics.</span>
                        </div>
                      )}

                      {/* Required Toggle Footer */}
                      {field.type !== "section" && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isLockedField ? true : (field.required ?? false)}
                              disabled={isLockedField}
                              onChange={(e) => !isLockedField && handleUpdateField(field.id, { required: e.target.checked })}
                              className={`rounded text-blue-600 focus:ring-blue-500 h-4 w-4 ${
                                isLockedField ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                              }`}
                            />
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <span>Required Question</span>
                              {isLockedField && (
                                <span className="text-[10px] text-blue-600 font-semibold">(Mandatory Core Input)</span>
                              )}
                            </span>
                          </label>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isLockedField 
                              ? "Core mandatory requirement for all submissions"
                              : (field.required ? "Attendee must answer before submission" : "Optional for attendee")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 2: FORM SETTINGS                                            */}
        {/* =================================================================== */}
        {builderTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs flex flex-col gap-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Form Configuration & Target</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure who sees this form, where responses are routed, and post-submission confirmations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Form Category & Purpose
                </label>
                <SearchableSelect
                  value={editingForm.type}
                  onChange={(val) => setEditingForm(prev => ({ ...prev, type: val }))}
                  options={[
                    { value: "ticket_registration", label: "Ticket Registration & Checkout Intake" },
                    { value: "feedback_survey", label: "Post-Event Attendee Feedback & CSAT" },
                    { value: "session_survey", label: "Breakout Session / Speaker Evaluation" },
                    { value: "general_inquiry", label: "Call for Papers & General Inquiries" }
                  ]}
                  placeholder="Select category..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Publication Status
                </label>
                <SearchableSelect
                  value={editingForm.status}
                  onChange={(val) => setEditingForm(prev => ({ ...prev, status: val }))}
                  options={[
                    { value: "active", label: "Active (Accepting Responses)" },
                    { value: "draft", label: "Draft (Hidden from Public)" },
                    { value: "archived", label: "Archived" }
                  ]}
                  placeholder="Select status..."
                />
              </div>
            </div>

            {/* Linked Tickets Info (Manual ticket-to-form linking via Ticket Editor) */}
            {(() => {
              const linkedTickets = (tickets || []).filter(t => t.formId === editingForm.id || t.form_id === editingForm.id);
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Linked Tickets</span>
                    <span className="text-[11px] font-semibold text-slate-500">Configured in Ticket Editor</span>
                  </div>
                  {linkedTickets.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {linkedTickets.map(t => (
                        <span key={t.id || t.tier || t.name} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs">
                          {t.name || t.tier}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      This form is currently not linked to any ticket tier. You can link it to any ticket when creating or editing tickets in the Tickets dashboard.
                    </span>
                  )}
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Submit Button Text
              </label>
              <input
                type="text"
                value={editingForm.settings?.submitButtonText || "Submit"}
                onChange={(e) => setEditingForm(prev => ({
                  ...prev,
                  settings: { ...(prev.settings || {}), submitButtonText: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Post-Submission Success Message
              </label>
              <textarea
                value={editingForm.settings?.successMessage || ""}
                onChange={(e) => setEditingForm(prev => ({
                  ...prev,
                  settings: { ...(prev.settings || {}), successMessage: e.target.value }
                }))}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Allow Anonymous Submissions</span>
                <span className="text-[11px] text-slate-400">Great for candid attendee reviews and ratings</span>
              </div>
              <input
                type="checkbox"
                checked={editingForm.settings?.allowAnonymous || false}
                onChange={(e) => setEditingForm(prev => ({
                  ...prev,
                  settings: { ...(prev.settings || {}), allowAnonymous: e.target.checked }
                }))}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 3: LIVE SIMULATOR / PREVIEW                                 */}
        {/* =================================================================== */}
        {builderTab === "preview" && (
          <div className="flex flex-col items-center gap-6">
            {/* Device Switcher */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-xs">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewDevice === "desktop" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                }`}
              >
                Desktop Screen
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewDevice === "mobile" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                }`}
              >
                Mobile Device (375px)
              </button>
            </div>

            {/* Simulated Frame */}
            <div className={`w-full transition-all duration-300 ${
              previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"
            }`}>
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
                {previewSubmitted ? (
                  <div className="text-center py-10 flex flex-col items-center gap-4 animate-scale-up">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Submission Successful</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {editingForm.settings?.successMessage || "Thank you! Your response has been recorded."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPreviewSubmitted(false);
                        setPreviewAnswers({});
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 cursor-pointer"
                    >
                      Test Again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={isLastSection ? handlePreviewSubmit : handlePreviewNextSection} className="flex flex-col gap-5">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                        {activeEventTitle}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">{editingForm.title}</h2>
                      {editingForm.description && (
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                          {editingForm.description}
                        </p>
                      )}
                    </div>

                    {/* Multi-Step Section Stepper & Progress Bar */}
                    {isMultiSection && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wide">
                              Section {safeSectionIdx + 1} of {formSections.length}
                            </span>
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">
                              {currentSec.title || `Step ${safeSectionIdx + 1}`}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">
                            {Math.round(((safeSectionIdx + 1) / formSections.length) * 100)}% Complete
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${((safeSectionIdx + 1) / formSections.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Section Description / Subtitle Banner if provided */}
                    {currentSec.description && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 text-xs text-blue-900 font-medium">
                        {currentSec.description}
                      </div>
                    )}

                    {/* Question Rendering for Current Section */}
                    {(currentSec.fields || []).filter(f => f.type !== "section").map(field => {
                      const hasError = Boolean(previewSectionErrors[field.id]);

                      return (
                        <div key={field.id} className={`flex flex-col gap-1.5 p-3 rounded-2xl transition-all ${
                          hasError ? "bg-rose-50/50 border border-rose-200" : ""
                        }`}>
                          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>{field.label}</span>
                              {field.required && <span className="text-rose-500">*</span>}
                            </span>
                            {hasError && (
                              <span className="text-[10px] font-bold text-rose-600">
                                {previewSectionErrors[field.id]}
                              </span>
                            )}
                          </label>

                          {field.helpText && (
                            <span className="text-[11px] text-slate-400 -mt-0.5 mb-1 font-medium">
                              {field.helpText}
                            </span>
                          )}

                          {/* Phone Number with Country Code Picker */}
                          {(field.type === "phone" || field.id === "f_core_phone") && (
                            <CountryPhoneInput
                              value={previewAnswers[field.id] || ""}
                              onChange={(val) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: val }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || ""}
                              required={field.required}
                            />
                          )}

                          {/* Country Selector */}
                          {field.type === "country" && (
                            <CountrySelect
                              value={previewAnswers[field.id] || ""}
                              onChange={(val) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: val }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || "Select your country..."}
                              required={field.required}
                            />
                          )}

                          {/* Dynamic City Selector (linked to country) */}
                          {field.type === "city" && (
                            <CitySelect
                              value={previewAnswers[field.id] || ""}
                              country={
                                previewAnswers["f_country"] || 
                                previewAnswers["country"] || 
                                Object.entries(previewAnswers).find(([k]) => k.toLowerCase().includes("country"))?.[1] || 
                                ""
                              }
                              onChange={(val) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: val }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || "Select or enter your city..."}
                              required={field.required}
                            />
                          )}

                          {/* Profile Picture / Photo Upload */}
                          {field.type === "picture" && (
                            <FormImageUploader
                              value={previewAnswers[field.id] || ""}
                              onChange={(val) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: val }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || "Upload your photo from phone or computer"}
                              required={field.required}
                            />
                          )}

                          {/* File & Document Uploaders (PDF, Word, Excel, CSV, PPTX, File) */}
                          {["pdf", "word", "excel", "csv", "pptx", "file"].includes(field.type) && (
                            <FormFileUploader
                              fileType={field.type}
                              value={previewAnswers[field.id] || ""}
                              onChange={(val) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: val }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || ""}
                              required={field.required}
                            />
                          )}

                          {/* Short text / Number / Email / Date */}
                          {["text", "number", "email", "date"].includes(field.type) && field.id !== "f_core_phone" && (
                            <input
                              type={field.type}
                              value={previewAnswers[field.id] || ""}
                              onChange={(e) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.value }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || ""}
                              required={field.required}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                            />
                          )}

                          {/* Textarea */}
                          {field.type === "textarea" && (
                            <textarea
                              rows={3}
                              value={previewAnswers[field.id] || ""}
                              onChange={(e) => {
                                setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.value }));
                                if (previewSectionErrors[field.id]) {
                                  setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                }
                              }}
                              placeholder={field.placeholder || ""}
                              required={field.required}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all resize-none"
                            />
                          )}

                          {/* Dropdown Select */}
                          {field.type === "select" && (
                            <div className="flex flex-col gap-2">
                              <SearchableSelect
                                value={isOtherValue(previewAnswers[field.id]) ? ((field.options || []).find(o => isOtherOption(o)) || "Other") : (previewAnswers[field.id] || "")}
                                onChange={(val) => handlePreviewSelect(field.id, val)}
                                options={field.options || []}
                                placeholder="Select an option..."
                                searchPlaceholder="Search choices..."
                                required={field.required}
                              />
                              {isOtherValue(previewAnswers[field.id]) && (
                                <div className="animate-fade-in flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                                  <input
                                    type="text"
                                    required={field.required}
                                    value={getOtherTextForPreview(field.id, previewAnswers[field.id])}
                                    onChange={(e) => handlePreviewOtherText(field.id, e.target.value)}
                                    placeholder="Please specify / Type what's other..."
                                    className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                    autoFocus
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Radio Single Choice */}
                          {field.type === "radio" && (
                            <div className="flex flex-col gap-2 mt-1">
                              {(field.options || []).map((opt, i) => {
                                const isOtherOpt = isOtherOption(opt);
                                const isChecked = isOtherOpt
                                  ? isOtherValue(previewAnswers[field.id])
                                  : previewAnswers[field.id] === opt;

                                return (
                                  <div key={i} className="flex flex-col gap-1.5">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`preview_${field.id}`}
                                        value={opt}
                                        checked={isChecked}
                                        onChange={() => handlePreviewRadio(field.id, opt)}
                                        required={field.required && !previewAnswers[field.id]}
                                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                      />
                                      <span className="text-xs font-semibold text-slate-800">{opt}</span>
                                    </label>
                                    {isOtherOpt && isChecked && (
                                      <div className="ml-6 animate-fade-in">
                                        <input
                                          type="text"
                                          required={field.required}
                                          value={getOtherTextForPreview(field.id, previewAnswers[field.id])}
                                          onChange={(e) => handlePreviewOtherText(field.id, e.target.value)}
                                          placeholder="Please specify / Type what's other..."
                                          className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                          autoFocus
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Checkbox Multi-Select */}
                          {field.type === "checkbox" && (
                            <div className="flex flex-col gap-2 mt-1">
                              {(field.options || []).map((opt, i) => {
                                const currentVals = previewAnswers[field.id] || [];
                                const isOtherOpt = isOtherOption(opt);
                                const isChecked = isOtherOpt
                                  ? currentVals.some(x => isOtherValue(x))
                                  : currentVals.includes(opt);

                                const otherItem = isOtherOpt ? currentVals.find(x => isOtherValue(x)) : null;

                                return (
                                  <div key={i} className="flex flex-col gap-1.5">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handlePreviewCheckbox(field.id, opt, e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                      />
                                      <span className="text-xs font-semibold text-slate-800">{opt}</span>
                                    </label>
                                    {isOtherOpt && isChecked && (
                                      <div className="ml-6 animate-fade-in">
                                        <input
                                          type="text"
                                          value={previewOtherTexts[`${field.id}__other`] || (otherItem && isOtherValue(otherItem) && otherItem.startsWith("Other: ") ? otherItem.slice(7) : "")}
                                          onChange={(e) => handlePreviewCheckboxOtherText(field.id, opt, e.target.value)}
                                          placeholder="Please specify / Type what's other..."
                                          className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                          autoFocus
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 5-Star Rating */}
                          {field.type === "rating" && (
                            <div className="flex items-center gap-2 mt-1">
                              {[1, 2, 3, 4, 5].map(star => {
                                const currentRating = previewAnswers[field.id] || 0;
                                const isSelected = star <= currentRating;
                                return (
                                  <button
                                    type="button"
                                    key={star}
                                    onClick={() => {
                                      setPreviewAnswers(prev => ({ ...prev, [field.id]: star }));
                                      if (previewSectionErrors[field.id]) {
                                        setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                                  >
                                    <Star
                                      size={26}
                                      className={isSelected ? "text-amber-500 fill-amber-500" : "text-slate-300 hover:text-amber-400"}
                                    />
                                  </button>
                                );
                              })}
                              {previewAnswers[field.id] && (
                                <span className="text-xs font-bold text-amber-600 ml-2">
                                  {previewAnswers[field.id]} / 5 Stars
                                </span>
                              )}
                            </div>
                          )}

                          {/* NPS Scale 0 to 10 */}
                          {field.type === "nps" && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                                  const isSelected = previewAnswers[field.id] === score;
                                  return (
                                    <button
                                      type="button"
                                      key={score}
                                      onClick={() => {
                                        setPreviewAnswers(prev => ({ ...prev, [field.id]: score }));
                                        if (previewSectionErrors[field.id]) {
                                          setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                        }
                                      }}
                                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-110"
                                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-1">
                                <span>Not Likely</span>
                                <span>Extremely Likely</span>
                              </div>
                            </div>
                          )}

                          {/* Yes/No Switch */}
                          {field.type === "switch" && (
                            <label className="flex items-center gap-3 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={previewAnswers[field.id] ?? field.defaultValue ?? false}
                                onChange={(e) => {
                                  setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.checked }));
                                  if (previewSectionErrors[field.id]) {
                                    setPreviewSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                              <span className="text-xs font-semibold text-slate-700">
                                {previewAnswers[field.id] ? "Yes, consented" : "No"}
                              </span>
                            </label>
                          )}
                        </div>
                      );
                    })}

                    {/* Section Validation Error Banner */}
                    {Object.keys(previewSectionErrors).length > 0 && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-rose-600" />
                        <span>Please answer all required questions in this section before continuing.</span>
                      </div>
                    )}

                    {/* Navigation Footer: Back, Next/Submit, Clear form */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-2.5">
                        {!isFirstSection && (
                          <button
                            type="button"
                            onClick={handlePreviewPrevSection}
                            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                          >
                            Back
                          </button>
                        )}

                        {!isLastSection ? (
                          <button
                            type="button"
                            onClick={handlePreviewNextSection}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Next</span>
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{editingForm.settings?.submitButtonText || "Submit Response"}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handlePreviewClearForm}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Clear form
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 4: SUBMISSIONS & ANALYTICS                                  */}
        {/* =================================================================== */}
        {builderTab === "submissions" && (
          <div className="flex flex-col gap-6">
            {/* Header & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submissions & Analytics ({activeSubmissions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time responses submitted by attendees and ticket holders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={activeSubmissions.length === 0}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Ratings & Choice Analytics Cards */}
            {(editingForm.fields || []).some(f => ["rating", "nps"].includes(f.type)) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(editingForm.fields || []).filter(f => f.type === "rating").map(rf => {
                  const ratings = activeSubmissions
                    .map(s => s.answers?.[rf.id])
                    .filter(v => typeof v === "number");
                  const avg = ratings.length > 0
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : "0.0";
                  
                  return (
                    <div key={rf.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Average Rating
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">{rf.label}</h4>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-3xl font-extrabold text-slate-900">{avg}</span>
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={18}
                                className={s <= Math.round(Number(avg)) ? "fill-amber-500 text-amber-500" : "text-slate-200"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold mt-4">
                        Based on {ratings.length} attendee reviews
                      </span>
                    </div>
                  );
                })}

                {/* Submissions count card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Total Responses
                    </span>
                    <div className="text-3xl font-extrabold text-slate-900 mt-2">{activeSubmissions.length}</div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-4">
                    100% submission integrity
                  </span>
                </div>
              </div>
            )}

            {/* Submissions Data Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              {activeSubmissions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No submissions have been recorded for this form yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Respondent</th>
                        <th className="py-3.5 px-4">Ticket Tier</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Sample Answers</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900">{sub.respondentName || "Anonymous"}</div>
                            <div className="text-[11px] text-slate-400">{sub.respondentEmail || "No email provided"}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              {sub.ticketTier || "Standard"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {new Date(sub.createdAt).toLocaleDateString()} at {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                            {sub.answers ? (
                              Object.entries(sub.answers)
                                .slice(0, 2)
                                .map(([k, v]) => `${k.replace('field_', '')}: ${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : Array.isArray(v) ? v.join(', ') : v}`)
                                .join(' · ')
                            ) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setInspectSubmission(sub)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              View Full Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Detail Modal */}
        {inspectSubmission && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Submission Details</h3>
                  <p className="text-xs text-slate-400">
                    Recorded {new Date(inspectSubmission.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setInspectSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Respondent Info */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{inspectSubmission.respondentName}</div>
                  <div className="text-xs text-slate-500">{inspectSubmission.respondentEmail}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                  {inspectSubmission.ticketTier}
                </span>
              </div>

              {/* Answer breakdown */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Submitted Question Responses
                </span>
                {(editingForm.fields || []).filter(f => f.type !== "section").map(f => {
                  const val = inspectSubmission.answers ? inspectSubmission.answers[f.id] : null;
                  return (
                    <div key={f.id} className="border-b border-slate-100 pb-2.5">
                      <div className="text-xs font-bold text-slate-700">{f.label}</div>
                      <div className="text-xs font-semibold text-slate-900 mt-1">
                        {val === null || val === undefined ? (
                          <span className="text-slate-400 italic">No response</span>
                        ) : typeof val === "boolean" ? (
                          val ? "Yes / Confirmed" : "No"
                        ) : f.type === "rating" ? (
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            {val} / 5 Stars ⭐
                          </span>
                        ) : f.type === "picture" ? (
                          <div className="mt-1">
                            {typeof val === "string" && val.startsWith("data:image") ? (
                              <img src={val} alt="Attendee Photo" className="w-16 h-16 object-cover rounded-2xl border border-slate-200 shadow-2xs" />
                            ) : (
                              <span>{String(val?.name || val)}</span>
                            )}
                          </div>
                        ) : ["pdf", "word", "excel", "csv", "pptx", "file"].includes(f.type) || (typeof val === "object" && val?.name) ? (
                          <div className="mt-1 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={16} className="text-blue-600 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                                  {val.name || String(val)}
                                </span>
                                {val.size && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {formatFileSize(val.size)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {val.url && (
                              <a
                                href={val.url}
                                download={val.name || "document"}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-blue-600 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
                                title="Download Document"
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        ) : Array.isArray(val) ? (
                          val.join(", ")
                        ) : (
                          String(val)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setInspectSubmission(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: HUB (All Forms Overview, Template Library, Stat Cards)
  // =========================================================================
  return (
    <div className="flex flex-col gap-8 w-full pb-16 animate-fade-in">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Forms & Surveys Builder</h2>
          <p className="text-sm text-slate-500">
            Build custom ticket registration intake questionnaires, feedback CSAT forms, and speaker proposals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateBlank}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            Create Form
          </button>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Forms</span>
              <FileText size={18} className="text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total}</div>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-4 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {stats.activeCount} active & accepting responses
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Ticket Questionnaires</span>
              <UserCheck size={18} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.ticketForms}</div>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold mt-4">
            Linked to ticket checkout flows
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Submissions</span>
              <MessageSquare size={18} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.totalSubs}</div>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold mt-4">
            Responses saved in database
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Attendee Rating</span>
              <Star size={18} className="text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
              <span>{stats.avgRating}</span>
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </div>
          </div>
          <span className="text-[11px] text-amber-600 font-bold mt-4">
            ⭐ CSAT Score: {((Number(stats.avgRating) / 5) * 100).toFixed(0)}% Positive
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forms by title or question..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 rounded-2xl text-xs font-semibold text-slate-900 outline-none shadow-xs transition-all"
          />
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex items-center gap-3 overflow-x-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {["All", "Active", "Draft", "Archived"].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedStatus === st
                    ? st === "Archived" ? "bg-slate-700 text-white shadow-xs" : "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st} {st === "Archived" ? `(${stats.archivedCount})` : st === "Active" ? `(${stats.activeCount})` : ""}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {["All", "Ticket Registration", "Feedback & Survey", "Inquiries & Proposals"].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Cards Grid */}
      {filteredForms.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={26} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedStatus === "Archived" ? "No archived forms" : "No forms found"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {selectedStatus === "Archived" 
                ? "Archived forms will appear here safely preserved." 
                : "Create a custom form to start collecting responses."}
            </p>
          </div>
          {selectedStatus !== "Archived" && (
            <button
              onClick={handleOpenCreateBlank}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all"
            >
              Create Form
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => {
            const isArchived = form.status === "archived" || form.isArchived;
            const formSubs = submissions.filter(s => s.formId === form.id);
            const isTicket = form.type === "ticket_registration";
            const isFeedback = form.type === "feedback_survey" || form.type === "session_survey";

            return (
              <div
                key={form.id}
                className={`bg-white border ${isArchived ? "border-slate-300 opacity-75" : "border-slate-200"} rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-5 group`}
              >
                {/* Header info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isTicket ? "bg-emerald-100 text-emerald-700" :
                      isFeedback ? "bg-violet-100 text-violet-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {form.type.replace(/_/g, " ")}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isArchived ? "bg-slate-200 text-slate-700 font-extrabold" :
                      form.status === "active" ? "bg-emerald-50 text-emerald-700 font-extrabold" : "bg-slate-100 text-slate-500"
                    }`}>
                      {isArchived ? "Archived" : form.status === "active" ? "● Active" : "Draft"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {form.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                      {form.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
                    <span>{form.fields?.length || 0} Questions</span>
                    <span>·</span>
                    <span className="text-slate-700 font-bold">{formSubs.length} Submissions</span>
                  </div>
                </div>

                {/* Card Actions (Grouped & Right Aligned) */}
                <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3.5">
                  <button
                    onClick={() => handleEditForm(form)}
                    className="p-2 bg-blue-50 hover:bg-blue-100/80 text-blue-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="Edit Form"
                    aria-label="Edit Form"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => handleViewResponses(form)}
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-center"
                    title="Analytics & Responses"
                    aria-label="Analytics & Responses"
                  >
                    <BarChart2 size={15} />
                  </button>

                  {!isArchived && (
                    <button
                      onClick={() => handleOpenShare(form)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-center"
                      title="Share / QR Code"
                      aria-label="Share Form"
                    >
                      <Share2 size={15} />
                    </button>
                  )}

                  {!isArchived && (
                    <button
                      onClick={() => handleDuplicateForm(form)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                      title="Duplicate Form"
                      aria-label="Duplicate Form"
                    >
                      <Copy size={15} />
                    </button>
                  )}

                  {isArchived ? (
                    <button
                      onClick={() => {
                        if (onSaveForm) onSaveForm({ ...form, status: "active", isArchived: false });
                        else if (onRestoreForm) onRestoreForm(form.id);
                      }}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-center"
                      title="Restore Form"
                      aria-label="Restore Form"
                    >
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm(`Archive "${form.title}"? (Form and submission records safely preserved in archives)`)) {
                          if (onArchiveForm) onArchiveForm(form.id);
                          else if (onDeleteForm) onDeleteForm(form.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-center"
                      title="Archive Form"
                      aria-label="Archive Form"
                    >
                      <Archive size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SHARE / QR CODE MODAL                                                 */}
      {/* ===================================================================== */}
      {shareModalForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 max-w-md w-full shadow-2xl flex flex-col gap-6 text-center animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900">Share Form & QR Code</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{shareModalForm.title}</p>
              </div>
              <button
                onClick={() => setShareModalForm(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-2xl p-6 border border-slate-100">
              {shareQrUrl ? (
                <img src={shareQrUrl} alt="Form QR Code" className="w-48 h-48 rounded-xl shadow-xs" />
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <span className="text-xs text-slate-500 font-semibold">
                Scan on mobile to open live feedback form
              </span>
            </div>

            {/* Share Link Copy */}
            <button
              onClick={handleCopyShareLink}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center cursor-pointer"
            >
              <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Direct Public Link"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
