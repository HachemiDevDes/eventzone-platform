import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import { sendRSVPConfirmationEmail } from "@/lib/mailer";

const supabase = getServiceSupabase();

function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function calculateAnalytics(rsvps = [], capacityLimit = 150) {
  let attendingCount = 0;
  let attendingHeadcount = 0;
  let waitlistCount = 0;
  let waitlistHeadcount = 0;
  let declinedCount = 0;
  let tentativeCount = 0;
  let checkedInCount = 0;

  const dietaryMap = {
    "None": 0,
    "Vegetarian": 0,
    "Vegan": 0,
    "Halal": 0,
    "Kosher": 0,
    "Gluten-Free": 0,
    "Dairy-Free": 0,
    "Nut Allergy": 0,
    "Other": 0
  };

  const plusOnesMap = {
    solo: 0,
    plus1: 0,
    plus2Plus: 0
  };

  rsvps.forEach(r => {
    const status = (r.status || 'attending').toLowerCase();
    const plusOnes = Math.max(0, parseInt(r.plus_ones || r.plusOnes || 0, 10));
    const totalGuests = 1 + plusOnes;

    if (r.checked_in || r.checkedIn) checkedInCount++;

    if (status === 'attending') {
      attendingCount++;
      attendingHeadcount += totalGuests;

      // Dietary tally for attending
      const diet = r.dietary_preference || r.dietaryPreference || 'None';
      if (dietaryMap[diet] !== undefined) {
        dietaryMap[diet] += totalGuests;
      } else {
        dietaryMap["Other"] = (dietaryMap["Other"] || 0) + totalGuests;
      }

      // Plus ones distribution
      if (plusOnes === 0) plusOnesMap.solo++;
      else if (plusOnes === 1) plusOnesMap.plus1++;
      else plusOnesMap.plus2Plus++;

    } else if (status === 'waitlisted') {
      waitlistCount++;
      waitlistHeadcount += totalGuests;
    } else if (status === 'declined') {
      declinedCount++;
    } else if (status === 'tentative') {
      tentativeCount++;
    }
  });

  const totalResponses = rsvps.length;
  const capacityUsedPct = capacityLimit > 0 ? Math.min(100, Math.round((attendingHeadcount / capacityLimit) * 100)) : 0;
  const capacityRemaining = Math.max(0, capacityLimit - attendingHeadcount);

  return {
    totalResponses,
    attendingCount,
    attendingHeadcount,
    waitlistCount,
    waitlistHeadcount,
    declinedCount,
    tentativeCount,
    checkedInCount,
    capacityLimit,
    capacityRemaining,
    capacityUsedPct,
    isAtCapacity: attendingHeadcount >= capacityLimit,
    dietaryBreakdown: dietaryMap,
    plusOnesBreakdown: plusOnesMap,
  };
}

