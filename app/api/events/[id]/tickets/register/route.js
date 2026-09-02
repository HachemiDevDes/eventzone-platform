import { NextResponse } from "next/server";
import { getServiceSupabase, isSafeWebhookUrl } from "@/lib/apiAuth";
import QRCode from "qrcode";

const supabase = getServiceSupabase();

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function cleanPhoneNumber(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^0-9+]/g, "").trim();
}

function isMatchingEmail(emailA, emailB) {
  if (!emailA || !emailB) return false;
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase();
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

    // Extract fields
    const rawName = (body.name || body.fullName || `${body.first_name || ""} ${body.last_name || ""}` || "Attendee").trim();
    const rawEmail = (body.email || body.respondent_email || "").trim().toLowerCase();
    const rawPhone = cleanPhoneNumber(body.phone || body.phoneNumber || body.tel || "");
    const company = (body.company || body.organization || "").trim();
    const jobTitle = (body.jobTitle || body.job_title || body.position || body.role || "").trim();
    const ticketTypeName = (body.ticketType || body.ticket_type || body.tier || body.ticketName || "Standard Admission").trim();
    const ticketId = body.ticketId || body.ticket_id || null;
    const referralCode = (body.referralCode || body.referral_code || body.ref || body.promoCode || "").trim().toUpperCase();
    const answers = body.answers || body.customAnswers || body.formAnswers || {};
    const notes = body.notes || body.note || "";
    const source = body.source || "external_api"; // "api" | "embed_widget" | "external_api"

    if (!rawEmail) {
      return NextResponse.json(
        { success: false, error: "Email address is required for ticket registration." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!eventId || !isValidUuid(eventId)) {
      return NextResponse.json(
        { success: false, error: "Valid Event ID is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Fetch Event Info
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id, name, location, start_date, end_date")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !ev) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const eventName = ev.name || "Event";
    const eventLocation = ev.location || "";
    const eventStartDate = ev.start_date || "";
    const eventEndDate = ev.end_date || "";

    // 2. Fetch Ticket Tier settings & Quota check
    let matchedTicket = null;
    let requiresApproval = false;

    if (isValidUuid(eventId)) {
      let query = supabase.from("tickets").select("*").eq("event_id", eventId).neq("status", "archived");
      if (ticketId && isValidUuid(ticketId)) {
        query = query.eq("id", ticketId);
      }
      const { data: ticketRows } = await query;

      if (ticketRows && ticketRows.length > 0) {
        if (ticketId) {
          matchedTicket = ticketRows[0];
        } else {
          matchedTicket = ticketRows.find(
            (t) => t.name?.toLowerCase() === ticketTypeName.toLowerCase()
          ) || ticketRows[0];
        }
      }

      if (matchedTicket) {
        requiresApproval = Boolean(matchedTicket.requires_approval);
        const total = matchedTicket.total_quantity || matchedTicket.quantity_available || 100;
        const sold = matchedTicket.sold_quantity || 0;
        if (total > 0 && sold >= total) {
          return NextResponse.json(
            {
              success: false,
              error: `The ticket tier '${matchedTicket.name}' is sold out.`,
              code: "TICKET_SOLD_OUT",
            },
            { status: 409, headers: CORS_HEADERS }
          );
        }
      }
    }

    // Override approval flag if explicitly requested or specified on ticket tier
    if (body.requiresApproval !== undefined) {
      requiresApproval = Boolean(body.requiresApproval);
    }

    // 3. Duplicate check for Email & Phone in Participants & Pending
    if (isValidUuid(eventId)) {
      // 3a. Check registered participants
      try {
        const { data: existingParts } = await supabase
          .from("participants")
          .select("id, email, phone, status_participation")
          .eq("event_id", eventId)
          .neq("status_participation", "archived");

        if (existingParts && existingParts.length > 0) {
          for (const p of existingParts) {
            if (isMatchingEmail(p.email, rawEmail)) {
              return NextResponse.json(
                {
                  success: false,
                  error: "An attendee with this email address is already registered for this event.",
                  code: "DUPLICATE_REGISTRATION",
                  duplicateType: "registered",
                },
                { status: 409, headers: CORS_HEADERS }
              );
            }
          }
        }
      } catch (e) {
        console.warn("Duplicate check participants notice:", e);
      }

      // 3b. Check pending review queue
      try {
        const { data: existingPending } = await supabase
          .from("pending_registrations")
          .select("id, email, note")
          .eq("event_id", eventId);

        if (existingPending && existingPending.length > 0) {
          for (const pend of existingPending) {
            if (isMatchingEmail(pend.email, rawEmail)) {
              return NextResponse.json(
                {
                  success: false,
                  error: "A registration application with this email address is already pending organizer review.",
                  code: "DUPLICATE_REGISTRATION",
                  duplicateType: "pending",
                },
                { status: 409, headers: CORS_HEADERS }
              );
            }
          }
        }
      } catch (e) {
        console.warn("Duplicate check pending notice:", e);
      }
    }

    // 4. Create Unique ID & Badge Code
    const regId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `part-${Date.now()}`;
    const validId = isValidUuid(regId) ? regId : (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `reg-${Math.random().toString(36).substring(2, 9)}`);
    const badgeCode = `EZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const nameParts = rawName.split(" ");
    const firstName = nameParts[0] || "Attendee";
    const lastName = nameParts.slice(1).join(" ") || "";
    const resolvedTier = matchedTicket?.name || ticketTypeName || "Standard Admission";

    // 5. Build QR Code payload
    const qrDataPayload = JSON.stringify({
      passId: validId,
      badgeCode: badgeCode,
      eventId: eventId,
      eventTitle: eventName,
      attendeeName: rawName,
      company: company,
      jobTitle: jobTitle,
      ticketType: resolvedTier,
      registeredAt: new Date().toISOString(),
    });

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrDataPayload, {
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch (e) {
      console.warn("QR code generation error:", e);
    }

    // 6. Route to Pending vs Approved
    let attendeeRecord = null;
    let registrationStatus = "registered";

    if (requiresApproval) {
      registrationStatus = "pending";
      const notePayload = JSON.stringify({
        ticketType: resolvedTier,
        ticketId: matchedTicket?.id || ticketId || null,
        note: notes || `External API registration for ${resolvedTier} (Pending Approval)`,
        company: company,
        jobTitle: jobTitle,
        phone: rawPhone,
        referralCode: referralCode,
        source: source,
        answers: answers,
        registeredVia: "api",
      });

      const pendingRow = {
        id: validId,
        event_id: isValidUuid(eventId) ? eventId : null,
        name: rawName,
        email: rawEmail,
        note: notePayload,
        date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      };

      if (isValidUuid(eventId)) {
        await supabase.from("pending_registrations").insert(pendingRow);
      }

      attendeeRecord = {
        id: validId,
        eventId: eventId,
        eventTitle: eventName,
        name: rawName,
        email: rawEmail,
        phone: rawPhone,
        company: company,
        jobTitle: jobTitle,
        ticketType: resolvedTier,
        status: "pending",
        badgeCode: badgeCode,
        qrCode: qrCodeDataUrl,
        registeredAt: new Date().toISOString(),
        requiresApproval: true,
        source: source,
      };
    } else {
      registrationStatus = "registered";
      const participantRow = {
        id: validId,
        event_id: isValidUuid(eventId) ? eventId : null,
        first_name: firstName,
        last_name: lastName,
        email: rawEmail,
        phone: rawPhone,
        ticket_type: resolvedTier,
        status_participation: "registered",
        registered_at: new Date().toISOString(),
        referral_code: referralCode || null,
      };

      if (isValidUuid(eventId)) {
        await supabase.from("participants").insert(participantRow);

        // Increment sold quantity on ticket tier
        if (matchedTicket?.id) {
          await supabase
            .from("tickets")
            .update({ sold_quantity: (matchedTicket.sold_quantity || 0) + 1 })
            .eq("id", matchedTicket.id);
        }
      }

      attendeeRecord = {
        id: validId,
        eventId: eventId,
        eventTitle: eventName,
        name: rawName,
        firstName: firstName,
        lastName: lastName,
        email: rawEmail,
        phone: rawPhone,
        company: company,
        jobTitle: jobTitle,
        ticketType: resolvedTier,
        status: "registered",
        badgeCode: badgeCode,
        qrCode: qrCodeDataUrl,
        registeredAt: new Date().toISOString(),
        requiresApproval: false,
        source: source,
      };

      // Atomically increment ticket sold quantity in PostgreSQL
      if (matchedTicket?.id && isValidUuid(matchedTicket.id)) {
        try {
          await supabase.rpc("reserve_ticket", { p_ticket_id: matchedTicket.id, p_quantity: 1 });
        } catch (reserveErr) {
          console.warn("Atomic ticket reservation notice:", reserveErr);
        }
      }
    }

    // 7. Insert Custom Form Responses if provided
    const combinedAnswers = {
      ...answers,
      ...(company ? { company } : {}),
      ...(jobTitle ? { jobTitle } : {}),
      ...(rawPhone ? { phone: rawPhone } : {}),
      ...(referralCode ? { _referral_code: referralCode } : {}),
      _registration_source: source,
    };

    if (isValidUuid(eventId) && Object.keys(combinedAnswers).length > 0) {
      try {
        await supabase.from("form_submissions").upsert(
          {
            id: validId,
            event_id: eventId,
            respondent_name: rawName,
            respondent_email: rawEmail,
            ticket_tier: resolvedTier,
            answers: combinedAnswers,
            status: registrationStatus,
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.warn("Form submissions insert notice:", err);
      }
    }

    // 8. Trigger Webhooks for external listeners with SSRF protection
    if (isValidUuid(eventId)) {
      try {
        const { data: webhooks } = await supabase
          .from("developer_webhooks")
          .select("*")
          .eq("event_id", eventId)
          .eq("is_active", true);

        if (webhooks && webhooks.length > 0) {
          const webhookEventName = registrationStatus === "pending" ? "registration.pending" : "registration.created";
          const webhookPayload = {
            event: webhookEventName,
            timestamp: new Date().toISOString(),
            eventId: eventId,
            eventTitle: eventName,
            attendee: attendeeRecord,
          };

          for (const wh of webhooks) {
            const subscribedEvents = Array.isArray(wh.events) ? wh.events : ["registration.created", "registration.pending"];
            if (subscribedEvents.includes(webhookEventName) && isSafeWebhookUrl(wh.url)) {
              fetch(wh.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Eventzone-Event": webhookEventName,
                  "X-Eventzone-Secret": wh.secret || "",
                  "User-Agent": "Eventzone-Webhooks/1.0",
                },
                body: JSON.stringify(webhookPayload),
                signal: AbortSignal.timeout(5000),
              }).catch((e) => console.warn("Webhook dispatch error:", wh.url, e.message));
            }
          }
        }
      } catch (whErr) {
        console.warn("Webhook check notice:", whErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          registrationStatus === "pending"
            ? "Registration application received and submitted for organizer review."
            : "Ticket registration confirmed successfully!",
        status: registrationStatus,
        attendee: attendeeRecord,
        badge: {
          code: badgeCode,
          qrCodeUrl: qrCodeDataUrl,
          qrData: qrDataPayload,
        },
      },
      {
        status: 201,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("POST /api/events/[id]/tickets/register error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process ticket registration",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
