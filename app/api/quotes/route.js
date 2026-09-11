import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import { sendEmail, SENDER_EMAIL } from "@/lib/mailer";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

function generateQuoteReferenceCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EZQ-${randomStr}`;
}

/**
 * POST /api/quotes
 * Public submission of quote requests from the Eventzone platform.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const fullName = (body.full_name || body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const companyName = (body.company_name || body.companyName || "").trim();
    const jobTitle = (body.job_title || body.jobTitle || "").trim();
    const cityWilaya = (body.city_wilaya || body.cityWilaya || body.wilaya || "").trim();
    const eventName = (body.event_name || body.eventName || "").trim();
    const eventType = (body.event_type || body.eventType || "").trim();
    const attendeesCount = (body.attendees_count || body.attendeesCount || "").trim();
    const eventDate = (body.event_date || body.eventDate || "").trim();
    const duration = (body.duration || "").trim();
    const venueStatus = (body.venue_status || body.venueStatus || "").trim();
    const services = Array.isArray(body.services) ? body.services : [];
    const budgetRange = (body.budget_range || body.budgetRange || "").trim();
    const additionalDetails = (body.additional_details || body.additionalDetails || body.notes || "").trim();

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Contact phone number is required." }, { status: 400 });
    }
    if (!companyName) {
      return NextResponse.json({ error: "Company or organization name is required." }, { status: 400 });
    }

    const referenceCode = generateQuoteReferenceCode();
    const supabase = getServiceSupabase();

    const insertPayload = {
      reference_code: referenceCode,
      full_name: fullName,
      email,
      phone,
      company_name: companyName,
      job_title: jobTitle,
      city_wilaya: cityWilaya,
      event_name: eventName,
      event_type: eventType,
      attendees_count: attendeesCount,
      event_date: eventDate,
      duration,
      venue_status: venueStatus,
      services,
      budget_range: budgetRange,
      additional_details: additionalDetails,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: quote, error: dbError } = await supabase
      .from("quote_requests")
      .insert([insertPayload])
      .select()
      .single();

    if (dbError) {
      console.error("Database error saving quote request:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // ── Standard Services Set for Categorization ──
    const STANDARD_SERVICES = new Set([
      "Interactive 2D Floor Plans",
      "Multi-Tier Online Ticketing",
      "CIB & Edahabia Payments",
      "High-Speed QR Check-in",
      "On-Site Thermal Badge Printing",
      "Hardware Equipment Rental",
      "Speaker & Agenda Management",
      "B2B Networking & Matchmaking",
      "VIP Logistics & Hospitality",
      "Branded Event Mobile App",
      "Dedicated On-Site Technical Staff",
      "A4 Badging & Folded Sheets",
      "LED Screens & Video Walls",
      "Roll-ups, Banners & Event Signage",
      "Sound System & Stage Audio/Lighting",
      "Hostesses & Reception Staff",
      "Event Security & Crowd Control",
    ]);

    // ── Send Notification to Platform Super Admins (async / non-blocking) ──
    const servicesListHtml = services.length > 0 
      ? `<ul style="padding-left: 20px; margin: 8px 0;">
          ${services.map(s => {
            const isCustom = !STANDARD_SERVICES.has(s);
            return `<li style="margin-bottom:6px; color:#1e293b;">
              <strong>${s}</strong>
              ${isCustom ? '<span style="background:#fef3c7; color:#92400e; font-size:11px; font-weight:bold; padding:2px 6px; border-radius:4px; margin-left:6px; border:1px solid #fde68a;">Custom Need</span>' : ''}
            </li>`;
          }).join("")}
        </ul>`
      : `<p style="color:#64748b;">None specified</p>`;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background: #081431; padding: 18px 24px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">New Quote Request Received — Eventzone</h2>
          <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Reference: <strong>${referenceCode}</strong></p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Contact &amp; Organization</h3>
          <p style="margin: 6px 0;"><strong>Name:</strong> ${fullName}</p>
          <p style="margin: 6px 0;"><strong>Company / Org:</strong> ${companyName} ${jobTitle ? `(${jobTitle})` : ""}</p>
          <p style="margin: 6px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin: 6px 0;"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p style="margin: 6px 0;"><strong>Wilaya / Location:</strong> ${cityWilaya || "Not specified"}</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Event Specifications</h3>
          <p style="margin: 6px 0;"><strong>Event Title:</strong> ${eventName || "Untitled Project"}</p>
          <p style="margin: 6px 0;"><strong>Format / Type:</strong> ${eventType || "Not specified"}</p>
          <p style="margin: 6px 0;"><strong>Target Date:</strong> ${eventDate || "Flexible"}</p>
          <p style="margin: 6px 0;"><strong>Estimated Attendees:</strong> ${attendeesCount || "Not specified"}</p>
          <p style="margin: 6px 0;"><strong>Duration:</strong> ${duration || "Not specified"}</p>
          <p style="margin: 6px 0;"><strong>Venue Status:</strong> ${venueStatus || "Not specified"}</p>
          <p style="margin: 6px 0;"><strong>Budget Bracket:</strong> ${budgetRange || "Flexible / Awaiting recommendation"}</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Requested Services &amp; Modules</h3>
          ${servicesListHtml}
          ${additionalDetails ? `
            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
              <strong>Additional Requirements / Message:</strong>
              <p style="white-space: pre-wrap; color: #334155; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 6px;">${additionalDetails}</p>
            </div>
          ` : ""}
        </div>

        <p style="text-align: center; margin-top: 20px;">
          <a href="https://eventzone.pro/?view=admin" style="background: #0b5cdb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; display: inline-block;">
            Open Back Office &amp; Process Quote &rarr;
          </a>
        </p>
      </div>
    `;

    // Attempt admin notification email
    sendEmail({
      to: SUPER_ADMIN_EMAILS,
      subject: `[New Quote Request] ${companyName} (${referenceCode})`,
      html: adminHtml,
      text: `New Quote Request (${referenceCode}) from ${fullName} at ${companyName}. Email: ${email}, Phone: ${phone}. Check the super admin panel at eventzone.pro.`,
      replyTo: email,
    }).catch(err => console.warn("Admin quote notification email dispatch notice:", err));

    // ── Send Confirmation Email to Client ──
    const clientServicesHtml = services.length > 0
      ? `<div style="background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px; font-weight: bold;">Requested Services &amp; Modules:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
            ${services.map(s => {
              const isCustom = !STANDARD_SERVICES.has(s);
              return `<li style="margin-bottom: 4px;"><strong>${s}</strong>${isCustom ? ' <em>(Custom Need)</em>' : ''}</li>`;
            }).join("")}
          </ul>
        </div>`
      : "";

    const clientHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background: #081431; padding: 24px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <img src="https://i.imgur.com/jFDrQbM.png" alt="Eventzone" style="height: 32px; margin-bottom: 10px;" />
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">We Have Received Your Quote Request</h2>
          <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 14px;">Reference: <strong>${referenceCode}</strong></p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="font-size: 15px; color: #0f172a; line-height: 1.6;">
            Dear <strong>${fullName}</strong>,
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Thank you for reaching out to <strong>Eventzone</strong> for your upcoming event <strong>${eventName ? `"${eventName}"` : ""}</strong>.
            Our technical team is reviewing your requirements, attendance estimates, and requested services.
          </p>
          ${clientServicesHtml}
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 600;">
              &check; What happens next: An Eventzone specialist will contact you via email (${email}) or phone (${phone}) within 24 business hours with a tailored commercial and technical proposal.
            </p>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            If you have any urgent inquiries or additional documentation to provide, feel free to reply directly to this email or reach us at <a href="mailto:contact@eventzone.pro" style="color:#0b5cdb;">contact@eventzone.pro</a> or by phone at <a href="tel:+213781457511" style="color:#0b5cdb;">+213 (0) 781 45 75 11</a>.
          </p>
          <p style="font-size: 14px; color: #0f172a; margin-top: 20px;">
            Warm regards,<br />
            <strong>The Eventzone Team</strong><br />
            <span style="font-size: 12px; color: #64748b;">Premier Event Technology &amp; Operations</span>
          </p>
        </div>
      </div>
    `;

    sendEmail({
      to: email,
      subject: `Your Eventzone Quote Request Confirmation (${referenceCode})`,
      html: clientHtml,
      text: `Hello ${fullName},\n\nThank you for requesting a quote for ${eventName || "your event"} with Eventzone. Your reference code is ${referenceCode}. Our team is reviewing your requirements and will reach out within 24 hours.\n\nWarm regards,\nEventzone Team`,
      replyTo: "contact@eventzone.pro",
    }).catch(err => console.warn("Client quote receipt email dispatch notice:", err));

    return NextResponse.json({
      success: true,
      reference_code: referenceCode,
      quote,
    });
  } catch (err) {
    console.error("POST /api/quotes error:", err);
    return NextResponse.json({ error: err.message || "Failed to process quote request." }, { status: 500 });
  }
}

/**
 * GET /api/quotes
 * Fetches all quote requests for authorized Super Admins.
 */
export async function GET(request) {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, quotes: data || [] });
  } catch (err) {
    console.error("GET /api/quotes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/quotes
 * Updates status, admin internal notes, or quoted amount.
 */
export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, admin_notes, quoted_amount } = body;

    if (!id) {
      return NextResponse.json({ error: "Quote ID is required." }, { status: 400 });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (status !== undefined) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (quoted_amount !== undefined) updates.quoted_amount = quoted_amount ? Number(quoted_amount) : null;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("quote_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote: data });
  } catch (err) {
    console.error("PATCH /api/quotes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/quotes
 * Removes a quote request by ID.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Quote ID is required." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("quote_requests")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/quotes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
