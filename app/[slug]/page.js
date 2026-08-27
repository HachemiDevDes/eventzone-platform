/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import EventPublicLandingPage from "../../components/EventPublicLandingPage";
import { LandingPageSkeleton } from "../../components/SkeletonLoaders";
import { 
  fetchEventDetails, 
  fetchTickets, 
  fetchSessions, 
  fetchSponsors, 
  fetchExhibitors, 
  fetchAttendees, 
  fetchInfluencers, 
  fetchForms, 
  fetchFormSubmissions, 
  fetchRSVPs, 
  fetchRSVPSettings, 
  registerVisitorForEvent, 
  submitGuestRSVP as submitRSVP, 
  submitFormResponse, 
  recordInfluencerClick 
} from "../../lib/db";
import { useLanguage } from "../../lib/i18n";
import { Calendar, ArrowLeft, Home, Sparkles, AlertCircle } from "lucide-react";

export default function DynamicEventLandingPage({ params }) {
  const router = useRouter();
  const routeParams = useParams();
  const resolvedParams = params ? (typeof params.then === "function" ? use(params) : params) : routeParams;
  const rawSlug = resolvedParams?.slug || routeParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const [eventDetails, setEventDetails] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [rsvpSettings, setRsvpSettings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // Check if slug is a reserved system path
    const reserved = ["api", "checkin", "ci", "embed", "_next", "favicon.ico", "reset-password"];
    if (reserved.includes(slug.toLowerCase())) {
      return;
    }

    let isMounted = true;

    async function loadEventData() {
      setIsLoading(true);
      setNotFound(false);

      try {
        // 1. Resolve event by slug or UUID
        const event = await fetchEventDetails(slug);
        if (!event || !event.id) {
          if (isMounted) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        if (!isMounted) return;
        setEventDetails(event);

        // Track influencer referral if present in search params
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          const refCode = sp.get("ref") || sp.get("referral") || sp.get("influencer");
          if (refCode) {
            recordInfluencerClick(event.id, refCode).catch(() => {});
          }
        }

        // 2. Parallel fetch all related public data
        const eventId = event.id;
        const [
          loadedTickets,
          loadedSessions,
          loadedSponsors,
          loadedExhibitors,
          loadedAttendees,
          loadedInfluencers,
          loadedForms,
          loadedSubmissions,
          loadedRsvps,
          loadedRsvpSettings
        ] = await Promise.all([
          fetchTickets(eventId).catch(() => []),
          fetchSessions(eventId).catch(() => []),
          fetchSponsors(eventId).catch(() => []),
          fetchExhibitors(eventId).catch(() => []),
          fetchAttendees(eventId).catch(() => []),
          fetchInfluencers(eventId).catch(() => []),
          fetchForms(eventId).catch(() => []),
          fetchFormSubmissions(eventId).catch(() => []),
          fetchRSVPs(eventId).catch(() => []),
          fetchRSVPSettings(eventId).catch(() => ({}))
        ]);

        if (!isMounted) return;

        setTickets(loadedTickets || []);
        setSessions(loadedSessions || []);
        setSponsors(loadedSponsors || []);
        setExhibitors(loadedExhibitors || []);
        setAttendees(loadedAttendees || []);
        setInfluencers(loadedInfluencers || []);
        setForms(loadedForms || []);
        setFormSubmissions(loadedSubmissions || []);
        setRsvps(loadedRsvps || []);
        setRsvpSettings(loadedRsvpSettings || {});
      } catch (err) {
        console.error("Failed to load event for slug:", slug, err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
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
      // Refresh attendees count
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
          Event Not Found
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
          The event you are looking for at <code className="text-blue-400 bg-slate-800 px-2 py-0.5 rounded font-mono">/{slug}</code> could not be found or has been moved.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
        >
          <Home size={14} />
          <span>Browse All Events</span>
        </button>
      </div>
    );
  }

  return (
    <EventPublicLandingPage
      eventId={eventDetails.id}
      eventDetails={eventDetails}
      sessions={sessions}
      sponsors={sponsors}
      exhibitors={exhibitors}
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
