import { isPlatformSuperAdminEmail } from "./constants";

/**
 * Platform Modules and Role Presets Definition
 * Used for Granular Access Control (Viewer vs Editor per module)
 */

export const MODULE_CATEGORIES = [
  { id: "all", label: "All Modules" },
  { id: "General", label: "General & Overview" },
  { id: "Program", label: "Program & Agenda" },
  { id: "Commercial", label: "Commercial & Partners" },
  { id: "People", label: "People & Attendees" },
  { id: "Operations", label: "Operations & Logistics" },
  { id: "Engagement", label: "Engagement & Comms" },
  { id: "Administration", label: "Administration" }
];

export const EVENT_MODULES = [
  {
    id: "overview",
    name: "Overview Dashboard",
    description: "Event metrics, live registration graphs, and activity overview",
    category: "General",
    icon: "LayoutDashboard"
  },
  {
    id: "event-details",
    name: "Event Details & Landing Page",
    description: "Event title, dates, venue, themes, visual branding, and live builder",
    category: "General",
    icon: "FileText"
  },
  {
    id: "calendar",
    name: "Agenda & Sessions",
    description: "Schedule builder, tracks, speakers, session times and rooms",
    category: "Program",
    icon: "Calendar"
  },
  {
    id: "speakers",
    name: "Speakers Directory",
    description: "Speaker bios, photos, sessions, and stage assignments",
    category: "Program",
    icon: "Mic2"
  },
  {
    id: "opportunities",
    name: "Opportunities & Deals",
    description: "CRM pipelines, sponsorship deals, and lead tracking",
    category: "Commercial",
    icon: "TrendingUp"
  },
  {
    id: "organizations",
    name: "Organizations & Partners",
    description: "Partner companies, corporate profiles, and industries",
    category: "Commercial",
    icon: "Building2"
  },
  {
    id: "sponsors",
    name: "Sponsors Management",
    description: "Sponsor tiers (Platinum, Gold, Silver), logos, and packages",
    category: "Commercial",
    icon: "Sparkles"
  },
  {
    id: "exhibitors",
    name: "Exhibitors & Booths",
    description: "Exhibitor directory, booth assignments, and contact reps",
    category: "Commercial",
    icon: "Store"
  },
  {
    id: "influencers",
    name: "Influencers & Affiliates",
    description: "Influencer referral tracking links, promo codes, clicks, and revenue attribution",
    category: "Commercial",
    icon: "Share2"
  },
  {
    id: "tickets",
    name: "Tickets & Pricing",
    description: "Ticket tiers, prices, quotas, custom forms, and promo codes",
    category: "Commercial",
    icon: "Ticket"
  },
  {
    id: "attendees",
    name: "Attendees & Participants",
    description: "Confirmed attendees directory, badges, credentials, and check-in history",
    category: "People",
    icon: "UserCheck"
  },
  {
    id: "pending",
    name: "Pending Registrations",
    description: "Registration approval queue, payment verification, and attendee intake",
    category: "People",
    icon: "Clock"
  },
  {
    id: "rsvp",
    name: "RSVP & Headcount",
    description: "VIP invites, guest responses, dietary requirements, and +1s",
    category: "People",
    icon: "CheckCircle2"
  },
  {
    id: "floor-plan",
    name: "Floor Plans & Blueprints",
    description: "2D/3D floor layouts, booth grid designer, and venue zones",
    category: "Operations",
    icon: "Layers"
  },
  {
    id: "logistics",
    name: "Logistics & Operations",
    description: "Equipment inventory, suppliers, VIP travel, checklists, run-of-show",
    category: "Operations",
    icon: "Boxes"
  },
  {
    id: "documents",
    name: "Documents & Assets",
    description: "Upload and manage event contracts, permits, media kits, presentation slides, and policies",
    category: "Operations",
    icon: "Files"
  },
  {
    id: "check-in",
    name: "On-Site Check-In & Scanner",
    description: "Live QR code scanning, badge printing, and arrival velocity",
    category: "Operations",
    icon: "QrCode"
  },
  {
    id: "forms",
    name: "Forms & Surveys",
    description: "Registration questionnaires, feedback forms, and survey responses",
    category: "Engagement",
    icon: "ClipboardList"
  },
  {
    id: "communications",
    name: "Communications & Broadcasts",
    description: "Email broadcasts, push notifications, and attendee messaging",
    category: "Engagement",
    icon: "Mail"
  },
  {
    id: "certificates",
    name: "Certificates & Honors",
    description: "Design templates, customize credentials, and print batch A4 certificates for attendees, speakers, and partners",
    category: "Engagement",
    icon: "Award"
  },
  {
    id: "analytics",
    name: "Analytics & Reports",
    description: "Registration velocity, revenue breakdown, check-in stats, and export",
    category: "General",
    icon: "BarChart3"
  },
  {
    id: "my-team",
    name: "Team & Access Control",
    description: "Invite organizers, manage staff roles and granular module permissions",
    category: "Administration",
    icon: "ShieldCheck"
  },
  {
    id: "developers",
    name: "Developers & API",
    description: "API keys, embed widgets, public ticket endpoints, webhooks, and playground",
    category: "Administration",
    icon: "Code2"
  }
];

