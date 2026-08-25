/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { 
  Sparkles, Calendar, MapPin, Building2, 
  Image as ImageIcon, Users, ArrowRight, ArrowLeft, 
  CheckCircle2, X, Globe, Video, LayoutDashboard, Layers,
  ChevronRight, Compass, ShieldCheck, Tag, Info, Clock, Check, Link as LinkIcon,
  Upload, Loader2, Trash2, Camera, RefreshCw, ChevronDown
} from "lucide-react";
import { uploadFileToBucket } from "../lib/db";
import { useLanguage } from "../lib/i18n";
import CustomDatePicker from "./CustomDatePicker";
import CustomTimePicker from "./CustomTimePicker";
import SearchableSelect from "./SearchableSelect";

const PRESET_BANNERS = [
  {
    name: "Tech & Innovation Summit",
    category: "Technology",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Clean Energy & Hydrogen",
    category: "Energy",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Trade Expo & Exhibition",
    category: "Industrial",
    url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Keynote & Global Forum",
    category: "Business",
    url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Executive Networking Hall",
    category: "Leadership",
    url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80"
  }
];

const INDUSTRIES = [
  "Technology, AI & Software",
  "Energy, Oil & Gas",
  "Renewable Energy & CleanTech",
  "Finance, Banking & FinTech",
  "Healthcare, Pharmaceuticals & Biotech",
  "Education, EdTech & Academia",
  "Manufacturing & Heavy Industry",
  "Transportation, Aviation & Logistics",
  "Real Estate, Architecture & Construction",
  "Retail, Consumer Goods & E-Commerce",
  "Media, Entertainment & Gaming",
  "Agriculture, AgriTech & Food Production",
  "Government, Defense & Public Sector",
  "Non-Profit, NGOs & Social Impact",
  "Hospitality, Travel & Tourism",
  "Aerospace, Defense & SpaceTech",
  "Automotive, EV & Future Mobility",
  "Telecommunications & Networking",
  "Chemicals, Materials & Mining",
  "Environmental, Climate & Sustainability",
  "Legal, Consulting & Professional Services",
  "Cybersecurity & Cloud Infrastructure",
  "Biotechnology & Life Sciences",
  "Fashion, Luxury & Apparel",
  "Sports, Fitness & Recreation",
  "Blockchain, Web3 & Digital Assets",
  "Venture Capital & Private Equity",
  "Robotics & Industrial Automation",
  "Supply Chain & Maritime Shipping",
  "Arts, Culture & Heritage",
  "Other / General Business"
];

const TIMEZONES = [
  { id: "Africa/Algiers", name: "Africa/Algiers", offset: "GMT+1", time: "1:08 PM now" },
  { id: "Africa/Lagos", name: "Africa/Lagos", offset: "GMT+1", time: "1:08 PM now" },
  { id: "Africa/Cairo", name: "Africa/Cairo", offset: "GMT+3", time: "3:08 PM now" },
  { id: "Europe/Paris", name: "Europe/Paris", offset: "GMT+2", time: "2:08 PM now" },
  { id: "Europe/London", name: "Europe/London", offset: "GMT+1", time: "1:08 PM now" },
  { id: "Asia/Dubai", name: "Asia/Dubai", offset: "GMT+4", time: "4:08 PM now" },
  { id: "America/New_York", name: "America/New_York", offset: "GMT-4", time: "8:08 AM now" },
  { id: "America/Los_Angeles", name: "America/Los_Angeles", offset: "GMT-7", time: "5:08 AM now" },
  { id: "UTC", name: "UTC (Coordinated Universal Time)", offset: "GMT+0", time: "12:08 PM now" }
];

