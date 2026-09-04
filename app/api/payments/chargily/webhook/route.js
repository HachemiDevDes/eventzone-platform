import { NextResponse } from "next/server";
import { getServiceSupabase, isSafeWebhookUrl } from "@/lib/apiAuth";
import { verifyChargilySignature, getChargilySecretKey } from "@/lib/chargily";
import QRCode from "qrcode";

const supabase = getServiceSupabase();

export async function POST(request) {
  try {
    const rawPayload = await request.text();
    const signature = request.headers.get("signature") || request.headers.get("x-signature");

    const secretKey = getChargilySecretKey();

    // 1. HMAC Signature Verification (if secret key configured)
    if (secretKey && signature) {
      const isValid = verifyChargilySignature(rawPayload, signature);
      if (!isValid) {
        console.error("CHARGILY WEBHOOK: Signature verification failed!");
        return NextResponse.json(
          { success: false, error: "Invalid HMAC signature" },
          { status: 403 }
        );
      }
    } else if (secretKey && !signature) {
      console.warn("CHARGILY WEBHOOK: No signature header received while secret key is set.");
    }

    let event;
    try {
      event = JSON.parse(rawPayload);
    } catch (err) {
      console.error("CHARGILY WEBHOOK: Invalid JSON body:", err);
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = event.type;
    const checkout = event.data;

    console.log(`CHARGILY WEBHOOK: Received event '${eventType}' for checkout ID:`, checkout?.id);

    if (!checkout || !checkout.id) {
      return NextResponse.json({ received: true, note: "No checkout data found" });
    }

    // Extract metadata from array or object format
    let paymentId = null;
    let eventId = null;
    let ticketId = null;
    let promoCode = null;
    let userId = null;
    let planMonths = null;

    if (Array.isArray(checkout.metadata)) {
      for (const item of checkout.metadata) {
        if (item.payment_id) paymentId = item.payment_id;
        if (item.event_id) eventId = item.event_id;
        if (item.ticket_id) ticketId = item.ticket_id;
        if (item.promo_code) promoCode = item.promo_code;
        if (item.user_id) userId = item.user_id;
        if (item.plan_months) planMonths = parseInt(item.plan_months, 10);
      }
    } else if (checkout.metadata && typeof checkout.metadata === "object") {
      paymentId = checkout.metadata.payment_id;
      eventId = checkout.metadata.event_id;
      ticketId = checkout.metadata.ticket_id;
      promoCode = checkout.metadata.promo_code;
      userId = checkout.metadata.user_id;
      if (checkout.metadata.plan_months) planMonths = parseInt(checkout.metadata.plan_months, 10);
    }

    // 2. Fetch Payment Record from DB
    let paymentQuery = supabase.from("payments").select("*");
    if (paymentId) {
      paymentQuery = paymentQuery.eq("id", paymentId);
    } else {
      paymentQuery = paymentQuery.eq("chargily_checkout_id", checkout.id);
    }
    const { data: paymentRow, error: paymentErr } = await paymentQuery.maybeSingle();

    if (paymentErr) {
      console.error("CHARGILY WEBHOOK: Error finding payment row:", paymentErr);
    }

    // 3. Handle checkout.paid
    if (eventType === "checkout.paid") {
      // Idempotency check: if already marked paid, return success immediately
      if (paymentRow && paymentRow.status === "paid" && paymentRow.participant_id) {
        console.log(`CHARGILY WEBHOOK: Payment ${paymentRow.id} was already processed.`);
        return NextResponse.json({ received: true, already_processed: true });
      }

      const resolvedEventId = eventId || paymentRow?.event_id;
      const resolvedTicketId = ticketId || paymentRow?.ticket_id;
      const customerName = checkout.customer?.name || paymentRow?.customer_name || "Attendee";
      const customerEmail = (checkout.customer?.email || paymentRow?.customer_email || "").trim().toLowerCase();
      const customerPhone = checkout.customer?.phone || paymentRow?.customer_phone || "";
      const ticketTier = paymentRow?.ticket_tier || "Standard Admission";
      const quantity = paymentRow?.quantity || 1;
      const customAnswers = paymentRow?.custom_answers || {};
      const referralCode = paymentRow?.referral_code || promoCode || "";

      // 3a. Generate Badge Code & QR Code
      const participantId = paymentRow?.participant_id || crypto.randomUUID();
      const badgeCode = `EZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Fetch Event details for QR code
      let eventTitle = "Eventzone Event";
      let eventLocation = "";
      let eventDate = "";
      if (resolvedEventId) {
        const { data: ev } = await supabase
          .from("events")
          .select("name, location, start_date, end_date")
          .eq("id", resolvedEventId)
          .maybeSingle();
        if (ev) {
          eventTitle = ev.name || eventTitle;
          eventLocation = ev.location || "";
          eventDate = ev.start_date || "";
        }
      }

      const qrPayload = JSON.stringify({
        passId: participantId,
        badgeCode: badgeCode,
        eventId: resolvedEventId,
        eventTitle: eventTitle,
        attendeeName: customerName,
        ticketType: ticketTier,
        paid: true,
        amount: checkout.amount,
        currency: "DZD",
        paidAt: new Date().toISOString(),
      });

      let qrDataUrl = "";
      try {
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 320,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
      } catch (qrErr) {
        console.warn("QR code generation error in webhook:", qrErr);
      }

      // 3b. Insert or Update Participant in database
      const nameParts = customerName.split(" ");
      const firstName = nameParts[0] || "Attendee";
      const lastName = nameParts.slice(1).join(" ") || "";

      const participantRow = {
        id: participantId,
        event_id: resolvedEventId,
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: customerPhone,
        ticket_type: ticketTier,
        status_participation: "registered",
        status_badge: "valid",
        badge_code: badgeCode,
        qr_code: qrDataUrl,
        referral_code: referralCode || null,
        discount_applied: paymentRow?.discount_applied || 0,
        registered_at: new Date().toISOString(),
      };

      const { error: partErr } = await supabase.from("participants").upsert(participantRow, { onConflict: "id" });
      if (partErr) {
        console.error("CHARGILY WEBHOOK: Error inserting participant:", partErr);
      }

      // 3c. Atomically increment ticket sold quantity
      if (resolvedTicketId) {
        try {
          await supabase.rpc("reserve_ticket", { p_ticket_id: resolvedTicketId, p_quantity: quantity });
        } catch (_) {
          // Fallback direct increment if RPC is missing
          const { data: currentTicket } = await supabase
            .from("tickets")
            .select("sold_quantity")
            .eq("id", resolvedTicketId)
            .maybeSingle();
          if (currentTicket) {
            await supabase
              .from("tickets")
              .update({ sold_quantity: (currentTicket.sold_quantity || 0) + quantity })
              .eq("id", resolvedTicketId);
          }
        }
      }

      // 3d. Record custom form submission if answers exist
      if (resolvedEventId && Object.keys(customAnswers).length > 0) {
        try {
          await supabase.from("form_submissions").upsert(
            {
              id: participantId,
              event_id: resolvedEventId,
              respondent_name: customerName,
              respondent_email: customerEmail,
              ticket_tier: ticketTier,
              answers: customAnswers,
              status: "registered",
              created_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch (subErr) {
          console.warn("Form submissions insert notice in webhook:", subErr);
        }
      }

      // 3e. Update payment record to 'paid'
      const paymentUpdatePayload = {
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: checkout.payment_method || "edahabia_cib",
        participant_id: participantId,
        chargily_checkout_id: checkout.id,
        updated_at: new Date().toISOString(),
      };

      if (paymentRow?.id) {
        await supabase.from("payments").update(paymentUpdatePayload).eq("id", paymentRow.id);
      } else {
        await supabase.from("payments").insert({
          ...paymentUpdatePayload,
          event_id: resolvedEventId,
          ticket_id: resolvedTicketId,
          amount: checkout.amount,
          currency: "dzd",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          ticket_tier: ticketTier,
          quantity: quantity,
        });
      }

      // 3f. Send confirmation email to attendee
      if (customerEmail) {
        try {
          const origin = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
          fetch(`${origin}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "ticket_confirmation",
              to: customerEmail,
              attendeeName: customerName,
              ticketTier: ticketTier,
              eventTitle: eventTitle,
              eventDate: eventDate,
              eventLocation: eventLocation,
              badgeCode: badgeCode,
              qrDataUrl: qrDataUrl,
              passId: participantId,
              eventId: resolvedEventId,
              amountPaid: checkout.amount,
              currency: "DZD",
            }),
          }).catch((mailErr) => console.warn("Webhook email send dispatch notice:", mailErr.message));
        } catch (emailErr) {
          console.warn("Webhook email trigger notice:", emailErr);
        }
      }

      // 3g. Trigger Developer Webhooks if configured
      if (resolvedEventId) {
        try {
          const { data: eventWebhooks } = await supabase
            .from("developer_webhooks")
            .select("*")
            .eq("event_id", resolvedEventId)
            .eq("is_active", true);

          if (eventWebhooks && eventWebhooks.length > 0) {
            const whPayload = {
              event: "payment.completed",
              timestamp: new Date().toISOString(),
              eventId: resolvedEventId,
              checkoutId: checkout.id,
              amount: checkout.amount,
              attendee: {
                id: participantId,
                name: customerName,
                email: customerEmail,
                ticketType: ticketTier,
                badgeCode: badgeCode,
              },
            };

            for (const wh of eventWebhooks) {
              if (isSafeWebhookUrl(wh.url)) {
                fetch(wh.url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Eventzone-Event": "payment.completed",
                    "X-Eventzone-Secret": wh.secret || "",
                    "User-Agent": "Eventzone-Webhooks/1.0",
                  },
                  body: JSON.stringify(whPayload),
                  signal: AbortSignal.timeout(5000),
                }).catch((e) => console.warn("Webhook dispatch error:", wh.url, e.message));
              }
            }
          }
        } catch (whErr) {
          console.warn("Developer webhooks trigger notice:", whErr);
        }
      }

      // 3h. Process Platform / Mobile Subscription if user_id and plan_months metadata present
      if (userId && planMonths) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_end_date")
            .eq("id", userId)
            .maybeSingle();

          let currentEndDate = new Date();
          if (profile?.subscription_end_date) {
            const existingEnd = new Date(profile.subscription_end_date);
            if (existingEnd > currentEndDate) currentEndDate = existingEnd;
          }

          const daysToAdd = planMonths * 30;
          currentEndDate.setDate(currentEndDate.getDate() + daysToAdd);

          await supabase
            .from("profiles")
            .update({ subscription_end_date: currentEndDate.toISOString() })
            .eq("id", userId);

          await supabase.from("transactions").insert({
            user_id: userId,
            type: "purchase",
            amount: planMonths,
            description: `Purchased ${planMonths} Month(s) Subscription via Chargily Pay`,
          });

          if (promoCode) {
            try {
              await supabase.rpc("increment_promo_code_usage", { p_code: promoCode });
            } catch (_) {}
          }

          console.log(`CHARGILY WEBHOOK: Successfully extended subscription for user ${userId} by ${planMonths} month(s).`);
        } catch (subErr) {
          console.error("CHARGILY WEBHOOK: Error processing subscription:", subErr);
        }
      }

      console.log(`CHARGILY WEBHOOK: Successfully processed payment for ${customerEmail} (Pass: ${ticketTier})`);
      return NextResponse.json({ success: true, processed: true });
    }

    // 4. Handle checkout.failed / checkout.canceled / checkout.expired
    if (eventType === "checkout.failed" || eventType === "checkout.canceled" || eventType === "checkout.expired") {
      const newStatus = eventType === "checkout.canceled" ? "canceled" : eventType === "checkout.expired" ? "expired" : "failed";
      if (paymentRow?.id) {
        await supabase
          .from("payments")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentRow.id);
      }
      console.log(`CHARGILY WEBHOOK: Updated checkout ${checkout.id} status to '${newStatus}'.`);
      return NextResponse.json({ success: true, status: newStatus });
    }

    return NextResponse.json({ received: true, eventType });
  } catch (err) {
    console.error("CHARGILY WEBHOOK FATAL ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
