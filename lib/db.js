/**
 * db.js — Data Access Layer for Eventzone SaaS Platform
 *
 * Handles column-name mapping between the app's data model and the Supabase
 * schema, supporting multi-event multi-tenant isolation, user profiles, and visitor tickets.
 */

import { supabase, safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from './supabase';

export const DEFAULT_EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || 'cf12bb94-0cfb-4e0c-a96c-482a5c4e9021';

let _activeEventId = DEFAULT_EVENT_ID;

export function setActiveEventId(id) {
  if (id) _activeEventId = id;
}

export function getActiveEventId() {
  return _activeEventId;
}

// ─────────────────────────────────────────────
//  USER PROFILES & ROLES
// ─────────────────────────────────────────────

export async function fetchUserProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn("Could not fetch profile from Supabase:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("Profile fetch error:", e);
    return null;
  }
}

const formatPlatformForApp = (platId) => {
  if (!platId) return "Website";
  const s = platId.toLowerCase();
  if (s.includes("linkedin")) return "LinkedIn";
  if (s.includes("twitter") || s === "x" || s.includes("x (twitter)")) return "X (Twitter)";
  if (s.includes("github")) return "GitHub";
  if (s.includes("whatsapp")) return "WhatsApp";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("youtube")) return "YouTube";
  if (s.includes("telegram")) return "Telegram";
  if (s.includes("discord")) return "Discord";
  if (s.includes("medium")) return "Medium";
  if (s.includes("dribbble")) return "Dribbble";
  if (s.includes("calendly")) return "Calendly";
  if (s.includes("email") || s.includes("mail")) return "Email";
  if (s.includes("phone")) return "Phone Number";
  if (s.includes("website") || s.includes("company")) return "Company Website";
  return platId.charAt(0).toUpperCase() + platId.slice(1);
};

export async function upsertUserProfile(profile) {
  try {
    const loc = profile.location || profile.address || '';
    
    // 1. Format social links for mobile app metadata.socials: [{ platform, label, value }]
    let incomingSocials = profile.socialLinks || profile.social_links || [];
    if (!Array.isArray(incomingSocials) && typeof incomingSocials === 'object') {
      incomingSocials = Object.entries(incomingSocials).map(([k, v]) => ({
        platform: k,
        label: formatPlatformForApp(k),
        value: v
      }));
    }

    const formattedSocials = incomingSocials.map(link => {
      const plat = link.platform || "Website";
      return {
        platform: formatPlatformForApp(plat),
        label: link.title || link.label || formatPlatformForApp(plat),
        value: link.url || link.value || ""
      };
    }).filter(s => s.value && s.value.trim());

    // Build companion social_links object
    const socialLinksObj = {};
    formattedSocials.forEach(s => {
      const key = s.platform.toLowerCase().replace(/[\s\(\)]+/g, '_');
      if (key && s.value) {
        socialLinksObj[key] = s.value;
      }
    });

    // 2. Fetch existing metadata if available to preserve non-social keys (e.g. material_finish, phone, etc.)
    let existingMetadata = {};
    if (profile.metadata && typeof profile.metadata === 'object') {
      existingMetadata = profile.metadata;
    } else if (profile.id) {
      const { data: cur } = await supabase.from('profiles').select('metadata').eq('id', profile.id).single();
      if (cur?.metadata && typeof cur.metadata === 'object') {
        existingMetadata = cur.metadata;
      }
    }

    const updatedMetadata = {
      ...existingMetadata,
      socials: formattedSocials,
    };

    // 3. Format what_im_looking_for string
    let lookingForStr = "";
    if (typeof profile.what_im_looking_for === 'string') {
      lookingForStr = profile.what_im_looking_for;
    } else if (Array.isArray(profile.what_im_looking_for)) {
      lookingForStr = profile.what_im_looking_for.join(', ');
    } else if (profile.whatImLookingFor) {
      lookingForStr = Array.isArray(profile.whatImLookingFor) ? profile.whatImLookingFor.join(', ') : profile.whatImLookingFor;
    }

    const payload = {
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName || profile.full_name || '',
      avatar_url: profile.avatar || profile.avatar_url || '',
      job_title: profile.jobTitle || profile.job_title || '',
      company_name: profile.companyName || profile.company_name || profile.company || '',
      company: profile.companyName || profile.company_name || profile.company || '',
      bio: profile.bio || '',
      location: loc,
      address: loc,
      phone: profile.phone || '',
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      social_links: socialLinksObj,
      metadata: updatedMetadata,
      what_im_looking_for: lookingForStr,
      updated_at: new Date().toISOString()
    };

    if (profile.role) {
      payload.role = profile.role;
    }

    // 1. Try upsert by id if UUID is present
    if (payload.id) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) return data;
      console.warn("Upsert by id warning, attempting update by email:", error);
    }

    // 2. Fallback update by email
    if (payload.email) {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('email', payload.email)
        .select()
        .single();
      if (!error && data) return data;
      if (error) throw error;
    }

    return payload;
  } catch (e) {
    console.error("Profile upsert error:", e);
    throw e;
  }
}

// ─────────────────────────────────────────────
//  MULTI-EVENT MANAGEMENT
// ─────────────────────────────────────────────

export async function fetchUserEvents(userId) {
  if (!userId) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`organizer_id.eq.${userId},owner_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error || !data) {
      return [];
    }
    return data.map(mapEventFromDb);
  } catch (err) {
    console.warn("Error fetching user events:", err);
    return [];
  }
}

export async function fetchPublicEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .neq('status', 'archived')
      .order('start_date', { ascending: true });
    if (error || !data) {
      return [];
    }
    return data.map(mapEventFromDb);
  } catch (err) {
    console.warn("Error fetching public events:", err);
    return [];
  }
}

export async function createEvent(eventData, userId) {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}`;
  const row = {
    id: newId,
    name: eventData.title || 'Untitled Event',
    tagline: eventData.tagline || '',
    category: eventData.category || 'Technology & Software',
    location: eventData.location || 'Online',
    type: eventData.type || 'Hybrid',
    start_date: eventData.startDate || new Date().toISOString().split('T')[0],
    end_date: eventData.endDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    description: eventData.description || '',
    banner: eventData.banner || '',
    cover_url: eventData.banner || '',
    capacity: eventData.capacity || 500,
    status: eventData.status || 'published',
    organizer_id: userId || null,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('events')
      .insert(row)
      .select()
      .single();
    if (error) {
      console.warn("Supabase event insert failed:", error.message);
      return mapEventSummaryFromDb(row);
    }
    return mapEventSummaryFromDb(data || row);
  } catch (e) {
    console.warn("Create event exception:", e);
    return mapEventSummaryFromDb(row);
  }
}

export async function archiveEvent(eventId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', eventId)
      .select();
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Archive event error:", err);
    return false;
  }
}

export async function unarchiveEvent(eventId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('id', eventId)
      .select();
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Unarchive event error:", err);
    return false;
  }
}

// Organizers cannot permanently delete events, only archive them
export async function deleteEvent(eventId) {
  return await archiveEvent(eventId);
}

export function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const SHOWCASE_EVENTS = [];

function getDefaultEventItem() {
  return null;
}

function mapEventSummaryFromDb(row) {
  let parsedGallery = [];
  try {
    if (Array.isArray(row.gallery)) parsedGallery = row.gallery;
    else if (typeof row.gallery === 'string' && row.gallery) parsedGallery = JSON.parse(row.gallery);
  } catch (e) {
    if (typeof row.gallery === 'string') parsedGallery = [row.gallery];
  }

  return {
    id: row.id,
    title: row.name || row.title || 'Untitled Event',
    tagline: row.tagline || '',
    category: row.category || 'Technology & Software',
    location: row.location || 'Online',
    venueName: row.venue_name || '',
    type: row.type || 'Hybrid',
    startDate: row.start_date || row.startDate || '',
    endDate: row.end_date || row.endDate || '',
    description: row.description || '',
    banner: row.banner || row.cover_url || (parsedGallery.length > 0 ? parsedGallery[0] : ''),
    cover_url: row.cover_url || row.banner || (parsedGallery.length > 0 ? parsedGallery[0] : ''),
    capacity: row.capacity || 500,
    status: row.status || 'published',
    attendeeCount: row.attendee_count || 0,
    sessionsCount: row.sessions_count || 0,
    organizerId: row.organizer_id || null,
    youtubeUrl: row.youtube_url || row.video_url || '',
    videoUrl: row.video_url || row.youtube_url || '',
    gallery: parsedGallery,
  };
}

export async function fetchEventDetails(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  try {
    if (!isValidUuid(targetId)) {
      return null;
    }
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', targetId)
      .single();
    if (error || !data) {
      return null;
    }
    return mapEventFromDb(data);
  } catch (err) {
    console.warn("fetchEventDetails error:", err.message);
    return null;
  }
}


export async function updateEventDetails(details, eventId = _activeEventId) {
  const targetId = eventId || details?.id || _activeEventId;
  const fullPayload = mapEventToDb(details);
  
  try {
    const { error } = await supabase
      .from('events')
      .update(fullPayload)
      .eq('id', targetId);
    if (error) {
      console.warn("Extended event update warning, falling back to core columns:", error.message);
      const basePayload = {
        name: details.title,
        tagline: details.tagline,
        category: details.category,
        location: details.location,
        type: details.type,
        start_date: details.startDate,
        end_date: details.endDate,
        description: details.description,
        banner: details.banner,
        cover_url: details.banner,
        capacity: details.capacity,
        status: details.status || 'published',
      };
      const { error: baseErr } = await supabase
        .from('events')
        .update(basePayload)
        .eq('id', targetId);
      if (baseErr) throw new Error(baseErr.message);
    }
  } catch (err) {
    console.error("updateEventDetails error:", err);
    throw err;
  }
}

function mapEventFromDb(row) {
  let parsedGallery = [];
  if (Array.isArray(row.gallery)) {
    parsedGallery = row.gallery;
  } else if (typeof row.gallery === 'string' && row.gallery.trim()) {
    try {
      parsedGallery = JSON.parse(row.gallery);
    } catch {
      parsedGallery = [];
    }
  }

  let parsedMultiLocations = [];
  if (Array.isArray(row.multi_locations)) {
    parsedMultiLocations = row.multi_locations;
  } else if (Array.isArray(row.locations)) {
    parsedMultiLocations = row.locations;
  } else if (typeof row.multi_locations === 'string' && row.multi_locations.trim()) {
    try {
      parsedMultiLocations = JSON.parse(row.multi_locations);
    } catch {
      parsedMultiLocations = [];
    }
  }

  return {
    id: row.id,
    title: row.name || row.title || '',
    tagline: row.tagline || '',
    category: row.category || 'Technology & Software',
    location: row.location || '',
    type: row.type || 'Hybrid',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    description: row.description || '',
    banner: row.banner || row.cover_url || (parsedGallery.length > 0 ? parsedGallery[0] : ''),
    cover_url: row.cover_url || row.banner || (parsedGallery.length > 0 ? parsedGallery[0] : ''),
    capacity: row.capacity || 500,
    status: row.status || 'published',
    country: row.country || '',
    city: row.city || '',
    venueName: row.venue_name || '',
    venueAddress: row.venue_address || '',
    virtualUrl: row.virtual_url || row.online_link || '',
    virtualPlatform: row.virtual_platform || '',
    virtualInstructions: row.virtual_instructions || '',
    scheduleMode: row.schedule_mode || (parsedMultiLocations.length > 1 ? 'multiple' : 'single'),
    scheduleTime: row.schedule_time || '',
    multiLocations: parsedMultiLocations,
    organizerName: row.organizer_name || row.host_name || '',
    contactEmail: row.contact_email || row.host_email || '',
    contactPhone: row.contact_phone || '',
    websiteUrl: row.website_url || '',
    youtubeUrl: row.youtube_url || row.video_url || '',
    videoUrl: row.video_url || row.youtube_url || '',
    eventLogo: row.event_logo || row.logo || row.logo_url || '',
    logo: row.logo || row.event_logo || row.logo_url || '',
    logo_url: row.logo_url || row.event_logo || row.logo || '',
    organizerLogo: row.organizer_logo || row.host_logo || '',
    gallery: parsedGallery,
  };
}

