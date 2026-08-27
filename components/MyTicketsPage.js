/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useId } from "react";
import { 
  Ticket, Calendar, MapPin, QrCode, Download, 
  Printer, ArrowLeft, Search, Filter, Sparkles, 
  ExternalLink, Layers, CheckCircle2, Copy, Check, 
  X, ShieldCheck, Share2, Eye, User, Clock, Building2, Lock, Globe
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import UniversalTopBar from "./UniversalTopBar";
import A4BadgeSheet, { printA4BadgeDocument } from "./A4BadgeSheet";

export default function MyTicketsPage({
  registrations = [],
  events = [],
  currentUser,
  onGoToHome,
  onOpenAuth,
  onOpenProfile,
  onOpenCreationWizard,
  onOpenEventsHub,
  onSignOut,
  onViewFloorPlan,
  onViewLivePage,
  onOpenAttendeePortal
}) {
  const { t, lang, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // QR Code data URLs: { [regId]: string }
  const [qrCodeUrls, setQrCodeUrls] = useState({});
  
  // Enlarged QR modal
  const [selectedQrPass, setSelectedQrPass] = useState(null);

  // Printable A6 Badge Modal
  const [selectedBadgePass, setSelectedBadgePass] = useState(null);

  // Generate QR codes for all registrations
  useEffect(() => {
    const generateQRs = async () => {
      const urls = {};
      for (const reg of registrations) {
        try {
          const qrData = JSON.stringify({
            badgeCode: reg.badgeCode,
            eventId: reg.eventId,
            eventTitle: reg.eventTitle,
            attendeeName: reg.attendeeName || currentUser?.fullName || "Attendee",
            ticketType: reg.ticketType,
            verified: true,
            platform: "Eventzone"
          });
          const url = await QRCode.toDataURL(qrData, {
            width: 320,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" }
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
  }, [registrations, currentUser]);

  const handleCopyCode = (code, id) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQR = (reg) => {
    const url = qrCodeUrls[reg.id];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `Eventzone-Pass-${reg.badgeCode || reg.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAddToCalendar = (reg) => {
    const title = encodeURIComponent(reg.eventTitle || "Conference Event");
    const details = encodeURIComponent(`Your badge code is: ${reg.badgeCode}\nAccess Tier: ${reg.ticketType}\nIssued by Eventzone`);
    const location = encodeURIComponent(reg.location || "Venue");
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalUrl, "_blank");
  };

  const filteredRegistrations = registrations.filter(reg => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (reg.eventTitle || "").toLowerCase().includes(q) ||
      (reg.location || "").toLowerCase().includes(q) ||
      (reg.badgeCode || "").toLowerCase().includes(q) ||
      (reg.ticketType || "").toLowerCase().includes(q);

    const matchesTier = filterTier === "all" || 
      (filterTier === "vip" && (reg.ticketType || "").toLowerCase().includes("vip")) ||
      (filterTier === "standard" && !(reg.ticketType || "").toLowerCase().includes("vip"));

    return matchesSearch && matchesTier;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Universal SaaS Top Bar */}
      <UniversalTopBar
        currentUser={currentUser}
        registrations={registrations}
        onGoToHome={onGoToHome}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onOpenPassesModal={() => {}}
        onOpenCreationWizard={onOpenCreationWizard}
        onOpenEventsHub={onOpenEventsHub}
        onSignOut={onSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Header Title & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={onGoToHome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>{t("event.backToEvents", "Back to Events")}</span>
              </button>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                {t("nav.myTickets", "My Tickets")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs shrink-0">
                <Ticket size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {t("passes.title", "My Digital Passes")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {t("passes.subtitle", "Your active credentials, QR codes, and entry badges.")}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verified Passes</span>
                <span className="text-sm font-black text-slate-900">{registrations.length} Active</span>
              </div>
            </div>

            <button
              onClick={onGoToHome}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-blue-600/20 hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{t("passes.browseEvents", "Browse Events")}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {registrations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("tickets.searchPlaceholder", "Search tickets by event, venue, badge code...")}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setFilterTier("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTier === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All ({registrations.length})
              </button>
              <button
                onClick={() => setFilterTier("vip")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTier === "vip"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                VIP Passes
              </button>
              <button
                onClick={() => setFilterTier("standard")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTier === "standard"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Standard
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {registrations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
              <Ticket size={32} className="stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {t("passes.noPasses", "No Active Passes Yet")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                {t("passes.noPassesDesc", "Register for upcoming conferences to access your instant digital badges here.")}
              </p>
            </div>
            <button
              onClick={onGoToHome}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles size={15} />
              <span>{t("passes.browseEvents", "Browse Events")}</span>
            </button>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <p className="text-xs text-slate-500 font-bold">No tickets match your search filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterTier("all");
              }}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Tickets Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRegistrations.map(reg => {
              const isVip = (reg.ticketType || "").toLowerCase().includes("vip");
              const isPending = reg.status === "pending" || Boolean(reg.requiresApproval);
              const qrUrl = qrCodeUrls[reg.id];
              const attendeeName = reg.attendeeName || currentUser?.fullName || "Attendee";
              const attendeeEmail = reg.email || currentUser?.email || "Registered Attendee";

              return (
                <div 
                  key={reg.id}
                  className={`bg-white border rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group ${
                    isPending ? "border-amber-200/90" : "border-slate-200 hover:border-indigo-200"
                  }`}
                >
                  {/* Top Header Strip with Tier & Status */}
                  <div className={`px-6 py-3.5 flex items-center justify-between border-b ${
                    isPending
                      ? "bg-amber-50/60 border-amber-100"
                      : isVip 
                      ? "bg-amber-50/40 border-amber-100/80" 
                      : "bg-slate-50/80 border-slate-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-2xs ${
                        isVip 
                          ? "bg-amber-500 text-white border-amber-600" 
                          : "bg-indigo-650 text-white border-indigo-700"
                      }`}>
                        {reg.ticketType || "Standard Admission"}
                      </span>

                      {isPending ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 flex items-center gap-1.5">
                          <Clock size={11} className="stroke-[2.5]" />
                          <span>Pending Review</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 flex items-center gap-1.5">
                          <CheckCircle2 size={11} className="stroke-[2.5] text-emerald-600" />
                          <span>Confirmed</span>
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <span className="text-[11px] font-semibold text-amber-700">
                        Awaiting Approval
                      </span>
                    )}
                  </div>

                  {/* Main Ticket Body */}
                  <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                    {/* Left: Event Details & Attendee */}
                    <div className="space-y-4 flex-1 text-left min-w-0">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-indigo-650 transition-colors truncate">
                          {reg.eventTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3.5 mt-2 text-xs text-slate-500 font-medium">
                          {reg.startDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400 shrink-0" />
                              <span>{reg.startDate}</span>
                            </span>
                          )}
                          {reg.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[220px]">{reg.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Attendee Info Box */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                          {attendeeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">
                            {attendeeName}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {attendeeEmail}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Interactive Live QR Code or Pending Locked State */}
                    {isPending ? (
                      <div className="flex flex-col items-center shrink-0">
                        <div 
                          className="p-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-2xs w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center text-amber-700 select-none text-center"
                          title="Door QR pass will be unlocked upon organizer approval"
                        >
                          <Lock size={22} className="stroke-[2.3] mb-1 text-amber-600" />
                          <span className="text-[9px] font-black uppercase tracking-tight">QR Locked</span>
                          <span className="text-[8px] text-amber-800/80 leading-tight mt-0.5">Awaiting Review</span>
                        </div>
                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-1.5 flex items-center gap-0.5">
                          <Clock size={10} /> Under Review
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center shrink-0">
                        <div 
                          onClick={() => setSelectedQrPass(reg)}
                          className="p-2 bg-slate-50/80 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer group/qr relative"
                          title="Click to enlarge QR Code"
                        >
                          {qrUrl ? (
                            <img 
                              src={qrUrl} 
                              alt="QR Pass" 
                              className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-xl bg-white p-1"
                            />
                          ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 rounded-xl flex items-center justify-center">
                              <QrCode size={32} className="text-slate-300 animate-pulse" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye size={13} />
                            <span>Enlarge</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                          Scan at Gate
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-150 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Printable A6 Badge Action or Locked State */}
                      {isPending ? (
                        <button
                          disabled
                          className="px-3.5 py-2 bg-slate-100 text-slate-400 border border-slate-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-75"
                          title="Printable badge is locked while application is under review"
                        >
                          <Lock size={12} className="text-amber-600" />
                          <span>Badge Locked</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedBadgePass(reg)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-slate-300"
                          title="Print Official A6 Conference Badge"
                        >
                          <Printer size={13} className="text-indigo-650" />
                          <span>{t("passes.printBadge", "Print Badge")}</span>
                        </button>
                      )}

                      {/* Download QR (Only for confirmed passes) */}
                      {!isPending && (
                        <button
                          onClick={() => handleDownloadQR(reg)}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                          title={t("passes.downloadQR", "Save QR Code")}
                        >
                          <Download size={14} />
                        </button>
                      )}

                      {/* Add to Calendar */}
                      <button
                        onClick={() => handleAddToCalendar(reg)}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                        title="Add to Google Calendar"
                      >
                        <Calendar size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Attendee Portal Shortcut */}
                      <button
                        onClick={() => onOpenAttendeePortal && onOpenAttendeePortal(reg.eventId)}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-blue-300"
                        title="Access Interactive Attendee Portal"
                      >
                        <Globe size={13} className="text-blue-600" />
                        <span>{t("dash.attendeePortal", "Attendee Portal")}</span>
                      </button>

                      {/* View Event Details */}
                      <button
                        onClick={() => onViewLivePage && onViewLivePage(reg.eventId)}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:shadow"
                      >
                        <span>{t("event.about", "About")}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 1. ENLARGED QR PASS MODAL                                            */}
      {/* ==================================================================== */}
      {selectedQrPass && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-scale-up relative">
            <button
              onClick={() => setSelectedQrPass(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center mx-auto border border-indigo-100">
              <QrCode size={24} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block mb-1">
                {selectedQrPass.ticketType}
              </span>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {selectedQrPass.eventTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedQrPass.attendeeName || currentUser?.fullName || "Attendee"}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
              {qrCodeUrls[selectedQrPass.id] && (
                <img 
                  src={qrCodeUrls[selectedQrPass.id]} 
                  alt="Enlarged QR Pass" 
                  className="w-56 h-56 object-contain rounded-xl shadow-xs bg-white p-1"
                />
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleDownloadQR(selectedQrPass)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Save QR Image</span>
              </button>
              <button
                onClick={() => {
                  const pass = selectedQrPass;
                  setSelectedQrPass(null);
                  setSelectedBadgePass(pass);
                }}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-650/20 flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. OFFICIAL A4 4-FOLD PRINTABLE CONFERENCE BADGE MODAL               */}
      {/* ==================================================================== */}
      {selectedBadgePass && (() => {
        const matchedEvent = events.find(e => e.id === selectedBadgePass.eventId) || {};
        const badgeTemplateUrl = selectedBadgePass.templateUrl || selectedBadgePass.badgeUrl || matchedEvent.badgeUrl || "";
        const badgeSettings = selectedBadgePass.badgeSettings || matchedEvent.badgeSettings || {};
        const answers = selectedBadgePass.answers || selectedBadgePass.customAnswers || selectedBadgePass.formAnswers || {};
        let attendeeCompany = selectedBadgePass.company || "";
        let attendeeJobTitle = selectedBadgePass.jobTitle || selectedBadgePass.job_title || "";

        if (typeof answers === "object") {
          for (const [k, v] of Object.entries(answers)) {
            if (!v || typeof v !== "string") continue;
            const key = k.toLowerCase();
            if (!attendeeCompany && (key.includes("company") || key.includes("organization") || key.includes("societe") || key.includes("entreprise"))) {
              attendeeCompany = String(v).trim();
            }
            if (!attendeeJobTitle && (key.includes("job") || key.includes("title") || key.includes("function") || key.includes("profession") || key.includes("poste") || key.includes("role") || key.includes("fonction"))) {
              attendeeJobTitle = String(v).trim();
            }
          }
        }

        const attendeeName = selectedBadgePass.attendeeName || selectedBadgePass.name || currentUser?.fullName || "Attendee";
        const attendeePhoto = selectedBadgePass.attendeePhoto || selectedBadgePass.photo || selectedBadgePass.avatar || currentUser?.avatar || "";
        const ticketType = selectedBadgePass.ticketType || "General Admission";
        const badgeCode = selectedBadgePass.badgeCode || "EZ-PASS";
        const eventTitle = selectedBadgePass.eventTitle || "Conference Event";
        const qrUrl = qrCodeUrls[selectedBadgePass.id] || "";

        const handlePrint = () => {
          printA4BadgeDocument({
            templateUrl: badgeTemplateUrl,
            attendeeName,
            attendeePhoto,
            attendeeCompany,
            attendeeJobTitle,
            ticketType,
            badgeCode,
            eventTitle,
            qrCodeUrl: qrUrl,
            showFoldGuide: badgeSettings.showFoldGuide !== false,
            showPhoto: badgeSettings.showPhoto !== false,
            showQr: badgeSettings.showQr !== false,
            cardTheme: badgeSettings.cardTheme || "white"
          });
        };

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto font-sans">
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 animate-scale-up relative my-8 text-slate-900">
              <button
                onClick={() => setSelectedBadgePass(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
              >
                <X size={18} />
              </button>

              <div className="flex items-center justify-center gap-2">
                <Printer size={20} className="text-indigo-650" />
                <h3 className="text-lg font-black text-slate-900">Official A4 4-Fold Badge Sheet</h3>
              </div>

              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fold along the center guidelines to create a dual-sided conference neck badge for your lanyard sleeve.
              </p>

              {/* A4 4-Fold Sheet Preview Container */}
              <div className="w-full max-w-[340px] sm:max-w-[370px] mx-auto shadow-xl rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <A4BadgeSheet
                  templateUrl={badgeTemplateUrl}
                  attendeeName={attendeeName}
                  attendeePhoto={attendeePhoto}
                  attendeeCompany={attendeeCompany}
                  attendeeJobTitle={attendeeJobTitle}
                  ticketType={ticketType}
                  badgeCode={badgeCode}
                  eventTitle={eventTitle}
                  qrCodeUrl={qrUrl}
                  showFoldGuide={badgeSettings.showFoldGuide !== false}
                  showPhoto={badgeSettings.showPhoto !== false}
                  showQr={badgeSettings.showQr !== false}
                  cardTheme={badgeSettings.cardTheme || "white"}
                />
              </div>

              {/* Print & Close Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedBadgePass(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-650/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
