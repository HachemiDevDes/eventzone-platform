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

    const { data, error } = await supabase
      .from("developer_api_keys")
      .select("id, event_id, name, key_prefix, permissions, created_at, last_used_at, is_active")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { success: true, apiKeys: data || [] },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/events/[id]/api-keys error:", err);
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
    const name = (body.name || "Main Website Integration").trim();
    const permissions = body.permissions || "read_write";

    const secretRandom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const fullKey = `ez_live_${secretRandom}`;
    const keyPrefix = fullKey.substring(0, 12) + "..." + fullKey.substring(fullKey.length - 4);

    const row = {
      event_id: isValidUuid(eventId) ? eventId : null,
      name,
      key: fullKey,
      key_prefix: keyPrefix,
      permissions,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    let createdRecord = { ...row, id: `key-${Date.now()}` };

    if (isValidUuid(eventId)) {
      const { data, error } = await supabase
        .from("developer_api_keys")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      if (data) createdRecord = data;
    }

    return NextResponse.json(
      {
        success: true,
        apiKey: createdRecord,
        rawKey: fullKey, // returned once upon creation
        message: "API key created successfully. Store this key safely as it will not be shown again in full.",
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("POST /api/events/[id]/api-keys error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
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

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: "Key ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (isValidUuid(keyId)) {
      const { error } = await supabase
        .from("developer_api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;
    }

    return NextResponse.json(
      { success: true, message: "API key revoked successfully" },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("DELETE /api/events/[id]/api-keys error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
