/**
 * documentDesignerPresets.js
 * Comprehensive template definitions, design themes, content blocks catalog,
 * and dynamic variable mappings for the Eventzone Visual Document Designer.
 *
 * Supports Standard A4 Portrait (210mm x 297mm) and Landscape (297mm x 210mm).
 */

export const DOCUMENT_CATEGORIES = [
  { id: "all", label: "All Templates" },
  { id: "sponsorship", label: "Sponsorship & Partners" },
  { id: "agendas", label: "Agendas & Programs" },
  { id: "press", label: "Press & Media Kits" },
  { id: "contracts", label: "Contracts & Agreements" },
  { id: "permits", label: "Official & Administrative" },
  { id: "promotional", label: "Flyers & Visual Decks" },
  { id: "vip", label: "VIP & Orientation Guides" },
];

export const COLOR_THEMES = [
  {
    id: "eventzone-indigo",
    name: "Eventzone Indigo (Modern & Energetic)",
    primary: "#4f46e5", // Indigo-600
    primaryLight: "#eef2ff", // Indigo-50
    accent: "#2563eb", // Blue-600
    accentLight: "#eff6ff",
    gradientFrom: "#4f46e5",
    gradientTo: "#2563eb",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    borderColor: "#e2e8f0",
    badgeBg: "#e0e7ff",
    badgeText: "#3730a3",
  },
  {
    id: "emerald-prestige",
    name: "Emerald Prestige (Summits & Business)",
    primary: "#059669", // Emerald-600
    primaryLight: "#ecfdf5",
    accent: "#0d9488", // Teal-600
    accentLight: "#f0fdfa",
    gradientFrom: "#065f46",
    gradientTo: "#0f766e",
    textColor: "#064e3b",
    mutedColor: "#475569",
    borderColor: "#a7f3d0",
    badgeBg: "#d1fae5",
    badgeText: "#065f46",
  },
  {
    id: "executive-slate",
    name: "Executive Slate (Formal Corporate & Legal)",
    primary: "#0f172a", // Slate-900
    primaryLight: "#f8fafc",
    accent: "#b91c1c", // Red-700
    accentLight: "#fef2f2",
    gradientFrom: "#0f172a",
    gradientTo: "#334155",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    borderColor: "#cbd5e1",
    badgeBg: "#f1f5f9",
    badgeText: "#0f172a",
  },
  {
    id: "royal-purple",
    name: "Royal Velvet (Summits & Galas)",
    primary: "#7c3aed", // Violet-600
    primaryLight: "#f5f3ff",
    accent: "#9333ea", // Purple-600
    accentLight: "#faf5ff",
    gradientFrom: "#6d28d9",
    gradientTo: "#4f46e5",
    textColor: "#2e1065",
    mutedColor: "#6b7280",
    borderColor: "#ddd6fe",
    badgeBg: "#ede9fe",
    badgeText: "#5b21b6",
  },
  {
    id: "sunset-orange",
    name: "Sunset Vibrant (Creative & Festivals)",
    primary: "#ea580c", // Orange-600
    primaryLight: "#fff7ed",
    accent: "#d97706", // Amber-600
    accentLight: "#fffbeb",
    gradientFrom: "#c2410c",
    gradientTo: "#ea580c",
    textColor: "#431407",
    mutedColor: "#78716c",
    borderColor: "#fed7aa",
    badgeBg: "#ffedd5",
    badgeText: "#9a3412",
  },
  {
    id: "monochrome-minimal",
    name: "Monochrome Studio (High-End Editorial)",
    primary: "#18181b", // Zinc-900
    primaryLight: "#fafafa",
    accent: "#52525b", // Zinc-600
    accentLight: "#f4f4f5",
    gradientFrom: "#18181b",
    gradientTo: "#27272a",
    textColor: "#09090b",
    mutedColor: "#71717a",
    borderColor: "#e4e4e7",
    badgeBg: "#f4f4f5",
    badgeText: "#18181b",
  },
];

