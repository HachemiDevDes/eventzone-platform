/**
 * documentDesignerPresets.js
 * Clean, lightweight presets and simple element factories for Eventzone Document Studio.
 */

export const ELEMENT_TYPES = [
  { type: "header", label: "En-tête officiel", description: "Logo de l'organisation, nom, date, lieu et référence" },
  { type: "heading", label: "Titre / Section", description: "Grand titre ou sous-titre de section avec typographie personnalisée" },
  { type: "paragraph", label: "Texte / Paragraphe", description: "Paragraphes, clauses, articles ou lettres officielles" },
  { type: "custom_text", label: "Bloc de Texte Libre", description: "Texte personnalisable (police, graisse, taille, alignement)" },
  { type: "image", label: "Image / Photo", description: "Photo, logo, affiche ou illustration avec taille et cadrage" },
  { type: "callout", label: "Encadré / Note", description: "Note d'information mise en exergue avec fond teinté" },
  { type: "info_grid", label: "Infos Clés (Grille)", description: "2 à 4 indicateurs ou données clés de l'événement" },
  { type: "table", label: "Tableau / Programme", description: "Planning, tableau d'horaires ou grille tarifaire" },
  { type: "signature", label: "Signatures & Cachet", description: "Lignes de signatures avec cachet officiel Eventzone" },
  { type: "divider", label: "Ligne de séparation", description: "Séparateur horizontal propre" },
];

export const FONT_OPTIONS = [
  { id: "sans", name: "Plus Jakarta Sans (Modern)", font: "'Plus Jakarta Sans', sans-serif" },
  { id: "serif", name: "Playfair Display (Editorial)", font: "'Playfair Display', serif" },
  { id: "cormorant", name: "Cormorant (Formal Academic)", font: "'Cormorant Garamond', serif" },
  { id: "montserrat", name: "Montserrat (Bold Clean)", font: "'Montserrat', sans-serif" },
];

export const COLOR_OPTIONS = [
  { id: "blue", name: "Eventzone Blue", primary: "#2563eb", light: "#eff6ff", border: "#bfdbfe" },
  { id: "slate", name: "Corporate Slate", primary: "#0f172a", light: "#f8fafc", border: "#cbd5e1" },
  { id: "emerald", name: "Prestige Emerald", primary: "#059669", light: "#ecfdf5", border: "#a7f3d0" },
  { id: "indigo", name: "Modern Indigo", primary: "#4f46e5", light: "#eef2ff", border: "#c7d2fe" },
  { id: "purple", name: "Royal Purple", primary: "#7c3aed", light: "#f5f3ff", border: "#ddd6fe" },
  { id: "orange", name: "Vibrant Amber", primary: "#d97706", light: "#fffbeb", border: "#fde68a" },
];

