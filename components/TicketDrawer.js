/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Ticket,
  Check,
  Plus,
  Trash2,
  Upload,
  FileText,
  Printer,
  Sparkles,
  QrCode,
  Layers,
  ChevronRight,
  FileCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
  Users,
  Star,
  Sparkle
} from "lucide-react";
import A4BadgeSheet from "./A4BadgeSheet";
import SearchableSelect from "./SearchableSelect";

// Standard preset tier name chips
const TIER_NAME_SUGGESTIONS = [
  "VIP Access Pass",
  "Standard Admission",
  "Delegate Pass",
  "Early Bird Pass",
  "Speaker Pass",
  "Exhibitor Pass",
  "Workshop Pass",
  "Virtual Attendee"
];

// Price suggestions in DZD
const PRICE_SUGGESTIONS_DZD = [
  { label: "1,500 DZD", value: "1500" },
  { label: "3,000 DZD", value: "3000" },
  { label: "5,000 DZD", value: "5000" },
  { label: "10,000 DZD", value: "10000" },
  { label: "25,000 DZD", value: "25000" },
  { label: "50,000 DZD", value: "50000" }
];

// Capacity suggestions
const CAPACITY_SUGGESTIONS = [
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "250", value: "250" },
  { label: "500", value: "500" },
  { label: "1,000", value: "1000" }
];

// Rich perk suggestions bank
const SUGGESTED_PERKS = [
  "Full Keynote Access",
  "Exhibition Floor Access",
  "VIP Lounge Access",
  "Buffet Lunch & Coffee Breaks",
  "Networking Dinner & Cocktail",
  "Certificate of Attendance",
  "Workshop & Masterclass Entry",
  "B2B Matchmaking Tool",
  "Welcome Kit & Gift Bag",
  "Fast-Track Kiosk Check-in",
  "Session Video Recordings",
  "Speaker Q&A Priority"
];