export const FONT_PAIRINGS = [
  {
    id: "modern-sans",
    name: "Modern Clean (Plus Jakarta Sans)",
    titleFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    accentFont: "'Plus Jakarta Sans', sans-serif",
    googleFonts: "Plus+Jakarta+Sans:wght@400;500;600;700;800",
  },
  {
    id: "editorial-serif",
    name: "Luxury Editorial (Playfair Display & Sans)",
    titleFont: "'Playfair Display', serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    accentFont: "'Playfair Display', serif",
    googleFonts: "Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700",
  },
  {
    id: "roman-luxury",
    name: "Classical Roman (Cinzel & Sans)",
    titleFont: "'Cinzel', serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    accentFont: "'Cinzel', serif",
    googleFonts: "Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700",
  },
  {
    id: "bold-tech",
    name: "Bold Tech (Montserrat & Sans)",
    titleFont: "'Montserrat', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    accentFont: "'Montserrat', sans-serif",
    googleFonts: "Montserrat:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700",
  },
  {
    id: "academic-cormorant",
    name: "Heritage Academic (Cormorant Garamond)",
    titleFont: "'Cormorant Garamond', serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    accentFont: "'Cormorant Garamond', serif",
    googleFonts: "Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700",
  },
];

export const CALLIGRAPHY_SIGNATURES = [
  {
    id: "calligraphy-1",
    name: "Executive Swash (Great Vibes)",
    fontFamily: "'Great Vibes', cursive",
    googleFont: "Great+Vibes",
  },
  {
    id: "calligraphy-2",
    name: "Formal Crest (Alex Brush)",
    fontFamily: "'Alex Brush', cursive",
    googleFont: "Alex+Brush",
  },
  {
    id: "calligraphy-3",
    name: "Signature Quill (Allura)",
    fontFamily: "'Allura', cursive",
    googleFont: "Allura",
  },
  {
    id: "calligraphy-4",
    name: "Diplomat Script (Parisienne)",
    fontFamily: "'Parisienne', cursive",
    googleFont: "Parisienne",
  },
];

export const BLOCK_TYPES_CATALOG = [
  {
    type: "hero_banner",
    label: "Hero Visual Banner",
    description: "Header with event title, category badge, date, venue, and background accent",
    icon: "LayoutTemplate",
  },
  {
    type: "executive_summary",
    label: "Executive Summary & Hook",
    description: "Framed introductory pitch or executive statement with accent side-border",
    icon: "AlignLeft",
  },
  {
    type: "stats_grid",
    label: "Key Stats & Metrics Grid",
    description: "2 to 4 high-impact numerical indicators (attendees, speakers, booths, media)",
    icon: "BarChart2",
  },
  {
    type: "content_section",
    label: "Article / Body Section",
    description: "Rich text narrative with section heading, badge, and formatted paragraphs",
    icon: "FileText",
  },
  {
    type: "tiers_grid",
    label: "Sponsorship & Pricing Tiers",
    description: "Comparative cards (Platinum, Gold, Silver) with prices and perks checklist",
    icon: "Sparkles",
  },
  {
    type: "schedule_table",
    label: "Timetable & Agenda Schedule",
    description: "Structured agenda timeline with time, session title, room, and speaker",
    icon: "Calendar",
  },
  {
    type: "speakers_roster",
    label: "Featured Speakers Showcase",
    description: "Grid of keynote speakers with avatar, name, topic, and affiliation",
    icon: "Users",
  },
  {
    type: "quote_callout",
    label: "Pull-Quote & Testimonial",
    description: "Prominent quoted endorsement or statement with author citation",
    icon: "Quote",
  },
  {
    type: "terms_clauses",
    label: "Legal Clauses & Agreement Articles",
    description: "Numbered formal terms, deliverables, cancellation policy, and legal commitments",
    icon: "Scale",
  },
  {
    type: "signature_block",
    label: "Official Signatures & Stamp",
    description: "Bilateral or single signatory box with official organization cachet & seal",
    icon: "CheckSquare",
  },
];