export default function EventCreationWizard({ onCancel, onEventCreated, userId, onUploadFile }) {
  const { t, lang, setLang, isRTL, languages } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Current screen state:
  // "1A": Event Name input
  // "1B": Describe "{Event Name}"? (Professional / Community / Personal) [SCREENSHOT 1]
  // "2A": What best describes your event? (Single date / Multiple dates / Appointment) [SCREENSHOT 2]
  // "2B": When is your event? (Dates / Times / Timezone) [SCREENSHOT 3]
  // "2C": Where is your event? (Venue / Hybrid / Virtual)
  // "2D": Category & Banner selection
  // "2E": Customize your event URL [SCREENSHOT 4]
  // "3":  Account information & Final Launch
  const [currentScreen, setCurrentScreen] = useState("1A");
  const [loading, setLoading] = useState(false);

  // File Upload State
  const fileInputRef = useRef(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isCustomBanner, setIsCustomBanner] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "myevent",
    tagline: "",
    eventTypeCategory: "Professional Event",
    structureType: "Multiple dates, times or sessions",
    category: "Technology & Software",
    type: "Hybrid",
    location: "Algiers International Conference Center (CIC), Algeria",
    startDate: "2026-11-05",
    startTime: "09:00",
    endDate: "2026-11-08",
    endTime: "18:00",
    timezone: "Africa/Algiers",
    description: "An international summit bringing together leading industry executives, regulators, and innovators.",
    banner: PRESET_BANNERS[0].url,
    capacity: 800,
    hostName: "Event Organizer",
    hostEmail: "organizer@eventzone.io",
    organization: "Eventzone Host Organization",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (PNG, JPG, WebP, SVG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }

    setUploadingBanner(true);
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, 'floor-plans');
      } else {
        publicUrl = await uploadFileToBucket(file, 'floor-plans');
      }

      if (!publicUrl) {
        publicUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      if (publicUrl) {
        handleChange("banner", publicUrl);
        setIsCustomBanner(true);
      }
    } catch (err) {
      console.error("Banner upload failed:", err);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleChange("banner", reader.result);
          setIsCustomBanner(true);
        };
        reader.readAsDataURL(file);
      } catch (readErr) {
        alert("Failed to process image upload.");
      }
    } finally {
      setUploadingBanner(false);
    }
  };

  // Determine top stepper main step number (1, 2, or 3)
  const getMainStepNumber = () => {
    if (currentScreen === "1A") return 1;
    if (["2A", "2B", "2C", "2D", "2E"].includes(currentScreen)) return 2;
    return 3;
  };

  const mainStep = getMainStepNumber();

  // Navigation handlers
  const handleNextFrom1A = (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a name for your event.");
      return;
    }
    const autoSlug = formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (autoSlug && (!formData.slug || formData.slug === "myevent")) {
      handleChange("slug", autoSlug);
    }
    setCurrentScreen("2A");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2A = (chosenStructure) => {
    if (chosenStructure) {
      handleChange("structureType", chosenStructure);
    }
    setCurrentScreen("2B");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2B = () => {
    setCurrentScreen("2C");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkip2B = () => {
    setCurrentScreen("2C");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2C = () => {
    setCurrentScreen("2D");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2D = () => {
    setCurrentScreen("2E");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2E = () => {
    setCurrentScreen("3");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentScreen === "1A") {
      if (onCancel) onCancel();
    } else if (currentScreen === "2A") {
      setCurrentScreen("1A");
    } else if (currentScreen === "2B") {
      setCurrentScreen("2A");
    } else if (currentScreen === "2C") {
      setCurrentScreen("2B");
    } else if (currentScreen === "2D") {
      setCurrentScreen("2C");
    } else if (currentScreen === "2E") {
      setCurrentScreen("2D");
    } else if (currentScreen === "3") {
      setCurrentScreen("2E");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (onEventCreated) {
        await onEventCreated(formData);
      }
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. TOP BAR WITH EVENTZONE LOGO & STEPPER                             */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        {/* Left: Eventzone Logo (Original colors on white background) */}
        <div className="flex items-center gap-4">
          <div 
            onClick={onCancel} 
            className="cursor-pointer select-none flex items-center gap-2"
            title="Return to Events"
          >
            <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '28px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} className="h-7 w-auto object-contain" />
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Center: Stepper Line (1 Event name — 2 Event details — 3 Account information) */}
        <div className="flex items-center gap-3 select-none">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              mainStep === 1 
                ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100" 
                : mainStep > 1 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-200 text-slate-600"
            }`}>
              {mainStep > 1 ? "✓" : "1"}
            </span>
            <span className={`text-xs font-bold transition-all ${
              mainStep === 1 ? "text-blue-600 font-extrabold" : mainStep > 1 ? "text-slate-800" : "text-slate-400"
            }`}>
              Event name
            </span>
          </div>

          {/* Line 1 */}
          <div className={`w-8 sm:w-16 h-0.5 transition-all ${mainStep > 1 ? "bg-emerald-500" : "bg-slate-200"}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              mainStep === 2 
                ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100" 
                : mainStep > 2 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-100 text-slate-400 border border-slate-300"
            }`}>
              {mainStep > 2 ? "✓" : "2"}
            </span>
            <span className={`text-xs font-bold transition-all ${
              mainStep === 2 ? "text-blue-600 font-extrabold" : mainStep > 2 ? "text-slate-800" : "text-slate-400"
            }`}>
              Event details
            </span>
          </div>

          {/* Line 2 */}
          <div className={`w-8 sm:w-16 h-0.5 transition-all ${mainStep > 2 ? "bg-emerald-500" : "bg-slate-200"}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              mainStep === 3 
                ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100" 
                : "bg-slate-100 text-slate-400 border border-slate-300"
            }`}>
              3
            </span>
            <span className={`text-xs font-bold transition-all ${
              mainStep === 3 ? "text-blue-600 font-extrabold" : "text-slate-400"
            }`}>
              Account information
            </span>
          </div>
        </div>

        {/* Right Actions: Language Switcher & Exit Button */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            {(() => {
              const curLang = languages.find(l => l.code === lang) || languages[0];
              return (
                <button
                  onClick={() => setLangMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Change Language"
                >
                  <img src={curLang?.icon || "https://i.imgur.com/NXtMImD.png"} alt={lang} className="w-5 h-5 object-contain shrink-0" />
                  <span className="uppercase tracking-wide font-extrabold text-[11px]">{lang}</span>
                  <ChevronDown size={11} className={`text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                </button>
              );
            })()}

            {langMenuOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5">
                {languages.map(item => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      lang === item.code 
                        ? "bg-blue-50 text-blue-600 font-bold" 
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={item.icon} alt={item.code} className="w-5 h-5 object-contain shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTENT CONTAINER                                            */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 1A: What is the name of your event?                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "1A" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What is the name of your event?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8 max-w-md mx-auto">
              Give your conference, summit, or meetup a clear and memorable title.
            </p>

            <form onSubmit={handleNextFrom1A} className="space-y-6 max-w-xl mx-auto text-left">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Event Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Algeria job summit"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2A: What best describes your event? (Structure)          */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2A" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              What best describes your event?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              This helps us customize your experience.
            </p>

            <div className="flex flex-col gap-3.5 max-w-xl mx-auto">
              {[
                {
                  id: "Single date, time and location",
                  title: "Single date, time and location",
                  desc: "A one-time gathering in a single venue or virtual room"
                },
                {
                  id: "Multiple dates, times or sessions",
                  title: "Multiple dates, times or sessions",
                  desc: "Multi-day summit, tracks, breakout workshops, and speaker panels"
                }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNextFrom2A(item.id)}
                  className={`p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col justify-center items-center gap-1 group ${
                    formData.structureType === item.id
                      ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/20"
                  }`}
                >
                  <span className={`text-sm sm:text-base font-bold transition-colors ${
                    formData.structureType === item.id ? "text-blue-600" : "text-slate-800 group-hover:text-blue-600"
                  }`}>
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between max-w-xl mx-auto mt-8 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => handleNextFrom2A(formData.structureType)}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                Next: Dates & Timing
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2B (SCREENSHOT 3): When is your event?                    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2B" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              When is your event?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-2">
              Not sure yet? You can add timing later.
            </p>

            <button
              type="button"
              onClick={handleSkip2B}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mb-8 cursor-pointer inline-block"
            >
              Skip for now
            </button>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-left space-y-6">
              {/* EVENT START */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Event Start
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomDatePicker
                    value={formData.startDate}
                    onChange={(val) => handleChange("startDate", val)}
                    placeholder="Start date"
                  />

                  <CustomTimePicker
                    value={formData.startTime}
                    onChange={(val) => handleChange("startTime", val)}
                    placeholder="Start time"
                  />
                </div>
              </div>

              {/* EVENT END */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Event End
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomDatePicker
                    value={formData.endDate}
                    minDate={formData.startDate || undefined}
                    onChange={(val) => handleChange("endDate", val)}
                    placeholder="End date"
                  />

                  <CustomTimePicker
                    value={formData.endTime}
                    onChange={(val) => handleChange("endTime", val)}
                    placeholder="End time"
                  />
                </div>
              </div>

              {/* TIMEZONE */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Timezone
                </label>
                <SearchableSelect
                  value={formData.timezone}
                  onChange={(val) => handleChange("timezone", val)}
                  options={TIMEZONES.map(tz => ({
                    value: tz.id,
                    label: `${tz.name} (${tz.offset}) — ${tz.time}`,
                    badge: tz.offset
                  }))}
                  placeholder="Select timezone..."
                  searchPlaceholder="Search timezone by city, country or offset..."
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleNextFrom2B}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center cursor-pointer mt-4"
              >
                Next: Event Location
              </button>
            </div>

            <div className="flex items-center justify-start max-w-xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2C: Where is your event? (Location / Hybrid / Virtual)    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2C" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Where is your event located?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              Select venue format and physical or virtual address.
            </p>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-left space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "In-Person", label: "Venue", desc: "Physical", icon: Building2 },
                    { id: "Hybrid", label: "Hybrid", desc: "Physical + Stream", icon: Globe },
                    { id: "Virtual", label: "Online", desc: "100% Virtual", icon: Video }
                  ].map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleChange("type", id)}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        formData.type === id
                          ? "bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-800 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={18} className={formData.type === id ? "text-blue-600" : "text-slate-500"} />
                      <div>
                        <span className="text-xs font-bold block">{label}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Venue / Location Address
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Algiers International Conference Center (CIC), Algeria"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextFrom2C}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center cursor-pointer mt-4"
              >
                Next: Category & Banner
              </button>
            </div>

            <div className="flex items-center justify-start max-w-xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2D: Category & Cover Banner                               */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2D" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose industry category & cover banner
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              Customize how your event card appears on the public discovery calendar.
            </p>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto text-left space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Industry / Category
                </label>
                <SearchableSelect
                  value={formData.category}
                  onChange={(val) => handleChange("category", val)}
                  options={INDUSTRIES}
                  placeholder="Select industry / category..."
                  searchPlaceholder="Type to search industry (e.g. AI, Healthcare, Energy)..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Event Cover Banner
                  </label>
                  {isCustomBanner && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                      Custom Photo Loaded
                    </span>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleBannerUpload}
                  className="hidden"
                />

                {/* Main Custom Upload Box */}
                <div className="space-y-3">
                  {isCustomBanner && formData.banner ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md group">
                      <div className="h-44 w-full relative bg-slate-950">
                        <img 
                          src={formData.banner} 
                          alt="Custom Event Cover" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-extrabold uppercase">
                              Active Event Banner
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1">
                              {formData.title || "Your Event Title"}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 size={15} className="text-emerald-400" />
                          <span className="font-semibold">Ready to save &amp; sync to database</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingBanner}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Replace Photo
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleChange("banner", PRESET_BANNERS[0].url);
                              setIsCustomBanner(false);
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            title="Reset to starter preset"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => !uploadingBanner && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all group relative overflow-hidden"
                    >
                      {uploadingBanner ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 size={28} className="text-blue-600 animate-spin" />
                          <span className="text-xs font-bold text-slate-700">Uploading to Cloud Storage...</span>
                          <span className="text-[11px] text-slate-400">Optimizing and storing banner asset</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center mx-auto shadow-xs">
                            <Upload size={22} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                              Click or Drag &amp; Drop Your Custom Event Picture
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-1">
                              Supports PNG, JPG, WebP, SVG up to 10MB (Recommended: 16:9 ratio, 1600x900px)
                            </span>
                          </div>
                          <div className="pt-1">
                            <span className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 group-hover:border-blue-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
                              Browse Files on Computer
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preset Banners Alternative */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Or pick from curated templates
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PRESET_BANNERS.map((preset) => {
                        const isSelected = !isCustomBanner && formData.banner === preset.url;
                        return (
                          <div
                            key={preset.url}
                            onClick={() => {
                              handleChange("banner", preset.url);
                              setIsCustomBanner(false);
                            }}
                            className={`h-20 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group ${
                              isSelected 
                                ? "border-blue-600 ring-3 ring-blue-100 scale-102" 
                                : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300"
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1.5">
                              <span className="text-[9px] font-bold text-white leading-tight truncate">{preset.name}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Check size={10} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Expected Capacity
                </label>
                <div className="relative">
                  <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 100)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextFrom2D}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center cursor-pointer mt-4"
              >
                Next: Customize URL
              </button>
            </div>

            <div className="flex items-center justify-start max-w-2xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2E (NEW SCREENSHOT): Customize your event URL             */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2E" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Customize your Eventzone event URL.
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              This is the link you&apos;ll give to guests so they can register.
            </p>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-left space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  EVENT URL
                </label>
                <div className={`bg-white border-2 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all ${
                  formData.slug.trim() 
                    ? "border-emerald-500 ring-4 ring-emerald-50 shadow-xs" 
                    : "border-slate-300"
                }`}>
                  <div className="flex items-center flex-1 overflow-hidden pr-2">
                    <span className="text-slate-500 font-semibold text-xs sm:text-sm select-none shrink-0 pr-1">
                      eventzone.pro/
                    </span>
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="my-event"
                      value={formData.slug}
                      onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full text-slate-900 font-bold text-base sm:text-lg outline-none bg-transparent placeholder-slate-400"
                    />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check size={16} className="stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  Direct Guest Link: <span className="text-blue-600 font-bold">https://eventzone.pro/{formData.slug || "my-event"}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextFrom2E}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center cursor-pointer mt-4"
              >
                Next: Create Account
              </button>
            </div>

            <div className="flex items-center justify-start max-w-xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* STEP 3: Account information & Review Launch                        */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "3" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Account information & Summary
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              Review your setup before launching your event manager dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-3xl mx-auto text-left">
              {/* Host Fields */}
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span>Host Account Details</span>
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hostName}
                    onChange={(e) => handleChange("hostName", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.hostEmail}
                    onChange={(e) => handleChange("hostEmail", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organization / Host Entity
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleChange("organization", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Card Mini */}
              <div className="md:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="h-32 w-full relative overflow-hidden bg-slate-900">
                  <img src={formData.banner} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-white/95 text-blue-700 uppercase">
                      {formData.type}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">
                      {formData.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                      {formData.title || "Untitled Event"}
                    </h4>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-blue-600 shrink-0" />
                      <span>{formData.startDate} — {formData.endDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-blue-600 shrink-0" />
                      <span className="truncate">{formData.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600 font-semibold truncate pt-1">
                      <LinkIcon size={12} className="shrink-0" />
                      <span className="truncate">eventzone.pro/{formData.slug}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="flex items-center justify-between max-w-3xl mx-auto mt-8 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create Event & Launch Dashboard"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
