/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, ShieldAlert, Sparkles, Building2, Calendar, Users, Ticket, 
  CreditCard, Search, Filter, Check, X, ChevronRight, ChevronLeft, ArrowUpRight, 
  ExternalLink, RefreshCw, Star, Download, Eye, AlertCircle, CheckCircle2, 
  Lock, Unlock, Edit3, Pin, ChevronDown, Sliders, BarChart3, TrendingUp,
  MapPin, Clock, Smartphone, Mail, Globe, ArrowRight, ArrowUp, ArrowDown, Plus, Trash2
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { COUNTRY_CITIES_MAP } from "../lib/formPresets";
import { INDUSTRIES, isPlatformSuperAdminEmail } from "../lib/constants";
import {
  fetchAllPlatformOrganizers,
  updateOrganizerQuotas,
  fetchAllPlatformEventsAdmin,
  updateEventHeroFeatured,
  updateEventStatusAdmin,
  fetchAllPlatformPayments
} from "../lib/db";

const ALGERIA_WILAYAS = COUNTRY_CITIES_MAP["Algeria"] || [];

const HERO_POSITION_OPTIONS = [
  { value: "1", label: "Position #1 (First slide)" },
  { value: "2", label: "Position #2" },
  { value: "3", label: "Position #3" },
  { value: "4", label: "Position #4" },
  { value: "5", label: "Position #5" },
];

const QUOTA_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended (Frozen)" },
  { value: "banned", label: "Banned" },
];

