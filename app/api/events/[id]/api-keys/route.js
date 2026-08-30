import { NextResponse } from "next/server";
import { 
  getServiceSupabase, 
  verifyOrganizerSession, 
  generateSecureApiKey, 
  hashApiKey 
} from "@/lib/apiAuth";

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
      return NextResponse.json({ success: true, apiKeys: [] }, { status: 200, headers: CORS_HEADERS });
    }

    // Must be authenticated organizer
    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("developer_api_keys")
      .select("id, event_id, name, key_prefix, permissions, created_at, last_used_at, is_active")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, apiKeys: data || [] },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/events/[id]/api-keys error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch API keys." },
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

    // Must be authenticated organizer
    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = (body.name || "Main Website Integration").trim();
    const permissions = body.permissions || "read_write";

    // Generate cryptographically secure API key
    const fullKey = generateSecureApiKey("ez_live_");
    const keyHash = hashApiKey(fullKey);
    const keyPrefix = fullKey.substring(0, 12) + "..." + fullKey.substring(fullKey.length - 4);

    const supabase = getServiceSupabase();
    const row = {
      event_id: eventId,
      name,
      key: fullKey,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { data: createdRecord, error } = await supabase
      .from("developer_api_keys")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        apiKey: createdRecord,
        rawKey: fullKey, // Returned once upon creation
        message: "API key created successfully. Store this key safely as it will not be shown again in full.",
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("POST /api/events/[id]/api-keys error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create API key." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("keyId");

    if (!eventId || !keyId || !isValidUuid(keyId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID and Key ID are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Must be authenticated organizer
    const authResult = await verifyOrganizerSession(request, eventId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401, headers: CORS_HEADERS }
      );
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("developer_api_keys")
      .delete()
      .eq("id", keyId)
      .eq("event_id", eventId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "API key revoked successfully" },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("DELETE /api/events/[id]/api-keys error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to revoke API key." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
