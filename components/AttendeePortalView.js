/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Globe, Sparkles, Calendar, Clock, MapPin, Users, Building2,
  Layers, Ticket, FileText, Bookmark, BookmarkCheck, Search,
  Filter, Check, CheckCircle2, X, ExternalLink, Download,
  Printer, ArrowLeft, ArrowRight, Share2, Mail, Phone,
  MessageSquare, UserCheck, ShieldCheck, Lock, Unlock, Eye,
  Compass, Megaphone, Store, Mic, Tag, ChevronDown, ChevronRight,
  Info, AlertCircle, Heart, Smartphone, RefreshCw, LogIn, UserPlus,
  Send, MessageCircle, Smile, User, Loader2, UserMinus, UserX, Trash2,
  ZoomIn, ZoomOut, Maximize, RotateCcw, CalendarCheck, CalendarPlus, CalendarX
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import UniversalTopBar from "./UniversalTopBar";
import SearchableSelect from "./SearchableSelect";
import A4BadgeSheet, { printA4BadgeDocument } from "./A4BadgeSheet";

const FloorPlanCanvas = dynamic(() => import("./FloorPlanCanvas"), { ssr: false });
import {
  fetchAttendeeConnections,
  sendAttendeeConnectionRequest,
  acceptAttendeeConnectionRequest,
  declineAttendeeConnectionRequest,
  removeAttendeeConnection,
  cancelAttendeeConnectionRequest,
  fetchAttendeeMeetings,
  bookAttendeeMeeting,
  acceptAttendeeMeeting,
  declineAttendeeMeeting,
  cancelAttendeeMeeting,
  fetchMeetingBookedSlots,
  fetchSessionBookmarks,
  toggleSessionBookmark,
  fetchEventChatMessages,
  sendEventChatMessage,
  upsertUserProfile,
  isMatchingEmail
} from "../lib/db";

function InstagramVerifiedBadge({ size = 15, className = "" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={`shrink-0 inline-block ${className}`} 
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
  );
}

