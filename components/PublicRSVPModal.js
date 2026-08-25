/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  CheckCircle2, X, AlertCircle, Calendar, Clock, MapPin, 
  Users, UserPlus, Download, Check, 
  Send, HelpCircle, ShieldCheck, QrCode, ArrowRight, UserCheck, AlertTriangle, XCircle
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import QRCode from "qrcode";
import CountryPhoneInput from "./CountryPhoneInput";

export default function PublicRSVPModal({
  isOpen,
  onClose,
  event = {},
  rsvpSettings = {},
  existingHeadcount = 0,
  onSubmitRSVP,
  currentUser = null
}) {
  const { t, isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form State
  const [status, setStatus] = useState("attending"); // "attending" | "declined" | "tentative"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [plusOnesNames, setPlusOnesNames] = useState([""]);
  const [notes, setNotes] = useState("");

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  // Pre-fill user profile if logged in
  useEffect(() => {
    if (currentUser && isOpen) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.companyName) setCompany(currentUser.companyName);
      if (currentUser.jobTitle) setJobTitle(currentUser.jobTitle);
    }
  }, [currentUser, isOpen]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setSubmitResult(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  // Settings & Capacity
  const capacityLimit = rsvpSettings?.capacityLimit || rsvpSettings?.capacity_limit || event?.capacity || 150;
  const isEnabled = rsvpSettings?.isEnabled ?? rsvpSettings?.is_enabled ?? true;
  const allowPlusOnes = rsvpSettings?.allowPlusOnes ?? rsvpSettings?.allow_plus_ones ?? true;
  const maxPlusOnes = rsvpSettings?.maxPlusOnes ?? rsvpSettings?.max_plus_ones ?? 2;
  const allowWaitlist = rsvpSettings?.allowWaitlist ?? rsvpSettings?.allow_waitlist ?? true;
  const deadline = rsvpSettings?.deadline;

  const isDeadlinePassed = deadline ? new Date(deadline) < new Date() : false;
  const isFull = existingHeadcount >= capacityLimit;
  const willBeWaitlisted = isFull && allowWaitlist && status === "attending";

  // Formatted date string
  const formattedDate = useMemo(() => {
    if (!event?.startDate) return "";
    try {
      const d = new Date(event.startDate);
      if (isNaN(d.getTime())) return event.startDate;
      const opts = { month: 'short', day: 'numeric', year: 'numeric' };
      if (event.endDate && event.endDate !== event.startDate) {
        const endD = new Date(event.endDate);
        if (!isNaN(endD.getTime())) {
          return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString(undefined, opts)}`;
        }
      }
      return d.toLocaleDateString(undefined, opts);
    } catch {
      return event.startDate;
    }
  }, [event?.startDate, event?.endDate]);

  // Plus ones names handler
  const handlePlusOnesChange = (count) => {
    const num = Math.max(0, Math.min(count, maxPlusOnes));
    setPlusOnes(num);
    const newNames = [...plusOnesNames];
    while (newNames.length < num) newNames.push("");
    setPlusOnesNames(newNames.slice(0, num));
  };

  const handleCompanionNameChange = (index, val) => {
    const updated = [...plusOnesNames];
    updated[index] = val;
    setPlusOnesNames(updated);
  };

  // Generate QR Code on success
  useEffect(() => {
    if (isSubmitted && submitResult?.rsvp?.id) {
      const codePayload = JSON.stringify({
        id: submitResult.rsvp.id,
        event: event?.title || "Eventzone Event",
        guest: submitResult.rsvp.fullName,
        headcount: 1 + (submitResult.rsvp.plusOnes || 0),
        status: submitResult.rsvp.status,
      });
      QRCode.toDataURL(codePayload, { width: 220, margin: 1, color: { dark: '#0b5cdb', light: '#ffffff' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error("QR Code error:", err));
    }
  }, [isSubmitted, submitResult, event]);

  // Open Google Calendar with pre-populated event details
  const handleAddToGoogleCalendar = () => {
    try {
      const title = event?.title || event?.name || "Eventzone Summit";
      const desc = event?.description || `Confirmed RSVP for ${fullName || "Guest"}. Attendance registered on Eventzone.`;
      const loc = event?.location || "Algiers";

      const cleanTitle = encodeURIComponent(title);
      const cleanDetails = encodeURIComponent(desc);
      const cleanLocation = encodeURIComponent(loc);

      const sDateStr = event?.startDate || event?.start_date || event?.date || "2026-10-12";
      const eDateStr = event?.endDate || event?.end_date || sDateStr;

      const formatGCalDate = (dStr, isEnd = false) => {
        if (!dStr) return "";
        try {
          const parsed = new Date(dStr);
          if (!isNaN(parsed.getTime())) {
            if (isEnd) {
              parsed.setUTCDate(parsed.getUTCDate() + 1);
            }
            const yyyy = parsed.getUTCFullYear();
            const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(parsed.getUTCDate()).padStart(2, "0");
            return `${yyyy}${mm}${dd}`;
          }
        } catch {}
        return String(dStr).replace(/[^0-9]/g, "");
      };

      const startG = formatGCalDate(sDateStr);
      const endG = formatGCalDate(eDateStr, true);
      const datesParam = startG && endG ? `&dates=${startG}/${endG}` : "";

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${cleanTitle}&details=${cleanDetails}&location=${cleanLocation}${datesParam}`;
      window.open(gcalUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      window.open("https://calendar.google.com", "_blank", "noopener,noreferrer");
    }
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (isDeadlinePassed) {
      setErrorMessage(t("rsvp.deadlinePassed", "The RSVP deadline for this event has passed."));
      return;
    }

    if (!isEnabled) {
      setErrorMessage("RSVP is currently closed for this event.");
      return;
    }

    if (isFull && !allowWaitlist && status === "attending") {
      setErrorMessage("This event is at maximum capacity and not accepting further responses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        status,
        plusOnes: status === "attending" ? plusOnes : 0,
        plusOnesNames: status === "attending" ? plusOnesNames.filter(n => n.trim()) : [],
        notes: notes.trim(),
        userId: currentUser?.id || null
      };

      let result = null;
      if (onSubmitRSVP) {
        result = await onSubmitRSVP(payload);
      } else {
        // Fallback to Next.js API
        const targetEventId = event?.id || "00000000-0000-0000-0000-000000000001";
        const res = await fetch(`/api/events/${targetEventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to submit RSVP");
        }
      }

      setSubmitResult(result || { success: true, rsvp: payload, assignedStatus: status });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Public RSVP submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred while submitting your RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/45 backdrop-blur-md animate-fade-in overflow-y-auto font-sans">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scale-up text-slate-900 flex flex-col max-h-[90vh]"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* ─────────────────────────────────────────────
            1. HEADER SECTION (FIXED AT TOP)
        ───────────────────────────────────────────── */}
        <div className="p-5 sm:px-6 sm:py-5 border-b border-slate-150 bg-gradient-to-b from-slate-50/90 to-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              {willBeWaitlisted && (
                <div className="mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                    <Clock size={11} />
                    <span>Waitlist Priority</span>
                  </span>
                </div>
              )}
              
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
                {event?.title || event?.name || "Eventzone Summit"}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                {formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13.5} className="text-slate-400 shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                )}
                {event?.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13.5} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[280px]">{event.location}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs mt-0.5"
              aria-label="Close modal"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            2. MODAL BODY (SCROLLABLE OR SUCCESS)
        ───────────────────────────────────────────── */}
        {isSubmitted ? (
          <div className="p-6 sm:p-7 flex-1 overflow-y-auto space-y-6 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex flex-col items-center text-center py-2 space-y-5 animate-scale-up">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-md ${
                submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted
                  ? 'bg-amber-500 text-white shadow-amber-500/25'
                  : status === 'declined'
                  ? 'bg-slate-700 text-white shadow-slate-700/25'
                  : 'bg-emerald-500 text-white shadow-emerald-500/25'
              }`}>
                {submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted ? (
                  <Clock size={32} />
                ) : status === 'declined' ? (
                  <Check size={32} />
                ) : (
                  <CheckCircle2 size={32} />
                )}
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-xl font-black text-slate-900">
                  {submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted
                    ? t("rsvp.waitlistSuccess", "Added to Priority Waitlist!")
                    : status === "declined"
                    ? "Response Recorded"
                    : t("rsvp.submitSuccess", "RSVP Confirmed!")}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted
                    ? t("rsvp.waitlistSuccessDesc", "The event is currently at full capacity. We've reserved your priority waitlist place and will notify you as soon as a spot opens.")
                    : status === "declined"
                    ? "Thank you for letting us know. We hope to see you at future events."
                    : t("rsvp.submitSuccessDesc", "Your attendance has been registered. A digital confirmation pass has been created for your entry.")}
                </p>
              </div>

              {/* Digital Pass Card */}
              {status !== "declined" && (
                <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 text-left shadow-2xs">
                  <div className="space-y-2 flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Digital Guest Pass</span>
                    <div className="text-sm font-bold text-slate-900 truncate">{fullName}</div>
                    <div className="text-xs text-slate-500 truncate">{email}</div>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {1 + plusOnes} {1 + plusOnes === 1 ? "Guest" : "Guests (You + " + plusOnes + ")"}
                      </span>
                    </div>
                  </div>

                  {qrCodeDataUrl && (
                    <div className="flex flex-col items-center shrink-0 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
                      <img src={qrCodeDataUrl} alt="RSVP QR Code" className="w-24 h-24 object-contain" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider">Pass QR</span>
                    </div>
                  )}
                </div>
              )}

              {/* Success Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
                {status === "attending" && (
                  <button
                    type="button"
                    onClick={handleAddToGoogleCalendar}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Calendar size={14} />
                    <span>{t("rsvp.addToCalendar", "Add to Calendar")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t("common.done", "Done")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SUBMISSION FORM WITH FIXED FOOTER */
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">

              {/* Notice Banners */}
              {isDeadlinePassed && (
                <div className="p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold">RSVP Deadline Passed:</span> Submissions for this event ended on {new Date(deadline).toLocaleDateString()}.
                  </div>
                </div>
              )}

              {!isDeadlinePassed && willBeWaitlisted && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                  <Clock size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Capacity Notice:</span> Confirmed capacity is reached ({existingHeadcount}/{capacityLimit}). New submissions are routed to the <span className="font-bold">Priority Waitlist</span>.
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. ATTENDANCE STATUS SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Will you be attending?</span>
                  <span className="text-[10px] text-blue-600 font-semibold">* Required</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Attending */}
                  <button
                    type="button"
                    onClick={() => setStatus("attending")}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      status === "attending"
                        ? "bg-blue-50/80 border-blue-600 text-slate-900 shadow-xs ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 size={18} className={status === "attending" ? "text-blue-600" : "text-slate-400"} />
                    <div className="leading-tight">
                      <span className="text-xs font-bold block">{t("rsvp.attending", "Attending")}</span>
                      <span className="text-[10px] text-slate-400 font-medium">I will be there</span>
                    </div>
                  </button>

                  {/* Tentative */}
                  <button
                    type="button"
                    onClick={() => setStatus("tentative")}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      status === "tentative"
                        ? "bg-amber-50/80 border-amber-500 text-slate-900 shadow-xs ring-2 ring-amber-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <HelpCircle size={18} className={status === "tentative" ? "text-amber-500" : "text-slate-400"} />
                    <div className="leading-tight">
                      <span className="text-xs font-bold block">{t("rsvp.tentative", "Tentative")}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Maybe / Undecided</span>
                    </div>
                  </button>

                  {/* Declined */}
                  <button
                    type="button"
                    onClick={() => setStatus("declined")}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      status === "declined"
                        ? "bg-rose-50/80 border-rose-500 text-slate-900 shadow-xs ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle size={18} className={status === "declined" ? "text-rose-500" : "text-slate-400"} />
                    <div className="leading-tight">
                      <span className="text-xs font-bold block">{t("rsvp.declined", "Declined")}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Cannot attend</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. CONTACT INFORMATION */}
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {t("rsvp.guestName", "Full Name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Elena Rostova"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {t("rsvp.email", "Email Address")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. elena@domain.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {t("rsvp.phone", "Phone Number")}
                    </label>
                    <CountryPhoneInput
                      value={phone}
                      onChange={setPhone}
                      placeholder="550 12 34 56"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {t("rsvp.company", "Company / Organization")}
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Energy Transition Corp"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. COMPANIONS (+1s) */}
              {status === "attending" && allowPlusOnes && maxPlusOnes > 0 && (
                <div className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{t("rsvp.bringingGuests", "Bringing Companion Guests (+1s)?")}</div>
                      <div className="text-[11px] text-slate-500">Up to {maxPlusOnes} additional guests allowed with your RSVP</div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                      {[...Array(maxPlusOnes + 1).keys()].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handlePlusOnesChange(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            plusOnes === n
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {n === 0 ? "0" : `+${n}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {plusOnes > 0 && (
                    <div className="space-y-2 pt-2.5 border-t border-slate-200/60">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        {t("rsvp.companionNames", "Companion Full Names")}
                      </label>
                      {plusOnesNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleCompanionNameChange(idx, e.target.value)}
                            placeholder={`Companion #${idx + 1} Full Name`}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. SPECIAL REQUESTS */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t("rsvp.specialRequests", "Special Requests or Notes")} <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Accessibility needs, question for speakers, arrival notes..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs resize-none"
                />
              </div>

            </div>

            {/* 6. PINNED BOTTOM ACTION BAR */}
            <div className="p-4 sm:px-6 border-t border-slate-150 bg-slate-50/80 shrink-0 flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold text-slate-500">
                {status === "attending" && (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} /> {1 + plusOnes} Attendee{1 + plusOnes > 1 ? "s" : ""}
                  </span>
                )}
                {status === "tentative" && (
                  <span className="text-amber-700 flex items-center gap-1">
                    <HelpCircle size={13} /> Tentative Response
                  </span>
                )}
                {status === "declined" && (
                  <span className="text-slate-500 flex items-center gap-1">
                    <XCircle size={13} /> Not Attending
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isDeadlinePassed}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                    status === 'declined'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                  } ${isSubmitting || isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>
                        {status === "declined"
                          ? "Submit Decline"
                          : willBeWaitlisted
                          ? "Join Waitlist"
                          : t("rsvp.publicRsvpNow", "Confirm RSVP")}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>,
    document.body
  );
}
