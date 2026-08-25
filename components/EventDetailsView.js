"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Calendar, MapPin, Globe, Check, Loader2,
  ExternalLink, Upload, Trash2, Plus, Users, Tag, 
  Building2, Mail, Phone, FileText, Image as ImageIcon, 
  Clock, Sparkles, AlertCircle, Cloud, CheckCircle2,
  CalendarDays, CalendarRange, Video, Link as LinkIcon,
  Copy, Edit3, ChevronDown, ChevronUp, Layers, Compass,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Palette, Highlighter,
  RemoveFormatting
} from "lucide-react";
import CustomDatePicker from "./CustomDatePicker";
import CustomSchedulePicker from "./CustomSchedulePicker";
import { CountrySelect, CitySelect } from "./LocationInputs";
import CountryPhoneInput from "./CountryPhoneInput";
import SearchableSelect from "./SearchableSelect";
import { EventDetailsSkeleton } from "./SkeletonLoaders";

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

const EVENT_TYPES = [
  { id: "In-Person", label: "In-Person", desc: "Physical on-site attendance only", icon: Building2 },
  { id: "Hybrid", label: "Hybrid", desc: "Both in-person venue & virtual live stream", icon: Globe },
  { id: "Virtual", label: "Virtual", desc: "100% online streaming & digital expo", icon: Video }
];

const VIRTUAL_PLATFORMS = [
  "Zoom Webinar / Meeting",
  "Google Meet",
  "YouTube Live Stream",
  "Microsoft Teams",
  "Vimeo / Custom Webcast",
  "LinkedIn Live",
  "Discord / Community Space",
  "Other Webcast Link"
];

