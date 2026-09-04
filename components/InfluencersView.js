"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Share2, Users, DollarSign, TrendingUp, Filter, Search, Plus, 
  Sparkles, CheckCircle2, XCircle, X, ArrowRight, ArrowLeft, 
  MoreVertical, Calendar, Phone, Mail, FileText, ChevronRight,
  RotateCcw, Award, Trash2, Edit3, MessageSquare, 
  PieChart, BarChart2, Check, Download, AlertCircle, Clock,
  ExternalLink, Copy, QrCode, Megaphone, Eye, Percent, Play, Pause,
  Globe, ArrowUpRight, ShieldCheck, HelpCircle, CheckSquare, RefreshCw, Layers
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import CountryPhoneInput from "./CountryPhoneInput";
import TablePagination from "./TablePagination";

export const SOCIAL_PLATFORMS = [
  { value: "Instagram", label: "Instagram", labelKey: "Instagram", badgeColor: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "TikTok", label: "TikTok", labelKey: "TikTok", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "YouTube", label: "YouTube", labelKey: "YouTube", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "LinkedIn", label: "LinkedIn", labelKey: "LinkedIn", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "X", label: "X / Twitter", labelKey: "X / Twitter", badgeColor: "bg-slate-100 text-slate-800 border-slate-200" },
  { value: "Facebook", label: "Facebook", labelKey: "Facebook", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "Podcast", label: "Podcast / Audio", labelKey: "inf.platPodcast", defaultLabel: "Podcast / Audio", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Blog", label: "Blog / Website / Press", labelKey: "inf.platBlog", defaultLabel: "Blog / Website / Press", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "Other", label: "Other / Community Group", labelKey: "inf.platOther", defaultLabel: "Other / Community Group", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" }
];

export const PAYOUT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid / Pending", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "partial", label: "Partially Paid", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "paid", label: "Fully Paid", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];

