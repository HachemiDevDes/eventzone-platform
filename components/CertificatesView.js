/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Award,
  Sparkles,
  Printer,
  Download,
  Upload,
  Search,
  Check,
  Plus,
  Trash2,
  Edit3,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Building2,
  Mic2,
  Store,
  Palette,
  FileText,
  Save,
  ShieldCheck,
  FileCheck,
  Type,
  Image as ImageIcon,
  Copy,
  Sliders,
  Move,
  ChevronDown,
  ChevronUp,
  Pipette,
  Bold,
  Italic,
  Mail,
  Send,
  Loader2,
  AlertCircle
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import FormImageUploader from "./FormImageUploader";
import A4CertificateSheet, { printA4CertificatesDocument } from "./A4CertificateSheet";
import { toPng } from "html-to-image";
import {
  DEFAULT_CERTIFICATE_TEMPLATES,
  CERTIFICATE_CATEGORIES,
  FONT_PAIRINGS,
  CALLIGRAPHY_SIGNATURES,
  BORDER_STYLES,
  interpolateCertificateText
} from "../lib/certificatePresets";
import { useLanguage } from "../lib/i18n";
import {
  fetchCertificateTemplates,
  upsertCertificateTemplate,
  deleteCertificateTemplate
} from "../lib/db";
import { CertificatesSkeleton } from "./SkeletonLoaders";

const ACCENT_COLORS = [
  { name: "Executive Gold", color: "#D4AF37", bg: "bg-amber-500" },
  { name: "Royal Navy", color: "#1D4ED8", bg: "bg-blue-700" },
  { name: "Emerald Honor", color: "#059669", bg: "bg-emerald-600" },
  { name: "Crimson Prestige", color: "#991B1B", bg: "bg-red-800" },
  { name: "Imperial Bronze", color: "#C2410C", bg: "bg-orange-700" },
  { name: "Royal Purple", color: "#7C3AED", bg: "bg-purple-600" },
  { name: "Cyan Cyber", color: "#06B6D4", bg: "bg-cyan-500" },
  { name: "Obsidian Slate", color: "#1E293B", bg: "bg-slate-800" },
];