function mapEventToDb(details) {
  const currentGallery = Array.isArray(details.gallery) ? details.gallery : [];
  const primaryBanner = details.banner || (currentGallery.length > 0 ? currentGallery[0] : '') || '';
  const primaryLogo = details.eventLogo || details.logo || '';

  const payload = {
    name: details.title,
    tagline: details.tagline,
    category: details.category,
    location: details.location,
    type: details.type,
    start_date: details.startDate,
    end_date: details.endDate,
    description: details.description,
    banner: primaryBanner,
    cover_url: primaryBanner,
    logo_url: primaryLogo,
    capacity: details.capacity,
    status: details.status || 'published',
  };

  // Attach extended columns
  if (details.country !== undefined) payload.country = details.country;
  if (details.city !== undefined) payload.city = details.city;
  if (details.venueName !== undefined) payload.venue_name = details.venueName;
  if (details.venueAddress !== undefined) payload.venue_address = details.venueAddress;
  if (details.virtualUrl !== undefined) payload.virtual_url = details.virtualUrl;
  if (details.virtualPlatform !== undefined) payload.virtual_platform = details.virtualPlatform;
  if (details.virtualInstructions !== undefined) payload.virtual_instructions = details.virtualInstructions;
  if (details.scheduleMode !== undefined) payload.schedule_mode = details.scheduleMode;
  if (details.scheduleTime !== undefined) payload.schedule_time = details.scheduleTime;
  if (details.multiLocations !== undefined) payload.multi_locations = details.multiLocations;
  if (details.organizerName !== undefined) payload.organizer_name = details.organizerName;
  if (details.contactEmail !== undefined) payload.contact_email = details.contactEmail;
  if (details.contactPhone !== undefined) payload.contact_phone = details.contactPhone;
  if (details.websiteUrl !== undefined) payload.website_url = details.websiteUrl;
  if (details.youtubeUrl !== undefined) payload.youtube_url = details.youtubeUrl;
  if (details.videoUrl !== undefined) payload.video_url = details.videoUrl;
  if (details.eventLogo !== undefined) payload.event_logo = details.eventLogo;
  if (details.logo !== undefined) payload.logo = details.logo;
  if (details.organizerLogo !== undefined) payload.organizer_logo = details.organizerLogo;
  if (details.gallery !== undefined) payload.gallery = currentGallery;

  return payload;
}

// ─────────────────────────────────────────────
//  SESSIONS
// ─────────────────────────────────────────────

export async function fetchSessions(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('event_id', targetId)
    .order('start_time', { ascending: true });
  if (error) {
    console.warn("fetchSessions error:", error.message);
    return [];
  }
  return data.map(mapSessionFromDb);
}

export async function upsertSession(session, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapSessionToDb(session, targetId);
  try {
    const { data, error } = await supabase
      .from('sessions')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertSession DB notice:", error.message);
      return { ...session, id: row.id };
    }
    return mapSessionFromDb(data);
  } catch (e) {
    console.warn("upsertSession error:", e);
    return { ...session, id: row.id };
  }
}

export async function archiveSession(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('sessions').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveSession notice:", error.message);
  } catch (e) {
    console.warn("archiveSession error:", e);
  }
}

export async function deleteSession(id) {
  return await archiveSession(id);
}

function convertTimeTo24h(timeStr) {
  if (!timeStr) return "09:00:00";
  const s = String(timeStr).trim();
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const seconds = ampmMatch[3] || "00";
    const modifier = ampmMatch[4] ? ampmMatch[4].toUpperCase() : null;

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const parts = s.split(":");
    return `${String(parts[0]).padStart(2, "0")}:${parts[1]}:00`;
  }
  return "09:00:00";
}

function mapSessionFromDb(row) {
  return {
    id: row.id,
    title: row.title || '',
    date: row.date ? String(row.date).substring(0, 10) : (row.start_time ? row.start_time.substring(0, 10) : ''),
    startTime: row.start_time ? row.start_time.substring(11, 16) : '',
    endTime: row.end_time ? row.end_time.substring(11, 16) : '',
    description: row.description || '',
    speakers: Array.isArray(row.speakers) ? row.speakers : [],
    moderators: Array.isArray(row.moderators) ? row.moderators : [],
    logos: Array.isArray(row.logos) ? row.logos : [],
  };
}

function mapSessionToDb(session, eventId = _activeEventId) {
  const dateStr = session.date || new Date().toISOString().split('T')[0];
  const validId = isValidUuid(session.id) ? session.id : generateUuid();
  const startTime24 = session.startTime ? convertTimeTo24h(session.startTime) : null;
  const endTime24 = session.endTime ? convertTimeTo24h(session.endTime) : null;

  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    title: session.title || 'Untitled Session',
    date: session.date || dateStr,
    start_time: startTime24 ? `${dateStr}T${startTime24}+00:00` : null,
    end_time: endTime24 ? `${dateStr}T${endTime24}+00:00` : null,
    description: session.description || '',
    speakers: Array.isArray(session.speakers) ? session.speakers : [],
    moderators: Array.isArray(session.moderators) ? session.moderators : [],
    logos: Array.isArray(session.logos) ? session.logos : [],
  };
}

// ─────────────────────────────────────────────
//  ATTENDEES (participants)
// ─────────────────────────────────────────────

export async function fetchAttendees(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let query = supabase
    .from('participants')
    .select('*')
    .order('registered_at', { ascending: true });

  if (isValidUuid(targetId)) {
    query = query.eq('event_id', targetId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchAttendees error:", error.message);
    return [];
  }

  // Also query form_submissions for this event to merge answers & custom fields into attendee objects
  let subs = [];
  try {
    if (isValidUuid(targetId)) {
      const { data: subsData } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('event_id', targetId);
      if (subsData && subsData.length > 0) {
        subs = subsData;
      }
    }
  } catch (e) {
    console.warn("fetchAttendees form_submissions notice:", e);
  }

  return (data || []).map(row => {
    const attendee = mapAttendeeFromDb(row);
    const sub = subs.find(s => 
      s.id === row.id || 
      (s.respondent_email && row.email && s.respondent_email.toLowerCase() === row.email.toLowerCase())
    );
    if (sub && sub.answers && typeof sub.answers === 'object') {
      attendee.answers = { ...(attendee.answers || {}), ...sub.answers };
      attendee.customAnswers = { ...(attendee.customAnswers || {}), ...sub.answers };
      attendee.formAnswers = { ...(attendee.formAnswers || {}), ...sub.answers };

      // Strictly extract Company and Function from ticket form submission answers
      let formComp = sub.answers.company || sub.answers.f_company || sub.answers.organization || sub.answers.f_organization || '';
      let formJob = sub.answers.jobTitle || sub.answers.job_title || sub.answers.f_job_title || sub.answers.function || sub.answers.profession || '';

      if (!formComp || !formJob) {
        for (const [k, v] of Object.entries(sub.answers)) {
          if (!v || typeof v !== 'string') continue;
          const key = k.toLowerCase();
          if (!formComp && (key.includes('company') || key.includes('societe') || key.includes('entreprise') || key.includes('org'))) {
            formComp = String(v).trim();
          }
          if (!formJob && (key.includes('job') || key.includes('title') || key.includes('function') || key.includes('profession') || key.includes('poste') || key.includes('role') || key.includes('fonction'))) {
            formJob = String(v).trim();
          }
        }
      }

      if (formComp) attendee.company = formComp;
      if (formJob) attendee.jobTitle = formJob;
      if (!attendee.phone && (sub.answers.phone || sub.answers.f_core_phone || sub.answers.phoneNumber)) {
        attendee.phone = sub.answers.phone || sub.answers.f_core_phone || sub.answers.phoneNumber;
      }
    }
    return attendee;
  });
}

export async function upsertAttendee(attendee, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapAttendeeToDb(attendee, targetId);
  try {
    const { data, error } = await supabase
      .from('participants')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertAttendee DB notice:", error.message);
      return { ...attendee, id: row.id };
    }

    const answersData = attendee.answers || attendee.customAnswers || attendee.formAnswers || {};
    if (answersData && typeof answersData === 'object' && Object.keys(answersData).length > 0) {
      try {
        await supabase.from('form_submissions').upsert({
          id: row.id,
          event_id: isValidUuid(targetId) ? targetId : undefined,
          respondent_name: attendee.name || 'Attendee',
          respondent_email: attendee.email || 'attendee@eventzone.io',
          ticket_tier: attendee.ticketType || attendee.ticket_type || 'Standard Admission',
          answers: answersData,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (subErr) {
        console.warn("upsertAttendee form_submissions upsert notice:", subErr);
      }
    }

    const mapped = mapAttendeeFromDb(data);
    mapped.answers = answersData;
    mapped.customAnswers = answersData;
    mapped.formAnswers = answersData;
    mapped.company = attendee.company || answersData.company || answersData.f_company || '';
    mapped.jobTitle = attendee.jobTitle || answersData.jobTitle || answersData.job_title || '';
    mapped.phone = attendee.phone || answersData.phone || answersData.f_core_phone || '';
    return mapped;
  } catch (e) {
    console.warn("upsertAttendee error:", e);
    return { ...attendee, id: row.id };
  }
}

export async function archiveAttendee(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('participants').update({ status_participation: 'archived' }).eq('id', id);
    if (error) console.warn("archiveAttendee notice:", error.message);
  } catch (e) {
    console.warn("archiveAttendee error:", e);
  }
}
export const deleteAttendee = archiveAttendee;

function mapAttendeeFromDb(row) {
  return {
    id: row.id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    email: row.email || '',
    ticketType: row.ticket_type || 'Standard Admission',
    ticket_type: row.ticket_type || 'Standard Admission',
    status: row.status_participation || 'registered',
    isArchived: row.status_participation === 'archived',
    registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
    image: row.image || '',
    avatar: row.image || '',
    isSpeaker: !!row.is_speaker,
    answers: {},
    customAnswers: {},
    formAnswers: {}
  };
}

function mapAttendeeToDb(attendee, eventId = _activeEventId) {
  const nameParts = (attendee.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const validId = isValidUuid(attendee.id) ? attendee.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    first_name: firstName,
    last_name: lastName,
    email: attendee.email,
    ticket_type: attendee.ticketType || attendee.ticket_type || 'Standard Admission',
    status_participation: attendee.isArchived ? 'archived' : (attendee.status || 'registered'),
    registered_at: attendee.registeredDate
      ? new Date(attendee.registeredDate).toISOString()
      : new Date().toISOString(),
    image: attendee.image || attendee.avatar || '',
    is_speaker: !!attendee.isSpeaker,
  };
}

// ─────────────────────────────────────────────
//  PENDING REGISTRATIONS
// ─────────────────────────────────────────────

export async function fetchPending(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let query = supabase
    .from('pending_registrations')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (isValidUuid(targetId)) {
    query = query.eq('event_id', targetId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchPending error:", error.message);
    return [];
  }
  return data.map(mapPendingFromDb);
}

export async function upsertPending(item, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const validId = isValidUuid(item.id) ? item.id : generateUuid();
  const notePayload = JSON.stringify({
    ticketType: item.ticketType || item.ticket_type || 'Standard Admission',
    note: item.note || '',
    company: item.company || '',
    jobTitle: item.jobTitle || item.job_title || '',
    phone: item.phone || '',
    answers: item.answers || item.customAnswers || item.formAnswers || {}
  });

  const row = {
    id: validId,
    event_id: isValidUuid(targetId) ? targetId : undefined,
    name: item.name,
    email: item.email,
    note: notePayload,
    date: item.date || new Date().toISOString().split('T')[0],
  };
  try {
    const { data, error } = await supabase
      .from('pending_registrations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertPending DB notice:", error.message);
      return { ...item, id: validId };
    }
    const mapped = mapPendingFromDb(data);
    broadcastRealtimeChange('PENDING_SAVED', mapped, targetId);
    return mapped;
  } catch (e) {
    console.warn("upsertPending error:", e);
    return { ...item, id: validId };
  }
}

export async function deletePending(id, eventId = _activeEventId) {
  if (!id) return;
  const targetId = eventId || _activeEventId;
  try {
    if (isValidUuid(id)) {
      await supabase.from('pending_registrations').delete().eq('id', id);
    }
    broadcastRealtimeChange('PENDING_DELETED', { id }, targetId);
  } catch (e) {
    console.warn("deletePending error:", e);
  }
}
export const archivePending = deletePending;

function mapPendingFromDb(row) {
  let meta = {};
  const rawNote = row.note || '';
  if (rawNote && typeof rawNote === 'string' && rawNote.trim().startsWith('{') && rawNote.trim().endsWith('}')) {
    try {
      meta = JSON.parse(rawNote.trim());
    } catch (e) {}
  }

  const ans = meta.answers || meta.customAnswers || {};
  let formJob = '';
  let formComp = '';
  if (typeof ans === 'object') {
    for (const [k, v] of Object.entries(ans)) {
      if (!v || typeof v !== 'string') continue;
      const key = k.toLowerCase();
      if (!formJob && (key.includes('job') || key.includes('title') || key.includes('function') || key.includes('profession') || key.includes('poste') || key.includes('role') || key.includes('fonction'))) {
        formJob = String(v).trim();
      }
      if (!formComp && (key.includes('company') || key.includes('societe') || key.includes('entreprise') || key.includes('org'))) {
        formComp = String(v).trim();
      }
    }
  }

  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    ticketType: meta.ticketType || meta.ticket_type || row.ticket_type || 'Standard Admission',
    ticket_type: meta.ticketType || meta.ticket_type || row.ticket_type || 'Standard Admission',
    note: meta.note || (meta.ticketType ? `Applied for ${meta.ticketType}` : rawNote),
    date: row.date || (row.created_at ? row.created_at.split('T')[0] : ''),
    company: formComp || meta.company || row.company || '',
    jobTitle: formJob || meta.jobTitle || row.job_title || '',
    phone: meta.phone || row.phone || '',
    image: meta.image || meta.avatar || meta.photo || meta.badgePicture || '',
    avatar: meta.image || meta.avatar || meta.photo || meta.badgePicture || '',
    answers: ans,
    formAnswers: ans,
    customAnswers: ans,
  };
}

// ─────────────────────────────────────────────
//  ORGANIZATIONS
// ─────────────────────────────────────────────

export async function fetchOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchOrganizations error:", error.message);
    return [];
  }
  return data.map(mapOrgFromDb);
}

