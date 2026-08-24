import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Universal Safe LocalStorage Manager with automatic quota management & cleanup
export function safeLocalStorageSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`Quota issue when saving ${key} to localStorage, cleaning cache...`, err);
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== "eventzone_user" && (k.startsWith("eventzone_cached_") || k.startsWith("eventzone_temp_") || k.startsWith("cities_"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (e2) {
      console.warn(`Unable to save ${key} even after cache cleanup:`, e2);
    }
  }
}

export function safeLocalStorageGet(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    return fallback;
  }
}

export function safeLocalStorageRemove(key) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Error removing ${key} from localStorage:`, err);
  }
}

export function sanitizeUserForStorage(user) {
  if (!user) return null;
  const rawAvatar = user.avatar || user.avatar_url || "";
  const cleanAvatar = rawAvatar.startsWith("data:") 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.full_name || "User")}&background=0b5cdb&color=fff`
    : rawAvatar;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || user.full_name || "",
    role: user.role === "attendee" ? "visitor" : (user.role || "organizer"),
    companyName: user.companyName || user.company_name || "",
    jobTitle: user.jobTitle || user.job_title || "",
    phone: user.phone || "",
    bio: user.bio || "",
    location: user.location || "",
    interests: Array.isArray(user.interests) ? user.interests.slice(0, 10) : [],
    socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks.slice(0, 5) : [],
    whatImLookingFor: user.whatImLookingFor || user.what_im_looking_for || "",
    avatar: cleanAvatar,
    isAdmin: !!user.isAdmin,
  };
}

