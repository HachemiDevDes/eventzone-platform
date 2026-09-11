import React from "react";
import RequestQuoteClient from "../../components/RequestQuoteClient";

export const metadata = {
  title: "Demander un Devis | Eventzone — Plateforme Événementielle",
  description: "Demandez un devis sur-mesure pour votre conférence, salon, congrès ou sommet professionnel avec Eventzone : Billetterie CIB/Edahabia, plans 2D interactifs, check-in QR code et matériel sur place.",
  alternates: {
    canonical: "https://eventzone.pro/request-quote",
  },
  openGraph: {
    title: "Demander un Devis — Eventzone",
    description: "Obtenez un devis personnalisé pour votre événement professionnel en Algérie sous 24h avec Eventzone.",
    url: "https://eventzone.pro/request-quote",
    siteName: "Eventzone",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Eventzone Devis",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Demander un Devis — Eventzone",
    description: "Demandez un devis sur-mesure pour votre conférence ou salon avec Eventzone.",
    images: ["/og-image.png"],
  },
};

export default function RequestQuotePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Event Management & Ticketing Infrastructure",
    "provider": {
      "@type": "Organization",
      "name": "Eventzone",
      "url": "https://eventzone.pro"
    },
    "name": "Demande de Devis Événementiel Eventzone",
    "description": "Services technologiques pour événements professionnels : Billetterie, plans interactifs, contrôle d'accès QR code et matériel d'émargement.",
    "areaServed": "DZ",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Eventzone Platform Solutions"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RequestQuoteClient />
    </>
  );
}
