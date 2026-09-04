"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Building2, Users, DollarSign, TrendingUp, Filter, Search, Plus, 
  Sparkles, Store, CheckCircle2, XCircle, ArrowRight, ArrowLeft, 
  MoreVertical, Calendar, Phone, Mail, FileText, ChevronRight,
  Layers, RotateCcw, Award, Trash2, Edit3, MessageSquare, 
  PieChart, BarChart2, Check, Download, AlertCircle, Clock
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import CountryPhoneInput from "./CountryPhoneInput";
import { getLocalizedIndustry } from "../lib/constants";

export const FUNNEL_STAGES = [
  {
    id: "lead",
    labelKey: "opp.stageLead",
    fallbackLabel: "New Prospects",
    color: "slate",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    headerBg: "bg-white text-slate-800 border-slate-200/90",
    dotColor: "bg-slate-400",
    defaultProbability: 15,
  },
  {
    id: "contacted",
    labelKey: "opp.stageContacted",
    fallbackLabel: "Contacted",
    color: "slate",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    headerBg: "bg-white text-slate-800 border-slate-200/90",
    dotColor: "bg-slate-400",
    defaultProbability: 30,
  },
  {
    id: "pitching",
    labelKey: "opp.stagePitching",
    fallbackLabel: "Pitching / Demo",
    color: "slate",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    headerBg: "bg-white text-slate-800 border-slate-200/90",
    dotColor: "bg-slate-400",
    defaultProbability: 55,
  },
  {
    id: "proposal",
    labelKey: "opp.stageProposal",
    fallbackLabel: "Proposal Sent",
    color: "slate",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    headerBg: "bg-white text-slate-800 border-slate-200/90",
    dotColor: "bg-slate-400",
    defaultProbability: 75,
  },
  {
    id: "won_sponsor",
    labelKey: "opp.stageWonSponsor",
    fallbackLabel: "Won: Sponsor",
    color: "emerald",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-50 text-emerald-900 border-emerald-200",
    dotColor: "bg-emerald-500",
    defaultProbability: 100,
    isWon: true,
  },
  {
    id: "won_exhibitor",
    labelKey: "opp.stageWonExhibitor",
    fallbackLabel: "Won: Exhibitor",
    color: "teal",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
    headerBg: "bg-teal-50 text-teal-900 border-teal-200",
    dotColor: "bg-teal-500",
    defaultProbability: 100,
    isWon: true,
  },
  {
    id: "lost",
    labelKey: "opp.stageLost",
    fallbackLabel: "Lost / Dropped",
    color: "rose",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    headerBg: "bg-rose-50 text-rose-900 border-rose-200",
    dotColor: "bg-rose-500",
    defaultProbability: 0,
    isLost: true,
  },
];

export const INDUSTRY_OPTIONS = [
  "Technology & Software",
  "Energy & Hydrocarbons",
  "Business & Finance",
  "Banking & Fintech",
  "Medical & Healthcare",
  "Telecom & Infrastructure",
  "Manufacturing & Industry",
  "Education & Research",
  "Retail & E-Commerce",
  "Construction & Real Estate",
  "Media & Advertising",
  "Transportation & Logistics",
  "Agriculture & Agri-food",
  "Government & Public Sector",
  "Other"
];

