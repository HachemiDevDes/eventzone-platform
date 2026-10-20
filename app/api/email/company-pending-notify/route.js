import { NextResponse } from "next/server";
import { sendPendingCompanyAdminNotification } from "@/lib/mailer";
import { getServiceSupabase } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// In-memory de-duplication cache to prevent duplicate notifications during rapid submissions/retries
const recentNotificationCache = new Map();
const DEDUPE_TTL_MS = 30 * 1000; // 30 seconds

function isDuplicateNotification(key) {
  if (!key) return false;
  const now = Date.now();
  const lastSent = recentNotificationCache.get(key);
  if (lastSent && now - lastSent < DEDUPE_TTL_MS) {
    return true;
  }
  recentNotificationCache.set(key, now);

  // Clean stale keys periodically
  if (recentNotificationCache.size > 200) {
    for (const [k, timestamp] of recentNotificationCache.entries()) {
      if (now - timestamp > DEDUPE_TTL_MS) {
        recentNotificationCache.delete(k);
      }
    }
  }
  return false;
}

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      eventId,
      orgId,
      companyName,
      industry = "",
      contactName = "",
      email = "",
      phone = "",
      jobTitle = "Corporate Representative",
      companyRole = "exhibitor",
      ticketType = "Company Registration",
      selectedBooth = null,
      badgesIncluded = 2,
      website = "",
      nif = "",
      answers = {},
      description = "",
    } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required." },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: "Company name is required." },
        { status: 400 }
      );
    }

    const dedupeKey = `${eventId}:${companyName}:${email}`.toLowerCase();
    if (isDuplicateNotification(dedupeKey)) {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        message: "Notification already dispatched recently for this company registration.",
      });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.warn("Notice: Supabase service client not available for company notification.");
      return NextResponse.json(
        { success: false, error: "Database client unavailable." },
        { status: 500 }
      );
    }

    // 1. Fetch Event Details & Organizer metadata
    let eventData = null;
    if (isValidUuid(eventId)) {
      const { data: ev, error: evErr } = await supabase
        .from("events")
        .select("id, name, slug, location, start_date, end_date, contact_email, organizer_id, owner_id, organizer_name, organization")
        .eq("id", eventId)
        .maybeSingle();

      if (evErr) {
        console.warn("Could not fetch event for company pending notification:", evErr);
      }
      eventData = ev;
    }

    // Fallback event data if not found or non-UUID
    if (!eventData) {
      eventData = {
        id: eventId,
        name: body.eventTitle || "Your Event",
        contact_email: null,
      };
    }

    // 2. Fetch Organizer Profile Email (from profiles table)
    let organizerProfileEmail = null;
    const orgUserId = eventData.organizer_id || eventData.owner_id;
    if (orgUserId && isValidUuid(orgUserId)) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", orgUserId)
          .maybeSingle();

        if (profile?.email) {
          organizerProfileEmail = profile.email.trim().toLowerCase();
        }
      } catch (profErr) {
        console.warn("Could not query organizer profile for pending company email:", profErr);
      }
    }

    // 3. Fetch Team Members for this event and filter for ADMIN roles
    let adminTeamEmails = [];
    if (isValidUuid(eventId)) {
      try {
        const { data: teamRows, error: teamErr } = await supabase
          .from("team_members")
          .select("id, name, email, role, status, permissions")
          .eq("event_id", eventId);

        if (teamErr) {
          console.warn("Could not query team_members for company notification:", teamErr);
        } else if (teamRows && teamRows.length > 0) {
          adminTeamEmails = teamRows
            .filter((m) => {
              if (!m.email || !m.email.includes("@")) return false;
              // Ignore archived team members
              if (m.status === "archived" || m.status === "Archived" || m.is_archived === true) return false;

              const role = (m.role || "").toLowerCase().trim();
              const isAdminRole =
                role.includes("admin") ||
                role.includes("organizer") ||
                role === "owner" ||
                role === "co-host" ||
                m.permissions?.isAdmin === true;

              return isAdminRole;
            })
            .map((m) => m.email.trim().toLowerCase());
        }
      } catch (teamQueryErr) {
        console.warn("Error querying team admins for company notification:", teamQueryErr);
      }
    }

    // 4. Combine & Deduplicate all recipients (Organizer + Admin Team)
    const candidateEmails = [
      eventData.contact_email,
      organizerProfileEmail,
      ...adminTeamEmails,
    ];

    const allRecipients = Array.from(
      new Set(
        candidateEmails
          .filter((e) => typeof e === "string" && e.includes("@"))
          .map((e) => e.trim().toLowerCase())
      )
    );

    // Fallback: If no event organizer or admin emails were found, send to platform contact
    if (allRecipients.length === 0) {
      console.warn("No organizer or admin team emails found for event. Using default contact.");
      allRecipients.push("contact@eventzone.pro");
    }

    // 5. Send Notification Email
    await sendPendingCompanyAdminNotification({
      recipients: allRecipients,
      event: eventData,
      company: {
        id: orgId,
        name: companyName,
        industry,
        companyRole,
        website,
        nif,
        selectedBooth,
        badgesIncluded,
        description,
      },
      representative: {
        name: contactName,
        email,
        phone,
        jobTitle,
      },
      ticket: {
        name: ticketType,
        companyRole,
        badgesIncluded,
      },
      answers,
    });

    return NextResponse.json({
      success: true,
      recipientsCount: allRecipients.length,
      recipients: allRecipients,
    });
  } catch (err) {
    console.error("Failed to process company pending notification:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch notification." },
      { status: 500 }
    );
  }
}
