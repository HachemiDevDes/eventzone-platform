import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Universal Safe LocalStorage Manager with automatic quota management & cleanup
export function cleanupLocalStorageQuota() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Preserve essential user profile, language, and primary auth session
      if (
        k === "eventzone_user" ||
        k === "app_language" ||
        (k.startsWith("sb-") && !k.includes("-flow-"))
      ) {
        continue;
      }
      keysToRemove.push(k);
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  } catch (err) {
    console.warn("Error during localStorage quota cleanup:", err);
  }
}

const safeSupabaseStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`Storage quota exceeded setting ${key}, cleaning cache...`, err);
      cleanupLocalStorageQuota();
      try {
        window.localStorage.setItem(key, value);
      } catch (e2) {
        try {
          // If still constrained, clean stale flow keys
          const stale = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k !== key && k.includes("-flow-")) {
              stale.push(k);
            }
          }
          stale.forEach(k => localStorage.removeItem(k));
          window.localStorage.setItem(key, value);
        } catch (e3) {
          console.error("Critical: unable to save auth storage key:", e3);
        }
      }
    }
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: safeSupabaseStorage,
  }
});

export function safeLocalStorageSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    // Ignore excessively large non-auth items to protect storage quota
    if (serialized.length > 200 * 1024) {
      return;
    }
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`Quota issue when saving ${key} to localStorage, cleaning cache...`, err);
    cleanupLocalStorageQuota();
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      if (serialized.length <= 100 * 1024) {
        localStorage.setItem(key, serialized);
      }
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
  const nameForAvatar = user.fullName || user.full_name || user.email?.split("@")[0] || "User";
  const cleanAvatar = rawAvatar.startsWith("data:") || !rawAvatar
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=0b5cdb&color=fff`
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
    socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks.slice(0, 5) : (typeof user.socialLinks === 'object' && user.socialLinks !== null ? Object.entries(user.socialLinks).map(([platform, url]) => ({ platform, url })) : []),
    whatImLookingFor: user.whatImLookingFor || user.what_im_looking_for || "",
    avatar: cleanAvatar,
    isAdmin: !!user.isAdmin && (user.role === "super_admin" || !!user.isVerifiedAdmin),
    isVerifiedAdmin: !!user.isVerifiedAdmin,
    maxEvents: user.maxEvents ?? null,
    maxAttendees: user.maxAttendees ?? null,
    accountStatus: user.accountStatus || user.status || "active",
  };
}

