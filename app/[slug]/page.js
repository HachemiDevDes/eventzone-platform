import React from "react";
import { fetchEventDetails, fetchTickets } from "../../lib/db";
import { stripHtml } from "../../lib/constants";
import EventLandingClient from "./EventLandingClient";

function ensureAbsoluteUrl(url, baseUrl = "https://eventzone.pro") {
  if (!url || typeof url !== "string") return `${baseUrl}/og-image.png`;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${baseUrl}${trimmed}`;
  return `${baseUrl}/${trimmed}`;
}

/**
 * Dynamic SEO Metadata Generation for Event Landing Pages
 * Allows search engines (Google, Bing) and social platforms (WhatsApp, Twitter, LinkedIn)
 * to unfurl official event titles, ticket registration passes, and banner images
 */
export async function generateMetadata(props) {
  const resolvedParams = await props?.params;
  const searchParams = (await props?.searchParams) || {};
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
  const fallbackDescription = `Register for ${event.title}${dateSnippet}${locationSnippet}. Discover the event agenda, keynote speakers, floor plans, and tickets on Eventzone.`;

  const plainTagline = stripHtml(event.tagline);
  const plainDescription = stripHtml(event.description);
  const eventSnippet = plainTagline || plainDescription;

  // Check if a specific ticket tier is present in query parameters
  const rawTicketParam = searchParams.ticket || searchParams.ticketId;
  const isRegisterView = searchParams.view === "register" || searchParams.register === "true";
  let cleanTicketName = "";
  if (rawTicketParam) {
    const rawTicketStr = typeof rawTicketParam === "string" ? rawTicketParam.replace(/\+/g, " ") : "";
    try {
      cleanTicketName = stripHtml(decodeURIComponent(rawTicketStr)).replace(/\s+/g, " ").trim();
    } catch (e) {
      cleanTicketName = stripHtml(rawTicketStr).replace(/\s+/g, " ").trim();
    }
  }

  if ((!cleanTicketName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTicketName)) && isRegisterView) {
    try {
      const eventTickets = await fetchTickets(event.id);
      const activeTickets = Array.isArray(eventTickets) ? eventTickets.filter(t => !t.isArchived && String(t.status || '').toLowerCase() !== 'archived') : [];
      if (activeTickets.length > 0) {
        const matchedTicket = activeTickets.find(t => t.id === rawTicketParam) || activeTickets[0];
        if (matchedTicket && matchedTicket.name) {
          cleanTicketName = stripHtml(matchedTicket.name).replace(/\s+/g, " ").trim();
        }
      }
    } catch (tErr) {
      console.warn("slug generateMetadata ticket lookup notice:", tErr);
    }
  }

  const rawImage = event.banner || event.cover_url || (Array.isArray(event.gallery) && event.gallery[0]) || "";
  const bannerImage = ensureAbsoluteUrl(rawImage, "https://eventzone.pro");

  let metaTitle = `${event.title} — Tickets & Event Details`;
  let ogTitle = `${event.title} | Eventzone`;
  let cleanDescription = "";

  if (cleanTicketName) {
    // User requirement: make the text the same name of the ticket
    metaTitle = `${cleanTicketName} | ${event.title}`;
    ogTitle = cleanTicketName;
    const rawTicketDesc = `Register for ${cleanTicketName} at ${event.title}${dateSnippet}${locationSnippet}.${eventSnippet ? ` ${eventSnippet}` : " Get your pass on Eventzone."}`.trim();
    cleanDescription = rawTicketDesc.length > 160 
      ? `${rawTicketDesc.slice(0, 157).trimEnd()}...` 
      : rawTicketDesc;
  } else {
    const rawDescription = eventSnippet || fallbackDescription;
    cleanDescription = rawDescription.length > 160 
      ? `${rawDescription.slice(0, 157).trimEnd()}...` 
      : rawDescription;
  }

  const canonicalUrl = `https://eventzone.pro/${event.slug || slug}${cleanTicketName ? `?ticket=${encodeURIComponent(cleanTicketName)}` : ""}`;

  const keywords = [
    cleanTicketName,
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
    title: metaTitle,
    description: cleanDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: "Eventzone",
      images: [
        {
          url: bannerImage,
          width: 1200,
          height: 630,
          alt: cleanTicketName || `${event.title} Banner`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
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
    const fallbackDescription = `Register for ${event.title}${event.startDate ? ` on ${event.startDate}` : ""}. Discover the event agenda, keynote speakers, floor plans, and tickets on Eventzone.`;
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
      "description": stripHtml(event.description) || stripHtml(event.tagline) || fallbackDescription,
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
        "name": event.organizerName || event.organization || event.hostName || "Eventzone",
        "url": event.websiteUrl || canonicalUrl
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