export async function upsertOrganization(org) {
  const row = mapOrgToDb(org);
  try {
    const { data, error } = await supabase
      .from('organizations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertOrganization DB notice:", error.message);
      return { ...org, id: row.id };
    }
    return mapOrgFromDb(data);
  } catch (e) {
    console.warn("upsertOrganization error:", e);
    return { ...org, id: row.id };
  }
}

export async function archiveOrganization(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('organizations').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveOrganization notice:", error.message);
  } catch (e) {
    console.warn("archiveOrganization error:", e);
  }
}
export const deleteOrganization = archiveOrganization;

function mapOrgFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    industry: row.industry || '',
    address: row.address || '',
    logo: row.logo || '',
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapOrgToDb(org) {
  const validId = isValidUuid(org.id) ? org.id : generateUuid();
  return {
    id: validId,
    name: org.name,
    industry: org.industry,
    address: org.address,
    logo: org.logo || '',
    status: org.isArchived ? 'archived' : (org.status || 'active'),
  };
}

// ─────────────────────────────────────────────
//  SPONSORS
// ─────────────────────────────────────────────

export async function fetchSponsors(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchSponsors error:", error.message);
    return [];
  }
  return data.map(mapSponsorFromDb);
}

export async function upsertSponsor(sponsor, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapSponsorToDb(sponsor, targetId);
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertSponsor DB notice:", error.message);
      return { ...sponsor, id: row.id };
    }
    return mapSponsorFromDb(data);
  } catch (e) {
    console.warn("upsertSponsor error:", e);
    return { ...sponsor, id: row.id };
  }
}

export async function archiveSponsor(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('sponsors').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveSponsor notice:", error.message);
  } catch (e) {
    console.warn("archiveSponsor error:", e);
  }
}
export const deleteSponsor = archiveSponsor;

function mapSponsorFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    tier: row.tier || 'Silver',
    industry: row.industry || '',
    website: row.website || '',
    logo: row.logo || '',
    orgId: row.org_id || null,
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapSponsorToDb(sponsor, eventId = _activeEventId) {
  const validId = isValidUuid(sponsor.id) ? sponsor.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    name: sponsor.name,
    tier: sponsor.tier,
    industry: sponsor.industry,
    website: sponsor.website,
    logo: sponsor.logo || '',
    org_id: isValidUuid(sponsor.orgId) ? sponsor.orgId : null,
    status: sponsor.isArchived ? 'archived' : (sponsor.status || 'active'),
  };
}

// ─────────────────────────────────────────────
//  EXHIBITORS
// ─────────────────────────────────────────────

export async function fetchExhibitors(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('exhibitors')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchExhibitors error:", error.message);
    return [];
  }
  return data.map(mapExhibitorFromDb);
}

export async function upsertExhibitor(exhibitor, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapExhibitorToDb(exhibitor, targetId);
  try {
    const { data, error } = await supabase
      .from('exhibitors')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertExhibitor DB notice:", error.message);
      return { ...exhibitor, id: row.id };
    }
    return mapExhibitorFromDb(data);
  } catch (e) {
    console.warn("upsertExhibitor error:", e);
    return { ...exhibitor, id: row.id };
  }
}

export async function archiveExhibitor(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('exhibitors').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveExhibitor notice:", error.message);
  } catch (e) {
    console.warn("archiveExhibitor error:", e);
  }
}
export const deleteExhibitor = archiveExhibitor;

function mapExhibitorFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    boothNumber: row.booth_number || '',
    industry: row.industry || '',
    contactEmail: row.contact_email || '',
    logo: row.logo_url || row.logo || '',
    orgId: row.org_id || null,
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapExhibitorToDb(exhibitor, eventId = _activeEventId) {
  const validId = isValidUuid(exhibitor.id) ? exhibitor.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    name: exhibitor.name,
    booth_number: exhibitor.boothNumber,
    industry: exhibitor.industry,
    contact_email: exhibitor.contactEmail,
    logo_url: exhibitor.logo || '',
    org_id: isValidUuid(exhibitor.orgId) ? exhibitor.orgId : null,
    status: exhibitor.isArchived ? 'archived' : (exhibitor.status || 'active'),
  };
}

// ─────────────────────────────────────────────
//  OPPORTUNITIES & PROSPECTS
// ─────────────────────────────────────────────

export async function fetchOpportunities(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let query = supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (isValidUuid(targetId)) {
    query = query.eq('event_id', targetId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchOpportunities error:", error.message);
    return [];
  }
  return data.map(mapOpportunityFromDb);
}

export async function upsertOpportunity(opp, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapOpportunityToDb(opp, targetId);
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertOpportunity DB notice:", error.message);
      return { ...opp, id: row.id };
    }
    const mapped = mapOpportunityFromDb(data);
    broadcastRealtimeChange('OPPORTUNITY_SAVED', mapped, targetId);
    return mapped;
  } catch (e) {
    console.warn("upsertOpportunity error:", e);
    return { ...opp, id: row.id };
  }
}

export async function archiveOpportunity(id, eventId = _activeEventId) {
  if (!id || !isValidUuid(id)) return;
  const targetId = eventId || _activeEventId;
  try {
    const { error } = await supabase.from('opportunities').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveOpportunity notice:", error.message);
    broadcastRealtimeChange('OPPORTUNITY_DELETED', { id }, targetId);
  } catch (e) {
    console.warn("archiveOpportunity error:", e);
  }
}
export const deleteOpportunity = archiveOpportunity;

function mapOpportunityFromDb(row) {
  let parsedActivity = [];
  try {
    if (Array.isArray(row.activity_log)) parsedActivity = row.activity_log;
    else if (typeof row.activity_log === 'string' && row.activity_log) parsedActivity = JSON.parse(row.activity_log);
  } catch (e) {
    parsedActivity = [];
  }

  return {
    id: row.id,
    eventId: row.event_id || '',
    name: row.name || row.company_name || '',
    companyName: row.company_name || row.name || '',
    contactName: row.contact_name || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    industry: row.industry || '',
    targetType: row.target_type || 'both',
    stage: row.stage || 'lead',
    dealValue: parseFloat(row.deal_value || 0),
    currency: row.currency || 'DZD',
    tierInterest: row.tier_interest || 'silver',
    boothPreference: row.booth_preference || '',
    probability: row.probability !== undefined && row.probability !== null ? parseInt(row.probability, 10) : 10,
    priority: row.priority || 'medium',
    notes: row.notes || '',
    activityLog: parsedActivity,
    lostReason: row.lost_reason || '',
    convertedSponsorId: row.converted_sponsor_id || null,
    convertedExhibitorId: row.converted_exhibitor_id || null,
    orgId: row.org_id || null,
    logo: row.logo_url || '',
    logoUrl: row.logo_url || '',
    assignedTo: row.assigned_to || '',
    expectedCloseDate: row.expected_close_date || '',
    status: row.status || 'active',
    isArchived: row.status === 'archived',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

function mapOpportunityToDb(opp, eventId = _activeEventId) {
  const validId = isValidUuid(opp.id) ? opp.id : generateUuid();
  const validEventId = isValidUuid(eventId) ? eventId : (isValidUuid(opp.eventId) ? opp.eventId : undefined);
  return {
    id: validId,
    event_id: validEventId,
    name: opp.name || opp.companyName || 'Untitled Prospect',
    company_name: opp.companyName || opp.name || 'Untitled Prospect',
    contact_name: opp.contactName || '',
    contact_email: opp.contactEmail || '',
    contact_phone: opp.contactPhone || '',
    industry: opp.industry || '',
    target_type: opp.targetType || 'both',
    stage: opp.stage || 'lead',
    deal_value: parseFloat(opp.dealValue || opp.deal_value || 0),
    currency: opp.currency || 'DZD',
    tier_interest: opp.tierInterest || opp.tier || 'silver',
    booth_preference: opp.boothPreference || opp.booth || '',
    probability: opp.probability !== undefined && opp.probability !== null ? parseInt(opp.probability, 10) : 10,
    priority: opp.priority || 'medium',
    notes: opp.notes || '',
    activity_log: Array.isArray(opp.activityLog) ? opp.activityLog : [],
    lost_reason: opp.lostReason || '',
    converted_sponsor_id: isValidUuid(opp.convertedSponsorId) ? opp.convertedSponsorId : null,
    converted_exhibitor_id: isValidUuid(opp.convertedExhibitorId) ? opp.convertedExhibitorId : null,
    org_id: isValidUuid(opp.orgId) ? opp.orgId : null,
    logo_url: opp.logo || opp.logoUrl || '',
    assigned_to: opp.assignedTo || '',
    expected_close_date: opp.expectedCloseDate || null,
    status: opp.isArchived ? 'archived' : (opp.status || 'active'),
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
//  TICKETS
// ─────────────────────────────────────────────

export async function fetchTickets(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchTickets error:", error.message);
    return [];
  }
  return data.map(mapTicketFromDb);
}

export async function upsertTicket(ticket, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapTicketToDb(ticket, targetId);
  try {
    const { data, error } = await supabase
      .from('tickets')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertTicket DB notice:", error.message);
      return { ...ticket, id: row.id };
    }
    return mapTicketFromDb(data);
  } catch (e) {
    console.warn("upsertTicket error:", e);
    return { ...ticket, id: row.id };
  }
}

export async function archiveTicket(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('tickets').update({ status: 'archived', is_active: false }).eq('id', id);
    if (error) console.warn("archiveTicket notice:", error.message);
  } catch (e) {
    console.warn("archiveTicket error:", e);
  }
}

export async function deleteTicket(id) {
  return await archiveTicket(id);
}

function mapTicketFromDb(row) {
  const priceNum = typeof row.price === 'number' ? row.price : parseFloat(String(row.price).replace(/[^0-9.]/g, '')) || 0;
  const qty = row.total_quantity || row.quantity_available || 100;
  return {
    id: row.id,
    name: row.name || '',
    tier: row.name || '',
    price: priceNum,
    available: qty,
    maxQty: qty,
    sold: row.sold_quantity || 0,
    status: row.status === 'archived' ? 'Archived' : (row.is_active ? 'Active' : 'Draft'),
    isArchived: row.status === 'archived',
    description: row.description || '',
    color: row.color || 'indigo',
    features: Array.isArray(row.features) ? row.features : [],
    badgeType: row.badge_type || 'thermal_qr',
    badgeUrl: row.badge_url || '',
    badgeSettings: row.badge_settings || {},
    formId: row.form_id || null,
    requiresApproval: Boolean(row.requires_approval),
    isPopular: Boolean(row.is_popular),
  };
}

function mapTicketToDb(ticket, eventId = _activeEventId) {
  const priceNum = typeof ticket.price === 'number' ? ticket.price : parseFloat(String(ticket.price).replace(/[^0-9.]/g, '')) || 0;
  const qty = parseInt(ticket.maxQty || ticket.available || ticket.total_quantity) || 100;
  const validId = isValidUuid(ticket.id) ? ticket.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    name: ticket.name || ticket.tier || '',
    price: priceNum,
    total_quantity: qty,
    quantity_available: qty,
    sold_quantity: parseInt(ticket.sold) || 0,
    is_active: ticket.status !== 'Draft' && ticket.status !== 'Archived',
    status: ticket.isArchived || ticket.status === 'Archived' ? 'archived' : (ticket.status || 'published'),
    description: ticket.description || '',
    color: ticket.color || 'indigo',
    features: Array.isArray(ticket.features) ? ticket.features : [],
    badge_type: ticket.badgeType || 'thermal_qr',
    badge_url: ticket.badgeUrl || null,
    badge_settings: ticket.badgeSettings || {},
    form_id: isValidUuid(ticket.formId) ? ticket.formId : null,
    requires_approval: Boolean(ticket.requiresApproval),
    is_popular: Boolean(ticket.isPopular),
  };
}

