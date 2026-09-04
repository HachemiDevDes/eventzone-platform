/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Users, UserCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Search, Filter, Plus, Download, Share2, Settings, QrCode,
  ChevronDown, ChevronUp, Copy, Check, ExternalLink,
  Trash2, Edit3, Sparkles, RefreshCw, BarChart2, PieChart,
  UserPlus, Mail, Phone, Building2, Calendar, ArrowRight, ShieldCheck,
  Award, TrendingUp, HelpCircle, X, Archive, RotateCcw
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import QRCode from "qrcode";
import SearchableSelect from "./SearchableSelect";
import { RSVPSkeleton } from "./SkeletonLoaders";

export default function RSVPView({
  rsvps = [],
  rsvpSettings = {},
  eventDetails = {},
  activeEventId,
  isLoading = false,
  onSaveRSVPSettings,
  onSubmitRSVP,
  onUpdateRSVPStatus,
  onDeleteRSVP,
  onPermanentDeleteRSVP,
  onArchiveRSVP,
  onRefreshData,
  onOpenPublicRSVP
}) {
  const { t, isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Local View / Tab state
  const [activeTab, setActiveTab] = useState("all"); // "all" | "attending" | "waitlisted" | "declined" | "tentative"
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingRsvp, setEditingRsvp] = useState(null);

  // Guest Party & Companions Modal
  const [selectedPartyRsvp, setSelectedPartyRsvp] = useState(null);
  const [isEditingPartyNames, setIsEditingPartyNames] = useState(false);
  const [partyNamesInput, setPartyNamesInput] = useState([]);
  const [isSavingParty, setIsSavingParty] = useState(false);

  // Share Modal QR State
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareQrUrl, setShareQrUrl] = useState("");

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    isEnabled: true,
    capacityLimit: 150,
    allowPlusOnes: true,
    maxPlusOnes: 2,
    allowWaitlist: true,
    deadline: "",
    collectCompany: true,
    collectPhone: true,
    confirmationMessage: "Thank you for your RSVP! We look forward to seeing you at the event."
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Manual RSVP Form State
  const [manualForm, setManualForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    status: "attending",
    plusOnes: 0,
    plusOnesNames: [""],
    notes: ""
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Sync settings when loaded
  useEffect(() => {
    if (rsvpSettings) {
      setSettingsForm({
        isEnabled: rsvpSettings.isEnabled ?? rsvpSettings.is_enabled ?? true,
        capacityLimit: rsvpSettings.capacityLimit ?? rsvpSettings.capacity_limit ?? (eventDetails?.capacity || 150),
        allowPlusOnes: rsvpSettings.allowPlusOnes ?? rsvpSettings.allow_plus_ones ?? true,
        maxPlusOnes: rsvpSettings.maxPlusOnes ?? rsvpSettings.max_plus_ones ?? 2,
        allowWaitlist: rsvpSettings.allowWaitlist ?? rsvpSettings.allow_waitlist ?? true,
        deadline: rsvpSettings.deadline ? rsvpSettings.deadline.split("T")[0] : "",
        collectCompany: rsvpSettings.collectCompany ?? rsvpSettings.collect_company ?? true,
        collectPhone: rsvpSettings.collectPhone ?? rsvpSettings.collect_phone ?? true,
        confirmationMessage: rsvpSettings.confirmationMessage || rsvpSettings.confirmation_message || "Thank you for your RSVP!"
      });
    }
  }, [rsvpSettings, eventDetails]);

  // Generate Share QR code
  useEffect(() => {
    if (isShareModalOpen && typeof window !== 'undefined') {
      const slugOrId = eventDetails?.slug || activeEventId || "";
      const publicUrl = `${window.location.origin}/${slugOrId}?rsvp=true`;
      QRCode.toDataURL(publicUrl, { width: 260, margin: 1, color: { dark: '#0b5cdb', light: '#ffffff' } })
        .then(url => setShareQrUrl(url))
        .catch(e => console.error("Share QR Error:", e));
    }
  }, [isShareModalOpen, activeEventId, eventDetails?.slug]);

  // ─────────────────────────────────────────────
  //  KPI & Analytics Calculations
  // ─────────────────────────────────────────────
  const analytics = useMemo(() => {
    let attendingResponses = 0;
    let attendingHeadcount = 0;
    let waitlistResponses = 0;
    let waitlistHeadcount = 0;
    let declinedResponses = 0;
    let tentativeResponses = 0;
    let checkedInCount = 0;

    const plusOnesDist = {
      solo: 0,
      plus1: 0,
      plus2Plus: 0
    };

    rsvps.forEach(r => {
      const st = (r.status || 'attending').toLowerCase();
      const pOnes = Math.max(0, parseInt(r.plusOnes || r.plus_ones || 0, 10));
      const totalHeads = 1 + pOnes;

      if (r.checkedIn || r.checked_in) checkedInCount++;

      if (st === 'attending') {
        attendingResponses++;
        attendingHeadcount += totalHeads;

        // Plus ones
        if (pOnes === 0) plusOnesDist.solo++;
        else if (pOnes === 1) plusOnesDist.plus1++;
        else plusOnesDist.plus2Plus++;

      } else if (st === 'waitlisted') {
        waitlistResponses++;
        waitlistHeadcount += totalHeads;
      } else if (st === 'declined') {
        declinedResponses++;
      } else if (st === 'tentative') {
        tentativeResponses++;
      }
    });

    const archivedResponses = rsvps.filter(r => (r.status || '').toLowerCase() === 'archived').length;
    const totalResponses = rsvps.length - archivedResponses;
    const capacityLimit = settingsForm.capacityLimit || 150;
    const capacityUsedPct = capacityLimit > 0 ? Math.min(100, Math.round((attendingHeadcount / capacityLimit) * 100)) : 0;
    const spotsRemaining = Math.max(0, capacityLimit - attendingHeadcount);
    const acceptanceRate = totalResponses > 0 ? Math.round((attendingResponses / totalResponses) * 100) : 0;

    return {
      totalResponses,
      attendingResponses,
      attendingHeadcount,
      waitlistResponses,
      waitlistHeadcount,
      declinedResponses,
      tentativeResponses,
      archivedResponses,
      checkedInCount,
      capacityLimit,
      capacityUsedPct,
      spotsRemaining,
      acceptanceRate,
      plusOnesDist,
      isAtCapacity: attendingHeadcount >= capacityLimit
    };
  }, [rsvps, settingsForm.capacityLimit]);

  // ─────────────────────────────────────────────
  //  Filtered RSVP List
  // ─────────────────────────────────────────────
  const filteredRsvps = useMemo(() => {
    return rsvps.filter(r => {
      // Tab filter
      const st = (r.status || 'attending').toLowerCase();
      if (activeTab === "all" && st === "archived") return false;
      if (activeTab === "archived" && st !== "archived") return false;
      if (activeTab === "attending" && st !== "attending") return false;
      if (activeTab === "waitlisted" && st !== "waitlisted") return false;
      if (activeTab === "declined" && st !== "declined") return false;
      if (activeTab === "tentative" && st !== "tentative") return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.fullName || r.full_name || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        const comp = (r.company || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        const companions = (r.plusOnesNames || r.plus_ones_names || []).join(' ').toLowerCase();

        return name.includes(q) || email.includes(q) || comp.includes(q) || notes.includes(q) || companions.includes(q);
      }

      return true;
    });
  }, [rsvps, activeTab, searchQuery]);

  // ─────────────────────────────────────────────
  //  Action Handlers
  // ─────────────────────────────────────────────
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      if (onSaveRSVPSettings) {
        await onSaveRSVPSettings(settingsForm);
      }
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 2500);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Save settings error:", err);
      alert(t("rsvp.failedToSaveSettings", "Failed to save RSVP settings: ") + err.message);
      setIsSavingSettings(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.fullName.trim() || !manualForm.email.trim()) {
      alert(t("rsvp.errorEnterNameAndEmail", "Please enter full name and a valid email."));
      return;
    }

    setIsSubmittingManual(true);
    try {
      const payload = {
        ...manualForm,
        plusOnes: manualForm.status === "attending" ? manualForm.plusOnes : 0,
        plusOnesNames: manualForm.status === "attending" ? manualForm.plusOnesNames.filter(n => n.trim()) : [],
      };

      if (onSubmitRSVP) {
        await onSubmitRSVP(payload);
      }

      setIsManualModalOpen(false);
      // Reset form
      setManualForm({
        fullName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        status: "attending",
        plusOnes: 0,
        plusOnesNames: [""],
        notes: ""
      });
    } catch (err) {
      console.error("Manual RSVP error:", err);
      alert(t("rsvp.failedToAdd", "Failed to add RSVP: ") + err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleQuickStatusChange = async (rsvpId, newStatus) => {
    try {
      if (onUpdateRSVPStatus) {
        await onUpdateRSVPStatus(rsvpId, newStatus);
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert(t("rsvp.failedToUpdate", "Failed to update status: ") + err.message);
    }
  };

  const openPartyModal = (rsvp) => {
    setSelectedPartyRsvp(rsvp);
    const pOnes = parseInt(rsvp.plusOnes || rsvp.plus_ones || 0, 10);
    const rawNames = rsvp.plusOnesNames || rsvp.plus_ones_names || [];
    const names = Array.isArray(rawNames) ? [...rawNames] : [];
    while (names.length < pOnes) {
      names.push("");
    }
    setPartyNamesInput(names.slice(0, pOnes));
    setIsEditingPartyNames(false);
  };

  const handleSavePartyNames = async () => {
    if (!selectedPartyRsvp) return;
    setIsSavingParty(true);
    try {
      const cleanedNames = partyNamesInput.map(n => n.trim()).filter(Boolean);
      if (onUpdateRSVPStatus) {
        await onUpdateRSVPStatus(selectedPartyRsvp.id, selectedPartyRsvp.status, {
          plusOnesNames: cleanedNames,
          plus_ones_names: cleanedNames,
        });
      }
      setSelectedPartyRsvp(prev => prev ? { ...prev, plusOnesNames: cleanedNames, plus_ones_names: cleanedNames } : null);
      setIsEditingPartyNames(false);
    } catch (err) {
      console.error("Failed to update companion names:", err);
      alert(t("rsvp.failedToUpdateCompanions", "Failed to update companion names: ") + err.message);
    } finally {
      setIsSavingParty(false);
    }
  };

  const handlePromoteFromWaitlist = async (rsvp) => {
    if (analytics.spotsRemaining <= 0) {
      if (!confirm(`Warning: The event is currently at full capacity (${analytics.attendingHeadcount}/${analytics.capacityLimit}). Are you sure you want to promote ${rsvp.fullName} and exceed capacity?`)) {
        return;
      }
    }
    await handleQuickStatusChange(rsvp.id, "attending");
  };

  const handleArchive = async (rsvpId, name) => {
    if (confirm(`Archive the RSVP for ${name || 'this guest'}? (Record is safely preserved in archives)`)) {
      if (onArchiveRSVP) {
        await onArchiveRSVP(rsvpId);
      } else if (onDeleteRSVP) {
        await onDeleteRSVP(rsvpId);
      }
    }
  };

  const handlePermanentDelete = async (rsvpId, name) => {
    if (confirm(`Permanently delete the RSVP for ${name || 'this guest'}? This action cannot be undone.`)) {
      if (onPermanentDeleteRSVP) {
        await onPermanentDeleteRSVP(rsvpId);
      } else if (onDeleteRSVP) {
        await onDeleteRSVP(rsvpId);
      }
    }
  };

  const handleDelete = handlePermanentDelete;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Guest Name",
      "Email",
      "Phone",
      "Company",
      "Job Title",
      "Status",
      "Total Headcount",
      "Plus-Ones Count",
      "Companion Names",
      "Special Notes",
      "Checked In",
      "Date Submitted"
    ];

    const rows = filteredRsvps.map(r => {
      const pOnes = parseInt(r.plusOnes || r.plus_ones || 0, 10);
      const companions = (r.plusOnesNames || r.plus_ones_names || []).join('; ');
      return [
        `"${(r.fullName || r.full_name || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.company || '').replace(/"/g, '""')}"`,
        `"${(r.jobTitle || r.job_title || '').replace(/"/g, '""')}"`,
        `"${r.status || 'attending'}"`,
        1 + pOnes,
        pOnes,
        `"${companions.replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        r.checkedIn || r.checked_in ? "Yes" : "No",
        `"${r.createdAt || r.created_at || ''}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RSVPs_${(eventDetails?.title || 'Event').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPublicRsvpUrl = () => {
    if (typeof window === "undefined") return "";
    const slugOrId = eventDetails?.slug || activeEventId || "";
    return `${window.location.origin}/${slugOrId}?rsvp=true`;
  };

  const handleCopyShareLink = () => {
    const publicUrl = getPublicRsvpUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!shareQrUrl) return;
    const link = document.createElement("a");
    link.href = shareQrUrl;
    link.download = `RSVP_QR_${(eventDetails?.title || 'Event').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    const title = eventDetails?.title || "Event";
    const url = getPublicRsvpUrl();
    const text = `RSVP for ${title}:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const title = eventDetails?.title || "Event";
    const url = getPublicRsvpUrl();
    const subject = `RSVP Invitation: ${title}`;
    const body = `Hello,\n\nYou are cordially invited to RSVP for ${title}.\n\nPlease submit your attendance response here:\n${url}\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (isLoading) {
    return <RSVPSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* ─────────────────────────────────────────────
          1. HEADER & ACTION TOOLBAR
      ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 pb-2">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {t("rsvp.title", "RSVP & Headcount Management")}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              settingsForm.isEnabled 
                ? analytics.isAtCapacity 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {!settingsForm.isEnabled ? t("rsvp.closedBadge", "RSVP Closed") : analytics.isAtCapacity ? t("rsvp.atCapacityBadge", "At Capacity (Waitlist)") : t("rsvp.openBadge", "RSVP Open")}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {t("rsvp.subtitle", "Track guest attendance responses, companion headcounts, and priority capacity waitlists.")}
          </p>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>{t("rsvp.manualAdd", "Add Guest RSVP")}</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <Share2 size={13} />
            <span>{t("rsvp.shareLink", "Share RSVP Link")}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            title={t("rsvp.exportCsv", "Export CSV")}
          >
            <Download size={13} />
            <span>{t("rsvp.export", "Export CSV")}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            title={t("rsvp.rsvpSettings", "RSVP Settings")}
          >
            <Settings size={14} />
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title={t("rsvp.refreshData", "Refresh Data")}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          2. KPI & HEADCOUNT METRICS CARDS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Headcount & Capacity Gauge */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("rsvp.confirmedHeadcount", "Confirmed Headcount")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900"><bdi dir="ltr">{analytics.attendingHeadcount}</bdi></span>
              <span className="text-xs text-slate-400 font-bold"><bdi dir="ltr">/ {analytics.capacityLimit}</bdi> {t("rsvp.maxLimit", "max limit")}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  analytics.capacityUsedPct >= 100 
                    ? 'bg-rose-500' 
                    : analytics.capacityUsedPct >= 80 
                    ? 'bg-amber-500' 
                    : 'bg-blue-600'
                }`}
                style={{ width: `${analytics.capacityUsedPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-1.5">
              <span><bdi dir="ltr">{analytics.capacityUsedPct}%</bdi> {t("rsvp.filled", "filled")}</span>
              <span><bdi dir="ltr">{analytics.spotsRemaining}</bdi> {t("rsvp.spotsLeft", "spots left")}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Responses & Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("rsvp.totalResponses", "Total Responses")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900"><bdi dir="ltr">{analytics.totalResponses}</bdi></div>
            <div className="flex items-center gap-3 text-xs font-semibold mt-2 pt-1 border-t border-slate-100">
              <span className="text-emerald-600 font-bold"><bdi dir="ltr">{analytics.attendingResponses}</bdi> {t("rsvp.yes", "Yes")}</span>
              <span className="text-slate-400">•</span>
              <span className="text-rose-500 font-bold"><bdi dir="ltr">{analytics.declinedResponses}</bdi> {t("rsvp.no", "No")}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-600 font-bold"><bdi dir="ltr">{analytics.tentativeResponses}</bdi> {t("rsvp.maybe", "Maybe")}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Priority Waitlist */}
        <div className={`border rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-colors ${
          analytics.waitlistHeadcount > 0 
            ? 'bg-amber-50/60 border-amber-200/80' 
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("rsvp.waitlistActive", "Priority Waitlist")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900"><bdi dir="ltr">{analytics.waitlistHeadcount}</bdi></span>
              <span className="text-xs text-amber-700 font-bold"><bdi dir="ltr">{analytics.waitlistHeadcount}</bdi> {t("rsvp.guests", "guests")} (<bdi dir="ltr">{analytics.waitlistResponses}</bdi> {t("rsvp.rsvps", "RSVPs")})</span>
            </div>
            
            <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">{t("rsvp.autoWaitlistEnabled", "Auto-waitlist")}: {settingsForm.allowWaitlist ? t("common.enabled", "Enabled") : t("common.disabled", "Disabled")}</span>
              {analytics.waitlistResponses > 0 && (
                <button
                  onClick={() => setActiveTab("waitlisted")}
                  className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  {t("rsvp.review", "Review")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Acceptance Rate & Plus-Ones */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("rsvp.acceptanceRate", "Acceptance Rate")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900"><bdi dir="ltr">{analytics.acceptanceRate}%</bdi></div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-2 pt-1 border-t border-slate-100">
              <span>{t("rsvp.soloCount", "Solo")}: <bdi dir="ltr">{analytics.plusOnesDist.solo}</bdi></span>
              <span>+1: <bdi dir="ltr">{analytics.plusOnesDist.plus1}</bdi></span>
              <span>+2+: <bdi dir="ltr">{analytics.plusOnesDist.plus2Plus}</bdi></span>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────
          3. RESPONSE ANALYTICS & CAPACITY BREAKDOWN
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Attendance & Capacity Overview */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("rsvp.capacityOverview", "Attendance & Capacity Metrics")}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              <><bdi dir="ltr">{analytics.totalResponses}</bdi> {t("rsvp.totalResponses", "Total Responses")}</>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">{t("rsvp.confirmedHeadsUpper", "Confirmed Heads")}</span>
              <div className="text-xl font-black text-blue-900 mt-0.5"><bdi dir="ltr">{analytics.attendingHeadcount}</bdi></div>
              <span className="text-[10px] text-blue-500 font-medium">{t("common.of", "of")} <bdi dir="ltr">{analytics.capacityLimit}</bdi> {t("rsvp.maxLimit", "max limit")}</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">{t("rsvp.capacityUsedUpper", "Capacity Used")}</span>
              <div className="text-xl font-black text-emerald-900 mt-0.5"><bdi dir="ltr">{analytics.capacityUsedPct}%</bdi></div>
              <span className="text-[10px] text-emerald-600 font-medium"><bdi dir="ltr">{analytics.spotsRemaining}</bdi> {t("rsvp.spotsOpen", "spots open")}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t("rsvp.checkedInUpper", "Checked In")}</span>
              <div className="text-xl font-black text-slate-900 mt-0.5"><bdi dir="ltr">{analytics.checkedInCount}</bdi></div>
              <span className="text-[10px] text-slate-500 font-medium"><bdi dir="ltr">{analytics.attendingHeadcount > 0 ? Math.round((analytics.checkedInCount / analytics.attendingHeadcount) * 100) : 0}%</bdi> {t("rsvp.ofConfirmed", "of confirmed")}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{t("rsvp.overallCapacityProgress", "Overall Capacity Progress")}</span>
              <span className="font-bold text-slate-900"><bdi dir="ltr">{analytics.attendingHeadcount} / {analytics.capacityLimit}</bdi> {t("rsvp.guests", "Guests")}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  analytics.capacityUsedPct >= 100 
                    ? 'bg-amber-500' 
                    : analytics.capacityUsedPct >= 80 
                    ? 'bg-blue-600' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${analytics.capacityUsedPct}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Plus-Ones Distribution Chart / Box */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("rsvp.plusOnesBreakdown", "Companions (+1s)")}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {t("rsvp.maxCompanionsPerAttendee", "Max companions allowed per attendee:")} <bdi dir="ltr">{settingsForm.maxPlusOnes}</bdi>
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{t("rsvp.soloAttendeesNoPlusOne", "Solo Attendees (No +1)")}</span>
                <span className="font-bold text-slate-900"><bdi dir="ltr">{analytics.plusOnesDist.solo}</bdi> (<bdi dir="ltr">{analytics.attendingResponses > 0 ? Math.round((analytics.plusOnesDist.solo / analytics.attendingResponses) * 100) : 0}%</bdi>)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${analytics.attendingResponses > 0 ? (analytics.plusOnesDist.solo / analytics.attendingResponses) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{t("rsvp.bringingOneCompanion", "Bringing 1 Companion (+1)")}</span>
                <span className="font-bold text-slate-900"><bdi dir="ltr">{analytics.plusOnesDist.plus1}</bdi></span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${analytics.attendingResponses > 0 ? (analytics.plusOnesDist.plus1 / analytics.attendingResponses) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{t("rsvp.bringingTwoPlusCompanions", "Bringing 2+ Companions")}</span>
                <span className="font-bold text-slate-900"><bdi dir="ltr">{analytics.plusOnesDist.plus2Plus}</bdi></span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${analytics.attendingResponses > 0 ? (analytics.plusOnesDist.plus2Plus / analytics.attendingResponses) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            {t("rsvp.maxCompanionsPerAttendee", "Max companions allowed per attendee:")} <bdi dir="ltr">{settingsForm.maxPlusOnes}</bdi>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────
          4. INTERACTIVE GUEST TABLE & CONTROLS
      ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("rsvp.filterAll", "All")} (<bdi dir="ltr">{analytics.totalResponses}</bdi>)
            </button>
            <button
              onClick={() => setActiveTab("attending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "attending" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("rsvp.filterAttending", "Attending")} (<bdi dir="ltr">{analytics.attendingResponses}</bdi>)
            </button>
            <button
              onClick={() => setActiveTab("waitlisted")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "waitlisted" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("rsvp.filterWaitlisted", "Waitlisted")} (<bdi dir="ltr">{analytics.waitlistResponses}</bdi>)
            </button>
            <button
              onClick={() => setActiveTab("tentative")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "tentative" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("rsvp.filterTentative", "Tentative")} (<bdi dir="ltr">{analytics.tentativeResponses}</bdi>)
            </button>
            <button
              onClick={() => setActiveTab("declined")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "declined" ? "bg-rose-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("rsvp.filterDeclined", "Declined")} (<bdi dir="ltr">{analytics.declinedResponses}</bdi>)
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "archived" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("rsvp.filterArchived", "Archived")} (<bdi dir="ltr">{analytics.archivedResponses}</bdi>)
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("rsvp.searchGuestPlaceholder", "Search guest, email, company...")}
                className="w-full ps-9 pe-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-start rtl:text-right text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-150 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-start rtl:text-right text-left">{t("rsvp.thGuestName", "GUEST NAME")}</th>
                <th className="py-3 px-4 text-start rtl:text-right text-left">{t("rsvp.thStatus", "STATUS")}</th>
                <th className="py-3 px-4 text-start rtl:text-right text-left">{t("rsvp.thCompanions", "COMPANIONS")}</th>
                <th className="py-3 px-4 text-start rtl:text-right text-left">{t("rsvp.thSpecialRequests", "SPECIAL REQUESTS")}</th>
                <th className="py-3 px-4 text-start rtl:text-right text-left">{t("rsvp.thDateSubmitted", "DATE SUBMITTED")}</th>
                <th className="py-3 px-4 text-end rtl:text-left text-right">{t("rsvp.thActions", "ACTIONS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRsvps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <Users size={32} className="mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="font-bold text-slate-600">{t("rsvp.noRsvps", "No RSVPs match your criteria")}</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {t("rsvp.noRsvpsDesc", "Share your public RSVP link with guests to begin recording attendance responses.")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRsvps.map((rsvp) => {
                  const pOnes = parseInt(rsvp.plusOnes || rsvp.plus_ones || 0, 10);
                  const companionList = rsvp.plusOnesNames || rsvp.plus_ones_names || [];
                  const st = rsvp.status || 'attending';

                  return (
                    <tr key={rsvp.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Guest Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {(rsvp.fullName || rsvp.full_name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{rsvp.fullName || rsvp.full_name}</span>
                              {(rsvp.checkedIn || rsvp.checked_in) && (
                                <span className="text-emerald-600" title={t("rsvp.checkedInTooltip", "Checked In")}>
                                  <ShieldCheck size={13} />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{rsvp.email}</div>
                            {(rsvp.company || rsvp.phone) && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {rsvp.company && <span>{rsvp.company}</span>}
                                {rsvp.phone && <span>• <bdi dir="ltr">{rsvp.phone}</bdi></span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={st}
                          onChange={(e) => handleQuickStatusChange(rsvp.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border focus:outline-none cursor-pointer ${
                            st === "attending"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : st === "waitlisted"
                              ? "bg-amber-50 border-amber-300 text-amber-800"
                              : st === "declined"
                              ? "bg-rose-50 border-rose-300 text-rose-800"
                              : "bg-slate-100 border-slate-300 text-slate-700"
                          }`}
                        >
                          <option value="attending">{t("rsvp.statusAttendingCheck", "✓ Attending")}</option>
                          <option value="waitlisted">{t("rsvp.statusWaitlistedClock", "⏱ Waitlisted")}</option>
                          <option value="tentative">{t("rsvp.statusTentativeQuestion", "? Tentative")}</option>
                          <option value="declined">{t("rsvp.statusDeclinedCross", "✕ Declined")}</option>
                        </select>
                      </td>

                      {/* Headcount & Companions */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              <bdi dir="ltr">{1 + pOnes}</bdi> {t("rsvp.heads", "heads")}
                            </span>
                            {pOnes > 0 && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                                <bdi dir="ltr">+{pOnes}</bdi>
                              </span>
                            )}
                          </div>

                          {pOnes === 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium">{t("rsvp.soloGuest", "Solo Guest")}</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              {companionList.length > 0 && companionList.some(n => n && n.trim()) ? (
                                <div className="flex flex-wrap items-center gap-1">
                                  {companionList.map((name, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => openPartyModal(rsvp)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/70 text-[11px] font-medium transition-colors cursor-pointer text-start rtl:text-right text-left max-w-[170px] truncate group shadow-2xs"
                                      title={`Companion #${i + 1}: ${name} (Click to view party details)`}
                                    >
                                      <UserCheck size={11} className="text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                                      <span className="truncate">{name}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openPartyModal(rsvp)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs"
                                  title={t("rsvp.viewCompanionNamesTooltip", "Click to view or specify companion names")}
                                >
                                  <Users size={11} className="text-slate-400" />
                                  <span>{t("rsvp.viewCompanions", "View")} <bdi dir="ltr">{pOnes}</bdi> {t("rsvp.companions", "Companions")}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">
                          {rsvp.notes || "—"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-400">
                        {rsvp.createdAt || rsvp.created_at ? new Date(rsvp.createdAt || rsvp.created_at).toLocaleDateString() : "Recent"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {st === "waitlisted" && (
                            <button
                              onClick={() => handlePromoteFromWaitlist(rsvp)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                              title={t("rsvp.promoteToAttendingTooltip", "Promote to Attending")}
                            >
                              {t("rsvp.promoteBtn", "Promote")}
                            </button>
                          )}

                          {st === "archived" ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickStatusChange(rsvp.id, "attending")}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title={t("rsvp.restoreRsvpTooltip", "Restore RSVP")}
                              >
                                <RotateCcw size={13} />
                                <span>{t("rsvp.restoreBtn", "Restore")}</span>
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(rsvp.id, rsvp.fullName || rsvp.full_name)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title={t("rsvp.deletePermanentlyTooltip", "Delete RSVP Permanently")}
                              >
                                <Trash2 size={13} />
                                <span>{t("rsvp.deleteBtn", "Delete")}</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleArchive(rsvp.id, rsvp.fullName || rsvp.full_name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title={t("rsvp.archiveRsvpTooltip", "Archive RSVP (Data preserved)")}
                            >
                              <Archive size={13} />
                            </button>
                          )}
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
          5. SETTINGS DRAWER / MODAL
      ───────────────────────────────────────────── */}
      {mounted && isSettingsOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{t("rsvp.settingsTitle", "RSVP & Capacity Settings")}</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800">{t("rsvp.enableRsvpLabel", "Enable RSVP for this event")}</div>
                  <div className="text-[11px] text-slate-500">{t("rsvp.enableRsvpDesc", "Allow guests to submit attendance responses")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.isEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Capacity Limit */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {t("rsvp.capacityLimit", "Maximum Capacity Limit (Headcount)")}
                </label>
                <input
                  type="number"
                  min={1}
                  value={settingsForm.capacityLimit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, capacityLimit: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Allow Plus Ones */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800">{t("rsvp.allowPlusOnesLabel", "Allow Plus-Ones")}</div>
                    <div className="text-[10px] text-slate-500">{t("rsvp.enableCompanionsDesc", "Enable companions")}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.allowPlusOnes}
                    onChange={(e) => setSettingsForm({ ...settingsForm, allowPlusOnes: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t("rsvp.maxPlusOnesPerGuest", "Max +1s / Guest")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    disabled={!settingsForm.allowPlusOnes}
                    value={settingsForm.maxPlusOnes}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maxPlusOnes: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Allow Waitlist */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800">{t("rsvp.automaticWaitlistLabel", "Automatic Waitlist")}</div>
                  <div className="text-[11px] text-slate-500">{t("rsvp.automaticWaitlistDesc", "Route guests to waitlist when capacity is reached")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.allowWaitlist}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowWaitlist: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {t("rsvp.rsvpDeadline", "RSVP Submission Cutoff Deadline")}
                </label>
                <input
                  type="date"
                  value={settingsForm.deadline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Custom Confirmation */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {t("rsvp.confirmationMessageLabel", "Confirmation Message for Guests")}
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.confirmationMessage}
                  onChange={(e) => setSettingsForm({ ...settingsForm, confirmationMessage: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* Save Buttons */}
              <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isSavingSettings ? t("rsvp.savingBtn", "Saving...") : t("rsvp.saveSettingsBtn", "Save Settings")}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────
          6. MANUAL GUEST RSVP MODAL
      ───────────────────────────────────────────── */}
      {mounted && isManualModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in font-sans overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{t("rsvp.addGuestRsvpTitle", "Add RSVP for Guest")}</h3>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              
              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">{t("rsvp.manualStatusLabel", "STATUS")}</label>
                <div className="grid grid-cols-4 gap-2">
                  {["attending", "waitlisted", "tentative", "declined"].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, status: st })}
                      className={`py-2 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                        manualForm.status === st 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === "attending" ? t("rsvp.attending", "Attending") : st === "waitlisted" ? t("rsvp.waitlisted", "Waitlisted") : st === "tentative" ? t("rsvp.tentative", "Tentative") : t("rsvp.declined", "Declined")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">{t("rsvp.manualFullNameLabel", "FULL NAME *")}</label>
                  <input
                    type="text"
                    required
                    value={manualForm.fullName}
                    onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                    placeholder={t("rsvp.guestNamePlaceholder", "Guest name...")}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">{t("rsvp.manualEmailLabel", "EMAIL ADDRESS *")}</label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder={t("rsvp.guestEmailPlaceholder", "guest@domain.com")}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Phone & Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">{t("rsvp.manualPhoneLabel", "PHONE")}</label>
                  <input
                    type="text"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder={t("rsvp.guestPhonePlaceholder", "+213 555...")}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">{t("rsvp.manualCompanyLabel", "COMPANY")}</label>
                  <input
                    type="text"
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    placeholder={t("rsvp.companyNamePlaceholder", "Company name...")}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Plus Ones */}
              {manualForm.status === "attending" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{t("rsvp.manualCompanionsLabel", "COMPANIONS (+1S)")}</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            const currentNames = [...(manualForm.plusOnesNames || [])];
                            while (currentNames.length < n) currentNames.push("");
                            setManualForm({ 
                              ...manualForm, 
                              plusOnes: n,
                              plusOnesNames: currentNames.slice(0, n)
                            });
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            manualForm.plusOnes === n ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {n === 0 ? "0" : `+${n}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {manualForm.plusOnes > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        {t("rsvp.companionFullNamesLabel", "Companion Full Names")}
                      </label>
                      {[...Array(manualForm.plusOnes)].map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={manualForm.plusOnesNames?.[idx] || ""}
                            onChange={(e) => {
                              const next = [...(manualForm.plusOnesNames || [])];
                              while (next.length <= idx) next.push("");
                              next[idx] = e.target.value;
                              setManualForm({ ...manualForm, plusOnesNames: next });
                            }}
                            placeholder={t("rsvp.companionNPlaceholder", "Companion {n} name...").replace("{n}", idx + 1)}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">{t("rsvp.manualNotesLabel", "NOTES / VIP REQUEST")}</label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder={t("rsvp.specialNotesPlaceholder", "Special notes or seating preferences...")}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isSubmittingManual ? t("rsvp.savingRsvpBtn", "Saving...") : t("rsvp.saveRsvpBtn", "Save RSVP")}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────
          7. SHARE LINK & QR CODE MODAL
      ───────────────────────────────────────────── */}
      {mounted && isShareModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up text-center">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3.5 text-start rtl:text-right text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{t("rsvp.shareModalTitle", "Share Public RSVP Link")}</h3>
                  <p className="text-xs text-slate-400 font-medium">{t("rsvp.shareModalSubtitle", "Allow guests to submit attendance responses and receive digital passes.")}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* QR Code Container */}
              {shareQrUrl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 w-fit mx-auto shadow-2xs space-y-2.5">
                  <img src={shareQrUrl} alt="RSVP QR Code" className="w-48 h-48 object-contain mx-auto rounded-lg bg-white p-1" />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">{t("rsvp.scanOnMobile", "Scan on mobile")}</span>
                    <span>•</span>
                    <button
                      onClick={handleDownloadQr}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>{t("rsvp.downloadQrPng", "Download QR (PNG)")}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Copyable Link */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-start rtl:text-right text-left space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("rsvp.directUrlLabel", "DIRECT GUEST RSVP URL")}</label>
                  {copiedLink && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check size={11} /> {t("rsvp.copiedBtn", "Link Copied to Clipboard!")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPublicRsvpUrl()}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none select-all"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0 ${
                      copiedLink ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? t("rsvp.copiedBtn", "Copied!") : t("rsvp.copyLinkBtn", "Copy Link")}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Preview & Social Sharing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicRsvpUrl();
                    if (url) window.open(url, "_blank");
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} className="text-slate-600" />
                  <span>{t("rsvp.openRsvpPageBtn", "Open RSVP Page")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{t("rsvp.whatsappBtn", "💬 WhatsApp")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail size={13} className="text-indigo-600" />
                  <span>{t("rsvp.sendEmailBtn", "Send Email")}</span>
                </button>
              </div>

              {onOpenPublicRSVP && (
                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    onOpenPublicRSVP();
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-blue-600 pt-1 block mx-auto cursor-pointer"
                >
                  {t("rsvp.testInModalForm", "Test In-Modal Guest Response Form →")}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────
          8. GUEST PARTY & COMPANIONS MODAL
      ───────────────────────────────────────────── */}
      {mounted && selectedPartyRsvp && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scale-up text-slate-900 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 sm:px-6 sm:py-4.5 border-b border-slate-150 bg-gradient-to-b from-slate-50/90 to-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shadow-2xs">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{t("rsvp.guestPartyTitle", "Guest Party & Companions")}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("rsvp.guestPartyTitle", "Party")} <bdi dir="ltr">{1 + parseInt(selectedPartyRsvp.plusOnes || selectedPartyRsvp.plus_ones || 0, 10)}</bdi> ({selectedPartyRsvp.fullName || selectedPartyRsvp.full_name})
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedPartyRsvp(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              
              {/* Primary Guest Card */}
              <div className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{t("rsvp.primaryGuest", "Primary Guest")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                    (selectedPartyRsvp.status || 'attending') === 'attending' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : (selectedPartyRsvp.status || '') === 'waitlisted'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {(selectedPartyRsvp.status || 'attending') === 'attending' ? t("rsvp.attending", "Attending") : (selectedPartyRsvp.status || '') === 'waitlisted' ? t("rsvp.waitlisted", "Waitlisted") : t("rsvp.declined", "Declined")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {(selectedPartyRsvp.fullName || selectedPartyRsvp.full_name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {selectedPartyRsvp.fullName || selectedPartyRsvp.full_name}
                    </div>
                    <div className="text-slate-500 truncate text-[11px]">{selectedPartyRsvp.email}</div>
                    {(selectedPartyRsvp.phone || selectedPartyRsvp.company) && (
                      <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        {selectedPartyRsvp.phone && <span><bdi dir="ltr">{selectedPartyRsvp.phone}</bdi></span>}
                        {selectedPartyRsvp.company && <span>• {selectedPartyRsvp.company}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Companions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <UserPlus size={14} className="text-blue-600" />
                    <span className="font-bold text-slate-800">
                      <>{t("rsvp.companionGuest", "Companion Guests")} (<bdi dir="ltr">{parseInt(selectedPartyRsvp.plusOnes || selectedPartyRsvp.plus_ones || 0, 10)}</bdi>)</>
                    </span>
                  </div>

                  {parseInt(selectedPartyRsvp.plusOnes || selectedPartyRsvp.plus_ones || 0, 10) > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsEditingPartyNames(!isEditingPartyNames)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>{isEditingPartyNames ? t("common.cancel", "Cancel") : t("rsvp.editNamesBtn", "Edit Names")}</span>
                    </button>
                  )}
                </div>

                {parseInt(selectedPartyRsvp.plusOnes || selectedPartyRsvp.plus_ones || 0, 10) === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-1">
                    <Users size={20} className="mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-xs text-slate-600">{t("rsvp.soloAttendee", "Solo Attendee")}</p>
                    <p className="text-[11px] text-slate-400">{t("rsvp.soloAttendeeDesc", "This guest registered without additional companions (+1s).")}</p>
                  </div>
                ) : isEditingPartyNames ? (
                  <div className="p-4 bg-blue-50/50 border border-blue-200/70 rounded-2xl space-y-3">
                    <p className="text-[11px] text-blue-800 font-medium">
                      {t("rsvp.enterPartyNamesDesc", "Enter or update the full names for each companion in this party:")}
                    </p>
                    <div className="space-y-2">
                      {partyNamesInput.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                              const next = [...partyNamesInput];
                              next[idx] = e.target.value;
                              setPartyNamesInput(next);
                            }}
                            placeholder={`Companion #${idx + 1} Full Name`}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200/50">
                      <button
                        type="button"
                        onClick={() => setIsEditingPartyNames(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                      >
                        {t("common.cancel", "Cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePartyNames}
                        disabled={isSavingParty}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        {isSavingParty ? t("rsvp.savingBtn", "Saving...") : t("rsvp.saveNamesBtn", "Save Names")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {partyNamesInput.map((name, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-100">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            {name ? (
                              <div className="font-bold text-slate-900 truncate">{name}</div>
                            ) : (
                              <div className="text-slate-400 italic text-[11px]">{t("rsvp.nameNotSpecifiedYet", "Name not specified yet")}</div>
                            )}
                            <div className="text-[10px] text-slate-400">{t("rsvp.companionGuest", "Companion Guest")}</div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                          <UserCheck size={10} />
                          <span>{t("rsvp.admittedWithParty", "Admitted with Party")}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes or Special Requests */}
              {selectedPartyRsvp.notes && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t("rsvp.partyNotesRequests", "Party Notes / Requests")}</span>
                  <p className="text-slate-700 text-xs leading-relaxed">{selectedPartyRsvp.notes}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 border-t border-slate-150 bg-slate-50/80 shrink-0 flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold text-slate-500">
                <>{t("rsvp.confirmedHeadcount", "Total Headcount")}: <span className="font-bold text-slate-900"><bdi dir="ltr">{1 + parseInt(selectedPartyRsvp.plusOnes || selectedPartyRsvp.plus_ones || 0, 10)}</bdi> {t("rsvp.guests", "Guests")}</span></>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartyRsvp(null)}
                className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
