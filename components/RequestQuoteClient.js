"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  Building2, Mail, Phone, User, Calendar, Users, MapPin, 
  Clock, ShieldCheck, CheckCircle2, 
  Layers, CreditCard, QrCode, Printer, HardDrive, 
  Presentation, Handshake, Plane, Smartphone, Wrench, 
  FileText, Monitor, Flag, Volume2, UserCheck, Shield,
  Plus, X, Copy, Check, AlertCircle, RefreshCw,
  ArrowRight, ArrowLeft
} from "lucide-react";
import { COUNTRY_CITIES_MAP } from "../lib/formPresets";
import SearchableSelect from "./SearchableSelect";
import AnimatedMeshBackground from "./features/AnimatedMeshBackground";

const STEPS = [
  { id: 1, title: "Contact" },
  { id: 2, title: "Event" },
  { id: 3, title: "Services" },
  { id: 4, title: "Review" },
];

const ALGERIA_WILAYAS = COUNTRY_CITIES_MAP["Algeria"] || [];

const EVENT_TYPE_OPTIONS = [
  { value: "International Conference / Congress", label: "International Conference / Congress" },
  { value: "Trade Fair / Exhibition / Salon", label: "Trade Fair / Exhibition / Salon" },
  { value: "Corporate Summit & Gala", label: "Corporate Summit & Gala" },
  { value: "Seminar & Workshop Series", label: "Seminar & Workshop Series" },
  { value: "Festival & Cultural Gathering", label: "Festival & Cultural Gathering" },
  { value: "Sports & Tournaments", label: "Sports & Tournaments" },
  { value: "Private VIP Corporate Session", label: "Private VIP Corporate Session" },
  { value: "Other Special Event", label: "Other Special Event" },
];

const ATTENDEE_OPTIONS = [
  { value: "< 250 attendees", label: "Under 250 attendees" },
  { value: "250 - 500 attendees", label: "250 – 500 attendees" },
  { value: "500 - 1,500 attendees", label: "500 – 1,500 attendees" },
  { value: "1,500 - 5,000 attendees", label: "1,500 – 5,000 attendees" },
  { value: "5,000 - 10,000 attendees", label: "5,000 – 10,000 attendees" },
  { value: "10,000+ attendees", label: "10,000+ attendees (Mega Event)" },
];

const DURATION_OPTIONS = [
  { value: "1 day", label: "1 Day" },
  { value: "2 days", label: "2 Days" },
  { value: "3 days", label: "3 Days" },
  { value: "4 to 7 days", label: "4 to 7 Days" },
  { value: "More than 1 week", label: "More than 1 Week" },
];

const VENUE_STATUS_OPTIONS = [
  { value: "Venue already booked", label: "Venue already confirmed / booked" },
  { value: "Looking for venue recommendations", label: "Looking for venue recommendations" },
  { value: "Hybrid / Virtual event", label: "Hybrid / Virtual event" },
  { value: "Not decided yet", label: "Not decided yet" },
];

const BUDGET_OPTIONS = [
  { value: "Flexible / Awaiting recommendation", label: "Flexible / Open to recommendation" },
  { value: "< 250,000 DZD", label: "Under 250,000 DZD" },
  { value: "250,000 - 600,000 DZD", label: "250,000 – 600,000 DZD" },
  { value: "600,000 - 1,500,000 DZD", label: "600,000 – 1,500,000 DZD" },
  { value: "1,500,000 - 3,500,000 DZD", label: "1,500,000 – 3,500,000 DZD" },
  { value: "Enterprise Custom Quote", label: "Enterprise Custom Tier (3,500,000+ DZD)" },
];

