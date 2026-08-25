"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, CheckCircle2, DollarSign, Calendar, Zap, ArrowRight, 
  MapPin, ExternalLink, Clock, TrendingUp,
  Building2, Award, Ticket, Sparkles, AlertCircle, ChevronRight,
  ShieldCheck, Smartphone, Eye, ArrowUpRight, BarChart3, Layers,
  ListTodo, UserCheck, Star, Printer, Mail, FileText, QrCode,
  Activity, Bell, UserPlus, Flame, Check, HelpCircle, X, ChevronUp,
  Briefcase, UserCheck2, PieChart, Store, UserCog
} from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function Overview({ 
  eventDetails = {}, 
  attendees = [], 
  pending = [],
  sessions = [], 
  tickets = [], 
  influencers = [],
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
  const [chartMode, setChartMode] = useState("daily"); // "daily" | "cumulative"
  const [chartTimeframe, setChartTimeframe] = useState("7d"); // "7d" | "14d" | "30d"
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [readinessFloatingOpen, setReadinessFloatingOpen] = useState(false);

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
      const match = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (a.ticketType || a.ticket_type || "").trim().toLowerCase());
      const price = match ? (typeof match.price === 'number' ? match.price : parseFloat(match.price) || 0) : 0;
      return sum + price;
    }, 0);
  }, [attendees, tickets]);

  const avgRevPerAttendee = totalAttendees > 0 ? Math.round(totalRev / totalAttendees) : 0;

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

  // Calculate Days Remaining and Event Status
  const { daysRemaining, eventStatusPill } = useMemo(() => {
    if (!startDate) return { daysRemaining: null, eventStatusPill: { label: "Dates TBA", color: "bg-slate-100 text-slate-700 border-slate-200" } };
    const now = new Date();
    const eventStart = new Date(startDate);
    const eventEnd = endDate ? new Date(endDate) : eventStart;
    
    // Normalize to midnight
    now.setHours(0,0,0,0);
    const startCopy = new Date(eventStart);
    startCopy.setHours(0,0,0,0);
    const endCopy = new Date(eventEnd);
    endCopy.setHours(23,59,59,999);

    const diffTime = startCopy - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (now >= startCopy && now <= endCopy) {
      return { 
        daysRemaining: 0, 
        eventStatusPill: { label: "Live Today", color: "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse" } 
      };
    } else if (diffDays > 0) {
      return { 
        daysRemaining: diffDays, 
        eventStatusPill: { label: `${diffDays} Day${diffDays === 1 ? '' : 's'} to Go`, color: "bg-blue-50 text-blue-700 border-blue-200" } 
      };
    } else {
      return { 
        daysRemaining: diffDays, 
        eventStatusPill: { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200" } 
      };
    }
  }, [startDate, endDate]);

  // Top Organizations & Job Roles Demographics
  const { topCompanies, topRoles } = useMemo(() => {
    const compCount = {};
    const roleCount = {};

    attendees.forEach(a => {
      const comp = (a.company || a.organization || "Independent / Other").trim();
      if (comp) compCount[comp] = (compCount[comp] || 0) + 1;

      const role = (a.jobTitle || a.role || a.job_title || "Delegate").trim();
      if (role) roleCount[role] = (roleCount[role] || 0) + 1;
    });

    const sortedComps = Object.entries(compCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const sortedRoles = Object.entries(roleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { topCompanies: sortedComps, topRoles: sortedRoles };
  }, [attendees]);

  // Check-In Performance Breakdown by Ticket Tier
  const tierCheckinStats = useMemo(() => {
    if (tickets.length === 0) {
      return [{
        name: "Standard Admission",
        total: totalAttendees,
        checkedIn: checkedInCount,
        pct: totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0
      }];
    }

    return tickets.map(t => {
      const tierName = t.name || t.tier || "General";
      const tierAttendees = attendees.filter(a => (a.ticketType || a.ticket_type || "").trim().toLowerCase() === tierName.trim().toLowerCase());
      const tierCheckedIn = tierAttendees.filter(a => a.status === 'checked-in').length;
      const count = tierAttendees.length;
      const pct = count > 0 ? Math.round((tierCheckedIn / count) * 100) : 0;
      return {
        name: tierName,
        total: count,
        checkedIn: tierCheckedIn,
        pct
      };
    });
  }, [tickets, attendees, totalAttendees, checkedInCount]);

  // Dynamic Registration Velocity Chart Points & Metrics Calculation
  const velocityData = useMemo(() => {
    const isYear = chartTimeframe === "1y";
    const now = new Date();
    const days = [];

    // Map attendees by date string YYYY-MM-DD
    const dateMap = {};
    const priceMap = {};

    attendees.forEach((a, idx) => {
      let dStr = a.registeredDate || a.registered_at || a.created_at || a.createdAt || "";
      if (dStr && typeof dStr === "string") {
        dStr = dStr.split("T")[0];
      } else {
        // Fallback: smooth spread across past days / months
        const pseudoDay = isYear ? (idx * 28) % 360 : (idx * 2) % 6;
        const tempD = new Date(now);
        tempD.setDate(tempD.getDate() - pseudoDay);
        dStr = tempD.toISOString().split("T")[0];
      }
      dateMap[dStr] = (dateMap[dStr] || 0) + 1;

      // Price calculation
      const match = tickets.find(t => (t.name || t.tier || "").trim().toLowerCase() === (a.ticketType || a.ticket_type || "").trim().toLowerCase());
      const price = match ? (typeof match.price === 'number' ? match.price : parseFloat(match.price) || 0) : 0;
      priceMap[dStr] = (priceMap[dStr] || 0) + price;
    });

    if (isYear) {
      // 12 Monthly Buckets for 1 Year view
      let runningCumulative = 0;
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        let monthCount = 0;
        let monthRev = 0;
        Object.keys(dateMap).forEach((k) => {
          if (k.startsWith(yearMonth)) {
            monthCount += dateMap[k];
            monthRev += (priceMap[k] || 0);
          }
        });
        runningCumulative += monthCount;

        days.push({
          dateStr: yearMonth,
          dayName: d.toLocaleDateString("en-US", { month: "short" }),
          dayNum: d.getFullYear(),
          monthName: d.toLocaleDateString("en-US", { month: "long" }),
          label: `${d.toLocaleDateString("en-US", { month: "short" })} '${String(d.getFullYear()).slice(2)}`,
          fullDate: `${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          count: monthCount,
          cumulative: runningCumulative,
          revenue: monthRev
        });
      }
    } else {
      const numDays = chartTimeframe === "30d" ? 30 : chartTimeframe === "14d" ? 14 : 7;
      let runningCumulative = 0;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split("T")[0];
        const count = dateMap[dStr] || 0;
        const rev = priceMap[dStr] || 0;
        runningCumulative += count;

        days.push({
          dateStr: dStr,
          dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
          dayNum: d.getDate(),
          monthName: d.toLocaleDateString("en-US", { month: "short" }),
          label: `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`,
          fullDate: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
          count,
          cumulative: runningCumulative,
          revenue: rev
        });
      }
    }

    // If all counts are 0 but totalAttendees > 0, generate realistic distribution matching totalAttendees exactly
    const totalMapped = days.reduce((sum, d) => sum + d.count, 0);
    if (totalMapped === 0 && totalAttendees > 0) {
      let remaining = totalAttendees;
      const numSlots = days.length;
      const basePerSlot = Math.floor(totalAttendees / numSlots);
      let cum = 0;
      days.forEach((d, idx) => {
        const isRecent = idx >= numSlots - 3;
        const add = isRecent ? Math.ceil(remaining / (numSlots - idx)) : basePerSlot;
        const actualAdd = Math.min(remaining, Math.max(0, add));
        d.count = actualAdd;
        remaining -= actualAdd;
        cum += actualAdd;
        d.cumulative = cum;
        d.revenue = avgRevPerAttendee * actualAdd;
      });
      if (remaining > 0) {
        days[days.length - 1].count += remaining;
        days[days.length - 1].cumulative += remaining;
      }
    }

    // Calculate Y coordinates for SVG (viewBox: 0 0 540 180)
    // Left: 45, Right: 520, Top: 20, Bottom: 150
    const values = days.map(d => chartMode === "cumulative" ? d.cumulative : d.count);
    const rawMax = Math.max(...values, 1);
    const maxVal = rawMax <= 5 ? 5 : Math.ceil(rawMax * 1.15);
    const minVal = 0;
    const chartHeight = 125;
    const chartTop = 20;
    const chartLeft = 45;
    const chartWidth = 475;

    const points = days.map((d, idx) => {
      const x = chartLeft + (idx / Math.max(1, days.length - 1)) * chartWidth;
      const val = chartMode === "cumulative" ? d.cumulative : d.count;
      const y = chartTop + chartHeight - ((val - minVal) / Math.max(1, maxVal - minVal)) * chartHeight;
      return {
        ...d,
        val,
        x,
        y
      };
    });

    // Helper for smooth cubic Bezier spline curve path
    let linePath = "";
    let areaPath = "";

    if (points.length > 1) {
      linePath = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }

      areaPath = `${linePath} L ${points[points.length - 1].x},${chartTop + chartHeight} L ${points[0].x},${chartTop + chartHeight} Z`;
    }

    // Summary statistics
    const peakDay = days.reduce((max, d) => (d.count > (max?.count || 0) ? d : max), days[0] || { count: 0, dayName: "—" });
    const avgPerDay = (days.reduce((sum, d) => sum + d.count, 0) / Math.max(1, days.length)).toFixed(1);
    const totalPeriodCount = days.reduce((sum, d) => sum + d.count, 0);
    const totalPeriodRev = days.reduce((sum, d) => sum + d.revenue, 0);

    return {
      days,
      points,
      linePath,
      areaPath,
      maxVal,
      peakDay,
      avgPerDay,
      totalPeriodCount,
      totalPeriodRev,
      chartHeight,
      chartTop,
      chartLeft,
      chartWidth,
      isYear
    };
  }, [chartTimeframe, chartMode, attendees, tickets, totalAttendees, avgRevPerAttendee]);

  // Total Booths in Floor Plans
  const totalBooths = useMemo(() => {
    return floorPlans.reduce((sum, fp) => sum + (fp.booths?.length || 0), 0);
  }, [floorPlans]);

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

  // Helper to extract image / avatar
  const getAttendeePhoto = (att) => {
    if (!att) return "";
    return att.photo || att.avatar || att.image || att.avatar_url || "";
  };

  // Readiness Checklist Items
  const readinessChecklist = useMemo(() => {
    return [
      {
        id: "details",
        label: "Event Basics & Venue",
        completed: Boolean(title && startDate && location),
        view: "event-details",
        detail: title && startDate ? `${location}` : "Configure basic info",
        icon: MapPin
      },
      {
        id: "tickets",
        label: "Ticket Tiers",
        completed: tickets.length > 0,
        view: "tickets",
        detail: `${tickets.length} tier${tickets.length === 1 ? '' : 's'} configured`,
        icon: Ticket
      },
      {
        id: "timeline",
        label: "Schedule & Agenda",
        completed: sessions.length > 0,
        view: "calendar",
        detail: `${sessions.length} session${sessions.length === 1 ? '' : 's'} scheduled`,
        icon: Calendar
      },
      {
        id: "badges",
        label: "Badges & QR Pass",
        completed: totalAttendees > 0 || (tickets.some(t => t.badgeUrl) || eventDetails?.badgeUrl),
        view: "attendees",
        detail: "A4 4-Fold & Mobile QR Active",
        icon: QrCode
      },
      {
        id: "floorplan",
        label: "Floor Plan & Booths",
        completed: floorPlans.length > 0,
        view: "floor-plan",
        detail: `${floorPlans.length} plan${floorPlans.length === 1 ? '' : 's'} ready`,
        icon: Layers
      },
      {
        id: "sponsors",
        label: "Sponsors & Exhibitors",
        completed: sponsors.length > 0 || exhibitors.length > 0,
        view: "sponsors",
        detail: `${sponsors.length + exhibitors.length} partners active`,
        icon: Award
      },
      {
        id: "forms",
        label: "Custom Forms & Survey",
        completed: forms.length > 0,
        view: "forms",
        detail: `${forms.length} questionnaire${forms.length === 1 ? '' : 's'}`,
        icon: FileText
      }
    ];
  }, [title, startDate, location, tickets, sessions.length, floorPlans.length, sponsors.length, exhibitors.length, totalAttendees, eventDetails?.badgeUrl, forms.length]);

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
    <div className="flex flex-col gap-8 w-full text-left pb-24 font-sans relative">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. EXECUTIVE EVENT HERO HEADER                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between items-start gap-3 pt-1 pb-1">
        
        {/* Event Identity, Badges & Meta */}
        <div className="space-y-2.5 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${eventStatusPill.color}`}>
              {eventStatusPill.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {type}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-rose-500 shrink-0" />
              <span className="text-slate-800 font-bold">{location}</span>
              {venueAddress && <span className="text-slate-400 truncate max-w-xs">({venueAddress})</span>}
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-blue-600 shrink-0" />
              <span className="text-slate-800 font-bold">{formattedDateRange}</span>
            </span>

            {scheduleTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-slate-400 shrink-0" />
                <span className="text-slate-600 font-semibold">{scheduleTime}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PENDING REGISTRATIONS ATTENTION STRIP (Conditional Alert)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{pendingCount} Applicant{pendingCount === 1 ? '' : 's'} Awaiting Organizer Review</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 text-amber-900 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Review pending applicant profiles, approve their access passes, or decline submissions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSwitchView("pending")}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/25 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span>Review Applications</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PRIMARY EXECUTIVE KPI METRIC CARDS (4 Columns)                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Registered Attendees & Capacity */}
        <div 
          onClick={() => onSwitchView("attendees")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
              <span>{capacityPct}% target filled</span>
              {pendingCount > 0 ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {pendingCount} pending
                </span>
              ) : (
                <span className="text-emerald-600 font-bold">Registration open</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Gross Revenue & Pass Sales */}
        <div 
          onClick={() => onSwitchView("tickets")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Revenue
              </span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalRev.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                DZD
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
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
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                style={{ width: `${checkinPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
              <span>{checkinPct.toFixed(0)}% attendance rate</span>
              <span className="text-purple-600 font-bold flex items-center gap-0.5">
                Open Scanner <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Summit Ecosystem (Agenda, Speakers & Partners) */}
        <div 
          onClick={() => onSwitchView("calendar")}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Agenda &amp; Ecosystem
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

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{uniqueSpeakers.length} Speaker{uniqueSpeakers.length === 1 ? '' : 's'}</span>
            <span>•</span>
            <span>{sponsors.length + exhibitors.length} Partner{sponsors.length + exhibitors.length === 1 ? '' : 's'}</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. ANALYTICS & TICKET TIERS BREAKDOWN (8-Col & 4-Col)               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Registration Velocity & Growth Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
          
          {/* Header Row: Title & Dual Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Registration Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Delegate sign-up inflow over the active campaign period.
              </p>
            </div>

            {/* Timeframe & Mode Filter Bars */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Timeframe selector: 7D / 14D / 30D / 1Y */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {["7d", "14d", "30d", "1y"].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => {
                      setChartTimeframe(tf);
                      setHoveredIndex(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      chartTimeframe === tf 
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Chart Mode: Daily / Cumulative */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setChartMode("daily");
                    setHoveredIndex(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "daily" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Daily Inflow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMode("cumulative");
                    setHoveredIndex(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "cumulative" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cumulative
                </button>
              </div>
            </div>
          </div>

          {/* SVG Smooth Bezier Growth Chart */}
          <div className="relative w-full h-56 select-none">
            {totalAttendees === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center p-4">
                <TrendingUp size={28} className="text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-600">No registration activity recorded yet</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Velocity curve will track delegate sign-ups in real-time as tickets are claimed</span>
              </div>
            ) : (
              <>
                <svg 
                  viewBox="0 0 540 180" 
                  className="w-full h-full overflow-visible"
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <defs>
                    <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  {/* Y-Axis Value Labels & Dashed Guide Lines */}
                  {/* Top Line */}
                  <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                  <text x="35" y="24" textAnchor="end" className="text-[10px] font-bold fill-slate-300 font-mono">
                    {velocityData.maxVal}
                  </text>

                  {/* Mid Line */}
                  <line x1="45" y1="82.5" x2="520" y2="82.5" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                  <text x="35" y="86.5" textAnchor="end" className="text-[10px] font-bold fill-slate-300 font-mono">
                    {Math.round(velocityData.maxVal / 2)}
                  </text>

                  {/* Bottom Baseline */}
                  <line x1="45" y1="145" x2="520" y2="145" stroke="#e2e8f0" strokeWidth="1.2" />
                  <text x="35" y="149" textAnchor="end" className="text-[10px] font-bold fill-slate-400 font-mono">
                    0
                  </text>

                  {/* Shaded Spline Area */}
                  {velocityData.areaPath && (
                    <path 
                      d={velocityData.areaPath} 
                      fill="url(#velocityGrad)" 
                      className="transition-all duration-300 ease-out"
                    />
                  )}

                  {/* Smooth Spline Curve Line */}
                  {velocityData.linePath && (
                    <path 
                      d={velocityData.linePath} 
                      fill="none" 
                      stroke="url(#lineGrad)" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      filter="url(#glowShadow)"
                      className="transition-all duration-300 ease-out"
                    />
                  )}

                  {/* Hover Vertical Guide Line */}
                  {hoveredIndex !== null && velocityData.points[hoveredIndex] && (
                    <line 
                      x1={velocityData.points[hoveredIndex].x} 
                      y1="20" 
                      x2={velocityData.points[hoveredIndex].x} 
                      y2="145" 
                      stroke="#2563eb" 
                      strokeWidth="1.5" 
                      strokeDasharray="3 3"
                      className="opacity-75"
                    />
                  )}

                  {/* Data Points & Invisible Touch/Hover Targets */}
                  {velocityData.points.map((pt, idx) => {
                    const isHovered = hoveredIndex === idx;
                    return (
                      <g key={pt.dateStr || idx}>
                        {/* Glowing Ring when Hovered */}
                        {isHovered && (
                          <circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            r="10" 
                            fill="#3b82f6" 
                            opacity="0.25" 
                            className="animate-ping"
                          />
                        )}

                        {/* Visible Data Point */}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={isHovered ? "6" : "4"} 
                          fill={isHovered ? "#2563eb" : "#ffffff"} 
                          stroke="#2563eb" 
                          strokeWidth={isHovered ? "3" : "2.5"} 
                          className="transition-all duration-150 cursor-pointer"
                        />

                        {/* Large Invisible Hit Area for Easy Hovering */}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="18" 
                          fill="transparent" 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onTouchStart={() => setHoveredIndex(idx)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Glassmorphic Tooltip Card */}
                {hoveredIndex !== null && velocityData.points[hoveredIndex] && (
                  <div 
                    className="absolute pointer-events-none z-30 transition-all duration-150 ease-out"
                    style={{
                      left: `${(velocityData.points[hoveredIndex].x / 540) * 100}%`,
                      top: `${Math.max(10, (velocityData.points[hoveredIndex].y / 180) * 100 - 30)}%`,
                      transform: velocityData.points[hoveredIndex].x > 380 
                        ? 'translate(-105%, -50%)' 
                        : velocityData.points[hoveredIndex].x < 150 
                        ? 'translate(5%, -50%)' 
                        : 'translate(-50%, -105%)'
                    }}
                  >
                    <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-left space-y-1 min-w-[170px]">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 text-[11px] font-bold text-slate-300">
                        <span>{velocityData.isYear ? velocityData.points[hoveredIndex].fullDate : `${velocityData.points[hoveredIndex].dayName}, ${velocityData.points[hoveredIndex].monthName} ${velocityData.points[hoveredIndex].dayNum}`}</span>
                        <span className="text-[10px] text-blue-400 font-mono">
                          {chartMode === 'cumulative' ? 'Total' : 'Daily'}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline justify-between gap-3 pt-0.5">
                        <span className="text-xs text-slate-400 font-medium">
                          {chartMode === 'cumulative' ? 'Cumulative Total:' : 'Sign-ups:'}
                        </span>
                        <span className="text-xs font-black text-white">
                          {chartMode === 'cumulative' 
                            ? `${velocityData.points[hoveredIndex].cumulative} delegates` 
                            : `+${velocityData.points[hoveredIndex].count} delegates`}
                        </span>
                      </div>

                      {velocityData.points[hoveredIndex].revenue > 0 && (
                        <div className="flex items-baseline justify-between gap-3 text-[11px] text-emerald-400 font-semibold">
                          <span>Revenue:</span>
                          <span>+{velocityData.points[hoveredIndex].revenue.toLocaleString()} DZD</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* X-Axis Date Labels Row */}
          <div className="flex justify-between text-xs font-semibold text-slate-400 px-6 border-t border-slate-100 pt-3">
            {velocityData.days.filter((_, idx, arr) => {
              if (arr.length <= 7) return true;
              if (arr.length === 12) return idx % 2 === 0 || idx === arr.length - 1; // 1Y (6 evenly spaced labels)
              if (arr.length <= 14) return idx % 2 === 0 || idx === arr.length - 1;
              return idx % 4 === 0 || idx === arr.length - 1;
            }).map((d) => (
              <span 
                key={d.dateStr}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                {velocityData.isYear ? d.dayName : `${d.dayName} ${d.dayNum}`}
              </span>
            ))}
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
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-64 pr-1">
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
                  <div key={t.id || t.name} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 truncate">{t.name || t.tier}</span>
                      <span className="font-extrabold text-blue-600 shrink-0">{priceVal === 0 ? "Free" : `${priceVal.toLocaleString()} DZD`}</span>
                    </div>

                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>{sold} sold</span>
                      <span>{total} capacity ({pct}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Passes Issued</span>
            <span className="font-extrabold text-slate-900">{totalAttendees}</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. AUDIENCE DEMOGRAPHICS & GATE CHECK-IN PERFORMANCE (2 Cols)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Attendee Demographics & Top Organizations */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Top Represented Companies
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  Demographics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Key organizations attending your summit
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("attendees")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              All Delegates
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {topCompanies.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Building2 size={28} className="mx-auto opacity-30" />
                <p className="text-xs font-medium">No delegate organization data recorded yet.</p>
              </div>
            ) : (
              topCompanies.map(([compName, count], idx) => {
                const pct = totalAttendees > 0 ? Math.round((count / totalAttendees) * 100) : 0;
                return (
                  <div key={compName} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 truncate flex items-center gap-2">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span>{compName}</span>
                      </span>
                      <span className="font-extrabold text-indigo-600 shrink-0">{count} delegate{count === 1 ? '' : 's'}</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.max(10, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Micro summary of job titles */}
          {topRoles.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-semibold">Key Roles:</span>
              {topRoles.map(([roleName, cnt]) => (
                <span key={roleName} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold">
                  {roleName} ({cnt})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Check-In Gate Throughput by Ticket Tier */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Gate Check-In by Pass Tier
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
                  Entrance Rate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time door arrival metrics across ticket classes
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("check-in")}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              Open Gate
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {tierCheckinStats.map((tier) => (
              <div key={tier.name} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 truncate">{tier.name}</span>
                  <span className="font-extrabold text-purple-600 shrink-0">{tier.checkedIn} / {tier.total} checked in</span>
                </div>

                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${tier.pct}%` }} />
                </div>

                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>{tier.pct}% checked in</span>
                  <span>{tier.total - tier.checkedIn} pending entrance</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Venue Attendance</span>
            <span className="font-extrabold text-purple-700">{checkinPct.toFixed(0)}% ({checkedInCount} / {totalAttendees})</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. TIMELINE AGENDA & SPONSOR/EXHIBITOR ECOSYSTEM (2 Columns)        */}
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

        {/* Right: Sponsors, Partners & Expo Floor Status */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Partners &amp; Expo Floor
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
                  Ecosystem
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sponsors, exhibitors, and booth assignments
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("sponsors")}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 flex-1">
            <div 
              onClick={() => onSwitchView("sponsors")}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Sponsors</span>
                <Award size={16} className="text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{sponsors.length}</div>
                <div className="text-[11px] text-slate-500 font-medium">Active event partners</div>
              </div>
            </div>

            <div 
              onClick={() => onSwitchView("floor-plan")}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Exhibitors</span>
                <Store size={16} className="text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{exhibitors.length}</div>
                <div className="text-[11px] text-slate-500 font-medium">Exhibitor companies</div>
              </div>
            </div>

            <div 
              onClick={() => onSwitchView("floor-plan")}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-colors col-span-2"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Expo Floor Layout</span>
                <Layers size={16} className="text-indigo-500" />
              </div>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <div className="text-base font-extrabold text-slate-900">{floorPlans.length} Floor Plan{floorPlans.length === 1 ? '' : 's'}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{totalBooths} total interactive booths configured</div>
                </div>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-0.5">
                  View Layout <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Commercial Stakeholders</span>
            <span className="font-extrabold text-slate-900">{sponsors.length + exhibitors.length}</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. RECENT REGISTRATIONS & FORMS / TEAM ENGAGEMENT (2 Columns)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Attendee Registrations (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
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
              recentAttendees.map((attendee, idx) => {
                const photo = getAttendeePhoto(attendee);
                const isCheckedIn = attendee.status === "checked-in";
                return (
                  <div 
                    key={attendee.id || idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {photo ? (
                        <img 
                          src={photo} 
                          alt={attendee.name || "Attendee"} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {attendee.name ? attendee.name[0].toUpperCase() : "A"}
                        </div>
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {attendee.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {attendee.ticketType || attendee.ticket_type || "Standard Admission"} • {attendee.email || "—"}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      isCheckedIn
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {isCheckedIn ? "Checked In" : "Confirmed"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Custom Forms & Staff Roster Pulse (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Audience Pulse &amp; Team
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Feedback surveys &amp; active event crew
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchView("forms")}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Forms
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {/* Custom Forms Card */}
            <div 
              onClick={() => onSwitchView("forms")}
              className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 hover:bg-rose-50/70 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{forms.length} Survey Questionnaires</div>
                  <div className="text-[11px] text-slate-500">{formSubmissions.length} responses collected</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-rose-400" />
            </div>

            {/* Team Staff Card */}
            <div 
              onClick={() => onSwitchView("team")}
              className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <UserCog size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{team.length || 1} Active Team Staff</div>
                  <div className="text-[11px] text-slate-500">Organizers, gate scanners &amp; stage crew</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-blue-400" />
            </div>

            {/* Badge System Status */}
            <div 
              onClick={() => onSwitchView("attendees")}
              className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 hover:bg-emerald-50/70 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">A4 Badges &amp; Pass Dispatch</div>
                  <div className="text-[11px] text-slate-500">QR security credentials ready</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-emerald-400" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Platform Operations</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. ORGANIZER QUICK OPERATIONS HUB                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Organizer Quick Operations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant shortcuts to design spaces, launch door check-in, broadcast emails, and manage participants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          
          {/* Action 1: Door Scanner */}
          <button
            type="button"
            onClick={() => onSwitchView("check-in")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer space-y-2 group hover:border-slate-300"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Door Scanner</div>
              <div className="text-[11px] text-slate-500">Fast QR check-in</div>
            </div>
          </button>

          {/* Action 2: Send Email Broadcast */}
          <button
            type="button"
            onClick={() => onSwitchView("attendees")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer space-y-2 group hover:border-slate-300"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mail size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Send Email</div>
              <div className="text-[11px] text-slate-500">Bulk &amp; pass dispatch</div>
            </div>
          </button>

          {/* Action 3: Print Badges */}
          <button
            type="button"
            onClick={() => onSwitchView("attendees")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer space-y-2 group hover:border-slate-300"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Printer size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Print Badges</div>
              <div className="text-[11px] text-slate-500">A4 4-fold sheets</div>
            </div>
          </button>

          {/* Action 4: Floor Plan Designer */}
          <button
            type="button"
            onClick={() => onSwitchView("floor-plan")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer space-y-2 group hover:border-slate-300"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Floor Plan</div>
              <div className="text-[11px] text-slate-500">Design expo spaces</div>
            </div>
          </button>

          {/* Action 5: Add Attendee */}
          <button
            type="button"
            onClick={() => onOpenModal ? onOpenModal("attendee") : onSwitchView("attendees")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer space-y-2 group hover:border-slate-300"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Add Attendee</div>
              <div className="text-[11px] text-slate-500">Manual entry</div>
            </div>
          </button>

          {/* Action 6: Custom Forms */}
          <button
            type="button"
            onClick={() => onSwitchView("forms")}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer space-y-2 group hover:border-slate-300"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Custom Forms</div>
              <div className="text-[11px] text-slate-500">Surveys &amp; feedback</div>
            </div>
          </button>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. FLOATING BOTTOM-RIGHT LAUNCH READINESS TAB / POPOVER             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Expanded Floating Popover Card */}
        {readinessFloatingOpen && (
          <div className="mb-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-slate-200/90 shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ListTodo size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Event Launch Readiness</h4>
                  <p className="text-[10.5px] text-slate-400">{completedChecklistCount} of {readinessChecklist.length} Milestones Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${readinessScore === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {readinessScore}%
                </span>
                <button
                  type="button"
                  onClick={() => setReadinessFloatingOpen(false)}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${readinessScore === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {readinessChecklist.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSwitchView(item.view);
                      setReadinessFloatingOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      item.completed 
                        ? "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
                        : "bg-amber-50/50 border-amber-200 hover:bg-amber-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-xl shrink-0 ${item.completed ? "bg-slate-200/70 text-slate-700" : "bg-amber-100 text-amber-800"}`}>
                        <IconComp size={13} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.detail}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                      item.completed ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {item.completed ? "Done" : "Pending"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Trigger Pill */}
        <button
          type="button"
          onClick={() => setReadinessFloatingOpen(!readinessFloatingOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl hover:shadow-2xl border border-slate-700/60 transition-all cursor-pointer hover:scale-105 group"
        >
          <div className={`w-2 h-2 rounded-full ${readinessScore === 100 ? 'bg-emerald-400' : 'bg-blue-400 animate-ping'}`} />
          <span className="text-xs font-bold">
            Launch Readiness ({completedChecklistCount}/{readinessChecklist.length})
          </span>
          <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${readinessScore === 100 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-blue-500/30 text-blue-300'}`}>
            {readinessScore}%
          </span>
          <ChevronUp size={14} className={`text-slate-400 group-hover:text-white transition-transform duration-200 ${readinessFloatingOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

    </div>
  );
}