export const STARTER_PRESETS = [
  {
    id: "blank",
    name: "Empty A4 Canvas",
    description: "Start from scratch and add elements manually.",
  },
  {
    id: "letter",
    name: "Official Letter / Invitation",
    description: "Clean administrative letter with letterhead, body text, and signature.",
  },
  {
    id: "agreement",
    name: "Partnership Agreement",
    description: "Formal agreement with preamble, numbered articles, and dual signatures.",
  },
  {
    id: "agenda",
    name: "Event Program & Schedule",
    description: "Official schedule table with timings, stages, and logistic notes.",
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
 * Creates a brand new document from scratch
 */
export function createEmptyDocument(eventDetails = {}, currentUser = {}, presetId = "blank") {
  const now = new Date();
  const currentDateFormatted = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const eventName = eventDetails?.name || eventDetails?.title || "Mon Événement";
  const eventDate = eventDetails?.date 
    ? (eventDetails.endDate ? `${eventDetails.date} - ${eventDetails.endDate}` : eventDetails.date)
    : "15 Novembre 2026";
  const venue = eventDetails?.location || eventDetails?.venue || "Palais des Congrès";
  const wilaya = eventDetails?.wilaya || "Alger";
  const organizerName = eventDetails?.organizer || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "Direction de l'Organisation";
  const organizerEmail = eventDetails?.contactEmail || currentUser?.email || "contact@eventzone.pro";

  const variables = {
    event_name: eventName,
    event_date: eventDate,
    venue: venue,
    wilaya: wilaya,
    organizer_name: organizerName,
    organizer_email: organizerEmail,
    current_date: currentDateFormatted,
  };

  let elements = [];

  if (presetId === "letter") {
    elements = [
      {
        id: `el-${Date.now()}-1`,
        type: "header",
        logo: eventDetails?.logo || "/eventzone-logo.png",
        orgName: organizerName,
        subtitle: `${venue}, ${wilaya}`,
        date: currentDateFormatted,
        ref: "REF: EZ/2026/01",
      },
      {
        id: `el-${Date.now()}-2`,
        type: "heading",
        text: "LETTRE D'INVITATION OFFICIELLE",
        subtitle: `Objet : Invitation à l'événement « ${eventName} »`,
        size: "lg",
        align: "center",
      },
      {
        id: `el-${Date.now()}-3`,
        type: "paragraph",
        text: `Monsieur le Directeur,\n\nNous avons l'honneur de vous adresser la présente invitation officielle pour participer aux travaux de l'événement « ${eventName} », qui se tiendra le ${eventDate} au niveau de ${venue}.\n\nCette rencontre d'envergure réunira les principaux dirigeants, institutionnels et acteurs économiques afin d'échanger sur les leviers stratégiques et créer des opportunités de partenariats durables.\n\nNous serions très honorés de compter votre honorable présence parmi nous.\n\nDans l'attente de votre confirmation, nous vous prions d'agréer, Monsieur le Directeur, l'expression de nos salutations les plus distinguées.`,
        size: "md",
        align: "left",
      },
      {
        id: `el-${Date.now()}-4`,
        type: "signature",
        sign1Name: organizerName,
        sign1Title: "Le Commissaire Général de l'Événement",
        showStamp: true,
        stampText: "Eventzone Approuvé",
        date: currentDateFormatted,
      },
    ];
  } else if (presetId === "agreement") {
    elements = [
      {
        id: `el-${Date.now()}-1`,
        type: "header",
        logo: eventDetails?.logo || "/eventzone-logo.png",
        orgName: organizerName,
        subtitle: "Document Juridique & Administratif",
        date: currentDateFormatted,
        ref: "CONV-2026/01",
      },
      {
        id: `el-${Date.now()}-2`,
        type: "heading",
        text: "CONVENTION DE PARTENARIAT & DE SPONSORING",
        subtitle: `Édition 2026 — ${eventName}`,
        size: "lg",
        align: "center",
      },
      {
        id: `el-${Date.now()}-3`,
        type: "callout",
        title: "PRÉAMBULE",
        text: `Entre l'Organisateur (${organizerName}) et le Partenaire désigné, il a été convenu et arrêté le présent protocole d'accord régissant les droits, obligations et contreparties dans le cadre de l'événement « ${eventName} ».`,
        color: "slate",
      },
      {
        id: `el-${Date.now()}-4`,
        type: "paragraph",
        text: `Article 1 : Objet du Partenariat\nL'Organisateur s'engage à accorder au Partenaire une visibilité de premier ordre sur les supports de communication officiels, ainsi qu'un espace d'exposition dédié sur le site de l'événement (${venue}).\n\nArticle 2 : Engagements Financiers\nEn contrepartie, le Partenaire s'engage à régler la contribution convenue selon les modalités fixées par la facture rattachée avant la date d'ouverture de l'événement.\n\nArticle 3 : Respect du Règlement Intérieur\nLe Partenaire s'engage à se conformer aux consignes de sécurité du lieu hôte et à respecter les créneaux d'installation et de démontage des stands.`,
        size: "sm",
        align: "left",
      },
      {
        id: `el-${Date.now()}-5`,
        type: "signature",
        sign1Name: organizerName,
        sign1Title: "Pour l'Organisateur",
        sign2Name: "Le Représentant Légal",
        sign2Title: "Pour le Partenaire",
        showStamp: true,
        stampText: "Direction Générale",
        date: currentDateFormatted,
      },
    ];
  } else if (presetId === "agenda") {
    elements = [
      {
        id: `el-${Date.now()}-1`,
        type: "header",
        logo: eventDetails?.logo || "/eventzone-logo.png",
        orgName: organizerName,
        subtitle: `${venue}, ${wilaya}`,
        date: currentDateFormatted,
        ref: "PROGRAMME-2026",
      },
      {
        id: `el-${Date.now()}-2`,
        type: "heading",
        text: "PROGRAMME OFFICIEL & HORAIRES",
        subtitle: `${eventName} — ${eventDate}`,
        size: "lg",
        align: "center",
      },
      {
        id: `el-${Date.now()}-3`,
        type: "table",
        title: "Déroulement de la Journée",
        headers: ["Horaires", "Session / Activité", "Lieu / Salle", "Intervenant"],
        rows: [
          ["08:30 - 09:30", "Accueil des invités & Welcome Coffee", "Hall Principal", "Équipe d'Accueil"],
          ["09:30 - 10:15", "Cérémonie d'Ouverture & Allocution", "Auditorium A", organizerName],
          ["10:15 - 11:30", "Table Ronde : Innovation & Stratégies", "Auditorium A", "Panel d'Experts"],
          ["11:30 - 13:00", "Ateliers Thématiques & Pitchs B2B", "Salles 1 & 2", "Modérateurs"],
          ["13:00 - 14:30", "Déjeuner Réseautage & Visite des Stands", "Espace Expo", "Tous les participants"],
          ["14:30 - 16:30", "Rencontres B2B & Clôture de l'Édition", "Espace VIP", "Délégations"],
        ],
      },
      {
        id: `el-${Date.now()}-4`,
        type: "callout",
        title: "NOTE D'ORGANISATION",
        text: "L'accès aux salles de conférence s'effectue sur présentation du badge officiel. Une connexion Wi-Fi dédiée est mise à la disposition des participants.",
        color: "blue",
      },
      {
        id: `el-${Date.now()}-5`,
        type: "signature",
        sign1Name: organizerName,
        sign1Title: "Comité d'Organisation",
        showStamp: true,
        stampText: "Eventzone Validé",
        date: currentDateFormatted,
      },
    ];
  }

  return {
    id: `doc-${Date.now()}`,
    name: presetId === "blank" ? "Nouveau Document" : `${eventName} — ${STARTER_PRESETS.find(p => p.id === presetId)?.name || "Document"}`,
    orientation: "portrait",
    colorId: "blue",
    fontId: "sans",
    variables: variables,
    elements: elements,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Creates a single document element by type with good defaults
 */
export function createDocumentElement(type, eventDetails = {}, currentUser = {}) {
  const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const currentDateFormatted = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const organizerName = eventDetails?.organizer || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "Direction de l'Organisation";
  const venue = eventDetails?.location || eventDetails?.venue || "Palais des Congrès";
  const wilaya = eventDetails?.wilaya || "Alger";

  switch (type) {
    case "header":
      return {
        id: uniqueId,
        type: "header",
        logo: eventDetails?.logo || "/eventzone-logo.png",
        orgName: organizerName,
        subtitle: `${venue}, ${wilaya}`,
        date: currentDateFormatted,
        ref: `REF: EZ/${new Date().getFullYear()}/01`,
      };

    case "heading":
      return {
        id: uniqueId,
        type: "heading",
        text: "Titre du Document",
        subtitle: "Sous-titre ou objet officiel",
        size: "lg", // "sm" | "md" | "lg" | "xl" | "2xl"
        weight: "bold", // "normal" | "medium" | "semibold" | "bold" | "extrabold"
        align: "left", // "left" | "center" | "right"
        fontId: "inherit",
        italic: false,
        underline: false,
        color: "default",
      };

    case "paragraph":
      return {
        id: uniqueId,
        type: "paragraph",
        text: "Rédigez ici votre texte ou vos clauses officielles. Les sauts de ligne sont automatiquement préservés sur la feuille A4.",
        size: "md",
        weight: "normal",
        align: "left",
        fontId: "inherit",
        italic: false,
        underline: false,
        color: "default",
      };

    case "custom_text":
      return {
        id: uniqueId,
        type: "custom_text",
        text: "Saisissez votre texte personnalisé ici. Vous pouvez ajuster la police, la taille, la graisse et l'alignement selon vos besoins.",
        size: "md",
        weight: "normal",
        align: "left",
        fontId: "inherit",
        italic: false,
        underline: false,
        color: "default",
      };

    case "image":
      return {
        id: uniqueId,
        type: "image",
        url: eventDetails?.coverImage || eventDetails?.banner || eventDetails?.logo || "/eventzone-logo.png",
        caption: "",
        align: "center", // "left" | "center" | "right"
        size: "md", // "sm" (140px), "md" (280px), "lg" (440px), "full" (100%)
        shape: "rounded", // "rounded" | "square" | "circle"
        border: false,
        shadow: false,
      };

    case "callout":
      return {
        id: uniqueId,
        type: "callout",
        title: "NOTE IMPORTANTE",
        text: "Mentionnez ici les points clés, conditions particulières ou avis d'information.",
        color: "slate",
      };

    case "info_grid":
      return {
        id: uniqueId,
        type: "info_grid",
        items: [
          { label: "Date", value: eventDetails?.date || "15 Nov 2026" },
          { label: "Lieu", value: venue },
          { label: "Format", value: "Présentiel" },
          { label: "Accès", value: "Sur Badge" },
        ],
      };

    case "table":
      return {
        id: uniqueId,
        type: "table",
        title: "Tableau Récapitulatif",
        headers: ["Horaires / Désignation", "Description", "Statut / Intervenant"],
        rows: [
          ["09:00 - 10:00", "Séance Plénière d'Ouverture", "Direction Générale"],
          ["10:00 - 11:30", "Table Ronde & Échanges", "Panel d'Experts"],
          ["12:00 - 13:30", "Déjeuner Réseautage & B2B", "Espace VIP"],
        ],
      };

    case "signature":
      return {
        id: uniqueId,
        type: "signature",
        sign1Name: organizerName,
        sign1Title: "Pour l'Organisateur",
        sign2Name: "",
        sign2Title: "",
        showStamp: true,
        stampText: "Eventzone Approuvé",
        date: currentDateFormatted,
      };

    case "divider":
      return {
        id: uniqueId,
        type: "divider",
        style: "solid",
      };

    default:
      return {
        id: uniqueId,
        type: "paragraph",
        text: "Nouveau paragraphe...",
        size: "md",
        align: "left",
      };
  }
}

