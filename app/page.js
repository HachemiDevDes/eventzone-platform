import { Suspense } from "react";
import HomeClient from "./HomeClient";
import { fetchPublicEvents } from "../lib/db";

// Strict ISO helper for Google Schema.org dates
function parseToIso(dateStr, fallbackHour = 8) {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      if (typeof dateStr === "string" && dateStr.length <= 10) {
        d.setUTCHours(fallbackHour, 0, 0, 0);
      }
      return d.toISOString();
    }
  } catch (e) {}
  return undefined;
}

export const metadata = {
  title: "Eventzone — Discover Events, Conferences & Expos | Event Platform",
  description: "Discover leading conferences, summits, exhibitions, and professional events on Eventzone. Book tickets, explore interactive floor plans, and manage events seamlessly.",
  keywords: [
    "Eventzone",
    "events Algeria",
    "conferences Algeria",
    "summits",
    "expositions",
    "salons Algerie",
    "ticketing",
    "event management",
    "event discovery",
    "interactive floor plans",
    "Algiers events"
  ],
  alternates: {
    canonical: "https://eventzone.pro",
  },
  openGraph: {
    title: "Eventzone — Discover Events, Conferences & Expos",
    description: "Discover leading conferences, summits, exhibitions, and professional events on Eventzone. Book tickets, explore interactive floor plans, and manage events seamlessly.",
    url: "https://eventzone.pro",
    siteName: "Eventzone",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Eventzone",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventzone — Discover Events, Conferences & Expos",
    description: "Discover leading conferences, summits, exhibitions, and professional events on Eventzone. Book tickets, explore interactive floor plans, and manage events seamlessly.",
    images: ["/og-image.png"],
  },
};

export default async function Page(props) {
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const viewParam = searchParams?.view;
  const rsvpParam = searchParams?.rsvp;
  let initialView = "home";

  if (rsvpParam === "true" || viewParam === "public-rsvp" || (viewParam === "rsvp" && searchParams?.public === "true")) {
    initialView = "event-landing";
  } else if (viewParam) {
    const validViews = [
      "home", "auth", "profile", "my-tickets", "events-hub", "create-event", "event-landing", "register", "visitor-portal", "attendee-portal", "overview", "page-builder", "calendar", "event-details", 
      "attendees", "pending", "organizations", "sponsors", 
      "exhibitors", "speakers", "opportunities", "influencers", "tickets", "forms", "rsvp", "logistics", "documents", "check-in", 
      "my-team", "developers", "analytics", "communications", "certificates", "floor-plan", "portal-settings", "admin"
    ];
    if (validViews.includes(viewParam)) {
      initialView = viewParam;
    }
  } else if (searchParams?.ref || searchParams?.influencer || searchParams?.referral) {
    initialView = "event-landing";
  }

  const initialAuthMode = searchParams?.mode === "signup" ? "signup" : "signin";

  let events = [];
  try {
    events = await fetchPublicEvents();
  } catch (err) {
    console.warn("Home page event fetch notice:", err);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";

  // Google Schema.org WebSite with Sitelinks Searchbox
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Eventzone",
    "url": baseUrl,
    "description": "Eventzone is an all-in-one event discovery, interactive floor planning, and event management platform.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Google Schema.org Organization for Knowledge Graph
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Eventzone",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.png`,
    "description": "Premier event management and ticketing platform for conferences, summits, and exhibitions.",
    "sameAs": [
      "https://www.linkedin.com/company/eventzone"
    ]
  };

  // Google Schema.org ItemList for Event Carousel
  const itemListLd = Array.isArray(events) && events.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Featured & Upcoming Events on Eventzone",
    "itemListElement": events.slice(0, 15).map((ev, index) => {
      const eventSlug = ev.slug || ev.id;
      const eventUrl = `${baseUrl}/${eventSlug}`;
      const startDateIso = parseToIso(ev.startDate, 8);
      const endDateIso = parseToIso(ev.endDate || ev.startDate, 18);

      const isVirtual = ev.format?.toLowerCase() === "virtual";
      const isHybrid = ev.format?.toLowerCase() === "hybrid";

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Event",
          "name": ev.title,
          "url": eventUrl,
          "description": ev.tagline || ev.description || `${ev.title} on Eventzone`,
          "startDate": startDateIso,
          "endDate": endDateIso,
          "eventAttendanceMode": isVirtual
            ? "https://schema.org/OnlineEventAttendanceMode"
            : isHybrid
            ? "https://schema.org/MixedEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
          "location": isVirtual
            ? {
                "@type": "VirtualLocation",
                "url": eventUrl
              }
            : {
                "@type": "Place",
                "name": ev.location || "Venue TBA",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": ev.city || "Algiers",
                  "addressCountry": "DZ"
                }
              },
          "image": ev.banner ? [ev.banner] : undefined,
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "DZD",
            "lowPrice": "0",
            "availability": "https://schema.org/InStock",
            "url": `${eventUrl}#tickets`
          },
          "organizer": {
            "@type": "Organization",
            "name": "Eventzone",
            "url": baseUrl
          }
        }
      };
    })
  } : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ]
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Eventzone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Eventzone is an all-in-one event discovery, interactive 2D floor planning, and event management platform for conferences, summits, and exhibitions."
        }
      },
      {
        "@type": "Question",
        "name": "How can I register for events or get tickets on Eventzone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Browse featured events on Eventzone, choose your event, select your ticket tier or RSVP, and receive an instant digital QR badge pass."
        }
      },
      {
        "@type": "Question",
        "name": "How do organizers create summits and design interactive floor plans?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Organizers can host events on Eventzone to publish dynamic agendas, design interactive 2D exhibition floor layouts, manage attendee badges, and scan QR passes in real time."
        }
      },
      {
        "@type": "Question",
        "name": "Is Eventzone accessible on mobile devices?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Eventzone is fully responsive with digital badge passes, offline wallet storage, and real-time networking capabilities."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}
      <HomeClient 
        initialPublicEvents={events} 
        initialView={initialView}
        initialAuthMode={initialAuthMode}
      />
    </>
  );
}
