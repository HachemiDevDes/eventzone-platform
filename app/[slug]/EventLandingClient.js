/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import EventPublicLandingPage from "../../components/EventPublicLandingPage";
import AttendeePortalView from "../../components/AttendeePortalView";
import { LandingPageSkeleton } from "../../components/SkeletonLoaders";
import { 
  fetchEventDetails,
  fetchTickets, 
  fetchSessions, 
  fetchSponsors, 
  fetchExhibitors, 
  fetchOrganizations,
  fetchAttendees, 
  fetchInfluencers, 
  fetchForms, 
  fetchFormSubmissions, 
  fetchRSVPs, 
  fetchRSVPSettings,
  fetchFloorPlans,
  fetchDocuments,
  registerVisitorForEvent, 
  submitGuestRSVP as submitRSVP, 
  submitFormResponse, 
  recordInfluencerClick 
} from "../../lib/db";
import { supabase, sanitizeUserForStorage } from "../../lib/supabase";
import { useLanguage } from "../../lib/i18n";
import { Home, AlertCircle } from "lucide-react";

export default function EventLandingClient({ slug: propSlug, initialEvent = null }) {
  const router = useRouter();
  const routeParams = useParams();
  const rawSlug = propSlug || routeParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || "");

  const [eventDetails, setEventDetails] = useState(initialEvent);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [rsvpSettings, setRsvpSettings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialEvent);
  const [notFound, setNotFound] = useState(false);
  const [viewParam, setViewParam] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("view") || "";
    }
    return "";
  });

  const { t } = useLanguage();

  useEffect(() => {
    // Check initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(sanitizeUserForStorage(session.user));
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(sanitizeUserForStorage(session.user));
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!slug) return;

    // Check if slug is a language code or reserved app view
    if (["en", "fr", "ar"].includes(slug.toLowerCase())) {
      router.replace("/");
      return;
    }

    const appViews = ["create-event", "events-hub", "my-tickets", "profile", "auth", "admin"];
    if (appViews.includes(slug.toLowerCase())) {
      router.replace(`/?view=${slug.toLowerCase()}`);
      return;
    }

    const reserved = ["api", "checkin", "ci", "embed", "_next", "favicon.ico", "reset-password"];
    if (reserved.includes(slug.toLowerCase())) {
      return;
    }

    let isMounted = true;

    async function loadEventData() {
      // If we already have initialEvent matching this slug, just load child collections
      let currentEv = eventDetails;
      if (!currentEv || (currentEv.slug !== slug && currentEv.id !== slug)) {
        setIsLoading(true);
        setNotFound(false);
        try {
          currentEv = await fetchEventDetails(slug);
          if (!currentEv || !currentEv.id) {
            if (isMounted) {
              setNotFound(true);
              setIsLoading(false);
            }
            return;
          }
          if (isMounted) {
            setEventDetails(currentEv);
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Failed to load event for slug:", slug, err);
          if (isMounted) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }
      } else {
        setIsLoading(false);
      }

      if (!currentEv || !currentEv.id) return;
      const eventId = currentEv.id;

      // Session de-duplicated influencer tracking
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const refCode = sp.get("ref") || sp.get("referral") || sp.get("influencer");
        if (refCode) {
          const cleanRef = refCode.trim().toUpperCase();
          const sessionKey = `eventzone_ref_click_${eventId}_${cleanRef}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, "1");
            recordInfluencerClick(eventId, cleanRef).catch(() => {});
          }
        }
      }

      // Parallel non-blocking fetches for public landing page modules
      fetchTickets(eventId).then(res => isMounted && setTickets(res || [])).catch(() => {});
      fetchSessions(eventId).then(res => isMounted && setSessions(res || [])).catch(() => {});
      fetchSponsors(eventId).then(res => isMounted && setSponsors(res || [])).catch(() => {});
      fetchExhibitors(eventId).then(res => isMounted && setExhibitors(res || [])).catch(() => {});
      fetchOrganizations(eventId).then(res => isMounted && setOrganizations(res || [])).catch(() => {});
      fetchForms(eventId).then(res => isMounted && setForms(res || [])).catch(() => {});
      fetchRSVPSettings(eventId).then(res => isMounted && setRsvpSettings(res || {})).catch(() => {});
      fetchFloorPlans(eventId).then(res => isMounted && setFloorPlans(res || [])).catch(() => {});
      fetchDocuments(eventId).then(res => isMounted && setDocuments(res || [])).catch(() => {});
      fetchAttendees(eventId).then(res => isMounted && setAttendees(res || [])).catch(() => {});
      fetchInfluencers(eventId).then(res => isMounted && setInfluencers(res || [])).catch(() => {});
    }

    loadEventData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Visitor Registration Handler
  const handleRegister = async (targetEventId, visitorData) => {
    const eid = targetEventId || eventDetails?.id;
    if (!eid) return null;
    const res = await registerVisitorForEvent(eid, visitorData);
    if (res) {
      const updatedAtts = await fetchAttendees(eid).catch(() => []);
      setAttendees(updatedAtts);
    }
    return res;
  };

  // RSVP Submission Handler
  const handleRSVP = async (targetEventId, rsvpData) => {
    const eid = targetEventId || eventDetails?.id;
    if (!eid) return null;
    const res = await submitRSVP(eid, rsvpData);
    if (res) {
      const updatedRsvps = await fetchRSVPs(eid).catch(() => []);
      setRsvps(updatedRsvps);
    }
    return res;
  };

  // Custom Form Submission Handler
  const handleFormResponse = async (formId, responseData) => {
    const res = await submitFormResponse(formId, responseData);
    if (res && eventDetails?.id) {
      const updatedSubs = await fetchFormSubmissions(eventDetails.id).catch(() => []);
      setFormSubmissions(updatedSubs);
    }
    return res;
  };

  if (isLoading) {
    return <LandingPageSkeleton />;
  }

  if (notFound || !eventDetails) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 shadow-xl">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          {t("notFound.title", "Event Not Found")}
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
          {t("notFound.desc", "The event you are looking for could not be found or has been moved.")}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
        >
          <Home size={14} />
          <span>{t("notFound.backHome", "Browse All Events")}</span>
        </button>
      </div>
    );
  }

  const isOrganizerOrAdmin = currentUser && (
    currentUser.role === "admin" ||
    currentUser.role === "super_admin" ||
    currentUser.id === eventDetails.organizer_id ||
    currentUser.id === eventDetails.organizerId
  );

  if (eventDetails.status === "suspended" && !isOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-xl">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          {t("suspended.title", "Event Suspended")}
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
          {t("suspended.desc", "This event has been temporarily suspended by the platform administration and is currently unavailable for public viewing or registration.")}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
        >
          <Home size={14} />
          <span>{t("notFound.backHome", "Browse All Events")}</span>
        </button>
      </div>
    );
  }

  if (viewParam === "attendee-portal") {
    return (
      <AttendeePortalView
        eventDetails={eventDetails}
        attendees={attendees}
        sessions={sessions}
        sponsors={sponsors}
        exhibitors={exhibitors}
        floorPlans={floorPlans}
        documents={documents}
        tickets={tickets}
        currentUser={currentUser}
        onGoToHome={() => router.push("/")}
        onOpenAuth={(mode) => router.push(`/?view=auth&mode=${mode || "signin"}`)}
        onOpenProfile={() => router.push("/?view=profile")}
        onSignOut={async () => {
          await supabase.auth.signOut();
          setCurrentUser(null);
        }}
        onOpenEventsHub={() => router.push("/?view=events-hub")}
        onViewLivePage={() => setViewParam("")}
      />
    );
  }

  return (
    <EventPublicLandingPage
      eventId={eventDetails.id}
      eventDetails={eventDetails}
      sessions={sessions}
      sponsors={sponsors}
      exhibitors={exhibitors}
      organizations={organizations}
      attendees={attendees}
      tickets={tickets}
      influencers={influencers}
      forms={forms}
      formSubmissions={formSubmissions}
      rsvps={rsvps}
      rsvpSettings={rsvpSettings}
      isLoading={false}
      onSubmitRSVP={handleRSVP}
      onSubmitFormResponse={handleFormResponse}
      currentUser={currentUser}
      onBackToHome={() => router.push("/")}
      onViewFloorPlan={(planId) => router.push(`/?view=floor-plan&planId=${planId}&preview=true`)}
      onRegisterForEvent={handleRegister}
      onOpenAuth={(mode) => router.push(`/?view=auth&mode=${mode || "signin"}`)}
    />
  );
}