const AVAILABLE_SERVICES = [
  {
    id: "floor_plans",
    title: "Interactive 2D Floor Plans",
    description: "Dynamic booth booking, sponsor spatial allocation, and interactive visitor navigation maps.",
    icon: Layers,
    badge: "Flagship"
  },
  {
    id: "online_ticketing",
    title: "Multi-Tier Online Ticketing",
    description: "Custom ticketing tiers, VIP passes, discount promo codes, and automated digital delivery.",
    icon: CreditCard,
    badge: "Core"
  },
  {
    id: "local_payments",
    title: "CIB & Edahabia Payments",
    description: "Instant domestic payment processing, purchase order invoicing, and bank transfer reconciliation.",
    icon: ShieldCheck,
    badge: "Algeria Ready"
  },
  {
    id: "fast_checkin",
    title: "High-Speed QR Check-in",
    description: "Sub-second camera and laser barcode access control with multi-gate offline synchronization.",
    icon: QrCode,
    badge: "Access"
  },
  {
    id: "badge_printing",
    title: "On-Site Thermal Badge Printing",
    description: "High-speed badge printing on arrival with customized branded lanyards and role color-coding.",
    icon: Printer,
    badge: "On-Site"
  },
  {
    id: "hardware_rental",
    title: "Hardware Equipment Rental",
    description: "Turnkey laser handheld scanners, registration check-in tablets, badge printers, and local routers.",
    icon: HardDrive,
    badge: "Hardware"
  },
  {
    id: "speaker_portal",
    title: "Speaker & Agenda Management",
    description: "Speaker bio directory, multi-hall timeline schedules, and call-for-papers submission workflows.",
    icon: Presentation,
    badge: "Program"
  },
  {
    id: "b2b_matchmaking",
    title: "B2B Networking & Matchmaking",
    description: "Curated 1-on-1 business meeting schedulers for attendees, exhibitors, and key decision-makers.",
    icon: Handshake,
    badge: "Engagement"
  },
  {
    id: "vip_logistics",
    title: "VIP Logistics & Hospitality",
    description: "Airport transfers, hotel room block tracking, delegate itineraries, and protocol monitoring.",
    icon: Plane,
    badge: "VIP"
  },
  {
    id: "custom_mobile_app",
    title: "Branded Event Mobile App",
    description: "Personalized companion app with live push notifications, in-app messaging, and interactive maps.",
    icon: Smartphone,
    badge: "Mobile"
  },
  {
    id: "onsite_crew",
    title: "Dedicated On-Site Technical Staff",
    description: "Eventzone technical supervisors and gate operator assistance deployed directly at your venue.",
    icon: Wrench,
    badge: "Support"
  },
  {
    id: "a4_badging",
    title: "A4 Badging & Folded Sheets",
    description: "Folded A4 personalized credential sheets, badge pouches, neck cords, swivel clips, and branded lanyards.",
    icon: FileText,
    badge: "Badging"
  },
  {
    id: "led_screens",
    title: "LED Screens & Video Walls",
    description: "High-definition indoor & outdoor modular LED video walls, stage backdrops, confidence monitors, and video processors.",
    icon: Monitor,
    badge: "Visual AV"
  },
  {
    id: "banners_branding",
    title: "Roll-ups, Banners & Event Signage",
    description: "Custom roll-up stands, entrance arches, directional signage, photo-call media backdrops, and event flags.",
    icon: Flag,
    badge: "Branding"
  },
  {
    id: "sound_lighting",
    title: "Sound System & Stage Audio/Lighting",
    description: "Line-array PA audio, wireless UHF handheld/lapel mics, stage spotlights, audio mixing, and on-site acoustic engineer.",
    icon: Volume2,
    badge: "AV & Sound"
  },
  {
    id: "hostesses_staff",
    title: "Hostesses & Reception Staff",
    description: "Multilingual greeting hostesses, VIP reception, registration desk operators, badge distribution, and guest assistance.",
    icon: UserCheck,
    badge: "Staffing"
  },
  {
    id: "event_security",
    title: "Event Security & Crowd Control",
    description: "Certified venue security agents, badge checkpoint access controllers, VIP close protection, and crowd flow safety.",
    icon: Shield,
    badge: "Security"
  },
];

