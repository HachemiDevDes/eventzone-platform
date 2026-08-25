import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://awkreadldqmidcrrqukm.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_MluMrwkWs5-YedITa6ggNw_imK2nv8z";
const supabase = createClient(supabaseUrl, supabaseKey);

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

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Check optional API Key in header
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (apiKey && isValidUuid(eventId)) {
      // Validate key
      const { data: keyMatch } = await supabase
        .from("developer_api_keys")
        .select("id, is_active")
        .eq("key", apiKey)
        .eq("event_id", eventId)
        .maybeSingle();

      if (!keyMatch || keyMatch.is_active === false) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive API Key for this event." },
          { status: 401, headers: CORS_HEADERS }
        );
      }

      // Update last_used_at
      await supabase.from("developer_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyMatch.id);
    }

    if (!isValidUuid(eventId)) {
      return NextResponse.json(
        { success: true, count: 0, attendees: [] },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const { data: attendees, error } = await supabase
      .from("participants")
      .select("id, first_name, last_name, email, phone, ticket_type, status_participation, registered_at, checked_in_at")
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
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
