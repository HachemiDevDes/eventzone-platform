import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import { generateBadgePdfBuffer } from "@/lib/badgePdfServer";

const supabase = getServiceSupabase();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id") || searchParams.get("id");
    const checkoutId = searchParams.get("checkout_id");
    const participantId = searchParams.get("participant_id");
    const eventIdParam = searchParams.get("event_id");

    let eventId = eventIdParam || "";
    let attendeeName = searchParams.get("name") || "Attendee";
    let attendeeEmail = searchParams.get("email") || "";
    let attendeeCompany = searchParams.get("company") || "";
    let attendeeJobTitle = searchParams.get("job_title") || "";
    let ticketTier = searchParams.get("ticket_tier") || "Standard Admission";
    let badgeCode = searchParams.get("badge_code") || "EZ-PASS";
    let qrDataUrl = "";
    let eventTitle = "Eventzone Conference & Summit";
    let eventDate = "";
    let eventLocation = "";

    // 1. Resolve from Payment record if provided
    let payment = null;
    if (paymentId || checkoutId) {
      let query = supabase.from("payments").select("*");
      if (paymentId) {
        query = query.eq("id", paymentId);
      } else {
        query = query.eq("chargily_checkout_id", checkoutId);
      }
      const { data: payData } = await query.maybeSingle();
      payment = payData;

      if (payment) {
        eventId = payment.event_id || eventId;
        attendeeName = payment.customer_name || attendeeName;
        attendeeEmail = payment.customer_email || attendeeEmail;
        ticketTier = payment.ticket_tier || ticketTier;
      }
    }

    // 2. Resolve Event details
    if (eventId) {
      const { data: ev } = await supabase
        .from("events")
        .select("id, name, location, start_date")
        .eq("id", eventId)
        .maybeSingle();

      if (ev) {
        eventTitle = ev.name || eventTitle;
        eventLocation = ev.location || eventLocation;
        eventDate = ev.start_date
          ? new Date(ev.start_date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : eventDate;
      }
    }

    // 3. Resolve Participant record
    const targetPartId = participantId || payment?.participant_id;
    if (targetPartId) {
      const { data: part } = await supabase
        .from("participants")
        .select("*")
        .eq("id", targetPartId)
        .maybeSingle();

      if (part) {
        attendeeName = `${part.first_name || ""} ${part.last_name || ""}`.trim() || attendeeName;
        attendeeEmail = part.email || attendeeEmail;
        attendeeCompany = part.company || attendeeCompany;
        attendeeJobTitle = part.job_title || attendeeJobTitle;
        ticketTier = part.ticket_type || ticketTier;
        badgeCode = part.badge_code || badgeCode;
        qrDataUrl = part.qr_code || qrDataUrl;
      }
    } else if (attendeeEmail && eventId) {
      const { data: part } = await supabase
        .from("participants")
        .select("*")
        .eq("event_id", eventId)
        .eq("email", attendeeEmail)
        .maybeSingle();

      if (part) {
        attendeeName = `${part.first_name || ""} ${part.last_name || ""}`.trim() || attendeeName;
        attendeeCompany = part.company || attendeeCompany;
        attendeeJobTitle = part.job_title || attendeeJobTitle;
        ticketTier = part.ticket_type || ticketTier;
        badgeCode = part.badge_code || badgeCode;
        qrDataUrl = part.qr_code || qrDataUrl;
      }
    }

    // 4. Resolve ticket badge template and settings
    let resolvedTemplateUrl = "";
    let resolvedBadgeSettings = {};

    if (eventId) {
      try {
        if (ticketTier) {
          const { data: ticketRow } = await supabase
            .from("tickets")
            .select("badge_url, badge_settings")
            .eq("event_id", eventId)
            .ilike("name", ticketTier.trim())
            .maybeSingle();

          if (ticketRow?.badge_url) {
            resolvedTemplateUrl = ticketRow.badge_url;
            resolvedBadgeSettings = ticketRow.badge_settings || {};
          }
        }

        if (!resolvedTemplateUrl) {
          const { data: anyTicket } = await supabase
            .from("tickets")
            .select("badge_url, badge_settings")
            .eq("event_id", eventId)
            .not("badge_url", "is", null)
            .limit(1)
            .maybeSingle();

          if (anyTicket?.badge_url) {
            resolvedTemplateUrl = anyTicket.badge_url;
            resolvedBadgeSettings = anyTicket.badge_settings || {};
          }
        }
      } catch (dbErr) {
        console.warn("Could not query badge template for PDF download:", dbErr);
      }
    }

    // 4. Generate Official Event Badge PDF buffer
    const pdfBuffer = await generateBadgePdfBuffer({
      templateUrl: resolvedTemplateUrl || "",
      attendeeName: attendeeName || "Attendee",
      attendeeEmail: attendeeEmail || "",
      attendeeCompany: attendeeCompany || "",
      attendeeJobTitle: attendeeJobTitle || "",
      ticketTier: ticketTier || "Standard Admission",
      badgeCode: badgeCode || "EZ-PASS",
      eventId: eventId || "",
      eventTitle: eventTitle || "Eventzone Conference & Summit",
      eventDate: eventDate || "",
      eventLocation: eventLocation || "",
      qrDataUrl: qrDataUrl || "",
      showFoldGuide: resolvedBadgeSettings.showFoldGuide !== false,
      showPhoto: resolvedBadgeSettings.showPhoto !== false,
      showQr: resolvedBadgeSettings.showQr !== false,
      cardTheme: resolvedBadgeSettings.cardTheme || "glass",
      badgeSettings: resolvedBadgeSettings,
    });

    const safeFilename = attendeeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 40) || "official";

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}_Event_Badge.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GET /api/tickets/badge-pdf error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate badge PDF" },
      { status: 500 }
    );
  }
}