export const TARGET_TYPE_OPTIONS = [
  { value: "sponsor", label: "Sponsor (Diamond, Gold, Silver)" },
  { value: "exhibitor", label: "Exhibitor (Booth & Space)" },
  { value: "both", label: "Both Sponsor & Exhibitor" }
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low Priority", icon: <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0 inline-block" /> },
  { value: "medium", label: "Medium Priority", icon: <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 inline-block" /> },
  { value: "high", label: "High Priority", icon: <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 inline-block" /> },
  { value: "urgent", label: "Urgent", icon: <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 inline-block" /> }
];

export const SPONSOR_TIER_OPTIONS = [
  { value: "diamond", label: "Diamond Tier" },
  { value: "gold", label: "Gold Tier" },
  { value: "silver", label: "Silver Tier" }
];

export const LOST_REASON_OPTIONS = [
  "Budget constraints / Out of budget",
  "Chose competitor or another event",
  "Timing / Schedule conflict",
  "No response / Unreachable",
  "Internal company decision / Frozen budget",
  "Not a fit for current event theme",
  "Other"
];

export default function OpportunitiesView({
  state,
  onUpdateState,
  onOpenModal,
  onSwitchView,
}) {
  const { t, lang, isRTL } = useLanguage();
  const opportunities = state.opportunities || [];
  const organizations = state.organizations || [];
  const sponsors = state.sponsors || [];
  const exhibitors = state.exhibitors || [];

  // Local state
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState("board"); // "board" | "table"
  const [searchQuery, setSearchQuery] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all"); // "all" | "sponsor" | "exhibitor" | "both"
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal / Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);

  // Conversion Modals
  const [convertingOpp, setConvertingOpp] = useState(null);
  const [conversionType, setConversionType] = useState(null); // "sponsor" | "exhibitor"
  const [selectedTier, setSelectedTier] = useState("gold");
  const [selectedBooth, setSelectedBooth] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  
  // Lost Modal
  const [lostModalOpp, setLostModalOpp] = useState(null);
  const [selectedLostReason, setSelectedLostReason] = useState(LOST_REASON_OPTIONS[0]);
  const [customLostNote, setCustomLostNote] = useState("");

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Drag and Drop state
  const [draggedOppId, setDraggedOppId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Filtered list
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (opp.isArchived) return false;

      // Target filter
      if (targetTypeFilter !== "all" && opp.targetType !== targetTypeFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && opp.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const comp = (opp.companyName || opp.name || "").toLowerCase();
        const contact = (opp.contactName || "").toLowerCase();
        const email = (opp.contactEmail || "").toLowerCase();
        const notes = (opp.notes || "").toLowerCase();
        const ind = (opp.industry || "").toLowerCase();
        return comp.includes(q) || contact.includes(q) || email.includes(q) || notes.includes(q) || ind.includes(q);
      }

      return true;
    });
  }, [opportunities, targetTypeFilter, priorityFilter, searchQuery]);

  // Aggregate Funnel Metrics
  const metrics = useMemo(() => {
    const activeList = opportunities.filter(o => !o.isArchived);
    
    // Revenue is strictly the money from won deals
    const wonRevenue = activeList
      .filter(o => o.stage === "won_sponsor" || o.stage === "won_exhibitor" || o.status === "won")
      .reduce((sum, o) => sum + (parseFloat(o.dealValue) || 0), 0);

    const totalPipelineValue = activeList
      .filter(o => o.stage !== "lost")
      .reduce((sum, o) => sum + (parseFloat(o.dealValue) || 0), 0);

    const weightedForecastValue = activeList
      .filter(o => o.stage !== "lost")
      .reduce((sum, o) => sum + ((parseFloat(o.dealValue) || 0) * (parseInt(o.probability, 10) || 0) / 100), 0);

    const wonSponsorsCount = activeList.filter(o => o.stage === "won_sponsor").length;
    const wonExhibitorsCount = activeList.filter(o => o.stage === "won_exhibitor").length;
    const wonCount = wonSponsorsCount + wonExhibitorsCount;
    const lostCount = activeList.filter(o => o.stage === "lost").length;
    const activeCount = activeList.filter(o => o.stage !== "won_sponsor" && o.stage !== "won_exhibitor" && o.stage !== "lost").length;

    const closedTotal = wonSponsorsCount + wonExhibitorsCount + lostCount;
    const winRate = closedTotal > 0 ? Math.round((wonCount / closedTotal) * 100) : 0;

    return {
      wonRevenue,
      wonCount,
      totalPipelineValue,
      weightedForecastValue,
      wonSponsorsCount,
      wonExhibitorsCount,
      lostCount,
      activeCount,
      totalCount: activeList.length,
      winRate
    };
  }, [opportunities]);

  // Stage Move Handler
  const handleMoveStage = (oppId, newStageId) => {
    const targetOpp = opportunities.find(o => o.id === oppId);
    if (!targetOpp) return;

    // If moving to Won: Sponsor, prompt conversion modal
    if (newStageId === "won_sponsor" && targetOpp.stage !== "won_sponsor") {
      setConvertingOpp(targetOpp);
      setConversionType("sponsor");
      setSelectedTier(targetOpp.tierInterest || "gold");
      setSelectedWebsite(targetOpp.website || "");
      return;
    }

    // If moving to Won: Exhibitor, prompt conversion modal
    if (newStageId === "won_exhibitor" && targetOpp.stage !== "won_exhibitor") {
      setConvertingOpp(targetOpp);
      setConversionType("exhibitor");
      setSelectedBooth(targetOpp.boothPreference || "");
      return;
    }

    // If moving to Lost, prompt lost modal
    if (newStageId === "lost" && targetOpp.stage !== "lost") {
      setLostModalOpp(targetOpp);
      setSelectedLostReason(LOST_REASON_OPTIONS[0]);
      setCustomLostNote("");
      return;
    }

    const stageConfig = FUNNEL_STAGES.find(s => s.id === newStageId);
    const newProbability = stageConfig ? stageConfig.defaultProbability : targetOpp.probability;

    const updated = {
      ...targetOpp,
      stage: newStageId,
      probability: newProbability,
      status: (newStageId === "won_sponsor" || newStageId === "won_exhibitor") ? "won" : (newStageId === "lost" ? "lost" : "active"),
      activityLog: [
        {
          id: Date.now().toString(),
          type: "stage_change",
          date: new Date().toISOString(),
          text: `Moved stage to ${stageConfig?.fallbackLabel || newStageId}`,
          author: "Organizer"
        },
        ...(targetOpp.activityLog || [])
      ]
    };

    onUpdateState("opportunities", opportunities.map(o => o.id === oppId ? updated : o));
    showToast(`Opportunity moved to ${stageConfig?.fallbackLabel || newStageId}`);
  };

  // Quick forward / backward stage
  const handleShiftStage = (opp, direction) => {
    const currentIndex = FUNNEL_STAGES.findIndex(s => s.id === opp.stage);
    if (currentIndex === -1) return;

    if (direction === "next" && currentIndex < FUNNEL_STAGES.length - 1) {
      handleMoveStage(opp.id, FUNNEL_STAGES[currentIndex + 1].id);
    } else if (direction === "prev" && currentIndex > 0) {
      handleMoveStage(opp.id, FUNNEL_STAGES[currentIndex - 1].id);
    }
  };

  // Convert to Sponsor Execution
  const handleExecuteSponsorConversion = () => {
    if (!convertingOpp) return;

    const companyName = convertingOpp.companyName || convertingOpp.name;
    const tier = selectedTier || convertingOpp.tierInterest || "gold";
    const website = selectedWebsite || convertingOpp.website || "";
    const logo = convertingOpp.logo || convertingOpp.logoUrl || "";

    // 1. Check or create Partner Organization
    let linkedOrg = organizations.find(org => (org.name || "").trim().toLowerCase() === companyName.trim().toLowerCase());
    let newOrgs = [...organizations];
    if (!linkedOrg) {
      linkedOrg = {
        id: crypto.randomUUID ? crypto.randomUUID() : `org-${Date.now()}`,
        name: companyName,
        industry: convertingOpp.industry || "Business & Finance",
        contact: convertingOpp.contactName || "",
        logo: logo,
        website: website,
        status: "active"
      };
      newOrgs.push(linkedOrg);
      onUpdateState("organizations", newOrgs);
    }

    // 2. Add or update Sponsor record
    const newSponsor = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sp-${Date.now()}`,
      name: companyName,
      tier: tier,
      industry: convertingOpp.industry || "Business & Finance",
      website: website,
      logo: logo,
      orgId: linkedOrg.id,
      status: "active"
    };
    onUpdateState("sponsors", [...sponsors.filter(s => s.name.toLowerCase() !== companyName.toLowerCase()), newSponsor]);

    // 3. Update Opportunity record
    const updatedOpp = {
      ...convertingOpp,
      stage: "won_sponsor",
      status: "won",
      probability: 100,
      tierInterest: tier,
      convertedSponsorId: newSponsor.id,
      orgId: linkedOrg.id,
      activityLog: [
        {
          id: Date.now().toString(),
          type: "conversion",
          date: new Date().toISOString(),
          text: `🎉 Successfully converted to Sponsor (${tier.toUpperCase()} Tier).`,
          author: "Organizer"
        },
        ...(convertingOpp.activityLog || [])
      ]
    };

    onUpdateState("opportunities", opportunities.map(o => o.id === convertingOpp.id ? updatedOpp : o));
    setConvertingOpp(null);
    showToast(`🏆 "${companyName}" converted to Sponsor! Available in Sponsors tab.`);
  };

  // Convert to Exhibitor Execution
  const handleExecuteExhibitorConversion = () => {
    if (!convertingOpp) return;

    const companyName = convertingOpp.companyName || convertingOpp.name;
    const booth = selectedBooth || convertingOpp.boothPreference || "Pending Assignment";
    const logo = convertingOpp.logo || convertingOpp.logoUrl || "";

    // 1. Check or create Partner Organization
    let linkedOrg = organizations.find(org => (org.name || "").trim().toLowerCase() === companyName.trim().toLowerCase());
    let newOrgs = [...organizations];
    if (!linkedOrg) {
      linkedOrg = {
        id: crypto.randomUUID ? crypto.randomUUID() : `org-${Date.now()}`,
        name: companyName,
        industry: convertingOpp.industry || "Technology & Software",
        contact: convertingOpp.contactName || "",
        logo: logo,
        status: "active"
      };
      newOrgs.push(linkedOrg);
      onUpdateState("organizations", newOrgs);
    }

    // 2. Add or update Exhibitor record
    const newExhibitor = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ex-${Date.now()}`,
      name: companyName,
      booth: booth,
      boothNumber: booth,
      industry: convertingOpp.industry || "Technology & Software",
      contact: convertingOpp.contactName || "",
      contactEmail: convertingOpp.contactEmail || "",
      email: convertingOpp.contactEmail || "",
      logo: logo,
      orgId: linkedOrg.id,
      status: "active"
    };
    onUpdateState("exhibitors", [...exhibitors.filter(e => e.name.toLowerCase() !== companyName.toLowerCase()), newExhibitor]);

    // 3. Update Opportunity record
    const updatedOpp = {
      ...convertingOpp,
      stage: "won_exhibitor",
      status: "won",
      probability: 100,
      boothPreference: booth,
      convertedExhibitorId: newExhibitor.id,
      orgId: linkedOrg.id,
      activityLog: [
        {
          id: Date.now().toString(),
          type: "conversion",
          date: new Date().toISOString(),
          text: `🎪 Successfully converted to Exhibitor (Booth: ${booth}).`,
          author: "Organizer"
        },
        ...(convertingOpp.activityLog || [])
      ]
    };

    onUpdateState("opportunities", opportunities.map(o => o.id === convertingOpp.id ? updatedOpp : o));
    setConvertingOpp(null);
    showToast(`🎪 "${companyName}" converted to Exhibitor! Ready for Floor Plan assignment.`);
  };

  // Lost Execution
  const handleExecuteLost = () => {
    if (!lostModalOpp) return;

    const reason = selectedLostReason + (customLostNote ? ` — ${customLostNote}` : "");
    const updatedOpp = {
      ...lostModalOpp,
      stage: "lost",
      status: "lost",
      probability: 0,
      lostReason: reason,
      activityLog: [
        {
          id: Date.now().toString(),
          type: "lost",
          date: new Date().toISOString(),
          text: `❌ Deal marked as Lost. Reason: ${reason}`,
          author: "Organizer"
        },
        ...(lostModalOpp.activityLog || [])
      ]
    };

    onUpdateState("opportunities", opportunities.map(o => o.id === lostModalOpp.id ? updatedOpp : o));
    setLostModalOpp(null);
    showToast(`Opportunity marked as Lost.`);
  };

  // Re-open opportunity
  const handleReopen = (opp) => {
    const updated = {
      ...opp,
      stage: "lead",
      status: "active",
      probability: 20,
      lostReason: "",
      activityLog: [
        {
          id: Date.now().toString(),
          type: "reopen",
          date: new Date().toISOString(),
          text: `🔄 Opportunity re-opened into active pipeline.`,
          author: "Organizer"
        },
        ...(opp.activityLog || [])
      ]
    };
    onUpdateState("opportunities", opportunities.map(o => o.id === opp.id ? updated : o));
    showToast(`Opportunity re-opened into New Prospects.`);
  };

  // Save / Upsert Opportunity from Drawer
  const handleSaveOpportunity = (oppData) => {
    const isNew = !oppData.id;
    const oppId = oppData.id || (crypto.randomUUID ? crypto.randomUUID() : `opp-${Date.now()}`);
    
    const prepared = {
      ...oppData,
      id: oppId,
      name: oppData.companyName || oppData.name || "Untitled Prospect",
      companyName: oppData.companyName || oppData.name || "Untitled Prospect",
      dealValue: parseFloat(oppData.dealValue || 0),
      probability: parseInt(oppData.probability, 10) || 20,
      status: oppData.stage === "won_sponsor" || oppData.stage === "won_exhibitor" ? "won" : (oppData.stage === "lost" ? "lost" : "active"),
      activityLog: oppData.activityLog || [
        {
          id: Date.now().toString(),
          type: "created",
          date: new Date().toISOString(),
          text: "Prospect record created.",
          author: "Organizer"
        }
      ]
    };

    if (isNew) {
      onUpdateState("opportunities", [prepared, ...opportunities]);
      showToast(`Prospect "${prepared.companyName}" added to pipeline.`);
    } else {
      onUpdateState("opportunities", opportunities.map(o => o.id === oppId ? prepared : o));
      showToast(`Prospect "${prepared.companyName}" updated.`);
    }

    setShowDrawer(false);
    setEditingOpp(null);
  };

  // Archive / Delete Opportunity
  const handleArchiveOpp = (id) => {
    if (confirm("Archive this prospect from the pipeline? (Record preserved in archives)")) {
      onUpdateState("opportunities", opportunities.map(o => o.id === id ? { ...o, isArchived: true, status: "archived" } : o));
      showToast("Prospect archived.");
    }
  };

  const handleRestoreOpp = (id) => {
    onUpdateState("opportunities", opportunities.map(o => o.id === id ? { ...o, isArchived: false, status: "lead" } : o));
    showToast("Prospect restored.");
  };

  const handleDeletePermanentOpp = (id) => {
    if (confirm("Permanently delete this prospect? This action cannot be undone.")) {
      onUpdateState("opportunities", opportunities.filter(o => o.id !== id));
      if (editingOpp?.id === id) {
        setShowDrawer(false);
        setEditingOpp(null);
      }
      showToast("Prospect deleted permanently.");
    }
  };

  // Format currency
  const formatCurrency = (val, curr = "DZD") => {
    const num = parseFloat(val) || 0;
    return `${num.toLocaleString()} ${curr}`;
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Company Name", "Target Role", "Stage", "Deal Value", "Currency", "Probability (%)", "Contact Person", "Email", "Phone", "Industry", "Priority", "Status", "Lost Reason"];
    const rows = filteredOpportunities.map(o => [
      `"${(o.companyName || o.name || '').replace(/"/g, '""')}"`,
      `"${o.targetType || ''}"`,
      `"${o.stage || ''}"`,
      o.dealValue || 0,
      `"${o.currency || 'DZD'}"`,
      o.probability || 0,
      `"${(o.contactName || '').replace(/"/g, '""')}"`,
      `"${(o.contactEmail || '').replace(/"/g, '""')}"`,
      `"${(o.contactPhone || '').replace(/"/g, '""')}"`,
      `"${(o.industry || '').replace(/"/g, '""')}"`,
      `"${o.priority || ''}"`,
      `"${o.status || 'active'}"`,
      `"${(o.lostReason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventzone_pipeline_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-slide-in">
          <Sparkles size={18} className="text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs ml-2 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t("opp.title", "Opportunities & Prospects Pipeline")}</h2>
          <p className="text-sm text-slate-500">{t("opp.subtitle", "Track leads, sponsor outreach, and exhibitor sales from initial discovery to confirmed contract or loss.")}</p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            <button
              onClick={() => setViewMode("board")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === "board" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              <Layers size={13} />
              <span>{t("opp.boardView", "Funnel Board")}</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === "table" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              <BarChart2 size={13} />
              <span>{t("opp.tableView", "Table View")}</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download size={14} />
            <span>{t("opp.exportCSV", "Export CSV")}</span>
          </button>

          <button
            onClick={() => {
              setEditingOpp(null);
              setShowDrawer(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:shadow duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>{t("opp.addProspect", "Add Prospect")}</span>
          </button>
        </div>
      </header>

      {/* KPI Funnel Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <DollarSign size={13} className="text-blue-500" />
            {t("opp.totalPipelineValue", "Revenue")}
          </span>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(metrics.wonRevenue)}</span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{metrics.wonCount} {t("opp.wonDeals", "won deals")}</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/70 bg-emerald-50/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600" />
            {t("opp.wonSponsors", "Won Sponsors")}
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-700">{metrics.wonSponsorsCount}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{t("overview.confirmedBadge", "Confirmed")}</span>
          </div>
        </div>

        <div className="bg-white border border-teal-200/70 bg-teal-50/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
            <Store size={13} className="text-teal-600" />
            {t("opp.wonExhibitors", "Won Exhibitors")}
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-teal-700">{metrics.wonExhibitorsCount}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">{t("overview.confirmedBadge", "Confirmed")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award size={13} className="text-amber-500" />
            {t("opp.winRate", "Win Rate")}
          </span>
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-slate-900">{metrics.winRate}%</span>
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-[120px]">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(metrics.winRate, 100)}%` }} />
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{metrics.wonSponsorsCount + metrics.wonExhibitorsCount} {t("opp.wonDeals", "won deals")}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("opp.searchPlaceholder", "Search company, contact, or email...")}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 bg-slate-50/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            )}
          </div>

          <div className="w-48 shrink-0">
            <SearchableSelect
              value={targetTypeFilter}
              onChange={(val) => setTargetTypeFilter(val)}
              options={[
                { value: "all", label: t("opp.filterAll", "All Targets") },
                { value: "sponsor", label: t("opp.filterSponsors", "Sponsors Only") },
                { value: "exhibitor", label: t("opp.filterExhibitors", "Exhibitors Only") },
                { value: "both", label: t("opp.filterBoth", "Sponsors & Exhibitors") }
              ]}
              showSearch={false}
              isClearable={false}
              buttonClassName="py-2 text-xs"
            />
          </div>

          <div className="w-44 shrink-0 hidden sm:block">
            <SearchableSelect
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val)}
              options={[
                { value: "all", label: "All Priorities" },
                { value: "urgent", label: "Urgent" },
                { value: "high", label: "High Priority" },
                { value: "medium", label: "Medium Priority" },
                { value: "low", label: "Low Priority" }
              ]}
              showSearch={false}
              isClearable={false}
              buttonClassName="py-2 text-xs"
            />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 shrink-0 self-end md:self-center">
          {t("opp.showingProspects", "Showing")} <span className="font-bold text-slate-800">{filteredOpportunities.length}</span> {t("opp.prospects", "prospects")}
        </div>
      </div>

      {/* VIEW 1: KANBAN FUNNEL BOARD */}
      {viewMode === "board" && (
        <div className="flex gap-4 items-start overflow-x-auto pb-6 pt-1 px-1 select-none">
          {FUNNEL_STAGES.map((stage) => {
            const stageOpps = filteredOpportunities.filter(o => o.stage === stage.id);
            const stageTotalVal = stageOpps.reduce((sum, o) => sum + (parseFloat(o.dealValue) || 0), 0);
            const isDragTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.id);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedOppId) {
                    handleMoveStage(draggedOppId, stage.id);
                    setDraggedOppId(null);
                    setDragOverStage(null);
                  }
                }}
                className={`w-[310px] min-w-[310px] shrink-0 bg-slate-50/90 border rounded-2xl p-3.5 flex flex-col gap-3 transition-all shadow-2xs ${isDragTarget ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40" : "border-slate-200/90"}`}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs select-none ${stage.headerBg}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.dotColor}`} />
                    <span className="font-extrabold text-xs truncate tracking-tight">
                      {t(stage.labelKey, stage.fallbackLabel)}
                    </span>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white/90 text-slate-800 shadow-2xs shrink-0">
                    {stageOpps.length}
                  </span>
                </div>

                {/* Sub-header stage value */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>{t("opp.volume", "Volume")}</span>
                  <span className="text-slate-700 font-black">{formatCurrency(stageTotalVal)}</span>
                </div>

                {/* Column Cards */}
                <div className="flex flex-col gap-3 min-h-[420px]">
                  {stageOpps.length === 0 ? (
                    <div className="h-36 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-4 text-xs text-slate-400 font-medium bg-white/40">
                      {t("opp.noOpportunities", "No opportunities in this stage.")}
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <OpportunityCard
                        key={opp.id}
                        opp={opp}
                        onEdit={() => {
                          setEditingOpp(opp);
                          setShowDrawer(true);
                        }}
                        onShift={handleShiftStage}
                        onMoveStage={handleMoveStage}
                        onArchive={handleArchiveOpp}
                        onRestore={handleRestoreOpp}
                        onPermanentDelete={handleDeletePermanentOpp}
                        onReopen={handleReopen}
                        onDragStart={() => setDraggedOppId(opp.id)}
                        formatCurrency={formatCurrency}
                        t={t}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thCompany", "Company / Prospect")}</th>
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thRole", "Target Role")}</th>
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thStage", "Funnel Stage")}</th>
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thValue", "Deal Value")}</th>
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thProbability", "Probability")}</th>
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thContact", "Contact")}</th>
                  <th className="py-3.5 px-4 font-extrabold">{t("opp.thPriority", "Priority")}</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">{t("table.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      {t("opp.noProspectsFound", "No matching prospects found")}.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp) => {
                    const currentStage = FUNNEL_STAGES.find(s => s.id === opp.stage) || FUNNEL_STAGES[0];
                    return (
                      <tr key={opp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {opp.logo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={opp.logo} className="w-8 h-8 rounded-lg object-cover border border-slate-150 shadow-2xs" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                                {(opp.companyName || opp.name || "P").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-[180px]">{opp.companyName || opp.name}</span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-[180px]">{getLocalizedIndustry(opp.industry, t) || t("common.general", "General")}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {opp.targetType === "sponsor" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              💎 Sponsor ({opp.tierInterest || "Silver"})
                            </span>
                          )}
                          {opp.targetType === "exhibitor" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              🎪 Exhibitor
                            </span>
                          )}
                          {opp.targetType === "both" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🤝 Both
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 w-44">
                          <SearchableSelect
                            value={opp.stage}
                            onChange={(val) => handleMoveStage(opp.id, val)}
                            options={FUNNEL_STAGES.map(s => ({ value: s.id, label: t(s.labelKey, s.fallbackLabel) }))}
                            showSearch={false}
                            isClearable={false}
                            buttonClassName="py-1 px-2 text-[11px] font-bold"
                          />
                        </td>

                        <td className="py-3 px-4 font-black text-slate-900">
                          {formatCurrency(opp.dealValue, opp.currency)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11px] text-slate-700">{opp.probability || 0}%</span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(opp.probability || 0, 100)}%` }} />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs">{opp.contactName || "—"}</span>
                            {opp.contactEmail && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{opp.contactEmail}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            opp.priority === "urgent" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            opp.priority === "high" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            opp.priority === "low" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {opp.priority || "Medium"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingOpp(opp);
                                setShowDrawer(true);
                              }}
                              className="px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title={t("opp.editProspect", "Edit Prospect")}
                            >
                              {t("common.edit", "Edit")}
                            </button>

                            {opp.stage !== "won_sponsor" && (
                              <button
                                onClick={() => handleMoveStage(opp.id, "won_sponsor")}
                                className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title={t("opp.convertToSponsor", "Convert to Sponsor")}
                              >
                                {t("table.sponsor", "Sponsor")}
                              </button>
                            )}

                            {opp.stage !== "won_exhibitor" && (
                              <button
                                onClick={() => handleMoveStage(opp.id, "won_exhibitor")}
                                className="px-2 py-1 text-teal-700 hover:bg-teal-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title={t("opp.convertToExhibitor", "Convert to Exhibitor")}
                              >
                                {t("table.exhibitor", "Exhibitor")}
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
      )}

      {/* PROSPECT DRAWER / MODAL */}
      {showDrawer && (
        <ProspectDrawer
          isOpen={showDrawer}
          onClose={() => {
            setShowDrawer(false);
            setEditingOpp(null);
          }}
          opp={editingOpp}
          organizations={organizations}
          onSave={handleSaveOpportunity}
          onConvertToSponsor={(opp) => {
            setConvertingOpp(opp);
            setConversionType("sponsor");
            setSelectedTier(opp.tierInterest || "gold");
            setSelectedWebsite(opp.website || "");
          }}
          onConvertToExhibitor={(opp) => {
            setConvertingOpp(opp);
            setConversionType("exhibitor");
            setSelectedBooth(opp.boothPreference || "");
          }}
          onMarkLost={(opp) => {
            setLostModalOpp(opp);
            setSelectedLostReason(LOST_REASON_OPTIONS[0]);
            setCustomLostNote("");
          }}
          onReopen={handleReopen}
          onArchive={handleArchiveOpp}
          onRestore={handleRestoreOpp}
          onPermanentDelete={handleDeletePermanentOpp}
          t={t}
        />
      )}

      {/* CONVERT TO SPONSOR MODAL */}
      {mounted && convertingOpp && conversionType === "sponsor" && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4 font-sans">
          <div className="absolute inset-0" onClick={() => setConvertingOpp(null)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-scale-up z-10">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  💎
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Convert to Sponsor</h3>
                  <p className="text-xs text-slate-500 font-medium">Activate official sponsorship profile</p>
                </div>
              </div>
              <button onClick={() => setConvertingOpp(null)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer">✕</button>
            </header>

            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center font-black text-amber-700 text-sm shrink-0">
                  {(convertingOpp.companyName || convertingOpp.name || "S").charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">{convertingOpp.companyName || convertingOpp.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{getLocalizedIndustry(convertingOpp.industry, t) || t("common.general", "General")} • {convertingOpp.contactName || t("common.noContact", "No contact")}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Select Sponsorship Tier</label>
                <SearchableSelect
                  value={selectedTier}
                  onChange={(val) => setSelectedTier(val)}
                  options={SPONSOR_TIER_OPTIONS}
                  placeholder="Select tier..."
                  showSearch={false}
                  isClearable={false}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Official Website URL (Optional)</label>
                <input
                  type="url"
                  value={selectedWebsite}
                  onChange={(e) => setSelectedWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConvertingOpp(null)}
                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSponsorConversion}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Confirm Conversion</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONVERT TO EXHIBITOR MODAL */}
      {mounted && convertingOpp && conversionType === "exhibitor" && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4 font-sans">
          <div className="absolute inset-0" onClick={() => setConvertingOpp(null)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-scale-up z-10">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  🎪
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Convert to Exhibitor</h3>
                  <p className="text-xs text-slate-500 font-medium">Add to Floor Plan & Exhibitor directory</p>
                </div>
              </div>
              <button onClick={() => setConvertingOpp(null)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer">✕</button>
            </header>

            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-teal-200 flex items-center justify-center font-black text-teal-700 text-sm shrink-0">
                  {(convertingOpp.companyName || convertingOpp.name || "E").charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">{convertingOpp.companyName || convertingOpp.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{convertingOpp.industry || "General"} • {convertingOpp.contactName || "No contact"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Booth Identifier / Location</label>
                <input
                  type="text"
                  value={selectedBooth}
                  onChange={(e) => setSelectedBooth(e.target.value)}
                  placeholder="e.g. Booth A-12, Standard 3x3m"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400">You can also position this exhibitor visually inside Floor Plans.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConvertingOpp(null)}
                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExhibitorConversion}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Confirm Exhibitor</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MARK AS LOST MODAL */}
      {mounted && lostModalOpp && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4 font-sans">
          <div className="absolute inset-0" onClick={() => setLostModalOpp(null)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-scale-up z-10">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  ❌
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t("opp.markLost", "Mark as Lost")}</h3>
                  <p className="text-xs text-slate-500 font-medium">Record reason for commercial pipeline analytics</p>
                </div>
              </div>
              <button onClick={() => setLostModalOpp(null)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer">✕</button>
            </header>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{t("opp.lostReason", "Reason for Loss")}</label>
                <SearchableSelect
                  value={selectedLostReason}
                  onChange={(val) => setSelectedLostReason(val)}
                  options={LOST_REASON_OPTIONS}
                  placeholder="Select reason..."
                  showSearch={false}
                  isClearable={false}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Additional Notes (Optional)</label>
                <textarea
                  value={customLostNote}
                  onChange={(e) => setCustomLostNote(e.target.value)}
                  placeholder="e.g. Budget postponed to Q4 2026, follow up next summit..."
                  rows={3}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLostModalOpp(null)}
                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteLost}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Confirm Loss</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// OPPORTUNITY CARD (KANBAN)
// ─────────────────────────────────────────────
function OpportunityCard({
  opp,
  onEdit,
  onShift,
  onMoveStage,
  onArchive,
  onRestore,
  onPermanentDelete,
  onReopen,
  onDragStart,
  formatCurrency,
  t
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isWonSponsor = opp.stage === "won_sponsor";
  const isWonExhibitor = opp.stage === "won_exhibitor";
  const isLost = opp.stage === "lost";
  const isArchived = opp.isArchived || opp.status === "archived";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-white border rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col gap-3 group relative cursor-grab active:cursor-grabbing ${
        isWonSponsor ? "border-emerald-200 bg-emerald-50/10" :
        isWonExhibitor ? "border-teal-200 bg-teal-50/10" :
        isLost ? "border-rose-200 bg-rose-50/10 opacity-75" : "border-slate-200/90 hover:border-blue-300"
      }`}
    >
      {/* Top Header: Badge & Quick Menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {opp.targetType === "sponsor" && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              💎 Sponsor
            </span>
          )}
          {opp.targetType === "exhibitor" && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              🎪 Exhibitor
            </span>
          )}
          {opp.targetType === "both" && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              🤝 Both
            </span>
          )}

          {opp.priority === "urgent" && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700">
              🔥 Urgent
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <MoreVertical size={13} />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute end-0 top-7 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 flex flex-col text-xs font-semibold text-slate-700 animate-scale-up"
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit();
                }}
                className="px-3 py-1.5 text-start hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 size={12} />
                <span>{t("opp.editProspect", "Edit Prospect")}</span>
              </button>

              {!isWonSponsor && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMoveStage(opp.id, "won_sponsor");
                  }}
                  className="px-3 py-1.5 text-start hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Sparkles size={12} />
                  <span>{t("opp.convertToSponsor", "Convert Sponsor")}</span>
                </button>
              )}

              {!isWonExhibitor && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMoveStage(opp.id, "won_exhibitor");
                  }}
                  className="px-3 py-1.5 text-start hover:bg-teal-50 text-teal-700 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Store size={12} />
                  <span>{t("opp.convertToExhibitor", "Convert Exhibitor")}</span>
                </button>
              )}

              {!isLost && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMoveStage(opp.id, "lost");
                  }}
                  className="px-3 py-1.5 text-start hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <XCircle size={12} />
                  <span>{t("opp.markLost", "Mark as Lost")}</span>
                </button>
              )}

              {isLost && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReopen(opp);
                  }}
                  className="px-3 py-1.5 text-start hover:bg-blue-50 text-blue-700 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t("opp.reopen", "Re-open Deal")}</span>
                </button>
              )}

              <hr className="my-1 border-slate-100" />

              {isArchived ? (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onRestore) onRestore(opp.id);
                    }}
                    className="px-3 py-1.5 text-start hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>{t("table.restore", "Restore")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onPermanentDelete) onPermanentDelete(opp.id);
                      else if (onArchive) onArchive(opp.id);
                    }}
                    className="px-3 py-1.5 text-start hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>{t("table.deletePermanently", "Delete Permanently")}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onArchive(opp.id);
                    }}
                    className="px-3 py-1.5 text-start hover:bg-amber-50 text-slate-500 hover:text-amber-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Archive size={12} />
                    <span>{t("common.archive", "Archive")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onPermanentDelete) onPermanentDelete(opp.id);
                    }}
                    className="px-3 py-1.5 text-start hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>{t("table.deletePermanently", "Delete Permanently")}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Company & Contact */}
      <div onClick={onEdit} className="cursor-pointer">
        <div className="flex items-start gap-2.5">
          {opp.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={opp.logo} className="w-8 h-8 rounded-lg object-cover border border-slate-150 shrink-0 shadow-2xs mt-0.5" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
              {(opp.companyName || opp.name || "P").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-xs text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
              {opp.companyName || opp.name}
            </h4>
            <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">{getLocalizedIndustry(opp.industry, t) || t("opp.generalIndustry", "General Industry")}</p>
          </div>
        </div>

        {/* Contact Info Snippet */}
        {(opp.contactName || opp.contactEmail || opp.contactPhone) && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[10px] text-slate-500">
            {opp.contactName && (
              <span className="flex items-center gap-1.5 truncate font-semibold text-slate-700">
                <Users size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{opp.contactName}</span>
              </span>
            )}
            {opp.contactEmail && (
              <span className="flex items-center gap-1.5 truncate text-slate-400">
                <Mail size={11} className="shrink-0" />
                <span className="truncate">{opp.contactEmail}</span>
              </span>
            )}
          </div>
        )}

        {/* Lost reason badge if lost */}
        {isLost && opp.lostReason && (
          <div className="mt-2 p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-[10px] text-rose-700 font-medium">
            <span className="font-bold">Reason:</span> {opp.lostReason}
          </div>
        )}
      </div>

      {/* Deal Value & Probability Bar */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Deal Value</span>
          <span className="text-xs font-black text-slate-900 mt-0.5 block">
            {formatCurrency(opp.dealValue, opp.currency)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-extrabold text-slate-600 block leading-none">{opp.probability || 0}%</span>
          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${
                isWonSponsor || isWonExhibitor ? "bg-emerald-500" : isLost ? "bg-rose-400" : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(opp.probability || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage Progression Quick Action Footer */}
      <div className="pt-2 border-t border-slate-100/70 flex items-center justify-between gap-1 text-[10px]">
        <button
          onClick={() => onShift(opp, "prev")}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          title="Previous Stage"
        >
          <ArrowLeft size={12} />
        </button>

        <span className="text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[110px]">
          {isWonSponsor ? "🏆 Confirmed" : isWonExhibitor ? "🎪 Confirmed" : isLost ? "❌ Closed" : "In Funnel"}
        </span>

        <button
          onClick={() => onShift(opp, "next")}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          title="Next Stage"
        >
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROSPECT CREATION & EDIT DRAWER
// ─────────────────────────────────────────────
function ProspectDrawer({
  isOpen,
  onClose,
  opp,
  organizations = [],
  onSave,
  onConvertToSponsor,
  onConvertToExhibitor,
  onMarkLost,
  onReopen,
  onArchive,
  t
}) {
  const isEditing = !!opp;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [companyName, setCompanyName] = useState(opp?.companyName || opp?.name || "");
  const [targetType, setTargetType] = useState(opp?.targetType || "sponsor");
  const [stage, setStage] = useState(opp?.stage || "lead");
  const [industry, setIndustry] = useState(opp?.industry || "Technology & Software");
  const [contactName, setContactName] = useState(opp?.contactName || "");
  const [contactEmail, setContactEmail] = useState(opp?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(opp?.contactPhone || "");
  const [dealValue, setDealValue] = useState(opp?.dealValue || "150000");
  const [currency, setCurrency] = useState(opp?.currency || "DZD");
  const [probability, setProbability] = useState(opp?.probability !== undefined ? opp.probability : 20);
  const [priority, setPriority] = useState(opp?.priority || "medium");
  const [tierInterest, setTierInterest] = useState(opp?.tierInterest || "gold");
  const [boothPreference, setBoothPreference] = useState(opp?.boothPreference || "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(opp?.expectedCloseDate || "");
  const [notes, setNotes] = useState(opp?.notes || "");
  const [logo, setLogo] = useState(opp?.logo || opp?.logoUrl || "");

  // Activity Log
  const [activityList, setActivityList] = useState(opp?.activityLog || []);
  const [newActivityText, setNewActivityText] = useState("");
  const [newActivityType, setNewActivityType] = useState("call"); // "call" | "email" | "meeting" | "note"

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivityText.trim()) return;

    const entry = {
      id: Date.now().toString(),
      type: newActivityType,
      date: new Date().toISOString(),
      text: newActivityText.trim(),
      author: "Organizer"
    };

    setActivityList([entry, ...activityList]);
    setNewActivityText("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    onSave({
      id: opp?.id,
      name: companyName.trim(),
      companyName: companyName.trim(),
      targetType,
      stage,
      industry,
      contactName,
      contactEmail,
      contactPhone,
      dealValue,
      currency,
      probability,
      priority,
      tierInterest,
      boothPreference,
      expectedCloseDate,
      notes,
      logo,
      activityLog: activityList,
      convertedSponsorId: opp?.convertedSponsorId,
      convertedExhibitorId: opp?.convertedExhibitorId,
      orgId: opp?.orgId,
      lostReason: opp?.lostReason
    });
  };

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-[100] animate-fade-in font-sans">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-in-right overflow-y-auto border-l border-slate-200">
        {/* Drawer Header */}
        <header className="p-6 border-b border-slate-150 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {isEditing ? t("opp.editProspect", "Edit Prospect") : t("opp.addProspect", "Add Prospect")}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Pipeline Opportunity Details</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* Form Body */}
        <form id="prospect-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 flex-1">
          {/* Quick Actions for Editing */}
          {isEditing && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Quick Conversions:</span>
              <div className="flex items-center gap-1.5">
                {opp.stage !== "won_sponsor" && (
                  <button
                    type="button"
                    onClick={() => onConvertToSponsor(opp)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>To Sponsor</span>
                  </button>
                )}
                {opp.stage !== "won_exhibitor" && (
                  <button
                    type="button"
                    onClick={() => onConvertToExhibitor(opp)}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Store size={11} />
                    <span>To Exhibitor</span>
                  </button>
                )}
                {opp.stage !== "lost" && (
                  <button
                    type="button"
                    onClick={() => onMarkLost(opp)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle size={11} />
                    <span>Mark Lost</span>
                  </button>
                )}
                {opp.stage === "lost" && (
                  <button
                    type="button"
                    onClick={() => onReopen(opp)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Re-open</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Company Profile */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 size={13} className="text-blue-500" />
              1. Prospect & Company Information
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Company / Prospect Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Sonatrach, Cisco, Ooredoo"
                className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Target Role</label>
                <SearchableSelect
                  value={targetType}
                  onChange={(val) => setTargetType(val)}
                  options={TARGET_TYPE_OPTIONS}
                  showSearch={false}
                  isClearable={false}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sector / Industry</label>
                <SearchableSelect
                  value={industry}
                  onChange={(val) => setIndustry(val)}
                  options={INDUSTRY_OPTIONS.map(ind => ({ value: ind, label: getLocalizedIndustry(ind, t) }))}
                  placeholder={t("opp.selectIndustry", "Select industry...")}
                  searchPlaceholder={t("opp.searchIndustry", "Search industry...")}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Person */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users size={13} className="text-blue-500" />
              2. Key Contact Person
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contact Person Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Karim Hadj"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="karim@company.com"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Phone Number</label>
              <CountryPhoneInput
                value={contactPhone}
                onChange={(val) => setContactPhone(val)}
              />
            </div>
          </div>

          {/* Section 3: Commercial & Funnel Parameters */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-blue-500" />
              3. Commercial Deal & Funnel Stage
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Funnel Stage</label>
                <SearchableSelect
                  value={stage}
                  onChange={(val) => {
                    setStage(val);
                    const stg = FUNNEL_STAGES.find(s => s.id === val);
                    if (stg) setProbability(stg.defaultProbability);
                  }}
                  options={FUNNEL_STAGES.map(s => ({ value: s.id, label: t(s.labelKey, s.fallbackLabel) }))}
                  showSearch={false}
                  isClearable={false}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Priority Level</label>
                <SearchableSelect
                  value={priority}
                  onChange={(val) => setPriority(val)}
                  options={PRIORITY_OPTIONS}
                  showSearch={false}
                  isClearable={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Estimated Deal Value */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Estimated Deal Value</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="150000"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 shadow-2xs"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <SearchableSelect
                      value={currency}
                      onChange={(val) => setCurrency(val)}
                      options={["DZD", "USD", "EUR"]}
                      showSearch={false}
                      isClearable={false}
                      buttonClassName="py-2.5 px-3 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Win Probability Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Win Probability</label>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    {probability}%
                  </span>
                </div>
                <div className="h-[42px] px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center shadow-2xs">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={probability}
                    onChange={(e) => setProbability(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {targetType === "sponsor" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Interested Sponsorship Tier</label>
                <SearchableSelect
                  value={tierInterest}
                  onChange={(val) => setTierInterest(val)}
                  options={SPONSOR_TIER_OPTIONS}
                  showSearch={false}
                  isClearable={false}
                />
              </div>
            )}

            {targetType === "exhibitor" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Preferred Booth / Space</label>
                <input
                  type="text"
                  value={boothPreference}
                  onChange={(e) => setBoothPreference(e.target.value)}
                  placeholder="e.g. Corner Booth 6x3m, Booth A-15"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Commercial Notes & Terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Discussion summary, client requirements, discount agreements..."
                rows={3}
                className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 resize-none"
              />
            </div>
          </div>

          {/* Section 4: Interaction Timeline */}
          <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-blue-500" />
              4. Activity Log & Interaction Notes
            </h4>

            {/* Quick add note form */}
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <select
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="call">📞 Phone Call</option>
                  <option value="meeting">🤝 Meeting / Demo</option>
                  <option value="email">✉️ Email Exchange</option>
                  <option value="note">📝 General Note</option>
                </select>
                <span className="text-[10px] font-bold text-slate-400">Add interaction entry</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivityText}
                  onChange={(e) => setNewActivityText(e.target.value)}
                  placeholder="Record summary of discussion..."
                  className="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Activity History List */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {activityList.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No activity recorded yet.</p>
              ) : (
                activityList.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 bg-white border border-slate-150 rounded-xl text-xs flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{item.author || "Organizer"} • {item.type || "Note"}</span>
                      <span>{item.date ? new Date(item.date).toLocaleDateString() : ""}</span>
                    </div>
                    <p className="text-slate-700 font-semibold text-[11px]">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        {/* Drawer Footer */}
        <footer className="p-6 border-t border-slate-150 bg-white sticky bottom-0 flex items-center justify-between gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={() => onArchive(opp.id)}
              className="py-2.5 px-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Archive</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="prospect-form"
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer"
            >
              {isEditing ? "Save Changes" : "Create Prospect"}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
