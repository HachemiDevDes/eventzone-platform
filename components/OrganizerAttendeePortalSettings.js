/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Globe, Sparkles, Send, Copy, Check, QrCode, Download,
  Calendar, Clock, Users, Layers, Building2, FileText,
  CheckCircle2, XCircle, AlertCircle, Eye, Share2, Mail,
  ShieldCheck, Lock, Unlock, ArrowRight, ExternalLink, RefreshCw,
  Sliders, MessageSquare, Megaphone, Bell, Save, UserCheck,
  Search, Filter, Store, Mic, HelpCircle, ArrowUpRight
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import { updateEventDetails } from "../lib/db";

export default function OrganizerAttendeePortalSettings({
  eventDetails = {},
  attendees = [],
  sessions = [],
  sponsors = [],
  exhibitors = [],
  floorPlans = [],
  documents = [],
  activeEventId,
  onUpdateEventDetails,
  onSendBroadcastEmail,
  onPreviewAttendeePortal,
  currentUser
}) {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState("availability"); // "availability" | "modules" | "share" | "broadcast" | "delegates"
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [portalQrUrl, setPortalQrUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [portalStatus, setPortalStatus] = useState(eventDetails.portalStatus || eventDetails.portal_status || "open");
  const [portalOpenTime, setPortalOpenTime] = useState(() => {
    const raw = eventDetails.portalOpenTime || eventDetails.portal_open_time;
    if (raw) {
      try {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
      } catch (e) {
        return "";
      }
    }
    if (eventDetails.startDate) {
      return `${eventDetails.startDate}T09:00`;
    }
    return "";
  });
  
  const [portalMessage, setPortalMessage] = useState(
    eventDetails.portalMessage || eventDetails.portal_message || 
    "Welcome to the official attendee portal! Explore the conference agenda, connect with fellow attendees, visit exhibitor booths, and view interactive floor plans."
  );

  const defaultSettings = {
    networking: true,
    agenda: true,
    exhibitors: true,
    sponsors: true,
    floorplans: true,
    resources: true,
    announcements: true
  };

  const [portalSettings, setPortalSettings] = useState(() => {
    const raw = eventDetails.portalSettings || eventDetails.portal_settings;
    if (typeof raw === "object" && raw !== null) {
      return { ...defaultSettings, ...raw };
    }
    return defaultSettings;
  });

  // Broadcast Modal / Tab State
  const [broadcastSubject, setBroadcastSubject] = useState(`Your Access Link to the ${eventDetails.title || "Summit"} Attendee Portal`);
  const [broadcastNote, setBroadcastNote] = useState(
    `Dear Delegate,\n\nThe interactive attendee portal for ${eventDetails.title || "our event"} is now live! Sign in with your registered email address to access your schedule, connect with attendees, and view exhibitor booths.`
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  // Computed Portal URL
  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?view=attendee-portal&eventId=${eventDetails.id || activeEventId || ""}`
    : `https://eventzone.pro/?view=attendee-portal&eventId=${eventDetails.id || activeEventId || ""}`;

  // Generate QR code for portal link
  useEffect(() => {
    if (!portalUrl) return;
    QRCode.toDataURL(portalUrl, {
      width: 360,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    }).then(url => setPortalQrUrl(url)).catch(err => console.warn("QR Error:", err));
  }, [portalUrl]);

  // Sync state if eventDetails updates externally
  useEffect(() => {
    if (eventDetails) {
      if (eventDetails.portalStatus) setPortalStatus(eventDetails.portalStatus);
      if (eventDetails.portal_status) setPortalStatus(eventDetails.portal_status);
      if (eventDetails.portalOpenTime) setPortalOpenTime(eventDetails.portalOpenTime.slice(0, 16));
      if (eventDetails.portalMessage) setPortalMessage(eventDetails.portalMessage);
      if (eventDetails.portalSettings) {
        setPortalSettings(prev => ({ ...prev, ...eventDetails.portalSettings }));
      }
    }
  }, [eventDetails]);

  // Save Settings to Database & Parent State
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      portalStatus,
      portal_status: portalStatus,
      portalOpenTime: portalStatus === "scheduled" && portalOpenTime ? new Date(portalOpenTime).toISOString() : null,
      portal_open_time: portalStatus === "scheduled" && portalOpenTime ? new Date(portalOpenTime).toISOString() : null,
      portalMessage,
      portal_message: portalMessage,
      portalSettings,
      portal_settings: portalSettings
    };

    try {
      const eid = eventDetails.id || activeEventId;
      if (eid) {
        await updateEventDetails(eid, payload);
      }
      if (onUpdateEventDetails) {
        onUpdateEventDetails(payload);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save portal settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(portalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!portalQrUrl) return;
    const a = document.createElement("a");
    a.href = portalQrUrl;
    a.download = `${(eventDetails.title || "Summit").replace(/\s+/g, "_")}_Portal_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDispatchBroadcast = async (e) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setBroadcastDone(false);

    try {
      if (onSendBroadcastEmail) {
        await onSendBroadcastEmail({
          subject: broadcastSubject,
          message: broadcastNote,
          portalUrl,
          recipientCount: attendees.length
        });
      }
      setBroadcastDone(true);
      setTimeout(() => setBroadcastDone(false), 4000);
    } catch (err) {
      console.error("Broadcast failed:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const activeModulesCount = useMemo(() => {
    return Object.values(portalSettings).filter(Boolean).length;
  }, [portalSettings]);

  const filteredAttendees = useMemo(() => {
    if (!searchQuery) return attendees;
    const q = searchQuery.toLowerCase();
    return attendees.filter(a => 
      (a.name || `${a.firstName || ""} ${a.lastName || ""}`).toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q) ||
      (a.company || "").toLowerCase().includes(q) ||
      (a.jobTitle || "").toLowerCase().includes(q)
    );
  }, [attendees, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* ─────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
      ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendee Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Control attendee portal availability, customize welcome announcements, and distribute direct access links.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onPreviewAttendeePortal}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Open Attendee Preview"
          >
            <Eye size={14} />
            <span>Preview as Attendee</span>
            <ArrowUpRight size={13} className="text-slate-400" />
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} className="text-emerald-300" />
            ) : (
              <Save size={15} />
            )}
            <span>{isSaving ? "Saving..." : saveSuccess ? "Settings Saved!" : "Save Portal Settings"}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. EXECUTIVE KPI CARDS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Registered Attendees */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Registered Attendees</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{attendees.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-blue-600 font-bold">{attendees.length}</span> eligible for portal access
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Sessions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Interactive Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{sessions.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-indigo-600">
              <CheckCircle2 size={12} /> available for bookmarks
            </div>
          </div>
        </div>

        {/* Card 3: Exhibitors & Sponsors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Exhibitors & Sponsors</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{sponsors.length + exhibitors.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              showcased with booth links
            </div>
          </div>
        </div>

        {/* Card 4: Portal Availability Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Portal Availability</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              portalStatus === "open" ? "bg-emerald-50 text-emerald-600" :
              portalStatus === "scheduled" ? "bg-amber-50 text-amber-600" :
              "bg-rose-50 text-rose-600"
            }`}>
              <Globe size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 capitalize">{portalStatus}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                portalStatus === "open" ? "bg-emerald-100 text-emerald-700" :
                portalStatus === "scheduled" ? "bg-amber-100 text-amber-700" :
                "bg-rose-100 text-rose-700"
              }`}>
                {portalStatus === "open" ? "Live Access" : portalStatus === "scheduled" ? "Countdown" : "Locked"}
              </span>
            </div>
            {/* Active modules bar */}
            <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  portalStatus === "open" ? "bg-emerald-500" : portalStatus === "scheduled" ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${(activeModulesCount / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────
          3. SUB-MODULE TABS NAVIGATION
      ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("availability")}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "availability"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Lock size={15} />
          <span>Availability & Access</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
            activeTab === "availability" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {portalStatus}
          </span>
          {activeTab === "availability" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("modules")}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "modules"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Sliders size={15} />
          <span>Feature Modules</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === "modules" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {activeModulesCount}/7
          </span>
          {activeTab === "modules" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("share")}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "share"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <QrCode size={15} />
          <span>Share & QR Code</span>
          {activeTab === "share" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("broadcast")}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "broadcast"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Mail size={15} />
          <span>Email Broadcast</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === "broadcast" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {attendees.length}
          </span>
          {activeTab === "broadcast" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("delegates")}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "delegates"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UserCheck size={15} />
          <span>Confirmed Delegates</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === "delegates" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {attendees.length}
          </span>
          {activeTab === "delegates" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          4. SUB-MODULE CONTENT PANELS
      ───────────────────────────────────────────── */}

      {/* ==================================================================== */}
      {/* SUBTAB 1: AVAILABILITY & ACCESS                                      */}
      {/* ==================================================================== */}
      {activeTab === "availability" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Status Selection Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Portal Availability Status</h3>
              <p className="text-xs text-slate-500 font-medium">Determine when registered attendees can access their interactive portal and start networking.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              
              {/* Option 1: Open */}
              <div
                onClick={() => setPortalStatus("open")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
                  portalStatus === "open"
                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    portalStatus === "open" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Unlock size={18} />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    portalStatus === "open" ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {portalStatus === "open" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">Open Now</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Attendees can log in with their ticket email and access all interactive features immediately.
                  </p>
                </div>
              </div>

              {/* Option 2: Scheduled */}
              <div
                onClick={() => setPortalStatus("scheduled")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
                  portalStatus === "scheduled"
                    ? "border-amber-500 bg-amber-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    portalStatus === "scheduled" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Clock size={18} />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    portalStatus === "scheduled" ? "border-amber-500 bg-amber-500" : "border-slate-300"
                  }`}>
                    {portalStatus === "scheduled" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">Scheduled Launch</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Displays a real-time countdown timer to attendees until the scheduled launch time arrives.
                  </p>
                </div>
              </div>

              {/* Option 3: Closed */}
              <div
                onClick={() => setPortalStatus("closed")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
                  portalStatus === "closed"
                    ? "border-rose-500 bg-rose-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    portalStatus === "closed" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Lock size={18} />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    portalStatus === "closed" ? "border-rose-500 bg-rose-500" : "border-slate-300"
                  }`}>
                    {portalStatus === "closed" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">Closed / Locked</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Portal is paused. Visitors see a friendly locked screen with your customized notice message.
                  </p>
                </div>
              </div>

            </div>

            {/* Scheduled Date Time Picker */}
            {portalStatus === "scheduled" && (
              <div className="p-5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2 animate-scale-up">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Automatic Portal Opening Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={portalOpenTime}
                  onChange={(e) => setPortalOpenTime(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <p className="text-[11px] text-amber-700 font-medium">
                  When this timestamp is reached, the portal will unlock automatically for all verified attendees.
                </p>
              </div>
            )}
          </div>

          {/* Welcome Message & Announcements */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Portal Welcome Message & Announcements</h3>
              <p className="text-xs text-slate-500 font-medium">This announcement is pinned at the top of the attendee portal home screen and locked countdown screen.</p>
            </div>

            <textarea
              rows={4}
              value={portalMessage}
              onChange={(e) => setPortalMessage(e.target.value)}
              placeholder="e.g. Welcome delegates! Please stop by Hall B at 10:00 AM for the opening keynote."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
            />
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 2: FEATURE MODULES & TOGGLES                                  */}
      {/* ==================================================================== */}
      {activeTab === "modules" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Portal Feature Modules & Controls</h3>
              <p className="text-xs text-slate-500 font-medium">Enable or disable specific modules available to attendees inside their portal.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              
              {/* Module 1: Networking */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900">Delegate Directory & Networking</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Allows delegates to browse attendees and send connection requests.</p>
                </div>
                <input
                  type="checkbox"
                  checked={portalSettings.networking ?? true}
                  onChange={(e) => setPortalSettings(prev => ({ ...prev, networking: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-blue-600 cursor-pointer accent-blue-600 mt-1"
                />
              </div>

              {/* Module 2: Agenda */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900">Agenda & Schedule Bookmarking</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Enables interactive session browsing and personal agenda building.</p>
                </div>
                <input
                  type="checkbox"
                  checked={portalSettings.agenda ?? true}
                  onChange={(e) => setPortalSettings(prev => ({ ...prev, agenda: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-blue-600 cursor-pointer accent-blue-600 mt-1"
                />
              </div>

              {/* Module 3: Exhibitors & Sponsors */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-amber-600" />
                    <h4 className="text-xs font-black text-slate-900">Exhibitors & Sponsors Showcase</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Showcases company demo pods, booth numbers, and partner tiers.</p>
                </div>
                <input
                  type="checkbox"
                  checked={portalSettings.exhibitors ?? true}
                  onChange={(e) => setPortalSettings(prev => ({ ...prev, exhibitors: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-blue-600 cursor-pointer accent-blue-600 mt-1"
                />
              </div>

              {/* Module 4: Floor Plans */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-purple-600" />
                    <h4 className="text-xs font-black text-slate-900">Interactive Venue Floor Plans</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Displays 2D venue blueprints, halls, and booth locators.</p>
                </div>
                <input
                  type="checkbox"
                  checked={portalSettings.floorplans ?? true}
                  onChange={(e) => setPortalSettings(prev => ({ ...prev, floorplans: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-blue-600 cursor-pointer accent-blue-600 mt-1"
                />
              </div>

              {/* Module 5: Downloadable Resources */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600" />
                    <h4 className="text-xs font-black text-slate-900">Downloadable Resources & PDFs</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Enables access to official summit documents, whitepapers, and guides.</p>
                </div>
                <input
                  type="checkbox"
                  checked={portalSettings.resources ?? true}
                  onChange={(e) => setPortalSettings(prev => ({ ...prev, resources: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-blue-600 cursor-pointer accent-blue-600 mt-1"
                />
              </div>

              {/* Module 6: Live Announcements */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Megaphone size={16} className="text-rose-600" />
                    <h4 className="text-xs font-black text-slate-900">Live Announcements Banner</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Displays real-time organizer broadcast notices at the top of the portal.</p>
                </div>
                <input
                  type="checkbox"
                  checked={portalSettings.announcements ?? true}
                  onChange={(e) => setPortalSettings(prev => ({ ...prev, announcements: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-blue-600 cursor-pointer accent-blue-600 mt-1"
                />
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 3: SHARE & QR PASS                                            */}
      {/* ==================================================================== */}
      {activeTab === "share" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Card 1: Sharable Portal Link */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share2 size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Direct Attendee Portal Link</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Distribute this unique URL in your confirmation emails, website links, or SMS blasts. Attendees will sign in with their ticket email.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  readOnly
                  value={portalUrl}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>Security Access Guard</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Only delegates with approved tickets matching their login email address are granted access.
              </p>
            </div>
          </div>

          {/* Card 2: High-Res QR Code */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Printable Portal QR Code</h3>
              <p className="text-xs text-slate-500 font-medium">
                Place this QR code on event badges, roll-up banners, and badges for instant mobile ingress.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto shadow-inner">
              {portalQrUrl ? (
                <img src={portalQrUrl} alt="Portal QR Code" className="w-44 h-44 object-contain rounded-xl bg-white p-2 shadow-2xs" />
              ) : (
                <div className="w-44 h-44 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                  <QrCode size={36} />
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleDownloadQr}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Download High-Res QR Image</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 4: EMAIL BROADCAST                                            */}
      {/* ==================================================================== */}
      {activeTab === "broadcast" && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5 animate-fade-in max-w-3xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-blue-600" />
              <h3 className="text-base font-black text-slate-900">Broadcast Portal Invitation to All Attendees</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Dispatch a personalized email notification containing the portal access link to all <strong>{attendees.length} confirmed delegates</strong>.
            </p>
          </div>

          <form onSubmit={handleDispatchBroadcast} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Subject Line
              </label>
              <input
                type="text"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Message Body
              </label>
              <textarea
                rows={5}
                value={broadcastNote}
                onChange={(e) => setBroadcastNote(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Total Recipients:</span>
                <span className="font-bold text-slate-900">{attendees.length} Confirmed Attendees</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Direct Access Button Link:</span>
                <span className="font-mono text-blue-600 text-[11px] truncate max-w-xs">{portalUrl}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isBroadcasting || attendees.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : broadcastDone ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    <span>Broadcast Sent Successfully!</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Send Portal Access Email to {attendees.length} Attendees</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 5: CONFIRMED DELEGATES LIST                                   */}
      {/* ==================================================================== */}
      {activeTab === "delegates" && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered delegates by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 px-2">
              Showing {filteredAttendees.length} of {attendees.length} delegates
            </span>
          </div>

          {filteredAttendees.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <Users size={32} className="text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No attendees found</h4>
              <p className="text-xs text-slate-400">Confirmed attendees will automatically appear here once registered.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Attendee Name</th>
                      <th className="py-3 px-4">Registered Email</th>
                      <th className="py-3 px-4">Company / Organization</th>
                      <th className="py-3 px-4">Ticket Tier</th>
                      <th className="py-3 px-4 text-right">Portal Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAttendees.map((att, idx) => (
                      <tr key={att.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {att.name || `${att.firstName || ""} ${att.lastName || ""}`.trim() || "Delegate"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{att.email || "—"}</td>
                        <td className="py-3 px-4 text-slate-700">{att.company || att.organization || "—"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {att.ticketType || att.ticket_type || "Standard"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 size={13} />
                            <span>Authorized</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}