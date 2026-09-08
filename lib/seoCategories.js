/**
 * Canonical configuration and SEO taxonomy for programmatic city and category pages.
 */

export const POPULAR_CITIES = [
  {
    slug: "algiers",
    name: "Algiers",
    nameAr: "الجزائر العاصمة",
    nameFr: "Alger",
    wilaya: "16 - Algiers",
    description: "Explore the premier conferences, international expos, and tech summits in Algiers, the vibrant capital hub of Algeria.",
  },
  {
    slug: "oran",
    name: "Oran",
    nameAr: "وهران",
    nameFr: "Oran",
    wilaya: "31 - Oran",
    description: "Discover upcoming business forums, industrial fairs, and cultural conferences in Oran, Algeria's Mediterranean economic powerhouse.",
  },
  {
    slug: "constantine",
    name: "Constantine",
    nameAr: "قسنطينة",
    nameFr: "Constantine",
    wilaya: "25 - Constantine",
    description: "Find leading academic conferences, pharmaceutical symposia, and tech expos in Constantine, the City of Bridges.",
  },
  {
    slug: "annaba",
    name: "Annaba",
    nameAr: "عنابة",
    nameFr: "Annaba",
    wilaya: "23 - Annaba",
    description: "Browse maritime, industrial, and digital summits taking place in Annaba, Eastern Algeria's coastal industrial center.",
  },
  {
    slug: "setif",
    name: "Sétif",
    nameAr: "سطيف",
    nameFr: "Sétif",
    wilaya: "19 - Sétif",
    description: "Connect with entrepreneurs and industry leaders at commercial trade expos and regional summits in Sétif.",
  },
  {
    slug: "blida",
    name: "Blida",
    nameAr: "البليدة",
    nameFr: "Blida",
    wilaya: "09 - Blida",
    description: "Discover agricultural technology, manufacturing, and commerce expos hosted in the Mitidja regional hub of Blida.",
  }
];

export const POPULAR_CATEGORIES = [
  {
    slug: "technology",
    name: "Technology, AI & Software",
    shortName: "Technology",
    nameAr: "التكنولوجيا والذكاء الاصطناعي",
    nameFr: "Technologie & IA",
    matchKeywords: ["tech", "software", "ai", "cloud", "developer", "digital", "data", "cyber", "it"],
    description: "Discover premier tech conferences, AI symposiums, developer hackathons, and software expos on Eventzone.",
  },
  {
    slug: "finance",
    name: "Finance, Banking & FinTech",
    shortName: "FinTech & Banking",
    nameAr: "المالية والبنوك والتكنولوجيا المالية",
    nameFr: "Finance & FinTech",
    matchKeywords: ["fintech", "finance", "bank", "invest", "venture", "capital", "crypto", "blockchain"],
    description: "Explore leading finance summits, banking congresses, and FinTech summits shaping the regional economy.",
  },
  {
    slug: "energy",
    name: "Energy, Oil & Gas",
    shortName: "Energy & CleanTech",
    nameAr: "الطاقة والنفط والغاز",
    nameFr: "Énergie, Pétrole & Gaz",
    matchKeywords: ["energy", "oil", "gas", "petroleum", "hydrocarbon", "solar", "renewable", "cleantech"],
    description: "Join international energy executives and engineers at renewable energy forums, oil & gas conventions, and sustainability summits.",
  },
  {
    slug: "healthcare",
    name: "Healthcare, Pharmaceuticals & Biotech",
    shortName: "Healthcare & Pharma",
    nameAr: "الرعاية الصحية والأدوية",
    nameFr: "Santé & Pharmacie",
    matchKeywords: ["health", "medical", "pharma", "biotech", "doctor", "medicine", "clinic"],
    description: "Find accredited medical conferences, healthcare symposia, and pharmaceutical exhibitions on Eventzone.",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing & Heavy Industry",
    shortName: "Industry & Manufacturing",
    nameAr: "التصنيع والصناعات الثقيلة",
    nameFr: "Industrie & Fabrication",
    matchKeywords: ["manufactur", "industry", "industrial", "steel", "factory", "machinery", "production"],
    description: "Connect with manufacturers, suppliers, and distributors at international industrial expos and machinery summits.",
  },
  {
    slug: "education",
    name: "Education, EdTech & Academia",
    shortName: "Education & EdTech",
    nameAr: "التعليم وتكنولوجيا التعليم",
    nameFr: "Éducation & EdTech",
    matchKeywords: ["education", "edtech", "academia", "university", "school", "training", "research"],
    description: "Browse education summits, university career fairs, and academic conferences hosted across Algeria.",
  },
  {
    slug: "entrepreneurship",
    name: "Venture Capital & Private Equity",
    shortName: "Startups & Venture",
    nameAr: "الشركات الناشئة والاستثمار",
    nameFr: "Startups & Investissement",
    matchKeywords: ["startup", "venture", "pitch", "founder", "investor", "entrepreneur", "summit", "incubator"],
    description: "Meet high-growth founders, venture capitalists, and ecosystem builders at leading startup summits.",
  }
];

export function getCityBySlug(slug) {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();
  return POPULAR_CITIES.find(c => c.slug === clean) || null;
}

export function getCategoryBySlug(slug) {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();
  return POPULAR_CATEGORIES.find(c => c.slug === clean) || null;
}

export function filterEventsByCity(events, citySlug) {
  const city = getCityBySlug(citySlug);
  if (!city || !Array.isArray(events)) return [];
  const query = city.name.toLowerCase();

  return events.filter(e => {
    const loc = String(e.location || "").toLowerCase();
    const c = String(e.city || "").toLowerCase();
    const venue = String(e.venueName || "").toLowerCase();
    return loc.includes(query) || c.includes(query) || venue.includes(query) || (citySlug === "algiers" && (loc.includes("staoueli") || loc.includes("cic") || loc.includes("safex")));
  });
}

export function filterEventsByCategory(events, catSlug) {
  const category = getCategoryBySlug(catSlug);
  if (!category || !Array.isArray(events)) return [];

  return events.filter(e => {
    const cat = String(e.category || "").toLowerCase();
    const title = String(e.title || "").toLowerCase();
    const desc = String(e.description || e.tagline || "").toLowerCase();

    if (cat.includes(category.slug) || cat.includes(category.shortName.toLowerCase())) return true;
    return category.matchKeywords.some(kw => cat.includes(kw) || title.includes(kw) || desc.includes(kw));
  });
}