export const ROLE_PRESETS = [
  {
    id: "Admin",
    title: "Event Admin / Co-Organizer",
    description: "Full Editor access to all modules and configurations across the platform.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    roleName: "Admin",
    permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
  },
  {
    id: "Registration",
    title: "Registration & Desk Staff",
    description: "Editor for Check-In, Attendees, Pending, and RSVP; Viewer for Agenda & Tickets.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    roleName: "Registration Staff",
    permissions: {
      "attendees": "editor",
      "pending": "editor",
      "check-in": "editor",
      "rsvp": "editor",
      "calendar": "viewer",
      "tickets": "viewer",
      "floor-plan": "viewer",
      "documents": "viewer",
      "overview": "viewer"
    }
  },
  {
    id: "StageManager",
    title: "Stage & Program Coordinator",
    description: "Editor for Agenda, Speakers, and Event Details; Viewer for Attendees & Sponsors.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    roleName: "Program Coordinator",
    permissions: {
      "calendar": "editor",
      "speakers": "editor",
      "event-details": "editor",
      "documents": "editor",
      "overview": "viewer",
      "attendees": "viewer",
      "sponsors": "viewer"
    }
  },
  {
    id: "LogisticsLead",
    title: "Logistics & Floor Lead",
    description: "Editor for Logistics, Floor Plans, and Exhibitors; Viewer for Agenda & Attendees.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    roleName: "Logistics Manager",
    permissions: {
      "logistics": "editor",
      "floor-plan": "editor",
      "documents": "editor",
      "exhibitors": "editor",
      "sponsors": "viewer",
      "calendar": "viewer",
      "attendees": "viewer",
      "overview": "viewer"
    }
  },
  {
    id: "CommercialLead",
    title: "Sponsorship & Sales Lead",
    description: "Editor for Opportunities, Sponsors, Organizations, and Exhibitors; Viewer for Tickets.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    roleName: "Partnership Lead",
    permissions: {
      "opportunities": "editor",
      "influencers": "editor",
      "sponsors": "editor",
      "organizations": "editor",
      "exhibitors": "editor",
      "documents": "editor",
      "tickets": "viewer",
      "analytics": "viewer",
      "overview": "viewer"
    }
  },
  {
    id: "MarketingLead",
    title: "Marketing & Comms Specialist",
    description: "Editor for Communications, Forms, and Event Details; Viewer for Analytics & Tickets.",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    roleName: "Marketing Specialist",
    permissions: {
      "communications": "editor",
      "influencers": "editor",
      "forms": "editor",
      "event-details": "editor",
      "documents": "editor",
      "analytics": "viewer",
      "tickets": "viewer",
      "attendees": "viewer",
      "overview": "viewer"
    }
  },
  {
    id: "Auditor",
    title: "Auditor / Stakeholder (View-Only)",
    description: "Viewer access to all platform modules with read-only restriction.",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    roleName: "Observer / Stakeholder",
    permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "viewer"]))
  },
  {
    id: "Custom",
    title: "Custom Access",
    description: "Configure bespoke granular permissions per module manually.",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    roleName: "Specialist",
    permissions: {}
  }
];

