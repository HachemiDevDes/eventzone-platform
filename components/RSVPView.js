/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, UserCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Search, Filter, Plus, Download, Share2, Settings, QrCode,
  Utensils, ChevronDown, ChevronUp, Copy, Check, ExternalLink,
  Trash2, Edit3, Sparkles, RefreshCw, BarChart2, PieChart,
  UserPlus, Mail, Phone, Building2, Calendar, ArrowRight, ShieldCheck,
  Award, TrendingUp, HelpCircle, X, Archive, RotateCcw
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import QRCode from "qrcode";
import { DIETARY_OPTIONS } from "./PublicRSVPModal";
import SearchableSelect from "./SearchableSelect";

export default function RSVPView({
  rsvps = [],
  rsvpSettings = {},
  eventDetails = {},
  activeEventId,
  onSaveRSVPSettings,
  onSubmitRSVP,
  onUpdateRSVPStatus,
  onDeleteRSVP,
  onArchiveRSVP,
  onRefreshData,
  onOpenPublicRSVP
}) {
  const { t, isRTL } = useLanguage();

  // Local View / Tab state
  const [activeTab, setActiveTab] = useState("all"); // "all" | "attending" | "waitlisted" | "declined" | "tentative"
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  
  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingRsvp, setEditingRsvp] = useState(null);

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
    collectDietary: true,
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
    dietaryPreference: "None",
    dietaryNotes: "",
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
        collectDietary: rsvpSettings.collectDietary ?? rsvpSettings.collect_dietary ?? true,
        collectCompany: rsvpSettings.collectCompany ?? rsvpSettings.collect_company ?? true,
        collectPhone: rsvpSettings.collectPhone ?? rsvpSettings.collect_phone ?? true,
        confirmationMessage: rsvpSettings.confirmationMessage || rsvpSettings.confirmation_message || "Thank you for your RSVP!"
      });
    }
  }, [rsvpSettings, eventDetails]);

  // Generate Share QR code
  useEffect(() => {
    if (isShareModalOpen && typeof window !== 'undefined') {
      const publicUrl = `${window.location.origin}/?event=${activeEventId}&view=rsvp`;
      QRCode.toDataURL(publicUrl, { width: 220, margin: 1, color: { dark: '#0b5cdb', light: '#ffffff' } })
        .then(url => setShareQrUrl(url))
        .catch(e => console.error("Share QR Error:", e));
    }
  }, [isShareModalOpen, activeEventId]);

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

    const dietaryCounts = {
      "None": 0,
      "Halal": 0,
      "Vegetarian": 0,
      "Vegan": 0,
      "Gluten-Free": 0,
      "Dairy-Free": 0,
      "Kosher": 0,
      "Nut Allergy": 0,
      "Other": 0
    };

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

        // Dietary
        const diet = r.dietaryPreference || r.dietary_preference || 'None';
        if (dietaryCounts[diet] !== undefined) {
          dietaryCounts[diet] += totalHeads;
        } else {
          dietaryCounts["Other"] += totalHeads;
        }

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
      dietaryCounts,
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

      // Dietary filter
      if (dietaryFilter !== "all") {
        const diet = r.dietaryPreference || r.dietary_preference || 'None';
        if (diet !== dietaryFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.fullName || r.full_name || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        const comp = (r.company || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        const dNotes = (r.dietaryNotes || r.dietary_notes || '').toLowerCase();
        const companions = (r.plusOnesNames || r.plus_ones_names || []).join(' ').toLowerCase();

        return name.includes(q) || email.includes(q) || comp.includes(q) || notes.includes(q) || dNotes.includes(q) || companions.includes(q);
      }

      return true;
    });
  }, [rsvps, activeTab, dietaryFilter, searchQuery]);

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
      alert("Failed to save RSVP settings: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.fullName.trim() || !manualForm.email.trim()) {
      alert("Please enter full name and a valid email.");
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
        dietaryPreference: "None",
        dietaryNotes: "",
        notes: ""
      });
    } catch (err) {
      console.error("Manual RSVP error:", err);
      alert("Failed to add RSVP: " + err.message);
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
      alert("Failed to update status: " + err.message);
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

  const handleDelete = handleArchive;

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
      "Dietary Preference",
      "Dietary Notes",
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
        `"${(r.dietaryPreference || r.dietary_preference || 'None').replace(/"/g, '""')}"`,
        `"${(r.dietaryNotes || r.dietary_notes || '').replace(/"/g, '""')}"`,
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

  const handleCopyShareLink = () => {
    const publicUrl = `${window.location.origin}/?event=${activeEventId}&view=rsvp`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
              {!settingsForm.isEnabled ? "RSVP Closed" : analytics.isAtCapacity ? "At Capacity (Waitlist)" : "RSVP Open"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {t("rsvp.subtitle", "Track guest attendance responses, companion headcounts, dietary requirements, and priority capacity waitlists.")}
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
            title="Export CSV"
          >
            <Download size={13} />
            <span>{t("rsvp.export", "Export CSV")}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            title="RSVP Settings"
          >
            <Settings size={14} />
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Refresh Data"
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
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{analytics.attendingHeadcount}</span>
              <span className="text-xs text-slate-400 font-bold">/ {analytics.capacityLimit} max</span>
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
              <span>{analytics.capacityUsedPct}% filled</span>
              <span>{analytics.spotsRemaining} spots left</span>
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
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{analytics.totalResponses}</div>
            <div className="flex items-center gap-3 text-xs font-semibold mt-2 pt-1 border-t border-slate-100">
              <span className="text-emerald-600 font-bold">{analytics.attendingResponses} Yes</span>
              <span className="text-slate-400">•</span>
              <span className="text-rose-500 font-bold">{analytics.declinedResponses} No</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-600 font-bold">{analytics.tentativeResponses} Maybe</span>
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
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{analytics.waitlistHeadcount}</span>
              <span className="text-xs text-amber-700 font-bold">guests ({analytics.waitlistResponses} RSVPs)</span>
            </div>
            
            <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Auto-waitlist: {settingsForm.allowWaitlist ? "Enabled" : "Disabled"}</span>
              {analytics.waitlistResponses > 0 && (
                <button
                  onClick={() => setActiveTab("waitlisted")}
                  className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Review
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
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{analytics.acceptanceRate}%</div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-2 pt-1 border-t border-slate-100">
              <span>Solo: {analytics.plusOnesDist.solo}</span>
              <span>+1: {analytics.plusOnesDist.plus1}</span>
              <span>+2+: {analytics.plusOnesDist.plus2Plus}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────
          3. RESPONSE ANALYTICS & DIETARY BREAKDOWN
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Dietary & Allergen Bar */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils size={16} className="text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("rsvp.dietaryBreakdown", "Dietary & Allergen Requirements")}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Based on {analytics.attendingHeadcount} attending guests
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(analytics.dietaryCounts).map(([diet, count]) => {
              const opt = DIETARY_OPTIONS.find(o => o.id === diet) || { icon: "🍽️" };
              return (
                <div 
                  key={diet}
                  onClick={() => setDietaryFilter(dietaryFilter === diet ? "all" : diet)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    dietaryFilter === diet
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                      : count > 0 
                      ? 'bg-slate-50 border-slate-200/80 hover:border-slate-300' 
                      : 'bg-slate-50/40 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-sm font-black text-slate-800">{count}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 mt-2 truncate">{diet}</span>
                </div>
              );
            })}
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
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Solo Attendees (No +1)</span>
                <span className="font-bold text-slate-900">{analytics.plusOnesDist.solo} ({analytics.attendingResponses > 0 ? Math.round((analytics.plusOnesDist.solo / analytics.attendingResponses) * 100) : 0}%)</span>
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
                <span>Bringing 1 Companion (+1)</span>
                <span className="font-bold text-slate-900">{analytics.plusOnesDist.plus1}</span>
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
                <span>Bringing 2+ Companions</span>
                <span className="font-bold text-slate-900">{analytics.plusOnesDist.plus2Plus}</span>
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
            Allowed: up to {settingsForm.maxPlusOnes} plus-ones per attendee
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
              All ({analytics.totalResponses})
            </button>
            <button
              onClick={() => setActiveTab("attending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "attending" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Attending ({analytics.attendingResponses})
            </button>
            <button
              onClick={() => setActiveTab("waitlisted")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "waitlisted" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Waitlisted ({analytics.waitlistResponses})
            </button>
            <button
              onClick={() => setActiveTab("tentative")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "tentative" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tentative ({analytics.tentativeResponses})
            </button>
            <button
              onClick={() => setActiveTab("declined")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "declined" ? "bg-rose-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Declined ({analytics.declinedResponses})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "archived" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Archived ({analytics.archivedResponses})
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest, email, company..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {dietaryFilter !== "all" && (
              <button
                onClick={() => setDietaryFilter("all")}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>{dietaryFilter}</span>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-150 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{t("rsvp.guestName", "Guest Info")}</th>
                <th className="py-3 px-4">{t("rsvp.status", "Status")}</th>
                <th className="py-3 px-4">{t("rsvp.companionCount", "Headcount")}</th>
                <th className="py-3 px-4">{t("rsvp.dietaryPreference", "Dietary")}</th>
                <th className="py-3 px-4">{t("rsvp.specialRequests", "Notes")}</th>
                <th className="py-3 px-4">{t("rsvp.submittedAt", "Submitted")}</th>
                <th className="py-3 px-4 text-right">{t("rsvp.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRsvps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
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
                                <span className="text-emerald-600" title="Checked In">
                                  <ShieldCheck size={13} />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{rsvp.email}</div>
                            {(rsvp.company || rsvp.phone) && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {rsvp.company && <span>{rsvp.company}</span>}
                                {rsvp.phone && <span>• {rsvp.phone}</span>}
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
                          <option value="attending">✓ Attending</option>
                          <option value="waitlisted">⏱ Waitlisted</option>
                          <option value="tentative">? Tentative</option>
                          <option value="declined">✕ Declined</option>
                        </select>
                      </td>

                      {/* Headcount */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {1 + pOnes} {1 + pOnes === 1 ? "Head" : "Heads"}
                          </span>
                          {pOnes > 0 && (
                            <span className="text-[10px] text-blue-600 font-semibold" title={companionList.join(", ")}>
                              You + {pOnes} companion{pOnes > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dietary */}
                      <td className="py-3 px-4">
                        {(rsvp.dietaryPreference || rsvp.dietary_preference) && (rsvp.dietaryPreference || rsvp.dietary_preference) !== "None" ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 w-fit">
                              <span>🍽️</span>
                              <span>{rsvp.dietaryPreference || rsvp.dietary_preference}</span>
                            </span>
                            {(rsvp.dietaryNotes || rsvp.dietary_notes) && (
                              <span className="text-[10px] text-slate-400 italic line-clamp-1">
                                {rsvp.dietaryNotes || rsvp.dietary_notes}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard</span>
                        )}
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
                              title="Promote to Attending"
                            >
                              Promote
                            </button>
                          )}

                          {st === "archived" ? (
                            <button
                              onClick={() => handleQuickStatusChange(rsvp.id, "attending")}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              title="Restore RSVP"
                            >
                              <RotateCcw size={13} />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(rsvp.id, rsvp.fullName || rsvp.full_name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Archive RSVP (Data preserved)"
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
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{t("rsvp.settings", "RSVP Configuration Settings")}</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800">{t("rsvp.enableRsvp", "Enable Public RSVP")}</div>
                  <div className="text-[11px] text-slate-500">Allow guests to submit attendance responses</div>
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
                    <div className="font-bold text-slate-800">Allow Plus-Ones</div>
                    <div className="text-[10px] text-slate-500">Enable companions</div>
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
                    Max +1s / Guest
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
                  <div className="font-bold text-slate-800">{t("rsvp.enableWaitlist", "Automatic Priority Waitlist")}</div>
                  <div className="text-[11px] text-slate-500">Route guests to waitlist when capacity is reached</div>
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
                  Confirmation Message for Guests
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isSavingSettings ? "Saving..." : t("rsvp.saveSettings", "Save Settings")}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          6. MANUAL GUEST RSVP MODAL
      ───────────────────────────────────────────── */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{t("rsvp.manualAdd", "Log Manual Guest RSVP")}</h3>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              
              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Status</label>
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
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.fullName}
                    onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                    placeholder="Guest name..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder="guest@domain.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Phone & Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Phone</label>
                  <input
                    type="text"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="+213..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Company</label>
                  <input
                    type="text"
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    placeholder="Company name..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Plus Ones */}
              {manualForm.status === "attending" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Companions (+1s)</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setManualForm({ ...manualForm, plusOnes: n })}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            manualForm.plusOnes === n ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {n === 0 ? "0" : `+${n}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dietary */}
              {manualForm.status === "attending" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Dietary Preference</label>
                  <SearchableSelect
                    value={manualForm.dietaryPreference}
                    onChange={(val) => setManualForm({ ...manualForm, dietaryPreference: val })}
                    options={DIETARY_OPTIONS.map(d => ({ value: d.id, label: d.label }))}
                    placeholder="Select dietary preference..."
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Notes / VIP Request</label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Special notes or seating preferences..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isSubmittingManual ? "Saving..." : "Save RSVP"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          7. SHARE LINK & QR CODE MODAL
      ───────────────────────────────────────────── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up text-center">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 text-left">
              <div className="flex items-center gap-2">
                <Share2 size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Public RSVP Link</h3>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {shareQrUrl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 w-fit mx-auto shadow-2xs">
                  <img src={shareQrUrl} alt="RSVP QR Code" className="w-44 h-44 object-contain mx-auto" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-2">Scan to RSVP on Mobile</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shareable Direct URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/?event=${activeEventId}&view=rsvp` : ""}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {onOpenPublicRSVP && (
                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    onOpenPublicRSVP();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Preview Guest Submission Modal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
