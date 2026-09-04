"use client";

import React, { useState, useMemo } from "react";
import { 
  BarChart3, TrendingUp, Users, Ticket, CheckCircle2, DollarSign, 
  Building2, Briefcase, Award, MapPin, Globe, Sparkles, Download, 
  Printer, Filter, RefreshCw, Calendar, PieChart, Layers, Store, 
  Truck, CheckSquare, Clock, ArrowUpRight, HelpCircle, UserCheck, 
  AlertCircle, ChevronRight, Share2, Compass, ShieldCheck, Utensils,
  Maximize2, ArrowRight, Check, Package, Plane, AlertTriangle
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useLanguage } from "../lib/i18n";
import { AnalyticsSkeleton } from "./SkeletonLoaders";

/**
 * AnalyticsView - Eventzone Intelligence Command Center
 * Spreads all audited platform analytics domains (Velocity, Revenue, Demographics,
 * Ingress, Forms, RSVPs, Sponsors, Booths, Logistics & Program Density) across a unified,
 * modern dashboard matching the platform's Logistics and Overview design standards.
 */
export default function AnalyticsView({ 
  state = {}, 
  onSwitchView,
  onOpenModal 
}) {
  const { t, isRTL } = useLanguage();

  // Extract all data domains from state
  const {
    attendees = [],
    tickets = [],
    influencers = [],
    eventDetails = {},
    pending = [],
    sessions = [],
    sponsors = [],
    exhibitors = [],
    floorPlans = [],
    forms = [],
    formSubmissions = [],
    rsvps = [],
    rsvpSettings = {},
    logisticsData = {},
    documents = []
  } = state;

  const currency = eventDetails.currency || "DZD";

  const getLocalizedSeniority = (level) => {
    if (!level) return t("seniority.general", "General Delegates");
    if (level.includes("C-Suite")) return t("seniority.cSuite", "C-Suite & Founders");
    if (level.includes("Directors")) return t("seniority.directors", "Directors & Leads");
    if (level.includes("Managers")) return t("seniority.managers", "Managers & Heads");
    if (level.includes("Engineers")) return t("seniority.engineers", "Engineers & Specialists");
    if (level.includes("Academics")) return t("seniority.academics", "Academics & Students");
    return t("seniority.general", "General Delegates");
  };
  const formatPrice = (amount) => {
    const num = Number(amount) || 0;
    return `${num.toLocaleString()} ${currency}`;
  };

  // Interactive Timeframe Filters & Custom Range
  const [timeframe, setTimeframe] = useState("all"); // all | today | 7d | 14d | 30d | custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [velocityChartType, setVelocityChartType] = useState("cumulative"); // cumulative | daily
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  // Dynamic Form Question Selector
  const [selectedQuestionKey, setSelectedQuestionKey] = useState("");

  // Helper to parse attendee registration date
  const parseAttendeeDate = (a) => {
    if (!a) return null;
    const raw = a.registeredDate || a.registered_at || a.created_at || a.createdAt || a.date;
    if (!raw) return null;
    try {
      if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
      const dStr = typeof raw === "string" ? (raw.includes("T") ? raw : `${raw}T00:00:00`) : raw;
      const dt = new Date(dStr);
      return isNaN(dt.getTime()) ? null : dt;
    } catch {
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. FILTERED ATTENDEES (Responsive to Timeframe & Custom Date Range)
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredAttendees = useMemo(() => {
    if (timeframe === "all" && !customStartDate && !customEndDate) {
      return attendees;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return attendees.filter(a => {
      const regDate = parseAttendeeDate(a);
      if (!regDate) {
        return false;
      }

      if (timeframe === "today") {
        return regDate >= todayStart && regDate <= todayEnd;
      } else if (timeframe === "7d") {
        const past7 = new Date(todayStart);
        past7.setDate(past7.getDate() - 7);
        return regDate >= past7 && regDate <= todayEnd;
      } else if (timeframe === "14d") {
        const past14 = new Date(todayStart);
        past14.setDate(past14.getDate() - 14);
        return regDate >= past14 && regDate <= todayEnd;
      } else if (timeframe === "30d") {
        const past30 = new Date(todayStart);
        past30.setDate(past30.getDate() - 30);
        return regDate >= past30 && regDate <= todayEnd;
      } else if (timeframe === "custom") {
        if (customStartDate) {
          const start = new Date(customStartDate + "T00:00:00");
          if (!isNaN(start.getTime()) && regDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate + "T23:59:59");
          if (!isNaN(end.getTime()) && regDate > end) return false;
        }
        return true;
      }

      return true;
    });
  }, [attendees, timeframe, customStartDate, customEndDate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CORE KPIS & FINANCIAL METRICS
  // ─────────────────────────────────────────────────────────────────────────────
  const totalAttendeesCount = attendees.length;
  const filteredCount = filteredAttendees.length;
  const capacity = Number(eventDetails.capacity) || 0;
  const capacityPct = capacity > 0 ? Math.min(100, (filteredCount / capacity) * 100) : 0;

  const checkedInCount = filteredAttendees.filter(a => a.status === "checked-in" || a.status === "checked_in" || a.checkedIn || a.checked_in).length;
  const checkinPct = filteredCount > 0 ? (checkedInCount / filteredCount) * 100 : 0;

  // Real Ticket Price & Gross Estimated Revenue Calculation (Responsive to Timeframe)
  const totalEstimatedRevenue = useMemo(() => {
    return filteredAttendees.reduce((acc, att) => {
      const attTicket = (att.ticketType || att.ticket_type || "").trim().toLowerCase();
      const matched = tickets.find(t => 
        (t.name || t.tier || "").trim().toLowerCase() === attTicket ||
        String(t.id) === String(att.ticketType)
      );
      const price = matched ? (parseFloat(matched.price) || 0) : 0;
      return acc + price;
    }, 0);
  }, [filteredAttendees, tickets]);

  const avgTicketPrice = tickets.length > 0
    ? tickets.reduce((acc, t) => acc + (parseFloat(t.price) || 0), 0) / tickets.length
    : 0;

  const avgRevenuePerAttendee = filteredCount > 0
    ? Math.round(totalEstimatedRevenue / filteredCount)
    : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REGISTRATION VELOCITY & TIMELINE CURVE (Responsive to Filtered Attendees)
  // ─────────────────────────────────────────────────────────────────────────────
  const velocityData = useMemo(() => {
    if (filteredAttendees.length === 0) {
      return { points: [], maxCumulative: 10, maxDaily: 5, totalCumulative: 0, peakDay: null, avgPace: "0.0" };
    }

    const datesMap = {};
    filteredAttendees.forEach(a => {
      const dt = parseAttendeeDate(a);
      const dateKey = dt ? dt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      datesMap[dateKey] = (datesMap[dateKey] || 0) + 1;
    });

    let sortedDateKeys = Object.keys(datesMap).sort();
    
    // Fill in dates for standard timeframes
    if (timeframe === "7d" || timeframe === "14d" || timeframe === "30d") {
      const numDays = timeframe === "30d" ? 30 : timeframe === "14d" ? 14 : 7;
      const now = new Date();
      sortedDateKeys = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = d.toISOString().split("T")[0];
        sortedDateKeys.push(k);
        if (!datesMap[k]) datesMap[k] = 0;
      }
    } else if (timeframe === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        sortedDateKeys = [];
        const cur = new Date(start);
        while (cur <= end) {
          const k = cur.toISOString().split("T")[0];
          sortedDateKeys.push(k);
          if (!datesMap[k]) datesMap[k] = 0;
          cur.setDate(cur.getDate() + 1);
        }
      }
    } else if (sortedDateKeys.length <= 1) {
      const single = sortedDateKeys[0] || new Date().toISOString().split("T")[0];
      const baseDate = new Date(single);
      sortedDateKeys = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        const k = d.toISOString().split("T")[0];
        sortedDateKeys.push(k);
        if (k !== single && !datesMap[k]) datesMap[k] = 0;
      }
    }

    let runningSum = 0;
    let peakCount = 0;
    let peakDate = sortedDateKeys[0] || "";

    const points = sortedDateKeys.map(dateKey => {
      const daily = datesMap[dateKey] || 0;
      runningSum += daily;
      if (daily > peakCount) {
        peakCount = daily;
        peakDate = dateKey;
      }
      const label = new Date(dateKey + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return {
        date: dateKey,
        label,
        daily,
        cumulative: runningSum
      };
    });

    const maxCumulative = Math.max(runningSum, capacity > 0 ? capacity : 10, 10);
    const maxDaily = Math.max(...points.map(p => p.daily), 5);
    const avgPace = (runningSum / Math.max(1, points.length)).toFixed(1);

    return {
      points,
      maxCumulative,
      maxDaily,
      totalCumulative: runningSum,
      peakDay: { date: peakDate, count: peakCount },
      avgPace
    };
  }, [filteredAttendees, capacity, timeframe, customStartDate, customEndDate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TICKET SPLITS & QUOTA PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const ticketTiersList = useMemo(() => {
    if (tickets.length > 0) return tickets;
    const uniqueNames = [...new Set(attendees.map(a => a.ticketType || a.ticket_type).filter(Boolean))];
    if (uniqueNames.length === 0) return [{ name: "Standard Admission", price: 0, quantity: capacity || 100 }];
    return uniqueNames.map(name => ({ name, price: 0, quantity: 0 }));
  }, [tickets, attendees, capacity]);

  const ticketPerformance = useMemo(() => {
    const colors = [
      { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50", hex: "#2563eb" },
      { bg: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-200", light: "bg-indigo-50", hex: "#4f46e5" },
      { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50", hex: "#059669" },
      { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-200", light: "bg-amber-50", hex: "#d97706" },
      { bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-200", light: "bg-rose-50", hex: "#e11d48" },
      { bg: "bg-purple-600", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50", hex: "#9333ea" },
      { bg: "bg-cyan-600", text: "text-cyan-600", border: "border-cyan-200", light: "bg-cyan-50", hex: "#0891b2" }
    ];

    return ticketTiersList.map((t, idx) => {
      const tierName = t.name || t.tier || "General";
      const price = parseFloat(t.price) || 0;
      const quota = Number(t.quantity || t.capacity || t.total) || 0;
      
      const tierAttendees = filteredAttendees.filter(a => {
        const attType = (a.ticketType || a.ticket_type || "").trim().toLowerCase();
        return attType === tierName.toLowerCase() || String(a.ticketType) === String(t.id);
      });

      const count = tierAttendees.length;
      const checkedIn = tierAttendees.filter(a => a.status === "checked-in" || a.status === "checked_in" || a.checkedIn || a.checked_in).length;
      const tierRevenue = count * price;
      const pctOfTotal = filteredCount > 0 ? (count / filteredCount) * 100 : 0;
      const quotaPct = quota > 0 ? Math.min(100, (count / quota) * 100) : null;
      const checkinPct = count > 0 ? (checkedIn / count) * 100 : 0;

      return {
        id: t.id || idx,
        name: tierName,
        price,
        quota,
        count,
        checkedIn,
        checkinPct,
        revenue: tierRevenue,
        pctOfTotal,
        quotaPct,
        color: colors[idx % colors.length]
      };
    });
  }, [ticketTiersList, filteredAttendees, filteredCount]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. DEMOGRAPHICS & AUDIENCE INTELLIGENCE
  // ─────────────────────────────────────────────────────────────────────────────
  const demographics = useMemo(() => {
    const compMap = {};
    const roleMap = {};
    const seniorityMap = {
      "C-Suite & Founders": 0,
      "Directors & Leads": 0,
      "Managers & Heads": 0,
      "Engineers & Specialists": 0,
      "Academics & Students": 0,
      "General Delegates": 0
    };
    const geoMap = {};

    filteredAttendees.forEach(a => {
      const comp = (a.company || a.organization || "").trim() || "Independent / Other";
      compMap[comp] = (compMap[comp] || 0) + 1;

      const job = (a.jobTitle || a.role || a.job_title || "").trim();
      const jobDisplay = job || "Delegate / Attendee";
      roleMap[jobDisplay] = (roleMap[jobDisplay] || 0) + 1;

      const lowerJob = job.toLowerCase();
      if (lowerJob.match(/\b(ceo|cto|cfo|coo|cmo|cro|cio|founder|co-founder|president|partner|owner|executive)\b/)) {
        seniorityMap["C-Suite & Founders"]++;
      } else if (lowerJob.match(/\b(director|vp|vice president|head of|lead|principal)\b/)) {
        seniorityMap["Directors & Leads"]++;
      } else if (lowerJob.match(/\b(manager|supervisor|coordinator|team lead)\b/)) {
        seniorityMap["Managers & Heads"]++;
      } else if (lowerJob.match(/\b(engineer|developer|architect|designer|analyst|specialist|consultant|technician)\b/)) {
        seniorityMap["Engineers & Specialists"]++;
      } else if (lowerJob.match(/\b(student|intern|researcher|phd|professor|academic|doctor)\b/)) {
        seniorityMap["Academics & Students"]++;
      } else {
        seniorityMap["General Delegates"]++;
      }

      let country = a.country || a.location || a.city || a.address || "";
      if (!country && a.phone) {
        if (a.phone.startsWith("+213") || a.phone.startsWith("0")) country = "Algeria";
        else if (a.phone.startsWith("+33")) country = "France";
        else if (a.phone.startsWith("+1")) country = "United States / Canada";
        else if (a.phone.startsWith("+44")) country = "United Kingdom";
        else if (a.phone.startsWith("+971")) country = "UAE";
        else if (a.phone.startsWith("+966")) country = "Saudi Arabia";
        else if (a.phone.startsWith("+49")) country = "Germany";
      }
      if (!country) country = "Local / Regional";
      geoMap[country] = (geoMap[country] || 0) + 1;
    });

    const topCompanies = Object.entries(compMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        pct: filteredCount > 0 ? (count / filteredCount) * 100 : 0
      }));

    const topRoles = Object.entries(roleMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([title, count]) => ({
        title,
        count,
        pct: filteredCount > 0 ? (count / filteredCount) * 100 : 0
      }));

    const topGeos = Object.entries(geoMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([location, count]) => ({
        location,
        count,
        pct: filteredCount > 0 ? (count / filteredCount) * 100 : 0
      }));

    const seniorityList = Object.entries(seniorityMap)
      .filter(([_, count]) => count > 0 || filteredCount === 0)
      .map(([level, count]) => ({
        level,
        count,
        pct: filteredCount > 0 ? (count / filteredCount) * 100 : 0
      }));

    return {
      uniqueCompaniesCount: Object.keys(compMap).length,
      topCompanies,
      topRoles,
      seniorityList,
      topGeos
    };
  }, [filteredAttendees, filteredCount]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. DYNAMIC FORM QUESTION CROSS-TABULATION
  // ─────────────────────────────────────────────────────────────────────────────
  const availableFormQuestions = useMemo(() => {
    const questionList = [];
    const seenKeys = new Set();

    forms.forEach(form => {
      const fields = form.fields || form.questions || form.schema || [];
      fields.forEach(field => {
        const key = field.id || field.name || field.label || field.title;
        const label = field.label || field.title || field.name || key;
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          questionList.push({
            value: key,
            label: `${label} (${form.title || "Form"})`,
            originalLabel: label
          });
        }
      });
    });

    attendees.forEach(a => {
      const answers = a.answers || a.customAnswers || a.formAnswers || {};
      if (typeof answers === "object") {
        Object.keys(answers).forEach(k => {
          if (!seenKeys.has(k) && !k.startsWith("_")) {
            seenKeys.add(k);
            const formattedLabel = k
              .replace(/_/g, " ")
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, str => str.toUpperCase())
              .trim();
            questionList.push({
              value: k,
              label: formattedLabel,
              originalLabel: formattedLabel
            });
          }
        });
      }
    });

    return questionList;
  }, [forms, attendees]);

  const activeQuestionKey = selectedQuestionKey || (availableFormQuestions[0]?.value || "");

  const activeQuestionAnalysis = useMemo(() => {
    if (!activeQuestionKey) return null;

    const responseCounts = {};
    let totalAnswered = 0;

    filteredAttendees.forEach(a => {
      const answers = a.answers || a.customAnswers || a.formAnswers || {};
      let val = answers[activeQuestionKey];
      
      if (val === undefined || val === null || val === "") {
        if (activeQuestionKey === "ticketType") val = a.ticketType;
        if (activeQuestionKey === "company") val = a.company;
        if (activeQuestionKey === "jobTitle") val = a.jobTitle;
      }

      if (val !== undefined && val !== null && String(val).trim() !== "") {
        totalAnswered++;
        if (Array.isArray(val)) {
          val.forEach(item => {
            const strItem = String(item).trim();
            if (strItem) responseCounts[strItem] = (responseCounts[strItem] || 0) + 1;
          });
        } else {
          const strVal = String(val).trim();
          responseCounts[strVal] = (responseCounts[strVal] || 0) + 1;
        }
      }
    });

    const options = Object.entries(responseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([answer, count]) => ({
        answer,
        count,
        pct: totalAnswered > 0 ? (count / totalAnswered) * 100 : 0
      }));

    const questionMeta = availableFormQuestions.find(q => q.value === activeQuestionKey);

    return {
      key: activeQuestionKey,
      label: questionMeta?.originalLabel || activeQuestionKey,
      totalAnswered,
      totalAttendees: filteredCount,
      responseRatePct: filteredCount > 0 ? (totalAnswered / filteredCount) * 100 : 0,
      options
    };
  }, [activeQuestionKey, filteredAttendees, availableFormQuestions, filteredCount]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. RSVP & GUEST LIST TELEMETRY
  // ─────────────────────────────────────────────────────────────────────────────
  const rsvpMetrics = useMemo(() => {
    const total = rsvps.length;
    if (total === 0) {
      return {
        total: 0,
        attending: 0,
        maybe: 0,
        declined: 0,
        pending: 0,
        attendingPct: 0,
        totalPlusOnes: 0,
        totalHeadcount: 0,
        dietary: []
      };
    }

    let attending = 0;
    let maybe = 0;
    let declined = 0;
    let pendingRsvp = 0;
    let totalPlusOnes = 0;
    const dietaryMap = {};

    rsvps.forEach(r => {
      const status = (r.status || r.response || "pending").toLowerCase();
      const plusOnes = Number(r.plus_ones || r.plusOnes || r.guests_count || 0);

      if (status === "attending" || status === "yes" || status === "going") {
        attending++;
        totalPlusOnes += plusOnes;
      } else if (status === "maybe" || status === "tentative") {
        maybe++;
      } else if (status === "declined" || status === "no" || status === "not going") {
        declined++;
      } else {
        pendingRsvp++;
      }

      const diet = (r.meal_preference || r.dietary || r.dietary_requirements || "").trim();
      if (diet) {
        dietaryMap[diet] = (dietaryMap[diet] || 0) + (1 + plusOnes);
      }
    });

    const attendingPct = total > 0 ? (attending / total) * 100 : 0;
    const totalHeadcount = attending + totalPlusOnes;

    const dietary = Object.entries(dietaryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: totalHeadcount > 0 ? (count / totalHeadcount) * 100 : 0
      }));

    return {
      total,
      attending,
      maybe,
      declined,
      pending: pendingRsvp,
      attendingPct,
      totalPlusOnes,
      totalHeadcount,
      dietary
    };
  }, [rsvps]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. EXHIBITORS, SPONSORS & BOOTH MATRIX
  // ─────────────────────────────────────────────────────────────────────────────
  const exhibitionMetrics = useMemo(() => {
    const sponsorTiers = {
      title: { name: "Title / Headline", count: 0, revenue: 0, color: "text-purple-600 bg-purple-50 border-purple-200" },
      platinum: { name: "Platinum", count: 0, revenue: 0, color: "text-slate-700 bg-slate-100 border-slate-300" },
      gold: { name: "Gold", count: 0, revenue: 0, color: "text-amber-600 bg-amber-50 border-amber-200" },
      silver: { name: "Silver", count: 0, revenue: 0, color: "text-slate-500 bg-slate-50 border-slate-200" },
      bronze: { name: "Bronze", count: 0, revenue: 0, color: "text-amber-800 bg-amber-50/50 border-amber-200" }
    };

    let totalSponsorRevenue = 0;
    sponsors.forEach(s => {
      const tierKey = (s.tier || "silver").toLowerCase();
      const amount = parseFloat(s.amount || s.contribution || 0) || 0;
      totalSponsorRevenue += amount;

      if (sponsorTiers[tierKey]) {
        sponsorTiers[tierKey].count++;
        sponsorTiers[tierKey].revenue += amount;
      } else {
        sponsorTiers.silver.count++;
        sponsorTiers.silver.revenue += amount;
      }
    });

    let totalBooths = 0;
    let bookedBooths = 0;
    let reservedBooths = 0;

    floorPlans.forEach(plan => {
      (plan.elements || []).forEach(el => {
        if (el.type && (el.type.startsWith("booth") || el.type === "exhibitor-space")) {
          totalBooths++;
          if (el.status === "booked" || el.status === "occupied" || el.status === "checked_in" || el.exhibitorId) {
            bookedBooths++;
          } else if (el.status === "reserved") {
            reservedBooths++;
          }
        }
      });
    });

    const availableBooths = Math.max(0, totalBooths - bookedBooths - reservedBooths);
    const boothOccupancyPct = totalBooths > 0 ? (bookedBooths / totalBooths) * 100 : (exhibitors.length > 0 ? 100 : 0);

    return {
      totalSponsors: sponsors.length,
      totalSponsorRevenue,
      sponsorTiers: Object.values(sponsorTiers).filter(t => t.count > 0 || sponsors.length === 0),
      totalExhibitors: exhibitors.length,
      totalBooths,
      bookedBooths,
      reservedBooths,
      availableBooths,
      boothOccupancyPct
    };
  }, [sponsors, floorPlans, exhibitors]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. LOGISTICS & OPERATIONAL READINESS
  // ─────────────────────────────────────────────────────────────────────────────
  const logisticsMetrics = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalLogisticsBudget = 0;
    let spentBudget = 0;

    const sections = ["catering", "av", "transport", "accommodation", "vendors"];
    sections.forEach(sec => {
      const items = logisticsData[sec] || [];
      if (Array.isArray(items)) {
        items.forEach(item => {
          totalTasks++;
          if (item.status === "completed" || item.status === "delivered" || item.completed) {
            completedTasks++;
          }
          const cost = parseFloat(item.cost || item.amount || 0) || 0;
          totalLogisticsBudget += cost;
          if (item.status === "completed" || item.isPaid) {
            spentBudget += cost;
          }
        });
      }
    });

    const taskReadinessPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      taskReadinessPct,
      totalBudget: totalLogisticsBudget,
      spentBudget
    };
  }, [logisticsData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. EXPORT REPORT GENERATOR (CSV & EXECUTIVE PRINT)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const listToExport = filteredAttendees.length > 0 ? filteredAttendees : attendees;
    if (listToExport.length === 0) {
      alert("No attendee records to export.");
      return;
    }

    const headers = [
      "Attendee ID",
      "Full Name",
      "Email Address",
      "Ticket Tier",
      "Status",
      "Registered Date",
      "Company / Organization",
      "Job Title",
      "Is Speaker"
    ];

    const rows = listToExport.map(a => [
      `"${a.id || ""}"`,
      `"${(a.name || "").replace(/"/g, '""')}"`,
      `"${(a.email || "").replace(/"/g, '""')}"`,
      `"${(a.ticketType || a.ticket_type || "Standard Admission").replace(/"/g, '""')}"`,
      `"${a.status || "registered"}"`,
      `"${a.registeredDate || a.registered_at || ""}"`,
      `"${(a.company || "").replace(/"/g, '""')}"`,
      `"${(a.jobTitle || "").replace(/"/g, '""')}"`,
      a.isSpeaker ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event-analytics-report-${eventDetails.title ? eventDetails.title.toLowerCase().replace(/\s+/g, "-") : "eventzone"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintExecutiveReport = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      alert("Please allow popups to open the Executive Briefing print document.");
      return;
    }

    const eventTitle = eventDetails.title || "Event";
    const startDate = eventDetails.start_date ? new Date(eventDetails.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";
    const endDate = eventDetails.end_date ? new Date(eventDetails.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
    const dateRangeStr = endDate && endDate !== startDate ? `${startDate} – ${endDate}` : startDate;
    const locationStr = eventDetails.location || eventDetails.venue || eventDetails.city || "Algiers, Algeria";
    const organizerName = eventDetails.organizer_name || "Eventzone Management";
    const reportRef = `EZ-EB-${Date.now().toString(36).toUpperCase()}`;
    const generatedDateStr = new Date().toLocaleString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    // Total ticket calculations
    const totalTiersCount = ticketPerformance.reduce((acc, t) => acc + t.count, 0);
    const totalTiersQuota = ticketPerformance.reduce((acc, t) => acc + (t.quota || 0), 0);
    const totalTiersRev = ticketPerformance.reduce((acc, t) => acc + t.revenue, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Executive Briefing — ${eventTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 28px 36px;
              line-height: 1.45;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
              .avoid-break { break-inside: avoid; page-break-inside: avoid; }
            }

            /* Document Top Bar */
            .doc-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 18px;
              margin-bottom: 20px;
            }
            .brand-line {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .brand-name {
              font-size: 22px;
              font-weight: 800;
              color: #1e3a8a;
              letter-spacing: -0.5px;
            }
            .report-pill {
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              background: #eff6ff;
              color: #2563eb;
              border: 1px solid #bfdbfe;
              padding: 2px 7px;
              border-radius: 4px;
            }
            .event-name {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }
            .event-meta {
              font-size: 11px;
              color: #64748b;
              margin-top: 3px;
              display: flex;
              gap: 12px;
            }
            .meta-item { display: flex; align-items: center; gap: 4px; }
            .doc-meta {
              text-align: right;
              font-size: 10px;
              color: #64748b;
            }
            .doc-meta strong {
              display: block;
              font-size: 11.5px;
              color: #0f172a;
              font-weight: 700;
            }

            /* Top KPI Ribbon */
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 18px;
            }
            .kpi-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 10px 12px;
              page-break-inside: avoid;
            }
            .kpi-title {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
            }
            .kpi-num {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }
            .kpi-caption {
              font-size: 9.5px;
              font-weight: 600;
              color: #2563eb;
              margin-top: 2px;
            }

            /* Section Headings */
            .sec-heading {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              color: #1e293b;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 4px;
              margin-top: 16px;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
            }

            /* Standard Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
              margin-bottom: 14px;
            }
            th {
              background: #f1f5f9;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.4px;
              padding: 6px 8px;
              text-align: left;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
            }
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
            }
            tr:nth-child(even) td { background: #fbfcfe; }
            .total-tr td {
              background: #f1f5f9 !important;
              font-weight: 800;
              color: #0f172a;
              border-top: 1.5px solid #94a3b8;
              border-bottom: 1.5px solid #94a3b8;
            }

            /* 2-column layout */
            .columns-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 14px;
            }

            /* Mini Progress Bars */
            .meter-track {
              background: #e2e8f0;
              border-radius: 99px;
              height: 5px;
              width: 100%;
              overflow: hidden;
              margin-top: 3px;
            }
            .meter-fill {
              background: #2563eb;
              height: 100%;
              border-radius: 99px;
            }

            /* Seniority & Demographics List */
            .stat-list {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .stat-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
            }
            .stat-name { font-weight: 600; color: #334155; }
            .stat-val { font-weight: 800; color: #0f172a; }

            /* Sign-off footer */
            .signoff-section {
              margin-top: 24px;
              padding-top: 14px;
              border-top: 1.5px solid #e2e8f0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              font-size: 10px;
              color: #64748b;
              page-break-inside: avoid;
            }
            .sign-box {
              margin-top: 24px;
              border-top: 1px solid #94a3b8;
              padding-top: 4px;
              font-weight: 700;
              color: #1e293b;
            }
            .confidential-tag {
              margin-top: 14px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #1e293b; color: #ffffff; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700;">Executive Intelligence Briefing — Document Preview</span>
            <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 6px; cursor: pointer;">
              Print Document / Save PDF
            </button>
          </div>

          <!-- Document Header -->
          <div class="doc-header">
            <div>
              <div class="brand-line">
                <span class="brand-name">eventzone</span>
                <span class="report-pill">Executive Briefing</span>
              </div>
              <div class="event-name">${eventTitle}</div>
              <div class="event-meta">
                <span class="meta-item">📅 ${dateRangeStr}</span>
                <span class="meta-item">📍 ${locationStr}</span>
                <span class="meta-item">👤 ${organizerName}</span>
              </div>
            </div>
            <div class="doc-meta">
              <strong>REF: ${reportRef}</strong>
              <div>Generated: ${generatedDateStr}</div>
              <div>Classification: Confidential / Board Briefing</div>
            </div>
          </div>

          <!-- KPI Summary Strip -->
          <div class="kpi-row">
            <div class="kpi-box">
              <div class="kpi-title">Total Registered</div>
              <div class="kpi-num">${totalAttendeesCount}</div>
              <div class="kpi-caption">${capacity > 0 ? `${capacityPct.toFixed(1)}% of ${capacity} cap` : "Confirmed delegates"}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Gross Revenue</div>
              <div class="kpi-num">${totalEstimatedRevenue.toLocaleString()} DZD</div>
              <div class="kpi-caption">${avgRevenuePerAttendee.toLocaleString()} DZD ARPA</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Live Ingress Rate</div>
              <div class="kpi-num">${checkinPct.toFixed(1)}%</div>
              <div class="kpi-caption">${checkedInCount} of ${totalAttendeesCount} checked in</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Organizations</div>
              <div class="kpi-num">${demographics.uniqueCompaniesCount}</div>
              <div class="kpi-caption">${sponsors.length} sponsors & partners</div>
            </div>
          </div>

          <!-- Ticket Economics Table -->
          <div class="avoid-break">
            <div class="sec-heading">
              <span>1. Ticket Tier Economics & Quota Performance</span>
              <span>Currency: DZD</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Ticket Tier</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Sold / Quota</th>
                  <th style="text-align: right;">Capacity %</th>
                  <th style="text-align: right;">Check-in Rate</th>
                  <th style="text-align: right;">Gross Yield</th>
                </tr>
              </thead>
              <tbody>
                ${ticketPerformance.map(t => `
                  <tr>
                    <td style="font-weight: 700;">${t.name}</td>
                    <td style="text-align: right;">${t.price > 0 ? `${t.price.toLocaleString()} DZD` : "Free"}</td>
                    <td style="text-align: right;">${t.count} ${t.quota > 0 ? `/ ${t.quota}` : ""}</td>
                    <td style="text-align: right;">${t.quotaPct !== null ? `${t.quotaPct.toFixed(0)}%` : "—"}</td>
                    <td style="text-align: right;">${t.checkinPct.toFixed(0)}% (${t.checkedIn})</td>
                    <td style="text-align: right; font-weight: 700; color: #0f172a;">${t.revenue.toLocaleString()} DZD</td>
                  </tr>
                `).join("")}
                <tr class="total-tr">
                  <td>TOTAL / BLENDED</td>
                  <td style="text-align: right;">${avgTicketPrice > 0 ? `${Math.round(avgTicketPrice).toLocaleString()} DZD avg` : "—"}</td>
                  <td style="text-align: right;">${totalTiersCount} ${totalTiersQuota > 0 ? `/ ${totalTiersQuota}` : ""}</td>
                  <td style="text-align: right;">${capacity > 0 ? `${capacityPct.toFixed(0)}%` : "100%"}</td>
                  <td style="text-align: right;">${checkinPct.toFixed(0)}% (${checkedInCount})</td>
                  <td style="text-align: right;">${totalTiersRev.toLocaleString()} DZD</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Dual Column: Audience & Seniority -->
          <div class="columns-2 avoid-break">
            <!-- Left: Seniority Distribution -->
            <div>
              <div class="sec-heading">
                <span>2. Audience Seniority Hierarchy</span>
              </div>
              <div class="stat-list">
                ${demographics.seniorityList.map(s => `
                  <div>
                    <div class="stat-item">
                      <span class="stat-name">${s.level}</span>
                      <span class="stat-val">${s.count} (${s.pct.toFixed(0)}%)</span>
                    </div>
                    <div class="meter-track">
                      <div class="meter-fill" style="width: ${Math.max(4, s.pct)}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Right: Top Represented Companies -->
            <div>
              <div class="sec-heading">
                <span>3. Key Participating Organizations</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Company / Entity</th>
                    <th style="text-align: right;">Delegates</th>
                    <th style="text-align: right;">Share</th>
                  </tr>
                </thead>
                <tbody>
                  ${demographics.topCompanies.slice(0, 5).map(c => `
                    <tr>
                      <td style="font-weight: 600;">${c.name}</td>
                      <td style="text-align: right; font-weight: 700;">${c.count}</td>
                      <td style="text-align: right;">${c.pct.toFixed(1)}%</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Dual Column: Sponsors & Operational Status -->
          <div class="columns-2 avoid-break">
            <!-- Left: Sponsorship & Partners -->
            <div>
              <div class="sec-heading">
                <span>4. Sponsorship & Exhibition Matrix</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Tier / Category</th>
                    <th style="text-align: right;">Count</th>
                    <th style="text-align: right;">Yield</th>
                  </tr>
                </thead>
                <tbody>
                  ${exhibitionMetrics.sponsorTiers.length > 0 ? exhibitionMetrics.sponsorTiers.map(t => `
                    <tr>
                      <td style="font-weight: 600;">${t.name}</td>
                      <td style="text-align: right; font-weight: 700;">${t.count}</td>
                      <td style="text-align: right;">${t.revenue.toLocaleString()} DZD</td>
                    </tr>
                  `).join("") : `
                    <tr>
                      <td colspan="3" style="text-align: center; color: #94a3b8; padding: 10px;">${sponsors.length} sponsors registered</td>
                    </tr>
                  `}
                  <tr class="total-tr">
                    <td>BOOTH OCCUPANCY</td>
                    <td style="text-align: right;">${exhibitionMetrics.bookedBooths} / ${exhibitionMetrics.totalBooths || exhibitors.length}</td>
                    <td style="text-align: right;">${exhibitionMetrics.boothOccupancyPct.toFixed(0)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Right: Operations & Logistics Snapshot -->
            <div>
              <div class="sec-heading">
                <span>5. Operational Telemetry & Program</span>
              </div>
              <div class="stat-list" style="gap: 8px;">
                <div class="stat-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                  <span class="stat-name">Program Sessions & Tracks:</span>
                  <span class="stat-val">${sessions.length} sessions</span>
                </div>
                <div class="stat-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                  <span class="stat-name">Exhibiting Companies:</span>
                  <span class="stat-val">${exhibitors.length} exhibitors</span>
                </div>
                <div class="stat-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                  <span class="stat-name">RSVP Attending Headcount:</span>
                  <span class="stat-val">${rsvpMetrics.totalHeadcount} confirmed guests</span>
                </div>
                <div class="stat-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                  <span class="stat-name">Logistics Readiness:</span>
                  <span class="stat-val">${logisticsMetrics.totalTasks > 0 ? `${Math.round((logisticsMetrics.completedTasks / logisticsMetrics.totalTasks) * 100)}% (${logisticsMetrics.completedTasks}/${logisticsMetrics.totalTasks})` : "100% Ready"}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sign-Off & Confidentiality Statement -->
          <div class="signoff-section avoid-break">
            <div>
              <div>Report Prepared By:</div>
              <div class="sign-box">Eventzone Operations & Analytics Engine</div>
            </div>
            <div>
              <div>Executive Sign-Off / Approval:</div>
              <div class="sign-box">${organizerName} — Event Director</div>
            </div>
          </div>

          <div class="confidential-tag">
            Eventzone Platform © 2026 • Confidential Executive Audit Document • Page 1 of 1
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER (Spread seamlessly across clean dashboard sections)
  // ─────────────────────────────────────────────────────────────────────────────
  if (state?.isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* ─────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
      ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none text-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("analytics.title", "Event Analytics & Intelligence")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("analytics.subtitle", "Comprehensive command center for registration velocity, ticket economics, audience demographics, live check-in ingress, and venue telemetry.")}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Download full attendees CSV manifest"
          >
            <Download size={14} />
            <span>{t("analytics.exportCsv", "Export Manifest (CSV)")}</span>
          </button>

          <button
            onClick={handlePrintExecutiveReport}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Print executive briefing summary"
          >
            <Printer size={14} />
            <span>{t("analytics.printBriefing", "Executive Briefing")}</span>
          </button>

          <button
            onClick={() => onSwitchView && onSwitchView("check-in")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 size={16} />
            <span>{t("analytics.openCheckin", "Check-in Scanner")}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. EXECUTIVE KPI CARDS STRIP
       ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-start">
        {/* Card 1: Total Delegates */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("analytics.totalDelegates", "Total Delegates")}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              <bdi dir="ltr">{totalAttendeesCount}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <bdi dir="ltr" className="text-blue-600 font-bold">{capacity > 0 ? `${capacityPct.toFixed(1)}%` : "100%"}</bdi> {capacity > 0 ? t("analytics.ofCapacityCap", "of {capacity} cap").replace("{capacity}", capacity) : t("analytics.ofCapacity", "of capacity")}
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, capacityPct || 100)}%` }} />
          </div>
        </div>

        {/* Card 2: Gross Ticket Sales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("analytics.grossRevenue", "Gross Ticket Sales")}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              <bdi dir="ltr">{formatPrice(totalEstimatedRevenue)}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
              <bdi dir="ltr">{formatPrice(avgRevenuePerAttendee)}</bdi> <span>{t("analytics.arpaLabel", "ARPA")}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: totalEstimatedRevenue > 0 ? "100%" : "0%" }} />
          </div>
        </div>

        {/* Card 3: Live Check-in */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("analytics.liveCheckin", "Live Check-In")}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              <bdi dir="ltr">{checkinPct.toFixed(1)}%</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <bdi dir="ltr" className="text-indigo-600 font-bold">{checkedInCount} / {totalAttendeesCount}</bdi> <span>{t("analytics.presentRatio", "present")}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${checkinPct}%` }} />
          </div>
        </div>

        {/* Card 4: Organizations */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("analytics.companies", "Organizations")}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              <bdi dir="ltr">{demographics.uniqueCompaniesCount}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-amber-600">
              {t("analytics.uniqueCompaniesRepresented", "Unique companies represented")}
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, demographics.uniqueCompaniesCount * 8)}%` }} />
          </div>
        </div>

        {/* Card 5: Sponsors & Booths */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("analytics.sponsorsBooths", "Sponsors & Booths")}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              <bdi dir="ltr">{exhibitionMetrics.totalSponsors}</bdi>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-purple-600">
              <bdi dir="ltr">{exhibitionMetrics.boothOccupancyPct.toFixed(0)}%</bdi> <span>{t("analytics.boothOccupancy", "booth occupancy")}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${exhibitionMetrics.boothOccupancyPct}%` }} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. REGISTRATION VELOCITY & TICKET SPLITS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Registration Velocity Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between text-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("analytics.velocityTitle", "Daily Registration Velocity")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("analytics.velocitySubtitle", "Track daily momentum vs cumulative ticket distribution")}</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setVelocityChartType("cumulative")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  velocityChartType === "cumulative" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("analytics.cumulativeCurve", "Cumulative Curve")}
              </button>
              <button
                onClick={() => setVelocityChartType("daily")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  velocityChartType === "daily" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("analytics.dailyCadence", "Daily Cadence")}
              </button>
            </div>
          </div>

          {/* Interactive SVG Chart Canvas */}
          <div className="relative w-full h-[240px] my-5">
            {filteredCount === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center p-6">
                <TrendingUp size={32} className="text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-700">{t("analytics.noVelocityActivity", "No registration activity in this timeframe")}</span>
                <span className="text-[11px] text-slate-400 mt-1">{t("analytics.noVelocityActivityDesc", "Try selecting a broader date range or “All Time”")}</span>
              </div>
            ) : (
              (() => {
                const points = velocityData.points;
                const maxVal = velocityChartType === "cumulative" ? velocityData.maxCumulative : velocityData.maxDaily;
                const width = 600;
                const height = 220;
                const padding = 20;

                const coords = points.map((p, i) => {
                  const x = points.length <= 1 ? width / 2 : padding + (i / (points.length - 1)) * (width - padding * 2);
                  const val = velocityChartType === "cumulative" ? p.cumulative : p.daily;
                  const y = height - padding - (val / Math.max(1, maxVal)) * (height - padding * 2);
                  return { x, y, ...p, val };
                });

                const polylinePoints = coords.map(c => `${c.x},${c.y}`).join(" ");
                const areaPoints = `${coords[0]?.x || padding},${height - padding} ${polylinePoints} ${coords[coords.length - 1]?.x || width - padding},${height - padding}`;

                return (
                  <div className="relative w-full h-full">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="velocity-grad-sp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />

                      <polygon fill="url(#velocity-grad-sp)" points={areaPoints} />
                      <polyline fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />

                      {coords.map((c, idx) => (
                        <g key={idx} className="cursor-pointer">
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={hoveredDataPoint?.date === c.date ? 7 : 4.5}
                            fill="#2563eb"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            onMouseEnter={() => setHoveredDataPoint(c)}
                            onMouseLeave={() => setHoveredDataPoint(null)}
                            className="transition-all duration-200"
                          />
                        </g>
                      ))}
                    </svg>

                    {hoveredDataPoint && (
                      <div className="absolute top-2 right-4 bg-slate-900/90 text-white text-xs px-3 py-2 rounded-xl shadow-lg backdrop-blur-xs flex flex-col gap-0.5 z-10 pointer-events-none text-start">
                        <span className="font-bold text-blue-300">{hoveredDataPoint.label}</span>
                        <span>{t("analytics.tooltipDaily", "Daily: +{count} registrations").replace("{count}", hoveredDataPoint.daily)}</span>
                        <span>{t("analytics.tooltipCumulative", "Cumulative: {count} total").replace("{count}", hoveredDataPoint.cumulative)}</span>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("analytics.avgDailyPace", "Average Daily Pace")}</span>
              <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                <bdi dir="ltr">+{velocityData.avgPace} / {t("analytics.dayUnit", "day")}</bdi>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("analytics.peakVelocityDay", "Peak Velocity Day")}</span>
              <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                {velocityData.peakDay?.date ? (
                  <bdi dir="ltr">
                    {`${new Date(velocityData.peakDay.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} (+${velocityData.peakDay.count})`}
                  </bdi>
                ) : "N/A"}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("analytics.capacityProjection", "Capacity Projection")}</span>
              <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                {capacity > 0 ? (
                  totalAttendeesCount >= capacity ? (
                    t("analytics.soldOut", "Sold Out")
                  ) : (
                    <span>
                      <bdi dir="ltr">{Math.ceil((capacity - totalAttendeesCount) / Math.max(1, parseFloat(velocityData.avgPace)))}</bdi> {t("analytics.daysLeft", "days left")}
                    </span>
                  )
                ) : (
                  t("analytics.openAdmission", "Open Admission")
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Ticket Tier Splits */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between text-start">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.splitByTicketTitle", "Registration Split by Ticket")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.splitByTicketSubtitle", "Volume & revenue contribution by pass")}</p>
              </div>
              <Ticket size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {ticketPerformance.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  {t("analytics.noTicketTiers", "No ticket tiers registered yet.")}
                </div>
              ) : (
                ticketPerformance.map((tier) => (
                  <div key={tier.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{tier.name}</span>
                      <span className="text-slate-500 font-semibold">
                        <bdi dir="ltr">{tier.count} ({tier.pctOfTotal.toFixed(1)}%)</bdi>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tier.color.bg} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(tier.pctOfTotal, tier.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{tier.price > 0 ? <bdi dir="ltr">{formatPrice(tier.price)}</bdi> : t("analytics.freeAdmission", "Free Admission")}</span>
                      <span><bdi dir="ltr">{formatPrice(tier.revenue)}</bdi> {t("analytics.totalLabel", "total")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.avgRevenuePerDelegate", "Average Revenue / Delegate")}</span>
            <span className="font-extrabold text-slate-900"><bdi dir="ltr">{formatPrice(avgRevenuePerAttendee)}</bdi></span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          5. DETAILED TICKET ECONOMICS TABLE
      ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-start">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t("analytics.ticketEconomicsTitle", "Ticket Tier Economics & Inventory Quotas")}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t("analytics.ticketEconomicsSubtitle", "Sales performance, inventory caps, and revenue yield per category")}</p>
          </div>
          <DollarSign size={18} className="text-slate-400" />
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 rounded-s-xl">{t("analytics.thTicketTier", "Ticket Tier")}</th>
                <th className="py-3 px-4">{t("analytics.thPrice", "Price")}</th>
                <th className="py-3 px-4">{t("analytics.thSold", "Sold")}</th>
                <th className="py-3 px-4">{t("analytics.thQuotaCap", "Quota / Cap")}</th>
                <th className="py-3 px-4">{t("analytics.thSelloutProgress", "Sellout Progress")}</th>
                <th className="py-3 px-4">{t("analytics.thGrossRevenue", "Gross Revenue")}</th>
                <th className="py-3 px-4 rounded-e-xl text-end">{t("analytics.thCheckedIn", "Checked In")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {ticketPerformance.map((tier) => (
                <tr key={tier.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${tier.color.bg}`} />
                    <span>{tier.name}</span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    {tier.price > 0 ? <bdi dir="ltr">{formatPrice(tier.price)}</bdi> : t("common.free", "Free")}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900">
                    <bdi dir="ltr">{tier.count}</bdi>
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {tier.quota > 0 ? <bdi dir="ltr">{tier.quota}</bdi> : t("analytics.unlimited", "Unlimited")}
                  </td>
                  <td className="py-4 px-4 w-48">
                    {tier.quota > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span><bdi dir="ltr">{tier.quotaPct.toFixed(1)}%</bdi></span>
                          <span><bdi dir="ltr">{tier.quota - tier.count}</bdi> {t("analytics.left", "left")}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${tier.color.bg} rounded-full`} style={{ width: `${tier.quotaPct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">{t("analytics.openAdmission", "Open Admission")}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-extrabold text-emerald-600">
                    <bdi dir="ltr">{formatPrice(tier.revenue)}</bdi>
                  </td>
                  <td className="py-4 px-4 text-end font-semibold text-slate-600">
                    <bdi dir="ltr">{tier.checkedIn} ({tier.checkinPct.toFixed(0)}%)</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          6. AUDIENCE & DEMOGRAPHICS MATRIX
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
        
        {/* Top Companies / Organizations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.topOrgsTitle", "Top Represented Organizations")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.topOrgsSubtitle", "Companies with highest delegate headcount")}</p>
              </div>
              <Building2 size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {demographics.topCompanies.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  {t("analytics.noOrgData", "No organization demographic data recorded yet.")}
                </div>
              ) : (
                demographics.topCompanies.map((comp, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 truncate">{comp.name}</span>
                      </div>
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <bdi dir="ltr">{comp.count}</bdi> <span>{t("analytics.delegatesLabel", "delegates")}</span> <bdi dir="ltr">({comp.pct.toFixed(1)}%)</bdi>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(comp.pct, 4)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.totalUniqueEntities", "Total Unique Entities")}</span>
            <span className="font-extrabold text-slate-900">
              <bdi dir="ltr">{demographics.uniqueCompaniesCount}</bdi> <span>{t("analytics.organizationsLabel", "Organizations")}</span>
            </span>
          </div>
        </div>

        {/* Seniority & Hierarchy Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.seniorityHierarchyTitle", "Seniority & Role Hierarchy")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.seniorityHierarchySubtitle", "Classification by management level and decision power")}</p>
              </div>
              <Briefcase size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {demographics.seniorityList.map((tier, idx) => {
                const colors = ["bg-purple-600", "bg-blue-600", "bg-indigo-600", "bg-emerald-600", "bg-amber-500", "bg-slate-400"];
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{getLocalizedSeniority(tier.level)}</span>
                      <span className="text-slate-500 font-semibold">
                        <bdi dir="ltr">{tier.count} ({tier.pct.toFixed(1)}%)</bdi>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(tier.pct, tier.count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.execShareLabel", "Executive & Decision Maker Share")}</span>
            <span className="font-extrabold text-purple-700">
              <bdi dir="ltr">
                {totalAttendeesCount > 0 
                  ? `${(((demographics.seniorityList.find(s => s.level.includes("C-Suite"))?.count || 0) + 
                         (demographics.seniorityList.find(s => s.level.includes("Directors"))?.count || 0)) / totalAttendeesCount * 100).toFixed(1)}%` 
                  : "0.0%"}
              </bdi>
            </span>
          </div>
        </div>

        {/* Regional & Geographic Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.geographicFootprintTitle", "Geographic & Regional Footprint")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.geographicFootprintSubtitle", "Attendee origins and international delegation")}</p>
              </div>
              <Globe size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {demographics.topGeos.map((geo, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="text-slate-800">{geo.location === "Local / Regional" ? t("analytics.localRegional", "Local / Regional") : geo.location}</span>
                    </div>
                    <span className="text-slate-500 font-semibold">
                      <bdi dir="ltr">{geo.count} ({geo.pct.toFixed(1)}%)</bdi>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(geo.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Job Functions / Titles Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.topJobTitlesTitle", "Top Job Titles & Roles")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.topJobTitlesSubtitle", "Specific professions attending")}</p>
              </div>
              <UserCheck size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {demographics.topRoles.map((role, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 truncate">{role.title}</span>
                    <span className="text-slate-500 font-semibold">
                      <bdi dir="ltr">{role.count} ({role.pct.toFixed(1)}%)</bdi>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(role.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          7. LIVE GATE CHECK-IN TELEMETRY
      ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-start">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t("analytics.liveGateCheckinTitle", "Live Gate Check-In & Attendee Ingress")}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t("analytics.liveGateCheckinSubtitle", "Real-time gate ingress and badge pickup telemetry")}</p>
          </div>
          <button
            onClick={() => onSwitchView && onSwitchView("check-in")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto flex items-center gap-2"
          >
            <CheckCircle2 size={14} />
            <span>{t("analytics.openCheckinScanner", "Open Check-in Scanner")}</span>
          </button>
        </div>

        {/* 4-Stage Ingress Funnel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1. {t("analytics.registeredPasses", "REGISTERED PASSES")}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-2">
              <bdi dir="ltr">{totalAttendeesCount}</bdi>
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              <bdi dir="ltr">100%</bdi> {t("analytics.ofClaimedPasses", "of claimed passes")}
            </span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              2. {t("analytics.approvedValidated", "APPROVED / VALIDATED")}
            </span>
            <div className="text-2xl font-black text-blue-900 mt-2">
              <bdi dir="ltr">{totalAttendeesCount}</bdi>
            </div>
            <span className="text-[11px] text-blue-600 mt-2">
              {t("analytics.activeCredentials", "Active credentials")}
            </span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              3. {t("analytics.checkedInBox", "CHECKED IN")}
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-2">
              <bdi dir="ltr">{checkedInCount}</bdi>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-2">
              <bdi dir="ltr">{checkinPct.toFixed(1)}%</bdi> {t("analytics.conversionRate", "conversion")}
            </span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              4. {t("analytics.awaitingIngress", "AWAITING INGRESS")}
            </span>
            <div className="text-2xl font-black text-amber-900 mt-2">
              <bdi dir="ltr">{totalAttendeesCount - checkedInCount}</bdi>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold mt-2">
              <bdi dir="ltr">{(100 - checkinPct).toFixed(1)}%</bdi> {t("analytics.pendingBadge", "pending badge")}
            </span>
          </div>
        </div>

        {/* Check-In Progress by Tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {ticketPerformance.map(tier => (
            <div key={tier.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">{tier.name}</span>
                <span className="text-xs font-extrabold text-blue-600"><bdi dir="ltr">{tier.checkinPct.toFixed(0)}%</bdi></span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden my-2.5">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${tier.checkinPct}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span><bdi dir="ltr">{tier.checkedIn}</bdi> {t("analytics.checkedInLower", "checked in")}</span>
                <span><bdi dir="ltr">{tier.count}</bdi> {t("analytics.totalLower", "total")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          8. CUSTOM SURVEY & FORM RESPONSES CROSS-TABULATION
      ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-start">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t("analytics.formAnalyzerTitle", "Custom Form Question Cross-Tabulation Analyzer")}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t("analytics.formAnalyzerSubtitle", "Inspect responses to custom registration questions & survey fields in real time")}</p>
          </div>
          <CheckSquare size={18} className="text-slate-400" />
        </div>

        <div className="max-w-xl mt-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ms-1">
            {t("analytics.selectQuestionLabel", "SELECT QUESTION TO ANALYZE")}
          </span>
          <div className="mt-1">
            {availableFormQuestions.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                {t("analytics.noFormQuestions", "No custom form questions or survey fields detected for this event yet.")}
              </div>
            ) : (
              <SearchableSelect
                value={activeQuestionKey}
                onChange={setSelectedQuestionKey}
                options={availableFormQuestions}
                placeholder={t("analytics.chooseQuestionPlaceholder", "Choose a custom form question...")}
              />
            )}
          </div>
        </div>

        {activeQuestionAnalysis && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 p-4 rounded-2xl text-xs">
              <div>
                <span className="font-bold text-blue-900">{t("analytics.questionPrefix", "Question:")} </span>
                <span className="text-blue-800">{activeQuestionAnalysis.label}</span>
              </div>
              <div className="font-bold text-blue-700">
                <bdi dir="ltr">{activeQuestionAnalysis.totalAnswered} / {activeQuestionAnalysis.totalAttendees}</bdi> (<bdi dir="ltr">{activeQuestionAnalysis.responseRatePct.toFixed(1)}%</bdi>) {t("analytics.answered", "answered")}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              {activeQuestionAnalysis.options.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold col-span-2">
                  {t("analytics.noQuestionResponses", "No response values submitted for this question yet.")}
                </div>
              ) : (
                activeQuestionAnalysis.options.map((opt, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{opt.answer}</span>
                      <span className="text-slate-600 font-semibold">
                        <bdi dir="ltr">{opt.count} ({opt.pct.toFixed(1)}%)</bdi>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.max(opt.pct, 3)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          9. RSVP & GUEST HOSPITALITY MATRIX
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
        {/* Response Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.rsvpIntentionsTitle", "RSVP Attendance Intentions")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.rsvpIntentionsSubtitle", "Guest attendance declarations & plus-ones")}</p>
              </div>
              <Calendar size={18} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("analytics.rsvpGoing", "GOING")}</span>
                <span className="text-2xl font-black text-emerald-900 mt-1"><bdi dir="ltr">{rsvpMetrics.attending}</bdi></span>
                <span className="text-[11px] text-emerald-700 mt-1">
                  <bdi dir="ltr">+{rsvpMetrics.totalPlusOnes}</bdi> {t("analytics.plusOnes", "plus-ones")}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{t("analytics.rsvpMaybe", "MAYBE")}</span>
                <span className="text-2xl font-black text-amber-900 mt-1"><bdi dir="ltr">{rsvpMetrics.maybe}</bdi></span>
                <span className="text-[11px] text-amber-700 mt-1">{t("analytics.tentativeInterest", "Tentative interest")}</span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{t("analytics.rsvpDeclined", "DECLINED")}</span>
                <span className="text-2xl font-black text-rose-900 mt-1"><bdi dir="ltr">{rsvpMetrics.declined}</bdi></span>
                <span className="text-[11px] text-rose-700 mt-1">{t("analytics.cannotAttend", "Cannot attend")}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("analytics.rsvpPending", "PENDING")}</span>
                <span className="text-2xl font-black text-slate-800 mt-1"><bdi dir="ltr">{rsvpMetrics.pending}</bdi></span>
                <span className="text-[11px] text-slate-500 mt-1">{t("analytics.awaitingReply", "Awaiting reply")}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.totalExpectedHeadcount", "Total Expected Guest Headcount")}</span>
            <span className="font-extrabold text-emerald-700">
              <bdi dir="ltr">{rsvpMetrics.totalHeadcount}</bdi> {t("analytics.attendeesLabel", "Attendees")}
            </span>
          </div>
        </div>

        {/* Dietary & Catering Preferences */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.dietaryRequestsTitle", "Dietary & Catering Requests")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.dietaryRequestsSubtitle", "Meal selections declared in RSVPs")}</p>
              </div>
              <Utensils size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {rsvpMetrics.dietary.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  {t("analytics.noDietaryRestrictions", "No special dietary restrictions reported yet.")}
                </div>
              ) : (
                rsvpMetrics.dietary.map((d, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{d.name}</span>
                      <span className="text-slate-500 font-semibold">
                        <bdi dir="ltr">{d.count}</bdi> <span>{t("analytics.mealsLabel", "meals")}</span> <bdi dir="ltr">({d.pct.toFixed(1)}%)</bdi>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.max(d.pct, 4)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          10. SPONSORSHIP & FLOOR PLAN BOOTHS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
        {/* Sponsorship Tier Matrix */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.sponsorshipRevenueTitle", "Sponsorship Packages & Revenue")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.sponsorshipRevenueSubtitle", "Monetization by partnership tier")}</p>
              </div>
              <Award size={18} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-3.5 mt-6">
              {exhibitionMetrics.sponsorTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/70 border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${tier.color}`}>
                      {tier.name}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      <bdi dir="ltr">{tier.count}</bdi> <span>{tier.count === 1 ? t("analytics.sponsorSingle", "sponsor") : t("analytics.sponsorsPlural", "sponsors")}</span>
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    <bdi dir="ltr">{formatPrice(tier.revenue)}</bdi>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.totalSponsorshipYield", "Total Sponsorship Yield")}</span>
            <span className="font-extrabold text-emerald-700"><bdi dir="ltr">{formatPrice(exhibitionMetrics.totalSponsorRevenue)}</bdi></span>
          </div>
        </div>

        {/* Floor Plan Booth Occupancy */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.floorPlanOccupancyTitle", "Floor Plan & Booth Occupancy")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.floorPlanOccupancySubtitle", "Expo floor space allocation & inventory")}</p>
              </div>
              <Store size={18} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-3 my-6 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("analytics.totalBoothsUpper", "TOTAL BOOTHS")}</span>
                <div className="text-2xl font-black text-slate-900 mt-1"><bdi dir="ltr">{exhibitionMetrics.totalBooths}</bdi></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("analytics.bookedBooths", "BOOKED")}</span>
                <div className="text-2xl font-black text-emerald-900 mt-1"><bdi dir="ltr">{exhibitionMetrics.bookedBooths}</bdi></div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t("analytics.availableBooths", "AVAILABLE")}</span>
                <div className="text-2xl font-black text-blue-900 mt-1"><bdi dir="ltr">{exhibitionMetrics.availableBooths}</bdi></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">{t("analytics.occupancyRate", "Occupancy Rate")}</span>
                <span className="text-emerald-600 font-extrabold"><bdi dir="ltr">{exhibitionMetrics.boothOccupancyPct.toFixed(1)}%</bdi></span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${exhibitionMetrics.boothOccupancyPct}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.exhibitingCompanies", "Exhibiting Companies")}</span>
            <span className="font-extrabold text-slate-900">
              <bdi dir="ltr">{exhibitionMetrics.totalExhibitors}</bdi> <span>{t("analytics.registeredLabel", "Registered")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          11. LOGISTICS READINESS & PROGRAM DENSITY
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
        {/* Logistics Health */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.operationsHealthTitle", "Operations & Logistics Health")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.operationsHealthSubtitle", "Task completion across catering, AV, transport & stage")}</p>
              </div>
              <Truck size={18} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("analytics.completedTasksUpper", "COMPLETED TASKS")}</span>
                <span className="text-2xl font-black text-emerald-900 mt-1"><bdi dir="ltr">{logisticsMetrics.completedTasks}</bdi></span>
                <span className="text-[11px] text-emerald-700 mt-1">{t("analytics.deliveredConfirmed", "Delivered & confirmed")}</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{t("analytics.pendingWorkUpper", "PENDING WORK")}</span>
                <span className="text-2xl font-black text-amber-900 mt-1"><bdi dir="ltr">{logisticsMetrics.pendingTasks}</bdi></span>
                <span className="text-[11px] text-amber-700 mt-1">{t("analytics.inProgress", "In progress")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">{t("analytics.operationalReadinessScore", "Operational Readiness Score")}</span>
                <span className="text-blue-600 font-extrabold"><bdi dir="ltr">{logisticsMetrics.taskReadinessPct.toFixed(0)}%</bdi></span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${logisticsMetrics.taskReadinessPct}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.logisticsBudgetAllocated", "Logistics Budget Allocated")}</span>
            <span className="font-extrabold text-slate-900"><bdi dir="ltr">{formatPrice(logisticsMetrics.totalBudget)}</bdi></span>
          </div>
        </div>

        {/* Program & Schedule Density */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("analytics.agendaDensityTitle", "Agenda & Program Density")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("analytics.agendaDensitySubtitle", "Sessions, speakers, and schedule capacity")}</p>
              </div>
              <Clock size={18} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("analytics.totalSessionsUpper", "TOTAL SESSIONS")}</span>
                <span className="text-2xl font-black text-slate-900 mt-1"><bdi dir="ltr">{sessions.length}</bdi></span>
                <span className="text-[11px] text-slate-500 mt-1">{t("analytics.keynotesPanels", "Keynotes & panels")}</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{t("analytics.keynoteSpeakersUpper", "KEYNOTE SPEAKERS")}</span>
                <span className="text-2xl font-black text-indigo-900 mt-1">
                  <bdi dir="ltr">{sessions.reduce((acc, s) => acc + (s.speakers?.length || 0), 0)}</bdi>
                </span>
                <span className="text-[11px] text-indigo-700 mt-1">{t("analytics.acrossAllTracks", "Across all tracks")}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{t("analytics.scheduleTimeline", "Schedule Timeline")}</span>
            <span className="font-extrabold text-slate-900"><bdi dir="ltr">{eventDetails.scheduleTime || "09:00 AM – 05:00 PM"}</bdi></span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          12. SMART AI STRATEGIC ADVISOR BANNER
      ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white text-start shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              {t("analytics.intelligenceAdvisor", "INTELLIGENCE ADVISOR")}
            </span>
            <span className="text-xs text-blue-100">{t("analytics.liveDiagnostic", "Live Diagnostic")}</span>
          </div>
          <h4 className="text-lg font-black tracking-tight">
            {capacityPct >= 80 
              ? t("analytics.advisorTitleSurge", "High Demand Velocity Detected — Consider Releasing Surge Quotas")
              : t("analytics.advisorTitleSteady", "Registration Momentum on Steady Target")}
          </h4>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
            {capacityPct >= 80 
              ? t("analytics.advisorDescSurge", "Your event has reached {capacityPct}% capacity. At the current pace of +{pace} registrations/day, passes will sell out shortly.")
                  .replace("{capacityPct}", capacityPct.toFixed(0))
                  .replace("{pace}", velocityData.avgPace)
              : t("analytics.advisorDescSteady", "Currently tracking at {attendees} confirmed delegates across {companies} unique organizations. Gate check-in conversion is at {checkinPct}%.")
                  .replace("{attendees}", totalAttendeesCount)
                  .replace("{companies}", demographics.uniqueCompaniesCount)
                  .replace("{checkinPct}", checkinPct.toFixed(0))}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => onSwitchView && onSwitchView("tickets")}
            className="px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
          >
            {t("analytics.manageTicketsBtn", "Manage Tickets")}
          </button>
        </div>
      </div>

    </div>
  );
}