// ─────────────────────────────────────────────
//  TEAM MEMBERS
// ─────────────────────────────────────────────

export async function fetchTeam(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchTeam error:", error.message);
    return [];
  }
  return data.map(mapTeamFromDb);
}

export async function upsertTeamMember(member, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapTeamToDb(member, targetId);
  try {
    const { data, error } = await supabase
      .from('team_members')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertTeamMember DB notice:", error.message);
      // Resilient fallback: if Supabase table doesn't have permissions/phone/department yet, save standard columns
      if (error.message && (error.message.includes('column') || error.message.includes('does not exist'))) {
        const basicRow = {
          id: row.id,
          event_id: row.event_id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          role: row.role,
          avatar: row.avatar || ''
        };
        const { data: retryData, error: retryErr } = await supabase
          .from('team_members')
          .upsert(basicRow, { onConflict: 'id' })
          .select()
          .single();
        if (!retryErr && retryData) {
          return { ...mapTeamFromDb(retryData), permissions: member.permissions, phone: member.phone, department: member.department, status: member.status };
        }
      }
      return { ...member, id: row.id };
    }
    return mapTeamFromDb(data);
  } catch (e) {
    console.warn("upsertTeamMember error:", e);
    return { ...member, id: row.id };
  }
}

export async function archiveTeamMember(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('team_members').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveTeamMember notice:", error.message);
  } catch (e) {
    console.warn("archiveTeamMember error:", e);
  }
}

export async function deleteTeamMember(id) {
  return await archiveTeamMember(id);
}

function mapTeamFromDb(row) {
  const fullName = row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Team Member';
  return {
    id: row.id,
    name: fullName,
    firstName: row.first_name || fullName.split(' ')[0] || '',
    lastName: row.last_name || fullName.split(' ').slice(1).join(' ') || '',
    email: row.email || '',
    phone: row.phone || '',
    department: row.department || '',
    role: row.role || 'Staff',
    avatar: row.avatar || '',
    permissions: row.permissions || {},
    status: row.status || 'Active',
    isArchived: row.status === 'archived' || row.status === 'Archived' || row.is_archived === true,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function mapTeamToDb(member, eventId = _activeEventId) {
  const nameParts = (member.name || '').trim().split(' ');
  const firstName = member.firstName || nameParts[0] || '';
  const lastName = member.lastName || nameParts.slice(1).join(' ') || '';
  const validId = isValidUuid(member.id) ? member.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    first_name: firstName,
    last_name: lastName,
    name: (member.name || `${firstName} ${lastName}`).trim(),
    email: member.email || '',
    phone: member.phone || '',
    department: member.department || '',
    role: member.role || 'Staff',
    avatar: member.avatar || '',
    permissions: member.permissions || {},
    status: member.isArchived ? 'archived' : (member.status || 'Active')
  };
}

// ─────────────────────────────────────────────
//  FLOOR PLANS
// ─────────────────────────────────────────────

export async function fetchFloorPlans(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchFloorPlans error:", error.message);
    return [];
  }
  return data.map(mapFloorPlanFromDb);
}

export async function upsertFloorPlan(plan, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const validId = isValidUuid(plan.id) ? plan.id : generateUuid();
  const planName = (typeof plan.name === 'string' && plan.name.trim().length > 0) ? plan.name.trim() : 'Floor Plan';
  const row = {
    id: validId,
    event_id: isValidUuid(targetId) ? targetId : undefined,
    name: planName,
    elements: plan.elements || [],
    blueprint: plan.blueprint || null,
    font_family: plan.fontFamily || 'Inter',
    floors: plan.floors ? JSON.stringify(plan.floors) : null,
    status: plan.isArchived ? 'archived' : (plan.status || 'published')
  };
  try {
    const { data, error } = await supabase
      .from('floor_plans')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertFloorPlan DB notice:", error.message);
      return { ...plan, id: validId, name: planName };
    }
    return mapFloorPlanFromDb(data);
  } catch (e) {
    console.warn("upsertFloorPlan error:", e);
    return { ...plan, id: validId, name: planName };
  }
}

export async function archiveFloorPlan(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('floor_plans').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveFloorPlan notice:", error.message);
  } catch (e) {
    console.warn("archiveFloorPlan error:", e);
  }
}

export async function deleteFloorPlan(id) {
  return await archiveFloorPlan(id);
}

function mapFloorPlanFromDb(row) {
  const elements = row.elements || [];
  const blueprint = row.blueprint || {
    url: '', name: 'Venue Blueprint', opacity: 0.8,
    x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false,
  };
  
  let rawFloors = row.floors;
  if (typeof rawFloors === 'string') {
    try {
      rawFloors = JSON.parse(rawFloors);
    } catch (e) {
      rawFloors = null;
    }
  }

  const floors = rawFloors && Array.isArray(rawFloors) && rawFloors.length > 0 ? rawFloors : [
    {
      id: 'default-floor-id',
      name: row.name || 'Ground Floor',
      elements: elements,
      blueprint: blueprint,
    }
  ];

  const firstFloorBp = (floors && floors[0] && floors[0].blueprint) ? floors[0].blueprint : null;
  const resolvedBlueprint = (blueprint && blueprint.url) ? blueprint : (firstFloorBp || blueprint);

  return {
    id: row.id,
    name: row.name || 'Unnamed Plan',
    createdAt: row.created_at,
    elements: elements,
    blueprint: resolvedBlueprint,
    fontFamily: row.font_family || 'Inter',
    floors: floors,
  };
}

// ─────────────────────────────────────────────
//  VISITOR PASSES & REGISTRATIONS
// ─────────────────────────────────────────────

export async function fetchVisitorRegistrations(userEmail) {
  if (!userEmail) return [];
  try {
    const { data: participants, error: pErr } = await supabase
      .from('participants')
      .select('*')
      .eq('email', userEmail)
      .order('registered_at', { ascending: false });

    if (pErr || !participants || participants.length === 0) {
      return [];
    }

    // Fetch matching real events for event details
    const eventIds = [...new Set(participants.map(p => p.event_id).filter(Boolean))];
    let eventsMap = {};
    if (eventIds.length > 0) {
      const { data: eventsList } = await supabase
        .from('events')
        .select('id, name, location, start_date, end_date')
        .in('id', eventIds);
      if (eventsList) {
        eventsList.forEach(ev => {
          eventsMap[ev.id] = ev;
        });
      }
    }

    return participants.map(row => {
      const ev = eventsMap[row.event_id] || {};
      return {
        id: row.id,
        eventId: row.event_id,
        eventTitle: ev.name || "Event Registration",
        ticketType: row.ticket_type || 'Standard Admission',
        status: row.status_participation || 'registered',
        registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
        location: ev.location || "Venue TBA",
        startDate: ev.start_date || "",
        endDate: ev.end_date || "",
        badgeCode: `PASS-${(row.id || '').toString().slice(-6).toUpperCase()}`,
      };
    });
  } catch (err) {
    console.warn("fetchVisitorRegistrations error:", err);
    return [];
  }
}


// Helper: Extract clean digits for phone numbers
export function cleanPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

// Helper: Matches phone numbers robustly across local/international formatting
export function isMatchingPhoneNumber(p1, p2) {
  const d1 = cleanPhoneNumber(p1);
  const d2 = cleanPhoneNumber(p2);
  if (!d1 || !d2) return false;
  if (d1.length < 6 || d2.length < 6) return false;
  if (d1 === d2) return true;
  if (d1.length >= 8 && d2.endsWith(d1)) return true;
  if (d2.length >= 8 && d1.endsWith(d2)) return true;
  const d1NoLeadZero = d1.replace(/^0+/, '');
  const d2NoLeadZero = d2.replace(/^0+/, '');
  if (d1NoLeadZero && d2NoLeadZero) {
    if (d1NoLeadZero === d2NoLeadZero) return true;
    if (d1NoLeadZero.length >= 7 && d2NoLeadZero.endsWith(d1NoLeadZero)) return true;
    if (d2NoLeadZero.length >= 7 && d1NoLeadZero.endsWith(d2NoLeadZero)) return true;
  }
  return false;
}

// Helper: Case-insensitive email equality
export function isMatchingEmail(e1, e2) {
  if (!e1 || !e2 || typeof e1 !== 'string' || typeof e2 !== 'string') return false;
  return e1.trim().toLowerCase() === e2.trim().toLowerCase();
}