function getLocalizedTicketTierName(name, t) {
  if (!name || typeof name !== 'string') return name || "";
  const key = 'tickets.tier_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (t) {
    const val = t(key, null);
    if (val && val !== key && val !== null) return val;
  }
  return name;
}

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

  // Organizer preview toggle (allows organizers to preview the closed screen as visitors see it)
  const [organizerPreviewAsVisitor, setOrganizerPreviewAsVisitor] = useState(false);
  const effectiveIsOrganizerOrAdmin = isOrganizerOrAdmin && !organizerPreviewAsVisitor;

  // Portal Status & Scheduled Countdown
  const portalSettings = useMemo(() => {
    return eventDetails.portalSettings || eventDetails.portal_settings || {};
  }, [eventDetails]);

  const rawPortalStatus = eventDetails.portalStatus || eventDetails.portal_status || portalSettings.portal_status || portalSettings.portalStatus || "open";
  const portalStatus = String(rawPortalStatus || "open").toLowerCase().trim();
  const portalOpenTimeStr = eventDetails.portalOpenTime || eventDetails.portal_open_time || portalSettings.portal_open_time || portalSettings.portalOpenTime;
  const portalMessage = eventDetails.portalMessage || eventDetails.portal_message || portalSettings.portal_message || portalSettings.portalMessage || "";
  const portalNoticeMessage = portalMessage;

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
  const isPortalClosedForAttendee = (portalStatus === "closed" || isScheduledInFuture) && !effectiveIsOrganizerOrAdmin;

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
  const [networkingTab, setNetworkingTab] = useState("all"); // "all" | "connections" | "invitations"
  const [connections, setConnections] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [chatNoticeError, setChatNoticeError] = useState("");
  const [selectedAttendeeForModal, setSelectedAttendeeForModal] = useState(null);
  
  // Connection Request Dialog
  const [connectModalTarget, setConnectModalTarget] = useState(null);
  const [connectNote, setConnectNote] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentTargetId, setRequestSentTargetId] = useState(null);

  // Remove Connection Confirmation Dialog
  const [disconnectModalTarget, setDisconnectModalTarget] = useState(null);
  const [isRemovingConnection, setIsRemovingConnection] = useState(false);

  // Edit My Profile Drawer
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [myHeadline, setMyHeadline] = useState(currentUser?.jobTitle || matchingAttendee?.jobTitle || "");
  const [myCompany, setMyCompany] = useState(currentUser?.companyName || matchingAttendee?.company || "");
  const [myBio, setMyBio] = useState(currentUser?.bio || "");
  const [myLookingFor, setMyLookingFor] = useState(currentUser?.what_im_looking_for || currentUser?.whatImLookingFor || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [activeChatContact, setActiveChatContact] = useState(null);
  const [chatInputText, setChatInputText] = useState("");
  const [chatContactSearch, setChatContactSearch] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatContainerRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const prevContactRef = useRef(null);

  // ─────────────────────────────────────────────
  // 3.8. STATE: 1-ON-1 ATTENDEE MEETINGS
  // ─────────────────────────────────────────────
  const [meetings, setMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [meetingsSubTab, setMeetingsSubTab] = useState("upcoming"); // "upcoming" | "pending" | "past"
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [isProcessingMeetingAction, setIsProcessingMeetingAction] = useState(false);

  // Meeting Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingTargetAttendee, setBookingTargetAttendee] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(30);
  const [bookingLocation, setBookingLocation] = useState("Networking Lounge");
  const [bookingCustomLocation, setBookingCustomLocation] = useState("");
  const [bookingTitle, setBookingTitle] = useState("1-on-1 Networking Meeting");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false);

  // Load & Refresh Connections & Invitations
  const loadConnectionsData = async () => {
    if (!currentUser || !eventDetails?.id) return;
    try {
      const data = await fetchAttendeeConnections(currentUser, eventDetails.id);
      if (data) {
        setConnections(Array.isArray(data.connections) ? data.connections : (Array.isArray(data) ? data : []));
        setPendingSent(Array.isArray(data.pendingSent) ? data.pendingSent : []);
        setPendingReceived(Array.isArray(data.pendingReceived) ? data.pendingReceived : []);
      }
    } catch (err) {
      console.warn("Error loading connections:", err);
    }
  };

  // Load & Refresh Chat Messages
  const loadChatData = async () => {
    if (!currentUser || !eventDetails?.id) return;
    try {
      const msgs = await fetchEventChatMessages(currentUser, eventDetails.id);
      if (msgs && Array.isArray(msgs)) {
        setChatMessages(prev => {
          if (prev.length === msgs.length && prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id) {
            return prev;
          }
          return msgs;
        });
      }
    } catch (err) {
      console.warn("Error loading chat messages:", err);
    }
  };

  // Load & Refresh 1-on-1 Meetings
  const loadMeetingsData = async () => {
    if (!currentUser || !eventDetails?.id) return;
    setIsLoadingMeetings(true);
    try {
      const data = await fetchAttendeeMeetings(currentUser, eventDetails.id);
      if (data) {
        setMeetings(data.meetings || []);
        setUpcomingMeetings(data.upcoming || []);
        setPendingMeetings(data.pending || []);
        setPastMeetings(data.past || []);
      }
    } catch (err) {
      console.warn("Error loading meetings:", err);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  // Zero-egress intelligent visibility & on-demand polling
  useEffect(() => {
    if (!currentUser || !eventDetails?.id) return;

    // Initial load
    loadConnectionsData();
    loadMeetingsData();
    if (activeChatContact) {
      loadChatData();
    }

    // Refresh immediately when returning to tab
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadConnectionsData();
        loadMeetingsData();
        if (activeChatContact) {
          loadChatData();
        }
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Chat polling: Only if an active chat session is open and tab is visible (10s throttle)
    let chatInterval = null;
    if (activeChatContact) {
      chatInterval = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          loadChatData();
        }
      }, 10000);
    }

    // Connections polling: Background update every 60 seconds, only when tab is visible
    const connInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadConnectionsData();
      }
    }, 60000);

    // Meetings polling: Background update every 30 seconds, only when tab is visible
    const meetingInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadMeetingsData();
      }
    }, 30000);

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (chatInterval) clearInterval(chatInterval);
      clearInterval(connInterval);
      clearInterval(meetingInterval);
    };
  }, [currentUser?.id, currentUser?.email, eventDetails?.id, activeChatContact?.id, activeChatContact?.email]);

  const handleSendConnection = async (e) => {
    e.preventDefault();
    if (!connectModalTarget || !currentUser) return;
    setIsSendingRequest(true);
    try {
      const res = await sendAttendeeConnectionRequest(currentUser, connectModalTarget, eventDetails.id, connectNote);
      if (res) {
        setRequestSentTargetId(connectModalTarget.id || connectModalTarget.email);
        await loadConnectionsData();
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

  const handleAcceptConnection = async (connectionId, attendee) => {
    if (!connectionId || !eventDetails?.id) return;
    setIsProcessingAction(true);
    try {
      const res = await acceptAttendeeConnectionRequest(connectionId, eventDetails.id);
      if (res) {
        await loadConnectionsData();
        if (selectedAttendeeForModal?.id === attendee?.id || isMatchingEmail(selectedAttendeeForModal?.email, attendee?.email)) {
          setSelectedAttendeeForModal(null);
        }
      }
    } catch (err) {
      console.warn("Error accepting connection:", err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeclineConnection = async (connectionId) => {
    if (!connectionId || !eventDetails?.id) return;
    setIsProcessingAction(true);
    try {
      const res = await declineAttendeeConnectionRequest(connectionId, eventDetails.id);
      if (res) {
        await loadConnectionsData();
        setSelectedAttendeeForModal(null);
      }
    } catch (err) {
      console.warn("Error declining connection:", err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenDisconnectModal = (attendee, connectionId = null) => {
    if (!attendee) return;
    const foundConn = connections.find(c => isMatchingEmail(c.email, attendee.email) || (c.partnerId && c.partnerId === attendee.id));
    const targetConnId = connectionId || foundConn?.connectionId || foundConn?.id || attendee.connectionId || attendee.id;
    setDisconnectModalTarget({
      connectionId: targetConnId,
      attendee,
      name: attendee.name || attendee.fullName || `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim() || "Delegate",
      email: attendee.email
    });
  };

  const handleConfirmRemoveConnection = async () => {
    if (!disconnectModalTarget || !eventDetails?.id) return;
    setIsRemovingConnection(true);
    try {
      const { connectionId, attendee, email } = disconnectModalTarget;
      await removeAttendeeConnection(connectionId, eventDetails.id, email);

      if (activeChatContact && (isMatchingEmail(activeChatContact.email, email) || activeChatContact.id === attendee?.id)) {
        setActiveChatContact(null);
      }

      if (selectedAttendeeForModal && (isMatchingEmail(selectedAttendeeForModal.email, email) || selectedAttendeeForModal.id === attendee?.id)) {
        setSelectedAttendeeForModal(null);
      }

      await loadConnectionsData();
      setDisconnectModalTarget(null);
    } catch (err) {
      console.warn("Error removing connection:", err);
    } finally {
      setIsRemovingConnection(false);
    }
  };

  const handleCancelSentInvitation = async (invitationId, recipientEmail) => {
    if (!invitationId || !eventDetails?.id) return;
    setIsProcessingAction(true);
    try {
      await cancelAttendeeConnectionRequest(invitationId, eventDetails.id, recipientEmail);
      await loadConnectionsData();
    } catch (err) {
      console.warn("Error cancelling sent invitation:", err);
    } finally {
      setIsProcessingAction(false);
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
  // 3.9. COMPUTED: EVENT DAYS, OPERATING HOURS & MEETING ACTIONS
  // ─────────────────────────────────────────────
  const eventAvailableDays = useMemo(() => {
    const dates = [];
    const startStr = eventDetails.startDate || eventDetails.start_date || eventDetails.date;
    const endStr = eventDetails.endDate || eventDetails.end_date || startStr;

    if (startStr) {
      const startDate = new Date(startStr);
      const endDate = endStr ? new Date(endStr) : startDate;

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const cur = new Date(startDate);
        let count = 0;
        while (cur <= endDate && count < 30) {
          dates.push(cur.toISOString().split("T")[0]);
          cur.setDate(cur.getDate() + 1);
          count++;
        }
      }
    }

    if (Array.isArray(sessions)) {
      sessions.forEach(s => {
        const sDate = s.date || s.session_date;
        if (sDate && !dates.includes(sDate)) {
          dates.push(sDate);
        }
      });
    }

    dates.sort();
    return dates.length > 0 ? dates : [new Date().toISOString().split("T")[0]];
  }, [eventDetails, sessions]);

  const eventOperatingHours = useMemo(() => {
    let startHour = 9;
    let endHour = 18;

    const timeStr = eventDetails.scheduleTime || eventDetails.schedule_time || "";
    if (timeStr) {
      const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—to]+\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (match) {
        let sh = parseInt(match[1], 10);
        const sampm = match[3]?.toUpperCase();
        if (sampm === "PM" && sh < 12) sh += 12;
        if (sampm === "AM" && sh === 12) sh = 0;

        let eh = parseInt(match[4], 10);
        const eampm = match[6]?.toUpperCase();
        if (eampm === "PM" && eh < 12) eh += 12;
        if (eampm === "AM" && eh === 12) eh = 0;

        if (sh >= 0 && sh <= 23 && eh > sh && eh <= 24) {
          startHour = sh;
          endHour = eh;
        }
      }
    }

    const slots = [];
    for (let h = startHour; h < endHour; h++) {
      const hStr = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${hStr}:00`);
      slots.push(`${hStr}:30`);
    }
    return slots;
  }, [eventDetails]);

  // Fetch booked slots when booking modal opens or booking date changes
  useEffect(() => {
    if (!isBookingModalOpen || !bookingDate || !eventDetails?.id) return;

    let isMounted = true;
    setIsLoadingBookedSlots(true);
    const userIds = [
      currentUser?.id,
      bookingTargetAttendee?.id || bookingTargetAttendee?.partnerId || bookingTargetAttendee?.connected_user_id
    ].filter(Boolean);

    fetchMeetingBookedSlots(eventDetails.id, bookingDate, userIds)
      .then(slots => {
        if (isMounted) {
          setBookedSlots(Array.isArray(slots) ? slots : []);
          setIsLoadingBookedSlots(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingBookedSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isBookingModalOpen, bookingDate, eventDetails?.id, currentUser?.id, bookingTargetAttendee?.id, bookingTargetAttendee?.partnerId, bookingTargetAttendee?.connected_user_id]);

  const handleOpenBookingModal = (attendee) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth("signin");
      return;
    }
    if (!attendee) return;

    // Check if connected
    const isConn = connections.some(c => 
      isMatchingEmail(c.email, attendee.email) || 
      (c.partnerId && (c.partnerId === attendee.id || c.partnerId === attendee.connected_user_id))
    );

    if (!isConn) {
      setSelectedAttendeeForModal(null);
      setConnectModalTarget(attendee);
      return;
    }

    setBookingTargetAttendee(attendee);
    const initialDate = eventAvailableDays[0] || new Date().toISOString().split("T")[0];
    setBookingDate(initialDate);
    setBookingStartTime("");
    setBookingDuration(30);
    setBookingLocation("Networking Lounge");
    setBookingCustomLocation("");
    setBookingTitle("1-on-1 Networking Meeting");
    setBookingNote("");
    setBookingError("");
    setIsBookingModalOpen(true);
    setSelectedAttendeeForModal(null);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!bookingTargetAttendee || !currentUser || !eventDetails?.id) return;

    if (!bookingDate) {
      setBookingError(t("portal.errorSelectDate", "Please select an event day for the meeting."));
      return;
    }
    if (!bookingStartTime) {
      setBookingError(t("portal.errorSelectTime", "Please select a time slot."));
      return;
    }

    const [startH, startM] = bookingStartTime.split(":").map(Number);
    const endMinutesTotal = startH * 60 + startM + Number(bookingDuration || 30);
    const endH = Math.floor(endMinutesTotal / 60);
    const endM = endMinutesTotal % 60;
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    const finalLocation = bookingLocation === "Custom Location" ? (bookingCustomLocation.trim() || "Event Venue") : bookingLocation;

    setIsSubmittingMeeting(true);
    setBookingError("");

    try {
      const res = await bookAttendeeMeeting(currentUser, bookingTargetAttendee, eventDetails.id, {
        date: bookingDate,
        startTime: bookingStartTime,
        endTime,
        duration: Number(bookingDuration || 30),
        location: finalLocation,
        title: bookingTitle.trim() || "1-on-1 Networking Meeting",
        note: bookingNote.trim()
      });

      if (res.error) {
        setBookingError(res.error);
        setIsSubmittingMeeting(false);
        return;
      }

      await loadMeetingsData();
      setIsBookingModalOpen(false);
      setBookingTargetAttendee(null);
      setActiveTab("meetings");
      setMeetingsSubTab("pending");
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Failed to book meeting. Please try again.");
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  const handleAcceptMeeting = async (meetingId) => {
    if (!meetingId || !eventDetails?.id) return;
    setIsProcessingMeetingAction(true);
    try {
      const ok = await acceptAttendeeMeeting(meetingId, eventDetails.id);
      if (ok) {
        await loadMeetingsData();
      }
    } catch (err) {
      console.warn("Error accepting meeting:", err);
    } finally {
      setIsProcessingMeetingAction(false);
    }
  };

  const handleDeclineMeeting = async (meetingId) => {
    if (!meetingId || !eventDetails?.id) return;
    setIsProcessingMeetingAction(true);
    try {
      const ok = await declineAttendeeMeeting(meetingId, eventDetails.id);
      if (ok) {
        await loadMeetingsData();
      }
    } catch (err) {
      console.warn("Error declining meeting:", err);
    } finally {
      setIsProcessingMeetingAction(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!meetingId || !eventDetails?.id) return;
    setIsProcessingMeetingAction(true);
    try {
      const ok = await cancelAttendeeMeeting(meetingId, eventDetails.id);
      if (ok) {
        await loadMeetingsData();
      }
    } catch (err) {
      console.warn("Error cancelling meeting:", err);
    } finally {
      setIsProcessingMeetingAction(false);
    }
  };

  // ─────────────────────────────────────────────
  // 3.5. STATE: DIRECT CHAT & 1-ON-1 MESSAGING
  // ─────────────────────────────────────────────
  // Direct chat & 1-on-1 messaging state declared above with loadChatData

  // Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !activeChatContact || !currentUser) return;
    
    // Connection Guard: only accepted connections can exchange messages
    const contactEmail = (activeChatContact.email || "").toLowerCase();
    const isConn = connections.some(c => 
      (c.email || "").toLowerCase() === contactEmail || 
      (c.partnerId && c.partnerId === activeChatContact.id)
    );

    if (!isConn) {
      setChatNoticeError(t("portal.mustConnectBeforeMessaging", "You can only message delegates you are connected with. Please send an invitation to connect first."));
      return;
    }
    setChatNoticeError("");

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
      if (err.notConnected) {
        setChatNoticeError(err.message || t("portal.mustConnectBeforeMessaging", "You can only message delegates you are connected with."));
      }
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

  // Scroll inner chat container only (preventing the browser page window from scrolling down on its own)
  useEffect(() => {
    if (activeTab !== "chat" || !activeChatContact) return;

    const currentContactEmail = activeChatContact.email?.toLowerCase();
    const contactChanged = prevContactRef.current !== currentContactEmail;
    const currentMsgCount = activeConversationMessages.length;
    const hasNewMessages = currentMsgCount > prevMsgCountRef.current;

    prevContactRef.current = currentContactEmail;
    prevMsgCountRef.current = currentMsgCount;

    if (contactChanged) {
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (hasNewMessages) {
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeConversationMessages.length, activeChatContact?.email, activeTab]);

  // List of contacts with whom the user can chat (STRICTLY accepted connections)
  const chatContactsList = useMemo(() => {
    const map = new Map();

    // Only add confirmed accepted connections
    connections.forEach(c => {
      if (c.email) {
        const foundAttendee = attendees.find(a => isMatchingEmail(a.email, c.email));
        map.set(c.email.toLowerCase(), {
          id: c.partnerId || foundAttendee?.id || c.id,
          email: c.email.toLowerCase(),
          name: c.name || foundAttendee?.name || `${foundAttendee?.firstName || ""} ${foundAttendee?.lastName || ""}`.trim() || "Delegate",
          avatar: c.avatar || foundAttendee?.avatar || foundAttendee?.image || "",
          jobTitle: c.jobTitle || foundAttendee?.jobTitle || foundAttendee?.role || "Delegate",
          company: c.company || foundAttendee?.company || "",
          isConnection: true
        });
      }
    });

    const arr = Array.from(map.values());
    if (!chatContactSearch) return arr;
    const q = chatContactSearch.toLowerCase();
    return arr.filter(c => 
      (c.name || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.jobTitle || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }, [connections, attendees, chatContactSearch]);

  // Set initial active chat contact or keep synced with valid connections
  useEffect(() => {
    if (activeChatContact) {
      const exists = chatContactsList.some(c => isMatchingEmail(c.email, activeChatContact.email));
      if (!exists) {
        setActiveChatContact(chatContactsList[0] || null);
      }
    } else if (chatContactsList.length > 0) {
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
  const isFloorplansEnabled = portalSettings.floorplans !== false;

  // Filter floor plans to only those selected by organizer to show attendees
  const visibleFloorPlans = useMemo(() => {
    const validPlans = (floorPlans || []).filter(p => !p.isArchived && p.status !== "archived");
    if (Array.isArray(portalSettings.visibleFloorPlanIds)) {
      return validPlans.filter(p => portalSettings.visibleFloorPlanIds.includes(p.id));
    }
    return validPlans;
  }, [floorPlans, portalSettings.visibleFloorPlanIds]);

  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [subFloorIndex, setSubFloorIndex] = useState(0);
  const [floorPlanSearch, setFloorPlanSearch] = useState("");
  const [selectedBoothElementId, setSelectedBoothElementId] = useState(null);
  const [highlightedBooth, setHighlightedBooth] = useState(null);
  const canvasRef = useRef(null);

  const activePlan = visibleFloorPlans[activeFloorIndex] || visibleFloorPlans[0] || null;

  // Sub-floors for active plan (e.g. Ground Floor, 1st Floor, etc.)
  const activePlanFloors = useMemo(() => {
    if (activePlan?.floors && Array.isArray(activePlan.floors) && activePlan.floors.length > 0) {
      return activePlan.floors;
    }
    return [
      {
        id: "default-subfloor",
        name: activePlan?.name || "Main Floor",
        elements: activePlan?.elements || [],
        blueprint: activePlan?.blueprint || null
      }
    ];
  }, [activePlan]);

  const activeSubFloor = activePlanFloors[subFloorIndex] || activePlanFloors[0] || {};
  const currentElements = activeSubFloor?.elements || activePlan?.elements || [];
  const currentBlueprint = activeSubFloor?.blueprint || activePlan?.blueprint || {};
  const blueprintUrl = currentBlueprint?.url || activePlan?.imageUrl || activePlan?.url || activePlan?.background_url || "";

  // Reset sub-floor and selection when active floor plan changes
  useEffect(() => {
    setSubFloorIndex(0);
    setSelectedBoothElementId(null);
  }, [activeFloorIndex]);

  // Selected element on canvas
  const selectedElement = useMemo(() => {
    if (!selectedBoothElementId) return null;
    return currentElements.find(el => el.id === selectedBoothElementId) || null;
  }, [selectedBoothElementId, currentElements]);

  // Exhibitor associated with selected booth
  const selectedBoothExhibitor = useMemo(() => {
    if (!selectedElement) return null;
    if (selectedElement.exhibitorId) {
      return exhibitors.find(ex => String(ex.id) === String(selectedElement.exhibitorId)) || null;
    }
    const elLabel = String(selectedElement.label || selectedElement.boothNumber || "").trim().toLowerCase();
    if (elLabel) {
      return exhibitors.find(ex => {
        const exBooth = String(ex.boothNumber || ex.booth_number || ex.booth || "").trim().toLowerCase();
        return exBooth === elLabel;
      }) || null;
    }
    return null;
  }, [selectedElement, exhibitors]);

  const handleJumpToBooth = (boothNum) => {
    if (!boothNum) return;
    setHighlightedBooth(boothNum);
    setActiveTab("floorplan");

    const cleanNum = String(boothNum).trim().toLowerCase();
    for (let pIdx = 0; pIdx < visibleFloorPlans.length; pIdx++) {
      const plan = visibleFloorPlans[pIdx];
      const pFloors = (plan.floors && Array.isArray(plan.floors) && plan.floors.length > 0)
        ? plan.floors
        : [{ id: "def", elements: plan.elements || [] }];

      for (let sIdx = 0; sIdx < pFloors.length; sIdx++) {
        const floor = pFloors[sIdx];
        const match = (floor.elements || []).find(el => {
          const lbl = String(el.label || el.boothNumber || el.booth_number || "").trim().toLowerCase();
          return lbl === cleanNum || String(el.id) === cleanNum;
        });
        if (match) {
          setActiveFloorIndex(pIdx);
          setSubFloorIndex(sIdx);
          setSelectedBoothElementId(match.id);
          setTimeout(() => {
            canvasRef.current?.zoomToElement?.(match.id);
          }, 350);
          return;
        }
      }
    }
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
    const matchedTicket = (tickets || []).find(t => 
      (t.name || t.tier || "").trim().toLowerCase() === (attendeeTicketType || "").trim().toLowerCase()
    ) || (tickets || [])[0] || {};
    const badgeTemplateUrl = matchingAttendee?.templateUrl || matchingAttendee?.badgeUrl || matchedTicket?.badgeUrl || eventDetails.badgeUrl || "";
    const badgeSettings = matchedTicket?.badgeSettings || eventDetails.badgeSettings || {};

    printA4BadgeDocument({
      templateUrl: badgeTemplateUrl,
      attendeeName: attendeeDisplayName,
      attendeePhoto: currentUser?.avatar || matchingAttendee?.image || "",
      attendeeCompany: currentUser?.companyName || matchingAttendee?.company || "",
      attendeeJobTitle: currentUser?.jobTitle || matchingAttendee?.jobTitle || "",
      ticketType: attendeeTicketType,
      badgeCode: activeBadgeCode,
      eventTitle: eventDetails.title || "Summit",
      qrCodeUrl: badgeQrUrl,
      showFoldGuide: badgeSettings.showFoldGuide !== false,
      showPhoto: badgeSettings.showPhoto !== false,
      showQr: badgeSettings.showQr !== false,
      cardTheme: badgeSettings.cardTheme || "white"
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
  if (portalStatus === "closed" && !effectiveIsOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-rose-600 selection:text-white">
        {isOrganizerOrAdmin && (
          <div className="w-full bg-rose-950/95 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-rose-400 shrink-0" />
              <span><strong>Organizer Preview Mode:</strong> Viewing the "Portal Closed" screen exactly as visitors and delegates see it.</span>
            </div>
            <button
              onClick={() => setOrganizerPreviewAsVisitor(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs cursor-pointer transition-all"
            >
              Exit Visitor Preview
            </button>
          </div>
        )}

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
          {Boolean(portalMessage) && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl max-w-lg w-full text-start text-xs space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <Megaphone size={14} />
                <span>{t("portal.noticeFromOrganizer", "Notice from Event Organizer")}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                {portalMessage}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGoToHome}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>{t("portal.backToEventsHub", "Back to Events Hub")}</span>
            </button>

            {onViewLivePage && (
              <button
                onClick={() => onViewLivePage(eventDetails.id)}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {t("portal.viewPublicEventPage", "View Public Event Page")}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 2. GATE: Scheduled Opening Countdown
  if (isScheduledInFuture && !effectiveIsOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {isOrganizerOrAdmin && (
          <div className="w-full bg-indigo-950/95 border-b border-indigo-500/30 px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-indigo-400 shrink-0" />
              <span><strong>Organizer Preview Mode:</strong> Viewing the "Portal Countdown" screen exactly as visitors and delegates see it.</span>
            </div>
            <button
              onClick={() => setOrganizerPreviewAsVisitor(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs cursor-pointer transition-all"
            >
              Exit Visitor Preview
            </button>
          </div>
        )}

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
              <span>{t("portal.portalOpeningSoon", "Attendee Portal Opening Soon")}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {eventDetails.title || "Summit"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {t("portal.portalUnlockCountdown", "The interactive attendee portal will unlock for all registered delegates when the countdown reaches zero.")}
            </p>
          </div>

          {/* Real-Time Countdown Timer Block */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg w-full">
            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight font-mono">
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                {t("portal.days", "Days")}
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight font-mono">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                {t("portal.hours", "Hours")}
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight font-mono">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                {t("portal.minutes", "Minutes")}
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-tight font-mono animate-pulse">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                {t("portal.seconds", "Seconds")}
              </span>
            </div>
          </div>

          {/* Organizer Announcement */}
          {Boolean(portalMessage) && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl max-w-lg w-full text-start text-xs space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Megaphone size={14} />
                <span>{t("portal.organizerAnnouncement", "Organizer Announcement")}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                {portalMessage}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onGoToHome}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>{t("portal.backToHome", "Back to Home")}</span>
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
              {t("portal.verifiedAccessOnly", "Verified Attendee Access Only")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              {t("portal.signInToEnter", "Sign In to Enter the Attendee Portal")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {t("portal.signInWithExactEmailHelp", "Please sign in with the exact email address you used when claiming your ticket for {title}.", { title: eventDetails.title || "the event" })}
            </p>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl w-full text-start text-xs space-y-3 backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">{t("portal.discoverAndNetwork", "Discover and network with other confirmed attendees and industry leaders.")}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">{t("portal.bookmarkKeynotes", "Bookmark keynote sessions and build your personal conference agenda.")}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">{t("portal.navigateFloorPlans", "Navigate interactive 2D floor plans and access fast-track QR door passes.")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              onClick={() => onOpenAuth && onOpenAuth("signin")}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={15} />
              <span>{t("portal.signInWithTicketEmail", "Sign In with Ticket Email")}</span>
            </button>
            <button
              onClick={() => onOpenAuth && onOpenAuth("signup")}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>{t("portal.createAccount", "Create Account")}</span>
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

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 text-start space-y-1 w-full max-w-md">
            <p className="font-bold">{t("portal.howToResolveThis", "How to resolve this:")}</p>
            <p>1. If you registered with another email, please switch accounts.</p>
            <p>2. If you haven&apos;t claimed a pass yet, please get a ticket from the event page.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              onClick={() => onOpenAuth && onOpenAuth("signin")}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>{t("portal.signInDifferentEmail", "Sign In with Different Email")}</span>
            </button>

            {onViewLivePage && (
              <button
                onClick={() => onViewLivePage(eventDetails.id)}
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("portal.getEventTickets", "Get Event Tickets")}</span>
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Organizer Notice Banner when portal is closed to visitors */}
      {isOrganizerOrAdmin && portalStatus === "closed" && (
        <div className="bg-rose-950 text-rose-100 border-b border-rose-800/80 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 font-medium">
            <Lock size={14} className="text-rose-400 shrink-0 stroke-[2.2]" />
            <span>
              <strong>Organizer Preview Notice:</strong> This attendee portal is currently <strong>CLOSED</strong> to visitors and delegates. You can access it because of your organizer privileges.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOrganizerPreviewAsVisitor(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={13} />
              <span>Preview Visitor Screen</span>
            </button>
            {onOpenEventsHub && (
              <button
                onClick={onOpenEventsHub}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs transition cursor-pointer"
              >
                Portal Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Organizer Notice Banner when portal is scheduled for the future */}
      {isOrganizerOrAdmin && isScheduledInFuture && (
        <div className="bg-indigo-950 text-indigo-100 border-b border-indigo-800/80 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 font-medium">
            <Clock size={14} className="text-indigo-400 shrink-0 stroke-[2.2]" />
            <span>
              <strong>Organizer Preview Notice:</strong> This attendee portal is currently <strong>SCHEDULED</strong> to unlock in the future. Visitors currently see a live countdown.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOrganizerPreviewAsVisitor(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={13} />
              <span>Preview Countdown</span>
            </button>
            {onOpenEventsHub && (
              <button
                onClick={onOpenEventsHub}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs transition cursor-pointer"
              >
                Portal Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Universal Top Bar */}
      <UniversalTopBar
        currentUser={currentUser}
        onGoToHome={onGoToHome}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onSignOut={onSignOut}
        onOpenEventsHub={onOpenEventsHub}
      />

      {/* Portal Hero Banner Header */}
      <header className="bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              {eventDetails.title || "Summit"}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5 font-medium">
              {eventDetails.startDate && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  <Calendar size={13} className="text-blue-600" />
                  <span dir="ltr">{eventDetails.startDate} {eventDetails.endDate ? `— ${eventDetails.endDate}` : ""}</span>
                </div>
              )}
              {eventDetails.location && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  <MapPin size={13} className="text-blue-600" />
                  <span>{eventDetails.location}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <Users size={13} className="text-blue-600" />
                <span className="inline-flex items-center gap-1"><bdi dir="ltr">{attendees.length}</bdi> <span>{t("portal.attendeesCount", "Attendees")}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Navigation Sub-Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-t border-b border-slate-200/90 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            
            {/* Tab 1: Overview */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Compass size={14} className={activeTab === "overview" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.overview", "Overview")}</span>
            </button>

            {/* Tab 2: Agenda */}
            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "agenda"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Calendar size={14} className={activeTab === "agenda" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.agenda", "Agenda")}</span>
              {bookmarkedSessionIds.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "agenda" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {bookmarkedSessionIds.length}
                </span>
              )}
            </button>

            {/* Tab 3: Directory */}
            <button
              onClick={() => setActiveTab("networking")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "networking"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Users size={14} className={activeTab === "networking" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.networking", "Directory")}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "networking" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {attendees.length}
              </span>
            </button>

            {/* Tab 3.5: Messages & 1-on-1 Chat */}
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "chat"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <MessageCircle size={14} className={activeTab === "chat" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.messagesTab", "Messages")}</span>
              {chatMessages.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "chat" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {chatMessages.length}
                </span>
              )}
            </button>

            {/* Tab 3.8: 1-on-1 Meetings */}
            <button
              onClick={() => setActiveTab("meetings")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "meetings"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <CalendarCheck size={14} className={activeTab === "meetings" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.meetingsTab", "Meetings")}</span>
              {pendingMeetings.length > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "meetings" ? "bg-amber-400 text-slate-950" : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}>
                  {pendingMeetings.length}
                </span>
              ) : upcomingMeetings.length > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "meetings" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {upcomingMeetings.length}
                </span>
              ) : null}
            </button>

            {/* Tab 4: Exhibitors & Sponsors */}
            <button
              onClick={() => setActiveTab("exhibitors")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "exhibitors"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Building2 size={14} className={activeTab === "exhibitors" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.exhibitors", "Exhibitors")}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "exhibitors" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {sponsors.length + exhibitors.length}
              </span>
            </button>

            {/* Tab 5: Floor Plans */}
            {isFloorplansEnabled && visibleFloorPlans.length > 0 && (
              <button
                onClick={() => setActiveTab("floorplan")}
                className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "floorplan"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
                }`}
              >
                <Layers size={14} className={activeTab === "floorplan" ? "text-white" : "text-slate-500"} />
                <span>{t("portal.floorPlan", "Floor Plans")}</span>
                {visibleFloorPlans.length > 1 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "floorplan" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {visibleFloorPlans.length}
                  </span>
                )}
              </button>
            )}

            {/* Tab 6: Digital Badge */}
            <button
              onClick={() => setActiveTab("badge")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "badge"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Ticket size={14} className={activeTab === "badge" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.myPass", "Digital Badge")}</span>
            </button>

            {/* Tab 7: Eventzone Mobile App */}
            <button
              onClick={() => setActiveTab("app")}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "app"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Smartphone size={14} className={activeTab === "app" ? "text-white" : "text-slate-500"} />
              <span>{t("portal.mobileAppTab", "Mobile App")}</span>
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
            

            {/* Quick Action Navigation Cards (Cohesive, Unified Design System) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Fast-Track Gate Pass */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center">
                      <Ticket size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {t("portal.officialPassBadge", "Official Pass")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t("portal.fastTrackPassTitle", "Fast-Track Entry Pass")}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                      {t("portal.fastTrackPassDesc", "Display your verified badge and digital QR code for instant entry at the venue.")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("badge")}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-50 hover:bg-blue-50 group-hover:border-blue-200 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/70 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t("portal.openScannablePass", "Open Scannable Pass")}</span>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Card 2: Interactive Agenda */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center">
                      <Calendar size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      <><bdi dir="ltr">{sessions.length}</bdi> {t("portal.sessionsCount", "Sessions")}</>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t("portal.keynoteScheduleTitle", "Keynote & Schedule")}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                      {t("portal.keynoteScheduleDesc", "Explore keynote talks, workshops, and bookmark sessions to your personal agenda.")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("agenda")}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-50 hover:bg-blue-50 group-hover:border-blue-200 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/70 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t("portal.exploreSchedule", "Explore Schedule")}</span>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Card 3: Delegate Networking */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      <><bdi dir="ltr">{attendees.length}</bdi> {t("portal.delegatesCount", "Delegates")}</>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t("portal.attendeeDirectoryTitle", "Attendee Directory")}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                      {t("portal.attendeeDirectoryDesc", "Discover verified delegates, send connection requests, and start 1-on-1 chats.")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("networking")}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-50 hover:bg-blue-50 group-hover:border-blue-200 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/70 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t("portal.browseDirectory", "Browse Directory")}</span>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Card 4: Eventzone Mobile App (Harmonized, Clean Design) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center">
                      <Smartphone size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      <bdi dir="ltr">iOS & Android</bdi>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t("portal.mobileAppCardTitle", "Eventzone Mobile App")}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                      {t("portal.mobileAppCardDesc", "NFC contact swapping, live in-app chat, push notifications, and offline badge.")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("app")}
                  className="mt-4 w-full py-2.5 px-3 bg-slate-50 hover:bg-purple-50 group-hover:border-purple-200 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/70 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t("portal.getMobileApp", "Get Mobile App")}</span>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

            </div>

            {/* Featured Agenda Highlight */}
            {sessions.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{t("portal.featuredAgendaTitle", "Featured Agenda & Keynotes")}</h3>
                    <p className="text-xs text-slate-500 font-normal">{t("portal.featuredAgendaSubtitle", "Curated highlights from the official conference schedule")}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("agenda")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t("portal.viewAllSessions", `View all ${sessions.length} sessions`, { count: sessions.length })}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.slice(0, 4).map(sess => (
                    <div key={sess.id} className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 space-y-2.5 flex flex-col justify-between transition-all hover:border-slate-300">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                            <Clock size={12} className="text-blue-600" />
                            <span>{sess.time || sess.startTime || "09:00"}</span>
                            {sess.stage && <span className="text-slate-400">• {sess.stage}</span>}
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {sess.track || t("portal.generalTrack", "General Track")}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{sess.title || sess.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 font-normal mt-1">{sess.description || t("portal.defaultSessionDesc", "Interactive keynote presentation.")}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {sess.speaker || sess.speakerName || t("portal.conferenceSpeaker", "Conference Speaker")}
                        </span>
                        <button
                          onClick={() => handleToggleBookmark(sess.id)}
                          className="text-slate-400 hover:text-amber-500 transition-colors p-1 cursor-pointer"
                          title={t("portal.bookmarkTooltip", "Bookmark to My Schedule")}
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

            {/* Attending Delegates Spotlight (Live Summit Vibe) */}
            {attendees.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{t("portal.delegatesSpotlightTitle", "Attending Delegates Spotlight")}</h3>
                    <p className="text-xs text-slate-500 font-normal">{t("portal.delegatesSpotlightSubtitle", "Connect and chat 1-on-1 with registered summit participants")}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("networking")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t("portal.browseAllDelegates", `Browse all ${attendees.length}`, { count: attendees.length })}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {attendees.slice(0, 4).map((att) => {
                    const isConn = connections.some(c => isMatchingEmail(c.email, att.email) || (c.partnerId && c.partnerId === att.id));
                    const pendingRec = pendingReceived.find(p => isMatchingEmail(p.sender_email, att.email));
                    const pendingSnt = pendingSent.find(p => isMatchingEmail(p.recipient_email, att.email)) || requestSentTargetId === (att.id || att.email);

                    return (
                      <div
                        key={att.id}
                        className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 rounded-xl flex flex-col justify-between gap-3 transition-all hover:border-slate-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {(att.name || att.fullName || "A").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {att.name || att.fullName || t("portal.defaultDelegate", "Delegate")}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {att.jobTitle || att.title || att.role || t("portal.defaultAttendee", "Attendee")}
                              {att.company ? ` • ${att.company}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => setSelectedAttendeeForModal(att)}
                            className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200/80 transition-colors text-center cursor-pointer"
                          >
                            {t("portal.profileBtn", "Profile")}
                          </button>
                          {isConn ? (
                            <button
                              onClick={() => {
                                setActiveChatContact(att);
                                setActiveTab("chat");
                              }}
                              className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                            >
                              <MessageCircle size={11} />
                              <span>{t("portal.chatBtn", "Chat")}</span>
                            </button>
                          ) : pendingRec ? (
                            <button
                              onClick={() => handleAcceptConnection(pendingRec.id, att)}
                              disabled={isProcessingAction}
                              className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <Check size={11} />
                              <span>{t("portal.acceptBtn", "Accept")}</span>
                            </button>
                          ) : pendingSnt ? (
                            <div className="py-1.5 px-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1">
                              <Clock size={11} />
                              <span>{t("portal.requestedBadge", "Requested")}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConnectModalTarget(att)}
                              className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                            >
                              <UserCheck size={11} />
                              <span>{t("portal.connectBtn", "Connect")}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Featured Partners / Sponsors Showcase */}
            {sponsors.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{t("portal.featuredPartnersTitle", "Featured Summit Partners")}</h3>
                    <p className="text-xs text-slate-500 font-normal">{t("portal.featuredPartnersSubtitle", "Official summit sponsors and enterprise exhibitors")}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("exhibitors")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t("portal.viewAllPartners", `View All ${sponsors.length + exhibitors.length} Partners →`, { count: sponsors.length + exhibitors.length })}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {sponsors.slice(0, 6).map(sp => (
                    <div key={sp.id} className="p-3.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 flex flex-col items-center justify-center text-center gap-2 transition-all hover:border-slate-300 hover:shadow-xs">
                      {sp.logo ? (
                        <img src={sp.logo} alt={sp.name} className="h-9 w-auto object-contain max-w-[90%]" />
                      ) : (
                        <Building2 size={22} className="text-slate-400" />
                      )}
                      <span className="text-[11px] font-semibold text-slate-800 line-clamp-1">{sp.name || sp.companyName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile App Companion Callout Banner */}
            <div className="bg-[#0B0F17] text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0 border border-white/10">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white tracking-tight">{t("portal.syncMobileAppTitle", "Sync your summit with the Eventzone Mobile App")}</h4>
                  <p className="text-xs text-slate-300 font-normal mt-0.5 max-w-xl">
                    {t("portal.syncMobileAppDesc", "Tap to swap contacts via NFC, chat 1-on-1 with delegates, and access your door pass offline.")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("app")}
                className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <span>{t("portal.getMobileApp", "Get Mobile App")}</span>
                <ArrowRight size={13} className="rtl:rotate-180" />
              </button>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: AGENDA & PERSONAL SCHEDULE                                    */}
        {/* ==================================================================== */}
        {activeTab === "agenda" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t("portal.agendaTitle", "Conference Schedule & Agenda")}</h2>
                <p className="text-xs text-slate-500 font-medium">{t("portal.agendaSubtitle", "Filter sessions by track, day, or keyword, and bookmark to build your personal agenda.")}</p>
              </div>

              {/* Toggle All vs Bookmarked */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
                <button
                  onClick={() => setAgendaViewMode("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    agendaViewMode === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t("portal.allSessionsTab", "All Sessions")} ({sessions.length})
                </button>
                <button
                  onClick={() => setAgendaViewMode("bookmarked")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    agendaViewMode === "bookmarked" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookmarkCheck size={13} className="text-amber-500" />
                  <span>{t("portal.myScheduleTab", "My Schedule")} ({bookmarkedSessionIds.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("portal.searchSessionsPlaceholder", "Search sessions, topics, or speaker names...")}
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
                      { value: "all", label: t("portal.allDays", "All Days") },
                      ...distinctDays.map(d => ({ value: d, label: `${t("portal.dayPrefix", "Day")}: ${d}` }))
                    ]}
                    placeholder={t("portal.filterByDay", "Filter by Day")}
                  />
                </div>
              )}

              {distinctTracks.length > 0 && (
                <div className="w-full sm:w-56">
                  <SearchableSelect
                    value={selectedTrack}
                    onChange={setSelectedTrack}
                    options={[
                      { value: "all", label: t("portal.allTracks", "All Tracks & Stages") },
                      ...distinctTracks.map(track => ({ value: track, label: `${t("portal.trackPrefix", "Track")}: ${track}` }))
                    ]}
                    placeholder={t("portal.filterByTrack", "Filter by Track")}
                  />
                </div>
              )}
            </div>

            {/* Sessions Feed */}
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <Calendar size={32} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">{t("portal.noSessionsMatch", "No sessions match your search")}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {agendaViewMode === "bookmarked" 
                    ? t("portal.noBookmarkedSessionsHelp", "You haven't bookmarked any sessions yet. Click the bookmark icon on any session to add it to your schedule!") 
                    : t("portal.noSessionsHelp", "Try adjusting your search keywords or clearing track filters.")}
                </p>
                {agendaViewMode === "bookmarked" && (
                  <button
                    onClick={() => setAgendaViewMode("all")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {t("portal.browseAllSessions", "Browse All Sessions")}
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
                      className={`p-6 bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-6 ${
                        isBookmarked ? "border-amber-200 ring-1 ring-amber-400/20" : "border-slate-200"
                      }`}
                    >
                      {/* Left: Time & Track */}
                      <div className="space-y-2 md:w-56 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <Clock size={14} className="text-blue-600" />
                          <bdi dir="ltr">{sess.time || sess.startTime || "09:00"} {sess.endTime ? `— ${sess.endTime}` : ""}</bdi>
                        </div>
                        {sess.stage && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <MapPin size={12} className="text-slate-400" />
                            <span>{sess.stage}</span>
                          </div>
                        )}
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                          {sess.track || t("portal.generalKeynote", "General Keynote")}
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("portal.speakersLabel", "Speakers:")}</span>
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

                        {/* Session Partner / Sponsor Logos */}
                        {Array.isArray(sess.logos) && sess.logos.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {sess.logos.map((logo, idx) => {
                              const logoImg = typeof logo === "string" ? logo : (logo?.image || logo?.url || logo?.logo || "");
                              const logoLabel = typeof logo === "object" ? (logo?.label || "Partner") : "Partner";
                              if (!logoImg) return null;

                              return (
                                <div
                                  key={logo?.id || idx}
                                  className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={logoImg}
                                    alt={logoLabel}
                                    className="h-4 object-contain max-w-[70px]"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500">
                                    {logoLabel}
                                  </span>
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
                              <span>{t("portal.inMySchedule", "In My Schedule")}</span>
                            </>
                          ) : (
                            <>
                              <Bookmark size={14} />
                              <span>{t("portal.addToSchedule", "Add to Schedule")}</span>
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
            
            {/* Search & Tab Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("portal.searchDelegatesPlaceholder", "Search delegates by name, company, or job title...")}
                  value={networkingSearch}
                  onChange={(e) => setNetworkingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => setNetworkingTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    networkingTab === "all" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t("portal.allDelegatesTab", "All Delegates")} ({attendees.length})
                </button>
                <button
                  onClick={() => setNetworkingTab("connections")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    networkingTab === "connections" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <UserCheck size={13} />
                  <span>{t("portal.myConnectionsTab", "My Connections")} ({connections.length})</span>
                </button>
                <button
                  onClick={() => setNetworkingTab("invitations")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
                    networkingTab === "invitations" ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Clock size={13} />
                  <span>{t("portal.invitationsTab", "Invitations")} ({pendingReceived.length + pendingSent.length})</span>
                  {pendingReceived.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
                      {pendingReceived.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsEditingMyProfile(true)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ml-auto sm:ml-0"
                >
                  <Sparkles size={13} className="text-blue-600" />
                  <span>{t("portal.editMyProfile", "Edit My Profile")}</span>
                </button>
              </div>
            </div>

            {/* Invitations View OR Attendees Grid */}
            {networkingTab === "invitations" ? (
              <div className="space-y-6">
                {/* Received Invitations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>{t("portal.receivedInvitations", "Received Connection Invitations")}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        {pendingReceived.length}
                      </span>
                    </h3>
                  </div>

                  {pendingReceived.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <CheckCircle2 size={28} className="text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">{t("portal.noReceivedInvitations", "No pending invitations received")}</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        {t("portal.noReceivedInvitationsHelp", "When other delegates invite you to connect, their invitations will appear here for your approval.")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingReceived.map((req) => {
                        const name = req.sender_name || "Delegate";
                        const job = req.sender_title || "Delegate";
                        const comp = req.sender_company || "";
                        return (
                          <div key={req.id} className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                            <div className="flex items-start gap-3">
                              {req.sender_avatar ? (
                                <img src={req.sender_avatar} alt={name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shadow-2xs shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-black text-slate-900 truncate">{name}</h4>
                                <p className="text-xs text-slate-500 font-semibold truncate">{job}</p>
                                {comp && <p className="text-[11px] text-blue-600 font-bold truncate">{comp}</p>}
                              </div>
                            </div>

                            {req.notes && (
                              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 italic">
                                &ldquo;{req.notes}&rdquo;
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                              <button
                                onClick={() => handleAcceptConnection(req.id, { email: req.sender_email, name: req.sender_name })}
                                disabled={isProcessingAction}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <Check size={13} />
                                <span>{t("portal.acceptBtn", "Accept")}</span>
                              </button>
                              <button
                                onClick={() => handleDeclineConnection(req.id)}
                                disabled={isProcessingAction}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X size={13} />
                                <span>{t("portal.declineBtn", "Decline")}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sent Invitations */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>{t("portal.sentInvitations", "Sent Invitations (Awaiting Acceptance)")}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                        {pendingSent.length}
                      </span>
                    </h3>
                  </div>

                  {pendingSent.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <p className="text-xs font-bold text-slate-700">{t("portal.noSentInvitations", "No sent invitations pending")}</p>
                      <p className="text-[11px] text-slate-400">
                        {t("portal.noSentInvitationsHelp", "When you invite delegates to connect, pending requests will be tracked here.")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingSent.map((req) => {
                        const name = req.recipient_name || "Delegate";
                        const job = req.recipient_title || "Delegate";
                        const comp = req.recipient_company || "";
                        return (
                          <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                            <div className="flex items-start gap-3">
                              {req.recipient_avatar ? (
                                <img src={req.recipient_avatar} alt={name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-base shadow-2xs shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-black text-slate-900 truncate">{name}</h4>
                                <p className="text-xs text-slate-500 font-semibold truncate">{job}</p>
                                {comp && <p className="text-[11px] text-blue-600 font-bold truncate">{comp}</p>}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                <Clock size={12} />
                                <span>{t("portal.awaitingAcceptance", "Awaiting acceptance")}</span>
                              </span>
                              <button
                                onClick={() => handleCancelSentInvitation(req.id, req.recipient_email)}
                                disabled={isProcessingAction}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title={t("portal.cancelSentInvitation", "Cancel Request")}
                              >
                                <X size={12} />
                                <span>{t("portal.cancelSentInvitation", "Cancel")}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Attendees Grid */
              filteredAttendees.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <Users size={32} className="text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">{t("portal.noAttendeesMatch", "No attendees match your filter")}</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {networkingTab === "connections" 
                      ? t("portal.noConnectionsHelp", "You haven't established any connections yet. Connect with attendees below to build your conference contact book!")
                      : t("portal.noAttendeesSearchHelp", "Try searching with a different name or organization keyword.")}
                  </p>
                  {networkingTab === "connections" && (
                    <button
                      onClick={() => setNetworkingTab("all")}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {t("portal.browseAllAttendees", "Browse All Attendees")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAttendees.map(att => {
                    const name = att.name || `${att.firstName || ""} ${att.lastName || ""}`.trim() || "Attendee";
                    const company = att.company || att.organization || "Organization";
                    const job = att.jobTitle || att.job_title || att.role || "Delegate";
                    const isConn = connections.some(c => isMatchingEmail(c.email, att.email) || (c.partnerId && c.partnerId === att.id));
                    const pendingRec = pendingReceived.find(p => isMatchingEmail(p.sender_email, att.email));
                    const pendingSnt = pendingSent.find(p => isMatchingEmail(p.recipient_email, att.email)) || requestSentTargetId === (att.id || att.email);

                    return (
                      <div
                        key={att.id || att.email}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
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
                              <div className="text-start min-w-0">
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
                            <span>{t("portal.profileBtn", "Profile")}</span>
                          </button>

                          {isConn ? (
                            <>
                              <button
                                onClick={() => handleOpenBookingModal(att)}
                                className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title={`Book meeting with ${name}`}
                              >
                                <CalendarPlus size={13} />
                                <span>{t("portal.bookMeetingBtn", "Book")}</span>
                              </button>
                              <button
                                onClick={() => handleStartChatWith(att)}
                                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title={`Message ${name}`}
                              >
                                <MessageCircle size={13} />
                                <span>{t("portal.chatBtn", "Chat")}</span>
                              </button>
                              <div className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                                <CheckCircle2 size={13} />
                                <span>{t("portal.connectedBadge", "Connected")}</span>
                              </div>
                              <button
                                onClick={() => handleOpenDisconnectModal(att)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all cursor-pointer shrink-0"
                                title={t("portal.removeConnectionBtn", "Remove Connection")}
                              >
                                <UserMinus size={14} />
                              </button>
                            </>
                          ) : pendingRec ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleAcceptConnection(pendingRec.id, att)}
                                disabled={isProcessingAction}
                                className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Accept connection"
                              >
                                <Check size={12} />
                                <span>{t("portal.acceptBtn", "Accept")}</span>
                              </button>
                              <button
                                onClick={() => handleDeclineConnection(pendingRec.id)}
                                disabled={isProcessingAction}
                                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Decline"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : pendingSnt ? (
                            <div className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                              <Clock size={13} />
                              <span>{t("portal.requestedBadge", "Requested")}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConnectModalTarget(att)}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <UserCheck size={13} />
                              <span>{t("portal.connectBtn", "Connect")}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3.5: DIRECT MESSAGES & 1-ON-1 CHAT                               */}
        {/* ==================================================================== */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            
            {/* Chat Workspace Box */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px] max-h-[700px]">
              
              {/* Left Contacts / Thread List */}
              <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50">
                {/* Search Contacts Bar */}
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t("portal.searchConversationsPlaceholder", "Search conversations & delegates...")}
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
                      <p className="text-xs font-semibold">{t("portal.noConnectedDelegates", "No connected delegates yet")}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {t("portal.connectToChatHelp", "You can only message delegates you have connected with.")}
                      </p>
                      <button
                        onClick={() => setActiveTab("networking")}
                        className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-block"
                      >
                        {t("portal.browseDirectory", "Browse Directory")}
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
                          className={`w-full p-2.5 sm:p-3 rounded-lg text-start transition-all flex items-center gap-3 cursor-pointer ${
                            isSelected 
                              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xs" 
                              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <div className="relative shrink-0">
                            {contact.avatar || contact.image ? (
                              <img src={contact.avatar || contact.image} alt={contactDisplayName} className="w-11 h-11 rounded-lg object-cover shadow-xs border border-slate-200" />
                            ) : (
                              <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm shadow-xs ${
                                isSelected ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-700"
                              }`}>
                                {contactDisplayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-black truncate text-slate-900">
                                {contactDisplayName}
                              </h4>
                            </div>
                            <p className="text-[11px] truncate font-medium text-slate-500">
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

                        <div className="min-w-0 text-start">
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
                          onClick={() => handleOpenBookingModal(activeChatContact)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <CalendarPlus size={13} className="text-purple-600" />
                          <span>{t("portal.bookMeetingBtn", "Book Meeting")}</span>
                        </button>
                        <button
                          onClick={() => setSelectedAttendeeForModal(activeChatContact)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <User size={12} className="text-blue-600" />
                          <span>{t("portal.viewProfileBtn", "View Profile")}</span>
                        </button>
                        <button
                          onClick={() => handleOpenDisconnectModal(activeChatContact)}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title={t("portal.removeConnectionBtn", "Remove Connection")}
                        >
                          <UserMinus size={12} />
                          <span className="hidden sm:inline">{t("portal.disconnectBtn", "Disconnect")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Chat Notice Error Banner */}
                    {chatNoticeError && (
                      <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800 font-medium animate-fade-in">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={15} className="text-amber-600 shrink-0" />
                          <span>{chatNoticeError}</span>
                        </div>
                        <button
                          onClick={() => setChatNoticeError("")}
                          className="text-amber-600 hover:text-amber-800 font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Chat Messages Body */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                      {activeConversationMessages.length === 0 ? (
                        <div className="py-10 text-center space-y-4 max-w-md mx-auto">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                            <MessageCircle size={28} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-900">
                              {t("portal.startConversationWith", "Start a conversation with {name}", { name: activeChatContact.name || "this delegate" })}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              {t("portal.quickIcebreakersDesc", "Send an instant message or choose one of the quick icebreakers below:")}
                            </p>
                          </div>

                          {/* Quick Icebreaker Suggestions */}
                          <div className="flex flex-col gap-2 pt-2 text-start">
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
                                className="p-3 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 transition-all text-start cursor-pointer shadow-2xs"
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
                              <span className="hidden sm:inline">{t("portal.sendBtn", "Send")}</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                    <MessageCircle size={36} className="text-slate-300" />
                    <h3 className="text-base font-black text-slate-800">
                      {chatContactsList.length === 0 
                        ? t("portal.connectToChatTitle", "Connect to Start Chatting")
                        : t("portal.noConversationSelected", "No Conversation Selected")}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {chatContactsList.length === 0 
                        ? t("portal.connectToChatNotice", "Send connection invitations in the Attendee Directory. Once accepted, you can exchange 1-on-1 messages in real time!")
                        : t("portal.chooseAttendeeChatHelp", "Choose a connected delegate from the list on the left to start messaging.")}
                    </p>
                    {chatContactsList.length === 0 && (
                      <button
                        onClick={() => setActiveTab("networking")}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        {t("portal.browseDirectory", "Browse Directory")}
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3.8: 1-ON-1 ATTENDEE MEETINGS                                    */}
        {/* ==================================================================== */}
        {activeTab === "meetings" && (
          <div className="space-y-6 animate-fade-in">

            {/* Meetings Header & Stats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <CalendarCheck size={18} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {t("portal.meetingsMainTitle", "1-on-1 Networking Meetings")}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium max-w-2xl">
                    {t("portal.meetingsMainSubtitle", "Schedule and manage verified face-to-face meetings with your accepted connections during official event operating hours.")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("networking")}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CalendarPlus size={14} />
                    <span>{t("portal.bookNewMeetingBtn", "Book a Meeting")}</span>
                  </button>
                  <button
                    onClick={loadMeetingsData}
                    disabled={isLoadingMeetings}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title={t("portal.refreshMeetings", "Refresh meetings")}
                  >
                    <RefreshCw size={14} className={isLoadingMeetings ? "animate-spin text-blue-600" : ""} />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex items-center gap-1.5 border-b border-slate-100 pt-2 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setMeetingsSubTab("upcoming")}
                  className={`pb-3 px-3.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    meetingsSubTab === "upcoming"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Calendar size={13} />
                  <span>{t("portal.subTabUpcoming", "Upcoming")}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    meetingsSubTab === "upcoming" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {upcomingMeetings.length}
                  </span>
                </button>

                <button
                  onClick={() => setMeetingsSubTab("pending")}
                  className={`pb-3 px-3.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    meetingsSubTab === "pending"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Clock size={13} />
                  <span>{t("portal.subTabPending", "Pending Requests")}</span>
                  {pendingMeetings.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {pendingMeetings.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMeetingsSubTab("past")}
                  className={`pb-3 px-3.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    meetingsSubTab === "past"
                      ? "border-slate-800 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{t("portal.subTabPast", "Past / Closed")}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {pastMeetings.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Meetings List Content */}
            {(() => {
              const currentList = meetingsSubTab === "upcoming" 
                ? upcomingMeetings 
                : (meetingsSubTab === "pending" ? pendingMeetings : pastMeetings);

              if (isLoadingMeetings && currentList.length === 0) {
                return (
                  <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <Loader2 size={28} className="animate-spin text-blue-600 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">{t("portal.loadingMeetings", "Loading scheduled meetings...")}</p>
                  </div>
                );
              }

              if (currentList.length === 0) {
                return (
                  <div className="p-14 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <CalendarX size={30} />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h3 className="text-base font-bold text-slate-800">
                        {meetingsSubTab === "upcoming" 
                          ? t("portal.noUpcomingMeetings", "No meetings scheduled")
                          : (meetingsSubTab === "pending" 
                              ? t("portal.noPendingMeetings", "No pending meeting requests")
                              : t("portal.noPastMeetings", "No past meetings"))}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {meetingsSubTab === "upcoming"
                          ? t("portal.noUpcomingMeetingsDesc", "Connect with delegates in the attendee directory to book face-to-face meetings during event hours.")
                          : (meetingsSubTab === "pending"
                              ? t("portal.noPendingMeetingsDesc", "When an attendee invites you to a meeting or when you send a meeting request, it will appear here.")
                              : t("portal.noPastMeetingsDesc", "Completed, declined, or cancelled meetings are archived here."))}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("networking")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      {t("portal.browseAttendeesToMeet", "Browse Attendees")}
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentList.map((m) => {
                    const isSender = (currentUser?.email && isMatchingEmail(m.sender_email, currentUser.email)) ||
                      (currentUser?.id && m.sender_id === currentUser.id);

                    // Partner data
                    const partnerName = isSender 
                      ? (m.recipient_name || "Delegate") 
                      : (m.sender_name || "Delegate");
                    const partnerEmail = isSender ? m.recipient_email : m.sender_email;
                    const matchedAtt = attendees.find(a => isMatchingEmail(a.email, partnerEmail));
                    const partnerAvatar = (isSender ? m.recipient_avatar : m.sender_avatar) || matchedAtt?.avatar || matchedAtt?.image;
                    const partnerJob = matchedAtt?.jobTitle || matchedAtt?.role || (isSender ? m.recipient_title : m.sender_title) || "Delegate";
                    const partnerComp = matchedAtt?.company || (isSender ? m.recipient_company : m.sender_company) || "";

                    const formattedDate = m.date 
                      ? new Date(`${m.date}T00:00:00`).toLocaleDateString(lang === "fr" ? "fr-FR" : (lang === "ar" ? "ar-DZ" : "en-US"), {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })
                      : t("portal.tbdDate", "TBD");

                    const timeRange = `${m.start_time || m.startTime || "09:00"} – ${m.end_time || m.endTime || "09:30"}`;
                    const durationMins = m.duration || 30;

                    return (
                      <div
                        key={m.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3.5">
                          {/* Top: Date & Status Badges */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-bold">
                              <Calendar size={12} className="text-blue-600" />
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <Clock size={12} className="text-blue-600" />
                              <span dir="ltr">{timeRange}</span>
                            </div>

                            {/* Status Indicator */}
                            {m.status === "accepted" && (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                                <CheckCircle2 size={12} />
                                <span>{t("portal.meetingConfirmed", "Confirmed")}</span>
                              </span>
                            )}
                            {m.status === "pending" && (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                                <Clock size={12} />
                                <span>{isSender ? t("portal.meetingAwaitingResponse", "Awaiting Response") : t("portal.meetingInvitationReceived", "Action Required")}</span>
                              </span>
                            )}
                            {m.status === "declined" && (
                              <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                                <X size={12} />
                                <span>{t("portal.meetingDeclined", "Declined")}</span>
                              </span>
                            )}
                            {m.status === "cancelled" && (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                                <span>{t("portal.meetingCancelled", "Cancelled")}</span>
                              </span>
                            )}
                          </div>

                          {/* Meeting Title & Location */}
                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-900">
                              {m.title || t("portal.defaultMeetingTitle", "1-on-1 Networking Meeting")}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} className="text-slate-400" />
                                <span>{m.location || "Networking Lounge"}</span>
                              </span>
                              <span>•</span>
                              <span>{durationMins} {t("portal.minsDuration", "mins")}</span>
                            </div>
                          </div>

                          {/* Partner Mini Profile */}
                          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 flex items-center gap-3">
                            {partnerAvatar ? (
                              <img
                                src={partnerAvatar}
                                alt={partnerName}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                                {partnerName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1 text-start">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-900 truncate">{partnerName}</span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {isSender ? `(${t("portal.recipientLabel", "Invitee")})` : `(${t("portal.requesterLabel", "Organizer")})`}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {partnerJob} {partnerComp ? `• ${partnerComp}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Note / Objective if present */}
                          {(m.note || m.description) && (
                            <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/40 font-medium leading-relaxed">
                              <span className="font-bold text-amber-800">{t("portal.meetingNotePrefix", "Note:")} </span>
                              {m.note || m.description}
                            </p>
                          )}
                        </div>

                        {/* Actions Bottom Bar */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          {m.status === "pending" && !isSender ? (
                            /* Incoming request: Accept or Decline */
                            <div className="flex items-center gap-2 w-full">
                              <button
                                onClick={() => handleAcceptMeeting(m.id)}
                                disabled={isProcessingMeetingAction}
                                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <Check size={13} />
                                <span>{t("portal.acceptMeetingBtn", "Accept Meeting")}</span>
                              </button>
                              <button
                                onClick={() => handleDeclineMeeting(m.id)}
                                disabled={isProcessingMeetingAction}
                                className="py-2 px-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X size={13} />
                                <span>{t("portal.declineMeetingBtn", "Decline")}</span>
                              </button>
                            </div>
                          ) : m.status === "pending" && isSender ? (
                            /* Outgoing request: Cancel option */
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {t("portal.awaitingPartnerAcceptance", "Waiting for delegate confirmation...")}
                              </span>
                              <button
                                onClick={() => handleCancelMeeting(m.id)}
                                disabled={isProcessingMeetingAction}
                                className="py-1.5 px-3 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X size={12} />
                                <span>{t("portal.cancelRequestBtn", "Cancel Request")}</span>
                              </button>
                            </div>
                          ) : m.status === "accepted" ? (
                            /* Confirmed meeting: Message or Cancel */
                            <div className="flex items-center justify-between gap-2 w-full">
                              <button
                                onClick={() => {
                                  const contact = matchedAtt || {
                                    id: isSender ? m.recipient_id : m.sender_id,
                                    email: partnerEmail,
                                    name: partnerName,
                                    jobTitle: partnerJob,
                                    company: partnerComp
                                  };
                                  setActiveChatContact(contact);
                                  setActiveTab("chat");
                                }}
                                className="py-2 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageCircle size={13} />
                                <span>{t("portal.messagePartnerBtn", "Send Message")}</span>
                              </button>
                              <button
                                onClick={() => handleCancelMeeting(m.id)}
                                disabled={isProcessingMeetingAction}
                                className="py-2 px-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                {t("portal.cancelMeetingAction", "Cancel Meeting")}
                              </button>
                            </div>
                          ) : (
                            /* Archived/Closed meeting */
                            <div className="text-[11px] text-slate-400 font-medium italic">
                              {t("portal.meetingArchived", "This meeting record is closed.")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: EXHIBITORS & SPONSORS                                         */}
        {/* ==================================================================== */}
        {activeTab === "exhibitors" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t("portal.exhibitorsTitle", "Exhibitors & Sponsors Showcase")}</h2>
                <p className="text-xs text-slate-500 font-medium">{t("portal.exhibitorsSubtitle", "Explore company demo pods, download brochures, and locate booth locations on the floor plan.")}</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("portal.searchExhibitorsPlaceholder", "Search exhibitors or booths...")}
                  value={exhibitorSearch}
                  onChange={(e) => setExhibitorSearch(e.target.value)}
                  className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* 1. Sponsors Section */}
            {filteredSponsors.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">{t("portal.officialSponsors", "Official Conference Sponsors")}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSponsors.map(sp => (
                    <div key={sp.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
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
                          <p className="text-xs text-slate-500 line-clamp-2 font-medium mt-1">{sp.description || t("portal.officialSummitPartner", "Official summit partner and industry innovator.")}</p>
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
                            <span>{t("portal.websiteBtn", "Website")}</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {sp.booth && (
                          <button
                            onClick={() => handleJumpToBooth(sp.booth)}
                            className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Layers size={11} />
                            <span>{t("portal.boothPrefix", "Booth")} #{sp.booth}</span>
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
                <div>
                  <h3 className="text-base font-black text-slate-900">{t("portal.exhibitionDemoPods", "Exhibition Hall Demo Pods")}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExhibitors.map(ex => (
                    <div key={ex.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
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
                            <bdi dir="ltr">{t("portal.boothPrefix", "Booth")} #{ex.booth || ex.boothNumber || "TBD"}</bdi>
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900">{ex.name || ex.companyName}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 font-medium mt-1">{ex.description || t("portal.liveDemosAndB2B", "Live product demonstrations and B2B solutions.")}</p>
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
                            <span>{t("portal.websiteBtn", "Website")}</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {ex.booth && (
                          <button
                            onClick={() => handleJumpToBooth(ex.booth)}
                            className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Layers size={11} />
                            <span>{t("portal.locateOnMap", "Locate on Map")}</span>
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
            
            {/* Top Toolbar: Plan Switcher, Sub-floor Switcher & Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Multi-plan switchers if more than 1 floor plan */}
                {visibleFloorPlans.length > 1 && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto max-w-full">
                    {visibleFloorPlans.map((plan, idx) => (
                      <button
                        key={plan.id || idx}
                        onClick={() => setActiveFloorIndex(idx)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          activeFloorIndex === idx
                            ? "bg-white text-blue-600 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Layers size={13} className={activeFloorIndex === idx ? "text-blue-600" : "text-slate-400"} />
                        <span>{plan.name || `${t("portal.floorPlanPrefix", "Floor Plan")} ${idx + 1}`}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub-floors switcher if active plan has multiple floors */}
                {activePlanFloors.length > 1 && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto max-w-full">
                    {activePlanFloors.map((fl, fIdx) => (
                      <button
                        key={fl.id || fIdx}
                        onClick={() => {
                          setSubFloorIndex(fIdx);
                          setSelectedBoothElementId(null);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          subFloorIndex === fIdx
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {fl.name || `${t("portal.levelPrefix", "Level")} ${fIdx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-time search for booths and exhibitors */}
              <div className="relative w-full md:w-80 shrink-0">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={floorPlanSearch}
                  onChange={(e) => setFloorPlanSearch(e.target.value)}
                  placeholder={t("portal.searchBoothOrExhibitor", "Search booth #, company name, or stage...")}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
                {floorPlanSearch && (
                  <button
                    onClick={() => setFloorPlanSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Active Floor Plan Canvas / Viewer Card */}
            {activePlan ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                
                {/* Card Header: Plan Name, Active Sub-Floor & Target Booth Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {activePlan.name || t("portal.mainHall", "Main Exhibition Hall")}
                    </span>
                    {activePlanFloors.length > 1 && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {activeSubFloor?.name || `${t("portal.levelPrefix", "Level")} ${subFloorIndex + 1}`}
                      </span>
                    )}
                  </div>

                  {highlightedBooth && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold animate-pulse">
                      <span>{t("portal.targetBooth", "Target Booth: #{booth}", { booth: highlightedBooth })}</span>
                      <button
                        onClick={() => setHighlightedBooth(null)}
                        className="hover:text-amber-950 p-0.5 rounded cursor-pointer"
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Canvas Viewport */}
                <div className="h-[560px] sm:h-[640px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner flex items-center justify-center">
                  
                  {/* Floating Canvas Navigation Toolbar */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg">
                    <button
                      onClick={() => canvasRef.current?.zoomIn?.()}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={t("portal.zoomIn", "Zoom In")}
                      aria-label="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      onClick={() => canvasRef.current?.zoomOut?.()}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={t("portal.zoomOut", "Zoom Out")}
                      aria-label="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <div className="h-px bg-slate-200 mx-1" />
                    <button
                      onClick={() => canvasRef.current?.zoomToFit?.()}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={t("portal.fitToScreen", "Fit to Screen")}
                      aria-label="Fit to Screen"
                    >
                      <Maximize size={16} />
                    </button>
                    <button
                      onClick={() => canvasRef.current?.zoomToFit?.()}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={t("portal.resetView", "Reset View")}
                      aria-label="Reset View"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>

                  {/* Render Konva Canvas */}
                  {currentElements.length > 0 || blueprintUrl ? (
                    <FloorPlanCanvas
                      ref={canvasRef}
                      elements={currentElements}
                      blueprintUrl={blueprintUrl}
                      blueprintOpacity={currentBlueprint.opacity ?? 0.8}
                      blueprintX={currentBlueprint.x ?? 0}
                      blueprintY={currentBlueprint.y ?? 0}
                      blueprintWidth={currentBlueprint.width || activePlan.width || 2400}
                      blueprintHeight={currentBlueprint.height || activePlan.height || 1500}
                      blueprintRotation={currentBlueprint.rotation || 0}
                      blueprintIsLocked={true}
                      snapToGrid={false}
                      showGrid={false}
                      toolMode="preview"
                      floorPlanFont={activePlan.fontFamily || "Inter"}
                      exhibitors={exhibitors}
                      attendees={attendees}
                      canvasWidth={activePlan.width || 2400}
                      canvasHeight={activePlan.height || 1500}
                      previewSearchQuery={floorPlanSearch}
                      previewFilter="all"
                      selectedIds={selectedBoothElementId ? [selectedBoothElementId] : []}
                      onSelectId={(id) => {
                        const selId = Array.isArray(id) ? id[0] || null : (id || null);
                        setSelectedBoothElementId(selId);
                      }}
                      isPreviewMode={true}
                      previewDeviceMode="desktop"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <Layers size={44} className="text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-700">
                        {t("portal.noElementsOnPlan", "This floor plan has not been configured with visual elements or blueprint maps yet.")}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {t("portal.visualPlanDesc", "Interactive elements configured for this floor plan.")}
                      </p>
                    </div>
                  )}

                  {/* Floating Booth / Exhibitor Details Card */}
                  {selectedElement && (
                    <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-xl space-y-3 animate-fade-in">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {selectedElement.label || selectedElement.boothNumber || `${t("portal.boothPrefix", "Booth")} #${selectedElement.id?.slice(0, 4)}`}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {selectedElement.type?.replace("-", " ") || "Booth"}
                            </span>
                          </div>
                          {(selectedElement.size || (selectedElement.width && selectedElement.height)) && (
                            <p className="text-[11px] text-slate-400 font-medium">
                              {selectedElement.size || `${Math.round(selectedElement.width / 10)}m × ${Math.round(selectedElement.height / 10)}m`}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedBoothElementId(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Exhibitor Info if assigned */}
                      {selectedBoothExhibitor ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                          <div className="flex items-center gap-3">
                            {selectedBoothExhibitor.logo ? (
                              <img
                                src={selectedBoothExhibitor.logo}
                                alt={selectedBoothExhibitor.name}
                                className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                                {(selectedBoothExhibitor.name || "E").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {selectedBoothExhibitor.name}
                              </h5>
                              <p className="text-[11px] text-slate-500 truncate">
                                {selectedBoothExhibitor.industry || selectedBoothExhibitor.category || t("portal.exhibitors", "Exhibitor")}
                              </p>
                            </div>
                          </div>

                          {selectedBoothExhibitor.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {selectedBoothExhibitor.description}
                            </p>
                          )}

                          <button
                            onClick={() => {
                              setExhibitorSearch(selectedBoothExhibitor.name || "");
                              setSelectedExhibitorModal(selectedBoothExhibitor);
                              setActiveTab("exhibitors");
                            }}
                            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>{t("portal.viewExhibitorInDirectory", "View Exhibitor in Directory")}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-slate-500 text-[11px]">
                          {selectedElement.status === "available"
                            ? t("portal.availableBooth", "This location is currently available.")
                            : t("portal.venueFeature", "Venue feature or exhibition stand.")}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <Layers size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">{t("portal.noFloorPlansYet", "No floor plans published yet")}</h3>
                <p className="text-xs text-slate-400">{t("portal.noFloorPlansHelp", "The event organizers have not uploaded 2D venue maps yet.")}</p>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: MY DIGITAL PASS & GATE QR CODE                                 */}
        {/* ==================================================================== */}
        {activeTab === "badge" && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg text-center space-y-6">
              
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                  {t("portal.verifiedCredential", "Verified Ingress Credential")}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                  {t("portal.gatePassTitle", "Fast-Track Gate Pass")}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {t("portal.gatePassDesc", "Present this QR code at the registration gate for instant badge printing and badge scan.")}
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto shadow-inner">
                {badgeQrUrl ? (
                  <img src={badgeQrUrl} alt="Badge QR Pass" className="w-56 h-56 object-contain rounded-2xl bg-white p-2 shadow-xs" />
                ) : (
                  <div className="w-56 h-56 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                    <Ticket size={48} className="animate-pulse" />
                  </div>
                )}
              </div>

              {/* Attendee Details Table */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-start text-xs space-y-2 max-w-md mx-auto font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t("portal.delegateName", "Delegate Name")}</span>
                  <span className="font-bold text-slate-900">{attendeeDisplayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t("portal.accessTier", "Access Tier")}</span>
                  <span className="font-bold text-indigo-600">{getLocalizedTicketTierName(attendeeTicketType, t)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t("portal.badgeCode", "Badge Code")}</span>
                  <bdi dir="ltr" className="font-mono font-bold text-slate-800">{activeBadgeCode}</bdi>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t("portal.event", "Event")}</span>
                  <span className="font-bold text-slate-800">{eventDetails.title || t("portal.defaultEventTitle", "Summit")}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2">
                <button
                  onClick={handlePrintBadge}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-650/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>{t("portal.printBadgeBtn", "Print Official A4 Badge")}</span>
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
                  <span>{t("portal.addToCalendarBtn", "Add to Calendar")}</span>
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
            <div className="p-7 sm:p-9 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4 max-w-xl relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Smartphone size={12} />
                    <span>{t("portal.officialCompanionApp", "Official Companion App")}</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                    <bdi dir="ltr">iOS & Android</bdi>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  {t("portal.takeSummitInPocket", "Take {title} in Your Pocket", { title: eventDetails.title || "the Summit" })}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {t("portal.mobileAppHeroDesc", "Download the Eventzone Mobile App for fast-track badge check-in, NFC business card exchange, 1-on-1 direct delegate messaging, and live indoor GPS.")}
                </p>

                {/* Unified Account Callout */}
                <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 size={15} />
                    <span>{t("portal.singleSignOn", "Single Sign-On (No New Account Needed)")}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    {t("portal.singleSignOnHelp", "Simply log in to the mobile app using your registered email")} <bdi dir="ltr" className="font-mono font-bold text-white">{currentUser?.email || t("portal.yourTicketEmail", "your ticket email")}</bdi>. {t("portal.singleSignOnSync", "Your bookmarks, pass, and connections sync automatically.")}
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
                    <span>{t("portal.downloadAppStore", "Download on App Store")}</span>
                    <ExternalLink size={13} className="text-slate-500" />
                  </a>

                  <a
                    href="https://play.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t("portal.getGooglePlay", "Get it on Google Play")}</span>
                    <ExternalLink size={13} className="text-slate-400" />
                  </a>
                </div>
              </div>

              {/* QR Code Scanner Box */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shrink-0 shadow-2xl relative z-10 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-200">{t("portal.scanToDownload", "Scan to Download App")}</span>
                <div className="p-3 bg-white rounded-2xl shadow-inner">
                  {appQrUrl ? (
                    <img src={appQrUrl} alt="Download Eventzone App" className="w-36 h-36 object-contain" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                      <Smartphone size={32} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{t("portal.compatibleIosAndroid", "Compatible with iOS & Android")}</span>
              </div>
            </div>

            {/* Mobile-Exclusive Features Grid */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{t("portal.whyUseApp", "Why Use the Eventzone Mobile App?")}</h3>
                <p className="text-xs text-slate-500 font-medium">{t("portal.whyUseAppSubtitle", "Engineered for seamless on-site engagement and lightning-fast networking.")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Feature 1: NFC & Contact Swapping */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{t("portal.nfcFeature", "NFC & Tap-to-Connect")}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {t("portal.nfcFeatureDesc", "Tap phones or scan attendee QR badges to instantly exchange verified digital business cards and LinkedIn profiles.")}
                  </p>
                </div>

                {/* Feature 2: 1-on-1 Direct Chat */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{t("portal.chatFeature", "Live 1-on-1 In-App Chat")}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {t("portal.chatFeatureDesc", "Message your accepted delegate connections directly in the app to schedule on-site coffee chats and B2B meetings.")}
                  </p>
                </div>

                {/* Feature 3: Push Notifications */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Megaphone size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{t("portal.pushAlertsFeature", "Real-Time Push Alerts")}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {t("portal.pushAlertsFeatureDesc", "Get notified 10 minutes before your bookmarked sessions start, plus instant announcements for room or speaker updates.")}
                  </p>
                </div>

                {/* Feature 4: Indoor Navigation */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{t("portal.gpsFeature", "Turn-by-Turn Venue GPS")}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {t("portal.gpsFeatureDesc", "Interactive 2D/3D map that navigates you straight to sponsor demo pods, keynote auditoriums, and workshop rooms.")}
                  </p>
                </div>

                {/* Feature 5: Offline Fast-Track Pass */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Ticket size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{t("portal.offlinePassFeature", "Offline Scannable Pass")}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {t("portal.offlinePassFeatureDesc", "Save your fast-track badge to Apple Wallet or Google Wallet for lightning check-in even when convention WiFi is spotty.")}
                  </p>
                </div>

                {/* Feature 6: Schedule Sync */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{t("portal.calendarSyncFeature", "Native Calendar Sync")}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {t("portal.calendarSyncFeatureDesc", "1-tap sync with your native iOS or Android calendar app with automatic time-zone adjustments.")}
                  </p>
                </div>

              </div>
            </div>

            {/* 3-Step Setup Guide */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">{t("portal.howToGetStarted", "How to Get Started in 30 Seconds")}</h3>
                <p className="text-xs text-slate-500 font-medium">{t("portal.noNewRegRequired", "No new registration required — use your existing login.")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{t("portal.step1Title", "Download the App")}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t("portal.step1Desc", "Search \"Eventzone\" on the App Store or Google Play, or scan the QR code above.")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{t("portal.step2Title", "Sign In with Same Email")}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t("portal.step2Desc", "Log in using")} <bdi dir="ltr" className="font-mono font-bold text-slate-700">{currentUser?.email || t("portal.yourTicketEmail", "your ticket email")}</bdi>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{t("portal.step3Title", "Start Networking!")}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {t("portal.step3Desc", "Open \"{title}\" to exchange contacts, chat, and bookmark sessions.").replace("{title}", eventDetails.title || t("portal.defaultEventTitle", "My Event"))}
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
        const isConn = connections.some(c => isMatchingEmail(c.email, att.email) || (c.partnerId && c.partnerId === att.id));
        const pendingRec = pendingReceived.find(p => isMatchingEmail(p.sender_email, att.email));
        const pendingSnt = pendingSent.find(p => isMatchingEmail(p.recipient_email, att.email)) || (requestSentTargetId === (att.id || att.email));

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
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-7 text-start space-y-5 animate-scale-up relative max-h-[90vh] overflow-y-auto">
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
                    {t("portal.eventzoneProfile", "Eventzone Profile")}
                  </span>
                  {lookingForList.length > 0 && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                      <bdi dir="ltr">{lookingForList.length}</bdi> <span>{t("portal.lookingForCount", "Looking For")}</span>
                    </span>
                  )}
                  {interestsList.length > 0 && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                      <bdi dir="ltr">{interestsList.length}</bdi> <span>{t("portal.interestsCount", "Interests")}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bio / About */}
              {att.bio && (
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("portal.aboutBackground", "About & Background")}</span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {att.bio}
                  </p>
                </div>
              )}

              {/* What I'm Looking For Section */}
              {lookingForList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("portal.whatImLookingFor", "What I'm Looking For")}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lookingForList.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-xl text-xs font-bold">
                        🎯 {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* {t("portal.interestsMatchmaking", "Interests & Matchmaking")} Section */}
              {interestsList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("portal.interestsMatchmaking", "Interests & Matchmaking")}</span>
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("portal.connectSocialLinks", "Connect & Social Links")}</span>
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
                    <span>{t("portal.editPlatformProfile", "Edit My Platform Profile")}</span>
                  </button>
                ) : (
                  <>
                    {isConn ? (
                      <div className="flex flex-col gap-2.5 w-full">
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <button
                            onClick={() => handleStartChatWith(att)}
                            className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle size={14} />
                            <span>{t("portal.startOneOnOneChat", "Start 1-on-1 Chat")}</span>
                          </button>
                          <button
                            onClick={() => handleOpenBookingModal(att)}
                            className="py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CalendarPlus size={14} />
                            <span>{t("portal.bookMeetingBtn", "Book Meeting")}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 py-2.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>{t("portal.connectedStatus", "Connected Delegate")}</span>
                          </div>
                          <button
                            onClick={() => handleOpenDisconnectModal(att)}
                            className="py-2.5 px-3 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <UserMinus size={13} />
                            <span>{t("portal.removeConnectionBtn", "Remove")}</span>
                          </button>
                        </div>
                      </div>
                    ) : pendingRec ? (
                      <div className="flex items-center gap-2 flex-1 w-full">
                        <button
                          onClick={() => handleAcceptConnection(pendingRec.id, att)}
                          disabled={isProcessingAction}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                        >
                          <Check size={14} />
                          <span>{t("portal.acceptInvitation", "Accept Connection")}</span>
                        </button>
                        <button
                          onClick={() => handleDeclineConnection(pendingRec.id)}
                          disabled={isProcessingAction}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <X size={14} />
                          <span>{t("portal.decline", "Decline")}</span>
                        </button>
                      </div>
                    ) : pendingSnt ? (
                      <div className="flex-1 py-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5">
                        <Clock size={14} />
                        <span>{t("portal.invitationPending", "Connection Request Sent (Pending)")}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 flex-1 w-full">
                        <button
                          onClick={() => {
                            const target = att;
                            setSelectedAttendeeForModal(null);
                            setConnectModalTarget(target);
                          }}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                        >
                          <UserCheck size={14} />
                          <span>{t("portal.connectAction", "Connect to Message")}</span>
                        </button>
                        <p className="text-[11px] text-slate-400 text-center font-medium">
                          {t("portal.connectRequiredNotice", "Connect with this delegate to unlock 1-on-1 direct messaging.")}
                        </p>
                      </div>
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
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-7 text-start space-y-5 animate-scale-up relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{t("portal.connectWithTitle", "Connect with {name}").replace("{name}", connectModalTarget.name || connectModalTarget.firstName || "Delegate")}</h3>
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
                  {t("portal.introNoteOptional", "Introduction Note (Optional)")}
                </label>
                <textarea
                  rows={3}
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  placeholder={t("portal.introNotePlaceholder", "Hi! I'd love to connect and discuss potential synergies during the summit...")}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConnectModalTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {t("portal.cancel", "Cancel")}
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
                      <span>{t("portal.confirmAndConnect", "Confirm & Connect")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2.5: REMOVE CONNECTION CONFIRMATION                            */}
      {/* ==================================================================== */}
      {disconnectModalTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-7 text-start space-y-5 animate-scale-up relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2 text-red-600">
                <UserMinus size={18} />
                <h3 className="text-base font-black text-slate-900">{t("portal.removeConnectionTitle", "Remove Connection")}</h3>
              </div>
              <button
                onClick={() => setDisconnectModalTarget(null)}
                disabled={isRemovingConnection}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {t("portal.removeConnectionConfirm", "Are you sure you want to remove your connection with {name}? You will no longer be connected and 1-on-1 direct messaging will be disabled.", { name: disconnectModalTarget.name })}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDisconnectModalTarget(null)}
                disabled={isRemovingConnection}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {t("portal.cancelBtn", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveConnection}
                disabled={isRemovingConnection}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {isRemovingConnection ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t("portal.removingConnection", "Removing...")}</span>
                  </>
                ) : (
                  <>
                    <UserMinus size={13} />
                    <span>{t("portal.confirmRemoveConnection", "Remove Connection")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: EDIT MY NETWORKING PROFILE                                  */}
      {/* ==================================================================== */}
      {isEditingMyProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-7 text-start space-y-5 animate-scale-up relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{t("portal.editNetworkingProfile", "Edit My Networking Profile")}</h3>
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
                  {t("portal.jobTitleHeadline", "Job Title / Headline")}
                </label>
                <input
                  type="text"
                  value={myHeadline}
                  onChange={(e) => setMyHeadline(e.target.value)}
                  placeholder={t("portal.jobTitlePlaceholder", "e.g. Chief Executive Officer, AI Specialist...")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("portal.companyOrgLabel", "Company / Organization")}
                </label>
                <input
                  type="text"
                  value={myCompany}
                  onChange={(e) => setMyCompany(e.target.value)}
                  placeholder={t("portal.companyPlaceholder", "e.g. Acme Innovations Corp")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("portal.professionalBio", "Professional Bio")}
                </label>
                <textarea
                  rows={3}
                  value={myBio}
                  onChange={(e) => setMyBio(e.target.value)}
                  placeholder={t("portal.bioPlaceholder", "Tell delegates about your expertise and focus...")}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("portal.whatImLookingForLabel", "What I'm Looking For")}
                </label>
                <input
                  type="text"
                  value={myLookingFor}
                  onChange={(e) => setMyLookingFor(e.target.value)}
                  placeholder={t("portal.lookingForPlaceholder", "e.g. B2B Partnerships, Investors, Tech Vendors...")}
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
                    <span>{t("portal.saveChanges", "Save Changes")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2.8: BOOK 1-ON-1 ATTENDEE MEETING                              */}
      {/* ==================================================================== */}
      {isBookingModalOpen && bookingTargetAttendee && (() => {
        const att = bookingTargetAttendee;
        const name = att.name || `${att.firstName || ""} ${att.lastName || ""}`.trim() || "Delegate";
        const job = att.jobTitle || att.job_title || att.role || "Delegate";
        const comp = att.company || att.organization || "";

        const locationOptions = [
          { value: "Networking Lounge", label: t("portal.locNetworkingLounge", "Networking Lounge") },
          { value: "Main Hall / Booth Area", label: t("portal.locMainHall", "Main Hall / Booth Area") },
          { value: "VIP Lounge", label: t("portal.locVipLounge", "VIP Lounge") },
          { value: "Exhibition Floor", label: t("portal.locExhibitionFloor", "Exhibition Floor") },
          { value: "Cafeteria / Coffee Area", label: t("portal.locCafeteria", "Cafeteria / Coffee Area") },
          { value: "Custom Location", label: t("portal.locCustom", "Custom Location...") }
        ];

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-7 text-start space-y-5 animate-scale-up relative max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <CalendarPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{t("portal.bookMeetingTitle", "Schedule 1-on-1 Meeting")}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{t("portal.bookMeetingSubtitle", "Choose a day and time slot during event operating hours.")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Target Attendee Preview Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                {att.avatar || att.image ? (
                  <img src={att.avatar || att.image} alt={name} className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-start">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-900 truncate">{name}</h4>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                      {t("portal.connectedBadge", "Connected")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {job} {comp ? `• ${comp}` : ""}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* 1. Event Day Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t("portal.selectMeetingDay", "1. Select Event Day")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {eventAvailableDays.map((d, idx) => {
                      const isSelected = bookingDate === d;
                      const dateObj = new Date(`${d}T00:00:00`);
                      const dayName = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString(lang === "fr" ? "fr-FR" : (lang === "ar" ? "ar-DZ" : "en-US"), { weekday: "short" })
                        : "";
                      const monthDay = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString(lang === "fr" ? "fr-FR" : (lang === "ar" ? "ar-DZ" : "en-US"), { month: "short", day: "numeric" })
                        : d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setBookingDate(d)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs ring-2 ring-blue-600/20"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">
                            {t("portal.dayCountPrefix", "Day")} {idx + 1} {dayName ? `• ${dayName}` : ""}
                          </div>
                          <div className="text-xs font-black">{monthDay}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Choose Time Slot */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {t("portal.selectTimeSlot", "2. Choose Time Slot")}
                    </label>
                    {isLoadingBookedSlots && (
                      <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" />
                        <span>{t("portal.checkingAvailability", "Checking slots...")}</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                    {eventOperatingHours.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = bookingStartTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setBookingStartTime(slot)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                            isBooked
                              ? "bg-slate-100 text-slate-400 border border-dashed border-slate-200 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600/20"
                              : "bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span dir="ltr">{slot}</span>
                          {isBooked ? (
                            <span className="text-[9px] text-slate-400 font-medium">{t("portal.slotBooked", "Booked")}</span>
                          ) : isSelected ? (
                            <span className="text-[9px] text-blue-100">{t("portal.slotSelected", "Selected")}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Duration & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t("portal.meetingDuration", "Duration")}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[15, 30, 45].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setBookingDuration(d)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                            bookingDuration === d
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {d} {t("portal.minsShort", "min")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t("portal.meetingLocation", "Location")}
                    </label>
                    <SearchableSelect
                      value={bookingLocation}
                      onChange={setBookingLocation}
                      options={locationOptions}
                      placeholder={t("portal.selectLocation", "Select location")}
                      isClearable={false}
                    />
                  </div>
                </div>

                {/* If Custom Location selected */}
                {bookingLocation === "Custom Location" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("portal.customLocationDetails", "Custom Location Details")}
                    </label>
                    <input
                      type="text"
                      value={bookingCustomLocation}
                      onChange={(e) => setBookingCustomLocation(e.target.value)}
                      placeholder={t("portal.customLocationPlaceholder", "e.g. Booth #B12, VIP Lounge Table 4...")}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                    />
                  </div>
                )}

                {/* 4. Meeting Objective / Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t("portal.meetingTitleLabel", "Meeting Purpose / Subject")}
                  </label>
                  <input
                    type="text"
                    value={bookingTitle}
                    onChange={(e) => setBookingTitle(e.target.value)}
                    placeholder={t("portal.meetingTitlePlaceholder", "e.g. Discussion on B2B Collaboration")}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all"
                  />
                </div>

                {/* 5. Optional Note */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t("portal.meetingNoteOptional", "Intro Note or Agenda (Optional)")}
                  </label>
                  <textarea
                    rows={2}
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    placeholder={t("portal.meetingNotePlaceholder", "Share a quick agenda or topic of discussion...")}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all leading-relaxed"
                  />
                </div>

                {/* Error Banner */}
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={15} className="shrink-0 text-red-500" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t("portal.cancelBtn", "Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMeeting || !bookingStartTime}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingMeeting ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CalendarCheck size={14} />
                        <span>{t("portal.sendMeetingRequestBtn", "Send Meeting Request")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
