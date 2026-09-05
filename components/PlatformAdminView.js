/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, ShieldAlert, Sparkles, Building2, Calendar, Users, Ticket, 
  CreditCard, Search, Filter, Check, X, ChevronRight, ChevronLeft, ArrowUpRight, 
  ExternalLink, RefreshCw, Star, Download, Eye, AlertCircle, CheckCircle2, 
  Lock, Unlock, Edit3, Pin, ChevronDown, Sliders, BarChart3, TrendingUp,
  MapPin, Clock, Smartphone, Mail, Globe, ArrowRight, UserCheck
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { COUNTRY_CITIES_MAP } from "../lib/formPresets";
import { INDUSTRIES } from "../lib/constants";
import {
  fetchAllPlatformOrganizers,
  updateOrganizerQuotas,
  fetchAllPlatformEventsAdmin,
  updateEventHeroFeatured,
  updateEventStatusAdmin,
  fetchAllPlatformPayments,
  searchPlatformAttendees,
  fetchRecentPlatformCheckIns
} from "../lib/db";
import { supabase, safeLocalStorageSet, sanitizeUserForStorage } from "../lib/supabase";

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

const QUOTA_ROLE_OPTIONS = [
  { value: "organizer", label: "Standard Organizer" },
  { value: "super_admin", label: "Super Admin" },
];