/**
 * Replace placeholders like {{event_name}}, {{event_date}}, {{venue}}, etc.
 */
export function interpolateDocumentVariables(text = "", variables = {}) {
  if (!text || typeof text !== "string") return text || "";
  let result = text;
  Object.keys(variables).forEach((key) => {
    const val = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : "";
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    result = result.replace(regex, val);
  });
  return result;
}

/**
 * Pre-defined Templates
 */
export const DOCUMENT_TEMPLATES = [
  // 1. Sponsorship One-Pager & Deck
  {
    id: "sponsorship-one-pager",
    title: "Sponsorship Deck & Proposal",
    category: "sponsorship",
    description: "Visual one-pager pitch to attract corporate sponsors with tier pricing and reach stats.",
    orientation: "portrait",
    themeId: "eventzone-indigo",
    fontPairingId: "modern-sans",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Eventzone Approved Partner",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "OFFICIAL PARTNERSHIP DOSSIER",
        title: "{{event_name}}",
        subtitle: "Exclusive Sponsorship Opportunities & Corporate Partnership Packages",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
        gradientStyle: "linear",
      },
      {
        id: "b-stats",
        type: "stats_grid",
        items: [
          { number: "1,500+", label: "Expected Decision Makers", icon: "Users" },
          { number: "45+", label: "Industry Keynote Speakers", icon: "Mic2" },
          { number: "80+", label: "Corporate Exhibitors", icon: "Building2" },
          { number: "100K+", label: "Digital Reach & Media Impressions", icon: "Share2" },
        ],
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "Executive Brief & Vision",
        content: "We cordially invite your organization to join {{event_name}} as a premier partner. Designed to gather high-level executives, industry leaders, and innovators, this landmark event offers unmatched exposure, qualified B2B networking, and direct visibility across national and regional media channels.",
      },
      {
        id: "b-tiers",
        type: "tiers_grid",
        heading: "Partnership Tiers & Investment",
        tiers: [
          {
            name: "Platinum Partner",
            price: "850 000 DZD",
            badge: "Exclusive (1 Slot)",
            featured: true,
            perks: [
              "Keynote speaking slot (20 min)",
              "Premium 36m² central exhibition booth",
              "Primary branding on main stage backdrop & badges",
              "VIP dinner access (5 passes)",
              "Dedicated press release & social campaign",
            ],
          },
          {
            name: "Gold Sponsor",
            price: "450 000 DZD",
            badge: "Popular (3 Slots)",
            featured: false,
            perks: [
              "Panel discussion speaking opportunity",
              "18m² equipped exhibition booth",
              "Logo on all official banners and website",
              "VIP passes (3 passes)",
              "Promotional bag insert item",
            ],
          },
          {
            name: "Silver Supporter",
            price: "250 000 DZD",
            badge: "5 Slots",
            featured: false,
            perks: [
              "9m² equipped booth space",
              "Logo on event partner board",
              "2 Delegate passes with catering",
              "Access to attendee networking app",
            ],
          },
        ],
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Director of Partnerships & Events",
        signatory1Org: "Eventzone Organizing Committee",
        signatory2Name: "Corporate Sponsor Delegate",
        signatory2Title: "Authorized Executive",
        signatory2Org: "[Company Name]",
        date: "{{current_date}}",
      },
    ],
  },

  // 2. Executive Event Brief & Run-of-Show
  {
    id: "executive-run-of-show",
    title: "Executive Event Brief & Run-of-Show",
    category: "agendas",
    description: "Detailed executive rundown with session timetable, stage allocations, and VIP guide.",
    orientation: "portrait",
    themeId: "executive-slate",
    fontPairingId: "bold-tech",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Eventzone Operations Validated",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "EXECUTIVE BRIEF & OPERATIONAL TIMELINE",
        title: "{{event_name}}",
        subtitle: "Official Master Run-of-Show & Keynote Program",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "Operations & General Protocol",
        content: "This document outlines the official timeline and operational cues for {{event_name}}. All staff, speakers, moderators, and technicians must adhere to the stage protocol and time buffers indicated below.",
      },
      {
        id: "b-schedule",
        type: "schedule_table",
        heading: "Official Day Schedule & Stage Cues",
        sessions: [
          { time: "08:30 - 09:30", title: "VIP Welcome, Registration & Welcome Coffee", stage: "Main Foyer", speaker: "Host Team" },
          { time: "09:30 - 10:00", title: "Official Opening Remarks & Ministerial Address", stage: "Plenary Hall A", speaker: "Keynote Dignitaries" },
          { time: "10:00 - 11:15", title: "Keynote: Shaping the Next Era of Regional Growth", stage: "Plenary Hall A", speaker: "Lead Guest Speaker" },
          { time: "11:30 - 12:45", title: "Executive Panel: Technology, Policy & Scaling", stage: "Hall B", speaker: "Industry Panelists" },
          { time: "13:00 - 14:30", title: "Networking Lunch & Exhibition Tour", stage: "Expo Terrace", speaker: "All Attendees" },
          { time: "14:30 - 16:30", title: "Specialized Masterclasses & B2B Matchmaking", stage: "Workshops 1-4", speaker: "Sector Specialists" },
          { time: "16:30 - 17:00", title: "Closing Ceremony & Recommendations Protocol", stage: "Plenary Hall A", speaker: "{{organizer_name}}" },
        ],
      },
      {
        id: "b-notes",
        type: "content_section",
        badge: "LOGISTICS DIRECTIVE",
        heading: "Security, Wi-Fi & Technical Guidelines",
        content: "1. Dedicated high-speed Wi-Fi network: 'Eventzone_VIP' (passcode distributed at check-in).\n2. Green Room access is restricted to verified speaker badge holders.\n3. Technical presentations must be loaded onto the master AV console at least 45 minutes prior to session start.",
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "General Event Commissioner",
        signatory1Org: "Eventzone Operations Bureau",
        date: "{{current_date}}",
      },
    ],
  },

  // 3. Official Press Release & Media Kit
  {
    id: "press-release-kit",
    title: "Official Press Release & Media Kit",
    category: "press",
    description: "Standard editorial press announcement with media contacts, quotes, and milestone facts.",
    orientation: "portrait",
    themeId: "royal-purple",
    fontPairingId: "editorial-serif",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Eventzone Press Desk",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "FOR IMMEDIATE RELEASE",
        title: "Announcing {{event_name}}",
        subtitle: "The Premier National Gathering Bringing Together Innovators, Leaders, and Industry Pioneers",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "ALGIERS, ALGERIA — Press Bureau",
        content: "The Organizing Committee is proud to announce the upcoming edition of {{event_name}}, taking place at {{venue}} in {{wilaya}}. This pivotal edition will feature prominent international experts, groundbreaking showcases, and strategic partnerships set to accelerate sector modernization.",
      },
      {
        id: "b-quote",
        type: "quote_callout",
        quote: "Our mission is to create an unprecedented platform where visionary thinking meets actionable business execution. {{event_name}} is the catalyst our ecosystem has been waiting for.",
        author: "{{organizer_name}}",
        authorTitle: "President of the Organizing Committee",
      },
      {
        id: "b-section",
        type: "content_section",
        badge: "KEY ANNOUNCEMENTS",
        heading: "Program Highlights & Strategic Focus",
        content: "Over the course of the event, delegates will explore intensive keynotes, hands-on masterclasses, and an expansive B2B exhibition area showcasing cutting-edge solutions. Over 50 accredited journalists and media outlets will cover the event proceedings live.",
      },
      {
        id: "b-stats",
        type: "stats_grid",
        items: [
          { number: "25+", label: "Participating Delegations", icon: "Globe" },
          { number: "50+", label: "Accredited Media Outlets", icon: "Tv" },
          { number: "30+", label: "B2B Deals Projected", icon: "TrendingUp" },
        ],
      },
      {
        id: "b-boilerplate",
        type: "content_section",
        badge: "ABOUT THE EVENT",
        heading: "Media Accreditation & Press Enquiries",
        content: "Journalists and media representatives wishing to obtain press accreditation and interview access to keynote speakers are invited to contact the press desk directly:\n\nEmail: {{organizer_email}}\nPhone: {{organizer_phone}}\nOfficial Portal: www.eventzone.pro",
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Director of Public Relations & Communications",
        signatory1Org: "Eventzone Media Bureau",
        date: "{{current_date}}",
      },
    ],
  },

  // 4. Formal Partnership & Sponsor Agreement (Contract)
  {
    id: "formal-sponsor-agreement",
    title: "Formal Sponsorship Agreement",
    category: "contracts",
    description: "Bilingual / formal bilateral legal agreement defining rights, obligations, and deliverables.",
    orientation: "portrait",
    themeId: "executive-slate",
    fontPairingId: "modern-sans",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Eventzone Legal Department",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "CONTRAT DE PARTENARIAT ET DE SPONSORING",
        title: "Convention de Sponsoring Officiel",
        subtitle: "{{event_name}} — Édition 2026",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "Préambule et Parties Signataires",
        content: "Entre les soussignés :\n1. L'Organisateur : {{organizer_name}}, domicilié à {{wilaya}}, agissant pour le compte de l'événement {{event_name}}.\n2. Le Partenaire / Sponsor : La société [Raison Sociale du Partenaire], représentée par son représentant légal dûment habilité.\nIl a été convenu et arrêté ce qui suit :",
      },
      {
        id: "b-clauses",
        type: "terms_clauses",
        heading: "Articles et Conditions Générales de la Convention",
        clauses: [
          {
            title: "Article 1 : Objet de la Convention",
            text: "La présente convention a pour objet de définir les conditions dans lesquelles le Partenaire s'engage à apporter son soutien financier et logistique à l'événement {{event_name}}, en contrepartie des prestations et visibilités octroyées par l'Organisateur.",
          },
          {
            title: "Article 2 : Engagements et Contreparties de l'Organisateur",
            text: "L'Organisateur s'engage à réserver au Partenaire un espace d'exposition dédié, l'intégration de son logo sur tous les supports visuels officiels, la mention de sa qualité de partenaire lors des prises de parole officielles, ainsi que les badges d'accès VIP convenus.",
          },
          {
            title: "Article 3 : Conditions Financières et Modalités de Règlement",
            text: "En contrepartie, le Partenaire s'engage à verser le montant total convenu conformément au devis/facture rattaché. Le règlement s'effectue par virement bancaire ou chèque certifié selon les échéances convenues avant l'ouverture de l'événement.",
          },
          {
            title: "Article 4 : Respect du Lieu et Règlement Intérieur",
            text: "Le Partenaire s'engage à respecter les consignes de sécurité du site hôte ({{venue}}), les horaires d'installation et de démontage des stands, ainsi que les réglementations en vigueur.",
          },
          {
            title: "Article 5 : Force Majeure et Droit Applicable",
            text: "La présente convention est régie par la législation en vigueur en République Algérienne Démocratique et Populaire. Tout litige relatif à son interprétation ou exécution sera soumis aux tribunaux compétents.",
          },
        ],
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Pour l'Organisateur (Signature & Cachet)",
        signatory1Org: "Eventzone Organizing Body",
        signatory2Name: "Représentant Légal Partenaire",
        signatory2Title: "Pour le Partenaire (Signature & Cachet)",
        signatory2Org: "[Société / Institution]",
        date: "{{current_date}}",
      },
    ],
  },

  // 5. Demande d'Autorisation Administrative (APC / Wilaya)
  {
    id: "admin-authorization-request",
    title: "Demande d'Autorisation Administrative",
    category: "permits",
    description: "Official administrative letter tailored for Algerian authorities (Wilaya, APC, DJS, Sûreté).",
    orientation: "portrait",
    themeId: "executive-slate",
    fontPairingId: "academic-cormorant",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Direction Générale Eventzone",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE",
        title: "Demande d'Autorisation de Tenue d'Événement",
        subtitle: "Dossier Administratif et Déclaration Préalable",
        date: "{{event_date}}",
        location: "{{venue}}, Wilaya de {{wilaya}}",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "À l'attention de Monsieur le Wali / Monsieur le Président de l'APC",
        content: "Monsieur le Wali / Monsieur le Président,\n\nNous avons l'honneur de solliciter par la présente votre haute bienveillance afin de nous délivrer l'autorisation administrative nécessaire pour l'organisation de l'événement intitulé : « {{event_name}} », prévu le {{event_date}} au niveau de {{venue}}.",
      },
      {
        id: "b-section1",
        type: "content_section",
        badge: "DESCRIPTIF DU PROJET",
        heading: "Objectifs et Portée de la Manifestation",
        content: "Cette manifestation à caractère économique, scientifique et professionnel réunira des acteurs institutionnels, des chefs d'entreprises, des universitaires et des jeunes porteurs de projets dans le but de promouvoir les initiatives locales et favoriser les échanges constructifs.",
      },
      {
        id: "b-stats",
        type: "stats_grid",
        items: [
          { number: "1 200", label: "Participants Attendus", icon: "Users" },
          { number: "01 Jour", label: "Durée Prévisionnelle", icon: "Calendar" },
          { number: "100%", label: "Respect des Normes de Sécurité", icon: "ShieldCheck" },
        ],
      },
      {
        id: "b-section2",
        type: "content_section",
        badge: "ENGAGEMENT SÉCURITAIRE",
        heading: "Dispositif d'Accueil et Sécurité",
        content: "L'Organisateur s'engage formellement à mobiliser un service d'ordre interne qualifié, à assurer la présence d'une équipe de premiers secours, à respecter scrupuleusement la tranquillité publique et à maintenir les lieux en parfait état de salubrité avant et après la manifestation.\n\nCi-joint les pièces justificatives : programme détaillé, fiche technique de la salle, et attestations d'assurance.",
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Le Responsable de l'Organisation",
        signatory1Org: "Comité d'Organisation — Eventzone",
        date: "{{current_date}}",
      },
    ],
  },

  // 6. Speaker Engagement & Rights Waiver
  {
    id: "speaker-engagement-agreement",
    title: "Speaker Agreement & Media Release",
    category: "contracts",
    description: "Honorarium terms, session topic confirmation, and recording/broadcasting consent waiver.",
    orientation: "portrait",
    themeId: "emerald-prestige",
    fontPairingId: "modern-sans",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Eventzone Academic Committee",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "KEYNOTE SPEAKER AGREEMENT & MEDIA CONSENT",
        title: "Speaker Engagement Protocol",
        subtitle: "{{event_name}} — Keynote Session & Masterclass",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "Speaker Confirmation & Invitation Acceptance",
        content: "This engagement document formalizes the participation of the invited speaker at {{event_name}}. We are honored to feature your valuable expertise in front of our distinguished delegates and industry professionals.",
      },
      {
        id: "b-clauses",
        type: "terms_clauses",
        heading: "Terms of Engagement & Media Authorization",
        clauses: [
          {
            title: "1. Presentation Content & Materials",
            text: "The Speaker agrees to deliver the keynote talk in accordance with the event theme. Slides and presentation decks must be shared with the AV production team 24 hours prior to the session for technical rehearsal.",
          },
          {
            title: "2. Recording and Broadcast Rights",
            text: "The Speaker grants Eventzone the non-exclusive right to record, livestream, photograph, and archive the presentation for educational, promotional, and post-event replay on Eventzone platforms.",
          },
          {
            title: "3. Hospitality & Logistical Coverage",
            text: "The Organizer provides VIP accreditation, airport transfer coordination, designated Green Room access, and lunch hospitality throughout the duration of the event.",
          },
        ],
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Director of Program & Content",
        signatory1Org: "Eventzone Content Board",
        signatory2Name: "[Speaker Full Name]",
        signatory2Title: "Keynote Speaker / Expert",
        signatory2Org: "[Speaker Institution / Title]",
        date: "{{current_date}}",
      },
    ],
  },

  // 7. Event Announcement Flyer & Showcase
  {
    id: "event-announcement-flyer",
    title: "Event Announcement Flyer & Showcase",
    category: "promotional",
    description: "Visually impactful announcement sheet with event highlights, badges, and QR registration code.",
    orientation: "portrait",
    themeId: "sunset-orange",
    fontPairingId: "bold-tech",
    showLetterhead: false,
    showStamp: false,
    showWatermark: false,
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "MARK YOUR CALENDAR • OFFICIAL INVITATION",
        title: "{{event_name}}",
        subtitle: "The Unmissable Industry Summit of the Year",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
        gradientStyle: "bold",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "Why You Cannot Miss This Edition",
        content: "Join over 1,000 forward-thinking visionaries for a transformative day featuring high-caliber panels, innovative exhibition showcases, and unmatched networking opportunities designed to ignite regional partnerships.",
      },
      {
        id: "b-stats",
        type: "stats_grid",
        items: [
          { number: "30+", label: "Masterclasses & Keynotes", icon: "Mic2" },
          { number: "50+", label: "Exhibiting Innovators", icon: "Store" },
          { number: "500+", label: "1-on-1 B2B Meetings", icon: "Users" },
        ],
      },
      {
        id: "b-content",
        type: "content_section",
        badge: "GET INVOLVED",
        heading: "Secure Your Pass & Registration",
        content: "Early registration is highly recommended as seating capacity is limited. Registered attendees receive the full event bag, catering access, digital badge, and complete access to the Eventzone networking portal.\n\nScan the official QR code or register online: www.eventzone.pro",
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Organizing Team",
        signatory1Org: "Eventzone Platform",
        date: "{{current_date}}",
      },
    ],
  },

  // 8. VIP Welcome & Orientation Guide
  {
    id: "vip-orientation-guide",
    title: "VIP Welcome & Orientation Guide",
    category: "vip",
    description: "Personalized VIP briefing card with check-in fast track, Wi-Fi credentials, and lounge access.",
    orientation: "portrait",
    themeId: "emerald-prestige",
    fontPairingId: "editorial-serif",
    showLetterhead: true,
    showStamp: true,
    showWatermark: false,
    stampText: "Eventzone VIP Protocol",
    blocks: [
      {
        id: "b-hero",
        type: "hero_banner",
        badge: "EXCLUSIVE VIP DELEGATE BRIEF",
        title: "Welcome to {{event_name}}",
        subtitle: "Your Comprehensive VIP Orientation & Access Guide",
        date: "{{event_date}}",
        location: "{{venue}}, {{wilaya}}",
      },
      {
        id: "b-summary",
        type: "executive_summary",
        heading: "Honored Guest Protocol",
        content: "On behalf of {{organizer_name}} and the entire organizing committee, we are delighted to welcome you as our honored guest. This briefing contains your exclusive access credentials, personalized schedule, and private lounge amenities.",
      },
      {
        id: "b-stats",
        type: "stats_grid",
        items: [
          { number: "Gate A", label: "VIP Express Check-In", icon: "CheckCircle2" },
          { number: "Salon Bleu", label: "Private VIP Lounge & Catering", icon: "Coffee" },
          { number: "Dedicated", label: "Concierge & Parking Service", icon: "Car" },
        ],
      },
      {
        id: "b-content",
        type: "content_section",
        badge: "DIGITAL CREDENTIALS",
        heading: "Wi-Fi Access & Private Bilateral Rooms",
        content: "• VIP Wi-Fi SSID: Eventzone_VIP | Passcode: VIP2026Alger\n• Private Bilateral Rooms (B1 to B4) can be booked on-demand via the VIP desk.\n• Dedicated Concierge Hotline: {{organizer_phone}}",
      },
      {
        id: "b-signature",
        type: "signature_block",
        signatory1Name: "{{organizer_name}}",
        signatory1Title: "Chief Protocol Officer",
        signatory1Org: "Eventzone VIP Hospitality",
        date: "{{current_date}}",
      },
    ],
  },
];

