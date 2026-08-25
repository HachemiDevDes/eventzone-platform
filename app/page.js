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
  FileText, ClipboardList, QrCode, Store, Mic2, Check, TrendingUp, Share2, Boxes, Truck, Package, Files
} from "lucide-react";

import MainHomePage from "../components/MainHomePage";
import Overview from "../components/Overview";
import CalendarView from "../components/CalendarView";
const FloorPlanModifier = dynamic(() => import("../components/FloorPlanModifier"), { ssr: false });
import FloorPlanGallery from "../components/FloorPlanGallery";
import GenericTableView from "../components/GenericTableView";
const LivePageBuilder = dynamic(() => import("../components/LivePageBuilder"), { ssr: false });
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
import PublicRSVPModal from "../components/PublicRSVPModal";
import TicketDrawer from "../components/TicketDrawer";
import AttendeeDrawer from "../components/AttendeeDrawer";
import TeamMemberDrawer from "../components/TeamMemberDrawer";
import SearchableSelect from "../components/SearchableSelect";
import { getEffectivePermissions, canViewModule, canEditModule, getModulePermission } from "../lib/permissions";
import { LanguageProvider, useLanguage } from "../lib/i18n";

import {
  fetchEventDetails, updateEventDetails,
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
  fetchFloorPlans, upsertFloorPlan, deleteFloorPlan, archiveFloorPlan, generateUuid,
  fetchForms, upsertForm, deleteForm, archiveForm,
  fetchFormSubmissions, submitFormResponse, deleteFormSubmission,
  fetchRSVPs, fetchRSVPSettings, upsertRSVPSettings, submitGuestRSVP, updateRSVPStatus, deleteRSVP, archiveRSVP,
  fetchLogistics, upsertLogisticsItem, deleteLogisticsItem, archiveLogisticsItem, upsertFullLogistics,
  fetchDocuments, upsertDocument, deleteDocument, archiveDocument, togglePinDocument, STARTER_DOCUMENTS,
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
  sanitizeUserForStorage 
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState("signin");

  // Multi-Event State
  const [publicEvents, setPublicEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [activeEventId, setActiveEventStateId] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("eventId") || DEFAULT_EVENT_ID;
    }
    return DEFAULT_EVENT_ID;
  });
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false);
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
      const validViews = [
        "home", "auth", "profile", "my-tickets", "events-hub", "create-event", "event-landing", "register", "visitor-portal", "overview", "page-builder", "calendar", "event-details", 
        "attendees", "pending", "organizations", "sponsors", 
        "exhibitors", "speakers", "opportunities", "influencers", "tickets", "forms", "rsvp", "logistics", "documents", "check-in", 
        "my-team", "analytics", "communications", "floor-plan"
      ];
      if (viewParam && validViews.includes(viewParam)) {
        return viewParam;
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

  // Single-event data
  const [eventDetails, setEventDetails] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const urlId = new URLSearchParams(window.location.search).get("eventId") || DEFAULT_EVENT_ID;
        const cached = localStorage.getItem(`eventzone_cached_event_${urlId}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  const [sessions, setSessions] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [pending, setPending] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [team, setTeam] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [rsvpSettings, setRsvpSettings] = useState(null);
  const [logisticsData, setLogisticsData] = useState({});
  const [documents, setDocuments] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const urlId = new URLSearchParams(window.location.search).get("eventId") || DEFAULT_EVENT_ID;
        const cached = localStorage.getItem(`eventzone_documents_${urlId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return STARTER_DOCUMENTS || [];
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

    // 1. Initial check from LocalStorage for instant rendering
    if (typeof window !== "undefined") {
      try {
        const stored = safeLocalStorageGet("eventzone_user");
        if (stored) {
          setCurrentUser(stored);
        }
      } catch (e) {
        console.warn("Session restore error:", e);
      }
    }

    // 2. Validate with live Supabase session & real-time sync
    let profileChannel = null;

    const syncSupabaseSession = async (explicitSession = null) => {
      try {
        let session = explicitSession;

        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        // If no active session yet, check for OAuth code in URL search params
        if (!session && typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const authCode = searchParams.get("code");
          if (authCode) {
            try {
              const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
              if (!exchangeError && exchanged?.session) {
                session = exchanged.session;
              } else if (exchangeError) {
                console.warn("PKCE code exchange note:", exchangeError.message);
              }
            } catch (pkceErr) {
              console.warn("PKCE exchange note:", pkceErr);
            }
          }
        }

        if (session?.user && isMounted) {
          const userId = session.user.id;
          const userMeta = session.user.user_metadata || {};

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

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
              await supabase.from('profiles').upsert({
                id: userId,
                full_name: retrievedName,
                email: session.user.email,
                avatar_url: retrievedAvatar,
                role: dbRole,
                onboarding_completed: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: "id" });
            } catch (upsertErr) {
              console.warn("Profile creation warning:", upsertErr);
            }
          }

          const syncedUser = {
            id: userId,
            email: session.user.email,
            fullName: retrievedName,
            role: (retrievedRole === 'attendee' || retrievedRole === 'visitor') ? 'visitor' : 'organizer',
            companyName: profile?.company_name || userMeta.company_name || "",
            jobTitle: profile?.job_title || userMeta.job_title || "",
            phone: profile?.phone || "",
            bio: profile?.bio || "",
            location: profile?.location || "",
            interests: Array.isArray(profile?.interests) ? profile.interests : [],
            socialLinks: profile?.social_links || [],
            metadata: profile?.metadata || {},
            what_im_looking_for: profile?.what_im_looking_for || "",
            whatImLookingFor: profile?.what_im_looking_for || "",
            avatar: retrievedAvatar,
            isAdmin: !!profile?.is_admin,
          };

          setCurrentUser(syncedUser);
          safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(syncedUser));

          // Clean up URL query parameters so code is not reused
          if (typeof window !== "undefined") {
            const cleanUrl = new URL(window.location.href);
            if (cleanUrl.searchParams.has("code") || cleanUrl.searchParams.has("state")) {
              cleanUrl.searchParams.delete("code");
              cleanUrl.searchParams.delete("state");
              window.history.replaceState({}, document.title, cleanUrl.toString());
            }
          }

          // Cross-device / App <-> Web Real-time Database Subscription
          if (!profileChannel) {
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

                    const updatedUser = {
                      id: userId,
                      email: updated.email || session.user.email,
                      fullName: updatedName,
                      role: (updatedRole === 'attendee' || updatedRole === 'visitor') ? 'visitor' : 'organizer',
                      companyName: updated.company_name || "",
                      jobTitle: updated.job_title || "",
                      phone: updated.phone || "",
                      bio: updated.bio || "",
                      location: updated.location || "",
                      interests: Array.isArray(updated.interests) ? updated.interests : [],
                      socialLinks: updated.social_links || [],
                      metadata: updated.metadata || {},
                      what_im_looking_for: updated.what_im_looking_for || "",
                      whatImLookingFor: updated.what_im_looking_for || "",
                      avatar: updatedAvatar,
                      isAdmin: !!updated.is_admin,
                    };

                    setCurrentUser(updatedUser);
                    safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(updatedUser));
                  }
                }
              )
              .subscribe();
          }
        }
      } catch (err) {
        console.warn("Supabase live session sync:", err);
      } finally {
        if (isMounted) setAuthInitialized(true);
      }
    };

    syncSupabaseSession();

    // 3. Listen to all auth state changes (login, session init, token refresh, logout, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" && isMounted) {
        safeLocalStorageRemove("eventzone_user");
        setCurrentUser(null);
        setUserEvents([]);
        setVisitorRegistrations([]);
        setAuthInitialized(true);
      } else if (session?.user && isMounted) {
        await syncSupabaseSession(session);
        setCurrentView(prev => {
          if (prev === "auth" || prev === "home") {
            if (typeof window !== "undefined") {
              const urlParams = new URLSearchParams(window.location.search);
              const requestedView = urlParams.get("view");
              if (requestedView) return requestedView;
            }
            return "events-hub";
          }
          return prev;
        });
        setAuthInitialized(true);
      } else if (event === "INITIAL_SESSION" && !session?.user && isMounted) {
        const stored = safeLocalStorageGet("eventzone_user");
        if (!stored) {
          setCurrentUser(null);
        }
        setAuthInitialized(true);
      }
    });

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
          currentUser?.id ? fetchUserEvents(currentUser.id) : Promise.resolve([]),
          currentUser?.email ? fetchVisitorRegistrations(currentUser.email) : Promise.resolve([]),
        ]);
        setPublicEvents(pEvents || []);
        setUserEvents(uEvents || []);
        setVisitorRegistrations(vRegs || []);
      } catch (err) {
        console.error("Error loading events hub:", err);
      }
    };

    loadEventsData();
  }, [currentUser]);


  // Load single-event data whenever activeEventId changes
  useEffect(() => {
    if (!activeEventId) return;

    const loadEventData = async () => {
      setIsLoading(true);
      setActiveEventId(activeEventId);
      try {
        const results = await Promise.allSettled([
          fetchEventDetails(activeEventId),
          fetchSessions(activeEventId),
          fetchAttendees(activeEventId),
          fetchPending(activeEventId),
          fetchOrganizations(),
          fetchSponsors(activeEventId),
          fetchExhibitors(activeEventId),
          fetchOpportunities(activeEventId),
          fetchInfluencers(activeEventId),
          fetchTickets(activeEventId),
          fetchTeam(activeEventId),
          fetchFloorPlans(activeEventId),
          fetchForms(activeEventId),
          fetchFormSubmissions(activeEventId),
          fetchRSVPs(activeEventId),
          fetchRSVPSettings(activeEventId),
          fetchLogistics(activeEventId),
          fetchDocuments(activeEventId),
        ]);

        const [
          eventResult, sessionsResult, attendeesResult, pendingResult,
          orgsResult, sponsorsResult, exhibitorsResult, oppsResult, infsResult, ticketsResult,
          teamResult, floorPlansResult, formsResult, formSubsResult,
          rsvpsResult, rsvpSettingsResult, logisticsResult, documentsResult
        ] = results;

        const loadedTickets = ticketsResult.status === "fulfilled" ? (ticketsResult.value || []) : [];
        if (ticketsResult.status === "fulfilled") setTickets(loadedTickets);

        if (infsResult.status === "fulfilled") setInfluencers(infsResult.value || []);

        if (eventResult.status === "fulfilled") {
          setEventDetails(eventResult.value);
          if (eventResult.value) {
            safeLocalStorageSet(`eventzone_cached_event_${activeEventId}`, eventResult.value);
          }
        }
        if (sessionsResult.status === "fulfilled") setSessions(sessionsResult.value);
        const loadedSubmissions = formSubsResult.status === "fulfilled" ? (formSubsResult.value || []) : [];
        if (formSubsResult.status === "fulfilled") setFormSubmissions(loadedSubmissions);

        if (attendeesResult.status === "fulfilled") {
          let atts = attendeesResult.value || [];
          if (loadedTickets.length === 1) {
            const singleName = loadedTickets[0].name || loadedTickets[0].tier;
            atts = atts.map(a => ({
              ...a,
              ticketType: singleName,
              ticket_type: singleName
            }));
          }
          if (loadedSubmissions.length > 0) {
            atts = atts.map(a => {
              const sub = loadedSubmissions.find(s => 
                s.id === a.id || 
                (s.respondentEmail && a.email && s.respondentEmail.toLowerCase() === a.email.toLowerCase())
              );
              if (sub && sub.answers && typeof sub.answers === 'object') {
                const mergedAnswers = { ...sub.answers, ...(a.answers || {}) };

                let formComp = sub.answers.company || sub.answers.f_company || sub.answers.organization || sub.answers.f_organization || a.company || '';
                let formJob = sub.answers.jobTitle || sub.answers.job_title || sub.answers.f_job_title || sub.answers.function || sub.answers.profession || a.jobTitle || '';

                if (!formComp || !formJob) {
                  for (const [k, v] of Object.entries(sub.answers)) {
                    if (!v || typeof v !== 'string') continue;
                    const key = k.toLowerCase();
                    if (!formComp && (key.includes('company') || key.includes('societe') || key.includes('entreprise') || key.includes('org'))) {
                      formComp = String(v).trim();
                    }
                    if (!formJob && (key.includes('job') || key.includes('title') || key.includes('function') || key.includes('profession') || key.includes('poste') || key.includes('role') || key.includes('fonction'))) {
                      formJob = String(v).trim();
                    }
                  }
                }

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
          setAttendees(atts);
        }
        if (pendingResult.status === "fulfilled") {
          let pends = pendingResult.value || [];
          if (loadedTickets.length === 1) {
            const singleName = loadedTickets[0].name || loadedTickets[0].tier;
            pends = pends.map(p => ({
              ...p,
              ticketType: singleName,
              ticket_type: singleName
            }));
          }
          setPending(pends);
        }
        if (orgsResult.status === "fulfilled") setOrganizations(orgsResult.value);
        if (sponsorsResult.status === "fulfilled") setSponsors(sponsorsResult.value);
        if (exhibitorsResult.status === "fulfilled") setExhibitors(exhibitorsResult.value);
        if (oppsResult.status === "fulfilled") setOpportunities(oppsResult.value || []);
        if (ticketsResult.status === "fulfilled") setTickets(loadedTickets);
        if (teamResult.status === "fulfilled") setTeam(teamResult.value);
        if (floorPlansResult.status === "fulfilled") setFloorPlans(floorPlansResult.value);
        if (formsResult.status === "fulfilled") setForms(formsResult.value);
        if (rsvpsResult.status === "fulfilled") setRsvps(rsvpsResult.value);
        if (rsvpSettingsResult.status === "fulfilled") setRsvpSettings(rsvpSettingsResult.value);
        if (logisticsResult && logisticsResult.status === "fulfilled") setLogisticsData(logisticsResult.value || {});
        if (documentsResult && documentsResult.status === "fulfilled") setDocuments(documentsResult.value || []);

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

    const params = new URLSearchParams();
    if (currentView !== "home") {
      params.set("view", currentView);
    }
    if (activeEventId && activeEventId !== DEFAULT_EVENT_ID) {
      params.set("eventId", activeEventId);
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

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";

    if (window.location.search !== `?${queryString}` && (window.location.search !== "" || queryString !== "")) {
      window.history.pushState({}, "", newUrl);
    }
  }, [currentView, activeFloorPlanId, initialPreviewMode, activeEventId, isLoading]);

  // Parse URL query parameters on initial load & on browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStateFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      const eventIdParam = searchParams.get("eventId");
      const planIdParam = searchParams.get("planId");
      const previewParam = searchParams.get("preview");

      if (eventIdParam && eventIdParam !== activeEventId) {
        setActiveEventStateId(eventIdParam);
      }
      
      if (viewParam) {
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
            "my-team", "analytics", "communications", "floor-plan"
          ];
          if (validViews.includes(viewParam)) {
            setCurrentView(viewParam);
          }
        }
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
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
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
      localStorage.removeItem("eventzone_user");
    }
    setCurrentUser(null);
    setCurrentView("home");
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
      };

      setCurrentUser(syncedUser);
      safeLocalStorageSet("eventzone_user", syncedUser);
      return { success: true };
    } catch (err) {
      console.error("Profile update error:", err);
      throw err;
    }
  };

  // Event Creation Handler
  const handleEventCreated = async (formData) => {
    try {
      const created = await createEvent(formData, currentUser?.id);
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

  const handleDeleteFloorPlan = handleArchiveFloorPlan;

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
        deleteFn(item.id).catch(e => console.error('Delete failed:', e));
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
        setEventDetails(val);
        if (val) {
          safeLocalStorageSet(`eventzone_cached_event_${activeEventId}`, val);
        }
        setPublicEvents(prev => prev.map(e => (activeEventId ? (e.id === activeEventId ? { ...e, ...val } : e) : e)));
        setUserEvents(prev => prev.map(e => (activeEventId ? (e.id === activeEventId ? { ...e, ...val } : e) : e)));
        updateEventDetails(val, activeEventId).catch(console.error);
        break;
      case "sessions":
        syncArrayToDb(sessions, val, upsertSession, deleteSession);
        setSessions(val);
        break;
      case "attendees":
        syncArrayToDb(attendees, val, upsertAttendee, deleteAttendee);
        setAttendees(val);
        break;
      case "pending":
        syncArrayToDb(pending, val, upsertPending, deletePending);
        setPending(val);
        break;
      case "organizations":
        syncArrayToDb(organizations, val, upsertOrganization, deleteOrganization);
        setOrganizations(val);
        break;
      case "sponsors":
        syncArrayToDb(sponsors, val, upsertSponsor, deleteSponsor);
        setSponsors(val);
        break;
      case "exhibitors":
        syncArrayToDb(exhibitors, val, upsertExhibitor, deleteExhibitor);
        setExhibitors(val);
        break;
      case "opportunities":
        syncArrayToDb(opportunities, val, upsertOpportunity, deleteOpportunity);
        setOpportunities(val);
        break;
      case "influencers":
        syncArrayToDb(influencers, val, upsertInfluencer, deleteInfluencer);
        setInfluencers(val);
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
        break;
      case "team":
        syncArrayToDb(team, val, upsertTeamMember, deleteTeamMember);
        setTeam(val);
        break;
      case "floorPlans":
        syncArrayToDb(floorPlans, val, upsertFloorPlan, deleteFloorPlan);
        setFloorPlans(val);
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
          upsertOrganization(updated).catch(console.error);
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
            });
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
        onOpenCreationWizard={() => {
          if (!currentUser) {
            setAuthModalInitialMode("signup");
            setCurrentView("auth");
          } else {
            setIsCreationWizardOpen(true);
          }
        }}
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
      />
    );
  }

  // ==========================================================================
  // 1. DEFAULT PUBLIC HOME PAGE (BROWSE & ROLLING HERO)
  // ==========================================================================
  if (currentView === "home") {
    return (
      <>
        <MainHomePage
          events={publicEvents}
          registrations={visitorRegistrations}
          currentUser={currentUser}
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
          onOpenCreationWizard={() => {
            if (!currentUser) {
              setAuthModalInitialMode("signup");
              setCurrentView("auth");
            } else {
              setIsCreationWizardOpen(true);
            }
          }}
          onSwitchToOrganizer={() => {
            if (!currentUser) {
              setAuthModalInitialMode("signup");
              setCurrentView("auth");
            } else {
              setCurrentView("events-hub");
            }
          }}
        />
      </>
    );
  }

  // ==========================================================================
  // 1.5. EVENT PUBLIC LANDING PAGE & REGISTRATION (VISITOR & ATTENDEE VIEW)
  // ==========================================================================
  if (currentView === "event-landing" || currentView === "register") {
    const rawLanding = publicEvents.find(e => e.id === activeEventId) || userEvents.find(e => e.id === activeEventId) || {};
    const landingEventDetails = (eventDetails && (!activeEventId || eventDetails.id === activeEventId))
      ? { ...rawLanding, ...eventDetails }
      : (publicEvents.find(e => e.id === activeEventId) || userEvents.find(e => e.id === activeEventId) || eventDetails);
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
        onBackToHome={() => setCurrentView("home")}
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
  // 2. ORGANIZER EVENTS HUB VIEW
  // ==========================================================================
  if (currentView === "events-hub") {
    if (!currentUser && authInitialized) {
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
    if (!currentUser && authInitialized) {
      return (
        <AuthView
          initialMode="signin"
          onAuthSuccess={(u) => {
            setCurrentUser(u);
            setCurrentView("create-event");
          }}
          onGoToHome={() => setCurrentView("home")}
          onClose={() => setCurrentView("home")}
        />
      );
    }
    return (
      <EventCreationWizard
        onCancel={() => setCurrentView("events-hub")}
        onEventCreated={handleEventCreated}
        userId={currentUser?.id}
        onUploadFile={uploadFileToBucket}
      />
    );
  }

  // ==========================================================================
  // 3. VISITOR PORTAL
  // ==========================================================================
  if (currentView === "visitor-portal") {
    return (
      <>
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
      </>
    );
  }

  // ==========================================================================
  // 4. SINGLE EVENT DASHBOARD (ORGANIZER VIEW)
  // ==========================================================================
  if (!currentUser && authInitialized) {
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
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation — hidden while editing a floor plan */}
      {!isEditingFloorPlan && (
      <aside className="w-[260px] h-screen bg-white border-r border-slate-200 py-5 px-4 flex flex-col justify-between sticky top-0 overflow-y-auto shrink-0 select-none z-40">
        <div className="space-y-4">
          {/* Top Logo & Language Selector Icon */}
          <div className="flex items-center justify-between px-1 relative">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("home")} title="Eventzone Home">
              <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '22px', width: 'auto', maxWidth: '125px' }} className="h-5.5 w-auto object-contain" />
            </div>

            {/* Language Selector Icon Trigger */}
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
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 z-50 animate-scale-up">
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
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                    {currentEventSummary?.title || eventDetails?.title || "Eventzone Summit"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">
                    {currentEventSummary?.type || eventDetails?.type || "Hybrid"} Event
                  </span>
                </div>
              </div>
              <ChevronDown size={13} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${eventSwitcherOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Event Switcher Dropdown */}
            {eventSwitcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-scale-up">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Switch Event
                </span>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {userEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setActiveEventStateId(ev.id);
                        setEventSwitcherOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
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
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center cursor-pointer"
                  >
                    <span>Host New Event</span>
                  </button>

                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("events-hub");
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center cursor-pointer"
                  >
                    <span>All Events Hub</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5">
            <button 
              onClick={() => setCurrentView("overview")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "overview" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <LayoutDashboard size={14} className={`shrink-0 ${currentView === "overview" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.overview", "Overview")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("event-details")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${["event-details", "page-builder"].includes(currentView) ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <FileText size={14} className={`shrink-0 ${["event-details", "page-builder"].includes(currentView) ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.eventDetails", "Event Details")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("calendar")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "calendar" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Calendar size={14} className={`shrink-0 ${currentView === "calendar" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.calendar", "Agenda")}</span>
            </button>

            {/* Standalone Opportunities Tab */}
            <button 
              onClick={() => setCurrentView("opportunities")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "opportunities" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className={`shrink-0 ${currentView === "opportunities" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.opportunities", "Opportunities")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "opportunities" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{opportunities.filter(o => !o.isArchived).length}</span>
            </button>

            {/* Standalone Influencers Tab */}
            <button 
              onClick={() => setCurrentView("influencers")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "influencers" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Share2 size={14} className={`shrink-0 ${currentView === "influencers" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.influencers", "Influencers")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "influencers" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{influencers.filter(i => !i.isArchived).length}</span>
            </button>

            {/* 1. Expandable Companies Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setCompaniesOpen(!companiesOpen)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${["organizations", "sponsors", "exhibitors"].includes(currentView) ? "text-blue-700 bg-blue-50/50 font-extrabold" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} className={`shrink-0 ${["organizations", "sponsors", "exhibitors"].includes(currentView) ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span>{t("dash.allCompanies", "Companies")}</span>
                </div>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${companiesOpen ? "rotate-180" : ""}`} />
              </button>

              {companiesOpen && (
                <div className="flex flex-col gap-0.5 pl-3 mt-1 border-l border-slate-100 ml-4">
                  <button 
                    onClick={() => setCurrentView("organizations")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "organizations" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.organizations", "Organizations")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "organizations" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{organizations.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("sponsors")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "sponsors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.sponsors", "Sponsors")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "sponsors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{sponsors.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("exhibitors")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "exhibitors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
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

            {/* 2. Expandable Participants Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setParticipantsOpen(!participantsOpen)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${["attendees", "pending", "speakers"].includes(currentView) ? "text-blue-700 bg-blue-50/50 font-extrabold" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <Users2 size={14} className={`shrink-0 ${["attendees", "pending", "speakers"].includes(currentView) ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span>{t("dash.participants", "Participants")}</span>
                </div>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${participantsOpen ? "rotate-180" : ""}`} />
              </button>

              {participantsOpen && (
                <div className="flex flex-col gap-0.5 pl-3 mt-1 border-l border-slate-100 ml-4">
                  <button 
                    onClick={() => setCurrentView("attendees")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "attendees" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.attendees", "All Attendees")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "attendees" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{attendees.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("pending")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "pending" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock size={12} className="shrink-0" />
                      <span className="truncate">{t("dash.pending", "Pending")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full shrink-0 ${currentView === "pending" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{pending.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("speakers")}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "speakers" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
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

            <button 
              onClick={() => { setCurrentView("floor-plan"); setActiveFloorPlanId(null); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "floor-plan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className={`shrink-0 ${currentView === "floor-plan" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.floorPlan", "Floor Plans")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "floor-plan" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{floorPlans.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("tickets")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "tickets" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Ticket size={14} className={`shrink-0 ${currentView === "tickets" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.tickets", "Tickets")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("forms")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "forms" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className={`shrink-0 ${currentView === "forms" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.forms", "Forms & Surveys")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "forms" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{forms.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("rsvp")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "rsvp" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className={`shrink-0 ${currentView === "rsvp" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.rsvp", "RSVP")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "rsvp" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{rsvps.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("logistics")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "logistics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Boxes size={14} className={`shrink-0 ${currentView === "logistics" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.logistics", "Logistics")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "logistics" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                {(logisticsData.inventory?.length || 0) + (logisticsData.vendors?.length || 0)}
              </span>
            </button>

            <button 
              onClick={() => setCurrentView("documents")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "documents" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2">
                <Files size={14} className={`shrink-0 ${currentView === "documents" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.documents", "Documents")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "documents" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                {documents.filter(d => !d.isArchived).length}
              </span>
            </button>

            <button 
              onClick={() => setCurrentView("check-in")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "check-in" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <QrCode size={14} className={`shrink-0 ${currentView === "check-in" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.checkIn", "Check In")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("my-team")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "my-team" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <ShieldCheck size={14} className={`shrink-0 ${currentView === "my-team" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.myTeam", "My Team")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("analytics")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "analytics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <BarChart3 size={14} className={`shrink-0 ${currentView === "analytics" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.analytics", "Analytics")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("communications")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "communications" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Mail size={14} className={`shrink-0 ${currentView === "communications" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.communications", "Communications")}</span>
            </button>
          </nav>
        </div>



        {/* Sidebar Footer: User Profile Pill & Role Switcher */}
        <div className="pt-3 border-t border-slate-150 relative">
          <div 
            onClick={() => setProfileDropdownOpen(o => !o)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
              />
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-bold text-slate-800 truncate leading-tight">{currentUser?.fullName || "Organizer"}</span>
                <span className="text-[9px] font-semibold text-blue-600">Organizer Mode</span>
              </div>
            </div>
            <ChevronDown size={13} className="text-slate-400 shrink-0" />
          </div>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 z-50 animate-scale-up">
              {/* 1. My Profile */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("profile");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User size={14} className="text-slate-500 shrink-0" />
                <span>{t("nav.myProfile", "My Profile")}</span>
              </button>

              {/* 2. My Tickets */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("visitor-portal");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Ticket size={14} className="text-emerald-600 shrink-0" />
                  <span>{t("nav.myTickets", "My Tickets")}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px]">
                  {visitorRegistrations.length}
                </span>
              </button>

              {/* 3. Add an Event in Menu */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("create-event");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Plus size={14} className="text-blue-600 shrink-0 stroke-[2.5]" />
                <span>{t("nav.addEvent", "Add an Event")}</span>
              </button>

              {/* 4. Organizer Center */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("events-hub");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Building2 size={14} className="text-slate-500 shrink-0" />
                <span>{t("nav.organizerCenter", "Organizer Center")}</span>
              </button>

              {/* 5. Public Home */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("home");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <HomeIcon size={14} className="text-slate-400 shrink-0" />
                <span>{t("nav.publicHome", "Public Home")}</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut size={14} className="text-rose-500 shrink-0" />
                <span>{t("nav.signOut", "Sign Out")}</span>
              </button>
            </div>
          )}
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
                    Testing Platform as {team.find(m => m.id === simulatedMemberId)?.name || 'Team Member'}
                  </p>
                  <p className="text-xs opacity-95">
                    Viewing role: <strong>{team.find(m => m.id === simulatedMemberId)?.role || 'Staff'}</strong> • Module permissions are actively simulated.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView("my-team")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Manage Team
                </button>
                <button
                  onClick={() => setSimulatedMemberId(null)}
                  className="px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Exit Simulation
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
                  <strong>Viewer Mode (Read-Only)</strong>: You have read-only access to this module. Creation and editing actions are restricted to Editors.
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
              <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                You do not have permission to access the <strong>{currentView}</strong> module. Please contact your event administrator to request access.
              </p>
              <button 
                onClick={() => setCurrentView("overview")} 
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                Back to Dashboard
              </button>
            </div>
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
              onDelete={handleDeleteFloorPlan}
              onRename={handleRenameFloorPlan}
            />
          )}

          {currentView === "floor-plan" && isEditingFloorPlan && (
            <FloorPlanModifier 
              key={activeFloorPlanId}
              exhibitors={exhibitors.map(ex => {
                const org = organizations.find(o => String(o.id) === String(ex.org_id));
                return {
                  ...ex,
                  logo: ex.logo || org?.logo || '',
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
                await archiveForm(formId);
                setForms(prev => prev.map(f => f.id === formId ? { ...f, status: 'archived', isArchived: true } : f));
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

          {!["overview", "calendar", "page-builder", "event-details", "forms", "rsvp", "logistics", "documents"].includes(currentView) && currentView !== "floor-plan" && (
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

      {/* Record Creation Modals (Other types) */}
      {activeModalType && activeModalType !== "ticket" && activeModalType !== "attendee" && activeModalType !== "team" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-150 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 relative animate-scale-up">
            <header className="flex justify-between items-center select-none">
              <h3 className="text-lg font-bold text-slate-800">
                {activeModalType === "org" && "Add Partner Organization"}
                {activeModalType === "sponsor" && "Add Event Sponsor"}
                {activeModalType === "exhibitor" && "Register Exhibitor"}
              </h3>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-5">

              {activeModalType === "org" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organization Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. Sonatrach" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sector / Industry</label>
                    <input type="text" required value={modalSector} onChange={(e) => setModalSector(e.target.value)} placeholder="e.g. Energy" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</label>
                    <input type="text" required value={modalContact} onChange={(e) => setModalContact(e.target.value)} placeholder="e.g. Ahmed B." className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                </>
              )}

              {activeModalType === "sponsor" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sponsor Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. Air Liquide" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</label>
                    <SearchableSelect
                      value={modalTier}
                      onChange={(val) => setModalTier(val)}
                      options={[
                        { value: "diamond", label: "Diamond Tier" },
                        { value: "gold", label: "Gold Tier" },
                        { value: "silver", label: "Silver Tier" }
                      ]}
                      placeholder="Select tier..."
                    />
                  </div>
                </>
              )}

              {activeModalType === "exhibitor" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Organization</label>
                    <SearchableSelect
                      value={modalOrgId}
                      onChange={(val) => setModalOrgId(val)}
                      options={organizations.map(org => ({ value: org.id, label: org.name }))}
                      placeholder="-- Choose Organization --"
                      searchPlaceholder="Search organization by name..."
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Email</label>
                    <input type="email" required value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} placeholder="exhibitor@domain.com" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                </>
              )}
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl text-xs transition-all hover:shadow hover:-translate-y-0.5 mt-3 cursor-pointer"
              >
                Save Entry
              </button>
            </form>
          </div>
        </div>
      )}

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
    <LanguageProvider>
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
    </LanguageProvider>
  );
}
