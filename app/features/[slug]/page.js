import React from "react";
import { notFound } from "next/navigation";
import { getFeatureBySlug, ALL_FEATURES } from "../../../lib/featuresData";
import FeatureNavbar from "../../../components/features/FeatureNavbar";
import FeatureHero from "../../../components/features/FeatureHero";
import InteractiveFloorPlanPreview from "../../../components/features/InteractiveFloorPlanPreview";
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

  const isFloorPlan = feature.slug === "plan-2d-interactif" || feature.slug.includes("plan");

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

        {/* Interactive Live Product Preview Widget (Flagship Showcase) */}
        {isFloorPlan && (
          <section id="simulateur" className="py-12 sm:py-16 bg-slate-100/70 border-y border-slate-200/80 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                  Expérience Interactive en Direct
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  Testez la Puissance du Plan Vectoriel 2D
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600">
                  Cliquez sur n'importe quel stand ci-dessous pour filtrer les disponibilités, explorer les fiches exposants connectées et simuler une réservation en temps réel.
                </p>
              </div>

              {/* Interactive Simulator */}
              <div className="max-w-6xl mx-auto">
                <InteractiveFloorPlanPreview />
              </div>
            </div>
          </section>
        )}

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
