import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import { createChargilyCheckout } from "@/lib/chargily";

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

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const eventId = body.eventId || body.event_id;
    const ticketId = body.ticketId || body.ticket_id;
    const rawName = (body.name || body.fullName || `${body.firstName || ""} ${body.lastName || ""}` || "").trim();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const rawPhone = (body.phone || body.phoneNumber || "").trim();
    const company = (body.company || body.organization || "").trim();
    const jobTitle = (body.jobTitle || body.job_title || body.position || "").trim();
    const quantity = Math.max(1, parseInt(body.quantity || 1, 10));
    const referralCode = (body.referralCode || body.referral_code || "").trim().toUpperCase();
    const promoCode = (body.promoCode || body.promo_code || "").trim().toUpperCase();
    const customAnswers = body.answers || body.customAnswers || {};
    const returnPath = body.returnPath || ""; // Custom return path if any

    // Basic Validation
    if (!rawEmail || !rawName) {
      return NextResponse.json(
        { success: false, error: "Full Name and Email are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Fetch Event
    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("id, name, location, slug")
      .eq("id", eventId)
      .maybeSingle();

    if (eventErr || !eventRow) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 2. Fetch Ticket Tier & Availability
    let matchedTicket = null;
    if (ticketId && isValidUuid(ticketId)) {
      const { data: tRow } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .eq("event_id", eventId)
        .maybeSingle();
      matchedTicket = tRow;
    } else if (body.ticketType || body.ticket_type) {
      const tierName = (body.ticketType || body.ticket_type).trim().toLowerCase();
      const { data: tRows } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventId)
        .neq("status", "archived");
      if (tRows) {
        matchedTicket = tRows.find((t) => t.name?.toLowerCase() === tierName) || tRows[0];
      }
    }

    if (!matchedTicket) {
      return NextResponse.json(
        { success: false, error: "Selected ticket tier was not found." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const totalQty = matchedTicket.total_quantity || matchedTicket.quantity_available || 100;
    const soldQty = matchedTicket.sold_quantity || 0;
    if (totalQty > 0 && soldQty + quantity > totalQty) {
      return NextResponse.json(
        {
          success: false,
          error: `Sorry, only ${Math.max(0, totalQty - soldQty)} ticket(s) remaining for '${matchedTicket.name}'.`,
          code: "TICKET_SOLD_OUT",
        },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    const unitPrice = typeof matchedTicket.price === "number"
      ? matchedTicket.price
      : parseFloat(String(matchedTicket.price).replace(/[^0-9.]/g, "")) || 0;

    let totalAmount = unitPrice * quantity;
    let appliedDiscount = 0;
    let verifiedPromo = null;

    // 3. Apply Promo Code Discount if provided
    const targetPromo = promoCode || referralCode;
    if (targetPromo) {
      try {
        const { data: promoData } = await supabase
          .from("promo_codes")
          .select("code, discount_percentage, is_active")
          .eq("code", targetPromo)
          .eq("is_active", true)
          .maybeSingle();

        if (promoData && promoData.discount_percentage > 0) {
          verifiedPromo = promoData.code;
          appliedDiscount = Math.round(totalAmount * (promoData.discount_percentage / 100));
          totalAmount = Math.max(0, totalAmount - appliedDiscount);
        }
      } catch (err) {
        console.warn("Promo verification notice:", err);
      }
    }

    // Chargily Pay enforces a minimum amount of 100 DZD
    if (totalAmount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Online payments require a minimum amount of 100 DZD. For free tickets, please use the direct registration flow.",
          code: "AMOUNT_BELOW_MINIMUM",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 4. Determine App Origin & Callback URLs
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (request.headers.get("x-forwarded-proto") && request.headers.get("host")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
        : "https://eventzone.pro");

    const paymentId = crypto.randomUUID();

    const successUrl = `${origin}/payment/success?payment_id=${paymentId}&event_id=${eventId}`;
    const failureUrl = `${origin}/payment/failure?payment_id=${paymentId}&event_id=${eventId}`;
    const webhookEndpoint = `${origin}/api/payments/chargily/webhook`;

    // 5. Insert Pending Payment Record in Supabase
    const { error: payInsertErr } = await supabase.from("payments").insert({
      id: paymentId,
      event_id: eventId,
      ticket_id: matchedTicket.id,
      amount: totalAmount,
      currency: "dzd",
      status: "pending",
      customer_name: rawName,
      customer_email: rawEmail,
      customer_phone: rawPhone,
      ticket_tier: matchedTicket.name,
      quantity: quantity,
      discount_applied: appliedDiscount,
      referral_code: verifiedPromo || referralCode || null,
      custom_answers: {
        ...customAnswers,
        ...(company ? { company } : {}),
        ...(jobTitle ? { jobTitle } : {}),
        ...(returnPath ? { _return_path: returnPath } : {}),
      },
      metadata: {
        eventId,
        ticketId: matchedTicket.id,
        eventName: eventRow.name,
        company,
        jobTitle,
      },
    });

    if (payInsertErr) {
      console.error("Payment row insert error:", payInsertErr);
      return NextResponse.json(
        { success: false, error: "Failed to initialize payment record. Please try again." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // 6. Create Chargily Checkout Session
    let chargilyData;
    try {
      chargilyData = await createChargilyCheckout({
        amount: totalAmount,
        currency: "dzd",
        success_url: successUrl,
        failure_url: failureUrl,
        webhook_endpoint: webhookEndpoint,
        description: `Pass: ${matchedTicket.name} - ${eventRow.name} (Qty: ${quantity})`,
        metadata: [
          { payment_id: paymentId },
          { event_id: eventId },
          { ticket_id: matchedTicket.id },
          { customer_email: rawEmail },
          { customer_name: rawName },
          { quantity: String(quantity) },
          ...(verifiedPromo ? [{ promo_code: verifiedPromo }] : []),
        ],
        locale: ["ar", "fr", "en"].includes(body.lang || body.locale) ? (body.lang || body.locale) : "fr",
      });
    } catch (chargilyErr) {
      console.error("Chargily API checkout error:", chargilyErr);
      // Update payment record to failed
      await supabase
        .from("payments")
        .update({ status: "failed", metadata: { error: chargilyErr.message } })
        .eq("id", paymentId);

      return NextResponse.json(
        {
          success: false,
          error: `Payment gateway error: ${chargilyErr.message}`,
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    // 7. Store the Chargily Checkout ID in payments table
    if (chargilyData?.id) {
      await supabase
        .from("payments")
        .update({
          chargily_checkout_id: chargilyData.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);
    }

    return NextResponse.json(
      {
        success: true,
        checkoutId: chargilyData.id,
        checkoutUrl: chargilyData.checkout_url,
        paymentId: paymentId,
        amount: totalAmount,
        currency: "DZD",
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("POST /api/payments/chargily/create-checkout error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