export async function registerVisitorForEvent(eventId, visitorData) {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `part-${Date.now()}`;
  const validId = isValidUuid(newId) ? newId : generateUuid();
  const badgeCode = `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const nameParts = (visitorData.name || 'Guest Attendee').trim().split(' ');
  const isPending = Boolean(visitorData.requiresApproval || visitorData.requires_approval);
  const targetEventId = isValidUuid(eventId) ? eventId : (isValidUuid(DEFAULT_EVENT_ID) ? DEFAULT_EVENT_ID : undefined);

  // Extract Email & Phone from top-level or questionnaire answers
  const emailToTest = (
    visitorData.email || 
    visitorData.customAnswers?.f_core_email || 
    visitorData.answers?.f_core_email || 
    visitorData.customAnswers?.email || 
    visitorData.answers?.email || 
    ""
  ).trim().toLowerCase();

  const phoneToTest = (
    visitorData.phone || 
    visitorData.customAnswers?.f_core_phone || 
    visitorData.answers?.f_core_phone || 
    visitorData.customAnswers?.phone || 
    visitorData.answers?.phone || 
    visitorData.customAnswers?.phoneNumber || 
    visitorData.answers?.phoneNumber || 
    ""
  ).trim();

  // ─────────────────────────────────────────────
  // 1. DUPLICATE CHECK (Email & Phone Number)
  // ─────────────────────────────────────────────
  if (isValidUuid(targetEventId) && (emailToTest || phoneToTest)) {
    // 1a. Check registered participants
    try {
      const { data: existingParticipants } = await supabase
        .from('participants')
        .select('id, first_name, last_name, email, status_participation')
        .eq('event_id', targetEventId)
        .neq('status_participation', 'archived');

      if (existingParticipants && existingParticipants.length > 0) {
        for (const part of existingParticipants) {
          if (emailToTest && isMatchingEmail(part.email, emailToTest)) {
            return {
              success: false,
              error: "An attendee with this email address is already registered for this event.",
              code: "DUPLICATE_REGISTRATION",
              duplicateType: "registered"
            };
          }
        }
      }
    } catch (e) {
      console.warn("Duplicate check participants notice:", e);
    }

    // 1b. Check pending review queue
    try {
      const { data: existingPending } = await supabase
        .from('pending_registrations')
        .select('id, name, email, note')
        .eq('event_id', targetEventId);

      if (existingPending && existingPending.length > 0) {
        for (const pend of existingPending) {
          if (emailToTest && isMatchingEmail(pend.email, emailToTest)) {
            return {
              success: false,
              error: "A registration application with this email address is already pending organizer review.",
              code: "DUPLICATE_REGISTRATION",
              duplicateType: "pending"
            };
          }

          if (phoneToTest) {
            let meta = {};
            if (pend.note && typeof pend.note === 'string' && pend.note.trim().startsWith('{')) {
              try { meta = JSON.parse(pend.note.trim()); } catch (_) {}
            }
            const pendPhone = meta.phone || meta.answers?.phone || meta.answers?.f_core_phone || meta.answers?.phoneNumber || '';
            if (pendPhone && isMatchingPhoneNumber(pendPhone, phoneToTest)) {
              return {
                success: false,
                error: "A registration application with this phone number is already pending organizer review.",
                code: "DUPLICATE_REGISTRATION",
                duplicateType: "pending"
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("Duplicate check pending notice:", e);
    }

    // 1c. Check form_submissions (captures phone and email for both direct and pending)
    try {
      const { data: existingSubmissions } = await supabase
        .from('form_submissions')
        .select('id, respondent_email, answers')
        .eq('event_id', targetEventId);

      if (existingSubmissions && existingSubmissions.length > 0) {
        for (const sub of existingSubmissions) {
          if (emailToTest && isMatchingEmail(sub.respondent_email, emailToTest)) {
            return {
              success: false,
              error: "A registration with this email address is already registered for this event.",
              code: "DUPLICATE_REGISTRATION",
              duplicateType: "registered"
            };
          }

          if (phoneToTest && sub.answers && typeof sub.answers === 'object') {
            const subPhone = sub.answers.phone || sub.answers.f_core_phone || sub.answers.phoneNumber || '';
            if (subPhone && isMatchingPhoneNumber(subPhone, phoneToTest)) {
              return {
                success: false,
                error: "A registration with this phone number is already registered for this event.",
                code: "DUPLICATE_REGISTRATION",
                duplicateType: "registered"
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("Duplicate check form_submissions notice:", e);
    }
  }

  const userPhoto = visitorData.image || visitorData.avatar || visitorData.photo || visitorData.badgePicture || 
    (visitorData.customAnswers && Object.values(visitorData.customAnswers).find(v => typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http') || v.startsWith('blob:')))) || 
    (visitorData.answers && Object.values(visitorData.answers).find(v => typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http') || v.startsWith('blob:')))) || '';

  if (isPending) {
    // 1. Insert into pending_registrations queue with sanitized columns & JSON payload in note
    const notePayload = JSON.stringify({
      ticketType: visitorData.ticketType || visitorData.ticket_type || 'Standard Admission',
      note: visitorData.note || `Applied for ${visitorData.ticketType || visitorData.ticket_type || 'Standard Admission'} (Pending Approval)`,
      company: visitorData.company || '',
      jobTitle: visitorData.jobTitle || visitorData.job_title || '',
      phone: visitorData.phone || '',
      image: userPhoto,
      avatar: userPhoto,
      answers: visitorData.customAnswers || visitorData.answers || {}
    });

    const pendingRow = {
      id: validId,
      event_id: targetEventId,
      name: visitorData.name || 'Guest Attendee',
      email: visitorData.email || 'visitor@eventzone.io',
      note: notePayload,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const { error: insErr } = await supabase.from('pending_registrations').insert(pendingRow);
      if (insErr && insErr.code === '23503') {
        await supabase.from('pending_registrations').insert({
          ...pendingRow,
          event_id: DEFAULT_EVENT_ID
        });
      }
      broadcastRealtimeChange('PENDING_SUBMITTED', {
        id: validId,
        eventId: targetEventId,
        name: visitorData.name || 'Guest Attendee',
        email: visitorData.email || 'visitor@eventzone.io',
        ticketType: visitorData.ticketType || visitorData.ticket_type || 'Standard Admission',
        note: `Applied for ${visitorData.ticketType || visitorData.ticket_type || 'Standard Admission'} (Pending Approval)`,
        date: new Date().toISOString().split('T')[0],
        company: visitorData.company || '',
        jobTitle: visitorData.jobTitle || '',
        phone: visitorData.phone || '',
        image: userPhoto,
        avatar: userPhoto,
        answers: visitorData.customAnswers || visitorData.answers || {}
      }, targetEventId);
    } catch (e) {
      console.warn("Supabase pending_registrations insert notice:", e);
    }

    const answersData = visitorData.customAnswers || visitorData.answers || {};
    if (answersData && typeof answersData === 'object' && Object.keys(answersData).length > 0) {
      try {
        await supabase.from('form_submissions').upsert({
          id: validId,
          event_id: targetEventId,
          respondent_name: visitorData.name || 'Attendee',
          respondent_email: visitorData.email || 'visitor@eventzone.io',
          ticket_tier: visitorData.ticketType || visitorData.ticket_type || 'Standard Admission',
          answers: answersData,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (subErr) {
        console.warn("registerVisitorForEvent form_submissions notice:", subErr);
      }
    }

    return {
      id: validId,
      eventId: targetEventId,
      eventTitle: visitorData.eventTitle || 'Eventzone Summit',
      ticketType: visitorData.ticketType || visitorData.ticket_type || 'Standard Admission',
      status: 'pending',
      registeredDate: new Date().toISOString().split('T')[0],
      location: visitorData.location || 'Online',
      startDate: visitorData.startDate || new Date().toISOString().split('T')[0],
      endDate: visitorData.endDate || new Date().toISOString().split('T')[0],
      badgeCode: badgeCode,
      image: userPhoto,
      avatar: userPhoto,
      answers: visitorData.customAnswers || visitorData.answers || {},
      company: visitorData.company || '',
      jobTitle: visitorData.jobTitle || '',
      phone: visitorData.phone || ''
    };
  }

  // 2. Direct Auto-Approval
  const row = {
    id: validId,
    event_id: targetEventId,
    first_name: nameParts[0] || 'Guest',
    last_name: nameParts.slice(1).join(' ') || 'Attendee',
    email: visitorData.email || 'visitor@eventzone.io',
    ticket_type: visitorData.ticketType || visitorData.ticket_type || 'Standard Admission',
    status_participation: 'registered',
    registered_at: new Date().toISOString(),
    image: userPhoto
  };

  try {
    const { error: partErr } = await supabase.from('participants').insert(row);
    if (partErr && partErr.code === '23503') {
      await supabase.from('participants').insert({
        ...row,
        event_id: DEFAULT_EVENT_ID
      });
    }
  } catch (e) {
    console.warn("Supabase participant insert exception:", e);
  }

  const directAnswersData = visitorData.customAnswers || visitorData.answers || {};
  if (directAnswersData && typeof directAnswersData === 'object' && Object.keys(directAnswersData).length > 0) {
    try {
      await supabase.from('form_submissions').upsert({
        id: validId,
        event_id: targetEventId,
        respondent_name: visitorData.name || 'Attendee',
        respondent_email: visitorData.email || 'visitor@eventzone.io',
        ticket_tier: visitorData.ticketType || visitorData.ticket_type || 'Standard Admission',
        answers: directAnswersData,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (subErr) {
      console.warn("registerVisitorForEvent form_submissions notice:", subErr);
    }
  }

  return {
    id: validId,
    eventId: targetEventId,
    eventTitle: visitorData.eventTitle || 'Eventzone Summit',
    ticketType: visitorData.ticketType || 'Standard Admission',
    status: 'registered',
    registeredDate: new Date().toISOString().split('T')[0],
    location: visitorData.location || 'Online',
    startDate: visitorData.startDate || new Date().toISOString().split('T')[0],
    endDate: visitorData.endDate || new Date().toISOString().split('T')[0],
    badgeCode: badgeCode,
    answers: visitorData.customAnswers || visitorData.answers || {},
    company: visitorData.company || '',
    jobTitle: visitorData.jobTitle || '',
    phone: visitorData.phone || ''
  };
}

// ─────────────────────────────────────────────
//  STORAGE UPLOAD
// ─────────────────────────────────────────────

export async function uploadProfileAvatar(file, userId) {
  if (!file) return null;
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const fileName = `avatar_${userId || 'user'}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    // 1. Upload to public 'avatars' bucket
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      return publicUrl;
    }
    console.warn("Avatars bucket upload warning, trying floor-plans:", error);
  } catch (e) {
    console.warn("Avatars bucket error:", e);
  }

  // 2. Fallback to 'floor-plans' public bucket
  try {
    const fallbackPath = `avatars/${fileName}`;
    const { data: fbData, error: fbError } = await supabase.storage
      .from('floor-plans')
      .upload(fallbackPath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (fbError) throw fbError;

    const { data: { publicUrl } } = supabase.storage
      .from('floor-plans')
      .getPublicUrl(fallbackPath);

    return publicUrl;
  } catch (err) {
    console.error("Storage avatar upload failed:", err);
    throw err;
  }
}

