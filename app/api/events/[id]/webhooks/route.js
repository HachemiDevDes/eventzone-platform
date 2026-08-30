import { NextResponse } from "next/server";
import { 
  getServiceSupabase, 
  verifyOrganizerSession, 
  isSafeWebhookUrl, 
  generateSecureApiKey 
} from "@/lib/apiAuth";

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS",
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
      return NextResponse.json({ success: true, webhooks: [] }, { status: 200, headers: CORS_HEADERS });
    }

    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("developer_webhooks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, webhooks: data || [] },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/events/[id]/webhooks error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch webhooks." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (!body.url || !isSafeWebhookUrl(body.url)) {
      return NextResponse.json(
        { success: false, error: "A valid, public HTTPS/HTTP webhook URL is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const secret = body.secret || generateSecureApiKey("whsec_");
    const row = {
      event_id: eventId,
      url: body.url,
      secret,
      events: body.events || ["registration.created", "registration.pending"],
      is_active: body.isActive !== false,
      created_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { data: createdRecord, error } = await supabase
      .from("developer_webhooks")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        webhook: createdRecord,
        message: "Webhook registered successfully",
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("POST /api/events/[id]/webhooks error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register webhook." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// Test Webhook Ping
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const webhookUrl = body.url;

    if (!webhookUrl || !isSafeWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook URL: Must be a safe, public URL." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      eventId: eventId,
      message: "Eventzone webhook test ping delivered successfully.",
      sampleAttendee: {
        id: "test-att-123",
        name: "Developer Test Attendee",
        email: "developer@test.com",
        ticketType: "VIP Executive Pass",
        badgeCode: "EZ-TEST01",
        status: "registered",
      },
    };

    const startTime = Date.now();
    let responseStatus = 0;
    let responseText = "";

    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Eventzone-Event": "webhook.test",
          "X-Eventzone-Secret": body.secret || "",
          "User-Agent": "Eventzone-Webhooks/1.0",
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(6000), // 6 second max timeout
      });
      responseStatus = resp.status;
      responseText = await resp.text().catch(() => "");
    } catch (fetchErr) {
      responseStatus = 500;
      responseText = fetchErr.message;
    }

    const elapsed = Date.now() - startTime;

    return NextResponse.json(
      {
        success: responseStatus >= 200 && responseStatus < 300,
        statusCode: responseStatus,
        durationMs: elapsed,
        responseExcerpt: responseText.slice(0, 300),
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("PUT /api/events/[id]/webhooks test error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to test webhook." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId");

    if (!eventId || !webhookId || !isValidUuid(webhookId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID and Webhook ID are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("developer_webhooks")
      .delete()
      .eq("id", webhookId)
      .eq("event_id", eventId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "Webhook deleted successfully." },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("DELETE /api/events/[id]/webhooks error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete webhook." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