export function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // If user pasted full iframe tag: <iframe src="...youtube...">
  if (trimmed.includes("<iframe") && trimmed.includes("src=")) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      return getYouTubeEmbedUrl(srcMatch[1]);
    }
  }

  // If user passed just the 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}`;
  }

  // Already an embed URL
  if (trimmed.includes("youtube.com/embed/") || trimmed.includes("youtube-nocookie.com/embed/")) {
    const idMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (idMatch && idMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${idMatch[1]}`;
    }
    return trimmed;
  }

  // Match all standard YouTube patterns (watch, youtu.be, shorts, live, v, embed)
  const patterns = [
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|v\/|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
  }

  return null;
}

const TEXT_COLORS = [
  { name: "Default", color: "#0f172a" },
  { name: "Blue", color: "#2563eb" },
  { name: "Emerald", color: "#059669" },
  { name: "Purple", color: "#7c3aed" },
  { name: "Red", color: "#dc2626" },
  { name: "Orange", color: "#ea580c" },
  { name: "Amber", color: "#d97706" },
  { name: "Slate", color: "#64748b" },
];

const HIGHLIGHT_COLORS = [
  { name: "None", color: "transparent" },
  { name: "Yellow", color: "#fef08a" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Purple", color: "#e9d5ff" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Orange", color: "#fed7aa" },
];

const TEXT_SIZES = [
  { label: "Normal (P)", tag: "p" },
  { label: "Heading 1 (Large)", tag: "h1" },
  { label: "Heading 2 (Medium)", tag: "h2" },
  { label: "Heading 3 (Small)", tag: "h3" },
];

function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Provide a comprehensive summary of the summit, key tracks, keynote topics, networking highlights, and attendee takeaways...",
  minHeight = "160px"
}) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [activeSize, setActiveSize] = useState("Normal (P)");
  const [activeColor, setActiveColor] = useState("#0f172a");

  // Sync external value changes into editor innerHTML only when not internally typing
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = (command, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      if (onChange) {
        onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
      }
    }
  };

  const applyTextSize = (sizeObj) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("formatBlock", false, `<${sizeObj.tag}>`);
    setActiveSize(sizeObj.label);
    setSizeMenuOpen(false);
    handleInput();
  };

  const applyTextColor = (color) => {
    exec("foreColor", color);
    setActiveColor(color);
    setColorMenuOpen(false);
  };

  const applyHighlight = (color) => {
    exec("hiliteColor", color);
    setHighlightMenuOpen(false);
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all text-left">
      {/* ── RICH TEXT TOOLBAR ── */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-1.5 select-none">
        
        {/* Text Size / Heading Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSizeMenuOpen(!sizeMenuOpen);
              setColorMenuOpen(false);
              setHighlightMenuOpen(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            title="Text Size & Style"
          >
            <span>{activeSize}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {sizeMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 space-y-0.5 animate-scale-up">
              {TEXT_SIZES.map((sz) => (
                <button
                  key={sz.label}
                  type="button"
                  onClick={() => applyTextSize(sz)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    activeSize === sz.label ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                  }`}
                >
                  <span>{sz.label}</span>
                  {activeSize === sz.label && <Check size={13} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Basic Formatting Buttons */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors font-bold text-xs"
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors italic text-xs"
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Underline (Ctrl+U)"
        >
          <Underline size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setColorMenuOpen(!colorMenuOpen);
              setSizeMenuOpen(false);
              setHighlightMenuOpen(false);
            }}
            className="h-7 px-2 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
            title="Text Color"
          >
            <div className="flex items-center gap-1">
              <Palette size={14} />
              <span className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: activeColor }} />
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </button>

          {colorMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-scale-up space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">Text Color</span>
              <div className="grid grid-cols-4 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => applyTextColor(c.color)}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-2xs"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {activeColor === c.color && <Check size={12} className={c.color === "#0f172a" || c.color === "#2563eb" ? "text-white" : "text-slate-900"} />}
                  </button>
                ))}
              </div>
              <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Custom:</span>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => applyTextColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Highlight Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setHighlightMenuOpen(!highlightMenuOpen);
              setSizeMenuOpen(false);
              setColorMenuOpen(false);
            }}
            className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
            title="Highlight Color"
          >
            <Highlighter size={14} />
          </button>

          {highlightMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-scale-up space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">Highlight</span>
              <div className="grid grid-cols-4 gap-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => applyHighlight(c.color)}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform text-[10px] font-bold shadow-2xs"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {c.color === "transparent" ? "None" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Text Alignment */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyFull"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Justify"
        >
          <AlignJustify size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Bullet List"
        >
          <List size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<blockquote>"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs"
          title="Quote / Callout"
        >
          <Quote size={14} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-700 flex items-center justify-center cursor-pointer transition-colors text-xs text-rose-600"
          title="Clear Formatting"
        >
          <RemoveFormatting size={14} />
        </button>

      </div>

      {/* ── EDITOR BODY ── */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-4 text-xs sm:text-sm text-slate-900 focus:outline-none resize-y overflow-auto leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&_h1]:text-2xl [&_h1]:font-black [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-slate-600"
      />
    </div>
  );
}

export default function EventDetailsView({ 
  eventDetails, 
  isLoading = false,
  onUpdateEventDetails, 
  onPreviewLandingPage,
  onUploadFile 
}) {
  // ─── TAB 1: GENERAL SUMMIT STATE ─────────────────────────────────────────
  const [title, setTitle] = useState(eventDetails?.title || "");
  const [tagline, setTagline] = useState(eventDetails?.tagline || "");
  const [category, setCategory] = useState(eventDetails?.category || INDUSTRIES[0]);
  const [type, setType] = useState(eventDetails?.type || "In-Person");
  const [capacity, setCapacity] = useState(eventDetails?.capacity || 500);
  const [description, setDescription] = useState(eventDetails?.description || "");
  const [eventLogo, setEventLogo] = useState(eventDetails?.eventLogo || eventDetails?.logo || "");
  const [uploadingEventLogo, setUploadingEventLogo] = useState(false);
  const eventLogoFileInputRef = useRef(null);

  // ─── TAB 2: SCHEDULE & LOCATION STATE ────────────────────────────────────
  // Single vs Multiple Schedule & Location Mode
  const [scheduleMode, setScheduleMode] = useState(
    eventDetails?.scheduleMode || 
    (Array.isArray(eventDetails?.multiLocations) && eventDetails.multiLocations.length > 1 ? "multiple" : "single")
  );

  // Single Mode Date State
  const [startDate, setStartDate] = useState(eventDetails?.startDate || "");
  const [endDate, setEndDate] = useState(eventDetails?.endDate || "");
  const [isMultiDay, setIsMultiDay] = useState(
    Boolean(eventDetails?.endDate && eventDetails?.startDate && eventDetails.endDate !== eventDetails.startDate)
  );
  const [scheduleTime, setScheduleTime] = useState(eventDetails?.scheduleTime || "09:00 AM – 05:00 PM");

  // Single Mode Location State (Country, City, Venue, Address, Virtual)
  const [country, setCountry] = useState(eventDetails?.country || "Algeria");
  const [city, setCity] = useState(eventDetails?.city || "Algiers");
  const [venueName, setVenueName] = useState(() => {
    const raw = eventDetails?.venueName || eventDetails?.venue_name || eventDetails?.location || "";
    return (raw.includes("Locations") || raw.includes("Scheduled")) ? "" : raw;
  });
  const [venueAddress, setVenueAddress] = useState(eventDetails?.venueAddress || "");
  const [virtualUrl, setVirtualUrl] = useState(eventDetails?.virtualUrl || eventDetails?.onlineLink || "");
  const [virtualPlatform, setVirtualPlatform] = useState(eventDetails?.virtualPlatform || "Zoom Webinar / Meeting");
  const [virtualInstructions, setVirtualInstructions] = useState(eventDetails?.virtualInstructions || "");

  // Multiple Dates, Times & Locations State
  const [multiLocations, setMultiLocations] = useState(
    Array.isArray(eventDetails?.multiLocations) && eventDetails.multiLocations.length > 0
      ? eventDetails.multiLocations
      : [
          {
            id: "loc-1",
            name: "Session / Stop 1: Opening & Keynotes",
            date: eventDetails?.startDate || new Date().toISOString().split("T")[0],
            endDate: eventDetails?.endDate || eventDetails?.startDate || new Date().toISOString().split("T")[0],
            time: eventDetails?.scheduleTime || "09:00 AM – 05:00 PM",
            format: eventDetails?.type || "In-Person",
            country: eventDetails?.country || "Algeria",
            city: eventDetails?.city || "Algiers",
            venueName: eventDetails?.venueName || "Algiers International Conference Center (CIC)",
            venueAddress: eventDetails?.venueAddress || "Route Nationale 11, Staoueli, Algiers",
            virtualUrl: eventDetails?.virtualUrl || "",
            virtualPlatform: "Zoom Webinar / Meeting",
            notes: "Main Auditorium Hall"
          }
        ]
  );
  const [editingStopId, setEditingStopId] = useState(null);

  // ─── TAB 3: MEDIA & GALLERY (MAX 5 IMAGES, MAX 5MB, YOUTUBE VIDEO) ────────
  const [galleryImages, setGalleryImages] = useState(() => {
    if (Array.isArray(eventDetails?.gallery)) {
      return eventDetails.gallery.slice(0, 5);
    }
    if (eventDetails?.banner) {
      return [eventDetails.banner];
    }
    return [];
  });
  const [banner, setBanner] = useState(() => {
    return eventDetails?.banner || (Array.isArray(eventDetails?.gallery) && eventDetails.gallery[0]) || "";
  });
  const [youtubeUrl, setYoutubeUrl] = useState(
    eventDetails?.youtubeUrl || eventDetails?.videoUrl || eventDetails?.youtube_url || ""
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileInputRef = useRef(null);

  // ─── TAB 4: ORGANIZER & CONTACT ──────────────────────────────────────────
  const [organizerName, setOrganizerName] = useState(eventDetails?.organizerName || "Eventzone");
  const [contactEmail, setContactEmail] = useState(eventDetails?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(eventDetails?.contactPhone || "");
  const [websiteUrl, setWebsiteUrl] = useState(eventDetails?.websiteUrl || "");
  const [organizerLogo, setOrganizerLogo] = useState(eventDetails?.organizerLogo || eventDetails?.hostLogo || "");
  const [uploadingOrganizerLogo, setUploadingOrganizerLogo] = useState(false);
  const organizerLogoFileInputRef = useRef(null);

  // Tab Selection: "general" | "schedule" | "media" | "contact"
  const [activeTab, setActiveTab] = useState("general");

  // Real-Time Auto-Save Status: "idle" | "saving" | "saved"
  const [syncStatus, setSyncStatus] = useState("saved");
  const isSyncingFromProps = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const autoSaveTimerRef = useRef(null);

  // Helper to extract a normalized comparable snapshot of event fields
  const getComparableSnapshot = useCallback((data) => {
    if (!data) return "";
    return JSON.stringify({
      title: data.title || "",
      tagline: data.tagline || "",
      category: data.category || "",
      type: data.type || "In-Person",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      scheduleTime: data.scheduleTime || "",
      scheduleMode: data.scheduleMode || "single",
      country: data.country || "Algeria",
      city: data.city || "Algiers",
      venueName: data.venueName || "",
      venueAddress: data.venueAddress || "",
      virtualUrl: data.virtualUrl || "",
      virtualPlatform: data.virtualPlatform || "",
      virtualInstructions: data.virtualInstructions || "",
      multiLocations: data.multiLocations || [],
      description: data.description || "",
      banner: data.banner || "",
      capacity: Number(data.capacity) || 500,
      organizerName: data.organizerName || "",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      websiteUrl: data.websiteUrl || "",
      youtubeUrl: data.youtubeUrl || "",
      eventLogo: data.eventLogo || "",
      organizerLogo: data.organizerLogo || "",
      gallery: Array.isArray(data.gallery) ? data.gallery : []
    });
  }, []);

  // Synchronize when incoming eventDetails change externally
  useEffect(() => {
    if (eventDetails && eventDetails.id) {
      isSyncingFromProps.current = true;
      setTitle(eventDetails.title || "");
      setTagline(eventDetails.tagline || "");
      setCategory(eventDetails.category || INDUSTRIES[0]);
      setType(eventDetails.type || "In-Person");
      setStartDate(eventDetails.startDate || "");
      setEndDate(eventDetails.endDate || "");
      setIsMultiDay(Boolean(eventDetails.endDate && eventDetails.startDate && eventDetails.endDate !== eventDetails.startDate));
      setScheduleTime(eventDetails.scheduleTime || "09:00 AM – 05:00 PM");
      setScheduleMode(eventDetails.scheduleMode || (Array.isArray(eventDetails.multiLocations) && eventDetails.multiLocations.length > 1 ? "multiple" : "single"));
      
      setCountry(eventDetails.country || "Algeria");
      setCity(eventDetails.city || "Algiers");
      const rawLoc = eventDetails.venueName || eventDetails.venue_name || eventDetails.location || "";
      setVenueName((rawLoc.includes("Locations") || rawLoc.includes("Scheduled")) ? "" : rawLoc);
      setVenueAddress(eventDetails.venueAddress || "");
      setVirtualUrl(eventDetails.virtualUrl || eventDetails.onlineLink || "");
      setVirtualPlatform(eventDetails.virtualPlatform || "Zoom Webinar / Meeting");
      setVirtualInstructions(eventDetails.virtualInstructions || "");

      if (Array.isArray(eventDetails.multiLocations) && eventDetails.multiLocations.length > 0) {
        setMultiLocations(eventDetails.multiLocations);
      }

      setDescription(eventDetails.description || "");
      const currentBanner = eventDetails.banner || eventDetails.cover_url || "";
      setBanner(currentBanner);
      setCapacity(eventDetails.capacity || 500);
      setOrganizerName(eventDetails.organizerName || "Eventzone");
      setContactEmail(eventDetails.contactEmail || "");
      setContactPhone(eventDetails.contactPhone || "");
      setWebsiteUrl(eventDetails.websiteUrl || "");
      setYoutubeUrl(eventDetails.youtubeUrl || eventDetails.videoUrl || eventDetails.youtube_url || "");
      setEventLogo(eventDetails.eventLogo || eventDetails.logo || eventDetails.logo_url || "");
      setOrganizerLogo(eventDetails.organizerLogo || eventDetails.hostLogo || "");
      
      const galleryList = Array.isArray(eventDetails.gallery) && eventDetails.gallery.length > 0
        ? eventDetails.gallery.slice(0, 5) 
        : (currentBanner ? [currentBanner] : []);
      setGalleryImages(galleryList);

      // Record baseline snapshot so initial load NEVER triggers an auto-save overwrite
      lastSavedSnapshotRef.current = getComparableSnapshot({
        ...eventDetails,
        banner: currentBanner,
        gallery: galleryList
      });

      // Clear any pending autosave timer from prior event
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setTimeout(() => {
        isSyncingFromProps.current = false;
      }, 50);
    }
  }, [eventDetails?.id, getComparableSnapshot]);

  // Construct current payload with composite location string for universal compatibility
  const buildPayload = useCallback(() => {
    const finalEndDate = isMultiDay ? endDate : startDate;
    const currentGallery = galleryImages.slice(0, 5);
    const primaryBanner = banner || (currentGallery.length > 0 ? currentGallery[0] : "");

    // Generate comprehensive composite location string
    let compositeLocation = "";
    if (scheduleMode === "multiple") {
      compositeLocation = multiLocations.length > 0
        ? `${multiLocations.length} Locations (${multiLocations[0]?.city || multiLocations[0]?.name || "Multiple Stops"})`
        : "Multiple Scheduled Locations";
    } else {
      if (type === "Virtual") {
        compositeLocation = virtualPlatform ? `${virtualPlatform} (Online)` : "Online Virtual Event";
      } else {
        const parts = [venueName, city, country].filter(Boolean);
        compositeLocation = parts.length > 0 ? parts.join(", ") : "Main Venue";
        if (type === "Hybrid") {
          compositeLocation += " (Hybrid)";
        }
      }
    }

    return {
      ...(eventDetails || {}),
      title,
      tagline,
      category,
      type,
      startDate,
      endDate: finalEndDate,
      scheduleTime,
      scheduleMode,
      country,
      city,
      venueName,
      venueAddress,
      virtualUrl,
      virtualPlatform,
      virtualInstructions,
      multiLocations,
      location: compositeLocation,
      description,
      banner: primaryBanner,
      cover_url: primaryBanner,
      capacity: Number(capacity) || 500,
      organizerName,
      contactEmail,
      contactPhone,
      websiteUrl,
      youtubeUrl,
      videoUrl: youtubeUrl,
      youtube_url: youtubeUrl,
      video_url: youtubeUrl,
      eventLogo,
      logo: eventLogo,
      logo_url: eventLogo,
      organizerLogo,
      hostLogo: organizerLogo,
      gallery: currentGallery
    };
  }, [
    eventDetails, title, tagline, category, type, startDate, endDate, isMultiDay,
    scheduleTime, scheduleMode, country, city, venueName, venueAddress,
    virtualUrl, virtualPlatform, virtualInstructions, multiLocations,
    description, banner, capacity, organizerName, contactEmail, contactPhone,
    websiteUrl, youtubeUrl, eventLogo, organizerLogo, galleryImages
  ]);

  // Real-time Debounced Auto-Save Trigger (Fires ONLY on user modification)
  useEffect(() => {
    if (!eventDetails || !eventDetails.id || isSyncingFromProps.current) {
      return;
    }

    const currentPayload = buildPayload();
    const currentSnapshot = getComparableSnapshot(currentPayload);

    // Skip if identical to last saved state or initial loaded baseline
    if (!currentSnapshot || currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setSyncStatus("saving");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(currentPayload);
        }
        lastSavedSnapshotRef.current = currentSnapshot;
        setSyncStatus("saved");
      } catch (err) {
        console.error("Real-time autosave error:", err);
        setSyncStatus("saved");
      }
    }, 450);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    eventDetails, title, tagline, category, type, startDate, endDate, isMultiDay,
    scheduleTime, scheduleMode, country, city, venueName, venueAddress,
    virtualUrl, virtualPlatform, virtualInstructions, multiLocations,
    description, banner, capacity, organizerName, contactEmail, contactPhone,
    websiteUrl, youtubeUrl, eventLogo, organizerLogo, galleryImages,
    buildPayload, getComparableSnapshot, onUpdateEventDetails
  ]);

  // ─── MULTI-LOCATION MANAGEMENT HELPERS ───────────────────────────────────
  const handleAddStop = () => {
    const nextIdx = multiLocations.length + 1;
    const newStop = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `Session / Stop ${nextIdx}: Location & Track`,
      date: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || startDate || new Date().toISOString().split("T")[0],
      time: "09:00 AM – 05:00 PM",
      format: type || "In-Person",
      country: country || "Algeria",
      city: city || "Algiers",
      venueName: "",
      venueAddress: "",
      virtualUrl: "",
      virtualPlatform: "Zoom Webinar / Meeting",
      notes: ""
    };
    const updated = [...multiLocations, newStop];
    setMultiLocations(updated);
    setEditingStopId(newStop.id);
  };

  const handleUpdateStop = (stopId, field, val) => {
    setMultiLocations(prev => prev.map(s => s.id === stopId ? { ...s, [field]: val } : s));
  };

  const handleDuplicateStop = (stopToDuplicate) => {
    const copy = {
      ...stopToDuplicate,
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${stopToDuplicate.name} (Copy)`
    };
    setMultiLocations(prev => [...prev, copy]);
  };

  const handleDeleteStop = (stopId) => {
    if (multiLocations.length <= 1) {
      alert("At least one date and location stop must be maintained.");
      return;
    }
    setMultiLocations(prev => prev.filter(s => s.id !== stopId));
    if (editingStopId === stopId) {
      setEditingStopId(null);
    }
  };

  // ─── FILE UPLOAD HANDLERS (MAX 5 IMAGES, MAX 5MB EACH) ────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (galleryImages.length >= 5) {
      alert("Maximum 5 images allowed. Please remove an existing image before adding a new one.");
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      return;
    }

    // 5MB Limit: 5 * 1024 * 1024 bytes
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      alert(`File is too large (${sizeMb}MB). The maximum allowed image size is 5MB. Please choose a smaller image.`);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);
    setSyncStatus("saving");
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, "floor-plans");
      }

      if (publicUrl) {
        const updated = [...galleryImages, publicUrl].slice(0, 5);
        setGalleryImages(updated);
        const newBanner = updated[0] || banner;
        setBanner(newBanner);
        const payload = { 
          ...buildPayload(), 
          gallery: updated, 
          banner: newBanner, 
          cover_url: newBanner 
        };
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(payload);
        }
        lastSavedSnapshotRef.current = getComparableSnapshot(payload);
        setSyncStatus("saved");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const handleSetPrimaryCover = async (idx) => {
    if (idx === 0) return;
    const target = galleryImages[idx];
    const reordered = [target, ...galleryImages.filter((_, i) => i !== idx)];
    setGalleryImages(reordered);
    setBanner(target);
    const payload = { 
      ...buildPayload(), 
      gallery: reordered, 
      banner: target, 
      cover_url: target 
    };
    if (onUpdateEventDetails) {
      await onUpdateEventDetails(payload);
    }
    lastSavedSnapshotRef.current = getComparableSnapshot(payload);
    setSyncStatus("saved");
  };

  const handleRemoveImage = async (idxToRemove) => {
    const updated = galleryImages.filter((_, idx) => idx !== idxToRemove);
    setGalleryImages(updated);
    const newBanner = updated.length > 0 ? (idxToRemove === 0 ? updated[0] : banner) : "";
    setBanner(newBanner);
    const payload = { 
      ...buildPayload(), 
      gallery: updated, 
      banner: newBanner, 
      cover_url: newBanner 
    };
    if (onUpdateEventDetails) {
      await onUpdateEventDetails(payload);
    }
    lastSavedSnapshotRef.current = getComparableSnapshot(payload);
    setSyncStatus("saved");
  };

  const handleEventLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      alert(`Event logo file is too large (${sizeMb}MB). Maximum allowed size is 5MB.`);
      if (eventLogoFileInputRef.current) eventLogoFileInputRef.current.value = "";
      return;
    }

    setUploadingEventLogo(true);
    setSyncStatus("saving");
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, "floor-plans");
      }

      if (publicUrl) {
        setEventLogo(publicUrl);
        const payload = { ...buildPayload(), eventLogo: publicUrl, logo: publicUrl, logo_url: publicUrl };
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(payload);
        }
        lastSavedSnapshotRef.current = getComparableSnapshot(payload);
        setSyncStatus("saved");
      }
    } catch (err) {
      console.error("Event logo upload error:", err);
      alert("Failed to upload event logo. Please try again.");
    } finally {
      setUploadingEventLogo(false);
      if (eventLogoFileInputRef.current) eventLogoFileInputRef.current.value = "";
    }
  };

  const handleOrganizerLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      alert(`Organizer logo file is too large (${sizeMb}MB). Maximum allowed size is 5MB.`);
      if (organizerLogoFileInputRef.current) organizerLogoFileInputRef.current.value = "";
      return;
    }

    setUploadingOrganizerLogo(true);
    setSyncStatus("saving");
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, "floor-plans");
      }

      if (publicUrl) {
        setOrganizerLogo(publicUrl);
        const payload = { ...buildPayload(), organizerLogo: publicUrl, hostLogo: publicUrl };
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(payload);
        }
        lastSavedSnapshotRef.current = getComparableSnapshot(payload);
        setSyncStatus("saved");
      }
    } catch (err) {
      console.error("Organizer logo upload error:", err);
      alert("Failed to upload organizer logo. Please try again.");
    } finally {
      setUploadingOrganizerLogo(false);
      if (organizerLogoFileInputRef.current) organizerLogoFileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return <EventDetailsSkeleton />;
  }

  return (
    <div className="space-y-6 w-full text-left pb-12 animate-fade-in font-sans">
      {/* Hidden File Input for Gallery Images (Accepts max 5MB images) */}
      <input
        type="file"
        ref={imageFileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />
      {/* Hidden File Input for Event Logo */}
      <input
        type="file"
        ref={eventLogoFileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
        onChange={handleEventLogoUpload}
        className="hidden"
      />
      {/* Hidden File Input for Organizer Logo */}
      <input
        type="file"
        ref={organizerLogoFileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
        onChange={handleOrganizerLogoUpload}
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Event Details
          </h1>
          <p className="text-sm text-slate-500">
            Manage your summit schedule, venue location, media assets, and event information.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Real-time sync status indicator badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold select-none shadow-2xs">
            {syncStatus === "saving" ? (
              <span className="flex items-center gap-1.5 text-blue-600">
                <Loader2 size={12} className="animate-spin" />
                <span>Saving in real time...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>All changes saved</span>
              </span>
            )}
          </div>

          {onPreviewLandingPage && (
            <button
              type="button"
              onClick={() => {
                if (onUpdateEventDetails) {
                  onUpdateEventDetails(buildPayload());
                }
                onPreviewLandingPage();
              }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Preview Landing Page</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Segmented Tab Selector */}
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-full sm:w-auto shadow-2xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "general"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            General Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "schedule"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Date &amp; Venue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "media"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Media &amp; Gallery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "contact"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Organizer &amp; Contact
          </button>
        </div>
      </div>

      {/* Form Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: GENERAL INFORMATION                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "general" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">General Summit Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Core event identity, logo, title, industry sector, and attendee overview.
              </p>
            </div>

            {/* Event Logo Card */}
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                    {eventLogo ? (
                      <img
                        src={eventLogo}
                        alt="Event Logo"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <Sparkles size={24} className="text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">Event Logo / Brand Mark</h3>
                      {eventLogo ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          Logo Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 text-[10px] font-semibold">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Displayed on public navigation bars, delegate registration passes, and confirmation tickets (Max 5MB).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => eventLogoFileInputRef.current?.click()}
                    disabled={uploadingEventLogo}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload size={12} />
                    <span>{uploadingEventLogo ? "Uploading..." : "Upload Logo"}</span>
                  </button>
                  {eventLogo && (
                    <button
                      type="button"
                      onClick={() => setEventLogo("")}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove event logo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <span>Event Title</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Algiers Tech Summit 2026"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Industry</label>
                <SearchableSelect
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={INDUSTRIES}
                  placeholder="Select industry..."
                  searchPlaceholder="Search industry (e.g. AI, Healthcare, Energy)..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Target Attendance Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">About the Event / Full Description</label>
              <RichTextEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Provide a comprehensive summary of the summit, key tracks, keynote topics, networking highlights, and attendee takeaways..."
                minHeight="180px"
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DATES & VENUE (SCHEDULE & LOCATION)                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "schedule" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Mode Switcher */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Event Dates &amp; Venue Setup</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure when your event takes place, attendance format, and physical or virtual location.
                </p>
              </div>

              {/* Compact Event Schedule Type Selector */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-center shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScheduleMode("single")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    scheduleMode === "single"
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CalendarDays size={13} className={scheduleMode === "single" ? "text-blue-600" : "text-slate-400"} />
                  <span>Standard Event</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("multiple")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    scheduleMode === "multiple"
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers size={13} className={scheduleMode === "multiple" ? "text-blue-600" : "text-slate-400"} />
                  <span>Multi-Stop / Tour</span>
                </button>
              </div>
            </div>

            {/* ── STANDARD MODE (Single Schedule / Unified Location) ── */}
            {scheduleMode === "single" && (
              <div className="space-y-5">
                {/* 1. SCHEDULE & TIMING CARD */}
                <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <Calendar size={15} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Dates &amp; Working Hours</h3>
                        <p className="text-[11px] text-slate-500">Define single day or multi-day date range and operating schedule.</p>
                      </div>
                    </div>

                    {/* Single Day vs Multi-Day Range toggle pills */}
                    <div className="inline-flex p-0.5 bg-white rounded-xl border border-slate-200 text-[11px] font-semibold self-start sm:self-center shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMultiDay(false);
                          setEndDate(startDate);
                        }}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          !isMultiDay ? "bg-blue-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Single Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMultiDay(true)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isMultiDay ? "bg-blue-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Multi-Day Range
                      </button>
                    </div>
                  </div>

                  {/* Pickers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {!isMultiDay ? (
                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-medium text-slate-700">Event Date</label>
                        <CustomDatePicker
                          value={startDate}
                          onChange={(val) => {
                            setStartDate(val);
                            setEndDate(val);
                          }}
                          placeholder="Select event date"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Start Date</label>
                          <CustomDatePicker
                            value={startDate}
                            onChange={(val) => setStartDate(val)}
                            placeholder="Select start date"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">End Date</label>
                          <CustomDatePicker
                            value={endDate}
                            minDate={startDate || undefined}
                            onChange={(val) => setEndDate(val)}
                            placeholder="Select end date"
                            align="right"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-medium text-slate-700">Daily Working Hours</label>
                      <CustomSchedulePicker
                        value={scheduleTime}
                        onChange={(val) => setScheduleTime(val)}
                        placeholder="e.g. 09:00 AM – 05:30 PM"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ATTENDANCE FORMAT & LOCATION DETAILS */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Attendance Format &amp; Location</h3>
                      <p className="text-[11px] text-slate-500">Choose how attendees will participate and configure venue or stream links.</p>
                    </div>
                  </div>

                  {/* Attendance Format 3 Cards */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Attendance Format</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {EVENT_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = type === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setType(t.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs"
                                : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold">{t.label}</span>
                              <Icon size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                            </div>
                            <span className="text-[11px] text-slate-500 leading-snug">{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Physical Venue Details (In-Person or Hybrid) */}
                  {(type === "In-Person" || type === "Hybrid") && (
                    <div className="pt-3 border-t border-slate-100 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Building2 size={15} className="text-blue-600" />
                        <span>Physical Venue &amp; Address</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <Globe size={12} className="text-slate-400" />
                            <span>Country</span>
                          </label>
                          <CountrySelect
                            value={country}
                            onChange={(val) => setCountry(val)}
                            placeholder="Select Country..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            <span>City</span>
                          </label>
                          <CitySelect
                            value={city}
                            country={country}
                            onChange={(val) => setCity(val)}
                            placeholder="Select or enter City..."
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Venue / Convention Center Name</label>
                        <input
                          type="text"
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          placeholder="e.g. Algiers International Conference Center (CIC), Club des Pins"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Detailed Physical Address / Hall / Room</label>
                        <input
                          type="text"
                          value={venueAddress}
                          onChange={(e) => setVenueAddress(e.target.value)}
                          placeholder="e.g. Route Nationale 11, Staoueli, Algiers, Algeria"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Virtual Live Stream Details (Virtual or Hybrid) */}
                  {(type === "Virtual" || type === "Hybrid") && (
                    <div className="pt-3 border-t border-slate-100 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Video size={15} className="text-purple-600" />
                        <span>Virtual Stream &amp; Remote Access</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <LinkIcon size={12} className="text-purple-500" />
                            <span>Online Meeting / Live Stream URL</span>
                          </label>
                          <input
                            type="url"
                            value={virtualUrl}
                            onChange={(e) => setVirtualUrl(e.target.value)}
                            placeholder="e.g. https://zoom.us/j/987654321 or https://youtube.com/live/..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700">Streaming Platform</label>
                          <SearchableSelect
                            value={virtualPlatform}
                            onChange={(val) => setVirtualPlatform(val)}
                            options={VIRTUAL_PLATFORMS}
                            placeholder="Select platform..."
                            searchPlaceholder="Search streaming platform..."
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Remote Attendee Joining Instructions</label>
                        <input
                          type="text"
                          value={virtualInstructions}
                          onChange={(e) => setVirtualInstructions(e.target.value)}
                          placeholder="e.g. Access link and credentials will be sent to registered email."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* OPTION B: MULTIPLE DATES, TIMES & LOCATIONS SETUP              */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {scheduleMode === "multiple" && (
              <div className="space-y-5 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Configured Stops &amp; Locations ({multiLocations.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add, arrange, and configure multiple dates, times, cities, venues, or online tracks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add Date &amp; Location</span>
                  </button>
                </div>

                {/* List of Multiple Location Cards */}
                <div className="space-y-3.5">
                  {multiLocations.map((stop, idx) => {
                    const isEditing = editingStopId === stop.id;
                    const stopFormat = stop.format || type || "In-Person";
                    
                    return (
                      <div 
                        key={stop.id} 
                        className={`rounded-2xl border transition-all ${
                          isEditing 
                            ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md p-5 space-y-4" 
                            : "bg-white border-slate-200 hover:border-slate-300 p-4 shadow-2xs space-y-3"
                        }`}
                      >
                        {/* Summary Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">
                                  {stop.name || `Session / Stop ${idx + 1}`}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  stopFormat === "Virtual"
                                    ? "bg-purple-50 border-purple-200 text-purple-700"
                                    : stopFormat === "Hybrid"
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}>
                                  {stopFormat}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} className="text-slate-400" />
                                  <span>{stop.date}{stop.endDate && stop.endDate !== stop.date ? ` – ${stop.endDate}` : ""}</span>
                                </span>
                                {stop.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} className="text-slate-400" />
                                    <span>{stop.time}</span>
                                  </span>
                                )}
                                {(stopFormat === "In-Person" || stopFormat === "Hybrid") && (stop.city || stop.venueName) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    <span>{[stop.venueName, stop.city, stop.country].filter(Boolean).join(", ")}</span>
                                  </span>
                                )}
                                {stopFormat === "Virtual" && (
                                  <span className="flex items-center gap-1 text-purple-600 font-mono">
                                    <Video size={12} />
                                    <span>{stop.virtualPlatform || "Virtual Stream"}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setEditingStopId(isEditing ? null : stop.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 size={12} />
                              <span>{isEditing ? "Close" : "Edit"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateStop(stop)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Duplicate stop"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStop(stop.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                              title="Delete stop"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Stop Editor Form */}
                        {isEditing && (
                          <div className="pt-3 border-t border-slate-100 space-y-4 animate-fade-in text-left">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[11px] font-semibold text-slate-700">Stop / Session Title</label>
                                <input
                                  type="text"
                                  value={stop.name}
                                  onChange={(e) => handleUpdateStop(stop.id, "name", e.target.value)}
                                  placeholder="e.g. Day 1: Algiers Innovation Expo"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-700">Format</label>
                                <SearchableSelect
                                  value={stopFormat}
                                  onChange={(val) => handleUpdateStop(stop.id, "format", val)}
                                  options={[
                                    { value: "In-Person", label: "In-Person (Venue)" },
                                    { value: "Hybrid", label: "Hybrid (Venue + Stream)" },
                                    { value: "Virtual", label: "Virtual (Online Only)" }
                                  ]}
                                  placeholder="Select format..."
                                />
                              </div>
                            </div>

                            {/* Date and Time row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-700">Start Date</label>
                                <CustomDatePicker
                                  value={stop.date}
                                  onChange={(val) => handleUpdateStop(stop.id, "date", val)}
                                  placeholder="Start date"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-700">End Date</label>
                                <CustomDatePicker
                                  value={stop.endDate || stop.date}
                                  minDate={stop.date || undefined}
                                  onChange={(val) => handleUpdateStop(stop.id, "endDate", val)}
                                  placeholder="End date"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-700">Schedule / Working Hours</label>
                                <CustomSchedulePicker
                                  value={stop.time}
                                  onChange={(val) => handleUpdateStop(stop.id, "time", val)}
                                  placeholder="e.g. 09:00 AM – 05:00 PM"
                                />
                              </div>
                            </div>

                            {/* Physical Location Fields if In-Person or Hybrid */}
                            {(stopFormat === "In-Person" || stopFormat === "Hybrid") && (
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-700">Country</label>
                                    <CountrySelect
                                      value={stop.country}
                                      onChange={(val) => handleUpdateStop(stop.id, "country", val)}
                                      placeholder="Select country..."
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-700">City</label>
                                    <CitySelect
                                      value={stop.city}
                                      country={stop.country}
                                      onChange={(val) => handleUpdateStop(stop.id, "city", val)}
                                      placeholder="Select or enter city..."
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-700">Venue Name</label>
                                    <input
                                      type="text"
                                      value={stop.venueName || ""}
                                      onChange={(e) => handleUpdateStop(stop.id, "venueName", e.target.value)}
                                      placeholder="e.g. Oran Convention Center (CCO)"
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-700">Detailed Address / Room</label>
                                    <input
                                      type="text"
                                      value={stop.venueAddress || ""}
                                      onChange={(e) => handleUpdateStop(stop.id, "venueAddress", e.target.value)}
                                      placeholder="e.g. Les Falaises, Hall B, Oran"
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Virtual Link Fields if Virtual or Hybrid */}
                            {(stopFormat === "Virtual" || stopFormat === "Hybrid") && (
                              <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-700">Online Meeting / Stream URL</label>
                                    <input
                                      type="url"
                                      value={stop.virtualUrl || ""}
                                      onChange={(e) => handleUpdateStop(stop.id, "virtualUrl", e.target.value)}
                                      placeholder="e.g. https://zoom.us/j/..."
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-700">Platform</label>
                                    <SearchableSelect
                                       value={stop.virtualPlatform || "Zoom Webinar / Meeting"}
                                       onChange={(val) => handleUpdateStop(stop.id, "virtualPlatform", val)}
                                       options={VIRTUAL_PLATFORMS}
                                       placeholder="Select platform..."
                                       searchPlaceholder="Search streaming platform..."
                                     />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingStopId(null)}
                                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Done Editing Stop
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: MEDIA & GALLERY                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Event Media, Photos &amp; Video</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload up to 5 event images (max 5MB each) and provide an optional YouTube video for the hero player.
              </p>
            </div>

            {/* 1. YOUTUBE VIDEO SECTION */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                    <Video size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Hero YouTube Video / Promo Trailer</h3>
                    <p className="text-[11px] text-slate-500">
                      When provided, this video will play in the landing page hero section, and visitors can swipe to view pictures.
                    </p>
                  </div>
                </div>

                {youtubeUrl && (
                  <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold">
                    Hero Video Active
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <LinkIcon size={12} className="text-slate-400" />
                  <span>YouTube Video URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all font-mono"
                  />
                  {youtubeUrl && (
                    <button
                      type="button"
                      onClick={() => setYoutubeUrl("")}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Live YouTube Preview Frame */}
              {getYouTubeEmbedUrl(youtubeUrl) ? (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <CheckCircle2 size={13} />
                      <span>Valid YouTube Video Detected (Live Preview)</span>
                    </span>
                  </div>
                  <div className="relative aspect-video max-w-xl rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm">
                    <iframe
                      src={getYouTubeEmbedUrl(youtubeUrl)}
                      title="YouTube Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : youtubeUrl.trim() ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                  <span>Please enter a valid YouTube video link (e.g., https://youtube.com/watch?v=... or https://youtu.be/...).</span>
                </div>
              ) : null}
            </div>

            {/* 2. EVENT IMAGES & GALLERY (UP TO 5 IMAGES, MAX 5MB) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">Event Photos &amp; Banners</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        galleryImages.length >= 5 
                          ? "bg-amber-50 border-amber-300 text-amber-800" 
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}>
                        {galleryImages.length} / 5 uploaded
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload up to 5 images (max 5MB each). The first photo is used as the primary cover banner.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={uploadingImage || galleryImages.length >= 5}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      galleryImages.length >= 5
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <Upload size={13} />
                    <span>{uploadingImage ? "Uploading..." : "Upload Image (Max 5MB)"}</span>
                  </button>
                </div>
              </div>

              {/* Image Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {galleryImages.map((imgUrl, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <div 
                      key={idx}
                      className={`group relative rounded-2xl overflow-hidden border transition-all ${
                        isPrimary
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      {/* Image Preview */}
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={`Event Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Primary Cover Badge */}
                        {isPrimary ? (
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <Sparkles size={11} />
                            <span>Primary Cover Banner</span>
                          </div>
                        ) : (
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur-xs">
                            Photo {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-100 bg-white">
                        <span className="text-[11px] text-slate-500 font-mono truncate flex-1" title={imgUrl}>
                          {imgUrl.replace(/^https?:\/\//, '')}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryCover(idx)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-bold transition-all cursor-pointer"
                              title="Set as primary cover banner"
                            >
                              Set as Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty Placeholders up to 5 */}
                {Array.from({ length: Math.max(0, 5 - galleryImages.length) }).map((_, slotIdx) => (
                  <button
                    key={`slot-${slotIdx}`}
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    className="aspect-[16/10] rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 transition-all cursor-pointer p-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    <span className="text-xs font-semibold">Image Slot {galleryImages.length + slotIdx + 1} (Max 5MB)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: ORGANIZER & CONTACT                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "contact" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Organizer Entity &amp; Support Contact</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact information and host branding displayed on delegate registration, passes, and confirmations.
              </p>
            </div>

            {/* Organizer / Host Logo Card */}
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                    {organizerLogo ? (
                      <img
                        src={organizerLogo}
                        alt="Organizer Logo"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <Building2 size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">Organizer / Host Entity Logo</h3>
                      {organizerLogo ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          Logo Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 text-[10px] font-semibold">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Displayed on delegate badges, host credentials, and footer recognition (Max 5MB).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => organizerLogoFileInputRef.current?.click()}
                    disabled={uploadingOrganizerLogo}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload size={12} />
                    <span>{uploadingOrganizerLogo ? "Uploading..." : "Upload Logo"}</span>
                  </button>
                  {organizerLogo && (
                    <button
                      type="button"
                      onClick={() => setOrganizerLogo("")}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove organizer logo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Organizer / Host Entity Name</label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g. Ministry of Industry / Eventzone Global"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Inquiries &amp; Support Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. contact@eventzone.pro"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Phone / WhatsApp Support</label>
                <CountryPhoneInput
                  value={contactPhone}
                  onChange={(val) => setContactPhone(val)}
                  placeholder="e.g. 550 12 34 56"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
