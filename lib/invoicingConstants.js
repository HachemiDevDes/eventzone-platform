/**
 * Invoicing Constants & Algerian Business Conventions for Eventzone Platform
 */

// 58 Algerian Wilayas for SearchableSelect
export const ALGERIAN_WILAYAS = [
  { value: "01 - Adrar", label: "01 - Adrar" },
  { value: "02 - Chlef", label: "02 - Chlef" },
  { value: "03 - Laghouat", label: "03 - Laghouat" },
  { value: "04 - Oum El Bouaghi", label: "04 - Oum El Bouaghi" },
  { value: "05 - Batna", label: "05 - Batna" },
  { value: "06 - Béjaïa", label: "06 - Béjaïa" },
  { value: "07 - Biskra", label: "07 - Biskra" },
  { value: "08 - Béchar", label: "08 - Béchar" },
  { value: "09 - Blida", label: "09 - Blida" },
  { value: "10 - Bouira", label: "10 - Bouira" },
  { value: "11 - Tamanrasset", label: "11 - Tamanrasset" },
  { value: "12 - Tébessa", label: "12 - Tébessa" },
  { value: "13 - Tlemcen", label: "13 - Tlemcen" },
  { value: "14 - Tiaret", label: "14 - Tiaret" },
  { value: "15 - Tizi Ouzou", label: "15 - Tizi Ouzou" },
  { value: "16 - Alger", label: "16 - Alger" },
  { value: "17 - Djelfa", label: "17 - Djelfa" },
  { value: "18 - Jijel", label: "18 - Jijel" },
  { value: "19 - Sétif", label: "19 - Sétif" },
  { value: "20 - Saïda", label: "20 - Saïda" },
  { value: "21 - Skikda", label: "21 - Skikda" },
  { value: "22 - Sidi Bel Abbès", label: "22 - Sidi Bel Abbès" },
  { value: "23 - Annaba", label: "23 - Annaba" },
  { value: "24 - Guelma", label: "24 - Guelma" },
  { value: "25 - Constantine", label: "25 - Constantine" },
  { value: "26 - Médéa", label: "26 - Médéa" },
  { value: "27 - Mostaganem", label: "27 - Mostaganem" },
  { value: "28 - M'Sila", label: "28 - M'Sila" },
  { value: "29 - Mascara", label: "29 - Mascara" },
  { value: "30 - Ouargla", label: "30 - Ouargla" },
  { value: "31 - Oran", label: "31 - Oran" },
  { value: "32 - El Bayadh", label: "32 - El Bayadh" },
  { value: "33 - Illizi", label: "33 - Illizi" },
  { value: "34 - Bordj Bou Arréridj", label: "34 - Bordj Bou Arréridj" },
  { value: "35 - Boumerdès", label: "35 - Boumerdès" },
  { value: "36 - El Tarf", label: "36 - El Tarf" },
  { value: "37 - Tindouf", label: "37 - Tindouf" },
  { value: "38 - Tissemsilt", label: "38 - Tissemsilt" },
  { value: "39 - El Oued", label: "39 - El Oued" },
  { value: "40 - Khenchela", label: "40 - Khenchela" },
  { value: "41 - Souk Ahras", label: "41 - Souk Ahras" },
  { value: "42 - Tipaza", label: "42 - Tipaza" },
  { value: "43 - Mila", label: "43 - Mila" },
  { value: "44 - Aïn Defla", label: "44 - Aïn Defla" },
  { value: "45 - Naâma", label: "45 - Naâma" },
  { value: "46 - Aïn Témouchent", label: "46 - Aïn Témouchent" },
  { value: "47 - Ghardaïa", label: "47 - Ghardaïa" },
  { value: "48 - Relizane", label: "48 - Relizane" },
  { value: "49 - Timimoun", label: "49 - Timimoun" },
  { value: "50 - Bordj Badji Mokhtar", label: "50 - Bordj Badji Mokhtar" },
  { value: "51 - Ouled Djellal", label: "51 - Ouled Djellal" },
  { value: "52 - Béni Abbès", label: "52 - Béni Abbès" },
  { value: "53 - In Salah", label: "53 - In Salah" },
  { value: "54 - In Guezzam", label: "54 - In Guezzam" },
  { value: "55 - Touggourt", label: "55 - Touggourt" },
  { value: "56 - Djanet", label: "56 - Djanet" },
  { value: "57 - El M'Ghair", label: "57 - El M'Ghair" },
  { value: "58 - El Meniaa", label: "58 - El Meniaa" },
];

