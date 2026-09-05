/**
 * db.js — Data Access Layer for Eventzone SaaS Platform
 *
 * Handles column-name mapping between the app's data model and the Supabase
 * schema, supporting multi-event multi-tenant isolation, user profiles, and visitor tickets.
 */

import { supabase, safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from './supabase';
import { sanitizeMediaUrl, sanitizeAnswersObject, deleteEventStorageFolder, uploadMedia } from './storage';

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

export async function fetchUserEvents(userId, userEmail = null) {
  if (!userId && !userEmail) {
    return [];
  }
  try {
    let matchingUserIds = [userId].filter(Boolean);
    if (userEmail && typeof userEmail === 'string' && userEmail.trim()) {
      try {
        const { data: siblingProfiles } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', userEmail.trim());
        if (Array.isArray(siblingProfiles) && siblingProfiles.length > 0) {
          siblingProfiles.forEach(p => {
            if (p.id && !matchingUserIds.includes(p.id)) {
              matchingUserIds.push(p.id);
            }
          });
        }
      } catch (profileErr) {
        console.warn("Sibling profile lookup note:", profileErr);
      }
    }

    let query = supabase.from('events').select('*');
    const filterConditions = [];
    matchingUserIds.forEach(id => {
      filterConditions.push(`organizer_id.eq.${id}`);
      filterConditions.push(`owner_id.eq.${id}`);
    });
    if (userEmail && typeof userEmail === 'string' && userEmail.trim()) {
      filterConditions.push(`contact_email.ilike.${userEmail.trim()}`);
    }

    if (filterConditions.length > 0) {
      query = query.or(filterConditions.join(','));
    }

    const { data, error } = await query.order('created_at', { ascending: false });
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
  const computedLocation = eventData.type === 'Virtual' 
    ? (eventData.virtualPlatform ? `${eventData.virtualPlatform} (Online)` : 'Online Virtual Event')
    : (eventData.location || 'Algiers, Algeria');

  const cleanSlug = eventData.slug 
    ? String(eventData.slug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '')
    : (eventData.title ? String(eventData.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : `event-${Date.now()}`);

  const row = {
    id: newId,
    slug: cleanSlug || `event-${Date.now()}`,
    name: eventData.title || 'Untitled Event',
    tagline: eventData.tagline || '',
    category: eventData.category || 'Technology & Software',
    location: computedLocation,
    type: eventData.type || 'In-Person',
    start_date: eventData.startDate || new Date().toISOString().split('T')[0],
    end_date: eventData.endDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    description: eventData.description || '',
    banner: eventData.banner || '',
    cover_url: eventData.banner || '',
    capacity: eventData.capacity || 500,
    status: eventData.status || 'published',
    organizer_id: userId || null,
    virtual_url: eventData.virtualUrl || '',
    virtual_platform: eventData.virtualPlatform || '',
    virtual_instructions: eventData.virtualInstructions || '',
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

// Organizers can permanently delete events (with cascading cleanup) or archive them
export async function permanentDeleteEvent(eventId) {
  if (!eventId || !isValidUuid(eventId)) return false;
  try {
    // Delete cascading items
    await supabase.from('participants').delete().eq('event_id', eventId);
    await supabase.from('sessions').delete().eq('event_id', eventId);
    await supabase.from('tickets').delete().eq('event_id', eventId);
    await supabase.from('floor_plans').delete().eq('event_id', eventId);
    await supabase.from('forms').delete().eq('event_id', eventId);
    await supabase.from('documents').delete().eq('event_id', eventId);
    await supabase.from('rsvps').delete().eq('event_id', eventId);
    await supabase.from('rsvp_settings').delete().eq('event_id', eventId);
    await supabase.from('sponsors').delete().eq('event_id', eventId);
    await supabase.from('exhibitors').delete().eq('event_id', eventId);
    await supabase.from('opportunities').delete().eq('event_id', eventId);
    await supabase.from('influencers').delete().eq('event_id', eventId);
    await supabase.from('team_members').delete().eq('event_id', eventId);
    await supabase.from('developer_api_keys').delete().eq('event_id', eventId);
    await supabase.from('developer_webhooks').delete().eq('event_id', eventId);
    await supabase.from('communications').delete().eq('event_id', eventId);
    await supabase.from('communication_templates').delete().eq('event_id', eventId);
    await supabase.from('event_logistics').delete().eq('event_id', eventId);
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;

    // Garbage Collection: Delete all media files stored under this event's prefix
    deleteEventStorageFolder(eventId).catch((e) => console.warn("Storage cleanup notice:", e));

    return true;
  } catch (err) {
    console.warn("permanentDeleteEvent error:", err);
    return false;
  }
}

export async function deleteEvent(eventId) {
  return await permanentDeleteEvent(eventId);
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

  const resolvedSlug = row.slug || (row.name ? String(row.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : (row.id || ''));

  return {
    id: row.id,
    slug: resolvedSlug,
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
    organizerId: row.organizer_id || row.organizerId || row.owner_id || null,
    organizer_id: row.organizer_id || row.organizerId || row.owner_id || null,
    owner_id: row.owner_id || row.organizer_id || null,
    ownerId: row.owner_id || row.organizer_id || null,
    youtubeUrl: row.youtube_url || row.video_url || '',
    videoUrl: row.video_url || row.youtube_url || '',
    gallery: parsedGallery,
  };
}

export async function fetchEventDetails(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  try {
    if (!targetId) return null;
    const isUuid = isValidUuid(targetId);
    if (isUuid) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`id.eq.${targetId},slug.eq.${targetId}`)
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        return mapEventFromDb(data);
      }
    }

    // 1. Direct match by slug (exact or case-insensitive)
    const { data: bySlug, error: slugErr } = await supabase
      .from('events')
      .select('*')
      .ilike('slug', String(targetId).trim())
      .limit(1)
      .maybeSingle();

    if (!slugErr && bySlug) {
      return mapEventFromDb(bySlug);
    }

    // 2. Flexible fallback: match against all events by slug, computed slug from name, or title
    const cleanSlugTarget = String(targetId).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const { data: allEvents, error: allErr } = await supabase
      .from('events')
      .select('*')
      .limit(100);

    if (!allErr && Array.isArray(allEvents) && allEvents.length > 0) {
      const matched = allEvents.find(ev => {
        if (!ev) return false;
        if (ev.id && String(ev.id).toLowerCase() === String(targetId).toLowerCase()) return true;
        if (ev.slug && String(ev.slug).toLowerCase().trim() === cleanSlugTarget) return true;
        const nameSlug = ev.name ? String(ev.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
        if (nameSlug && nameSlug === cleanSlugTarget) return true;
        const titleSlug = ev.title ? String(ev.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
        if (titleSlug && titleSlug === cleanSlugTarget) return true;
        return false;
      });

      if (matched) {
        return mapEventFromDb(matched);
      }
    }

    // 3. LocalStorage cache fallback if in browser environment
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`eventzone_cached_event_${targetId}`) || 
                       localStorage.getItem(`eventzone_cache_event_${targetId}`) ||
                       localStorage.getItem(`eventzone_cached_event_default-summit-2025`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.id || parsed.title)) return parsed;
        }

        const userEvents = localStorage.getItem("eventzone_user_events");
        if (userEvents) {
          const parsedList = JSON.parse(userEvents);
          if (Array.isArray(parsedList)) {
            const match = parsedList.find(e => 
              String(e.id) === String(targetId) || 
              String(e.slug) === String(targetId) ||
              (e.title && e.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') === cleanSlugTarget)
            );
            if (match) return match;
          }
        }
      } catch (e) {}
    }

    if (String(targetId) === "default-summit-2025" || String(targetId) === "myevent") {
      return {
        id: "default-summit-2025",
        slug: "default-summit-2025",
        title: "Eventzone Summit",
        tagline: "Premier International Technology & Innovation Summit",
        description: "Join industry leaders, founders, and innovators for groundbreaking keynotes, panels, and networking.",
        location: "Algiers Exhibition Center",
        venueName: "Algiers Exhibition Center",
        type: "Hybrid",
        startDate: "2026-10-12",
        endDate: "2026-10-14",
        banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"
      };
    }

    return null;
  } catch (err) {
    console.warn("fetchEventDetails error:", err.message);
    return null;
  }
}

export async function fetchEventBySlug(slug) {
  if (!slug) return null;
  return fetchEventDetails(slug);
}

export async function fetchEventBundle(eventId = _activeEventId) {
  let targetId = eventId || _activeEventId;
  if (!targetId) return null;

  try {
    // If targetId is not a UUID, resolve to event UUID first
    if (!isValidUuid(targetId)) {
      const ev = await fetchEventDetails(targetId);
      if (ev && ev.id && isValidUuid(ev.id)) {
        targetId = ev.id;
      } else {
        return null;
      }
    }

    const { data, error } = await supabase.rpc('get_event_bundle', { p_event_id: String(targetId) });
    if (error || !data || !data.event) {
      return null;
    }

    return {
      event: mapEventFromDb(data.event),
      tickets: (data.tickets || []).map(mapTicketFromDb),
      sessions: (data.sessions || []).map(mapSessionFromDb),
      sponsors: (data.sponsors || []).map(mapSponsorFromDb),
      exhibitors: (data.exhibitors || []).map(mapExhibitorFromDb),
      organizations: (data.organizations || []).map(mapOrgFromDb),
      forms: (data.forms || []).map(mapFormFromDb),
      floorPlans: (data.floor_plans || []).map(mapFloorPlanFromDb),
      rsvpSettings: data.rsvp_settings ? mapRsvpSettingsFromDb(data.rsvp_settings) : {},
      influencers: (data.influencers || []).map(mapInfluencerFromDb),
      opportunities: (data.opportunities || []).map(mapOpportunityFromDb),
      team: (data.team_members || []).map(mapTeamFromDb),
    };
  } catch (err) {
    console.warn("fetchEventBundle RPC notice:", err);
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
      if (details.slug) {
        basePayload.slug = String(details.slug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '');
      }
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

  const resolvedSlug = row.slug || (row.name ? String(row.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : (row.id || ''));

  return {
    id: row.id,
    slug: resolvedSlug,
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
    checkinPasscode: row.checkin_passcode || (row.id ? String(row.id).slice(0, 6).toUpperCase() : ''),
    checkin_passcode: row.checkin_passcode || (row.id ? String(row.id).slice(0, 6).toUpperCase() : ''),
    gallery: parsedGallery,
    portalStatus: row.portal_status || 'open',
    portal_status: row.portal_status || 'open',
    portalOpenTime: row.portal_open_time || '',
    portal_open_time: row.portal_open_time || '',
    portalMessage: row.portal_message || '',
    portal_message: row.portal_message || '',
    portalSettings: typeof row.portal_settings === 'object' && row.portal_settings !== null 
      ? row.portal_settings 
      : { networking: true, agenda: true, exhibitors: true, sponsors: true, floorplans: true, resources: true, announcements: true },
    portal_settings: typeof row.portal_settings === 'object' && row.portal_settings !== null 
      ? row.portal_settings 
      : { networking: true, agenda: true, exhibitors: true, sponsors: true, floorplans: true, resources: true, announcements: true },
    organizerId: row.organizer_id || row.organizerId || row.owner_id || null,
    organizer_id: row.organizer_id || row.organizerId || row.owner_id || null,
    ownerId: row.owner_id || row.organizer_id || null,
    owner_id: row.owner_id || row.organizer_id || null,
    is_hero_featured: Boolean(row.portal_settings?.is_hero_featured || row.is_hero_featured || row.isFeatured),
    isHeroFeatured: Boolean(row.portal_settings?.is_hero_featured || row.is_hero_featured || row.isFeatured),
    hero_order: Number(row.portal_settings?.hero_order ?? row.hero_order ?? 99),
    heroOrder: Number(row.portal_settings?.hero_order ?? row.hero_order ?? 99),
  };
}

function mapEventToDb(details) {
  const currentGallery = Array.isArray(details.gallery) ? details.gallery : [];
  const rawBanner = details.banner || (currentGallery.length > 0 ? currentGallery[0] : '') || '';
  const rawLogo = details.eventLogo || details.logo || '';
  const primaryBanner = sanitizeMediaUrl(rawBanner, '');
  const primaryLogo = sanitizeMediaUrl(rawLogo, '');

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

  if (details.slug !== undefined) {
    payload.slug = String(details.slug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '');
  }

  // Attach extended columns
  if (details.portalStatus !== undefined || details.portal_status !== undefined) {
    payload.portal_status = details.portalStatus || details.portal_status || 'open';
  }
  if (details.portalOpenTime !== undefined || details.portal_open_time !== undefined) {
    payload.portal_open_time = details.portalOpenTime || details.portal_open_time || null;
  }
  if (details.portalMessage !== undefined || details.portal_message !== undefined) {
    payload.portal_message = details.portalMessage || details.portal_message || '';
  }
  if (details.portalSettings !== undefined || details.portal_settings !== undefined || details.is_hero_featured !== undefined || details.isHeroFeatured !== undefined) {
    const existingSettings = details.portalSettings || details.portal_settings || { networking: true, agenda: true, exhibitors: true, sponsors: true, floorplans: true, resources: true, announcements: true };
    payload.portal_settings = {
      ...existingSettings,
      is_hero_featured: details.is_hero_featured !== undefined ? Boolean(details.is_hero_featured) : (details.isHeroFeatured !== undefined ? Boolean(details.isHeroFeatured) : Boolean(existingSettings.is_hero_featured)),
      hero_order: details.hero_order !== undefined ? Number(details.hero_order) : (details.heroOrder !== undefined ? Number(details.heroOrder) : Number(existingSettings.hero_order ?? 99))
    };
  }
  if (details.checkinPasscode !== undefined || details.checkin_passcode !== undefined) {
    payload.checkin_passcode = String(details.checkinPasscode || details.checkin_passcode || '').trim().toUpperCase();
  }
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

export async function permanentDeleteSession(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) console.warn("permanentDeleteSession notice:", error.message);
  } catch (e) {
    console.warn("permanentDeleteSession error:", e);
  }
}

export async function deleteSession(id) {
  return await permanentDeleteSession(id);
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

  let subsData = [];
  try {
    if (isValidUuid(targetId)) {
      const subsRes = await supabase.from('form_submissions').select('*').eq('event_id', targetId);
      if (subsRes && subsRes.data) subsData = subsRes.data;
    }
  } catch (err) {
    console.warn("fetchAttendees submissions notice:", err);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("fetchAttendees error:", error.message);
    return [];
  }

  const subs = subsData || [];
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
      if (sub.answers.orgId || sub.answers.org_id) {
        attendee.orgId = sub.answers.orgId || sub.answers.org_id;
        attendee.org_id = sub.answers.orgId || sub.answers.org_id;
      }
      if (!attendee.phone && (sub.answers.phone || sub.answers.f_core_phone || sub.answers.phoneNumber)) {
        attendee.phone = sub.answers.phone || sub.answers.f_core_phone || sub.answers.phoneNumber;
      }
      if (!attendee.image || attendee.image.includes('ui-avatars.com')) {
        const extractedPhoto = extractImageFromAnswers(sub.answers);
        if (extractedPhoto) {
          attendee.image = extractedPhoto;
          attendee.avatar = extractedPhoto;
          attendee.photo = extractedPhoto;
          attendee.badgePicture = extractedPhoto;
          attendee.badge_picture = extractedPhoto;
        }
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

    const answersData = sanitizeAnswersObject({
      ...(attendee.answers || attendee.customAnswers || attendee.formAnswers || {}),
      ...(attendee.company ? { company: attendee.company, f_company: attendee.company } : {}),
      ...(attendee.jobTitle ? { jobTitle: attendee.jobTitle, f_job_title: attendee.jobTitle } : {}),
      ...(attendee.orgId ? { orgId: attendee.orgId, org_id: attendee.orgId } : {})
    });

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
    mapped.orgId = attendee.orgId || answersData.orgId || answersData.org_id || null;
    mapped.org_id = attendee.orgId || answersData.orgId || answersData.org_id || null;
    return mapped;
  } catch (e) {
    console.warn("upsertAttendee error:", e);
    return { ...attendee, id: row.id };
  }
}

export async function archiveAttendee(idOrItem, emailParam, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let id = typeof idOrItem === 'object' && idOrItem ? idOrItem.id : idOrItem;
  let email = (
    emailParam || 
    (typeof idOrItem === 'object' && idOrItem ? idOrItem.email : '') || 
    (typeof idOrItem === 'string' && idOrItem.includes('@') ? idOrItem : '')
  );

  try {
    if (id && isValidUuid(id)) {
      await supabase.from('participants').update({ status_participation: 'archived' }).eq('id', id);
    }
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('participants').update({ status_participation: 'archived' }).ilike('email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }
  } catch (e) {
    console.warn("archiveAttendee error:", e);
  }
}

export async function permanentDeleteAttendee(idOrItem, emailParam, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let id = typeof idOrItem === 'object' && idOrItem ? idOrItem.id : idOrItem;
  let email = (
    emailParam || 
    (typeof idOrItem === 'object' && idOrItem ? idOrItem.email : '') || 
    (typeof idOrItem === 'string' && idOrItem.includes('@') ? idOrItem : '')
  );

  try {
    // 1. Delete from participants
    if (id && isValidUuid(id)) {
      await supabase.from('participants').delete().eq('id', id);
    }
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('participants').delete().ilike('email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }

    // 2. Delete from form_submissions so stale questionnaire records never block re-registration
    if (id && isValidUuid(id)) {
      await supabase.from('form_submissions').delete().eq('id', id);
    }
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('form_submissions').delete().ilike('respondent_email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }

    // 3. Delete from pending_registrations
    if (id && isValidUuid(id)) {
      await supabase.from('pending_registrations').delete().eq('id', id);
    }
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('pending_registrations').delete().ilike('email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }

    // 4. Delete from visitor_passes
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('visitor_passes').delete().ilike('email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }

    broadcastRealtimeChange('ATTENDEE_DELETED', { id, email }, targetId);
  } catch (e) {
    console.warn("permanentDeleteAttendee error:", e);
  }
}
export const deleteAttendee = permanentDeleteAttendee;

export function extractImageFromAnswers(answers = {}) {
  if (!answers || typeof answers !== "object") return "";
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "string" && v.trim()) {
      const val = v.trim();
      if (val.startsWith("data:image/") || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("blob:") || val.includes("/storage/v1/object/")) {
        return val;
      }
      const kLower = k.toLowerCase();
      if (kLower.includes("picture") || kLower.includes("photo") || kLower.includes("avatar") || kLower.includes("image")) {
        return val;
      }
    }
  }
  return "";
}

function mapAttendeeFromDb(row) {
  const isCheckedIn = Boolean(
    row.checked_in || 
    row.status_participation === 'checked_in' || 
    row.status_participation === 'checked-in'
  );
  const photo = row.image || row.avatar || row.avatar_url || row.avatarUrl || row.photo || row.photo_url || row.photoUrl || row.badge_picture || row.badge_photo || row.badgePicture || row.badgePhoto || row.profile_picture || row.profile_photo || row.profilePicture || row.profilePhoto || '';
  return {
    id: row.id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Attendee',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: row.email || '',
    phone: row.phone || '',
    ticketType: row.ticket_type || 'Standard Admission',
    ticket_type: row.ticket_type || 'Standard Admission',
    status: row.status_participation || (isCheckedIn ? 'checked-in' : 'registered'),
    isArchived: row.status_participation === 'archived',
    registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
    image: photo,
    avatar: photo,
    photo: photo,
    badgePicture: photo,
    badge_picture: photo,
    isSpeaker: !!row.is_speaker,
    checkedIn: isCheckedIn,
    checked_in: isCheckedIn,
    checkedInAt: row.checked_in_at || null,
    checked_in_at: row.checked_in_at || null,
    checkedInBy: row.checked_in_by || '',
    checked_in_by: row.checked_in_by || '',
    badgeCode: row.badge_code || (row.id ? `EZ-${String(row.id).slice(-4).toUpperCase()}` : 'EZ-PASS'),
    badge_code: row.badge_code || (row.id ? `EZ-${String(row.id).slice(-4).toUpperCase()}` : 'EZ-PASS'),
    referralCode: row.referral_code || '',
    referral_code: row.referral_code || '',
    influencerId: row.influencer_id || null,
    discountApplied: Number(row.discount_applied) || 0,
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
  const isCheckedIn = Boolean(
    attendee.checkedIn || 
    attendee.checked_in || 
    attendee.status === 'checked-in' || 
    attendee.status === 'checked_in'
  );
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    first_name: firstName,
    last_name: lastName,
    email: attendee.email,
    ticket_type: attendee.ticketType || attendee.ticket_type || 'Standard Admission',
    status_participation: attendee.isArchived ? 'archived' : (isCheckedIn ? 'checked_in' : (attendee.status || 'registered')),
    registered_at: attendee.registeredDate
      ? new Date(attendee.registeredDate).toISOString()
      : new Date().toISOString(),
    image: sanitizeMediaUrl(attendee.image || attendee.avatar || '', ''),
    is_speaker: !!attendee.isSpeaker,
    checked_in: isCheckedIn,
    checked_in_at: attendee.checkedInAt || attendee.checked_in_at || (isCheckedIn ? new Date().toISOString() : null),
    checked_in_by: attendee.checkedInBy || attendee.checked_in_by || null,
    badge_code: attendee.badgeCode || attendee.badge_code || `EZ-${String(validId).slice(-4).toUpperCase()}`,
    referral_code: attendee.referralCode || attendee.referral_code || null,
    influencer_id: isValidUuid(attendee.influencerId) ? attendee.influencerId : null,
    discount_applied: Number(attendee.discountApplied || attendee.discount_applied) || 0,
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

export async function deletePending(idOrItem, emailParam, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let id = typeof idOrItem === 'object' && idOrItem ? idOrItem.id : idOrItem;
  let email = (
    emailParam || 
    (typeof idOrItem === 'object' && idOrItem ? idOrItem.email : '') || 
    (typeof idOrItem === 'string' && idOrItem.includes('@') ? idOrItem : '')
  );

  try {
    if (id && isValidUuid(id)) {
      await supabase.from('pending_registrations').delete().eq('id', id);
    }
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('pending_registrations').delete().ilike('email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }

    // Also clean form_submissions for this rejected/deleted pending applicant
    if (id && isValidUuid(id)) {
      await supabase.from('form_submissions').delete().eq('id', id);
    }
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      let query = supabase.from('form_submissions').delete().ilike('respondent_email', cleanEmail);
      if (isValidUuid(targetId)) query = query.eq('event_id', targetId);
      await query;
    }

    broadcastRealtimeChange('PENDING_DELETED', { id, email }, targetId);
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

export async function fetchOrganizations(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let query = supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: true });

  if (isValidUuid(targetId)) {
    query = query.or(`event_id.eq.${targetId},event_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchOrganizations error:", error.message);
    return [];
  }
  const seenIds = new Set();
  const seenNames = new Set();
  const result = [];
  for (const row of data) {
    const org = mapOrgFromDb(row);
    const idKey = String(org.id || '');
    const nameKey = (org.name || '').trim().toLowerCase();
    if (idKey && seenIds.has(idKey)) continue;
    if (nameKey && seenNames.has(nameKey)) continue;
    if (idKey) seenIds.add(idKey);
    if (nameKey) seenNames.add(nameKey);
    result.push(org);
  }
  return result;
}

export async function upsertOrganization(org, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let targetOrgId = isValidUuid(org.id) ? org.id : null;

  if (!targetOrgId && org.name?.trim()) {
    try {
      const { data: matchedName } = await supabase
        .from('organizations')
        .select('id')
        .eq('event_id', targetId)
        .ilike('name', org.name.trim())
        .limit(1);
      if (matchedName && matchedName.length > 0) {
        targetOrgId = matchedName[0].id;
      }
    } catch (lookupErr) {
      // Ignore lookup error
    }
  }

  const row = mapOrgToDb({ ...org, id: targetOrgId || org.id }, targetId);
  try {
    const { data, error } = await supabase
      .from('organizations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertOrganization DB notice:", error.message);
      return { ...org, id: row.id, eventId: targetId };
    }
    return { ...mapOrgFromDb(data), ...org, id: data.id || row.id, eventId: targetId };
  } catch (e) {
    console.warn("upsertOrganization error:", e);
    return { ...org, id: row.id, eventId: targetId };
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
export async function permanentDeleteOrganization(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) console.warn("permanentDeleteOrganization notice:", error.message);
  } catch (e) {
    console.warn("permanentDeleteOrganization error:", e);
  }
}
export const deleteOrganization = permanentDeleteOrganization;

function mapOrgFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id || null,
    name: row.name || '',
    industry: row.industry || '',
    address: row.address || '',
    logo: row.logo || row.logo_url || '',
    contact: row.contact || row.contact_person || '',
    contactPerson: row.contact || row.contact_person || '',
    jobTitle: row.job_title || row.jobTitle || '',
    contactPosition: row.job_title || row.jobTitle || '',
    email: row.email || row.contact_email || '',
    contactEmail: row.email || row.contact_email || '',
    phone: row.phone || row.contact_phone || '',
    contactPhone: row.phone || row.contact_phone || '',
    website: row.website || '',
    description: row.description || '',
    notes: row.notes || '',
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapOrgToDb(org, eventId = _activeEventId) {
  const validId = isValidUuid(org.id) ? org.id : generateUuid();
  const targetEventId = isValidUuid(eventId) ? eventId : (isValidUuid(org.eventId) ? org.eventId : _activeEventId);
  return {
    id: validId,
    event_id: isValidUuid(targetEventId) ? targetEventId : undefined,
    name: org.name || '',
    industry: org.industry || '',
    address: org.address || '',
    logo: sanitizeMediaUrl(org.logo || org.logo_url || '', ''),
    logo_url: sanitizeMediaUrl(org.logo || org.logo_url || '', ''),
    contact: org.contact || org.contactPerson || '',
    job_title: org.jobTitle || org.contactPosition || org.job_title || '',
    email: org.email || org.contactEmail || '',
    phone: org.phone || org.contactPhone || '',
    website: org.website || '',
    description: org.description || '',
    notes: org.notes || '',
    status: org.status || (org.isArchived ? 'archived' : 'active'),
    created_at: org.created_at || new Date().toISOString(),
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
  const seenIds = new Set();
  const seenOrgIds = new Set();
  const seenNames = new Set();
  const result = [];
  for (const row of data) {
    const sponsor = mapSponsorFromDb(row);
    const idKey = String(sponsor.id || '');
    const orgIdKey = String(sponsor.orgId || sponsor.org_id || '');
    const nameKey = (sponsor.name || '').trim().toLowerCase();
    if (idKey && seenIds.has(idKey)) continue;
    if (orgIdKey && seenOrgIds.has(orgIdKey)) continue;
    if (nameKey && seenNames.has(nameKey)) continue;
    if (idKey) seenIds.add(idKey);
    if (orgIdKey) seenOrgIds.add(orgIdKey);
    if (nameKey) seenNames.add(nameKey);
    result.push(sponsor);
  }
  return result;
}

export async function upsertSponsor(sponsor, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let targetSponsorId = isValidUuid(sponsor.id) ? sponsor.id : null;

  if (!targetSponsorId) {
    try {
      const orgId = sponsor.orgId || sponsor.org_id;
      if (orgId && isValidUuid(orgId)) {
        const { data: matched } = await supabase
          .from('sponsors')
          .select('id')
          .eq('event_id', targetId)
          .eq('org_id', orgId)
          .limit(1);
        if (matched && matched.length > 0) {
          targetSponsorId = matched[0].id;
        }
      }
      if (!targetSponsorId && sponsor.name?.trim()) {
        const { data: matchedName } = await supabase
          .from('sponsors')
          .select('id')
          .eq('event_id', targetId)
          .ilike('name', sponsor.name.trim())
          .limit(1);
        if (matchedName && matchedName.length > 0) {
          targetSponsorId = matchedName[0].id;
        }
      }
    } catch (lookupErr) {
      // Ignore lookup error
    }
  }

  const row = mapSponsorToDb({ ...sponsor, id: targetSponsorId || sponsor.id }, targetId);
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
    return { ...mapSponsorFromDb(data), ...sponsor, id: data.id || row.id };
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
export async function permanentDeleteSponsor(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) console.warn("permanentDeleteSponsor notice:", error.message);
  } catch (e) {
    console.warn("permanentDeleteSponsor error:", e);
  }
}
export const deleteSponsor = permanentDeleteSponsor;

function mapSponsorFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id || null,
    name: row.name || '',
    tier: row.tier || 'silver',
    industry: row.industry || '',
    website: row.website || '',
    logo: row.logo || row.image_url || '',
    image: row.logo || row.image_url || '',
    orgId: row.org_id || null,
    contact: row.contact || row.contact_person || '',
    contactPerson: row.contact || row.contact_person || '',
    jobTitle: row.job_title || '',
    contactPosition: row.job_title || '',
    email: row.email || row.contact_email || '',
    contactEmail: row.email || row.contact_email || '',
    phone: row.phone || row.contact_phone || '',
    contactPhone: row.phone || row.contact_phone || '',
    amount: row.amount || null,
    currency: row.currency || 'DZD',
    booth: row.booth || '',
    perks: Array.isArray(row.perks) ? row.perks : [],
    notes: row.notes || '',
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapSponsorToDb(sponsor, eventId = _activeEventId) {
  const validId = isValidUuid(sponsor.id) ? sponsor.id : generateUuid();
  const targetEventId = eventId || sponsor.eventId || _activeEventId;
  const targetOrgId = isValidUuid(sponsor.orgId || sponsor.org_id) ? (sponsor.orgId || sponsor.org_id) : null;
  return {
    id: validId,
    event_id: targetEventId,
    name: sponsor.name,
    tier: sponsor.tier,
    industry: sponsor.industry,
    website: sponsor.website,
    image_url: sanitizeMediaUrl(sponsor.image || sponsor.logo || '', ''),
    org_id: targetOrgId,
    contact_person: sponsor.contact || sponsor.contactPerson,
    job_title: sponsor.jobTitle || sponsor.contactPosition,
    contact_email: sponsor.email || sponsor.contactEmail,
    contact_phone: sponsor.phone || sponsor.contactPhone,
    amount: sponsor.amount,
    currency: sponsor.currency,
    booth: sponsor.booth,
    perks: sponsor.perks,
    notes: sponsor.notes,
    status: sponsor.status || (sponsor.isArchived ? 'archived' : 'active'),
    created_at: sponsor.created_at || new Date().toISOString(),
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
  const seenIds = new Set();
  const seenOrgIds = new Set();
  const seenNames = new Set();
  const result = [];
  for (const row of data) {
    const exhibitor = mapExhibitorFromDb(row);
    const idKey = String(exhibitor.id || '');
    const orgIdKey = String(exhibitor.orgId || exhibitor.org_id || '');
    const nameKey = (exhibitor.name || '').trim().toLowerCase();
    if (idKey && seenIds.has(idKey)) continue;
    if (orgIdKey && seenOrgIds.has(orgIdKey)) continue;
    if (nameKey && seenNames.has(nameKey)) continue;
    if (idKey) seenIds.add(idKey);
    if (orgIdKey) seenOrgIds.add(orgIdKey);
    if (nameKey) seenNames.add(nameKey);
    result.push(exhibitor);
  }
  return result;
}

export async function upsertExhibitor(exhibitor, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let targetExhibitorId = isValidUuid(exhibitor.id) ? exhibitor.id : null;

  if (!targetExhibitorId) {
    try {
      const orgId = exhibitor.orgId || exhibitor.org_id;
      if (orgId && isValidUuid(orgId)) {
        const { data: matched } = await supabase
          .from('exhibitors')
          .select('id')
          .eq('event_id', targetId)
          .eq('org_id', orgId)
          .limit(1);
        if (matched && matched.length > 0) {
          targetExhibitorId = matched[0].id;
        }
      }
      if (!targetExhibitorId && exhibitor.name?.trim()) {
        const { data: matchedName } = await supabase
          .from('exhibitors')
          .select('id')
          .eq('event_id', targetId)
          .ilike('name', exhibitor.name.trim())
          .limit(1);
        if (matchedName && matchedName.length > 0) {
          targetExhibitorId = matchedName[0].id;
        }
      }
    } catch (lookupErr) {
      // Ignore lookup error
    }
  }

  const row = mapExhibitorToDb({ ...exhibitor, id: targetExhibitorId || exhibitor.id }, targetId);
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
    return { ...mapExhibitorFromDb(data), ...exhibitor };
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
export async function permanentDeleteExhibitor(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('exhibitors').delete().eq('id', id);
    if (error) console.warn("permanentDeleteExhibitor notice:", error.message);
  } catch (e) {
    console.warn("permanentDeleteExhibitor error:", e);
  }
}
export const deleteExhibitor = permanentDeleteExhibitor;

function mapExhibitorFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id || null,
    name: row.name || '',
    booth: row.booth_number || row.booth || '',
    boothNumber: row.booth_number || row.booth || '',
    boothType: row.booth_type || row.boothType || 'Standard 3x3m (9 m²)',
    industry: row.industry || '',
    contact: row.contact || row.contact_person || '',
    contactPerson: row.contact || row.contact_person || '',
    jobTitle: row.job_title || row.jobTitle || '',
    contactPosition: row.job_title || row.jobTitle || '',
    email: row.contact_email || row.email || '',
    contactEmail: row.contact_email || row.email || '',
    phone: row.phone || row.contact_phone || '',
    contactPhone: row.phone || row.contact_phone || '',
    logo: row.logo_url || row.logo || '',
    staffCount: row.staff_count || row.badge_count || 2,
    badgeCount: row.staff_count || row.badge_count || 2,
    products: row.products || row.description || '',
    description: row.products || row.description || '',
    notes: row.notes || '',
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
    booth_number: exhibitor.boothNumber || exhibitor.booth || '',
    booth: exhibitor.boothNumber || exhibitor.booth || '',
    booth_type: exhibitor.boothType || 'Standard 3x3m (9 m²)',
    staff_count: exhibitor.staffCount || exhibitor.badgeCount || 2,
    badge_count: exhibitor.staffCount || exhibitor.badgeCount || 2,
    description: exhibitor.description || exhibitor.products || '',
    products: exhibitor.description || exhibitor.products || '',
    industry: exhibitor.industry || '',
    job_title: exhibitor.jobTitle || exhibitor.contactPosition || '',
    contact_email: exhibitor.contactEmail || exhibitor.email || '',
    email: exhibitor.contactEmail || exhibitor.email || '',
    contact: exhibitor.contact || exhibitor.contactPerson || '',
    contact_person: exhibitor.contact || exhibitor.contactPerson || '',
    phone: exhibitor.phone || exhibitor.contactPhone || '',
    contact_phone: exhibitor.phone || exhibitor.contactPhone || '',
    notes: exhibitor.notes || '',
    logo_url: sanitizeMediaUrl(exhibitor.logo || exhibitor.logo_url || '', ''),
    org_id: isValidUuid(exhibitor.orgId) ? exhibitor.orgId : (isValidUuid(exhibitor.org_id) ? exhibitor.org_id : null),
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
export async function permanentDeleteOpportunity(id, eventId = _activeEventId) {
  if (!id || !isValidUuid(id)) return;
  const targetId = eventId || _activeEventId;
  try {
    const { error } = await supabase.from('opportunities').delete().eq('id', id);
    if (error) console.warn("permanentDeleteOpportunity notice:", error.message);
    broadcastRealtimeChange('OPPORTUNITY_DELETED', { id }, targetId);
  } catch (e) {
    console.warn("permanentDeleteOpportunity error:", e);
  }
}
export const deleteOpportunity = permanentDeleteOpportunity;

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
//  INFLUENCERS & AFFILIATES
// ─────────────────────────────────────────────

export async function fetchInfluencers(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  let query = supabase
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false });

  if (isValidUuid(targetId)) {
    query = query.eq('event_id', targetId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchInfluencers error:", error.message);
    return [];
  }
  return (data || []).map(mapInfluencerFromDb);
}

export async function upsertInfluencer(influencer, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapInfluencerToDb(influencer, targetId);
  try {
    const { data, error } = await supabase
      .from('influencers')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertInfluencer DB notice:", error.message);
      return { ...influencer, id: row.id };
    }
    const mapped = mapInfluencerFromDb(data);
    broadcastRealtimeChange('INFLUENCER_SAVED', mapped, targetId);
    return mapped;
  } catch (e) {
    console.warn("upsertInfluencer error:", e);
    return { ...influencer, id: row.id };
  }
}

export async function archiveInfluencer(id, eventId = _activeEventId) {
  if (!id || !isValidUuid(id)) return;
  const targetId = eventId || _activeEventId;
  try {
    const { error } = await supabase.from('influencers').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveInfluencer notice:", error.message);
    broadcastRealtimeChange('INFLUENCER_DELETED', { id }, targetId);
  } catch (e) {
    console.warn("archiveInfluencer error:", e);
  }
}
export async function permanentDeleteInfluencer(id, eventId = _activeEventId) {
  if (!id || !isValidUuid(id)) return;
  const targetId = eventId || _activeEventId;
  try {
    const { error } = await supabase.from('influencers').delete().eq('id', id);
    if (error) console.warn("permanentDeleteInfluencer notice:", error.message);
    broadcastRealtimeChange('INFLUENCER_DELETED', { id }, targetId);
  } catch (e) {
    console.warn("permanentDeleteInfluencer error:", e);
  }
}
export const deleteInfluencer = permanentDeleteInfluencer;

export async function recordInfluencerClick(eventId, code) {
  if (!code) return;
  const cleanCode = String(code).trim().toUpperCase();
  try {
    const { data: matched } = await supabase
      .from('influencers')
      .select('id, clicks')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (matched && matched.id) {
      const newClicks = (matched.clicks || 0) + 1;
      await supabase
        .from('influencers')
        .update({ clicks: newClicks, updated_at: new Date().toISOString() })
        .eq('id', matched.id);
      broadcastRealtimeChange('INFLUENCER_CLICK', { id: matched.id, clicks: newClicks }, eventId);
    }
  } catch (e) {
    console.warn("recordInfluencerClick notice:", e);
  }
}

function mapInfluencerFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id || '',
    name: row.name || '',
    code: (row.code || '').toUpperCase(),
    email: row.email || '',
    phone: row.phone || '',
    platform: row.platform || 'Instagram',
    handle: row.handle || '',
    avatar: row.avatar_url || '',
    avatarUrl: row.avatar_url || '',
    ticketId: row.ticket_id || null,
    ticketTier: row.ticket_tier || 'all',
    discountPercent: Number(row.discount_percent) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    commissionPercent: Number(row.commission_percent) || 0,
    commissionAmount: Number(row.commission_amount) || 0,
    targetGoal: row.target_goal !== undefined && row.target_goal !== null ? Number(row.target_goal) : 50,
    clicks: Number(row.clicks) || 0,
    payoutStatus: row.payout_status || 'unpaid',
    payoutNotes: row.payout_notes || '',
    status: row.status || 'active',
    isArchived: row.status === 'archived',
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapInfluencerToDb(influencer, eventId = _activeEventId) {
  const validId = isValidUuid(influencer.id) ? influencer.id : generateUuid();
  const validEventId = isValidUuid(eventId) ? eventId : (isValidUuid(influencer.eventId) ? influencer.eventId : undefined);
  const cleanCode = String(influencer.code || influencer.name || 'REF')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');

  return {
    id: validId,
    event_id: validEventId,
    name: influencer.name || 'Influencer Partner',
    code: cleanCode || `REF${Math.floor(1000 + Math.random() * 9000)}`,
    email: influencer.email || '',
    phone: influencer.phone || '',
    platform: influencer.platform || 'Instagram',
    handle: influencer.handle || '',
    avatar_url: influencer.avatar || influencer.avatarUrl || '',
    ticket_id: isValidUuid(influencer.ticketId) ? influencer.ticketId : null,
    ticket_tier: influencer.ticketTier || 'all',
    discount_percent: Number(influencer.discountPercent) || 0,
    discount_amount: Number(influencer.discountAmount) || 0,
    commission_percent: Number(influencer.commissionPercent) || 0,
    commission_amount: Number(influencer.commissionAmount) || 0,
    target_goal: influencer.targetGoal !== undefined ? Number(influencer.targetGoal) : 50,
    clicks: Number(influencer.clicks) || 0,
    payout_status: influencer.payoutStatus || 'unpaid',
    payout_notes: influencer.payoutNotes || '',
    status: influencer.isArchived ? 'archived' : (influencer.status || 'active'),
    notes: influencer.notes || '',
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

export async function permanentDeleteTicket(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) console.warn("permanentDeleteTicket notice:", error.message);
  } catch (e) {
    console.warn("permanentDeleteTicket error:", e);
  }
}

export async function deleteTicket(id) {
  return await permanentDeleteTicket(id);
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

export async function restoreFloorPlan(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('floor_plans').update({ status: 'published' }).eq('id', id);
    if (error) console.warn("restoreFloorPlan notice:", error.message);
  } catch (e) {
    console.warn("restoreFloorPlan error:", e);
  }
}

export async function permanentDeleteFloorPlan(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('floor_plans').delete().eq('id', id);
    if (error) console.warn("permanentDeleteFloorPlan notice:", error.message);
  } catch (e) {
    console.warn("permanentDeleteFloorPlan error:", e);
  }
}

export async function deleteFloorPlan(id) {
  return await permanentDeleteFloorPlan(id);
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
    status: row.status || 'published',
    isArchived: row.status === 'archived' || row.is_archived === true,
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
    // 1a. Check active registered participants (ignoring archived)
    try {
      const { data: existingParticipants } = await supabase
        .from('participants')
        .select('id, first_name, last_name, email, phone, status_participation')
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
          if (phoneToTest && part.phone && isMatchingPhoneNumber(part.phone, phoneToTest)) {
            return {
              success: false,
              error: "An attendee with this phone number is already registered for this event.",
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

    // 1c. Clean up any stale or orphan form_submissions for this email so they don't linger
    if (emailToTest) {
      try {
        await supabase
          .from('form_submissions')
          .delete()
          .ilike('respondent_email', emailToTest)
          .eq('event_id', targetEventId);
      } catch (_) {}
    }
  }

  const rawUserPhoto = visitorData.image || visitorData.avatar || visitorData.photo || visitorData.badgePicture || 
    (visitorData.customAnswers && Object.values(visitorData.customAnswers).find(v => typeof v === 'string' && (v.startsWith('http') || v.startsWith('/')))) || 
    (visitorData.answers && Object.values(visitorData.answers).find(v => typeof v === 'string' && (v.startsWith('http') || v.startsWith('/')))) || '';
  const userPhoto = sanitizeMediaUrl(rawUserPhoto, '');

  const referralCode = (visitorData.referralCode || visitorData.referral_code || visitorData.ref || visitorData.promoCode || visitorData.promo_code || '').trim().toUpperCase();
  const influencerId = isValidUuid(visitorData.influencerId || visitorData.influencer_id) ? (visitorData.influencerId || visitorData.influencer_id) : null;
  const discountApplied = Number(visitorData.discountApplied || visitorData.discount_applied) || 0;

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
      referralCode: referralCode || '',
      influencerId: influencerId || null,
      discountApplied: discountApplied || 0,
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
        referralCode: referralCode || '',
        influencerId: influencerId || null,
        discountApplied: discountApplied || 0,
        answers: visitorData.customAnswers || visitorData.answers || {}
      }, targetEventId);
    } catch (e) {
      console.warn("Supabase pending_registrations insert notice:", e);
    }

    const answersData = sanitizeAnswersObject({
      ...(visitorData.customAnswers || visitorData.answers || {}),
      ...(referralCode ? { _referral_code: referralCode } : {}),
      ...(discountApplied > 0 ? { _discount_applied: discountApplied } : {})
    });
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
      referralCode: referralCode || '',
      influencerId: influencerId || null,
      discountApplied: discountApplied || 0,
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
    image: userPhoto,
    referral_code: referralCode || null,
    influencer_id: influencerId,
    discount_applied: discountApplied
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

  const directAnswersData = {
    ...(visitorData.customAnswers || visitorData.answers || {}),
    ...(referralCode ? { _referral_code: referralCode } : {}),
    ...(discountApplied > 0 ? { _discount_applied: discountApplied } : {})
  };
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
    referralCode: referralCode || '',
    influencerId: influencerId || null,
    discountApplied: discountApplied || 0,
    answers: visitorData.customAnswers || visitorData.answers || {},
    company: visitorData.company || '',
    jobTitle: visitorData.jobTitle || '',
    phone: visitorData.phone || ''
  };
}

// ─────────────────────────────────────────────
//  STORAGE UPLOAD (SCENARIO B: CLOUD CDN STORAGE)
// ─────────────────────────────────────────────

export { uploadMedia };

export async function uploadProfileAvatar(file, userId) {
  if (!file) return null;
  return uploadMedia(file, 'avatars', userId ? `user_${userId}` : null);
}

export async function uploadFileToBucket(file, bucket = 'event-images', eventId = _activeEventId) {
  if (!file) return null;
  return uploadMedia(file, bucket || 'event-images', eventId || _activeEventId);
}

// ─────────────────────────────────────────────
//  COMMUNICATIONS & BROADCAST TRACKING
// ─────────────────────────────────────────────

export async function logCommunication(payload, eventId = _activeEventId) {
  const targetId = payload?.eventId || eventId || _activeEventId;
  const subject = payload?.subject || "Email Notification";
  const body = payload?.body || payload?.preview || "";
  const recipientCount = payload?.recipientCount !== undefined ? payload.recipientCount : (payload?.recipientEmail ? 1 : 0);
  const recipientGroup = payload?.recipientGroup || (payload?.recipientEmail ? "attendee" : "all");
  const htmlContent = payload?.htmlContent || null;
  const templateId = payload?.templateId || payload?.channel || null;
  const includeQr = Boolean(payload?.includeQr);
  const buttonConfig = payload?.buttonConfig ? (typeof payload.buttonConfig === 'object' ? JSON.stringify(payload.buttonConfig) : payload.buttonConfig) : null;

  const row = {
    event_id: isValidUuid(targetId) ? targetId : null,
    subject,
    body,
    html_content: htmlContent,
    recipient_count: recipientCount,
    recipient_group: recipientGroup,
    template_id: templateId,
    include_qr: includeQr,
    button_config: buttonConfig,
    status: 'Sent',
    opens_count: 0,
    unique_opens_count: 0,
    sent_at: new Date().toISOString(),
  };

  const { data: comm, error } = await supabase
    .from('communications')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.warn("logCommunication error:", error.message);
    return null;
  }

  // If individual recipient email is provided, create a recipient tracking log entry
  if (comm && payload?.recipientEmail && payload.recipientEmail.includes('@')) {
    try {
      await supabase.from('communication_recipients').insert({
        communication_id: comm.id,
        event_id: isValidUuid(targetId) ? targetId : null,
        recipient_email: payload.recipientEmail.trim(),
        recipient_name: payload.recipientName || '',
        recipient_role: payload.role || 'attendee',
        status: 'sent',
        open_count: 0
      });
    } catch (e) {
      console.warn("Error inserting single recipient log in logCommunication:", e);
    }
  }

  return comm;
}

export async function logCommunicationWithRecipients({
  subject,
  body,
  htmlContent = null,
  recipientGroup = 'all',
  recipientFilter = null,
  templateId = null,
  includeQr = false,
  buttonConfig = null,
  recipients = []
}, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = {
    event_id: isValidUuid(targetId) ? targetId : null,
    subject: subject,
    body: body,
    html_content: htmlContent,
    recipient_count: recipients.length,
    recipient_group: recipientGroup,
    recipient_filter: recipientFilter ? JSON.stringify(recipientFilter) : null,
    template_id: templateId,
    include_qr: Boolean(includeQr),
    button_config: buttonConfig ? (typeof buttonConfig === 'object' ? JSON.stringify(buttonConfig) : buttonConfig) : null,
    status: 'Sent',
    opens_count: 0,
    unique_opens_count: 0,
    sent_at: new Date().toISOString(),
  };

  const { data: comm, error: commError } = await supabase
    .from('communications')
    .insert(row)
    .select()
    .single();

  if (commError) throw new Error(commError.message);

  if (recipients.length > 0) {
    const recipientRows = recipients.map((r) => {
      const email = typeof r === 'string' ? r : r.email;
      const name = typeof r === 'object' ? r.name : '';
      const role = typeof r === 'object' ? r.role : 'attendee';
      return {
        communication_id: comm.id,
        event_id: isValidUuid(targetId) ? targetId : null,
        recipient_email: email,
        recipient_name: name || '',
        recipient_role: role || 'attendee',
        status: 'sent',
        open_count: 0
      };
    }).filter(r => r.recipient_email && r.recipient_email.includes('@'));

    if (recipientRows.length > 0) {
      const { error: recError } = await supabase
        .from('communication_recipients')
        .insert(recipientRows);
      if (recError) {
        console.warn("Error inserting communication_recipients:", recError.message);
      }
    }
  }

  return comm;
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

export async function fetchCommunicationsWithStats(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (!isValidUuid(targetId)) return [];
  try {
    const { data: comms, error } = await supabase
      .from('communications')
      .select('*, communication_recipients(id, status, open_count, opened_at, last_opened_at, recipient_email, recipient_name, recipient_role)')
      .eq('event_id', targetId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.warn("fetchCommunicationsWithStats error, falling back to base fetch:", error.message);
      return await fetchCommunications(targetId);
    }

    return (comms || []).map(comm => {
      const logs = comm.communication_recipients || [];
      const openedLogs = logs.filter(l => (l.open_count > 0) || l.status === 'opened' || l.opened_at);
      const uniqueOpens = openedLogs.length;
      const totalOpens = logs.reduce((sum, l) => sum + (l.open_count || 0), 0);
      const recipientCount = comm.recipient_count || logs.length || 0;
      const openRate = recipientCount > 0 ? Math.round((uniqueOpens / recipientCount) * 100) : 0;

      return {
        ...comm,
        recipient_count: recipientCount,
        unique_opens_count: uniqueOpens,
        opens_count: totalOpens || comm.opens_count || 0,
        open_rate: openRate,
        recipients_log: logs
      };
    });
  } catch (e) {
    console.warn("fetchCommunicationsWithStats exception:", e);
    return [];
  }
}

export async function fetchCommunicationRecipientLogs(communicationId) {
  if (!communicationId) return [];
  try {
    const { data, error } = await supabase
      .from('communication_recipients')
      .select('*')
      .eq('communication_id', communicationId)
      .order('opened_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.warn("fetchCommunicationRecipientLogs error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchCommunicationRecipientLogs exception:", e);
    return [];
  }
}

export async function deleteCommunication(communicationId) {
  if (!communicationId) return false;
  try {
    const { error } = await supabase
      .from('communications')
      .delete()
      .eq('id', communicationId);
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    console.error("deleteCommunication error:", e);
    throw e;
  }
}

export async function saveCustomEmailTemplate(templateData, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = {
    event_id: isValidUuid(targetId) ? targetId : null,
    name: templateData.name || templateData.title || 'Untitled Template',
    description: templateData.description || '',
    category: templateData.category || 'custom',
    subject: templateData.subject || '',
    preheader: templateData.preheader || '',
    body: templateData.body || '',
    include_qr: Boolean(templateData.includeQr || templateData.include_qr),
    trigger_id: templateData.trigger_id || templateData.triggerId || null,
    is_trigger: Boolean(templateData.is_trigger || templateData.isTrigger),
    button_config: templateData.buttonConfig || templateData.button_config 
      ? (typeof (templateData.buttonConfig || templateData.button_config) === 'object' 
          ? JSON.stringify(templateData.buttonConfig || templateData.button_config) 
          : (templateData.buttonConfig || templateData.button_config)) 
      : null
  };

  if (templateData.id && isValidUuid(templateData.id)) {
    const { data, error } = await supabase
      .from('communication_templates')
      .update(row)
      .eq('id', templateData.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  } else {
    const { data, error } = await supabase
      .from('communication_templates')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export async function fetchCustomEmailTemplates(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  try {
    let query = supabase.from('communication_templates').select('*');
    if (isValidUuid(targetId)) {
      query = query.or(`event_id.eq.${targetId},event_id.is.null`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn("fetchCustomEmailTemplates error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchCustomEmailTemplates exception:", e);
    return [];
  }
}

export async function deleteCustomEmailTemplate(templateId) {
  if (!templateId) return false;
  try {
    const { error } = await supabase
      .from('communication_templates')
      .delete()
      .eq('id', templateId);
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    console.error("deleteCustomEmailTemplate error:", e);
    throw e;
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

export async function permanentDeleteForm(id, eventId = _activeEventId) {
  if (!id) return;
  const targetId = eventId || _activeEventId;
  _cachedForms = _cachedForms.filter(f => f.id !== id);
  broadcastRealtimeChange('FORM_DELETED', { id }, targetId);

  if (isValidUuid(id)) {
    try {
      await supabase.from('form_submissions').delete().eq('form_id', id);
      const { error } = await supabase.from('forms').delete().eq('id', id);
      if (error) {
        console.error("permanentDeleteForm DB exception:", error.message);
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("permanentDeleteForm exception:", e);
      throw e;
    }
  }
}

export async function deleteForm(id, eventId = _activeEventId) {
  return await permanentDeleteForm(id, eventId);
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

export const STARTER_RSVPS = [];

let _cachedRsvps = [];
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

      if (!error && data) {
        return data.map(mapRsvpFromDb);
      }
    } catch (e) {
      console.warn("fetchRSVPs DB query exception:", e);
    }
  }

  const matching = _cachedRsvps.filter(r => r.eventId === targetId);
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
      if (extraUpdates.plusOnesNames !== undefined) dbUpdates.plus_ones_names = extraUpdates.plusOnesNames;
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

export async function permanentDeleteRSVP(rsvpId, eventId = _activeEventId) {
  if (!rsvpId) return;
  const targetId = eventId || _activeEventId;
  _cachedRsvps = _cachedRsvps.filter(r => r.id !== rsvpId);
  broadcastRealtimeChange('RSVP_DELETED', { id: rsvpId }, targetId);

  if (isValidUuid(rsvpId)) {
    try {
      await supabase.from('rsvps').delete().eq('id', rsvpId);
    } catch (e) {
      console.warn("permanentDeleteRSVP DB exception:", e);
    }
  }
}

export async function deleteRSVP(rsvpId, eventId = _activeEventId) {
  return await permanentDeleteRSVP(rsvpId, eventId);
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
  inventory: [],
  vendors: [],
  travel: [],
  runOfShow: [],
  checklists: [],
  incidents: []
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

// ─────────────────────────────────────────────
//  DOCUMENTS & MEDIA ASSETS MANAGEMENT
// ─────────────────────────────────────────────

export const STARTER_DOCUMENTS = [];

let _cachedDocumentsByEvent = {};

function mapDocumentFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name || 'Untitled Document',
    fileName: row.file_name || row.fileName || '',
    fileUrl: row.file_url || row.fileUrl || '',
    fileSize: Number(row.file_size || row.fileSize || 0),
    fileType: row.file_type || row.fileType || 'pdf',
    mimeType: row.mime_type || row.mimeType || '',
    category: row.category || 'General',
    accessLevel: row.access_level || row.accessLevel || 'team',
    description: row.description || '',
    uploadedBy: row.uploaded_by || row.uploadedBy || 'Organizer',
    isPinned: Boolean(row.is_pinned ?? row.isPinned ?? false),
    isArchived: Boolean(row.is_archived ?? row.isArchived ?? false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export async function fetchDocuments(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  // 1. Try fetching from Supabase database
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('event_id', targetId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDocumentFromDb);
        _cachedDocumentsByEvent[targetId] = mapped;
        if (typeof window !== 'undefined') {
          safeLocalStorageSet(`eventzone_documents_${targetId}`, mapped);
        }
        return mapped;
      }
    } catch (e) {
      console.warn("fetchDocuments DB notice (using cache/local):", e);
    }
  }

  // 2. Check in-memory cache
  if (_cachedDocumentsByEvent[targetId]) {
    return _cachedDocumentsByEvent[targetId];
  }

  // 3. Check localStorage cache
  if (typeof window !== 'undefined') {
    const local = safeLocalStorageGet(`eventzone_documents_${targetId}`);
    if (local && Array.isArray(local)) {
      _cachedDocumentsByEvent[targetId] = local;
      return local;
    }
  }

  return [];
}

export async function upsertDocument(doc, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const docId = doc.id && doc.id.length > 3 ? doc.id : generateUuid();
  const now = new Date().toISOString();

  const formattedDoc = {
    ...doc,
    id: docId,
    eventId: targetId,
    name: doc.name || doc.fileName || 'Untitled Document',
    fileName: doc.fileName || doc.name || '',
    fileUrl: doc.fileUrl || '',
    fileSize: Number(doc.fileSize || 0),
    fileType: doc.fileType || 'pdf',
    mimeType: doc.mimeType || '',
    category: doc.category || 'General',
    accessLevel: doc.accessLevel || 'team',
    description: doc.description || '',
    uploadedBy: doc.uploadedBy || 'Organizer',
    isPinned: Boolean(doc.isPinned),
    isArchived: Boolean(doc.isArchived),
    updatedAt: now,
    createdAt: doc.createdAt || now,
  };

  // 1. Persist to Supabase if valid UUID
  if (isValidUuid(targetId) && isValidUuid(docId)) {
    try {
      const row = {
        id: docId,
        event_id: targetId,
        name: formattedDoc.name,
        file_name: formattedDoc.fileName,
        file_url: formattedDoc.fileUrl,
        file_size: formattedDoc.fileSize,
        file_type: formattedDoc.fileType,
        mime_type: formattedDoc.mimeType,
        category: formattedDoc.category,
        access_level: formattedDoc.accessLevel,
        description: formattedDoc.description,
        uploaded_by: formattedDoc.uploadedBy,
        is_pinned: formattedDoc.isPinned,
        is_archived: formattedDoc.isArchived,
        created_at: formattedDoc.createdAt,
        updated_at: now,
      };

      const { error } = await supabase
        .from('documents')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.warn("Supabase upsertDocument warning:", error.message);
      }
    } catch (e) {
      console.warn("upsertDocument DB network notice:", e);
    }
  }

  // 2. Update in-memory and local storage cache
  const current = await fetchDocuments(targetId);
  const exists = current.some(d => d.id === docId);
  const updatedList = exists
    ? current.map(d => d.id === docId ? formattedDoc : d)
    : [formattedDoc, ...current];

  _cachedDocumentsByEvent[targetId] = updatedList;
  if (typeof window !== 'undefined') {
    safeLocalStorageSet(`eventzone_documents_${targetId}`, updatedList);
  }

  // 3. Broadcast real-time change
  broadcastRealtimeChange('DOCUMENT_SAVED', formattedDoc, targetId);
  return formattedDoc;
}

export async function deleteDocument(docId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  // 1. Supabase deletion
  if (isValidUuid(targetId) && isValidUuid(docId)) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('event_id', targetId);

      if (error) {
        console.warn("Supabase deleteDocument warning:", error.message);
      }
    } catch (e) {
      console.warn("deleteDocument DB notice:", e);
    }
  }

  // 2. Cache update
  const current = await fetchDocuments(targetId);
  const updatedList = current.filter(d => d.id !== docId);
  _cachedDocumentsByEvent[targetId] = updatedList;
  if (typeof window !== 'undefined') {
    safeLocalStorageSet(`eventzone_documents_${targetId}`, updatedList);
  }

  // 3. Broadcast
  broadcastRealtimeChange('DOCUMENT_DELETED', { id: docId }, targetId);
  return true;
}
export const permanentDeleteDocument = deleteDocument;

export async function archiveDocument(docId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const current = await fetchDocuments(targetId);
  const match = current.find(d => d.id === docId);
  if (!match) return false;

  const updated = {
    ...match,
    isArchived: true,
    status: 'archived',
    updatedAt: new Date().toISOString()
  };

  return await upsertDocument(updated, targetId);
}

export async function unarchiveDocument(docId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const current = await fetchDocuments(targetId);
  const match = current.find(d => d.id === docId);
  if (!match) return false;

  const updated = {
    ...match,
    isArchived: false,
    status: 'published',
    updatedAt: new Date().toISOString()
  };

  return await upsertDocument(updated, targetId);
}

export async function togglePinDocument(docId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const current = await fetchDocuments(targetId);
  const match = current.find(d => d.id === docId);
  if (!match) return false;

  const updated = {
    ...match,
    isPinned: !match.isPinned,
    updatedAt: new Date().toISOString()
  };

  return await upsertDocument(updated, targetId);
}

// ─────────────────────────────────────────────
//  DEVELOPER API KEYS & WEBHOOKS
// ─────────────────────────────────────────────

export async function fetchEventApiKeys(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (!isValidUuid(targetId)) {
    const cached = safeLocalStorageGet(`eventzone_api_keys_${targetId}`, []);
    return cached;
  }
  try {
    const { data, error } = await supabase
      .from('developer_api_keys')
      .select('*')
      .eq('event_id', targetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("fetchEventApiKeys DB error:", error.message);
      return safeLocalStorageGet(`eventzone_api_keys_${targetId}`, []);
    }
    return (data || []).map(k => ({
      id: k.id,
      eventId: k.event_id,
      name: k.name,
      key: k.key,
      keyPrefix: k.key_prefix,
      permissions: k.permissions || 'read_write',
      createdAt: k.created_at,
      lastUsedAt: k.last_used_at,
      isActive: k.is_active !== false,
    }));
  } catch (e) {
    console.warn("fetchEventApiKeys error:", e);
    return safeLocalStorageGet(`eventzone_api_keys_${targetId}`, []);
  }
}

export async function createEventApiKey(eventId = _activeEventId, name = "Default API Key", permissions = "read_write") {
  const targetId = eventId || _activeEventId;
  const rawId = generateUuid();
  const secretRandom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const fullKey = `ez_live_${secretRandom}`;
  const keyPrefix = fullKey.substring(0, 12) + "..." + fullKey.substring(fullKey.length - 4);

  const newKeyObj = {
    id: rawId,
    event_id: isValidUuid(targetId) ? targetId : null,
    name: name || "Website Widget Key",
    key: fullKey,
    key_prefix: keyPrefix,
    permissions: permissions || "read_write",
    created_at: new Date().toISOString(),
    is_active: true
  };

  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('developer_api_keys')
        .insert(newKeyObj)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          eventId: data.event_id,
          name: data.name,
          key: data.key,
          keyPrefix: data.key_prefix,
          permissions: data.permissions,
          createdAt: data.created_at,
          isActive: data.is_active
        };
      }
    } catch (e) {
      console.warn("createEventApiKey DB error:", e);
    }
  }

  // Fallback to localStorage
  const current = safeLocalStorageGet(`eventzone_api_keys_${targetId}`, []);
  const updated = [newKeyObj, ...current];
  safeLocalStorageSet(`eventzone_api_keys_${targetId}`, updated);
  return newKeyObj;
}

export async function deleteEventApiKey(keyId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (isValidUuid(keyId) && isValidUuid(targetId)) {
    try {
      await supabase.from('developer_api_keys').delete().eq('id', keyId);
    } catch (e) {
      console.warn("deleteEventApiKey DB error:", e);
    }
  }
  const current = safeLocalStorageGet(`eventzone_api_keys_${targetId}`, []);
  const updated = current.filter(k => k.id !== keyId);
  safeLocalStorageSet(`eventzone_api_keys_${targetId}`, updated);
  return true;
}

export async function fetchEventWebhooks(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (!isValidUuid(targetId)) {
    return safeLocalStorageGet(`eventzone_webhooks_${targetId}`, []);
  }
  try {
    const { data, error } = await supabase
      .from('developer_webhooks')
      .select('*')
      .eq('event_id', targetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("fetchEventWebhooks DB error:", error.message);
      return safeLocalStorageGet(`eventzone_webhooks_${targetId}`, []);
    }
    return (data || []).map(w => ({
      id: w.id,
      eventId: w.event_id,
      url: w.url,
      secret: w.secret,
      events: Array.isArray(w.events) ? w.events : ["registration.created", "registration.pending"],
      isActive: w.is_active !== false,
      createdAt: w.created_at
    }));
  } catch (e) {
    console.warn("fetchEventWebhooks error:", e);
    return safeLocalStorageGet(`eventzone_webhooks_${targetId}`, []);
  }
}

export async function saveEventWebhook(eventId = _activeEventId, webhookData) {
  const targetId = eventId || _activeEventId;
  const rawId = webhookData.id && isValidUuid(webhookData.id) ? webhookData.id : generateUuid();
  const secretRandom = webhookData.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`;

  const webhookRow = {
    id: rawId,
    event_id: isValidUuid(targetId) ? targetId : null,
    url: webhookData.url,
    secret: secretRandom,
    events: webhookData.events || ["registration.created", "registration.pending"],
    is_active: webhookData.isActive !== false,
    created_at: webhookData.createdAt || new Date().toISOString()
  };

  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('developer_webhooks')
        .upsert(webhookRow, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          eventId: data.event_id,
          url: data.url,
          secret: data.secret,
          events: data.events,
          isActive: data.is_active,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.warn("saveEventWebhook DB error:", e);
    }
  }

  // Fallback to localStorage
  const current = safeLocalStorageGet(`eventzone_webhooks_${targetId}`, []);
  const exists = current.some(w => w.id === rawId);
  const updated = exists ? current.map(w => w.id === rawId ? webhookRow : w) : [webhookRow, ...current];
  safeLocalStorageSet(`eventzone_webhooks_${targetId}`, updated);
  return webhookRow;
}

export async function deleteEventWebhook(webhookId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (isValidUuid(webhookId) && isValidUuid(targetId)) {
    try {
      await supabase.from('developer_webhooks').delete().eq('id', webhookId);
    } catch (e) {
      console.warn("deleteEventWebhook DB error:", e);
    }
  }
  const current = safeLocalStorageGet(`eventzone_webhooks_${targetId}`, []);
  const updated = current.filter(w => w.id !== webhookId);
  safeLocalStorageSet(`eventzone_webhooks_${targetId}`, updated);
  return true;
}

// ─────────────────────────────────────────────
//  MOBILE CHECK-IN & PASSCODE AUTHENTICATION
// ─────────────────────────────────────────────

export async function verifyCheckinAuth({ email, passcode, eventId = null }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPasscode = (passcode || '').trim().toUpperCase();

  if (!cleanEmail || !cleanPasscode) {
    return { success: false, error: "Please provide both staff email and event passcode." };
  }

  try {
    let candidateEvents = [];

    // 1. If eventId (UUID or slug) is provided
    if (eventId) {
      const idStr = String(eventId).trim();
      let query = supabase.from('events').select('*');
      if (isValidUuid(idStr)) {
        query = query.eq('id', idStr);
      } else {
        query = query.eq('slug', idStr);
      }
      const { data: evList } = await query;
      if (evList && evList.length > 0) {
        candidateEvents = evList;
      }
    }

    // 2. If no eventId, look up events whose passcode matches cleanPasscode
    if (candidateEvents.length === 0) {
      const { data: matchedByPass, error } = await supabase
        .from('events')
        .select('*')
        .ilike('checkin_passcode', cleanPasscode);

      if (!error && matchedByPass && matchedByPass.length > 0) {
        candidateEvents = matchedByPass;
      } else {
        // Fallback check if passcode matches first 6 chars of an event UUID
        const { data: syntheticMatches } = await supabase
          .from('events')
          .select('*')
          .ilike('id', `${cleanPasscode.toLowerCase()}%`)
          .limit(5);

        if (syntheticMatches && syntheticMatches.length > 0) {
          candidateEvents = syntheticMatches;
        }
      }
    }

    if (candidateEvents.length === 0) {
      return { success: false, error: "Invalid event passcode. Please verify the 6-character event passcode." };
    }

    // 3. For candidate events, verify staff/organizer authorization
    let matchedEvent = null;
    let matchedStaff = null;

    // Fetch organizer profile once
    const { data: profileList } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1);
    const organizerProfile = profileList && profileList[0] ? profileList[0] : null;

    for (const rawEv of candidateEvents) {
      const evPass = (rawEv.checkin_passcode || "").trim().toUpperCase();
      const syntheticPass = (rawEv.id ? String(rawEv.id).slice(0, 6).toUpperCase() : "");
      const isPassValid = (evPass && evPass === cleanPasscode) || (syntheticPass && syntheticPass === cleanPasscode);

      if (!isPassValid && eventId) {
        continue;
      }

      // Check team members
      try {
        const { data: tm } = await supabase
          .from('team_members')
          .select('*')
          .eq('event_id', rawEv.id)
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (tm) {
          matchedEvent = mapEventFromDb(rawEv);
          matchedStaff = {
            id: tm.id,
            name: tm.name || `${tm.first_name || ''} ${tm.last_name || ''}`.trim() || 'Staff',
            email: tm.email,
            role: tm.role || 'Check-in Staff',
            department: tm.department || 'Operations',
            avatar: tm.avatar || ''
          };
          break;
        }
      } catch (tmErr) {}

      // Check organizer profile
      if (organizerProfile && (rawEv.organizer_id === organizerProfile.id || rawEv.owner_id === organizerProfile.id)) {
        matchedEvent = mapEventFromDb(rawEv);
        matchedStaff = {
          id: organizerProfile.id,
          name: organizerProfile.full_name || 'Event Organizer',
          email: cleanEmail,
          role: 'Event Organizer',
          department: 'Executive'
        };
        break;
      }

      // Check contact email
      if (rawEv.contact_email && rawEv.contact_email.trim().toLowerCase() === cleanEmail) {
        matchedEvent = mapEventFromDb(rawEv);
        matchedStaff = {
          id: rawEv.id,
          name: rawEv.organizer_name || 'Event Organizer',
          email: cleanEmail,
          role: 'Event Organizer',
          department: 'Executive'
        };
        break;
      }
    }

    // Fallback: If passcode is exact match for single event, allow gate staff
    if (!matchedEvent && candidateEvents.length === 1) {
      const singleEv = candidateEvents[0];
      const evPass = (singleEv.checkin_passcode || "").trim().toUpperCase();
      const syntheticPass = (singleEv.id ? String(singleEv.id).slice(0, 6).toUpperCase() : "");
      if ((evPass && evPass === cleanPasscode) || (syntheticPass && syntheticPass === cleanPasscode)) {
        matchedEvent = mapEventFromDb(singleEv);
        matchedStaff = {
          id: cleanEmail,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'Gate Staff',
          department: 'Operations'
        };
      }
    }

    if (!matchedEvent || !matchedStaff) {
      return { 
        success: false, 
        error: "Access Denied: This email address is not registered as authorized staff for this event." 
      };
    }

    const sessionPayload = {
      email: cleanEmail,
      passcode: cleanPasscode,
      eventId: matchedEvent.id,
      eventTitle: matchedEvent.title,
      staffName: matchedStaff.name,
      staffRole: matchedStaff.role,
      loginTime: new Date().toISOString()
    };

    return {
      success: true,
      event: matchedEvent,
      staff: matchedStaff,
      session: sessionPayload
    };
  } catch (err) {
    console.error("verifyCheckinAuth exception:", err);
    return { success: false, error: err.message || "Authentication error occurred." };
  }
}

export async function fetchCheckinAttendees(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  try {
    let resolvedId = targetId;
    if (targetId && !isValidUuid(targetId)) {
      try {
        const { data: ev } = await supabase.from('events').select('id').eq('slug', targetId).maybeSingle();
        if (ev && ev.id && isValidUuid(ev.id)) {
          resolvedId = ev.id;
        }
      } catch {}
    }

    if (!resolvedId || !isValidUuid(resolvedId)) {
      return [];
    }

    let query = supabase
      .from('participants')
      .select('*')
      .eq('event_id', resolvedId)
      .neq('status_participation', 'archived')
      .order('registered_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn("fetchCheckinAttendees query error:", error.message);
    }

    // Also query rsvps table scoped strictly to this event
    let rsvps = [];
    try {
      const { data: rData } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', resolvedId);

      if (rData && rData.length > 0) {
        rsvps = rData;
      }
    } catch {}

    const participantList = (data || []).map(mapAttendeeFromDb);
    const rsvpList = (rsvps || []).map(mapAttendeeFromDb);

    // Merge without duplicates
    const seen = new Set();
    const combined = [];
    for (const a of [...participantList, ...rsvpList]) {
      const key = a.id || a.email;
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(a);
      }
    }

    return combined;
  } catch (e) {
    console.warn("fetchCheckinAttendees error:", e);
    return [];
  }
}

export async function toggleAttendeeCheckin({ eventId = _activeEventId, attendeeId, checkedIn = true, checkedInBy = '' }) {
  if (!attendeeId) return { success: false, error: "Missing attendee ID" };
  const targetId = eventId || _activeEventId;
  const now = checkedIn ? new Date().toISOString() : null;

  try {
    const updatePayload = {
      checked_in: !!checkedIn,
      checked_in_at: now,
      checked_in_by: checkedIn ? (checkedInBy || 'Staff') : null,
      status_participation: checkedIn ? 'checked_in' : 'registered'
    };

    // 1. Try updating in participants table
    let query = supabase.from('participants').update(updatePayload);
    if (isValidUuid(attendeeId)) {
      query = query.eq('id', attendeeId);
    } else {
      query = query.eq('badge_code', attendeeId);
    }
    if (isValidUuid(targetId)) {
      query = query.eq('event_id', targetId);
    }

    const { data, error } = await query.select();

    if (error) {
      console.warn("toggleAttendeeCheckin participants DB notice:", error.message);
      // Fallback with minimal payload
      let fbQuery = supabase.from('participants').update({
        status_participation: checkedIn ? 'checked_in' : 'registered'
      });
      if (isValidUuid(attendeeId)) {
        fbQuery = fbQuery.eq('id', attendeeId);
      } else {
        fbQuery = fbQuery.eq('badge_code', attendeeId);
      }
      if (isValidUuid(targetId)) {
        fbQuery = fbQuery.eq('event_id', targetId);
      }
      await fbQuery;
    }

    // 2. Also try updating rsvps table if exists
    try {
      if (isValidUuid(attendeeId)) {
        let rsvpQuery = supabase.from('rsvps').update({
          checked_in: !!checkedIn,
          checked_in_at: now
        }).eq('id', attendeeId);
        if (isValidUuid(targetId)) {
          rsvpQuery = rsvpQuery.eq('event_id', targetId);
        }
        await rsvpQuery;
      }
    } catch (rsvpErr) {
      // Ignore rsvp update notice
    }

    const updatedRow = (data && data[0]) ? data[0] : null;
    const mapped = updatedRow ? mapAttendeeFromDb(updatedRow) : { id: attendeeId, checkedIn: !!checkedIn, checkedInAt: now };
    return { success: true, attendee: mapped };
  } catch (err) {
    console.error("toggleAttendeeCheckin exception:", err);
    return { success: false, error: err.message || "Failed to update check-in status" };
  }
}

export async function performQrCheckin({ eventId = _activeEventId, rawPayload, checkedInBy = '' }) {
  if (!rawPayload) {
    return { status: 'invalid', message: 'No QR code payload provided.' };
  }

  const targetId = eventId || _activeEventId;
  let parsedPayload = null;
  let searchId = '';
  let searchBadgeCode = '';
  let searchEmail = '';
  let searchName = '';

  // 1. Try parsing JSON format
  if (typeof rawPayload === 'object' && rawPayload !== null) {
    parsedPayload = rawPayload;
  } else if (typeof rawPayload === 'string') {
    const trimmed = rawPayload.trim().replace(/^["']|["']$/g, '');
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        parsedPayload = JSON.parse(trimmed);
      } catch {
        parsedPayload = null;
      }
    }
  }

  if (parsedPayload) {
    searchId = parsedPayload.passId || parsedPayload.attendeeId || parsedPayload.id || parsedPayload.ticketId || '';
    searchBadgeCode = parsedPayload.badgeCode || parsedPayload.badge_code || parsedPayload.badge || '';
    searchEmail = parsedPayload.email || parsedPayload.attendeeEmail || '';
    searchName = parsedPayload.name || parsedPayload.attendeeName || '';

    // Check event match if eventId is embedded in QR payload
    const payloadEventId = parsedPayload.eventId || parsedPayload.event_id;
    if (payloadEventId && isValidUuid(targetId) && isValidUuid(payloadEventId) && payloadEventId !== targetId) {
      return {
        status: 'invalid',
        message: `This ticket is registered for a different event (${parsedPayload.eventTitle || parsedPayload.event || 'Other Event'}).`
      };
    }
  } else {
    // String matching
    const str = String(rawPayload).trim();
    if (str.startsWith('http://') || str.startsWith('https://')) {
      try {
        const u = new URL(str);
        searchId = u.searchParams.get('passId') || u.searchParams.get('id') || u.searchParams.get('attendeeId') || u.searchParams.get('ticketId') || '';
        searchBadgeCode = u.searchParams.get('badgeCode') || u.searchParams.get('badge_code') || u.searchParams.get('badge') || '';
        searchEmail = u.searchParams.get('email') || '';
        searchName = u.searchParams.get('name') || '';

        // Also check if pathname has a UUID
        const pathParts = u.pathname.split('/').filter(Boolean);
        for (const part of pathParts) {
          if (isValidUuid(part)) {
            searchId = part;
            break;
          }
        }
      } catch {
        searchBadgeCode = str;
      }
    } else if (str.includes('@')) {
      searchEmail = str;
    } else if (isValidUuid(str)) {
      searchId = str;
    } else if (str.toUpperCase().startsWith('EZ-')) {
      searchBadgeCode = str.toUpperCase();
    } else {
      searchBadgeCode = str;
    }
  }

  try {
    // 2. Fetch all participants for this event
    let query = supabase.from('participants').select('*');
    if (isValidUuid(targetId)) {
      query = query.eq('event_id', targetId);
    }
    const { data: attendees, error } = await query;
    let participantList = (attendees && attendees.length > 0) ? attendees : [];

    // Helper matcher function
    const isMatch = (a) => {
      if (!a) return false;
      const aId = String(a.id || '').toLowerCase();
      const aBadge = String(a.badge_code || '').toUpperCase();
      const aEmail = String(a.email || '').toLowerCase();
      const aFullName = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
      const aSyntheticBadge = a.id ? `EZ-${String(a.id).slice(-4).toUpperCase()}` : '';

      if (searchId && (aId === searchId.toLowerCase())) return true;
      if (searchBadgeCode && aBadge && (aBadge === searchBadgeCode.toUpperCase())) return true;
      if (searchBadgeCode && aSyntheticBadge && (aSyntheticBadge === searchBadgeCode.toUpperCase())) return true;
      if (searchBadgeCode && aBadge && aBadge.endsWith(searchBadgeCode.toUpperCase().replace(/^EZ-/, ''))) return true;
      if (searchEmail && aEmail && (aEmail === searchEmail.toLowerCase())) return true;
      if (searchName && aFullName && (aFullName === searchName.toLowerCase())) return true;
      if (typeof rawPayload === 'string' && a.id && rawPayload.includes(a.id)) return true;
      return false;
    };

    let matchedRow = participantList.find(isMatch);
    let isRsvpTable = false;

    // Fallback 1: Search participants across entire table if not found in current event
    if (!matchedRow && (searchId || searchBadgeCode || searchEmail)) {
      try {
        let globalQuery = supabase.from('participants').select('*');
        if (searchId && isValidUuid(searchId)) {
          globalQuery = globalQuery.eq('id', searchId);
        } else if (searchBadgeCode) {
          globalQuery = globalQuery.eq('badge_code', searchBadgeCode);
        } else if (searchEmail) {
          globalQuery = globalQuery.ilike('email', searchEmail);
        }
        const { data: globalMatches } = await globalQuery.limit(5);
        if (globalMatches && globalMatches.length > 0) {
          const found = globalMatches.find(isMatch) || globalMatches[0];
          if (found) {
            matchedRow = found;
          }
        }
      } catch (gErr) {}
    }

    // Fallback 2: Search in rsvps table
    if (!matchedRow) {
      try {
        let rsvpQuery = supabase.from('rsvps').select('*');
        if (isValidUuid(targetId)) {
          rsvpQuery = rsvpQuery.eq('event_id', targetId);
        }
        const { data: rsvps } = await rsvpQuery;
        if (rsvps && rsvps.length > 0) {
          const rsvpMatch = rsvps.find(isMatch);
          if (rsvpMatch) {
            matchedRow = rsvpMatch;
            isRsvpTable = true;
          }
        }
      } catch (rErr) {}
    }

    if (!matchedRow) {
      return {
        status: 'invalid',
        message: 'Ticket pass not found for this event. Please verify the QR code or search manually.'
      };
    }

    const mappedAttendee = mapAttendeeFromDb(matchedRow);

    // 4. Check if already checked in
    if (mappedAttendee.checkedIn) {
      return {
        status: 'already_checked_in',
        message: 'Attendee has already been checked in.',
        attendee: mappedAttendee,
        checkedInAt: mappedAttendee.checkedInAt || new Date().toISOString(),
        checkedInBy: mappedAttendee.checkedInBy || 'Gate Staff'
      };
    }

    // 5. Check in attendee
    const checkinTime = new Date().toISOString();
    const targetTable = isRsvpTable ? 'rsvps' : 'participants';
    const updatePayload = {
      checked_in: true,
      checked_in_at: checkinTime,
      checked_in_by: checkedInBy || 'Gate Staff',
    };
    if (!isRsvpTable) {
      updatePayload.status_participation = 'checked_in';
    }

    const { error: updateErr } = await supabase
      .from(targetTable)
      .update(updatePayload)
      .eq('id', matchedRow.id);

    if (updateErr) {
      console.warn("performQrCheckin update error:", updateErr.message);
    }

    mappedAttendee.checkedIn = true;
    mappedAttendee.checked_in = true;
    mappedAttendee.checkedInAt = checkinTime;
    mappedAttendee.checked_in_at = checkinTime;
    mappedAttendee.checkedInBy = checkedInBy || 'Gate Staff';
    mappedAttendee.status = 'checked-in';

    return {
      status: 'success',
      message: 'Check-in confirmed successfully!',
      attendee: mappedAttendee
    };
  } catch (err) {
    console.error("performQrCheckin exception:", err);
    return { status: 'invalid', message: err.message || 'Check-in processing failed.' };
  }
}

export async function updateEventCheckinPasscode(eventId = _activeEventId, passcode) {
  const targetId = eventId || _activeEventId;
  const cleanPasscode = String(passcode || '').trim().toUpperCase();
  if (!isValidUuid(targetId)) return { success: false, error: "Invalid event ID" };

  try {
    const { error } = await supabase
      .from('events')
      .update({ checkin_passcode: cleanPasscode })
      .eq('id', targetId);

    if (error) throw error;
    return { success: true, passcode: cleanPasscode };
  } catch (e) {
    console.error("updateEventCheckinPasscode error:", e);
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────
//  ATTENDEE PORTAL & NETWORKING HELPERS
// ─────────────────────────────────────────────

export async function fetchAttendeeConnections(userId, eventId) {
  if (!userId) return [];
  try {
    const targetEventId = eventId || _activeEventId;
    let query = supabase.from('connections').select('*').eq('user_id', userId);
    if (targetEventId && isValidUuid(targetEventId)) {
      query = query.eq('event_id', targetEventId);
    }
    const { data, error } = await query;
    if (error || !data) {
      // Fallback from localStorage
      const cached = safeLocalStorageGet(`eventzone_connections_${userId}_${targetEventId}`, []);
      return cached;
    }
    safeLocalStorageSet(`eventzone_connections_${userId}_${targetEventId}`, data);
    return data;
  } catch (err) {
    console.warn("fetchAttendeeConnections error:", err);
    return safeLocalStorageGet(`eventzone_connections_${userId}_${eventId}`, []);
  }
}

export async function sendAttendeeConnectionRequest(senderUser, receiverAttendee, eventId, message = "") {
  if (!senderUser?.id || !receiverAttendee) return null;
  const targetEventId = eventId || _activeEventId;
  const newConnId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conn-${Date.now()}`;
  
  const connData = {
    id: newConnId,
    user_id: senderUser.id,
    connected_user_id: receiverAttendee.id || null,
    name: receiverAttendee.name || `${receiverAttendee.firstName || ''} ${receiverAttendee.lastName || ''}`.trim() || 'Attendee',
    title: receiverAttendee.jobTitle || receiverAttendee.title || '',
    company: receiverAttendee.company || '',
    email: receiverAttendee.email || '',
    phone: receiverAttendee.phone || '',
    avatar_url: receiverAttendee.avatar || receiverAttendee.image || '',
    notes: message || '',
    event_id: isValidUuid(targetEventId) ? targetEventId : null,
    source: 'attendee_portal',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('connections')
      .upsert(connData)
      .select()
      .maybeSingle();

    // Cache locally
    const currentCached = safeLocalStorageGet(`eventzone_connections_${senderUser.id}_${targetEventId}`, []);
    const updated = [connData, ...currentCached.filter(c => c.email !== connData.email)];
    safeLocalStorageSet(`eventzone_connections_${senderUser.id}_${targetEventId}`, updated);

    return data || connData;
  } catch (e) {
    console.warn("sendAttendeeConnectionRequest warning:", e);
    const currentCached = safeLocalStorageGet(`eventzone_connections_${senderUser.id}_${targetEventId}`, []);
    const updated = [connData, ...currentCached.filter(c => c.email !== connData.email)];
    safeLocalStorageSet(`eventzone_connections_${senderUser.id}_${targetEventId}`, updated);
    return connData;
  }
}

export function fetchSessionBookmarks(userId, eventId) {
  if (!userId || !eventId) return [];
  return safeLocalStorageGet(`eventzone_bookmarks_${userId}_${eventId}`, []);
}

export function toggleSessionBookmark(userId, eventId, sessionId) {
  if (!userId || !eventId || !sessionId) return [];
  const current = safeLocalStorageGet(`eventzone_bookmarks_${userId}_${eventId}`, []);
  let updated;
  if (current.includes(sessionId)) {
    updated = current.filter(id => id !== sessionId);
  } else {
    updated = [...current, sessionId];
  }
  safeLocalStorageSet(`eventzone_bookmarks_${userId}_${eventId}`, updated);
  return updated;
}

export async function fetchEventChatMessages(userId, eventId) {
  if (!userId) return [];
  const targetEventId = eventId || _activeEventId;
  const storageKey = `eventzone_chat_${userId}_${targetEventId}`;
  
  try {
    if (isValidUuid(userId)) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });
      
      if (!error && data && data.length > 0) {
        safeLocalStorageSet(storageKey, data);
        return data;
      }
    }
  } catch (err) {
    console.warn("fetchEventChatMessages error:", err);
  }
  
  return safeLocalStorageGet(storageKey, []);
}

export async function sendEventChatMessage(senderUser, recipientAttendee, messageText, eventId) {
  if (!senderUser || !recipientAttendee || !messageText?.trim()) return null;
  const targetEventId = eventId || _activeEventId;
  const storageKeySender = `eventzone_chat_${senderUser.id}_${targetEventId}`;
  const recipientId = recipientAttendee.id || recipientAttendee.user_id || recipientAttendee.email;
  const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
  
  const msgObj = {
    id: msgId,
    sender_id: isValidUuid(senderUser.id) ? senderUser.id : null,
    sender_email: senderUser.email,
    sender_name: senderUser.fullName || senderUser.name || 'Delegate',
    sender_avatar: senderUser.avatar || '',
    recipient_id: isValidUuid(recipientId) ? recipientId : null,
    recipient_email: recipientAttendee.email || '',
    recipient_name: recipientAttendee.name || `${recipientAttendee.firstName || ''} ${recipientAttendee.lastName || ''}`.trim() || 'Delegate',
    recipient_avatar: recipientAttendee.avatar || recipientAttendee.image || '',
    content: messageText.trim(),
    event_id: isValidUuid(targetEventId) ? targetEventId : null,
    created_at: new Date().toISOString(),
    is_read: false
  };

  // 1. Try Supabase
  try {
    if (isValidUuid(senderUser.id) && isValidUuid(recipientId)) {
      await supabase.from('messages').insert({
        id: msgId,
        sender_id: senderUser.id,
        recipient_id: recipientId,
        content: messageText.trim(),
        event: targetEventId ? String(targetEventId) : null,
        created_at: msgObj.created_at,
        is_read: false
      });
    }
  } catch (e) {
    console.warn("Supabase message insert warning:", e);
  }

  // 2. Persist in sender local cache
  const senderMsgs = safeLocalStorageGet(storageKeySender, []);
  safeLocalStorageSet(storageKeySender, [...senderMsgs, msgObj]);

  // 3. Persist in recipient local cache if they are on same browser / testing
  if (recipientAttendee.email) {
    const recipientKey = `eventzone_chat_${recipientAttendee.email}_${targetEventId}`;
    const recipMsgs = safeLocalStorageGet(recipientKey, []);
    safeLocalStorageSet(recipientKey, [...recipMsgs, msgObj]);
  }

  return msgObj;
}

// ─────────────────────────────────────────────
//  CERTIFICATES & CERTIFICATE TEMPLATES
// ─────────────────────────────────────────────

const _cachedCertificateTemplatesByEvent = {};
const _cachedIssuedCertificatesByEvent = {};

export async function fetchCertificateTemplates(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  // 1. Try Supabase
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        _cachedCertificateTemplatesByEvent[targetId] = data;
        if (typeof window !== 'undefined') {
          safeLocalStorageSet(`eventzone_certificate_templates_${targetId}`, data);
        }
        return data;
      }
    } catch (e) {
      console.warn("fetchCertificateTemplates DB notice (using fallback):", e);
    }
  }

  // 2. In-memory cache
  if (_cachedCertificateTemplatesByEvent[targetId] && _cachedCertificateTemplatesByEvent[targetId].length > 0) {
    return _cachedCertificateTemplatesByEvent[targetId];
  }

  // 3. LocalStorage
  if (typeof window !== 'undefined') {
    const local = safeLocalStorageGet(`eventzone_certificate_templates_${targetId}`);
    if (local && Array.isArray(local) && local.length > 0) {
      _cachedCertificateTemplatesByEvent[targetId] = local;
      return local;
    }
  }

  return [];
}

export async function upsertCertificateTemplate(template, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const tplId = (template.id && isValidUuid(template.id)) ? template.id : generateUuid();
  const formatted = {
    ...template,
    id: tplId,
    isCustom: true,
    eventId: targetId,
    event_id: isValidUuid(targetId) ? targetId : null,
    updatedAt: new Date().toISOString()
  };

  // 1. Try Supabase
  if (isValidUuid(targetId)) {
    try {
      const dbRow = {
        id: tplId,
        event_id: targetId,
        name: formatted.name || 'Untitled Template',
        category: formatted.category || 'attendance',
        settings: formatted,
        updated_at: formatted.updatedAt
      };
      await supabase
        .from('certificate_templates')
        .upsert(dbRow);
    } catch (e) {
      console.warn("upsertCertificateTemplate DB notice:", e);
    }
  }

  // 2. Update memory & LocalStorage
  const current = await fetchCertificateTemplates(targetId);
  const exists = current.some(t => t.id === tplId);
  const updatedList = exists ? current.map(t => t.id === tplId ? formatted : t) : [formatted, ...current];
  _cachedCertificateTemplatesByEvent[targetId] = updatedList;

  if (typeof window !== 'undefined') {
    safeLocalStorageSet(`eventzone_certificate_templates_${targetId}`, updatedList);
  }

  return formatted;
}

export async function deleteCertificateTemplate(templateId, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  if (isValidUuid(targetId)) {
    try {
      await supabase.from('certificate_templates').delete().eq('id', templateId);
    } catch (e) {
      console.warn("deleteCertificateTemplate DB notice:", e);
    }
  }

  const current = await fetchCertificateTemplates(targetId);
  const updatedList = current.filter(t => t.id !== templateId);
  _cachedCertificateTemplatesByEvent[targetId] = updatedList;

  if (typeof window !== 'undefined') {
    safeLocalStorageSet(`eventzone_certificate_templates_${targetId}`, updatedList);
  }

  return true;
}

export async function fetchIssuedCertificates(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  if (typeof window !== 'undefined') {
    const local = safeLocalStorageGet(`eventzone_issued_certificates_${targetId}`, []);
    return local;
  }
  return [];
}

export async function recordIssuedCertificates(certificates = [], eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (!certificates.length) return [];

  const existing = await fetchIssuedCertificates(targetId);
  const combined = [...certificates, ...existing];
  
  if (typeof window !== 'undefined') {
    safeLocalStorageSet(`eventzone_issued_certificates_${targetId}`, combined);
  }
  return combined;
}

// ─────────────────────────────────────────────
//  PLATFORM ADMIN (BACK OFFICE) DATA LAYER
// ─────────────────────────────────────────────

/**
 * Fetches all platform organizers with calculated event counts and quota limits.
 */
export async function fetchAllPlatformOrganizers() {
  try {
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profErr) {
      console.warn("fetchAllPlatformOrganizers error:", profErr.message);
      return [];
    }

    // Fetch all events to tally organizer event counts
    const { data: eventsList } = await supabase
      .from('events')
      .select('id, organizer_id, status');

    const eventCountsByOrg = {};
    (eventsList || []).forEach(ev => {
      const oid = ev.organizer_id;
      if (oid) {
        eventCountsByOrg[oid] = (eventCountsByOrg[oid] || 0) + 1;
      }
    });

    return (profiles || []).map(p => {
      const meta = typeof p.metadata === 'object' && p.metadata !== null ? p.metadata : {};
      const socials = typeof p.social_links === 'object' && p.social_links !== null ? p.social_links : {};
      
      const maxEvents = p.max_events !== undefined ? p.max_events : (meta.max_events !== undefined ? meta.max_events : (socials.max_events !== undefined ? socials.max_events : null));
      const maxAttendees = p.max_attendees !== undefined ? p.max_attendees : (meta.max_attendees !== undefined ? meta.max_attendees : (socials.max_attendees !== undefined ? socials.max_attendees : null));
      const accountStatus = p.status || meta.status || socials.status || 'active';

      return {
        id: p.id,
        email: p.email || '',
        fullName: p.full_name || p.fullName || 'Unnamed Organizer',
        companyName: p.company_name || p.company || '',
        jobTitle: p.job_title || '',
        phone: p.phone || '',
        location: p.location || '',
        role: p.role || 'organizer',
        status: accountStatus,
        maxEvents: maxEvents !== null ? Number(maxEvents) : null,
        maxAttendees: maxAttendees !== null ? Number(maxAttendees) : null,
        eventsCount: eventCountsByOrg[p.id] || 0,
        createdAt: p.created_at || '',
        avatarUrl: p.avatar_url || '',
      };
    });
  } catch (err) {
    console.error("fetchAllPlatformOrganizers error:", err);
    return [];
  }
}

/**
 * Updates an organizer's operational quotas, account status, and role.
 * Dual-persists in profiles.metadata and profiles.social_links with zero database migrations.
 */
export async function updateOrganizerQuotas(organizerId, { maxEvents, maxAttendees, status, role }) {
  if (!organizerId) return { success: false, error: "Organizer ID is required" };

  try {
    // 1. Fetch current profile
    const { data: cur, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', organizerId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    const existingMeta = cur?.metadata && typeof cur.metadata === 'object' ? cur.metadata : {};
    const existingSocials = cur?.social_links && typeof cur.social_links === 'object' ? cur.social_links : {};

    const updatedMeta = {
      ...existingMeta,
      max_events: maxEvents !== undefined ? (maxEvents === null ? null : Number(maxEvents)) : existingMeta.max_events,
      max_attendees: maxAttendees !== undefined ? (maxAttendees === null ? null : Number(maxAttendees)) : existingMeta.max_attendees,
      status: status || existingMeta.status || 'active',
    };

    const updatedSocials = {
      ...existingSocials,
      max_events: maxEvents !== undefined ? (maxEvents === null ? null : Number(maxEvents)) : existingSocials.max_events,
      max_attendees: maxAttendees !== undefined ? (maxAttendees === null ? null : Number(maxAttendees)) : existingSocials.max_attendees,
      status: status || existingSocials.status || 'active',
    };

    const payload = {
      metadata: updatedMeta,
      social_links: updatedSocials,
      updated_at: new Date().toISOString(),
    };

    if (role) {
      payload.role = role;
    }

    // Attempt direct columns if they exist in schema
    if (cur && 'max_events' in cur && maxEvents !== undefined) payload.max_events = maxEvents;
    if (cur && 'max_attendees' in cur && maxAttendees !== undefined) payload.max_attendees = maxAttendees;
    if (cur && 'status' in cur && status) payload.status = status;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', organizerId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateOrganizerQuotas error:", err);
    return { success: false, error: err.message || "Failed to update organizer" };
  }
}

/**
 * Fetches all platform events with organizer details and hero curation flags for Back Office.
 */
export async function fetchAllPlatformEventsAdmin() {
  try {
    const { data: rawEvents, error: evErr } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (evErr) throw evErr;

    // Fetch profiles for organizer names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_name');

    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = p;
    });

    // Fetch participant counts
    const { data: participants } = await supabase
      .from('participants')
      .select('id, event_id, checked_in');

    const participantCounts = {};
    const checkinCounts = {};
    (participants || []).forEach(pt => {
      const eid = pt.event_id;
      if (eid) {
        participantCounts[eid] = (participantCounts[eid] || 0) + 1;
        if (pt.checked_in) {
          checkinCounts[eid] = (checkinCounts[eid] || 0) + 1;
        }
      }
    });

    return (rawEvents || []).map(row => {
      const mapped = mapEventFromDb(row);
      const org = profileMap[mapped.organizerId] || {};

      return {
        ...mapped,
        organizerFullName: org.full_name || mapped.organizerName || 'Platform Host',
        organizerEmail: org.email || mapped.contactEmail || '',
        organizerCompany: org.company_name || '',
        registeredCount: participantCounts[row.id] || 0,
        checkedInCount: checkinCounts[row.id] || 0,
      };
    });
  } catch (err) {
    console.error("fetchAllPlatformEventsAdmin error:", err);
    return [];
  }
}

/**
 * Updates an event's Homepage Hero curation settings (pin and display order).
 */
export async function updateEventHeroFeatured(eventId, { isHeroFeatured, heroOrder }) {
  if (!eventId) return { success: false, error: "Event ID required" };

  try {
    const { data: currentEvent, error: fetchErr } = await supabase
      .from('events')
      .select('portal_settings')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    const currentPortalSettings = currentEvent?.portal_settings && typeof currentEvent.portal_settings === 'object'
      ? currentEvent.portal_settings
      : { networking: true, agenda: true, exhibitors: true, sponsors: true, floorplans: true, resources: true, announcements: true };

    const updatedPortalSettings = {
      ...currentPortalSettings,
      is_hero_featured: Boolean(isHeroFeatured),
      hero_order: heroOrder !== undefined ? Number(heroOrder) : (currentPortalSettings.hero_order ?? 99),
    };

    const { error: updateErr } = await supabase
      .from('events')
      .update({
        portal_settings: updatedPortalSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateErr) throw updateErr;
    return { success: true, isHeroFeatured: Boolean(isHeroFeatured), heroOrder: updatedPortalSettings.hero_order };
  } catch (err) {
    console.error("updateEventHeroFeatured error:", err);
    return { success: false, error: err.message || "Failed to update hero featured status" };
  }
}

/**
 * Updates an event's status directly from the Admin console (e.g. published, suspended, archived).
 */
export async function updateEventStatusAdmin(eventId, newStatus) {
  if (!eventId || !newStatus) return false;
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', eventId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("updateEventStatusAdmin error:", err);
    return false;
  }
}

/**
 * Fetches all platform payments (Chargily Pay transactions) with aggregated metrics.
 */
export async function fetchAllPlatformPayments() {
  try {
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (payErr) {
      console.warn("fetchAllPlatformPayments warning:", payErr.message);
      return { payments: [], metrics: { totalGmv: 0, paidCount: 0, edahabiaGmv: 0, cibGmv: 0, successRate: 0 } };
    }

    const rows = payments || [];
    let totalGmv = 0;
    let paidCount = 0;
    let edahabiaGmv = 0;
    let edahabiaCount = 0;
    let cibGmv = 0;
    let cibCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    rows.forEach(p => {
      const amt = Number(p.amount) || 0;
      const st = (p.status || '').toLowerCase();
      const meth = (p.payment_method || '').toLowerCase();

      if (st === 'paid') {
        totalGmv += amt;
        paidCount++;
        if (meth.includes('edahabia')) {
          edahabiaGmv += amt;
          edahabiaCount++;
        } else if (meth.includes('cib')) {
          cibGmv += amt;
          cibCount++;
        }
      } else if (st === 'failed' || st === 'canceled' || st === 'expired') {
        failedCount++;
      } else {
        pendingCount++;
      }
    });

    const totalAttempts = rows.length;
    const successRate = totalAttempts > 0 ? Math.round((paidCount / totalAttempts) * 100) : 0;

    return {
      payments: rows,
      metrics: {
        totalGmv,
        paidCount,
        edahabiaGmv,
        edahabiaCount,
        cibGmv,
        cibCount,
        failedCount,
        pendingCount,
        totalAttempts,
        successRate,
      },
    };
  } catch (err) {
    console.error("fetchAllPlatformPayments error:", err);
    return { payments: [], metrics: { totalGmv: 0, paidCount: 0, edahabiaGmv: 0, cibGmv: 0, successRate: 0 } };
  }
}

/**
 * Searches attendees across all platform events by name, email, phone, or badge code.
 */
export async function searchPlatformAttendees(query = '') {
  const cleanQ = (query || '').trim();
  if (!cleanQ) return [];

  try {
    const { data: attendees, error } = await supabase
      .from('participants')
      .select('*, events(id, name, location, wilaya)')
      .or(`first_name.ilike.%${cleanQ}%,last_name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%,phone.ilike.%${cleanQ}%,badge_code.ilike.%${cleanQ}%`)
      .order('registered_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return attendees || [];
  } catch (err) {
    console.error("searchPlatformAttendees error:", err);
    return [];
  }
}

/**
 * Fetches recent live check-ins across all events for the Back Office pulse feed.
 */
export async function fetchRecentPlatformCheckIns(limit = 25) {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id, first_name, last_name, email, ticket_type, badge_code, checked_in_at, event_id, events(id, name)')
      .eq('checked_in', true)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("fetchRecentPlatformCheckIns warning:", err);
    return [];
  }
}