export async function uploadFileToBucket(file, bucket = 'floor-plans', eventId = _activeEventId) {
  if (!file) return null;
  const targetId = eventId || _activeEventId;
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${targetId}/${fileName}`;

  // 1. Try specified bucket (e.g. 'floor-plans', 'avatars', or 'event-assets')
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      if (publicUrl) return publicUrl;
    }
  } catch (e) {
    console.warn(`Storage upload to ${bucket} failed, trying fallback:`, e);
  }

  // 2. Try avatars bucket if primary was different
  if (bucket !== 'avatars') {
    try {
      const { data: avData, error: avError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!avError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        if (publicUrl) return publicUrl;
      }
    } catch (e) {
      console.warn("Storage upload to avatars fallback failed:", e);
    }
  }

  // 3. Graceful fallback to client Base64 Data URL so user images are NEVER lost
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────
//  COMMUNICATIONS
// ─────────────────────────────────────────────

export async function logCommunication({ subject, body, recipientCount }, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = {
    event_id: targetId,
    subject: subject,
    body: body,
    recipient_count: recipientCount,
    status: 'Sent',
    sent_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('communications')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchCommunications(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (!isValidUuid(targetId)) return [];
  try {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('event_id', targetId)
      .order('sent_at', { ascending: false });
    if (error) {
      console.warn("fetchCommunications error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchCommunications exception:", e);
    return [];
  }
}

// ─────────────────────────────────────────────
//  FORMS & SURVEYS BUILDER
// ─────────────────────────────────────────────

// Core locked and required fields for all forms
export const CORE_LOCKED_FIELDS = [
  {
    id: "f_core_name",
    type: "text",
    label: "Full Name",
    placeholder: "e.g. Alex Morgan",
    required: true,
    isLocked: true,
    options: []
  },
  {
    id: "f_core_email",
    type: "email",
    label: "Email Address",
    placeholder: "alex@company.com",
    required: true,
    isLocked: true,
    options: []
  },
  {
    id: "f_core_phone",
    type: "phone",
    label: "Phone Number",
    placeholder: "550 12 34 56",
    required: true,
    isLocked: true,
    options: []
  }
];

export function ensureCoreLockedFields(fields = []) {
  const current = Array.isArray(fields) ? [...fields] : [];
  
  const hasName = current.some(f => f.id === "f_core_name" || (f.isLocked && f.label?.toLowerCase().includes("name")));
  const hasEmail = current.some(f => f.id === "f_core_email" || (f.isLocked && f.type === "email"));
  const hasPhone = current.some(f => f.id === "f_core_phone" || (f.isLocked && (f.type === "phone" || f.label?.toLowerCase().includes("phone"))));

  const missing = [];
  if (!hasName) missing.push({ ...CORE_LOCKED_FIELDS[0] });
  if (!hasEmail) missing.push({ ...CORE_LOCKED_FIELDS[1] });
  if (!hasPhone) missing.push({ ...CORE_LOCKED_FIELDS[2] });

  const sanitized = current.map(f => {
    if (f.id === "f_core_name" || f.id === "f_core_email") {
      return { ...f, isLocked: true, required: true };
    }
    if (f.id === "f_core_phone") {
      return { ...f, type: "phone", isLocked: true, required: true };
    }
    return f;
  });

  return [...missing, ...sanitized];
}

export const STARTER_FORMS = [];
export const STARTER_SUBMISSIONS = [];

// In-memory cache for created forms and offline operation
let _cachedForms = [];
let _cachedSubmissions = [];

export async function fetchForms(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("fetchForms DB query error:", error.message);
      } else if (data) {
        return data.map(mapFormFromDb);
      }
    } catch (e) {
      console.warn("fetchForms DB query exception:", e);
    }
  }

  const matching = _cachedForms.filter(f => f.eventId === targetId);
  return matching;
}

export async function upsertForm(form, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const formId = form.id && isValidUuid(form.id) ? form.id : generateUuid();
  const now = new Date().toISOString();

  const formattedForm = {
    ...form,
    id: formId,
    eventId: targetId,
    fields: ensureCoreLockedFields(form.fields),
    updatedAt: now,
    createdAt: form.createdAt || now,
  };

  // 1. Try upserting to Supabase
  if (isValidUuid(targetId)) {
    try {
      const row = {
        id: formId,
        event_id: targetId,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        type: form.type || 'ticket_registration',
        ticket_id: form.ticketId || 'all',
        fields: ensureCoreLockedFields(form.fields || []),
        settings: form.settings || {},
        status: form.status || 'active',
        created_at: form.createdAt || now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('forms')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error("Supabase upsertForm error:", error.message);
        throw new Error(error.message);
      }

      if (data) {
        const saved = mapFormFromDb(data);
        _cachedForms = [saved, ..._cachedForms.filter(f => f.id !== saved.id)];
        broadcastRealtimeChange('FORM_SAVED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.error("upsertForm DB exception:", e);
      throw e;
    }
  }

  _cachedForms = [formattedForm, ..._cachedForms.filter(f => f.id !== formId)];
  broadcastRealtimeChange('FORM_SAVED', formattedForm, targetId);
  return formattedForm;
}

export async function archiveForm(id, eventId = _activeEventId) {
  if (!id) return;
  const targetId = eventId || _activeEventId;
  _cachedForms = _cachedForms.map(f => f.id === id ? { ...f, status: 'archived', isArchived: true } : f);
  broadcastRealtimeChange('FORM_SAVED', { id, status: 'archived', isArchived: true }, targetId);

  if (isValidUuid(id)) {
    try {
      const { error } = await supabase.from('forms').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error("archiveForm DB exception:", error.message);
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("archiveForm exception:", e);
      throw e;
    }
  }
}

export async function deleteForm(id, eventId = _activeEventId) {
  return await archiveForm(id, eventId);
}

export async function fetchFormSubmissions(eventId = _activeEventId, formId = null) {
  const targetId = eventId || _activeEventId;

  if (isValidUuid(targetId)) {
    try {
      let query = supabase
        .from('form_submissions')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (formId && isValidUuid(formId)) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("fetchFormSubmissions error:", error.message);
      } else if (data) {
        return data.map(mapSubmissionFromDb);
      }
    } catch (e) {
      console.warn("fetchFormSubmissions DB query exception:", e);
    }
  }

  // Filter in-memory cache
  return _cachedSubmissions.filter(s => {
    const matchEvent = s.eventId === targetId || s.eventId === DEFAULT_EVENT_ID;
    const matchForm = formId ? s.formId === formId : true;
    return matchEvent && matchForm;
  });
}

export async function submitFormResponse(submission, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const newSubId = submission.id && isValidUuid(submission.id) ? submission.id : generateUuid();
  const now = new Date().toISOString();

  const formattedSub = {
    ...submission,
    id: newSubId,
    eventId: targetId,
    createdAt: now,
  };

  // 1. Try saving to Supabase
  if (isValidUuid(targetId)) {
    try {
      const row = {
        id: newSubId,
        form_id: submission.formId && isValidUuid(submission.formId) ? submission.formId : null,
        event_id: targetId,
        user_id: submission.userId && isValidUuid(submission.userId) ? submission.userId : null,
        respondent_name: submission.respondentName || 'Attendee',
        respondent_email: submission.respondentEmail || 'attendee@eventzone.io',
        ticket_tier: submission.ticketTier || 'Standard Admission',
        answers: submission.answers || {},
        created_at: now,
      };

      const { data, error } = await supabase
        .from('form_submissions')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error("submitFormResponse Supabase error:", error.message);
        throw new Error(error.message);
      }

      if (data) {
        const saved = mapSubmissionFromDb(data);
        _cachedSubmissions = [saved, ..._cachedSubmissions];
        broadcastRealtimeChange('SUBMISSION_ADDED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.error("submitFormResponse DB exception:", e);
      throw e;
    }
  }

  // 2. Save in cache
  _cachedSubmissions = [formattedSub, ..._cachedSubmissions];
  broadcastRealtimeChange('SUBMISSION_ADDED', formattedSub, targetId);
  return formattedSub;
}

export async function archiveFormSubmission(id, eventId = _activeEventId) {
  if (!id) return;
  const targetId = eventId || _activeEventId;
  _cachedSubmissions = _cachedSubmissions.map(s => s.id === id ? { ...s, status: 'archived', isArchived: true } : s);
  broadcastRealtimeChange('SUBMISSION_ARCHIVED', { id }, targetId);

  if (isValidUuid(id)) {
    try {
      const { error } = await supabase.from('form_submissions').update({ status: 'archived' }).eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.error("archiveFormSubmission DB exception:", e);
      throw e;
    }
  }
}
export const deleteFormSubmission = archiveFormSubmission;


function mapFormFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title || 'Untitled Form',
    description: row.description || '',
    type: row.type || 'ticket_registration',
    ticketId: row.ticket_id || 'all',
    fields: ensureCoreLockedFields(row.fields || []),
    settings: row.settings || {},
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubmissionFromDb(row) {
  return {
    id: row.id,
    formId: row.form_id,
    eventId: row.event_id,
    userId: row.user_id,
    respondentName: row.respondent_name || 'Attendee',
    respondentEmail: row.respondent_email || '',
    ticketTier: row.ticket_tier || 'Standard Admission',
    answers: row.answers || {},
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────
//  RSVP & ATTENDANCE MANAGEMENT
// ─────────────────────────────────────────────

export const STARTER_RSVPS = [
  {
    id: "rsvp-starter-1",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Dr. Samira Hadj",
    email: "samira.hadj@algeria-energy.org",
    phone: "+213 550 12 34 56",
    company: "National Renewable Energy Center",
    jobTitle: "Chief Research Officer",
    status: "attending",
    plusOnes: 1,
    plusOnesNames: ["Karim Hadj"],
    dietaryPreference: "Halal",
    dietaryNotes: "No dairy products",
    notes: "Arriving for keynote session early",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: "rsvp-starter-2",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Marc Dumont",
    email: "m.dumont@greenhydrogen-eu.com",
    phone: "+33 6 12 34 56 78",
    company: "EuroHydrogen Infrastructure SAS",
    jobTitle: "Managing Director",
    status: "attending",
    plusOnes: 0,
    plusOnesNames: [],
    dietaryPreference: "Vegetarian",
    dietaryNotes: "Strict vegetarian",
    notes: "Requires wheelchair-accessible seating if available",
    checkedIn: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "rsvp-starter-3",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Yasmine Belkacem",
    email: "yasmine.b@maghreb-law.com",
    phone: "+213 661 98 76 54",
    company: "Maghreb Energy Legal Partners",
    jobTitle: "Senior Partner",
    status: "attending",
    plusOnes: 2,
    plusOnesNames: ["Amine Belkacem", "Sarah Belkacem"],
    dietaryPreference: "Gluten-Free",
    dietaryNotes: "Gluten intolerance / celiac safe",
    notes: "Looking forward to bilateral offtake panel",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "rsvp-starter-4",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Tariq Mansoor",
    email: "t.mansoor@gulf-invest.ae",
    phone: "+971 50 112 2334",
    company: "Emirates Sustainable Capital",
    jobTitle: "Investment Director",
    status: "waitlisted",
    plusOnes: 1,
    plusOnesNames: ["Rashid Al-Nuaimi"],
    dietaryPreference: "Halal",
    dietaryNotes: "",
    notes: "Please notify immediately if priority seats clear",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "rsvp-starter-5",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Elena Rostova",
    email: "elena.r@nordic-transition.se",
    phone: "+46 70 123 4567",
    company: "Nordic Clean Transition Hub",
    jobTitle: "Policy Advisor",
    status: "declined",
    plusOnes: 0,
    plusOnesNames: [],
    dietaryPreference: "None",
    dietaryNotes: "",
    notes: "Conflicting overseas delegation, send post-event deck",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  }
];

let _cachedRsvps = [...STARTER_RSVPS];
let _cachedRsvpSettings = {};

export async function fetchRSVPs(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapRsvpFromDb);
      }
    } catch (e) {
      console.warn("fetchRSVPs DB query exception:", e);
    }
  }

  const matching = _cachedRsvps.filter(r => r.eventId === targetId || r.eventId === DEFAULT_EVENT_ID);
  return matching;
}

export async function fetchRSVPSettings(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  const defaultSettings = {
    id: `set-${targetId}`,
    eventId: targetId,
    isEnabled: true,
    capacityLimit: 150,
    allowPlusOnes: true,
    maxPlusOnes: 2,
    allowWaitlist: true,
    deadline: null,
    collectDietary: true,
    collectCompany: true,
    collectPhone: true,
    confirmationMessage: "Thank you for your RSVP! We look forward to seeing you at the event.",
  };

  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('rsvp_settings')
        .select('*')
        .eq('event_id', targetId)
        .maybeSingle();

      if (!error && data) {
        return mapRsvpSettingsFromDb(data);
      }
    } catch (e) {
      console.warn("fetchRSVPSettings DB query exception:", e);
    }
  }

  return _cachedRsvpSettings[targetId] || defaultSettings;
}

export async function upsertRSVPSettings(settings, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const now = new Date().toISOString();

  const formatted = {
    ...settings,
    eventId: targetId,
    updatedAt: now,
  };

  if (isValidUuid(targetId)) {
    try {
      const row = {
        event_id: targetId,
        is_enabled: settings.isEnabled ?? true,
        capacity_limit: settings.capacityLimit ?? 150,
        allow_plus_ones: settings.allowPlusOnes ?? true,
        max_plus_ones: settings.maxPlusOnes ?? 2,
        allow_waitlist: settings.allowWaitlist ?? true,
        deadline: settings.deadline || null,
        collect_dietary: settings.collectDietary ?? true,
        collect_company: settings.collectCompany ?? true,
        collect_phone: settings.collectPhone ?? true,
        confirmation_message: settings.confirmationMessage || 'Thank you for your RSVP!',
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('rsvp_settings')
        .upsert(row, { onConflict: 'event_id' })
        .select()
        .single();

      if (!error && data) {
        const saved = mapRsvpSettingsFromDb(data);
        _cachedRsvpSettings[targetId] = saved;
        broadcastRealtimeChange('RSVP_SETTINGS_SAVED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.warn("upsertRSVPSettings DB exception:", e);
    }
  }

  _cachedRsvpSettings[targetId] = formatted;
  broadcastRealtimeChange('RSVP_SETTINGS_SAVED', formatted, targetId);
  return formatted;
}

export async function submitGuestRSVP(rsvpData, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const newId = rsvpData.id || `rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();

  const plusOnes = Math.max(0, parseInt(rsvpData.plusOnes || 0, 10));

  const formattedRsvp = {
    id: newId,
    eventId: targetId,
    userId: rsvpData.userId || null,
    fullName: rsvpData.fullName || 'Guest',
    email: (rsvpData.email || '').trim().toLowerCase(),
    phone: rsvpData.phone || '',
    company: rsvpData.company || '',
    jobTitle: rsvpData.jobTitle || '',
    status: rsvpData.status || 'attending',
    plusOnes: plusOnes,
    plusOnesNames: Array.isArray(rsvpData.plusOnesNames) ? rsvpData.plusOnesNames : [],
    dietaryPreference: rsvpData.dietaryPreference || 'None',
    dietaryNotes: rsvpData.dietaryNotes || '',
    notes: rsvpData.notes || '',
    checkedIn: !!rsvpData.checkedIn,
    checkedInAt: rsvpData.checkedIn ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  if (isValidUuid(targetId)) {
    try {
      const row = {
        id: isValidUuid(newId) ? newId : undefined,
        event_id: targetId,
        user_id: isValidUuid(rsvpData.userId) ? rsvpData.userId : null,
        full_name: formattedRsvp.fullName,
        email: formattedRsvp.email,
        phone: formattedRsvp.phone,
        company: formattedRsvp.company,
        job_title: formattedRsvp.jobTitle,
        status: formattedRsvp.status,
        plus_ones: formattedRsvp.plusOnes,
        plus_ones_names: formattedRsvp.plusOnesNames,
        dietary_preference: formattedRsvp.dietaryPreference,
        dietary_notes: formattedRsvp.dietaryNotes,
        notes: formattedRsvp.notes,
        checked_in: formattedRsvp.checkedIn,
        checked_in_at: formattedRsvp.checkedInAt,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('rsvps')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        const saved = mapRsvpFromDb(data);
        _cachedRsvps = [saved, ..._cachedRsvps.filter(r => r.id !== saved.id)];
        broadcastRealtimeChange('RSVP_SUBMITTED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.warn("submitGuestRSVP DB exception, saving to local cache:", e);
    }
  }

  _cachedRsvps = [formattedRsvp, ..._cachedRsvps.filter(r => r.id !== newId)];
  broadcastRealtimeChange('RSVP_SUBMITTED', formattedRsvp, targetId);
  return formattedRsvp;
}

export async function updateRSVPStatus(rsvpId, newStatus, eventId = _activeEventId, extraUpdates = {}) {
  const targetId = eventId || _activeEventId;
  const now = new Date().toISOString();

  // Local cache update
  _cachedRsvps = _cachedRsvps.map(r => {
    if (r.id === rsvpId) {
      return {
        ...r,
        status: newStatus || r.status,
        ...extraUpdates,
        updatedAt: now,
      };
    }
    return r;
  });

  const updatedRsvp = _cachedRsvps.find(r => r.id === rsvpId);
  if (updatedRsvp) {
    broadcastRealtimeChange('RSVP_UPDATED', updatedRsvp, targetId);
  }

  if (isValidUuid(rsvpId)) {
    try {
      const dbUpdates = {
        updated_at: now,
      };
      if (newStatus) dbUpdates.status = newStatus;
      if (extraUpdates.checkedIn !== undefined) {
        dbUpdates.checked_in = !!extraUpdates.checkedIn;
        dbUpdates.checked_in_at = extraUpdates.checkedIn ? now : null;
      }
      if (extraUpdates.dietaryPreference !== undefined) dbUpdates.dietary_preference = extraUpdates.dietaryPreference;
      if (extraUpdates.dietaryNotes !== undefined) dbUpdates.dietary_notes = extraUpdates.dietaryNotes;
      if (extraUpdates.plusOnes !== undefined) dbUpdates.plus_ones = extraUpdates.plusOnes;
      if (extraUpdates.notes !== undefined) dbUpdates.notes = extraUpdates.notes;

      const { data, error } = await supabase
        .from('rsvps')
        .update(dbUpdates)
        .eq('id', rsvpId)
        .select()
        .single();

      if (!error && data) {
        return mapRsvpFromDb(data);
      }
    } catch (e) {
      console.warn("updateRSVPStatus DB exception:", e);
    }
  }

  return updatedRsvp;
}

export async function archiveRSVP(rsvpId, eventId = _activeEventId) {
  if (!rsvpId) return;
  const targetId = eventId || _activeEventId;
  _cachedRsvps = _cachedRsvps.map(r => r.id === rsvpId ? { ...r, status: 'archived' } : r);
  broadcastRealtimeChange('RSVP_UPDATED', { id: rsvpId, status: 'archived' }, targetId);

  if (isValidUuid(rsvpId)) {
    try {
      await supabase.from('rsvps').update({ status: 'archived' }).eq('id', rsvpId);
    } catch (e) {
      console.warn("archiveRSVP DB exception:", e);
    }
  }
}

export async function deleteRSVP(rsvpId, eventId = _activeEventId) {
  return await archiveRSVP(rsvpId, eventId);
}

function mapRsvpFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    company: row.company || '',
    jobTitle: row.job_title || '',
    status: row.status || 'attending',
    plusOnes: row.plus_ones || 0,
    plusOnesNames: row.plus_ones_names || [],
    dietaryPreference: row.dietary_preference || 'None',
    dietaryNotes: row.dietary_notes || '',
    notes: row.notes || '',
    checkedIn: !!row.checked_in,
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRsvpSettingsFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    isEnabled: row.is_enabled ?? true,
    capacityLimit: row.capacity_limit ?? 150,
    allowPlusOnes: row.allow_plus_ones ?? true,
    maxPlusOnes: row.max_plus_ones ?? 2,
    allowWaitlist: row.allow_waitlist ?? true,
    deadline: row.deadline,
    collectDietary: row.collect_dietary ?? true,
    collectCompany: row.collect_company ?? true,
    collectPhone: row.collect_phone ?? true,
    confirmationMessage: row.confirmation_message || "Thank you for your RSVP!",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────
//  LOGISTICS & BACKSTAGE OPERATIONS DATA LAYER
// ─────────────────────────────────────────────

export const STARTER_LOGISTICS = {
  inventory: [
    {
      id: "inv-1",
      name: "Shure Wireless Lapel & Handheld Microphones",
      category: "AV & Audio",
      quantity: 8,
      inUse: 6,
      location: "Main Auditorium",
      condition: "Good",
      supplier: "ProSound Audio",
      notes: "Includes 4 handheld and 4 lapel packs + charging dock",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "inv-2",
      name: "4K Laser Stage Projector & Giant Screen",
      category: "AV & Audio",
      quantity: 2,
      inUse: 2,
      location: "Hall A Stage",
      condition: "Good",
      supplier: "Apex Vision",
      notes: "High lumens calibrated for daylight auditorium",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "inv-3",
      name: "Executive Wooden Podium with Gooseneck Mic",
      category: "Furniture & Decor",
      quantity: 3,
      inUse: 2,
      location: "Stage & Workshop Rooms",
      condition: "Good",
      supplier: "ExpoStaging Co",
      notes: "Custom Eventzone summit branding front-plate",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "inv-4",
      name: "Directional Wayfinding Roll-Up Banners",
      category: "Signage & Rollups",
      quantity: 14,
      inUse: 14,
      location: "Lobby & Registration Area",
      condition: "Good",
      supplier: "PrintExpress",
      notes: "Placed at entrance, stairs, corridors & VIP lounge",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "inv-5",
      name: "VIP Delegate Gift Bags & RFID Lanyards",
      category: "Collateral & Swag",
      quantity: 300,
      inUse: 220,
      location: "Storage Room 102",
      condition: "New",
      supplier: "BrandMerch Studio",
      notes: "Includes summit notebook, metal pen, RFID badge, and powerbank",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "inv-6",
      name: "High-Speed 5G WiFi Routers & Mesh Pods",
      category: "Tech & Cabling",
      quantity: 6,
      inUse: 6,
      location: "Main Exhibition Hall",
      condition: "Good",
      supplier: "Telecom Ops",
      notes: "Dedicated 1Gbps fiber link with VIP & Media SSID",
      updatedAt: "2026-08-23T10:00:00Z"
    }
  ],
  vendors: [
    {
      id: "ven-1",
      name: "Gourmet Bistro Catering & Barista",
      serviceType: "Catering & F&B",
      contactName: "Sarah Jenkins",
      phone: "+1 (555) 234-8890",
      email: "events@gourmetbistro.com",
      deliveryTime: "07:30 AM",
      loadInLocation: "Loading Dock B - South Gate",
      vehiclePlate: "NY-8492-LG",
      status: "confirmed",
      contractAmount: 4500,
      notes: "Includes morning coffee break, artisanal pastries & hot buffet lunch for 200 VIPs",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ven-2",
      name: "Apex AV & Live Broadcast Crew",
      serviceType: "AV & Production",
      contactName: "Marcus Ray",
      phone: "+1 (555) 901-4432",
      email: "marcus@apexav.live",
      deliveryTime: "06:00 AM",
      loadInLocation: "Main Auditorium Bay",
      vehiclePlate: "CA-3301-AV",
      status: "on-site",
      contractAmount: 7800,
      notes: "4 live 4K cameras, multi-angle streaming rig & master soundboard",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ven-3",
      name: "ShieldPro Event Security Services",
      serviceType: "Security & Safety",
      contactName: "Capt. Robert Hayes",
      phone: "+1 (555) 443-1200",
      email: "robert@shieldprosecurity.com",
      deliveryTime: "07:00 AM",
      loadInLocation: "Main Entrance",
      vehiclePlate: "N/A",
      status: "confirmed",
      contractAmount: 2200,
      notes: "8 certified security guards for perimeter, VIP lounge & backstage access",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ven-4",
      name: "EcoClean Facility Sanitation",
      serviceType: "Cleaning & Sanitation",
      contactName: "Amina Belkacem",
      phone: "+1 (555) 891-2345",
      email: "ops@ecoclean-dz.com",
      deliveryTime: "06:30 AM",
      loadInLocation: "Service Gate 3",
      vehiclePlate: "AL-1940-CL",
      status: "scheduled",
      contractAmount: 1100,
      notes: "Continuous sweep during coffee breaks and post-event teardown",
      updatedAt: "2026-08-23T10:00:00Z"
    }
  ],
  travel: [
    {
      id: "trv-1",
      personName: "Dr. Elena Vance",
      role: "Keynote Speaker",
      travelType: "Flight",
      flightNumber: "AF 1492",
      arrivalTime: "2026-08-24 14:30",
      departureTime: "2026-08-26 19:00",
      hotelName: "Grand Hyatt Regency",
      roomNumber: "Suite 804",
      checkInDate: "2026-08-24",
      checkOutDate: "2026-08-26",
      driverName: "Karim Meziani",
      driverPhone: "+1 (555) 667-8899",
      pickupStatus: "confirmed",
      specialRequests: "Halal meals requested, lactose-free milk in green room",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "trv-2",
      personName: "Alex Henderson",
      role: "VIP Panelist",
      travelType: "Flight",
      flightNumber: "BA 089",
      arrivalTime: "2026-08-24 16:15",
      departureTime: "2026-08-26 11:30",
      hotelName: "Grand Hyatt Regency",
      roomNumber: "Room 412",
      checkInDate: "2026-08-24",
      checkOutDate: "2026-08-26",
      driverName: "Karim Meziani",
      driverPhone: "+1 (555) 667-8899",
      pickupStatus: "scheduled",
      specialRequests: "Early check-in requested",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "trv-3",
      personName: "Sofia Martinez",
      role: "Workshop Lead",
      travelType: "Train",
      flightNumber: "TGV 6802",
      arrivalTime: "2026-08-24 11:00",
      departureTime: "2026-08-25 21:00",
      hotelName: "Marriott Downtown",
      roomNumber: "Room 305",
      checkInDate: "2026-08-24",
      checkOutDate: "2026-08-25",
      driverName: "Yassine Touati",
      driverPhone: "+1 (555) 334-9911",
      pickupStatus: "completed",
      specialRequests: "HDMI adapter and whiteboard markers in prep room",
      updatedAt: "2026-08-23T10:00:00Z"
    }
  ],
  runOfShow: [
    {
      id: "ros-1",
      time: "06:00 AM",
      title: "Loading Dock Opens & Venue Security Handover",
      stageOrLocation: "Loading Dock & Main Gates",
      responsiblePerson: "Operations Lead",
      actionType: "Load-in",
      status: "completed",
      notes: "Dock master check-in for AV & catering trucks",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ros-2",
      time: "07:00 AM",
      title: "Stage Lighting, Audio & Microphones Sound Check",
      stageOrLocation: "Main Auditorium",
      responsiblePerson: "AV Technical Director",
      actionType: "AV Check",
      status: "in_progress",
      notes: "Test podium gooseneck, 4 lapels and slide clickers with lighting tech",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ros-3",
      time: "08:00 AM",
      title: "Registration Desk Staff Briefing & Badge Printer Check",
      stageOrLocation: "Lobby Reception",
      responsiblePerson: "Guest Experience Lead",
      actionType: "Registration Desk",
      status: "pending",
      notes: "Verify 4 badge printers, check QR scanners & test first batch of badges",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ros-4",
      time: "09:15 AM",
      title: "VIP Speaker Green Room Reception & Mic Fitting",
      stageOrLocation: "VIP Green Room 201",
      responsiblePerson: "VIP Concierge",
      actionType: "VIP Escort",
      status: "pending",
      notes: "Mic Dr. Elena Vance and test slide clicker ahead of keynote",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ros-5",
      time: "09:55 AM",
      title: "Pre-Show Countdown & House Lights Dim",
      stageOrLocation: "Main Auditorium",
      responsiblePerson: "Stage Manager",
      actionType: "Stage Cue",
      status: "pending",
      notes: "Play summit opening video bumper and cue host emcee to podium",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ros-6",
      time: "13:00 PM",
      title: "VIP Networking Lunch & Buffet Dispatch",
      stageOrLocation: "Banquet Hall & Terrace",
      responsiblePerson: "Catering Manager",
      actionType: "Catering Break",
      status: "pending",
      notes: "Ensure warm buffet stations and dietary labels active",
      updatedAt: "2026-08-23T10:00:00Z"
    },
    {
      id: "ros-7",
      time: "18:30 PM",
      title: "Post-Summit Breakdown & Freight Teardown",
      stageOrLocation: "All Halls & Docks",
      responsiblePerson: "Logistics Lead",
      actionType: "Teardown",
      status: "pending",
      notes: "Exhibitor freight checkout and rental return tally",
      updatedAt: "2026-08-23T10:00:00Z"
    }
  ],
  checklists: [
    {
      id: "chk-1",
      title: "High-speed stage WiFi SSID tested & credentials placed in speaker lounge",
      category: "AV & Tech",
      isCompleted: true,
      completedBy: "IT Team",
      dueDate: "07:30 AM"
    },
    {
      id: "chk-2",
      title: "Backup clickers and fresh AAA batteries placed at speaker lectern",
      category: "AV & Tech",
      isCompleted: true,
      completedBy: "Marcus (AV)",
      dueDate: "08:00 AM"
    },
    {
      id: "chk-3",
      title: "Directional signs placed at main hall corridors and elevator landings",
      category: "Signage & Wayfinding",
      isCompleted: false,
      completedBy: "",
      dueDate: "08:15 AM"
    },
    {
      id: "chk-4",
      title: "Coffee station, sparkling water, and printed speaker briefs stocked in VIP lounge",
      category: "VIP Lounge",
      isCompleted: true,
      completedBy: "VIP Concierge",
      dueDate: "08:30 AM"
    },
    {
      id: "chk-5",
      title: "Dietary meal badges and allergen warning cards placed on lunch buffet",
      category: "Catering & F&B",
      isCompleted: false,
      completedBy: "",
      dueDate: "11:30 AM"
    },
    {
      id: "chk-6",
      title: "Emergency exits inspected and clear of obstacles; first aid kit at reception",
      category: "Safety & Security",
      isCompleted: true,
      completedBy: "Security Lead",
      dueDate: "07:00 AM"
    },
    {
      id: "chk-7",
      title: "300 printed lanyards and badge sleeves counted and organized at registration desk",
      category: "Check-in Desks",
      isCompleted: true,
      completedBy: "Staff Lead",
      dueDate: "07:45 AM"
    }
  ],
  incidents: [
    {
      id: "inc-1",
      title: "Main stage HDMI switcher flickering intermittently",
      location: "Main Auditorium",
      severity: "high",
      status: "in_progress",
      reportedBy: "Stage Manager",
      assignedTo: "Marcus (Apex AV)",
      description: "Backup cable swapped, currently testing primary port 1",
      createdAt: "2026-08-23T10:15:00Z"
    },
    {
      id: "inc-2",
      title: "Coffee station 2 ran out of oat milk & biodegradable cups",
      location: "Exhibition Hall East",
      severity: "medium",
      status: "resolved",
      reportedBy: "Volunteer 3",
      assignedTo: "Gourmet Catering",
      description: "Restocked 10L oat milk and 200 biodegradable cups",
      createdAt: "2026-08-23T09:40:00Z",
      resolvedAt: "2026-08-23T09:55:00Z"
    },
    {
      id: "inc-3",
      title: "Extra power strip requested for Booth B-04",
      location: "Exhibition Hall Booth B-04",
      severity: "low",
      status: "open",
      reportedBy: "TechFlow Exhibitor",
      assignedTo: "Floor Staff",
      description: "Need 6-outlet surge protector for interactive demo station",
      createdAt: "2026-08-23T11:00:00Z"
    }
  ]
};

let _cachedLogisticsByEvent = {};

export async function fetchLogistics(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  // 1. Try fetching from Supabase if table exists
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('event_logistics')
        .select('*')
        .eq('event_id', targetId)
        .maybeSingle();

      if (!error && data && data.logistics_data) {
        _cachedLogisticsByEvent[targetId] = data.logistics_data;
        return data.logistics_data;
      }
    } catch (e) {
      console.warn("fetchLogistics DB notice (using cache/local):", e);
    }
  }

  // 2. Check in-memory or localStorage cache
  if (_cachedLogisticsByEvent[targetId]) {
    return _cachedLogisticsByEvent[targetId];
  }

  // Check localStorage
  if (typeof window !== 'undefined') {
    const local = safeLocalStorageGet(`eventzone_logistics_${targetId}`);
    if (local) {
      const parsed = typeof local === 'string' ? JSON.parse(local) : local;
      _cachedLogisticsByEvent[targetId] = parsed;
      return parsed;
    }
  }

  // 3. Fallback to STARTER_LOGISTICS deep copy
  const freshSeed = JSON.parse(JSON.stringify(STARTER_LOGISTICS));
  _cachedLogisticsByEvent[targetId] = freshSeed;
  return freshSeed;
}

export async function upsertFullLogistics(logisticsData, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const now = new Date().toISOString();

  // 1. Primary persistence: Save directly to Supabase Postgres database
  if (isValidUuid(targetId)) {
    try {
      const { error } = await supabase
        .from('event_logistics')
        .upsert({
          event_id: targetId,
          logistics_data: logisticsData,
          updated_at: now
        }, { onConflict: 'event_id' });

      if (error) {
        console.error("Supabase event_logistics upsert error:", error.message);
      }
    } catch (e) {
      console.warn("upsertFullLogistics DB network notice:", e);
    }
  }

  // 2. Client-side caching for offline resilience & instant navigation
  _cachedLogisticsByEvent[targetId] = logisticsData;
  if (typeof window !== 'undefined') {
    safeLocalStorageSet(`eventzone_logistics_${targetId}`, logisticsData);
  }

  // 3. Realtime Broadcast to other tabs & windows
  broadcastRealtimeChange('logistics_update', { eventId: targetId, data: logisticsData }, targetId);
  return logisticsData;
}

export async function upsertLogisticsItem(type, item, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const current = await fetchLogistics(targetId);
  const list = current[type] || [];
  const itemId = item.id && item.id.length > 3 ? item.id : generateUuid();
  const now = new Date().toISOString();

  const formatted = {
    ...item,
    id: itemId,
    updatedAt: now,
    createdAt: item.createdAt || now
  };

  const exists = list.some(x => x.id === itemId);
  const updatedList = exists 
    ? list.map(x => x.id === itemId ? formatted : x)
    : [formatted, ...list];

  const updatedLogistics = {
    ...current,
    [type]: updatedList
  };

  await upsertFullLogistics(updatedLogistics, targetId);
  return formatted;
}

export async function deleteLogisticsItem(type, itemId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const current = await fetchLogistics(targetId);
  const list = current[type] || [];

  const updatedList = list.filter(x => x.id !== itemId);
  const updatedLogistics = {
    ...current,
    [type]: updatedList
  };

  await upsertFullLogistics(updatedLogistics, targetId);
  return true;
}

export async function archiveLogisticsItem(type, itemId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const current = await fetchLogistics(targetId);
  const list = current[type] || [];

  const updatedList = list.map(x => x.id === itemId ? { ...x, isArchived: true, status: 'archived' } : x);
  const updatedLogistics = {
    ...current,
    [type]: updatedList
  };

  await upsertFullLogistics(updatedLogistics, targetId);
  return true;
}

// ─────────────────────────────────────────────
//  REAL-TIME CLIENT-SIDE SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────

const _realtimeSubscribers = new Set();
let _eventzoneBroadcastChannel = null;

if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    _eventzoneBroadcastChannel = new BroadcastChannel('eventzone_realtime_channel');
    _eventzoneBroadcastChannel.onmessage = (event) => {
      const data = event.data || {};
      _realtimeSubscribers.forEach(cb => {
        try { cb(data); } catch (e) { console.warn("Realtime sync callback error:", e); }
      });
    };
  } catch (e) {
    console.warn("BroadcastChannel initialization notice:", e);
  }
}

export function broadcastRealtimeChange(type, payload, eventId = _activeEventId) {
  const message = { type, payload, eventId, timestamp: Date.now() };

  // 1. Notify local within-tab subscribers
  _realtimeSubscribers.forEach(cb => {
    try { cb(message); } catch (e) { console.warn("Local sync callback error:", e); }
  });

  // 2. Broadcast across browser tabs and windows
  if (_eventzoneBroadcastChannel) {
    try {
      _eventzoneBroadcastChannel.postMessage(message);
    } catch (e) {
      console.warn("Broadcast postMessage notice:", e);
    }
  }
}

export function subscribeToRealtimeSync(callback) {
  _realtimeSubscribers.add(callback);
  return () => {
    _realtimeSubscribers.delete(callback);
  };
}


