import { fetchPublicEvents } from "../lib/db";
import { POPULAR_CITIES, POPULAR_CATEGORIES } from "../lib/seoCategories";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";

  let eventUrls = [];
  try {
    const events = await fetchPublicEvents();
    if (Array.isArray(events)) {
      eventUrls = events
        .filter(ev => ev && ev.status === "published" && (ev.slug || ev.id))
        .map(ev => ({
          url: `${baseUrl}/${ev.slug || ev.id}`,
          lastModified: ev.updated_at || ev.created_at || new Date(),
          changeFrequency: "daily",
          priority: 0.9,
        }));
    }
  } catch (err) {
    console.warn("Sitemap event generation notice:", err);
  }

  const cityUrls = POPULAR_CITIES.map(c => ({
    url: `${baseUrl}/events/city/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryUrls = POPULAR_CATEGORIES.map(cat => ({
    url: `${baseUrl}/events/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/checkin`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookie-settings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/compliance`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/enterprise-security`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...cityUrls, ...categoryUrls, ...eventUrls];
}
