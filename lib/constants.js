/**
 * Platform-wide canonical list of industries and categories.
 * Single source of truth for Event Creation, Discovery, Filtering, and Organizations.
 */

export const INDUSTRIES = [
  "Technology, AI & Software",
  "Energy, Oil & Gas",
  "Renewable Energy & CleanTech",
  "Finance, Banking & FinTech",
  "Healthcare, Pharmaceuticals & Biotech",
  "Education, EdTech & Academia",
  "Manufacturing & Heavy Industry",
  "Transportation, Aviation & Logistics",
  "Real Estate, Architecture & Construction",
  "Retail, Consumer Goods & E-Commerce",
  "Media, Entertainment & Gaming",
  "Agriculture, AgriTech & Food Production",
  "Government, Defense & Public Sector",
  "Non-Profit, NGOs & Social Impact",
  "Hospitality, Travel & Tourism",
  "Aerospace, Defense & SpaceTech",
  "Automotive, EV & Future Mobility",
  "Telecommunications & Networking",
  "Chemicals, Materials & Mining",
  "Environmental, Climate & Sustainability",
  "Legal, Consulting & Professional Services",
  "Cybersecurity & Cloud Infrastructure",
  "Biotechnology & Life Sciences",
  "Fashion, Luxury & Apparel",
  "Sports, Fitness & Recreation",
  "Blockchain, Web3 & Digital Assets",
  "Venture Capital & Private Equity",
  "Robotics & Industrial Automation",
  "Supply Chain & Maritime Shipping",
  "Arts, Culture & Heritage",
  "Other / General Business"
];

export const INDUSTRY_TRANSLATIONS = {
  "Technology, AI & Software": {
    ar: "التكنولوجيا والذكاء الاصطناعي والبرمجيات",
    fr: "Technologie, IA & Logiciels"
  },
  "Energy, Oil & Gas": {
    ar: "الطاقة والنفط والغاز",
    fr: "Énergie, Pétrole & Gaz"
  },
  "Renewable Energy & CleanTech": {
    ar: "الطاقة المتجددة والتكنولوجيا النظيفة",
    fr: "Énergies renouvelables & CleanTech"
  },
  "Finance, Banking & FinTech": {
    ar: "المالية والبنوك والتكنولوجيا المالية",
    fr: "Finance, Banque & FinTech"
  },
  "Healthcare, Pharmaceuticals & Biotech": {
    ar: "الرعاية الصحية والأدوية والتكنولوجيا الحيوية",
    fr: "Santé, Pharmacie & Biotech"
  },
  "Education, EdTech & Academia": {
    ar: "التعليم وتكنولوجيا التعليم والأوساط الأكاديمية",
    fr: "Éducation, EdTech & Université"
  },
  "Manufacturing & Heavy Industry": {
    ar: "التصنيع والصناعات الثقيلة",
    fr: "Industrie lourde & Fabrication"
  },
  "Transportation, Aviation & Logistics": {
    ar: "النقل والطيران والخدمات اللوجستية",
    fr: "Transport, Aviation & Logistique"
  },
  "Real Estate, Architecture & Construction": {
    ar: "العقارات والهندسة المعمارية والبناء",
    fr: "Immobilier, Architecture & BTP"
  },
  "Retail, Consumer Goods & E-Commerce": {
    ar: "التجزئة والسلع الاستهلاكية والتجارة الإلكترونية",
    fr: "Commerce, Consommation & E-Commerce"
  },
  "Media, Entertainment & Gaming": {
    ar: "الإعلام والترفيه والألعاب",
    fr: "Médias, Divertissement & Jeux"
  },
  "Agriculture, AgriTech & Food Production": {
    ar: "الزراعة والتكنولوجيا الزراعية والإنتاج الغذائي",
    fr: "Agriculture, AgriTech & Agroalimentaire"
  },
  "Government, Defense & Public Sector": {
    ar: "الحكومة والدفاع والقطاع العام",
    fr: "Gouvernement, Défense & Secteur public"
  },
  "Non-Profit, NGOs & Social Impact": {
    ar: "المنظمات غير الربحية والأثر الاجتماعي",
    fr: "ONG, Associations & Impact social"
  },
  "Hospitality, Travel & Tourism": {
    ar: "الضيافة والسفر والسياحة",
    fr: "Hôtellerie, Voyages & Tourisme"
  },
  "Aerospace, Defense & SpaceTech": {
    ar: "الفضاء والدفاع وتكنولوجيا الفضاء",
    fr: "Aérospatiale, Défense & SpaceTech"
  },
  "Automotive, EV & Future Mobility": {
    ar: "السيارات والمركبات الكهربائية والتنقل الذكي",
    fr: "Automobile, VE & Mobilité future"
  },
  "Telecommunications & Networking": {
    ar: "الاتصالات والشبكات",
    fr: "Télécommunications & Réseaux"
  },
  "Chemicals, Materials & Mining": {
    ar: "المواد الكيميائية والمعادن والتعدين",
    fr: "Chimie, Matériaux & Mines"
  },
  "Environmental, Climate & Sustainability": {
    ar: "البيئة والمناخ والاستدامة",
    fr: "Environnement, Climat & Durabilité"
  },
  "Legal, Consulting & Professional Services": {
    ar: "الاستشارات القانونية والخدمات المهنية",
    fr: "Services juridiques & Conseil"
  },
  "Cybersecurity & Cloud Infrastructure": {
    ar: "الأمن السيبراني والبنية التحتية السحابية",
    fr: "Cybersécurité & Cloud"
  },
  "Biotechnology & Life Sciences": {
    ar: "التكنولوجيا الحيوية وعلوم الحياة",
    fr: "Biotechnologies & Sciences de la vie"
  },
  "Fashion, Luxury & Apparel": {
    ar: "الموضة والأزياء والسلع الفاخرة",
    fr: "Mode, Luxe & Habillement"
  },
  "Sports, Fitness & Recreation": {
    ar: "الرياضة واللياقة والترفيه",
    fr: "Sport, Fitness & Loisirs"
  },
  "Blockchain, Web3 & Digital Assets": {
    ar: "البلوكتشين والويب 3 والأصول الرقمية",
    fr: "Blockchain, Web3 & Actifs numériques"
  },
  "Venture Capital & Private Equity": {
    ar: "رأس المال الاستثماري والاستثمار المباشر",
    fr: "Capital-risque & Private Equity"
  },
  "Robotics & Industrial Automation": {
    ar: "الروبوتات والأتمتة الصناعية",
    fr: "Robotique & Automatisation"
  },
  "Supply Chain & Maritime Shipping": {
    ar: "سلاسل الإمداد والشحن البحري",
    fr: "Chaîne logistique & Fret maritime"
  },
  "Arts, Culture & Heritage": {
    ar: "الفنون والثقافة والتراث",
    fr: "Arts, Culture & Patrimoine"
  },
  "Other / General Business": {
    ar: "أعمال عامة وأخرى",
    fr: "Autre / Affaires générales"
  }
};

export function getLocalizedIndustry(industry, lang = "en") {
  if (!industry) return "";
  if (lang === "ar" && INDUSTRY_TRANSLATIONS[industry]?.ar) {
    return INDUSTRY_TRANSLATIONS[industry].ar;
  }
  if (lang === "fr" && INDUSTRY_TRANSLATIONS[industry]?.fr) {
    return INDUSTRY_TRANSLATIONS[industry].fr;
  }
  return industry;
}
