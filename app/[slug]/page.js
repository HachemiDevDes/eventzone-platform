import React from "react";
import { fetchEventDetails } from "../../lib/db";
import EventLandingClient from "./EventLandingClient";

/**
 * Dynamic SEO Metadata Generation for Event Landing Pages
 * Allows search engines (Google, Bing) to index official event titles, dates, descriptions & OG images
 */
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || "");

  if (!slug) {
    return {
      title: "Event Details | Eventzone",
      description: "Discover and register for premier conferences, summits, and expos on Eventzone.",
    };
  }

  const event = await fetchEventDetails(slug);

  if (!event || !event.id) {
    return {
      title: "Event Not Found | Eventzone",
      description: "The event you are looking for could not be found or has been moved.",
    };
  }

  const dateSnippet = event.startDate ? ` on ${event.startDate}` : "";
  const locationSnippet = event.location ? ` in ${event.location}` : "";
  const baseDescription = event.tagline || event.description || `Register for ${event.title}${dateSnippet}${locationSnippet}. Discover the event agenda, keynote speakers, floor plans, and tickets on Eventzone.`;
  const cleanDescription = baseDescription.replace(/\s+/g, " ").trim().slice(0, 160);

  const canonicalUrl = `https://eventzone.pro/${event.slug || slug}`;
  const bannerImage = event.banner || event.cover_url || "https://i.imgur.com/jFDrQbM.png";

  const keywords = [
    event.title,
    event.category,
    event.location,
    event.venueName,
    "Eventzone",
    "event tickets",
    "conference registration",
    "summit",
    "expo",
    "Algeria events"
  ].filter(Boolean);

  return {
    title: `${event.title} — Tickets & Event Details`,
    description: cleanDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${event.title} | Eventzone`,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: "Eventzone",
      images: [
        {
          url: bannerImage,
          width: 1200,
          height: 630,
          alt: `${event.title} Banner`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} | Eventzone`,
      description: cleanDescription,
      images: [bannerImage],
    },
  };
}

/**
 * Server Component: Injects Google Event Schema.org JSON-LD Structured Data
 * and passes initialEvent to the interactive client component
 */
export default async function Page({ params }) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || "");

  const event = await fetchEventDetails(slug);

  let jsonLd = null;
  if (event && event.id) {
    const canonicalUrl = `https://eventzone.pro/${event.slug || slug}`;
    const attendanceMode = event.type === "Virtual"
      ? "https://schema.org/OnlineEventAttendanceMode"
      : (event.type === "Hybrid" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode");

    const parseToIso = (dateStr, defaultHour = 9) => {
      if (!dateStr) return new Date().toISOString();
      try {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          if (!String(dateStr).includes("T") && !String(dateStr).includes(":")) {
            parsed.setHours(defaultHour, 0, 0, 0);
          }
          return parsed.toISOString();
        }
      } catch (e) {}
      return new Date().toISOString();
    };

    const startDateIso = parseToIso(event.startDate, 9);
    const endDateIso = parseToIso(event.endDate || event.startDate, 18);

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "description": event.description || event.tagline || `${event.title} on Eventzone`,
      "image": [event.banner || event.cover_url || "https://i.imgur.com/jFDrQbM.png"].filter(Boolean),
      "startDate": startDateIso,
      "endDate": endDateIso,
      "eventStatus": event.status === "suspended" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      "eventAttendanceMode": attendanceMode,
      "location": event.type === "Virtual" ? {
        "@type": "VirtualLocation",
        "url": canonicalUrl
      } : {
        "@type": "Place",
        "name": event.venueName || event.location || "Event Venue",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": event.venueName || event.location || "Venue Location",
          "addressLocality": event.location || "Algiers",
          "addressCountry": "DZ"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "Eventzone",
        "url": "https://eventzone.pro"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "DZD",
        "lowPrice": "0",
        "availability": "https://schema.org/InStock",
        "url": `${canonicalUrl}#tickets`,
        "validFrom": event.startDate || new Date().toISOString()
      }
    };

    var breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://eventzone.pro"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Events",
          "item": "https://eventzone.pro#explore"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": event.title,
          "item": canonicalUrl
        }
      ]
    };

    var faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `When does ${event.title} take place?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${event.title} starts on ${event.startDate || "the announced start date"}${event.endDate && event.endDate !== event.startDate ? ` and runs through ${event.endDate}` : ""}.`
          }
        },
        {
          "@type": "Question",
          "name": `Where is ${event.title} located?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": event.type === "Virtual" 
              ? `${event.title} is hosted virtually online with live streaming access.` 
              : `${event.title} takes place at ${event.venueName || event.location || "Algiers, Algeria"}.`
          }
        },
        {
          "@type": "Question",
          "name": `How do I get tickets or register for ${event.title}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `You can register or secure tickets directly on the official Eventzone event page. Badges and QR passes are issued digitally.`
          }
        },
        {
          "@type": "Question",
          "name": `What is the attendance mode for ${event.title}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `The event is organized as a ${event.type || "In-Person"} event format.`
          }
        }
      ]
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <EventLandingClient slug={slug} initialEvent={event} />
    </>
  );
}
