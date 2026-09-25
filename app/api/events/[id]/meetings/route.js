import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function cleanEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

async function resolveEventUuid(supabase, eventParam) {
  if (!eventParam) return null;
  if (isValidUuid(eventParam)) return eventParam;
  try {
    const { data } = await supabase
      .from("events")
      .select("id")
      .or(`slug.eq.${eventParam},id.eq.${eventParam}`)
      .maybeSingle();
    if (data?.id && isValidUuid(data.id)) return data.id;
  } catch (e) {}
  return null;
}

async function resolveProfileId(supabase, userId, email) {
  if (isValidUuid(userId)) return userId;
  const clean = cleanEmail(email);
  if (!clean) return null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", clean)
      .maybeSingle();
    if (data?.id && isValidUuid(data.id)) return data.id;
  } catch (e) {}
  return null;
}

function parseTimeToDouble(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseFloat(parts[0]) || 0;
  const m = parseFloat(parts[1]) || 0;
  return h + m / 60.0;
}

function isSlotOverlapping(start1, end1, start2, end2) {
  const s1 = parseTimeToDouble(start1);
  const e1 = parseTimeToDouble(end1);
  const s2 = parseTimeToDouble(start2);
  const e2 = parseTimeToDouble(end2);
  return s1 < e2 && e1 > s2;
}

