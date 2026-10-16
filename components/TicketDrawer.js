/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ArrowLeft,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
  Users,
  Star,
  Sparkle,
  Eye,
  Building2,
  Store,
  Award,
  MapPin
} from "lucide-react";
import A4BadgeSheet from "./A4BadgeSheet";
import SearchableSelect from "./SearchableSelect";
import { uploadMedia } from "@/lib/storage";
import { useLanguage } from "../lib/i18n";
import {
  CORPORATE_CATEGORIES,
  CORPORATE_TIER_SUGGESTIONS,
  CORPORATE_PERK_SUGGESTIONS
} from "@/lib/constants";

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

const TIER_SUGGESTIONS_MAP = [
  { id: "vip", key: "tickets.suggestionVip", fallback: "VIP Access Pass" },
  { id: "standard", key: "tickets.suggestionStandard", fallback: "Standard Admission" },
  { id: "delegate", key: "tickets.suggestionDelegate", fallback: "Delegate Pass" },
  { id: "earlyBird", key: "tickets.suggestionEarlyBird", fallback: "Early Bird Pass" },
  { id: "speaker", key: "tickets.suggestionSpeaker", fallback: "Speaker Pass" },
  { id: "exhibitor", key: "tickets.suggestionExhibitor", fallback: "Exhibitor Pass" },
  { id: "workshop", key: "tickets.suggestionWorkshop", fallback: "Workshop Pass" },
  { id: "virtual", key: "tickets.suggestionVirtual", fallback: "Virtual Attendee" }
];

// Corporate & B2B preset tier name chips
const CORPORATE_TIER_SUGGESTIONS_MAP = [
  { id: "stand_std", key: "tickets.suggestionStandStd", fallback: "Exhibition Stand (Standard 9m²)" },
  { id: "stand_equipped", key: "tickets.suggestionStandEquipped", fallback: "Equipped Booth (12m²)" },
  { id: "stand_corner", key: "tickets.suggestionStandCorner", fallback: "Corner Stand / Premium Booth" },
  { id: "sponsor_gold", key: "tickets.suggestionSponsorGold", fallback: "Gold Sponsor Package" },
  { id: "sponsor_silver", key: "tickets.suggestionSponsorSilver", fallback: "Silver Sponsor Package" },
  { id: "sponsor_platinum", key: "tickets.suggestionSponsorPlatinum", fallback: "Platinum Sponsor Package" },
  { id: "partner_official", key: "tickets.suggestionPartnerOfficial", fallback: "Official Partner" },
  { id: "partner_media", key: "tickets.suggestionPartnerMedia", fallback: "Official Media Partner" },
  { id: "constructor", key: "tickets.suggestionConstructor", fallback: "Stand Builder / Constructor Pass" },
  { id: "institutional", key: "tickets.suggestionInstitutional", fallback: "Institutional Pavilion" },
  { id: "startup_kiosk", key: "tickets.suggestionStartupKiosk", fallback: "Startup Kiosk / Pod" },
  { id: "corp_delegation", key: "tickets.suggestionCorpDelegation", fallback: "Corporate Delegation Package" }
];

