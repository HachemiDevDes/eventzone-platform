"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  QrCode,
  Users,
  Search,
  CheckCircle2,
  X,
  LogOut,
  Sparkles,
  Lock,
  Mail,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  ChevronRight,
  User,
  UserCheck,
  Building,
  Phone,
  Ticket,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Undo2,
  Info,
} from "lucide-react";
import CheckInScanner from "./CheckInScanner";

const SESSION_STORAGE_KEY = "ez_checkin_session";

export default function CheckInMobileApp({
  initialEventId = "",
}) {
  // Session / Auth state
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPasscode, setAuthPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Check-in desk state
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner" | "list"
  const [attendees, setAttendees] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "remaining" | "checked_in"
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [undoAttendee, setUndoAttendee] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Read saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.eventId) {
          setSession(parsed);
          setAuthEmail(parsed.email || "");
        }
      }
    } catch {}
  }, []);

  // Show temporary toast banner
  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Perform Staff Login with Email + Event Passcode
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!authEmail.trim() || !authPasscode.trim()) {
      setAuthError("Please enter both your staff email and the event passcode.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/checkin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail.trim(),
          passcode: authPasscode.trim().toUpperCase(),
          eventId: initialEventId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Invalid passcode or email. Please check with the organizer.");
        return;
      }

      const newSession = {
        ...data.session,
        event: data.event,
        staff: data.staff,
      };

      setSession(newSession);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      } catch {}

      showToast(`Welcome ${data.staff?.name || "Staff"}! Check-in desk ready.`);
      if (newSession.eventId) {
        loadAttendees(newSession.eventId, newSession);
      }
    } catch (err) {
      console.error("Login error:", err);
      setAuthError("Unable to connect to the check-in server. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setSession(null);
    setAttendees([]);
    setSelectedAttendee(null);
    setAuthPasscode("");
  };

  // Load attendees for the active event
  const loadAttendees = useCallback(async (eventId, overrideSession = null) => {
    if (!eventId) return;
    const activeSess = overrideSession || session;
    setListLoading(true);
    try {
      const headers = {};
      if (activeSess?.passcode) headers["x-checkin-passcode"] = activeSess.passcode;
      if (activeSess?.email) headers["x-staff-email"] = activeSess.email;

      const res = await fetch(`/api/checkin/attendees?eventId=${eventId}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.attendees)) {
        setAttendees(data.attendees);
      }
    } catch (err) {
      console.warn("Load attendees error:", err);
    } finally {
      setListLoading(false);
    }
  }, [session]);

  // Fetch attendees when logged in
  useEffect(() => {
    if (session?.eventId) {
      loadAttendees(session.eventId);
    }
  }, [session?.eventId, loadAttendees]);

  // Toggle Check-In status manually
  const handleToggleCheckin = async (attendee, forceCheckin = null) => {
    if (!attendee || !session?.eventId) return;
    const targetState = forceCheckin !== null ? forceCheckin : !attendee.checkedIn;
    const attendeeId = attendee.id;

    setActionLoadingId(attendeeId);

    // Optimistic UI update
    setAttendees((prev) =>
      prev.map((a) => {
        if (a.id === attendeeId) {
          return {
            ...a,
            checkedIn: targetState,
            checked_in: targetState,
            checkedInAt: targetState ? new Date().toISOString() : null,
            checked_in_at: targetState ? new Date().toISOString() : null,
            checkedInBy: targetState ? (session.staffName || "Staff") : null,
          };
        }
        return a;
      })
    );

    if (selectedAttendee && selectedAttendee.id === attendeeId) {
      setSelectedAttendee((prev) => ({
        ...prev,
        checkedIn: targetState,
        checked_in: targetState,
        checkedInAt: targetState ? new Date().toISOString() : null,
      }));
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (session?.passcode) headers["x-checkin-passcode"] = session.passcode;
      if (session?.email) headers["x-staff-email"] = session.email;

      const res = await fetch("/api/checkin/toggle", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: session.eventId,
          attendeeId,
          checkedIn: targetState,
          checkedInBy: session.staffName || session.email || "Staff",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on error
        loadAttendees(session.eventId);
        showToast(data.error || "Failed to update check-in status.", "error");
      } else {
        if (targetState) {
          showToast(`${attendee.name || "Attendee"} checked in!`);
        } else {
          showToast(`Check-in undone for ${attendee.name || "Attendee"}.`, "neutral");
        }
      }
    } catch (err) {
      console.error("Toggle checkin error:", err);
      loadAttendees(session.eventId);
      showToast("Network error during check-in.", "error");
    } finally {
      setActionLoadingId(null);
      setUndoAttendee(null);
    }
  };

  // Update attendees list when scanner registers a new check-in
  const handleScannerResult = (result) => {
    if (result && result.attendee) {
      const scannedId = result.attendee.id;
      setAttendees((prev) => {
        const exists = prev.some((a) => a.id === scannedId);
        if (exists) {
          return prev.map((a) => (a.id === scannedId ? { ...a, ...result.attendee, checkedIn: true, checked_in: true } : a));
        }
        return [{ ...result.attendee, checkedIn: true, checked_in: true }, ...prev];
      });
    }
  };

  // Compute live metrics
  const checkedInCount = useMemo(() => {
    return attendees.filter((a) => a.checkedIn || a.checked_in).length;
  }, [attendees]);

  const totalCount = attendees.length;
  const remainingCount = Math.max(0, totalCount - checkedInCount);
  const checkedInPercentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  // Filtered attendees for the list
  const filteredAttendees = useMemo(() => {
    let list = attendees;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const name = (a.name || `${a.firstName || ""} ${a.lastName || ""}`).toLowerCase();
        const email = (a.email || "").toLowerCase();
        const company = (a.company || "").toLowerCase();
        const badge = (a.badgeCode || a.badge_code || "").toLowerCase();
        const tier = (a.ticketType || a.ticket_type || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          company.includes(q) ||
          badge.includes(q) ||
          tier.includes(q)
        );
      });
    }

    // Segmented Status filter (All / Remaining / Checked In)
    if (statusFilter === "remaining") {
      list = list.filter((a) => !a.checkedIn && !a.checked_in);
    } else if (statusFilter === "checked_in") {
      list = list.filter((a) => a.checkedIn || a.checked_in);
    }

    return list;
  }, [attendees, searchQuery, statusFilter]);

  // ─────────────────────────────────────────────
  //  1. LOGIN VIEW (Mobile Auth)
  // ─────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-5 select-none font-sans">
        {/* Top Branding */}
        <div className="pt-10 pb-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/eventzone-logo-white.png"
              alt="Eventzone"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm select-none"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Eventzone Check-In</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            ci.eventzone.pro &bull; Fast-Track Gate Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="w-full max-w-sm mx-auto bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-lg font-black text-white tracking-tight">Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Enter your email and the passcode provided by the organizer.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="your.email@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Passcode Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Passcode
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPasscode ? "text" : "password"}
                  required
                  autoCapitalize="characters"
                  autoCorrect="off"
                  placeholder="Enter event passcode"
                  value={authPasscode}
                  onChange={(e) => setAuthPasscode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-11 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-sm font-mono font-bold tracking-widest text-white placeholder-slate-500 uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center cursor-pointer tracking-wide"
            >
              {authLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <span>Let&apos;s Scan</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="py-4 text-center">
          <p className="text-[11px] text-slate-500">
            Powered by Eventzone &bull; Secure On-Site Check-In
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  2. MAIN CHECK-IN INTERFACE
  // ─────────────────────────────────────────────
  return (
    <div className="relative min-h-[100dvh] max-h-[100dvh] w-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border ${
              toastMessage.type === "error"
                ? "bg-red-600 text-white border-red-400 shadow-red-600/30"
                : toastMessage.type === "neutral"
                ? "bg-slate-800 text-slate-200 border-slate-700 shadow-black/40"
                : "bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/30"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="shrink-0 bg-slate-950 border-b border-white/10 px-4 pt-3 pb-2.5 z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Event Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-white truncate">
              {session.eventTitle || "Event Check-In"}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="truncate">{session.staffName || "Staff"}</span>
              <span>&bull;</span>
              <span className="font-mono text-emerald-400 font-bold">
                {checkedInCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Action Buttons: Refresh & Logout */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadAttendees(session.eventId)}
              title="Sync Attendees"
              disabled={listLoading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <RefreshCw size={14} className={listLoading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${checkedInPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative overflow-hidden bg-black">
        {/* VIEW 1: Live QR Scanner */}
        {activeTab === "scanner" && (
          <CheckInScanner
            eventId={session.eventId}
            eventTitle={session.eventTitle}
            staffEmail={session.email}
            staffName={session.staffName}
            checkedInCount={checkedInCount}
            totalCount={totalCount}
            onScanResult={handleScannerResult}
            onSwitchToList={() => setActiveTab("list")}
          />
        )}

        {/* VIEW 2: Attendee List */}
        {activeTab === "list" && (
          <div className="h-full flex flex-col overflow-hidden bg-slate-900">
            {/* Search and Segmented Filter Bar (NO CHIPS!) */}
            <div className="p-3 bg-slate-950/80 border-b border-white/5 space-y-2.5 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search attendee by name, email, badge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Segmented Control Bar (Clean 3-way toggle, not chips) */}
              <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-xl border border-white/5 text-[11px] font-bold text-center">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("remaining")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "remaining"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Remaining ({remainingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("checked_in")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "checked_in"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Checked ({checkedInCount})
                </button>
              </div>
            </div>

            {/* Attendee Roster List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1.5">
              {listLoading && attendees.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span>Loading attendee roster...</span>
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs px-4">
                  <Users size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-slate-300">No attendees found</p>
                  <p className="mt-1 text-slate-500">
                    {searchQuery ? "Try a different search term" : "No attendees registered yet"}
                  </p>
                </div>
              ) : (
                filteredAttendees.map((attendee) => {
                  const isCheckedIn = Boolean(attendee.checkedIn || attendee.checked_in);
                  const isActing = actionLoadingId === attendee.id;

                  return (
                    <div
                      key={attendee.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCheckedIn
                          ? "bg-slate-950/40 border-emerald-500/20"
                          : "bg-slate-950/70 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {/* Left: Attendee Details */}
                      <button
                        type="button"
                        onClick={() => setSelectedAttendee(attendee)}
                        className="min-w-0 flex-1 text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                            {attendee.name || "Attendee"}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 truncate">
                          <span className="font-semibold text-slate-300">
                            {attendee.ticketType || attendee.ticket_type || "Standard"}
                          </span>
                          {attendee.company && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate">{attendee.company}</span>
                            </>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {attendee.badgeCode || attendee.badge_code || "EZ-PASS"}
                        </div>
                      </button>

                      {/* Right: 1-Tap Check-In / Undo Button */}
                      <div className="shrink-0">
                        {isCheckedIn ? (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => setUndoAttendee(attendee)}
                            className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Check size={14} className="stroke-[3]" />
                            <span>Checked In</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleToggleCheckin(attendee, true)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            {isActing ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UserCheck size={14} />
                            )}
                            <span>Check In</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Primary Navigation Tabs (Big touch targets) */}
      <nav className="shrink-0 bg-slate-950 border-t border-white/10 px-4 py-2.5 z-30">
        <div className="grid grid-cols-2 gap-2">
          {/* Tab 1: Scanner */}
          <button
            type="button"
            onClick={() => setActiveTab("scanner")}
            className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <QrCode size={18} />
            <span>Scan QR</span>
          </button>

          {/* Tab 2: Attendees List */}
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users size={18} />
            <span>Attendees ({totalCount})</span>
          </button>
        </div>
      </nav>

      {/* Attendee Details Drawer Modal */}
      {selectedAttendee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[85dvh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  Delegate Details
                </span>
                <h2 className="text-lg font-black text-white truncate">
                  {selectedAttendee.name || "Attendee"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAttendee(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400">Ticket Tier:</span>
                <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                  {selectedAttendee.ticketType || selectedAttendee.ticket_type || "Standard"}
                </span>
              </div>

              {selectedAttendee.email && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-200 truncate max-w-[220px]">
                    {selectedAttendee.email}
                  </span>
                </div>
              )}

              {selectedAttendee.company && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Company:</span>
                  <span className="font-bold text-white truncate max-w-[220px]">
                    {selectedAttendee.company}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400">Badge Pass:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {selectedAttendee.badgeCode || selectedAttendee.badge_code || "EZ-PASS"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-md ${
                    selectedAttendee.checkedIn || selectedAttendee.checked_in
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {selectedAttendee.checkedIn || selectedAttendee.checked_in
                    ? "Checked In"
                    : "Registered (Pending Arrival)"}
                </span>
              </div>

              {selectedAttendee.checkedInAt && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <Clock size={14} className="text-slate-500" />
                  <span>
                    Checked in at{" "}
                    {new Date(selectedAttendee.checkedInAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              {selectedAttendee.checkedIn || selectedAttendee.checked_in ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCheckin(selectedAttendee, false);
                    setSelectedAttendee(null);
                  }}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Undo2 size={16} />
                  <span>Undo Check-In</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCheckin(selectedAttendee, true);
                    setSelectedAttendee(null);
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  <span>Check In Delegate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Undo Confirmation Dialog */}
      {undoAttendee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-5 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <Undo2 size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Undo Check-In?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Reset check-in status for <strong>{undoAttendee.name}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setUndoAttendee(null)}
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleCheckin(undoAttendee, false)}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 cursor-pointer"
              >
                Yes, Undo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
