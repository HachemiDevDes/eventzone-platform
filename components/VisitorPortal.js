/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Ticket, Compass, Calendar, MapPin, 
  Sparkles, CheckCircle2, QrCode, ArrowRight, 
  ExternalLink, Building2, Search, Filter, 
  Download, Users, Layers, X, ShieldCheck, Lock, Clock
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import UniversalTopBar from "./UniversalTopBar";
import SearchableSelect from "./SearchableSelect";

export default function VisitorPortal({ 
  events = [], 
  registrations = [], 
  onRegisterForEvent, 
  onViewFloorPlan, 
  onViewLivePage,
  onOpenAttendeePortal,
  onSwitchToOrganizer, 
  onSignOut,
  onOpenProfile, 
  onGoToHome,
  onOpenAuth,
  user 
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("explore"); // "explore" | "my-passes"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Registration Modal State
  const [selectedEventToRsvp, setSelectedEventToRsvp] = useState(null);
  const [rsvpName, setRsvpName] = useState(user?.fullName || "");
  const [rsvpEmail, setRsvpEmail] = useState(user?.email || "");
  const [rsvpTicketType, setRsvpTicketType] = useState("General Admission");
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccessPass, setRsvpSuccessPass] = useState(null);

  // QR Code Map for registered passes: { [passId]: dataUrl }
  const [qrCodeUrls, setQrCodeUrls] = useState({});

  // Generate QR codes for all registrations
  useEffect(() => {
    const generateQRs = async () => {
      const urls = {};
      for (const reg of registrations) {
        try {
          const qrData = JSON.stringify({
            passId: reg.id,
            badgeCode: reg.badgeCode,
            eventId: reg.eventId,
            eventTitle: reg.eventTitle,
            attendeeName: user?.fullName || "Attendee",
            ticketType: reg.ticketType,
          });
          const url = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 1,
            color: { dark: "#1e1b4b", light: "#ffffff" }
          });
          urls[reg.id] = url;
        } catch (e) {
          console.warn("QR code generation error:", e);
        }
      }
      setQrCodeUrls(urls);
    };

    if (registrations.length > 0) {
      generateQRs();
    }
  }, [registrations, user]);

  const categories = ["All", "Energy & Hydrocarbons", "Technology & Software", "Finance & Banking", "Healthcare & Pharmaceuticals"];

  const filteredEvents = events.filter(ev => {
    const matchesSearch = (ev.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || ev.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventToRsvp) return;
    setRsvpSubmitting(true);

    try {
      const newPass = await onRegisterForEvent(selectedEventToRsvp.id, {
        name: rsvpName || user?.fullName || "Attendee",
        email: rsvpEmail || user?.email || "visitor@eventzone.io",
        ticketType: rsvpTicketType,
        eventTitle: selectedEventToRsvp.title,
        location: selectedEventToRsvp.location,
        startDate: selectedEventToRsvp.startDate,
        endDate: selectedEventToRsvp.endDate,
      });

      // Generate QR for new pass
      if (newPass) {
        const qrData = JSON.stringify({
          passId: newPass.id,
          badgeCode: newPass.badgeCode,
          eventId: newPass.eventId,
          eventTitle: newPass.eventTitle,
          attendeeName: user?.fullName || "Attendee",
          ticketType: newPass.ticketType,
        });
        const url = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
          color: { dark: "#1e1b4b", light: "#ffffff" }
        });
        setQrCodeUrls(prev => ({ ...prev, [newPass.id]: url }));
        setRsvpSuccessPass(newPass);
      }
    } catch (err) {
      console.error("RSVP error:", err);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Universal SaaS Top Bar */}
      <UniversalTopBar
        currentUser={user}
        registrations={registrations}
        onGoToHome={onGoToHome}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onOpenPassesModal={() => setActiveTab("my-passes")}
        onOpenEventsHub={onSwitchToOrganizer}
        onSignOut={onSignOut}
      />

      {/* Visitor Portal Sub-Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Visitor Portal
          </span>
        </div>

        {/* Tab Switcher in Center */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "explore" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Explore Summits
          </button>

          <button
            onClick={() => setActiveTab("my-passes")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "my-passes" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>My Digital Passes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold">
              {registrations.length}
            </span>
          </button>
        </div>

        <div className="w-24 hidden sm:block" />
      </div>

      {/* Mobile Tab Sub-bar */}
      <div className="md:hidden flex items-center justify-around bg-white border-b border-slate-200 p-2">
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold text-center ${
            activeTab === "explore" ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
          }`}
        >
          Explore Summits
        </button>
        <button
          onClick={() => setActiveTab("my-passes")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 ${
            activeTab === "my-passes" ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
          }`}
        >
          <span>My Passes</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
            {registrations.length}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* ==================================================================== */}
        {/* TAB 1: EXPLORE SUMMITS                                               */}
        {/* ==================================================================== */}
        {activeTab === "explore" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 overflow-hidden shadow-xl text-white">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
                  <Compass size={13} />
                  <span>Discover Industry Summits</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Explore Global Conferences & Register in 1-Click
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  Join premier forums, preview interactive venue floor plans, and access your instant digital door check-in pass.
                </p>
              </div>

              {/* Search input embedded in hero */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by conference name, topic, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-semibold text-white placeholder-slate-400 outline-none focus:bg-white/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Event Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(ev => {
                const isRegistered = registrations.some(r => r.eventId === ev.id);

                return (
                  <div
                    key={ev.id}
                    className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cover */}
                      <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                        <img 
                          src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"} 
                          alt={ev.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                        
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-md text-emerald-700 shadow-xs border border-white/50 uppercase tracking-wider">
                            {ev.type || "Hybrid"}
                          </span>
                        </div>

                        {isRegistered && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Registered</span>
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block drop-shadow-sm">
                            {ev.category || "Technology & Software"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {ev.tagline || ev.description || "Join delegates for keynotes, workshops, and exhibitions."}
                        </p>

                        <div className="space-y-1.5 pt-2 text-xs text-slate-600 font-medium border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-emerald-600 shrink-0" />
                            <span>{ev.startDate} — {ev.endDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={13} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pt-0 border-t border-slate-100 mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 pt-3">
                        <button
                          onClick={() => onViewFloorPlan && onViewFloorPlan(ev.id)}
                          className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer"
                        >
                          Floor Plan
                        </button>

                        <button
                          onClick={() => onViewLivePage && onViewLivePage(ev.id)}
                          className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer"
                        >
                          Live Page
                        </button>
                      </div>

                      {isRegistered ? (
                        <button
                          onClick={() => setActiveTab("my-passes")}
                          className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          View My Digital Pass
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedEventToRsvp(ev);
                            setRsvpSuccessPass(null);
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          Claim Free Pass / RSVP
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MY DIGITAL PASSES & QR BADGES                                 */}
        {/* ==================================================================== */}
        {activeTab === "my-passes" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  My Digital Tickets & QR Badges
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Present your scannable digital badge at the entrance for instant door check-in.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("explore")}
                className="self-start sm:self-auto px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Browse More Summits
              </button>
            </div>

            {registrations.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Ticket size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">No active passes found</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  You haven&apos;t claimed any summit passes yet. Explore upcoming industry events to generate your digital badge!
                </p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Explore Summits Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {registrations.map(reg => {
                  const isPending = reg.status === "pending" || Boolean(reg.requiresApproval);

                  return (
                    <div 
                      key={reg.id}
                      className={`bg-white border rounded-3xl shadow-lg overflow-hidden flex flex-col sm:flex-row relative ${
                        isPending ? "border-amber-200/90" : "border-slate-200/90"
                      }`}
                    >
                      {/* Left: Event Details */}
                      <div className="flex-1 p-6 sm:p-7 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-150">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                              {reg.ticketType || "VIP Access Pass"}
                            </span>
                            {isPending ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                <Clock size={11} className="stroke-[2.5]" /> Pending Review
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Confirmed
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
                            {reg.eventTitle}
                          </h3>

                          <div className="space-y-1.5 text-xs text-slate-600 font-medium mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-emerald-600 shrink-0" />
                              <span>{reg.startDate} — {reg.endDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={13} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{reg.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Attendee Info & Shortcuts */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attendee Name</span>
                              <span className="font-bold text-slate-800">{user?.fullName || "Attendee"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Badge Status</span>
                              <span className={`font-mono font-bold ${isPending ? "text-amber-700 text-[11px]" : "text-indigo-600"}`}>
                                {isPending ? "Pending Review" : (reg.badgeCode || "PASS-VIP-9824XA")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {!isPending && onOpenAttendeePortal && (
                              <button
                                onClick={() => onOpenAttendeePortal(reg.eventId)}
                                className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer"
                              >
                                Attendee Portal
                              </button>
                            )}

                            <button
                              onClick={() => onViewFloorPlan && onViewFloorPlan(reg.eventId)}
                              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                            >
                              View Floor Plan
                            </button>

                            <button
                              onClick={() => onViewLivePage && onViewLivePage(reg.eventId)}
                              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                            >
                              Live Page
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: QR Code Pass Badge or Pending Locked State */}
                      <div className="w-full sm:w-52 bg-slate-900 p-6 flex flex-col items-center justify-center text-center text-white relative">
                        {isPending ? (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1">
                              <Clock size={12} /> Under Review
                            </span>

                            {/* Locked QR Box */}
                            <div className="w-32 h-32 bg-slate-800/90 border border-amber-500/30 p-2 rounded-2xl shadow-inner flex flex-col items-center justify-center text-amber-400 gap-1 text-center select-none">
                              <Lock size={28} className="stroke-[2.2] mb-0.5" />
                              <span className="text-[9px] font-black uppercase tracking-tight text-amber-300">QR Locked</span>
                              <span className="text-[8px] text-slate-400 leading-tight">Activates when approved</span>
                            </div>

                            <span className="text-[10px] font-mono text-amber-400 font-bold mt-3">
                              STATUS: PENDING
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Awaiting organizer review</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-1">
                              <ShieldCheck size={12} /> Door Pass
                            </span>

                            {/* Rendered QR Code */}
                            <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center">
                              {qrCodeUrls[reg.id] ? (
                                <img src={qrCodeUrls[reg.id]} alt="QR Pass" className="w-full h-full" />
                              ) : (
                                <QrCode size={48} className="text-slate-800 animate-pulse" />
                              )}
                            </div>

                            <span className="text-[10px] font-mono text-slate-400 font-bold mt-3">
                              {reg.badgeCode || "PASS-VIP-9824XA"}
                            </span>
                            <span className="text-[9px] text-slate-500 mt-0.5">Scan at entrance</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RSVP Modal */}
      {selectedEventToRsvp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7">
            {rsvpSuccessPass ? (
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Pass Confirmed!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your digital ticket has been issued for <strong>{rsvpSuccessPass.eventTitle}</strong>.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-start text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Badge ID:</span> <span className="font-mono font-bold text-indigo-600">{rsvpSuccessPass.badgeCode}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Tier:</span> <span className="font-bold text-slate-800">{rsvpSuccessPass.ticketType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className="font-bold text-emerald-600">Active</span></div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedEventToRsvp(null);
                      setActiveTab("my-passes");
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    View in My Passes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-4">
                  <div className="flex items-center gap-2">
                    <Ticket size={18} className="text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">Claim Summit Pass</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedEventToRsvp(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-500 font-medium mb-4">
                  Registering for: <strong className="text-slate-800">{selectedEventToRsvp.title}</strong>
                </p>

                <form onSubmit={handleRsvpSubmit} className="space-y-4 text-start">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address for QR Pass
                    </label>
                    <input
                      type="email"
                      required
                      value={rsvpEmail}
                      onChange={(e) => setRsvpEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Access Tier
                    </label>
                    <SearchableSelect
                      value={rsvpTicketType}
                      onChange={(val) => setRsvpTicketType(val)}
                      options={[
                        { value: "General Admission", label: "General Admission (Keynotes + Expo Hall)" },
                        { value: "All-Access Pass", label: "All-Access Pass (Full floor plan + networking)" },
                        { value: "Online Only", label: "Online Stream Pass" }
                      ]}
                      placeholder="Select access tier..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {rsvpSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Generate Digital Pass"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