const FONT_STYLE_OPTIONS = [
  // Regal & Diplomatic Serifs
  { value: "cinzel", label: "Cinzel (Regal Classical Serif)" },
  { value: "cinzel-decorative", label: "Cinzel Decorative (Ornate Roman Serif)" },
  { value: "playfair", label: "Playfair Display (Editorial Serif)" },
  { value: "cormorant", label: "Cormorant Garamond (Academic Serif)" },
  { value: "eb-garamond", label: "EB Garamond (Renaissance Serif)" },
  { value: "libre-baskerville", label: "Libre Baskerville (Prestige Serif)" },
  { value: "lora", label: "Lora (Contemporary Serif)" },
  { value: "merriweather", label: "Merriweather (Sturdy Serif)" },
  { value: "bodoni", label: "Bodoni Moda (Luxury Fashion Serif)" },
  { value: "marcellus", label: "Marcellus (Roman Inscriptional)" },
  { value: "prata", label: "Prata (Didone Royal Serif)" },
  
  // Clean Modern Sans
  { value: "montserrat", label: "Montserrat (Geometric Modern Sans)" },
  { value: "sans", label: "Plus Jakarta (Ultra Clean Modern Sans)" },
  { value: "poppins", label: "Poppins (Friendly Geometric Sans)" },
  { value: "inter", label: "Inter (Crisp Neutral Sans)" },
  { value: "outfit", label: "Outfit (Modernist Sans)" },
  { value: "raleway", label: "Raleway (Refined Elegant Sans)" },
  { value: "oswald", label: "Oswald (Condensed Bold Sans)" },
  { value: "space-grotesk", label: "Space Grotesk (Tech Modernist)" },
  
  // Calligraphy & Scripts
  { value: "cursive", label: "Great Vibes (Flourished Calligraphy)" },
  { value: "alex-brush", label: "Alex Brush (Flowing Cursive Script)" },
  { value: "pinyon", label: "Pinyon Script (Victorian Formal)" },
  { value: "dancing", label: "Dancing Script (Casual Script)" },
  { value: "parisienne", label: "Parisienne (French Elegant Script)" },
  { value: "satisfy", label: "Satisfy (Artisanal Hand-lettered)" },
  
  // Technical & Monospace
  { value: "mono", label: "Monospace (Serial / Technical)" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal (400)" },
  { value: "medium", label: "Medium (500)" },
  { value: "semibold", label: "SemiBold (600)" },
  { value: "bold", label: "Bold (700)" },
  { value: "extrabold", label: "Extra Bold (800)" },
  { value: "black", label: "Black (900)" },
];

export default function CertificatesView({
  state = {},
  onUpdateState,
  onUploadFile,
  onSwitchView,
}) {
  const { t, lang, isRTL } = useLanguage();

  const {
    eventDetails = {},
    attendees = [],
    sessions = [],
    sponsors = [],
    exhibitors = [],
    organizations = [],
    tickets = [],
    activeEventId,
    currentUser,
    isLoading = false,
  } = state;

  const eventTitle = eventDetails?.title || "Eventzone Global Summit 2026";
  const targetEventId = activeEventId || eventDetails?.id;

  // Customizer Left Tab: "content" | "styling" | "signatures" | "templates"
  const [editorTab, setEditorTab] = useState("content");

  // Role Filter on Top Bar: "all" | "attendees" | "speakers" | "sponsors" | "exhibitors"
  const [roleFilter, setRoleFilter] = useState("all");

  // Templates Management State
  const [savedTemplates, setSavedTemplates] = useState(() => {
    return DEFAULT_CERTIFICATE_TEMPLATES;
  });
  const [activeTemplate, setActiveTemplate] = useState(() => {
    return DEFAULT_CERTIFICATE_TEMPLATES[0];
  });
  const [galleryCategory, setGalleryCategory] = useState("all");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSavedFeedback, setTemplateSavedFeedback] = useState(false);
  const [expandedElementId, setExpandedElementId] = useState(null);
  const [expandedCoreSection, setExpandedCoreSection] = useState("title");

  // Recipients and Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState(new Set());
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [customRecipients, setCustomRecipients] = useState([]);
  const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);

  // Add Recipient Modal Fields
  const [newRecName, setNewRecName] = useState("");
  const [newRecEmail, setNewRecEmail] = useState("");
  const [newRecRole, setNewRecRole] = useState("Attendee");
  const [newRecCompany, setNewRecCompany] = useState("");
  const [newRecJobTitle, setNewRecJobTitle] = useState("");
  const [csvText, setCsvText] = useState("");

  // Batch Printing Progress
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);

  // Single Email Delivery State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetRecipient, setEmailTargetRecipient] = useState(null);
  const [emailRecipientAddress, setEmailRecipientAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState("idle"); // "idle" | "sending" | "success" | "error"
  const [emailFeedbackMessage, setEmailFeedbackMessage] = useState("");

  // Batch Email Delivery State
  const [isBatchEmailModalOpen, setIsBatchEmailModalOpen] = useState(false);
  const [batchEmailSubject, setBatchEmailSubject] = useState("");
  const [batchEmailMessage, setBatchEmailMessage] = useState("");
  const [isBatchSendingEmail, setIsBatchSendingEmail] = useState(false);
  const [batchEmailProgress, setBatchEmailProgress] = useState({ current: 0, total: 0, sent: 0, failed: 0, activeName: "" });
  const [batchEmailResults, setBatchEmailResults] = useState(null);
  const [batchCaptureRecipient, setBatchCaptureRecipient] = useState(null);

  // Draggable Category Row & Custom Saved Templates State
  const categoryRowRef = useRef(null);
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const [categoryDragStartX, setCategoryDragStartX] = useState(0);
  const [categoryDragScrollLeft, setCategoryDragScrollLeft] = useState(0);
  const [isSaveCustomModalOpen, setIsSaveCustomModalOpen] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [customTemplateCategory, setCustomTemplateCategory] = useState("attendance");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [customTemplateFeedback, setCustomTemplateFeedback] = useState("");

  const localizedCategories = useMemo(() => {
    return CERTIFICATE_CATEGORIES.map(c => {
      if (c.id === "all") return { ...c, label: t("cert.catAllTemplates", "All Templates") };
      if (c.id === "attendance") return { ...c, label: t("cert.catAttendance", "Attendance & Participation") };
      if (c.id === "speaker") return { ...c, label: t("cert.catSpeaker", "Speakers & Keynotes") };
      if (c.id === "sponsor") return { ...c, label: t("cert.catSponsor", "Sponsors & Partners") };
      if (c.id === "exhibitor") return { ...c, label: t("cert.catExhibitor", "Exhibitors & Booths") };
      if (c.id === "award") return { ...c, label: t("cert.catAward", "Awards & Honors") };
      if (c.id === "masterclass") return { ...c, label: t("cert.catMasterclass", "Workshops & Training") };
      if (c.id === "academic") return { ...c, label: t("cert.catAcademic", "Academic & Scientific") };
      if (c.id === "corporate") return { ...c, label: t("cert.catCorporate", "Corporate & Tech") };
      if (c.id === "prestige") return { ...c, label: t("cert.catPrestige", "Prestige & Luxury") };
      if (c.id === "minimalist") return { ...c, label: t("cert.catMinimalist", "Minimalist Modern") };
      if (c.id === "custom") return { ...c, label: t("cert.catCustom", "Custom Artwork") };
      if (c.id === "saved") return { ...c, label: t("cert.catSaved", "Saved Templates") };
      return c;
    });
  }, [t]);

  const localizedFontPairings = useMemo(() => {
    const map = {
      "cinzel-sans": t("cert.fontCinzelSans", "Classic Roman (Cinzel & Plus Jakarta)"),
      "playfair-inter": t("cert.fontPlayfairInter", "Luxury Editorial (Playfair & Inter)"),
      "montserrat-sans": t("cert.fontMontserratSans", "Modern Tech (Montserrat & Plus Jakarta)"),
      "cormorant-serif": t("cert.fontCormorantSerif", "Academic Heritage (Cormorant & Serif)"),
    };
    return FONT_PAIRINGS.map(f => ({ value: f.id, label: map[f.id] || f.name }));
  }, [t]);

  const localizedBorderStyles = useMemo(() => {
    const map = {
      "modern-geometric-navy-gold": t("cert.borderModernGeometric", "Modern Geometric Navy & Gold (Polygon Facets)"),
      "fluid-wave-teal-gold": t("cert.borderFluidWave", "Fluid Luxe Waves & Gold Ribbon"),
      "corporate-diagonal-red-gold": t("cert.borderCorporateDiagonal", "Executive Crimson & Charcoal Diagonal"),
      "dark-obsidian-luxe": t("cert.borderDarkObsidian", "Midnight Obsidian & Gold Crest (Dark Mode)"),
      "asymmetric-royal-blue": t("cert.borderAsymmetricRoyal", "Asymmetric Royal Blue Modern Pillar"),
      "emerald-botanical-crest": t("cert.borderEmeraldBotanical", "Botanical Emerald & Gold Laurel"),
      "creative-coral-violet": t("cert.borderCreativeCoral", "Creative Tech Vanguard Wave (Gradient)"),
      "classic-gold": t("cert.borderClassicGold", "Classic Regal Double Gold Frame & Rosettes"),
      "art-deco": t("cert.borderArtDeco", "1920s Art Deco Stepped Angles & Diamonds"),
      "corporate-navy": t("cert.borderCorporateNavy", "Corporate Executive Navy Header & Footer Bands"),
      "vintage-filigree": t("cert.borderVintageFiligree", "Vintage Baroque Heritage Engraved Frame"),
      "nordic-clean": t("cert.borderNordicClean", "Swiss Minimalist Precision Grid & Crosshairs"),
      "none": t("cert.borderNone", "None (Clean Full-Bleed Canvas)"),
    };
    return BORDER_STYLES.map(b => ({ value: b.id, label: map[b.id] || b.name }));
  }, [t]);

  const localizedCalligraphy = useMemo(() => {
    const map = {
      "calligraphy-1": t("cert.callig1", "Executive Swash (Great Vibes)"),
      "calligraphy-2": t("cert.callig2", "Classic Flourish (Alex Brush)"),
      "calligraphy-3": t("cert.callig3", "Royal Aristocratic (Pinyon Script)"),
      "calligraphy-4": t("cert.callig4", "Fluid Ribbon (Allura)"),
      "calligraphy-5": t("cert.callig5", "Parisian Vintage (Parisienne)"),
      "calligraphy-6": t("cert.callig6", "Modern Casual (Dancing Script)"),
      "calligraphy-7": t("cert.callig7", "Monoline Flow (Sacramento)"),
      "calligraphy-8": t("cert.callig8", "Expressive Brush (Satisfy)"),
      "calligraphy-9": t("cert.callig9", "Ornate Engraver (Monsieur La Doulaise)"),
      "calligraphy-10": t("cert.callig10", "Natural Quill (Marck Script)"),
    };
    return CALLIGRAPHY_SIGNATURES.map(c => ({ value: c.id, label: map[c.id] || c.name }));
  }, [t]);

  const getTemplateLocalizedName = (tpl) => {
    if (tpl.id === "fluid-wave-teal-gold" || tpl.styleId === "fluid-wave-teal-gold") {
      return t("cert.tplFluidWave", "Fluid Luxe Waves & Gold Ribbon");
    }
    if (tpl.id === "modern-geometric-navy-gold" || tpl.styleId === "modern-geometric-navy-gold") {
      return t("cert.tplModernGeometric", "Modern Geometric Navy & Gold");
    }
    if (tpl.id === "dark-obsidian-luxe" || tpl.styleId === "dark-obsidian-luxe") {
      return t("cert.tplAwardExcellence", "Award of Excellence");
    }
    if (tpl.id === "corporate-diagonal-red-gold" || tpl.styleId === "corporate-diagonal-red-gold") {
      return t("cert.tplCertParticipation", "Certificate of Participation");
    }
    return tpl.name;
  };

  const getCategoryLocalizedLabel = (catId) => {
    const found = localizedCategories.find(c => c.id === catId);
    return found ? found.label : catId;
  };

  // Load custom saved templates and restore active template from database / localStorage
  useEffect(() => {
    let isMounted = true;
    const loadTemplates = async () => {
      if (!targetEventId) return;
      try {
        if (typeof window !== "undefined") {
          const cachedActive = localStorage.getItem(`eventzone_active_certificate_template_${targetEventId}`);
          if (cachedActive) {
            try {
              const parsed = JSON.parse(cachedActive);
              if (parsed && typeof parsed === "object" && isMounted) {
                setActiveTemplate(prev => ({ ...prev, ...parsed }));
              }
            } catch (parseErr) {
              console.warn("Could not parse cached active certificate template:", parseErr);
            }
          }
        }

        const customTpls = await fetchCertificateTemplates(targetEventId);
        if (isMounted && customTpls && customTpls.length > 0) {
          const merged = [...customTpls];
          DEFAULT_CERTIFICATE_TEMPLATES.forEach(def => {
            if (!merged.some(m => m.id === def.id)) {
              merged.push(def);
            }
          });
          setSavedTemplates(merged);
        }
      } catch (e) {
        console.warn("Could not load templates:", e);
      }
    };
    loadTemplates();
    return () => { isMounted = false; };
  }, [targetEventId]);

  // ─────────────────────────────────────────────
  //  AGGREGATE ALL ELIGIBLE RECIPIENTS BY ROLE
  // ─────────────────────────────────────────────
  const allRecipients = useMemo(() => {
    const list = [];
    const seenEmails = new Set();

    // 1. Attendees from Database
    (attendees || []).forEach((att, idx) => {
      if (att.isArchived || att.status === "archived") return;
      const attEmail = (att.email || "").toLowerCase().trim();
      list.push({
        id: att.id || `att-${idx}`,
        sourceId: att.id,
        name: att.name || att.fullName || "Attendee",
        email: att.email || "",
        company: att.company || att.organization || "",
        jobTitle: att.jobTitle || att.job_title || att.function || "",
        role: "Attendee",
        ticketType: att.ticketType || att.tier || "Standard Admission",
        issueDate: activeTemplate.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        certificateId: `${activeTemplate.certificateIdPrefix || "EZ-CERT-2026"}-${(att.badgeCode || att.id || `${idx + 101}`).toString().slice(-4).toUpperCase()}`,
        status: att.status || "registered",
      });
      if (attEmail) seenEmails.add(attEmail);
    });

    // 2. Unique Speakers from Sessions
    const speakerMap = new Map();
    (sessions || []).forEach(sess => {
      (sess.speakers || []).forEach(spk => {
        if (!spk) return;
        const spkName = typeof spk === "string" ? spk : spk.name;
        if (!spkName || speakerMap.has(spkName.toLowerCase())) return;
        const spkOrg = typeof spk === "object" ? (spk.company || spk.org || spk.title) : "";
        const spkTitle = typeof spk === "object" ? spk.title : "Keynote Speaker";
        speakerMap.set(spkName.toLowerCase(), {
          name: spkName,
          company: spkOrg,
          jobTitle: spkTitle,
          photo: typeof spk === "object" ? spk.photo : "",
        });
      });
    });

    Array.from(speakerMap.values()).forEach((spk, idx) => {
      list.push({
        id: `spk-${idx}`,
        name: spk.name,
        email: "",
        company: spk.company || eventTitle,
        jobTitle: spk.jobTitle || "Keynote Speaker",
        role: "Speaker",
        ticketType: "Distinguished Speaker Pass",
        issueDate: activeTemplate.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        certificateId: `${activeTemplate.certificateIdPrefix || "EZ-SPK-2026"}-${(idx + 201).toString().slice(-4).toUpperCase()}`,
        status: "confirmed",
      });
    });

    // 3. Sponsors
    (sponsors || []).forEach((spn, idx) => {
      const org = organizations.find(o => String(o.id) === String(spn.org_id || spn.orgId));
      list.push({
        id: spn.id || `spn-${idx}`,
        name: spn.name || org?.name || "Corporate Partner",
        email: spn.email || org?.email || "",
        company: spn.name || org?.name || "",
        jobTitle: `${(spn.tier || "Official").toUpperCase()} SPONSOR`,
        role: "Sponsor",
        ticketType: `${spn.tier || "Partner"} Sponsorship`,
        issueDate: activeTemplate.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        certificateId: `${activeTemplate.certificateIdPrefix || "EZ-SPN-2026"}-${(idx + 301).toString().slice(-4).toUpperCase()}`,
        status: "active",
      });
    });

    // 4. Exhibitors
    (exhibitors || []).forEach((exh, idx) => {
      const org = organizations.find(o => String(o.id) === String(exh.org_id || exh.orgId));
      list.push({
        id: exh.id || `exh-${idx}`,
        name: exh.name || org?.name || "Exhibitor Team",
        email: exh.email || exh.contactEmail || org?.email || "",
        company: exh.name || org?.name || "",
        jobTitle: exh.boothNumber ? `Booth #${exh.boothNumber}` : "Exhibitor Delegate",
        role: "Exhibitor",
        ticketType: "Exhibitor Pass",
        issueDate: activeTemplate.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        certificateId: `${activeTemplate.certificateIdPrefix || "EZ-EXH-2026"}-${(idx + 401).toString().slice(-4).toUpperCase()}`,
        status: "active",
      });
    });

    // 5. Custom Ad-Hoc Recipients
    customRecipients.forEach((cust, idx) => {
      list.push({
        id: cust.id || `cust-${idx}`,
        name: cust.name,
        email: cust.email || "",
        company: cust.company || "",
        jobTitle: cust.jobTitle || "",
        role: cust.role || "Special Guest",
        ticketType: cust.ticketType || "VIP Invitation",
        issueDate: activeTemplate.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        certificateId: `${activeTemplate.certificateIdPrefix || "EZ-CUST-2026"}-${(idx + 501).toString().slice(-4).toUpperCase()}`,
        status: "confirmed",
      });
    });

    return list;
  }, [attendees, sessions, sponsors, exhibitors, organizations, customRecipients, activeTemplate, eventTitle]);

  // Counts for role filter cards
  const attendeeCount = allRecipients.filter(r => r.role === "Attendee").length;
  const speakerCount = allRecipients.filter(r => r.role === "Speaker").length;
  const sponsorCount = allRecipients.filter(r => r.role === "Sponsor").length;
  const exhibitorCount = allRecipients.filter(r => r.role === "Exhibitor").length;

  // Filtered Recipients based on top role card selection and search query
  const filteredRecipients = useMemo(() => {
    return allRecipients.filter(rec => {
      if (roleFilter === "attendees" && rec.role !== "Attendee") return false;
      if (roleFilter === "speakers" && rec.role !== "Speaker") return false;
      if (roleFilter === "sponsors" && rec.role !== "Sponsor") return false;
      if (roleFilter === "exhibitors" && rec.role !== "Exhibitor") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (rec.name || "").toLowerCase().includes(q);
        const matchEmail = (rec.email || "").toLowerCase().includes(q);
        const matchCompany = (rec.company || "").toLowerCase().includes(q);
        const matchRole = (rec.role || "").toLowerCase().includes(q);
        const matchCert = (rec.certificateId || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCompany && !matchRole && !matchCert) {
          return false;
        }
      }

      return true;
    });
  }, [allRecipients, roleFilter, searchQuery]);

  // Current recipient previewed on canvas
  const currentPreviewRecipient = useMemo(() => {
    if (!filteredRecipients.length) {
      return {
        name: "Jane Doe",
        role: activeTemplate.targetRole || "Delegate",
        company: "InnovateTech Global",
        jobTitle: "Chief Strategy Officer",
        certificateId: "EZ-CERT-2026-PREVIEW",
        issueDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      };
    }
    const safeIndex = Math.min(Math.max(0, activePreviewIndex), filteredRecipients.length - 1);
    return filteredRecipients[safeIndex];
  }, [filteredRecipients, activePreviewIndex, activeTemplate]);

  // Select Template handler
  const handleSelectTemplate = (tpl) => {
    const next = {
      ...tpl,
      customBgUrl: tpl.customBgUrl || activeTemplate.customBgUrl || "",
    };
    setActiveTemplate(next);
    if (typeof window !== "undefined" && targetEventId) {
      try {
        localStorage.setItem(`eventzone_active_certificate_template_${targetEventId}`, JSON.stringify(next));
      } catch (err) {}
    }
  };

  // Update Template field with instant local auto-save
  const handleUpdateActiveTemplate = (field, value) => {
    setActiveTemplate(prev => {
      const next = {
        ...prev,
        [field]: value
      };
      if (typeof window !== "undefined" && targetEventId) {
        try {
          localStorage.setItem(`eventzone_active_certificate_template_${targetEventId}`, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
  };

  // Save Template permanently
  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const isExistingCustom = activeTemplate.isCustom || !defaultTemplateIds.has(activeTemplate.id);
      const customId = isExistingCustom && activeTemplate.id ? activeTemplate.id : undefined;
      const customName = isExistingCustom && activeTemplate.name
        ? activeTemplate.name
        : `${activeTemplate.name || activeTemplate.certificateTitle || "Certificate"} (Saved)`;

      const templateToSave = {
        ...activeTemplate,
        id: customId,
        name: customName,
        isCustom: true,
        category: activeTemplate.category || "attendance",
        updatedAt: new Date().toISOString(),
      };

      const savedResult = await upsertCertificateTemplate(templateToSave, targetEventId);
      const finalSavedTemplate = savedResult || templateToSave;

      if (typeof window !== "undefined" && targetEventId) {
        try {
          localStorage.setItem(`eventzone_active_certificate_template_${targetEventId}`, JSON.stringify(finalSavedTemplate));
        } catch (err) {}
      }
      
      setSavedTemplates(prev => {
        const exists = prev.some(t => t.id === finalSavedTemplate.id);
        return exists ? prev.map(t => t.id === finalSavedTemplate.id ? finalSavedTemplate : t) : [finalSavedTemplate, ...prev];
      });

      setActiveTemplate(finalSavedTemplate);
      setTemplateSavedFeedback(true);
      setTimeout(() => setTemplateSavedFeedback(false), 2500);
    } catch (e) {
      console.error("Save template error:", e);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const defaultTemplateIds = useMemo(() => new Set(DEFAULT_CERTIFICATE_TEMPLATES.map(d => d.id)), []);

  const isTemplateCustom = (tpl) => {
    if (!tpl) return false;
    return tpl.isCustom || !defaultTemplateIds.has(tpl.id);
  };

  const customSavedList = useMemo(() => {
    return (savedTemplates || []).filter(t => isTemplateCustom(t));
  }, [savedTemplates, defaultTemplateIds]);

  const handleOpenSaveCustomModal = (existingTpl = null) => {
    if (existingTpl) {
      setEditingTemplateId(existingTpl.id);
      setCustomTemplateName(existingTpl.name || "Custom Certificate Template");
      setCustomTemplateCategory(existingTpl.category || "attendance");
    } else {
      setEditingTemplateId(null);
      setCustomTemplateName(activeTemplate.name || activeTemplate.certificateTitle || "My Custom Template");
      setCustomTemplateCategory(activeTemplate.category || "attendance");
    }
    setIsSaveCustomModalOpen(true);
  };

  const handleConfirmSaveCustomTemplate = async () => {
    if (!customTemplateName.trim()) return;
    try {
      const isEditing = !!editingTemplateId;
      const targetTpl = isEditing ? savedTemplates.find(t => t.id === editingTemplateId) : null;
      
      const templateToSave = {
        ...(targetTpl || activeTemplate),
        id: editingTemplateId || `tpl-custom-${Date.now()}`,
        name: customTemplateName.trim(),
        category: customTemplateCategory || "attendance",
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };

      await upsertCertificateTemplate(templateToSave, targetEventId);

      setSavedTemplates(prev => {
        const exists = prev.some(t => t.id === templateToSave.id);
        return exists ? prev.map(t => t.id === templateToSave.id ? templateToSave : t) : [templateToSave, ...prev];
      });

      if (!isEditing) {
        setActiveTemplate(templateToSave);
      }

      setIsSaveCustomModalOpen(false);
      setEditingTemplateId(null);
      setCustomTemplateName("");
      setGalleryCategory("saved");
      setCustomTemplateFeedback(isEditing ? "Template updated successfully!" : "Template saved successfully!");
      setTimeout(() => setCustomTemplateFeedback(""), 2500);
    } catch (err) {
      console.error("Failed to save custom template:", err);
    }
  };

  const handleOverwriteCustomTemplate = async (tplId, e) => {
    e?.stopPropagation();
    const existing = savedTemplates.find(t => t.id === tplId);
    if (!existing) return;
    try {
      const templateToSave = {
        ...activeTemplate,
        id: existing.id,
        name: existing.name,
        category: existing.category,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };

      await upsertCertificateTemplate(templateToSave, targetEventId);

      setSavedTemplates(prev => prev.map(t => t.id === templateToSave.id ? templateToSave : t));
      setActiveTemplate(templateToSave);
      setCustomTemplateFeedback(`"${existing.name}" updated with current design!`);
      setTimeout(() => setCustomTemplateFeedback(""), 2500);
    } catch (err) {
      console.error("Failed to overwrite template:", err);
    }
  };

  const handleDeleteSavedTemplate = async (tplId, e) => {
    e?.stopPropagation();
    const target = savedTemplates.find(t => t.id === tplId);
    const name = target?.name || "this template";
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      await deleteCertificateTemplate(tplId, targetEventId);
      setSavedTemplates(prev => prev.filter(t => t.id !== tplId));
      
      if (activeTemplate.id === tplId) {
        handleSelectTemplate(DEFAULT_CERTIFICATE_TEMPLATES[0]);
      }
      setCustomTemplateFeedback(`"${name}" deleted.`);
      setTimeout(() => setCustomTemplateFeedback(""), 2500);
    } catch (err) {
      console.error("Failed to delete saved template:", err);
    }
  };

  // Signatory Helpers
  const handleAddSignatory = () => {
    if ((activeTemplate.signatories || []).length >= 3) return;
    const newSig = {
      id: `sig-${Date.now()}`,
      name: "New Signatory",
      title: "Executive Director",
      org: eventTitle,
      signatureType: "calligraphy",
      calligraphyId: "calligraphy-1",
      signatureImage: "",
    };
    handleUpdateActiveTemplate("signatories", [...(activeTemplate.signatories || []), newSig]);
  };

  const handleUpdateSignatory = (index, field, value) => {
    const sigs = [...(activeTemplate.signatories || [])];
    if (sigs[index]) {
      sigs[index] = { ...sigs[index], [field]: value };
      handleUpdateActiveTemplate("signatories", sigs);
    }
  };

  const handleDeleteSignatory = (index) => {
    const sigs = (activeTemplate.signatories || []).filter((_, i) => i !== index);
    handleUpdateActiveTemplate("signatories", sigs);
  };

  // Custom Floating Overlay Elements Handlers
  const handleAddCustomTextElement = () => {
    const newId = `el_txt_${Date.now()}`;
    const newEl = {
      id: newId,
      type: "text",
      text: "★ OFFICIAL ACCREDITATION ★",
      x: 50,
      y: 77,
      fontSize: 10,
      fontFamily: "cinzel",
      fontWeight: "bold",
      color: activeTemplate.accentColor || "#D4AF37",
      opacity: 1,
      textAlign: "center",
      letterSpacing: "0.15em",
      textTransform: "none",
    };
    handleUpdateActiveTemplate("customElements", [...(activeTemplate.customElements || []), newEl]);
    setExpandedElementId(newId);
  };

  const handleAddCustomImageElement = () => {
    const newId = `el_img_${Date.now()}`;
    const newEl = {
      id: newId,
      type: "image",
      url: "",
      x: 50,
      y: 78,
      width: 55,
      opacity: 1,
      borderRadius: "none",
    };
    handleUpdateActiveTemplate("customElements", [...(activeTemplate.customElements || []), newEl]);
    setExpandedElementId(newId);
  };

  const handleUpdateCustomElement = (id, field, value) => {
    const elements = (activeTemplate.customElements || []).map(el => {
      if (el.id === id) {
        return { ...el, [field]: value };
      }
      return el;
    });
    handleUpdateActiveTemplate("customElements", elements);
  };

  const handleDeleteCustomElement = (id) => {
    const elements = (activeTemplate.customElements || []).filter(el => el.id !== id);
    handleUpdateActiveTemplate("customElements", elements);
    if (expandedElementId === id) setExpandedElementId(null);
  };

  const handleDuplicateCustomElement = (id) => {
    const target = (activeTemplate.customElements || []).find(el => el.id === id);
    if (!target) return;
    const duplicatedId = `el_${target.type}_${Date.now()}`;
    const duplicated = {
      ...target,
      id: duplicatedId,
      x: Math.min(90, (target.x || 50) + 4),
      y: Math.min(90, (target.y || 50) + 4),
    };
    handleUpdateActiveTemplate("customElements", [...(activeTemplate.customElements || []), duplicated]);
    setExpandedElementId(duplicatedId);
  };

  // Recipient Selection Handlers
  const handleToggleSelectRecipient = (id) => {
    setSelectedRecipientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedRecipientIds.size === filteredRecipients.length) {
      setSelectedRecipientIds(new Set());
    } else {
      setSelectedRecipientIds(new Set(filteredRecipients.map(r => r.id)));
    }
  };

  // Print Handlers
  const handlePrintSingle = async (rec) => {
    await printA4CertificatesDocument({
      recipients: [rec],
      template: activeTemplate,
      eventDetails,
    });
  };

  const handlePrintBatchSelected = async () => {
    const listToPrint = selectedRecipientIds.size > 0
      ? filteredRecipients.filter(r => selectedRecipientIds.has(r.id))
      : filteredRecipients;

    if (!listToPrint.length) {
      alert("No recipients available to print.");
      return;
    }

    setIsBatchPrinting(true);
    try {
      await printA4CertificatesDocument({
        recipients: listToPrint,
        template: activeTemplate,
        eventDetails,
      });
    } finally {
      setIsBatchPrinting(false);
    }
  };

  // ─────────────────────────────────────────────
  //  EMAIL CERTIFICATE HANDLERS
  // ─────────────────────────────────────────────
  const handleOpenEmailModal = (rec) => {
    if (!rec) return;
    setEmailTargetRecipient(rec);
    setEmailRecipientAddress(rec.email || "");
    setEmailSubject(`Your ${activeTemplate.certificateTitle || "Certificate of Attendance"} for ${eventDetails?.title || "the event"}`);
    setEmailMessage(`Dear ${rec.name},\n\nWe are delighted to present your official certificate for distinguished participation in ${eventDetails?.title || "the event"}.\n\nWarm regards,\n${eventDetails?.organizer_name || "Event Organizing Committee"}`);
    setEmailSendStatus("idle");
    setEmailFeedbackMessage("");
    setIsEmailModalOpen(true);
  };

  const captureCertificateImage = async (elementId = "printable-a4-certificate") => {
    try {
      const node = document.getElementById(elementId);
      if (!node) return null;
      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {}
      }
      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2.2, // 300 DPI crisp resolution
        cacheBust: true,
        skipFonts: true,
      });
      return dataUrl;
    } catch (err) {
      console.warn("Could not capture certificate screenshot with html-to-image:", err);
      return null;
    }
  };

  const handleSendSingleEmail = async (e) => {
    if (e) e.preventDefault();
    const destEmail = (emailRecipientAddress || emailTargetRecipient?.email || "").trim();
    if (!destEmail || !destEmail.includes("@")) {
      setEmailSendStatus("error");
      setEmailFeedbackMessage("Please provide a valid recipient email address.");
      return;
    }

    setIsSendingEmail(true);
    setEmailSendStatus("sending");
    setEmailFeedbackMessage("");

    try {
      // 1. Capture high-resolution image directly from the rendered certificate DOM
      let certificateImage = null;
      if (currentPreviewRecipient.name === emailTargetRecipient.name) {
        certificateImage = await captureCertificateImage("printable-a4-certificate");
      } else {
        setBatchCaptureRecipient(emailTargetRecipient);
        await new Promise(r => setTimeout(r, 120));
        certificateImage = await captureCertificateImage("batch-capture-certificate");
        setBatchCaptureRecipient(null);
      }

      const certId = emailTargetRecipient.certId || emailTargetRecipient.certificateId || `EZ-CERT-${emailTargetRecipient.id}`;
      const payload = {
        type: "certificate",
        to: destEmail,
        recipientName: emailTargetRecipient.name,
        recipientRole: emailTargetRecipient.role || "Attendee",
        company: emailTargetRecipient.company || "",
        jobTitle: emailTargetRecipient.jobTitle || "",
        certificateTitle: activeTemplate.certificateTitle || "Certificate of Attendance",
        certificateId: certId,
        eventTitle: eventDetails?.title || "Eventzone Summit",
        eventDate: eventDetails?.date_range_formatted || "",
        eventLocation: eventDetails?.location || eventDetails?.venue_name || "",
        organizerName: eventDetails?.organizer_name || "Eventzone Organizing Committee",
        subject: emailSubject || `Certificate: ${activeTemplate.certificateTitle || "Certificate"} - ${eventDetails?.title || "Summit"}`,
        message: emailMessage,
        eventId: targetEventId,
        template: activeTemplate,
        subtitleText: activeTemplate.subtitleText,
        recipientSubtext: activeTemplate.recipientSubtext,
        bodyText: activeTemplate.bodyText,
        certificateImage,
      };

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send email.");
      }

      setEmailSendStatus("success");
      setEmailFeedbackMessage(`Certificate PDF successfully sent to ${destEmail}!`);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSendStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Error sending certificate email:", err);
      setEmailSendStatus("error");
      setEmailFeedbackMessage(err.message || "Failed to send email. Please check your SMTP settings.");
    } finally {
      setIsSendingEmail(false);
      setBatchCaptureRecipient(null);
    }
  };

  const handleOpenBatchEmailModal = () => {
    const list = selectedRecipientIds.size > 0
      ? filteredRecipients.filter(r => selectedRecipientIds.has(r.id))
      : filteredRecipients;

    setBatchEmailSubject(`Your ${activeTemplate.certificateTitle || "Certificate of Attendance"} for ${eventDetails?.title || "the event"}`);
    setBatchEmailMessage(`Dear {{name}},\n\nWe are delighted to present your official certificate for distinguished participation in ${eventDetails?.title || "the event"}.\n\nWarm regards,\n${eventDetails?.organizer_name || "Event Organizing Committee"}`);
    setBatchEmailResults(null);
    setBatchEmailProgress({ current: 0, total: list.length, sent: 0, failed: 0, activeName: "" });
    setIsBatchEmailModalOpen(true);
  };

  const handleSendBatchEmails = async () => {
    const list = selectedRecipientIds.size > 0
      ? filteredRecipients.filter(r => selectedRecipientIds.has(r.id))
      : filteredRecipients;

    if (!list || list.length === 0) return;

    setIsBatchSendingEmail(true);
    let sentCount = 0;
    let failedCount = 0;
    let skippedNoEmail = 0;

    setBatchEmailProgress({
      current: 0,
      total: list.length,
      sent: 0,
      failed: 0,
      activeName: "Initializing batch delivery...",
    });

    for (let i = 0; i < list.length; i++) {
      const rec = list[i];
      const email = (rec.email || "").trim();

      if (!email || !email.includes("@")) {
        skippedNoEmail++;
        setBatchEmailProgress(prev => ({
          ...prev,
          current: i + 1,
          activeName: `${rec.name} (Skipped - No email)`,
        }));
        continue;
      }

      setBatchEmailProgress(prev => ({
        ...prev,
        current: i + 1,
        activeName: `${rec.name} (${email})`,
      }));

      try {
        // Capture exact rendered certificate image for recipient
        let certificateImage = null;
        if (currentPreviewRecipient.name === rec.name) {
          certificateImage = await captureCertificateImage("printable-a4-certificate");
        } else {
          setBatchCaptureRecipient(rec);
          await new Promise(r => setTimeout(r, 120));
          certificateImage = await captureCertificateImage("batch-capture-certificate");
        }

        const certId = rec.certId || rec.certificateId || `EZ-CERT-${rec.id}`;
        const interpolatedSubject = (batchEmailSubject || `Certificate for ${eventDetails?.title || "Event"}`)
          .replace(/\{\{name\}\}/gi, rec.name || "")
          .replace(/\{\{event_name\}\}/gi, eventDetails?.title || "")
          .replace(/\{\{certificate_id\}\}/gi, certId);

        const interpolatedMessage = (batchEmailMessage || "")
          .replace(/\{\{name\}\}/gi, rec.name || "")
          .replace(/\{\{event_name\}\}/gi, eventDetails?.title || "")
          .replace(/\{\{certificate_id\}\}/gi, certId)
          .replace(/\{\{role\}\}/gi, rec.role || "Attendee");

        const payload = {
          type: "certificate",
          to: email,
          recipientName: rec.name,
          recipientRole: rec.role || "Attendee",
          company: rec.company || "",
          jobTitle: rec.jobTitle || "",
          certificateTitle: activeTemplate.certificateTitle || "Certificate of Attendance",
          certificateId: certId,
          eventTitle: eventDetails?.title || "Eventzone Summit",
          eventDate: eventDetails?.date_range_formatted || "",
          eventLocation: eventDetails?.location || eventDetails?.venue_name || "",
          organizerName: eventDetails?.organizer_name || "Eventzone Organizing Committee",
          subject: interpolatedSubject,
          message: interpolatedMessage,
          eventId: targetEventId,
          template: activeTemplate,
          subtitleText: activeTemplate.subtitleText,
          recipientSubtext: activeTemplate.recipientSubtext,
          bodyText: activeTemplate.bodyText,
          certificateImage,
        };

        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          sentCount++;
          setBatchEmailProgress(prev => ({ ...prev, sent: sentCount }));
        } else {
          failedCount++;
          setBatchEmailProgress(prev => ({ ...prev, failed: failedCount }));
        }
      } catch (err) {
        console.error("Failed to email recipient:", rec.name, err);
        failedCount++;
        setBatchEmailProgress(prev => ({ ...prev, failed: failedCount }));
      }

      // Small pause between emails to avoid SMTP burst rate limits
      await new Promise(res => setTimeout(res, 200));
    }

    setBatchCaptureRecipient(null);
    setIsBatchSendingEmail(false);
    setBatchEmailResults({
      sent: sentCount,
      failed: failedCount,
      skippedNoEmail,
      total: list.length,
    });
  };

  // Add Custom Recipient Submit
  const handleAddCustomRecipientSubmit = (e) => {
    e.preventDefault();
    if (!newRecName.trim()) return;
    const newCust = {
      id: `cust-${Date.now()}`,
      name: newRecName.trim(),
      email: newRecEmail.trim(),
      role: newRecRole,
      company: newRecCompany.trim(),
      jobTitle: newRecJobTitle.trim(),
      ticketType: "VIP Pass",
    };
    setCustomRecipients(prev => [newCust, ...prev]);
    setNewRecName("");
    setNewRecEmail("");
    setNewRecCompany("");
    setNewRecJobTitle("");
    setIsAddRecipientModalOpen(false);
  };

  // Import CSV Submit
  const handleImportCsvSubmit = (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    const lines = csvText.split("\n").map(l => l.trim()).filter(Boolean);
    const parsed = [];
    
    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes("name") && line.toLowerCase().includes("email")) return;
      const parts = line.split(",").map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[0]) {
        parsed.push({
          id: `csv-${Date.now()}-${idx}`,
          name: parts[0],
          email: parts[1] || "",
          role: parts[2] || "Attendee",
          company: parts[3] || "",
          jobTitle: parts[4] || "",
        });
      }
    });

    if (parsed.length > 0) {
      setCustomRecipients(prev => [...parsed, ...prev]);
      setCsvText("");
      setIsImportCsvModalOpen(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let rows = [["Recipient Name", "Role", "Company / Organization", "Job Title", "Email", "Certificate ID", "Issue Date"]];
    filteredRecipients.forEach(r => {
      rows.push([
        `"${r.name || ''}"`,
        `"${r.role || ''}"`,
        `"${r.company || ''}"`,
        `"${r.jobTitle || ''}"`,
        `"${r.email || ''}"`,
        `"${r.certificateId || ''}"`,
        `"${r.issueDate || ''}"`
      ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Eventzone_Certificates_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Insert Variable helper
  const handleInsertVariable = (variableKey) => {
    const current = activeTemplate.bodyText || "";
    handleUpdateActiveTemplate("bodyText", `${current} {{${variableKey}}}`);
  };

  if (isLoading) {
    return <CertificatesSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-16" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* ─────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
      ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("dash.certificates", "Certificates & Awards")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("cert.subtitle", "Design custom certificates with instant A4 landscape batch printing for attendees, speakers, sponsors, and exhibitors.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleSaveTemplate}
            disabled={isSavingTemplate}
            className={`font-bold py-2 px-4 rounded-xl text-xs border shadow-2xs transition-all cursor-pointer ${
              templateSavedFeedback
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <span>{isSavingTemplate ? t("cert.savingBtn", "Saving...") : templateSavedFeedback ? t("cert.savedBtn", "Saved!") : t("cert.saveTemplateBtn", "Save Template")}</span>
          </button>

          <button
            onClick={handleOpenBatchEmailModal}
            disabled={isBatchSendingEmail || isBatchPrinting}
            className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold py-2 px-3.5 sm:px-4 rounded-xl text-xs border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title={t("cert.sendEmailTooltip", "Send Certificates via Email")}
          >
            <Mail size={14} className="text-blue-600" />
            <span>
              {selectedRecipientIds.size > 0 ? (
                <span>{t("cert.emailSelectedBtn", "Email Selected")} (<bdi dir="ltr">{selectedRecipientIds.size}</bdi>)</span>
              ) : (
                <span>{t("cert.emailAllBtn", "Email All")} (<bdi dir="ltr">{filteredRecipients.length}</bdi>)</span>
              )}
            </span>
          </button>

          <button
            onClick={handlePrintBatchSelected}
            disabled={isBatchPrinting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:px-4.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer size={15} />
            <span>
              {selectedRecipientIds.size > 0 ? (
                <span>{t("cert.printSelectedBtn", "Print Selected")} (<bdi dir="ltr">{selectedRecipientIds.size}</bdi>)</span>
              ) : (
                <span>{t("cert.batchPrintAllBtn", "Batch Print All")} (<bdi dir="ltr">{filteredRecipients.length}</bdi>)</span>
              )}
            </span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. ROLE FILTER BUTTON BAR
      ───────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2.5 select-none">
        
        {/* Button 1: All Eligible */}
        <button
          type="button"
          onClick={() => { setRoleFilter("all"); setActivePreviewIndex(0); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
            roleFilter === "all"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>{t("cert.roleAllEligible", "All Eligible")}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
            roleFilter === "all" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            <bdi dir="ltr">{allRecipients.length}</bdi>
          </span>
        </button>

        {/* Button 2: Attendees */}
        <button
          type="button"
          onClick={() => { setRoleFilter("attendees"); setActivePreviewIndex(0); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
            roleFilter === "attendees"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>{t("cert.roleAttendees", "Attendees")}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
            roleFilter === "attendees" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            <bdi dir="ltr">{attendeeCount}</bdi>
          </span>
        </button>

        {/* Button 3: Speakers */}
        <button
          type="button"
          onClick={() => { setRoleFilter("speakers"); setActivePreviewIndex(0); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
            roleFilter === "speakers"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>{t("cert.roleSpeakers", "Speakers")}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
            roleFilter === "speakers" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            <bdi dir="ltr">{speakerCount}</bdi>
          </span>
        </button>

        {/* Button 4: Sponsors */}
        <button
          type="button"
          onClick={() => { setRoleFilter("sponsors"); setActivePreviewIndex(0); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
            roleFilter === "sponsors"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>{t("cert.roleSponsors", "Sponsors")}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
            roleFilter === "sponsors" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            <bdi dir="ltr">{sponsorCount}</bdi>
          </span>
        </button>

        {/* Button 5: Exhibitors */}
        <button
          type="button"
          onClick={() => { setRoleFilter("exhibitors"); setActivePreviewIndex(0); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
            roleFilter === "exhibitors"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span>{t("cert.roleExhibitors", "Exhibitors")}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
            roleFilter === "exhibitors" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            <bdi dir="ltr">{exhibitorCount}</bdi>
          </span>
        </button>

      </div>

      {/* ─────────────────────────────────────────────
          3. SPLIT VIEW WORKSPACE
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Editor Tabs & Customization Panels (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar">
          
          {/* Sub-Tabs: Content | Styling | Signatures | Templates */}
          <div className="flex items-center border-b border-slate-200 overflow-x-auto -mx-5 -mt-5 px-3 sm:-mx-6 sm:-mt-6 sm:px-4 pt-1">
            <button
              onClick={() => setEditorTab("content")}
              className={`relative flex items-center px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
                editorTab === "content"
                  ? "text-blue-600 font-black bg-transparent"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{t("cert.tabContent", "Content & Text")}</span>
              {editorTab === "content" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
              )}
            </button>

            <button
              onClick={() => setEditorTab("styling")}
              className={`relative flex items-center px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
                editorTab === "styling"
                  ? "text-blue-600 font-black bg-transparent"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{t("cert.tabStyling", "Styling & Theme")}</span>
              {editorTab === "styling" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
              )}
            </button>

            <button
              onClick={() => setEditorTab("signatures")}
              className={`relative flex items-center px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
                editorTab === "signatures"
                  ? "text-blue-600 font-black bg-transparent"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{t("cert.tabSignatures", "Signatures")}</span>
              {editorTab === "signatures" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
              )}
            </button>

            <button
              onClick={() => setEditorTab("templates")}
              className={`relative flex items-center px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
                editorTab === "templates"
                  ? "text-blue-600 font-black bg-transparent"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{t("cert.tabTemplates", "Templates")}</span>
              {editorTab === "templates" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
              )}
            </button>
          </div>

          {/* TAB 1: CONTENT & TEXT */}
          {editorTab === "content" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* ── 1. CORE CERTIFICATE ELEMENTS (COLLAPSIBLE) ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {t("cert.coreTemplateFields", "Core Template Fields")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium"><bdi dir="ltr">3</bdi> {t("cert.primarySections", "Primary Sections")}</span>
                </div>

                {/* 1. Main Title Accordion */}
                <div className={`rounded-2xl border transition-all ${expandedCoreSection === "title" ? "bg-white border-slate-300 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                  <div
                    className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                    onClick={() => setExpandedCoreSection(expandedCoreSection === "title" ? null : "title")}
                  >
                    <div className="min-w-0 pe-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                        <span>{t("cert.certificateMainTitle", "Certificate Main Title")}</span>
                        {activeTemplate.hideTitle && <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold border border-slate-200">{t("cert.hiddenBadge", "Hidden")}</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {activeTemplate.certificateTitle || "CERTIFICATE OF ATTENDANCE"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateActiveTemplate("hideTitle", !activeTemplate.hideTitle);
                        }}
                        title={activeTemplate.hideTitle ? t("cert.showTitleTooltip", "Show Title") : t("cert.hideTitleTooltip", "Hide Title")}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${activeTemplate.hideTitle ? "text-slate-400 hover:text-slate-600 bg-slate-100" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                      >
                        {activeTemplate.hideTitle ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <div className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                        {expandedCoreSection === "title" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>
                  </div>

                  {expandedCoreSection === "title" && (
                    <div className="p-3.5 pt-0 border-t border-slate-200/60 mt-1 space-y-3.5">
                      {/* Content Section */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {t("cert.titleTextLabel", "Title Text")}
                        </label>
                        <input
                          type="text"
                          value={activeTemplate.certificateTitle || ""}
                          onChange={(e) => handleUpdateActiveTemplate("certificateTitle", e.target.value)}
                          placeholder={t("cert.titlePlaceholder", "e.g. CERTIFICATE OF ATTENDANCE")}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        {/* Quick presets */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {[
                            { text: "CERTIFICATE OF ATTENDANCE", label: t("cert.titlePresetAttendance", "CERTIFICATE OF ATTENDANCE") },
                            { text: "CERTIFICATE OF APPRECIATION", label: t("cert.titlePresetAppreciation", "CERTIFICATE OF APPRECIATION") },
                            { text: "CERTIFICATE OF ACHIEVEMENT", label: t("cert.titlePresetAchievement", "CERTIFICATE OF ACHIEVEMENT") },
                            { text: "CERTIFICATE OF COMPLETION", label: t("cert.titlePresetCompletion", "CERTIFICATE OF COMPLETION") },
                            { text: "AWARD OF EXCELLENCE", label: t("cert.titlePresetExcellence", "AWARD OF EXCELLENCE") },
                          ].map(preset => (
                            <button
                              key={preset.text}
                              type="button"
                              onClick={() => handleUpdateActiveTemplate("certificateTitle", isRTL ? preset.label : preset.text)}
                              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[9px] font-bold text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 1. Typography Card */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Type size={12} className="text-indigo-600" />
                            <span>{t("cert.typographyStyling", "Typography & Styling")}</span>
                          </span>

                          {/* Bold & Italic Quick Toggle Toolbar */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              title={t("cert.toggleBold", "Toggle Bold")}
                              onClick={() => {
                                const currentWeight = activeTemplate.titleFontWeight || "black";
                                const isBold = currentWeight === "bold" || currentWeight === "extrabold" || currentWeight === "black";
                                handleUpdateActiveTemplate("titleFontWeight", isBold ? "normal" : "bold");
                              }}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans transition-all cursor-pointer ${
                                (activeTemplate.titleFontWeight === "bold" || activeTemplate.titleFontWeight === "extrabold" || activeTemplate.titleFontWeight === "black")
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              B
                            </button>
                            <button
                              type="button"
                              title={t("cert.toggleItalic", "Toggle Italic")}
                              onClick={() => handleUpdateActiveTemplate("titleItalic", !activeTemplate.titleItalic)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans italic transition-all cursor-pointer ${
                                activeTemplate.titleItalic
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              I
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontFamily", "Font Family")}</label>
                            <SearchableSelect
                              value={activeTemplate.titleFontFamily || "cinzel"}
                              onChange={(val) => handleUpdateActiveTemplate("titleFontFamily", val)}
                              options={FONT_STYLE_OPTIONS}
                              placeholder={t("cert.fontFamilyPlaceholder", "Font Family...")}
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontWeight", "Font Weight")}</label>
                            <SearchableSelect
                              value={activeTemplate.titleFontWeight || "black"}
                              onChange={(val) => handleUpdateActiveTemplate("titleFontWeight", val)}
                              options={FONT_WEIGHT_OPTIONS}
                              placeholder={t("cert.fontWeightPlaceholder", "Font Weight...")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.fontSize", "Font Size")}</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {activeTemplate.titleFontSize ? `${activeTemplate.titleFontSize}pt` : "Auto"}
                                </span>
                                {activeTemplate.titleFontSize && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateActiveTemplate("titleFontSize", undefined)}
                                    className="text-[8.5px] text-slate-400 hover:text-blue-600 font-bold underline cursor-pointer"
                                  >
                                    {t("cert.resetBtn", "Reset")}
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="range"
                              min={14}
                              max={36}
                              step={1}
                              value={activeTemplate.titleFontSize || 24}
                              onChange={(e) => handleUpdateActiveTemplate("titleFontSize", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.letterSpacing", "Letter Spacing")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {typeof activeTemplate.titleLetterSpacing === 'number'
                                  ? `${activeTemplate.titleLetterSpacing}px`
                                  : activeTemplate.titleLetterSpacing === 'widest' ? '6px'
                                  : activeTemplate.titleLetterSpacing === 'wide' ? '3px'
                                  : (activeTemplate.titleLetterSpacing || '2px')}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={-1}
                              max={16}
                              step={0.5}
                              value={typeof activeTemplate.titleLetterSpacing === 'number' ? activeTemplate.titleLetterSpacing : activeTemplate.titleLetterSpacing === 'widest' ? 6 : activeTemplate.titleLetterSpacing === 'wide' ? 3 : 2}
                              onChange={(e) => handleUpdateActiveTemplate("titleLetterSpacing", parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.textColor", "Text Color")}</label>
                          <div className="flex items-center gap-1.5">
                            <div className="relative group shrink-0" title={t("cert.customColorPicker", "Custom color picker")}>
                              <div
                                className="w-6.5 h-6.5 rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center cursor-pointer transition-all group-hover:scale-105 group-hover:border-blue-400 overflow-hidden relative"
                                style={{ backgroundColor: activeTemplate.titleColor || activeTemplate.accentColor || "#D4AF37" }}
                              >
                                <Pipette size={11} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-85 group-hover:opacity-100 transition-opacity" />
                                <input
                                  type="color"
                                  value={activeTemplate.titleColor || activeTemplate.accentColor || "#D4AF37"}
                                  onChange={(e) => handleUpdateActiveTemplate("titleColor", e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {["#D4AF37", "#0F172A", "#1D4ED8", "#991B1B", "#059669"].map(col => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => handleUpdateActiveTemplate("titleColor", col)}
                                  style={{ background: col }}
                                  className={`w-4.5 h-4.5 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-115 ${
                                    (activeTemplate.titleColor || activeTemplate.accentColor || "#D4AF37") === col ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Position & Layout Card */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders size={12} className="text-blue-600" />
                          <span>{t("cert.positionLayout", "Position & Canvas Layout")}</span>
                        </span>

                        {/* Dual X & Y Sliders */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.xHorizontal", "X (Horizontal)")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.titleX !== undefined ? activeTemplate.titleX : 50}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={1}
                              value={activeTemplate.titleX !== undefined ? activeTemplate.titleX : 50}
                              onChange={(e) => handleUpdateActiveTemplate("titleX", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.yVertical", "Y (Vertical)")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.titleY !== undefined ? activeTemplate.titleY : 18}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={1}
                              value={activeTemplate.titleY !== undefined ? activeTemplate.titleY : 18}
                              onChange={(e) => handleUpdateActiveTemplate("titleY", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        {/* Opacity Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10.5px] font-bold text-slate-700">{t("cert.opacity", "Opacity")}</label>
                            <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round((activeTemplate.titleOpacity !== undefined ? activeTemplate.titleOpacity : 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.05}
                            max={1}
                            step={0.05}
                            value={activeTemplate.titleOpacity !== undefined ? activeTemplate.titleOpacity : 1}
                            onChange={(e) => handleUpdateActiveTemplate("titleOpacity", parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Presentation Subtitle Accordion */}
                <div className={`rounded-2xl border transition-all ${expandedCoreSection === "subtitle" ? "bg-white border-slate-300 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                  <div
                    className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                    onClick={() => setExpandedCoreSection(expandedCoreSection === "subtitle" ? null : "subtitle")}
                  >
                    <div className="min-w-0 pe-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                        <span>{t("cert.presentationSubtitle", "Presentation Subtitle & Subtext")}</span>
                        {activeTemplate.hideSubtitle && <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold border border-slate-200">{t("cert.hiddenBadge", "Hidden")}</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {activeTemplate.subtitleText || "THIS IS PROUDLY PRESENTED TO"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateActiveTemplate("hideSubtitle", !activeTemplate.hideSubtitle);
                        }}
                        title={activeTemplate.hideSubtitle ? t("cert.showSubtitleTooltip", "Show Subtitle") : t("cert.hideSubtitleTooltip", "Hide Subtitle")}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${activeTemplate.hideSubtitle ? "text-slate-400 hover:text-slate-600 bg-slate-100" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                      >
                        {activeTemplate.hideSubtitle ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <div className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                        {expandedCoreSection === "subtitle" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>
                  </div>

                  {expandedCoreSection === "subtitle" && (
                    <div className="p-3.5 pt-0 border-t border-slate-200/60 mt-1 space-y-3.5">
                      {/* Content Section */}
                      <div className="pt-2 space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t("cert.conferralSubtitleLine", "Conferral Subtitle Line")}
                          </label>
                          <input
                            type="text"
                            value={activeTemplate.subtitleText || ""}
                            onChange={(e) => handleUpdateActiveTemplate("subtitleText", e.target.value)}
                            placeholder={t("cert.subtitlePlaceholder", "e.g. THIS IS PROUDLY PRESENTED TO")}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t("cert.recipientSubtitleFormat", "Recipient Subtitle Format")}
                          </label>
                          <input
                            type="text"
                            value={activeTemplate.recipientSubtext || ""}
                            onChange={(e) => handleUpdateActiveTemplate("recipientSubtext", e.target.value)}
                            placeholder={t("cert.subtitleFormatPlaceholder", "e.g. {{job_title}} • {{organization}}")}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* 1. Typography Card */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Type size={12} className="text-indigo-600" />
                            <span>{t("cert.typographyStyling", "Typography & Styling")}</span>
                          </span>

                          {/* Bold & Italic Quick Toggle Toolbar */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              title={t("cert.toggleBold", "Toggle Bold")}
                              onClick={() => {
                                const currentWeight = activeTemplate.subtitleFontWeight || "bold";
                                const isBold = currentWeight === "bold" || currentWeight === "extrabold" || currentWeight === "black";
                                handleUpdateActiveTemplate("subtitleFontWeight", isBold ? "normal" : "bold");
                              }}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans transition-all cursor-pointer ${
                                (activeTemplate.subtitleFontWeight === "bold" || activeTemplate.subtitleFontWeight === "extrabold" || activeTemplate.subtitleFontWeight === "black")
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              B
                            </button>
                            <button
                              type="button"
                              title={t("cert.toggleItalic", "Toggle Italic")}
                              onClick={() => handleUpdateActiveTemplate("subtitleItalic", !activeTemplate.subtitleItalic)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans italic transition-all cursor-pointer ${
                                activeTemplate.subtitleItalic
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              I
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontFamily", "Font Family")}</label>
                            <SearchableSelect
                              value={activeTemplate.subtitleFontFamily || "sans"}
                              onChange={(val) => handleUpdateActiveTemplate("subtitleFontFamily", val)}
                              options={FONT_STYLE_OPTIONS}
                              placeholder={t("cert.fontFamilyPlaceholder", "Font Family...")}
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontWeight", "Font Weight")}</label>
                            <SearchableSelect
                              value={activeTemplate.subtitleFontWeight || "bold"}
                              onChange={(val) => handleUpdateActiveTemplate("subtitleFontWeight", val)}
                              options={FONT_WEIGHT_OPTIONS.filter(w => w.value !== "black")}
                              placeholder={t("cert.fontWeightPlaceholder", "Font Weight...")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.fontSize", "Font Size")}</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.subtitleFontSize ? `${activeTemplate.subtitleFontSize}pt` : "Auto"}</span>
                                {activeTemplate.subtitleFontSize && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateActiveTemplate("subtitleFontSize", undefined)}
                                    className="text-[8.5px] text-slate-400 hover:text-blue-600 font-bold underline cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="range"
                              min={7}
                              max={14}
                              step={0.5}
                              value={activeTemplate.subtitleFontSize || 9}
                              onChange={(e) => handleUpdateActiveTemplate("subtitleFontSize", parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.letterSpacing", "Letter Spacing")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {typeof activeTemplate.subtitleLetterSpacing === 'number'
                                  ? `${activeTemplate.subtitleLetterSpacing}px`
                                  : activeTemplate.subtitleLetterSpacing === 'widest' ? '6px'
                                  : activeTemplate.subtitleLetterSpacing === 'wide' ? '3px'
                                  : (activeTemplate.subtitleLetterSpacing || '3px')}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={-1}
                              max={16}
                              step={0.5}
                              value={typeof activeTemplate.subtitleLetterSpacing === 'number' ? activeTemplate.subtitleLetterSpacing : activeTemplate.subtitleLetterSpacing === 'widest' ? 6 : activeTemplate.subtitleLetterSpacing === 'wide' ? 3 : 3}
                              onChange={(e) => handleUpdateActiveTemplate("subtitleLetterSpacing", parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.subtitleColor", "Subtitle Color")}</label>
                          <div className="flex items-center gap-1.5">
                            <div className="relative group shrink-0" title={t("cert.customColorPicker", "Custom color picker")}>
                              <div
                                className="w-6.5 h-6.5 rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center cursor-pointer transition-all group-hover:scale-105 group-hover:border-blue-400 overflow-hidden relative"
                                style={{ backgroundColor: activeTemplate.subtitleColor || "#94A3B8" }}
                              >
                                <Pipette size={11} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-85 group-hover:opacity-100 transition-opacity" />
                                <input
                                  type="color"
                                  value={activeTemplate.subtitleColor || "#94A3B8"}
                                  onChange={(e) => handleUpdateActiveTemplate("subtitleColor", e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {["#94A3B8", "#64748B", "#0F172A", "#D4AF37", "#1D4ED8"].map(col => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => handleUpdateActiveTemplate("subtitleColor", col)}
                                  style={{ background: col }}
                                  className={`w-4.5 h-4.5 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-115 ${
                                    (activeTemplate.subtitleColor || "#94A3B8") === col ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Position & Layout Card */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders size={12} className="text-blue-600" />
                          <span>{t("cert.positionLayout", "Position & Canvas Layout")}</span>
                        </span>

                        {/* Dual X & Y Sliders */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.xHorizontal", "X (Horizontal)")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.subtitleX !== undefined ? activeTemplate.subtitleX : 50}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={1}
                              value={activeTemplate.subtitleX !== undefined ? activeTemplate.subtitleX : 50}
                              onChange={(e) => handleUpdateActiveTemplate("subtitleX", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.yVertical", "Y (Vertical)")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.subtitleY !== undefined ? activeTemplate.subtitleY : 26}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={1}
                              value={activeTemplate.subtitleY !== undefined ? activeTemplate.subtitleY : 26}
                              onChange={(e) => handleUpdateActiveTemplate("subtitleY", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        {/* Opacity Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10.5px] font-bold text-slate-700">{t("cert.opacity", "Opacity")}</label>
                            <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round((activeTemplate.subtitleOpacity !== undefined ? activeTemplate.subtitleOpacity : 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.05}
                            max={1}
                            step={0.05}
                            value={activeTemplate.subtitleOpacity !== undefined ? activeTemplate.subtitleOpacity : 1}
                            onChange={(e) => handleUpdateActiveTemplate("subtitleOpacity", parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Body Statement Accordion */}
                <div className={`rounded-2xl border transition-all ${expandedCoreSection === "body" ? "bg-white border-slate-300 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                  <div
                    className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                    onClick={() => setExpandedCoreSection(expandedCoreSection === "body" ? null : "body")}
                  >
                    <div className="min-w-0 pe-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                        <span>{t("cert.certificateBodyStatement", "Certificate Body Statement")}</span>
                        {activeTemplate.hideBody && <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold border border-slate-200">{t("cert.hiddenBadge", "Hidden")}</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {activeTemplate.bodyText || "For distinguished and active participation..."}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateActiveTemplate("hideBody", !activeTemplate.hideBody);
                        }}
                        title={activeTemplate.hideBody ? t("cert.showBodyTooltip", "Show Body") : t("cert.hideBodyTooltip", "Hide Body")}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${activeTemplate.hideBody ? "text-slate-400 hover:text-slate-600 bg-slate-100" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                      >
                        {activeTemplate.hideBody ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <div className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                        {expandedCoreSection === "body" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>
                  </div>

                  {expandedCoreSection === "body" && (
                    <div className="p-3.5 pt-0 border-t border-slate-200/60 mt-1 space-y-3.5">
                      {/* Content Section */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {t("cert.bodyParagraphMarkdown", "Body Paragraph (Markdown bold **text** supported)")}
                        </label>
                        <textarea
                          rows={4}
                          value={activeTemplate.bodyText || ""}
                          onChange={(e) => handleUpdateActiveTemplate("bodyText", e.target.value)}
                          placeholder={t("cert.bodyStatementPlaceholder", "For distinguished and active participation in the **{{event_name}}**...")}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                        />
                        
                        {/* Dynamic variables chips */}
                        <div className="mt-2 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {t("cert.clickToInsertVars", "Click to insert variables:")}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { key: "name", label: `+ ${t("cert.varName", "Name")}` },
                              { key: "organization", label: `+ ${t("cert.varCompany", "Company")}` },
                              { key: "job_title", label: `+ ${t("cert.varJobTitle", "Job Title")}` },
                              { key: "event_name", label: `+ ${t("cert.varEventTitle", "Event Title")}` },
                              { key: "event_location", label: `+ ${t("cert.varVenue", "Venue")}` },
                              { key: "event_date", label: `+ ${t("cert.varDate", "Date")}` },
                              { key: "certificate_id", label: `+ ${t("cert.varCertId", "Cert ID")}` },
                            ].map(chip => (
                              <button
                                key={chip.key}
                                type="button"
                                onClick={() => handleInsertVariable(chip.key)}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[9.5px] font-bold text-slate-600 transition-all cursor-pointer"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 1. Typography Card */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Type size={12} className="text-indigo-600" />
                            <span>{t("cert.typographyStyling", "Typography & Styling")}</span>
                          </span>

                          {/* Bold & Italic Quick Toggle Toolbar */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              title={t("cert.toggleBold", "Toggle Bold")}
                              onClick={() => {
                                const currentWeight = activeTemplate.bodyFontWeight || "normal";
                                const isBold = currentWeight === "bold" || currentWeight === "semibold" || currentWeight === "extrabold";
                                handleUpdateActiveTemplate("bodyFontWeight", isBold ? "normal" : "bold");
                              }}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans transition-all cursor-pointer ${
                                (activeTemplate.bodyFontWeight === "bold" || activeTemplate.bodyFontWeight === "semibold" || activeTemplate.bodyFontWeight === "extrabold")
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              B
                            </button>
                            <button
                              type="button"
                              title={t("cert.toggleItalic", "Toggle Italic")}
                              onClick={() => handleUpdateActiveTemplate("bodyItalic", !activeTemplate.bodyItalic)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans italic transition-all cursor-pointer ${
                                activeTemplate.bodyItalic
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              I
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontFamily", "Font Family")}</label>
                            <SearchableSelect
                              value={activeTemplate.bodyFontFamily || "sans"}
                              onChange={(val) => handleUpdateActiveTemplate("bodyFontFamily", val)}
                              options={FONT_STYLE_OPTIONS}
                              placeholder={t("cert.fontFamilyPlaceholder", "Font Family...")}
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontWeight", "Font Weight")}</label>
                            <SearchableSelect
                              value={activeTemplate.bodyFontWeight || "normal"}
                              onChange={(val) => handleUpdateActiveTemplate("bodyFontWeight", val)}
                              options={FONT_WEIGHT_OPTIONS.filter(w => w.value !== "black" && w.value !== "extrabold")}
                              placeholder={t("cert.fontWeightPlaceholder", "Font Weight...")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.fontSize", "Font Size")}</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.bodyFontSize ? `${activeTemplate.bodyFontSize}pt` : "Auto"}</span>
                                {activeTemplate.bodyFontSize && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateActiveTemplate("bodyFontSize", undefined)}
                                    className="text-[8.5px] text-slate-400 hover:text-blue-600 font-bold underline cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="range"
                              min={7}
                              max={14}
                              step={0.5}
                              value={activeTemplate.bodyFontSize || 10}
                              onChange={(e) => handleUpdateActiveTemplate("bodyFontSize", parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.letterSpacing", "Letter Spacing")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {typeof activeTemplate.bodyLetterSpacing === 'number'
                                  ? `${activeTemplate.bodyLetterSpacing}px`
                                  : activeTemplate.bodyLetterSpacing === 'widest' ? '6px'
                                  : activeTemplate.bodyLetterSpacing === 'wide' ? '3px'
                                  : (activeTemplate.bodyLetterSpacing || '0px')}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={-1}
                              max={16}
                              step={0.5}
                              value={typeof activeTemplate.bodyLetterSpacing === 'number' ? activeTemplate.bodyLetterSpacing : activeTemplate.bodyLetterSpacing === 'widest' ? 6 : activeTemplate.bodyLetterSpacing === 'wide' ? 3 : 0}
                              onChange={(e) => handleUpdateActiveTemplate("bodyLetterSpacing", parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.textColor", "Text Color")}</label>
                          <div className="flex items-center gap-1.5">
                            <div className="relative group shrink-0" title={t("cert.customColorPicker", "Custom color picker")}>
                              <div
                                className="w-6.5 h-6.5 rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center cursor-pointer transition-all group-hover:scale-105 group-hover:border-blue-400 overflow-hidden relative"
                                style={{ backgroundColor: activeTemplate.bodyColor || "#475569" }}
                              >
                                <Pipette size={11} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-85 group-hover:opacity-100 transition-opacity" />
                                <input
                                  type="color"
                                  value={activeTemplate.bodyColor || "#475569"}
                                  onChange={(e) => handleUpdateActiveTemplate("bodyColor", e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {["#475569", "#0F172A", "#1E293B", "#1D4ED8", "#D4AF37"].map(col => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => handleUpdateActiveTemplate("bodyColor", col)}
                                  style={{ background: col }}
                                  className={`w-4.5 h-4.5 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-115 ${
                                    (activeTemplate.bodyColor || "#475569") === col ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Position & Layout Card */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders size={12} className="text-blue-600" />
                          <span>{t("cert.positionLayout", "Position & Canvas Layout")}</span>
                        </span>

                        {/* Dual X & Y Sliders */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.xHorizontal", "X (Horizontal)")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.bodyX !== undefined ? activeTemplate.bodyX : 50}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={1}
                              value={activeTemplate.bodyX !== undefined ? activeTemplate.bodyX : 50}
                              onChange={(e) => handleUpdateActiveTemplate("bodyX", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.yVertical", "Y (Vertical)")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{activeTemplate.bodyY !== undefined ? activeTemplate.bodyY : 64}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={1}
                              value={activeTemplate.bodyY !== undefined ? activeTemplate.bodyY : 64}
                              onChange={(e) => handleUpdateActiveTemplate("bodyY", parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        {/* Opacity & Paragraph Alignment */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10.5px] font-bold text-slate-700">{t("cert.opacity", "Opacity")}</label>
                              <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round((activeTemplate.bodyOpacity !== undefined ? activeTemplate.bodyOpacity : 1) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0.05}
                              max={1}
                              step={0.05}
                              value={activeTemplate.bodyOpacity !== undefined ? activeTemplate.bodyOpacity : 1}
                              onChange={(e) => handleUpdateActiveTemplate("bodyOpacity", parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.paragraphAlignment", "Paragraph Alignment")}</label>
                            <SearchableSelect
                              value={activeTemplate.bodyTextAlign || "center"}
                              onChange={(val) => handleUpdateActiveTemplate("bodyTextAlign", val)}
                              options={[
                                { value: "left", label: t("cert.alignLeft", "Left Align") },
                                { value: "center", label: t("cert.alignCenter", "Center Align") },
                                { value: "right", label: t("cert.alignRight", "Right Align") },
                              ]}
                              placeholder={t("cert.alignmentPlaceholder", "Alignment...")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 2. CUSTOM OVERLAY ELEMENTS (TEXT & IMAGES) ── */}
              <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Move size={14} className="text-blue-600" />
                      <span>{t("cert.customOverlayElements", "Custom Overlay Elements")}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <bdi dir="ltr">{(activeTemplate.customElements || []).length}</bdi>
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t("cert.customOverlayElementsDesc", "Place floating custom text annotations, accreditation seals, or partner sponsor logos anywhere on the certificate canvas.")}
                  </p>
                </div>

                {/* Improved Dual Action Add Element Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddCustomTextElement}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200/80 rounded-2xl text-xs font-bold transition-all hover:shadow-xs active:scale-98 cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Type size={13} />
                    </div>
                    <span>+ {t("cert.addCustomText", "Add Custom Text")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCustomImageElement}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-50 to-fuchsia-50 hover:from-purple-100 hover:to-fuchsia-100 text-purple-700 border border-purple-200/80 rounded-2xl text-xs font-bold transition-all hover:shadow-xs active:scale-98 cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <ImageIcon size={13} />
                    </div>
                    <span>+ {t("cert.addImageLogo", "Add Image / Logo")}</span>
                  </button>
                </div>

                {/* Empty State */}
                {(!activeTemplate.customElements || activeTemplate.customElements.length === 0) && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {t("cert.noCustomElements", "No custom elements added yet. Click + Text or + Image to place floating stamps, accreditation logos, or custom annotations anywhere on the canvas.")}
                    </p>
                  </div>
                )}

                {/* Elements List */}
                {(activeTemplate.customElements || []).map((el, index) => {
                  const isExpanded = expandedElementId === el.id;

                  return (
                    <div
                      key={el.id || index}
                      className={`rounded-2xl border transition-all ${
                        isExpanded
                          ? "bg-white border-slate-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Element Accordion Header */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer select-none"
                        onClick={() => setExpandedElementId(isExpanded ? null : el.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pe-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              el.type === "text"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {el.type === "text" ? <Type size={13} /> : <ImageIcon size={13} />}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {el.type === "text" ? (el.text || t("cert.untitledText", "Untitled Text")) : t("cert.customGraphicLogo", "Custom Graphic / Logo")}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Pos: X {el.x || 50}% • Y {el.y || 50}% • {el.type === "text" ? `${el.fontSize || 10}pt` : `${el.width || 55}px`}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title={t("cert.duplicateElementTooltip", "Duplicate Element")}
                            onClick={() => handleDuplicateCustomElement(el.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            title={t("cert.deleteElementTooltip", "Delete Element")}
                            onClick={() => handleDeleteCustomElement(el.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedElementId(isExpanded ? null : el.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Element Expanded Customization Body */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-slate-200/60 mt-1 space-y-3.5">
                          
                          {/* ── TEXT ELEMENT CONTROLS ── */}
                          {el.type === "text" && (
                            <div className="space-y-3 pt-2">
                              {/* Content Section */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {t("cert.textContent", "Text Content")}
                                </label>
                                <input
                                  type="text"
                                  value={el.text || ""}
                                  onChange={(e) => handleUpdateCustomElement(el.id, "text", e.target.value)}
                                  placeholder={t("cert.textPlaceholder", "e.g. ★ OFFICIAL ACCREDITATION ★")}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                                
                                {/* Quick chips */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {[
                                    { k: "name", l: "+ Name" },
                                    { k: "event_date", l: "+ Date" },
                                    { k: "event_location", l: "+ Venue" },
                                    { k: "certificate_id", l: "+ Cert ID" },
                                  ].map(c => (
                                    <button
                                      key={c.k}
                                      type="button"
                                      onClick={() => handleUpdateCustomElement(el.id, "text", `${el.text || ""} {{${c.k}}}`)}
                                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[9px] font-bold text-slate-600 cursor-pointer transition-colors"
                                    >
                                      {c.l}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Typography Card */}
                              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Type size={12} className="text-indigo-600" />
                                    <span>{t("cert.typographyStyling", "Typography & Styling")}</span>
                                  </span>

                                  {/* Bold & Italic Quick Toggle Toolbar */}
                                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <button
                                      type="button"
                                      title={t("cert.toggleBold", "Toggle Bold")}
                                      onClick={() => {
                                        const currentWeight = el.fontWeight || "bold";
                                        const isBold = currentWeight === "bold" || currentWeight === "extrabold" || currentWeight === "black";
                                        handleUpdateCustomElement(el.id, "fontWeight", isBold ? "normal" : "bold");
                                      }}
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans transition-all cursor-pointer ${
                                        (el.fontWeight === "bold" || el.fontWeight === "extrabold" || el.fontWeight === "black")
                                          ? "bg-blue-600 text-white shadow-2xs"
                                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                      }`}
                                    >
                                      B
                                    </button>
                                    <button
                                      type="button"
                                      title={t("cert.toggleItalic", "Toggle Italic")}
                                      onClick={() => handleUpdateCustomElement(el.id, "italic", !el.italic)}
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-sans italic transition-all cursor-pointer ${
                                        el.italic
                                          ? "bg-blue-600 text-white shadow-2xs"
                                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                      }`}
                                    >
                                      I
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontFamily", "Font Family")}</label>
                                    <SearchableSelect
                                      value={el.fontFamily || "cinzel"}
                                      onChange={(val) => handleUpdateCustomElement(el.id, "fontFamily", val)}
                                      options={FONT_STYLE_OPTIONS}
                                      placeholder={t("cert.fontFamilyPlaceholder", "Font Family...")}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.fontWeight", "Font Weight")}</label>
                                    <SearchableSelect
                                      value={el.fontWeight || "bold"}
                                      onChange={(val) => handleUpdateCustomElement(el.id, "fontWeight", val)}
                                      options={FONT_WEIGHT_OPTIONS}
                                      placeholder={t("cert.fontWeightPlaceholder", "Font Weight...")}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="text-[10.5px] font-bold text-slate-700">{t("cert.fontSize", "Font Size")}</label>
                                      <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{el.fontSize || 10}pt</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={6}
                                      max={32}
                                      step={1}
                                      value={el.fontSize || 10}
                                      onChange={(e) => handleUpdateCustomElement(el.id, "fontSize", parseInt(e.target.value))}
                                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="text-[10.5px] font-bold text-slate-700">{t("cert.letterSpacing", "Letter Spacing")}</label>
                                      <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                        {typeof el.letterSpacing === 'number'
                                          ? `${el.letterSpacing}px`
                                          : (el.letterSpacing || '0px')}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-1}
                                      max={16}
                                      step={0.5}
                                      value={typeof el.letterSpacing === 'number' ? el.letterSpacing : 0}
                                      onChange={(e) => handleUpdateCustomElement(el.id, "letterSpacing", parseFloat(e.target.value))}
                                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/60">
                                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.textColor", "Text Color")}</label>
                                  <div className="flex items-center gap-1.5">
                                    <div className="relative group shrink-0" title={t("cert.customColorPicker", "Custom color picker")}>
                                      <div
                                        className="w-6.5 h-6.5 rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center cursor-pointer transition-all group-hover:scale-105 group-hover:border-blue-400 overflow-hidden relative"
                                        style={{ backgroundColor: el.color || activeTemplate.accentColor || "#D4AF37" }}
                                      >
                                        <Pipette size={11} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-85 group-hover:opacity-100 transition-opacity" />
                                        <input
                                          type="color"
                                          value={el.color || activeTemplate.accentColor || "#D4AF37"}
                                          onChange={(e) => handleUpdateCustomElement(el.id, "color", e.target.value)}
                                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {["#D4AF37", "#0F172A", "#1D4ED8", "#991B1B", "#059669"].map(col => (
                                        <button
                                          key={col}
                                          type="button"
                                          onClick={() => handleUpdateCustomElement(el.id, "color", col)}
                                          style={{ background: col }}
                                          className={`w-4.5 h-4.5 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-115 ${
                                            (el.color || activeTemplate.accentColor || "#D4AF37") === col ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── IMAGE ELEMENT CONTROLS ── */}
                          {el.type === "image" && (
                            <div className="space-y-3 pt-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {t("cert.uploadGraphicStampLogo", "Upload Graphic / Stamp / Logo")}
                                </label>
                                <FormImageUploader
                                  value={el.url || ""}
                                  onChange={(url) => handleUpdateCustomElement(el.id, "url", url)}
                                  aspectRatio="1:1"
                                  placeholder={t("cert.uploadBadgePlaceholder", "Upload badge, stamp, or partner logo")}
                                />
                              </div>

                              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <ImageIcon size={12} className="text-purple-600" />
                                  <span>{t("cert.imageDimensionsShape", "Image Dimensions & Shape")}</span>
                                </span>

                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="text-[10.5px] font-bold text-slate-700">{t("cert.imageSize", "Image Size")}</label>
                                      <span className="text-[9.5px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{el.width || 55}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={20}
                                      max={200}
                                      step={5}
                                      value={el.width || 55}
                                      onChange={(e) => handleUpdateCustomElement(el.id, "width", parseInt(e.target.value))}
                                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">{t("cert.shapeCrop", "Shape Crop")}</label>
                                    <SearchableSelect
                                      value={el.borderRadius || "none"}
                                      onChange={(val) => handleUpdateCustomElement(el.id, "borderRadius", val)}
                                      options={[
                                        { value: "none", label: t("cert.cropSquare", "Original / Square") },
                                        { value: "rounded", label: t("cert.cropRounded", "Rounded Corners") },
                                        { value: "circle", label: t("cert.cropCircle", "Circular Stamp") },
                                      ]}
                                      placeholder={t("cert.shapeCropPlaceholder", "Shape Crop...")}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── SHARED POSITION & OPACITY CONTROLS ── */}
                          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sliders size={12} className="text-blue-600" />
                              <span>{t("cert.positionLayout", "Position & Canvas Layout")}</span>
                            </span>

                            {/* Dual X & Y Sliders */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10.5px] font-bold text-slate-700">{t("cert.xHorizontal", "X (Horizontal)")}</label>
                                  <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{el.x || 50}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={5}
                                  max={95}
                                  step={1}
                                  value={el.x || 50}
                                  onChange={(e) => handleUpdateCustomElement(el.id, "x", parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10.5px] font-bold text-slate-700">{t("cert.yVertical", "Y (Vertical)")}</label>
                                  <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{el.y || 50}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={5}
                                  max={95}
                                  step={1}
                                  value={el.y || 50}
                                  onChange={(e) => handleUpdateCustomElement(el.id, "y", parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                              </div>
                            </div>

                            {/* Opacity Slider */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[10.5px] font-bold text-slate-700">{t("cert.opacity", "Opacity")}</label>
                                <span className="text-[9.5px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round((el.opacity !== undefined ? el.opacity : 1) * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min={0.05}
                                max={1}
                                step={0.05}
                                value={el.opacity !== undefined ? el.opacity : 1}
                                onChange={(e) => handleUpdateCustomElement(el.id, "opacity", parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STYLING & THEME */}
          {editorTab === "styling" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("cert.typographyFontPairing", "Typography Font Pairing")}
                </label>
                <SearchableSelect
                  value={activeTemplate.fontPairing || "cinzel-sans"}
                  onChange={(val) => handleUpdateActiveTemplate("fontPairing", val)}
                  options={localizedFontPairings}
                  placeholder={t("cert.selectFontPairingPlaceholder", "Select Font Pairing...")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("cert.borderFrameArchitecture", "Border Frame Architecture")} (<bdi dir="ltr">{BORDER_STYLES.length}</bdi> {t("cert.distinctStyles", "Distinct Styles")})
                </label>
                <SearchableSelect
                  value={activeTemplate.borderStyle || "modern-geometric-navy-gold"}
                  onChange={(val) => handleUpdateActiveTemplate("borderStyle", val)}
                  options={localizedBorderStyles}
                  placeholder={t("cert.selectBorderStylePlaceholder", "Select Border Style Architecture...")}
                />
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("cert.accentColorLabel", "Accent Color")}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => handleUpdateActiveTemplate("accentColor", c.color)}
                      className={`w-7 h-7 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center ${
                        activeTemplate.accentColor === c.color ? "ring-2 ring-blue-500 ring-offset-2 scale-105" : "border-white"
                      } ${c.bg}`}
                      title={c.name}
                    >
                      {activeTemplate.accentColor === c.color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ms-2">
                    <div className="relative group shrink-0" title={t("cert.customColorPicker", "Custom color picker")}>
                      <div
                        className="w-7 h-7 rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center cursor-pointer transition-all group-hover:scale-105 group-hover:border-blue-400 overflow-hidden relative"
                        style={{ backgroundColor: activeTemplate.accentColor || "#D4AF37" }}
                      >
                        <Pipette size={12} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-85 group-hover:opacity-100 transition-opacity" />
                        <input
                          type="color"
                          value={activeTemplate.accentColor || "#D4AF37"}
                          onChange={(e) => handleUpdateActiveTemplate("accentColor", e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      <bdi dir="ltr">{activeTemplate.accentColor || "#D4AF37"}</bdi>
                    </span>
                  </div>
                </div>
              </div>

              {/* Background Canvas Style */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("cert.backgroundTone", "Background Tone")}
                </label>
                <SearchableSelect
                  value={activeTemplate.bgStyle || "ivory"}
                  onChange={(val) => handleUpdateActiveTemplate("bgStyle", val)}
                  options={[
                    { value: "ivory", label: t("cert.bgIvory", "Classic Warm Ivory") },
                    { value: "white", label: t("cert.bgWhite", "Pure Clean White") },
                    { value: "dark", label: t("cert.bgDark", "Obsidian Dark Slate") },
                    { value: "gradient", label: t("cert.bgGradient", "Soft Silver Slate Gradient") },
                  ]}
                  placeholder={t("cert.selectBgTonePlaceholder", "Select Background Tone...")}
                />
              </div>

              {/* Custom A4 Background Artwork Upload */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("cert.customA4BgArtwork", "Custom A4 Background Graphic Artwork")}
                  </label>
                  <FormImageUploader
                    value={activeTemplate.customBgUrl || ""}
                    onChange={(url) => handleUpdateActiveTemplate("customBgUrl", url)}
                    onUploadFile={onUploadFile}
                    placeholder={t("cert.uploadArtworkPlaceholder", "Upload custom A4 horizontal certificate artwork image (PNG, JPG)")}
                  />
                  {activeTemplate.customBgUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveTemplate("customBgUrl", "")}
                      className="mt-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer block"
                    >
                      {t("cert.removeCustomArtwork", "Remove Custom Artwork")}
                    </button>
                  )}
                </div>

                {/* Opacity Slider Control */}
                {activeTemplate.customBgUrl && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{t("cert.bgArtworkOpacity", "Background Artwork Opacity")}</span>
                      <span className="font-mono text-blue-600 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px]">
                        {Math.round((activeTemplate.customBgOpacity !== undefined ? activeTemplate.customBgOpacity : 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={activeTemplate.customBgOpacity !== undefined ? activeTemplate.customBgOpacity : 1}
                      onChange={(e) => handleUpdateActiveTemplate("customBgOpacity", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>5% ({t("cert.subtleWatermark", "Subtle Watermark")})</span>
                      <span>50% ({t("cert.mutedWatermark", "Muted")})</span>
                      <span>100% ({t("cert.solidWatermark", "Solid")})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SIGNATURES & SEALS */}
          {editorTab === "signatures" && (
            <div className="space-y-5 animate-fade-in">
              {/* Position & Height Offset Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-700">{t("cert.signaturesHeightBottom", "Signatures Height from Bottom")}</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    <bdi dir="ltr">{activeTemplate.signatureBottom !== undefined ? activeTemplate.signatureBottom : 8.5}%</bdi>
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={24}
                  step={0.5}
                  value={activeTemplate.signatureBottom !== undefined ? activeTemplate.signatureBottom : 8.5}
                  onChange={(e) => handleUpdateActiveTemplate("signatureBottom", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">{t("cert.committeeSignatories", "Committee Signatories")}</span>
                {(activeTemplate.signatories || []).length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddSignatory}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>{t("cert.addSigner", "Add Signer")}</span>
                  </button>
                )}
              </div>

              <div className="space-y-3.5">
                {(activeTemplate.signatories || []).map((sig, idx) => (
                  <div key={sig.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-600">
                        {t("cert.signatoryPrefix", "Signatory")} #<bdi dir="ltr">{idx + 1}</bdi>
                      </span>
                      {(activeTemplate.signatories || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSignatory(idx)}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">{t("cert.signerNameLabel", "Name")}</label>
                        <input
                          type="text"
                          value={sig.name || ""}
                          onChange={(e) => handleUpdateSignatory(idx, "name", e.target.value)}
                          placeholder={t("cert.signerNamePlaceholder", "Dr. Sarah Jenkins")}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">{t("cert.signerTitleLabel", "Title")}</label>
                        <input
                          type="text"
                          value={sig.title || ""}
                          onChange={(e) => handleUpdateSignatory(idx, "title", e.target.value)}
                          placeholder={t("cert.signerTitlePlaceholder", "General Chair")}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">{t("cert.calligraphyScript", "Calligraphy Script")}</label>
                      <SearchableSelect
                        value={sig.calligraphyId || "calligraphy-1"}
                        onChange={(val) => handleUpdateSignatory(idx, "calligraphyId", val)}
                        options={localizedCalligraphy}
                        placeholder={t("cert.calligraphyPlaceholder", "Calligraphy...")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATES GALLERY */}
          {editorTab === "templates" && (
            <div className="space-y-4 animate-fade-in">
              {/* Feedback toast when template saved/deleted */}
              {customTemplateFeedback && (
                <div className="p-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in">
                  <span>{customTemplateFeedback}</span>
                  <button onClick={() => setCustomTemplateFeedback("")} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
                </div>
              )}

              {/* Draggable Category Chips Row */}
              <div
                ref={categoryRowRef}
                onMouseDown={(e) => {
                  if (!categoryRowRef.current) return;
                  setIsDraggingCategory(true);
                  setCategoryDragStartX(e.pageX - categoryRowRef.current.offsetLeft);
                  setCategoryDragScrollLeft(categoryRowRef.current.scrollLeft);
                }}
                onMouseMove={(e) => {
                  if (!isDraggingCategory || !categoryRowRef.current) return;
                  e.preventDefault();
                  const x = e.pageX - categoryRowRef.current.offsetLeft;
                  const walk = (x - categoryDragStartX) * 1.5;
                  categoryRowRef.current.scrollLeft = categoryDragScrollLeft - walk;
                }}
                onMouseUp={() => setIsDraggingCategory(false)}
                onMouseLeave={() => setIsDraggingCategory(false)}
                className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none cursor-grab active:cursor-grabbing select-none"
              >
                {localizedCategories.map(cat => {
                  const isSelected = galleryCategory === cat.id;
                  const count = cat.id === "saved" ? customSavedList.length : null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setGalleryCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {count !== null && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        }`}>
                          <bdi dir="ltr">{count}</bdi>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SAVED TAB EMPTY STATE */}
              {galleryCategory === "saved" && customSavedList.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">{t("cert.noSavedTemplatesYet", "No Saved Templates Yet")}</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {t("cert.noSavedTemplatesDesc", "Customize your certificate design with fonts, colors, and signatures, then click \"Save Template\" at the top right to save it here.")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pe-1">
                  {(galleryCategory === "saved"
                    ? customSavedList
                    : savedTemplates.filter(t => galleryCategory === "all" || t.category === galleryCategory || (galleryCategory === "custom" && t.styleId === "custom-artwork"))
                  ).map(tpl => {
                    const isActive = activeTemplate.id === tpl.id;
                    const isCustom = isTemplateCustom(tpl);
                    const accentColor = tpl.accentColor || "#D4AF37";
                    const secondaryColor = tpl.secondaryColor || "#1E293B";
                    const borderStyle = tpl.borderStyle || "classic-gold";
                    const bgStyle = tpl.bgStyle || "ivory";
                    const isDark = bgStyle === "dark";

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                          isActive
                            ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Miniature Template Visual Representation */}
                        <div
                          className="relative w-full aspect-[297/210] rounded-lg overflow-hidden border border-slate-200/80 p-2.5 flex flex-col justify-between select-none"
                          style={{
                            background: tpl.customBgUrl
                              ? `url(${tpl.customBgUrl}) center / cover`
                              : bgStyle === "ivory"
                              ? "radial-gradient(ellipse at center, #FFFFFF 0%, #FAF8F2 60%, #F4EFE6 100%)"
                              : bgStyle === "dark"
                              ? "radial-gradient(ellipse at center, #0F172A 0%, #090D16 100%)"
                              : bgStyle === "gradient"
                              ? "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)"
                              : "#FFFFFF",
                          }}
                        >
                          {/* Mini Border Geometry */}
                          {borderStyle === "modern-geometric-navy-gold" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <polygon points="0,0 28,0 0,28" fill={secondaryColor} />
                              <polygon points="0,0 24,0 0,24" fill={accentColor} opacity="0.9" />
                              <polygon points="100,70 72,70 100,42" fill={secondaryColor} />
                              <polygon points="100,70 76,70 100,46" fill={accentColor} opacity="0.9" />
                            </svg>
                          )}

                          {borderStyle === "fluid-wave-teal-gold" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <path d="M0,0 L36,0 C28,14 14,20 0,26 Z" fill={secondaryColor} />
                              <path d="M0,0 L30,0 C22,12 11,16 0,20 Z" fill={accentColor} opacity="0.85" />
                              <path d="M100,70 L64,70 C72,56 86,50 100,44 Z" fill={secondaryColor} />
                              <path d="M100,70 L70,70 C78,58 89,54 100,50 Z" fill={accentColor} opacity="0.85" />
                            </svg>
                          )}

                          {borderStyle === "corporate-diagonal-red-gold" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <polygon points="0,0 34,0 0,22" fill={secondaryColor} />
                              <line x1="35" y1="0" x2="0" y2="23" stroke={accentColor} strokeWidth="1" />
                              <polygon points="100,70 66,70 100,48" fill="#1E293B" />
                              <line x1="65" y1="70" x2="100" y2="47" stroke={accentColor} strokeWidth="1" />
                            </svg>
                          )}

                          {borderStyle === "dark-obsidian-luxe" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <rect x="3" y="3" width="94" height="64" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.8" />
                              <polygon points="3,3 10,3 3,10" fill={accentColor} />
                              <polygon points="97,3 90,3 97,10" fill={accentColor} />
                              <polygon points="3,67 10,67 3,60" fill={accentColor} />
                              <polygon points="97,67 90,67 97,60" fill={accentColor} />
                            </svg>
                          )}

                          {borderStyle === "asymmetric-royal-blue" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <polygon points="0,0 12,0 7,70 0,70" fill={secondaryColor} />
                              <polygon points="12,0 14,0 9,70 7,70" fill={accentColor} />
                              <polygon points="100,70 92,70 100,58" fill={accentColor} />
                            </svg>
                          )}

                          {borderStyle === "emerald-botanical-crest" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <polygon points="0,0 24,0 0,24" fill={secondaryColor} />
                              <line x1="25" y1="0" x2="0" y2="25" stroke={accentColor} strokeWidth="1" />
                              <polygon points="100,70 76,70 100,46" fill={secondaryColor} />
                              <line x1="75" y1="70" x2="100" y2="45" stroke={accentColor} strokeWidth="1" />
                            </svg>
                          )}

                          {borderStyle === "creative-coral-violet" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 70" preserveAspectRatio="none">
                              <path d="M0,0 L32,0 C25,14 14,22 0,26 Z" fill="#7C3AED" opacity="0.9" />
                              <path d="M100,70 L68,70 C75,56 86,48 100,44 Z" fill="#F43F5E" opacity="0.9" />
                            </svg>
                          )}

                          {borderStyle === "classic-gold" && (
                            <div className="absolute inset-1.5 border border-dashed rounded-xs pointer-events-none" style={{ borderColor: accentColor }}>
                              <div className="absolute -top-1 -left-1 text-[7px]" style={{ color: accentColor }}>✦</div>
                              <div className="absolute -top-1 -right-1 text-[7px]" style={{ color: accentColor }}>✦</div>
                              <div className="absolute -bottom-1 -left-1 text-[7px]" style={{ color: accentColor }}>✦</div>
                              <div className="absolute -bottom-1 -right-1 text-[7px]" style={{ color: accentColor }}>✦</div>
                            </div>
                          )}

                          {borderStyle === "art-deco" && (
                            <div className="absolute inset-1.5 border pointer-events-none" style={{ borderColor: accentColor }}>
                              <div className="absolute top-0 left-0 w-2 h-2 border-b border-r" style={{ borderColor: accentColor }} />
                              <div className="absolute top-0 right-0 w-2 h-2 border-b border-l" style={{ borderColor: accentColor }} />
                              <div className="absolute bottom-0 left-0 w-2 h-2 border-t border-r" style={{ borderColor: accentColor }} />
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-t border-l" style={{ borderColor: accentColor }} />
                            </div>
                          )}

                          {borderStyle === "corporate-navy" && (
                            <>
                              <div className="absolute top-0 inset-x-0 h-1 pointer-events-none" style={{ background: secondaryColor }} />
                              <div className="absolute bottom-0 inset-x-0 h-1 pointer-events-none" style={{ background: secondaryColor }} />
                            </>
                          )}

                          {borderStyle === "vintage-filigree" && (
                            <div className="absolute inset-1.5 border-2 double pointer-events-none" style={{ borderColor: accentColor }}>
                              <div className="absolute top-0.5 left-0.5 text-[6px]" style={{ color: accentColor }}>❖</div>
                              <div className="absolute top-0.5 right-0.5 text-[6px]" style={{ color: accentColor }}>❖</div>
                              <div className="absolute bottom-0.5 left-0.5 text-[6px]" style={{ color: accentColor }}>❖</div>
                              <div className="absolute bottom-0.5 right-0.5 text-[6px]" style={{ color: accentColor }}>❖</div>
                            </div>
                          )}

                          {borderStyle === "nordic-clean" && (
                            <div className="absolute inset-1.5 border border-slate-300 pointer-events-none">
                              <div className="absolute -top-1 -left-1 text-[6px] text-slate-400 font-mono">+</div>
                              <div className="absolute -top-1 -right-1 text-[6px] text-slate-400 font-mono">+</div>
                              <div className="absolute -bottom-1 -left-1 text-[6px] text-slate-400 font-mono">+</div>
                              <div className="absolute -bottom-1 -right-1 text-[6px] text-slate-400 font-mono">+</div>
                            </div>
                          )}

                          {/* Mini Content Layout */}
                          <div className={`relative z-10 flex flex-col items-center text-center justify-between h-full py-0.5 ${borderStyle === "asymmetric-royal-blue" ? "pl-2.5" : ""}`}>
                            {/* Top Header */}
                            <div className="flex flex-col items-center">
                              <span
                                className="text-[7.5px] font-black uppercase tracking-wider line-clamp-1 leading-tight"
                                style={{ color: accentColor }}
                              >
                                {tpl.certificateTitle || "CERTIFICATE"}
                              </span>
                              <span className="text-[5px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">
                                {tpl.subtitleText || "PRESENTED TO"}
                              </span>
                            </div>

                            {/* Center Recipient */}
                            <div className="flex flex-col items-center my-auto">
                              <span
                                className="text-[8.5px] font-extrabold pb-0.5 border-b inline-block px-2 leading-none"
                                style={{
                                  color: isDark ? "#FFFFFF" : secondaryColor,
                                  borderColor: accentColor,
                                }}
                              >
                                {t("cert.miniJohnDoe", "John Doe")}
                              </span>
                              <div className="space-y-0.5 mt-1 w-20">
                                <div className="h-0.5 w-full bg-slate-300/40 rounded-full" />
                                <div className="h-0.5 w-2/3 mx-auto bg-slate-300/40 rounded-full" />
                              </div>
                            </div>

                            {/* Bottom Signatures */}
                            <div className="w-full flex items-end justify-around px-2 pt-1 border-t border-slate-200/40">
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-0.5 bg-slate-300 rounded-full mb-0.5" />
                                <span className="text-[4px] font-bold text-slate-400">{t("cert.miniChair", "Chair")}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-0.5 bg-slate-300 rounded-full mb-0.5" />
                                <span className="text-[4px] font-bold text-slate-400">{t("cert.miniDirector", "Director")}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Template Metadata & Action Controls */}
                        <div className="flex items-start justify-between gap-2 pt-0.5">
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{getTemplateLocalizedName(tpl)}</h5>
                            <span className="text-[10px] font-medium text-slate-400 capitalize">{getCategoryLocalizedLabel(tpl.category)}</span>
                          </div>

                          {/* Quick Action Controls for Custom Saved Templates */}
                          {isCustom && (
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleOverwriteCustomTemplate(tpl.id, e)}
                                title={t("cert.updateTemplateTooltip", "Update this saved template with current canvas styling")}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer transition-all"
                              >
                                <Save size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSaveCustomModal(tpl);
                                }}
                                title={t("cert.renameTemplateTooltip", "Rename template")}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer transition-all"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedTemplate(tpl.id, e)}
                                title={t("cert.deleteTemplateTooltip", "Delete saved template")}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Live Canvas Preview & Recipient Switcher (7 cols) */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-4 self-start">
          
          {/* Recipient Switcher Bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePreviewIndex(prev => Math.max(0, prev - 1))}
                disabled={activePreviewIndex <= 0}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-slate-700"
                title={t("cert.prevRecipientTooltip", "Previous Recipient")}
              >
                {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>

              <div className="text-xs">
                <span className="font-extrabold text-slate-900">
                  {currentPreviewRecipient.name}
                </span>
                <span className="text-slate-400 font-medium ms-1.5">
                  (<bdi dir="ltr">{filteredRecipients.length > 0 ? activePreviewIndex + 1 : 0}</bdi> {t("cert.of", "of")} <bdi dir="ltr">{filteredRecipients.length}</bdi>)
                </span>
              </div>

              <button
                onClick={() => setActivePreviewIndex(prev => Math.min(filteredRecipients.length - 1, prev + 1))}
                disabled={activePreviewIndex >= filteredRecipients.length - 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-slate-700"
                title={t("cert.nextRecipientTooltip", "Next Recipient")}
              >
                {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEmailModal(currentPreviewRecipient)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                title={t("cert.sendEmailTooltip", "Send Certificate via Email")}
              >
                <Mail size={13} />
                <span>{t("cert.emailCertificateBtn", "Email Certificate")}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintSingle(currentPreviewRecipient)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-all cursor-pointer shadow-2xs border border-blue-200/60"
              >
                <Printer size={13} />
                <span>{t("cert.printCertificateBtn", "Print Certificate")}</span>
              </button>
            </div>
          </div>

          {/* Interactive A4 Landscape Canvas Preview */}
          <div className="p-4 sm:p-6 bg-slate-150 rounded-3xl border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-full rounded-xl overflow-hidden shadow-xl transition-all">
              <A4CertificateSheet
                template={activeTemplate}
                recipient={currentPreviewRecipient}
                eventDetails={eventDetails}
                interactive={true}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-2">
            <span>{t("cert.canvasStandardNotice", "Standard ISO 216 Landscape A4 (297 × 210 mm) • High-Precision Vector Engine")}</span>
            <span>{t("cert.templateLabel", "Template:")} <strong>{activeTemplate.name}</strong></span>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────
          4. RECIPIENTS DIRECTORY TABLE (Underneath Split View)
      ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t("cert.recipientsDirectoryTitle", "Recipients Directory")} (<bdi dir="ltr">{filteredRecipients.length}</bdi>)</span>
              {selectedRecipientIds.size > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                  <bdi dir="ltr">{selectedRecipientIds.size}</bdi> {t("cert.selectedCount", "Selected")}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {t("cert.recipientsDirectoryDesc", "Select delegates to generate and batch print official personalized A4 horizontal certificates.")}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <div className="relative min-w-[220px]">
              <Search size={14} className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-slate-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("cert.searchRecipientsPlaceholder", "Search name, company, role...")}
                className={`w-full ${isRTL ? "pr-9 pl-3.5" : "pl-9 pr-3.5"} py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all`}
              />
            </div>

            <button
              onClick={handleSelectAllFiltered}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all shrink-0 cursor-pointer"
            >
              {selectedRecipientIds.size === filteredRecipients.length && filteredRecipients.length > 0
                ? t("cert.deselectAll", "Deselect All")
                : t("cert.selectAll", "Select All")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRecipientIds.size > 0 && selectedRecipientIds.size === filteredRecipients.length}
                    onChange={handleSelectAllFiltered}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 text-start">{t("cert.colRecipientName", "RECIPIENT NAME")}</th>
                <th className="py-3 px-4 text-start">{t("cert.colRoleCategory", "ROLE / CATEGORY")}</th>
                <th className="py-3 px-4 text-start">{t("cert.colCompanyOrg", "COMPANY / ORGANIZATION")}</th>
                <th className="py-3 px-4 text-start">{t("cert.colCertificateSerial", "CERTIFICATE SERIAL")}</th>
                <th className="py-3 px-4 text-end">{t("cert.colActions", "ACTIONS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award size={32} className="opacity-40" />
                      <p className="font-bold text-slate-600">{t("cert.noRecipientsFound", "No recipients found")}</p>
                      <p className="text-[11px] text-slate-400">{t("cert.noRecipientsHint", "Try adjusting your search query or role filter.")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((rec, index) => {
                  const isSelected = selectedRecipientIds.has(rec.id);
                  return (
                    <tr
                      key={rec.id || index}
                      className="transition-all hover:bg-blue-50/30"
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRecipient(rec.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                            {rec.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{rec.name}</div>
                            {rec.email && <div className="text-[10.5px] text-slate-400">{rec.email}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                            rec.role === "Speaker"
                              ? "bg-amber-100 text-amber-800"
                              : rec.role === "Sponsor"
                              ? "bg-purple-100 text-purple-800"
                              : rec.role === "Exhibitor"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {rec.role === "Speaker" ? t("cert.badgeSpeaker", "Speaker") : rec.role === "Sponsor" ? t("cert.badgeSponsor", "Sponsor") : rec.role === "Exhibitor" ? t("cert.badgeExhibitor", "Exhibitor") : t("cert.badgeAttendee", "Attendee")}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-semibold">{rec.company || "—"}</div>
                        {rec.jobTitle && <div className="text-[10px] text-slate-400">{rec.jobTitle}</div>}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800" dir="ltr">
                        {rec.certificateId}
                      </td>

                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActivePreviewIndex(index);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
                            title={t("cert.previewOnCanvas", "Preview on Canvas")}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenEmailModal(rec)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
                            title={t("cert.sendEmailTooltip", "Send Certificate via Email")}
                          >
                            <Mail size={14} />
                          </button>

                          <button
                            onClick={() => handlePrintSingle(rec)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all cursor-pointer"
                            title={t("cert.printCertificateBtn", "Print Certificate")}
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          5. MODAL: ADD CUSTOM RECIPIENT
      ───────────────────────────────────────────── */}
      {isAddRecipientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">{t("cert.addCustomRecipient", "Add Custom Recipient")}</h3>
              <button
                onClick={() => setIsAddRecipientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomRecipientSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("cert.fullNameLabel", "Full Name")} *</label>
                <input
                  type="text"
                  required
                  value={newRecName}
                  onChange={(e) => setNewRecName(e.target.value)}
                  placeholder={t("cert.fullNamePlaceholder", "e.g. Dr. Alexandre Dupont")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("cert.emailAddressLabel", "Email Address")}</label>
                <input
                  type="email"
                  value={newRecEmail}
                  onChange={(e) => setNewRecEmail(e.target.value)}
                  placeholder={t("cert.emailPlaceholder", "alexandre@example.com")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t("cert.colRoleCategory", "Role / Category")}</label>
                  <SearchableSelect
                    value={newRecRole}
                    onChange={(val) => setNewRecRole(val)}
                    options={[
                      { value: "Attendee", label: t("cert.badgeAttendee", "Attendee") },
                      { value: "Speaker", label: t("cert.badgeSpeaker", "Speaker") },
                      { value: "Sponsor", label: t("cert.badgeSponsor", "Sponsor") },
                      { value: "Exhibitor", label: t("cert.badgeExhibitor", "Exhibitor") },
                      { value: "Special Guest", label: t("cert.roleSpecialGuest", "Special Guest") },
                    ]}
                    placeholder={t("cert.rolePlaceholder", "Role...")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t("cert.varJobTitle", "Job Title")}</label>
                  <input
                    type="text"
                    value={newRecJobTitle}
                    onChange={(e) => setNewRecJobTitle(e.target.value)}
                    placeholder={t("cert.jobTitlePlaceholder", "e.g. Keynote Speaker")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("cert.colCompanyOrg", "Organization / Company")}</label>
                <input
                  type="text"
                  value={newRecCompany}
                  onChange={(e) => setNewRecCompany(e.target.value)}
                  placeholder={t("cert.companyPlaceholder", "e.g. University of Science & Technology")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRecipientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  {t("cert.saveRecipientBtn", "Save Recipient")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          6. MODAL: IMPORT CSV
      ───────────────────────────────────────────── */}
      {isImportCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{t("cert.bulkImportCsvTitle", "Bulk Import Recipients (CSV)")}</h3>
                <p className="text-xs text-slate-500">{t("cert.bulkImportCsvDesc", "Paste comma-separated rows: Name, Email, Role, Company, JobTitle")}</p>
              </div>
              <button
                onClick={() => setIsImportCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportCsvSubmit} className="space-y-3.5">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={"Elena Rostova, elena@example.com, Speaker, InnovateLabs, Lead AI Engineer\nMarcus Vance, marcus@example.com, Attendee, CyberTech, Security Officer"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all resize-none"
              />

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportCsvModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  {t("cert.importAllRows", "Import All Rows")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          7. MODAL: SEND SINGLE CERTIFICATE VIA EMAIL
      ───────────────────────────────────────────── */}
      {isEmailModalOpen && emailTargetRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-150 space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{t("cert.emailCertificateModalTitle", "Email Certificate")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("cert.emailCertificateModalDesc", "Send verified certificate document directly to recipient")}</p>
              </div>
              <button
                type="button"
                onClick={() => !isSendingEmail && setIsEmailModalOpen(false)}
                disabled={isSendingEmail}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSingleEmail} className="space-y-5">
              {/* Recipient Overview Badge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">{emailTargetRecipient.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="capitalize font-semibold">{emailTargetRecipient.role || "Attendee"}</span>
                    {emailTargetRecipient.company && <span>• {emailTargetRecipient.company}</span>}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-100">
                  {emailTargetRecipient.certId || emailTargetRecipient.certificateId || `EZ-CERT-${emailTargetRecipient.id}`}
                </span>
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t("cert.recipientEmailAddress", "Recipient Email Address")} *
                </label>
                <input
                  type="email"
                  required
                  value={emailRecipientAddress}
                  onChange={(e) => setEmailRecipientAddress(e.target.value)}
                  placeholder={t("cert.recipientEmailPlaceholder", "e.g. recipient@example.com")}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t("cert.emailSubjectLine", "Email Subject Line")}
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Custom Personal Note */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t("cert.personalMessageNote", "Personal Message / Note")}
                </label>
                <textarea
                  rows={5}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder={t("cert.personalMessagePlaceholder", "Add an optional message or congratulatory note...")}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none transition-all"
                />
              </div>

              {/* Feedback Banners */}
              {emailSendStatus === "error" && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{emailFeedbackMessage || "Failed to send email."}</span>
                </div>
              )}

              {emailSendStatus === "success" && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold animate-fade-in">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{emailFeedbackMessage || "Certificate delivered successfully!"}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={isSendingEmail}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-xs cursor-pointer flex items-center gap-2 transition-all"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>{t("cert.sendingCertificate", "Sending Certificate...")}</span>
                    </>
                  ) : (
                    <span>{t("cert.sendCertificateBtn", "Send Certificate")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          8. MODAL: BATCH EMAIL CERTIFICATES
      ───────────────────────────────────────────── */}
      {isBatchEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-150 space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{t("cert.batchEmailModalTitle", "Batch Email Certificates")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("cert.batchEmailModalDesc", "Dispatch certificates in bulk to selected participants")}</p>
              </div>
              <button
                type="button"
                onClick={() => !isBatchSendingEmail && setIsBatchEmailModalOpen(false)}
                disabled={isBatchSendingEmail}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* If Batch Delivery Finished -> Show Summary Report */}
            {batchEmailResults ? (
              <div className="space-y-5 py-2">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={26} />
                  </div>
                  <h4 className="text-base font-extrabold text-emerald-900">{t("cert.batchDeliveryCompleted", "Batch Delivery Completed!")}</h4>
                  <p className="text-xs text-emerald-700">{t("cert.batchDeliveryCompletedDesc", "Official certificate notifications have been dispatched.")}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-lg font-black text-emerald-600">{batchEmailResults.sent}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">{t("cert.deliveredStat", "Delivered")}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-lg font-black text-rose-600">{batchEmailResults.failed}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">{t("cert.failedStat", "Failed")}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-lg font-black text-amber-600">{batchEmailResults.skippedNoEmail}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">{t("cert.skippedStat", "Skipped (No Email)")}</div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchEmailModalOpen(false);
                      setBatchEmailResults(null);
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                  >
                    {t("cert.doneAndClose", "Done & Close")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Audience Overview Breakdown */}
                {(() => {
                  const targetList = selectedRecipientIds.size > 0
                    ? filteredRecipients.filter(r => selectedRecipientIds.has(r.id))
                    : filteredRecipients;
                  const withEmail = targetList.filter(r => (r.email || "").includes("@")).length;
                  const noEmail = targetList.length - withEmail;

                  return (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{t("cert.targetRecipients", "Target Recipients")}</span>
                        <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                          {targetList.length} Total
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
                        <span>✉️ <strong>{withEmail}</strong> {t("cert.validEmailAddresses", "valid email addresses")}</span>
                        {noEmail > 0 && (
                          <span className="text-amber-600 font-bold">⚠️ {noEmail} {t("cert.missingEmail", "missing email")}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Email Subject Template */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-800">{t("cert.emailSubjectTemplate", "Email Subject Template")}</label>
                    <span className="text-xs text-slate-400 font-medium">{t("cert.supportsDynamicTags", "Supports dynamic tags")}</span>
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isBatchSendingEmail}
                    value={batchEmailSubject}
                    onChange={(e) => setBatchEmailSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                  />
                  {/* Dynamic tags chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { tag: "{{name}}", label: "+ Name" },
                      { tag: "{{event_name}}", label: "+ Event Name" },
                      { tag: "{{certificate_id}}", label: "+ Cert ID" },
                    ].map(chip => (
                      <button
                        key={chip.tag}
                        type="button"
                        onClick={() => setBatchEmailSubject(prev => `${prev} ${chip.tag}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Body Template */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-800">{t("cert.messageBodyTemplate", "Message Body Template")}</label>
                    <span className="text-xs text-slate-400 font-medium">{t("cert.includedInEmailBody", "Included in email body")}</span>
                  </div>
                  <textarea
                    rows={5}
                    disabled={isBatchSendingEmail}
                    value={batchEmailMessage}
                    onChange={(e) => setBatchEmailMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none transition-all"
                  />
                  {/* Dynamic tags chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { tag: "{{name}}", label: "+ Name" },
                      { tag: "{{event_name}}", label: "+ Event Name" },
                      { tag: "{{certificate_id}}", label: "+ Cert ID" },
                      { tag: "{{role}}", label: "+ Role" },
                    ].map(chip => (
                      <button
                        key={chip.tag}
                        type="button"
                        onClick={() => setBatchEmailMessage(prev => `${prev} ${chip.tag}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Progress Bar if batch sending */}
                {isBatchSendingEmail && (
                  <div className="p-4.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-blue-600" />
                        <span>{t("cert.sendingInProgress", "Sending in progress...")}</span>
                      </span>
                      <span>{batchEmailProgress.current} of {batchEmailProgress.total}</span>
                    </div>

                    <div className="w-full h-2.5 bg-blue-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                        style={{
                          width: `${batchEmailProgress.total > 0 ? (batchEmailProgress.current / batchEmailProgress.total) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className="text-xs text-blue-700 font-mono truncate">
                      {batchEmailProgress.activeName}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBatchEmailModalOpen(false)}
                    disabled={isBatchSendingEmail}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendBatchEmails}
                    disabled={isBatchSendingEmail}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-xs cursor-pointer flex items-center gap-2 transition-all"
                  >
                    {isBatchSendingEmail ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>{t("cert.sendingInProgress", "Sending Batch...")}</span>
                      </>
                    ) : (
                      <span>{t("cert.startBatchDelivery", "Start Batch Delivery")}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          9. MODAL: SAVE / RENAME CUSTOM TEMPLATE
      ───────────────────────────────────────────── */}
      {isSaveCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingTemplateId ? t("cert.renameSavedTemplate", "Rename Saved Template") : t("cert.saveAsNewTemplate", "Save as New Template")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingTemplateId ? t("cert.renameTemplateDesc", "Update your template's title and category") : t("cert.saveTemplateDesc", "Store your current canvas design to your saved templates")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSaveCustomModalOpen(false);
                  setEditingTemplateId(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmSaveCustomTemplate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t("cert.templateNameLabel", "Template Name *")}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  placeholder={t("cert.templateNamePlaceholder", "e.g. VIP Speaker Platinum Award")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t("cert.categoryLabel", "Category")}
                </label>
                <SearchableSelect
                  value={customTemplateCategory}
                  onChange={(val) => setCustomTemplateCategory(val)}
                  options={localizedCategories.filter(c => c.id !== "all" && c.id !== "saved").map(c => ({
                    value: c.id,
                    label: c.label
                  }))}
                  placeholder={t("cert.chooseCategoryPlaceholder", "Choose category...")}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsSaveCustomModalOpen(false);
                    setEditingTemplateId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-all"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!customTemplateName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs cursor-pointer transition-all"
                >
                  {editingTemplateId ? t("cert.saveChanges", "Save Changes") : t("cert.saveTemplateBtn", "Save Template")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Offscreen High-Resolution Certificate Renderer for Batch Email PDF Generation */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "1123px",
          height: "794px",
          pointerEvents: "none",
          zIndex: -100,
          opacity: 0,
        }}
      >
        {batchCaptureRecipient && (
          <A4CertificateSheet
            id="batch-capture-certificate"
            template={activeTemplate}
            recipient={batchCaptureRecipient}
            eventDetails={eventDetails}
            isPrintTarget={false}
          />
        )}
      </div>

    </div>
  );
}
