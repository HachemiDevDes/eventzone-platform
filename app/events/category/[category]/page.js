import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ChevronRight, Compass, ArrowLeft, ArrowRight, Layers, Tag } from "lucide-react";
import { fetchPublicEvents } from "../../../../lib/db";
import { POPULAR_CATEGORIES, getCategoryBySlug, filterEventsByCategory } from "../../../../lib/seoCategories";
import Footer from "../../../../components/Footer";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const category = getCategoryBySlug(resolvedParams?.category);
  if (!category) return {};

  const title = `${category.name} Conferences & Summits | Eventzone`;
  const description = `${category.description} Explore agendas, interactive floor plans, and tickets on Eventzone.`;
  const canonicalUrl = `https://eventzone.pro/events/category/${category.slug}`;

  return {
    title,
    description,
    keywords: [
      `${category.name} events`,
      `${category.shortName} conferences`,
      `${category.nameFr} événements`,
      `${category.nameAr} مؤتمرات`,
      "Eventzone",
      "Algeria events",
      "summits"
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Eventzone",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const category = getCategoryBySlug(resolvedParams?.category);
  if (!category) {
    notFound();
  }

  let allEvents = [];
  try {
    allEvents = await fetchPublicEvents();
  } catch (err) {
    console.warn("Category page events fetch notice:", err);
  }

  const categoryEvents = filterEventsByCategory(allEvents, category.slug);
  const otherCategories = POPULAR_CATEGORIES.filter(c => c.slug !== category.slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
  const canonicalUrl = `${baseUrl}/events/category/${category.slug}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Events",
        "item": `${baseUrl}#explore`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": category.shortName,
        "item": canonicalUrl
      }
    ]
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} Conferences & Events`,
    "description": category.description,
    "url": canonicalUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Eventzone",
      "url": baseUrl
    }
  };

  const itemListLd = categoryEvents.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${category.name} Events on Eventzone`,
    "itemListElement": categoryEvents.map((ev, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Event",
        "name": ev.title,
        "url": `${baseUrl}/${ev.slug || ev.id}`,
        "startDate": ev.startDate || undefined,
        "location": {
          "@type": "Place",
          "name": ev.location || "Algeria",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": ev.city || "Algiers",
            "addressCountry": "DZ"
          }
        }
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}

      {/* Top Navigation */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              E
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Eventzone</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Browse All Events</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-slate-950 text-white py-12 sm:py-16 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 space-y-4">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span>Categories</span>
            <ChevronRight size={12} />
            <span className="text-blue-400 font-bold">{category.shortName}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} />
              <span>{category.shortName}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
              Algeria &amp; International
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {category.name} Conferences &amp; Summits
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed font-normal">
            {category.description}
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-10">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {category.shortName} Events ({categoryEvents.length})
          </h2>
          <Link
            href="/"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {categoryEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Compass size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No events currently scheduled in {category.shortName}</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Check back soon as new summits are published weekly, or explore other active event categories.
            </p>
            <Link
              href="/"
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Browse All Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryEvents.map(ev => (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <Link href={`/${ev.slug || ev.id}`} className="block relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"}
                      alt={`${ev.title} - Eventzone`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-6 space-y-3">
                    <Link href={`/${ev.slug || ev.id}`} className="block">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                        {ev.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {ev.tagline || ev.description || "Join leading delegates for keynotes, exhibitions, and networking."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                      {ev.startDate && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100/70">
                          <Calendar size={13} />
                          <span>{ev.startDate}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                        <MapPin size={13} className="text-slate-500" />
                        <span className="truncate">{ev.location || "Algeria"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={`/${ev.slug || ev.id}`}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
                  >
                    View Event &amp; Tickets
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Explore Other Categories */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Explore Other Event Categories
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {otherCategories.map(other => (
              <Link
                key={other.slug}
                href={`/events/category/${other.slug}`}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-700 transition-all flex items-center gap-1.5"
              >
                <Tag size={13} className="text-slate-400" />
                <span>{other.shortName}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
