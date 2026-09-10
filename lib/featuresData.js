/**
 * Eventzone Official Features Catalog
 * Source: Proposition Commerciale Eventzone
 * 
 * Brand Guideline Invariant: NEVER use "EventZone". Always "Eventzone" or "eventzone".
 */

export const ALL_FEATURES = [
  {
    slug: "plan-2d-interactif",
    aliases: ["plans-interactifs", "plans-de-salle-vectoriels"],
    moduleNumber: "08",
    category: "Plan 2D & Espaces d'Exposition",
    title: "Plans de Salle Vectoriels Interactifs",
    tagline: "Modélisation 2D dynamique des espaces, allées et stands d'exposition.",
    
    // Quick Metrics
    keyMetrics: [
      { value: "+35%", label: "Ventes accélérées" },
      { value: "100%", label: "Zéro surbooking" },
      { value: "< 2s", label: "Accès mobile" },
      { value: "4K+", label: "Stands gérés" },
    ],

    // Value Pillars (Page 1 & 2 of PDF)
    valuePillars: [
      {
        icon: "Zap",
        title: "Ventes Accélérées",
        description: "Commercialisation rapide grâce au suivi des disponibilités en temps réel."
      },
      {
        icon: "Building2",
        title: "Vitrines B2B",
        description: "Logos, catalogues produits et coordonnées intégrés à chaque stand."
      },
      {
        icon: "Compass",
        title: "Guidage Visiteurs",
        description: "Orientation intuitive dans les halls et allées depuis tout smartphone."
      }
    ],

    // Deep Dive Breakdown (Directly from Page 4 Module 08 of PDF)
    deepDiveFeatures: [
      {
        title: "Plan Vectoriel 2D Interactif",
        description: "Cartographie dynamique du salon avec zoom, recherche par nom et repérage des allées.",
        visualType: "canvas-zoom"
      },
      {
        title: "Zonage & Disponibilité en Direct",
        description: "Suivi visuel de l'état des stands (disponible, réservé...) pour accélérer la commercialisation.",
        visualType: "status-grid"
      },
      {
        title: "Fiches Exposants & Vitrines B2B",
        description: "Profils complets intégrant logos, catalogues produits et coordonnées de contact.",
        visualType: "exhibitor-card"
      },
      {
        title: "Guidage Visiteurs sur Mobile",
        description: "Orientation intuitive dans les halls pour diriger le flux vers les stands et scènes clés.",
        visualType: "mobile-guidance"
      }
    ],

    // Traditional vs Eventzone Comparison
    comparison: {
      traditional: [
        "Plans PDF et papier figés et rapidement obsolètes",
        "Suivi manuel sur tableurs avec risques de doublons",
        "Délais de plusieurs jours pour confirmer un stand"
      ],
      eventzone: [
        "Plan vectoriel 2D dynamique mis à jour en temps réel",
        "Attribution centralisée et zéro surbooking garanti",
        "Réservation et confirmation instantanées en un clic"
      ]
    },

    // FAQs (Concise)
    faq: [
      {
        q: "Puis-je importer un plan d'architecte existant ?",
        a: "Oui, notre éditeur permet d'importer vos plans de masse PDF ou image et de positionner vos stands aux cotes exactes."
      },
      {
        q: "Les exposants peuvent-ils réserver leur stand en ligne ?",
        a: "Oui, vous pouvez ouvrir la réservation en ligne avec validation automatique ou manuelle de chaque demande."
      },
      {
        q: "Le plan peut-il être intégré sur notre site web ?",
        a: "Oui, via un simple code d'intégration iframe ou lien direct sur votre portail événementiel."
      }
    ]
  },

  // Module 03: Billetterie & Inscriptions Multi-Tarifs
  {
    slug: "billetterie-inscriptions",
    aliases: ["billetterie", "inscriptions-multi-tarifs"],
    moduleNumber: "03",
    category: "Système Pré-Événement",
    title: "Billetterie & Inscriptions Multi-Tarifs",
    tagline: "Gestion flexible des pass, formulaires dynamiques à validation conditionnelle et paiements sécurisés.",
    badge: "Module 03 • Conversion & Ventes",
    heroDescription: "Configurez des catégories de billets sur-mesure (VIP, Early Bird, Étudiant, Exposant), récoltez les informations stratégiques de vos participants et encaissez les paiements en toute sécurité via CIB, Edahabia ou carte bancaire.",
    keyMetrics: [
      { value: "100%", label: "Conforme CIB / Edahabia" },
      { value: "+45%", label: "Hausse du taux de conversion" },
      { value: "0€", label: "Frais cachés d'infrastructure" },
      { value: "< 1s", label: "Émission instantanée du billet" }
    ],
    valuePillars: [
      {
        icon: "CreditCard",
        title: "Pass Multi-Tarifs & Quotas",
        description: "Définissez des tarifs flexibles avec dates limites, codes promotionnels, quotas limités et accès par créneaux horaires."
      },
      {
        icon: "FileCheck",
        title: "Formulaires Conditionnels Intelligents",
        description: "Posez les bonnes questions selon le type de billet choisi (société, fonction, besoins alimentaires, ateliers)."
      },
      {
        icon: "ShieldCheck",
        title: "Paiements Sécurisés & Factures",
        description: "Intégration directe des passerelles de paiement locales et internationales avec émission automatisée des reçus et factures."
      }
    ]
  },

  // Module 06: Émargement Express & Mode Hors-Ligne
  {
    slug: "emargement-express-qr",
    aliases: ["check-in-express", "mode-hors-ligne"],
    moduleNumber: "06",
    category: "Opérations Jour-J & Mode Hors-Ligne",
    title: "Émargement Express par QR Code & Mode Hors-Ligne",
    tagline: "Scan ultra-rapide en moins de 2 secondes par participant et continuité totale sans coupure même hors-ligne.",
    badge: "Module 06 • Jour-J & Accueil Sans Attente",
    heroDescription: "Supprimez définitivement les files d'attente à l'entrée de vos congrès et salons. Notre technologie de check-in express valide chaque badge en moins de 2 secondes et fonctionne en toute autonomie, même en cas de coupure totale d'Internet.",
    keyMetrics: [
      { value: "< 2s", label: "Temps moyen de check-in" },
      { value: "0 file", label: "Fluidité totale à l'accueil" },
      { value: "100%", label: "Autonomie hors-ligne totale" },
      { value: "0 doublon", label: "Détection anti-fraude" }
    ],
    valuePillars: [
      {
        icon: "QrCode",
        title: "Scan Ultra-Rapide (< 2s)",
        description: "Validation instantanée via appareil photo smartphone, tablette ou douchettes professionnelles haute cadence."
      },
      {
        icon: "WifiOff",
        title: "Mode Hors-Ligne Résilient",
        description: "Inscriptions et contrôle d'accès continus sans aucune coupure, avec resynchronisation automatique en arrière-plan."
      },
      {
        icon: "Printer",
        title: "Impression Immédiate des Badges",
        description: "Édition instantanée sur place au format A4 pré-imprimé ou rouleau thermique dès le passage de la borne."
      }
    ]
  },

  // Module 04: CRM & Gestion des Participants
  {
    slug: "crm-participants",
    aliases: ["crm-evenementiel", "easy-upload"],
    moduleNumber: "04",
    category: "CRM & Gestion des Participants",
    title: "CRM Événementiel & Import Massif « Easy Upload »",
    tagline: "Centralisation de toutes vos données, import en un clic sans doublons et segmentation fine.",
    badge: "Module 04 • Zéro Doublon & Données Fiables",
    heroDescription: "Intégrez vos listes Excel de visiteurs, VIP, intervenants et exposants en un seul clic. Notre moteur de nettoyage automatique supprime les doublons, formate les numéros et structure votre base de données pour un ciblage parfait.",
    keyMetrics: [
      { value: "1 Clic", label: "Import massif Excel & CSV" },
      { value: "100%", label: "Dédoublonnage automatisé" },
      { value: "0", label: "Risque d'erreur manuelle" },
      { value: "360°", label: "Vue profil participant" }
    ],
    valuePillars: [
      {
        icon: "UploadCloud",
        title: "Import Massif « Easy Upload »",
        description: "Glissez-déposez vos fichiers Excel avec reconnaissance intelligente automatique des colonnes sans configuration complexe."
      },
      {
        icon: "Sparkles",
        title: "Dédoublonnage & Nettoyage",
        description: "Détection instantanée des doublons par e-mail ou téléphone, fusion des historiques et fiabilisation de vos contacts."
      },
      {
        icon: "Users",
        title: "Segmentation Fine & Ciblage",
        description: "Classez vos participants par profil (VIP, presse, décideurs, acheteurs) pour personnaliser vos communications."
      }
    ]
  },

  // Module 05: Logistique Intervenants & VIP
  {
    slug: "logistique-vip",
    aliases: ["vip-speakers-logistics"],
    moduleNumber: "05",
    category: "Logistique Intervenants & VIP",
    title: "Logistique VIP, Hébergement & Matériel",
    tagline: "Pilotage centralisé des réservations d'hôtel, transferts aéroport, accueil protocolaire et inventaire technique.",
    badge: "Module 05 • Accueil Protocolaire Haut de Gamme",
    heroDescription: "Offrez un traitement d'exception à vos conférenciers internationaux et invités d'honneur. Coordonnez les vols, les navettes, les nuits d'hôtel et le matériel audiovisuel sur un tableau de bord unifié.",
    keyMetrics: [
      { value: "1 Écran", label: "Pilotage logistique intégral" },
      { value: "0 Retard", label: "Synchronisation transferts" },
      { value: "100%", label: "Suivi matériel audiovisuel" },
      { value: "VIP", label: "Fiches protocolaires dédiées" }
    ],
    valuePillars: [
      {
        icon: "Plane",
        title: "Voyages & Transferts Aéroport",
        description: "Gestion des numéros de vol, créneaux d'arrivée et coordination des chauffeurs pour un accueil sans faille."
      },
      {
        icon: "Hotel",
        title: "Hébergement & Suivi RSVP",
        description: "Attribution des chambres, gestion des confirmations de présence et prise en compte des préférences spécifiques."
      },
      {
        icon: "Layers",
        title: "Inventaire & Équipements",
        description: "Traçabilité du matériel technique, régie audiovisuelle, micros et badges VIP en temps réel sur site."
      }
    ]
  },

  // Module 10: Marketing d'Influence & Affiliation
  {
    slug: "marketing-influence-affiliation",
    aliases: ["affiliation", "influenceurs"],
    moduleNumber: "10",
    category: "Marketing d'Influence & Affiliation",
    title: "Marketing d'Influence, Liens de Parrainage & Affiliation",
    tagline: "Génération de liens sur-mesure, tracking précis du trafic et attribution exacte du chiffre d'affaires billetterie.",
    badge: "Module 10 • Croissance & Attribution ROI",
    heroDescription: "Mobilisez des créateurs de contenu, ambassadeurs et partenaires médias pour démultiplier la visibilité de votre événement. Suivez exactement les clics, les réservations et automatisez le calcul des commissions en toute transparence.",
    keyMetrics: [
      { value: "100%", label: "Traçabilité des ventes" },
      { value: "Temps Réel", label: "Dashboard par affilié" },
      { value: "+30%", label: "Croissance des inscriptions" },
      { value: "Auto", label: "Calcul des commissions" }
    ],
    valuePillars: [
      {
        icon: "Link2",
        title: "Liens Personnalisés Uniques",
        description: "Générez en quelques secondes des URLs traquées avec codes promos exclusifs pour chaque ambassadeur."
      },
      {
        icon: "BarChart3",
        title: "Attribution Précise du CA",
        description: "Identifiez immédiatement vos meilleurs prescripteurs et mesurez le retour sur investissement réel de chaque partenariat."
      },
      {
        icon: "DollarSign",
        title: "Gestion Automatisée des Commissions",
        description: "Calcul fluide des rémunérations partenaires au pourcentage ou à la prime fixe sans tableur manuel."
      }
    ]
  },

  // Module 11: Post-Événement & Certificats
  {
    slug: "dashboard-analytics-certificats",
    aliases: ["analytics", "certificats-automatises"],
    moduleNumber: "11",
    category: "Post-Événement & Analytics",
    title: "Dashboard Analytics Avancé & Certificats Automatisés",
    tagline: "Analyse approfondie de l'affluence, pics d'accès par créneau et génération instantanée de certificats vérifiables.",
    badge: "Module 11 • Bilan & Valorisation Post-Event",
    heroDescription: "Tirez le meilleur parti de vos données après le jour J. Analysez les flux de visiteurs, valorisez vos résultats auprès de vos sponsors et envoyez automatiquement des attestations de présence personnalisées et sécurisées.",
    keyMetrics: [
      { value: "Instantané", label: "Génération des attestations" },
      { value: "Excel & PDF", label: "Export universel des données" },
      { value: "100%", label: "Authenticité vérifiable par QR" },
      { value: "Pics d'accès", label: "Cartographie de l'affluence" }
    ],
    valuePillars: [
      {
        icon: "Activity",
        title: "Analyse d'Affluence & Fréquentation",
        description: "Visualisez les heures de pointe, les salles les plus sollicitées et les profils de participants les plus actifs."
      },
      {
        icon: "Award",
        title: "Certificats & Diplômes Numériques",
        description: "Édition et envoi automatique de certificats de présence personnalisés, téléchargeables avec QR code de vérification."
      },
      {
        icon: "FileDown",
        title: "Export Universel en Un Clic",
        description: "Exportez l'intégralité de vos rapports, listes d'émargement et statistiques aux formats Excel, CSV et PDF."
      }
    ]
  }
];

export function getFeatureBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();
  return ALL_FEATURES.find(
    f => f.slug === cleanSlug || (f.aliases && f.aliases.includes(cleanSlug))
  ) || null;
}
