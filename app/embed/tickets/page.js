"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Ticket, CheckCircle2, Clock, Sparkles, ShieldCheck, AlertCircle, 
  ArrowRight, ArrowLeft, Download, Check, RefreshCw, QrCode, Building2, 
  User, Mail, Phone, Briefcase, ExternalLink, Calendar, MapPin
} from "lucide-react";
import QRCode from "qrcode";

function EmbedTicketsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || searchParams.get("id") || "cf12bb94-0cfb-4e0c-a96c-482a5c4e9021";
  const theme = searchParams.get("theme") || "light"; // "light" | "dark" | "slate"
  const primaryColor = searchParams.get("primaryColor") || searchParams.get("color") || "#2563eb";
  const preselectedTicketId = searchParams.get("ticketId") || searchParams.get("ticket") || null;
  const hideHeader = searchParams.get("hideHeader") === "true";
  const compact = searchParams.get("compact") === "true";
  const lang = searchParams.get("lang") || "en";

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);

  // Flow step: "select_tier" | "form" | "success"
  const [step, setStep] = useState("select_tier");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    referralCode: "",
  });
  const [customAnswers, setCustomAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  const isDark = theme === "dark";

  // 1. Fetch tickets and event data
  useEffect(() => {
    async function loadEventTickets() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/events/${eventId}/tickets`);
        if (!res.ok) {
          throw new Error(`Failed to load event tickets (${res.status})`);
        }
        const data = await res.json();
        if (data.success) {
          setEventData(data.event || null);
          setTickets(data.tickets || []);
          setForms(data.forms || []);

          // If pre-selected ticket provided
          if (preselectedTicketId && data.tickets?.length > 0) {
            const match = data.tickets.find(
              (t) => t.id === preselectedTicketId || t.name?.toLowerCase() === preselectedTicketId.toLowerCase()
            );
            if (match && !match.isSoldOut) {
              setSelectedTicket(match);
              setStep("form");
            }
          }
        } else {
          throw new Error(data.error || "Failed to load tickets");
        }
      } catch (err) {
        console.error("Embed widget load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadEventTickets();
    }
  }, [eventId, preselectedTicketId]);

  // Notify parent window of height changes for iframe auto-resizing
  useEffect(() => {
    function reportHeight() {
      if (typeof window !== "undefined" && window.parent) {
        const height = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.parent.postMessage({ type: "EVENTZONE_RESIZE", height: height + 20 }, "*");
      }
    }
    const timer = setTimeout(reportHeight, 150);
    window.addEventListener("resize", reportHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", reportHeight);
    };
  }, [step, loading, tickets, registrationResult]);

  const handleSelectTier = (t) => {
    if (t.isSoldOut) return;
    setSelectedTicket(t);
    setSubmitError(null);
    setStep("form");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomAnswerChange = (fieldId, value) => {
    setCustomAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Find linked custom form questions for this ticket tier
  const activeFormFields = useMemo(() => {
    if (!selectedTicket) return [];
    if (selectedTicket.formId) {
      const match = forms.find((f) => f.id === selectedTicket.formId);
      if (match && Array.isArray(match.fields)) return match.fields;
    }
    // Check if any form is tied by ticketId
    const tied = forms.find((f) => f.ticketId === selectedTicket.id);
    if (tied && Array.isArray(tied.fields)) return tied.fields;
    return [];
  }, [selectedTicket, forms]);

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setSubmitError("Please fill out your Full Name and Email Address.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        jobTitle: formData.jobTitle.trim(),
        ticketType: selectedTicket?.name || "Standard Admission",
        ticketId: selectedTicket?.id,
        requiresApproval: selectedTicket?.requiresApproval,
        referralCode: formData.referralCode.trim(),
        answers: customAnswers,
        source: "embed_widget",
      };

      const res = await fetch(`/api/events/${eventId}/tickets/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      setRegistrationResult(data);
      setStep("success");

      // Notify parent window via postMessage
      if (typeof window !== "undefined" && window.parent) {
        window.parent.postMessage(
          {
            type: "EVENTZONE_REGISTRATION_SUCCESS",
            data: data,
          },
          "*"
        );
      }
    } catch (err) {
      console.error("Embed registration error:", err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadBadge = () => {
    if (!registrationResult?.badge?.qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = registrationResult.badge.qrCodeUrl;
    link.download = `${registrationResult.attendee?.name || "ticket"}_badge_${registrationResult.badge.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFlow = () => {
    setStep("select_tier");
    setSelectedTicket(null);
    setFormData({ name: "", email: "", phone: "", company: "", jobTitle: "", referralCode: "" });
    setCustomAnswers({});
    setRegistrationResult(null);
    setSubmitError(null);
  };

  if (loading) {
    return (
      <div className={`w-full min-h-[400px] flex flex-col items-center justify-center p-8 ${isDark ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" style={{ borderTopColor: primaryColor }} />
        <p className="text-sm font-semibold text-slate-400">Loading tickets & checkout form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full p-8 rounded-3xl text-center border ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold mb-1">Unable to Load Tickets</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto rounded-3xl border transition-all overflow-hidden font-sans ${
      isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/90 text-slate-900 shadow-sm"
    }`}>
      {/* 1. Header Banner (Optional) */}
      {!hideHeader && eventData && (
        <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? "bg-slate-850 border-slate-800" : "bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-slate-150"
        }`}>
          <div className="flex items-center gap-3.5">
            {eventData.logoUrl ? (
              <img src={eventData.logoUrl} alt="Logo" className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs" style={{ backgroundColor: primaryColor }}>
                <Ticket size={20} />
              </div>
            )}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Official Ticket Registration
              </span>
              <h1 className="text-lg font-black tracking-tight leading-tight">{eventData.title}</h1>
              {(eventData.location || eventData.startDate) && (
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                  {eventData.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      {eventData.location}
                    </span>
                  )}
                  {eventData.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      {eventData.startDate}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Verified Eventzone Pass</span>
          </div>
        </div>
      )}

      {/* 2. Body Step Switcher */}
      <div className="p-6 md:p-8">
        {/* STEP 1: Select Ticket Tier */}
        {step === "select_tier" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Select Admission Tier</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose your pass to begin attendee registration.</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{tickets.length} available</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {tickets.map((t) => {
                const isFree = !t.price || t.price === 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTier(t)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      t.isSoldOut
                        ? "opacity-50 grayscale cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        : isDark
                        ? "bg-slate-800/60 border-slate-700 hover:border-blue-500 hover:bg-slate-800"
                        : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md"
                    }`}
                  >
                    {t.isPopular && !t.isSoldOut && (
                      <span
                        className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Popular Pass
                      </span>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tracking-tight">{t.name}</span>
                        {t.requiresApproval && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50">
                            Approval Required
                          </span>
                        )}
                        {t.isSoldOut && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      {t.features && t.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {t.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Check size={11} className="text-emerald-500 shrink-0" />
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-lg font-black tracking-tight">
                          {isFree ? "Free" : `${Number(t.price).toLocaleString()} ${t.currency || "DZD"}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={t.isSoldOut}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          t.isSoldOut
                            ? "bg-slate-200 text-slate-400 dark:bg-slate-700"
                            : "text-white shadow-xs group-hover:scale-102"
                        }`}
                        style={{ backgroundColor: t.isSoldOut ? undefined : primaryColor }}
                      >
                        <span>{t.isSoldOut ? "Sold Out" : "Select Pass"}</span>
                        {!t.isSoldOut && <ArrowRight size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Fill out Attendee Details */}
        {step === "form" && selectedTicket && (
          <form onSubmit={handleSubmitRegistration} className="space-y-6 animate-fade-in">
            {/* Header: Selected Tier Summary */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("select_tier")}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Change ticket tier"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Pass</span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold">{selectedTicket.name}</h3>
                    <span className="text-xs font-bold text-slate-500">
                      • {Number(selectedTicket.price || 0) === 0 ? "Free" : `${Number(selectedTicket.price).toLocaleString()} DZD`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("select_tier")}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                style={{ color: primaryColor }}
              >
                Change Tier
              </button>
            </div>

            {submitError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400 font-semibold animate-slide-down">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Core Fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Attendee Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User size={13} className="text-slate-400" />
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                      isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-2xs"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                      isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-2xs"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+213 555 12 34 56"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                      isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-2xs"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Innovations"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                      isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-2xs"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Briefcase size={13} className="text-slate-400" />
                    Job Title / Function
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Engineering"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                      isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-2xs"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Custom Attached Form Questions */}
            {activeFormFields.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-150 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Custom Questionnaire
                </h4>

                <div className="space-y-3.5">
                  {activeFormFields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>{field.label || field.title || "Question"}</span>
                        {field.required && <span className="text-rose-500 font-bold text-[10px]">*Required</span>}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          rows={2}
                          required={field.required}
                          value={customAnswers[field.id] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || ""}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                            isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900 shadow-2xs"
                          }`}
                        />
                      ) : field.type === "select" ? (
                        <select
                          required={field.required}
                          value={customAnswers[field.id] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                            isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900 shadow-2xs"
                          }`}
                        >
                          <option value="">-- Choose an option --</option>
                          {(field.options || []).map((opt, oi) => (
                            <option key={oi} value={typeof opt === "string" ? opt : opt.value}>
                              {typeof opt === "string" ? opt : opt.label || opt.value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          required={field.required}
                          value={customAnswers[field.id] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || ""}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                            isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900 shadow-2xs"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("select_tier")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 max-w-xs px-6 py-3 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing Registration...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Get Digital Pass</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Confirmation & Digital Pass */}
        {step === "success" && registrationResult && (
          <div className="space-y-6 text-center animate-scale-up">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                {registrationResult.status === "pending" ? "Application Submitted" : "Registration Confirmed"}
              </span>
              <h2 className="text-xl font-black tracking-tight mt-0.5">
                {registrationResult.status === "pending"
                  ? "Your Registration is Under Review"
                  : `Welcome, ${registrationResult.attendee?.name}!`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {registrationResult.status === "pending"
                  ? "Your application for this tier has been forwarded to the event organizers. You will receive an email once approved."
                  : "Your digital attendee ticket pass is active and registered in the Eventzone platform."}
              </p>
            </div>

            {/* Digital Badge Pass Box */}
            <div className={`max-w-sm mx-auto p-6 rounded-3xl border text-center relative shadow-lg ${
              isDark ? "bg-slate-850 border-slate-700" : "bg-gradient-to-b from-white to-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Event Pass</span>
                  <div className="text-xs font-black truncate max-w-[170px]">{eventData?.title || "Eventzone Summit"}</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Pass Code</span>
                  <div className="text-xs font-mono font-black text-blue-600" style={{ color: primaryColor }}>
                    {registrationResult.badge?.code}
                  </div>
                </div>
              </div>

              {registrationResult.badge?.qrCodeUrl && (
                <div className="bg-white p-3 rounded-2xl border border-slate-150 inline-block mx-auto shadow-xs mb-4">
                  <img
                    src={registrationResult.badge.qrCodeUrl}
                    alt="Attendee QR Pass"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-1 text-left bg-slate-100/70 dark:bg-slate-800/80 p-3 rounded-2xl">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Attendee:</span>
                  <span className="font-bold">{registrationResult.attendee?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Tier:</span>
                  <span className="font-bold text-blue-600" style={{ color: primaryColor }}>
                    {registrationResult.attendee?.ticketType}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="font-bold capitalize text-emerald-600">{registrationResult.status}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadBadge}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <Download size={14} />
                <span>Download QR Pass</span>
              </button>

              <button
                type="button"
                onClick={handleResetFlow}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Register Another Attendee
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Branding */}
      <div className={`px-6 py-3 border-t flex items-center justify-between text-[11px] font-semibold text-slate-400 ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50/80 border-slate-100"
      }`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-blue-600" style={{ color: primaryColor }} />
          <span>Secured by Eventzone Engine</span>
        </div>
        <span className="text-[10px]">Real-time Ingestion</span>
      </div>
    </div>
  );
}

export default function EmbedTicketsPage() {
  return (
    <div className="min-h-screen bg-transparent p-2 sm:p-4 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-400 font-bold text-xs animate-pulse">
            Loading widget...
          </div>
        }
      >
        <EmbedTicketsContent />
      </Suspense>
    </div>
  );
}