export default function InfluencersView({
  state = {},
  onUpdateState,
  onOpenModal,
  onSwitchView,
  onUploadFile
}) {
  const { t, lang, isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    influencers = [],
    attendees = [],
    tickets = [],
    eventDetails = {},
    activeEventId,
    currentUser
  } = state;

  const currency = eventDetails?.currency || "DZD";
  const formatPrice = (amount) => {
    const num = Number(amount) || 0;
    return `${num.toLocaleString()} ${currency}`;
  };

  // View & Filter States
  const [viewMode, setViewMode] = useState("table"); // "grid" | "table"
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // "all" | "active" | "paused" | "archived"
  const [payoutFilter, setPayoutFilter] = useState("all");
  const [sortBy, setSortBy] = useState("revenue"); // "revenue" | "registrations" | "clicks" | "name" | "recent"

  // Drawer / Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    platform: "Instagram",
    handle: "",
    email: "",
    phone: "",
    code: "",
    avatarUrl: "",
    ticketTier: "all",
    ticketId: null,
    discountType: "none", // "none" | "percent" | "fixed"
    discountValue: 0,
    commissionType: "none", // "none" | "percent" | "fixed"
    commissionValue: 0,
    targetGoal: 50,
    notes: "",
    status: "active",
    payoutStatus: "unpaid",
    payoutNotes: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Attributed Attendees Slide-over Drawer
  const [inspectingInfluencer, setInspectingInfluencer] = useState(null);

  // Share Kit & QR Code Modal
  const [shareKitInfluencer, setShareKitInfluencer] = useState(null);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState("");
  const [copiedLinkMap, setCopiedLinkMap] = useState({});
  const [copiedPromoMap, setCopiedPromoMap] = useState({});
  const [copiedShareKit, setCopiedShareKit] = useState(false);

  // Dropdown options for tickets
  const ticketOptions = useMemo(() => {
    const opts = [{ value: "all", label: t("inf.allTickets", "All Ticket Tiers (Entire Event)") }];
    (tickets || []).filter(t => !t.isArchived).forEach(tk => {
      const name = tk.name || tk.tier || "Ticket";
      const priceStr = tk.price && Number(tk.price) > 0 ? ` (${formatPrice(tk.price)})` : " (Free)";
      opts.push({
        value: name,
        label: `${name}${priceStr}`,
        id: tk.id
      });
    });
    return opts;
  }, [tickets, currency, t]);

  // Helper for platform display label
  const getPlatformLabel = (platValue) => {
    const p = SOCIAL_PLATFORMS.find(item => item.value === platValue);
    if (!p) return platValue;
    if (p.labelKey && p.labelKey.startsWith("inf.")) return t(p.labelKey, p.defaultLabel || p.label);
    return p.label;
  };

  // Platform options for filter and form
  const platformSelectOptions = useMemo(() => {
    return [
      { value: "all", label: t("inf.filterPlatform", "All Platforms") },
      ...SOCIAL_PLATFORMS.map(p => ({
        value: p.value,
        label: p.labelKey && p.labelKey.startsWith("inf.") ? t(p.labelKey, p.defaultLabel || p.label) : p.label
      }))
    ];
  }, [t]);

  const formPlatformOptions = useMemo(() => {
    return SOCIAL_PLATFORMS.map(p => ({
      value: p.value,
      label: p.labelKey && p.labelKey.startsWith("inf.") ? t(p.labelKey, p.defaultLabel || p.label) : p.label
    }));
  }, [t]);

  // Payout options with localized labels
  const payoutStatusOptions = useMemo(() => [
    { value: "unpaid", label: t("inf.payoutUnpaidPending", "Unpaid / Pending"), badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "partial", label: t("inf.payoutPartiallyPaid", "Partially Paid"), badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "paid", label: t("inf.payoutFullyPaid", "Fully Paid"), badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  ], [t]);

  // Compute live performance metrics for each influencer
  const enrichedInfluencers = useMemo(() => {
    const activeTickets = tickets || [];
    return (influencers || []).map(inf => {
      const codeClean = (inf.code || "").trim().toUpperCase();
      const infId = inf.id;

      // Find all attendees attributed to this influencer
      const attributedAttendees = (attendees || []).filter(a => {
        if (a.isArchived || a.status === "archived") return false;
        const aCode = (a.referralCode || a.referral_code || "").trim().toUpperCase();
        const aInfId = a.influencerId || a.influencer_id;
        const answerCode = (a.answers?._referral_code || a.answers?.referral_code || a.answers?.referralCode || a.formAnswers?._referral_code || "").trim().toUpperCase();

        if (codeClean && (aCode === codeClean || answerCode === codeClean)) return true;
        if (infId && (aInfId === infId || a.answers?._influencer_id === infId)) return true;
        return false;
      });

      const registrationsCount = attributedAttendees.length;
      const clicksCount = Number(inf.clicks) || 0;
      const conversionRate = clicksCount > 0 ? Math.min(100, (registrationsCount / clicksCount) * 100) : (registrationsCount > 0 ? 100 : 0);

      // Compute Gross Revenue
      let grossRevenue = 0;
      let totalDiscountGiven = 0;

      attributedAttendees.forEach(att => {
        const ticketTierName = att.ticketType || att.ticket_type || "";
        const matchedTicket = activeTickets.find(tk => 
          (tk.name || tk.tier || "").trim().toLowerCase() === ticketTierName.trim().toLowerCase() ||
          tk.id === att.ticketId
        );
        const basePrice = matchedTicket ? (Number(matchedTicket.price) || 0) : 0;
        const discountGiven = Number(att.discountApplied || att.discount_applied) || 0;
        const effectivePrice = Math.max(0, basePrice - discountGiven);

        grossRevenue += effectivePrice;
        totalDiscountGiven += discountGiven;
      });

      // Compute Commission Owed
      let commissionDue = 0;
      if (inf.commissionPercent && Number(inf.commissionPercent) > 0) {
        commissionDue = (grossRevenue * Number(inf.commissionPercent)) / 100;
      } else if (inf.commissionAmount && Number(inf.commissionAmount) > 0) {
        commissionDue = registrationsCount * Number(inf.commissionAmount);
      }

      const targetGoal = Number(inf.targetGoal) || 50;
      const goalProgressPct = targetGoal > 0 ? Math.min(100, Math.round((registrationsCount / targetGoal) * 100)) : 0;

      return {
        ...inf,
        attributedAttendees,
        registrationsCount,
        clicksCount,
        conversionRate,
        grossRevenue,
        totalDiscountGiven,
        commissionDue,
        goalProgressPct
      };
    });
  }, [influencers, attendees, tickets]);

  // Global KPIs summary
  const summaryKpis = useMemo(() => {
    const totalInf = enrichedInfluencers.filter(i => !i.isArchived).length;
    const activeInf = enrichedInfluencers.filter(i => !i.isArchived && i.status === "active").length;
    const totalClicks = enrichedInfluencers.filter(i => !i.isArchived).reduce((sum, i) => sum + i.clicksCount, 0);
    const totalRegistrations = enrichedInfluencers.filter(i => !i.isArchived).reduce((sum, i) => sum + i.registrationsCount, 0);
    const totalRevenue = enrichedInfluencers.filter(i => !i.isArchived).reduce((sum, i) => sum + i.grossRevenue, 0);
    const totalCommissions = enrichedInfluencers.filter(i => !i.isArchived).reduce((sum, i) => sum + i.commissionDue, 0);
    const overallConversion = totalClicks > 0 ? (totalRegistrations / totalClicks) * 100 : (totalRegistrations > 0 ? 100 : 0);

    // Top performer
    const sortedByReg = [...enrichedInfluencers.filter(i => !i.isArchived)].sort((a, b) => b.registrationsCount - a.registrationsCount);
    const topPerformer = sortedByReg.length > 0 && sortedByReg[0].registrationsCount > 0 ? sortedByReg[0] : null;

    return {
      totalInf,
      activeInf,
      totalClicks,
      totalRegistrations,
      totalRevenue,
      totalCommissions,
      overallConversion,
      topPerformer
    };
  }, [enrichedInfluencers]);

  // Filtered & Sorted Influencers
  const filteredInfluencers = useMemo(() => {
    return enrichedInfluencers.filter(inf => {
      // Status filter
      if (statusFilter === "active" && (inf.isArchived || inf.status !== "active")) return false;
      if (statusFilter === "paused" && (inf.isArchived || inf.status !== "paused")) return false;
      if (statusFilter === "archived" && !inf.isArchived && inf.status !== "archived") return false;
      if (statusFilter === "all" && inf.isArchived) return false;

      // Platform filter
      if (platformFilter !== "all" && inf.platform !== platformFilter) return false;

      // Payout filter
      if (payoutFilter !== "all" && (inf.payoutStatus || "unpaid") !== payoutFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (inf.name || "").toLowerCase().includes(q);
        const codeMatch = (inf.code || "").toLowerCase().includes(q);
        const handleMatch = (inf.handle || "").toLowerCase().includes(q);
        const emailMatch = (inf.email || "").toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !handleMatch && !emailMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "revenue") return b.grossRevenue - a.grossRevenue;
      if (sortBy === "registrations") return b.registrationsCount - a.registrationsCount;
      if (sortBy === "clicks") return b.clicksCount - a.clicksCount;
      if (sortBy === "conversion") return b.conversionRate - a.conversionRate;
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "recent") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });
  }, [enrichedInfluencers, statusFilter, platformFilter, payoutFilter, searchQuery, sortBy]);

  // Construct referral tracking link for an influencer
  const getReferralUrl = (code) => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const slugOrId = eventDetails?.slug || activeEventId || eventDetails?.id || "";
    return `${origin}/${slugOrId}?ref=${encodeURIComponent(code)}`;
  };

  // 1-Click Copy Link
  const handleCopyLink = (inf, e) => {
    if (e) e.stopPropagation();
    const url = getReferralUrl(inf.code);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLinkMap(prev => ({ ...prev, [inf.id]: true }));
      setTimeout(() => {
        setCopiedLinkMap(prev => ({ ...prev, [inf.id]: false }));
      }, 2500);
    }
  };

  // 1-Click Copy Promo Code
  const handleCopyPromo = (inf, e) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inf.code);
      setCopiedPromoMap(prev => ({ ...prev, [inf.id]: true }));
      setTimeout(() => {
        setCopiedPromoMap(prev => ({ ...prev, [inf.id]: false }));
      }, 2500);
    }
  };

  // Open Share Kit & QR Code Modal
  const handleOpenShareKit = async (inf, e) => {
    if (e) e.stopPropagation();
    setShareKitInfluencer(inf);
    const url = getReferralUrl(inf.code);
    try {
      const qrUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" }
      });
      setGeneratedQrDataUrl(qrUrl);
    } catch (err) {
      console.warn("QR generation error:", err);
    }
  };

  // Download QR Code PNG
  const handleDownloadQrPng = () => {
    if (!generatedQrDataUrl || !shareKitInfluencer) return;
    const link = document.createElement("a");
    link.href = generatedQrDataUrl;
    link.download = `QRCode_${shareKitInfluencer.code}_${eventDetails?.title || "Event"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Pre-Formatted Pitch Message (Localized)
  const handleCopyPitchMessage = () => {
    if (!shareKitInfluencer) return;
    const eventTitle = eventDetails?.title || (lang === "ar" ? "فعاليتنا القادمة" : lang === "fr" ? "Notre prochain événement" : "Our Upcoming Event");
    const datesRaw = eventDetails?.startDate ? `${eventDetails.startDate}${eventDetails.endDate ? ` - ${eventDetails.endDate}` : ""}` : "";
    const datesStr = datesRaw ? t("inf.onDates", " on {dates}").replace("{dates}", datesRaw) : "";
    
    let discountText = "";
    if (shareKitInfluencer.discountPercent > 0) {
      discountText = t("inf.pitchExclusivePercent", "Get an exclusive {percent}% OFF using my link! ").replace("{percent}", shareKitInfluencer.discountPercent);
    } else if (shareKitInfluencer.discountAmount > 0) {
      discountText = t("inf.pitchExclusiveFixed", "Get an exclusive {amount} discount using my link! ").replace("{amount}", formatPrice(shareKitInfluencer.discountAmount));
    }

    const url = getReferralUrl(shareKitInfluencer.code);
    const pitchTemplate = t("inf.pitchJoinMe", "🎟️ Join me at *{eventTitle}*{dates}!\n\n{discountText}Get your official passes here:\n👉 {url}\n\nCan't wait to see you there! ✨");
    const pitchText = pitchTemplate
      .replace("{eventTitle}", eventTitle)
      .replace("{dates}", datesStr)
      .replace("{discountText}", discountText)
      .replace("{url}", url);

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(pitchText);
      setCopiedShareKit(true);
      setTimeout(() => setCopiedShareKit(false), 3000);
    }
  };

  // Open Drawer to Add Influencer
  const handleOpenAdd = () => {
    setEditingInfluencer(null);
    setFormData({
      name: "",
      platform: "Instagram",
      handle: "",
      email: "",
      phone: "",
      code: `REF${Math.floor(1000 + Math.random() * 9000)}`,
      avatarUrl: "",
      ticketTier: "all",
      ticketId: null,
      discountType: "none",
      discountValue: 0,
      commissionType: "none",
      commissionValue: 0,
      targetGoal: 50,
      notes: "",
      status: "active",
      payoutStatus: "unpaid",
      payoutNotes: ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Open Drawer to Edit Influencer
  const handleOpenEdit = (inf, e) => {
    if (e) e.stopPropagation();
    setEditingInfluencer(inf);

    let dType = "none";
    let dVal = 0;
    if (inf.discountPercent && Number(inf.discountPercent) > 0) {
      dType = "percent";
      dVal = Number(inf.discountPercent);
    } else if (inf.discountAmount && Number(inf.discountAmount) > 0) {
      dType = "fixed";
      dVal = Number(inf.discountAmount);
    }

    let cType = "none";
    let cVal = 0;
    if (inf.commissionPercent && Number(inf.commissionPercent) > 0) {
      cType = "percent";
      cVal = Number(inf.commissionPercent);
    } else if (inf.commissionAmount && Number(inf.commissionAmount) > 0) {
      cType = "fixed";
      cVal = Number(inf.commissionAmount);
    }

    setFormData({
      name: inf.name || "",
      platform: inf.platform || "Instagram",
      handle: inf.handle || "",
      email: inf.email || "",
      phone: inf.phone || "",
      code: inf.code || "",
      avatarUrl: inf.avatar || inf.avatarUrl || "",
      ticketTier: inf.ticketTier || "all",
      ticketId: inf.ticketId || null,
      discountType: dType,
      discountValue: dVal,
      commissionType: cType,
      commissionValue: cVal,
      targetGoal: inf.targetGoal !== undefined ? Number(inf.targetGoal) : 50,
      notes: inf.notes || "",
      status: inf.status || "active",
      payoutStatus: inf.payoutStatus || "unpaid",
      payoutNotes: inf.payoutNotes || ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Name to slug generator
  const handleNameChange = (newName) => {
    setFormData(prev => {
      const updated = { ...prev, name: newName };
      if (!editingInfluencer) {
        const slug = newName
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 10);
        if (slug) updated.code = `${slug}${new Date().getFullYear().toString().slice(-2)}`;
      }
      return updated;
    });
  };

  // Save Influencer
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = t("inf.nameRequired", "Influencer name is required");

    let cleanCode = (formData.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      const slug = formData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 8) || "REF";
      cleanCode = `${slug}${Math.floor(100 + Math.random() * 900)}`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      id: editingInfluencer ? editingInfluencer.id : (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })),
      name: formData.name.trim(),
      platform: formData.platform || "Instagram",
      handle: formData.handle.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      code: cleanCode,
      avatar: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name.trim())}&background=3b82f6&color=fff`,
      avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name.trim())}&background=3b82f6&color=fff`,
      ticketTier: formData.ticketTier || "all",
      ticketId: formData.ticketId || null,
      discountPercent: formData.discountType === "percent" ? Number(formData.discountValue) || 0 : 0,
      discountAmount: formData.discountType === "fixed" ? Number(formData.discountValue) || 0 : 0,
      commissionPercent: formData.commissionType === "percent" ? Number(formData.commissionValue) || 0 : 0,
      commissionAmount: formData.commissionType === "fixed" ? Number(formData.commissionValue) || 0 : 0,
      targetGoal: Number(formData.targetGoal) || 50,
      notes: formData.notes.trim(),
      status: formData.status || "active",
      isArchived: formData.status === "archived",
      payoutStatus: formData.payoutStatus || "unpaid",
      payoutNotes: formData.payoutNotes || "",
      clicks: editingInfluencer ? (editingInfluencer.clicks || 0) : 0,
      createdAt: editingInfluencer ? (editingInfluencer.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingInfluencer) {
      onUpdateState("influencers", (influencers || []).map(i => i.id === editingInfluencer.id ? payload : i));
    } else {
      onUpdateState("influencers", [payload, ...(influencers || [])]);
    }

    setIsDrawerOpen(false);
  };

  // Toggle Status (Pause / Resume)
  const handleToggleStatus = (inf, e) => {
    if (e) e.stopPropagation();
    const nextStatus = inf.status === "active" ? "paused" : "active";
    onUpdateState("influencers", (influencers || []).map(i => i.id === inf.id ? { ...i, status: nextStatus } : i));
  };

  // Quick Payout Status update
  const handleUpdatePayoutStatus = (inf, newStatus, e) => {
    if (e) e.stopPropagation();
    onUpdateState("influencers", (influencers || []).map(i => i.id === inf.id ? { ...i, payoutStatus: newStatus } : i));
  };

  // Archive Influencer
  const handleArchiveInfluencer = (id, e) => {
    if (e) e.stopPropagation();
    if (confirm(t("inf.confirmArchive", "Are you sure you want to archive this influencer campaign? Attributed data will be preserved."))) {
      onUpdateState("influencers", (influencers || []).map(i => i.id === id ? { ...i, status: "archived", isArchived: true } : i));
    }
  };

  // Export CSV Report
  const handleExportCsv = () => {
    if (filteredInfluencers.length === 0) return;
    const headers = [
      "Influencer Name",
      "Platform",
      "Handle",
      "Email",
      "Phone",
      "Referral Code",
      "Tracking Link",
      "Status",
      "Target Ticket",
      "Buyer Discount",
      "Commission Rate",
      "Link Clicks",
      "Registrations Brought",
      "Conversion Rate (%)",
      "Gross Revenue (" + currency + ")",
      "Commission Due (" + currency + ")",
      "Payout Status",
      "Notes"
    ];

    const rows = filteredInfluencers.map(i => {
      let discountStr = "None";
      if (i.discountPercent > 0) discountStr = `${i.discountPercent}% OFF`;
      else if (i.discountAmount > 0) discountStr = `${i.discountAmount} ${currency} OFF`;

      let commissionStr = "None";
      if (i.commissionPercent > 0) commissionStr = `${i.commissionPercent}% of revenue`;
      else if (i.commissionAmount > 0) commissionStr = `${i.commissionAmount} ${currency} per pass`;

      return [
        `"${(i.name || "").replace(/"/g, '""')}"`,
        `"${i.platform || ""}"`,
        `"${(i.handle || "").replace(/"/g, '""')}"`,
        `"${i.email || ""}"`,
        `"${i.phone || ""}"`,
        `"${i.code || ""}"`,
        `"${getReferralUrl(i.code)}"`,
        `"${i.status || "active"}"`,
        `"${i.ticketTier || "all"}"`,
        `"${discountStr}"`,
        `"${commissionStr}"`,
        i.clicksCount,
        i.registrationsCount,
        i.conversionRate.toFixed(1),
        i.grossRevenue,
        i.commissionDue,
        `"${i.payoutStatus || "unpaid"}"`,
        `"${(i.notes || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Influencers_Report_${eventDetails?.title || "Event"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for platform icon and badge color
  const getPlatformMeta = (platName) => {
    return SOCIAL_PLATFORMS.find(p => p.value === platName) || SOCIAL_PLATFORMS[0];
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* 1. HEADER & ACTIONS */}
      <header className="flex flex-wrap justify-between items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("inf.title", "Influencers & Affiliates")}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {t("inf.subtitle", "Create custom referral ticket links for influencers, track traffic clicks, and monitor registrations & revenue attribution in real time.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={filteredInfluencers.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>{t("inf.exportCSV", "Export CSV")}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Plus size={15} />
            <span>{t("inf.addInfluencer", "Add Influencer")}</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Total Campaigns */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("inf.totalInfluencers", "Influencers")}</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 size={12} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-800">
              <bdi dir="ltr">{summaryKpis.totalInf}</bdi>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
              <span><bdi dir="ltr">{summaryKpis.activeInf}</bdi> {t("inf.activeCampaigns", "active")}</span>
            </span>
          </div>
        </div>

        {/* Total Link Clicks */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("inf.totalClicks", "Link Clicks")}</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye size={12} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-800">
              <bdi dir="ltr">{summaryKpis.totalClicks.toLocaleString()}</bdi>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
              {t("inf.attributedVisits", "Attributed visits")}
            </span>
          </div>
        </div>

        {/* Registrations Brought */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("inf.totalRegistrations", "Registrations")}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={12} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-emerald-700">
              <bdi dir="ltr">{summaryKpis.totalRegistrations}</bdi>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block flex items-center gap-1">
              <bdi dir="ltr">{summaryKpis.overallConversion.toFixed(1)}%</bdi> <span>{t("inf.conversionRateSubtitle", "conversion")}</span>
            </span>
          </div>
        </div>

        {/* Attributed Gross Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("inf.totalRevenue", "Gross Revenue")}</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign size={12} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-800 truncate" title={formatPrice(summaryKpis.totalRevenue)}>
              <bdi dir="ltr">{summaryKpis.totalRevenue.toLocaleString()}</bdi> <span className="text-[10px] text-slate-400 font-bold">{currency}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
              {t("inf.ticketSalesValue", "Ticket sales value")}
            </span>
          </div>
        </div>

        {/* Total Commissions Due */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("inf.totalCommissions", "Commissions")}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Award size={12} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-rose-700 truncate" title={formatPrice(summaryKpis.totalCommissions)}>
              <bdi dir="ltr">{summaryKpis.totalCommissions.toLocaleString()}</bdi> <span className="text-[10px] text-rose-400 font-bold">{currency}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
              {t("inf.influencerRewards", "Influencer rewards")}
            </span>
          </div>
        </div>

        {/* Top Performer Spotlight */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-200">{t("inf.topPerformer", "Top Performer")}</span>
            <Sparkles size={13} className="text-amber-300" />
          </div>
          <div className="mt-2">
            {summaryKpis.topPerformer ? (
              <>
                <div className="text-sm font-extrabold truncate">{summaryKpis.topPerformer.name}</div>
                <span className="text-[10px] font-bold text-blue-100 mt-0.5 block">
                  <bdi dir="ltr">{summaryKpis.topPerformer.registrationsCount}</bdi> {t("inf.passesSold", "passes")} (<bdi dir="ltr">{formatPrice(summaryKpis.topPerformer.grossRevenue)}</bdi>)
                </span>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-blue-100">{t("inf.noSalesYet", "No sales yet")}</div>
                <span className="text-[9px] text-blue-200 mt-0.5 block">{t("inf.shareLinksToTrack", "Share links to track")}</span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 3. FILTER, SEARCH & VIEW TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Search Bar, Platform Filter, & Status Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Compact Search Bar */}
          <div className="relative w-60 sm:w-64">
            <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${isRTL ? "right-3.5" : "left-3.5"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("inf.searchPlaceholder", "Search influencers...")}
              className={`w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isRTL ? "pr-9 pl-8" : "pl-9 pr-8"}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ${isRTL ? "left-2.5" : "right-2.5"}`}
              >
                <XCircle size={13} />
              </button>
            )}
          </div>

          {/* Platform Filter */}
          <div className="w-38 sm:w-40 shrink-0">
            <SearchableSelect
              value={platformFilter}
              onChange={setPlatformFilter}
              options={platformSelectOptions}
              placeholder="All Platforms"
              showSearch={false}
              className="text-xs"
              buttonClassName="py-2 text-xs font-semibold bg-slate-50 border-slate-200"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {[
              { id: "active", label: t("inf.statusActive", "Active") },
              { id: "paused", label: t("inf.statusPaused", "Paused") },
              { id: "all", label: t("inf.statusAll", "All") }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === tab.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Sort Selector & View Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sort Selector - widened to prevent truncation in all languages */}
          <div className="w-52 sm:w-56 shrink-0">
            <SearchableSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "revenue", label: t("inf.sortRevenue", "Sort: Highest Revenue") },
                { value: "registrations", label: t("inf.sortRegistrations", "Sort: Most Passes") },
                { value: "clicks", label: t("inf.sortClicks", "Sort: Most Clicks") },
                { value: "conversion", label: t("inf.sortConversion", "Sort: Highest Conversion") },
                { value: "recent", label: t("inf.sortRecent", "Sort: Recently Added") },
                { value: "name", label: t("inf.sortName", "Sort: Name A-Z") }
              ]}
              showSearch={false}
              className="text-xs"
              buttonClassName="py-2 text-xs font-semibold bg-slate-50 border-slate-200"
            />
          </div>

          {/* View Mode Toggle (Table / Grid) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title={t("inf.viewTable", "Table View")}
            >
              <FileText size={15} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title={t("inf.viewGrid", "Grid View")}
            >
              <BarChart2 size={15} />
            </button>
          </div>

        </div>

      </div>

      {/* 4. INFLUENCERS CONTENT */}
      {filteredInfluencers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Megaphone size={28} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 mb-1">
            {searchQuery || platformFilter !== "all" || statusFilter !== "active"
              ? t("inf.noMatchingInfluencers", "No matching influencer campaigns found")
              : t("inf.noInfluencers", "No influencers or affiliate campaigns created yet.")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-6">
            {searchQuery || platformFilter !== "all" || statusFilter !== "active"
              ? t("inf.adjustFiltersDesc", "Try adjusting your search terms or filter settings to view your campaigns.")
              : t("inf.emptyStateDesc", "Launch tracking referral links to partner with influencers, bloggers, and promoters.")}
          </p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>{t("inf.addInfluencer", "Add Influencer")}</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInfluencers.map(inf => {
            const platMeta = getPlatformMeta(inf.platform);
            const isPaused = inf.status === "paused";
            const isArchived = inf.isArchived || inf.status === "archived";

            return (
              <div 
                key={inf.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${isPaused ? "border-amber-200 bg-amber-50/20" : isArchived ? "border-slate-200 opacity-60" : "border-slate-200 hover:border-blue-300"}`}
              >
                <div>
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                        {inf.name}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${platMeta.badgeColor}`}>
                          {getPlatformLabel(inf.platform)}
                        </span>
                        {inf.handle && (
                          <span className="text-[10px] font-semibold text-slate-500 truncate" title={inf.handle} dir="ltr">
                            {inf.handle}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${isPaused ? "bg-amber-50 text-amber-700 border-amber-200" : isArchived ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {isPaused ? t("inf.statusPaused", "Paused") : isArchived ? t("inf.statusArchived", "Archived") : t("inf.statusActive", "Active")}
                    </span>
                  </div>

                  {/* Referral Link Box */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        {t("inf.referralLink", "Referral Link")}
                      </div>
                      <div className="text-[11px] text-slate-700 font-semibold truncate" title={getReferralUrl(inf.code)} dir="ltr">
                        {getReferralUrl(inf.code)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleCopyLink(inf, e)}
                        className="text-[11px] font-extrabold text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedLinkMap[inf.id] ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600 font-bold">{t("inf.linkCopied", "Copied!")}</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>{t("inf.copyLink", "Copy Link")}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleOpenShareKit(inf, e)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title={t("inf.shareKit", "Share Kit & QR Code")}
                      >
                        <QrCode size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Deal parameters */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.buyerDiscount", "Buyer Discount")}</span>
                      <span className="font-extrabold text-slate-700 mt-0.5 block">
                        {inf.discountPercent > 0 ? (
                          <span className="text-emerald-600 font-black"><bdi dir="ltr">{inf.discountPercent}%</bdi> {t("inf.off", "OFF")}</span>
                        ) : inf.discountAmount > 0 ? (
                          <span className="text-emerald-600 font-black"><bdi dir="ltr">{formatPrice(inf.discountAmount)}</bdi> {t("inf.off", "OFF")}</span>
                        ) : (
                          <span className="text-slate-400">{t("inf.noDiscount", "No discount")}</span>
                        )}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.commission", "Commission")}</span>
                      <span className="font-extrabold text-slate-700 mt-0.5 block truncate">
                        {inf.commissionPercent > 0 ? (
                          <span className="text-blue-600 font-black"><bdi dir="ltr">{inf.commissionPercent}%</bdi> {t("inf.commShare", "share")}</span>
                        ) : inf.commissionAmount > 0 ? (
                          <span className="text-blue-600 font-black"><bdi dir="ltr">{formatPrice(inf.commissionAmount)}</bdi> / {t("inf.perPass", "pass")}</span>
                        ) : (
                          <span className="text-slate-400">{t("inf.trackingOnly", "Tracking only")}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Goal Progress */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-400 uppercase tracking-wider">{t("inf.goalProgress", "Goal Progress")}</span>
                      <span className="text-slate-700">
                        <bdi dir="ltr">{inf.registrationsCount} / {inf.targetGoal || 50}</bdi> {t("inf.passesSold", "passes")} (<bdi dir="ltr">{inf.goalProgressPct}%</bdi>)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${inf.goalProgressPct >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                        style={{ width: `${inf.goalProgressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 3 Metrics */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.clicks", "Clicks")}</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block"><bdi dir="ltr">{inf.clicksCount}</bdi></span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.salesValue", "Sales Value")}</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block truncate" title={formatPrice(inf.grossRevenue)}>
                        <bdi dir="ltr">{inf.grossRevenue > 0 ? `${(inf.grossRevenue / 1000).toFixed(0)}k ${currency}` : "0"}</bdi>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.rewardDue", "Reward Due")}</span>
                      <span className="text-xs font-black text-rose-600 mt-0.5 block truncate" title={formatPrice(inf.commissionDue)}>
                        <bdi dir="ltr">{inf.commissionDue > 0 ? formatPrice(inf.commissionDue) : "0"}</bdi>
                      </span>
                    </div>
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-150 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInspectingInfluencer(inf)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Users size={13} />
                    <span>
                      <bdi dir="ltr">{inf.registrationsCount}</bdi> {t("inf.attributedAttendees", "Attendees")}
                    </span>
                    <ChevronRight size={13} className="rtl:rotate-180 transition-transform" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleStatus(inf, e)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${isPaused ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                      title={isPaused ? t("inf.clickToResume", "Click to Resume Campaign") : t("inf.clickToPause", "Click to Pause Campaign")}
                    >
                      {isPaused ? t("inf.resume", "Resume") : t("inf.pause", "Pause")}
                    </button>

                    <button
                      onClick={(e) => handleOpenEdit(inf, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title={t("inf.edit", "Edit Influencer")}
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      onClick={(e) => handleArchiveInfluencer(inf.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={t("inf.archive", "Archive")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start rtl:text-right text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t("inf.colInfluencer", "Influencer")}</th>
                  <th className="py-3 px-3">{t("inf.colPlatform", "Platform")}</th>
                  <th className="py-3 px-3">{t("inf.colStatus", "Status")}</th>
                  <th className="py-3 px-3">{t("inf.colDiscount", "Buyer Discount")}</th>
                  <th className="py-3 px-3 text-center">{t("inf.colClicks", "Clicks")}</th>
                  <th className="py-3 px-3 text-center">{t("inf.colPasses", "Passes Sold")}</th>
                  <th className="py-3 px-3 text-right rtl:text-left">{t("inf.colRevenue", "Gross Revenue")}</th>
                  <th className="py-3 px-3 text-right rtl:text-left">{t("inf.colCommission", "Commission Due")}</th>
                  <th className="py-3 px-3 text-center">{t("inf.colPayout", "Payout")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("inf.colActions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInfluencers.map(inf => {
                  const platMeta = getPlatformMeta(inf.platform);
                  const isPaused = inf.status === "paused";
                  const isArchived = inf.status === "archived" || inf.isArchived;

                  return (
                    <tr key={inf.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">{inf.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium truncate" dir="ltr">{inf.email || inf.phone || t("inf.noContact", "No contact")}</div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${platMeta.badgeColor}`}>
                            {getPlatformLabel(inf.platform)} {inf.handle ? `• ${inf.handle}` : ""}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => handleToggleStatus(inf, e)}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isPaused 
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                              : isArchived 
                                ? "bg-slate-100 text-slate-600 border-slate-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                          title={isPaused ? t("inf.clickToResume", "Click to Resume Campaign") : t("inf.clickToPause", "Click to Pause Campaign")}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-amber-500" : isArchived ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
                          {isPaused ? t("inf.statusPaused", "Paused") : isArchived ? t("inf.statusArchived", "Archived") : t("inf.statusActive", "Active")}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {inf.discountPercent > 0 ? (
                          <span className="text-emerald-600 font-bold"><bdi dir="ltr">{inf.discountPercent}%</bdi> {t("inf.off", "OFF")}</span>
                        ) : inf.discountAmount > 0 ? (
                          <span className="text-emerald-600 font-bold"><bdi dir="ltr">{formatPrice(inf.discountAmount)}</bdi> {t("inf.off", "OFF")}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">{t("inf.none", "None")}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        <bdi dir="ltr">{inf.clicksCount}</bdi>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setInspectingInfluencer(inf)}
                          className="inline-flex items-center gap-1 font-extrabold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                          title={t("inf.viewConvertedAttendees", "View Converted Attendees")}
                        >
                          <Users size={12} className="text-blue-500 shrink-0" />
                          <span><bdi dir="ltr">{inf.registrationsCount}</bdi></span>
                          <span className="text-[9px] text-slate-400 font-normal">/ <bdi dir="ltr">{inf.targetGoal || 50}</bdi></span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-right rtl:text-left font-extrabold text-slate-900">
                        <bdi dir="ltr">{formatPrice(inf.grossRevenue)}</bdi>
                      </td>

                      <td className="py-3 px-3 text-right rtl:text-left font-extrabold text-rose-600">
                        <bdi dir="ltr">{formatPrice(inf.commissionDue)}</bdi>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <select
                          value={inf.payoutStatus || "unpaid"}
                          onChange={(e) => handleUpdatePayoutStatus(inf, e.target.value)}
                          className="text-[10px] font-bold rounded-lg px-2 py-1 border bg-white cursor-pointer focus:outline-none"
                        >
                          <option value="unpaid">{t("inf.unpaid", "Unpaid")}</option>
                          <option value="partial">{t("inf.partial", "Partial")}</option>
                          <option value="paid">{t("inf.paid", "Paid")}</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Attributed Attendees */}
                          <button
                            onClick={() => setInspectingInfluencer(inf)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={`${inf.registrationsCount} ${t("inf.attributedAttendees", "Attributed Attendees")}`}
                          >
                            <Users size={13} />
                          </button>

                          {/* Copy Link */}
                          <button
                            onClick={(e) => handleCopyLink(inf, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={copiedLinkMap[inf.id] ? t("inf.linkCopied", "Copied!") : t("inf.copyLink", "Copy Tracking Link")}
                          >
                            {copiedLinkMap[inf.id] ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>

                          {/* Share Kit & QR Code */}
                          <button
                            onClick={(e) => handleOpenShareKit(inf, e)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={t("inf.shareKit", "Share Kit & QR Code")}
                          >
                            <QrCode size={13} />
                          </button>

                          {/* Pause / Resume Button */}
                          <button
                            onClick={(e) => handleToggleStatus(inf, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPaused
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                            title={isPaused ? t("inf.clickToResume", "Click to Resume Campaign") : t("inf.clickToPause", "Click to Pause Campaign")}
                          >
                            {isPaused ? <Play size={13} /> : <Pause size={13} />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={(e) => handleOpenEdit(inf, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("inf.edit", "Edit Influencer")}
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Archive / Delete */}
                          <button
                            onClick={(e) => handleArchiveInfluencer(inf.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={t("inf.archive", "Archive")}
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* 5. ADD / EDIT INFLUENCER DRAWER */}
      {mounted && isDrawerOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans" dir={isRTL ? "rtl" : "ltr"}>
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0"
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-white select-none">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {editingInfluencer ? t("inf.drawerTitleEdit", "Edit Influencer Campaign") : t("inf.drawerTitleAdd", "Add New Influencer Campaign")}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{t("inf.drawerSubtitle", "Configure partner details, tracking codes, discounts and commissions.")}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("inf.name", "Influencer Full Name")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t("inf.namePlaceholder", "e.g. Sarah TechDZ, Karim Dev, Amine Lifestyle")}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-200"}`}
                />
                {formErrors.name && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("inf.platform", "Primary Platform")}
                  </label>
                  <SearchableSelect
                    value={formData.platform}
                    onChange={(val) => setFormData(prev => ({ ...prev, platform: val }))}
                    options={formPlatformOptions}
                    showSearch={false}
                    className="text-xs"
                    buttonClassName="py-2.5 text-xs font-semibold bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("inf.handle", "Social Handle / Profile URL")}
                  </label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
                    placeholder={t("inf.handlePlaceholder", "@sarah_techdz or link")}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("inf.email", "Contact Email")}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sarah@agency.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("inf.phone", "WhatsApp / Phone")}
                  </label>
                  <CountryPhoneInput
                    value={formData.phone}
                    onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                    defaultCountry="DZ"
                    className="w-full"
                  />
                </div>
              </div>



              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("inf.targetTicket", "Target Ticket Tier")}
                </label>
                <SearchableSelect
                  value={formData.ticketTier}
                  onChange={(val, opt) => setFormData(prev => ({ ...prev, ticketTier: val, ticketId: opt?.id || null }))}
                  options={ticketOptions}
                  showSearch={ticketOptions.length > 4}
                  className="text-xs"
                  buttonClassName="py-2.5 text-xs font-semibold bg-slate-50 border-slate-200"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  {t("inf.discountType", "Buyer Discount Incentive")}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "none", label: t("inf.discountNoneBtn", "No Discount") },
                    { id: "percent", label: t("inf.discountPercentBtn", "% Percentage") },
                    { id: "fixed", label: t("inf.discountFixedBtn", "Fixed Amount") }
                  ].map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discountType: dt.id }))}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${formData.discountType === dt.id ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"}`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>

                {formData.discountType === "percent" && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discountValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      placeholder="10"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      dir="ltr"
                    />
                    <span className="text-xs font-bold text-slate-600">{t("inf.discountPercentHelp", "% OFF standard ticket price")}</span>
                  </div>
                )}

                {formData.discountType === "fixed" && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min="1"
                      value={formData.discountValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      placeholder="1000"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      dir="ltr"
                    />
                    <span className="text-xs font-bold text-slate-600"><bdi dir="ltr">{currency}</bdi> {t("inf.discountFixedHelp", "OFF per ticket")}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  {t("inf.commissionType", "Influencer Commission / Bounty")}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "none", label: t("inf.commNoneBtn", "No Commission") },
                    { id: "percent", label: t("inf.commPercentBtn", "% Revenue Share") },
                    { id: "fixed", label: t("inf.commFixedBtn", "Fixed Bounty") }
                  ].map(ct => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, commissionType: ct.id }))}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${formData.commissionType === ct.id ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"}`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>

                {formData.commissionType === "percent" && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.commissionValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                      placeholder="15"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      dir="ltr"
                    />
                    <span className="text-xs font-bold text-slate-600">{t("inf.commPercentHelp", "% of ticket sale revenue")}</span>
                  </div>
                )}

                {formData.commissionType === "fixed" && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min="1"
                      value={formData.commissionValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                      placeholder="500"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      dir="ltr"
                    />
                    <span className="text-xs font-bold text-slate-600"><bdi dir="ltr">{currency}</bdi> {t("inf.commFixedHelp", "per registered attendee")}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("inf.targetGoal", "Target Registrations Goal")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetGoal: e.target.value }))}
                  placeholder="50"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("inf.notes", "Collaboration Notes & Agreement Terms")}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t("inf.notesPlaceholder", "Contract agreed on 2 Instagram Stories + 1 Reel post before Sept 1st...")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("inf.campaignStatus", "Campaign Status")}
                  </label>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                    options={[
                      { value: "active", label: t("inf.statusActive", "Active") },
                      { value: "paused", label: t("inf.statusPaused", "Paused") }
                    ]}
                    showSearch={false}
                    className="text-xs"
                    buttonClassName="py-2.5 text-xs font-semibold bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("inf.payoutStatus", "Payout Status")}
                  </label>
                  <SearchableSelect
                    value={formData.payoutStatus}
                    onChange={(val) => setFormData(prev => ({ ...prev, payoutStatus: val }))}
                    options={payoutStatusOptions}
                    showSearch={false}
                    className="text-xs"
                    buttonClassName="py-2.5 text-xs font-semibold bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t("inf.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  {t("inf.save", "Save Influencer Campaign")}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 6. ATTRIBUTED ATTENDEES DRILL-DOWN DRAWER */}
      {mounted && inspectingInfluencer && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans" dir={isRTL ? "rtl" : "ltr"}>
          <div 
            onClick={() => setInspectingInfluencer(null)}
            className="absolute inset-0"
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 select-none">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {inspectingInfluencer.name}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  <bdi dir="ltr">{inspectingInfluencer.attributedAttendees.length}</bdi> {t("inf.attributedRegistrations", "Attributed Registrations")} • <bdi dir="ltr">{formatPrice(inspectingInfluencer.grossRevenue)}</bdi> {t("inf.totalRevenueTitle", "Total Revenue")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingInfluencer(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-blue-50/60 border-b border-blue-100 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.passesConverted", "Passes Converted")}</span>
                <span className="text-base font-black text-blue-700 mt-0.5 block"><bdi dir="ltr">{inspectingInfluencer.attributedAttendees.length}</bdi></span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.grossSales", "Gross Sales")}</span>
                <span className="text-base font-black text-slate-800 mt-0.5 block"><bdi dir="ltr">{formatPrice(inspectingInfluencer.grossRevenue)}</bdi></span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t("inf.commissionEarned", "Commission Earned")}</span>
                <span className="text-base font-black text-rose-600 mt-0.5 block"><bdi dir="ltr">{formatPrice(inspectingInfluencer.commissionDue)}</bdi></span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {inspectingInfluencer.attributedAttendees.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">{t("inf.noAttendees", "No attendees have registered through this influencer link yet.")}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {inspectingInfluencer.attributedAttendees.map((att, idx) => (
                    <div 
                      key={att.id || idx}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                          {(att.name || "A")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-800 text-xs truncate">{att.name || "Attendee"}</div>
                          <div className="text-[10px] text-slate-400 truncate">{att.email || t("inf.noEmail", "No email")} {att.company ? `• ${att.company}` : ""}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 block mb-0.5">
                          {att.ticketType || att.ticket_type || "Standard"}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {att.registeredDate || t("inf.recentlyRegistered", "Recently registered")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 7. SHARE KIT & QR CODE MODAL */}
      {mounted && shareKitInfluencer && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans" dir={isRTL ? "rtl" : "ltr"}>
          <div 
            onClick={() => setShareKitInfluencer(null)}
            className="absolute inset-0"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 animate-scale-up text-center border border-slate-200">
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="flex items-center gap-2 text-start rtl:text-right text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{t("inf.shareKitTitle", "Influencer Promotional Kit")}</h3>
                  <span className="text-[10px] font-semibold text-slate-400">{shareKitInfluencer.name}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareKitInfluencer(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block my-2 shadow-inner">
              {generatedQrDataUrl ? (
                <img 
                  src={generatedQrDataUrl} 
                  alt="Influencer QR Code" 
                  className="w-48 h-48 mx-auto rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  {t("inf.generatingQR", "Generating QR...")}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              {t("inf.qrHelper", "Scans directly route to your event with your referral link automatically tracked.")}
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={handleDownloadQrPng}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>{t("inf.downloadQR", "Download High-Res QR Code (PNG)")}</span>
              </button>

              <button
                onClick={handleCopyPitchMessage}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                {copiedShareKit ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600">{t("inf.shareKitCopied", "Pitch Message Copied!")}</span>
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} />
                    <span>{t("inf.shareKitCopy", "Copy WhatsApp / DM Pitch Message")}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
