import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";

const supabase = getServiceSupabase();

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    // 1. Fetch Event Basic Details
    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("id, name, description, location, wilaya, city, start_date, end_date, cover_url, logo_url, status, type")
      .eq("id", eventId)
      .maybeSingle();

    if (eventErr || !eventRow) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const eventInfo = {
      id: eventRow.id,
      title: eventRow.name || "Untitled Event",
      description: eventRow.description || "",
      location: eventRow.location || `${eventRow.city || ""}, ${eventRow.wilaya || ""}`.trim(),
      startDate: eventRow.start_date || "",
      endDate: eventRow.end_date || "",
      coverUrl: eventRow.cover_url || "",
      logoUrl: eventRow.logo_url || "",
      status: eventRow.status || "published",
      type: eventRow.type || "Hybrid",
      currency: "DZD",
    };

    // 2. Fetch Tickets
    let tickets = [];
    if (isValidUuid(eventId)) {
      const { data: ticketRows, error: ticketErr } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventId)
        .neq("status", "archived")
        .order("created_at", { ascending: true });

      if (!ticketErr && ticketRows) {
        tickets = ticketRows.map((row) => {
          const priceNum = typeof row.price === "number" ? row.price : parseFloat(String(row.price).replace(/[^0-9.]/g, "")) || 0;
          const totalQty = row.total_quantity || row.quantity_available || 100;
          const soldQty = row.sold_quantity || 0;
          const availableQty = Math.max(0, totalQty - soldQty);

          return {
            id: row.id,
            name: row.name || "General Admission",
            tier: row.name || "General Admission",
            price: priceNum,
            currency: "DZD",
            description: row.description || "",
            features: Array.isArray(row.features) ? row.features : [],
            totalQuantity: totalQty,
            soldQuantity: soldQty,
            availableQuantity: availableQty,
            isSoldOut: availableQty <= 0,
            requiresApproval: Boolean(row.requires_approval),
            isPopular: Boolean(row.is_popular),
            color: row.color || "indigo",
            formId: row.form_id || null,
            isActive: row.is_active !== false,
          };
        });
      }
    }

    // 3. Fetch linked forms / custom questions if any
    let forms = [];
    if (isValidUuid(eventId)) {
      const { data: formRows } = await supabase
        .from("forms")
        .select("id, title, description, ticket_id, fields, settings")
        .eq("event_id", eventId)
        .neq("status", "archived");

      if (formRows) {
        forms = formRows.map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          ticketId: f.ticket_id,
          fields: Array.isArray(f.fields) ? f.fields : [],
          settings: f.settings || {},
        }));
      }
    }

    return NextResponse.json(
      {
        success: true,
        event: eventInfo,
        tickets: tickets.filter((t) => t.isActive),
        forms,
        endpoints: {
          register: `/api/events/${eventId}/tickets/register`,
          embedUrl: `/embed/tickets?eventId=${eventId}`,
        },
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("GET /api/events/[id]/tickets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch event tickets" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