export default function PlatformAdminView({
  currentUser,
  onExitAdmin,
  onViewEventDetails,
  onViewPublicLandingPage,
  onImpersonateOrganizer
}) {
  // Navigation tabs: 'overview', 'organizers', 'hero', 'events', 'financials', 'attendees'
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
  const [recentCheckIns, setRecentCheckIns] = useState([]);

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

  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState("");
  const [searchedAttendees, setSearchedAttendees] = useState([]);
  const [isSearchingAttendees, setIsSearchingAttendees] = useState(false);

  // Organizer Quota Edit Drawer state
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [quotaMaxEvents, setQuotaMaxEvents] = useState("");
  const [quotaMaxAttendees, setQuotaMaxAttendees] = useState("");
  const [quotaStatus, setQuotaStatus] = useState("active");
  const [quotaRole, setQuotaRole] = useState("organizer");
  const [isSavingQuota, setIsSavingQuota] = useState(false);

  // Organizer Events Drawer state
  const [selectedOrgEvents, setSelectedOrgEvents] = useState(null);

  // Hero Preview Slider state
  const [heroPreviewIndex, setHeroPreviewIndex] = useState(0);

  // Show Toast
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all admin data
  const loadAdminData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [orgsData, eventsData, paysData, checkInsData] = await Promise.all([
        fetchAllPlatformOrganizers(),
        fetchAllPlatformEventsAdmin(),
        fetchAllPlatformPayments(),
        fetchRecentPlatformCheckIns(30)
      ]);

      setOrganizers(orgsData);
      setEvents(eventsData);
      setPayments(paysData.payments);
      setPaymentMetrics(paysData.metrics);
      setRecentCheckIns(checkInsData);
    } catch (err) {
      console.error("Error loading admin data:", err);
      showToast("Failed to load back-office records", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData(true);
  }, []);

  const handleManualRefresh = () => {
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
      role: quotaRole
    });

    setIsSavingQuota(false);

    if (result.success) {
      showToast(`Updated quotas for ${editingOrganizer.fullName}`);
      setOrganizers(prev => prev.map(o => o.id === editingOrganizer.id ? {
        ...o,
        maxEvents: isNaN(parsedMaxEvents) ? null : parsedMaxEvents,
        maxAttendees: isNaN(parsedMaxAttendees) ? null : parsedMaxAttendees,
        status: quotaStatus,
        role: quotaRole
      } : o));
      setEditingOrganizer(null);
    } else {
      showToast(result.error || "Failed to update quotas", "error");
    }
  };

  // ─────────────────────────────────────────────
  //  HERO CURATION HANDLERS
  // ─────────────────────────────────────────────
  const handleToggleHeroFeatured = async (event) => {
    const newFeaturedState = !event.isHeroFeatured;
    const currentOrder = event.heroOrder || 1;

    // Optimistic UI update
    setEvents(prev => prev.map(e => e.id === event.id ? {
      ...e,
      isHeroFeatured: newFeaturedState,
      is_hero_featured: newFeaturedState
    } : e));

    const res = await updateEventHeroFeatured(event.id, {
      isHeroFeatured: newFeaturedState,
      heroOrder: currentOrder
    });

    if (res.success) {
      showToast(newFeaturedState ? `Pinned "${event.title}" to Homepage Hero!` : `Unpinned "${event.title}" from Hero`);
    } else {
      // Revert optimistic update
      setEvents(prev => prev.map(e => e.id === event.id ? {
        ...e,
        isHeroFeatured: !newFeaturedState,
        is_hero_featured: !newFeaturedState
      } : e));
      showToast(res.error || "Could not update hero status", "error");
    }
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
  //  ATTENDEE SEARCH HANDLER
  // ─────────────────────────────────────────────
  const handlePerformAttendeeSearch = async (e) => {
    e?.preventDefault();
    if (!attendeeSearchQuery.trim()) return;
    setIsSearchingAttendees(true);
    const results = await searchPlatformAttendees(attendeeSearchQuery);
    setSearchedAttendees(results);
    setIsSearchingAttendees(false);
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
      .sort((a, b) => (a.heroOrder || 99) - (b.heroOrder || 99));
  }, [events]);

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

  const isAuthorized = currentUser?.role === 'super_admin' || currentUser?.isAdmin || currentUser?.email?.toLowerCase() === 'eventzone114@gmail.com';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Platform Super Admin Console</h2>
        <p className="text-slate-600 max-w-md text-sm mb-6 leading-relaxed">
          This console is reserved for platform owners to govern cross-platform events, organizer quotas, homepage hero curation, and Chargily payments.
          {currentUser?.email ? (
            <span className="block mt-3 font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              Signed in as: <strong className="text-emerald-600">{currentUser.email}</strong> (Role: {currentUser.role || 'organizer'})
            </span>
          ) : (
            <span className="block mt-2 text-xs text-slate-500">
              You are currently browsing without an active session.
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onExitAdmin}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all cursor-pointer border border-slate-300 shadow-xs"
          >
            Return to Homepage
          </button>
          {currentUser && (
            <button
              onClick={async () => {
                try {
                  await supabase.from('profiles').update({ role: 'super_admin', is_admin: true }).eq('id', currentUser.id);
                  currentUser.role = 'super_admin';
                  currentUser.isAdmin = true;
                  safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(currentUser));
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  window.location.reload();
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Claim Super Admin Role & Enter
            </button>
          )}
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
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">EventZone Back Office</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500">Platform Command Console &amp; Cross-Tenant Operations</p>
          </div>
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
      <nav className="bg-white border-b border-slate-200 px-6 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Executive Overview", icon: BarChart3 },
          { id: "organizers", label: "Organizers & Quotas", icon: Building2, count: organizers.length },
          { id: "hero", label: "Homepage Hero Curator", icon: Star, count: curatedHeroEvents.length },
          { id: "events", label: "Master Events Directory", icon: Calendar, count: events.length },
          { id: "financials", label: "Chargily Financials", icon: CreditCard, count: payments.length },
          { id: "attendees", label: "Attendees & Check-in Pulse", icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs font-bold"
                  : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Live Check-Ins</span>
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                        <UserCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {recentCheckIns.length}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Recent verified gate passes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Split Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                  {/* Live Check-in Pulse */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        Live Gate Check-in Pulse
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">Real-time</span>
                    </div>

                    <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                      {recentCheckIns.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">No recent gate check-ins logged</p>
                      ) : (
                        recentCheckIns.slice(0, 6).map((ci, i) => (
                          <div key={ci.id || i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                            <div className="truncate mr-2">
                              <div className="font-semibold text-slate-900 truncate">{ci.first_name} {ci.last_name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{ci.events?.name || "Official Event"}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {ci.badge_code || "PASS"}
                              </span>
                            </div>
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
                {/* Curator Banner */}
                <div className="bg-linear-to-r from-emerald-50/80 via-teal-50/50 to-white border border-emerald-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1 max-w-2xl">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Homepage Hero Section Curator
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Choose which published events appear in the prominent top carousel of the EventZone homepage (<span className="text-emerald-700 font-mono font-bold">MainHomePage.js</span>). Pinned events override default chronological ordering.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-mono font-semibold text-slate-700 shadow-2xs">
                      Currently Pinned: <span className="font-bold text-emerald-600">{curatedHeroEvents.length}</span> events
                    </span>
                  </div>
                </div>

                {/* Hero Carousel Live Simulation */}
                {curatedHeroEvents.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Homepage Hero Simulation</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          onClick={() => setHeroPreviewIndex(prev => (prev - 1 + curatedHeroEvents.length) % curatedHeroEvents.length)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono font-semibold text-slate-600 px-2">
                          Slide {heroPreviewIndex + 1} of {curatedHeroEvents.length}
                        </span>
                        <button
                          onClick={() => setHeroPreviewIndex(prev => (prev + 1) % curatedHeroEvents.length)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Simulation Card */}
                    {(() => {
                      const curEv = curatedHeroEvents[heroPreviewIndex] || curatedHeroEvents[0];
                      if (!curEv) return null;
                      return (
                        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] max-h-[360px] border border-slate-200 shadow-sm group">
                          <img
                            src={curEv.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"}
                            alt={curEv.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 flex flex-col justify-end text-white">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                                <Star className="w-3 h-3 fill-slate-950" />
                                HERO POSITION #{curEv.heroOrder || (heroPreviewIndex + 1)}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                                {curEv.category}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-slate-200 border border-white/10">
                                {curEv.city || curEv.location || "Algeria"}
                              </span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white drop-shadow-sm">{curEv.title}</h2>
                            <p className="text-xs text-slate-200 line-clamp-2 mt-1 max-w-2xl">{curEv.tagline || curEv.description}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Published Events Selection Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Available Published Events for Hero</h4>
                    <span className="text-xs text-slate-500 font-medium">Toggle PIN and assign slide priority</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Event Title</th>
                          <th className="py-3.5 px-4">Organizer</th>
                          <th className="py-3.5 px-4">Wilaya</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4 text-center">Hero Priority</th>
                          <th className="py-3.5 px-4 text-right">Hero Pin Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {events.filter(e => e.status === "published").map(ev => (
                          <tr key={ev.id} className={`hover:bg-slate-50/80 transition-colors ${ev.isHeroFeatured ? "bg-emerald-50/40" : ""}`}>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80"}
                                  alt={ev.title}
                                  className="w-12 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    {ev.title}
                                    {ev.isHeroFeatured && (
                                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{ev.startDate || "Date TBA"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              {ev.organizerFullName || "Organizer"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {ev.city || ev.location || "Algeria"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {ev.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {ev.isHeroFeatured ? (
                                <div className="w-36 mx-auto">
                                  <SearchableSelect
                                    value={String(ev.heroOrder || 1)}
                                    onChange={(val) => handleUpdateHeroOrder(ev, val)}
                                    options={HERO_POSITION_OPTIONS}
                                    isClearable={false}
                                    buttonClassName="bg-white! border-emerald-300! text-emerald-700! font-mono! font-bold! py-1! px-2! text-xs! rounded-xl!"
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleToggleHeroFeatured(ev)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs ${
                                  ev.isHeroFeatured
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/25"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                <Pin className={`w-3.5 h-3.5 ${ev.isHeroFeatured ? "fill-white" : "text-slate-400"}`} />
                                <span>{ev.isHeroFeatured ? "Pinned to Hero" : "Pin Event"}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
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

            {/* ═══════════════════════════════════════════
                TAB 6: GLOBAL ATTENDEE LOOKUP & PULSE
            ═══════════════════════════════════════════ */}
            {activeTab === "attendees" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Cross-Event Search Box */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Cross-Platform Attendee Lookup
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Search registered attendees across all platform events by First Name, Last Name, Email, Phone, or Badge Code.
                  </p>

                  <form onSubmit={handlePerformAttendeeSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={attendeeSearchQuery}
                        onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                        placeholder="Search by name, attendee@example.com, +213..., EZ-XXXXXX"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingAttendees || !attendeeSearchQuery.trim()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSearchingAttendees ? "Searching..." : "Lookup Attendee"}
                    </button>
                  </form>
                </div>

                {/* Search Results */}
                {searchedAttendees.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                      Found {searchedAttendees.length} Matched Attendees
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="py-3.5 px-4">Attendee</th>
                            <th className="py-3.5 px-4">Event</th>
                            <th className="py-3.5 px-4">Ticket Tier</th>
                            <th className="py-3.5 px-4">Badge Code</th>
                            <th className="py-3.5 px-4">Gate Check-in</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchedAttendees.map(att => (
                            <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{att.first_name} {att.last_name}</div>
                                <div className="text-[11px] text-slate-500">{att.email} {att.phone ? `• ${att.phone}` : ''}</div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 font-medium">
                                {att.events?.name || "Eventzone Event"}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {att.ticket_type || "Standard"}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                                {att.badge_code || "—"}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  att.checked_in
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}>
                                  {att.checked_in ? "Checked In" : "Pending Arrival"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Live Recent Check-Ins Log */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      Platform-Wide Live Gate Check-ins Stream
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">Last 30 check-ins</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Attendee</th>
                          <th className="py-3.5 px-4">Event Name</th>
                          <th className="py-3.5 px-4">Badge Code</th>
                          <th className="py-3.5 px-4">Ticket Type</th>
                          <th className="py-3.5 px-4 text-right">Checked In Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentCheckIns.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                              No gate check-in activity recorded yet.
                            </td>
                          </tr>
                        ) : (
                          recentCheckIns.map(ci => (
                            <tr key={ci.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{ci.first_name} {ci.last_name}</div>
                                <div className="text-[10px] text-slate-400">{ci.email}</div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 font-medium">
                                {ci.events?.name || "Official Event"}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                                {ci.badge_code || "PASS"}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {ci.ticket_type || "General"}
                              </td>
                              <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                                {ci.checked_in_at ? new Date(ci.checked_in_at).toLocaleTimeString() : "Just now"}
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
                    <SearchableSelect
                      value={quotaRole}
                      onChange={(val) => setQuotaRole(val)}
                      options={QUOTA_ROLE_OPTIONS}
                      isClearable={false}
                      buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! font-semibold! rounded-xl! py-2! px-3!"
                    />
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