// ─────────────────────────────────────────────
// GET /api/events/[id]/rsvp
// ─────────────────────────────────────────────
export async function GET(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    // 1. Fetch RSVP Settings
    let settings = {
      is_enabled: true,
      capacity_limit: 150,
      allow_plus_ones: true,
      max_plus_ones: 2,
      allow_waitlist: true,
      deadline: null,
      collect_dietary: true,
      collect_company: true,
      collect_phone: true,
      confirmation_message: "Thank you for your RSVP! We look forward to seeing you at the event."
    };

    if (isValidUuid(eventId)) {
      const { data: setRow } = await supabase
        .from('rsvp_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (setRow) {
        settings = { ...settings, ...setRow };
      } else {
        // Check event table capacity
        const { data: evRow } = await supabase
          .from('events')
          .select('capacity')
          .eq('id', eventId)
          .maybeSingle();
        if (evRow?.capacity) {
          settings.capacity_limit = evRow.capacity;
        }
      }
    }

    // 2. Fetch RSVPs
    let rsvps = [];
    if (isValidUuid(eventId)) {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        rsvps = data;
      }
    }

    const analytics = calculateAnalytics(rsvps, settings.capacity_limit);

    return NextResponse.json({
      success: true,
      eventId,
      settings,
      analytics,
      rsvps
    });
  } catch (err) {
    console.error("GET /api/events/[id]/rsvp error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST /api/events/[id]/rsvp (Public Guest Submission)
// ─────────────────────────────────────────────
export async function POST(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const fullName = body.fullName || body.full_name || body.name || "";
    const email = body.email || "";
    const phone = body.phone || "";
    const company = body.company || body.organization || "";
    const jobTitle = body.jobTitle || body.job_title || "";
    const status = body.status || "attending";
    const plusOnes = body.plusOnes !== undefined ? body.plusOnes : (body.plus_ones !== undefined ? body.plus_ones : 0);
    const plusOnesNames = body.plusOnesNames || body.plus_ones_names || body.companionNames || body.companion_names || [];
    const dietaryPreference = body.dietaryPreference || body.dietary_preference || body.dietaryRequirements || body.dietary_requirements || "None";
    const dietaryNotes = body.dietaryNotes || body.dietary_notes || "";
    const notes = body.notes || body.specialRequests || body.special_requests || "";
    const userId = body.userId || body.user_id || null;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full name is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const numPlusOnes = Math.max(0, parseInt(plusOnes || 0, 10));

    // 2. Fetch event settings & capacity
    let settings = {
      is_enabled: true,
      capacity_limit: 150,
      allow_plus_ones: true,
      max_plus_ones: 2,
      allow_waitlist: true,
      deadline: null,
      confirmation_message: "Thank you for your RSVP! We look forward to seeing you at the event."
    };

    if (isValidUuid(eventId)) {
      const { data: setRow } = await supabase
        .from('rsvp_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (setRow) {
        settings = { ...settings, ...setRow };
      }
    }

    // Check if RSVP is enabled
    if (settings.is_enabled === false) {
      return NextResponse.json({ 
        success: false, 
        error: "RSVP is currently closed for this event." 
      }, { status: 403 });
    }

    // Check deadline
    if (settings.deadline) {
      const deadlineDate = new Date(settings.deadline);
      if (!isNaN(deadlineDate.getTime()) && deadlineDate < new Date()) {
        return NextResponse.json({ 
          success: false, 
          error: "The RSVP submission deadline for this event has passed." 
        }, { status: 400 });
      }
    }

    // Plus-ones constraint
    let finalPlusOnes = numPlusOnes;
    if (!settings.allow_plus_ones) {
      finalPlusOnes = 0;
    } else if (settings.max_plus_ones !== undefined && finalPlusOnes > settings.max_plus_ones) {
      finalPlusOnes = settings.max_plus_ones;
    }

    // Check existing RSVP for this email on this event
    let existingRsvp = null;
    if (isValidUuid(eventId)) {
      const { data: dupCheck } = await supabase
        .from('rsvps')
        .select('id, status, full_name')
        .eq('event_id', eventId)
        .eq('email', cleanEmail)
        .maybeSingle();
      if (dupCheck) {
        existingRsvp = dupCheck;
      }
    }

    // 3. Headcount and Capacity Calculation
    let assignedStatus = status;
    let capacityMessage = "";

    if (status === 'attending') {
      let currentAttendingHeadcount = 0;
      if (isValidUuid(eventId)) {
        const { data: attendingRows } = await supabase
          .from('rsvps')
          .select('id, plus_ones')
          .eq('event_id', eventId)
          .eq('status', 'attending');

        if (attendingRows) {
          // If updating existing, exclude old headcount
          const rowsToCount = existingRsvp ? attendingRows.filter(r => r.id !== existingRsvp.id) : attendingRows;
          currentAttendingHeadcount = rowsToCount.reduce((sum, r) => sum + 1 + (r.plus_ones || 0), 0);
        }
      }

      const requestedHeads = 1 + finalPlusOnes;
      const capacityLimit = settings.capacity_limit || 150;

      if (currentAttendingHeadcount + requestedHeads > capacityLimit) {
        if (settings.allow_waitlist) {
          assignedStatus = 'waitlisted';
          capacityMessage = "Event has reached maximum capacity. You have been placed on the Priority Waitlist.";
        } else {
          return NextResponse.json({
            success: false,
            error: "Event capacity is completely full and the waitlist is closed."
          }, { status: 409 });
        }
      }
    }

    // 4. Upsert / Insert RSVP
    const now = new Date().toISOString();
    const rsvpPayload = {
      event_id: isValidUuid(eventId) ? eventId : undefined,
      user_id: isValidUuid(userId) ? userId : null,
      full_name: cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      company: company.trim(),
      job_title: jobTitle.trim(),
      status: assignedStatus,
      plus_ones: finalPlusOnes,
      plus_ones_names: Array.isArray(plusOnesNames) ? plusOnesNames : [],
      dietary_preference: dietaryPreference || 'None',
      dietary_notes: dietaryNotes.trim(),
      notes: notes.trim(),
      updated_at: now
    };

    let savedRsvp = null;

    if (isValidUuid(eventId)) {
      if (existingRsvp) {
        const { data, error } = await supabase
          .from('rsvps')
          .update(rsvpPayload)
          .eq('id', existingRsvp.id)
          .select()
          .single();
        if (error) throw error;
        savedRsvp = data;
      } else {
        const { data, error } = await supabase
          .from('rsvps')
          .insert({ ...rsvpPayload, created_at: now })
          .select()
          .single();
        if (error) throw error;
        savedRsvp = data;
      }
    } else {
      // Mock ID
      savedRsvp = {
        id: `rsvp-${Date.now()}`,
        ...rsvpPayload,
        created_at: now
      };
    }

    // Dispatch RSVP confirmation email via Hostinger SMTP
    if (cleanEmail) {
      sendRSVPConfirmationEmail({
        to: cleanEmail,
        attendeeName: cleanName,
        eventTitle: "Eventzone Summit",
        status: assignedStatus,
        dietaryPreference: dietaryPreference || 'None',
        notes: notes.trim(),
      }).catch(e => console.warn("RSVP email dispatch warning:", e));
    }

    return NextResponse.json({
      success: true,
      rsvp: savedRsvp,
      assignedStatus,
      isWaitlisted: assignedStatus === 'waitlisted',
      confirmationMessage: capacityMessage || settings.confirmation_message,
      message: capacityMessage || "RSVP successfully submitted!"
    });

  } catch (err) {
    console.error("POST /api/events/[id]/rsvp error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PATCH /api/events/[id]/rsvp (Organizer Status / Edit)
// ─────────────────────────────────────────────
export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { rsvpId, status, plusOnes, plusOnesNames, dietaryPreference, dietaryNotes, notes, checkedIn } = body;

    if (!rsvpId) {
      return NextResponse.json({ success: false, error: "RSVP ID is required" }, { status: 400 });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) updates.status = status;
    if (plusOnes !== undefined) updates.plus_ones = Math.max(0, parseInt(plusOnes, 10));
    if (plusOnesNames !== undefined) updates.plus_ones_names = plusOnesNames;
    if (dietaryPreference !== undefined) updates.dietary_preference = dietaryPreference;
    if (dietaryNotes !== undefined) updates.dietary_notes = dietaryNotes;
    if (notes !== undefined) updates.notes = notes;
    if (checkedIn !== undefined) {
      updates.checked_in = !!checkedIn;
      updates.checked_in_at = checkedIn ? new Date().toISOString() : null;
    }

    if (isValidUuid(rsvpId)) {
      const { data, error } = await supabase
        .from('rsvps')
        .update(updates)
        .eq('id', rsvpId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, rsvp: data });
    }

    return NextResponse.json({ success: true, rsvp: { id: rsvpId, ...updates } });
  } catch (err) {
    console.error("PATCH /api/events/[id]/rsvp error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// DELETE /api/events/[id]/rsvp
// ─────────────────────────────────────────────
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const eventId = params?.id;
    const { searchParams } = new URL(request.url);
    const rsvpId = searchParams.get('rsvpId');

    if (!rsvpId) {
      return NextResponse.json({ success: false, error: "RSVP ID is required" }, { status: 400 });
    }

    if (isValidUuid(rsvpId)) {
      const { error } = await supabase
        .from('rsvps')
        .update({ status: 'archived' })
        .eq('id', rsvpId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, archivedId: rsvpId });
  } catch (err) {
    console.error("DELETE /api/events/[id]/rsvp error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
