/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  CheckCircle2, Ticket, ShieldAlert, ShieldCheck,
  ChevronDown, LayoutDashboard, Calendar, Clock,
  Users2, UserCheck, BarChart3, X, Globe, Map, Sparkles, Upload, Mail,
  Building2, Plus, ArrowLeft, ArrowRight, Layers, LogOut, Compass, ExternalLink, ChevronRight, Home as HomeIcon, User,
  FileText, ClipboardList, QrCode, Store, Mic2, Check, TrendingUp, Share2, Boxes, Truck, Package, Files, Code2, Award, Eye
} from "lucide-react";

import MainHomePage from "../components/MainHomePage";
import Overview from "../components/Overview";
import CalendarView from "../components/CalendarView";
import {
  OverviewSkeleton,
  TableViewSkeleton,
  CalendarSkeleton,
  AnalyticsSkeleton,
  LogisticsSkeleton,
  DocumentsSkeleton,
  FormsSkeleton,
  RSVPSkeleton,
  EventDetailsSkeleton,
  FloorPlanSkeleton,
  EventsHubSkeleton,
  LandingPageSkeleton,
  HomePageSkeleton,
  ProfileSkeleton,
  DevelopersSkeleton,
  CertificatesSkeleton
} from "../components/SkeletonLoaders";

const FloorPlanModifier = dynamic(() => import("../components/FloorPlanModifier"), { 
  ssr: false,
  loading: () => <FloorPlanSkeleton />
});
import FloorPlanGallery from "../components/FloorPlanGallery";
import GenericTableView from "../components/GenericTableView";
const LivePageBuilder = dynamic(() => import("../components/LivePageBuilder"), { 
  ssr: false,
  loading: () => <EventDetailsSkeleton />
});
import EventDetailsView from "../components/EventDetailsView";
import AuthView from "../components/AuthView";
import OrganizerEventsHub from "../components/OrganizerEventsHub";
import EventCreationWizard from "../components/EventCreationWizard";
import VisitorPortal from "../components/VisitorPortal";
import EventPublicLandingPage from "../components/EventPublicLandingPage";
import ProfileView from "../components/ProfileView";
import MyTicketsPage from "../components/MyTicketsPage";
import FormsView from "../components/FormsView";
import RSVPView from "../components/RSVPView";
import LogisticsView from "../components/LogisticsView";
import DocumentsView from "../components/DocumentsView";
import DevelopersView from "../components/DevelopersView";
import PlatformAdminView from "../components/PlatformAdminView";
import PublicRSVPModal from "../components/PublicRSVPModal";
import TicketDrawer from "../components/TicketDrawer";
import AttendeeDrawer from "../components/AttendeeDrawer";
import TeamMemberDrawer from "../components/TeamMemberDrawer";
import CompanyDrawer from "../components/CompanyDrawer";
import SearchableSelect from "../components/SearchableSelect";
import OrganizerAttendeePortalSettings from "../components/OrganizerAttendeePortalSettings";
import AttendeePortalView from "../components/AttendeePortalView";
import { getEffectivePermissions, canViewModule, canEditModule, getModulePermission } from "../lib/permissions";
import { LanguageProvider, useLanguage } from "../lib/i18n";

import {
  fetchEventDetails, updateEventDetails, fetchEventBundle,
  fetchSessions, upsertSession, deleteSession, archiveSession,
  fetchAttendees, upsertAttendee, deleteAttendee, archiveParticipant,
  fetchPending, upsertPending, deletePending,
  fetchOrganizations, upsertOrganization, deleteOrganization,
  fetchSponsors, upsertSponsor, deleteSponsor,
  fetchExhibitors, upsertExhibitor, deleteExhibitor,
  fetchOpportunities, upsertOpportunity, deleteOpportunity, archiveOpportunity,
  fetchInfluencers, upsertInfluencer, deleteInfluencer, archiveInfluencer, recordInfluencerClick,
  fetchTickets, upsertTicket, deleteTicket, archiveTicket,
  fetchTeam, upsertTeamMember, deleteTeamMember, archiveTeamMember,
  fetchFloorPlans, upsertFloorPlan, deleteFloorPlan, archiveFloorPlan, restoreFloorPlan, permanentDeleteFloorPlan, generateUuid,
  fetchForms, upsertForm, deleteForm, archiveForm,
  fetchFormSubmissions, submitFormResponse, deleteFormSubmission,
  fetchRSVPs, fetchRSVPSettings, upsertRSVPSettings, submitGuestRSVP, updateRSVPStatus, deleteRSVP, archiveRSVP,
  fetchLogistics, upsertLogisticsItem, deleteLogisticsItem, archiveLogisticsItem, upsertFullLogistics,
  fetchDocuments, upsertDocument, deleteDocument, archiveDocument, togglePinDocument,
  uploadFileToBucket,
  fetchUserEvents, fetchPublicEvents, createEvent, deleteEvent, archiveEvent, unarchiveEvent,
  fetchVisitorRegistrations, registerVisitorForEvent, upsertUserProfile,
  isMatchingEmail, isMatchingPhoneNumber, cleanPhoneNumber,
  setActiveEventId, getActiveEventId, DEFAULT_EVENT_ID, SHOWCASE_EVENTS,
  subscribeToRealtimeSync, broadcastRealtimeChange
} from "../lib/db";
import { 
  supabase, 
  safeLocalStorageSet, 
  safeLocalStorageGet, 
  safeLocalStorageRemove, 
  sanitizeUserForStorage,
  cleanupLocalStorageQuota
} from "../lib/supabase";

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