// Algerian Banks for SearchableSelect
export const ALGERIAN_BANKS = [
  { value: "BNA", label: "BNA — Banque Nationale d'Algérie" },
  { value: "CPA", label: "CPA — Crédit Populaire d'Algérie" },
  { value: "BEA", label: "BEA — Banque Extérieure d'Algérie" },
  { value: "BDL", label: "BDL — Banque de Développement Local" },
  { value: "BADR", label: "BADR — Banque de l'Agriculture et du Développement Rural" },
  { value: "CNEP", label: "CNEP-Banque — Caisse Nationale d'Épargne et de Prévoyance" },
  { value: "Al Baraka", label: "Banque Al Baraka d'Algérie" },
  { value: "Al Salam", label: "Al Salam Bank Algeria" },
  { value: "Société Générale", label: "Société Générale Algérie (SGA)" },
  { value: "BNP Paribas", label: "BNP Paribas El Djazaïr" },
  { value: "Natixis", label: "Natixis Algérie" },
  { value: "Bank ABC", label: "Bank ABC Algeria (Arab Banking Corporation)" },
  { value: "AGB", label: "AGB — Gulf Bank Algeria" },
  { value: "Housing Bank", label: "Housing Bank for Trade & Finance Algeria" },
  { value: "Fransabank", label: "Fransabank El Djazaïr" },
  { value: "Trust Bank", label: "Trust Bank Algeria" },
  { value: "Autre", label: "Autre établissement bancaire" },
];

// Document Types
export const DOCUMENT_TYPES = [
  { 
    id: "facture", 
    value: "facture", 
    label: "Facture", 
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200", 
    titleUpper: "FACTURE",
    prefix: "EZ-26-"
  },
  { 
    id: "devis", 
    value: "devis", 
    label: "Devis", 
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200", 
    titleUpper: "DEVIS",
    prefix: "DEV-26-"
  },
  { 
    id: "proforma", 
    value: "proforma", 
    label: "Facture Proforma", 
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200", 
    titleUpper: "FACTURE PROFORMA",
    prefix: "PRO-26-"
  },
];

// Document Statuses
export const DOCUMENT_STATUSES = [
  { id: "brouillon", value: "brouillon", label: "Brouillon", color: "slate", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "envoye", value: "envoye", label: "Envoyé", color: "blue", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "partiel", value: "partiel", label: "Partiel", color: "amber", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "encaisse", value: "encaisse", label: "Encaissé", color: "emerald", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "en_retard", value: "en_retard", label: "En retard", color: "rose", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
];

// Payment terms presets
export const PAYMENT_DELAYS = [
  { id: "reception", label: "À réception", days: 0 },
  { id: "15_jours", label: "15 jours", days: 15 },
  { id: "30_jours", label: "30 jours", days: 30 },
  { id: "60_jours", label: "60 jours", days: 60 },
  { id: "custom", label: "Personnalisé", days: null },
];

// TVA Rates in Algeria
export const TVA_RATES = [
  { value: "0", label: "Exonéré (0%)", rate: 0 },
  { value: "9", label: "Taux réduit (9%)", rate: 9 },
  { value: "19", label: "Normal (19%)", rate: 19 },
];

// Supported Currencies
export const CURRENCIES = [
  { value: "DZD", label: "DZD — Dinar Algérien", symbol: "DA" },
  { value: "EUR", label: "EUR — Euro", symbol: "€" },
  { value: "USD", label: "USD — Dollar Américain", symbol: "$" },
];

/**
 * Format currency amount with space thousands separators and decimals
 * e.g. 42840 -> "42 840,00 DA"
 */
export function formatCurrency(amount = 0, currency = "DZD") {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency === "DZD") {
    return `${formatted} DA`;
  }
  if (currency === "EUR") {
    return `${formatted} €`;
  }
  if (currency === "USD") {
    return `$${formatted}`;
  }
  return `${formatted} ${currency}`;
}

/**
 * Algerian Droit de Timbre (Fiscal Stamp Duty)
 * In Algerian tax code: 1% with a minimum of 5 DA and a maximum of 2,500 DA.
 */
export function calculateFiscalStamp(amount = 0) {
  const num = Number(amount) || 0;
  if (num <= 0) return 0;
  const raw = num * 0.01;
  const clamped = Math.max(5, Math.min(2500, Math.ceil(raw)));
  return clamped;
}

/**
 * Default organization profile fallback (matches user's reference screenshot)
 */
export const DEFAULT_INVOICING_PROFILE = {
  name: "Eventzone",
  company_name: "SPASU Eventzone",
  manager_name: "Hachemi Mohamed",
  email: "contact@eventzone.pro",
  phone: "0781457511",
  address: "Lotissement Pons N° 80, 2ème étage, Bureau N° 16, Commune de Kouba, Wilaya d'Alger",
  wilaya: "16 - Alger",
  activity_sector: "Events Management",
  logo_url: "https://i.imgur.com/jFDrQbM.png",
  signature_url: "",
  nif: "002616124370413",
  nis: "002616124370413",
  rc: "26B1243704-00/16",
  article_imposition: "1618480001",
  invoice_prefix: "EZ-26-",
  quote_prefix: "DEV-26-",
  proforma_prefix: "PRO-26-",
  next_invoice_seq: 1,
  next_quote_seq: 1,
  next_proforma_seq: 1,
  default_payment_delay_days: 30,
  default_tva_rate: 19,
  default_currency: "DZD",
  default_notes: "Merci pour votre confiance. Paiement par virement bancaire dans le délai convenu.",
  initial_balance: 0,
  bank_name: "BNA",
  account_holder: "SPASU Eventzone",
  account_number: "",
  rib: "",
  iban: "",
  swift_bic: "",
  bank_agency_address: "Agence d'Alger-Centre",
  is_default: true,
};
