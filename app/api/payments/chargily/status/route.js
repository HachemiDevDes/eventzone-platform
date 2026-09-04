import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import { getChargilyCheckout } from "@/lib/chargily";
import QRCode from "qrcode";

const supabase = getServiceSupabase();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id") || searchParams.get("id");
    const checkoutId = searchParams.get("checkout_id");

    if (!paymentId && !checkoutId) {
      return NextResponse.json(
        { success: false, error: "Payment ID or Checkout ID is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Find payment in DB
    let query = supabase.from("payments").select("*, events(name, location, start_date, end_date), tickets(name, price)");
    if (paymentId) {
      query = query.eq("id", paymentId);
    } else {
      query = query.eq("chargily_checkout_id", checkoutId);
    }

    const { data: payment, error: payErr } = await query.maybeSingle();

    if (payErr || !payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 2. If status is still 'pending' and we have a chargily checkout ID, check upstream status as fallback
    let currentStatus = payment.status;
    let participantData = null;

    if (currentStatus === "pending" && payment.chargily_checkout_id) {
      try {
        const upstream = await getChargilyCheckout(payment.chargily_checkout_id);
        if (upstream && upstream.status === "paid") {
          currentStatus = "paid";

          // Generate participant record if not yet created
          const participantId = payment.participant_id || crypto.randomUUID();
          const badgeCode = `EZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const nameParts = (payment.customer_name || "Attendee").split(" ");

          const eventName = payment.events?.name || "Event";
          const qrPayload = JSON.stringify({
            passId: participantId,
            badgeCode: badgeCode,
            eventId: payment.event_id,
            eventTitle: eventName,
            attendeeName: payment.customer_name,
            ticketType: payment.ticket_tier,
            paid: true,
            amount: payment.amount,
            currency: "DZD",
          });

          const qrUrl = await QRCode.toDataURL(qrPayload, {
            width: 320,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" },
          });

          await supabase.from("participants").upsert(
            {
              id: participantId,
              event_id: payment.event_id,
              first_name: nameParts[0] || "Attendee",
              last_name: nameParts.slice(1).join(" ") || "",
              email: payment.customer_email,
              phone: payment.customer_phone,
              ticket_type: payment.ticket_tier,
              status_participation: "registered",
              badge_code: badgeCode,
              qr_code: qrUrl,
              registered_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

          await supabase
            .from("payments")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              participant_id: participantId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          participantData = {
            id: participantId,
            name: payment.customer_name,
            email: payment.customer_email,
            ticketType: payment.ticket_tier,
            badgeCode: badgeCode,
            qrCode: qrUrl,
          };
        } else if (upstream && (upstream.status === "failed" || upstream.status === "canceled" || upstream.status === "expired")) {
          currentStatus = upstream.status;
          await supabase.from("payments").update({ status: currentStatus }).eq("id", payment.id);
        }
      } catch (checkErr) {
        console.warn("Direct Chargily checkout verification notice:", checkErr.message);
      }
    }

    // 3. If participant exists, fetch participant details
    if (!participantData && payment.participant_id) {
      const { data: part } = await supabase
        .from("participants")
        .select("id, first_name, last_name, email, phone, ticket_type, badge_code, qr_code, status_participation")
        .eq("id", payment.participant_id)
        .maybeSingle();

      if (part) {
        participantData = {
          id: part.id,
          name: `${part.first_name || ""} ${part.last_name || ""}`.trim() || payment.customer_name,
          email: part.email || payment.customer_email,
          ticketType: part.ticket_type || payment.ticket_tier,
          badgeCode: part.badge_code,
          qrCode: part.qr_code,
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment.id,
          status: currentStatus,
          amount: payment.amount,
          currency: payment.currency || "DZD",
          customerName: payment.customer_name,
          customerEmail: payment.customer_email,
          ticketTier: payment.ticket_tier,
          quantity: payment.quantity || 1,
          createdAt: payment.created_at,
          paidAt: payment.paid_at,
          event: payment.events,
        },
        participant: participantData,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/payments/chargily/status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payment status" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
