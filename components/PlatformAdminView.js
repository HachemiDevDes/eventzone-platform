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
  { value: "1", label: "Position #1" },
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

  // Filter states
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

  // Edit Quota Modal state
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
    setQuotaMaxEvents(org.maxEvents !== null ? String(org.maxEvents) : "");
    setQuotaMaxAttendees(org.maxAttendees !== null ? String(org.maxAttendees) : "");
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
  //  COMPUTED & FILTERED DATA
  // ─────────────────────────────────────────────
  // Pinned hero events for preview
  const curatedHeroEvents = useMemo(() => {
    return events
      .filter(e => e.isHeroFeatured)
      .sort((a, b) => (a.heroOrder || 99) - (b.heroOrder || 99));
  }, [events]);

  // Filtered Organizers
  const filteredOrganizers = useMemo(() => {
    return organizers.filter(org => {
      const matchesSearch = !organizerSearch.trim() || 
        org.fullName.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        org.email.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        org.companyName.toLowerCase().includes(organizerSearch.toLowerCase());
      
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500 selection:text-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 shadow-xl shadow-amber-500/5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Platform Super Admin Console</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6 leading-relaxed">
          This console is reserved for platform owners to govern cross-platform events, organizer quotas, homepage hero curation, and Chargily payments.
          {currentUser?.email ? (
            <span className="block mt-2 font-mono text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg p-2">
              Signed in as: <strong className="text-emerald-400">{currentUser.email}</strong> (Role: {currentUser.role || 'organizer'})
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
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold transition-all cursor-pointer border border-slate-700/60"
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
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 border border-emerald-500/30"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === "error" 
            ? "bg-rose-950/90 text-rose-200 border-rose-800" 
            : "bg-emerald-950/90 text-emerald-200 border-emerald-800"
        }`}>
          {toastMessage.type === "error" ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          EXECUTIVE BACK OFFICE HEADER
      ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">EventZone Back Office</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">Platform Command Console &amp; Cross-Tenant Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync Live Data"}</span>
          </button>

          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm shadow-emerald-600/30"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Exit to Platform</span>
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          PRIMARY NAVIGATION TABS
      ───────────────────────────────────────────── */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm"
                  : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────────
          MAIN CONTENT CONTAINER
      ───────────────────────────────────────────── */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <div>
              <h3 className="text-base font-semibold text-slate-200">Aggregating Platform Data...</h3>
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
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Total Settled GMV</span>
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-white tracking-tight font-mono">
                        {(paymentMetrics.totalGmv || 0).toLocaleString()} <span className="text-xs font-bold text-emerald-400">DZD</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="text-emerald-400 font-semibold">{paymentMetrics.paidCount}</span> successful transactions
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Registered Organizers</span>
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-white tracking-tight font-mono">
                        {organizers.length}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {organizers.filter(o => o.status === "active").length} active accounts
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Active Events</span>
                      <Calendar className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-white tracking-tight font-mono">
                        {events.filter(e => e.status === "published").length}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {events.length} total events in directory
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Hero Curated Events</span>
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-white tracking-tight font-mono">
                        {curatedHeroEvents.length} <span className="text-xs font-normal text-slate-400">/ 4</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {curatedHeroEvents.length >= 1 ? "Custom priority active" : "Default order active"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Live Check-Ins</span>
                      <UserCheck className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-white tracking-tight font-mono">
                        {recentCheckIns.length}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Recent verified gate passes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Split Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Financial Breakdown */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        Chargily Gateway Breakdown
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">Algeria DZD</span>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            EDAHABIA Volume
                          </span>
                          <span className="font-mono text-white font-semibold">
                            {(paymentMetrics.edahabiaGmv || 0).toLocaleString()} DZD ({paymentMetrics.edahabiaCount || 0})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${paymentMetrics.totalGmv > 0 ? (paymentMetrics.edahabiaGmv / paymentMetrics.totalGmv) * 100 : 50}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            CIB Card Volume
                          </span>
                          <span className="font-mono text-white font-semibold">
                            {(paymentMetrics.cibGmv || 0).toLocaleString()} DZD ({paymentMetrics.cibCount || 0})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${paymentMetrics.totalGmv > 0 ? (paymentMetrics.cibGmv / paymentMetrics.totalGmv) * 100 : 50}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Checkout Conversion Rate:</span>
                        <span className="font-mono text-emerald-400 font-bold">{paymentMetrics.successRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Regional Distribution */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        Top Algerian Wilayas
                      </h3>
                      <span className="text-xs text-slate-400">Events Hosted</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {wilayaDistribution.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No location records yet</p>
                      ) : (
                        wilayaDistribution.map(([wilaya, count], idx) => (
                          <div key={wilaya} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-slate-500 font-mono">#{idx + 1}</span>
                              <span className="text-slate-300 font-medium truncate max-w-[180px]">{wilaya}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-semibold">
                              {count} {count === 1 ? "event" : "events"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Live Check-in Pulse */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-teal-400" />
                        Live Gate Check-in Pulse
                      </h3>
                      <span className="text-xs text-slate-400">Real-time</span>
                    </div>

                    <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                      {recentCheckIns.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No recent gate check-ins logged</p>
                      ) : (
                        recentCheckIns.slice(0, 6).map((ci, i) => (
                          <div key={ci.id || i} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
                            <div className="truncate mr-2">
                              <div className="font-semibold text-slate-200 truncate">{ci.first_name} {ci.last_name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{ci.events?.name || "Official Event"}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={organizerSearch}
                      onChange={(e) => setOrganizerSearch(e.target.value)}
                      placeholder="Search organizer by name, company, email..."
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-48">
                      <SearchableSelect
                        value={organizerWilayaFilter}
                        onChange={setOrganizerWilayaFilter}
                        options={[{ value: "All", label: "All Wilayas" }, ...ALGERIA_WILAYAS.map(w => ({ value: w, label: w }))]}
                        placeholder="Filter Wilaya"
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
                      />
                    </div>
                  </div>
                </div>

                {/* Organizers Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Organizer / Company</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Wilaya</th>
                          <th className="py-3 px-4">Events Created / Quota</th>
                          <th className="py-3 px-4">Max Capacity Cap</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredOrganizers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                              No organizers match current search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredOrganizers.map(org => {
                            const isAtOrOverLimit = org.maxEvents !== null && org.eventsCount >= org.maxEvents;
                            return (
                              <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-white">{org.fullName}</div>
                                  <div className="text-[11px] text-slate-400">{org.companyName || org.jobTitle || "Independent"}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-300">
                                  <div>{org.email}</div>
                                  {org.phone && <div className="text-[10px] text-slate-500">{org.phone}</div>}
                                </td>
                                <td className="py-3 px-4 text-slate-300">
                                  {org.location || "Algeria"}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-mono font-bold ${isAtOrOverLimit ? "text-amber-400" : "text-emerald-400"}`}>
                                      {org.eventsCount}
                                    </span>
                                    <span className="text-slate-500 font-mono">/</span>
                                    <span className="font-mono text-slate-400">
                                      {org.maxEvents !== null ? org.maxEvents : "Unlimited"}
                                    </span>
                                    {isAtOrOverLimit && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                        LIMIT REACHED
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-300">
                                  {org.maxAttendees !== null ? (
                                    <span>{org.maxAttendees.toLocaleString()} attendees</span>
                                  ) : (
                                    <span className="text-emerald-400">Unlimited</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                                    org.status === "active" 
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                      : org.status === "suspended" 
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  }`}>
                                    {org.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openEditQuotaModal(org)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
                                      title="Edit Event Quotas & Limits"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>Edit Quotas</span>
                                    </button>

                                    <button
                                      onClick={() => setSelectedOrgEvents(events.filter(e => e.organizerId === org.id))}
                                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
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
                <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      Homepage Hero Section Curator
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Choose which published events appear in the prominent top carousel of the EventZone homepage (<span className="text-emerald-400 font-mono">MainHomePage.js</span>). Pinned events override default chronological ordering.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                      Currently Pinned: <span className="font-bold text-emerald-400">{curatedHeroEvents.length}</span> events
                    </span>
                  </div>
                </div>

                {/* Hero Carousel Live Simulation */}
                {curatedHeroEvents.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Live Homepage Hero Simulation</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          onClick={() => setHeroPreviewIndex(prev => (prev - 1 + curatedHeroEvents.length) % curatedHeroEvents.length)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-slate-400 px-2">
                          Slide {heroPreviewIndex + 1} of {curatedHeroEvents.length}
                        </span>
                        <button
                          onClick={() => setHeroPreviewIndex(prev => (prev + 1) % curatedHeroEvents.length)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
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
                        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] max-h-[360px] border border-slate-800 group">
                          <img
                            src={curEv.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"}
                            alt={curEv.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500 text-slate-950 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-slate-950" />
                                HERO POSITION #{curEv.heroOrder || (heroPreviewIndex + 1)}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {curEv.category}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                                {curEv.city || curEv.location || "Algeria"}
                              </span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white">{curEv.title}</h2>
                            <p className="text-xs text-slate-300 line-clamp-2 mt-1 max-w-2xl">{curEv.tagline || curEv.description}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Published Events Selection Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Published Events for Hero</h4>
                    <span className="text-xs text-slate-500">Toggle PIN and assign slide priority</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Event Title</th>
                          <th className="py-3 px-4">Organizer</th>
                          <th className="py-3 px-4">Wilaya</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-center">Hero Priority</th>
                          <th className="py-3 px-4 text-right">Hero Pin Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {events.filter(e => e.status === "published").map(ev => (
                          <tr key={ev.id} className={`hover:bg-slate-800/40 transition-colors ${ev.isHeroFeatured ? "bg-emerald-950/10" : ""}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80"}
                                  alt={ev.title}
                                  className="w-12 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                                />
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    {ev.title}
                                    {ev.isHeroFeatured && (
                                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{ev.startDate || "Date TBA"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {ev.organizerFullName || "Organizer"}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {ev.city || ev.location || "Algeria"}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {ev.category}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {ev.isHeroFeatured ? (
                                <div className="w-36 mx-auto">
                                  <SearchableSelect
                                    value={String(ev.heroOrder || 1)}
                                    onChange={(val) => handleUpdateHeroOrder(ev, val)}
                                    options={HERO_POSITION_OPTIONS}
                                    isClearable={false}
                                    buttonClassName="bg-slate-800! border-emerald-500/40! text-emerald-400! font-mono! font-bold! py-1! px-2! text-xs! rounded-lg!"
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-600 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleHeroFeatured(ev)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto ${
                                  ev.isHeroFeatured
                                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/30"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                                }`}
                              >
                                <Pin className={`w-3.5 h-3.5 ${ev.isHeroFeatured ? "fill-white" : ""}`} />
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search cross-tenant events by title, organizer, category..."
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-44">
                      <SearchableSelect
                        value={eventCategoryFilter}
                        onChange={setEventCategoryFilter}
                        options={[{ value: "All", label: "All Categories" }, ...INDUSTRIES.map(ind => ({ value: ind, label: ind }))]}
                        placeholder="Category"
                      />
                    </div>

                    <div className="w-44">
                      <SearchableSelect
                        value={eventWilayaFilter}
                        onChange={setEventWilayaFilter}
                        options={[{ value: "All", label: "All Wilayas" }, ...ALGERIA_WILAYAS.map(w => ({ value: w, label: w }))]}
                        placeholder="Wilaya"
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
                      />
                    </div>
                  </div>
                </div>

                {/* Master Events Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Event Details</th>
                          <th className="py-3 px-4">Organizer</th>
                          <th className="py-3 px-4">Location / Wilaya</th>
                          <th className="py-3 px-4">Dates</th>
                          <th className="py-3 px-4">Attendees / Cap</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredEvents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                              No events found matching current criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map(ev => (
                            <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=80"}
                                    alt={ev.title}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                                  />
                                  <div>
                                    <div className="font-semibold text-white flex items-center gap-1.5">
                                      {ev.title}
                                      {ev.isHeroFeatured && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                                          HERO #{ev.heroOrder || 1}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{ev.category}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                <div className="font-medium">{ev.organizerFullName}</div>
                                <div className="text-[10px] text-slate-500">{ev.organizerEmail}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {ev.city || ev.location || "Algeria"}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {ev.startDate || "TBA"}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-300">
                                <span className="font-bold text-emerald-400">{ev.registeredCount || 0}</span>
                                <span className="text-slate-500"> / {ev.capacity || 500}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                                  ev.status === "published"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : ev.status === "suspended"
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}>
                                  {ev.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {onViewPublicLandingPage && (
                                    <button
                                      onClick={() => onViewPublicLandingPage(ev.id)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                                      title="Preview Public Landing Page"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleToggleHeroFeatured(ev)}
                                    className={`p-1.5 rounded-lg border text-xs ${
                                      ev.isHeroFeatured
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                                    }`}
                                    title={ev.isHeroFeatured ? "Unpin from Hero" : "Pin to Hero"}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${ev.isHeroFeatured ? "fill-yellow-400" : ""}`} />
                                  </button>

                                  {ev.status === "published" ? (
                                    <button
                                      onClick={() => handleUpdateEventStatus(ev, "suspended")}
                                      className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-medium transition-colors"
                                      title="Suspend / Takedown event"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateEventStatus(ev, "published")}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-xs font-medium transition-colors"
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
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400">Total Settled GMV</span>
                    <div className="text-xl font-black text-white font-mono mt-1">
                      {(paymentMetrics.totalGmv || 0).toLocaleString()} <span className="text-xs text-emerald-400">DZD</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400">EDAHABIA Settled</span>
                    <div className="text-xl font-black text-amber-400 font-mono mt-1">
                      {(paymentMetrics.edahabiaGmv || 0).toLocaleString()} <span className="text-xs">DZD</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400">CIB Card Settled</span>
                    <div className="text-xl font-black text-blue-400 font-mono mt-1">
                      {(paymentMetrics.cibGmv || 0).toLocaleString()} <span className="text-xs">DZD</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Paid Checkouts</span>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                        {paymentMetrics.paidCount} / {payments.length}
                      </div>
                    </div>
                    <button
                      onClick={handleExportPaymentsCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Download CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="Search checkout ID, customer name, email..."
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                      />
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Chargily Checkout ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Amount (DZD)</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Paid At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                              No Chargily payment records found.
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                              <td className="py-3 px-4 font-semibold text-slate-200 truncate max-w-[200px]">
                                {pay.chargily_checkout_id || pay.id}
                              </td>
                              <td className="py-3 px-4 font-sans">
                                <div className="font-medium text-white">{pay.customer_name || "Attendee"}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{pay.customer_email}</div>
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-400">
                                {Number(pay.amount || 0).toLocaleString()} DZD
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  (pay.payment_method || '').toLowerCase().includes("edahabia")
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                }`}>
                                  {pay.payment_method || "EDAHABIA"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                                  pay.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : pay.status === "pending"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                }`}>
                                  {pay.status || "pending"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[11px]">
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-400" />
                    Cross-Platform Attendee Lookup
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Search registered attendees across all platform events by First Name, Last Name, Email, Phone, or Badge Code.
                  </p>

                  <form onSubmit={handlePerformAttendeeSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={attendeeSearchQuery}
                        onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                        placeholder="Search by name, attendee@example.com, +213..., EZ-XXXXXX"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingAttendees || !attendeeSearchQuery.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {isSearchingAttendees ? "Searching..." : "Lookup Attendee"}
                    </button>
                  </form>
                </div>

                {/* Search Results */}
                {searchedAttendees.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-3.5 bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-slate-300">
                      Found {searchedAttendees.length} Matched Attendees
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Attendee</th>
                            <th className="py-3 px-4">Event</th>
                            <th className="py-3 px-4">Ticket Tier</th>
                            <th className="py-3 px-4">Badge Code</th>
                            <th className="py-3 px-4">Gate Check-in</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {searchedAttendees.map(att => (
                            <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{att.first_name} {att.last_name}</div>
                                <div className="text-[11px] text-slate-400">{att.email} {att.phone ? `• ${att.phone}` : ''}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {att.events?.name || "Eventzone Event"}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {att.ticket_type || "Standard"}
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                                {att.badge_code || "—"}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  att.checked_in
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-400" />
                      Platform-Wide Live Gate Check-ins Stream
                    </h4>
                    <span className="text-[11px] text-slate-500">Last 30 check-ins</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Attendee</th>
                          <th className="py-3 px-4">Event Name</th>
                          <th className="py-3 px-4">Badge Code</th>
                          <th className="py-3 px-4">Ticket Type</th>
                          <th className="py-3 px-4 text-right">Checked In Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {recentCheckIns.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                              No gate check-in activity recorded yet.
                            </td>
                          </tr>
                        ) : (
                          recentCheckIns.map(ci => (
                            <tr key={ci.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{ci.first_name} {ci.last_name}</div>
                                <div className="text-[10px] text-slate-400">{ci.email}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {ci.events?.name || "Official Event"}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                {ci.badge_code || "PASS"}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {ci.ticket_type || "General"}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
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
          MODAL: EDIT ORGANIZER QUOTAS & LIMITS
      ───────────────────────────────────────────── */}
      {editingOrganizer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Edit Organizer Quotas &amp; Limits
                </h3>
                <p className="text-xs text-slate-400">{editingOrganizer.fullName} ({editingOrganizer.companyName || "Organizer"})</p>
              </div>
              <button
                onClick={() => setEditingOrganizer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Allowed Number of Events */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Allowed Number of Events
                </label>
                <p className="text-slate-500 mb-2">Maximum number of events this organizer can create before hitting the platform paywall.</p>
                <div className="flex items-center gap-2 mb-2">
                  {["1", "3", "5", "10", "25", "Unlimited"].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuotaMaxEvents(preset === "Unlimited" ? "" : preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        (preset === "Unlimited" && quotaMaxEvents === "") || (quotaMaxEvents === preset)
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={quotaMaxEvents}
                  onChange={(e) => setQuotaMaxEvents(e.target.value)}
                  placeholder="Leave empty for Unlimited"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Max Attendee Capacity per Event */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Maximum Attendee Capacity per Event
                </label>
                <p className="text-slate-500 mb-2">The highest attendee threshold this organizer can configure on any single event.</p>
                <div className="flex items-center gap-2 mb-2">
                  {["50", "150", "500", "1000", "2500", "Unlimited"].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuotaMaxAttendees(preset === "Unlimited" ? "" : preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        (preset === "Unlimited" && quotaMaxAttendees === "") || (quotaMaxAttendees === preset)
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={quotaMaxAttendees}
                  onChange={(e) => setQuotaMaxAttendees(e.target.value)}
                  placeholder="Leave empty for Unlimited"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Account Status & Role */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Account Status</label>
                  <SearchableSelect
                    value={quotaStatus}
                    onChange={(val) => setQuotaStatus(val)}
                    options={QUOTA_STATUS_OPTIONS}
                    isClearable={false}
                    buttonClassName="bg-slate-800! border-slate-700! text-white! text-xs! rounded-xl! py-2! px-3!"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Platform Role</label>
                  <SearchableSelect
                    value={quotaRole}
                    onChange={(val) => setQuotaRole(val)}
                    options={QUOTA_ROLE_OPTIONS}
                    isClearable={false}
                    buttonClassName="bg-slate-800! border-slate-700! text-white! text-xs! rounded-xl! py-2! px-3!"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingOrganizer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuotas}
                disabled={isSavingQuota}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
              >
                {isSavingQuota ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Quotas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DRAWER: ORGANIZER EVENTS PREVIEW
      ───────────────────────────────────────────── */}
      {selectedOrgEvents && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full p-6 overflow-y-auto space-y-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Organizer Hosted Events ({selectedOrgEvents.length})
              </h3>
              <button
                onClick={() => setSelectedOrgEvents(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedOrgEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">This organizer has not created any events yet.</p>
            ) : (
              <div className="space-y-3">
                {selectedOrgEvents.map(ev => (
                  <div key={ev.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-white">{ev.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{ev.category} • {ev.city || ev.location}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                      ev.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-700 text-slate-300 border-slate-600"
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