/**
 * Get effective permissions for the active session.
 * Takes into account owner status, team member record, and optional role simulation.
 */
export function getEffectivePermissions(
  currentUser,
  activeEvent,
  team = [],
  simulatedMemberId = null,
  userEvents = [],
  activeEventId = null
) {
  // 1. If simulation is active, resolve simulated team member
  if (simulatedMemberId) {
    const simMember = team.find(m => m.id === simulatedMemberId);
    if (simMember) {
      const perms = simMember.permissions || {};
      const roleLower = (simMember.role || "").toLowerCase();
      const isSimAdmin = roleLower === "admin" || roleLower === "organizer" || roleLower === "owner" || roleLower === "co-host";
      return {
        isOwner: false,
        isAdmin: isSimAdmin,
        isSimulated: true,
        simulatedMember: simMember,
        permissions: isSimAdmin ? Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"])) : perms
      };
    }
  }

  // 2. If no user is logged in: read-only viewer mode
  if (!currentUser) {
    return {
      isOwner: false,
      isAdmin: false,
      isSimulated: false,
      permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "viewer"]))
    };
  }

  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const userIdStr = currentUser.id ? String(currentUser.id).toLowerCase().trim() : "";

  // 3. Global Platform Admin Check:
  // super_admin, admin, isAdmin: true, or primary platform administrator email
  const isGlobalAdmin = !!(
    currentUser.isVerifiedAdmin === true ||
    isPlatformSuperAdminEmail(userEmail) ||
    ((currentUser.role === "admin" || currentUser.role === "super_admin") && (currentUser.isAdmin === true || currentUser.is_admin === true))
  );

  if (isGlobalAdmin) {
    return {
      isOwner: true,
      isAdmin: true,
      isSimulated: false,
      permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
    };
  }

  // 4. Resolve Event Identifiers & Organizer Fields
  const currentEventId = activeEvent?.id || activeEventId || "";
  const currentEventIdStr = currentEventId ? String(currentEventId).toLowerCase().trim() : "";
  const eventOrganizerId = activeEvent?.organizer_id || activeEvent?.organizerId || activeEvent?.owner_id || activeEvent?.ownerId || activeEvent?.user_id || activeEvent?.userId;
  const eventOrganizerIdStr = eventOrganizerId ? String(eventOrganizerId).toLowerCase().trim() : "";

  const eventContactEmail = (activeEvent?.contact_email || activeEvent?.contactEmail || "").toLowerCase().trim();
  const eventHostEmail = (activeEvent?.host_email || activeEvent?.hostEmail || "").toLowerCase().trim();
  const eventOrganizerEmail = (activeEvent?.organizer_email || activeEvent?.organizerEmail || "").toLowerCase().trim();

  const isOrganizerUser = currentUser.role === "organizer" || currentUser.isOrganizer === true;

  // 5. Event Ownership Verification:
  // A. Check if the active event exists in the user's fetched events list (userEvents)
  const isMatchInUserEvents = Array.isArray(userEvents) && userEvents.some(ev => {
    if (!ev) return false;
    const evIdStr = ev.id ? String(ev.id).toLowerCase().trim() : "";
    if (currentEventIdStr && evIdStr === currentEventIdStr) return true;
    if (activeEvent?.slug && ev.slug && String(ev.slug).toLowerCase().trim() === String(activeEvent.slug).toLowerCase().trim()) return true;
    return false;
  });

  // B. Check direct user ID match
  const isMatchByUserId = !!(userIdStr && eventOrganizerIdStr && userIdStr === eventOrganizerIdStr);

  // C. Check email match across event contact/host/organizer emails
  const isMatchByEmail = !!(userEmail && (
    (eventContactEmail && eventContactEmail === userEmail) ||
    (eventHostEmail && eventHostEmail === userEmail) ||
    (eventOrganizerEmail && eventOrganizerEmail === userEmail)
  ));

  // D. Check if event is unassigned, demo, or default
  const isUnassignedOrDemo = !eventOrganizerIdStr || 
    currentEventIdStr === "default-summit-2025" || 
    currentEventIdStr === "myevent" ||
    currentEventIdStr === "00000000-0000-0000-0000-000000000001";

  // E. Ownership determination:
  const isOwner = !!(
    isMatchInUserEvents ||
    isMatchByUserId ||
    isMatchByEmail ||
    (!activeEvent && isOrganizerUser) || // While active event is loading in organizer dashboard, keep full edit rights
    (isUnassignedOrDemo && isOrganizerUser)
  );

  if (isOwner) {
    return {
      isOwner: true,
      isAdmin: true,
      isSimulated: false,
      permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
    };
  }

  // 6. Team Member Verification:
  // If user is invited to this event's team, resolve their assigned role and permissions
  const matchedMember = team.find(m => {
    if (!m) return false;
    const memberEmail = (m.email || "").toLowerCase().trim();
    if (userEmail && memberEmail && memberEmail === userEmail) return true;
    const mUserId = m.userId || m.user_id || m.id;
    if (userIdStr && mUserId && String(mUserId).toLowerCase().trim() === userIdStr) return true;
    return false;
  });

  if (matchedMember) {
    const roleLower = (matchedMember.role || "").toLowerCase();
    const isMemberAdmin = roleLower === "admin" || roleLower === "organizer" || roleLower === "owner" || roleLower === "co-host" || roleLower === "host";
    return {
      isOwner: isMemberAdmin,
      isAdmin: isMemberAdmin,
      isSimulated: false,
      member: matchedMember,
      permissions: isMemberAdmin ? Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"])) : (matchedMember.permissions || {})
    };
  }

  // 7. Registered Organizer Fallback:
  // Any user with organizer role in their management workspace retains editor access
  if (isOrganizerUser) {
    return {
      isOwner: true,
      isAdmin: true,
      isSimulated: false,
      permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
    };
  }

  // 8. Default fallback for non-team visitors / attendees: Read-only Viewer mode
  return {
    isOwner: false,
    isAdmin: false,
    isSimulated: false,
    permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "viewer"]))
  };
}

/**
 * Check if current permissions allow viewing a module
 */
export function canViewModule(moduleKey, permissionsMap = {}) {
  const perm = permissionsMap[moduleKey];
  return perm === "editor" || perm === "viewer";
}

/**
 * Check if current permissions allow editing a module
 */
export function canEditModule(moduleKey, permissionsMap = {}) {
  return permissionsMap[moduleKey] === "editor";
}

/**
 * Get permission level for a module: 'editor' | 'viewer' | 'none'
 */
export function getModulePermission(moduleKey, permissionsMap = {}) {
  return permissionsMap[moduleKey] || "none";
}

/**
 * Summarize a permissions map into counts
 */
export function getPermissionSummary(permissionsMap = {}) {
  let editorCount = 0;
  let viewerCount = 0;
  
  EVENT_MODULES.forEach(mod => {
    const level = permissionsMap[mod.id];
    if (level === "editor") editorCount++;
    else if (level === "viewer") viewerCount++;
  });

  return {
    totalAssigned: editorCount + viewerCount,
    editorCount,
    viewerCount,
    noneCount: EVENT_MODULES.length - (editorCount + viewerCount)
  };
}
