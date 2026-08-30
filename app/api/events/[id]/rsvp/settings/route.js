import { NextResponse } from "next/server";
import { getServiceSupabase, verifyOrganizerSession } from "@/lib/apiAuth";

function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// ─────────────────────────────────────────────
// GET /api/events/[id]/rsvp/settings
// ─────────────────────────────────────────────
export async function GET(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    let settings = {
      is_enabled: true,
      capacity_limit: 150,
      allow_plus_ones: true,
      max_plus_ones: 2,
      allow_waitlist: true,
      deadline: null,
      collect_dietary: true,
      collect_company: true,
      collect_phone: true,
      confirmation_message: "Thank you for your RSVP! We look forward to seeing you at the event."
    };

    const supabase = getServiceSupabase();
    if (isValidUuid(eventId)) {
      const { data, error } = await supabase
        .from('rsvp_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (!error && data) {
        settings = { ...settings, ...data };
      }
    }

    return NextResponse.json({ success: true, eventId, settings });
  } catch (err) {
    console.error("GET /api/events/[id]/rsvp/settings error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT / POST /api/events/[id]/rsvp/settings
// ─────────────────────────────────────────────
export async function PUT(request, context) {
  return handleSaveSettings(request, context);
}

export async function POST(request, context) {
  return handleSaveSettings(request, context);
}

async function handleSaveSettings(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json({ success: false, error: "Valid Event ID is required" }, { status: 400 });
    }

    // MANDATORY AUTHENTICATION: Only organizer can modify RSVP settings
    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }

    const body = await request.json();
    const {
      isEnabled = true,
      capacityLimit = 150,
      allowPlusOnes = true,
      maxPlusOnes = 2,
      allowWaitlist = true,
      deadline = null,
      collectDietary = true,
      collectCompany = true,
      collectPhone = true,
      confirmationMessage = "Thank you for your RSVP! We look forward to seeing you at the event."
    } = body;

    const row = {
      event_id: eventId,
      is_enabled: !!isEnabled,
      capacity_limit: Math.max(1, parseInt(capacityLimit || 150, 10)),
      allow_plus_ones: !!allowPlusOnes,
      max_plus_ones: Math.max(0, parseInt(maxPlusOnes || 2, 10)),
      allow_waitlist: !!allowWaitlist,
      deadline: deadline || null,
      collect_dietary: !!collectDietary,
      collect_company: !!collectCompany,
      collect_phone: !!collectPhone,
      confirmation_message: confirmationMessage,
      updated_at: new Date().toISOString()
    };

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('rsvp_settings')
      .upsert(row, { onConflict: 'event_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, settings: data });
  } catch (err) {
    console.error("Save /api/events/[id]/rsvp/settings error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