export function HomeContent() {
  const searchParamsHook = useSearchParams();
  const { t, lang, setLang, isRTL, dir, languages } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      return safeLocalStorageGet("eventzone_user", null);
    }
    return null;
  });
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || "";
      return searchParams.has("code") || searchParams.has("error") || hash.includes("access_token") || hash.includes("error");
    }
    return false;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState("signin");

  // Multi-Event State
  const [publicEvents, setPublicEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [activeEventId, setActiveEventStateId] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      const rsvpParam = searchParams.get("rsvp");
      const isEventLanding = rsvpParam === "true" || viewParam === "public-rsvp" || (viewParam === "rsvp" && searchParams.get("public") === "true") || searchParams.get("ref");
      const nonEventViews = ["home", "auth", "profile", "events-hub", "my-tickets", "create-event", "admin"];
      const isHome = !viewParam || nonEventViews.includes(viewParam);
      if (isHome && !isEventLanding) {
        return DEFAULT_EVENT_ID;
      }
      return searchParams.get("eventId") || searchParams.get("event") || DEFAULT_EVENT_ID;
    }
    return DEFAULT_EVENT_ID;
  });
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false);
  const [pendingEventCreation, setPendingEventCreation] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("eventzone_pending_event_creation");
        return saved ? JSON.parse(saved) : null;
      } catch (e) {}
    }
    return null;
  });
  const [eventSwitcherOpen, setEventSwitcherOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Visitor Registrations
  const [visitorRegistrations, setVisitorRegistrations] = useState([]);

  // Main UI routing view: initialized synchronously from URL query param to eliminate flash of home page
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      const rsvpParam = searchParams.get("rsvp");

      if (rsvpParam === "true" || viewParam === "public-rsvp" || (viewParam === "rsvp" && searchParams.get("public") === "true")) {
        return "event-landing";
      }

      const validViews = [
        "home", "auth", "profile", "my-tickets", "events-hub", "create-event", "event-landing", "register", "visitor-portal", "attendee-portal", "overview", "page-builder", "calendar", "event-details", 
        "attendees", "pending", "organizations", "sponsors", 
        "exhibitors", "speakers", "opportunities", "influencers", "tickets", "forms", "rsvp", "logistics", "documents", "check-in", 
        "my-team", "developers", "analytics", "communications", "certificates", "floor-plan", "portal-settings", "admin"
      ];
      if (viewParam && validViews.includes(viewParam)) {
        return viewParam;
      }
      if (searchParams.get("ref") || searchParams.get("influencer") || searchParams.get("referral")) {
        return "event-landing";
      }
    }
    return "home";
  });
 
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [activeFloorPlanId, setActiveFloorPlanId] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("planId") || null;
    }
    return null;
  });
  const [initialPreviewMode, setInitialPreviewMode] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("preview") === "true";
    }
    return false;
  });
  const [saveStatus, setSaveStatus] = useState("saved");

  // Single-event data with instant localStorage cache hydration
  const getInitialEventData = (key, fallback) => {
    if (typeof window !== "undefined") {
      try {
        const urlId = new URLSearchParams(window.location.search).get("eventId") || DEFAULT_EVENT_ID;
        const cached = localStorage.getItem(`eventzone_cache_${key}_${urlId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed !== undefined && parsed !== null) return parsed;
        }
      } catch (e) {}
    }
    return fallback;
  };

  const [eventDetails, setEventDetails] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const urlId = new URLSearchParams(window.location.search).get("eventId") || DEFAULT_EVENT_ID;
        const cached = localStorage.getItem(`eventzone_cached_event_${urlId}`) || localStorage.getItem(`eventzone_cache_event_${urlId}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  const [sessions, setSessions] = useState(() => getInitialEventData("sessions", []));
  const [attendees, setAttendees] = useState(() => getInitialEventData("attendees", []));
  const [pending, setPending] = useState(() => getInitialEventData("pending", []));
  const [organizations, setOrganizations] = useState(() => getInitialEventData("organizations", []));
  const [sponsors, setSponsors] = useState(() => getInitialEventData("sponsors", []));
  const [exhibitors, setExhibitors] = useState(() => getInitialEventData("exhibitors", []));
  const [opportunities, setOpportunities] = useState(() => getInitialEventData("opportunities", []));
  const [influencers, setInfluencers] = useState(() => getInitialEventData("influencers", []));
  const [tickets, setTickets] = useState(() => getInitialEventData("tickets", []));
  const [team, setTeam] = useState(() => getInitialEventData("team", []));
  const [floorPlans, setFloorPlans] = useState(() => getInitialEventData("floorPlans", []));
  const [forms, setForms] = useState(() => getInitialEventData("forms", []));
  const [formSubmissions, setFormSubmissions] = useState(() => getInitialEventData("formSubmissions", []));
  const [rsvps, setRsvps] = useState(() => getInitialEventData("rsvps", []));
  const [rsvpSettings, setRsvpSettings] = useState(() => getInitialEventData("rsvpSettings", null));
  const [logisticsData, setLogisticsData] = useState(() => getInitialEventData("logisticsData", {}));
  const [documents, setDocuments] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const urlId = new URLSearchParams(window.location.search).get("eventId") || DEFAULT_EVENT_ID;
        const cached = localStorage.getItem(`eventzone_documents_${urlId}`) || localStorage.getItem(`eventzone_cache_documents_${urlId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [showGlobalPublicRsvp, setShowGlobalPublicRsvp] = useState(false);
  const [simulatedMemberId, setSimulatedMemberId] = useState(null);

  const effectivePermissions = useMemo(() => {
    return getEffectivePermissions(currentUser, eventDetails, team, simulatedMemberId);
  }, [currentUser, eventDetails, team, simulatedMemberId]);

  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Modal State
  const [activeModalType, setActiveModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalTicket, setModalTicket] = useState("Standard Admission");
  const [modalSector, setModalSector] = useState("");
  const [modalContact, setModalContact] = useState("");
  const [modalWebsite, setModalWebsite] = useState("");
  const [modalTier, setModalTier] = useState("silver");
  const [modalBooth, setModalBooth] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalMax, setModalMax] = useState("");
  const [modalFeatures, setModalFeatures] = useState("");
  const [modalRole, setModalRole] = useState("Staff");
  const [modalLogo, setModalLogo] = useState("");
  const [modalOrgId, setModalOrgId] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const [showGlobalProfileModal, setShowGlobalProfileModal] = useState(false);

  // Auto-expand sidebar collapse blocks when active view changes
  useEffect(() => {
    if (["attendees", "pending", "speakers"].includes(currentView)) {
      setParticipantsOpen(true);
    }
    if (["organizations", "sponsors", "exhibitors"].includes(currentView)) {
      setCompaniesOpen(true);
    }
  }, [currentView]);

  // Check Local Auth Session and Supabase Auth State on mount
  useEffect(() => {
    let isMounted = true;
    let profileChannel = null;

    // Run proactive localStorage quota cleanup to guarantee space for auth tokens
    cleanupLocalStorageQuota();

    // 1. Initial check from LocalStorage for instant rendering
    if (typeof window !== "undefined") {
      try {
        const stored = safeLocalStorageGet("eventzone_user");
        if (stored && stored.id) {
          setCurrentUser(stored);
        }
      } catch (e) {
        console.warn("Session restore error:", e);
      }
    }

    // Helper to sync user profile from Supabase
    const syncUserProfile = async (session) => {
      if (!session?.user || !isMounted) return null;
      try {
        const userId = session.user.id;
        const userMeta = session.user.user_metadata || {};

        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // If no direct profile exists by UUID, check if an existing profile exists for this email
        if (!profile && session.user.email) {
          const { data: existingEmailProfile } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', session.user.email.trim())
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          if (existingEmailProfile) {
            profile = existingEmailProfile;
            // Also automatically re-link any events previously created under the old profile UUID to the active session UUID
            try {
              await supabase.from('events').update({ organizer_id: userId }).eq('organizer_id', existingEmailProfile.id);
            } catch (linkErr) {
              console.warn("Auto event re-link notice:", linkErr);
            }
          }
        }

        const retrievedName = profile?.full_name 
          || userMeta.full_name 
          || userMeta.name 
          || session.user.email?.split('@')[0] 
          || "Eventzone User";
        const retrievedRole = profile?.role 
          || userMeta.role 
          || "organizer";
        const retrievedAvatar = profile?.avatar_url 
          || userMeta.avatar_url 
          || userMeta.picture 
          || `https://ui-avatars.com/api/?name=${encodeURIComponent(retrievedName)}&background=0b5cdb&color=fff`;

        if (!profile) {
          const dbRole = (retrievedRole === 'attendee' || retrievedRole === 'visitor') ? 'attendee' : 'organizer';
          try {
            const { data: createdProf } = await supabase.from('profiles').upsert({
              id: userId,
              full_name: retrievedName,
              email: session.user.email,
              avatar_url: retrievedAvatar,
              role: dbRole,
              onboarding_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "id" }).select().maybeSingle();
            if (createdProf) profile = createdProf;
          } catch (upsertErr) {
            console.warn("Profile creation warning:", upsertErr);
          }
        }

        const profileMeta = profile?.metadata && typeof profile?.metadata === 'object' ? profile.metadata : {};
        const profileSocials = typeof profile?.social_links === 'object' && profile?.social_links !== null && !Array.isArray(profile?.social_links) ? profile.social_links : {};
        const isSuperAdmin = profile?.role === 'super_admin' || profile?.is_admin === true || profileMeta.role === 'super_admin' || userMeta.role === 'super_admin' || session.user.email?.toLowerCase() === 'eventzone114@gmail.com';

        const rawMaxEvents = profile?.max_events !== undefined && profile?.max_events !== null
          ? profile.max_events
          : (profileMeta.max_events !== undefined && profileMeta.max_events !== null ? profileMeta.max_events : (profileSocials.max_events !== undefined && profileSocials.max_events !== null ? profileSocials.max_events : null));

        const rawMaxAttendees = profile?.max_attendees !== undefined && profile?.max_attendees !== null
          ? profile.max_attendees
          : (profileMeta.max_attendees !== undefined && profileMeta.max_attendees !== null ? profileMeta.max_attendees : (profileSocials.max_attendees !== undefined && profileSocials.max_attendees !== null ? profileSocials.max_attendees : null));

        const resolvedStatus = profile?.status || profileMeta.status || profileSocials.status || 'active';

        const syncedUser = {
          id: userId,
          email: session.user.email,
          fullName: profile?.full_name || retrievedName,
          role: isSuperAdmin ? 'super_admin' : ((profile?.role === 'attendee' || profile?.role === 'visitor' || retrievedRole === 'attendee' || retrievedRole === 'visitor') ? 'visitor' : 'organizer'),
          companyName: profile?.company_name || userMeta.company_name || "",
          jobTitle: profile?.job_title || userMeta.job_title || "",
          phone: profile?.phone || "",
          bio: profile?.bio || "",
          location: profile?.location || "",
          interests: Array.isArray(profile?.interests) ? profile.interests : [],
          socialLinks: Array.isArray(profile?.social_links) ? profile.social_links : (typeof profile?.social_links === 'object' && profile?.social_links !== null ? Object.entries(profile.social_links).map(([platform, url]) => ({ platform, url })) : []),
          metadata: profileMeta,
          what_im_looking_for: profile?.what_im_looking_for || "",
          whatImLookingFor: profile?.what_im_looking_for || "",
          avatar: profile?.avatar_url || retrievedAvatar,
          isAdmin: isSuperAdmin,
          maxEvents: rawMaxEvents !== null && rawMaxEvents !== undefined && rawMaxEvents !== "" ? Number(rawMaxEvents) : null,
          maxAttendees: rawMaxAttendees !== null && rawMaxAttendees !== undefined && rawMaxAttendees !== "" ? Number(rawMaxAttendees) : null,
          accountStatus: resolvedStatus,
          status: resolvedStatus,
        };

        if (isMounted) {
          setCurrentUser(syncedUser);
          safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(syncedUser));
          setIsAuthProcessing(false);
          setAuthInitialized(true);
        }

        // Clean up URL query parameters & hash so code is not reused
        if (typeof window !== "undefined") {
          const cleanUrl = new URL(window.location.href);
          if (cleanUrl.searchParams.has("code") || cleanUrl.searchParams.has("state") || cleanUrl.hash.includes("access_token") || cleanUrl.hash.includes("error")) {
            cleanUrl.searchParams.delete("code");
            cleanUrl.searchParams.delete("state");
            cleanUrl.searchParams.delete("error");
            cleanUrl.searchParams.delete("error_description");
            cleanUrl.hash = "";
            window.history.replaceState({}, document.title, cleanUrl.toString());
          }
        }

        // Setup real-time profile channel
        if (!profileChannel && isMounted) {
          profileChannel = supabase
            .channel(`public-profiles-sync-${userId}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
              (payload) => {
                if (payload.new && isMounted) {
                  const updated = payload.new;
                  const updatedName = updated.full_name || "Eventzone User";
                  const updatedRole = updated.role || "organizer";
                  const updatedAvatar = updated.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName)}&background=0b5cdb&color=fff`;

                  const updatedMeta = updated.metadata && typeof updated.metadata === 'object' ? updated.metadata : {};
                  const updatedSocials = typeof updated.social_links === 'object' && updated.social_links !== null && !Array.isArray(updated.social_links) ? updated.social_links : {};
                  const isSuperAdminUpdated = updated.role === 'super_admin' || updated.is_admin === true || updatedMeta.role === 'super_admin' || session.user.email?.toLowerCase() === 'eventzone114@gmail.com';

                  const rawMaxEvUpdated = updated.max_events !== undefined && updated.max_events !== null
                    ? updated.max_events
                    : (updatedMeta.max_events !== undefined && updatedMeta.max_events !== null ? updatedMeta.max_events : (updatedSocials.max_events !== undefined && updatedSocials.max_events !== null ? updatedSocials.max_events : null));

                  const rawMaxAttUpdated = updated.max_attendees !== undefined && updated.max_attendees !== null
                    ? updated.max_attendees
                    : (updatedMeta.max_attendees !== undefined && updatedMeta.max_attendees !== null ? updatedMeta.max_attendees : (updatedSocials.max_attendees !== undefined && updatedSocials.max_attendees !== null ? updatedSocials.max_attendees : null));

                  const updatedStatus = updated.status || updatedMeta.status || updatedSocials.status || 'active';

                  const updatedUser = {
                    id: userId,
                    email: updated.email || session.user.email,
                    fullName: updatedName,
                    role: isSuperAdminUpdated ? 'super_admin' : ((updatedRole === 'attendee' || updatedRole === 'visitor') ? 'visitor' : 'organizer'),
                    companyName: updated.company_name || "",
                    jobTitle: updated.job_title || "",
                    phone: updated.phone || "",
                    bio: updated.bio || "",
                    location: updated.location || "",
                    interests: Array.isArray(updated.interests) ? updated.interests : [],
                    socialLinks: Array.isArray(updated.social_links) ? updated.social_links : [],
                    metadata: updatedMeta,
                    what_im_looking_for: updated.what_im_looking_for || "",
                    whatImLookingFor: updated.what_im_looking_for || "",
                    avatar: updatedAvatar,
                    isAdmin: isSuperAdminUpdated,
                    maxEvents: rawMaxEvUpdated !== null && rawMaxEvUpdated !== undefined && rawMaxEvUpdated !== "" ? Number(rawMaxEvUpdated) : null,
                    maxAttendees: rawMaxAttUpdated !== null && rawMaxAttUpdated !== undefined && rawMaxAttUpdated !== "" ? Number(rawMaxAttUpdated) : null,
                    accountStatus: updatedStatus,
                    status: updatedStatus,
                  };

                  setCurrentUser(updatedUser);
                  safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(updatedUser));
                }
              }
            )
            .subscribe();
        }

        return syncedUser;
      } catch (err) {
        console.warn("Supabase profile sync error:", err);
        return null;
      }
    };

    // 2. Listen to all auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" && isMounted) {
        safeLocalStorageRemove("eventzone_user");
        setCurrentUser(null);
        setUserEvents([]);
        setVisitorRegistrations([]);
        setAuthInitialized(true);
        setIsAuthProcessing(false);
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session?.user && isMounted) {
        const syncedUser = await syncUserProfile(session);
        
        // Check if there was a pending event creation waiting for login!
        let pendingData = null;
        if (typeof window !== "undefined") {
          try {
            const saved = sessionStorage.getItem("eventzone_pending_event_creation");
            if (saved) {
              pendingData = JSON.parse(saved);
              sessionStorage.removeItem("eventzone_pending_event_creation");
            }
          } catch (e) {}
        }

        if (pendingData && session?.user?.id) {
          try {
            const finalForm = {
              ...pendingData,
              hostName: pendingData.hostName || syncedUser?.fullName || session.user.user_metadata?.full_name || "Event Organizer",
              hostEmail: pendingData.hostEmail || syncedUser?.email || session.user.email || "organizer@eventzone.pro"
            };
            const created = await createEvent(finalForm, session.user.id);
            setUserEvents(prev => [created, ...prev]);
            setPublicEvents(prev => [created, ...prev]);
            setActiveEventStateId(created.id);
            setCurrentView("overview");
            return;
          } catch (err) {
            console.error("Failed to auto-publish pending event after OAuth login:", err);
          }
        }

        // Handle post-login navigation if returning from OAuth / sign in
        if (typeof window !== "undefined") {
          const returnView = sessionStorage.getItem("eventzone_auth_return_view");
          if (returnView) {
            sessionStorage.removeItem("eventzone_auth_return_view");
            setCurrentView(returnView);
          } else {
            setCurrentView(prev => {
              if (prev === "auth" || prev === "home") {
                const urlParams = new URLSearchParams(window.location.search);
                const requestedView = urlParams.get("view");
                return requestedView || "events-hub";
              }
              return prev;
            });
          }
        }
      } else if (event === "INITIAL_SESSION" && isMounted) {
        if (session?.user) {
          await syncUserProfile(session);
        } else {
          // Check if there is an OAuth code or token in URL that is currently processing
          const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const hasAuthParams = searchParams?.has("code") || (typeof window !== "undefined" && window.location.hash.includes("access_token"));
          
          if (!hasAuthParams) {
            const stored = safeLocalStorageGet("eventzone_user");
            if (!stored) {
              setCurrentUser(null);
            }
            setAuthInitialized(true);
            setIsAuthProcessing(false);
          }
        }
      }
    });

    // 3. Initial session check and guarded callback handler
    const checkInitialSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && isMounted) {
          await syncUserProfile(sessionData.session);
        } else {
          // If code is in URL and after 1s still not signed in, do a retry check
          if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const authCode = searchParams.get("code");
            if (authCode) {
              setTimeout(async () => {
                if (isMounted) {
                  const { data: retrySession } = await supabase.auth.getSession();
                  if (retrySession?.session?.user) {
                    await syncUserProfile(retrySession.session);
                  } else {
                    setAuthInitialized(true);
                    setIsAuthProcessing(false);
                  }
                }
              }, 1200);
            } else {
              setAuthInitialized(true);
              setIsAuthProcessing(false);
            }
          } else {
            setAuthInitialized(true);
            setIsAuthProcessing(false);
          }
        }
      } catch (e) {
        console.warn("Initial session check note:", e);
        if (isMounted) {
          setAuthInitialized(true);
          setIsAuthProcessing(false);
        }
      }
    };

    checkInitialSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      profileChannel?.unsubscribe();
    };
  }, []);

  // Load User Events & Public Events
  useEffect(() => {
    const loadEventsData = async () => {
      try {
        const [pEvents, uEvents, vRegs] = await Promise.all([
          fetchPublicEvents(),
          currentUser?.id ? fetchUserEvents(currentUser.id, currentUser.email) : Promise.resolve([]),
          currentUser?.email ? fetchVisitorRegistrations(currentUser.email) : Promise.resolve([]),
        ]);
        setPublicEvents(pEvents || []);
        setUserEvents(uEvents || []);
        setVisitorRegistrations(vRegs || []);

        // Auto-select organizer's latest event if opening dashboard on demo default
        if (typeof window !== "undefined" && uEvents && uEvents.length > 0) {
          const urlParam = new URLSearchParams(window.location.search).get("eventId") || new URLSearchParams(window.location.search).get("event");
          if (!urlParam && activeEventId === DEFAULT_EVENT_ID) {
            const hasDefault = uEvents.some(ev => ev.id === DEFAULT_EVENT_ID);
            if (!hasDefault && uEvents[0]?.id) {
              setActiveEventStateId(uEvents[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Error loading events hub:", err);
      }
    };

    loadEventsData();
  }, [currentUser]);


  // Load single-event data whenever activeEventId changes
  useEffect(() => {
    if (!activeEventId) return;

    // 1. Immediately hydrate state from localStorage cache for activeEventId
    if (typeof window !== "undefined") {
      try {
        const getCache = (k) => {
          const raw = localStorage.getItem(`eventzone_cache_${k}_${activeEventId}`);
          return raw ? JSON.parse(raw) : null;
        };
        const cEvent = getCache("event") || (localStorage.getItem(`eventzone_cached_event_${activeEventId}`) ? JSON.parse(localStorage.getItem(`eventzone_cached_event_${activeEventId}`)) : null);
        if (cEvent) setEventDetails(cEvent);
        const cAtts = getCache("attendees");
        if (cAtts) setAttendees(cAtts);
        const cPending = getCache("pending");
        if (cPending) setPending(cPending);
        const cInfs = getCache("influencers");
        if (cInfs) setInfluencers(cInfs);
        const cOpps = getCache("opportunities");
        if (cOpps) setOpportunities(cOpps);
        const cOrgs = getCache("organizations");
        if (cOrgs) setOrganizations(cOrgs);
        const cSpons = getCache("sponsors");
        if (cSpons) setSponsors(cSpons);
        const cExhib = getCache("exhibitors");
        if (cExhib) setExhibitors(cExhib);
        const cTickets = getCache("tickets");
        if (cTickets) setTickets(cTickets);
        const cTeam = getCache("team");
        if (cTeam) setTeam(cTeam);
        const cForms = getCache("forms");
        if (cForms) setForms(cForms);
        const cSubs = getCache("formSubmissions");
        if (cSubs) setFormSubmissions(cSubs);
        const cPlans = getCache("floorPlans");
        if (cPlans) setFloorPlans(cPlans);
        const cRsvps = getCache("rsvps");
        if (cRsvps) setRsvps(cRsvps);
        const cRsvpSet = getCache("rsvpSettings");
        if (cRsvpSet) setRsvpSettings(cRsvpSet);
        const cLog = getCache("logisticsData");
        if (cLog) setLogisticsData(cLog);
        const cDocs = getCache("documents") || (localStorage.getItem(`eventzone_documents_${activeEventId}`) ? JSON.parse(localStorage.getItem(`eventzone_documents_${activeEventId}`)) : null);
        if (cDocs) setDocuments(cDocs);
      } catch (e) {
        console.warn("Cache hydration error:", e);
      }
    }

    const loadEventData = async () => {
      setActiveEventId(activeEventId);

      const fetchAndSet = (promise, setter, cacheKey) => {
        return promise.then((data) => {
          if (data !== undefined && data !== null) {
            setter(data);
            if (cacheKey) {
              safeLocalStorageSet(`eventzone_cache_${cacheKey}_${activeEventId}`, data);
            }
          }
          return data;
        }).catch((err) => {
          console.warn(`Error loading ${cacheKey}:`, err);
          return null;
        });
      };

      try {
        const triggerGranularFetches = () => {
          fetchAndSet(fetchEventDetails(activeEventId), (val) => {
            setEventDetails(val);
            safeLocalStorageSet(`eventzone_cached_event_${activeEventId}`, val);
          }, "event");
          fetchAndSet(fetchTickets(activeEventId), setTickets, "tickets");
          fetchAndSet(fetchInfluencers(activeEventId), setInfluencers, "influencers");
          fetchAndSet(fetchOpportunities(activeEventId), setOpportunities, "opportunities");
          fetchAndSet(fetchOrganizations(activeEventId), setOrganizations, "organizations");
          fetchAndSet(fetchSponsors(activeEventId), setSponsors, "sponsors");
          fetchAndSet(fetchExhibitors(activeEventId), setExhibitors, "exhibitors");
          fetchAndSet(fetchSessions(activeEventId), setSessions, "sessions");
          fetchAndSet(fetchTeam(activeEventId), setTeam, "team");
          fetchAndSet(fetchFloorPlans(activeEventId), setFloorPlans, "floorPlans");
          fetchAndSet(fetchForms(activeEventId), setForms, "forms");
          fetchAndSet(fetchRSVPSettings(activeEventId), setRsvpSettings, "rsvpSettings");
        };

        // 1. Parallel coordinated entity fetches to guarantee accurate & complete data
        triggerGranularFetches();

        // 2. Parallel non-blocking fetches for rsvps, logistics & documents
        fetchAndSet(fetchRSVPs(activeEventId), setRsvps, "rsvps");
        fetchAndSet(fetchLogistics(activeEventId), setLogisticsData, "logisticsData");
        fetchAndSet(fetchDocuments(activeEventId), setDocuments, "documents");

        // 3. Single coordinated parallel fetch for attendees, pending & submissions
        const [loadedTickets, loadedSubmissions, rawAttendees, rawPending] = await Promise.all([
          fetchTickets(activeEventId).catch(() => []),
          fetchFormSubmissions(activeEventId).catch(() => []),
          fetchAttendees(activeEventId).catch(() => []),
          fetchPending(activeEventId).catch(() => [])
        ]);

        if (loadedTickets) {
          setTickets(loadedTickets);
          safeLocalStorageSet(`eventzone_cache_tickets_${activeEventId}`, loadedTickets);
        }
        if (loadedSubmissions) {
          setFormSubmissions(loadedSubmissions);
          safeLocalStorageSet(`eventzone_cache_formSubmissions_${activeEventId}`, loadedSubmissions);
        }

        // Process attendees with ticket names and submission answers
        let processedAtts = rawAttendees || [];
        if (loadedTickets && loadedTickets.length === 1) {
          const singleName = loadedTickets[0].name || loadedTickets[0].tier;
          processedAtts = processedAtts.map(a => ({
            ...a,
            ticketType: singleName,
            ticket_type: singleName
          }));
        }
        if (loadedSubmissions && loadedSubmissions.length > 0) {
          processedAtts = processedAtts.map(a => {
            const sub = loadedSubmissions.find(s => 
              s.id === a.id || 
              (s.respondentEmail && a.email && s.respondentEmail.toLowerCase() === a.email.toLowerCase())
            );
            if (sub && sub.answers && typeof sub.answers === 'object') {
              const mergedAnswers = { ...sub.answers, ...(a.answers || {}) };
              let formComp = sub.answers.company || sub.answers.f_company || sub.answers.organization || sub.answers.f_organization || a.company || '';
              let formJob = sub.answers.jobTitle || sub.answers.job_title || sub.answers.f_job_title || sub.answers.function || sub.answers.profession || a.jobTitle || '';
              return {
                ...a,
                answers: mergedAnswers,
                customAnswers: mergedAnswers,
                formAnswers: mergedAnswers,
                company: formComp,
                jobTitle: formJob,
                phone: a.phone || sub.answers.phone || sub.answers.f_core_phone || sub.answers.phoneNumber || ''
              };
            }
            return a;
          });
        }
        setAttendees(processedAtts);
        safeLocalStorageSet(`eventzone_cache_attendees_${activeEventId}`, processedAtts);

        let processedPending = rawPending || [];
        if (loadedTickets && loadedTickets.length === 1) {
          const singleName = loadedTickets[0].name || loadedTickets[0].tier;
          processedPending = processedPending.map(p => ({
            ...p,
            ticketType: singleName,
            ticket_type: singleName
          }));
        }
        setPending(processedPending);
        safeLocalStorageSet(`eventzone_cache_pending_${activeEventId}`, processedPending);

      } catch (err) {
        console.error("Unexpected error loading data for event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [activeEventId]);

  // Real-time Event Subscription (Cross-tab & Multi-device Live Sync)
  useEffect(() => {
    if (!activeEventId) return;

    // 1. Cross-tab in-browser real-time broadcast listener
    const unsubscribeSync = subscribeToRealtimeSync((data) => {
      const { type, payload, eventId } = data || {};
      if (eventId && eventId !== activeEventId && eventId !== DEFAULT_EVENT_ID) return;

      if (type === "OPPORTUNITY_SAVED" && payload) {
        setOpportunities(prev => {
          const exists = prev.some(o => o.id === payload.id);
          return exists ? prev.map(o => o.id === payload.id ? payload : o) : [payload, ...prev];
        });
      } else if (type === "OPPORTUNITY_DELETED" && payload?.id) {
        setOpportunities(prev => prev.filter(o => o.id !== payload.id));
      } else if (type === "FORM_SAVED" && payload) {
        setForms(prev => {
          const exists = prev.some(f => f.id === payload.id);
          return exists ? prev.map(f => f.id === payload.id ? payload : f) : [payload, ...prev];
        });
      } else if (type === "FORM_DELETED" && payload?.id) {
        setForms(prev => prev.filter(f => f.id !== payload.id));
      } else if (type === "SUBMISSION_ADDED" && payload) {
        setFormSubmissions(prev => {
          const exists = prev.some(s => s.id === payload.id);
          return exists ? prev : [payload, ...prev];
        });
      } else if (type === "SUBMISSION_DELETED" && payload?.id) {
        setFormSubmissions(prev => prev.filter(s => s.id !== payload.id));
      } else if (type === "RSVP_SUBMITTED" && payload) {
        setRsvps(prev => {
          const exists = prev.some(r => r.id === payload.id);
          return exists ? prev.map(r => r.id === payload.id ? payload : r) : [payload, ...prev];
        });
      } else if (type === "RSVP_UPDATED" && payload) {
        setRsvps(prev => prev.map(r => r.id === payload.id ? payload : r));
      } else if (type === "RSVP_DELETED" && payload?.id) {
        setRsvps(prev => prev.filter(r => r.id !== payload.id));
      } else if (type === "RSVP_SETTINGS_SAVED" && payload) {
        setRsvpSettings(payload);
      } else if (type === "PENDING_SUBMITTED" && payload) {
        setPending(prev => {
          const exists = prev.some(p => p.id === payload.id);
          return exists ? prev.map(p => p.id === payload.id ? payload : p) : [payload, ...prev];
        });
      } else if (type === "PENDING_SAVED" && payload) {
        setPending(prev => {
          const exists = prev.some(p => p.id === payload.id);
          return exists ? prev.map(p => p.id === payload.id ? payload : p) : [payload, ...prev];
        });
      } else if (type === "PENDING_DELETED" && payload?.id) {
        setPending(prev => prev.filter(p => p.id !== payload.id));
      } else if (type === "logistics_update" && payload?.data) {
        setLogisticsData(payload.data);
      } else if (type === "DOCUMENT_SAVED" && payload) {
        setDocuments(prev => {
          const exists = prev.some(d => d.id === payload.id);
          return exists ? prev.map(d => d.id === payload.id ? payload : d) : [payload, ...prev];
        });
      } else if (type === "DOCUMENT_DELETED" && payload?.id) {
        setDocuments(prev => prev.filter(d => d.id !== payload.id));
      }
    });

    // 2. Supabase Realtime Postgres Changes Channel
    let eventChannel = null;
    try {
      eventChannel = supabase
        .channel(`event-live-sync-${activeEventId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'forms', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedForms = await fetchForms(activeEventId);
          if (updatedForms) setForms(updatedForms);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'form_submissions', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedSubs = await fetchFormSubmissions(activeEventId);
          if (updatedSubs) setFormSubmissions(updatedSubs);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedRsvps = await fetchRSVPs(activeEventId);
          if (updatedRsvps) setRsvps(updatedRsvps);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvp_settings', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedSettings = await fetchRSVPSettings(activeEventId);
          if (updatedSettings) setRsvpSettings(updatedSettings);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedAttendees = await fetchAttendees(activeEventId);
          if (updatedAttendees) {
            const seen = new Set();
            const deduped = updatedAttendees.filter(a => {
              if (seen.has(a.id)) return false;
              seen.add(a.id);
              return true;
            });
            setAttendees(deduped);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_registrations', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedPending = await fetchPending(activeEventId);
          if (updatedPending) {
            const seen = new Set();
            const deduped = updatedPending.filter(p => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            setPending(deduped);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedTickets = await fetchTickets(activeEventId);
          if (updatedTickets) setTickets(updatedTickets);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_logistics', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedLogistics = await fetchLogistics(activeEventId);
          if (updatedLogistics) setLogisticsData(updatedLogistics);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'influencers', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedInfs = await fetchInfluencers(activeEventId);
          if (updatedInfs) {
            setInfluencers(updatedInfs);
            safeLocalStorageSet(`eventzone_cache_influencers_${activeEventId}`, updatedInfs);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedOpps = await fetchOpportunities(activeEventId);
          if (updatedOpps) {
            setOpportunities(updatedOpps);
            safeLocalStorageSet(`eventzone_cache_opportunities_${activeEventId}`, updatedOpps);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedDocs = await fetchDocuments(activeEventId);
          if (updatedDocs) setDocuments(updatedDocs);
        })
        .subscribe();
    } catch (e) {
      console.warn("Supabase event channel error:", e);
    }

    return () => {
      unsubscribeSync();
      eventChannel?.unsubscribe();
    };
  }, [activeEventId]);

  // Synchronize state variables to URL query parameters
  useEffect(() => {
    if (isLoading || typeof window === "undefined" || !isInitializedRef.current) return;

    // If viewing the public event landing page, sync to clean domain/[slug] URL
    if (currentView === "event-landing" && (eventDetails?.slug || activeEventId)) {
      const targetSlug = eventDetails?.slug || activeEventId;
      const currentSearchParams = new URLSearchParams(window.location.search);
      const refVal = currentSearchParams.get("ref") || currentSearchParams.get("referral") || currentSearchParams.get("influencer");
      const rsvpVal = currentSearchParams.get("rsvp");
      const cleanParams = new URLSearchParams();
      if (refVal) cleanParams.set("ref", refVal);
      if (rsvpVal === "true") cleanParams.set("rsvp", "true");
      const qs = cleanParams.toString();
      const newUrl = qs ? `/${targetSlug}?${qs}` : `/${targetSlug}`;
      if (window.location.pathname !== `/${targetSlug}` || window.location.search.includes("view=event-landing")) {
        window.history.pushState({}, "", newUrl);
      }
      return;
    }

    const nonEventViews = ["home", "auth", "profile", "events-hub", "my-tickets", "create-event", "admin"];
    const params = new URLSearchParams();
    if (currentView !== "home") {
      params.set("view", currentView);
    }
    if (!nonEventViews.includes(currentView) && activeEventId) {
      if (activeEventId !== DEFAULT_EVENT_ID || currentView === "register" || currentView === "rsvp") {
        params.set("eventId", activeEventId);
      }
    }
    if (currentView === "floor-plan" && activeFloorPlanId) {
      params.set("planId", activeFloorPlanId);
      if (initialPreviewMode) {
        params.set("preview", "true");
      }
    }
    // If ticket param is present in URL when in register view, preserve it
    if (currentView === "register" && typeof window !== "undefined") {
      const currentSearchParams = new URLSearchParams(window.location.search);
      const ticketVal = currentSearchParams.get("ticket");
      if (ticketVal) {
        params.set("ticket", ticketVal);
      }
    }

    // Preserve referral tracking parameter in URL so it never gets stripped
    if (typeof window !== "undefined") {
      const currentSearchParams = new URLSearchParams(window.location.search);
      const refVal = currentSearchParams.get("ref") || currentSearchParams.get("referral") || currentSearchParams.get("influencer");
      if (refVal) {
        params.set("ref", refVal);
      }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";
    const isSearchMismatch = window.location.search !== (queryString ? `?${queryString}` : "");
    const isPathMismatch = window.location.pathname !== "/";

    if (isSearchMismatch || isPathMismatch) {
      if (currentView === "home" || !params.has("eventId") || isPathMismatch) {
        window.history.replaceState({}, "", newUrl);
      } else {
        window.history.pushState({}, "", newUrl);
      }
    }
  }, [currentView, activeFloorPlanId, initialPreviewMode, activeEventId, eventDetails?.slug, isLoading]);

  // Parse URL query parameters on initial load & on browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStateFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      const eventIdParam = searchParams.get("eventId") || searchParams.get("event");
      const planIdParam = searchParams.get("planId");
      const previewParam = searchParams.get("preview");
      const rsvpParam = searchParams.get("rsvp");

      const nonEventViews = ["home", "auth", "profile", "events-hub", "my-tickets", "create-event", "admin"];
      const isEventLanding = rsvpParam === "true" || viewParam === "public-rsvp" || (viewParam === "rsvp" && searchParams.get("public") === "true") || searchParams.get("ref");
      const isHome = !viewParam || nonEventViews.includes(viewParam);

      if (eventIdParam && eventIdParam !== activeEventId && (!isHome || isEventLanding)) {
        setActiveEventStateId(eventIdParam);
      } else if (isHome && !isEventLanding && activeEventId !== DEFAULT_EVENT_ID) {
        setActiveEventStateId(DEFAULT_EVENT_ID);
      }
      
      if (rsvpParam === "true" || viewParam === "public-rsvp" || (viewParam === "rsvp" && searchParams.get("public") === "true")) {
        setCurrentView("event-landing");
      } else if (viewParam) {
        if (viewParam === "floor-plan") {
          setCurrentView("floor-plan");
          if (planIdParam) {
            setActiveFloorPlanId(planIdParam);
            if (previewParam === "true") {
              setInitialPreviewMode(true);
            }
          }
        } else {
          const validViews = [
            "home", "auth", "profile", "my-tickets", "events-hub", "create-event", "event-landing", "register", "visitor-portal", "overview", "page-builder", "calendar", "event-details", 
            "attendees", "pending", "organizations", "sponsors", 
            "exhibitors", "speakers", "opportunities", "influencers", "tickets", "forms", "rsvp", "logistics", "documents", "check-in", 
            "my-team", "analytics", "communications", "floor-plan", "admin"
          ];
          if (validViews.includes(viewParam)) {
            setCurrentView(viewParam);
          }
        }
      } else if (searchParams.get("ref") || searchParams.get("influencer") || searchParams.get("referral")) {
        setCurrentView("event-landing");
      } else {
        setCurrentView("home");
      }
      isInitializedRef.current = true;
    };

    syncStateFromUrl();
    setMounted(true);

    window.addEventListener("popstate", syncStateFromUrl);
    return () => window.removeEventListener("popstate", syncStateFromUrl);
  }, []);

  // Auth Success Handler
  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);

    // Check if there is a pending event waiting to be published
    let pendingData = pendingEventCreation;
    if (!pendingData && typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("eventzone_pending_event_creation");
        if (saved) {
          pendingData = JSON.parse(saved);
        }
      } catch (e) {}
    }

    if (pendingData) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("eventzone_pending_event_creation");
          sessionStorage.removeItem("eventzone_auth_return_view");
        } catch (e) {}
      }
      setPendingEventCreation(null);
      try {
        const finalForm = {
          ...pendingData,
          hostName: pendingData.hostName || user.fullName || "Event Organizer",
          hostEmail: pendingData.hostEmail || user.email || "organizer@eventzone.pro"
        };
        const created = await createEvent(finalForm, user.id);
        setUserEvents(prev => [created, ...prev]);
        setPublicEvents(prev => [created, ...prev]);
        setActiveEventStateId(created.id);
        setCurrentView("overview");
        return;
      } catch (err) {
        console.error("Failed to publish pending event:", err);
      }
    }

    if (user.role === "organizer") {
      setCurrentView("events-hub");
    } else {
      setCurrentView("home");
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout exception:", e);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("eventzone_user");
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("eventzone_cache_") || k.startsWith("eventzone_cached_event_"))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {}
    }
    setUserEvents([]);
    setVisitorRegistrations([]);
    setCurrentUser(null);
    setActiveEventStateId(DEFAULT_EVENT_ID);
    setEventDetails(null);
    setCurrentView("home");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
  };


  // Switch Role Handler
  const handleToggleRole = (targetRole) => {
    const updated = { ...currentUser, role: targetRole };
    setCurrentUser(updated);
    safeLocalStorageSet("eventzone_user", updated);
    if (targetRole === "visitor") {
      setCurrentView("home");
    } else {
      setCurrentView("events-hub");
    }
    setProfileDropdownOpen(false);
  };

  // Profile Update Handler (Supabase Multi-device & App Sync)
  const handleUpdateProfile = async (profileData) => {
    try {
      const updated = await upsertUserProfile(profileData);
      const retrievedName = updated?.full_name || profileData.fullName || "Eventzone User";
      const retrievedRole = updated?.role || profileData.role || "organizer";
      const retrievedAvatar = updated?.avatar_url || profileData.avatar;

      const syncedUser = {
        id: profileData.id,
        email: profileData.email,
        fullName: retrievedName,
        role: retrievedRole === 'attendee' ? 'visitor' : retrievedRole,
        companyName: updated?.company_name || profileData.companyName || "",
        jobTitle: updated?.job_title || profileData.jobTitle || "",
        phone: updated?.phone || profileData.phone || "",
        bio: updated?.bio || profileData.bio || "",
        location: updated?.location || profileData.location || "",
        interests: Array.isArray(updated?.interests) ? updated.interests : (profileData.interests || []),
        socialLinks: updated?.social_links || profileData.socialLinks || [],
        metadata: updated?.metadata || profileData.metadata || {},
        what_im_looking_for: updated?.what_im_looking_for || profileData.what_im_looking_for || profileData.whatImLookingFor || "",
        whatImLookingFor: updated?.what_im_looking_for || profileData.what_im_looking_for || profileData.whatImLookingFor || "",
        avatar: retrievedAvatar,
        isAdmin: !!profileData.isAdmin,
        maxEvents: currentUser?.maxEvents ?? null,
        maxAttendees: currentUser?.maxAttendees ?? null,
        accountStatus: currentUser?.accountStatus || 'active',
      };

      setCurrentUser(syncedUser);
      safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(syncedUser));
      return { success: true };
    } catch (err) {
      console.error("Profile update error:", err);
      throw err;
    }
  };

  // Event Creation Handler
  const handleEventCreated = async (formData) => {
    if (!currentUser) {
      setPendingEventCreation(formData);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("eventzone_pending_event_creation", JSON.stringify(formData));
          sessionStorage.setItem("eventzone_auth_return_view", "create-event");
        } catch (e) {}
      }
      setAuthModalInitialMode("signup");
      setCurrentView("auth");
      return;
    }

    // Enforce organizer maxEvents quota
    if (currentUser?.maxEvents !== null && currentUser?.maxEvents !== undefined && userEvents.length >= currentUser.maxEvents) {
      alert(`Event Limit Reached: Your current quota permits up to ${currentUser.maxEvents} events. Please contact the platform administrator to increase your organizer limit.`);
      return;
    }

    // Sanitize capacity against organizer maxAttendees cap if set
    const sanitizedFormData = { ...formData };
    if (currentUser?.maxAttendees !== null && currentUser?.maxAttendees !== undefined) {
      const requestedCap = Number(formData.capacity) || 500;
      if (requestedCap > currentUser.maxAttendees) {
        sanitizedFormData.capacity = currentUser.maxAttendees;
      }
    }

    try {
      const created = await createEvent(sanitizedFormData, currentUser.id);
      setUserEvents(prev => [created, ...prev]);
      setPublicEvents(prev => [created, ...prev]);
      setActiveEventStateId(created.id);
      setIsCreationWizardOpen(false);
      setCurrentView("overview");
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  // Event Archive Handler (Soft delete - data is safe in archive)
  const handleArchiveEvent = async (id) => {
    if (confirm("Archive this event? (Data will be preserved in your archives)")) {
      await archiveEvent(id);
      setUserEvents(prev => prev.map(e => e.id === id ? { ...e, status: "archived" } : e));
      setPublicEvents(prev => prev.filter(e => e.id !== id));
      if (activeEventId === id) {
        setActiveEventStateId(DEFAULT_EVENT_ID);
      }
    }
  };

  const handleUnarchiveEvent = async (id) => {
    await unarchiveEvent(id);
    setUserEvents(prev => prev.map(e => e.id === id ? { ...e, status: "published" } : e));
  };

  const handleDeleteEvent = handleArchiveEvent;

  // Visitor RSVP Handler
  const handleVisitorRegister = async (eventId, visitorData) => {
    const emailToTest = (
      visitorData.email || 
      visitorData.customAnswers?.f_core_email || 
      visitorData.answers?.f_core_email || 
      ""
    ).trim().toLowerCase();

    const phoneToTest = (
      visitorData.phone || 
      visitorData.customAnswers?.f_core_phone || 
      visitorData.answers?.f_core_phone || 
      visitorData.customAnswers?.phone || 
      visitorData.answers?.phone || 
      visitorData.customAnswers?.phoneNumber || 
      visitorData.answers?.phoneNumber || 
      ""
    ).trim();

    // Fast in-memory duplicate check against existing attendees and pending requests
    if (emailToTest) {
      const dupAttendee = attendees.find(a => a.email && isMatchingEmail(a.email, emailToTest) && a.status !== 'archived' && !a.isArchived);
      if (dupAttendee) {
        return {
          success: false,
          error: "An attendee with this email address is already registered for this event.",
          code: "DUPLICATE_REGISTRATION"
        };
      }
      const dupPending = pending.find(p => p.email && isMatchingEmail(p.email, emailToTest));
      if (dupPending) {
        return {
          success: false,
          error: "A registration application with this email address is already pending organizer review.",
          code: "DUPLICATE_REGISTRATION"
        };
      }
    }

    if (phoneToTest) {
      const dupAttendeeByPhone = attendees.find(a => {
        if (a.status === 'archived' || a.isArchived) return false;
        const aPhone = a.phone || a.answers?.phone || a.answers?.f_core_phone || a.answers?.phoneNumber;
        return aPhone && isMatchingPhoneNumber(aPhone, phoneToTest);
      });
      if (dupAttendeeByPhone) {
        return {
          success: false,
          error: "An attendee with this phone number is already registered for this event.",
          code: "DUPLICATE_REGISTRATION"
        };
      }
      const dupPendingByPhone = pending.find(p => {
        const pPhone = p.phone || p.answers?.phone || p.answers?.f_core_phone || p.answers?.phoneNumber;
        return pPhone && isMatchingPhoneNumber(pPhone, phoneToTest);
      });
      if (dupPendingByPhone) {
        return {
          success: false,
          error: "A registration application with this phone number is already pending organizer review.",
          code: "DUPLICATE_REGISTRATION"
        };
      }
    }

    const newPass = await registerVisitorForEvent(eventId, visitorData);
    if (!newPass || newPass.error || newPass.success === false) {
      return newPass;
    }

    setVisitorRegistrations(prev => [newPass, ...prev]);

    const isPending = Boolean(visitorData.requiresApproval || visitorData.requires_approval);

    if (isPending) {
      setPending(prev => {
        const item = {
          id: newPass.id,
          name: visitorData.name || "Guest Attendee",
          email: visitorData.email || "visitor@eventzone.io",
          company: visitorData.company || "",
          jobTitle: visitorData.jobTitle || "",
          phone: visitorData.phone || "",
          ticketType: visitorData.ticketType || visitorData.ticket_type || "Standard Admission",
          ticket_type: visitorData.ticketType || visitorData.ticket_type || "Standard Admission",
          note: `Applied for ${visitorData.ticketType || visitorData.ticket_type || "Standard Admission"} (Pending Approval)`,
          date: new Date().toISOString().split('T')[0],
          referralCode: visitorData.referralCode || visitorData.referral_code || "",
          referral_code: visitorData.referralCode || visitorData.referral_code || "",
          influencerId: visitorData.influencerId || visitorData.influencer_id || null,
          discountApplied: visitorData.discountApplied || visitorData.discount_applied || 0,
          answers: visitorData.customAnswers || visitorData.answers || {},
          formAnswers: visitorData.customAnswers || visitorData.answers || {}
        };
        return [item, ...prev.filter(p => p.id !== newPass.id)];
      });
    } else {
      const nameParts = (visitorData.name || 'Guest Attendee').trim().split(' ');
      setAttendees(prev => {
        const item = {
          id: newPass.id,
          name: visitorData.name || 'Guest Attendee',
          first_name: nameParts[0] || 'Guest',
          last_name: nameParts.slice(1).join(' ') || 'Attendee',
          email: visitorData.email || "visitor@eventzone.io",
          company: visitorData.company || "",
          jobTitle: visitorData.jobTitle || "",
          job_title: visitorData.jobTitle || "",
          phone: visitorData.phone || "",
          ticketType: visitorData.ticketType || visitorData.ticket_type || "Standard Admission",
          ticket_type: visitorData.ticketType || visitorData.ticket_type || "Standard Admission",
          status: 'registered',
          status_participation: 'registered',
          registeredDate: new Date().toISOString().split('T')[0],
          registered_at: new Date().toISOString(),
          referralCode: visitorData.referralCode || visitorData.referral_code || "",
          referral_code: visitorData.referralCode || visitorData.referral_code || "",
          influencerId: visitorData.influencerId || visitorData.influencer_id || null,
          discountApplied: visitorData.discountApplied || visitorData.discount_applied || 0,
          answers: visitorData.customAnswers || visitorData.answers || {},
          formAnswers: visitorData.customAnswers || visitorData.answers || {}
        };
        return [item, ...prev.filter(a => a.id !== newPass.id)];
      });
    }

    return newPass;
  };

  // Floor Plan Save Helpers
  const saveFloorPlanWithStatus = async (plan) => {
    setSaveStatus("saving");
    try {
      await upsertFloorPlan(plan, activeEventId);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Auto-save floor plan failed:", err);
      setSaveStatus("error");
    }
  };

  const handleCreateFloorPlan = async (name) => {
    const validName = (typeof name === "string" && name.trim().length > 0)
      ? name.trim()
      : `Floor Plan ${floorPlans.length + 1}`;
    const newId = generateUuid();
    const newPlan = {
      id: newId,
      name: validName,
      createdAt: new Date().toISOString(),
      elements: [],
      blueprint: {
        url: '', name: 'Venue Blueprint', opacity: 0.8,
        x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false
      },
      fontFamily: 'Inter',
      floors: [
        {
          id: `floor-${Date.now()}`,
          name: 'Ground Floor',
          elements: [],
          blueprint: {
            url: '', name: 'Venue Blueprint', opacity: 0.8,
            x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false
          }
        }
      ]
    };
    try {
      const saved = await upsertFloorPlan(newPlan, activeEventId);
      const planToSet = saved || newPlan;
      setFloorPlans(prev => [...prev.filter(p => p.id !== planToSet.id), planToSet]);
      setActiveFloorPlanId(planToSet.id);
    } catch (err) {
      console.error("Create floor plan error:", err);
      setFloorPlans(prev => [...prev, newPlan]);
      setActiveFloorPlanId(newPlan.id);
    }
  };

  const handleDuplicateFloorPlan = async (id) => {
    const source = floorPlans.find(p => p.id === id);
    if (!source) return;
    const duplicated = {
      ...source,
      id: generateUuid(),
      name: `${source.name || "Floor Plan"} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = await upsertFloorPlan(duplicated, activeEventId);
      const planToSet = saved || duplicated;
      setFloorPlans(prev => [...prev.filter(p => p.id !== planToSet.id), planToSet]);
    } catch (err) {
      console.error("Duplicate floor plan error:", err);
      setFloorPlans(prev => [...prev, duplicated]);
    }
  };

  const handleArchiveFloorPlan = async (id) => {
    try {
      await archiveFloorPlan(id);
      setFloorPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'archived', isArchived: true } : p));
      if (activeFloorPlanId === id) setActiveFloorPlanId(null);
    } catch (err) {
      console.error("Archive floor plan error:", err);
    }
  };

  const handleRestoreFloorPlan = async (id) => {
    try {
      await restoreFloorPlan(id);
      setFloorPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'published', isArchived: false } : p));
    } catch (err) {
      console.error("Restore floor plan error:", err);
    }
  };

  const handlePermanentDeleteFloorPlan = async (id) => {
    try {
      await permanentDeleteFloorPlan(id);
      setFloorPlans(prev => prev.filter(p => p.id !== id));
      if (activeFloorPlanId === id) setActiveFloorPlanId(null);
    } catch (err) {
      console.error("Permanent delete floor plan error:", err);
      setFloorPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDeleteFloorPlan = handlePermanentDeleteFloorPlan;

  const handleRenameFloorPlan = async (id, newName) => {
    setFloorPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, name: newName } : p);
      const target = updated.find(p => p.id === id);
      if (target) saveFloorPlanWithStatus(target);
      return updated;
    });
  };

  const handleSaveFloorPlanElements = (id, elements) => {
    const updatedFloorPlans = floorPlans.map(p => p.id === id ? { ...p, elements } : p);
    setFloorPlans(updatedFloorPlans);
    const savedPlan = updatedFloorPlans.find(p => p.id === id);
    if (savedPlan) saveFloorPlanWithStatus(savedPlan);
  };

  const handleSaveFloorPlanFloors = (id, floors) => {
    const firstFloor = floors[0] || { elements: [], blueprint: {} };
    const updatedFloorPlans = floorPlans.map(p => p.id === id ? { 
      ...p, 
      floors,
      elements: firstFloor.elements || [],
      blueprint: firstFloor.blueprint || {}
    } : p);
    
    setFloorPlans(updatedFloorPlans);
    const savedPlan = updatedFloorPlans.find(p => p.id === id);
    if (savedPlan) saveFloorPlanWithStatus(savedPlan);
  };

  const handleSaveFloorPlanBlueprint = (id, blueprintState) => {
    setFloorPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, blueprint: blueprintState } : p);
      const merged = updated.find(p => p.id === id);
      if (merged) saveFloorPlanWithStatus(merged);
      return updated;
    });
  };

  const handleSaveFloorPlanFontFamily = (id, fontFamily) => {
    setFloorPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, fontFamily } : p);
      const merged = updated.find(p => p.id === id);
      if (merged) saveFloorPlanWithStatus(merged);
      return updated;
    });
  };

  const activePlan = floorPlans.find(p => p.id === activeFloorPlanId) ?? null;
  const isEditingFloorPlan = currentView === "floor-plan" && Boolean(activeFloorPlanId) && Boolean(activePlan);

  // Diff sync helper
  const syncArrayToDb = (oldArr, newArr, upsertFn, deleteFn) => {
    const newIds = new Set(newArr.map(i => String(i.id)));
    for (const item of oldArr) {
      if (!newIds.has(String(item.id))) {
        deleteFn(item.id, item.email || item, activeEventId).catch(e => console.error('Delete failed:', e));
      }
    }
    for (const item of newArr) {
      const oldItem = oldArr.find(i => String(i.id) === String(item.id));
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        upsertFn(item, activeEventId).catch(e => console.error('Upsert failed:', e));
      }
    }
  };

  const handleUpdateState = (key, val) => {
    switch (key) {
      case "eventDetails":
        let sanitizedVal = val;
        if (val && currentUser?.maxAttendees !== null && currentUser?.maxAttendees !== undefined) {
          const cap = Number(val.capacity);
          if (!isNaN(cap) && cap > currentUser.maxAttendees) {
            sanitizedVal = { ...val, capacity: currentUser.maxAttendees };
          }
        }
        setEventDetails(sanitizedVal);
        if (sanitizedVal) {
          safeLocalStorageSet(`eventzone_cached_event_${activeEventId}`, sanitizedVal);
        }
        setPublicEvents(prev => prev.map(e => (activeEventId ? (e.id === activeEventId ? { ...e, ...sanitizedVal } : e) : e)));
        setUserEvents(prev => prev.map(e => (activeEventId ? (e.id === activeEventId ? { ...e, ...sanitizedVal } : e) : e)));
        updateEventDetails(sanitizedVal, activeEventId).catch(console.error);
        break;
      case "sessions":
        syncArrayToDb(sessions, val, upsertSession, deleteSession);
        setSessions(val);
        safeLocalStorageSet(`eventzone_cache_sessions_${activeEventId}`, val);
        break;
      case "attendees":
        syncArrayToDb(attendees, val, upsertAttendee, deleteAttendee);
        setAttendees(val);
        safeLocalStorageSet(`eventzone_cache_attendees_${activeEventId}`, val);
        break;
      case "pending":
        syncArrayToDb(pending, val, upsertPending, deletePending);
        setPending(val);
        safeLocalStorageSet(`eventzone_cache_pending_${activeEventId}`, val);
        break;
      case "organizations":
        syncArrayToDb(organizations, val, (item) => upsertOrganization(item, activeEventId), deleteOrganization);
        setOrganizations(val);
        safeLocalStorageSet(`eventzone_cache_organizations_${activeEventId}`, val);
        break;
      case "sponsors":
        syncArrayToDb(sponsors, val, upsertSponsor, deleteSponsor);
        setSponsors(val);
        safeLocalStorageSet(`eventzone_cache_sponsors_${activeEventId}`, val);
        break;
      case "exhibitors":
        syncArrayToDb(exhibitors, val, upsertExhibitor, deleteExhibitor);
        setExhibitors(val);
        safeLocalStorageSet(`eventzone_cache_exhibitors_${activeEventId}`, val);
        break;
      case "opportunities":
        syncArrayToDb(opportunities, val, upsertOpportunity, deleteOpportunity);
        setOpportunities(val);
        safeLocalStorageSet(`eventzone_cache_opportunities_${activeEventId}`, val);
        break;
      case "influencers":
        syncArrayToDb(influencers, val, upsertInfluencer, deleteInfluencer);
        setInfluencers(val);
        safeLocalStorageSet(`eventzone_cache_influencers_${activeEventId}`, val);
        break;
      case "tickets":
        (val || []).forEach(newT => {
          const oldT = tickets.find(t => t.id === newT.id);
          const oldName = oldT ? (oldT.name || oldT.tier) : null;
          const newName = newT.name || newT.tier;
          if (oldName && newName && oldName !== newName) {
            setAttendees(prev => prev.map(a => {
              if ((a.ticketType || a.ticket_type) === oldName || a.ticketId === newT.id) {
                const updated = { ...a, ticketType: newName, ticket_type: newName };
                upsertAttendee(updated, activeEventId).catch(console.error);
                return updated;
              }
              return a;
            }));
            setPending(prev => prev.map(p => {
              if ((p.ticketType || p.ticket_type) === oldName || p.ticketId === newT.id) {
                const updated = { ...p, ticketType: newName, ticket_type: newName };
                upsertPending(updated, activeEventId).catch(console.error);
                return updated;
              }
              return p;
            }));
          }
        });
        syncArrayToDb(tickets, val, upsertTicket, deleteTicket);
        setTickets(val);
        safeLocalStorageSet(`eventzone_cache_tickets_${activeEventId}`, val);
        break;
      case "team":
        syncArrayToDb(team, val, upsertTeamMember, deleteTeamMember);
        setTeam(val);
        safeLocalStorageSet(`eventzone_cache_team_${activeEventId}`, val);
        break;
      case "floorPlans":
        syncArrayToDb(floorPlans, val, upsertFloorPlan, deleteFloorPlan);
        setFloorPlans(val);
        safeLocalStorageSet(`eventzone_cache_floorPlans_${activeEventId}`, val);
        break;
    }
  };

  const getUniqueSpeakersCount = () => {
    const seen = new Set();
    sessions.forEach(s => {
      (s.speakers || []).forEach(sp => seen.add(sp.name));
      (s.moderators || []).forEach(mo => seen.add(mo.name));
    });
    return seen.size;
  };

  // Modals Save submission handler
  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (editingItem) {
      switch (activeModalType) {
        case "attendee": {
          const updated = { ...editingItem, name: modalName, email: modalEmail, ticketType: modalTicket, image: modalLogo };
          setAttendees(attendees.map(a => a.id === editingItem.id ? updated : a));
          upsertAttendee(updated, activeEventId).catch(console.error);
          break;
        }
        case "org": {
          const updated = { ...editingItem, name: modalName, industry: modalSector, contact: modalContact, website: modalWebsite || "https://", logo: modalLogo };
          setOrganizations(organizations.map(o => o.id === editingItem.id ? updated : o));
          upsertOrganization(updated, activeEventId).catch(console.error);
          break;
        }
        case "sponsor": {
          const updated = { ...editingItem, name: modalName, tier: modalTier, website: modalWebsite || "#", image: modalLogo || "" };
          setSponsors(sponsors.map(s => s.id === editingItem.id ? updated : s));
          upsertSponsor(updated, activeEventId).catch(console.error);
          break;
        }
        case "exhibitor": {
          const editOrg = organizations.find(o => String(o.id) === String(modalOrgId));
          if (editOrg) {
            const updated = { ...editingItem, name: editOrg.name, logo: editOrg.logo || "", contact: editOrg.contact || "", email: modalEmail, org_id: editOrg.id };
            setExhibitors(exhibitors.map(ex => ex.id === editingItem.id ? updated : ex));
            upsertExhibitor(updated, activeEventId).catch(console.error);
          }
          break;
        }
        case "ticket": {
          const updated = { ...editingItem, name: modalName, price: parseInt(modalPrice) || 0, maxQty: parseInt(modalMax) || 100, features: modalFeatures.split(",").map(f => f.trim()) };
          setTickets(tickets.map(t => t.id === editingItem.id ? updated : t));
          upsertTicket(updated, activeEventId).catch(console.error);
          break;
        }
        case "team": {
          const updated = { ...editingItem, name: modalName, email: modalEmail, role: modalRole };
          setTeam(team.map(tm => tm.id === editingItem.id ? updated : tm));
          upsertTeamMember(updated, activeEventId).catch(console.error);
          break;
        }
      }
    } else {
      try {
        switch (activeModalType) {
          case "attendee": {
            const cleanEmail = (modalEmail || "").trim().toLowerCase();
            if (cleanEmail) {
              const dup = attendees.find(a => a.email && isMatchingEmail(a.email, cleanEmail) && a.status !== 'archived' && !a.isArchived);
              if (dup) {
                alert("An attendee with this email address is already registered for this event.");
                return;
              }
            }
            const saved = await upsertAttendee({
              name: modalName, email: modalEmail, ticketType: modalTicket, image: modalLogo,
              status: "registered", registeredDate: new Date().toISOString().split("T")[0],
            }, activeEventId);
            setAttendees(prev => [...prev, saved]);
            break;
          }
          case "org": {
            const saved = await upsertOrganization({
              name: modalName, industry: modalSector, contact: modalContact,
              website: modalWebsite || "https://", logo: modalLogo,
            }, activeEventId);
            setOrganizations(prev => [...prev, saved]);
            break;
          }
          case "sponsor": {
            const saved = await upsertSponsor({
              name: modalName, tier: modalTier,
              website: modalWebsite || "#", image: modalLogo || "",
            }, activeEventId);
            setSponsors(prev => [...prev, saved]);
            break;
          }
          case "exhibitor": {
            const org = organizations.find(o => String(o.id) === String(modalOrgId));
            if (org) {
              const saved = await upsertExhibitor({
                org_id: org.id, name: org.name,
                logo: org.logo || "", contact: org.contact || "", booth: "Not Assigned",
                email: modalEmail,
              }, activeEventId);
              setExhibitors(prev => [...prev, saved]);
            }
            break;
          }
          case "ticket": {
            const saved = await upsertTicket({
              name: modalName, price: parseInt(modalPrice) || 0,
              maxQty: parseInt(modalMax) || 100,
              features: modalFeatures.split(",").map(f => f.trim()),
            }, activeEventId);
            setTickets(prev => [...prev, saved]);
            break;
          }
          case "team": {
            const saved = await upsertTeamMember({
              name: modalName, email: modalEmail, role: modalRole, status: "Pending Invite",
            }, activeEventId);
            setTeam(prev => [...prev, saved]);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to save record:", err);
      }
    }

    closeModal();
  };

  const handleSaveTicket = async (ticketData) => {
    try {
      const oldTicket = tickets.find(t => t.id === ticketData.id);
      const oldName = oldTicket ? (oldTicket.name || oldTicket.tier) : null;
      const newName = ticketData.name || ticketData.tier;

      const saved = await upsertTicket(ticketData, activeEventId);

      // If the ticket tier was renamed, cascade the rename across all attendees and pending registrations
      if (newName) {
        setAttendees(prev => prev.map(a => {
          const aType = a.ticketType || a.ticket_type;
          const shouldUpdate = (oldName && aType === oldName) || 
                               (a.ticketId && a.ticketId === ticketData.id) ||
                               (tickets.length <= 1);
          if (shouldUpdate) {
            const updated = { ...a, ticketType: newName, ticket_type: newName, ticketId: saved.id };
            upsertAttendee(updated, activeEventId).catch(console.error);
            return updated;
          }
          return a;
        }));

        setPending(prev => prev.map(p => {
          const pType = p.ticketType || p.ticket_type;
          const shouldUpdate = (oldName && pType === oldName) || 
                               (p.ticketId && p.ticketId === ticketData.id) ||
                               (tickets.length <= 1);
          if (shouldUpdate) {
            const updated = { ...p, ticketType: newName, ticket_type: newName, ticketId: saved.id };
            upsertPending(updated, activeEventId).catch(console.error);
            return updated;
          }
          return p;
        }));
      }

      if (ticketData.isPopular) {
        // Enforce only one ticket has isPopular tag
        const otherTickets = tickets.map(t => {
          if (t.id === saved.id) return saved;
          if (t.isPopular) {
            const updatedOldPopular = { ...t, isPopular: false };
            upsertTicket(updatedOldPopular, activeEventId).catch(console.error);
            return updatedOldPopular;
          }
          return t;
        });

        if (ticketData.id) {
          setTickets(otherTickets);
        } else {
          setTickets([saved, ...otherTickets.filter(t => t.id !== saved.id)]);
        }
      } else {
        if (ticketData.id) {
          setTickets(prev => prev.map(t => t.id === saved.id ? saved : t));
        } else {
          setTickets(prev => [...prev, saved]);
        }
      }
    } catch (err) {
      console.error("Failed to save ticket:", err);
      throw err;
    }
  };

  const handleSaveAttendee = async (attendeeData) => {
    try {
      const saved = await upsertAttendee(attendeeData, activeEventId);
      setAttendees(prev => {
        const exists = prev.some(a => a.id === saved.id);
        if (exists) {
          return prev.map(a => a.id === saved.id ? saved : a);
        }
        return [saved, ...prev];
      });

      // Synchronize intake form response in formSubmissions state
      if (attendeeData.answers && Object.keys(attendeeData.answers).length > 0) {
        setFormSubmissions(prev => {
          const subObj = {
            id: saved.id,
            eventId: activeEventId,
            respondentName: saved.name,
            respondentEmail: saved.email,
            ticketTier: saved.ticketType || saved.ticket_type,
            answers: attendeeData.answers,
            createdAt: saved.registeredDate || new Date().toISOString(),
          };
          const exists = prev.some(s => s.id === saved.id || (s.respondentEmail && saved.email && s.respondentEmail.toLowerCase() === saved.email.toLowerCase()));
          if (exists) {
            return prev.map(s => (s.id === saved.id || (s.respondentEmail && saved.email && s.respondentEmail.toLowerCase() === saved.email.toLowerCase())) ? { ...s, ...subObj } : s);
          }
          return [subObj, ...prev];
        });
      }
      return saved;
    } catch (err) {
      console.error("Failed to save attendee:", err);
      throw err;
    }
  };

  const handleSaveTeamMember = async (memberData) => {
    try {
      const saved = await upsertTeamMember(memberData, activeEventId);
      setTeam(prev => {
        const exists = prev.some(m => m.id === saved.id);
        if (exists) {
          return prev.map(m => m.id === saved.id ? saved : m);
        }
        return [...prev, saved];
      });
      broadcastRealtimeChange({ type: 'team', payload: saved });
      return saved;
    } catch (err) {
      console.error("Failed to save team member:", err);
      throw err;
    }
  };

  const handleSaveOrganization = async (orgData, linkOptions = {}) => {
    try {
      const saved = await upsertOrganization(orgData, activeEventId);
      const cleanTargetId = String(saved.id);
      const cleanName = (saved.name || '').trim().toLowerCase();

      const liaisonContact = saved.contact || orgData.contact || '';
      const liaisonTitle = saved.jobTitle || orgData.jobTitle || orgData.contactTitle || '';
      const liaisonEmail = saved.email || orgData.email || orgData.contactEmail || '';
      const liaisonPhone = saved.phone || orgData.phone || orgData.contactPhone || '';

      setOrganizations(prev => {
        const withoutTarget = prev.filter(o => 
          String(o.id) !== cleanTargetId && 
          (!orgData.id || String(o.id) !== String(orgData.id)) &&
          (!cleanName || (o.name || '').trim().toLowerCase() !== cleanName)
        );
        const updated = [...withoutTarget, { ...saved, id: saved.id, contact: liaisonContact, jobTitle: liaisonTitle, email: liaisonEmail, phone: liaisonPhone }];
        safeLocalStorageSet(`eventzone_cache_organizations_${activeEventId}`, updated);
        return updated;
      });

      // 1. Manage Sponsor Linkage (Sync Contact Liaison if existing, create if requested)
      const existingSponsor = (sponsors || []).find(s => !s.isArchived && s.status !== 'archived' && (
        String(s.orgId) === cleanTargetId || 
        String(s.org_id) === cleanTargetId ||
        (s.name && cleanName && s.name.trim().toLowerCase() === cleanName)
      ));

      if (existingSponsor) {
        const updatedSponsor = {
          ...existingSponsor,
          name: saved.name,
          image: saved.logo || existingSponsor.image || existingSponsor.logo || '',
          industry: saved.industry || existingSponsor.industry || '',
          contact: liaisonContact || existingSponsor.contact || '',
          contactPerson: liaisonContact || existingSponsor.contactPerson || '',
          jobTitle: liaisonTitle || existingSponsor.jobTitle || '',
          contactPosition: liaisonTitle || existingSponsor.contactPosition || '',
          email: liaisonEmail || existingSponsor.email || '',
          contactEmail: liaisonEmail || existingSponsor.contactEmail || '',
          phone: liaisonPhone || existingSponsor.phone || '',
          contactPhone: liaisonPhone || existingSponsor.contactPhone || '',
          website: saved.website || existingSponsor.website || '#'
        };
        try {
          const savedSponsor = await upsertSponsor(updatedSponsor, activeEventId);
          setSponsors(prev => {
            const cleanSpName = (savedSponsor.name || '').trim().toLowerCase();
            const withoutSp = prev.filter(s => 
              String(s.id) !== String(savedSponsor.id) && 
              String(s.id) !== String(existingSponsor.id) && 
              (!cleanSpName || (s.name || '').trim().toLowerCase() !== cleanSpName)
            );
            return [...withoutSp, savedSponsor];
          });
        } catch (spErr) {
          console.warn("Could not sync organization liaison to sponsor DB:", spErr);
          setSponsors(prev => {
            const cleanSpName = (updatedSponsor.name || '').trim().toLowerCase();
            const withoutSp = prev.filter(s => 
              String(s.id) !== String(existingSponsor.id) && 
              (!cleanSpName || (s.name || '').trim().toLowerCase() !== cleanSpName)
            );
            return [...withoutSp, updatedSponsor];
          });
        }
      } else if (linkOptions.createSponsor) {
        const sponsorPayload = {
          name: saved.name,
          orgId: saved.id,
          tier: linkOptions.sponsorTier || 'silver',
          amount: linkOptions.sponsorAmount || null,
          currency: linkOptions.sponsorCurrency || 'DZD',
          website: saved.website || '#',
          image: saved.logo || '',
          industry: saved.industry || '',
          contact: liaisonContact,
          contactPerson: liaisonContact,
          jobTitle: liaisonTitle,
          contactPosition: liaisonTitle,
          email: liaisonEmail,
          contactEmail: liaisonEmail,
          phone: liaisonPhone,
          contactPhone: liaisonPhone,
          booth: linkOptions.sponsorBooth || '',
          perks: linkOptions.sponsorPerks || ['vip_passes', 'main_stage_branding'],
          notes: linkOptions.sponsorNotes || '',
          status: 'active'
        };
        const savedSponsor = await upsertSponsor(sponsorPayload, activeEventId);
        setSponsors(prev => {
          const cleanSpName = (savedSponsor.name || '').trim().toLowerCase();
          const withoutSp = prev.filter(s => 
            String(s.id) !== String(savedSponsor.id) && 
            (!cleanSpName || (s.name || '').trim().toLowerCase() !== cleanSpName)
          );
          return [...withoutSp, savedSponsor];
        });
      }

      // 2. Manage Exhibitor Linkage (Sync Contact Liaison if existing, create if requested)
      const existingExhibitor = (exhibitors || []).find(e => !e.isArchived && e.status !== 'archived' && (
        String(e.orgId) === cleanTargetId || 
        String(e.org_id) === cleanTargetId ||
        (e.name && cleanName && e.name.trim().toLowerCase() === cleanName)
      ));

      if (existingExhibitor) {
        const updatedExhibitor = {
          ...existingExhibitor,
          name: saved.name,
          logo: saved.logo || existingExhibitor.logo || '',
          industry: saved.industry || existingExhibitor.industry || '',
          contact: liaisonContact || existingExhibitor.contact || '',
          contactPerson: liaisonContact || existingExhibitor.contactPerson || '',
          jobTitle: liaisonTitle || existingExhibitor.jobTitle || '',
          contactPosition: liaisonTitle || existingExhibitor.contactPosition || '',
          email: liaisonEmail || existingExhibitor.email || '',
          contactEmail: liaisonEmail || existingExhibitor.contactEmail || '',
          phone: liaisonPhone || existingExhibitor.phone || '',
          contactPhone: liaisonPhone || existingExhibitor.contactPhone || ''
        };
        try {
          const savedExhibitor = await upsertExhibitor(updatedExhibitor, activeEventId);
          setExhibitors(prev => {
            const cleanExName = (savedExhibitor.name || '').trim().toLowerCase();
            const withoutEx = prev.filter(e => 
              String(e.id) !== String(savedExhibitor.id) && 
              String(e.id) !== String(existingExhibitor.id) && 
              (!cleanExName || (e.name || '').trim().toLowerCase() !== cleanExName)
            );
            return [...withoutEx, savedExhibitor];
          });
        } catch (exErr) {
          console.warn("Could not sync organization liaison to exhibitor DB:", exErr);
          setExhibitors(prev => {
            const cleanExName = (updatedExhibitor.name || '').trim().toLowerCase();
            const withoutEx = prev.filter(e => 
              String(e.id) !== String(existingExhibitor.id) && 
              (!cleanExName || (e.name || '').trim().toLowerCase() !== cleanExName)
            );
            return [...withoutEx, updatedExhibitor];
          });
        }
      } else if (linkOptions.createExhibitor) {
        const exhibitorPayload = {
          name: saved.name,
          orgId: saved.id,
          booth: linkOptions.exhibitorBooth || 'Not Assigned',
          boothNumber: linkOptions.exhibitorBooth || 'Not Assigned',
          boothType: linkOptions.exhibitorBoothType || 'Standard 3x3m (9 m²)',
          staffCount: linkOptions.exhibitorStaffCount || 2,
          description: linkOptions.exhibitorProducts || '',
          industry: saved.industry || '',
          contact: liaisonContact,
          contactPerson: liaisonContact,
          jobTitle: liaisonTitle,
          contactPosition: liaisonTitle,
          email: liaisonEmail,
          contactEmail: liaisonEmail,
          phone: liaisonPhone,
          contactPhone: liaisonPhone,
          logo: saved.logo || '',
          status: 'active'
        };
        const savedExhibitor = await upsertExhibitor(exhibitorPayload, activeEventId);
        setExhibitors(prev => {
          const cleanExName = (savedExhibitor.name || '').trim().toLowerCase();
          const withoutEx = prev.filter(e => 
            String(e.id) !== String(savedExhibitor.id) && 
            (!cleanExName || (e.name || '').trim().toLowerCase() !== cleanExName)
          );
          return [...withoutEx, savedExhibitor];
        });
      }

      // 3. Automatically link Contact Liaison to Company Personnel in DB and state
      const matchingLiaisonAttendee = (attendees || []).find(a => 
        !a.isArchived && a.status !== 'archived' && (
          (orgData.selectedLiaisonAttendeeId && String(a.id) === String(orgData.selectedLiaisonAttendeeId)) ||
          (liaisonEmail && a.email && a.email.trim().toLowerCase() === liaisonEmail.trim().toLowerCase()) ||
          (liaisonContact && a.name && a.name.trim().toLowerCase() === liaisonContact.trim().toLowerCase())
        )
      );
      if (matchingLiaisonAttendee) {
        try {
          await handleAssignAttendeeToCompany(matchingLiaisonAttendee.id, saved, {
            jobTitle: liaisonTitle || matchingLiaisonAttendee.jobTitle || 'Contact Liaison'
          });
        } catch (e) {
          console.warn("Auto-assign liaison to personnel on org save error:", e);
        }
      }

      return saved;
    } catch (err) {
      console.error("Failed to save organization:", err);
      throw err;
    }
  };

  const handleSaveSponsor = async (sponsorData) => {
    try {
      const saved = await upsertSponsor(sponsorData, activeEventId);
      const cleanTargetId = String(saved.id);
      const cleanName = (saved.name || '').trim().toLowerCase();
      const targetOrgId = sponsorData.orgId || sponsorData.org_id || saved.orgId || saved.org_id;

      const liaisonContact = saved.contact || saved.contactPerson || sponsorData.contact || sponsorData.contactPerson || '';
      const liaisonTitle = saved.jobTitle || saved.contactPosition || sponsorData.jobTitle || sponsorData.contactPosition || '';
      const liaisonEmail = saved.email || saved.contactEmail || sponsorData.email || sponsorData.contactEmail || '';
      const liaisonPhone = saved.phone || saved.contactPhone || sponsorData.phone || sponsorData.contactPhone || '';

      setSponsors(prev => {
        const withoutTarget = prev.filter(s => 
          String(s.id) !== cleanTargetId &&
          (!sponsorData.id || String(s.id) !== String(sponsorData.id)) &&
          (!targetOrgId || (String(s.orgId) !== String(targetOrgId) && String(s.org_id) !== String(targetOrgId))) &&
          (!cleanName || (s.name || '').trim().toLowerCase() !== cleanName)
        );
        return [...withoutTarget, { ...saved, id: saved.id, contact: liaisonContact, contactPerson: liaisonContact, jobTitle: liaisonTitle, contactPosition: liaisonTitle, email: liaisonEmail, contactEmail: liaisonEmail, phone: liaisonPhone, contactPhone: liaisonPhone }];
      });

      // 1. Sync Contact Liaison to Organization (both in DB and state)
      const existingOrg = organizations.find(o => 
        (targetOrgId && (String(o.id) === String(targetOrgId) || String(o.orgId) === String(targetOrgId))) || 
        (o.name && cleanName && o.name.trim().toLowerCase() === cleanName)
      );

      let savedOrgId = targetOrgId;
      if (existingOrg) {
        const updatedOrg = {
          ...existingOrg,
          name: sponsorData.name || existingOrg.name,
          logo: sponsorData.image || sponsorData.logo || existingOrg.logo,
          industry: sponsorData.industry || existingOrg.industry,
          contact: liaisonContact || existingOrg.contact || '',
          contactPerson: liaisonContact || existingOrg.contactPerson || '',
          jobTitle: liaisonTitle || existingOrg.jobTitle || '',
          contactPosition: liaisonTitle || existingOrg.contactPosition || '',
          email: liaisonEmail || existingOrg.email || '',
          contactEmail: liaisonEmail || existingOrg.contactEmail || '',
          phone: liaisonPhone || existingOrg.phone || '',
          contactPhone: liaisonPhone || existingOrg.contactPhone || '',
          notes: sponsorData.notes || existingOrg.notes
        };
        try {
          const savedOrg = await upsertOrganization(updatedOrg, activeEventId);
          savedOrgId = savedOrg.id;
          setOrganizations(prev => {
            const cleanOrgName = (savedOrg.name || '').trim().toLowerCase();
            const withoutOrg = prev.filter(o => 
              String(o.id) !== String(savedOrg.id) && 
              String(o.id) !== String(existingOrg.id) && 
              (!cleanOrgName || (o.name || '').trim().toLowerCase() !== cleanOrgName)
            );
            return [...withoutOrg, savedOrg];
          });
        } catch (orgErr) {
          console.warn("Could not sync sponsor liaison to organization DB:", orgErr);
          setOrganizations(prev => {
            const cleanOrgName = (updatedOrg.name || '').trim().toLowerCase();
            const withoutOrg = prev.filter(o => 
              String(o.id) !== String(existingOrg.id) && 
              (!cleanOrgName || (o.name || '').trim().toLowerCase() !== cleanOrgName)
            );
            return [...withoutOrg, updatedOrg];
          });
        }
      }

      // 2. Sync Contact Liaison to linked Exhibitor (both in DB and state)
      const linkedExhibitor = exhibitors.find(e => !e.isArchived && e.status !== 'archived' && (
        (savedOrgId && (String(e.orgId) === String(savedOrgId) || String(e.org_id) === String(savedOrgId))) ||
        (targetOrgId && (String(e.orgId) === String(targetOrgId) || String(e.org_id) === String(targetOrgId))) ||
        (e.name && cleanName && e.name.trim().toLowerCase() === cleanName)
      ));

      if (linkedExhibitor) {
        const updatedExhibitor = {
          ...linkedExhibitor,
          contact: liaisonContact || linkedExhibitor.contact,
          contactPerson: liaisonContact || linkedExhibitor.contactPerson,
          jobTitle: liaisonTitle || linkedExhibitor.jobTitle,
          contactPosition: liaisonTitle || linkedExhibitor.contactPosition,
          email: liaisonEmail || linkedExhibitor.email,
          contactEmail: liaisonEmail || linkedExhibitor.contactEmail,
          phone: liaisonPhone || linkedExhibitor.phone,
          contactPhone: liaisonPhone || linkedExhibitor.contactPhone
        };
        try {
          const savedEx = await upsertExhibitor(updatedExhibitor, activeEventId);
          setExhibitors(prev => {
            const cleanExName = (savedEx.name || '').trim().toLowerCase();
            const withoutEx = prev.filter(e => 
              String(e.id) !== String(savedEx.id) && 
              String(e.id) !== String(linkedExhibitor.id) && 
              (!cleanExName || (e.name || '').trim().toLowerCase() !== cleanExName)
            );
            return [...withoutEx, savedEx];
          });
        } catch (exErr) {
          console.warn("Could not sync sponsor liaison to exhibitor DB:", exErr);
          setExhibitors(prev => {
            const cleanExName = (updatedExhibitor.name || '').trim().toLowerCase();
            const withoutEx = prev.filter(e => 
              String(e.id) !== String(linkedExhibitor.id) && 
              (!cleanExName || (e.name || '').trim().toLowerCase() !== cleanExName)
            );
            return [...withoutEx, updatedExhibitor];
          });
        }
      }

      // 3. Automatically link Contact Liaison to Company Personnel in DB and state
      const matchingLiaisonAttendee = (attendees || []).find(a => 
        !a.isArchived && a.status !== 'archived' && (
          (sponsorData.selectedLiaisonAttendeeId && String(a.id) === String(sponsorData.selectedLiaisonAttendeeId)) ||
          (liaisonEmail && a.email && a.email.trim().toLowerCase() === liaisonEmail.trim().toLowerCase()) ||
          (liaisonContact && a.name && a.name.trim().toLowerCase() === liaisonContact.trim().toLowerCase())
        )
      );
      if (matchingLiaisonAttendee) {
        const companyTarget = { id: targetOrgId || saved.id, orgId: targetOrgId || saved.id, name: saved.name };
        try {
          await handleAssignAttendeeToCompany(matchingLiaisonAttendee.id, companyTarget, {
            jobTitle: liaisonTitle || matchingLiaisonAttendee.jobTitle || 'Contact Liaison'
          });
        } catch (e) {
          console.warn("Auto-assign liaison to personnel on sponsor save error:", e);
        }
      }

      return saved;
    } catch (err) {
      console.error("Failed to save sponsor:", err);
      throw err;
    }
  };

  const handleSaveExhibitor = async (exhibitorData) => {
    try {
      const saved = await upsertExhibitor(exhibitorData, activeEventId);
      const cleanTargetId = String(saved.id);
      const cleanName = (saved.name || '').trim().toLowerCase();
      const targetOrgId = exhibitorData.orgId || exhibitorData.org_id || saved.orgId || saved.org_id;

      const liaisonContact = saved.contact || saved.contactPerson || exhibitorData.contact || exhibitorData.contactPerson || '';
      const liaisonTitle = saved.jobTitle || saved.contactPosition || exhibitorData.jobTitle || exhibitorData.contactPosition || '';
      const liaisonEmail = saved.email || saved.contactEmail || exhibitorData.email || exhibitorData.contactEmail || '';
      const liaisonPhone = saved.phone || saved.contactPhone || exhibitorData.phone || exhibitorData.contactPhone || '';

      setExhibitors(prev => {
        const withoutTarget = prev.filter(e => 
          String(e.id) !== cleanTargetId &&
          (!exhibitorData.id || String(e.id) !== String(exhibitorData.id)) &&
          (!targetOrgId || (String(e.orgId) !== String(targetOrgId) && String(e.org_id) !== String(targetOrgId))) &&
          (!cleanName || (e.name || '').trim().toLowerCase() !== cleanName)
        );
        return [...withoutTarget, { ...saved, id: saved.id, contact: liaisonContact, contactPerson: liaisonContact, jobTitle: liaisonTitle, contactPosition: liaisonTitle, email: liaisonEmail, contactEmail: liaisonEmail, phone: liaisonPhone, contactPhone: liaisonPhone }];
      });

      // 1. Sync Contact Liaison to Organization (both in DB and state)
      const existingOrg = organizations.find(o => 
        (targetOrgId && (String(o.id) === String(targetOrgId) || String(o.orgId) === String(targetOrgId))) || 
        (o.name && cleanName && o.name.trim().toLowerCase() === cleanName)
      );

      let savedOrgId = targetOrgId;
      if (existingOrg) {
        const updatedOrg = {
          ...existingOrg,
          name: exhibitorData.name || existingOrg.name,
          logo: exhibitorData.logo || existingOrg.logo,
          industry: exhibitorData.industry || existingOrg.industry,
          contact: liaisonContact || existingOrg.contact || '',
          contactPerson: liaisonContact || existingOrg.contactPerson || '',
          jobTitle: liaisonTitle || existingOrg.jobTitle || '',
          contactPosition: liaisonTitle || existingOrg.contactPosition || '',
          email: liaisonEmail || existingOrg.email || '',
          contactEmail: liaisonEmail || existingOrg.contactEmail || '',
          phone: liaisonPhone || existingOrg.phone || '',
          contactPhone: liaisonPhone || existingOrg.contactPhone || '',
          notes: exhibitorData.notes || existingOrg.notes
        };
        try {
          const savedOrg = await upsertOrganization(updatedOrg, activeEventId);
          savedOrgId = savedOrg.id;
          setOrganizations(prev => {
            const cleanOrgName = (savedOrg.name || '').trim().toLowerCase();
            const withoutOrg = prev.filter(o => 
              String(o.id) !== String(savedOrg.id) && 
              String(o.id) !== String(existingOrg.id) && 
              (!cleanOrgName || (o.name || '').trim().toLowerCase() !== cleanOrgName)
            );
            return [...withoutOrg, savedOrg];
          });
        } catch (orgErr) {
          console.warn("Could not sync exhibitor liaison to organization DB:", orgErr);
          setOrganizations(prev => {
            const cleanOrgName = (updatedOrg.name || '').trim().toLowerCase();
            const withoutOrg = prev.filter(o => 
              String(o.id) !== String(existingOrg.id) && 
              (!cleanOrgName || (o.name || '').trim().toLowerCase() !== cleanOrgName)
            );
            return [...withoutOrg, updatedOrg];
          });
        }
      }

      // 2. Sync Contact Liaison to linked Sponsor (both in DB and state)
      const linkedSponsor = sponsors.find(s => !s.isArchived && s.status !== 'archived' && (
        (savedOrgId && (String(s.orgId) === String(savedOrgId) || String(s.org_id) === String(savedOrgId))) ||
        (targetOrgId && (String(s.orgId) === String(targetOrgId) || String(s.org_id) === String(targetOrgId))) ||
        (s.name && cleanName && s.name.trim().toLowerCase() === cleanName)
      ));

      if (linkedSponsor) {
        const updatedSponsor = {
          ...linkedSponsor,
          contact: liaisonContact || linkedSponsor.contact,
          contactPerson: liaisonContact || linkedSponsor.contactPerson,
          jobTitle: liaisonTitle || linkedSponsor.jobTitle,
          contactPosition: liaisonTitle || linkedSponsor.contactPosition,
          email: liaisonEmail || linkedSponsor.email,
          contactEmail: liaisonEmail || linkedSponsor.contactEmail,
          phone: liaisonPhone || linkedSponsor.phone,
          contactPhone: liaisonPhone || linkedSponsor.contactPhone
        };
        try {
          const savedSp = await upsertSponsor(updatedSponsor, activeEventId);
          setSponsors(prev => {
            const cleanSpName = (savedSp.name || '').trim().toLowerCase();
            const withoutSp = prev.filter(s => 
              String(s.id) !== String(savedSp.id) && 
              String(s.id) !== String(linkedSponsor.id) && 
              (!cleanSpName || (s.name || '').trim().toLowerCase() !== cleanSpName)
            );
            return [...withoutSp, savedSp];
          });
        } catch (spErr) {
          console.warn("Could not sync exhibitor liaison to sponsor DB:", spErr);
          setSponsors(prev => {
            const cleanSpName = (updatedSponsor.name || '').trim().toLowerCase();
            const withoutSp = prev.filter(s => 
              String(s.id) !== String(linkedSponsor.id) && 
              (!cleanSpName || (s.name || '').trim().toLowerCase() !== cleanSpName)
            );
            return [...withoutSp, updatedSponsor];
          });
        }
      }

      // 3. Automatically link Contact Liaison to Company Personnel in DB and state
      const matchingLiaisonAttendee = (attendees || []).find(a => 
        !a.isArchived && a.status !== 'archived' && (
          (exhibitorData.selectedLiaisonAttendeeId && String(a.id) === String(exhibitorData.selectedLiaisonAttendeeId)) ||
          (liaisonEmail && a.email && a.email.trim().toLowerCase() === liaisonEmail.trim().toLowerCase()) ||
          (liaisonContact && a.name && a.name.trim().toLowerCase() === liaisonContact.trim().toLowerCase())
        )
      );
      if (matchingLiaisonAttendee) {
        const companyTarget = { id: targetOrgId || saved.id, orgId: targetOrgId || saved.id, name: saved.name };
        try {
          await handleAssignAttendeeToCompany(matchingLiaisonAttendee.id, companyTarget, {
            jobTitle: liaisonTitle || matchingLiaisonAttendee.jobTitle || 'Contact Liaison'
          });
        } catch (e) {
          console.warn("Auto-assign liaison to personnel on exhibitor save error:", e);
        }
      }

      return saved;
    } catch (err) {
      console.error("Failed to save exhibitor:", err);
      throw err;
    }
  };

  const handleDeleteSponsor = async (sponsorId) => {
    try {
      if (!sponsorId) return;

      // 1. Delete sponsor from DB and State only (do not delete organization)
      await deleteSponsor(sponsorId).catch(console.warn);
      setSponsors(prev => {
        const next = prev.filter(s => String(s.id) !== String(sponsorId));
        safeLocalStorageSet(`eventzone_cache_sponsors_${activeEventId}`, next);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete sponsor:", err);
      throw err;
    }
  };

  const handleDeleteExhibitor = async (exhibitorId) => {
    try {
      if (!exhibitorId) return;

      // 1. Delete exhibitor from DB and State only (do not delete organization)
      await deleteExhibitor(exhibitorId).catch(console.warn);
      setExhibitors(prev => {
        const next = prev.filter(e => String(e.id) !== String(exhibitorId));
        safeLocalStorageSet(`eventzone_cache_exhibitors_${activeEventId}`, next);
        return next;
      });

      // 2. Unassign this exhibitor from floor plans
      setFloorPlans(prev => prev.map(fp => {
        let changed = false;
        const newElements = (fp.elements || []).map(el => {
          if (String(el.exhibitorId) === String(exhibitorId)) {
            changed = true;
            return { ...el, exhibitorId: null, status: 'available' };
          }
          return el;
        });
        if (changed) {
          const updatedFp = { ...fp, elements: newElements };
          saveFloorPlanWithStatus(updatedFp);
          return updatedFp;
        }
        return fp;
      }));
    } catch (err) {
      console.error("Failed to delete exhibitor:", err);
      throw err;
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    try {
      if (!orgId) return;
      const targetOrg = (organizations || []).find(o => String(o.id) === String(orgId));
      const cleanName = (targetOrg?.name || '').trim().toLowerCase();

      // 1. Delete organization in DB and State
      await deleteOrganization(orgId).catch(console.warn);
      setOrganizations(prev => {
        const next = prev.filter(o => String(o.id) !== String(orgId));
        safeLocalStorageSet(`eventzone_cache_organizations_${activeEventId}`, next);
        return next;
      });

      // 2. Cascade delete any linked sponsors
      const linkedSponsors = (sponsors || []).filter(s => 
        String(s.orgId) === String(orgId) || 
        String(s.org_id) === String(orgId) ||
        (cleanName && s.name && s.name.trim().toLowerCase() === cleanName)
      );
      for (const ls of linkedSponsors) {
        await deleteSponsor(ls.id).catch(console.warn);
      }
      setSponsors(prev => {
        const next = prev.filter(s => 
          String(s.orgId) !== String(orgId) && 
          String(s.org_id) !== String(orgId) &&
          (cleanName ? (s.name || '').trim().toLowerCase() !== cleanName : true)
        );
        safeLocalStorageSet(`eventzone_cache_sponsors_${activeEventId}`, next);
        return next;
      });

      // 3. Cascade delete any linked exhibitors
      const linkedExhibitors = (exhibitors || []).filter(e => 
        String(e.orgId) === String(orgId) || 
        String(e.org_id) === String(orgId) ||
        (cleanName && e.name && e.name.trim().toLowerCase() === cleanName)
      );
      for (const le of linkedExhibitors) {
        await deleteExhibitor(le.id).catch(console.warn);
      }
      setExhibitors(prev => {
        const next = prev.filter(e => 
          String(e.orgId) !== String(orgId) && 
          String(e.org_id) !== String(orgId) &&
          (cleanName ? (e.name || '').trim().toLowerCase() !== cleanName : true)
        );
        safeLocalStorageSet(`eventzone_cache_exhibitors_${activeEventId}`, next);
        return next;
      });

      // 4. Unassign from floor plans
      if (linkedExhibitors.length > 0) {
        setFloorPlans(prev => prev.map(fp => {
          let changed = false;
          const newElements = (fp.elements || []).map(el => {
            if (linkedExhibitors.some(le => String(el.exhibitorId) === String(le.id))) {
              changed = true;
              return { ...el, exhibitorId: null, status: 'available' };
            }
            return el;
          });
          if (changed) {
            const updatedFp = { ...fp, elements: newElements };
            saveFloorPlanWithStatus(updatedFp);
            return updatedFp;
          }
          return fp;
        }));
      }

      // 5. Unassign linked attendees from this company
      setAttendees(prev => prev.map(a => {
        const aOrgId = a.orgId || a.org_id || a.answers?.orgId || a.answers?.org_id;
        const matchId = orgId && aOrgId && String(aOrgId) === String(orgId);
        const matchName = cleanName && a.company && a.company.trim().toLowerCase() === cleanName;
        if (matchId || matchName) {
          return { ...a, orgId: null, org_id: null, company: '' };
        }
        return a;
      }));
    } catch (err) {
      console.error("Failed to delete organization:", err);
      throw err;
    }
  };

  const handleAssignAttendeeToCompany = async (attendeeId, org, roleData = {}) => {
    try {
      const targetAttendee = attendees.find(a => String(a.id) === String(attendeeId));
      if (!targetAttendee) return;

      const orgId = org?.id || org?.orgId || org?.org_id || null;
      const orgName = org?.name || '';

      const updatedAttendee = {
        ...targetAttendee,
        orgId: orgId,
        org_id: orgId,
        company: orgName,
        jobTitle: roleData.jobTitle || targetAttendee.jobTitle || 'Company Representative',
        answers: {
          ...(targetAttendee.answers || {}),
          company: orgName,
          f_company: orgName,
          orgId: orgId,
          org_id: orgId,
          jobTitle: roleData.jobTitle || targetAttendee.jobTitle || 'Company Representative',
          f_job_title: roleData.jobTitle || targetAttendee.jobTitle || 'Company Representative'
        }
      };

      const saved = await upsertAttendee(updatedAttendee, activeEventId);
      setAttendees(prev => prev.map(a => String(a.id) === String(attendeeId) ? saved : a));
      safeLocalStorageSet(`eventzone_cache_attendees_${activeEventId}`, attendees.map(a => String(a.id) === String(attendeeId) ? saved : a));
      return saved;
    } catch (err) {
      console.error("Failed to assign attendee to company:", err);
      throw err;
    }
  };

  const handleRemoveAttendeeFromCompany = async (attendeeId) => {
    try {
      const targetAttendee = attendees.find(a => String(a.id) === String(attendeeId));
      if (!targetAttendee) return;

      const updatedAttendee = {
        ...targetAttendee,
        orgId: null,
        org_id: null,
        company: '',
        answers: {
          ...(targetAttendee.answers || {}),
          company: '',
          f_company: '',
          orgId: null,
          org_id: null
        }
      };

      const saved = await upsertAttendee(updatedAttendee, activeEventId);
      setAttendees(prev => prev.map(a => String(a.id) === String(attendeeId) ? saved : a));
      safeLocalStorageSet(`eventzone_cache_attendees_${activeEventId}`, attendees.map(a => String(a.id) === String(attendeeId) ? saved : a));
      return saved;
    } catch (err) {
      console.error("Failed to remove attendee from company:", err);
      throw err;
    }
  };

  const handleRegisterNewPersonnel = async (personnelData, org) => {
    try {
      const orgId = org?.id || org?.orgId || org?.org_id || null;
      const orgName = org?.name || '';

      const isSponsor = orgId ? sponsors.find(s => !s.isArchived && s.status !== 'archived' && (s.orgId === orgId || s.org_id === orgId || s.id === orgId)) : sponsors.find(s => s.name?.toLowerCase() === orgName.toLowerCase());
      const isExhibitor = orgId ? exhibitors.find(e => !e.isArchived && e.status !== 'archived' && (e.orgId === orgId || e.org_id === orgId || e.id === orgId)) : exhibitors.find(e => e.name?.toLowerCase() === orgName.toLowerCase());

      let tierName = "Partner Pass";
      if (isSponsor) {
        tierName = isSponsor.tier ? `${isSponsor.tier.toUpperCase()} Sponsor Pass` : "Sponsor Pass";
      } else if (isExhibitor) {
        tierName = "Exhibitor Pass";
      }

      const newAttendee = {
        name: personnelData.name.trim(),
        email: personnelData.email.trim(),
        phone: personnelData.phone || '',
        company: orgName,
        orgId: orgId,
        org_id: orgId,
        jobTitle: personnelData.jobTitle || 'Company Representative',
        ticketType: tierName,
        ticket_type: tierName,
        status: 'registered',
        registeredDate: new Date().toISOString().split('T')[0],
        answers: {
          company: orgName,
          f_company: orgName,
          orgId: orgId,
          org_id: orgId,
          jobTitle: personnelData.jobTitle || 'Company Representative',
          f_job_title: personnelData.jobTitle || 'Company Representative'
        }
      };

      const saved = await upsertAttendee(newAttendee, activeEventId);
      setAttendees(prev => [...prev, saved]);
      safeLocalStorageSet(`eventzone_cache_attendees_${activeEventId}`, [...attendees, saved]);
      return saved;
    } catch (err) {
      console.error("Failed to register new personnel:", err);
      throw err;
    }
  };

  const handleSaveLogisticsItem = async (type, item) => {
    try {
      const saved = await upsertLogisticsItem(type, item, activeEventId);
      setLogisticsData(prev => {
        const list = prev[type] || [];
        const exists = list.some(x => x.id === saved.id);
        const updatedList = exists ? list.map(x => x.id === saved.id ? saved : x) : [saved, ...list];
        return { ...prev, [type]: updatedList };
      });
      return saved;
    } catch (err) {
      console.error("Failed to save logistics item:", err);
    }
  };

  const handleDeleteLogisticsItem = async (type, itemId) => {
    try {
      await deleteLogisticsItem(type, itemId, activeEventId);
      setLogisticsData(prev => {
        const list = prev[type] || [];
        return { ...prev, [type]: list.filter(x => x.id !== itemId) };
      });
    } catch (err) {
      console.error("Failed to delete logistics item:", err);
    }
  };

  const handleSaveFullLogistics = async (newLogistics) => {
    try {
      const saved = await upsertFullLogistics(newLogistics, activeEventId);
      setLogisticsData(saved);
      return saved;
    } catch (err) {
      console.error("Failed to save full logistics:", err);
    }
  };

  const handleSaveDocument = async (doc) => {
    try {
      const saved = await upsertDocument(doc, activeEventId);
      setDocuments(prev => {
        const exists = prev.some(d => d.id === saved.id);
        return exists ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev];
      });
      return saved;
    } catch (err) {
      console.error("Failed to save document:", err);
      throw err;
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocument(docId, activeEventId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleTogglePinDocument = async (docId) => {
    try {
      const updated = await togglePinDocument(docId, activeEventId);
      if (updated) {
        setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
      }
    } catch (err) {
      console.error("Failed to toggle pin on document:", err);
    }
  };

  const closeModal = () => {
    setActiveModalType(null);
    setEditingItem(null);
    setModalName("");
    setModalEmail("");
    setModalSector("");
    setModalContact("");
    setModalWebsite("");
    setModalBooth("");
    setModalPrice("");
    setModalMax("");
    setModalFeatures("");
    setModalLogo("");
    setModalOrgId("");
    setIndustrySearch("");
    setIndustryDropdownOpen(false);
  };

  const handleOpenModal = (type, item = null) => {
    setActiveModalType(type);
    if (item) {
      setEditingItem(item);
      setModalName(item.name || "");
      if (type === "attendee") {
        setModalEmail(item.email || "");
        setModalTicket(item.ticketType || "Standard Admission");
        setModalLogo(item.image || "");
      } else if (type === "org") {
        setModalSector(item.industry || "");
        setIndustrySearch(item.industry || "");
        setModalContact(item.contact || "");
        setModalWebsite(item.website || "");
        setModalLogo(item.logo || "");
      } else if (type === "sponsor") {
        setModalName(item.name || "");
        setModalTier(item.tier || "silver");
        setModalWebsite(item.website || "");
        setModalLogo(item.image || "");
      } else if (type === "exhibitor") {
        setModalOrgId(item.org_id || "");
        setModalEmail(item.email || "");
      } else if (type === "ticket") {
        setModalName(item.name || "");
        setModalPrice(item.price || "");
        setModalMax(item.maxQty || "");
        setModalFeatures(Array.isArray(item.features) ? item.features.join(", ") : "");
      } else if (type === "team") {
        setModalName(item.name || "");
        setModalEmail(item.email || "");
        setModalRole(item.role || "Staff");
      }
    }
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFileToBucket(file, 'floor-plans', activeEventId);
      if (publicUrl) setModalLogo(publicUrl);
    } catch (err) {
      console.error("Logo upload failed:", err);
    }
  };




  // Prevent hydration mismatch between server-rendered HTML and client URL-selected view
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <img 
            src="https://i.imgur.com/jFDrQbM.png" 
            alt="eventzone" 
            style={{ width: "130px", height: "32px", objectFit: "contain" }}
            className="h-8 w-auto object-contain opacity-80 animate-pulse" 
          />
        </div>
      </div>
    );
  }

  // Smooth auth resolution loader for protected routes (e.g. returning from Google OAuth)
  if (!authInitialized && !currentUser && currentView !== "home" && currentView !== "event-landing" && currentView !== "register" && currentView !== "auth") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <img 
            src="https://i.imgur.com/jFDrQbM.png" 
            alt="eventzone" 
            style={{ width: "130px", height: "32px", objectFit: "contain" }}
            className="h-8 w-auto object-contain opacity-90 animate-pulse" 
          />
          <div className="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mt-1" />
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 0.2. DEDICATED FULL-PAGE PLATFORM ADMIN PANEL (BACK OFFICE)
  // ==========================================================================
  if (currentView === "admin") {
    return (
      <PlatformAdminView
        currentUser={currentUser}
        onExitAdmin={() => setCurrentView("home")}
        onViewEventDetails={(eid) => {
          setActiveEventStateId(eid);
          setCurrentView("overview");
        }}
        onViewPublicLandingPage={(eid) => {
          setActiveEventStateId(eid);
          setCurrentView("event-landing");
        }}
        onImpersonateOrganizer={(orgId) => {
          setCurrentView("events-hub");
        }}
      />
    );
  }

  // ==========================================================================
  // 0.5. DEDICATED FULL-PAGE AUTHENTICATION VIEW (SIGN IN / SIGN UP)
  // ==========================================================================
  if (currentView === "auth") {
    return (
      <AuthView
        initialMode={authModalInitialMode || "signin"}
        onAuthSuccess={handleAuthSuccess}
        onClose={() => setCurrentView("home")}
        onGoToHome={() => setCurrentView("home")}
      />
    );
  }

  // ==========================================================================
  // 0.8. DEDICATED FULL-PAGE PROFESSIONAL NETWORKING PROFILE VIEW
  // ==========================================================================
  if (currentView === "profile") {
    return (
      <ProfileView
        currentUser={currentUser}
        onSaveProfile={handleUpdateProfile}
        onGoToHome={() => setCurrentView("home")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onSignOut={handleSignOut}
        registrations={visitorRegistrations}
      />
    );
  }

  // ==========================================================================
  // 0.9. DEDICATED FULL-PAGE MY TICKETS & DIGITAL PASSES VIEW
  // ==========================================================================
  if (currentView === "my-tickets") {
    return (
      <MyTicketsPage
        registrations={visitorRegistrations}
        events={publicEvents}
        currentUser={currentUser}
        onGoToHome={() => setCurrentView("home")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onOpenProfile={() => setCurrentView("profile")}
        onOpenCreationWizard={() => setCurrentView("create-event")}
        onOpenEventsHub={() => {
          if (!currentUser) {
            setAuthModalInitialMode("signup");
            setCurrentView("auth");
          } else {
            setCurrentView("events-hub");
          }
        }}
        onSignOut={handleSignOut}
        onViewFloorPlan={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("floor-plan");
          setInitialPreviewMode(true);
        }}
        onViewLivePage={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("event-landing");
        }}
        onOpenAttendeePortal={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("attendee-portal");
        }}
      />
    );
  }

  // ==========================================================================
  // 1. DEFAULT PUBLIC HOME PAGE (BROWSE & ROLLING HERO)
  // ==========================================================================
  if (currentView === "home") {
    return (
      <MainHomePage
        events={publicEvents}
        registrations={visitorRegistrations}
        currentUser={currentUser}
        isLoading={isLoading}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onSignOut={handleSignOut}
        onSwitchRole={handleToggleRole}
        onUpdateProfile={handleUpdateProfile}
        onOpenProfile={() => setCurrentView("profile")}
        onOpenEventsHub={() => {
          if (!currentUser) {
            setAuthModalInitialMode("signup");
            setCurrentView("auth");
          } else {
            setCurrentView("events-hub");
          }
        }}
        onOpenVisitorPasses={() => setCurrentView("my-tickets")}
        onSelectEventForDashboard={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("overview");
        }}
        onViewFloorPlan={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("floor-plan");
          setInitialPreviewMode(true);
        }}
        onViewLivePage={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("event-landing");
        }}
        onRegisterForEvent={handleVisitorRegister}
        onOpenCreationWizard={() => setCurrentView("create-event")}
        onOpenAdminView={() => setCurrentView("admin")}
        onSwitchToOrganizer={() => {
          if (!currentUser) {
            setAuthModalInitialMode("signup");
            setCurrentView("auth");
          } else {
            setCurrentView("events-hub");
          }
        }}
      />
    );
  }

  // ==========================================================================
  // 1.5. EVENT PUBLIC LANDING PAGE & REGISTRATION (VISITOR & ATTENDEE VIEW)
  // ==========================================================================
  if (currentView === "event-landing" || currentView === "register") {
    if (isLoading && !eventDetails?.title) {
      return <LandingPageSkeleton />;
    }
    const rawLanding = publicEvents.find(e => String(e.id) === String(activeEventId)) || userEvents.find(e => String(e.id) === String(activeEventId)) || null;
    const landingEventDetails = (eventDetails && eventDetails.title)
      ? { ...(rawLanding || {}), ...eventDetails }
      : (rawLanding || eventDetails || null);
    return (
      <EventPublicLandingPage
        eventId={activeEventId}
        eventDetails={landingEventDetails}
        sessions={sessions}
        sponsors={sponsors}
        exhibitors={exhibitors.map(ex => {
          const org = organizations.find(o => String(o.id) === String(ex.org_id));
          return {
            ...ex,
            logo: ex.logo || org?.logo || '',
          };
        })}
        attendees={attendees}
        tickets={tickets}
        influencers={influencers}
        forms={forms}
        formSubmissions={formSubmissions}
        rsvps={rsvps}
        rsvpSettings={rsvpSettings}
        onSubmitRSVP={async (rsvpData) => {
          const saved = await submitGuestRSVP(rsvpData, activeEventId);
          setRsvps(prev => {
            const exists = prev.some(r => r.id === saved.id);
            return exists ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
          });
          return { success: true, rsvp: saved, assignedStatus: saved.status };
        }}
        onSubmitFormResponse={async (sub) => {
          const saved = await submitFormResponse(sub, activeEventId);
          setFormSubmissions(prev => [saved, ...prev]);
          return saved;
        }}
        currentUser={currentUser}
        onBackToHome={() => {
          setCurrentView("home");
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/");
          }
        }}
        onViewFloorPlan={(eventId) => {
          setActiveEventStateId(eventId || activeEventId);
          setCurrentView("floor-plan");
          setInitialPreviewMode(true);
        }}
        onRegisterForEvent={handleVisitorRegister}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signup");
          setCurrentView("auth");
        }}
      />
    );
  }

  // ==========================================================================
  // 1.8. DEDICATED ATTENDEE PORTAL (DELEGATE ACCESS & ORGANIZER PREVIEW)
  // ==========================================================================
  if (currentView === "attendee-portal") {
    const rawPortal = publicEvents.find(e => String(e.id) === String(activeEventId)) || userEvents.find(e => String(e.id) === String(activeEventId)) || null;
    const portalEventDetails = (eventDetails && eventDetails.title)
      ? { ...(rawPortal || {}), ...eventDetails }
      : (rawPortal || eventDetails || {});

    return (
      <AttendeePortalView
        eventDetails={portalEventDetails}
        attendees={attendees}
        sessions={sessions}
        sponsors={sponsors}
        exhibitors={exhibitors.map(ex => {
          const org = organizations.find(o => String(o.id) === String(ex.org_id));
          return {
            ...ex,
            logo: ex.logo || org?.logo || '',
          };
        })}
        floorPlans={floorPlans}
        documents={documents}
        tickets={tickets}
        currentUser={currentUser}
        onGoToHome={() => setCurrentView("home")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onOpenProfile={() => setCurrentView("profile")}
        onSignOut={handleSignOut}
        onOpenEventsHub={() => setCurrentView("events-hub")}
        onViewLivePage={(eventId) => {
          setActiveEventStateId(eventId || activeEventId);
          setCurrentView("event-landing");
        }}
      />
    );
  }

  // ==========================================================================
  // 2. ORGANIZER EVENTS HUB VIEW
  // ==========================================================================
  if (currentView === "events-hub") {
    if (isAuthProcessing || !authInitialized) {
      return <EventsHubSkeleton />;
    }
    if (!currentUser) {
      return (
        <AuthView
          initialMode="signin"
          onAuthSuccess={(u) => {
            setCurrentUser(u);
            setCurrentView("events-hub");
          }}
          onGoToHome={() => setCurrentView("home")}
          onClose={() => setCurrentView("home")}
        />
      );
    }
    if (isLoading && userEvents.length === 0) {
      return <EventsHubSkeleton />;
    }
    return (
      <OrganizerEventsHub
        events={userEvents}
        registrations={visitorRegistrations}
        onSelectEvent={(id) => {
          setActiveEventStateId(id);
          setCurrentView("overview");
        }}
        onCreateEventClick={() => setCurrentView("create-event")}
        onDeleteEvent={handleArchiveEvent}
        onArchiveEvent={handleArchiveEvent}
        onUnarchiveEvent={handleUnarchiveEvent}
        onSwitchToVisitor={() => setCurrentView("my-tickets")}
        onGoToHome={() => setCurrentView("home")}
        onOpenProfile={() => setCurrentView("profile")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onSignOut={handleSignOut}
        user={currentUser}
      />
    );
  }

  // ==========================================================================
  // 2.5. CREATE NEW EVENT (DEDICATED FULL-PAGE VIEW)
  // ==========================================================================
  if (currentView === "create-event") {
    if (isAuthProcessing) {
      return <EventsHubSkeleton />;
    }
    return (
      <EventCreationWizard
        onCancel={() => {
          if (currentUser) {
            setCurrentView("events-hub");
          } else {
            setCurrentView("home");
          }
        }}
        onEventCreated={handleEventCreated}
        userId={currentUser?.id}
        currentUser={currentUser}
        userEventsCount={userEvents.length}
        onUploadFile={uploadFileToBucket}
      />
    );
  }

  // ==========================================================================
  // 3. VISITOR PORTAL
  // ==========================================================================
  if (currentView === "visitor-portal") {
    return (
      <VisitorPortal
        events={publicEvents}
        registrations={visitorRegistrations}
        onRegisterForEvent={handleVisitorRegister}
        onViewFloorPlan={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("floor-plan");
          setInitialPreviewMode(true);
        }}
        onViewLivePage={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("event-landing");
        }}
        onOpenAttendeePortal={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("attendee-portal");
        }}
        onSwitchToOrganizer={() => setCurrentView("events-hub")}
        onGoToHome={() => setCurrentView("home")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onOpenProfile={() => setCurrentView("profile")}
        onSignOut={handleSignOut}
        user={currentUser}
      />
    );
  }

  // ==========================================================================
  // 4. SINGLE EVENT DASHBOARD (ORGANIZER VIEW)
  // ==========================================================================
  if (isAuthProcessing || !authInitialized) {
    return <OverviewSkeleton />;
  }
  if (!currentUser) {
    return (
      <AuthView
        initialMode="signin"
        onAuthSuccess={(u) => {
          setCurrentUser(u);
        }}
        onGoToHome={() => setCurrentView("home")}
        onClose={() => setCurrentView("home")}
      />
    );
  }

  const currentEventSummary = userEvents.find(e => e.id === activeEventId) || eventDetails || {};

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir={dir}>
      {/* Sidebar Navigation — hidden while editing a floor plan */}
      {!isEditingFloorPlan && (
      <aside className="w-[260px] h-screen bg-white border-r rtl:border-l rtl:border-r-0 border-slate-200 py-5 px-4 flex flex-col justify-between sticky top-0 overflow-y-auto shrink-0 select-none z-40">
        <div className="space-y-4">
          {/* Top Logo & Language Selector */}
          <div className="flex items-center justify-between px-1 relative">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("home")} title="Eventzone Home">
              <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '22px', width: 'auto', maxWidth: '125px' }} className="h-5.5 w-auto object-contain" />
            </div>

            {/* Language Selector Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                title={`Language: ${languages.find(l => l.code === lang)?.label || "Language"}`}
              >
                <img src={languages.find(l => l.code === lang)?.icon || "https://i.imgur.com/NXtMImD.png"} alt={lang} className="w-4 h-4 object-contain rounded-xs" />
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Language Dropdown Menu */}
              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                  <div 
                    className={`absolute ${isRTL ? "left-0" : "right-0"} top-full mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 z-50 animate-scale-up`}
                  >
                    {languages.map(l => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          lang === l.code ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={l.icon} alt={l.code} className="w-4 h-4 object-contain" />
                          <span>{l.label}</span>
                        </div>
                        {lang === l.code && <Check size={13} className="text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Event Selector Box */}
          <div className="relative">
            <div 
              onClick={() => setEventSwitcherOpen(o => !o)}
              className="p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Building2 size={15} />
                </div>
                <div className="flex flex-col text-start overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                    {currentEventSummary?.title || eventDetails?.title || "Eventzone Summit"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">
                    {(currentEventSummary?.type || eventDetails?.type) === "In-Person" ? t("eventsHub.inPersonEvent", "In-Person Event") : (currentEventSummary?.type || eventDetails?.type) === "Virtual" ? t("eventsHub.virtualEvent", "Virtual Event") : t("eventsHub.hybridEvent", "Hybrid Event")}
                  </span>
                </div>
              </div>
              <ChevronDown size={13} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${eventSwitcherOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Event Switcher Dropdown */}
            {eventSwitcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-scale-up">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  {t("dash.switchEvent", "Switch Event")}
                </span>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {userEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setActiveEventStateId(ev.id);
                        setEventSwitcherOpen(false);
                      }}
                      className={`w-full text-start p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        ev.id === activeEventId ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{ev.title}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("create-event");
                    }}
                    className="w-full text-start p-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center cursor-pointer"
                  >
                    <span>{t("dash.hostNewEvent", "Host New Event")}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("events-hub");
                    }}
                    className="w-full text-start p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center cursor-pointer"
                  >
                    <span>{t("dash.allEventsHub", "All Events Hub")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5">
            <button 
              onClick={() => setCurrentView("overview")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "overview" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <LayoutDashboard size={14} className={`shrink-0 ${currentView === "overview" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.overview", "Overview")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("event-details")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${["event-details", "page-builder"].includes(currentView) ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <FileText size={14} className={`shrink-0 ${["event-details", "page-builder"].includes(currentView) ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.eventDetails", "Event Details")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("calendar")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "calendar" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Calendar size={14} className={`shrink-0 ${currentView === "calendar" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.calendar", "Agenda")}</span>
            </button>

            {/* Standalone Opportunities Tab */}
            <button 
              onClick={() => setCurrentView("opportunities")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "opportunities" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className={`shrink-0 ${currentView === "opportunities" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.opportunities", "Opportunities")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "opportunities" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{opportunities.filter(o => !o.isArchived).length}</span>
            </button>

            {/* 1. Expandable Participants Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setParticipantsOpen(!participantsOpen)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${["attendees", "pending", "speakers"].includes(currentView) ? "text-blue-700 bg-blue-50/50 font-extrabold" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <Users2 size={14} className={`shrink-0 ${["attendees", "pending", "speakers"].includes(currentView) ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span>{t("dash.participants", "Participants")}</span>
                </div>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${participantsOpen ? "rotate-180" : ""}`} />
              </button>

              {participantsOpen && (
                <div className="flex flex-col gap-0.5 pl-3 rtl:pr-3 rtl:pl-0 mt-1 border-l rtl:border-r rtl:border-l-0 border-slate-100 ml-4 rtl:mr-4 rtl:ml-0">
                  <button 
                    onClick={() => setCurrentView("attendees")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-start transition-all ${currentView === "attendees" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.attendees", "All Attendees")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "attendees" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{attendees.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("pending")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-start transition-all ${currentView === "pending" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.pending", "Pending")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "pending" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{pending.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("speakers")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-start transition-all ${currentView === "speakers" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mic2 size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.speakers", "Speakers")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "speakers" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{getUniqueSpeakersCount()}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Expandable Companies Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setCompaniesOpen(!companiesOpen)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${["organizations", "sponsors", "exhibitors"].includes(currentView) ? "text-blue-700 bg-blue-50/50 font-extrabold" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} className={`shrink-0 ${["organizations", "sponsors", "exhibitors"].includes(currentView) ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span>{t("dash.allCompanies", "Companies")}</span>
                </div>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${companiesOpen ? "rotate-180" : ""}`} />
              </button>

              {companiesOpen && (
                <div className="flex flex-col gap-0.5 pl-3 rtl:pr-3 rtl:pl-0 mt-1 border-l rtl:border-r rtl:border-l-0 border-slate-100 ml-4 rtl:mr-4 rtl:ml-0">
                  <button 
                    onClick={() => setCurrentView("organizations")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-start transition-all ${currentView === "organizations" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.organizations", "Organizations")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "organizations" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{organizations.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("sponsors")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-start transition-all ${currentView === "sponsors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.sponsors", "Sponsors")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "sponsors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{sponsors.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("exhibitors")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-start transition-all ${currentView === "exhibitors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Store size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.exhibitors", "Exhibitors")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "exhibitors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{exhibitors.length}</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setCurrentView("floor-plan"); setActiveFloorPlanId(null); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "floor-plan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className={`shrink-0 ${currentView === "floor-plan" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.floorPlan", "Floor Plans")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "floor-plan" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{floorPlans.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("tickets")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "tickets" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Ticket size={14} className={`shrink-0 ${currentView === "tickets" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.tickets", "Tickets")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("portal-settings")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "portal-settings" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Globe size={14} className={`shrink-0 ${currentView === "portal-settings" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.attendeePortal", "Attendee Portal")}</span>
              </div>
              <span className={`text-[8.5px] font-extrabold py-0.5 px-2 rounded-full uppercase tracking-wider ${
                currentView === "portal-settings" 
                  ? "bg-white/25 text-white" 
                  : (eventDetails?.portalStatus === "closed" ? "bg-rose-100 text-rose-700" : (eventDetails?.portalStatus === "scheduled" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"))
              }`}>
                {eventDetails?.portalStatus === "closed" ? t("common.closed", "Closed") : eventDetails?.portalStatus === "scheduled" ? t("common.scheduled", "Scheduled") : t("overview.open", "Open")}
              </span>
            </button>

            <button 
              onClick={() => setCurrentView("forms")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "forms" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className={`shrink-0 ${currentView === "forms" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.forms", "Forms & Surveys")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "forms" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{forms.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("rsvp")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "rsvp" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className={`shrink-0 ${currentView === "rsvp" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.rsvp", "RSVP")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "rsvp" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{rsvps.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("logistics")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "logistics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Boxes size={14} className={`shrink-0 ${currentView === "logistics" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.logistics", "Logistics")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "logistics" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                {(logisticsData.inventory?.length || 0) + (logisticsData.vendors?.length || 0)}
              </span>
            </button>

            {/* Standalone Influencers Tab */}
            <button 
              onClick={() => setCurrentView("influencers")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "influencers" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Share2 size={14} className={`shrink-0 ${currentView === "influencers" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.influencers", "Influencers")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "influencers" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{influencers.filter(i => !i.isArchived).length}</span>
            </button>

            {/* Documents Tab (Temporarily hidden to minimize cloud storage & egress) */}
            {/*
            <button 
              onClick={() => setCurrentView("documents")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "documents" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Files size={14} className={`shrink-0 ${currentView === "documents" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.documents", "Documents")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "documents" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                {documents.filter(d => !d.isArchived).length}
              </span>
            </button>
            */}

            <button 
              onClick={() => setCurrentView("check-in")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "check-in" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <QrCode size={14} className={`shrink-0 ${currentView === "check-in" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.checkIn", "Check In")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("my-team")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "my-team" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <ShieldCheck size={14} className={`shrink-0 ${currentView === "my-team" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.myTeam", "My Team")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("analytics")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "analytics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <BarChart3 size={14} className={`shrink-0 ${currentView === "analytics" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.analytics", "Analytics")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("communications")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "communications" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Mail size={14} className={`shrink-0 ${currentView === "communications" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.communications", "Communications")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("certificates")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "certificates" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Award size={14} className={`shrink-0 ${currentView === "certificates" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.certificates", "Certificates")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "certificates" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                {attendees.length}
              </span>
            </button>

            <button 
              onClick={() => setCurrentView("developers")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-start group ${currentView === "developers" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Code2 size={14} className={`shrink-0 ${currentView === "developers" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.developers", "Developers & API")}</span>
            </button>

            {(currentUser?.role === 'super_admin' || currentUser?.isAdmin || currentUser?.email?.toLowerCase() === 'eventzone114@gmail.com') && (
              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all text-start group bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-200/50 hover:border-blue-400 text-blue-700 shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0 text-blue-600 animate-pulse" />
                    <span>Back Office</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider py-0.5 px-1.5 rounded-md bg-blue-600 text-white">
                    Admin
                  </span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </aside>
      )}

      {/* Main Viewport */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Dynamic content views router */}
        <div className={`flex-1 ${
          isEditingFloorPlan
            ? "overflow-hidden h-screen flex flex-col p-0" 
            : "overflow-y-auto p-6 md:p-8"
        }`}>
          {/* Top Banner when Role Simulation is Active */}
          {simulatedMemberId && (
            <div className="mb-6 bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between animate-slide-down">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-black tracking-wide uppercase">
                    {t("dash.testingPlatformAs", "Testing Platform as")} {team.find(m => m.id === simulatedMemberId)?.name || 'Team Member'}
                  </p>
                  <p className="text-xs opacity-95">
                    {t("dash.viewingRole", "Viewing role")}: <strong>{team.find(m => m.id === simulatedMemberId)?.role || 'Staff'}</strong> • {t("dash.modulePermissionsSimulated", "Module permissions are actively simulated.")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView("my-team")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  {t("dash.manageTeam", "Manage Team")}
                </button>
                <button
                  onClick={() => setSimulatedMemberId(null)}
                  className="px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  {t("dash.exitSimulation", "Exit Simulation")}
                </button>
              </div>
            </div>
          )}

          {/* Top Banner when Current Module is in Read-Only Viewer Mode */}
          {!effectivePermissions.isAdmin && !effectivePermissions.isOwner && effectivePermissions.permissions[currentView] === "viewer" && (
            <div className="mb-5 px-4 py-3 bg-sky-50 border border-sky-200/80 rounded-2xl flex items-center justify-between text-xs text-sky-800 font-semibold shadow-xs">
              <div className="flex items-center gap-2.5">
                <Eye size={16} className="text-sky-600 shrink-0" />
                <span>
                  <strong>{t("dash.viewerModeTitle", "Viewer Mode (Read-Only)")}</strong>: {t("dash.viewerModeDesc", "You have read-only access to this module. Creation and editing actions are restricted to Editors.")}
                </span>
              </div>
            </div>
          )}

          {/* Access Restricted Screen if user has No Access to this module */}
          {!effectivePermissions.isAdmin && !effectivePermissions.isOwner && (!effectivePermissions.permissions[currentView] || effectivePermissions.permissions[currentView] === "none") && currentView !== "my-team" && currentView !== "overview" ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs gap-4 max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("dash.accessRestrictedTitle", "Access Restricted")}</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                {t("dash.accessRestrictedDesc", "You do not have permission to access this module. Please contact your event administrator to request access.")}
              </p>
              <button 
                onClick={() => setCurrentView("overview")} 
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                {t("dash.backToDashboard", "Back to Dashboard")}
              </button>
            </div>
          ) : isLoading && !isEditingFloorPlan ? (
            (() => {
              switch (currentView) {
                case "overview":
                  return <OverviewSkeleton />;
                case "calendar":
                  return <CalendarSkeleton />;
                case "analytics":
                  return <AnalyticsSkeleton />;
                case "logistics":
                  return <LogisticsSkeleton />;
                case "documents":
                  return <DocumentsSkeleton />;
                case "forms":
                  return <FormsSkeleton />;
                case "rsvp":
                  return <RSVPSkeleton />;
                case "floor-plan":
                  return <FloorPlanSkeleton />;
                case "page-builder":
                case "event-details":
                  return <EventDetailsSkeleton />;
                case "profile":
                  return <ProfileSkeleton />;
                case "attendees":
                case "pending":
                case "organizations":
                case "sponsors":
                case "exhibitors":
                case "speakers":
                case "opportunities":
                case "influencers":
                case "tickets":
                case "check-in":
                case "my-team":
                case "communications":
                case "developers":
                  return <DevelopersSkeleton />;
                case "certificates":
                  return <CertificatesSkeleton />;
                default:
                  return <TableViewSkeleton />;
              }
            })()
          ) : (
            <>
          {currentView === "overview" && (
            <Overview 
              eventDetails={eventDetails}
              attendees={attendees}
              pending={pending}
              sessions={sessions}
              tickets={tickets}
              influencers={influencers}
              sponsors={sponsors}
              exhibitors={exhibitors}
              floorPlans={floorPlans}
              forms={forms}
              formSubmissions={formSubmissions}
              rsvps={rsvps}
              rsvpSettings={rsvpSettings}
              team={team}
              onSwitchView={setCurrentView}
              onOpenModal={handleOpenModal}
              onPreviewLandingPage={() => setCurrentView("event-landing")}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView 
              sessions={sessions}
              attendees={attendees}
              onSaveSessions={(newSessions) => {
                syncArrayToDb(sessions, newSessions, upsertSession, deleteSession);
                setSessions(newSessions);
              }}
              onClearAllSessions={async () => {
                if (confirm("Are you sure you want to clear all sessions?")) {
                  await Promise.all(sessions.map(s => deleteSession(s.id).catch(console.error)));
                  setSessions([]);
                }
              }}
              onUploadFile={uploadFileToBucket}
            />
          )}

          {currentView === "floor-plan" && !isEditingFloorPlan && (
            <FloorPlanGallery
              floorPlans={floorPlans}
              onEdit={(id) => setActiveFloorPlanId(id)}
              onCreateNew={handleCreateFloorPlan}
              onDuplicate={handleDuplicateFloorPlan}
              onArchive={handleArchiveFloorPlan}
              onRestore={handleRestoreFloorPlan}
              onDelete={handlePermanentDeleteFloorPlan}
              onPermanentDelete={handlePermanentDeleteFloorPlan}
              onRename={handleRenameFloorPlan}
            />
          )}

          {currentView === "floor-plan" && isEditingFloorPlan && (
            <FloorPlanModifier 
              key={activeFloorPlanId}
              exhibitors={exhibitors.map(ex => {
                const org = organizations.find(o => String(o.id) === String(ex.org_id || ex.orgId));
                const contactEmail = ex.contactEmail || ex.email || org?.email || '';
                const contactName = ex.contact || ex.contactPerson || org?.contact || '';
                const matchingAtt = attendees.find(a => 
                  !a.isArchived && a.status !== 'archived' && (
                    (contactEmail && a.email && a.email.trim().toLowerCase() === contactEmail.trim().toLowerCase()) ||
                    (contactName && a.name && a.name.trim().toLowerCase() === contactName.trim().toLowerCase())
                  )
                );
                return {
                  ...ex,
                  logo: ex.logo || org?.logo || '',
                  description: ex.description || org?.description || org?.about || '',
                  about: ex.about || ex.description || org?.about || org?.description || '',
                  website: ex.website || org?.website || '',
                  contact: contactName,
                  contactPerson: contactName,
                  contactEmail: contactEmail,
                  contactPhone: ex.contactPhone || ex.phone || org?.phone || matchingAtt?.phone || '',
                  contactPosition: ex.contactPosition || ex.position || ex.jobTitle || org?.jobTitle || matchingAtt?.jobTitle || 'Representative',
                  contactPhoto: matchingAtt?.image || matchingAtt?.avatar || matchingAtt?.photo || matchingAtt?.badgePicture || ex.contactPhoto || ex.contactAvatar || ex.photo || ex.avatar || '',
                  personnel: ex.personnel || [],
                };
              })}
              attendees={attendees}
              initialLayout={activePlan.elements}
              initialBlueprintState={activePlan.blueprint}
              initialFloors={activePlan.floors || []}
              fontFamily={activePlan.fontFamily || "Inter"}
              planName={activePlan.name}
              floorPlanId={activeFloorPlanId}
              onSaveLayout={(elements) => handleSaveFloorPlanElements(activeFloorPlanId, elements)}
              onSaveBlueprintState={(bp) => handleSaveFloorPlanBlueprint(activeFloorPlanId, bp)}
              onSaveFloors={(floors) => handleSaveFloorPlanFloors(activeFloorPlanId, floors)}
              onSaveFontFamily={(font) => handleSaveFloorPlanFontFamily(activeFloorPlanId, font)}
              onBack={() => {
                setActiveFloorPlanId(null);
                setInitialPreviewMode(false);
              }}
              onRename={(newName) => handleRenameFloorPlan(activeFloorPlanId, newName)}
              onUploadFile={uploadFileToBucket}
              saveStatus={saveStatus}
              initialPreviewMode={initialPreviewMode}
            />
          )}

          {(currentView === "page-builder" || currentView === "event-details") && (
            <EventDetailsView 
              eventDetails={eventDetails}
              onUpdateEventDetails={(val) => handleUpdateState("eventDetails", val)}
              sessions={sessions}
              sponsors={sponsors}
              exhibitors={exhibitors.map(ex => {
                const org = organizations.find(o => String(o.id) === String(ex.org_id));
                return {
                  ...ex,
                  logo: ex.logo || org?.logo || '',
                };
              })}
              tickets={tickets}
              onPreviewLandingPage={() => setCurrentView("event-landing")}
              onUploadFile={uploadFileToBucket}
            />
          )}

          {currentView === "forms" && (
            <FormsView
              forms={forms}
              submissions={formSubmissions}
              tickets={tickets}
              onSaveForm={async (form) => {
                try {
                  const saved = await upsertForm(form, activeEventId);
                  setForms(prev => {
                    const exists = prev.some(f => f.id === saved.id || f.id === form.id);
                    return exists ? prev.map(f => (f.id === saved.id || f.id === form.id) ? saved : f) : [saved, ...prev];
                  });
                  return saved;
                } catch (err) {
                  console.error("Failed to save form:", err);
                }
              }}

              onArchiveForm={async (formId) => {
                await archiveForm(formId);
                setForms(prev => prev.map(f => f.id === formId ? { ...f, status: 'archived', isArchived: true } : f));
              }}
              onDeleteForm={async (formId) => {
                await deleteForm(formId);
                setForms(prev => prev.filter(f => f.id !== formId));
              }}
              onPermanentDeleteForm={async (formId) => {
                await deleteForm(formId);
                setForms(prev => prev.filter(f => f.id !== formId));
              }}
              onRestoreForm={async (formId) => {
                const formToRestore = forms.find(f => f.id === formId);
                if (formToRestore) {
                  const updated = { ...formToRestore, status: 'active', isArchived: false };
                  await upsertForm(updated, activeEventId);
                  setForms(prev => prev.map(f => f.id === formId ? updated : f));
                }
              }}
              onSubmitResponse={async (sub) => {
                const saved = await submitFormResponse(sub, activeEventId);
                setFormSubmissions(prev => [saved, ...prev]);
              }}
              activeEventTitle={eventDetails?.title || "Eventzone Summit"}
            />
          )}

          {currentView === "rsvp" && (
            <RSVPView
              rsvps={rsvps}
              rsvpSettings={rsvpSettings}
              eventDetails={eventDetails}
              activeEventId={activeEventId}
              onSaveRSVPSettings={async (newSettings) => {
                const saved = await upsertRSVPSettings(newSettings, activeEventId);
                setRsvpSettings(saved);
              }}
              onSubmitRSVP={async (rsvpData) => {
                const saved = await submitGuestRSVP(rsvpData, activeEventId);
                setRsvps(prev => {
                  const exists = prev.some(r => r.id === saved.id);
                  return exists ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
                });
                return { success: true, rsvp: saved, assignedStatus: saved.status };
              }}
              onUpdateRSVPStatus={async (rsvpId, newStatus, extra) => {
                const updated = await updateRSVPStatus(rsvpId, newStatus, activeEventId, extra);
                setRsvps(prev => prev.map(r => r.id === rsvpId ? { ...r, ...updated, status: newStatus || r.status } : r));
              }}
              onArchiveRSVP={async (rsvpId) => {
                await archiveRSVP(rsvpId, activeEventId);
                setRsvps(prev => prev.map(r => r.id === rsvpId ? { ...r, status: 'archived' } : r));
              }}
              onDeleteRSVP={async (rsvpId) => {
                await archiveRSVP(rsvpId, activeEventId);
                setRsvps(prev => prev.map(r => r.id === rsvpId ? { ...r, status: 'archived' } : r));
              }}
              onRefreshData={async () => {
                const [freshRsvps, freshSettings] = await Promise.all([
                  fetchRSVPs(activeEventId),
                  fetchRSVPSettings(activeEventId)
                ]);
                if (freshRsvps) setRsvps(freshRsvps);
                if (freshSettings) setRsvpSettings(freshSettings);
              }}
              onOpenPublicRSVP={() => setShowGlobalPublicRsvp(true)}
            />
          )}

          {currentView === "logistics" && (
            <LogisticsView
              logisticsData={logisticsData}
              onSaveLogisticsItem={handleSaveLogisticsItem}
              onDeleteLogisticsItem={handleDeleteLogisticsItem}
              onSaveFullLogistics={handleSaveFullLogistics}
              speakers={sessions.flatMap(s => s.speakers || []).filter(Boolean)}
              team={team}
              floorPlans={floorPlans}
              eventDetails={eventDetails}
              onSwitchView={setCurrentView}
              onRefreshData={async () => {
                const fresh = await fetchLogistics(activeEventId);
                if (fresh) setLogisticsData(fresh);
              }}
            />
          )}

          {currentView === "documents" && (
            <DocumentsView
              documents={documents}
              onSaveDocument={handleSaveDocument}
              onDeleteDocument={handleDeleteDocument}
              onTogglePin={handleTogglePinDocument}
              onUploadFile={uploadFileToBucket}
              activeEventId={activeEventId}
              eventDetails={eventDetails}
              onRefreshData={async () => {
                const fresh = await fetchDocuments(activeEventId);
                if (fresh) setDocuments(fresh);
              }}
            />
          )}

          {currentView === "developers" && (
            <DevelopersView
              state={{
                eventDetails,
                attendees,
                pending,
                tickets,
                currentUser,
                activeEventId
              }}
              onSwitchView={setCurrentView}
              onOpenModal={handleOpenModal}
            />
          )}

          {currentView === "portal-settings" && (
            <OrganizerAttendeePortalSettings
              eventDetails={eventDetails}
              attendees={attendees}
              sessions={sessions}
              sponsors={sponsors}
              exhibitors={exhibitors}
              floorPlans={floorPlans}
              documents={documents}
              activeEventId={activeEventId}
              onUpdateEventDetails={(val) => handleUpdateState("eventDetails", val)}
              onSendBroadcastEmail={async ({ subject, message, portalUrl, recipientCount }) => {
                if (activeEventId) {
                  try {
                    await fetch('/api/email/broadcast', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventId: activeEventId,
                        eventTitle: eventDetails?.title,
                        subject,
                        message,
                        link: portalUrl,
                        recipients: attendees.map(a => a.email).filter(Boolean)
                      })
                    }).catch(e => console.log('Broadcast API dispatched:', e));
                  } catch (e) {
                    console.log('Broadcast error:', e);
                  }
                }
              }}
              onPreviewAttendeePortal={() => {
                setCurrentView("attendee-portal");
              }}
              currentUser={currentUser}
            />
          )}

          {!["overview", "calendar", "page-builder", "event-details", "forms", "rsvp", "logistics", "documents", "developers", "portal-settings", "attendee-portal"].includes(currentView) && currentView !== "floor-plan" && (
            <GenericTableView 
              viewName={currentView}
              state={{
                eventDetails,
                attendees,
                pending,
                organizations,
                sponsors,
                exhibitors,
                opportunities,
                influencers,
                tickets,
                team,
                sessions,
                floorPlans,
                forms,
                rsvps,
                logisticsData,
                documents,
                currentUser,
                simulatedMemberId,
                onSimulateMember: setSimulatedMemberId,
                effectivePermissions,
                onSaveLogisticsItem: handleSaveLogisticsItem,
                onDeleteLogisticsItem: handleDeleteLogisticsItem,
                onSaveFullLogistics: handleSaveFullLogistics,
                onSaveDocument: handleSaveDocument,
                onDeleteDocument: handleDeleteDocument,
                onTogglePinDocument: handleTogglePinDocument,
                onDeleteOrganization: handleDeleteOrganization,
                onDeleteSponsor: handleDeleteSponsor,
                onDeleteExhibitor: handleDeleteExhibitor,
                onRefreshDocuments: async () => {
                  const fresh = await fetchDocuments(activeEventId);
                  if (fresh) setDocuments(fresh);
                },
                onRefreshLogistics: async () => {
                  const fresh = await fetchLogistics(activeEventId);
                  if (fresh) setLogisticsData(fresh);
                }
              }}
              onUpdateState={handleUpdateState}
              onOpenModal={handleOpenModal}
              onUploadFile={uploadFileToBucket}
              onSwitchView={setCurrentView}
            />
          )}
            </>
          )}
        </div>
      </main>


      {/* Ticket Drawer Slide-Over */}
      <TicketDrawer
        isOpen={activeModalType === "ticket"}
        onClose={closeModal}
        ticket={editingItem}
        forms={forms}
        onSaveTicket={handleSaveTicket}
        onUploadFile={uploadFileToBucket}
        activeEventId={activeEventId}
        eventTitle={eventDetails?.title || "Eventzone Summit"}
        onSwitchView={setCurrentView}
      />

      {/* Attendee Drawer Slide-Over (Dynamic Ticket-Form Intake) */}
      <AttendeeDrawer
        isOpen={activeModalType === "attendee"}
        onClose={closeModal}
        attendee={editingItem}
        tickets={tickets}
        forms={forms}
        onSaveAttendee={handleSaveAttendee}
        onUploadFile={uploadFileToBucket}
        activeEventId={activeEventId}
        eventTitle={eventDetails?.title || "Eventzone Summit"}
        onSwitchView={setCurrentView}
        eventDetails={eventDetails}
        organizations={organizations}
        sponsors={sponsors}
        exhibitors={exhibitors}
      />

      {/* Team Member Drawer Slide-Over (Granular Permissions & Role Presets) */}
      <TeamMemberDrawer
        isOpen={activeModalType === "team"}
        onClose={closeModal}
        member={editingItem}
        onSaveMember={handleSaveTeamMember}
        activeEventId={activeEventId}
        eventTitle={eventDetails?.title || "Eventzone Summit"}
      />

      {/* Company / Organization / Sponsor / Exhibitor Slide-Over Drawer */}
      <CompanyDrawer
        isOpen={activeModalType === "org" || activeModalType === "sponsor" || activeModalType === "exhibitor"}
        onClose={closeModal}
        mode={activeModalType || "org"}
        item={editingItem}
        organizations={organizations}
        sponsors={sponsors}
        exhibitors={exhibitors}
        floorPlans={floorPlans}
        attendees={attendees}
        onSaveOrganization={handleSaveOrganization}
        onSaveSponsor={handleSaveSponsor}
        onSaveExhibitor={handleSaveExhibitor}
        onDeleteOrganization={handleDeleteOrganization}
        onDeleteSponsor={handleDeleteSponsor}
        onDeleteExhibitor={handleDeleteExhibitor}
        onAssignAttendeeToCompany={handleAssignAttendeeToCompany}
        onRemoveAttendeeFromCompany={handleRemoveAttendeeFromCompany}
        onRegisterNewPersonnel={handleRegisterNewPersonnel}
        onUploadFile={uploadFileToBucket}
        activeEventId={activeEventId}
        eventTitle={eventDetails?.title || "Eventzone Summit"}
        eventDetails={eventDetails}
      />

      {/* Global Public RSVP Modal (Preview & Direct Trigger) */}
      <PublicRSVPModal
        isOpen={showGlobalPublicRsvp}
        onClose={() => setShowGlobalPublicRsvp(false)}
        event={eventDetails || { id: activeEventId, title: "Eventzone Summit" }}
        rsvpSettings={rsvpSettings}
        existingHeadcount={rsvps.filter(r => (r.status || 'attending').toLowerCase() === 'attending').reduce((sum, r) => sum + 1 + (r.plusOnes || r.plus_ones || 0), 0)}
        onSubmitRSVP={async (rsvpData) => {
          const saved = await submitGuestRSVP(rsvpData, activeEventId);
          setRsvps(prev => {
            const exists = prev.some(r => r.id === saved.id);
            return exists ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
          });
          return { success: true, rsvp: saved, assignedStatus: saved.status };
        }}
        currentUser={currentUser}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <img 
          src="https://i.imgur.com/jFDrQbM.png" 
          alt="eventzone" 
          style={{ width: "130px", height: "auto", maxHeight: "32px", maxWidth: "100%" }}
          className="h-8 w-auto object-contain opacity-80 animate-pulse" 
        />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