/**
 * Construct a ready-to-edit document instance from template and event details
 */
export function createDefaultDocument(templateId = "sponsorship-one-pager", eventDetails = {}, currentUser = {}) {
  const tpl = DOCUMENT_TEMPLATES.find((t) => t.id === templateId) || DOCUMENT_TEMPLATES[0];

  const now = new Date();
  const currentDateFormatted = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const eventName = eventDetails?.name || eventDetails?.title || "Eventzone Summit 2026";
  const eventDate = eventDetails?.date 
    ? (eventDetails.endDate ? `${eventDetails.date} - ${eventDetails.endDate}` : eventDetails.date)
    : "15 - 17 Novembre 2026";
  const venue = eventDetails?.location || eventDetails?.venue || "Centre International des Conférences (CIC)";
  const wilaya = eventDetails?.wilaya || "Alger";
  const organizerName = eventDetails?.organizer || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "Comité d'Organisation Eventzone";
  const organizerEmail = eventDetails?.contactEmail || currentUser?.email || "contact@eventzone.pro";
  const organizerPhone = eventDetails?.contactPhone || "+213 (0) 550 00 00 00";

  const variables = {
    event_name: eventName,
    event_date: eventDate,
    venue: venue,
    wilaya: wilaya,
    organizer_name: organizerName,
    organizer_email: organizerEmail,
    organizer_phone: organizerPhone,
    current_date: currentDateFormatted,
  };

  // Deep clone blocks and interpolate initial variables
  const initialBlocks = (tpl.blocks || []).map((block, idx) => {
    const cloned = JSON.parse(JSON.stringify(block));
    cloned.id = `block-${Date.now()}-${idx}`;

    if (cloned.title) cloned.title = interpolateDocumentVariables(cloned.title, variables);
    if (cloned.subtitle) cloned.subtitle = interpolateDocumentVariables(cloned.subtitle, variables);
    if (cloned.date) cloned.date = interpolateDocumentVariables(cloned.date, variables);
    if (cloned.location) cloned.location = interpolateDocumentVariables(cloned.location, variables);
    if (cloned.content) cloned.content = interpolateDocumentVariables(cloned.content, variables);
    if (cloned.signatory1Name) cloned.signatory1Name = interpolateDocumentVariables(cloned.signatory1Name, variables);
    if (cloned.date) cloned.date = interpolateDocumentVariables(cloned.date, variables);

    return cloned;
  });

  return {
    id: `doc-${Date.now()}`,
    templateId: tpl.id,
    title: `${eventName} — ${tpl.title}`,
    category: tpl.category,
    orientation: tpl.orientation || "portrait",
    themeId: tpl.themeId || "eventzone-indigo",
    fontPairingId: tpl.fontPairingId || "modern-sans",
    showLetterhead: tpl.showLetterhead !== false,
    showStamp: tpl.showStamp !== false,
    showWatermark: Boolean(tpl.showWatermark),
    stampText: tpl.stampText || "Eventzone Certified Document",
    organizerLogo: eventDetails?.logo || eventDetails?.logoUrl || "/eventzone-logo.png",
    organizerName: organizerName,
    organizerAddress: eventDetails?.address || "Alger, Algérie",
    organizerTaxId: eventDetails?.taxId || "NIF / RC : 16/00-1234567B16",
    organizerContact: `${organizerEmail} • ${organizerPhone}`,
    calligraphySignatureId: "calligraphy-1",
    variables: variables,
    blocks: initialBlocks,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
