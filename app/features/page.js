import React from "react";
import FeaturesIndexClient from "../../components/features/FeaturesIndexClient";

export const metadata = {
  title: "Toutes les Fonctionnalités | Eventzone",
  description: "Découvrez l'ensemble des modules et fonctionnalités de la plateforme Eventzone : Plans 2D interactifs, billetterie multi-tarifs, check-in QR code, CRM et logistique VIP.",
  alternates: {
    canonical: "https://eventzone.pro/features",
  },
};

export default function FeaturesIndexPage() {
  return <FeaturesIndexClient />;
}