export default function PlatformAdminView({
  currentUser,
  onExitAdmin,
  onViewEventDetails,
  onViewPublicLandingPage,
  onImpersonateOrganizer,
  onEventsUpdated
}) {
  // Navigation tabs: 'overview', 'organizers', 'hero', 'events', 'financials'
  const [activeTab, setActiveTab] = useState("overview");

  // Global loading and feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Data states
  const [organizers, setOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({
    totalGmv: 0, paidCount: 0, edahabiaGmv: 0, edahabiaCount: 0, cibGmv: 0, cibCount: 0, failedCount: 0, pendingCount: 0, successRate: 0
  });

  // Search & Filter states
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [organizerWilayaFilter, setOrganizerWilayaFilter] = useState("All");
  const [organizerStatusFilter, setOrganizerStatusFilter] = useState("All");

  const [eventSearch, setEventSearch] = useState("");
  const [eventWilayaFilter, setEventWilayaFilter] = useState("All");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("All");
  const [eventStatusFilter, setEventStatusFilter] = useState("All");

  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");

  // Organizer Quota Edit Drawer state
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [quotaMaxEvents, setQuotaMaxEvents] = useState("");
  const [quotaMaxAttendees, setQuotaMaxAttendees] = useState("");
  const [quotaStatus, setQuotaStatus] = useState("active");
  const [quotaRole, setQuotaRole] = useState("organizer");
  const [isSavingQuota, setIsSavingQuota] = useState(false);

  // Organizer Events Drawer state
  const [selectedOrgEvents, setSelectedOrgEvents] = useState(null);

  // Hero Curation search & filter states
  const [heroSearch, setHeroSearch] = useState("");
  const [heroWilayaFilter, setHeroWilayaFilter] = useState("All");
  const [heroCategoryFilter, setHeroCategoryFilter] = useState("All");

  // Show Toast
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all admin data
  const loadAdminData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [orgsData, eventsData, paysData] = await Promise.all([
        fetchAllPlatformOrganizers(),
        fetchAllPlatformEventsAdmin(),
        fetchAllPlatformPayments()
      ]);

      setOrganizers(orgsData);
      setEvents(eventsData);
      setPayments(paysData.payments);
      setPaymentMetrics(paysData.metrics);
    } catch (err) {
      console.error("Error loading admin data:", err);
      showToast("Failed to load back-office records", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const isAuthorized = !!(
    currentUser &&
    currentUser.id && (
      currentUser.isVerifiedAdmin === true ||
      isPlatformSuperAdminEmail(currentUser.email) ||
      (currentUser.role === 'super_admin' && (currentUser.isAdmin === true || currentUser.is_admin === true))
    )
  );

  useEffect(() => {
    if (isAuthorized) {
      loadAdminData(true);
    }
  }, [isAuthorized]);

  const handleManualRefresh = () => {
    if (!isAuthorized) return;
    setIsRefreshing(true);
    loadAdminData(false);
  };

  // ─────────────────────────────────────────────
  //  ORGANIZER QUOTA HANDLERS
  // ─────────────────────────────────────────────
  const openEditQuotaModal = (org) => {
    setEditingOrganizer(org);
    setQuotaMaxEvents(org.maxEvents !== null && org.maxEvents !== undefined ? String(org.maxEvents) : "");
    setQuotaMaxAttendees(org.maxAttendees !== null && org.maxAttendees !== undefined ? String(org.maxAttendees) : "");
    setQuotaStatus(org.status || "active");
    setQuotaRole(org.role || "organizer");
  };

  const handleSaveQuotas = async () => {
    if (!editingOrganizer) return;
    setIsSavingQuota(true);

    if (quotaStatus !== 'active' && editingOrganizer.status === 'active') {
      if (!confirm(`Are you sure you want to set ${editingOrganizer.fullName}'s account to ${quotaStatus.toUpperCase()}?`)) {
        setIsSavingQuota(false);
        return;
      }
    }

    const parsedMaxEvents = quotaMaxEvents.trim() === "" ? null : parseInt(quotaMaxEvents, 10);
    const parsedMaxAttendees = quotaMaxAttendees.trim() === "" ? null : parseInt(quotaMaxAttendees, 10);

    const result = await updateOrganizerQuotas(editingOrganizer.id, {
      maxEvents: isNaN(parsedMaxEvents) ? null : parsedMaxEvents,
      maxAttendees: isNaN(parsedMaxAttendees) ? null : parsedMaxAttendees,
      status: quotaStatus,
    });

    setIsSavingQuota(false);

    if (result.success) {
      showToast(`Updated quotas for ${editingOrganizer.fullName}`);
      setOrganizers(prev => prev.map(o => o.id === editingOrganizer.id ? {
        ...o,
        maxEvents: isNaN(parsedMaxEvents) ? null : parsedMaxEvents,
        maxAttendees: isNaN(parsedMaxAttendees) ? null : parsedMaxAttendees,
        status: quotaStatus,
      } : o));
      setEditingOrganizer(null);
    } else {
      showToast(result.error || "Failed to update quotas", "error");
    }
  };

  // ─────────────────────────────────────────────
  //  HERO CURATION HANDLERS
  // ─────────────────────────────────────────────
  const handleAddToHero = async (event) => {
    const nextOrder = curatedHeroEvents.length + 1;

    // Optimistic UI update
    setEvents(prev => prev.map(e => e.id === event.id ? {
      ...e,
      isHeroFeatured: true,
      is_hero_featured: true,
      heroOrder: nextOrder,
      hero_order: nextOrder
    } : e));

    const res = await updateEventHeroFeatured(event.id, {
      isHeroFeatured: true,
      heroOrder: nextOrder
    });

    if (res.success) {
      showToast(`Added "${event.title}" to Homepage Hero (Slot #${nextOrder})`);
      onEventsUpdated?.();
    } else {
      setEvents(prev => prev.map(e => e.id === event.id ? {
        ...e,
        isHeroFeatured: false,
        is_hero_featured: false
      } : e));
      showToast(res.error || "Could not add to hero", "error");
    }
  };

  const handleRemoveFromHero = async (event) => {
    // Optimistic UI update
    setEvents(prev => prev.map(e => e.id === event.id ? {
      ...e,
      isHeroFeatured: false,
      is_hero_featured: false,
      heroOrder: 99,
      hero_order: 99
    } : e));

    const res = await updateEventHeroFeatured(event.id, {
      isHeroFeatured: false,
      heroOrder: 99
    });

    if (res.success) {
      showToast(`Removed "${event.title}" from Homepage Hero`);
      onEventsUpdated?.();
    } else {
      setEvents(prev => prev.map(e => e.id === event.id ? {
        ...e,
        isHeroFeatured: true,
        is_hero_featured: true
      } : e));
      showToast(res.error || "Could not remove from hero", "error");
    }
  };

  const handleMoveHeroEvent = async (event, direction) => {
    const currentIdx = curatedHeroEvents.findIndex(e => e.id === event.id);
    if (currentIdx === -1) return;
    const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= curatedHeroEvents.length) return;

    const otherEvent = curatedHeroEvents[targetIdx];
    const orderA = targetIdx + 1;
    const orderB = currentIdx + 1;

    // Optimistic UI update
    setEvents(prev => prev.map(e => {
      if (e.id === event.id) return { ...e, heroOrder: orderA, hero_order: orderA };
      if (e.id === otherEvent.id) return { ...e, heroOrder: orderB, hero_order: orderB };
      return e;
    }));

    await Promise.all([
      updateEventHeroFeatured(event.id, { isHeroFeatured: true, heroOrder: orderA }),
      updateEventHeroFeatured(otherEvent.id, { isHeroFeatured: true, heroOrder: orderB })
    ]);

    showToast(`Moved "${event.title}" to position #${orderA}`);
    onEventsUpdated?.();
  };

  const handleUpdateHeroOrder = async (event, newOrder) => {
    const parsedOrder = parseInt(newOrder, 10) || 1;

    setEvents(prev => prev.map(e => e.id === event.id ? {
      ...e,
      heroOrder: parsedOrder,
      hero_order: parsedOrder
    } : e));

    const res = await updateEventHeroFeatured(event.id, {
      isHeroFeatured: true,
      heroOrder: parsedOrder
    });

    if (res.success) {
      showToast(`Set "${event.title}" hero priority to #${parsedOrder}`);
      onEventsUpdated?.();
    }
  };

  // ─────────────────────────────────────────────
  //  EVENT MODERATION HANDLERS
  // ─────────────────────────────────────────────
  const handleUpdateEventStatus = async (event, nextStatus) => {
    if (!confirm(`Are you sure you want to mark "${event.title}" as ${nextStatus.toUpperCase()}?`)) return;

    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: nextStatus } : e));
    const ok = await updateEventStatusAdmin(event.id, nextStatus);
    if (ok) {
      showToast(`Event status changed to ${nextStatus}`);
    } else {
      showToast("Failed to update event status", "error");
      loadAdminData(false);
    }
  };


  // ─────────────────────────────────────────────
  //  CSV EXPORT HANDLER (FINANCIALS)
  // ─────────────────────────────────────────────
  const handleExportPaymentsCsv = () => {
    if (!payments.length) return;
    const headers = ["Checkout ID", "Customer Name", "Customer Email", "Customer Phone", "Amount (DZD)", "Method", "Status", "Paid At"];
    const rows = filteredPayments.map(p => [
      `"${p.chargily_checkout_id || p.id}"`,
      `"${p.customer_name || 'Attendee'}"`,
      `"${p.customer_email || ''}"`,
      `"${p.customer_phone || ''}"`,
      p.amount || 0,
      `"${p.payment_method || 'EDAHABIA'}"`,
      `"${p.status || 'pending'}"`,
      `"${p.paid_at || p.created_at || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventzone_chargily_payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded payments CSV");
  };

  // ─────────────────────────────────────────────
  //  MEMOIZED FILTERED LISTS
  // ─────────────────────────────────────────────
  // Curated Hero Events
  const curatedHeroEvents = useMemo(() => {
    return events
      .filter(e => e.status === "published" && (e.isHeroFeatured || e.is_hero_featured))
      .sort((a, b) => (a.heroOrder || a.hero_order || 99) - (b.heroOrder || b.hero_order || 99));
  }, [events]);

  // Available Published Events for Hero Curator (with search & filters)
  const heroAvailableEvents = useMemo(() => {
    return events
      .filter(ev => ev.status === "published")
      .filter(ev => {
        const matchesSearch = !heroSearch.trim() ||
          ev.title.toLowerCase().includes(heroSearch.toLowerCase()) ||
          (ev.organizerFullName && ev.organizerFullName.toLowerCase().includes(heroSearch.toLowerCase())) ||
          (ev.category && ev.category.toLowerCase().includes(heroSearch.toLowerCase()));

        const matchesWilaya = heroWilayaFilter === "All" || ev.city === heroWilayaFilter || ev.location?.includes(heroWilayaFilter);
        const matchesCategory = heroCategoryFilter === "All" || ev.category === heroCategoryFilter;

        return matchesSearch && matchesWilaya && matchesCategory;
      });
  }, [events, heroSearch, heroWilayaFilter, heroCategoryFilter]);

  // Filtered Organizers
  const filteredOrganizers = useMemo(() => {
    return organizers.filter(org => {
      const matchesSearch = !organizerSearch.trim() ||
        org.fullName.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        org.email.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        (org.companyName && org.companyName.toLowerCase().includes(organizerSearch.toLowerCase()));

      const matchesWilaya = organizerWilayaFilter === "All" || org.location === organizerWilayaFilter;
      const matchesStatus = organizerStatusFilter === "All" || org.status === organizerStatusFilter;

      return matchesSearch && matchesWilaya && matchesStatus;
    });
  }, [organizers, organizerSearch, organizerWilayaFilter, organizerStatusFilter]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = !eventSearch.trim() ||
        ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.organizerFullName.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.category.toLowerCase().includes(eventSearch.toLowerCase());

      const matchesWilaya = eventWilayaFilter === "All" || ev.city === eventWilayaFilter || ev.location.includes(eventWilayaFilter);
      const matchesCategory = eventCategoryFilter === "All" || ev.category === eventCategoryFilter;
      const matchesStatus = eventStatusFilter === "All" || ev.status === eventStatusFilter;

      return matchesSearch && matchesWilaya && matchesCategory && matchesStatus;
    });
  }, [events, eventSearch, eventWilayaFilter, eventCategoryFilter, eventStatusFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = !paymentSearch.trim() ||
        (p.chargily_checkout_id && p.chargily_checkout_id.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        (p.customer_name && p.customer_name.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        (p.customer_email && p.customer_email.toLowerCase().includes(paymentSearch.toLowerCase()));

      const matchesStatus = paymentStatusFilter === "All" || p.status === paymentStatusFilter;
      const matchesMethod = paymentMethodFilter === "All" || (p.payment_method && p.payment_method.toLowerCase().includes(paymentMethodFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, paymentSearch, paymentStatusFilter, paymentMethodFilter]);

  // Wilaya distribution metrics
  const wilayaDistribution = useMemo(() => {
    const counts = {};
    events.forEach(e => {
      const w = e.city || e.location || "Algiers";
      counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [events]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-rose-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-3">
          <span>403 Forbidden</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Access Denied</h2>
        <p className="text-slate-600 max-w-md text-sm mb-6 leading-relaxed">
          You do not have administrative privileges to access the Platform Super Admin Console.
          Super admin roles are strictly restricted and can only be provisioned directly in the database by platform owners.
          {currentUser?.email ? (
            <span className="block mt-3 font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              Signed in as: <strong className="text-slate-900">{currentUser.email}</strong> (Role: {currentUser.role || 'organizer'})
            </span>
          ) : (
            <span className="block mt-2 text-xs text-slate-500">
              You are currently browsing without an active authenticated session.
            </span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onExitAdmin}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === "error" 
            ? "bg-rose-50 text-rose-800 border-rose-200" 
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}>
          {toastMessage.type === "error" ? <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          EXECUTIVE BACK OFFICE HEADER (LIGHT MODE)
      ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Back Office</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync Live Data"}</span>
          </button>

          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Exit to Platform</span>
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          PRIMARY NAVIGATION TABS (LIGHT MODE)
      ───────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Executive Overview" },
          { id: "organizers", label: "Organizers & Quotas", count: organizers.length },
          { id: "hero", label: "Homepage Hero Curator", count: curatedHeroEvents.length },
          { id: "events", label: "Master Events Directory", count: events.length },
          { id: "financials", label: "Chargily Financials", count: payments.length }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none whitespace-nowrap ${
                isActive
                  ? "text-blue-600 font-black bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  <bdi dir="ltr">{tab.count}</bdi>
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────────
          MAIN CONTENT CONTAINER (LIGHT MODE)
      ───────────────────────────────────────────── */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Aggregating Platform Data...</h3>
              <p className="text-xs text-slate-500 mt-1">Fetching organizers, Chargily DZD ledger, and global events</p>
            </div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════
                TAB 1: EXECUTIVE OVERVIEW
            ═══════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Total Settled GMV</span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {(paymentMetrics.totalGmv || 0).toLocaleString()} <span className="text-xs font-bold text-emerald-600">DZD</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <span className="text-emerald-700 font-bold">{paymentMetrics.paidCount}</span> successful transactions
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Registered Organizers</span>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {organizers.length}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        <span className="text-blue-700 font-bold">{organizers.filter(o => o.status === "active").length}</span> active accounts
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Active Events</span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {events.filter(e => e.status === "published").length}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {events.length} total events in directory
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Hero Curated Events</span>
                      <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600 border border-yellow-100">
                        <Star className="w-4 h-4 fill-yellow-500" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {curatedHeroEvents.length} <span className="text-xs font-medium text-slate-400">/ 4</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {curatedHeroEvents.length >= 1 ? "Custom priority active" : "Default order active"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Split Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Financial Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Chargily Gateway Breakdown
                      </h3>
                      <span className="text-xs text-slate-500 font-mono font-bold">Algeria DZD</span>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            EDAHABIA Volume
                          </span>
                          <span className="font-mono text-slate-900 font-bold">
                            {(paymentMetrics.edahabiaGmv || 0).toLocaleString()} DZD ({paymentMetrics.edahabiaCount || 0})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${paymentMetrics.totalGmv > 0 ? (paymentMetrics.edahabiaGmv / paymentMetrics.totalGmv) * 100 : 50}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            CIB Card Volume
                          </span>
                          <span className="font-mono text-slate-900 font-bold">
                            {(paymentMetrics.cibGmv || 0).toLocaleString()} DZD ({paymentMetrics.cibCount || 0})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${paymentMetrics.totalGmv > 0 ? (paymentMetrics.cibGmv / paymentMetrics.totalGmv) * 100 : 50}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium">Checkout Conversion Rate:</span>
                        <span className="font-mono text-emerald-600 font-bold">{paymentMetrics.successRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Regional Distribution */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Top Algerian Wilayas
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">Events Hosted</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {wilayaDistribution.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No location records yet</p>
                      ) : (
                        wilayaDistribution.map(([wilaya, count], idx) => (
                          <div key={wilaya} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-slate-400 font-mono font-bold">#{idx + 1}</span>
                              <span className="text-slate-700 font-medium truncate max-w-[180px]">{wilaya}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                              {count} {count === 1 ? "event" : "events"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                TAB 2: ORGANIZERS & QUOTA MANAGEMENT
            ═══════════════════════════════════════════ */}
            {activeTab === "organizers" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Search & Filters */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={organizerSearch}
                      onChange={(e) => setOrganizerSearch(e.target.value)}
                      placeholder="Search organizer by name, company, email..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-48">
                      <SearchableSelect
                        value={organizerWilayaFilter}
                        onChange={setOrganizerWilayaFilter}
                        options={[{ value: "All", label: "All Wilayas" }, ...ALGERIA_WILAYAS.map(w => ({ value: w, label: w }))]}
                        placeholder="Filter Wilaya"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>

                    <div className="w-36">
                      <SearchableSelect
                        value={organizerStatusFilter}
                        onChange={setOrganizerStatusFilter}
                        options={[
                          { value: "All", label: "All Status" },
                          { value: "active", label: "Active" },
                          { value: "suspended", label: "Suspended" },
                          { value: "banned", label: "Banned" }
                        ]}
                        placeholder="Status"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>
                  </div>
                </div>

                {/* Organizers Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Organizer / Company</th>
                          <th className="py-3.5 px-4">Contact</th>
                          <th className="py-3.5 px-4">Wilaya</th>
                          <th className="py-3.5 px-4">Events Created / Quota</th>
                          <th className="py-3.5 px-4">Max Capacity Cap</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrganizers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                              No organizers match current search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredOrganizers.map(org => {
                            const isAtOrOverLimit = org.maxEvents !== null && org.eventsCount >= org.maxEvents;
                            return (
                              <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900">{org.fullName}</div>
                                  <div className="text-[11px] text-slate-500">{org.companyName || org.jobTitle || "Independent Organizer"}</div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-700">
                                  <div className="font-medium">{org.email}</div>
                                  {org.phone && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{org.phone}</div>}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-medium">
                                  {org.location || "Algeria"}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-mono font-bold ${isAtOrOverLimit ? "text-amber-600" : "text-emerald-600"}`}>
                                      {org.eventsCount}
                                    </span>
                                    <span className="text-slate-400 font-mono">/</span>
                                    <span className="font-mono text-slate-600 font-semibold">
                                      {org.maxEvents !== null && org.maxEvents !== undefined ? org.maxEvents : "Unlimited"}
                                    </span>
                                    {isAtOrOverLimit && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        LIMIT REACHED
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-700">
                                  {org.maxAttendees !== null && org.maxAttendees !== undefined ? (
                                    <span className="font-semibold">{org.maxAttendees.toLocaleString()} attendees</span>
                                  ) : (
                                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">Unlimited</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                    org.status === "active" 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : org.status === "suspended" 
                                      ? "bg-amber-50 text-amber-700 border-amber-200" 
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}>
                                    {org.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openEditQuotaModal(org)}
                                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                      title="Edit Event Quotas & Limits (Right Drawer)"
                                    >
                                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Edit Quotas</span>
                                    </button>

                                    <button
                                      onClick={() => setSelectedOrgEvents(events.filter(e => e.organizerId === org.id))}
                                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                                      title="View all events by this organizer"
                                    >
                                      Events ({org.eventsCount})
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
              </div>
            )}

            {/* ═══════════════════════════════════════════
                TAB 3: HOMEPAGE HERO SECTION CURATOR
            ═══════════════════════════════════════════ */}
            {activeTab === "hero" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. CURRENTLY ACTIVE HERO EVENTS */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Homepage Hero Carousel</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {curatedHeroEvents.length} Active {curatedHeroEvents.length === 1 ? "Slide" : "Slides"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        These events are actively rotating in the homepage hero in this exact slide order.
                      </p>
                    </div>
                  </div>

                  {curatedHeroEvents.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Star className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">No Events Pinned to Hero</h4>
                        <p className="text-xs text-slate-500 max-w-md mt-1">
                          The homepage is currently displaying the latest published events by default. Pick events from the directory below and click <strong className="text-blue-600">+ Add to Hero</strong> to customize your carousel.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {curatedHeroEvents.map((ev, index) => (
                        <div key={ev.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-4 min-w-[280px]">
                            {/* Slide position badge */}
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shrink-0 font-mono">
                              <span className="text-xs font-black">#{index + 1}</span>
                              <span className="text-[9px] uppercase font-bold text-blue-500">Slide</span>
                            </div>

                            {/* Banner Thumbnail */}
                            <img
                              src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80"}
                              alt={ev.title}
                              className="w-20 h-13 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />

                            {/* Details */}
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{ev.title}</span>
                                {index === 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                    Primary Slide
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <span>By <strong className="text-slate-700">{ev.organizerFullName || "Organizer"}</strong></span>
                                <span>•</span>
                                <span>{ev.city || ev.location || "Algeria"}</span>
                                <span>•</span>
                                <span className="text-blue-700 font-medium">{ev.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reorder & Actions */}
                          <div className="flex items-center gap-2">
                            {/* Up / Down Buttons */}
                            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                              <button
                                onClick={() => handleMoveHeroEvent(ev, "up")}
                                disabled={index === 0}
                                title="Move up in slide order"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMoveHeroEvent(ev, "down")}
                                disabled={index === curatedHeroEvents.length - 1}
                                title="Move down in slide order"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Direct Position Selector */}
                            <div className="w-36">
                              <SearchableSelect
                                value={String(index + 1)}
                                onChange={(val) => handleUpdateHeroOrder(ev, val)}
                                options={HERO_POSITION_OPTIONS}
                                isClearable={false}
                                buttonClassName="bg-white! border-slate-200! text-slate-700! font-mono! font-bold! py-1.5! px-2.5! text-xs! rounded-xl!"
                              />
                            </div>

                            {/* View Public Page */}
                            {onViewPublicLandingPage && (
                              <button
                                onClick={() => onViewPublicLandingPage(ev.id)}
                                title="View public event page"
                                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Remove from Hero Button */}
                            <button
                              onClick={() => handleRemoveFromHero(ev)}
                              title="Remove from hero carousel"
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. CHOOSE EVENTS TO ADD TO HERO */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">Choose Events to Show on Hero</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select any published event to feature it in the hero carousel.
                      </p>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="relative min-w-[220px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={heroSearch}
                          onChange={(e) => setHeroSearch(e.target.value)}
                          placeholder="Filter events or organizers..."
                          className="w-full bg-white border border-slate-200 focus:bg-white rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium shadow-2xs"
                        />
                      </div>

                      <div className="w-40">
                        <SearchableSelect
                          value={heroWilayaFilter}
                          onChange={(val) => setHeroWilayaFilter(val || "All")}
                          options={[{ value: "All", label: "All Wilayas" }, ...ALGERIA_WILAYAS.map(w => ({ value: w, label: w }))]}
                          placeholder="Wilaya..."
                          isClearable={false}
                          buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl! py-1.5!"
                        />
                      </div>

                      <div className="w-44">
                        <SearchableSelect
                          value={heroCategoryFilter}
                          onChange={(val) => setHeroCategoryFilter(val || "All")}
                          options={[{ value: "All", label: "All Categories" }, ...INDUSTRIES.map(c => ({ value: c, label: c }))]}
                          placeholder="Category..."
                          isClearable={false}
                          buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl! py-1.5!"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Event</th>
                          <th className="py-3 px-4">Organizer</th>
                          <th className="py-3 px-4">Wilaya</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Hero Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {heroAvailableEvents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              No published events match the current filter.
                            </td>
                          </tr>
                        ) : (
                          heroAvailableEvents.map(ev => {
                            const isCurated = ev.isHeroFeatured || ev.is_hero_featured;
                            const heroPos = ev.heroOrder || ev.hero_order || 1;

                            return (
                              <tr key={ev.id} className={`hover:bg-slate-50/80 transition-colors ${isCurated ? "bg-blue-50/30" : ""}`}>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80"}
                                      alt={ev.title}
                                      className="w-12 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                        <span>{ev.title}</span>
                                        {isCurated && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">
                                            Position #{heroPos}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-700 font-medium">
                                  {ev.organizerFullName || "Organizer"}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {ev.city || ev.location || "Algeria"}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                    {ev.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                  {ev.startDate || "Date TBA"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {isCurated ? (
                                    <button
                                      onClick={() => handleRemoveFromHero(ev)}
                                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToHero(ev)}
                                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add to Hero</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                TAB 4: MASTER EVENTS DIRECTORY & MODERATION
            ═══════════════════════════════════════════ */}
            {activeTab === "events" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Search and Filters */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search cross-tenant events by title, organizer, category..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-44">
                      <SearchableSelect
                        value={eventCategoryFilter}
                        onChange={setEventCategoryFilter}
                        options={[{ value: "All", label: "All Categories" }, ...INDUSTRIES.map(ind => ({ value: ind, label: ind }))]}
                        placeholder="Category"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>

                    <div className="w-44">
                      <SearchableSelect
                        value={eventWilayaFilter}
                        onChange={setEventWilayaFilter}
                        options={[{ value: "All", label: "All Wilayas" }, ...ALGERIA_WILAYAS.map(w => ({ value: w, label: w }))]}
                        placeholder="Wilaya"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>

                    <div className="w-36">
                      <SearchableSelect
                        value={eventStatusFilter}
                        onChange={setEventStatusFilter}
                        options={[
                          { value: "All", label: "All Status" },
                          { value: "published", label: "Published" },
                          { value: "draft", label: "Draft" },
                          { value: "suspended", label: "Suspended" },
                          { value: "archived", label: "Archived" }
                        ]}
                        placeholder="Status"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>
                  </div>
                </div>

                {/* Master Events Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Event Details</th>
                          <th className="py-3.5 px-4">Organizer</th>
                          <th className="py-3.5 px-4">Location / Wilaya</th>
                          <th className="py-3.5 px-4">Dates</th>
                          <th className="py-3.5 px-4">Attendees / Cap</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEvents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                              No events found matching current criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map(ev => (
                            <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=80"}
                                    alt={ev.title}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      {ev.title}
                                      {ev.isHeroFeatured && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                          HERO #{ev.heroOrder || 1}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{ev.category}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700">
                                <div className="font-semibold text-slate-900">{ev.organizerFullName}</div>
                                <div className="text-[10px] text-slate-400">{ev.organizerEmail}</div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-medium">
                                {ev.city || ev.location || "Algeria"}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-medium">
                                {ev.startDate || "TBA"}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-700">
                                <span className="font-bold text-emerald-600">{ev.registeredCount || 0}</span>
                                <span className="text-slate-400"> / {ev.capacity || 500}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                  ev.status === "published"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : ev.status === "suspended"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {ev.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {onViewPublicLandingPage && (
                                    <button
                                      onClick={() => onViewPublicLandingPage(ev.id)}
                                      className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                                      title="Preview Public Landing Page"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleToggleHeroFeatured(ev)}
                                    className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer shadow-2xs ${
                                      ev.isHeroFeatured
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                                    }`}
                                    title={ev.isHeroFeatured ? "Unpin from Hero" : "Pin to Hero"}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${ev.isHeroFeatured ? "fill-amber-500" : ""}`} />
                                  </button>

                                  {ev.status === "published" ? (
                                    <button
                                      onClick={() => handleUpdateEventStatus(ev, "suspended")}
                                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                                      title="Suspend / Takedown event"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateEventStatus(ev, "published")}
                                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                                      title="Publish event"
                                    >
                                      Publish
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                TAB 5: CHARGILY FINANCIALS & PAYMENTS
            ═══════════════════════════════════════════ */}
            {activeTab === "financials" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Metrics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                    <span className="text-xs text-slate-500 font-semibold">Total Settled GMV</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-1">
                      {(paymentMetrics.totalGmv || 0).toLocaleString()} <span className="text-xs text-emerald-600 font-bold">DZD</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                    <span className="text-xs text-slate-500 font-semibold">EDAHABIA Settled</span>
                    <div className="text-xl font-black text-amber-700 font-mono mt-1">
                      {(paymentMetrics.edahabiaGmv || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">DZD</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                    <span className="text-xs text-slate-500 font-semibold">CIB Card Settled</span>
                    <div className="text-xl font-black text-blue-700 font-mono mt-1">
                      {(paymentMetrics.cibGmv || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">DZD</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">Paid Checkouts</span>
                      <div className="text-xl font-black text-emerald-600 font-mono mt-1">
                        {paymentMetrics.paidCount} / {payments.length}
                      </div>
                    </div>
                    <button
                      onClick={handleExportPaymentsCsv}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      title="Download CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="Search checkout ID, customer name, email..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-36">
                      <SearchableSelect
                        value={paymentStatusFilter}
                        onChange={setPaymentStatusFilter}
                        options={[
                          { value: "All", label: "All Status" },
                          { value: "paid", label: "Paid" },
                          { value: "pending", label: "Pending" },
                          { value: "failed", label: "Failed" }
                        ]}
                        placeholder="Status"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>

                    <div className="w-40">
                      <SearchableSelect
                        value={paymentMethodFilter}
                        onChange={setPaymentMethodFilter}
                        options={[
                          { value: "All", label: "All Methods" },
                          { value: "edahabia", label: "EDAHABIA" },
                          { value: "cib", label: "CIB" }
                        ]}
                        placeholder="Payment Method"
                        buttonClassName="bg-white! border-slate-200! text-slate-800! text-xs! rounded-xl!"
                      />
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Chargily Checkout ID</th>
                          <th className="py-3.5 px-4">Customer</th>
                          <th className="py-3.5 px-4">Amount (DZD)</th>
                          <th className="py-3.5 px-4">Method</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Paid At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                              No Chargily payment records found.
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                              <td className="py-3.5 px-4 font-semibold text-slate-800 truncate max-w-[200px]">
                                {pay.chargily_checkout_id || pay.id}
                              </td>
                              <td className="py-3.5 px-4 font-sans">
                                <div className="font-bold text-slate-900">{pay.customer_name || "Attendee"}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{pay.customer_email}</div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-emerald-600">
                                {Number(pay.amount || 0).toLocaleString()} DZD
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border ${
                                  (pay.payment_method || '').toLowerCase().includes("edahabia")
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                }`}>
                                  {pay.payment_method || "EDAHABIA"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                  pay.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : pay.status === "pending"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}>
                                  {pay.status || "pending"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                                {pay.paid_at ? new Date(pay.paid_at).toLocaleString() : (pay.created_at ? new Date(pay.created_at).toLocaleString() : "—")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─────────────────────────────────────────────
          DRAWER: EDIT ORGANIZER QUOTAS & LIMITS (FROM THE RIGHT)
      ───────────────────────────────────────────── */}
      {editingOrganizer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setEditingOrganizer(null)}
          />

          {/* Slide-over panel container on the right */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Edit Organizer Quotas &amp; Limits</h3>
                    <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                      {editingOrganizer.fullName} ({editingOrganizer.companyName || "Organizer"})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingOrganizer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Allowed Number of Events */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Allowed Number of Events
                  </label>
                  <p className="text-slate-500 mb-2.5 text-[11px]">
                    Maximum number of events this organizer can create before hitting the platform paywall.
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {["1", "3", "5", "10", "25", "Unlimited"].map(preset => {
                      const isSelected = (preset === "Unlimited" && quotaMaxEvents === "") || (quotaMaxEvents === preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuotaMaxEvents(preset === "Unlimited" ? "" : preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={quotaMaxEvents}
                    onChange={(e) => setQuotaMaxEvents(e.target.value)}
                    placeholder="Leave empty for Unlimited"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
                  />
                </div>

                {/* Maximum Attendee Capacity per Event */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Maximum Attendee Capacity per Event
                  </label>
                  <p className="text-slate-500 mb-2.5 text-[11px]">
                    The highest attendee threshold this organizer can configure on any single event.
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {["50", "150", "500", "1000", "2500", "Unlimited"].map(preset => {
                      const isSelected = (preset === "Unlimited" && quotaMaxAttendees === "") || (quotaMaxAttendees === preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuotaMaxAttendees(preset === "Unlimited" ? "" : preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={quotaMaxAttendees}
                    onChange={(e) => setQuotaMaxAttendees(e.target.value)}
                    placeholder="Leave empty for Unlimited"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
                  />
                </div>

                {/* Account Status & Role */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1.5">Account Status</label>
                    <SearchableSelect
                      value={quotaStatus}
                      onChange={(val) => setQuotaStatus(val)}
                      options={QUOTA_STATUS_OPTIONS}
                      isClearable={false}
                      buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! font-semibold! rounded-xl! py-2! px-3!"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1.5">Platform Role</label>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between min-h-[38px]">
                      <div className="flex items-center gap-1.5">
                        {editingOrganizer?.role === "super_admin" ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-emerald-950">Super Admin</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Standard Organizer</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                        Database Managed
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Super admin privileges are managed directly in the database.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingOrganizer(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuotas}
                  disabled={isSavingQuota}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
                >
                  {isSavingQuota ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Quotas &amp; Limits</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DRAWER: ORGANIZER EVENTS PREVIEW (FROM THE RIGHT)
      ───────────────────────────────────────────── */}
      {selectedOrgEvents && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setSelectedOrgEvents(null)}
          />

          {/* Slide-over panel on the right */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Organizer Hosted Events ({selectedOrgEvents.length})
                </h3>
                <button
                  onClick={() => setSelectedOrgEvents(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {selectedOrgEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center">This organizer has not created any events yet.</p>
                ) : (
                  selectedOrgEvents.map(ev => (
                    <div key={ev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900">{ev.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{ev.category} • {ev.city || ev.location}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        ev.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
