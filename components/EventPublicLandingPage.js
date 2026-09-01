/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, CalendarPlus, MapPin, Sparkles, ArrowRight, ArrowLeft, ArrowUp,
  Layers, Users, Clock, Ticket, Award, CheckCircle2, 
  ExternalLink, Share2, Compass, ShieldCheck, 
  ChevronRight, ChevronLeft, Building2, Check, Download, Mail, X, Globe, Video,
  Star, MessageSquare, Printer, User, Briefcase, Phone, QrCode as QrIcon, FileText,
  Tag, AlertCircle, RefreshCw, Smartphone, ChevronDown, Lock, Image as ImageIcon, Play
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import PublicRSVPModal from "./PublicRSVPModal";
import CountryPhoneInput from "./CountryPhoneInput";
import { CountrySelect, CitySelect } from "./LocationInputs";
import SearchableSelect from "./SearchableSelect";
import FormImageUploader from "./FormImageUploader";
import FormFileUploader from "./FormFileUploader";
import { getFormSections } from "../lib/formPresets";
import { smoothScrollTo } from "../lib/smoothScroll";
import { getYouTubeEmbedUrl } from "./EventDetailsView";
import { recordInfluencerClick, fetchEventDetails, fetchTickets } from "../lib/db";
import { LandingPageSkeleton } from "./SkeletonLoaders";

