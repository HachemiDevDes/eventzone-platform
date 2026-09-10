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
    heroDescription: "Transformez vos plans de masse en une cartographie vectorielle interactive haute précision. Suivez l'attribution des stands en direct, offrez une vitrine B2B connectée à chaque exposant et guidez vos visiteurs avec fluidité.",
    
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
        subtitle: "Cartographie haute précision & zoom fluide",
        description: "Naviguez avec fluidité sur le plan d'exposition avec un zoom dynamique sans perte de qualité. Les visiteurs et exposants localisent instantanément chaque stand, allée, scène et point d'intérêt.",
        checklist: [
          "Recherche textuelle instantanée par nom d'entreprise ou catégorie",
          "Repérage visuel des allées, scènes et zones de restauration",
          "Affichage net et fluide sur mobile, tablette et bornes tactiles"
        ],
        visualType: "canvas-zoom"
      },
      {
        title: "Zonage & Disponibilité en Direct",
        subtitle: "Synchronisation commerciale en temps réel",
        description: "Gérez et visualisez l'état de chaque stand en direct lors de vos échanges commerciaux. L'attribution instantanée élimine les risques de doublons et accélère la signature de vos contrats d'exposition.",
        checklist: [
          "Code couleur clair : disponible, réservé, VIP ou sponsor",
          "Attribution centralisée et zéro surbooking garanti",
          "Tarification dynamique et gestion des options de réservation"
        ],
        visualType: "status-grid"
      },
      {
        title: "Fiches Exposants & Vitrines B2B",
        subtitle: "Visibilité numérique augmentée pour chaque marque",
        description: "En cliquant sur un stand, les visiteurs découvrent un profil complet intégrant logos, plaquettes PDF téléchargeables, coordonnées et formulaires de mise en relation directe.",
        checklist: [
          "Vitrines de présentation avec catalogues et coordonnées",
          "Génération de leads qualifiés et mise en relation directe",
          "Mise en avant sponsorisée pour vos partenaires majeurs"
        ],
        visualType: "exhibitor-card"
      },
      {
        title: "Guidage Visiteurs sur Mobile",
        subtitle: "Orientation immédiate sans aucune application",
        description: "Scannez un QR code à l'entrée du salon pour ouvrir immédiatement le plan interactif dans le navigateur de votre smartphone. Les participants s'orientent facilement vers les conférences et les stands.",
        checklist: [
          "Accès 100% web sans téléchargement d'application",
          "Chargement instantané en moins de 2 secondes",
          "Repérage intuitif des allées et parcours de visite"
        ],
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
    ],
    deepDiveFeatures: [
      {
        title: "Tarification Multi-Niveaux & Quotas",
        subtitle: "Gestion dynamique des ventes de pass",
        description: "Créez des grilles tarifaires sur-mesure adaptées à chaque profil : pass standard, accès VIP, billets étudiants ou packages exposants avec quotas stricts.",
        checklist: [
          "Quotas de places gérés en direct avec alerte d'épuisement",
          "Gestion des tarifs Early Bird avec date d'expiration automatique",
          "Codes promotionnels personnalisés avec remises fixes ou pourcentage"
        ],
        visualType: "ticket-pricing"
      },
      {
        title: "Formulaires d'Inscription Dynamiques",
        subtitle: "Collecte de données ciblée et intelligente",
        description: "Adaptez instantanément les questions posées en fonction du pass choisi. Collectez les structures, postes, régimes alimentaires ou ateliers désirés.",
        checklist: [
          "Champs conditionnels contextuels selon le profil d'acheteur",
          "Téléversement de justificatifs d'adhésion ou cartes étudiantes",
          "Validation automatique des formats d'e-mails et téléphones"
        ],
        visualType: "dynamic-form"
      },
      {
        title: "Paiement Sécurisé CIB & Edahabia",
        subtitle: "Intégration bancaire locale certifiée",
        description: "Encaissez vos recettes directement en Dinars Algériens via les cartes interbancaires CIB et Edahabia, ou par carte bancaire internationale.",
        checklist: [
          "Passerelle certifiée conforme aux normes monétiques nationales",
          "Confirmation de paiement immédiate et sécurisation 3D Secure",
          "Génération automatique de reçus fiscaux et factures acquittées"
        ],
        visualType: "payment-methods"
      },
      {
        title: "Émission Instantanée de Billets Sécurisés",
        subtitle: "Délivrance immédiate sur mobile et e-mail",
        description: "Chaque participant reçoit son pass nominatif haute définition immédiatement après validation, prêt à être scanné le jour J.",
        checklist: [
          "QR code crypté infalsifiable unique par participant",
          "Billet numérique téléchargeable sur smartphone ou imprimable",
          "Envoi automatisé avec rappels de calendrier synchronisés"
        ],
        visualType: "digital-pass"
      }
    ],
    comparison: {
      traditional: [
        "Encaissement manuel sur place ou virements bancaires fastidieux",
        "Multiplication des tableurs Excel avec risques fréquents de survente",
        "Édition manuelle des billets par e-mail source d'erreurs et de retards"
      ],
      eventzone: [
        "Paiement électronique instantané par Edahabia, CIB et carte bancaire",
        "Gestion automatisée des quotas et tarifs en temps réel",
        "Émission immédiate de pass nominatifs sécurisés avec QR code unique"
      ]
    },
    faq: [
      {
        q: "Les cartes bancaires locales Edahabia et CIB sont-elles acceptées ?",
        a: "Oui, Eventzone intègre nativement les paiements électroniques par carte Edahabia et CIB avec validation monétique instantanée."
      },
      {
        q: "Puis-je créer des codes de réduction et des tarifs Early Bird ?",
        a: "Absolument. Vous pouvez paramétrer des remises en pourcentage ou montant fixe avec dates limites et limites de quantité."
      },
      {
        q: "Les billets émis sont-ils nominatifs et sécurisés ?",
        a: "Oui, chaque billet contient les coordonnées du participant et un QR code unique crypté empêchant toute falsification ou réutilisation."
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
    ],
    deepDiveFeatures: [
      {
        title: "Validation Instantanée par QR Code",
        subtitle: "Fluidité totale pour l'accueil de grands flux",
        description: "Scannez chaque billet en une fraction de seconde grâce à un algorithme de reconnaissance optique ultra-rapide sans latence.",
        checklist: [
          "Cadence élevée de contrôle jusqu'à 30 participants par minute et par porte",
          "Retour visuel et sonore immédiat pour guider l'agent d'accueil",
          "Compatible avec simples smartphones, tablettes ou scanners laser"
        ],
        visualType: "scan-success"
      },
      {
        title: "Continuité Opérationnelle Hors-Ligne",
        subtitle: "Zéro coupure même sans Wi-Fi ni 4G",
        description: "Les opérations se poursuivent sans interruption en cas de coupure réseau grâce à une synchronisation locale ultra-sécurisée.",
        checklist: [
          "Base de données locale autonome embarquée sur chaque terminal",
          "Validation continue des pass sans dépendance à une connexion",
          "Synchronisation automatique et transparente dès le retour du réseau"
        ],
        visualType: "offline-resilience"
      },
      {
        title: "Détection Anti-Fraude & Zéro Doublon",
        subtitle: "Contrôle d'accès rigoureux et traçabilité",
        description: "Empêchez l'utilisation frauduleuse de billets dupliqués grâce à une vérification centralisée instantanée entre tous les accès.",
        checklist: [
          "Alerte visuelle immédiate en cas de tentative de réutilisation",
          "Horodatage précis de l'entrée avec indication de la porte empruntée",
          "Gestion des droits d'accès restreints aux zones VIP et conférences"
        ],
        visualType: "anti-fraud"
      },
      {
        title: "Impression Directe de Badges sur Site",
        subtitle: "Badge personnalisé délivré en 3 secondes",
        description: "Délivrez des badges de haute qualité au moment précis de l'arrivée du participant pour éliminer le gaspillage et les pertes.",
        checklist: [
          "Impression instantanée déclenchée automatiquement dès le scan",
          "Format sur-mesure intégrant logo, nom, société et catégorie",
          "Compatibilité avec imprimantes thermiques professionnelles ou A4"
        ],
        visualType: "badge-print"
      }
    ],
    comparison: {
      traditional: [
        "Listes papier volumineuses à cocher à la main avec files d'attente interminables",
        "Blocage complet des portes en cas de coupure d'Internet ou de serveur indisponible",
        "Impossibilité de détecter les photocopies ou les badges utilisés plusieurs fois"
      ],
      eventzone: [
        "Scan instantané en moins de 2 secondes avec indication claire des droits d'accès",
        "Continuité opérationnelle garantie à 100% en mode hors-ligne résilient",
        "Alerte anti-fraude immédiate empêchant toute réutilisation d'un même pass"
      ]
    },
    faq: [
      {
        q: "Que se passe-t-il si la connexion Internet est coupée pendant l'accueil ?",
        a: "L'application bascule automatiquement en mode hors-ligne. Les scans continuent sans aucun ralentissement et les données se synchronisent dès le retour d'Internet."
      },
      {
        q: "Faut-il du matériel spécialisé pour utiliser le système ?",
        a: "Non, de simples smartphones ou tablettes suffisent. Si vous attendez des milliers de visiteurs, vous pouvez connecter des douchettes Bluetooth haute vitesse."
      },
      {
        q: "Peut-on gérer plusieurs portes avec des personnels différents ?",
        a: "Oui, vous pouvez créer des accès dédiés par porte d'entrée et suivre les flux de chaque point d'accès en direct."
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
    ],
    deepDiveFeatures: [
      {
        title: "Import Massif « Easy Upload » en Un Clic",
        subtitle: "Intégration universelle de vos listings Excel et CSV",
        description: "Glissez-déposez vos listes de contacts existantes. Notre algorithme identifie instantanément les colonnes prénom, nom, société et coordonnées.",
        checklist: [
          "Reconnaissance automatique des en-têtes sans reformatage préalable",
          "Traitement fluide de fichiers de plusieurs dizaines de milliers de lignes",
          "Rapport de prévisualisation avant validation définitive de l'import"
        ],
        visualType: "easy-upload"
      },
      {
        title: "Dédoublonnage & Nettoyage Automatique",
        subtitle: "Base de données saine et certifiée",
        description: "Éliminez les inscriptions répétées et normalisez automatiquement les formats de numéros de téléphone et d'adresses e-mail.",
        checklist: [
          "Détection des correspondances par e-mail, téléphone et nom d'entreprise",
          "Fusion intelligente conservant les historiques d'achats et présences",
          "Nettoyage automatique des espaces et fautes de frappe courantes"
        ],
        visualType: "deduplication"
      },
      {
        title: "Segmentation Dynamique & Filtres Avancés",
        subtitle: "Ciblage sur-mesure pour vos communications",
        description: "Segmentez vos listes de participants par secteur d'activité, fonction, type de pass ou comportement lors des éditions précédentes.",
        checklist: [
          "Création de segments personnalisés (VIP, Presse, Décideurs, Acheteurs)",
          "Filtres combinés multi-critères avec actualisation en direct",
          "Export ciblé pour vos envois d'invitations et newsletters"
        ],
        visualType: "segmentation"
      },
      {
        title: "Fiche Participant Vue 360°",
        subtitle: "Historique complet et interactions centralisées",
        description: "Consultez en un coup d'œil l'ensemble du parcours d'un participant à travers tous vos événements : commandes, présences et notes internes.",
        checklist: [
          "Traçabilité intégrale des éditions précédentes et conférences suivies",
          "Statut d'émargement en temps réel le jour de l'événement",
          "Gestion des tags personnalisés et annotations d'équipe"
        ],
        visualType: "participant-360"
      }
    ],
    comparison: {
      traditional: [
        "Fichiers Excel multiples éparpillés entre organisateurs avec doublons permanents",
        "Nettoyage manuel fastidieux ligne par ligne avant chaque campagne",
        "Aucune traçabilité de l'historique de fidélité ou de présence des participants"
      ],
      eventzone: [
        "Import universel en un clic avec reconnaissance intelligente des champs",
        "Moteur de dédoublonnage automatique garantissant des données fiables",
        "Profil 360° unifié rassemblant l'ensemble des participations et badges"
      ]
    },
    faq: [
      {
        q: "Quels formats de fichiers sont acceptés pour l'import ?",
        a: "Vous pouvez importer directement des fichiers Excel (.xlsx, .xls) et CSV, sans restriction sur l'ordre des colonnes."
      },
      {
        q: "Comment fonctionne la détection des doublons ?",
        a: "Le système analyse l'adresse e-mail et le numéro de téléphone pour fusionner les profils existants sans perdre d'historique."
      },
      {
        q: "Mes données de contacts sont-elles sécurisées ?",
        a: "Oui, vos bases de données sont entièrement isolées, chiffrées au repos et accessibles uniquement par vos équipes autorisées."
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
    ],
    deepDiveFeatures: [
      {
        title: "Coordination des Vols & Navettes Aéroport",
        subtitle: "Accueil protocolaire sans aucun temps mort",
        description: "Suivez les heures d'atterrissage réelles de vos conférenciers et assignez les chauffeurs et véhicules avec notifications automatiques.",
        checklist: [
          "Suivi des numéros de vol avec mise à jour des heures d'arrivée",
          "Attribution des chauffeurs et véhicules par délégation",
          "Interface mobile dédiée pour l'équipe de transport sur le terrain"
        ],
        visualType: "flight-transfers"
      },
      {
        title: "Gestion Hôtelière & Rooming Lists",
        subtitle: "Attribution fluide des nuitées et chambres",
        description: "Gérez le contingent de chambres réservées dans vos hôtels partenaires avec suivi précis des arrivées, départs et régimes particuliers.",
        checklist: [
          "Rooming list centralisée avec statut de confirmation des invités",
          "Prise en compte des préférences d'hébergement et régimes spécifiques",
          "Export direct au format exigé par les directions d'hôtels"
        ],
        visualType: "hotel-rooms"
      },
      {
        title: "Traçabilité du Matériel Audiovisuel & Régie",
        subtitle: "Inventaire rigoureux des équipements de scène",
        description: "Attribuez et suivez le matériel technique par salle de conférence : micros-cravates, pointeurs laser, écrans de retour et traducteurs.",
        checklist: [
          "Affectation du matériel technique par scène et régisseur responsable",
          "Contrôle des sorties et retours de matériel avec signature numérique",
          "Prévention des pertes et pannes lors des transitions d'intervenants"
        ],
        visualType: "technical-gear"
      },
      {
        title: "Fiches Protocole & Briefing Accueil",
        subtitle: "Excellence de service pour vos invités de marque",
        description: "Mettez à disposition de vos équipes d'accueil des fiches de synthèse sécurisées pour identifier et accompagner chaque personnalité.",
        checklist: [
          "Fiches avec photos, titres officiels et ordre de passage protocolaire",
          "Accès aux salons d'honneur et vestiaires privés sécurisés",
          "Notification d'arrivée en temps réel transmise au comité d'accueil"
        ],
        visualType: "vip-protocol"
      }
    ],
    comparison: {
      traditional: [
        "Messages WhatsApp désynchronisés et tableurs partagés créant des malentendus",
        "Retards à l'aéroport et confusions lors de la distribution des chambres",
        "Matériel audiovisuel égaré ou non disponible au moment du démarrage"
      ],
      eventzone: [
        "Tableau de bord unique synchronisant vols, chauffeurs et hébergements",
        "Rooming list en temps réel et suivi précis des besoins spécifiques",
        "Inventaire technique rigoureux par salle et responsable désigné"
      ]
    },
    faq: [
      {
        q: "Les chauffeurs ont-ils accès au système sur leur téléphone ?",
        a: "Oui, ils disposent d'un accès mobile restreint affichant uniquement les horaires, le terminal d'arrivée et le nom des passagers à accueillir."
      },
      {
        q: "Comment sont gérés les imprévus d'horaires de vol ?",
        a: "La mise à jour d'un horaire répercute instantanément l'information sur le planning du chauffeur et de l'équipe d'accueil."
      },
      {
        q: "Peut-on imprimer les fiches protocolaires pour les équipes ?",
        a: "Oui, un export synthétique PDF permet de distribuer les fiches protocolaires aux responsables de salon."
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
    ],
    deepDiveFeatures: [
      {
        title: "Génération de Liens Traqués Uniques",
        subtitle: "Attribution infalsifiable par créateur",
        description: "Créez instantanément des liens personnalisés et des codes de réduction exclusifs pour chaque influenceur ou sponsor média.",
        checklist: [
          "URLs courtes personnalisées avec le nom de l'ambassadeur",
          "Tracking sans cookies tiers intrusifs respectueux de la vie privée",
          "Paramétrage de remises exclusives pour inciter à la conversion"
        ],
        visualType: "tracked-links"
      },
      {
        title: "Mesure Précise de la Conversion & ROI",
        subtitle: "Visibilité totale sur l'impact de vos partenariats",
        description: "Sachez exactement combien de billets ont été vendus grâce à chaque partenaire et identifiez vos canaux les plus rentables.",
        checklist: [
          "Tableau de bord de rentabilité comparant tous vos prescripteurs",
          "Attribution au centime près du chiffre d'affaires généré",
          "Suivi des volumes de clics et du taux de concrétisation réel"
        ],
        visualType: "roi-attribution"
      },
      {
        title: "Calcul Automatisé des Rémunérations",
        subtitle: "Commissions claires sans contestation",
        description: "Définissez des règles de rémunération au pourcentage ou au forfait par billet vendu, avec calcul instantané et sans erreur.",
        checklist: [
          "Rémunération paramétrable selon le type de billet acheté",
          "Validation automatique des commissions après confirmation du paiement",
          "Relevé comptable exportable prêt pour le règlement financier"
        ],
        visualType: "commission-engine"
      },
      {
        title: "Portail Partenaire en Libre-Service",
        subtitle: "Motivation et transparence pour vos ambassadeurs",
        description: "Offrez à chaque créateur un espace privé sécurisé pour consulter ses performances en direct et suivre ses gains.",
        checklist: [
          "Accès dédié autonome avec affichage des statistiques en temps réel",
          "Récupération facile des visuels et bannières promotionnelles officielles",
          "Transparence totale renforçant l'engagement des partenaires"
        ],
        visualType: "partner-portal"
      }
    ],
    comparison: {
      traditional: [
        "Incapacité à mesurer l'impact réel des publications et partenariats influenceurs",
        "Calculs manuels contestés par les partenaires générant des frictions",
        "Créateurs de contenu démotivés par l'absence totale de suivi transparent"
      ],
      eventzone: [
        "Tracking précis attribuant chaque billet acheté au bon prescripteur",
        "Automatisation intégrale du décompte des commissions financières",
        "Espace personnel permettant aux ambassadeurs de suivre leurs résultats"
      ]
    },
    faq: [
      {
        q: "Les influenceurs voient-ils l'identité des acheteurs ?",
        a: "Non, les ambassadeurs ont accès uniquement aux données agrégées (nombre de clics, ventes validées et montant de commission) pour protéger la vie privée des participants."
      },
      {
        q: "Peut-on fixer des conditions de rémunération différentes selon les partenaires ?",
        a: "Oui, vous pouvez attribuer des pourcentages ou des montants fixes sur-mesure à chaque affilié."
      },
      {
        q: "Le tracking fonctionne-t-il sur les réseaux sociaux (Instagram, LinkedIn, TikTok) ?",
        a: "Oui, les liens courts Eventzone fonctionnent parfaitement en bio, stories, messages privés et publications sur toutes les plateformes."
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
    ],
    deepDiveFeatures: [
      {
        title: "Cartographie de l'Affluence & Temps Forts",
        subtitle: "Analyse fine des flux de visiteurs sur site",
        description: "Identifiez les pics d'accès par créneau horaire, les zones les plus fréquentées et le taux de présence effectif par rapport aux inscriptions.",
        checklist: [
          "Graphique d'affluence par tranches de 15 minutes",
          "Taux de présence effectif calculé automatiquement dès la clôture",
          "Répartition des passages par porte d'entrée et créneau"
        ],
        visualType: "attendance-analytics"
      },
      {
        title: "Génération Automatique de Certificats Sécurisés",
        subtitle: "Attestations de présence et diplômes en un clic",
        description: "Générez et envoyez instantanément des certificats personnalisés aux participants ayant effectivement assisté à vos conférences ou formations.",
        checklist: [
          "Modèle graphique personnalisé avec logos, signatures et intitulés",
          "Conditionnement strict basé sur l'émargement réel du badge",
          "Envoi par e-mail en un clic avec lien de téléchargement direct"
        ],
        visualType: "certificate-preview"
      },
      {
        title: "Vérification Numérique Publique par QR Code",
        subtitle: "Preuve irréfutable contre les faux diplômes",
        description: "Chaque certificat délivré comporte un QR code unique permettant à un employeur ou organisme de contrôler son authenticité en ligne.",
        checklist: [
          "Page de vérification publique sécurisée hébergée sur Eventzone",
          "Identifiant cryptographique unique garantissant la validité du document",
          "Valorisation de la renommée de vos formations et conférences"
        ],
        visualType: "qr-verification"
      },
      {
        title: "Export Universel des Données & Bilans Sponsors",
        subtitle: "Rapports clés en main pour vos partenaires",
        description: "Téléchargez des dossiers de synthèse complets pour prouver le succès de votre manifestation auprès de vos financeurs et sponsors.",
        checklist: [
          "Export universel en formats Excel, CSV et PDF haute qualité",
          "Listes d'émargement certifiées avec horodatage de passage",
          "Dossier récapitulatif complet prêt pour vos bilans institutionnels"
        ],
        visualType: "export-pack"
      }
    ],
    comparison: {
      traditional: [
        "Jours entiers passés à saisir manuellement des attestations papier",
        "Aucune statistique précise sur les heures d'affluence et les pics de fréquentation",
        "Attestations facilement falsifiables sans moyen de vérification numérique"
      ],
      eventzone: [
        "Génération et envoi automatisé de milliers de certificats en un seul clic",
        "Courbes d'affluence et taux de participation calculés en temps réel",
        "Vérification publique par QR code garantissant l'authenticité absolue"
      ]
    },
    faq: [
      {
        q: "L'envoi des certificats est-il réservé aux personnes ayant réellement été scannées ?",
        a: "Oui, vous pouvez filtrer automatiquement l'envoi pour que seuls les participants présents reçoivent leur attestation."
      },
      {
        q: "Le design graphique du certificat est-il modifiable ?",
        a: "Absolument. Vous pouvez intégrer vos logos officiels, signatures numérisées, polices et arrière-plans sur-mesure."
      },
      {
        q: "Comment un recruteur ou tiers peut-il vérifier le certificat ?",
        a: "En scannant le QR code sur l'attestation, il accède immédiatement à la page de confirmation officielle Eventzone."
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