export async function GET(request, { params }) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const email = cleanEmail(searchParams.get("email"));
  const userId = searchParams.get("userId") || "";

  if (!email && !userId) {
    return NextResponse.json(
      { meetings: [], upcoming: [], pending: [], past: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  try {
    const supabase = getServiceSupabase();
    const eventUuid = await resolveEventUuid(supabase, eventId);
    const profileId = await resolveProfileId(supabase, userId, email);

    if (!profileId) {
      return NextResponse.json(
        { meetings: [], upcoming: [], pending: [], past: [] },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    let query = supabase
      .from("meetings")
      .select("*, organizer_profile:profiles!organizer_id(id, full_name, email, avatar_url, job_title, company_name), attendee_profile:profiles!attendee_id(id, full_name, email, avatar_url, job_title, company_name)")
      .or(`organizer_id.eq.${profileId},attendee_id.eq.${profileId}`)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (eventUuid) {
      query = query.eq("event_id", eventUuid);
    }

    const { data: dbMeetings, error } = await query;

    if (error) {
      console.warn("Meetings fetch error:", error);
      return NextResponse.json(
        { meetings: [], upcoming: [], pending: [], past: [] },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const nowTimeStr = new Date().toTimeString().substring(0, 5);

    const formattedMeetings = (dbMeetings || []).map((m) => {
      const isOrganizer = m.organizer_id === profileId;
      const otherProfile = isOrganizer ? m.attendee_profile : m.organizer_profile;

      return {
        id: m.id,
        eventId: m.event_id,
        organizerId: m.organizer_id,
        attendeeId: m.attendee_id,
        isOrganizer,
        title: m.title,
        date: m.date,
        startTime: String(m.start_time || "").substring(0, 5),
        endTime: String(m.end_time || "").substring(0, 5),
        location: m.location || "Networking Lounge",
        note: m.note || "",
        status: m.status || "pending",
        createdAt: m.created_at,
        otherName: otherProfile?.full_name || (isOrganizer ? "Attendee" : "Organizer"),
        otherEmail: otherProfile?.email || "",
        otherAvatarUrl: otherProfile?.avatar_url || "",
        otherTitle: otherProfile?.job_title || "",
        otherCompany: otherProfile?.company_name || "",
      };
    });

    const upcoming = [];
    const pending = [];
    const past = [];

    formattedMeetings.forEach((meeting) => {
      if (meeting.status === "pending") {
        pending.push(meeting);
      } else if (meeting.status === "accepted") {
        if (meeting.date > todayStr || (meeting.date === todayStr && meeting.endTime >= nowTimeStr)) {
          upcoming.push(meeting);
        } else {
          past.push(meeting);
        }
      } else {
        past.push(meeting);
      }
    });

    return NextResponse.json(
      { meetings: formattedMeetings, upcoming, pending, past },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("GET meetings route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { action } = body;
    const supabase = getServiceSupabase();
    const eventUuid = await resolveEventUuid(supabase, eventId);

    // ─────────────────────────────────────────────
    // 1. ACTION: BOOK MEETING
    // ─────────────────────────────────────────────
    if (action === "book") {
      const {
        sender,
        recipient,
        date,
        startTime,
        endTime,
        location,
        note,
        title,
      } = body;

      if (!sender || !recipient || !date || !startTime || !endTime) {
        return NextResponse.json(
          { error: "Sender, recipient, date, start time, and end time are required." },
          { status: 400 }
        );
      }

      const senderId = await resolveProfileId(supabase, sender.id, sender.email);
      const recipientId = await resolveProfileId(supabase, recipient.id, recipient.email);

      if (!senderId || !recipientId) {
        return NextResponse.json(
          { error: "Could not resolve valid profiles for attendees." },
          { status: 400 }
        );
      }

      if (senderId === recipientId) {
        return NextResponse.json(
          { error: "You cannot schedule a meeting with yourself." },
          { status: 400 }
        );
      }

      // Check Prerequisite: must be connected (status: accepted/connected)
      const senderEmail = cleanEmail(sender.email);
      const recipientEmail = cleanEmail(recipient.email);

      let isConnected = false;
      try {
        const { data: connRows } = await supabase
          .from("connections")
          .select("id, status, pipeline_stage, notes, tags, email, user_id, connected_user_id, linked_profile_id")
          .or(`user_id.eq.${senderId},connected_user_id.eq.${senderId},linked_profile_id.eq.${senderId},user_id.eq.${recipientId},connected_user_id.eq.${recipientId},linked_profile_id.eq.${recipientId}`);

        if (Array.isArray(connRows) && connRows.length > 0) {
          for (const row of connRows) {
            const rawStatus = (row.status || row.pipeline_stage || "").toLowerCase();
            const isAccepted = rawStatus === "accepted" || rawStatus === "connected";

            if (isAccepted) {
              const u1 = row.user_id;
              const u2 = row.connected_user_id || row.linked_profile_id;
              if (
                (u1 === senderId && u2 === recipientId) ||
                (u1 === recipientId && u2 === senderId)
              ) {
                isConnected = true;
                break;
              }

              // Check email tags or metadata if user IDs were not populated
              if (Array.isArray(row.tags) && row.tags.length >= 2) {
                const t1 = cleanEmail(row.tags[0]);
                const t2 = cleanEmail(row.tags[1]);
                if (
                  (t1 === senderEmail && t2 === recipientEmail) ||
                  (t1 === recipientEmail && t2 === senderEmail)
                ) {
                  isConnected = true;
                  break;
                }
              }
            }
          }
        }
      } catch (connErr) {
        console.warn("Connection check warning:", connErr);
      }

      if (!isConnected) {
        return NextResponse.json(
          { error: "You must be connected with this attendee before booking a meeting." },
          { status: 403 }
        );
      }

      // Check Conflict Prevention
      try {
        const { data: conflictMeetings } = await supabase
          .from("meetings")
          .select("id, start_time, end_time")
          .eq("date", date)
          .eq("status", "accepted")
          .or(`organizer_id.eq.${senderId},attendee_id.eq.${senderId},organizer_id.eq.${recipientId},attendee_id.eq.${recipientId}`);

        if (Array.isArray(conflictMeetings) && conflictMeetings.length > 0) {
          const hasConflict = conflictMeetings.some((m) =>
            isSlotOverlapping(startTime, endTime, m.start_time, m.end_time)
          );

          if (hasConflict) {
            return NextResponse.json(
              { error: "This time slot is unavailable due to an existing accepted meeting." },
              { status: 409 }
            );
          }
        }
      } catch (confErr) {
        console.warn("Conflict check warning:", confErr);
      }

      const meetingId = crypto.randomUUID();
      const newMeeting = {
        id: meetingId,
        event_id: eventUuid || null,
        organizer_id: senderId,
        attendee_id: recipientId,
        title: title?.trim() || `Meeting with ${recipient.name || recipient.fullName || "Attendee"}`,
        date,
        start_time: startTime.substring(0, 5),
        end_time: endTime.substring(0, 5),
        location: location?.trim() || "Networking Lounge",
        note: note?.trim() || null,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from("meetings").insert(newMeeting);

      if (insertErr) {
        console.error("Meeting insert error:", insertErr);
        return NextResponse.json({ error: insertErr.message || "Failed to book meeting." }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, meeting: newMeeting },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    // ─────────────────────────────────────────────
    // 2. ACTION: ACCEPT MEETING
    // ─────────────────────────────────────────────
    if (action === "accept") {
      const { meetingId } = body;
      if (!meetingId) {
        return NextResponse.json({ error: "meetingId is required." }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from("meetings")
        .update({ status: "accepted" })
        .eq("id", meetingId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, status: "accepted" },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    // ─────────────────────────────────────────────
    // 3. ACTION: DECLINE / REFUSE MEETING
    // ─────────────────────────────────────────────
    if (action === "decline" || action === "refuse") {
      const { meetingId } = body;
      if (!meetingId) {
        return NextResponse.json({ error: "meetingId is required." }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from("meetings")
        .update({ status: "declined" })
        .eq("id", meetingId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, status: "declined" },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    // ─────────────────────────────────────────────
    // 4. ACTION: CANCEL MEETING
    // ─────────────────────────────────────────────
    if (action === "cancel") {
      const { meetingId } = body;
      if (!meetingId) {
        return NextResponse.json({ error: "meetingId is required." }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from("meetings")
        .update({ status: "cancelled" })
        .eq("id", meetingId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, status: "cancelled" },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("POST meetings route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
