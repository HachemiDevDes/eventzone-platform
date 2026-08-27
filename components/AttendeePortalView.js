/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Globe, Sparkles, Calendar, Clock, MapPin, Users, Building2,
  Layers, Ticket, FileText, Bookmark, BookmarkCheck, Search,
  Filter, Check, CheckCircle2, X, ExternalLink, Download,
  Printer, ArrowLeft, ArrowRight, Share2, Mail, Phone,
  MessageSquare, UserCheck, ShieldCheck, Lock, Unlock, Eye,
  Compass, Megaphone, Store, Mic, Tag, ChevronDown, ChevronRight,
  Info, AlertCircle, Heart, Smartphone, RefreshCw, LogIn, UserPlus,
  Send, MessageCircle, Smile, User
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import UniversalTopBar from "./UniversalTopBar";
import SearchableSelect from "./SearchableSelect";
import A4BadgeSheet, { printA4BadgeDocument } from "./A4BadgeSheet";
import {
  fetchAttendeeConnections,
  sendAttendeeConnectionRequest,
  fetchSessionBookmarks,
  toggleSessionBookmark,
  fetchEventChatMessages,
  sendEventChatMessage,
  upsertUserProfile,
  isMatchingEmail
} from "../lib/db";

export default function AttendeePortalView({
  eventDetails = {},
  attendees = [],
  sessions = [],
  sponsors = [],
  exhibitors = [],
  floorPlans = [],
  documents = [],
  tickets = [],
  currentUser = null,
  onGoToHome,
  onOpenAuth,
  onOpenProfile,
  onSignOut,
  onOpenEventsHub,
  onViewLivePage
}) {
  const { t, isRTL, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "agenda" | "networking" | "exhibitors" | "floorplan" | "badge" | "resources"

  // ─────────────────────────────────────────────
  // 1. ACCESS VERIFICATION & ROLE RECOGNITION
  // ─────────────────────────────────────────────

  // Check if current user is an organizer / owner / admin with preview privileges
  const isOrganizerOrAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.isAdmin) return true;
    if (eventDetails.ownerId && currentUser.id === eventDetails.ownerId) return true;
    if (eventDetails.organizerId && currentUser.id === eventDetails.organizerId) return true;
    if (isMatchingEmail(currentUser.email, eventDetails.contactEmail || eventDetails.hostEmail)) return true;
    return false;
  }, [currentUser, eventDetails]);

  // Find matching attendee record for currentUser
  const matchingAttendee = useMemo(() => {
    if (!currentUser?.email) return null;
    return attendees.find(a => isMatchingEmail(a.email, currentUser.email));
  }, [attendees, currentUser]);

  const isVerifiedAttendee = Boolean(matchingAttendee || isOrganizerOrAdmin);

  // Portal Status & Scheduled Countdown
  const portalStatus = eventDetails.portalStatus || eventDetails.portal_status || "open";
  const portalOpenTimeStr = eventDetails.portalOpenTime || eventDetails.portal_open_time;

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (portalStatus !== "scheduled" || !portalOpenTimeStr) return;

    const targetDate = new Date(portalOpenTimeStr).getTime();
    if (isNaN(targetDate)) return;

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isExpired: false
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [portalStatus, portalOpenTimeStr]);

  const isScheduledInFuture = portalStatus === "scheduled" && !countdown.isExpired;
  const isPortalClosedForAttendee = (portalStatus === "closed" || isScheduledInFuture) && !isOrganizerOrAdmin;

  // ─────────────────────────────────────────────
  // 2. STATE: AGENDA & PERSONAL SCHEDULE
  // ─────────────────────────────────────────────
  const [agendaSearch, setAgendaSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [agendaViewMode, setAgendaViewMode] = useState("all"); // "all" | "bookmarked"
  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState([]);

  // Load Bookmarked Sessions from DB / storage
  useEffect(() => {
    if (currentUser?.id && eventDetails?.id) {
      const saved = fetchSessionBookmarks(currentUser.id, eventDetails.id);
      setBookmarkedSessionIds(saved);
    }
  }, [currentUser, eventDetails]);

  const handleToggleBookmark = (sessionId) => {
    if (!currentUser?.id) {
      if (onOpenAuth) onOpenAuth("signin");
      return;
    }
    const updated = toggleSessionBookmark(currentUser.id, eventDetails.id, sessionId);
    setBookmarkedSessionIds(updated);
  };

  // Distinct tracks and days
  const distinctDays = useMemo(() => {
    const set = new Set();
    sessions.forEach(s => {
      if (s.date || s.session_date) set.add(s.date || s.session_date);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const distinctTracks = useMemo(() => {
    const set = new Set();
    sessions.forEach(s => {
      if (s.track || s.stage) set.add(s.track || s.stage);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const titleMatch = (s.title || s.name || "").toLowerCase().includes(agendaSearch.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(agendaSearch.toLowerCase()) ||
        (s.speakers || []).some(sp => (typeof sp === "string" ? sp : sp.name || "").toLowerCase().includes(agendaSearch.toLowerCase()));

      const dayMatch = selectedDay === "all" || (s.date || s.session_date) === selectedDay;
      const trackMatch = selectedTrack === "all" || (s.track || s.stage) === selectedTrack;
      const bookmarkMatch = agendaViewMode === "all" || bookmarkedSessionIds.includes(s.id);

      return titleMatch && dayMatch && trackMatch && bookmarkMatch;
    });
  }, [sessions, agendaSearch, selectedDay, selectedTrack, agendaViewMode, bookmarkedSessionIds]);

  // ─────────────────────────────────────────────
  // 3. STATE: ATTENDEES & NETWORKING
  // ─────────────────────────────────────────────
  const [networkingSearch, setNetworkingSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [networkingTab, setNetworkingTab] = useState("all"); // "all" | "connections"
  const [connections, setConnections] = useState([]);
  const [selectedAttendeeForModal, setSelectedAttendeeForModal] = useState(null);
  
  // Connection Request Dialog
  const [connectModalTarget, setConnectModalTarget] = useState(null);
  const [connectNote, setConnectNote] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentTargetId, setRequestSentTargetId] = useState(null);

  // Edit My Profile Drawer
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [myHeadline, setMyHeadline] = useState(currentUser?.jobTitle || matchingAttendee?.jobTitle || "");
  const [myCompany, setMyCompany] = useState(currentUser?.companyName || matchingAttendee?.company || "");
  const [myBio, setMyBio] = useState(currentUser?.bio || "");
  const [myLookingFor, setMyLookingFor] = useState(currentUser?.what_im_looking_for || currentUser?.whatImLookingFor || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Load Connections
  useEffect(() => {
    if (currentUser?.id && eventDetails?.id) {
      fetchAttendeeConnections(currentUser.id, eventDetails.id).then(data => {
        setConnections(data || []);
      });
    }
  }, [currentUser, eventDetails]);

  const handleSendConnection = async (e) => {
    e.preventDefault();
    if (!connectModalTarget || !currentUser) return;
    setIsSendingRequest(true);
    try {
      const res = await sendAttendeeConnectionRequest(currentUser, connectModalTarget, eventDetails.id, connectNote);
      if (res) {
        setConnections(prev => [res, ...prev.filter(c => c.id !== res.id)]);
        setRequestSentTargetId(connectModalTarget.id || connectModalTarget.email);
        setTimeout(() => {
          setConnectModalTarget(null);
          setConnectNote("");
        }, 1200);
      }
    } catch (err) {
      console.warn("Connect error:", err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSaveMyProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsSavingProfile(true);
    try {
      await upsertUserProfile({
        id: currentUser.id,
        email: currentUser.email,
        jobTitle: myHeadline,
        job_title: myHeadline,
        companyName: myCompany,
        company_name: myCompany,
        company: myCompany,
        bio: myBio,
        what_im_looking_for: myLookingFor,
        whatImLookingFor: myLookingFor
      });
      setIsEditingMyProfile(false);
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      // Exclude current user from attendee list
      if (currentUser?.email && isMatchingEmail(a.email, currentUser.email)) return false;

      const q = networkingSearch.toLowerCase();
      const name = `${a.firstName || ""} ${a.lastName || ""} ${a.name || ""}`.toLowerCase();
      const comp = (a.company || a.organization || "").toLowerCase();
      const job = (a.jobTitle || a.job_title || a.role || "").toLowerCase();

      const searchMatch = !q || name.includes(q) || comp.includes(q) || job.includes(q);
      const isConn = connections.some(c => isMatchingEmail(c.email, a.email));
      const tabMatch = networkingTab === "all" || isConn;

      return searchMatch && tabMatch;
    });
  }, [attendees, currentUser, networkingSearch, connections, networkingTab]);

  // ─────────────────────────────────────────────
  // 3.5. STATE: DIRECT CHAT & 1-ON-1 MESSAGING
  // ─────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([]);
  const [activeChatContact, setActiveChatContact] = useState(null);
  const [chatInputText, setChatInputText] = useState("");
  const [chatContactSearch, setChatContactSearch] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Load chat messages from DB & localStorage
  useEffect(() => {
    if (currentUser?.id || currentUser?.email) {
      const uid = currentUser.id || currentUser.email;
      fetchEventChatMessages(uid, eventDetails.id).then(msgs => {
        if (msgs) setChatMessages(msgs);
      });
    }
  }, [currentUser, eventDetails.id]);

  // Scroll to bottom of message thread
  useEffect(() => {
    if (activeTab === "chat" && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeChatContact, activeTab]);

  // Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !activeChatContact || !currentUser) return;
    
    setIsSendingMessage(true);
    const text = chatInputText.trim();
    setChatInputText("");

    try {
      const newMsg = await sendEventChatMessage(currentUser, activeChatContact, text, eventDetails.id);
      if (newMsg) {
        setChatMessages(prev => [...prev, newMsg]);
      }
    } catch (err) {
      console.warn("Failed to send message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStartChatWith = (attendee) => {
    setActiveChatContact(attendee);
    setActiveTab("chat");
    setSelectedAttendeeForModal(null);
  };

  // Group messages for active conversation
  const activeConversationMessages = useMemo(() => {
    if (!activeChatContact || !currentUser) return [];
    const contactEmail = activeChatContact.email?.toLowerCase();
    const myEmail = currentUser.email?.toLowerCase();

    return chatMessages.filter(m => {
      const sEmail = m.sender_email?.toLowerCase();
      const rEmail = m.recipient_email?.toLowerCase();
      return (
        (sEmail === myEmail && rEmail === contactEmail) ||
        (sEmail === contactEmail && rEmail === myEmail)
      );
    });
  }, [chatMessages, activeChatContact, currentUser]);

  // List of contacts with whom the user has conversations or connections
  const chatContactsList = useMemo(() => {
    const map = new Map();

    // 1. Add all confirmed connections
    connections.forEach(c => {
      if (c.email) {
        map.set(c.email.toLowerCase(), {
          ...c,
          isConnection: true,
          name: c.name || "Delegate"
        });
      }
    });

    // 2. Add attendees with whom there are chat messages
    const myEmail = currentUser?.email?.toLowerCase();
    chatMessages.forEach(m => {
      const otherEmail = m.sender_email?.toLowerCase() === myEmail ? m.recipient_email?.toLowerCase() : m.sender_email?.toLowerCase();
      if (otherEmail && !map.has(otherEmail)) {
        const foundAttendee = attendees.find(a => isMatchingEmail(a.email, otherEmail));
        map.set(otherEmail, {
          email: otherEmail,
          name: m.sender_email?.toLowerCase() === myEmail ? m.recipient_name : m.sender_name,
          avatar: m.sender_email?.toLowerCase() === myEmail ? m.recipient_avatar : m.sender_avatar,
          jobTitle: foundAttendee?.jobTitle || foundAttendee?.role || "Delegate",
          company: foundAttendee?.company || "",
          isConnection: false
        });
      }
    });

    // 3. Fallback: if list is empty, populate from event attendees
    if (map.size === 0) {
      attendees.forEach(a => {
        if (!currentUser?.email || !isMatchingEmail(a.email, currentUser.email)) {
          map.set((a.email || "").toLowerCase(), {
            ...a,
            name: a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Delegate"
          });
        }
      });
    }

    const arr = Array.from(map.values());
    if (!chatContactSearch) return arr;
    const q = chatContactSearch.toLowerCase();
    return arr.filter(c => 
      (c.name || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.jobTitle || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }, [connections, chatMessages, attendees, currentUser, chatContactSearch]);

  // Set initial active chat contact if none selected
  useEffect(() => {
    if (!activeChatContact && chatContactsList.length > 0) {
      setActiveChatContact(chatContactsList[0]);
    }
  }, [activeChatContact, chatContactsList]);

  // ─────────────────────────────────────────────
  // 4. STATE: EXHIBITORS & SPONSORS
  // ─────────────────────────────────────────────
  const [exhibitorSearch, setExhibitorSearch] = useState("");
  const [selectedExhibitorModal, setSelectedExhibitorModal] = useState(null);

  const filteredSponsors = useMemo(() => {
    return sponsors.filter(s => {
      const q = exhibitorSearch.toLowerCase();
      return !q || (s.name || s.companyName || "").toLowerCase().includes(q) ||
        (s.tier || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q);
    });
  }, [sponsors, exhibitorSearch]);

  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter(ex => {
      const q = exhibitorSearch.toLowerCase();
      return !q || (ex.name || ex.companyName || "").toLowerCase().includes(q) ||
        (ex.booth || ex.boothNumber || "").toLowerCase().includes(q) ||
        (ex.description || "").toLowerCase().includes(q);
    });
  }, [exhibitors, exhibitorSearch]);

  // ─────────────────────────────────────────────
  // 5. STATE: FLOOR PLANS & VENUE EXPLORER
  // ─────────────────────────────────────────────
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [highlightedBooth, setHighlightedBooth] = useState(null);

  const activePlan = floorPlans[activeFloorIndex] || floorPlans[0] || null;

  const handleJumpToBooth = (boothNum) => {
    setHighlightedBooth(boothNum);
    setActiveTab("floorplan");
  };

  // ─────────────────────────────────────────────
  // 6. STATE: QR CODE DIGITAL PASS & PRINT BADGE
  // ─────────────────────────────────────────────
  const [badgeQrUrl, setBadgeQrUrl] = useState("");
  const [showPrintBadgeModal, setShowPrintBadgeModal] = useState(false);

  const activeBadgeCode = matchingAttendee?.badgeCode || matchingAttendee?.badge_code || `EZ-${(eventDetails.slug || "PASS").toUpperCase()}-88`;
  const attendeeDisplayName = matchingAttendee?.name || `${matchingAttendee?.firstName || ""} ${matchingAttendee?.lastName || ""}`.trim() || currentUser?.fullName || "Verified Attendee";
  const attendeeTicketType = matchingAttendee?.ticketType || matchingAttendee?.ticket_type || "Standard Admission";

  useEffect(() => {
    const qrData = JSON.stringify({
      badgeCode: activeBadgeCode,
      eventId: eventDetails.id,
      eventTitle: eventDetails.title,
      attendeeName: attendeeDisplayName,
      ticketType: attendeeTicketType,
      verified: true,
      platform: "Eventzone Attendee Portal"
    });

    QRCode.toDataURL(qrData, {
      width: 320,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    }).then(url => setBadgeQrUrl(url)).catch(err => console.warn("QR Error:", err));
  }, [activeBadgeCode, eventDetails, attendeeDisplayName, attendeeTicketType]);

  const handlePrintBadge = () => {
    printA4BadgeDocument({
      templateUrl: eventDetails.badgeUrl || "",
      attendeeName: attendeeDisplayName,
      attendeePhoto: currentUser?.avatar || matchingAttendee?.image || "",
      attendeeCompany: currentUser?.companyName || matchingAttendee?.company || "",
      attendeeJobTitle: currentUser?.jobTitle || matchingAttendee?.jobTitle || "",
      ticketType: attendeeTicketType,
      badgeCode: activeBadgeCode,
      eventTitle: eventDetails.title || "Summit",
      qrCodeUrl: badgeQrUrl,
      showFoldGuide: true,
      showPhoto: true,
      showQr: true,
      cardTheme: "white"
    });
  };

  // ─────────────────────────────────────────────
  // 7. STATE: MOBILE APP DOWNLOAD & QR
  // ─────────────────────────────────────────────
  const [appQrUrl, setAppQrUrl] = useState("");
  const appDownloadUrl = "https://eventzone.pro/download";

  useEffect(() => {
    QRCode.toDataURL(appDownloadUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    }).then(url => setAppQrUrl(url)).catch(err => console.warn("App QR Error:", err));
  }, [appDownloadUrl]);

  // ─────────────────────────────────────────────
  // GATEKEEPER RENDERS: CLOSED / COUNTDOWN / AUTH
  // ─────────────────────────────────────────────

  // 1. GATE: Portal is Closed
  if (portalStatus === "closed" && !isOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-rose-600 selection:text-white">
        <UniversalTopBar
          currentUser={currentUser}
          onGoToHome={onGoToHome}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
          onSignOut={onSignOut}
        />

        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
            <Lock size={36} className="stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Portal Currently Closed
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
              {eventDetails.title || "Summit"} Attendee Portal
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              The organizer has temporarily closed access to this event portal. Please check back later or contact the event coordinators for inquiries.
            </p>
          </div>

          {/* Organizer Custom Note */}
          {eventDetails.portalMessage && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl max-w-lg w-full text-left text-xs space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <Megaphone size={14} />
                <span>Notice from Event Organizer</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                {eventDetails.portalMessage}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGoToHome}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Events Hub</span>
            </button>

            {onViewLivePage && (
              <button
                onClick={() => onViewLivePage(eventDetails.id)}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                View Public Event Page
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 2. GATE: Scheduled Opening Countdown
  if (isScheduledInFuture && !isOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <UniversalTopBar
          currentUser={currentUser}
          onGoToHome={onGoToHome}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
          onSignOut={onSignOut}
        />

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Clock size={13} className="animate-spin" style={{ animationDuration: "8s" }} />
              <span>Attendee Portal Opening Soon</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {eventDetails.title || "Summit"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              The interactive attendee portal will unlock for all registered delegates when the countdown reaches zero.
            </p>
          </div>

          {/* Real-Time Countdown Timer Block */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg w-full">
            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight font-mono">
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                Days
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight font-mono">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                Hours
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight font-mono">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                Minutes
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-tight font-mono animate-pulse">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                Seconds
              </span>
            </div>
          </div>

          {/* Organizer Announcement */}
          {eventDetails.portalMessage && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl max-w-lg w-full text-left text-xs space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Megaphone size={14} />
                <span>Organizer Announcement</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                {eventDetails.portalMessage}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onGoToHome}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>

            {onViewLivePage && (
              <button
                onClick={() => onViewLivePage(eventDetails.id)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                View Public Event Page
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 3. GATE: User Not Authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <UniversalTopBar
          currentUser={null}
          onGoToHome={onGoToHome}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
          onSignOut={onSignOut}
        />

        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-18 h-18 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl">
            <ShieldCheck size={36} className="stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Verified Attendee Access Only
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              Sign In to Enter the Attendee Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Please sign in with the <strong>exact email address</strong> you used when claiming your ticket for <strong>{eventDetails.title}</strong>.
            </p>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl w-full text-left text-xs space-y-3 backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">Discover and network with other confirmed attendees and industry leaders.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">Bookmark keynote sessions and build your personal conference agenda.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">Navigate interactive 2D floor plans and access fast-track QR door passes.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              onClick={() => onOpenAuth && onOpenAuth("signin")}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Sign In with Ticket Email</span>
            </button>
            <button
              onClick={() => onOpenAuth && onOpenAuth("signup")}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>

          <button
            onClick={onGoToHome}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
        </main>
      </div>
    );
  }

  // 4. GATE: Email Not Registered as Attendee
  if (!isVerifiedAttendee) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-amber-600 selection:text-white">
        <UniversalTopBar
          currentUser={currentUser}
          onGoToHome={onGoToHome}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
          onSignOut={onSignOut}
        />

        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-18 h-18 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
            <AlertCircle size={36} className="stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              No Ticket Found For This Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              Registration Required
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              You are signed in as <strong className="text-white">{currentUser.email}</strong>, but no ticket or attendee registration was found under this email address for <strong>{eventDetails.title}</strong>.
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 text-left space-y-1 w-full max-w-md">
            <p className="font-bold">How to resolve this:</p>
            <p>1. If you registered with another email, please switch accounts.</p>
            <p>2. If you haven&apos;t claimed a pass yet, please get a ticket from the event page.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              onClick={() => onOpenAuth && onOpenAuth("signin")}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Sign In with Different Email</span>
            </button>

            {onViewLivePage && (
              <button
                onClick={() => onViewLivePage(eventDetails.id)}
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Event Tickets</span>
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN ATTENDEE PORTAL DASHBOARD (VERIFIED)
  // ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Universal Top Bar */}
      <UniversalTopBar
        currentUser={currentUser}
        onGoToHome={onGoToHome}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onSignOut={onSignOut}
        onOpenEventsHub={onOpenEventsHub}
      />

      {/* Top Banner when in Organizer Preview Mode */}
      {isOrganizerOrAdmin && (
        <div className="bg-indigo-900 text-indigo-100 px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>
              <strong>Organizer Preview Mode</strong>: You are viewing this portal with full administrator privileges. (Status: {portalStatus.toUpperCase()})
            </span>
          </div>
          <button
            onClick={() => onOpenEventsHub && onOpenEventsHub()}
            className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-xl text-[11px] font-bold text-white transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* Portal Hero Banner Header */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Event Title & Metadata */}
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Attendee Portal
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Verified Access</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                {eventDetails.title || "Summit"}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 font-medium pt-1">
                {eventDetails.startDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-400" />
                    <span>{eventDetails.startDate} {eventDetails.endDate ? `— ${eventDetails.endDate}` : ""}</span>
                  </span>
                )}
                {eventDetails.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-400" />
                    <span>{eventDetails.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Attendee Card, Profile Link & Fast-Track Badge CTA */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-3xl flex items-center gap-4 shadow-xl shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                {attendeeDisplayName.charAt(0).toUpperCase()}
              </div>

              <div className="text-left space-y-0.5">
                <span className="text-xs font-black text-white block">{attendeeDisplayName}</span>
                <span className="text-[11px] text-blue-200 font-bold block">{attendeeTicketType}</span>
                <span className="text-[10px] font-mono text-slate-400 block">{activeBadgeCode}</span>
              </div>

              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => onOpenProfile ? onOpenProfile() : setActiveTab("networking")}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="View / Edit your Eventzone Platform Profile"
                >
                  <User size={13} className="text-blue-300" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => setActiveTab("badge")}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Ticket size={13} className="text-blue-600" />
                  <span>My Pass</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Portal Navigation Sub-Bar */}
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none">
            
            {/* Tab 1: Overview */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Compass size={14} />
              <span>Overview</span>
            </button>

            {/* Tab 2: Agenda */}
            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "agenda"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Calendar size={14} />
              <span>Agenda & Schedule</span>
              {bookmarkedSessionIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-extrabold">
                  {bookmarkedSessionIds.length}
                </span>
              )}
            </button>

            {/* Tab 3: Networking */}
            <button
              onClick={() => setActiveTab("networking")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "networking"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Users size={14} />
              <span>Attendees & Directory</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-extrabold">
                {attendees.length}
              </span>
            </button>

            {/* Tab 3.5: Messages & 1-on-1 Chat */}
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "chat"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <MessageCircle size={14} />
              <span>Messages & Chat</span>
              {chatMessages.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-extrabold">
                  {chatMessages.length}
                </span>
              )}
            </button>

            {/* Tab 4: Exhibitors & Sponsors */}
            <button
              onClick={() => setActiveTab("exhibitors")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "exhibitors"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Building2 size={14} />
              <span>Exhibitors & Sponsors</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-extrabold">
                {sponsors.length + exhibitors.length}
              </span>
            </button>

            {/* Tab 5: Floor Plans */}
            {floorPlans.length > 0 && (
              <button
                onClick={() => setActiveTab("floorplan")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "floorplan"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Layers size={14} />
                <span>Floor Plans</span>
              </button>
            )}

            {/* Tab 6: My Badge */}
            <button
              onClick={() => setActiveTab("badge")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "badge"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Ticket size={14} />
              <span>My Digital Badge</span>
            </button>

            {/* Tab 7: Eventzone Mobile App */}
            <button
              onClick={() => setActiveTab("app")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "app"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Smartphone size={14} />
              <span>Eventzone App</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[9px] font-extrabold uppercase tracking-wider">
                Mobile
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Portal Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW & WELCOME                                             */}
        {/* ==================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Welcome Announcement from Organizer */}
            {eventDetails.portalMessage && (
              <div className="p-6 sm:p-7 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
                    <Megaphone size={16} className="text-amber-400" />
                    <span>Welcome to {eventDetails.title || "Summit"}</span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium leading-relaxed">
                    {eventDetails.portalMessage}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveTab("agenda")}
                    className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    View Agenda
                  </button>
                  <button
                    onClick={() => setActiveTab("networking")}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Start Networking
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Fast-Track Gate Pass */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Ticket size={22} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Official Entry Pass</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Present your fast-track digital QR code at the entrance for instant check-in.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("badge")}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Scannable Pass</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Card 2: Interactive Agenda */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar size={22} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Keynote Sessions</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Explore {sessions.length} scheduled keynotes, workshops, and panel discussions.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("agenda")}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Schedule</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Card 3: Delegate Networking */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={22} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Delegate Networking</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Connect with {attendees.length} industry professionals and exhibitors.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("networking")}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Browse Attendees</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Card 4: Eventzone Mobile App */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center">
                    <Smartphone size={22} />
                  </div>
                  <h3 className="text-base font-black text-white">Eventzone Mobile App</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    NFC contact swapping, live in-app chat, and offline badge passes on your phone.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("app")}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/20"
                >
                  <span>Get Mobile App</span>
                  <ArrowRight size={13} />
                </button>
              </div>

            </div>

            {/* Featured Agenda Highlight */}
            {sessions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    <h3 className="text-base font-black text-slate-900">Featured Agenda Highlights</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("agenda")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All {sessions.length} Sessions →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.slice(0, 4).map(sess => (
                    <div key={sess.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          <Clock size={11} className="text-blue-600" />
                          <span>{sess.time || sess.startTime || "09:00"} {sess.stage ? `• ${sess.stage}` : ""}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{sess.title || sess.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 font-medium mt-0.5">{sess.description || "Interactive keynote and panel presentation."}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {sess.track || "General Track"}
                        </span>
                        <button
                          onClick={() => handleToggleBookmark(sess.id)}
                          className="text-slate-400 hover:text-amber-500 transition-colors p-1 cursor-pointer"
                          title="Bookmark to My Schedule"
                        >
                          {bookmarkedSessionIds.includes(sess.id) ? (
                            <BookmarkCheck size={16} className="text-amber-500 fill-amber-500" />
                          ) : (
                            <Bookmark size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Partners / Sponsors Showcase */}
            {sponsors.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <h3 className="text-base font-black text-slate-900">Featured Summit Partners</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("exhibitors")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All Exhibitors & Sponsors →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {sponsors.slice(0, 6).map(sp => (
                    <div key={sp.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col items-center justify-center text-center gap-2 hover:bg-white hover:border-slate-300 transition-all">
                      {sp.logo ? (
                        <img src={sp.logo} alt={sp.name} className="h-10 w-auto object-contain max-w-[90%]" />
                      ) : (
                        <Building2 size={24} className="text-slate-400" />
                      )}
                      <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{sp.name || sp.companyName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: AGENDA & PERSONAL SCHEDULE                                    */}
        {/* ==================================================================== */}
        {activeTab === "agenda" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Conference Schedule & Agenda</h2>
                <p className="text-xs text-slate-500 font-medium">Filter sessions by track, day, or keyword, and bookmark to build your personal agenda.</p>
              </div>

              {/* Toggle All vs Bookmarked */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
                <button
                  onClick={() => setAgendaViewMode("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    agendaViewMode === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Sessions ({sessions.length})
                </button>
                <button
                  onClick={() => setAgendaViewMode("bookmarked")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    agendaViewMode === "bookmarked" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookmarkCheck size={13} className="text-amber-500" />
                  <span>My Schedule ({bookmarkedSessionIds.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sessions, topics, or speaker names..."
                  value={agendaSearch}
                  onChange={(e) => setAgendaSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 transition-all"
                />
              </div>

              {distinctDays.length > 1 && (
                <div className="w-full sm:w-48">
                  <SearchableSelect
                    value={selectedDay}
                    onChange={setSelectedDay}
                    options={[
                      { value: "all", label: "All Days" },
                      ...distinctDays.map(d => ({ value: d, label: `Day: ${d}` }))
                    ]}
                    placeholder="Filter by Day"
                  />
                </div>
              )}

              {distinctTracks.length > 0 && (
                <div className="w-full sm:w-56">
                  <SearchableSelect
                    value={selectedTrack}
                    onChange={setSelectedTrack}
                    options={[
                      { value: "all", label: "All Tracks & Stages" },
                      ...distinctTracks.map(t => ({ value: t, label: `Track: ${t}` }))
                    ]}
                    placeholder="Filter by Track"
                  />
                </div>
              )}
            </div>

            {/* Sessions Feed */}
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <Calendar size={32} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No sessions match your search</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {agendaViewMode === "bookmarked" 
                    ? "You haven't bookmarked any sessions yet. Click the bookmark icon on any session to add it to your schedule!" 
                    : "Try adjusting your search keywords or clearing track filters."}
                </p>
                {agendaViewMode === "bookmarked" && (
                  <button
                    onClick={() => setAgendaViewMode("all")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Browse All Sessions
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map(sess => {
                  const isBookmarked = bookmarkedSessionIds.includes(sess.id);
                  const speakersList = Array.isArray(sess.speakers) ? sess.speakers : [];

                  return (
                    <div
                      key={sess.id}
                      className={`p-6 bg-white border rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-6 ${
                        isBookmarked ? "border-amber-200 ring-1 ring-amber-400/20" : "border-slate-200"
                      }`}
                    >
                      {/* Left: Time & Track */}
                      <div className="space-y-2 md:w-56 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <Clock size={14} className="text-blue-600" />
                          <span>{sess.time || sess.startTime || "09:00"} {sess.endTime ? `— ${sess.endTime}` : ""}</span>
                        </div>
                        {sess.stage && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <MapPin size={12} className="text-slate-400" />
                            <span>{sess.stage}</span>
                          </div>
                        )}
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                          {sess.track || "General Keynote"}
                        </span>
                      </div>

                      {/* Center: Details & Speakers */}
                      <div className="flex-1 space-y-3">
                        <h3 className="text-base font-black text-slate-900 leading-snug">
                          {sess.title || sess.name}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {sess.description || "Join delegates and key industry leaders for this insightful presentation."}
                        </p>

                        {/* Speaker Avatars */}
                        {speakersList.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Speakers:</span>
                            {speakersList.map((spk, idx) => {
                              const name = typeof spk === "string" ? spk : (spk.name || "Speaker");
                              const avatar = typeof spk === "object" ? spk.avatar || spk.image : "";
                              return (
                                <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                                  {avatar ? (
                                    <img src={avatar} alt={name} className="w-4 h-4 rounded-full object-cover" />
                                  ) : (
                                    <Mic size={12} className="text-blue-600" />
                                  )}
                                  <span>{name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right: Bookmark Action */}
                      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleBookmark(sess.id)}
                          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isBookmarked
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {isBookmarked ? (
                            <>
                              <BookmarkCheck size={14} />
                              <span>In My Schedule</span>
                            </>
                          ) : (
                            <>
                              <Bookmark size={14} />
                              <span>Add to Schedule</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: ATTENDEES & NETWORKING                                        */}
        {/* ==================================================================== */}
        {activeTab === "networking" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Networking Header & Profile Editor Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Attendee Directory & B2B Networking</h2>
                <p className="text-xs text-slate-500 font-medium">Discover delegates, send direct connection requests, and grow your professional network.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingMyProfile(true)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles size={13} className="text-blue-600" />
                  <span>Edit My Networking Profile</span>
                </button>
              </div>
            </div>

            {/* Search & Tab Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search delegates by name, company, or job title..."
                  value={networkingSearch}
                  onChange={(e) => setNetworkingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setNetworkingTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    networkingTab === "all" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All Delegates ({attendees.length})
                </button>
                <button
                  onClick={() => setNetworkingTab("connections")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    networkingTab === "connections" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <UserCheck size={13} />
                  <span>My Connections ({connections.length})</span>
                </button>
              </div>
            </div>

            {/* Attendees Grid */}
            {filteredAttendees.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <Users size={32} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No attendees match your filter</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {networkingTab === "connections" 
                    ? "You haven't established any connections yet. Connect with attendees below to build your conference contact book!"
                    : "Try searching with a different name or organization keyword."}
                </p>
                {networkingTab === "connections" && (
                  <button
                    onClick={() => setNetworkingTab("all")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Browse All Attendees
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAttendees.map(att => {
                  const name = att.name || `${att.firstName || ""} ${att.lastName || ""}`.trim() || "Attendee";
                  const company = att.company || att.organization || "Organization";
                  const job = att.jobTitle || att.job_title || att.role || "Delegate";
                  const isConn = connections.some(c => isMatchingEmail(c.email, att.email));
                  const isPending = requestSentTargetId === (att.id || att.email);

                  return (
                    <div
                      key={att.id || att.email}
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        {/* Avatar & Badges */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {att.avatar || att.image ? (
                              <img src={att.avatar || att.image} alt={name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shadow-2xs">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="text-left min-w-0">
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{name}</h4>
                              <p className="text-xs text-slate-500 font-semibold truncate">{job}</p>
                              <p className="text-[11px] text-blue-600 font-bold truncate">{company}</p>
                            </div>
                          </div>
                        </div>

                        {/* Bio or Interests */}
                        {att.bio && (
                          <p className="text-xs text-slate-600 line-clamp-2 font-medium leading-relaxed">
                            {att.bio}
                          </p>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setSelectedAttendeeForModal(att)}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <User size={12} className="text-slate-500" />
                          <span>Profile</span>
                        </button>

                        <button
                          onClick={() => handleStartChatWith(att)}
                          className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title={`Message ${name}`}
                        >
                          <MessageCircle size={13} />
                          <span>Chat</span>
                        </button>

                        {isConn ? (
                          <div className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Connected</span>
                          </div>
                        ) : isPending ? (
                          <div className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1">
                            <Clock size={13} />
                            <span>Requested</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConnectModalTarget(att)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck size={13} />
                            <span>Connect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3.5: DIRECT MESSAGES & 1-ON-1 CHAT                               */}
        {/* ==================================================================== */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MessageCircle className="text-blue-600" size={22} />
                  <span>Delegate Direct Chat & 1-on-1 Messages</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Connect and message verified delegates in real time during {eventDetails.title || "the summit"}.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("networking")}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Users size={13} className="text-blue-600" />
                  <span>Browse Directory</span>
                </button>
              </div>
            </div>

            {/* Chat Workspace Box */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px] max-h-[700px]">
              
              {/* Left Contacts / Thread List */}
              <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50">
                {/* Search Contacts Bar */}
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search conversations & delegates..."
                      value={chatContactSearch}
                      onChange={(e) => setChatContactSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {chatContactsList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <Users size={24} className="mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No contacts found</p>
                      <button
                        onClick={() => setActiveTab("networking")}
                        className="text-[11px] text-blue-600 font-bold hover:underline"
                      >
                        Browse Attendees
                      </button>
                    </div>
                  ) : (
                    chatContactsList.map(contact => {
                      const isSelected = activeChatContact?.email?.toLowerCase() === contact.email?.toLowerCase();
                      const contactDisplayName = contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Delegate";
                      const contactJob = contact.jobTitle || contact.role || "Delegate";
                      const contactCompany = contact.company || contact.organization || "";

                      return (
                        <button
                          key={contact.email || contact.id}
                          onClick={() => setActiveChatContact(contact)}
                          className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                            isSelected 
                              ? "bg-blue-600 text-white shadow-sm" 
                              : "bg-white hover:bg-slate-100/80 text-slate-800 border border-slate-150"
                          }`}
                        >
                          <div className="relative shrink-0">
                            {contact.avatar || contact.image ? (
                              <img src={contact.avatar || contact.image} alt={contactDisplayName} className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-xs" />
                            ) : (
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                                isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                              }`}>
                                {contactDisplayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className={`text-xs font-black truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                                {contactDisplayName}
                              </h4>
                            </div>
                            <p className={`text-[11px] truncate font-medium ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                              {contactJob} {contactCompany ? `• ${contactCompany}` : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Conversation Window */}
              <div className="flex-1 flex flex-col bg-white">
                {activeChatContact ? (
                  <>
                    {/* Active Contact Header Bar */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {activeChatContact.avatar || activeChatContact.image ? (
                            <img src={activeChatContact.avatar || activeChatContact.image} alt={activeChatContact.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                              {(activeChatContact.name || "D").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>

                        <div className="min-w-0 text-left">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {activeChatContact.name || "Delegate"}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {activeChatContact.jobTitle || activeChatContact.role || "Delegate"} {activeChatContact.company ? `• ${activeChatContact.company}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedAttendeeForModal(activeChatContact)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <User size={12} className="text-blue-600" />
                          <span>View Profile</span>
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                      {activeConversationMessages.length === 0 ? (
                        <div className="py-10 text-center space-y-4 max-w-md mx-auto">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                            <MessageCircle size={28} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-900">
                              Start a conversation with {activeChatContact.name || "this delegate"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              Send an instant message or choose one of the quick icebreakers below:
                            </p>
                          </div>

                          {/* Quick Icebreaker Suggestions */}
                          <div className="flex flex-col gap-2 pt-2 text-left">
                            {[
                              `👋 Hi ${activeChatContact.name || "there"}! Excited to connect with you at ${eventDetails.title || "the summit"}.`,
                              `☕ Would you be open for a quick coffee chat between keynote sessions?`,
                              `📅 Are you attending the featured workshops today?`,
                              `🚀 Loved your work at ${activeChatContact.company || "your organization"} — let's explore synergies!`
                            ].map((icebreaker, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setChatInputText(icebreaker);
                                }}
                                className="p-3 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 transition-all text-left cursor-pointer shadow-2xs"
                              >
                                {icebreaker}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        activeConversationMessages.map((msg, index) => {
                          const isMe = isMatchingEmail(msg.sender_email, currentUser?.email);
                          const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";

                          return (
                            <div
                              key={msg.id || index}
                              className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              {!isMe && (
                                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mb-0.5 overflow-hidden">
                                  {msg.sender_avatar ? (
                                    <img src={msg.sender_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    (msg.sender_name || "D").charAt(0).toUpperCase()
                                  )}
                                </div>
                              )}

                              <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs font-medium space-y-1 shadow-2xs ${
                                isMe 
                                  ? "bg-blue-600 text-white rounded-br-xs" 
                                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                              }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-[10px] text-right font-medium ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                                  {timeStr}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 sm:p-4 border-t border-slate-200 bg-white space-y-2">
                      {/* Emoji Quick Bar */}
                      <div className="flex items-center gap-1 text-base overflow-x-auto pb-1">
                        {["👋", "🤝", "☕", "🚀", "💡", "👍", "👏", "🔥"].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setChatInputText(prev => prev + " " + emoji)}
                            className="px-2 py-1 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          placeholder={`Message ${activeChatContact.name || "delegate"}... (Press Enter to send)`}
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                        />

                        <button
                          type="submit"
                          disabled={!chatInputText.trim() || isSendingMessage}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {isSendingMessage ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send size={13} />
                              <span className="hidden sm:inline">Send</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                    <MessageCircle size={36} className="text-slate-300" />
                    <h3 className="text-base font-black text-slate-800">No Conversation Selected</h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Choose an attendee from the contact list or directory to start chatting.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: EXHIBITORS & SPONSORS                                         */}
        {/* ==================================================================== */}
        {activeTab === "exhibitors" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Exhibitors & Sponsors Showcase</h2>
                <p className="text-xs text-slate-500 font-medium">Explore company demo pods, download brochures, and locate booth locations on the floor plan.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exhibitors or booths..."
                  value={exhibitorSearch}
                  onChange={(e) => setExhibitorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* 1. Sponsors Section */}
            {filteredSponsors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <h3 className="text-base font-black text-slate-900">Official Conference Sponsors</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSponsors.map(sp => (
                    <div key={sp.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {sp.logo ? (
                            <img src={sp.logo} alt={sp.name} className="h-10 w-auto object-contain max-w-[140px]" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                              <Building2 size={20} />
                            </div>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            {sp.tier || "Partner"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900">{sp.name || sp.companyName}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 font-medium mt-1">{sp.description || "Official summit partner and industry innovator."}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        {sp.website && (
                          <a
                            href={sp.website.startsWith("http") ? sp.website : `https://${sp.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5"
                          >
                            <span>Website</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {sp.booth && (
                          <button
                            onClick={() => handleJumpToBooth(sp.booth)}
                            className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Layers size={11} />
                            <span>Booth #{sp.booth}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Exhibitors Section */}
            {filteredExhibitors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-blue-600" />
                  <h3 className="text-base font-black text-slate-900">Exhibition Hall Demo Pods</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExhibitors.map(ex => (
                    <div key={ex.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {ex.logo ? (
                            <img src={ex.logo} alt={ex.name} className="h-10 w-auto object-contain max-w-[140px]" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <Store size={20} />
                            </div>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            Booth #{ex.booth || ex.boothNumber || "TBD"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900">{ex.name || ex.companyName}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 font-medium mt-1">{ex.description || "Live product demonstrations and B2B solutions."}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        {ex.website && (
                          <a
                            href={ex.website.startsWith("http") ? ex.website : `https://${ex.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5"
                          >
                            <span>Website</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {ex.booth && (
                          <button
                            onClick={() => handleJumpToBooth(ex.booth)}
                            className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Layers size={11} />
                            <span>Locate on Map</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: FLOOR PLANS & VENUE MAPS                                      */}
        {/* ==================================================================== */}
        {activeTab === "floorplan" && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Interactive Venue Floor Plans</h2>
                <p className="text-xs text-slate-500 font-medium">Explore expo halls, keynote stages, networking lounges, and exhibitor booths.</p>
              </div>

              {floorPlans.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto">
                  {floorPlans.map((plan, idx) => (
                    <button
                      key={plan.id || idx}
                      onClick={() => setActiveFloorIndex(idx)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeFloorIndex === idx
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {plan.name || `Floor ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Floor Plan Canvas / Image */}
            {activePlan ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {activePlan.name || "Main Exhibition Hall"}
                  </span>
                  {highlightedBooth && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold animate-pulse">
                      Target Booth: #{highlightedBooth}
                    </span>
                  )}
                </div>

                <div className="h-[520px] bg-slate-900/5 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden relative">
                  {activePlan.imageUrl || activePlan.url ? (
                    <img src={activePlan.imageUrl || activePlan.url} alt="Floor Plan" className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <Layers size={48} className="text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-700">Visual Plan Available</h4>
                      <p className="text-xs text-slate-400">Interactive elements configured for this floor plan.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <Layers size={32} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No floor plans published yet</h3>
                <p className="text-xs text-slate-400">The event organizers have not uploaded 2D venue maps yet.</p>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: MY DIGITAL PASS & GATE QR CODE                                 */}
        {/* ==================================================================== */}
        {activeTab === "badge" && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg text-center space-y-6">
              
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                  Verified Ingress Credential
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Fast-Track Gate Pass
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Present this QR code at the registration gate for instant badge printing and badge scan.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl inline-block mx-auto shadow-inner">
                {badgeQrUrl ? (
                  <img src={badgeQrUrl} alt="Badge QR Pass" className="w-56 h-56 object-contain rounded-2xl bg-white p-2 shadow-xs" />
                ) : (
                  <div className="w-56 h-56 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                    <Ticket size={48} className="animate-pulse" />
                  </div>
                )}
              </div>

              {/* Attendee Details Table */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Delegate Name:</span>
                  <span className="font-bold text-slate-900">{attendeeDisplayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Access Tier:</span>
                  <span className="font-bold text-indigo-600">{attendeeTicketType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Badge Code:</span>
                  <span className="font-mono font-bold text-slate-800">{activeBadgeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Event:</span>
                  <span className="font-bold text-slate-800">{eventDetails.title || "Summit"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2">
                <button
                  onClick={handlePrintBadge}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-650/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print Official A4 Badge</span>
                </button>

                <button
                  onClick={() => {
                    const title = encodeURIComponent(eventDetails.title || "Conference Event");
                    const details = encodeURIComponent(`Badge Code: ${activeBadgeCode}\nAccess Tier: ${attendeeTicketType}`);
                    const loc = encodeURIComponent(eventDetails.location || "Venue");
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${loc}`, "_blank");
                  }}
                  className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Calendar size={15} />
                  <span>Add to Calendar</span>
                </button>
              </div>

            </div>

          </div>
        )}



        {/* ==================================================================== */}
        {/* TAB 8: EVENTZONE COMPANION MOBILE APP                                */}
        {/* ==================================================================== */}
        {activeTab === "app" && (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            
            {/* Hero Card */}
            <div className="p-7 sm:p-9 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4 max-w-xl relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Smartphone size={12} />
                    <span>Official Companion App</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                    iOS & Android
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Take {eventDetails.title || "the Summit"} in Your Pocket
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Download the Eventzone Mobile App for fast-track badge check-in, NFC business card exchange, 1-on-1 direct delegate messaging, and live indoor GPS.
                </p>

                {/* Unified Account Callout */}
                <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 size={15} />
                    <span>Single Sign-On (No New Account Needed)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    Simply log in to the mobile app using your registered email <strong className="text-white font-mono">{currentUser?.email || "your ticket email"}</strong>. Your bookmarks, pass, and connections sync automatically.
                  </p>
                </div>

                {/* Quick App Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://apps.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Download on App Store</span>
                    <ExternalLink size={13} className="text-slate-500" />
                  </a>

                  <a
                    href="https://play.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Get it on Google Play</span>
                    <ExternalLink size={13} className="text-slate-400" />
                  </a>
                </div>
              </div>

              {/* QR Code Scanner Box */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 shrink-0 shadow-2xl relative z-10 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-200">Scan to Download App</span>
                <div className="p-3 bg-white rounded-2xl shadow-inner">
                  {appQrUrl ? (
                    <img src={appQrUrl} alt="Download Eventzone App" className="w-36 h-36 object-contain" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                      <Smartphone size={32} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Compatible with iOS & Android</span>
              </div>
            </div>

            {/* Mobile-Exclusive Features Grid */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Why Use the Eventzone Mobile App?</h3>
                <p className="text-xs text-slate-500 font-medium">Engineered for seamless on-site engagement and lightning-fast networking.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Feature 1: NFC & Contact Swapping */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">NFC & Tap-to-Connect</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Tap phones or scan attendee QR badges to instantly exchange verified digital business cards and LinkedIn profiles.
                  </p>
                </div>

                {/* Feature 2: 1-on-1 Direct Chat */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Live 1-on-1 In-App Chat</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Message your accepted delegate connections directly in the app to schedule on-site coffee chats and B2B meetings.
                  </p>
                </div>

                {/* Feature 3: Push Notifications */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Megaphone size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Real-Time Push Alerts</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Get notified 10 minutes before your bookmarked sessions start, plus instant announcements for room or speaker updates.
                  </p>
                </div>

                {/* Feature 4: Indoor Navigation */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Turn-by-Turn Venue GPS</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Interactive 2D/3D map that navigates you straight to sponsor demo pods, keynote auditoriums, and workshop rooms.
                  </p>
                </div>

                {/* Feature 5: Offline Fast-Track Pass */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Ticket size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Offline Scannable Pass</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Save your fast-track badge to Apple Wallet or Google Wallet for lightning check-in even when convention WiFi is spotty.
                  </p>
                </div>

                {/* Feature 6: Schedule Sync */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Native Calendar Sync</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    1-tap sync with your native iOS or Android calendar app with automatic time-zone adjustments.
                  </p>
                </div>

              </div>
            </div>

            {/* 3-Step Setup Guide */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">How to Get Started in 30 Seconds</h3>
                <p className="text-xs text-slate-500 font-medium">No new registration required — use your existing login.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Download the App</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Search &ldquo;Eventzone&rdquo; on the App Store or Google Play, or scan the QR code above.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Sign In with Same Email</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Log in using <span className="font-mono font-bold text-slate-700">{currentUser?.email || "your ticket email"}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Start Networking!</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Open &ldquo;{eventDetails.title || "My Event"}&rdquo; to exchange contacts, chat, and bookmark sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: ATTENDEE PLATFORM PROFILE DETAIL                            */}
      {/* ==================================================================== */}
      {selectedAttendeeForModal && (() => {
        const att = selectedAttendeeForModal;
        const isMe = currentUser?.email && isMatchingEmail(att.email, currentUser.email);
        const name = att.name || `${att.firstName || ""} ${att.lastName || ""}`.trim() || "Delegate";
        const job = att.jobTitle || att.job_title || att.role || "Delegate";
        const comp = att.company || att.organization || "";
        const location = att.location || att.city || "Algiers";
        const isConn = connections.some(c => isMatchingEmail(c.email, att.email));

        // Parse looking for
        let lookingForList = [];
        if (Array.isArray(att.what_im_looking_for)) lookingForList = att.what_im_looking_for;
        else if (Array.isArray(att.whatImLookingFor)) lookingForList = att.whatImLookingFor;
        else if (typeof att.what_im_looking_for === "string" && att.what_im_looking_for.trim()) {
          lookingForList = att.what_im_looking_for.split(",").map(s => s.trim()).filter(Boolean);
        } else if (typeof att.whatImLookingFor === "string" && att.whatImLookingFor.trim()) {
          lookingForList = att.whatImLookingFor.split(",").map(s => s.trim()).filter(Boolean);
        }

        // Parse interests
        let interestsList = [];
        if (Array.isArray(att.interests)) interestsList = att.interests;
        else if (typeof att.interests === "string" && att.interests.trim()) {
          interestsList = att.interests.split(",").map(s => s.trim()).filter(Boolean);
        }

        // Parse social links
        const socialLinks = att.social_links || att.socialLinks || {};

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 text-left space-y-5 animate-scale-up relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedAttendeeForModal(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold z-10"
              >
                ✕
              </button>

              {/* Profile Card Header (Eventzone Style) */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="relative">
                  {att.avatar || att.image || (isMe && currentUser?.avatar) ? (
                    <img
                      src={att.avatar || att.image || currentUser?.avatar}
                      alt={name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md mx-auto">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full shadow-xs border-2 border-white">
                    <ShieldCheck size={14} />
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-lg font-black text-slate-900">{name}</h3>
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-4 h-4 shrink-0 inline-block" 
                      title="Verified Account"
                      aria-label="Verified Account"
                    >
                      <path 
                        fill="#0095F6" 
                        d="M12.001 2.002c-.85 0-1.68.32-2.31.91l-1.39 1.28c-.46.42-1.04.66-1.66.67l-1.89.04c-.87.02-1.69.46-2.2 1.18-.51.72-.65 1.62-.38 2.45l.6 1.83c.2.6.2 1.25 0 1.85l-.6 1.83c-.27.83-.13 1.73.38 2.45.51.72 1.33 1.16 2.2 1.18l1.89.04c.62.01 1.2.25 1.66.67l1.39 1.28c.63.59 1.46.91 2.31.91s1.68-.32 2.31-.91l1.39-1.28c.46-.42 1.04-.66 1.66-.67l1.89-.04c.87-.02 1.69-.46 2.2-1.18.51-.72.65-1.62.38-2.45l-.6-1.83c-.2-.6-.2-1.25 0-1.85l.6-1.83c.27-.83.13-1.73-.38-2.45-.51-.72-1.33-1.16-2.2-1.18l-1.89-.04c-.62-.01-1.2-.25-1.66-.67l-1.39-1.28c-.63-.59-1.46-.91-2.31-.91z"
                      />
                      <path 
                        fill="#ffffff" 
                        d="M10.4 15.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.8-4.8 1.4 1.4-6.2 6.2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-600">{job} {comp ? `at ${comp}` : ""}</p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium pt-0.5">
                    {location && <span>{location}</span>}
                    {att.email && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 font-mono">{att.email}</span>
                      </>
                    )}
                    {att.phone && (
                      <>
                        <span>•</span>
                        <span>{att.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stat Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold">
                    Eventzone Profile
                  </span>
                  {lookingForList.length > 0 && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold">
                      {lookingForList.length} Looking For
                    </span>
                  )}
                  {interestsList.length > 0 && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold">
                      {interestsList.length} Interests
                    </span>
                  )}
                </div>
              </div>

              {/* Bio / About */}
              {att.bio && (
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About & Background</span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {att.bio}
                  </p>
                </div>
              )}

              {/* What I'm Looking For Section */}
              {lookingForList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What I&apos;m Looking For</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lookingForList.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-xl text-xs font-bold">
                        🎯 {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests & Matchmaking Section */}
              {interestsList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interests & Matchmaking</span>
                  <div className="flex flex-wrap gap-1.5">
                    {interestsList.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200/60 rounded-xl text-xs font-bold">
                        💡 {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connect & Social Links</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(socialLinks).filter(([, url]) => Boolean(url)).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={String(url).startsWith("http") ? String(url) : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <ExternalLink size={12} className="text-slate-400" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-150 flex flex-wrap gap-2">
                {isMe ? (
                  <button
                    onClick={() => {
                      setSelectedAttendeeForModal(null);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <User size={14} />
                    <span>Edit My Platform Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartChatWith(att)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle size={14} />
                      <span>Start 1-on-1 Chat</span>
                    </button>

                    {isConn ? (
                      <div className="px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 size={14} />
                        <span>Connected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const target = att;
                          setSelectedAttendeeForModal(null);
                          setConnectModalTarget(target);
                        }}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <UserCheck size={14} />
                        <span>Connect</span>
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* MODAL 2: SEND CONNECTION REQUEST                                     */}
      {/* ==================================================================== */}
      {connectModalTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-left space-y-5 animate-scale-up relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Connect with {connectModalTarget.name || connectModalTarget.firstName || "Delegate"}</h3>
              </div>
              <button
                onClick={() => setConnectModalTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendConnection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Introduction Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  placeholder="Hi! I'd love to connect and discuss potential synergies during the summit..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConnectModalTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingRequest}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingRequest ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck size={14} />
                      <span>Confirm & Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: EDIT MY NETWORKING PROFILE                                  */}
      {/* ==================================================================== */}
      {isEditingMyProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 text-left space-y-5 animate-scale-up relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Edit My Networking Profile</h3>
              </div>
              <button
                onClick={() => setIsEditingMyProfile(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMyProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Title / Headline
                </label>
                <input
                  type="text"
                  value={myHeadline}
                  onChange={(e) => setMyHeadline(e.target.value)}
                  placeholder="e.g. Chief Executive Officer, AI Specialist..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={myCompany}
                  onChange={(e) => setMyCompany(e.target.value)}
                  placeholder="e.g. Acme Innovations Corp"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={myBio}
                  onChange={(e) => setMyBio(e.target.value)}
                  placeholder="Tell delegates about your expertise and focus..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  What I&apos;m Looking For
                </label>
                <input
                  type="text"
                  value={myLookingFor}
                  onChange={(e) => setMyLookingFor(e.target.value)}
                  placeholder="e.g. B2B Partnerships, Investors, Tech Vendors..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMyProfile(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
