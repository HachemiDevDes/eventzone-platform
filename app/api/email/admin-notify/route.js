import { NextResponse } from "next/server";
import {
  sendAdminOrganizerJoinedNotification,
  sendAdminEventPublishedNotification,
} from "@/lib/mailer";
import { getServiceSupabase } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// In-memory de-duplication cache to prevent burst duplicate notifications
const recentNotificationCache = new Map();
const DEDUPE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isDuplicateNotification(key) {
  if (!key) return false;
  const now = Date.now();
  const lastSent = recentNotificationCache.get(key);
  if (lastSent && now - lastSent < DEDUPE_TTL_MS) {
    return true;
  }
  recentNotificationCache.set(key, now);

  // Clean stale keys periodically
  if (recentNotificationCache.size > 500) {
    for (const [k, timestamp] of recentNotificationCache.entries()) {
      if (now - timestamp > DEDUPE_TTL_MS) {
        recentNotificationCache.delete(k);
      }
    }
  }
  return false;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, organizer = {}, event = {} } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required 'type' field ('organizer_joined' | 'event_published')." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // ── 1. ORGANIZER JOINED NOTIFICATION ──
    if (type === "organizer_joined") {
      let enrichedOrganizer = { ...organizer };
      const orgId = organizer.id;
      const orgEmail = (organizer.email || "").trim().toLowerCase();

      const dedupeKey = `organizer_joined:${orgId || orgEmail}`;
      if (isDuplicateNotification(dedupeKey)) {
        return NextResponse.json({
          success: true,
          deduplicated: true,
          message: "Notification already dispatched recently for this organizer.",
        });
      }

      // If missing details and we have an ID or email, enrich from profiles table
      if (supabase && (orgId || orgEmail)) {
        try {
          let query = supabase.from("profiles").select("*");
          if (orgId) {
            query = query.eq("id", orgId);
          } else {
            query = query.eq("email", orgEmail);
          }
          const { data: profileRow } = await query.maybeSingle();
          if (profileRow) {
            enrichedOrganizer = {
              id: profileRow.id || enrichedOrganizer.id,
              fullName: profileRow.full_name || enrichedOrganizer.fullName || "Organizer",
              email: profileRow.email || enrichedOrganizer.email,
              companyName: profileRow.company_name || enrichedOrganizer.companyName || "",
              jobTitle: profileRow.job_title || enrichedOrganizer.jobTitle || "",
              phone: profileRow.phone || enrichedOrganizer.phone || "",
              location: profileRow.location || enrichedOrganizer.location || "",
              createdAt: profileRow.created_at || enrichedOrganizer.createdAt || new Date().toISOString(),
              role: profileRow.role || enrichedOrganizer.role || "organizer",
            };
          }
        } catch (dbErr) {
          console.warn("Could not enrich organizer profile from DB:", dbErr);
        }
      }

      const sendResult = await sendAdminOrganizerJoinedNotification({
        organizer: enrichedOrganizer,
      });

      return NextResponse.json({
        success: true,
        type: "organizer_joined",
        messageId: sendResult?.messageId || null,
        organizerEmail: enrichedOrganizer.email,
      });
    }

    // ── 2. EVENT PUBLISHED NOTIFICATION ──
    if (type === "event_published") {
      let enrichedEvent = { ...event };
      let enrichedOrganizer = { ...organizer };
      const eventId = event.id;
      const eventSlug = event.slug;

      const dedupeKey = `event_published:${eventId || eventSlug || event.title}`;
      if (isDuplicateNotification(dedupeKey)) {
        return NextResponse.json({
          success: true,
          deduplicated: true,
          message: "Notification already dispatched recently for this event.",
        });
      }

      // Enrich event from database if id is given
      if (supabase && eventId) {
        try {
          const { data: eventRow } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)
            .maybeSingle();

          if (eventRow) {
            enrichedEvent = {
              id: eventRow.id,
              name: eventRow.name || enrichedEvent.name || enrichedEvent.title,
              title: eventRow.name || enrichedEvent.title || enrichedEvent.name,
              slug: eventRow.slug || enrichedEvent.slug,
              category: eventRow.category || enrichedEvent.category,
              type: eventRow.type || enrichedEvent.type,
              startDate: eventRow.start_date || enrichedEvent.startDate,
              endDate: eventRow.end_date || enrichedEvent.endDate,
              location: eventRow.location || enrichedEvent.location,
              capacity: eventRow.capacity || enrichedEvent.capacity,
              description: eventRow.description || enrichedEvent.description,
              banner: eventRow.banner || enrichedEvent.banner,
              status: eventRow.status || enrichedEvent.status,
              organizer_name: eventRow.organizer_name || enrichedEvent.organizer_name,
              organization: eventRow.organization || enrichedEvent.organization,
              contact_email: eventRow.contact_email || enrichedEvent.contact_email,
              contact_phone: eventRow.contact_phone || enrichedEvent.contact_phone,
              organizer_id: eventRow.organizer_id || enrichedEvent.organizer_id,
            };

            // If organizer info not passed, look up organizer profile via organizer_id
            if (eventRow.organizer_id && (!enrichedOrganizer.email || !enrichedOrganizer.fullName)) {
              const { data: orgProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", eventRow.organizer_id)
                .maybeSingle();

              if (orgProfile) {
                enrichedOrganizer = {
                  id: orgProfile.id,
                  fullName: orgProfile.full_name || enrichedOrganizer.fullName || eventRow.organizer_name,
                  email: orgProfile.email || enrichedOrganizer.email || eventRow.contact_email,
                  companyName: orgProfile.company_name || enrichedOrganizer.companyName || eventRow.organization,
                  phone: orgProfile.phone || enrichedOrganizer.phone || eventRow.contact_phone,
                  jobTitle: orgProfile.job_title || enrichedOrganizer.jobTitle,
                };
              }
            }
          }
        } catch (dbErr) {
          console.warn("Could not enrich event or organizer details from DB:", dbErr);
        }
      }

      const sendResult = await sendAdminEventPublishedNotification({
        event: enrichedEvent,
        organizer: enrichedOrganizer,
      });

      return NextResponse.json({
        success: true,
        type: "event_published",
        messageId: sendResult?.messageId || null,
        eventId: enrichedEvent.id || null,
        eventTitle: enrichedEvent.name || enrichedEvent.title,
      });
    }

    return NextResponse.json(
      { error: `Unsupported notification type: ${type}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST /api/email/admin-notify error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
