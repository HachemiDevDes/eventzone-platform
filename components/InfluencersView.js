"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Share2, Users, DollarSign, TrendingUp, Filter, Search, Plus, 
  Sparkles, CheckCircle2, XCircle, X, ArrowRight, ArrowLeft, 
  MoreVertical, Calendar, Phone, Mail, FileText, ChevronRight,
  RotateCcw, Award, Trash2, Edit3, MessageSquare, 
  PieChart, BarChart2, Check, Download, AlertCircle, Clock,
  ExternalLink, Copy, QrCode, Tag, Megaphone, Eye, Percent,
  Globe, ArrowUpRight, ShieldCheck, HelpCircle, CheckSquare, RefreshCw, Layers
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import TablePagination from "./TablePagination";

export const SOCIAL_PLATFORMS = [
  { value: "Instagram", label: "Instagram", badgeColor: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "TikTok", label: "TikTok", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "YouTube", label: "YouTube", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "LinkedIn", label: "LinkedIn", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "X", label: "X / Twitter", badgeColor: "bg-slate-100 text-slate-800 border-slate-200" },
  { value: "Facebook", label: "Facebook", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "Podcast", label: "Podcast / Audio", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Blog", label: "Blog / Website / Press", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "Other", label: "Other / Community Group", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" }
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
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
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

  // Platform options for filter and form
  const platformSelectOptions = useMemo(() => {
    return [
      { value: "all", label: t("inf.filterPlatform", "All Platforms") },
      ...SOCIAL_PLATFORMS.map(p => ({ value: p.value, label: p.label }))
    ];
  }, [t]);

  const formPlatformOptions = useMemo(() => {
    return SOCIAL_PLATFORMS.map(p => ({ value: p.value, label: p.label }));
  }, []);

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
    const targetEventId = activeEventId || eventDetails?.id || "";
    return `${origin}/?eventId=${targetEventId}&ref=${encodeURIComponent(code)}`;
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

  // Copy Pre-Formatted Pitch Message
  const handleCopyPitchMessage = () => {
    if (!shareKitInfluencer) return;
    const eventTitle = eventDetails?.title || "Our Upcoming Summit";
    const eventDates = eventDetails?.startDate ? `${eventDetails.startDate}${eventDetails.endDate ? ` - ${eventDetails.endDate}` : ""}` : "";
    const referralUrl = getReferralUrl(shareKitInfluencer.code);
    let discountText = "";
    if (shareKitInfluencer.discountPercent > 0) {
      discountText = `Use promo code *${shareKitInfluencer.code}* to get ${shareKitInfluencer.discountPercent}% OFF! `;
    } else if (shareKitInfluencer.discountAmount > 0) {
      discountText = `Use promo code *${shareKitInfluencer.code}* to save ${formatPrice(shareKitInfluencer.discountAmount)}! `;
    }

    const pitchText = `🎟️ Join me at *${eventTitle}*${eventDates ? ` on ${eventDates}` : ""}!\n\n${discountText}Get your official passes here:\n👉 ${referralUrl}\n\nCan't wait to see you there! ✨`;

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
    if (!formData.name.trim()) errors.name = "Influencer name is required";
    if (!formData.code.trim()) errors.code = "Referral code is required";

    const cleanCode = formData.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) errors.code = "Code must contain valid alphanumeric characters";

    // Duplicate code check
    const duplicate = (influencers || []).find(i => 
      (i.code || "").trim().toUpperCase() === cleanCode && 
      (!editingInfluencer || i.id !== editingInfluencer.id) &&
      !i.isArchived
    );
    if (duplicate) errors.code = "This referral code is already used by another influencer campaign.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      id: editingInfluencer ? editingInfluencer.id : (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `inf-${Date.now()}`),
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
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      
      {/* 1. HEADER & ACTIONS */}
      <header className="flex flex-wrap justify-between items-center gap-4 select-none">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{t("inf.title", "Influencers & Affiliates")}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {summaryKpis.totalInf} {t("dash.activeEvents", "Campaigns")}
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {t("inf.subtitle", "Create custom referral ticket links for influencers, track traffic clicks, and monitor registrations & revenue attribution in real time.")}
              </p>
            </div>
          </div>
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
            <div className="text-xl font-extrabold text-slate-800">{summaryKpis.totalInf}</div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              {summaryKpis.activeInf} {t("inf.activeInfluencers", "active")}
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
            <div className="text-xl font-extrabold text-slate-800">{summaryKpis.totalClicks.toLocaleString()}</div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">Attributed visits</span>
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
            <div className="text-xl font-extrabold text-emerald-700">{summaryKpis.totalRegistrations}</div>
            <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">
              {summaryKpis.overallConversion.toFixed(1)}% conversion
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
              {summaryKpis.totalRevenue.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">{currency}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">Ticket sales value</span>
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
              {summaryKpis.totalCommissions.toLocaleString()} <span className="text-[10px] text-rose-400 font-bold">{currency}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">Influencer rewards</span>
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
                  {summaryKpis.topPerformer.registrationsCount} passes ({formatPrice(summaryKpis.topPerformer.grossRevenue)})
                </span>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-blue-100">No sales yet</div>
                <span className="text-[9px] text-blue-200 mt-0.5 block">Share links to track</span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 3. FILTER, SEARCH & VIEW TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Search & Platform Filter */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("inf.searchPlaceholder", "Search influencers by name, code, handle...")}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle size={13} />
              </button>
            )}
          </div>

          <div className="w-44 shrink-0">
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
        </div>

        {/* Status Tabs & View Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {[
              { id: "active", label: "Active" },
              { id: "paused", label: "Paused" },
              { id: "all", label: "All" }
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

          {/* Sort Selector */}
          <div className="w-40 shrink-0">
            <SearchableSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "revenue", label: "Sort: Highest Revenue" },
                { value: "registrations", label: "Sort: Most Passes" },
                { value: "clicks", label: "Sort: Most Clicks" },
                { value: "conversion", label: "Sort: Highest Conversion" },
                { value: "recent", label: "Sort: Recently Added" },
                { value: "name", label: "Sort: Name A-Z" }
              ]}
              showSearch={false}
              className="text-xs"
              buttonClassName="py-2 text-xs font-semibold bg-slate-50 border-slate-200"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title={t("inf.viewGrid", "Grid View")}
            >
              <BarChart2 size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title={t("inf.viewTable", "Table View")}
            >
              <FileText size={15} />
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
              ? "No matching influencer campaigns found"
              : t("inf.noInfluencers", "No influencers or affiliate campaigns created yet.")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-6">
            {searchQuery || platformFilter !== "all" || statusFilter !== "active"
              ? "Try adjusting your search terms or filter settings to view your campaigns."
              : "Launch tracking referral links and promo codes to partner with influencers, bloggers, and promoters."}
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
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={inf.avatar || inf.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&background=3b82f6&color=fff`}
                        alt={inf.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                          {inf.name}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${platMeta.badgeColor}`}>
                            {inf.platform}
                          </span>
                          {inf.handle && (
                            <span className="text-[10px] font-semibold text-slate-500 truncate" title={inf.handle}>
                              {inf.handle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${isPaused ? "bg-amber-50 text-amber-700 border-amber-200" : isArchived ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {isPaused ? "Paused" : isArchived ? "Archived" : "Active"}
                    </span>
                  </div>

                  {/* Promo Code & Link Box */}
                  <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-blue-600 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Promo Code:</span>
                        <code className="text-xs font-black text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded-md">
                          {inf.code}
                        </code>
                      </div>

                      <button
                        onClick={(e) => handleCopyPromo(inf, e)}
                        className="text-[10px] font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                        title="Copy promo code"
                      >
                        {copiedPromoMap[inf.id] ? (
                          <>
                            <Check size={11} className="text-emerald-600" />
                            <span className="text-emerald-600 font-bold">{t("inf.promoCopied", "Copied!")}</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>{t("inf.copyPromo", "Copy Code")}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <div className="text-[10px] text-slate-500 font-medium truncate flex-1" title={getReferralUrl(inf.code)}>
                        <span className="text-slate-400">URL: </span>?ref={inf.code}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleCopyLink(inf, e)}
                          className="text-[10px] font-extrabold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedLinkMap[inf.id] ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-600">{t("inf.linkCopied", "Copied!")}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>{t("inf.copyLink", "Copy Link")}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => handleOpenShareKit(inf, e)}
                          className="p-1 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
                          title={t("inf.shareKit", "Share Kit & QR Code")}
                        >
                          <QrCode size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Deal parameters */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Buyer Discount</span>
                      <span className="font-extrabold text-slate-700 mt-0.5 block">
                        {inf.discountPercent > 0 ? (
                          <span className="text-emerald-600 font-black">{inf.discountPercent}% OFF</span>
                        ) : inf.discountAmount > 0 ? (
                          <span className="text-emerald-600 font-black">{formatPrice(inf.discountAmount)} OFF</span>
                        ) : (
                          <span className="text-slate-400">No discount</span>
                        )}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Commission</span>
                      <span className="font-extrabold text-slate-700 mt-0.5 block truncate">
                        {inf.commissionPercent > 0 ? (
                          <span className="text-blue-600 font-black">{inf.commissionPercent}% share</span>
                        ) : inf.commissionAmount > 0 ? (
                          <span className="text-blue-600 font-black">{formatPrice(inf.commissionAmount)} / pass</span>
                        ) : (
                          <span className="text-slate-400">Tracking only</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Goal Progress */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-400 uppercase tracking-wider">{t("inf.goalProgress", "Goal Progress")}</span>
                      <span className="text-slate-700">
                        {inf.registrationsCount} / {inf.targetGoal || 50} passes ({inf.goalProgressPct}%)
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
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clicks</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block">{inf.clicksCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sales Value</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block truncate" title={formatPrice(inf.grossRevenue)}>
                        {inf.grossRevenue > 0 ? `${(inf.grossRevenue / 1000).toFixed(0)}k ${currency}` : "0"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reward Due</span>
                      <span className="text-xs font-black text-rose-600 mt-0.5 block truncate" title={formatPrice(inf.commissionDue)}>
                        {inf.commissionDue > 0 ? formatPrice(inf.commissionDue) : "0"}
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
                      {inf.registrationsCount} {t("inf.attributedAttendees", "Attendees")}
                    </span>
                    <ChevronRight size={13} />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleStatus(inf, e)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${isPaused ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                      title={isPaused ? "Resume campaign" : "Pause campaign"}
                    >
                      {isPaused ? "Resume" : "Pause"}
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
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Influencer</th>
                  <th className="py-3 px-3">Platform & Code</th>
                  <th className="py-3 px-3">Buyer Discount</th>
                  <th className="py-3 px-3 text-center">Clicks</th>
                  <th className="py-3 px-3 text-center">Passes Sold</th>
                  <th className="py-3 px-3 text-right">Gross Revenue</th>
                  <th className="py-3 px-3 text-right">Commission Due</th>
                  <th className="py-3 px-3 text-center">Payout</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInfluencers.map(inf => {
                  const platMeta = getPlatformMeta(inf.platform);

                  return (
                    <tr key={inf.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={inf.avatar || inf.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&background=3b82f6&color=fff`}
                            alt={inf.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">{inf.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium truncate">{inf.email || inf.phone || "No contact"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${platMeta.badgeColor}`}>
                            {inf.platform} {inf.handle ? `• ${inf.handle}` : ""}
                          </span>
                          <div className="flex items-center gap-1">
                            <code className="text-[10px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {inf.code}
                            </code>
                            <button
                              onClick={(e) => handleCopyLink(inf, e)}
                              className="text-[10px] text-slate-400 hover:text-blue-600 transition-colors"
                              title="Copy link"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {inf.discountPercent > 0 ? (
                          <span className="text-emerald-600 font-bold">{inf.discountPercent}% OFF</span>
                        ) : inf.discountAmount > 0 ? (
                          <span className="text-emerald-600 font-bold">{formatPrice(inf.discountAmount)} OFF</span>
                        ) : (
                          <span className="text-slate-400 font-normal">None</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {inf.clicksCount}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setInspectingInfluencer(inf)}
                          className="font-extrabold text-blue-600 hover:underline cursor-pointer"
                        >
                          {inf.registrationsCount}
                        </button>
                        <span className="text-[9px] text-slate-400 block">/ {inf.targetGoal || 50}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatPrice(inf.grossRevenue)}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                        {formatPrice(inf.commissionDue)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <select
                          value={inf.payoutStatus || "unpaid"}
                          onChange={(e) => handleUpdatePayoutStatus(inf, e.target.value)}
                          className="text-[10px] font-bold rounded-lg px-2 py-1 border bg-white cursor-pointer focus:outline-none"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleOpenShareKit(inf, e)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Share Kit & QR Code"
                          >
                            <QrCode size={13} />
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(inf, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleArchiveInfluencer(inf.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Archive"
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
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
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
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Configure partner details, tracking codes, discounts and commissions.</p>
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
                  placeholder="e.g. Sarah TechDZ, Karim Dev, Amine Lifestyle"
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
                    placeholder="@sarah_techdz or link"
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
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+213 555 12 34 56"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <label className="block text-xs font-extrabold text-blue-900 mb-1">
                  {t("inf.code", "Unique Tracking Code / Slug")} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))}
                    placeholder="SARAH2026"
                    className={`w-full px-3.5 py-2 bg-white border font-mono font-black text-blue-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.code ? "border-rose-400 bg-rose-50/30" : "border-blue-200"}`}
                  />
                </div>
                <p className="text-[10px] text-blue-700 font-medium mt-1.5">
                  {t("inf.codeHelp", "Used in tracking URL (?ref=CODE) and also serves as attendee promo code at checkout.")}
                </p>
                {formErrors.code && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.code}</span>}
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
                    { id: "none", label: "No Discount" },
                    { id: "percent", label: "% Percentage" },
                    { id: "fixed", label: "Fixed Amount" }
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
                      placeholder="e.g. 10"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-slate-600">% OFF standard ticket price</span>
                  </div>
                )}

                {formData.discountType === "fixed" && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min="1"
                      value={formData.discountValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      placeholder="e.g. 1000"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-slate-600">{currency} OFF per ticket</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  {t("inf.commissionType", "Influencer Commission / Bounty")}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "none", label: "No Commission" },
                    { id: "percent", label: "% Revenue Share" },
                    { id: "fixed", label: "Fixed Bounty" }
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
                      placeholder="e.g. 15"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-slate-600">% of ticket sale revenue</span>
                  </div>
                )}

                {formData.commissionType === "fixed" && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min="1"
                      value={formData.commissionValue || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                      placeholder="e.g. 500"
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-slate-600">{currency} per registered attendee</span>
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
                  placeholder="Contract agreed on 2 Instagram Stories + 1 Reel post before Sept 1st..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Campaign Status
                  </label>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "paused", label: "Paused" }
                    ]}
                    showSearch={false}
                    className="text-xs"
                    buttonClassName="py-2.5 text-xs font-semibold bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payout Status
                  </label>
                  <SearchableSelect
                    value={formData.payoutStatus}
                    onChange={(val) => setFormData(prev => ({ ...prev, payoutStatus: val }))}
                    options={PAYOUT_STATUS_OPTIONS}
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
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div 
            onClick={() => setInspectingInfluencer(null)}
            className="absolute inset-0"
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 select-none">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingInfluencer.avatar || inspectingInfluencer.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inspectingInfluencer.name)}&background=3b82f6&color=fff`}
                  alt={inspectingInfluencer.name}
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{inspectingInfluencer.name}</span>
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                      {inspectingInfluencer.code}
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {inspectingInfluencer.attributedAttendees.length} Attributed Registrations • {formatPrice(inspectingInfluencer.grossRevenue)} Total Revenue
                  </p>
                </div>
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
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Passes Converted</span>
                <span className="text-base font-black text-blue-700 mt-0.5 block">{inspectingInfluencer.attributedAttendees.length}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gross Sales</span>
                <span className="text-base font-black text-slate-800 mt-0.5 block">{formatPrice(inspectingInfluencer.grossRevenue)}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Commission Earned</span>
                <span className="text-base font-black text-rose-600 mt-0.5 block">{formatPrice(inspectingInfluencer.commissionDue)}</span>
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
                          <div className="text-[10px] text-slate-400 truncate">{att.email || "No email"} {att.company ? `• ${att.company}` : ""}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 block mb-0.5">
                          {att.ticketType || att.ticket_type || "Standard"}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {att.registeredDate || "Recently registered"}
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
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div 
            onClick={() => setShareKitInfluencer(null)}
            className="absolute inset-0"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 animate-scale-up text-center border border-slate-200">
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{t("inf.shareKitTitle", "Influencer Promotional Kit")}</h3>
                  <span className="text-[10px] font-semibold text-slate-400">{shareKitInfluencer.name} ({shareKitInfluencer.code})</span>
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
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              Scans directly route to your event with referral code <strong className="text-blue-600">{shareKitInfluencer.code}</strong> auto-applied.
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