const CORPORATE_SUGGESTED_PERKS_MAP = [
  { id: "corp_space", key: "perk.corpSpace", fallback: "Exhibition Floor Space Included" },
  { id: "corp_shell", key: "perk.corpShell", fallback: "Shell Scheme & Fascia Board with Company Name" },
  { id: "corp_badges", key: "perk.corpBadges", fallback: "Representative Badges Included" },
  { id: "corp_logo_web", key: "perk.corpLogoWeb", fallback: "Logo & Profile on Official Website & Catalog" },
  { id: "corp_vip", key: "perk.corpVip", fallback: "VIP Networking Dinner & Lounge Access" },
  { id: "corp_power", key: "perk.corpPower", fallback: "Electricity & 220V Power Supply" },
  { id: "corp_furniture", key: "perk.corpFurniture", fallback: "Booth Furniture (Table & 2 Chairs)" },
  { id: "corp_b2b", key: "perk.corpB2B", fallback: "B2B Matchmaking & Lead Capture Tool" },
  { id: "corp_guide", key: "perk.corpGuide", fallback: "Full Page Ad in Official Event Guide" },
  { id: "corp_screens", key: "perk.corpScreens", fallback: "Main Stage Screen Logo Rotation" },
  { id: "corp_social", key: "perk.corpSocial", fallback: "Official Social Media Announcement" },
  { id: "corp_freight", key: "perk.corpFreight", fallback: "Dedicated Parking & Freight Delivery Pass" }
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

const SUGGESTED_PERKS_MAP = [
  { id: "keynote", key: "perk.fullKeynote", fallback: "Full Keynote Access" },
  { id: "floor", key: "perk.floorAccess", fallback: "Exhibition Floor Access" },
  { id: "vipLounge", key: "perk.vipLounge", fallback: "VIP Lounge Access" },
  { id: "lunch", key: "perk.buffetLunch", fallback: "Buffet Lunch & Coffee Breaks" },
  { id: "dinner", key: "perk.networkingDinner", fallback: "Networking Dinner & Cocktail" },
  { id: "cert", key: "perk.certificate", fallback: "Certificate of Attendance" },
  { id: "workshop", key: "perk.workshopEntry", fallback: "Workshop & Masterclass Entry" },
  { id: "b2b", key: "perk.b2bMatchmaking", fallback: "B2B Matchmaking Tool" },
  { id: "welcomeKit", key: "perk.welcomeKit", fallback: "Welcome Kit & Gift Bag" },
  { id: "kiosk", key: "perk.fastTrackCheckin", fallback: "Fast-Track Kiosk Check-in" },
  { id: "videos", key: "perk.videoRecordings", fallback: "Session Video Recordings" },
  { id: "speakerQa", key: "perk.speakerQa", fallback: "Speaker Q&A Priority" }
];


export default function TicketDrawer({
  isOpen,
  onClose,
  ticket = null,
  forms = [],
  floorPlans = [],
  onSaveTicket,
  onUploadFile,
  activeEventId,
  eventTitle = "Eventzone Summit",
  eventDetails = {},
  onSwitchView,
  isReadOnly = false
}) {
  const { t, isRTL } = useLanguage();
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'form' | 'badge'

  // Active (Non-archived) Registration Forms
  const activeForms = useMemo(() => {
    return (forms || []).filter(f => f && f.status !== "archived" && !f.isArchived);
  }, [forms]);

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

  // Corporate Ticket & Booth Configuration
  const [ticketTarget, setTicketTarget] = useState("individual"); // 'individual' | 'company'
  const [companyRole, setCompanyRole] = useState("exhibitor"); // 'exhibitor' | 'sponsor' | 'corporate'
  const [badgesIncluded, setBadgesIncluded] = useState(2);
  const [linkedFloorPlanId, setLinkedFloorPlanId] = useState("");
  
  // Perks / Features
  const [features, setFeatures] = useState([]);
  const [newPerkInput, setNewPerkInput] = useState("");

  // Registration Form Binding
  const [selectedFormId, setSelectedFormId] = useState("default");
  const [selectedDelegateFormId, setSelectedDelegateFormId] = useState("default");
  const [corporateFormStep, setCorporateFormStep] = useState("company"); // 'company' | 'delegate'

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
      const rawFormId = ticket.formId || "default";
      const isFormActive = rawFormId === "default" || activeForms.some(f => f.id === rawFormId);
      setSelectedFormId(isFormActive ? rawFormId : "default");
      setBadgeType(ticket.badgeType || "thermal_qr");
      setBadgeUrl(ticket.badgeUrl || "");
      setTicketTarget(ticket.ticketTarget || ticket.badgeSettings?.ticketTarget || "individual");
      setCompanyRole(ticket.companyRole || ticket.badgeSettings?.companyRole || "exhibitor");
      setBadgesIncluded(ticket.badgesIncluded ?? ticket.badgeSettings?.badgesIncluded ?? 2);
      setLinkedFloorPlanId(ticket.linkedFloorPlanId || ticket.badgeSettings?.linkedFloorPlanId || "");
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
      setTicketTarget("individual");
      setCompanyRole("exhibitor");
      setBadgesIncluded(2);
      setLinkedFloorPlanId("");
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
  }, [ticket, isOpen, activeForms]);

  if (!isOpen) return null;

  // Add & Remove Perks
  const handleAddPerk = (perkText) => {
    if (isReadOnly) return;
    const trimmed = perkText.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setNewPerkInput("");
    }
  };

  const handleRemovePerk = (index) => {
    if (isReadOnly) return;
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Artwork Upload Handler (PNG and JPEG only)
  const handleFileUpload = async (e) => {
    if (isReadOnly) return;
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

    if (file.size > 10 * 1024 * 1024) {
      alert(`Badge template image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`);
      if (e.target) e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const publicUrl = await uploadMedia(file, "event-images", activeEventId);
      if (publicUrl) {
        setBadgeUrl(publicUrl);
      }
    } catch (err) {
      console.error("Failed to upload badge template:", err);
      alert("Failed to upload badge template. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save Handler
  const handleSave = async (e) => {
    e?.preventDefault();
    if (isReadOnly) return;
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
        badgeSettings: {
          ...badgeSettings,
          ticketTarget,
          companyRole,
          badgesIncluded: Number(badgesIncluded || 2),
          linkedFloorPlanId: linkedFloorPlanId || null,
        },
        requiresApproval: Boolean(requiresApproval),
        isPopular: Boolean(isPopular),
        ticketTarget: ticketTarget,
        companyRole: companyRole,
        badgesIncluded: Number(badgesIncluded || 2),
        linkedFloorPlanId: linkedFloorPlanId || null,
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

  const activeFormObj = activeForms.find(f => f.id === selectedFormId);
  const activeDelegateFormObj = activeForms.find(f => f.id === selectedDelegateFormId);

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
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {isReadOnly ? (
                <>
                  <Eye size={20} className="text-amber-600 shrink-0" />
                  <span>{t("tickets.viewTier", "View Ticket Tier")}</span>
                </>
              ) : (
                ticket ? t("tickets.editTier", "Edit Ticket Tier") : t("tickets.createTier", "Create Ticket Tier")
              )}
            </h2>
            {isReadOnly && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Viewer Mode (Read-Only)
              </span>
            )}
            <span className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
              status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              {status === "Active" ? t("tickets.statusActive", "Active") : t("tickets.statusDraft", "Draft")}
            </span>
            {isPopular && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Star size={11} className="fill-amber-500 text-amber-500" />
                {t("tickets.featuredTier", "Featured Tier")}
              </span>
            )}
            {requiresApproval && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {t("tickets.reviewRequired", "Review Required")}
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
              <span>{t("tickets.detailsPricingTab", "Details & Pricing")}</span>
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
              <span>{t("drawer.tabForm", "Registration Form")}</span>
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
              <span>{t("drawer.tabBadge", "Badge & Credentials")}</span>
            </button>
          </div>
        </div>

        {/* Main Form Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <fieldset disabled={isReadOnly} className="contents">

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: DETAILS & PRICING
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "general" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Ticket Target Audience: Individual vs Company / B2B */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>{t("tickets.targetAudience", "Ticket Target")}</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {ticketTarget === "company" ? t("tickets.corporateEntity", "Corporate / Stand") : t("tickets.individualPerson", "Individual Attendee")}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketTarget("individual")}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                      ticketTarget === "individual"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs text-blue-900 font-bold"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 font-semibold"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ticketTarget === "individual" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Users size={16} />
                    </div>
                    <div className="text-start">
                      <div className="text-xs font-extrabold">{t("tickets.individual", "Individual")}</div>
                      <div className="text-[10px] text-slate-500 leading-none mt-0.5">{t("tickets.singleAttendeePass", "Single attendee pass")}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTicketTarget("company");
                      setRequiresApproval(true);
                    }}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                      ticketTarget === "company"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs text-blue-900 font-bold"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 font-semibold"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ticketTarget === "company" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Building2 size={16} />
                    </div>
                    <div className="text-start">
                      <div className="text-xs font-extrabold">{t("tickets.companyCorporate", "Company / B2B")}</div>
                      <div className="text-[10px] text-slate-500 leading-none mt-0.5">{t("tickets.standExhibitorPasses", "Stand, booth & team passes")}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ticket Tier Name & Small Suggestion Chips */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  {t("tickets.tierNameLabel", "Ticket Tier Name")} <span className="text-rose-500">*</span>
                </label>
                
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ticketTarget === "company" ? t("tickets.tierCompanyPlaceholder", "e.g. Standard Exhibition Stand (9m²)") : t("tickets.tierNamePlaceholder", "e.g. VIP Access Pass")}
                  className="px-4 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />

                {/* Small Clean Chips Underneath */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">{t("tickets.suggestionsLabel", "Suggestions:")}</span>
                  {(ticketTarget === "company" ? CORPORATE_TIER_SUGGESTIONS_MAP : TIER_SUGGESTIONS_MAP).map((item) => {
                    const translatedLabel = t(item.key, item.fallback);
                    const isSelected = name === translatedLabel || name === item.fallback;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setName(translatedLabel)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {translatedLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Corporate & Booth Settings Panel (Visible only when ticketTarget === "company") */}
              {ticketTarget === "company" && (
                <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 border border-blue-200/80 rounded-2xl p-4.5 flex flex-col gap-4 animate-fade-in shadow-xs">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Building2 size={16} className="text-blue-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">{t("tickets.corporateConfig", "Corporate & Booth Configuration")}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Corporate Role */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">{t("tickets.corporateRole", "Corporate Category")}</label>
                      <SearchableSelect
                        value={companyRole}
                        onChange={(val) => setCompanyRole(val || "exhibitor")}
                        options={CORPORATE_CATEGORIES.map(cat => ({
                          value: cat.value,
                          label: cat.label,
                          sublabel: cat.sublabel
                        }))}
                        placeholder={t("tickets.selectCategory", "Select corporate category...")}
                        searchPlaceholder={t("tickets.searchCategory", "Search category...")}
                        isClearable={false}
                      />
                    </div>

                    {/* Included Badges */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">{t("tickets.badgesIncluded", "Representative Badges Included")}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={badgesIncluded}
                          onChange={(e) => setBadgesIncluded(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">{t("tickets.passes", "passes")}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{t("tickets.badgesIncludedDesc", "Company receives delegation portal link to assign these passes upon approval.")}</p>
                    </div>
                  </div>

                  {/* Link Floor Plan for Booth Selection */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-blue-100">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-blue-600" />
                        <span>{t("tickets.linkFloorPlan", "Link Floor Plan for Stand / Booth Selection")}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-blue-600">{t("common.optional", "Optional")}</span>
                    </label>
                    <SearchableSelect
                      value={linkedFloorPlanId || ""}
                      onChange={(val) => setLinkedFloorPlanId(val || "")}
                      options={[
                        { value: "", label: t("tickets.noFloorPlan", "No Floor Plan (Standard Registration)") },
                        ...(floorPlans || []).map((fp) => ({
                          value: fp.id,
                          label: `${fp.name || "Floor Plan"} ${fp.elements?.length ? `(${fp.elements.filter(el => el.type === 'booth').length} booths)` : ''}`
                        }))
                      ]}
                      placeholder={t("tickets.selectFloorPlan", "Select Floor Plan...")}
                      searchPlaceholder={t("tickets.searchFloorPlan", "Search floor plan...")}
                      isClearable={true}
                    />
                    <p className="text-[10px] text-slate-500 font-medium">
                      {t("tickets.linkFloorPlanDesc", "When linked, exhibitors can pick an available booth directly from this floor plan during registration.")}
                    </p>
                  </div>
                </div>
              )}

              {/* Price & Capacity Grid in DZD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Price Box in DZD */}
                <div className="bg-slate-50/90 border border-slate-250 rounded-2xl p-4.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      {t("tickets.ticketPriceLabel", "Ticket Price (DZD)")}
                    </label>
                    
                    <div className="inline-flex p-0.5 bg-slate-200 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setIsFree(false)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          !isFree ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t("tickets.paidOption", "Paid")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFree(true)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isFree ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t("tickets.freeOption", "Free")}
                      </button>
                    </div>
                  </div>

                  {isFree ? (
                    <div className="py-2.5 px-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{t("tickets.complimentaryAdmission", "Complimentary Admission (0 DZD)")}</span>
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
                          {t("common.dzd", "DZD")}
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
                            <bdi dir="ltr">{p.label}</bdi>
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
                      {t("tickets.availableCapacityLabel", "Available Capacity")}
                    </label>
                    
                    <div className="inline-flex p-0.5 bg-slate-200 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setIsUnlimited(false)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          !isUnlimited ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t("tickets.limitedOption", "Limited")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUnlimited(true)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isUnlimited ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t("tickets.unlimitedOption", "Unlimited")}
                      </button>
                    </div>
                  </div>

                  {isUnlimited ? (
                    <div className="py-2.5 px-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2">
                      <Users size={16} className="text-blue-600 shrink-0" />
                      <span>{t("tickets.unlimitedRegistrations", "Unlimited Registrations")}</span>
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
                          {t("tickets.ticketsUnit", "Tickets")}
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
                      <span>{t("tickets.featuredPopularTag", "Featured / Most Popular Tag")}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {t("tickets.featuredPopularDesc", "Highlights this tier with a \"Best Seller\" badge on the registration page. Only one ticket tier can hold this tag.")}
                    </p>
                  </div>
                </div>

                {/* {t("tickets.tierVisibilityLabel", "Tier Visibility")} Status */}
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
                      {t("tickets.activeOnSale", "Active (On Sale)")}
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
                      {t("tickets.draftHidden", "Draft (Hidden)")}
                    </button>
                  </div>
                </div>

              </div>

              {/* Registration Approval Policy */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>{t("tickets.approvalPolicyLabel", "Registration Approval Policy")}</span>
                  <span className="text-[11px] font-medium text-slate-400">{t("tickets.controlsRegFlow", "Controls registration flow")}</span>
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
                        <span>{t("tickets.autoAccept", "Auto-Accept")}</span>
                        {!requiresApproval && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{t("tickets.activeBadge", "Active")}</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {t("tickets.autoAcceptDesc", "Immediate confirmation and attendee badge issued upon form submission.")}
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
                        <span>{t("tickets.requireApproval", "Require Approval")}</span>
                        {requiresApproval && <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">{t("tickets.pendingQueue", "Pending Queue")}</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {t("tickets.requireApprovalDesc", "Registrations go to Pending Approvals queue for organizer review before passes are issued.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description (Clean, no dummy pre-filled text) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  {t("tickets.descSummaryLabel", "Description / Marketing Summary")}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("tickets.descSummaryPlaceholder", "e.g. Access to all sessions, lunch buffet, VIP lounge, and networking floor...")}
                  className="px-4 py-3 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 resize-none leading-relaxed bg-white"
                />
              </div>

              {/* Included Perks & Inclusions with Rich Suggestions Bank */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {t("tickets.perksLabel", "Included Perks & Inclusions")} ({features.length})
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">{t("tickets.perksSubtitle", "Displayed on public landing page")}</span>
                </div>

                {/* Perk Input */}
                {!isReadOnly && (
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
                      placeholder={t("tickets.perkInputPlaceholder", "Type a custom perk (e.g. VIP Lounge Access) and press Enter")}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPerk(newPerkInput)}
                      className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={14} /> {t("tickets.addPerk", "Add Perk")}
                    </button>
                  </div>
                )}

                {/* Rich Suggested Perks Bank */}
                {!isReadOnly && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {ticketTarget === "company"
                        ? t("tickets.suggestedCorporatePerksLabel", "Suggested Corporate Perks (Click to add)")
                        : t("tickets.suggestedPerksLabel", "Suggested Perks (Click to add)")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(ticketTarget === "company" ? CORPORATE_SUGGESTED_PERKS_MAP : SUGGESTED_PERKS_MAP).map((item) => {
                        const translatedPerk = t(item.key, item.fallback);
                        const isAdded = features.includes(translatedPerk) || features.includes(item.fallback);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            disabled={isAdded}
                            onClick={() => handleAddPerk(translatedPerk)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                              isAdded
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60 cursor-default"
                                : "bg-white text-slate-700 border-slate-250 hover:bg-slate-100 hover:border-slate-300 cursor-pointer"
                            }`}
                          >
                            {isAdded ? "✓ " : "+ "} {translatedPerk}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Perks List */}
                {features.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-bold text-blue-900"
                      >
                        <Check size={13} className="text-blue-600" />
                        <span>{feat}</span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemovePerk(idx)}
                            className="text-blue-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : isReadOnly ? (
                  <p className="text-xs text-slate-400 italic">
                    {t("tickets.noPerksConfigured", "No perks configured for this tier.")}
                  </p>
                ) : null}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: REGISTRATION INTAKE FORM
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "form" && (
            <div className="flex flex-col gap-5 animate-fade-in">
              {ticketTarget === "company" ? (
                <>
                  {/* Two-step Header Stepper for Corporate Ticket Forms */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorporateFormStep("company")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        corporateFormStep === "company"
                          ? "bg-white text-blue-900 shadow-xs border border-blue-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                        corporateFormStep === "company" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        1
                      </span>
                      <Building2 size={14} className={corporateFormStep === "company" ? "text-blue-600" : "text-slate-400"} />
                      <span>{t("tickets.step1CompanyForm", "1. Company Registration Form")}</span>
                      {selectedFormId !== "default" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      )}
                    </button>

                    <ChevronRight size={14} className="text-slate-400 shrink-0" />

                    <button
                      type="button"
                      onClick={() => setCorporateFormStep("delegate")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        corporateFormStep === "delegate"
                          ? "bg-white text-indigo-900 shadow-xs border border-indigo-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                        corporateFormStep === "delegate" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        2
                      </span>
                      <Mail size={14} className={corporateFormStep === "delegate" ? "text-indigo-600" : "text-slate-400"} />
                      <span>{t("tickets.step2PassesForm", "2. Passes Delegation Form")}</span>
                      {selectedDelegateFormId !== "default" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      )}
                    </button>
                  </div>

                  {corporateFormStep === "company" ? (
                    /* Step 1: Company Registration & Stand Intake Form */
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3.5">
                        <Building2 className="text-blue-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs">
                          <div className="font-bold text-blue-950 flex items-center gap-2">
                            <span>{t("tickets.corpQuestionnaireTitle", "Corporate Registration & Stand Intake (Step 1 of 2)")}</span>
                            <span className="text-[10px] bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full font-bold">Public Booking Form</span>
                          </div>
                          <div className="text-blue-800/80 mt-1 leading-relaxed">
                            {t("tickets.corpQuestionnaireDesc", "Select which registration form companies & exhibitors must complete when applying for or booking this corporate package on the event website.")}
                          </div>
                        </div>
                      </div>

                      {/* Company Form Options List */}
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
                              <Building2 size={17} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {t("tickets.standardCorpRegForm", "Standard Corporate & Exhibitor Registration (Default)")}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {t("tickets.standardCorpRegDesc", "Captures Company Name, Industry, Contact Liaison, Logo, Stand Requirements & Representative Allotment.")}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold bg-blue-100/70 text-blue-800 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.corpProfileTag", "Corporate Profile")}
                                </span>
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.standSelectionTag", "Stand Selection")}
                                </span>
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.delegationPortalTag", "Delegation Portal")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedFormId === "default" && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Check size={12} />
                            </div>
                          )}
                        </div>

                        {/* Custom User Forms for Company */}
                        {activeForms.map((form) => {
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
                                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{form.description || t("tickets.customRegDesc", "Custom registration questionnaire")}</div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                                      {t("tickets.questionsCount", "{count} Questions", { count: fieldCount })}
                                    </span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md capitalize">
                                      {form.type?.replace("_", " ") || t("tickets.customForm", "Custom Form")}
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

                      {/* Live Preview of Selected Company Form */}
                      {activeFormObj && activeFormObj.fields && activeFormObj.fields.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              {t("tickets.previewFields", "Company Form Preview ({count} Fields)", { count: activeFormObj.fields.length })}
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
                                <div className="text-[10px] text-slate-400 capitalize mt-0.5">{t("tickets.fieldType", "{type} Field", { type: field.type })}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation to Step 2 */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCorporateFormStep("delegate")}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <span>{t("tickets.nextPassesForm", "Continue to Passes Registration Form")}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Passes Registration Form (sent via email) */
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3.5">
                        <Mail className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs">
                          <div className="font-bold text-indigo-950 flex items-center gap-2">
                            <span>{t("tickets.delegateQuestionnaireTitle", "Representative Passes Intake Form (Step 2 of 2)")}</span>
                            <span className="text-[10px] bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-full font-bold">Email Delegation Portal</span>
                          </div>
                          <div className="text-indigo-800/80 mt-1 leading-relaxed">
                            {t("tickets.delegateQuestionnaireDesc", "Select which registration questionnaire the company's team representatives must complete when claiming their badge passes via the portal link sent to them.")}
                          </div>
                        </div>
                      </div>

                      {/* Passes Form Options List */}
                      <div className="flex flex-col gap-3">
                        {/* Standard Default Delegate Form */}
                        <div
                          onClick={() => setSelectedDelegateFormId("default")}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            selectedDelegateFormId === "default"
                              ? "border-indigo-600 bg-indigo-50/30 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedDelegateFormId === "default" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                              <Users size={17} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {t("tickets.standardDelegateRegForm", "Standard Representative Badge Pass (Default)")}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {t("tickets.standardDelegateRegDesc", "Captures representative's Full Name, Job Title, Work Email & Phone Number with personalized QR pass.")}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold bg-indigo-100/70 text-indigo-800 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.repContactTag", "Representative Contact")}
                                </span>
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.standRoleTag", "Stand Role & Title")}
                                </span>
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.fastIssuance", "Fast Pass Issuance")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedDelegateFormId === "default" && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check size={12} />
                            </div>
                          )}
                        </div>

                        {/* Custom User Forms for Delegates */}
                        {activeForms.map((form) => {
                          const isSelected = selectedDelegateFormId === form.id;
                          const fieldCount = form.fields?.length || 0;
                          return (
                            <div
                              key={form.id}
                              onClick={() => setSelectedDelegateFormId(form.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50/30 shadow-xs"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                                  <FileText size={17} />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">{form.title}</div>
                                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{form.description || t("tickets.customRegDesc", "Custom registration questionnaire")}</div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                                      {t("tickets.questionsCount", "{count} Questions", { count: fieldCount })}
                                    </span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md capitalize">
                                      {form.type?.replace("_", " ") || t("tickets.customForm", "Custom Form")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                  <Check size={12} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Preview of Selected Delegate Form */}
                      {activeDelegateFormObj && activeDelegateFormObj.fields && activeDelegateFormObj.fields.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              {t("tickets.previewDelegateFields", "Passes Form Preview ({count} Fields)", { count: activeDelegateFormObj.fields.length })}
                            </span>
                            <span className="text-xs font-bold text-indigo-600">{activeDelegateFormObj.title}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {activeDelegateFormObj.fields.map((field, fIdx) => (
                              <div key={fIdx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
                                <div className="font-bold text-slate-800 flex items-center justify-between">
                                  <span className="truncate">{field.label}</span>
                                  {field.required && <span className="text-rose-500 text-[10px] font-bold shrink-0">*</span>}
                                </div>
                                <div className="text-[10px] text-slate-400 capitalize mt-0.5">{t("tickets.fieldType", "{type} Field", { type: field.type })}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation between steps */}
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCorporateFormStep("company")}
                          className="text-slate-600 hover:text-slate-900 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          <span>{t("tickets.backToCompanyForm", "Back to Company Form")}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>{t("tickets.bothFormsConfigured", "Both Forms Configured")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Individual Ticket Form Selector (Preserved) */
                <>
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3.5">
                    <FileCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs">
                      <div className="font-bold text-blue-950">
                        {t("tickets.regQuestionnaireTitle", "Registration Questionnaire")}
                      </div>
                      <div className="text-blue-800/80 mt-0.5 leading-relaxed">
                        {t("tickets.regQuestionnaireDesc", "Select which registration questionnaire attendees must complete when applying for or purchasing this ticket tier.")}
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
                          <div className="text-sm font-bold text-slate-900">
                            {t("tickets.standardRegForm", "Standard Event Registration (Default)")}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {t("tickets.standardRegDesc", "Captures Full Name & Email Address with instant badge generation.")}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md">{t("tickets.twoStandardFields", "2 Standard Fields")}</span>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md">{t("tickets.fastIntake", "Fast Intake")}</span>
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
                    {activeForms.map((form) => {
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
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{form.description || t("tickets.customRegDesc", "Custom registration questionnaire")}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                                  {t("tickets.questionsCount", "{count} Questions", { count: fieldCount })}
                                </span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md capitalize">
                                  {form.type?.replace("_", " ") || t("tickets.customForm", "Custom Form")}
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
                          {t("tickets.previewFields", "Questionnaire Preview ({count} Fields)", { count: activeFormObj.fields.length })}
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
                            <div className="text-[10px] text-slate-400 capitalize mt-0.5">{t("tickets.fieldType", "{type} Field", { type: field.type })}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Form Builder Shortcut */}
              <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">{t("tickets.needNewForm", "Need a new form or additional intake fields?")}</div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchView) onSwitchView("forms");
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  {t("tickets.openFormBuilder", "Open Form Builder")} <ArrowRight size={13} />
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
                  {ticketTarget === "company"
                    ? t("tickets.corpBadgeDesignTitle", "Representative & Staff Badge Layout")
                    : t("tickets.badgeDesignTitle", "Badge Design & Printing Layout")}
                </label>
                <p className="text-xs text-slate-500">
                  {ticketTarget === "company"
                    ? t("tickets.corpBadgeDesignDesc", "Select the physical print format for badges issued to company representatives, exhibitors, and crew.")
                    : t("tickets.badgeDesignDesc", "Select the physical print format for attendee credentials.")}
                </p>
              </div>

              {ticketTarget === "company" && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 flex items-start gap-3">
                  <Award className="text-indigo-600 shrink-0 mt-0.5" size={17} />
                  <div className="text-xs leading-relaxed text-indigo-950">
                    <span className="font-bold">{t("tickets.delegationBadgeNoteTitle", "Corporate Pass Allotment:")} </span>
                    {t("tickets.delegationBadgeNoteDesc", "Each confirmed company representative added via the Delegation Portal will inherit this badge format with their company branding and role pass.")}
                  </div>
                </div>
              )}

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
                        {t("tickets.thermalPrinterTitle", "Compact Thermal Ticket Printer")}
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                          <bdi dir="ltr">58mm / 80mm</bdi>
                        </span>
                      </div>
                      {badgeType === "thermal_qr" && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {t("tickets.thermalPrinterDesc", "High-speed on-demand printout for small thermal receipt/sticker printers (Zebra, Brother, Rollo, POS).")}
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
                        {t("tickets.a4BadgeSheetTitle", "A4 4-Fold Badge Sheet")}
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                          <bdi dir="ltr">210 x 297 mm</bdi>
                        </span>
                      </div>
                      {badgeType === "a4" && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {t("tickets.a4BadgeSheetDesc", "Custom A4 template with attendee credentials & QR codes centered in the top-left and top-right quadrants for standard lanyard pouch folding.")}
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
                        {t("tickets.uploadA4ArtworkTitle", "Upload A4 Background Artwork Template")}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <>{t("tickets.uploadA4ArtworkDesc", "Full-page background (210 x 297 mm). Top-left and top-right cards will overlay dynamically.")}</>
                      </div>
                    </div>
                    {badgeUrl && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setBadgeUrl("")}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        {t("tickets.removeArtwork", "Remove Artwork")}
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
                          <span>{t("tickets.customA4TemplateActive", "Custom A4 Template Active")}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t("tickets.fullPageBackgroundApplied", "Full-page background applied to badge sheet")}
                        </p>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Upload size={12} /> {t("tickets.replaceTemplate", "Replace Template")}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isReadOnly ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 bg-slate-50/60 text-center text-xs text-slate-400">
                      {t("tickets.noCustomArtworkSet", "No custom A4 background artwork set")}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin text-blue-600" size={18} />
                          <span className="text-xs font-bold text-slate-600">{t("tickets.uploadingArtwork", "Uploading artwork template...")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <Upload size={16} className="text-blue-600" />
                          <span className="font-bold text-blue-600">{t("tickets.uploadA4Template", "Upload A4 background template")}</span>
                          <span className="text-slate-400 font-medium"><bdi dir="ltr">(PNG or JPEG up to 10MB)</bdi></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badge Controls Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">{t("tickets.cardStyleLabel", "Card Style")}</label>
                      <SearchableSelect
                        value={badgeSettings.cardTheme || "white"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, cardTheme: val })}
                        options={[
                          { value: "white", label: t("tickets.cardStyleCompactWhite", "Compact White Card") },
                          { value: "glass", label: t("tickets.cardStyleTranslucentGlass", "Translucent Glass Card") },
                          { value: "floating", label: t("tickets.cardStyleBorderless", "Borderless / Direct on Artwork") },
                          { value: "clean", label: t("tickets.cardStyleMinimalOutline", "Minimal Border Outline") }
                        ]}
                        placeholder={t("tickets.selectCardStylePlaceholder", "Select card style...")}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">{t("tickets.foldGuidelinesLabel", "Fold Guidelines")}</label>
                      <SearchableSelect
                        value={badgeSettings.showFoldGuide !== false ? "true" : "false"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, showFoldGuide: val === "true" })}
                        options={[
                          { value: "true", label: t("tickets.showCenterFold", "Show Center Fold Crosshairs") },
                          { value: "false", label: t("tickets.hideFoldGuidelines", "Hide Fold Guidelines") }
                        ]}
                        placeholder={t("tickets.foldGuidelinesPlaceholder", "Fold guidelines...")}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">{t("tickets.attendeePhotoLabel", "Attendee Photo")}</label>
                      <SearchableSelect
                        value={badgeSettings.showPhoto !== false ? "true" : "false"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, showPhoto: val === "true" })}
                        options={[
                          { value: "true", label: t("tickets.showAvatarCircle", "Show Avatar / Photo Circle") },
                          { value: "false", label: t("tickets.textAndQrOnly", "Text & QR Only") }
                        ]}
                        placeholder={t("tickets.attendeePhotoPlaceholder", "Attendee photo...")}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">{t("tickets.qrCodePassLabel", "QR Code Pass")}</label>
                      <SearchableSelect
                        value={badgeSettings.showQr !== false ? "true" : "false"}
                        onChange={(val) => setBadgeSettings({ ...badgeSettings, showQr: val === "true" })}
                        options={[
                          { value: "true", label: t("tickets.includeDoorCheckinQr", "Include Door Check-in QR") },
                          { value: "false", label: t("tickets.badgeIdOnly", "Badge ID Only") }
                        ]}
                        placeholder={t("tickets.qrCodePassPlaceholder", "QR code pass...")}
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
                      {t("tickets.liveOutputPreview", "Live Output Sample Preview")}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{t("tickets.sampleName", "Sample: Elena Rostova")}</span>
                </div>

                <div className="flex justify-center py-2">
                  {/* Thermal Ticket Stub */}
                  {badgeType === "thermal_qr" && (
                    <div className="w-60 bg-white text-slate-900 rounded-lg p-4.5 shadow-xl flex flex-col gap-3 font-mono border-t-4 border-slate-800 relative">
                      <div className="text-center border-b border-dashed border-slate-300 pb-2.5">
                        <div className="text-xs font-black uppercase tracking-wider text-slate-800">{eventTitle}</div>
                        <div className="text-[9px] text-slate-500 uppercase mt-0.5">{t("tickets.checkInPass", "Check-In Pass")}</div>
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
                        {t("tickets.kioskPrintSample", "Kiosk Print • 10:45 AM")}
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
                        eventDate={eventDetails?.startDate || eventDetails?.start_date || ""}
                        eventLocation={eventDetails?.location || eventDetails?.venue || ""}
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
          </fieldset>
        </div>

        {/* Clean Sticky Footer */}
        <footer className="px-8 py-4 border-t border-slate-200 bg-white flex items-center justify-between select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            {isReadOnly ? t("common.close", "Close") : t("common.cancel", "Cancel")}
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
                {t("common.next", "Next")} <ChevronRight size={14} />
              </button>
            ) : null}

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> {t("common.saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <Check size={14} /> {ticket ? t("common.saveChanges", "Save Changes") : t("tickets.createTier", "Create Ticket Tier")}
                  </>
                )}
              </button>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
}
