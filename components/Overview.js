"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Users, CheckCircle2, DollarSign, Calendar, Zap, ArrowRight, 
  UserPlus, Map as MapIcon, MapPin, ExternalLink, Copy, Check, Clock, TrendingUp,
  Building2, Award, Ticket, Sparkles, AlertCircle, ChevronRight,
  ShieldCheck, Smartphone, Eye, ArrowUpRight, BarChart3, Layers,
  ListTodo, UserCheck, Star
} from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function Overview({ 
  eventDetails = {}, 
  attendees = [], 
  pending = [],
  sessions = [], 
  tickets = [], 
  sponsors = [],
  exhibitors = [],
  floorPlans = [],
  forms = [],
  formSubmissions = [],
  rsvps = [],
  rsvpSettings = {},
  team = [],
  onSwitchView,
  onOpenModal,
  onPreviewLandingPage
}) {
  const { t } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [chartMode, setChartMode] = useState("daily"); // "daily" | "cumulative"

  // 1. Core Event Metadata
  const title = eventDetails?.title || "Eventzone Summit";
  const location = eventDetails?.location || "Venue TBA";
  const venueAddress = eventDetails?.venueAddress || "";
  const type = eventDetails?.type || "In-Person";
  const category = eventDetails?.category || "Technology & AI";
  const capacity = Number(eventDetails?.capacity) || 500;
  const startDate = eventDetails?.startDate || "";
  const endDate = eventDetails?.endDate || "";
  const scheduleTime = eventDetails?.scheduleTime || "09:00 AM – 05:00 PM";
  const banner = eventDetails?.banner || eventDetails?.cover_url || "";

  // 2. Calculations & KPIs
  const totalAttendees = attendees.length;
  const pendingCount = pending.length;
  const checkedInCount = attendees.filter(a => a.status === 'checked-in').length;
  const checkinPct = totalAttendees > 0 ? (checkedInCount / totalAttendees) * 100 : 0;
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((totalAttendees / capacity) * 100)) : 0;

  // Gross Revenue calculation
  const totalRev = useMemo(() => {
    return attendees.reduce((sum, a) => {
      const match = tickets.find(t => t.name === a.ticketType || t.tier === a.ticketType);
      const price = match ? (typeof match.price === 'number' ? match.price : parseFloat(match.price) || 0) : 0;
      return sum + price;
    }, 0);
  }, [attendees, tickets]);

  // Unique Speakers from sessions
  const uniqueSpeakers = useMemo(() => {
    const seen = new Set();
    const list = [];
    (sessions || []).forEach(s => {
      (s.speakers || []).forEach(sp => {
        if (sp && sp.name && !seen.has(sp.name)) {
          seen.add(sp.name);
          list.push(sp);
        }
      });
    });
    return list;
  }, [sessions]);

  // Calculate Days Remaining (static, for checklist)
  const daysRemaining = useMemo(() => {
    if (!startDate) return null;
    const now = new Date();
    const eventStart = new Date(startDate);
    const diffTime = eventStart - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate]);

  // Next upcoming sessions sorted by time
  const upcomingSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => {
        const timeA = a.startTime || "00:00";
        const timeB = b.startTime || "00:00";
        return timeA.localeCompare(timeB);
      })
      .slice(0, 3);
  }, [sessions]);

  // Recent 5 Attendees
  const recentAttendees = useMemo(() => {
    return [...attendees].slice(-5).reverse();
  }, [attendees]);

  // Copy public landing page link
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" 
      ? `${window.location.origin}/?view=event-landing&eventId=${eventDetails?.id || ""}`
      : "https://eventzone.pro/event";
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Readiness Checklist Items
  const readinessChecklist = useMemo(() => {
    return [
      {
        id: "details",
        label: "Event Info & Dates",
        completed: Boolean(title && startDate && location),
        view: "event-details",
        detail: title && startDate ? `${location}` : "Configure details"
      },
      {
        id: "tickets",
        label: "Ticket Tiers",
        completed: tickets.length > 0,
        view: "tickets",
        detail: `${tickets.length} tier${tickets.length === 1 ? '' : 's'} configured`
      },
      {
        id: "timeline",
        label: "Schedule & Agenda",
        completed: sessions.length > 0,
        view: "calendar",
        detail: `${sessions.length} session${sessions.length === 1 ? '' : 's'} scheduled`
      },
      {
        id: "floorplan",
        label: "Floor Plan Layout",
        completed: floorPlans.length > 0,
        view: "floor-plan",
        detail: `${floorPlans.length} plan${floorPlans.length === 1 ? '' : 's'} ready`
      },
      {
        id: "sponsors",
        label: "Sponsors & Exhibitors",
        completed: sponsors.length > 0 || exhibitors.length > 0,
        view: "sponsors",
        detail: `${sponsors.length + exhibitors.length} partners active`
      }
    ];
  }, [title, startDate, location, tickets.length, sessions.length, floorPlans.length, sponsors.length, exhibitors.length]);

  const completedChecklistCount = readinessChecklist.filter(c => c.completed).length;
  const readinessScore = Math.round((completedChecklistCount / readinessChecklist.length) * 100);

  // Format Date Range helper
  const formattedDateRange = useMemo(() => {
    if (!startDate) return "Dates TBA";
    const startStr = new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!endDate || endDate === startDate) return startStr;
    const endStr = new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} – ${endStr}`;
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col gap-8 w-full text-left pb-12">
         {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. EXECUTIVE EVENT HERO & ACTION BAR                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-1 pb-2">
        
        {/* Left: Event Identity & Meta */}
        <div className="space-y-2.5 max-w-3xl">
{/* Status pills hidden */}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-rose-500 shrink-0" />
              <span className="text-slate-800 font-semibold">{location}</span>
              {venueAddress && <span className="text-slate-400 truncate max-w-xs">({venueAddress})</span>}
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600 shrink-0" />
              <span className="text-slate-800 font-semibold">{formattedDateRange}</span>
            </span>

            {scheduleTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span>{scheduleTime}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
          {/* Preview Landing Page */}
          {onPreviewLandingPage && (
            <button
              type="button"
              onClick={onPreviewLandingPage}
              className="flex items-center justify-center px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>View Landing Page</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PRIMARY EXECUTIVE KPI METRIC CARDS                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Registered Attendees & Capacity */}
        <div 
          onClick={() => onSwitchView("attendees")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Registrations
              </span>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalAttendees}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {capacity} capacity
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{capacityPct}% target filled</span>
              {pendingCount > 0 && (
                <span className="text-amber-600 font-bold">{pendingCount} pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Revenue & Pass Sales */}
        <div 
          onClick={() => onSwitchView("tickets")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Gross Revenue
              </span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ${totalRev.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                USD
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{tickets.length} Ticket Tier{tickets.length === 1 ? '' : 's'}</span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Manage Tiers <ChevronRight size={13} />
            </span>
          </div>
        </div>

        {/* Card 3: Live Door Check-Ins */}
        <div 
          onClick={() => onSwitchView("check-in")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Door Check-Ins
              </span>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {checkedInCount}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {totalAttendees} checked in
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                style={{ width: `${checkinPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{checkinPct.toFixed(0)}% attendance rate</span>
              <span className="text-purple-600 font-bold">Open Scanner</span>
            </div>
          </div>
        </div>

        {/* Card 4: Summit Ecosystem (Sessions, Speakers, Exhibitors) */}
        <div 
          onClick={() => onSwitchView("calendar")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Agenda &amp; Stakeholders
              </span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {sessions.length}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Sessions
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{uniqueSpeakers.length} Speakers</span>
            <span>•</span>
            <span>{sponsors.length + exhibitors.length} Partners</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2.5. RSVP & HEADCOUNT HIGHLIGHT STRIP                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
{/* RSVP & Attendance Headcount banner hidden */}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. EVENT LAUNCH READINESS CHECKLIST                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Event Readiness &amp; Setup Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Key operational milestones to verify before summit doors open.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {completedChecklistCount} of {readinessChecklist.length} Ready
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${readinessScore === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${readinessScore === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {readinessScore}%
            </span>
          </div>
        </div>

        {/* Readiness Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {readinessChecklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSwitchView(item.view)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                item.completed
                  ? "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                  : "bg-amber-50/30 border-amber-200 hover:bg-amber-50/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                <span className={`text-[10px] font-bold ${item.completed ? "text-emerald-600" : "text-amber-600"}`}>
                  {item.completed ? "Done" : "Pending"}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 truncate">{item.detail}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. ANALYTICS & TICKET TIERS BREAKDOWN (2 Cols)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Registration Velocity & Growth Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Registration Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Delegate sign-up trend over the current campaign cycle.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setChartMode("daily")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "daily" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Daily Inflow
              </button>
              <button
                type="button"
                onClick={() => setChartMode("cumulative")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "cumulative" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Cumulative
              </button>
            </div>
          </div>

          {/* SVG Growth Chart */}
          <div className="relative w-full h-52">
            {totalAttendees === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center p-4">
                <TrendingUp size={28} className="text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-600">No registration activity recorded yet</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Velocity curve will track delegate sign-ups in real-time as tickets are claimed</span>
              </div>
            ) : (
              <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guide lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeDasharray="4 4" />

                {/* Shaded Area */}
                <polyline 
                  fill="url(#velocityGrad)" 
                  stroke="none" 
                  points={
                    chartMode === "cumulative"
                      ? "0,170 80,140 160,110 240,85 320,55 400,35 500,15 500,180 0,180"
                      : "0,170 80,120 160,140 240,70 320,95 400,40 500,20 500,180 0,180"
                  }
                />
                
                {/* Path Line */}
                <polyline 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  points={
                    chartMode === "cumulative"
                      ? "0,170 80,140 160,110 240,85 320,55 400,35 500,15"
                      : "0,170 80,120 160,140 240,70 320,95 400,40 500,20"
                  }
                />

                {/* Interactive Data points */}
                <circle cx="80" cy={chartMode === "cumulative" ? 140 : 120} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="160" cy={chartMode === "cumulative" ? 110 : 140} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="240" cy={chartMode === "cumulative" ? 85 : 70} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="320" cy={chartMode === "cumulative" ? 55 : 95} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="400" cy={chartMode === "cumulative" ? 35 : 40} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="500" cy={chartMode === "cumulative" ? 15 : 20} r="5.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
              </svg>
            )}
          </div>

          <div className="flex justify-between text-xs font-semibold text-slate-400 px-1 border-t border-slate-100 pt-3">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Right: Ticket Tiers Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ticket Tiers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Allocation by tier</p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("tickets")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Manage
            </button>
          </div>

          {/* List of Ticket Tiers with Progress */}
          <div className="space-y-4 flex-1 overflow-y-auto max-h-64 pr-1">
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Ticket size={28} className="mx-auto opacity-40" />
                <p className="text-xs font-medium">No ticket tiers created yet.</p>
                <button
                  type="button"
                  onClick={() => onOpenModal ? onOpenModal("ticket") : onSwitchView("tickets")}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Create First Ticket Tier
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const sold = Number(t.sold) || 0;
                const total = Number(t.maxQty || t.available || 100);
                const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                const priceVal = typeof t.price === 'number' ? t.price : parseFloat(t.price) || 0;

                return (
                  <div key={t.id || t.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 truncate">{t.name || t.tier}</span>
                      <span className="font-extrabold text-blue-600 shrink-0">${priceVal}</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>{sold} sold</span>
                      <span>{total} capacity ({pct}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Passes Sold</span>
            <span className="font-extrabold text-slate-900">{totalAttendees}</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. TIMELINE SNAPSHOT & RECENT REGISTRATIONS (2 Cols)                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Upcoming Timeline Agenda */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Upcoming Agenda Sessions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Keynotes, panels, and breakout tracks
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("calendar")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center"
            >
              <span>Full Agenda</span>
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Calendar size={32} className="mx-auto opacity-30" />
                <p className="text-xs font-medium">No timeline sessions scheduled yet.</p>
                <button
                  type="button"
                  onClick={() => onSwitchView("calendar")}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Add First Session
                </button>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition-colors flex items-center gap-4"
                >
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-center font-bold shrink-0 min-w-[65px]">
                    <span className="text-[10px] uppercase block opacity-75">
                      {session.startTime?.split(" ")[0] || "09:00"}
                    </span>
                    <span className="text-xs font-extrabold block">
                      {session.startTime?.split(" ")[1] || "AM"}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {session.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>🕒 {session.startTime} - {session.endTime}</span>
                      {session.hall && (
                        <span>• 📍 {session.hall}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Attendee Registrations */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Registrations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest attendees registered for this summit
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("attendees")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center"
            >
              <span>View All ({totalAttendees})</span>
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentAttendees.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Users size={32} className="mx-auto opacity-30" />
                <p className="text-xs font-medium">No attendees registered yet.</p>
                <button
                  type="button"
                  onClick={() => onOpenModal ? onOpenModal("attendee") : onSwitchView("attendees")}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Register Attendee
                </button>
              </div>
            ) : (
              recentAttendees.map((attendee, idx) => (
                <div 
                  key={attendee.id || idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {attendee.name ? attendee.name[0].toUpperCase() : "A"}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {attendee.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate font-mono">
                        {attendee.email || attendee.company || "Attendee"}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    attendee.status === "checked-in"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {attendee.status === "checked-in" ? "Checked In" : "Confirmed"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. EVENT QUICK ACTIONS BAR                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Organizer Quick Operations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant shortcuts to design spaces, launch door check-in, and manage participants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSwitchView("calendar")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer space-y-1.5 shadow-2xs"
          >
            <div className="text-xs font-bold text-slate-900">Agenda</div>
            <div className="text-[11px] text-slate-500">Add &amp; schedule sessions</div>
          </button>

          <button
            type="button"
            onClick={() => onSwitchView("check-in")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer space-y-1.5 shadow-2xs"
          >
            <div className="text-xs font-bold text-slate-900">Live Check-In</div>
            <div className="text-[11px] text-slate-500">Scan QR codes at doors</div>
          </button>

          <button
            type="button"
            onClick={() => onSwitchView("floor-plan")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer space-y-1.5 shadow-2xs"
          >
            <div className="text-xs font-bold text-slate-900">Floor Plan Designer</div>
            <div className="text-[11px] text-slate-500">Design expo &amp; booths</div>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal ? onOpenModal("attendee") : onSwitchView("attendees")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer space-y-1.5 shadow-2xs"
          >
            <div className="text-xs font-bold text-slate-900">Add Attendee</div>
            <div className="text-[11px] text-slate-500">Manual delegate entry</div>
          </button>
        </div>
      </div>

    </div>
  );
}
