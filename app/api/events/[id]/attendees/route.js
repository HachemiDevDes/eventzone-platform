import { NextResponse } from "next/server";
import { getServiceSupabase, verifyApiKeyOrOrganizer } from "@/lib/apiAuth";

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // MANDATORY AUTHENTICATION: Must have valid API Key or Organizer Session
    const authResult = await verifyApiKeyOrOrganizer(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized: Valid API Key or Organizer session required." },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const supabase = getServiceSupabase();
    const { data: attendees, error } = await supabase
      .from("participants")
      .select("id, first_name, last_name, email, phone, ticket_type, status_participation, registered_at, checked_in_at, checked_in")
      .eq("event_id", eventId)
      .neq("status_participation", "archived")
      .order("registered_at", { ascending: false });

    if (error) throw error;

    const formatted = (attendees || []).map((a) => ({
      id: a.id,
      name: `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Attendee",
      email: a.email,
      phone: a.phone,
      ticketType: a.ticket_type,
      status: a.status_participation,
      registeredAt: a.registered_at,
      checkedInAt: a.checked_in_at,
      checkedIn: Boolean(a.checked_in || a.checked_in_at),
    }));

    return NextResponse.json(
      {
        success: true,
        count: formatted.length,
        attendees: formatted,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/events/[id]/attendees error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch attendees." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