export default function EventPublicLandingPage({
  eventId,
  eventDetails,
  sessions = [],
  sponsors = [],
  exhibitors = [],
  attendees = [],
  tickets = [],
  influencers = [],
  forms = [],
  formSubmissions = [],
  rsvps = [],
  rsvpSettings = {},
  isLoading = false,
  onSubmitRSVP,
  onSubmitFormResponse,
  currentUser,
  onBackToHome,
  onViewFloorPlan,
  onRegisterForEvent,
  onOpenAuth
}) {
  const { t, lang, setLang, isRTL, languages } = useLanguage();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("All");
  const [bookmarkedSessions, setBookmarkedSessions] = useState(new Set());
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Dedicated RSVP Modal State: initialized synchronously from URL query param to eliminate delay
  const [showPublicRsvpModal, setShowPublicRsvpModal] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get("view");
      const rsvp = searchParams.get("rsvp");
      return view === "rsvp" || view === "public-rsvp" || rsvp === "true";
    }
    return false;
  });

  // Custom Form Registration State
  const [customAnswers, setCustomAnswers] = useState({});
  const [customOtherTexts, setCustomOtherTexts] = useState({});

  const isOtherOption = (opt) => {
    if (!opt || typeof opt !== "string") return false;
    const clean = opt.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other") || clean === "autre" || clean.startsWith("autre");
  };

  const isOtherValue = (val) => {
    if (!val || typeof val !== "string") return false;
    const clean = val.trim().toLowerCase();
    return clean === "other" || clean.startsWith("other:") || clean.startsWith("other (") || clean === "autre" || clean.startsWith("autre:") || clean.startsWith("autre (");
  };

  const getOtherTextForField = (fieldId, val) => {
    if (customOtherTexts[fieldId] !== undefined) return customOtherTexts[fieldId];
    if (typeof val === "string") {
      if (val.toLowerCase().startsWith("other:")) return val.slice(6).trim();
      if (val.toLowerCase().startsWith("autre:")) return val.slice(6).trim();
    }
    return "";
  };

  const handleSelectChoice = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = customOtherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      setCustomAnswers(prev => ({ ...prev, [fieldId]: fullVal }));
    } else {
      setCustomAnswers(prev => ({ ...prev, [fieldId]: selectedOpt }));
    }
    if (checkoutSectionErrors[fieldId]) {
      setCheckoutSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handleRadioChoice = (fieldId, selectedOpt) => {
    if (isOtherOption(selectedOpt)) {
      const existingText = customOtherTexts[fieldId] || "";
      const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : "Other";
      setCustomAnswers(prev => ({ ...prev, [fieldId]: fullVal }));
    } else {
      setCustomAnswers(prev => ({ ...prev, [fieldId]: selectedOpt }));
    }
    if (checkoutSectionErrors[fieldId]) {
      setCheckoutSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handleOtherTextChange = (fieldId, text) => {
    setCustomOtherTexts(prev => ({ ...prev, [fieldId]: text }));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : "Other";
    setCustomAnswers(prev => ({ ...prev, [fieldId]: fullVal }));
    if (checkoutSectionErrors[fieldId]) {
      setCheckoutSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handleCheckboxChoice = (fieldId, opt, isChecked) => {
    const currentList = Array.isArray(customAnswers[fieldId]) ? customAnswers[fieldId] : [];
    let updated;
    if (isChecked) {
      if (isOtherOption(opt)) {
        const existingText = customOtherTexts[`${fieldId}__other`] || "";
        const fullVal = existingText.trim() ? `Other: ${existingText.trim()}` : opt;
        const withoutOther = currentList.filter(x => !isOtherValue(x));
        updated = [...withoutOther, fullVal];
      } else {
        updated = [...currentList, opt];
      }
    } else {
      if (isOtherOption(opt)) {
        updated = currentList.filter(x => !isOtherValue(x));
      } else {
        updated = currentList.filter(x => x !== opt);
      }
    }
    setCustomAnswers(prev => ({ ...prev, [fieldId]: updated }));
    if (checkoutSectionErrors[fieldId]) {
      setCheckoutSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  const handleCheckboxOtherTextChange = (fieldId, opt, text) => {
    setCustomOtherTexts(prev => ({ ...prev, [`${fieldId}__other`]: text }));
    const currentList = Array.isArray(customAnswers[fieldId]) ? customAnswers[fieldId] : [];
    const withoutOther = currentList.filter(x => !isOtherValue(x));
    const fullVal = text.trim() ? `Other: ${text.trim()}` : (opt || "Other");
    setCustomAnswers(prev => ({ ...prev, [fieldId]: [...withoutOther, fullVal] }));
    if (checkoutSectionErrors[fieldId]) {
      setCheckoutSectionErrors(prev => ({ ...prev, [fieldId]: undefined }));
    }
  };

  // Feedback Survey Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAnswers, setFeedbackAnswers] = useState({});
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // RSVP / Full-Page Registration State
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(() => {
    if (tickets && tickets.length > 0) {
      return tickets[0].name || tickets[0].tier || "Standard Admission";
    }
    return "";
  });
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState(currentUser?.fullName || "");
  const [rsvpEmail, setRsvpEmail] = useState(currentUser?.email || "");
  const [rsvpCompany, setRsvpCompany] = useState("");
  const [rsvpJobTitle, setRsvpJobTitle] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(null);
  const [rsvpError, setRsvpError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const [internalEventDetails, setInternalEventDetails] = useState(null);
  const [isInternalLoading, setIsInternalLoading] = useState(false);

  const currentEventId = eventId || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("eventId") : null);

  // Get cached event details if prop is loading/syncing for THIS specific eventId
  const cachedDetails = typeof window !== "undefined" && currentEventId ? (() => {
    try {
      const item = localStorage.getItem(`eventzone_cached_event_${currentEventId}`) || localStorage.getItem(`eventzone_cache_event_${currentEventId}`);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  })() : null;

  // Instant local cache hydration for tickets
  const cachedTickets = typeof window !== "undefined" && currentEventId ? (() => {
    try {
      const item = localStorage.getItem(`eventzone_cache_tickets_${currentEventId}`);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  })() : null;

  const [internalTickets, setInternalTickets] = useState(cachedTickets || []);

  const isMatchingEvent = !currentEventId || !eventDetails?.id || String(eventDetails.id) === String(currentEventId) || currentEventId === "default-summit-2025";
  const validPropDetails = isMatchingEvent ? eventDetails : (eventDetails || null);
  const effectiveDetails = (validPropDetails && (validPropDetails.title || validPropDetails.youtubeUrl || validPropDetails.youtube_url || validPropDetails.banner))
    ? { ...(cachedDetails || {}), ...validPropDetails }
    : (cachedDetails || validPropDetails || internalEventDetails || {
        id: currentEventId || "default-summit-2025",
        title: "Eventzone Summit",
        tagline: "Premier International Technology & Innovation Summit",
        description: "Join industry leaders, founders, and innovators for groundbreaking keynotes, panels, and networking.",
        location: "Algiers Exhibition Center",
        venueName: "Algiers Exhibition Center",
        type: "Hybrid",
        startDate: "2026-10-12",
        endDate: "2026-10-14",
        banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"
      });

  // Direct fetch fallback if no matching event details or tickets provided yet
  useEffect(() => {
    if (!currentEventId) return;

    let isMounted = true;

    if (!tickets || tickets.length === 0) {
      fetchTickets(currentEventId).then((data) => {
        if (isMounted && data && Array.isArray(data)) {
          setInternalTickets(data);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`eventzone_cache_tickets_${currentEventId}`, JSON.stringify(data));
            } catch (e) {}
          }
        }
      }).catch(console.warn);
    }

    if (!effectiveDetails || String(effectiveDetails.id) !== String(currentEventId) || !effectiveDetails.title) {
      setIsInternalLoading(true);
      fetchEventDetails(currentEventId).then((data) => {
        if (isMounted && data) {
          setInternalEventDetails(data);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`eventzone_cached_event_${currentEventId}`, JSON.stringify(data));
            } catch (e) {}
          }
        }
      }).catch(console.warn).finally(() => {
        if (isMounted) setIsInternalLoading(false);
      });
    }

    return () => { isMounted = false; };
  }, [currentEventId, tickets]);

  // Real event properties with default fallbacks
  const title = effectiveDetails?.title || "Eventzone Summit";
  const tagline = effectiveDetails?.tagline || effectiveDetails?.description || "Premier International Technology & Innovation Summit";
  const location = effectiveDetails?.venueName || effectiveDetails?.venue_name || effectiveDetails?.location || "Algiers Exhibition Center";
  const startDate = effectiveDetails?.startDate || "2026-10-12";
  const endDate = effectiveDetails?.endDate || "2026-10-14";
  const category = effectiveDetails?.category || "Technology & Software";
  const type = effectiveDetails?.type || "Hybrid";
  const banner = effectiveDetails?.banner || effectiveDetails?.cover_url || "";
  const organizerName = effectiveDetails?.organizerName || effectiveDetails?.organizer_name || effectiveDetails?.organization || "Eventzone";
  const organization = organizerName;
  const hostName = effectiveDetails?.hostName || effectiveDetails?.host_name || organizerName;
  const organizerLogo = effectiveDetails?.organizerLogo || effectiveDetails?.organizer_logo || effectiveDetails?.eventLogo || effectiveDetails?.logo || "";
  const contactEmail = effectiveDetails?.contactEmail || effectiveDetails?.contact_email || effectiveDetails?.hostEmail || effectiveDetails?.host_email || "";
  const contactPhone = effectiveDetails?.contactPhone || effectiveDetails?.contact_phone || "";
  const websiteUrl = effectiveDetails?.websiteUrl || effectiveDetails?.website_url || "";

  // ─── HERO MEDIA SHOWCASE & PHOTO CAROUSEL STATE ───────────────────────────
  const youtubeUrl = 
    effectiveDetails?.youtubeUrl || 
    effectiveDetails?.youtube_url || 
    effectiveDetails?.videoUrl || 
    effectiveDetails?.video_url || 
    effectiveDetails?.webcastUrl || 
    effectiveDetails?.webcast_url || 
    effectiveDetails?.streamUrl || 
    effectiveDetails?.stream_url || 
    effectiveDetails?.video || 
    "";

  let rawGallery = [];
  if (Array.isArray(effectiveDetails?.gallery)) {
    rawGallery = effectiveDetails.gallery.filter(Boolean);
  } else if (typeof effectiveDetails?.gallery === "string" && effectiveDetails.gallery.trim()) {
    try {
      const parsed = JSON.parse(effectiveDetails.gallery);
      if (Array.isArray(parsed)) {
        rawGallery = parsed.filter(Boolean);
      } else if (typeof parsed === "string") {
        rawGallery = [parsed];
      }
    } catch {
      rawGallery = [effectiveDetails.gallery.trim()];
    }
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);

  const mediaItems = [];
  if (youtubeEmbedUrl) {
    mediaItems.push({
      type: "video",
      url: youtubeEmbedUrl,
      rawUrl: youtubeUrl,
      title: `${title} - Video Trailer`
    });
  }

  rawGallery.forEach((img, idx) => {
    if (img && typeof img === "string" && img.trim()) {
      mediaItems.push({
        type: "image",
        url: img.trim(),
        title: `${title} - Photo ${idx + 1}`
      });
    }
  });

  if (mediaItems.length === 0 && banner) {
    mediaItems.push({
      type: "image",
      url: banner,
      title: title
    });
  }

  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // When video URL is detected, ensure activeMediaIdx is pinned to 0 (the video)
  useEffect(() => {
    if (youtubeEmbedUrl && activeMediaIdx !== 0) {
      setActiveMediaIdx(0);
    }
  }, [youtubeEmbedUrl]);

  const currentMedia = mediaItems[activeMediaIdx] || mediaItems[0];

  const handleNextMedia = () => {
    setActiveMediaIdx((prev) => (prev + 1) % mediaItems.length);
  };

  const handlePrevMedia = () => {
    setActiveMediaIdx((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  // Auto-advance photos smoothly every 5 seconds
  // (Pauses when user hovers over carousel or when currently playing video)
  useEffect(() => {
    if (mediaItems.length <= 1 || isHovered) return;
    if (currentMedia?.type === "video") return;

    const timer = setInterval(() => {
      setActiveMediaIdx((prev) => (prev + 1) % mediaItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [mediaItems.length, isHovered, currentMedia?.type]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      handleNextMedia();
    } else if (distance < -minSwipeDistance) {
      handlePrevMedia();
    }
  };

  const formatEventDateRange = (startStr, endStr) => {
    if (!startStr) return "";
    
    const parseDate = (dStr) => {
      if (!dStr) return null;
      if (typeof dStr === "string" && dStr.includes("-")) {
        const parts = dStr.split("-");
        if (parts.length >= 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          return new Date(y, m, d);
        }
      }
      const parsed = new Date(dStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const start = parseDate(startStr);
    const end = parseDate(endStr);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    if (!start) return startStr;

    const startMonth = monthNames[start.getMonth()];
    const startDay = start.getDate();
    const startYear = start.getFullYear();

    if (!end || startStr === endStr || isNaN(end.getTime())) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    const endMonth = monthNames[end.getMonth()];
    const endDay = end.getDate();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
      }
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
    }

    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  };

  // Event Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: "upcoming" // "upcoming" | "live" | "concluded"
  });

  useEffect(() => {
    if (!startDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      const startParts = String(startDate).split('-');
      const startYear = parseInt(startParts[0], 10);
      const startMonth = parseInt(startParts[1], 10) - 1;
      const startDay = parseInt(startParts[2], 10);
      const eventStartTime = new Date(startYear, isNaN(startMonth) ? 0 : startMonth, isNaN(startDay) ? 1 : startDay, 9, 0, 0).getTime();

      let eventEndTime = eventStartTime + (24 * 60 * 60 * 1000);
      if (endDate) {
        const endParts = String(endDate).split('-');
        const endYear = parseInt(endParts[0], 10);
        const endMonth = parseInt(endParts[1], 10) - 1;
        const endDay = parseInt(endParts[2], 10);
        eventEndTime = new Date(endYear, isNaN(endMonth) ? 0 : endMonth, isNaN(endDay) ? 1 : endDay, 20, 0, 0).getTime();
      }

      if (now >= eventStartTime && now <= eventEndTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "live" });
        return;
      }

      if (now > eventEndTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "concluded" });
        return;
      }

      const difference = eventStartTime - now;
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, status: "upcoming" });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  // Real Database Sessions
  const eventSessions = sessions || [];

  // Real Database Speakers extracted from real sessions
  const eventSpeakers = [];
  const speakerNames = new Set();
  eventSessions.forEach(s => {
    (s.speakers || []).forEach(sp => {
      if (sp?.name && !speakerNames.has(sp.name)) {
        speakerNames.add(sp.name);
        eventSpeakers.push({
          name: sp.name,
          role: sp.role || "Speaker",
          title: sp.title || "",
          company: sp.company || organization || "",
          image: sp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sp.name)}&background=2563eb&color=fff`
        });
      }
    });

    (s.moderators || []).forEach(mod => {
      if (mod?.name && !speakerNames.has(mod.name)) {
        speakerNames.add(mod.name);
        eventSpeakers.push({
          name: mod.name,
          role: "Moderator",
          title: mod.title || "",
          company: mod.company || organization || "",
          image: mod.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(mod.name)}&background=4f46e5&color=fff`
        });
      }
    });
  });

  // Real Database Exhibitors, Sponsors & Tickets
  const eventExhibitors = exhibitors || [];
  const eventSponsors = sponsors || [];
  const eventTickets = (tickets && tickets.length > 0) 
    ? tickets 
    : (internalTickets && internalTickets.length > 0 
      ? internalTickets 
      : (cachedTickets || []));

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const cleanUrl = `${window.location.origin}/${eventDetails?.slug || eventDetails?.id || eventId}`;
      navigator.clipboard.writeText(cleanUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  // Find active selected ticket object
  const selectedTicket = eventTickets.find(t => t.name === selectedTier || t.tier === selectedTier || t.id === selectedTier);

  // Find active ticket registration form manually bound to selected ticket tier
  const activeTicketForm = forms.find(f => 
    f.status !== "archived" && !f.isArchived &&
    (selectedTicket?.formId === f.id || selectedTicket?.form_id === f.id)
  );

  // Find active feedback survey form
  const activeFeedbackForm = forms.find(f => 
    f.status === "active" && 
    (f.type === "feedback_survey" || f.type === "session_survey")
  );

  // Multi-page checkout section tracking
  const [checkoutSectionIdx, setCheckoutSectionIdx] = useState(0);
  const [checkoutSectionErrors, setCheckoutSectionErrors] = useState({});

  const ticketFormSections = React.useMemo(() => {
    if (!activeTicketForm || !activeTicketForm.fields || activeTicketForm.fields.length === 0) return [];
    const customFields = activeTicketForm.fields.filter(f => !["f_core_name", "f_core_email", "f_core_phone"].includes(f.id));
    return getFormSections(customFields);
  }, [activeTicketForm]);

  const hasMultiSections = ticketFormSections.length > 1;
  const safeCheckoutIdx = Math.min(checkoutSectionIdx, Math.max(0, ticketFormSections.length - 1));
  const currentCheckoutSec = ticketFormSections[safeCheckoutIdx] || { fields: [] };
  const isCheckoutFirst = safeCheckoutIdx === 0;
  const isCheckoutLast = !hasMultiSections || safeCheckoutIdx === ticketFormSections.length - 1;

  // Extract Badge Picture URL uploaded in customAnswers (if any picture field was filled)
  const badgePhotoUrl = React.useMemo(() => {
    if (!customAnswers || typeof customAnswers !== "object") return null;
    const pictureFields = (activeTicketForm?.fields || []).filter(f => f.type === "picture");
    for (const pf of pictureFields) {
      if (customAnswers[pf.id]) return customAnswers[pf.id];
    }
    const found = Object.entries(customAnswers).find(([k, v]) => {
      if (typeof v !== "string" || !v) return false;
      return v.startsWith("data:image/") || v.startsWith("http") || v.startsWith("blob:") || k.toLowerCase().includes("picture") || k.toLowerCase().includes("photo");
    });
    return found ? found[1] : null;
  }, [customAnswers, activeTicketForm]);

  // Extract Company strictly from ticket form inputs (custom ticket form fields or rsvpCompany)
  const resolvedCompany = React.useMemo(() => {
    if (customAnswers && typeof customAnswers === "object") {
      const companyEntry = Object.entries(customAnswers).find(([k, v]) => {
        if (!v || typeof v !== "string") return false;
        const field = activeTicketForm?.fields?.find(f => f.id === k);
        const label = field?.label?.toLowerCase() || k.toLowerCase();
        return label.includes("company") || label.includes("organization") || label.includes("societe") || label.includes("entreprise");
      });
      if (companyEntry && companyEntry[1]) {
        return String(companyEntry[1]).replace(/^(Other|Autre):\s*/i, "").trim();
      }
    }
    if (rsvpCompany && rsvpCompany.trim()) return rsvpCompany.replace(/^(Other|Autre):\s*/i, "").trim();
    return "";
  }, [rsvpCompany, customAnswers, activeTicketForm]);

  // Extract Function / Job Title strictly from ticket form inputs (custom ticket form fields or rsvpJobTitle)
  const resolvedJobTitle = React.useMemo(() => {
    if (customAnswers && typeof customAnswers === "object") {
      const jobEntry = Object.entries(customAnswers).find(([k, v]) => {
        if (!v || typeof v !== "string") return false;
        const field = activeTicketForm?.fields?.find(f => f.id === k);
        const label = field?.label?.toLowerCase() || k.toLowerCase();
        return label.includes("job") || label.includes("function") || label.includes("role") || label.includes("title") || label.includes("profession") || label.includes("poste") || label.includes("fonction");
      });
      if (jobEntry && jobEntry[1]) {
        return String(jobEntry[1]).replace(/^(Other|Autre):\s*/i, "").trim();
      }
    }
    if (rsvpJobTitle && rsvpJobTitle.trim()) return rsvpJobTitle.replace(/^(Other|Autre):\s*/i, "").trim();
    return "";
  }, [rsvpJobTitle, customAnswers, activeTicketForm]);

  // Referral & Influencer Tracking State (Automatic from referral link)
  const [referralCode, setReferralCode] = useState("");

  // Matched Influencer Campaign from referral link
  const matchedInfluencer = React.useMemo(() => {
    const activeCode = (referralCode || "").trim().toUpperCase();
    if (!activeCode) return null;
    return (influencers || []).find(inf => 
      !inf.isArchived && 
      inf.status !== "archived" && 
      (inf.code || "").trim().toUpperCase() === activeCode
    );
  }, [influencers, referralCode]);

  // Discount calculation for active ticket tier
  const referralDiscount = React.useMemo(() => {
    if (!matchedInfluencer || !selectedTicket) {
      return { 
        discountAmount: 0, 
        discountPercent: 0, 
        finalPrice: parseFloat(selectedTicket?.price) || 0, 
        isEligible: false 
      };
    }

    const infTier = (matchedInfluencer.ticketTier || "all").trim().toLowerCase();
    const currentTicketName = (selectedTicket.name || selectedTicket.tier || "").trim().toLowerCase();
    const isEligible = infTier === "all" || infTier === currentTicketName || matchedInfluencer.ticketId === selectedTicket.id;

    if (!isEligible) {
      return { 
        discountAmount: 0, 
        discountPercent: 0, 
        finalPrice: parseFloat(selectedTicket?.price) || 0, 
        isEligible: false
      };
    }

    const basePrice = parseFloat(selectedTicket.price) || 0;
    let discountAmount = 0;
    let discountPercent = 0;

    if (matchedInfluencer.discountPercent && Number(matchedInfluencer.discountPercent) > 0) {
      discountPercent = Number(matchedInfluencer.discountPercent);
      discountAmount = (basePrice * discountPercent) / 100;
    } else if (matchedInfluencer.discountAmount && Number(matchedInfluencer.discountAmount) > 0) {
      discountAmount = Math.min(basePrice, Number(matchedInfluencer.discountAmount));
    }

    const finalPrice = Math.max(0, basePrice - discountAmount);
    return {
      discountAmount,
      discountPercent,
      finalPrice,
      isEligible: true,
      influencerName: matchedInfluencer.name,
      code: matchedInfluencer.code
    };
  }, [matchedInfluencer, selectedTicket]);

  // Lock body scroll when registration is open to eliminate background double-scroll
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (showRsvpModal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [showRsvpModal]);

  // One-time referral link visit / click tracking per browser session
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const refParam = searchParams.get("ref") || searchParams.get("influencer") || searchParams.get("referral");
      if (!refParam) return;

      const cleanRef = refParam.trim().toUpperCase();
      setReferralCode(cleanRef);

      const targetEid = eventId || eventDetails?.id || searchParams.get("eventId");
      const sessionKey = `eventzone_ref_click_${targetEid || "global"}_${cleanRef}`;
      
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        recordInfluencerClick(targetEid, cleanRef).catch(console.warn);
      }
    } catch (e) {
      console.warn("Referral tracking notice:", e);
    }
  }, []);

  // Synchronize URL parameters on direct link navigation & browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get("view");
      const registerParam = searchParams.get("register");
      const ticketParam = searchParams.get("ticket");
      const refParam = searchParams.get("ref") || searchParams.get("influencer") || searchParams.get("referral");

      const rsvpParam = searchParams.get("rsvp");

      if (refParam) {
        setReferralCode(refParam.trim().toUpperCase());
      }

      if (view === "rsvp" || view === "public-rsvp" || rsvpParam === "true") {
        setShowPublicRsvpModal(true);
      } else if (view === "register" || registerParam === "true") {
        setShowRsvpModal(true);
        if (ticketParam) {
          setSelectedTier(decodeURIComponent(ticketParam));
        } else if (eventTickets && eventTickets.length > 0) {
          setSelectedTier(eventTickets[0].name || eventTickets[0].tier || "Standard Admission");
        }
      } else {
        setShowRsvpModal(false);
        setShowPublicRsvpModal(false);
        setRsvpSuccess(null);
      }
    };

    handlePopState();

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openRSVP = () => {
    setShowPublicRsvpModal(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "event-landing");
      params.set("rsvp", "true");
      if (eventId) params.set("eventId", eventId);
      if (referralCode) params.set("ref", referralCode);
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const closeRSVP = () => {
    setShowPublicRsvpModal(false);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("rsvp");
      params.set("view", "event-landing");
      if (eventId) params.set("eventId", eventId);
      if (referralCode) params.set("ref", referralCode);
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const openRegistration = (tierName) => {
    const chosenTier = tierName || selectedTier || (eventTickets[0]?.name || eventTickets[0]?.tier || "General Admission");
    setSelectedTier(chosenTier);
    setCheckoutSectionIdx(0);
    setCheckoutSectionErrors({});
    setRsvpError(null);
    setShowRsvpModal(true);
    setRsvpSuccess(null);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "register");
      if (eventId) params.set("eventId", eventId);
      if (referralCode) params.set("ref", referralCode);
      params.set("ticket", chosenTier);
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const closeRegistration = () => {
    setShowRsvpModal(false);
    setCheckoutSectionIdx(0);
    setCheckoutSectionErrors({});
    setRsvpError(null);
    setRsvpSuccess(null);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "event-landing");
      if (eventId) params.set("eventId", eventId);
      if (referralCode) params.set("ref", referralCode);
      params.delete("ticket");
      params.delete("register");
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const switchTicketTier = (tierName) => {
    setSelectedTier(tierName);
    setRsvpError(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "register");
      if (eventId) params.set("eventId", eventId);
      if (referralCode) params.set("ref", referralCode);
      params.set("ticket", tierName);
      const newUrl = `/?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  };

  const handleCheckoutNext = (e) => {
    e?.preventDefault?.();
    setRsvpError(null);
    const errors = {};

    // If on section 0, validate core credentials
    if (safeCheckoutIdx === 0) {
      if (!rsvpName?.trim()) errors["rsvpName"] = "Full name is required.";
      if (!rsvpEmail?.trim()) errors["rsvpEmail"] = "Email address is required.";
      if (!rsvpPhone?.trim()) errors["rsvpPhone"] = "Phone number is required.";
    }

    // Validate custom fields on current section
    (currentCheckoutSec.fields || []).forEach(f => {
      if (f.required && f.type !== "section") {
        const val = customAnswers[f.id];
        const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          errors[f.id] = "This question requires an answer.";
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setCheckoutSectionErrors(errors);
      return;
    }

    setCheckoutSectionErrors({});
    setCheckoutSectionIdx(prev => Math.min(ticketFormSections.length - 1, prev + 1));
  };

  const handleCheckoutPrev = () => {
    setCheckoutSectionErrors({});
    setRsvpError(null);
    setCheckoutSectionIdx(prev => Math.max(0, prev - 1));
  };

  const handleCheckoutClear = () => {
    setCustomAnswers({});
    setCheckoutSectionErrors({});
    setRsvpError(null);
    setCheckoutSectionIdx(0);
  };

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    setRsvpError(null);
    setRsvpLoading(true);

    try {
      if (onRegisterForEvent) {
        const activeRefCode = (referralCode || "").trim().toUpperCase();
        const discountVal = referralDiscount?.isEligible ? (referralDiscount.discountAmount || 0) : 0;
        
        const payloadCustomAnswers = {
          ...customAnswers,
          ...(activeRefCode ? { _referral_code: activeRefCode } : {}),
          ...(matchedInfluencer?.id ? { _influencer_id: matchedInfluencer.id } : {})
        };

        const pass = await onRegisterForEvent(eventId || eventDetails?.id, {
          name: rsvpName || currentUser?.fullName || "Attendee",
          email: rsvpEmail || currentUser?.email || "visitor@eventzone.io",
          company: resolvedCompany || "",
          jobTitle: resolvedJobTitle || "",
          phone: rsvpPhone || "",
          avatar: badgePhotoUrl || currentUser?.avatar || "",
          photo: badgePhotoUrl || "",
          ticketType: selectedTier,
          ticketId: selectedTicket?.id || null,
          requiresApproval: Boolean(selectedTicket?.requiresApproval || selectedTicket?.requires_approval),
          referralCode: activeRefCode,
          referral_code: activeRefCode,
          influencerId: matchedInfluencer?.id || null,
          discountApplied: discountVal,
          customAnswers: payloadCustomAnswers,
          answers: payloadCustomAnswers,
          eventTitle: title,
          location: location,
          startDate: startDate,
          endDate: endDate,
        });

        if (pass && (pass.error || pass.success === false)) {
          setRsvpError(pass.error || "An attendee with this email address or phone number is already registered for this event.");
          return;
        }

        if (pass && pass.id) {
          const qrData = JSON.stringify({
            passId: pass.id,
            badgeCode: pass.badgeCode,
            eventId: pass.eventId || eventId,
            eventTitle: title,
            attendeeName: rsvpName || "Attendee",
            company: resolvedCompany || "",
            jobTitle: resolvedJobTitle || "",
            ticketType: selectedTier,
          });
          const url = await QRCode.toDataURL(qrData, { 
            width: 280, 
            margin: 1, 
            color: { dark: "#0f172a", light: "#ffffff" } 
          });
          setQrCodeUrl(url);
          setRsvpSuccess(pass);
          setRsvpError(null);

          // Automatically send confirmation email with ticket pass to attendee
          const targetEmail = rsvpEmail || currentUser?.email;
          if (targetEmail) {
            fetch("/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "ticket_confirmation",
                to: targetEmail,
                attendeeName: rsvpName || currentUser?.fullName || "Attendee",
                ticketTier: selectedTier || "General Admission",
                eventTitle: title || eventDetails?.title || "Eventzone Summit",
                eventDate: formattedDateRange || startDate || "",
                eventLocation: location || eventDetails?.location || "Event Venue",
                company: resolvedCompany || "",
                jobTitle: resolvedJobTitle || "",
                badgeCode: pass.badgeCode || pass.id?.slice(0, 8),
                qrDataUrl: url,
                passId: pass.id,
                eventId: eventId || eventDetails?.id || "",
                templateUrl: selectedTicket?.badgeUrl || eventDetails?.badgeUrl || "",
                badgeSettings: selectedTicket?.badgeSettings || eventDetails?.badgeSettings || {},
                attendeePhoto: badgePhotoUrl || currentUser?.avatar || "",
                requiresApproval: Boolean(selectedTicket?.requiresApproval || selectedTicket?.requires_approval),
                organizerName: eventDetails?.organizerName || "Eventzone Platform",
              }),
            }).catch((emailErr) => console.warn("Failed to dispatch confirmation email:", emailErr));
          }
        }
      }
    } catch (err) {
      setRsvpError(err?.message || "Registration conflict: This email address or phone number is already registered or pending review.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!activeFeedbackForm || !onSubmitFormResponse) return;
    setFeedbackLoading(true);

    const name = feedbackAnswers["f_core_name"] || currentUser?.fullName || "Conference Attendee";
    const email = feedbackAnswers["f_core_email"] || currentUser?.email || "attendee@eventzone.io";

    try {
      await onSubmitFormResponse({
        formId: activeFeedbackForm.id,
        respondentName: name,
        respondentEmail: email,
        ticketTier: "Delegate Pass",
        answers: feedbackAnswers
      });
      setFeedbackSuccess(true);
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const toggleBookmark = (sessionId) => {
    setBookmarkedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handleScrollTo = (target) => (e) => {
    e.preventDefault();
    smoothScrollTo(target, { duration: 900, offset: 70, easing: "easeInOutCubic" });
  };

  const getGoogleCalendarUrl = () => {
    try {
      const cleanTitle = encodeURIComponent(title || "Event");
      const cleanDetails = encodeURIComponent(
        `${eventDetails?.description || title || ""}\n\nEvent Link: https://eventzone.pro/${eventDetails?.slug || "myevent"}\nVenue: ${location || ""}`
      );
      const cleanLocation = encodeURIComponent(location || "");

      const formatGCalDate = (dStr, isEnd = false) => {
        if (!dStr) return "";
        const clean = dStr.split("T")[0];
        const parts = clean.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10) + (isEnd ? 1 : 0);
          const dt = new Date(Date.UTC(y, m, d));
          const yyyy = dt.getUTCFullYear();
          const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(dt.getUTCDate()).padStart(2, "0");
          return `${yyyy}${mm}${dd}`;
        }
        return dStr.replace(/[^0-9]/g, "");
      };

      const startG = formatGCalDate(startDate);
      const endG = formatGCalDate(endDate || startDate, true);
      const datesParam = startG && endG ? `&dates=${startG}/${endG}` : "";

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${cleanTitle}&details=${cleanDetails}&location=${cleanLocation}${datesParam}`;
    } catch {
      return "https://calendar.google.com";
    }
  };

  const formatSessionTime = (timeStr) => {
    if (!timeStr) return "";
    const trimmed = String(timeStr).trim();
    if (/am|pm/i.test(trimmed)) return trimmed.toUpperCase();
    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1].slice(0, 2).padStart(2, "0");
      if (isNaN(h)) return trimmed;
      const suffix = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${String(displayH).padStart(2, "0")}:${m} ${suffix}`;
    }
    return trimmed;
  };

  const getSessionGoogleCalendarUrl = (session) => {
    try {
      const cleanTitle = encodeURIComponent(`${session.title || "Session"} - ${title || eventDetails?.title || "Event"}`);
      
      const speakersText = (session.speakers || []).map(s => typeof s === "string" ? s : s.name).filter(Boolean).join(", ");
      const moderatorsText = (session.moderators || []).map(m => typeof m === "string" ? m : m.name).filter(Boolean).join(", ");
      let detailsBody = session.description || "";
      if (speakersText) detailsBody += `\n\nSpeakers: ${speakersText}`;
      if (moderatorsText) detailsBody += `\nModerators: ${moderatorsText}`;
      if (location) detailsBody += `\nVenue: ${location}`;
      if (eventDetails?.slug) detailsBody += `\nEvent Link: https://eventzone.pro/${eventDetails.slug}`;

      const cleanDetails = encodeURIComponent(detailsBody);
      const cleanLocation = encodeURIComponent(session.room || session.location || location || "");

      const sessionDate = session.date || startDate;
      if (!sessionDate) {
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${cleanTitle}&details=${cleanDetails}&location=${cleanLocation}`;
      }

      const parseTimeToHoursMinutes = (tStr, defaultObj) => {
        if (!tStr) return defaultObj;
        const s = String(tStr).trim();
        const isPM = /pm/i.test(s);
        const isAM = /am/i.test(s);
        const clean = s.replace(/[^0-9:]/g, "");
        const parts = clean.split(":");
        let h = parseInt(parts[0] || "0", 10);
        let m = parseInt(parts[1] || "0", 10);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return {
          h: String(h).padStart(2, "0"),
          m: String(m).padStart(2, "0")
        };
      };

      const startTM = parseTimeToHoursMinutes(session.startTime || session.time, { h: "09", m: "00" });
      const endTM = parseTimeToHoursMinutes(session.endTime, { h: "10", m: "00" });

      const dateClean = sessionDate.split("T")[0].replace(/-/g, ""); // YYYYMMDD
      const startIso = `${dateClean}T${startTM.h}${startTM.m}00`;
      const endIso = `${dateClean}T${endTM.h}${endTM.m}00`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${cleanTitle}&details=${cleanDetails}&location=${cleanLocation}&dates=${startIso}/${endIso}`;
    } catch {
      return "https://calendar.google.com";
    }
  };

  if (isLoading) {
    return <LandingPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* ==================================================================== */}
      {/* 1. STICKY TOP NAVBAR (LIGHT MODE)                                    */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs relative">
        {/* Left: Brand Logo on its own */}
        <div className="flex items-center">
          <div onClick={onBackToHome} className="cursor-pointer select-none flex items-center" title="Return to Explore Events">
            <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '28px', width: 'auto', maxWidth: '160px' }} className="h-7 w-auto object-contain" />
          </div>
        </div>

        {/* Center: In-Page Navigation Quick Links */}
        <nav className="hidden lg:flex items-center justify-center gap-7 text-xs font-bold text-slate-600 absolute left-1/2 -translate-x-1/2">
          <a href="#about" onClick={handleScrollTo("#about")} className="hover:text-blue-600 transition-colors cursor-pointer">{t("event.about", "About")}</a>
          <a href="#speakers" onClick={handleScrollTo("#speakers")} className="hover:text-blue-600 transition-colors cursor-pointer">{t("event.speakers", "Speakers")}</a>
          <a href="#schedule" onClick={handleScrollTo("#schedule")} className="hover:text-blue-600 transition-colors cursor-pointer">{t("event.agenda", "Agenda")}</a>
          <a href="#floorplan" onClick={handleScrollTo("#floorplan")} className="hover:text-blue-600 transition-colors cursor-pointer">{t("event.floorPlan", "Floor Plan")}</a>
          <a href="#exhibitors" onClick={handleScrollTo("#exhibitors")} className="hover:text-blue-600 transition-colors cursor-pointer">{t("event.exhibitors", "Exhibitors & Sponsors")}</a>
          <a href="#tickets" onClick={handleScrollTo("#tickets")} className="hover:text-blue-600 transition-colors cursor-pointer">{t("event.tickets", "Tickets")}</a>
        </nav>

        {/* Right: Language Selector, Share, Feedback & Get Tickets Buttons */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            {(() => {
              const curLang = languages.find(l => l.code === lang) || languages[0];
              return (
                <button
                  onClick={() => setLangMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Change Language"
                >
                  {curLang?.icon ? (
                    <img src={curLang.icon} alt={lang} className="w-5 h-5 object-contain shrink-0" />
                  ) : (
                    <Globe size={13} className="text-slate-500" />
                  )}
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
            onClick={() => openRegistration(eventTickets[0]?.name || "Standard Admission")}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            {t("event.getPass", "Get Tickets")}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. TOP MEDIA SHOWCASE (CLEAN CAROUSEL / VIDEO SHOWCASE)              */}
      {/* ==================================================================== */}
      <section className="relative bg-white pt-6 pb-2 sm:pt-8 sm:pb-3">
        {/* Media Frame Container - Aligned to max-w-6xl to match content below */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="relative group rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-xl shadow-slate-200/40 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Media Player Frame (16:9 Aspect Ratio) */}
            <div className="relative aspect-video sm:aspect-21/9 lg:aspect-16/9 max-h-[520px] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
              
              {/* Media Items Cross-fade Transitions */}
              {mediaItems.length === 0 ? (
                <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
                </div>
              ) : (
                mediaItems.map((item, idx) => {
                  if (item.type === "video") {
                    if (activeMediaIdx !== idx) return null;
                    const videoAutoplaySrc = item.url.includes("autoplay=1") 
                      ? item.url 
                      : `${item.url}${item.url.includes('?') ? '&' : '?'}autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1`;
                    return (
                      <div key={idx} className="absolute inset-0 w-full h-full bg-slate-950 z-20">
                        <iframe
                          src={videoAutoplaySrc}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full border-0 bg-slate-950"
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out overflow-hidden flex items-center justify-center ${
                        activeMediaIdx === idx ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                      }`}
                    >
                      {/* Blurred Ambient Background from same image */}
                      <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center blur-2xl scale-125 opacity-75 filter"
                        style={{ backgroundImage: `url("${item.url}")` }}
                      />
                      {/* Soft dark vignette overlay */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-none" />

                      {/* Foreground Sharp Contained Original Image */}
                      <img
                        src={item.url}
                        alt={item.title}
                        className="relative z-10 w-full h-full object-contain object-center drop-shadow-2xl"
                      />
                    </div>
                  );
                })
              )}

              {/* Left/Right Navigation Chevrons (Discreet Minimalist Buttons) */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevMedia();
                    }}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/15 opacity-60 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-30 shadow-md"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft size={18} strokeWidth={2} className="-translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextMedia();
                    }}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/15 opacity-60 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-30 shadow-md"
                    aria-label="Next Slide"
                  >
                    <ChevronRight size={18} strokeWidth={2} className="translate-x-0.5" />
                  </button>
                </>
              )}

              {/* Floating Slide Counter / Badge */}
              {mediaItems.length > 1 && (
                <div className="absolute top-4 right-4 z-30">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                    {activeMediaIdx + 1} / {mediaItems.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2B. EVENT MAIN HEADER INFO & COUNTDOWN TIMER BAR                     */}
      {/* ==================================================================== */}
      <section className="bg-white border-b border-slate-200 pt-7 pb-10 sm:pt-9 sm:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* ── LEFT COLUMN: TITLE, DATE, LOCATION & ORGANIZER DETAILS ── */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6 text-left">
              
              {/* Main Event Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>

              {/* Clean Date, Time & Location Block */}
              <div className="space-y-6 pt-2">
                
                {/* Dates & Horaires */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {lang === "fr" ? "Dates & Horaires" : t("event.datesTime", "Date & time")}
                  </h3>
                  <div className="space-y-2.5 text-sm sm:text-base text-slate-700 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Calendar size={20} className="text-slate-400 shrink-0" />
                      <span>{formatEventDateRange(startDate, endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock size={20} className="text-slate-400 shrink-0" />
                      <span>{eventDetails?.scheduleTime || "08:00 AM - 05:00 PM"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <CalendarPlus size={18} className="text-blue-600 shrink-0" />
                      <a
                        href={getGoogleCalendarUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-semibold text-sm"
                      >
                        {t("event.addToCalendar", "Add to Calendar")}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {lang === "fr" ? "Localisation" : t("event.location", "Location")}
                  </h3>
                  <div className="space-y-2.5 text-sm sm:text-base text-slate-700 font-medium">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={20} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{location}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── RIGHT COLUMN: COMPACT TICKET CARD (IMAGE 1 STYLE) ── */}
            <div className="lg:col-span-5 xl:col-span-4 w-full">
              <div className="sticky top-20 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-100/70 space-y-3.5 text-left">
                
                {/* Ticket Tier Selector (Direct list of up to 3 tickets, no dropdown menu) */}
                {eventTickets.length > 0 && (
                  <div className="space-y-2">
                    {eventTickets.slice(0, 3).map((t, idx) => {
                      const tName = t.name || t.tier || `Ticket ${idx + 1}`;
                      const isSelected = (selectedTicket?.name === tName || selectedTicket?.id === t.id || selectedTier === tName);
                      const isFree = !t.price || Number(t.price) === 0;
                      const priceText = isFree 
                        ? (lang === "fr" ? "Gratuit" : (lang === "ar" ? "مجاني" : "Free"))
                        : `${Number(t.price).toLocaleString()} DZD`;

                      return (
                        <button
                          key={t.id || idx}
                          type="button"
                          onClick={() => {
                            setSelectedTier(tName);
                          }}
                          className={`w-full border rounded-xl p-3 sm:p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer group ${
                            isSelected 
                              ? "border-blue-600 bg-blue-50/30" 
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className={`text-sm font-bold leading-tight truncate ${isSelected ? "text-slate-900" : "text-slate-900"}`}>
                                {tName}
                              </h4>
                              {(t.isPopular || t.popular) && (
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wide">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-blue-600">
                              {priceText}
                            </p>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSelected 
                              ? "bg-blue-600 text-white" 
                              : "border border-slate-300 group-hover:border-slate-400"
                          }`}>
                            {isSelected && <Check size={11} strokeWidth={2.5} />}
                          </div>
                        </button>
                      );
                    })}

                    {eventTickets.length > 3 && (
                      <div className="pt-0.5 text-center">
                        <a
                          href="#tickets"
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
                        >
                          <span>View all {eventTickets.length} ticket options</span>
                          <ChevronRight size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Action Button ("Get Tickets") */}
                <button
                  type="button"
                  onClick={() => openRegistration(selectedTicket?.name || selectedTicket?.tier || eventTickets[0]?.name || "General Admission")}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center text-center"
                >
                  <span>
                    {t("event.getPass", "Get Tickets")}
                  </span>
                </button>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. METRIC STATS STRIP                                                */}
      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 3. METRIC STATS STRIP                                                */}
      {/* ==================================================================== */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{eventDetails?.capacity || 0}</span>
            <span className="text-xs text-slate-500 font-semibold block">Expected Delegates</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{eventSpeakers.length}</span>
            <span className="text-xs text-slate-500 font-semibold block">Keynote Speakers</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{eventExhibitors.length}</span>
            <span className="text-xs text-slate-500 font-semibold block">Exhibitor Booths</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{eventSessions.length}</span>
            <span className="text-xs text-slate-500 font-semibold block">Curated Sessions</span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. ABOUT THE EVENT                                                   */}
      {/* ==================================================================== */}
      <section id="about" className="py-16 max-w-6xl mx-auto px-6 sm:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Event Overview</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                About &ldquo;{title}&rdquo;
              </h2>
            </div>

            {eventDetails?.description ? (
              eventDetails.description.includes("<") && eventDetails.description.includes(">") ? (
                <div 
                  className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal space-y-2.5 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-slate-600"
                  dangerouslySetInnerHTML={{ 
                    __html: eventDetails.description
                      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
                      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
                      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
                      .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
                      .replace(/javascript\s*:/gi, "blocked:")
                  }}
                />
              ) : (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line">
                  {eventDetails.description}
                </p>
              )
            ) : (
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                This premier summit gathers international executives, technical pioneers, and regulatory leaders for in-depth keynote presentations, exhibition showcases, and high-level networking sessions.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Executive Networking</h4>
                <p className="text-[11px] text-slate-500">Connect with founders, investors, and enterprise decision-makers.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Interactive Floor Plan</h4>
                <p className="text-[11px] text-slate-500">Explore exhibitors, keynote stages, and VIP lounges in real-time 2D.</p>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 text-left">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              {organizerLogo ? (
                <img
                  src={organizerLogo}
                  alt={organizerName}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                  {organizerName.charAt(0).toUpperCase() || "E"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Presented By</span>
                <h4 className="text-sm font-bold text-slate-900 truncate">{organizerName}</h4>
                {hostName && hostName !== organizerName && (
                  <span className="text-xs text-slate-400 font-medium block truncate">{hostName}</span>
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Officially Registered Organizer</span>
              </div>

              {contactEmail ? (
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-blue-600 shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-slate-700 hover:text-blue-600 hover:underline transition-colors truncate"
                  >
                    {contactEmail}
                  </a>
                </div>
              ) : null}

              {contactPhone ? (
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="text-blue-600 shrink-0" />
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-slate-700 hover:text-blue-600 hover:underline transition-colors truncate"
                  >
                    {contactPhone}
                  </a>
                </div>
              ) : null}

              {websiteUrl && websiteUrl.trim() && !websiteUrl.includes("localhost") ? (
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-blue-600 shrink-0" />
                  <a
                    href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors truncate font-semibold"
                  >
                    {websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ) : null}
            </div>

            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(title)}`}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center block shadow-xs"
              >
                Contact Event Organizers
              </a>
            ) : (
              <button
                type="button"
                onClick={() => openRegistration(eventTickets[0]?.name || eventTickets[0]?.tier || "Standard Admission")}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Contact Event Organizers
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. FEATURED SPEAKERS & PRESENTERS                                     */}
      {/* ==================================================================== */}
      <section id="speakers" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Speaker Lineup</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Speakers &amp; Keynotes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Learn directly from leaders steering innovations and market strategies.
            </p>
          </div>

          {eventSpeakers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200/80 rounded-3xl text-slate-400 space-y-2 max-w-xl mx-auto">
              <Users size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-semibold">Keynote speakers will be announced soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventSpeakers.map((speaker, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50 border border-slate-200/90 rounded-3xl p-5 text-center flex flex-col items-center justify-between space-y-4 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-blue-500/30 group-hover:border-blue-600 transition-colors shadow-sm">
                      <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{speaker.name}</h4>
                      <span className="text-xs text-blue-600 font-semibold block">{speaker.role}</span>
                      {speaker.title && <span className="text-[11px] text-slate-500 block leading-tight mt-1">{speaker.title}</span>}
                    </div>
                  </div>

                  {speaker.company && (
                    <div className="pt-2 border-t border-slate-200/70 w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate block">
                        {speaker.company}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. INTERACTIVE AGENDA & SCHEDULE SESSIONS                            */}
      {/* ==================================================================== */}
      <section id="schedule" className="py-16 max-w-6xl mx-auto px-6 sm:px-8 w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div>
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Event Schedule</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Curated Agenda &amp; Sessions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Explore keynote lectures, breakout technical panels, and networking tracks.
            </p>
          </div>

          {/* Day Filters */}
          {startDate && (
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              {["All", startDate, endDate].filter((v, i, a) => v && a.indexOf(v) === i).map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDay === day ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {day === "All" ? "All Days" : (idx === 1 ? "Day 1" : "Day 2")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {eventSessions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200/80 rounded-3xl text-slate-400 space-y-2 max-w-xl mx-auto">
              <Calendar size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-semibold">Agenda schedule will be published soon by the organizers.</p>
            </div>
          ) : (
            eventSessions
              .filter(s => selectedDay === "All" || s.date === selectedDay)
              .map((session, idx) => {
                const isBookmarked = bookmarkedSessions.has(session.id);

                return (
                  <div
                    key={session.id || idx}
                    className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col gap-4 text-left"
                  >
                    {/* Time & Date Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                        <Clock size={13} className="text-blue-600 shrink-0" />
                        <span>
                          {formatSessionTime(session.startTime || session.time) || "09:00 AM"} — {formatSessionTime(session.endTime) || "10:00 AM"}
                        </span>
                      </span>

                      {session.date && (
                        <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                          {session.date}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {session.title || "Session"}
                    </h3>

                    {/* Speakers & Moderators Grid */}
                    {((session.speakers && session.speakers.length > 0) || (session.moderators && session.moderators.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* Speakers */}
                        {session.speakers && session.speakers.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Speakers
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {session.speakers.map((sp, i) => {
                                const spName = typeof sp === "string" ? sp : (sp.name || "Speaker");
                                const spImage = typeof sp === "object" ? (sp.image || sp.avatar) : "";
                                return (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-800 shadow-2xs"
                                  >
                                    {spImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={spImage}
                                        alt={spName}
                                        className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {spName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="truncate max-w-[140px]">{spName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Moderators */}
                        {session.moderators && session.moderators.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Moderators
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {session.moderators.map((mod, i) => {
                                const modName = typeof mod === "string" ? mod : (mod.name || "Moderator");
                                const modImage = typeof mod === "object" ? (mod.image || mod.avatar) : "";
                                return (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-800 shadow-2xs"
                                  >
                                    {modImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={modImage}
                                        alt={modName}
                                        className="w-5 h-5 rounded-full object-cover border border-indigo-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-indigo-950 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {modName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="truncate max-w-[140px]">{modName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {session.description && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                        {session.description}
                      </p>
                    )}

                    {/* Add to Google Calendar Action Button */}
                    <div className="pt-2">
                      <a
                        href={getSessionGoogleCalendarUrl(session)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all shadow-2xs cursor-pointer w-fit"
                      >
                        <Calendar size={14} className="text-blue-600 shrink-0" />
                        <span>Add to Google Calendar</span>
                      </a>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. INTERACTIVE 2D FLOOR PLAN BANNER SECTION                          */}
      {/* ==================================================================== */}
      <section id="floorplan" className="py-12 bg-blue-600 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md">
              Venue Navigation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Explore the Interactive 2D Floor Plan
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed font-normal">
              Locate exhibitor booths, keynote main stages, food zones, and sponsor suites before arriving at the venue.
            </p>
          </div>

          <button
            onClick={() => onViewFloorPlan && onViewFloorPlan(eventId || eventDetails?.id)}
            className="px-8 py-4 bg-white hover:bg-blue-50 text-blue-700 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <Layers size={18} className="text-blue-600" />
            <span>Launch 2D Floor Plan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. EXHIBITORS SHOWCASE                                               */}
      {/* ==================================================================== */}
      {eventExhibitors.length > 0 && (
        <section id="exhibitors" className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Industrial Partners</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured Exhibitors &amp; Booths
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Discover industry vendors displaying breakthrough technology and product demonstrations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventExhibitors.map((ex, idx) => (
                <div 
                  key={ex.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden p-1 flex items-center justify-center">
                        <img src={ex.logo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80"} alt={ex.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                        {ex.booth || ex.boothNumber || "Booth"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ex.name}</h4>
                      <span className="text-[11px] text-blue-600 font-semibold block">{ex.industry || "Industry Partner"}</span>
                      {ex.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {ex.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                    <span>Exhibition Hall</span>
                    <span className="text-blue-600 font-bold">View Booth →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 9. SPONSORS SHOWCASE                                                 */}
      {/* ==================================================================== */}
      {eventSponsors.length > 0 && (
        <section className="py-16 max-w-6xl mx-auto px-6 sm:px-8 w-full space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Corporate Backers</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Official Event Sponsors
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Special thanks to the premier global institutions making this event possible.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {eventSponsors.map((sp, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl px-8 py-5 flex items-center gap-3 shadow-xs hover:shadow-md transition-all">
                  <Building2 size={24} className="text-blue-600" />
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block">{sp.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{sp.tier || "Partner"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 10. TICKETS & REGISTRATION PASSES SECTION                            */}
      {/* ==================================================================== */}
      <section id="tickets" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Registration Passes</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Claim Your Summit Pass
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Select your access tier and receive an instant digital QR badge.
            </p>
          </div>

          {eventTickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 space-y-2 max-w-xl mx-auto">
              <Ticket size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-semibold">Registration ticket tiers will open soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {eventTickets.map((ticket, idx) => {
                const priceNum = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price) || 0;
                const isPop = Boolean(ticket.isPopular || ticket.popular);
                return (
                  <div
                    key={ticket.id || idx}
                    className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative ${
                      isPop
                        ? "bg-white border-2 border-amber-500 shadow-2xl ring-4 ring-amber-500/10"
                        : "bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    {isPop && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3.5 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase shadow-sm flex items-center gap-1">
                          ★ Most Popular
                        </span>
                      </div>
                    )}

                    <div className="space-y-5 text-left">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{ticket.name || ticket.tier}</h3>
                        {ticket.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ticket.description}</p>}
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">{priceNum === 0 ? "Free" : `${priceNum.toLocaleString()} DZD`}</span>
                        {priceNum > 0 && <span className="text-xs text-slate-400 font-semibold">/ attendee</span>}
                      </div>

                      {ticket.features && ticket.features.length > 0 && (
                        <div className="space-y-2.5 pt-4 border-t border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What&apos;s Included</span>
                          {ticket.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-200/80">
                      <button
                        onClick={() => openRegistration(ticket.name || ticket.tier)}
                        className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isPop
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <Ticket size={15} />
                        <span>Select &amp; Register</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 11. MODERN PREMIUM FOOTER                                            */}
      {/* ==================================================================== */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800 mt-auto font-sans">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-12">
          {/* Top Row: Brand & Quick Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80 items-start">
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '28px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} className="h-7 w-auto object-contain brightness-0 invert" />
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Official Event Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                {eventDetails?.description || "Official registration, schedule, and delegate portal."}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Verified by Eventzone Decentralized Verification Infrastructure</span>
              </div>
            </div>

            {/* Quick Stats Banner on Footer */}
            <div className="lg:col-span-6 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Need Customized Delegation Passes?</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Corporate bundles and attendee passes with dedicated registration.</div>
              </div>
              <button
                onClick={() => openRegistration(eventTickets[0]?.name || "General Admission")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Inquire
              </button>
            </div>
          </div>

          {/* Bottom Grid: Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-left">
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#about" onClick={handleScrollTo("#about")} className="hover:text-white transition-colors cursor-pointer">About &amp; Overview</a></li>
                <li><a href="#speakers" onClick={handleScrollTo("#speakers")} className="hover:text-white transition-colors cursor-pointer">Keynote Speakers</a></li>
                <li><a href="#schedule" onClick={handleScrollTo("#schedule")} className="hover:text-white transition-colors cursor-pointer">Agenda &amp; Sessions</a></li>
                <li><a href="#floorplan" onClick={handleScrollTo("#floorplan")} className="hover:text-white transition-colors cursor-pointer">Interactive Floor Plan</a></li>
                <li><a href="#tickets" onClick={handleScrollTo("#tickets")} className="hover:text-white transition-colors cursor-pointer">Passes &amp; Pricing</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Partners &amp; Expo</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#exhibitors" onClick={handleScrollTo("#exhibitors")} className="hover:text-white transition-colors cursor-pointer">Exhibitor Directory</a></li>
                <li><a href="#exhibitors" onClick={handleScrollTo("#exhibitors")} className="hover:text-white transition-colors cursor-pointer">Booth Locations</a></li>
                <li><a href="#sponsors" onClick={handleScrollTo("#sponsors")} className="hover:text-white transition-colors cursor-pointer">Diamond &amp; Gold Sponsors</a></li>
                <li><button onClick={() => openRegistration(eventTickets[0]?.name || "General Admission")} className="hover:text-white transition-colors text-left cursor-pointer">Become a Sponsor</button></li>
                <li><button onClick={() => openRegistration(eventTickets[0]?.name || "General Admission")} className="hover:text-white transition-colors text-left cursor-pointer">Exhibitor Inquiries</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Platform Features</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={onBackToHome} className="hover:text-white transition-colors text-left cursor-pointer">Explore All Summits</button></li>
                <li><span className="text-slate-500">2D Drag-and-Drop Floor Plan</span></li>
                <li><span className="text-slate-500">Instant QR Badge Generation</span></li>
                <li><span className="text-slate-500">Real-Time Attendee Analytics</span></li>
                <li><span className="text-slate-500">Broadcast Live Streaming</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Support &amp; Trust</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="text-slate-300">Host: {organization}</span></li>
                <li><span className="text-slate-300">Contact: {contactEmail || "support@eventzone.io"}</span></li>
                <li><span className="text-slate-500">Privacy &amp; Data Rights</span></li>
                <li><span className="text-slate-500">Terms of Attendance</span></li>
                <li><span className="text-slate-500">Delegate Support 24/7</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row: Copyright, Legal & Back to Top */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              <span>© 2026 {title}. Powered by <strong className="text-slate-400">Eventzone SaaS Platform</strong>.</span>
            </div>

            <button
              onClick={() => smoothScrollTo(0, { duration: 900, easing: "easeInOutCubic" })}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 12. FULL-PAGE REGISTRATION VIEW (WHITE BG, FORM LEFT, A6 BADGE RIGHT) */}
      {/* ==================================================================== */}
      {showRsvpModal && (
        <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto flex flex-col font-sans selection:bg-blue-600 selection:text-white">
          {/* Top Bar Header with Back button and Language Switcher */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
            <button
              type="button"
              onClick={closeRegistration}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>{t("event.backToEvent", "Back to Event")}</span>
            </button>

            {/* Language Selector in Registration View */}
            <div className="relative">
              {(() => {
                const curLang = languages.find(l => l.code === lang) || languages[0];
                return (
                  <button
                    onClick={() => setLangMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Change Language"
                  >
                    {curLang?.icon ? (
                      <img src={curLang.icon} alt={lang} className="w-5 h-5 object-contain shrink-0" />
                    ) : (
                      <Globe size={13} className="text-slate-500" />
                    )}
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
          </header>

          {/* Main Registration Layout */}
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
            {rsvpSuccess ? (
              /* ============================================================ */
              /* SUCCESS STATE: OFFICIAL BADGE ISSUED OR PENDING REVIEW       */
              /* ============================================================ */
              (() => {
                const isPendingRegistration = rsvpSuccess.status === "pending" || Boolean(selectedTicket?.requiresApproval);

                return (
                  <div className="max-w-xl mx-auto w-full">
                    {/* Confirmation Message & Action Suite */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs text-left space-y-6">
                      {isPendingRegistration ? (
                        <div className="space-y-2">
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Registration Submitted for Approval
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Your registration for <strong>{selectedTier}</strong> has been received and is currently in the organizer review queue for <strong>{title}</strong>. You will be notified via email once the organizer accepts your application.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                            <CheckCircle2 size={15} />
                            <span>Registration Confirmed</span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Your Official Pass is Ready!
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-600">
                            Your digital pass has been activated for <strong>{title}</strong>.
                          </p>
                        </div>
                      )}

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Attendee Name</span>
                          <span className="font-bold text-slate-900">{rsvpName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Registered Email</span>
                          <span className="font-bold text-slate-900">{rsvpEmail}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Pass Tier</span>
                          <span className="font-bold text-blue-600">{selectedTier}</span>
                        </div>
                        <div className="flex justify-between py-1 items-center">
                          <span className="text-slate-500 font-medium">
                            {isPendingRegistration ? "Application Status" : "Digital Badge ID"}
                          </span>
                          {isPendingRegistration ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                              <Clock size={12} />
                              <span>Pending Organizer Review</span>
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-emerald-700">{rsvpSuccess.badgeCode || "EZ-2026"}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {isPendingRegistration ? (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={closeRegistration}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer text-center"
                          >
                            {t("reg.done", "Done")}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                printA4BadgeDocument({
                                  templateUrl: selectedTierObj?.badgeUrl || eventDetails?.badgeUrl || "",
                                  attendeeName: rsvpName || currentUser?.fullName || "Attendee",
                                  attendeePhoto: badgePhotoUrl || currentUser?.avatar || "",
                                  attendeeCompany: resolvedCompany || organization || "",
                                  attendeeJobTitle: resolvedJobTitle || "",
                                  ticketType: selectedTier || "General Pass",
                                  badgeCode: rsvpSuccess?.badgeCode || "EZ-PASS",
                                  eventTitle: title || "Conference Event",
                                  qrCodeUrl: qrCodeUrl || "",
                                  showFoldGuide: true,
                                  showPhoto: true,
                                  showQr: true,
                                  cardTheme: "white"
                                });
                              }}
                              className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                            >
                              <Printer size={15} />
                              <span>Print / Save Badge PDF</span>
                            </button>

                            {qrCodeUrl && (
                              <a
                                href={qrCodeUrl}
                                download={`${(rsvpName || 'event').replace(/\s+/g, '_')}_qr_pass.png`}
                                className="py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                              >
                                <Download size={15} />
                                <span>Download QR Code</span>
                              </a>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={closeRegistration}
                              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer text-center"
                            >
                              {t("reg.done", "Done")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* ============================================================ */
              /* REGISTRATION IN PROGRESS: CLEAN FORM LEFT, A6 BADGE RIGHT    */
              /* ============================================================ */
              <div>
                <div className="mb-6 space-y-1.5 text-left max-w-2xl mx-auto">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t("reg.title", "Event Registration")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
                    {t("reg.subtitle", "Complete your registration details below to attend.")}
                  </p>
                </div>

                <div className="max-w-2xl mx-auto w-full">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs text-left">
                    <form onSubmit={isCheckoutLast ? handleRsvpSubmit : handleCheckoutNext} className="space-y-5">
                      


                      {/* DUPLICATE / CONFLICT ERROR ALERT */}
                      {rsvpError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200">
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-0.5 text-xs font-semibold leading-relaxed">
                            <span className="font-extrabold text-rose-900 text-sm">Registration Conflict</span>
                            <span className="text-rose-700 font-medium">{rsvpError}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* MULTI-SECTION STEPPER & PROGRESS (IF ACTIVE TICKET FORM HAS SECTIONS) */}
                      {hasMultiSections && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wide">
                                Section {safeCheckoutIdx + 1} of {ticketFormSections.length}
                              </span>
                              <span className="text-xs font-bold text-slate-800 line-clamp-1">
                                {currentCheckoutSec.title || `Step ${safeCheckoutIdx + 1}`}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">
                              {Math.round(((safeCheckoutIdx + 1) / ticketFormSections.length) * 100)}% Complete
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${((safeCheckoutIdx + 1) / ticketFormSections.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* SECTION 1 / PAGE 1: CORE ATTENDEE CREDENTIALS + SECTION 1 QUESTIONS */}
                      {(!hasMultiSections || safeCheckoutIdx === 0) && (
                        <>
                          {/* ATTENDEE CREDENTIALS */}
                          <div className="space-y-4 pt-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              {t("reg.badgeCredentials", "Attendee Badge Credentials")}
                            </label>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                {t("reg.fullName", "Your Full Name")} <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={rsvpName}
                                onChange={(e) => {
                                  setRsvpName(e.target.value);
                                  if (checkoutSectionErrors["rsvpName"]) {
                                    setCheckoutSectionErrors(prev => ({ ...prev, rsvpName: undefined }));
                                  }
                                }}
                                placeholder="e.g. Sarah Jenkins"
                                className={`w-full px-3.5 py-3 bg-slate-50 border focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all ${
                                  checkoutSectionErrors["rsvpName"] ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {checkoutSectionErrors["rsvpName"] && (
                                <p className="text-[10px] font-bold text-rose-600 mt-1">{checkoutSectionErrors["rsvpName"]}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {t("reg.email", "Your Email Address")} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={rsvpEmail}
                                  onChange={(e) => {
                                    setRsvpEmail(e.target.value);
                                    if (checkoutSectionErrors["rsvpEmail"]) {
                                      setCheckoutSectionErrors(prev => ({ ...prev, rsvpEmail: undefined }));
                                    }
                                  }}
                                  placeholder="e.g. alex@company.com"
                                  className={`w-full px-3.5 py-3 bg-slate-50 border focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all ${
                                    checkoutSectionErrors["rsvpEmail"] ? "border-rose-400 bg-rose-50/40" : "border-slate-200 focus:border-blue-600"
                                  }`}
                                />
                                {checkoutSectionErrors["rsvpEmail"] && (
                                  <p className="text-[10px] font-bold text-rose-600 mt-1">{checkoutSectionErrors["rsvpEmail"]}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {t("reg.phone", "Phone Number")} <span className="text-rose-500">*</span>
                                </label>
                                <CountryPhoneInput
                                  value={rsvpPhone}
                                  onChange={(val) => {
                                    setRsvpPhone(val);
                                    if (checkoutSectionErrors["rsvpPhone"]) {
                                      setCheckoutSectionErrors(prev => ({ ...prev, rsvpPhone: undefined }));
                                    }
                                  }}
                                  required
                                  inputClassName="py-3"
                                />
                                {checkoutSectionErrors["rsvpPhone"] && (
                                  <p className="text-[10px] font-bold text-rose-600 mt-1">{checkoutSectionErrors["rsvpPhone"]}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Custom Questions for Section 1 (or all questions if single section) */}
                          {(!hasMultiSections ? activeTicketForm?.fields : ticketFormSections[0]?.fields) && (
                            <div className="border-t border-slate-100 pt-4 space-y-3">
                              {(!hasMultiSections && activeTicketForm?.fields?.length > 0) && (
                                <div className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
                                  {t("reg.additionalQuestions", "3. Additional Registration Questions")}
                                </div>
                              )}

                              {((!hasMultiSections ? activeTicketForm?.fields : ticketFormSections[0]?.fields) || [])
                                .filter(f => !["f_core_name", "f_core_email", "f_core_phone"].includes(f.id) && f.type !== "section")
                                .map(field => {
                                  const hasError = Boolean(checkoutSectionErrors[field.id]);
                                  return (
                                    <div key={field.id} className={`p-3 rounded-2xl transition-all ${
                                      hasError ? "bg-rose-50/50 border border-rose-200" : ""
                                    }`}>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                                      </label>

                                      {(field.type === "phone" || field.id === "f_core_phone") && (
                                        <CountryPhoneInput
                                          value={customAnswers[field.id] || ""}
                                          onChange={(val) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || ""}
                                          required={field.required}
                                        />
                                      )}

                                      {field.type === "country" && (
                                        <CountrySelect
                                          value={customAnswers[field.id] || ""}
                                          onChange={(val) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || "Select your country..."}
                                          required={field.required}
                                        />
                                      )}

                                      {field.type === "city" && (
                                        <CitySelect
                                          value={customAnswers[field.id] || ""}
                                          country={
                                            customAnswers["f_country"] || 
                                            customAnswers["country"] || 
                                            Object.entries(customAnswers).find(([k]) => k.toLowerCase().includes("country"))?.[1] || 
                                            ""
                                          }
                                          onChange={(val) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || "Select or enter your city..."}
                                          required={field.required}
                                        />
                                      )}

                                      {field.type === "picture" && (
                                        <FormImageUploader
                                          value={customAnswers[field.id] || ""}
                                          onChange={(val) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || "Upload your photo from phone or computer"}
                                          required={field.required}
                                        />
                                      )}

                                      {["pdf", "word", "excel", "csv", "pptx", "file"].includes(field.type) && (
                                        <FormFileUploader
                                          fileType={field.type}
                                          value={customAnswers[field.id] || ""}
                                          onChange={(val) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || ""}
                                          required={field.required}
                                        />
                                      )}

                                      {["text", "email", "number"].includes(field.type) && field.id !== "f_core_phone" && (
                                        <input
                                          type={field.type}
                                          required={field.required}
                                          value={customAnswers[field.id] || ""}
                                          onChange={(e) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || "Enter details..."}
                                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                                        />
                                      )}

                                      {field.type === "textarea" && (
                                        <textarea
                                          required={field.required}
                                          rows={2}
                                          value={customAnswers[field.id] || ""}
                                          onChange={(e) => {
                                            setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }));
                                            if (checkoutSectionErrors[field.id]) {
                                              setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                            }
                                          }}
                                          placeholder={field.placeholder || "Enter details..."}
                                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                                        />
                                      )}

                                      {field.type === "select" && (
                                        <div className="flex flex-col gap-2">
                                          <SearchableSelect
                                            required={field.required}
                                            value={isOtherValue(customAnswers[field.id]) ? ((field.options || []).find(o => isOtherOption(o)) || "Other") : (customAnswers[field.id] || "")}
                                            onChange={(val) => {
                                              handleSelectChoice(field.id, val);
                                              if (checkoutSectionErrors[field.id]) {
                                                setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                              }
                                            }}
                                            options={field.options || []}
                                            placeholder="Select option..."
                                            searchPlaceholder="Search choices..."
                                          />
                                          {isOtherValue(customAnswers[field.id]) && (
                                            <div className="animate-fade-in flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                                              <input
                                                type="text"
                                                required={field.required}
                                                value={getOtherTextForField(field.id, customAnswers[field.id])}
                                                onChange={(e) => handleOtherTextChange(field.id, e.target.value)}
                                                placeholder="Please specify / Type what's other..."
                                                className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                                autoFocus
                                              />
                                            </div>
                                          )}
                                        </div>
                                      )}

                                       {field.type === "radio" && (
                                         <div className="flex flex-col gap-2 mt-1">
                                           {(field.options || []).map((opt, i) => {
                                             const isOtherOpt = isOtherOption(opt);
                                             const isChecked = isOtherOpt
                                               ? isOtherValue(customAnswers[field.id])
                                               : customAnswers[field.id] === opt;

                                             return (
                                               <div key={i} className="flex flex-col gap-1.5">
                                                 <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                                   <input
                                                     type="radio"
                                                     name={field.id}
                                                     required={field.required && !customAnswers[field.id]}
                                                     checked={isChecked}
                                                     onChange={() => handleRadioChoice(field.id, opt)}
                                                     className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                                   />
                                                   <span>{opt}</span>
                                                 </label>
                                                 {isOtherOpt && isChecked && (
                                                   <div className="ml-5 animate-fade-in">
                                                     <input
                                                       type="text"
                                                       required={field.required}
                                                       value={getOtherTextForField(field.id, customAnswers[field.id])}
                                                       onChange={(e) => handleOtherTextChange(field.id, e.target.value)}
                                                       placeholder="Please specify / Type what's other..."
                                                       className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                                       autoFocus
                                                     />
                                                   </div>
                                                 )}
                                               </div>
                                             );
                                           })}
                                         </div>
                                       )}

                                       {field.type === "checkbox" && (
                                         <div className="flex flex-col gap-2 mt-1">
                                           {(field.options || []).map((opt, i) => {
                                             const currentList = Array.isArray(customAnswers[field.id]) ? customAnswers[field.id] : [];
                                             const isOtherOpt = isOtherOption(opt);
                                             const isChecked = isOtherOpt
                                               ? currentList.some(x => isOtherValue(x))
                                               : currentList.includes(opt);

                                             const otherItem = isOtherOpt ? currentList.find(x => isOtherValue(x)) : null;

                                             return (
                                               <div key={i} className="flex flex-col gap-1.5">
                                                 <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                                   <input
                                                     type="checkbox"
                                                     checked={isChecked}
                                                     onChange={(e) => handleCheckboxChoice(field.id, opt, e.target.checked)}
                                                     className="text-blue-600 focus:ring-blue-500 rounded h-3.5 w-3.5"
                                                   />
                                                   <span>{opt}</span>
                                                 </label>
                                                 {isOtherOpt && isChecked && (
                                                   <div className="ml-5 animate-fade-in">
                                                     <input
                                                       type="text"
                                                       value={customOtherTexts[`${field.id}__other`] || (otherItem && isOtherValue(otherItem) && otherItem.startsWith("Other: ") ? otherItem.slice(7) : "")}
                                                       onChange={(e) => handleCheckboxOtherTextChange(field.id, opt, e.target.value)}
                                                       placeholder="Please specify / Type what's other..."
                                                       className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                                       autoFocus
                                                     />
                                                   </div>
                                                 )}
                                               </div>
                                             );
                                           })}
                                         </div>
                                       )}

                                      {field.type === "switch" && (
                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mt-1">
                                          <input
                                            type="checkbox"
                                            checked={customAnswers[field.id] ?? field.defaultValue ?? false}
                                            onChange={(e) => {
                                              setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.checked }));
                                              if (checkoutSectionErrors[field.id]) {
                                                setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                              }
                                            }}
                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                          />
                                          <span>{field.helpText || "Yes, opt-in"}</span>
                                        </label>
                                      )}

                                      {hasError && (
                                        <p className="text-[10px] font-bold text-rose-600 mt-1">{checkoutSectionErrors[field.id]}</p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </>
                      )}

                      {/* SECTION 2+ / PAGE 2+: DYNAMIC SECTION QUESTIONS */}
                      {hasMultiSections && safeCheckoutIdx > 0 && (
                        <div className="space-y-4 pt-1">
                          {/* Section Title & Description Banner */}
                          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                            <h3 className="text-sm font-bold text-blue-950">
                              {currentCheckoutSec.title || `Section ${safeCheckoutIdx + 1}`}
                            </h3>
                            {currentCheckoutSec.description && (
                              <p className="text-xs text-blue-800/80 mt-1 font-medium">
                                {currentCheckoutSec.description}
                              </p>
                            )}
                          </div>

                          {/* Questions in this section */}
                          {(currentCheckoutSec.fields || []).filter(f => f.type !== "section").map(field => {
                            const hasError = Boolean(checkoutSectionErrors[field.id]);
                            return (
                              <div key={field.id} className={`p-3 rounded-2xl transition-all ${
                                hasError ? "bg-rose-50/50 border border-rose-200" : ""
                              }`}>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                                </label>

                                {(field.type === "phone" || field.id === "f_core_phone") && (
                                  <CountryPhoneInput
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || ""}
                                    required={field.required}
                                  />
                                )}

                                {field.type === "country" && (
                                  <CountrySelect
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || "Select your country..."}
                                    required={field.required}
                                  />
                                )}

                                {field.type === "city" && (
                                  <CitySelect
                                    value={customAnswers[field.id] || ""}
                                    country={
                                      customAnswers["f_country"] || 
                                      customAnswers["country"] || 
                                      Object.entries(customAnswers).find(([k]) => k.toLowerCase().includes("country"))?.[1] || 
                                      ""
                                    }
                                    onChange={(val) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || "Select or enter your city..."}
                                    required={field.required}
                                  />
                                )}

                                {field.type === "picture" && (
                                  <FormImageUploader
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || "Upload your photo from phone or computer"}
                                    required={field.required}
                                  />
                                )}

                                {["pdf", "word", "excel", "csv", "pptx", "file"].includes(field.type) && (
                                  <FormFileUploader
                                    fileType={field.type}
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: val }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || ""}
                                    required={field.required}
                                  />
                                )}

                                {["text", "email", "number"].includes(field.type) && field.id !== "f_core_phone" && (
                                  <input
                                    type={field.type}
                                    required={field.required}
                                    value={customAnswers[field.id] || ""}
                                    onChange={(e) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || "Enter details..."}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                                  />
                                )}

                                {field.type === "textarea" && (
                                  <textarea
                                    required={field.required}
                                    rows={2}
                                    value={customAnswers[field.id] || ""}
                                    onChange={(e) => {
                                      setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }));
                                      if (checkoutSectionErrors[field.id]) {
                                        setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                      }
                                    }}
                                    placeholder={field.placeholder || "Enter details..."}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                                  />
                                )}

                                {field.type === "select" && (
                                  <div className="flex flex-col gap-2">
                                    <SearchableSelect
                                      required={field.required}
                                      value={isOtherValue(customAnswers[field.id]) ? ((field.options || []).find(o => isOtherOption(o)) || "Other") : (customAnswers[field.id] || "")}
                                      onChange={(val) => {
                                        handleSelectChoice(field.id, val);
                                        if (checkoutSectionErrors[field.id]) {
                                          setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                        }
                                      }}
                                      options={field.options || []}
                                      placeholder="Select option..."
                                      searchPlaceholder="Search choices..."
                                    />
                                    {isOtherValue(customAnswers[field.id]) && (
                                      <div className="animate-fade-in flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                                        <input
                                          type="text"
                                          required={field.required}
                                          value={getOtherTextForField(field.id, customAnswers[field.id])}
                                          onChange={(e) => handleOtherTextChange(field.id, e.target.value)}
                                          placeholder="Please specify / Type what's other..."
                                          className="w-full px-3 py-2 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                          autoFocus
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {field.type === "radio" && (
                                  <div className="flex flex-col gap-2 mt-1">
                                    {(field.options || []).map((opt, i) => {
                                      const isOtherOpt = isOtherOption(opt);
                                      const isChecked = isOtherOpt
                                        ? isOtherValue(customAnswers[field.id])
                                        : customAnswers[field.id] === opt;

                                      return (
                                        <div key={i} className="flex flex-col gap-1.5">
                                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={field.id}
                                              required={field.required && !customAnswers[field.id]}
                                              checked={isChecked}
                                              onChange={() => handleRadioChoice(field.id, opt)}
                                              className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                            />
                                            <span>{opt}</span>
                                          </label>
                                          {isOtherOpt && isChecked && (
                                            <div className="ml-5 animate-fade-in">
                                              <input
                                                type="text"
                                                required={field.required}
                                                value={getOtherTextForField(field.id, customAnswers[field.id])}
                                                onChange={(e) => handleOtherTextChange(field.id, e.target.value)}
                                                placeholder="Please specify / Type what's other..."
                                                className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                                autoFocus
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {field.type === "checkbox" && (
                                  <div className="flex flex-col gap-2 mt-1">
                                    {(field.options || []).map((opt, i) => {
                                      const currentList = Array.isArray(customAnswers[field.id]) ? customAnswers[field.id] : [];
                                      const isOtherOpt = isOtherOption(opt);
                                      const isChecked = isOtherOpt
                                        ? currentList.some(x => isOtherValue(x))
                                        : currentList.includes(opt);

                                      const otherItem = isOtherOpt ? currentList.find(x => isOtherValue(x)) : null;

                                      return (
                                        <div key={i} className="flex flex-col gap-1.5">
                                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => handleCheckboxChoice(field.id, opt, e.target.checked)}
                                              className="text-blue-600 focus:ring-blue-500 rounded h-3.5 w-3.5"
                                            />
                                            <span>{opt}</span>
                                          </label>
                                          {isOtherOpt && isChecked && (
                                            <div className="ml-5 animate-fade-in">
                                              <input
                                                type="text"
                                                value={customOtherTexts[`${field.id}__other`] || (otherItem && isOtherValue(otherItem) && otherItem.startsWith("Other: ") ? otherItem.slice(7) : "")}
                                                onChange={(e) => handleCheckboxOtherTextChange(field.id, opt, e.target.value)}
                                                placeholder="Please specify / Type what's other..."
                                                className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none shadow-2xs placeholder:text-slate-400"
                                                autoFocus
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {field.type === "switch" && (
                                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mt-1">
                                    <input
                                      type="checkbox"
                                      checked={customAnswers[field.id] ?? field.defaultValue ?? false}
                                      onChange={(e) => {
                                        setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.checked }));
                                        if (checkoutSectionErrors[field.id]) {
                                          setCheckoutSectionErrors(prev => ({ ...prev, [field.id]: undefined }));
                                        }
                                      }}
                                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span>{field.helpText || "Yes, opt-in"}</span>
                                  </label>
                                )}

                                {hasError && (
                                  <p className="text-[10px] font-bold text-rose-600 mt-1">{checkoutSectionErrors[field.id]}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* VALIDATION ERROR BANNER */}
                      {Object.keys(checkoutSectionErrors).length > 0 && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                          <AlertCircle size={15} className="shrink-0 text-rose-600" />
                          <span>Please fill in all required questions marked in red before continuing.</span>
                        </div>
                      )}

                      {/* SUBMIT / NAVIGATION BUTTONS */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          {hasMultiSections && !isCheckoutFirst && (
                            <button
                              type="button"
                              onClick={handleCheckoutPrev}
                              className="px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                            >
                              Back
                            </button>
                          )}

                          {hasMultiSections && !isCheckoutLast ? (
                            <button
                              type="button"
                              onClick={handleCheckoutNext}
                              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Next</span>
                              <ChevronRight size={16} />
                            </button>
                          ) : (
                            <button
                              type="submit"
                              disabled={rsvpLoading}
                              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {rsvpLoading ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  <span>{t("reg.processing", "Joining Event...")}</span>
                                </>
                              ) : (
                                <span>{t("reg.joinEvent", "Join the Event")}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Standalone Event Feedback & CSAT Survey Modal */}
      {showFeedbackModal && activeFeedbackForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span>{activeFeedbackForm.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{title}</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center flex flex-col items-center gap-3 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  {activeFeedbackForm.settings?.successMessage || "Your response has been saved and helps us elevate future editions."}
                </p>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="mt-3 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
                {activeFeedbackForm.fields.map(field => {
                  if (field.type === "section") {
                    return (
                      <div key={field.id} className="pt-3 pb-1 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-900">{field.label}</div>
                        {field.helpText && <p className="text-[11px] text-slate-500 mt-0.5">{field.helpText}</p>}
                      </div>
                    );
                  }

                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      {field.helpText && <p className="text-[11px] text-slate-400">{field.helpText}</p>}

                      {(field.type === "phone" || field.id === "f_core_phone") && (
                        <CountryPhoneInput
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {field.type === "country" && (
                        <CountrySelect
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || "Select your country..."}
                          required={field.required}
                        />
                      )}

                      {field.type === "city" && (
                        <CitySelect
                          value={feedbackAnswers[field.id] || ""}
                          country={
                            feedbackAnswers["f_country"] || 
                            feedbackAnswers["country"] || 
                            Object.entries(feedbackAnswers).find(([k]) => k.toLowerCase().includes("country"))?.[1] || 
                            ""
                          }
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || "Select or enter your city..."}
                          required={field.required}
                        />
                      )}

                      {field.type === "picture" && (
                        <FormImageUploader
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || "Upload your photo from phone or computer"}
                          required={field.required}
                        />
                      )}

                      {["pdf", "word", "excel", "csv", "pptx", "file"].includes(field.type) && (
                        <FormFileUploader
                          fileType={field.type}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {["text", "email", "number"].includes(field.type) && field.id !== "f_core_phone" && (
                        <input
                          type={field.type}
                          required={field.required}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(e) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.placeholder || "Enter details..."}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                        />
                      )}

                      {field.type === "select" && (
                        <SearchableSelect
                          required={field.required}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          options={field.options || []}
                          placeholder="Select an option..."
                          searchPlaceholder="Search choices..."
                        />
                      )}

                      {field.type === "rating" && (
                        <div className="flex items-center gap-2 py-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setFeedbackAnswers(prev => ({ ...prev, [field.id]: star }))}
                              className="p-1 cursor-pointer transition-transform hover:scale-125"
                            >
                              <Star
                                size={24}
                                className={star <= (feedbackAnswers[field.id] || 0) ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === "nps" && (
                        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button
                              type="button"
                              key={n}
                              onClick={() => setFeedbackAnswers(prev => ({ ...prev, [field.id]: n }))}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                feedbackAnswers[field.id] === n
                                  ? "bg-blue-600 text-white scale-110"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === "textarea" && (
                        <textarea
                          required={field.required}
                          rows={3}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(e) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.placeholder || "Share your candid thoughts..."}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                        />
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  {feedbackLoading ? "Saving..." : (activeFeedbackForm.settings?.submitButtonText || "Submit Feedback")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Public RSVP Modal */}
      <PublicRSVPModal
        isOpen={showPublicRsvpModal}
        onClose={closeRSVP}
        event={eventDetails || { id: eventId, title }}
        rsvpSettings={rsvpSettings}
        existingHeadcount={rsvps.filter(r => (r.status || 'attending').toLowerCase() === 'attending').reduce((sum, r) => sum + 1 + (r.plusOnes || r.plus_ones || 0), 0)}
        onSubmitRSVP={onSubmitRSVP}
        currentUser={currentUser}
      />
    </div>
  );
}