export default function TicketDrawer({
  isOpen,
  onClose,
  ticket = null,
  forms = [],
  onSaveTicket,
  onUploadFile,
  activeEventId,
  eventTitle = "Eventzone Summit",
  onSwitchView
}) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'form' | 'badge'

  // Form Fields
  const [name, setName] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("5000");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [capacity, setCapacity] = useState("100");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active"); // 'Active' | 'Draft'
  const [requiresApproval, setRequiresApproval] = useState(false); // Auto vs Pending
  const [isPopular, setIsPopular] = useState(false); // Only one ticket can be popular
  
  // Perks / Features
  const [features, setFeatures] = useState([]);
  const [newPerkInput, setNewPerkInput] = useState("");

  // Registration Form Binding
  const [selectedFormId, setSelectedFormId] = useState("default");

  // Badge Design State
  const [badgeType, setBadgeType] = useState("thermal_qr"); // 'thermal_qr' | 'a4'
  const [badgeUrl, setBadgeUrl] = useState("");
  const [badgeSettings, setBadgeSettings] = useState({
    orientation: "portrait",
    showFoldGuide: true,
    showPhoto: true,
    showQr: true,
    cardTheme: "white", // "white" | "glass" | "clean"
    includeCompany: true,
    includeTimestamp: true,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state on open or ticket change
  useEffect(() => {
    if (ticket) {
      setName(ticket.name || ticket.tier || "");
      const numPrice = typeof ticket.price === "number" ? ticket.price : parseFloat(String(ticket.price).replace(/[^0-9.]/g, "")) || 0;
      setIsFree(numPrice === 0);
      setPrice(numPrice.toString());
      
      const maxQ = ticket.maxQty || ticket.available || 100;
      setIsUnlimited(maxQ >= 99999);
      setCapacity(maxQ >= 99999 ? "100" : maxQ.toString());
      
      setDescription(ticket.description || "");
      setStatus(ticket.status || "Active");
      setRequiresApproval(Boolean(ticket.requiresApproval || ticket.requires_approval));
      setIsPopular(Boolean(ticket.isPopular || ticket.is_popular));
      
      setFeatures(Array.isArray(ticket.features) ? [...ticket.features] : []);
      setSelectedFormId(ticket.formId || "default");
      setBadgeType(ticket.badgeType || "thermal_qr");
      setBadgeUrl(ticket.badgeUrl || "");
      setBadgeSettings({
        orientation: "portrait",
        showFoldGuide: true,
        showPhoto: true,
        showQr: true,
        cardTheme: "white",
        includeCompany: true,
        includeTimestamp: true,
        ...(ticket.badgeSettings || {})
      });
    } else {
      // Clean blank defaults for new ticket
      setName("");
      setIsFree(false);
      setPrice("5000");
      setIsUnlimited(false);
      setCapacity("100");
      setDescription("");
      setStatus("Active");
      setRequiresApproval(false);
      setIsPopular(false);
      setFeatures([]);
      setSelectedFormId("default");
      setBadgeType("thermal_qr");
      setBadgeUrl("");
      setBadgeSettings({
        orientation: "portrait",
        showFoldGuide: true,
        showPhoto: true,
        showQr: true,
        cardTheme: "white",
        includeCompany: true,
        includeTimestamp: true,
      });
    }
    setActiveTab("general");
  }, [ticket, isOpen]);

  if (!isOpen) return null;

  // Add & Remove Perks
  const handleAddPerk = (perkText) => {
    const trimmed = perkText.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setNewPerkInput("");
    }
  };

  const handleRemovePerk = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Artwork Upload Handler (PNG and JPEG only)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Restrict strictly to PNG and JPEG
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    const fileName = (file.name || "").toLowerCase();
    const isValidExt = fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");

    if (!validTypes.includes(file.type) && !isValidExt) {
      alert("Please upload a PNG or JPEG image only (.png, .jpg, .jpeg).");
      if (e.target) e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      // 1. Immediately read file as Base64 Data URL so local preview is 100% reliable & never broken
      const localDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });

      if (localDataUrl) {
        setBadgeUrl(localDataUrl);
      }

      // 2. Also try uploading to Supabase Storage if helper provided
      if (onUploadFile) {
        try {
          const publicUrl = await onUploadFile(file, "floor-plans", activeEventId);
          if (publicUrl) {
            // Verify if publicUrl is reachable, if so store publicUrl, else keep localDataUrl
            const testImg = new Image();
            testImg.onload = () => {
              setBadgeUrl(publicUrl);
            };
            testImg.onerror = () => {
              console.warn("Uploaded storage URL not directly accessible via CORS/public URL, keeping high-res Base64 template:", publicUrl);
              if (localDataUrl) setBadgeUrl(localDataUrl);
            };
            testImg.src = publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Storage upload failed, keeping base64 Data URL:", uploadErr);
        }
      }
    } catch (err) {
      console.error("Failed to upload badge template:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Save Handler
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      alert("Please provide a name for this ticket tier.");
      setActiveTab("general");
      return;
    }

    setIsSaving(true);
    try {
      const finalPrice = isFree ? 0 : parseFloat(price) || 0;
      const finalCapacity = isUnlimited ? 99999 : parseInt(capacity) || 100;

      const ticketPayload = {
        id: ticket?.id || undefined,
        name: name.trim(),
        tier: name.trim(),
        price: finalPrice,
        maxQty: finalCapacity,
        available: finalCapacity,
        features: features,
        description: description.trim(),
        status: status,
        formId: selectedFormId === "default" ? null : selectedFormId,
        badgeType: badgeType,
        badgeUrl: badgeUrl,
        badgeSettings: badgeSettings,
        requiresApproval: Boolean(requiresApproval),
        isPopular: Boolean(isPopular),
      };

      if (onSaveTicket) {
        await onSaveTicket(ticketPayload);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save ticket:", err);
      alert("Error saving ticket tier. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeFormObj = forms.find(f => f.id === selectedFormId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Slide-over Drawer (Wider container max-w-2xl md:max-w-3xl) */}
      <div className="relative w-full max-w-2xl lg:max-w-3xl bg-white h-full shadow-2xl z-10 flex flex-col border-l border-slate-200 overflow-hidden animate-slide-in-right">
        
        {/* Clean Header: No top icon, no subheadline */}
        <header className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white select-none">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {ticket ? "Edit Ticket Tier" : "Create Ticket Tier"}
            </h2>
            <span className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
              status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              {status}
            </span>
            {isPopular && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Star size={11} className="fill-amber-500 text-amber-500" />
                Featured Tier
              </span>
            )}
            {requiresApproval && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Review Required
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Improved, Elegant Segmented Tab Navigation */}
        <div className="px-8 pt-3.5 pb-3 bg-slate-50/80 border-b border-slate-200 select-none">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/70 rounded-2xl">
            <button
              onClick={() => setActiveTab("general")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "general"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Ticket size={15} className={activeTab === "general" ? "text-blue-600" : "text-slate-400"} />
              <span>Details & Pricing</span>
            </button>

            <button
              onClick={() => setActiveTab("form")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "form"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <FileText size={15} className={activeTab === "form" ? "text-blue-600" : "text-slate-400"} />
              <span>Registration Form</span>
              {selectedFormId !== "default" && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("badge")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "badge"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Printer size={15} className={activeTab === "badge" ? "text-blue-600" : "text-slate-400"} />
              <span>Badge & Print Layout</span>
            </button>
          </div>
        </div>

        {/* Main Form Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: DETAILS & PRICING
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "general" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Ticket Tier Name & Small Suggestion Chips */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Ticket Tier Name <span className="text-rose-500">*</span>
                </label>
                
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Access Pass"
                  className="px-4 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />

                {/* Small Clean Chips Underneath */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Suggestions:</span>
                  {TIER_NAME_SUGGESTIONS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setName(preset)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        name === preset
                          ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Capacity Grid in DZD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Price Box in DZD */}
                <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-4.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Ticket Price (DZD)
                    </label>
                    
                    <div className="inline-flex p-0.5 bg-slate-200 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setIsFree(false)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          !isFree ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFree(true)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isFree ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Free
                      </button>
                    </div>
                  </div>

                  {isFree ? (
                    <div className="py-2.5 px-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Complimentary Admission (0 DZD)</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="5000"
                          className="w-full pl-4 pr-14 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
                          DZD
                        </span>
                      </div>

                      {/* Price Suggestions Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {PRICE_SUGGESTIONS_DZD.map((p) => (
                          <button
                            type="button"
                            key={p.value}
                            onClick={() => setPrice(p.value)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                              price === p.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* 2. Capacity Box */}
                <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-4.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Available Capacity
                    </label>
                    
                    <div className="inline-flex p-0.5 bg-slate-200 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setIsUnlimited(false)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          !isUnlimited ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Limited
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUnlimited(true)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isUnlimited ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Unlimited
                      </button>
                    </div>
                  </div>

                  {isUnlimited ? (
                    <div className="py-2.5 px-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2">
                      <Users size={16} className="text-blue-600 shrink-0" />
                      <span>Unlimited Registrations</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={capacity}
                          onChange={(e) => setCapacity(e.target.value)}
                          placeholder="100"
                          className="w-full pl-4 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                          Tickets
                        </span>
                      </div>

                      {/* Capacity Suggestions Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {CAPACITY_SUGGESTIONS.map((c) => (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() => setCapacity(c.value)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                              capacity === c.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Most Popular Tag & Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Most Popular Feature Checkbox */}
                <div
                  onClick={() => setIsPopular(!isPopular)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    isPopular
                      ? "border-amber-500 bg-amber-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    isPopular ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isPopular && <Check size={13} className="font-bold stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Star size={13} className={isPopular ? "fill-amber-500 text-amber-500" : "text-slate-400"} />
                      <span>Featured / Most Popular Tag</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Highlights this tier with a &quot;Best Seller&quot; badge on the registration page. Only one ticket tier can hold this tag.
                    </p>
                  </div>
                </div>

                {/* Tier Visibility Status */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Tier Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("Active")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        status === "Active"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      Active (On Sale)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("Draft")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        status === "Draft"
                          ? "bg-slate-100 border-slate-400 text-slate-800 shadow-xs"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      Draft (Hidden)
                    </button>
                  </div>
                </div>

              </div>

              {/* Registration Approval Policy */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Registration Approval Policy</span>
                  <span className="text-[11px] font-medium text-slate-400">Controls registration flow</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Option 1: Automatic Instant Access */}
                  <div
                    onClick={() => setRequiresApproval(false)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      !requiresApproval
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!requiresApproval ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <CheckCircle2 size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Auto-Accept</span>
                        {!requiresApproval && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Active</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Immediate confirmation and attendee badge issued upon form submission.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Requires Organizer Review */}
                  <div
                    onClick={() => setRequiresApproval(true)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      requiresApproval
                        ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${requiresApproval ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Clock size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Require Approval</span>
                        {requiresApproval && <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">Pending Queue</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Registrations go to Pending Approvals queue for organizer review before passes are issued.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description (Clean, no dummy pre-filled text) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Description / Marketing Summary
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Access to all sessions, lunch buffet, VIP lounge, and networking floor..."
                  className="px-4 py-3 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 resize-none leading-relaxed bg-white"
                />
              </div>

              {/* Included Perks & Inclusions with Rich Suggestions Bank */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Included Perks & Inclusions ({features.length})
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">Displayed on public landing page</span>
                </div>

                {/* Perk Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPerkInput}
                    onChange={(e) => setNewPerkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPerk(newPerkInput);
                      }
                    }}
                    placeholder="Type a custom perk (e.g. VIP Lounge Access) and press Enter"
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPerk(newPerkInput)}
                    className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} /> Add Perk
                  </button>
                </div>

                {/* Rich Suggested Perks Bank */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Suggested Perks (Click to add)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PERKS.map((preset) => {
                      const isAdded = features.includes(preset);
                      return (
                        <button
                          type="button"
                          key={preset}
                          disabled={isAdded}
                          onClick={() => handleAddPerk(preset)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            isAdded
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60 cursor-default"
                              : "bg-white text-slate-700 border-slate-250 hover:bg-slate-100 hover:border-slate-300 cursor-pointer"
                          }`}
                        >
                          {isAdded ? "✓ " : "+ "} {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Perks List */}
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-bold text-blue-900"
                      >
                        <Check size={13} className="text-blue-600" />
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePerk(idx)}
                          className="text-blue-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: REGISTRATION INTAKE FORM
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "form" && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3.5">
                <FileCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs">
                  <div className="font-bold text-blue-950">Registration Questionnaire</div>
                  <div className="text-blue-800/80 mt-0.5 leading-relaxed">
                    Select which registration questionnaire attendees must complete when applying for or purchasing this ticket tier.
                  </div>
                </div>
              </div>

              {/* Form Options List */}
              <div className="flex flex-col gap-3">
                {/* Standard Default Form */}
                <div
                  onClick={() => setSelectedFormId("default")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                    selectedFormId === "default"
                      ? "border-blue-600 bg-blue-50/30 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedFormId === "default" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <FileText size={17} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Standard Event Registration (Default)</div>
                      <div className="text-xs text-slate-500 mt-0.5">Captures Full Name & Email Address with instant badge generation.</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md">2 Standard Fields</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md">Fast Intake</span>
                      </div>
                    </div>
                  </div>
                  {selectedFormId === "default" && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                  )}
                </div>

                {/* Custom User Forms */}
                {forms.map((form) => {
                  const isSelected = selectedFormId === form.id;
                  const fieldCount = form.fields?.length || 0;
                  return (
                    <div
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/30 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                          <FileText size={17} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{form.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{form.description || "Custom registration questionnaire"}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                              {fieldCount} Questions
                            </span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md capitalize">
                              {form.type?.replace("_", " ") || "Custom Form"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Preview of Selected Form */}
              {activeFormObj && activeFormObj.fields && activeFormObj.fields.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Questionnaire Preview ({activeFormObj.fields.length} Fields)
                    </span>
                    <span className="text-xs font-bold text-blue-600">{activeFormObj.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeFormObj.fields.map((field, fIdx) => (
                      <div key={fIdx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span className="truncate">{field.label}</span>
                          {field.required && <span className="text-rose-500 text-[10px] font-bold shrink-0">*</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">{field.type} Field</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Builder Shortcut */}
              <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">Need a new form or additional intake fields?</div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchView) onSwitchView("forms");
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Open Form Builder <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: BADGE & PRINT LAYOUT
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "badge" && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Badge Design & Printing Layout
                </label>
                <p className="text-xs text-slate-500">
                  Select the physical print format for attendee credentials.
                </p>
              </div>

              {/* 3 Layout Option Cards */}
              <div className="grid grid-cols-1 gap-3">
                
                {/* 1. Thermal QR Ticket */}
                <div
                  onClick={() => setBadgeType("thermal_qr")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    badgeType === "thermal_qr"
                      ? "border-blue-600 bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeType === "thermal_qr" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Printer size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Compact Thermal Ticket Printer
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                          58mm / 80mm
                        </span>
                      </div>
                      {badgeType === "thermal_qr" && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      High-speed on-demand printout for small thermal receipt/sticker printers (Zebra, Brother, Rollo, POS).
                    </p>
                  </div>
                </div>

                {/* 2. A4 Full Page Design */}
                <div
                  onClick={() => setBadgeType("a4")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    badgeType === "a4"
                      ? "border-blue-600 bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeType === "a4" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        A4 4-Fold Badge Sheet
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                          210 x 297 mm
                        </span>
                      </div>
                      {badgeType === "a4" && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Custom A4 template with attendee credentials &amp; QR codes centered in the top-left and top-right quadrants for standard lanyard pouch folding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Artwork Uploader & Settings for A4 */}
              {badgeType === "a4" && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Upload A4 Background Artwork Template
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Full-page background (210 x 297 mm). Top-left and top-right cards will overlay dynamically.
                      </div>
                    </div>
                    {badgeUrl && (
                      <button
                        type="button"
                        onClick={() => setBadgeUrl("")}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        Remove Artwork
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                  />

                  {badgeUrl ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3.5 shadow-xs">
                      <div className="w-14 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center relative">
                        <img
                          src={badgeUrl}
                          alt="Badge artwork"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.warn("Artwork preview error");
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>Custom A4 Template Active</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Full-page background applied to badge sheet
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Upload size={12} /> Replace Template
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin text-blue-600" size={18} />
                          <span className="text-xs font-bold text-slate-600">Uploading artwork template...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <Upload size={16} className="text-blue-600" />
                          <span className="font-bold text-blue-600">Upload A4 background template</span>
                          <span className="text-slate-400 font-medium">(PNG or JPEG only)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badge Controls Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Card Style</label>
                      <SearchableSelect
                        value={badgeSettings.cardTheme || "white"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, cardTheme: val })}
                        options={[
                          { value: "white", label: "Compact White Card" },
                          { value: "glass", label: "Translucent Glass Card" },
                          { value: "floating", label: "Borderless / Direct on Artwork" },
                          { value: "clean", label: "Minimal Border Outline" }
                        ]}
                        placeholder="Select card style..."
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Fold Guidelines</label>
                      <SearchableSelect
                        value={badgeSettings.showFoldGuide !== false ? "true" : "false"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, showFoldGuide: val === "true" })}
                        options={[
                          { value: "true", label: "Show Center Fold Crosshairs" },
                          { value: "false", label: "Hide Fold Guidelines" }
                        ]}
                        placeholder="Fold guidelines..."
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Attendee Photo</label>
                      <SearchableSelect
                        value={badgeSettings.showPhoto !== false ? "true" : "false"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, showPhoto: val === "true" })}
                        options={[
                          { value: "true", label: "Show Avatar / Photo Circle" },
                          { value: "false", label: "Text & QR Only" }
                        ]}
                        placeholder="Attendee photo..."
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">QR Code Pass</label>
                      <SearchableSelect
                        value={badgeSettings.showQr !== false ? "true" : "false"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, showQr: val === "true" })}
                        options={[
                          { value: "true", label: "Include Door Check-in QR" },
                          { value: "false", label: "Badge ID Only" }
                        ]}
                        placeholder="QR code pass..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live Preview Panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col gap-3.5 shadow-lg select-none">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Output Sample Preview
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Sample: Elena Rostova</span>
                </div>

                <div className="flex justify-center py-2">
                  {/* Thermal Ticket Stub */}
                  {badgeType === "thermal_qr" && (
                    <div className="w-60 bg-white text-slate-900 rounded-lg p-4.5 shadow-xl flex flex-col gap-3 font-mono border-t-4 border-slate-800 relative">
                      <div className="text-center border-b border-dashed border-slate-300 pb-2.5">
                        <div className="text-xs font-black uppercase tracking-wider text-slate-800">{eventTitle}</div>
                        <div className="text-[9px] text-slate-500 uppercase mt-0.5">Check-In Pass</div>
                      </div>

                      <div className="text-center py-0.5">
                        <div className="text-base font-black text-slate-900 tracking-tight">Elena Rostova</div>
                        <div className="text-[10px] text-slate-600 font-semibold">InnovateTech Labs</div>
                      </div>

                      <div className="text-center">
                        <span className="inline-block px-3 py-1 text-[10px] font-black uppercase rounded bg-blue-600 text-white">
                          {name || "VIP Access Pass"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-lg border border-slate-200">
                        <QrCode size={80} className="text-slate-900" />
                        <span className="text-[8px] font-bold text-slate-400 mt-1 tracking-widest">#EZ-8942-ELN</span>
                      </div>

                      <div className="text-center border-t border-dashed border-slate-300 pt-2 text-[8px] text-slate-400 uppercase">
                        Kiosk Print • 10:45 AM
                      </div>
                    </div>
                  )}

                  {/* A4 4-Fold Sheet Preview */}
                  {badgeType === "a4" && (
                    <div className="w-full max-w-[340px] sm:max-w-[380px]">
                      <A4BadgeSheet
                        templateUrl={badgeUrl}
                        attendeeName="Elena Rostova"
                        attendeeCompany="InnovateTech Labs"
                        attendeeJobTitle="Lead AI Engineer"
                        ticketType={name || "VIP Access Pass"}
                        badgeCode="EZ-8942-ELN"
                        eventTitle={eventTitle}
                        showFoldGuide={badgeSettings.showFoldGuide !== false}
                        showPhoto={badgeSettings.showPhoto !== false}
                        showQr={badgeSettings.showQr !== false}
                        cardTheme={badgeSettings.cardTheme || "white"}
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Clean Sticky Footer */}
        <footer className="px-8 py-4 border-t border-slate-200 bg-white flex items-center justify-between select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {activeTab !== "badge" ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "general") setActiveTab("form");
                  else if (activeTab === "form") setActiveTab("badge");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check size={14} /> {ticket ? "Save Changes" : "Create Ticket Tier"}
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
