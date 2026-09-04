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
        
        {/* Header Title & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("passes.title", "My Digital Passes")}
          </h1>

          {registrations.length > 0 && (
            <div className="relative w-full sm:w-80 md:w-96">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("tickets.searchPlaceholder", "Search tickets by event, venue, badge code...")}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-blue-600 outline-none transition-all"
              />
            </div>
          )}
        </div>

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
            <p className="text-xs text-slate-500 font-bold">{t("tickets.noMatchingTickets", "No tickets match your search filters.")}</p>
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
                  className={`relative bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row group ${
                    isPending ? "border-amber-200/90" : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  {/* ========================================================= */}
                  {/* LEFT: TICKET MAIN BODY & PRIMARY ACTIONS                  */}
                  {/* ========================================================= */}
                  <div className="flex-1 flex flex-col justify-between text-start rtl:text-right min-w-0">
                    <div className="p-6 space-y-4">
                      {/* Header Row: Tier Badge (and Pending state if pending) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                          isVip 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : "bg-slate-100 text-slate-700 border-slate-200/90"
                        }`}>
                          {reg.ticketType || "Standard Admission"}
                        </span>

                        {isPending && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 flex items-center gap-1.5 shrink-0">
                            <Clock size={11} className="stroke-[2.5]" />
                            <span>{t("tickets.pendingReview", "Pending Review")}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Boarding-Pass Details */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug truncate">
                          {reg.eventTitle}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                              Date
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Calendar size={13} className="text-blue-600 shrink-0" />
                              <span>{reg.startDate || "Date TBA"}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                              Venue
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="text-blue-600 shrink-0" />
                              <span className="truncate">{reg.location || "Online / TBA"}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Left Bottom Action Bar (Desktop only; on mobile consolidated into card footer) */}
                    <div className="hidden sm:flex px-6 py-3 bg-slate-50/40 border-t border-slate-200/70 items-center gap-2 mt-auto">
                      {isPending ? (
                        <button
                          disabled
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200/80 flex items-center justify-center cursor-not-allowed opacity-75 shrink-0"
                          title="Printable badge is locked while application is under review"
                        >
                          <Lock size={14} className="text-amber-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedBadgePass(reg)}
                          className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:border-slate-300 shrink-0"
                          title="Print Official A6 Conference Badge"
                        >
                          <Printer size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => handleAddToCalendar(reg)}
                        className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:border-slate-300 shrink-0"
                        title="Add to Google Calendar"
                      >
                        <Calendar size={14} />
                      </button>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* PERFORATION DIVIDER WITH TRUE OUTER CUTOUT NOTCHES        */}
                  {/* ========================================================= */}
                  {/* Desktop: Vertical from card top edge to card bottom edge */}
                  <div className="relative hidden sm:flex flex-col items-center justify-between w-0 shrink-0 select-none pointer-events-none">
                    {/* Top Notch: cleanly clips into card's top border */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-inner z-10" />
                    
                    {/* Full-height Vertical Dashed Perforation Line */}
                    <div className="h-full border-r-2 border-dashed border-slate-200/90" />
                    
                    {/* Bottom Notch: cleanly clips into card's bottom border */}
                    <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-inner z-10" />
                  </div>

                  {/* Mobile: Horizontal Perforation Divider */}
                  <div className="relative flex sm:hidden items-center justify-between h-0 shrink-0 select-none pointer-events-none">
                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-inner z-10" />
                    <div className="w-full border-b-2 border-dashed border-slate-200/90" />
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-inner z-10" />
                  </div>

                  {/* ========================================================= */}
                  {/* RIGHT / MOBILE BOTTOM: TICKET STUB / QR PASS              */}
                  {/* ========================================================= */}
                  <div className="sm:w-56 bg-white sm:bg-slate-50/70 flex flex-col justify-between text-center relative border-t-0 sm:border-t-0">
                    <div className="p-6 flex flex-col items-center justify-center flex-1 my-auto">
                      {/* Scannable QR Code */}
                      {isPending ? (
                        <div 
                          className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl shadow-2xs w-28 h-28 flex flex-col items-center justify-center text-amber-700 select-none text-center"
                          title="Door QR pass will be unlocked upon organizer approval"
                        >
                          <Lock size={22} className="stroke-[2.3] mb-1 text-amber-600" />
                          <span className="text-[9px] font-black uppercase tracking-tight">{t("tickets.qrLocked", "QR Locked")}</span>
                          <span className="text-[8px] text-amber-800/80 leading-tight mt-0.5">{t("tickets.awaitingReview", "Awaiting Review")}</span>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setSelectedQrPass(reg)}
                          className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group/qr relative"
                          title="Click to enlarge QR Code"
                        >
                          {qrUrl ? (
                            <img 
                              src={qrUrl} 
                              alt="QR Pass" 
                              className="w-28 h-28 object-contain rounded-xl bg-white p-0.5"
                            />
                          ) : (
                            <div className="w-28 h-28 bg-slate-100 rounded-xl flex items-center justify-center">
                              <QrCode size={32} className="text-slate-300 animate-pulse" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1 backdrop-blur-2xs">
                            <Eye size={13} />
                            <span>{t("tickets.enlarge", "Enlarge")}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Bottom Action Bar: Portal + View Event Details (+ Mobile Quick Actions) */}
                    <div className="px-4 sm:px-3 py-3 bg-slate-100/60 border-t border-slate-200/70 flex items-center justify-between sm:justify-center gap-2 sm:gap-1.5">
                      {/* Mobile-only left actions (Print Badge & Calendar) */}
                      <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                        {isPending ? (
                          <button
                            disabled
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200/80 flex items-center justify-center cursor-not-allowed opacity-75 shrink-0"
                            title="Printable badge is locked while application is under review"
                          >
                            <Lock size={14} className="text-amber-600" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedBadgePass(reg)}
                            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:border-slate-300 shrink-0"
                            title="Print Official A6 Conference Badge"
                          >
                            <Printer size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleAddToCalendar(reg)}
                          className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:border-slate-300 shrink-0"
                          title="Add to Google Calendar"
                        >
                          <Calendar size={14} />
                        </button>
                      </div>

                      {/* Right Action Buttons: Portal + About */}
                      <div className="flex items-center gap-2 sm:gap-1.5 flex-1 sm:flex-initial justify-end">
                        <button
                          onClick={() => onOpenAttendeePortal && onOpenAttendeePortal(reg.eventId)}
                          className="flex-1 sm:flex-initial py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-2xs hover:shadow active:scale-[0.98]"
                          title="Access Interactive Attendee Portal"
                        >
                          <span>Portal</span>
                        </button>
                        <button
                          onClick={() => onViewLivePage && onViewLivePage(reg.eventId)}
                          className="py-1.5 px-3 bg-transparent hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-[0.98]"
                        >
                          <span>{t("event.about", "About")}</span>
                        </button>
                      </div>
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
                <span>{t("tickets.saveQrImage", "Save QR Image")}</span>
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
                <span>{t("tickets.printBadgeBtn", "Print Badge")}</span>
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
                <h3 className="text-lg font-black text-slate-900">{t("tickets.officialA4Sheet", "Official A4 4-Fold Badge Sheet")}</h3>
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
                  <span>{t("tickets.printDocument", "Print Document")}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