export default function RequestQuoteClient() {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const formRef = useRef(null);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [cityWilaya, setCityWilaya] = useState("Algiers");

  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("International Conference / Congress");
  const [attendeesCount, setAttendeesCount] = useState("500 - 1,500 attendees");
  const [eventDate, setEventDate] = useState("");
  const [duration, setDuration] = useState("2 days");
  const [venueStatus, setVenueStatus] = useState("Venue already booked");

  const [selectedServices, setSelectedServices] = useState([
    "Interactive 2D Floor Plans",
    "Multi-Tier Online Ticketing",
    "High-Speed QR Check-in"
  ]);

  const [customNeeds, setCustomNeeds] = useState([]);
  const [customNeedInput, setCustomNeedInput] = useState("");

  const [budgetRange, setBudgetRange] = useState("Flexible / Awaiting recommendation");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedQuote, setSubmittedQuote] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const toggleService = (title) => {
    setSelectedServices((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  const handleAddCustomNeed = (e) => {
    if (e) e.preventDefault();
    const trimmed = customNeedInput.trim();
    if (!trimmed) return;

    if (!customNeeds.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setCustomNeeds((prev) => [...prev, trimmed]);
    }
    setSelectedServices((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setCustomNeedInput("");
  };

  const handleRemoveCustomNeed = (need) => {
    setCustomNeeds((prev) => prev.filter((n) => n !== need));
    setSelectedServices((prev) => prev.filter((s) => s !== need));
  };

  const handleCopyReference = () => {
    if (!submittedQuote?.reference_code) return;
    navigator.clipboard.writeText(submittedQuote.reference_code);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const scrollToForm = () => {
    if (formRef.current) {
      const yOffset = -90;
      const y = formRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const validateStep = (step) => {
    setErrorMessage(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMessage("Please enter your full name.");
        return false;
      }
      if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
        setErrorMessage("Please enter a valid work email address.");
        return false;
      }
      if (!phone.trim()) {
        setErrorMessage("Please provide a contact phone number.");
        return false;
      }
      if (!companyName.trim()) {
        setErrorMessage("Please specify your company or organization name.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setErrorMessage(null);
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      scrollToForm();
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    scrollToForm();
  };

  const handleStepClick = (stepId) => {
    if (stepId < currentStep) {
      setErrorMessage(null);
      setCurrentStep(stepId);
      scrollToForm();
    } else if (stepId > currentStep) {
      if (validateStep(currentStep)) {
        setErrorMessage(null);
        setCurrentStep(stepId);
        scrollToForm();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !companyName.trim()) {
      setErrorMessage("Please complete all required contact fields in Step 1.");
      setCurrentStep(1);
      scrollToForm();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage("Please enter a valid work email address in Step 1.");
      setCurrentStep(1);
      scrollToForm();
      return;
    }

    setIsSubmitting(true);

    try {
      let finalServices = [...selectedServices];
      const pendingCustomNeed = customNeedInput.trim();
      if (pendingCustomNeed && !finalServices.includes(pendingCustomNeed)) {
        finalServices.push(pendingCustomNeed);
        if (!customNeeds.some((n) => n.toLowerCase() === pendingCustomNeed.toLowerCase())) {
          setCustomNeeds((prev) => [...prev, pendingCustomNeed]);
        }
      }

      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        city_wilaya: cityWilaya,
        event_name: eventName.trim(),
        event_type: eventType,
        attendees_count: attendeesCount,
        event_date: eventDate,
        duration: duration,
        venue_status: venueStatus,
        services: finalServices,
        budget_range: budgetRange,
        additional_details: additionalDetails.trim(),
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit quote request. Please try again.");
      }

      setSubmittedQuote(data.quote || { reference_code: data.reference_code, ...payload });
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wilayaOptions = ALGERIA_WILAYAS.map((w) => ({ value: w, label: w }));

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Animated Mesh Backdrop */}
      <AnimatedMeshBackground />

      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center cursor-pointer" title="Eventzone Home">
            <img
              src="https://i.imgur.com/jFDrQbM.png"
              alt="Eventzone"
              style={{ height: "26px", width: "auto" }}
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-600">
            <Link href="/#explore" className="hover:text-blue-600 transition-colors">
              {t("nav.exploreEvents", "Explore Events")}
            </Link>
            <Link href="/features" className="hover:text-blue-600 transition-colors">
              {t("nav.features", "Fonctionnalités")}
            </Link>
            <Link href="/checkin" className="hover:text-blue-600 transition-colors">
              {t("dash.checkIn", "Check In")}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((o) => !o)}
              className="h-8 sm:h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-full hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <img
                src={curLang?.icon || "https://i.imgur.com/NXtMImD.png"}
                alt={lang}
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="uppercase tracking-wide font-extrabold text-[10px] sm:text-[11px]">{lang}</span>
            </button>

            {langMenuOpen && (
              <div className={`absolute top-full ${isRTL ? "left-0" : "right-0"} mt-1.5 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5`}>
                {languages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      lang === item.code ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>
                    {lang === item.code && <Check size={12} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Back to Events</span>
          </Link>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {submittedQuote ? (
          /* ─────────────────────────────────────────────
              SUCCESS STATE CARD
          ───────────────────────────────────────────── */
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[32px] p-8 sm:p-12 shadow-[0_14px_40px_-10px_rgba(15,23,42,0.04),0_2px_12px_-2px_rgba(15,23,42,0.015)] quote-section-card text-center animate-in fade-in zoom-in-95 duration-500 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
              Quote Request Submitted Successfully
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              We&apos;ve Received Your Request!
            </h1>

            <p className="mt-3 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-slate-900">{submittedQuote.full_name}</strong>. Our event technology team has received your project details and is currently preparing a tailored commercial proposal.
            </p>

            {/* Reference Badge */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-sm mx-auto flex items-center justify-between gap-3">
              <div className="text-start">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Quote Reference</span>
                <span className="font-mono text-base font-black text-blue-600 select-all">
                  {submittedQuote.reference_code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyReference}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Copy Reference"
              >
                {copiedRef ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Single Sign In Button */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/?view=auth"
                className="w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight size={15} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmittedQuote(null);
                  setCurrentStep(1);
                  setEventName("");
                  setAdditionalDetails("");
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────
              REQUEST A QUOTE FORM & HERO (STEPPER WIZARD)
          ───────────────────────────────────────────── */
          <div ref={formRef} className="space-y-6 sm:space-y-8">
            {/* Hero Heading */}
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Request a Custom Quote
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Empower your conference, trade fair, or corporate summit with Algeria&apos;s leading event management platform. Tell us about your event needs and receive a tailored proposal within 24 hours.
              </p>
            </div>

            {/* Minimal Stepper Header */}
            <div className="max-w-xl mx-auto px-1 sm:px-0">
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-2xs flex items-center justify-between gap-1 sm:gap-2">
                {STEPS.map((s, idx) => {
                  const isCompleted = currentStep > s.id;
                  const isActive = currentStep === s.id;
                  const isClickable = s.id < currentStep;

                  return (
                    <React.Fragment key={s.id}>
                      <button
                        type="button"
                        onClick={() => handleStepClick(s.id)}
                        disabled={!isClickable}
                        className={`flex items-center gap-1.5 sm:gap-2 py-1 px-1.5 sm:px-2 rounded-full transition-all select-none ${
                          isClickable
                            ? "cursor-pointer hover:bg-slate-50 text-slate-700"
                            : isActive
                            ? "text-blue-600 font-bold cursor-default"
                            : "text-slate-400 cursor-default"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all shrink-0 ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : isActive
                              ? "bg-blue-600 text-white shadow-xs shadow-blue-600/30 ring-2 ring-blue-100"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isCompleted ? <Check size={12} strokeWidth={3} /> : s.id}
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs transition-colors ${
                            isActive
                              ? "font-extrabold text-blue-600"
                              : isCompleted
                              ? "font-semibold text-slate-700"
                              : "font-medium text-slate-400"
                          }`}
                        >
                          {s.title}
                        </span>
                      </button>

                      {idx < STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 bg-slate-100 rounded-full mx-1 sm:mx-2 overflow-hidden">
                          <div
                            className={`h-full bg-blue-600 transition-all duration-300 ${
                              currentStep > idx + 1 ? "w-full" : "w-0"
                            }`}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Step Cards */}
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              {/* ── Step 1: Organizer & Contact Info ── */}
              {currentStep === 1 && (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-[32px] p-6 sm:p-9 shadow-[0_14px_40px_-10px_rgba(15,23,42,0.04),0_2px_12px_-2px_rgba(15,23,42,0.015)] quote-section-card animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="border-b border-slate-100 pb-3 mb-6">
                    <h2 className="text-base font-bold text-slate-900">1. Contact &amp; Organization Details</h2>
                    <p className="text-xs text-slate-500">Who will be managing the quote and correspondence?</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Amina Benali"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Work Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. amina@company.dz"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Contact Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +213 (0) 550 12 34 56"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>

                    {/* Company / Org Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Company / Organization <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Algeria Telecom, PharmaTech, Sonatrach"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Job Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Job Title / Role
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Event Director, Marketing Manager, Lead Organizer"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* City / Wilaya using SearchableSelect */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Wilaya / Location
                      </label>
                      <SearchableSelect
                        value={cityWilaya}
                        onChange={(val) => setCityWilaya(val)}
                        options={wilayaOptions}
                        placeholder="Select Wilaya..."
                        searchPlaceholder="Search wilaya..."
                        buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! rounded-xl!"
                      />
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Event Overview</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Event Specifications ── */}
              {currentStep === 2 && (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-[32px] p-6 sm:p-9 shadow-[0_14px_40px_-10px_rgba(15,23,42,0.04),0_2px_12px_-2px_rgba(15,23,42,0.015)] quote-section-card animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="border-b border-slate-100 pb-3 mb-6">
                    <h2 className="text-base font-bold text-slate-900">2. Event Overview &amp; Scale</h2>
                    <p className="text-xs text-slate-500">Provide high-level details regarding the format and expected attendance.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Event Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Event Name / Project Title
                      </label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g. Algiers Tech Expo 2026 / National Medical Congress"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Event Type (SearchableSelect) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Event Format / Category
                      </label>
                      <SearchableSelect
                        value={eventType}
                        onChange={(val) => setEventType(val)}
                        options={EVENT_TYPE_OPTIONS}
                        placeholder="Select format..."
                        buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! rounded-xl!"
                      />
                    </div>

                    {/* Expected Attendees (SearchableSelect) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Estimated Attendees &amp; Visitors
                      </label>
                      <SearchableSelect
                        value={attendeesCount}
                        onChange={(val) => setAttendeesCount(val)}
                        options={ATTENDEE_OPTIONS}
                        placeholder="Select attendance bracket..."
                        buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! rounded-xl!"
                      />
                    </div>

                    {/* Target Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Target Date / Approximate Month
                      </label>
                      <input
                        type="text"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        placeholder="e.g. November 2026 or 15-18 Oct 2026"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Duration (SearchableSelect) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Event Duration
                      </label>
                      <SearchableSelect
                        value={duration}
                        onChange={(val) => setDuration(val)}
                        options={DURATION_OPTIONS}
                        placeholder="Select duration..."
                        buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! rounded-xl!"
                      />
                    </div>

                    {/* Venue Status (SearchableSelect) */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Venue Status
                      </label>
                      <SearchableSelect
                        value={venueStatus}
                        onChange={(val) => setVenueStatus(val)}
                        options={VENUE_STATUS_OPTIONS}
                        placeholder="Select venue status..."
                        buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! rounded-xl!"
                      />
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Contact</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Services</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Eventzone Modules & Services Checklist ── */}
              {currentStep === 3 && (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-[32px] p-6 sm:p-9 shadow-[0_14px_40px_-10px_rgba(15,23,42,0.04),0_2px_12px_-2px_rgba(15,23,42,0.015)] quote-section-card animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h2 className="text-base font-bold text-slate-900">3. Services &amp; Platform Capabilities Needed</h2>
                    <p className="text-xs text-slate-500">Select the modules you would like included in your tailored quotation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {AVAILABLE_SERVICES.map((serv) => {
                      const isSelected = selectedServices.includes(serv.title);
                      const IconComp = serv.icon;
                      return (
                        <div
                          key={serv.id}
                          onClick={() => toggleService(serv.title)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                            isSelected
                              ? "bg-blue-50/50 border-blue-500/80 shadow-xs ring-1 ring-blue-500/20"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                                {serv.title}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {serv.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                              {serv.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Custom Needs Sub-Section ── */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          Need Something Else? Add Custom Requirements
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Specify bespoke requirements such as translation headsets, catering, drone recording, or specialized hardware.
                        </p>
                      </div>
                    </div>

                    {/* Add Custom Need Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customNeedInput}
                        onChange={(e) => setCustomNeedInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomNeed();
                          }
                        }}
                        placeholder="e.g. Simultaneous translation headsets, VIP catering, Drone 4K video recording..."
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomNeed}
                        disabled={!customNeedInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Need</span>
                      </button>
                    </div>

                    {/* Custom Needs Interactive Chips */}
                    {customNeeds.length > 0 && (
                      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-200">
                        {customNeeds.map((need, idx) => {
                          const isSelected = selectedServices.includes(need);
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleService(need)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                isSelected
                                  ? "bg-amber-50/60 border-amber-400/80 shadow-xs ring-1 ring-amber-400/20"
                                  : "bg-white hover:bg-slate-50 border-slate-200 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-amber-500 border-amber-500 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <Check size={10} strokeWidth={3} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-slate-900 truncate">
                                      {need}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 shrink-0">
                                      Custom Need
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Delete custom need */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomNeed(need);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                title="Remove custom need"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Selection counter & reset */}
                    <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {selectedServices.length} {selectedServices.length === 1 ? "service / custom need" : "services & custom needs"} selected
                      </span>
                      {selectedServices.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedServices([])}
                          className="text-slate-400 hover:text-slate-700 underline cursor-pointer"
                        >
                          Deselect all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 3 Actions */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Event</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Budget &amp; Notes</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Budget & Custom Requirements ── */}
              {currentStep === 4 && (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-[32px] p-6 sm:p-9 shadow-[0_14px_40px_-10px_rgba(15,23,42,0.04),0_2px_12px_-2px_rgba(15,23,42,0.015)] quote-section-card animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="border-b border-slate-100 pb-3 mb-6">
                    <h2 className="text-base font-bold text-slate-900">4. Budget &amp; Custom Requirements</h2>
                    <p className="text-xs text-slate-500">Help us understand your expected budget bracket and any bespoke requests.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Estimated Budget Range (Optional)
                      </label>
                      <SearchableSelect
                        value={budgetRange}
                        onChange={(val) => setBudgetRange(val)}
                        options={BUDGET_OPTIONS}
                        placeholder="Select budget..."
                        buttonClassName="bg-slate-50! border-slate-200! text-slate-900! text-xs! rounded-xl!"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Additional Requirements / Project Notes
                      </label>
                      <textarea
                        rows={4}
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Describe any particular integrations, on-site hardware specifications, custom VIP registration processes, or exhibition booth rules..."
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Step 4 Actions */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Services</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Quote Request...</span>
                        </>
                      ) : (
                        <span>Submit Quote Request</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}
      </main>
    </div>
  );
}
