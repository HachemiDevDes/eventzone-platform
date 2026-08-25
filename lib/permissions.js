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
export function getEffectivePermissions(currentUser, activeEvent, team = [], simulatedMemberId = null) {
  // If simulation is active, resolve simulated team member
  if (simulatedMemberId) {
    const simMember = team.find(m => m.id === simulatedMemberId);
    if (simMember) {
      const perms = simMember.permissions || {};
      const isSimAdmin = (simMember.role || "").toLowerCase() === "admin" || (simMember.role || "").toLowerCase() === "organizer";
      return {
        isOwner: false,
        isAdmin: isSimAdmin,
        isSimulated: true,
        simulatedMember: simMember,
        permissions: isSimAdmin ? Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"])) : perms
      };
    }
  }

  // If no user is logged in or user is the event owner/creator
  if (!currentUser) {
    // Default demo/admin access
    return {
      isOwner: true,
      isAdmin: true,
      isSimulated: false,
      permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
    };
  }

  // Check if current user is event owner
  const isOwner = activeEvent && (activeEvent.owner_id === currentUser.id || activeEvent.ownerId === currentUser.id);
  const isGlobalAdmin = currentUser.role === "admin" || currentUser.role === "organizer";

  if (isOwner || isGlobalAdmin) {
    return {
      isOwner: true,
      isAdmin: true,
      isSimulated: false,
      permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
    };
  }

  // Check if current user's email matches a team member in this event
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const matchedMember = team.find(m => (m.email || "").toLowerCase().trim() === userEmail);

  if (matchedMember) {
    const isMemberAdmin = (matchedMember.role || "").toLowerCase() === "admin" || (matchedMember.role || "").toLowerCase() === "organizer";
    return {
      isOwner: false,
      isAdmin: isMemberAdmin,
      isSimulated: false,
      member: matchedMember,
      permissions: isMemberAdmin ? Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"])) : (matchedMember.permissions || {})
    };
  }

  // Default fallback for general user
  return {
    isOwner: true,
    isAdmin: true,
    isSimulated: false,
    permissions: Object.fromEntries(EVENT_MODULES.map(m => [m.id, "editor"]))
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
