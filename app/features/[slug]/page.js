import React from "react";
import { notFound } from "next/navigation";
import { getFeatureBySlug, ALL_FEATURES } from "../../../lib/featuresData";
import FeatureNavbar from "../../../components/features/FeatureNavbar";
import FeatureHero from "../../../components/features/FeatureHero";
import FeatureBenefitsGrid from "../../../components/features/FeatureBenefitsGrid";
import FeatureDeepDive from "../../../components/features/FeatureDeepDive";
import FeatureComparison from "../../../components/features/FeatureComparison";
import FeatureFaq from "../../../components/features/FeatureFaq";
import FeatureCtaBanner from "../../../components/features/FeatureCtaBanner";
import FeatureRelatedCarousel from "../../../components/features/FeatureRelatedCarousel";
import Footer from "../../../components/Footer";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    return {
      title: "Fonctionnalité introuvable | Eventzone",
      description: "La fonctionnalité demandée n'existe pas ou a été déplacée.",
    };
  }

  const title = `${feature.title} — Eventzone`;
  const description = `${feature.tagline} Découvrez la solution Eventzone pour l'organisation et la gestion d'événements professionnels.`;

  return {
    title,
    description,
    keywords: [
      "Eventzone",
      feature.title,
      feature.category,
      "gestion événementielle",
      "organisation salon",
      "billetterie",
      "plan 2d interactif",
      "check-in qr code",
      "Algérie",
      "Alger"
    ],
    openGraph: {
      title,
      description,
      url: `https://eventzone.pro/features/${feature.slug}`,
      siteName: "Eventzone",
      locale: "fr_FR",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: feature.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `https://eventzone.pro/features/${feature.slug}`,
    }
  };
}

export default async function FeatureDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar with Breadcrumbs & Action */}
      <FeatureNavbar 
        featureTitle={feature.title} 
        category={feature.category} 
      />

      <main className="flex-1">
        {/* Hero Section with Value Header & Performance Metrics */}
        <FeatureHero feature={feature} />

        {/* 3 Value Pillars (Benefit Cards from PDF Page 1) */}
        <FeatureBenefitsGrid feature={feature} />

        {/* Deep Dive Capabilities (4 Detailed Alternating Cards) */}
        <FeatureDeepDive feature={feature} />

        {/* Traditional Methods vs Eventzone Side-by-Side Comparison */}
        <FeatureComparison feature={feature} />

        {/* FAQ Accordion */}
        <FeatureFaq feature={feature} />

        {/* Closing Deployment & Instant Devis Banner (PDF Page 5) */}
        <FeatureCtaBanner featureTitle={feature.title} />

        {/* Related Feature Modules Exploration */}
        <FeatureRelatedCarousel currentSlug={feature.slug} />
      </main>

      {/* Global Eventzone Footer */}
      <Footer />
    </div>
  );
}
