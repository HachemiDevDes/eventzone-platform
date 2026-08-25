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
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (!body.url) {
      return NextResponse.json(
        { success: false, error: "Webhook endpoint URL is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const secret = body.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`;
    const row = {
      event_id: isValidUuid(eventId) ? eventId : null,
      url: body.url,
      secret,
      events: body.events || ["registration.created", "registration.pending"],
      is_active: body.isActive !== false,
      created_at: new Date().toISOString(),
    };

    let createdRecord = { ...row, id: `wh-${Date.now()}` };

    if (isValidUuid(eventId)) {
      const { data, error } = await supabase
        .from("developer_webhooks")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      if (data) createdRecord = data;
    }

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
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// Test Webhook Ping
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;
    const body = await request.json().catch(() => ({}));
    const webhookUrl = body.url;

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: "Webhook URL is required" },
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
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Eventzone-Event": "webhook.test",
          "X-Eventzone-Delivery": `del-${Date.now()}`,
          "User-Agent": "Eventzone-Webhook-Dispatcher/1.0",
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000),
      });
      responseStatus = res.status;
      responseText = (await res.text()).substring(0, 300);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to reach webhook URL: ${e.message}`,
          durationMs: Date.now() - startTime,
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const durationMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: responseStatus >= 200 && responseStatus < 300,
        statusCode: responseStatus,
        durationMs,
        responseBodySnippet: responseText,
        message:
          responseStatus >= 200 && responseStatus < 300
            ? "Test ping delivered successfully!"
            : `Remote endpoint returned HTTP status ${responseStatus}`,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("PUT /api/events/[id]/webhooks error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: "Webhook ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (isValidUuid(webhookId)) {
      const { error } = await supabase
        .from("developer_webhooks")
        .delete()
        .eq("id", webhookId);

      if (error) throw error;
    }

    return NextResponse.json(
      { success: true, message: "Webhook removed successfully" },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("DELETE /api/events/[id]/webhooks error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
