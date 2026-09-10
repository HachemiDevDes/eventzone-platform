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
    tagline: "Modélisation 2D dynamique, zonage en direct et commercialisation accélérée de vos stands d'exposition.",
    badge: "Module Flagship • Commercialisation Immédiate",
    heroDescription: "Fini les plans d'architecte statiques au format PDF et les suivis de réservations fastidieux sur Excel. Eventzone offre un plan interactif 2D temps réel permettant de modéliser vos espaces, commercialiser vos stands sans risque de doublon, et offrir une orientation intuitive à vos visiteurs.",
    
    // Quick Metrics
    keyMetrics: [
      { value: "+35%", label: "Ventes de stands accélérées" },
      { value: "100%", label: "Zéro surbooking ou doublon" },
      { value: "< 2s", label: "Temps de consultation mobile" },
      { value: "4K+", label: "Stands gérés sur la plateforme" },
    ],

    // Value Pillars (Page 1 & 2 of PDF)
    valuePillars: [
      {
        icon: "Zap",
        title: "Ventes de Stands Accélérées",
        description: "Commercialisez rapidement vos espaces grâce au suivi visuel en temps réel des statuts (Disponible, Réservé, Vendu, VIP) et maximisez votre chiffre d'affaires exposants."
      },
      {
        icon: "Building2",
        title: "Vitrines B2B & Profils Exposants",
        description: "Chaque stand intègre le logo, la description, les catalogues de produits et les coordonnées de l'entreprise pour booster l'engagement des partenaires."
      },
      {
        icon: "Compass",
        title: "Guidage Visiteurs & Orientation Mobile",
        description: "Orientation intuitive dans les halls et allées depuis n'importe quel smartphone, guidant naturellement le flux de participants vers les scènes clés et stands."
      }
    ],

    // Deep Dive Breakdown (Page 4 Module 08 of PDF)
    deepDiveFeatures: [
      {
        title: "Cartographie Dynamique Vectorielle avec Zoom Précis",
        subtitle: "Repérage fluide des allées, halls et scènes principales",
        description: "Une technologie vectorielle ultra-légère permettant aux organisateurs, exposants et visiteurs de naviguer sur le plan d'exposition avec un zoom haute définition, une recherche instantanée par nom ou numéro de stand, et un affichage clair des points d'intérêt (scènes, accueil, restauration, sanitaires).",
        checklist: [
          "Navigation fluide sur mobile, tablette et grand écran tactile",
          "Recherche textuelle instantanée par nom d'entreprise ou catégorie",
          "Mise en valeur visuelle des allées principales et flux de circulation",
          "Exportation vectorielle haute définition pour vos affichages physiques"
        ],
        visualType: "canvas-zoom"
      },
      {
        title: "Zonage & Disponibilité des Stands en Direct",
        subtitle: "Accélérez vos réservations et éliminez les erreurs de vente",
        description: "Attribuez et réservez des stands en un clic lors de vos échanges commerciaux. Le statut des stands est synchronisé instantanément pour toute votre équipe commerciale, évitant tout risque de surbooking ou de double attribution.",
        checklist: [
          "Code couleur intuitif : Disponible (Vert), Réservé (Bleu), VIP (Ambre)",
          "Attribution directe d'un exposant avec tarification au m²",
          "Mise à jour en temps réel sans rechargement de page",
          "Verrouillage temporaire de stand pendant la négociation"
        ],
        visualType: "status-grid"
      },
      {
        title: "Fiches Exposants & Vitrines B2B Interactives",
        subtitle: "Une véritable vitrine numérique connectée à chaque stand",
        description: "Offrez à vos exposants une visibilité augmentée. En cliquant sur un stand, les visiteurs et professionnels accèdent à une fiche détaillée présentant l'entreprise, ses marques, ses catalogues téléchargeables et une prise de rendez-vous directe.",
        checklist: [
          "Intégration des logos, visuels et bannières de marque",
          "Liens directs vers sites web, réseaux sociaux et plaquettes PDF",
          "Formulaire de mise en relation B2B pour générer des leads qualifiés",
          "Mise en avant sponsorisée pour les partenaires premium"
        ],
        visualType: "exhibitor-card"
      },
      {
        title: "Guidage Visiteurs sur Mobile sans Application Obligatoire",
        subtitle: "Une expérience fluide pour chaque participant sur le salon",
        description: "Accessible directement via navigateur web sans téléchargement nécessaire, le plan interactif accompagne les visiteurs tout au long de leur visite. Ils localisent en un instant les conférences, les intervenants et leurs rendez-vous professionnels.",
        checklist: [
          "Chargement instantané en moins d'une seconde sur smartphone",
          "Compatible avec les QR codes affichés sur les totems du salon",
          "Filtre par secteur d'activité pour préparer son parcours de visite",
          "Fonctionne en toute fluidité même lors des pics de fréquentation"
        ],
        visualType: "mobile-guidance"
      }
    ],

    // Traditional vs Eventzone Comparison (PDF Page 1 Value Add)
    comparison: {
      traditional: [
        "Plans au format PDF ou papier figés et rapidement obsolètes",
        "Gestion manuelle sur tableurs Excel générant des doublons",
        "Temps de réponse de plusieurs jours pour confirmer un stand",
        "Aucune visibilité digitale pour les exposants avant le jour J",
        "Visiteurs désorientés cherchant péniblement les allées"
      ],
      eventzone: [
        "Plan vectoriel 2D interactif et dynamique mis à jour en temps réel",
        "Attribution centralisée sans aucun risque d'erreur humaine",
        "Réservation et confirmation instantanées en quelques clics",
        "Vitrines B2B riches avec catalogues, logos et contacts directs",
        "Orientation mobile fluide avec recherche instantanée par stand"
      ]
    },

    // FAQs
    faq: [
      {
        q: "Puis-je importer un plan d'architecte existant (DWG, CAD, PDF ou image) ?",
        a: "Oui, parfaitement ! Notre équipe technique ou vous-même pouvez importer vos plans de masse existants en format image ou PDF haute résolution. Notre éditeur vectoriel permet de décalquer et positionner les stands aux cotes exactes en quelques minutes."
      },
      {
        q: "Les exposants peuvent-ils choisir et réserver leur stand en ligne ?",
        a: "Absolument. Vous pouvez activer le mode réservation publique ou privée. Vos exposants peuvent visualiser les emplacements disponibles, consulter la surface au m² et soumettre une demande de réservation qui vous est transmise pour validation."
      },
      {
        q: "Le plan interactif peut-il être intégré sur notre propre site web d'événement ?",
        a: "Oui, un simple code d'intégration (iframe ou lien direct) permet d'insérer le plan vectoriel interactif sur votre site officiel ou votre portail exposants en toute transparence."
      },
      {
        q: "Comment fonctionne le plan en cas de connexion internet limitée sur le salon ?",
        a: "Le moteur de rendu vectoriel d'Eventzone est ultra-optimisé et met en cache local les données graphiques. Une fois la page ouverte, la navigation et la recherche restent fluides et consultables."
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
