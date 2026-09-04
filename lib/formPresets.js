"use client";

// Pre-made Form Fields and Smart Suggestions for Eventzone Forms Builder
import { 
  Users, Globe, MapPin, Camera, Briefcase, Building2,
  Award, Megaphone, Target, UserCheck, Sparkles,
  FileText, FileSpreadsheet, Presentation, Paperclip
} from "lucide-react";

export const COUNTRY_CITIES_MAP = {
  "Algeria": [
    "01 - Adrar",
    "02 - Chlef",
    "03 - Laghouat",
    "04 - Oum El Bouaghi",
    "05 - Batna",
    "06 - Béjaïa",
    "07 - Biskra",
    "08 - Béchar",
    "09 - Blida",
    "10 - Bouira",
    "11 - Tamanrasset",
    "12 - Tébessa",
    "13 - Tlemcen",
    "14 - Tiaret",
    "15 - Tizi Ouzou",
    "16 - Algiers (Alger)",
    "17 - Djelfa",
    "18 - Jijel",
    "19 - Sétif",
    "20 - Saïda",
    "21 - Skikda",
    "22 - Sidi Bel Abbès",
    "23 - Annaba",
    "24 - Guelma",
    "25 - Constantine",
    "26 - Médéa",
    "27 - Mostaganem",
    "28 - M'Sila",
    "29 - Mascara",
    "30 - Ouargla",
    "31 - Oran",
    "32 - El Bayadh",
    "33 - Illizi",
    "34 - Bordj Bou Arréridj",
    "35 - Boumerdès",
    "36 - El Tarf",
    "37 - Tindouf",
    "38 - Tissemsilt",
    "39 - El Oued",
    "40 - Khenchela",
    "41 - Souk Ahras",
    "42 - Tipaza",
    "43 - Mila",
    "44 - Aïn Defla",
    "45 - Naâma",
    "46 - Aïn Témouchent",
    "47 - Ghardaïa",
    "48 - Relizane",
    "49 - Timimoun",
    "50 - Bordj Badji Mokhtar",
    "51 - Ouled Djellal",
    "52 - Béni Abbès",
    "53 - In Salah",
    "54 - In Guezzam",
    "55 - Touggourt",
    "56 - Djanet",
    "57 - El M'Ghair",
    "58 - El Meniaa",
    "Other"
  ],
  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", 
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", 
    "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco", 
    "Charlotte", "Indianapolis", "Seattle", "Denver", "Washington D.C.", 
    "Boston", "El Paso", "Nashville", "Detroit", "Las Vegas", "Portland", 
    "Miami", "Atlanta", "Orlando", "Raleigh", "Minneapolis", "Tampa", "Other"
  ],
  "United Kingdom": [
    "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", 
    "Bristol", "Leeds", "Liverpool", "Cambridge", "Oxford", 
    "Newcastle", "Belfast", "Cardiff", "Sheffield", "Nottingham",
    "Southampton", "Brighton", "Leicester", "Coventry", "Aberdeen", "Other"
  ],
  "France": [
    "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", 
    "Bordeaux", "Strasbourg", "Lille", "Rennes", "Montpellier", 
    "Grenoble", "Toulon", "Angers", "Dijon", "Brest", "Le Mans", "Aix-en-Provence", "Other"
  ],
  "Germany": [
    "Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", 
    "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Hannover", 
    "Nuremberg", "Bonn", "Bremen", "Dortmund", "Essen", "Karlsruhe", "Mannheim", "Other"
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", 
    "Fujairah", "Umm Al Quwain", "Al Ain", "Madinat Zayed", "Khor Fakkan", "Other"
  ],
  "Saudi Arabia": [
    "Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", 
    "Dhahran", "Tabuk", "Abha", "Taif", "Jubail", "Yanbu", "Buraidah", "Khamis Mushait", "Najran", "Jazan", "Hail", "Other"
  ],
  "Qatar": [
    "Doha", "Al Rayyan", "Al Wakrah", "Lusail", "Al Khor", "Umm Salal", "Al Shamal", "Al Shahaniya", "Dukhan", "Mesaieed", "Other"
  ],
  "Kuwait": [
    "Kuwait City", "Hawalli", "Salmiya", "Al Ahmadi", "Farwaniya", "Jahra", "Mubarak Al-Kabeer", "Fahaheel", "Sabah Al Salem", "Other"
  ],
  "Bahrain": [
    "Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra", "Budaiya", "Jidhafs", "Other"
  ],
  "Oman": [
    "Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Seeb", "Bawshar", "Ibri", "Rustaq", "Khasab", "Buraimi", "Other"
  ],
  "Egypt": [
    "Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Hurghada", 
    "Luxor", "Aswan", "Mansoura", "Tanta", "Port Said", "Suez", 
    "Ismailia", "Fayoum", "Zagazig", "Asyut", "Minya", "Damietta", "Other"
  ],
  "Morocco": [
    "Casablanca", "Rabat", "Marrakech", "Tangier", "Fes", 
    "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "Mohammedia", "Khouribga", "El Jadida", "Nador", "Other"
  ],
  "Tunisia": [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", 
    "Gabes", "Ariana", "La Marsa", "Monastir", "Hammamet", "Nabeul", "Djerba", "Zarzis", "Gafsa", "Other"
  ],
  "Canada": [
    "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", 
    "Edmonton", "Quebec City", "Winnipeg", "Halifax", "Waterloo", "Victoria", "London", "Kitchener", "Hamilton", "Surrey", "Other"
  ],
  "Spain": [
    "Madrid", "Barcelona", "Valencia", "Seville", "Bilbao", 
    "Malaga", "Zaragoza", "Palma", "Alicante", "Cordoba", "Valladolid", "Vigo", "Granada", "San Sebastian", "Murcia", "Other"
  ],
  "Italy": [
    "Rome", "Milan", "Turin", "Florence", "Bologna", 
    "Naples", "Venice", "Genoa", "Verona", "Palermo", "Bari", "Catania", "Trieste", "Padua", "Brescia", "Other"
  ],
  "Switzerland": [
    "Zurich", "Geneva", "Basel", "Bern", "Lausanne", 
    "Lucerne", "Lugano", "St. Gallen", "Winterthur", "Biel/Bienne", "Fribourg", "Schaffhausen", "Neuchatel", "Other"
  ],
  "Netherlands": [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", 
    "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Haarlem", "Arnhem", "Maastricht", "Leiden", "Other"
  ],
  "Turkey": [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", 
    "Adana", "Gaziantep", "Konya", "Mersin", "Diyarbakir", "Kayseri", "Eskisehir", "Trabzon", "Samsun", "Other"
  ],
  "India": [
    "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", 
    "Pune", "Kolkata", "Ahmedabad", "Gurugram", "Noida", "Jaipur", "Surat", "Lucknow", "Chandigarh", "Kochi", "Indore", "Other"
  ],
  "China": [
    "Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Hangzhou", 
    "Chengdu", "Hong Kong", "Wuhan", "Nanjing", "Xi'an", "Chongqing", "Tianjin", "Suzhou", "Macao", "Other"
  ],
  "Japan": [
    "Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", 
    "Fukuoka", "Sapporo", "Kobe", "Sendai", "Hiroshima", "Kawasaki", "Saitama", "Chiba", "Other"
  ],
  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", 
    "Canberra", "Gold Coast", "Hobart", "Darwin", "Newcastle", "Cairns", "Wollongong", "Geelong", "Other"
  ],
  "Brazil": [
    "São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte", 
    "Curitiba", "Porto Alegre", "Salvador", "Recife", "Fortaleza", "Manaus", "Florianópolis", "Goiânia", "Campinas", "Other"
  ],
  "Mexico": [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", 
    "Cancún", "Querétaro", "Mérida", "León", "Ciudad Juárez", "Toluca", "San Luis Potosí", "Other"
  ],
  "Argentina": [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", 
    "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan", "Neuquén", "Other"
  ],
  "South Africa": [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", 
    "Bloemfontein", "East London", "Nelspruit", "Kimberley", "Polokwane", "Other"
  ],
  "Nigeria": [
    "Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", 
    "Benin City", "Kaduna", "Enugu", "Aba", "Jos", "Ilorin", "Calabar", "Other"
  ],
  "Kenya": [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", 
    "Thika", "Malindi", "Kitale", "Garissa", "Kakamega", "Other"
  ],
  "Russia": [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", 
    "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd", "Other"
  ],
  "South Korea": [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", 
    "Gwangju", "Suwon", "Ulsan", "Changwon", "Seongnam", "Jeju", "Other"
  ],
  "Singapore": [
    "Singapore", "Central Area", "Jurong", "Tampines", "Woodlands", "Bedok", "Yishun", "Hougang", "Other"
  ],
  "Malaysia": [
    "Kuala Lumpur", "George Town (Penang)", "Johor Bahru", "Petaling Jaya", "Shah Alam", 
    "Ipoh", "Malacca City", "Kota Kinabalu", "Kuching", "Kuantan", "Other"
  ],
  "Indonesia": [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", 
    "Semarang", "Tangerang", "Makassar", "Depok", "Palembang", "Bali (Denpasar)", "Yogyakarta", "Other"
  ],
  "Pakistan": [
    "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", 
    "Peshawar", "Multan", "Islamabad", "Quetta", "Sialkot", "Other"
  ],
  "Bangladesh": [
    "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", 
    "Barisal", "Rangpur", "Comilla", "Gazipur", "Narayanganj", "Other"
  ],
  "Belgium": [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", 
    "Bruges", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "Other"
  ],
  "Sweden": [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", 
    "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Other"
  ],
  "Norway": [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", 
    "Kristiansand", "Drammen", "Fredrikstad", "Tromsø", "Sandnes", "Ålesund", "Other"
  ],
  "Denmark": [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", 
    "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Other"
  ],
  "Finland": [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", 
    "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori", "Other"
  ],
  "Poland": [
    "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", 
    "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Białystok", "Katowice", "Other"
  ],
  "Portugal": [
    "Lisbon", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", 
    "Funchal", "Coimbra", "Setúbal", "Almada", "Aveiro", "Faro", "Cascais", "Other"
  ],
  "Ireland": [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford", 
    "Drogheda", "Dundalk", "Swords", "Bray", "Navan", "Kilkenny", "Other"
  ],
  "Austria": [
    "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", 
    "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn", "Bregenz", "Other"
  ],
  "Greece": [
    "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", 
    "Volos", "Ioannina", "Chania", "Rhodes", "Chalcis", "Other"
  ],
  "New Zealand": [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", 
    "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua", "Queenstown", "Other"
  ],
  "Chile": [
    "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", 
    "Temuco", "Rancagua", "Talca", "Arica", "Puerto Montt", "Iquique", "Other"
  ],
  "Colombia": [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", 
    "Cúcuta", "Soledad", "Ibagué", "Bucaramanga", "Santa Marta", "Pereira", "Other"
  ],
  "Peru": [
    "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", 
    "Iquitos", "Cusco", "Chimbote", "Huancayo", "Tacna", "Other"
  ],
  "Philippines": [
    "Manila", "Quezon City", "Davao City", "Caloocan", "Cebu City", 
    "Zamboanga City", "Taguig", "Pasig", "Cagayan de Oro", "Parañaque", "Makati", "Other"
  ],
  "Thailand": [
    "Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Hat Yai", 
    "Udon Thani", "Pak Kret", "Khon Kaen", "Pattaya", "Phuket", "Other"
  ],
  "Vietnam": [
    "Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho", 
    "Bien Hoa", "Nha Trang", "Hue", "Vung Tau", "Da Lat", "Other"
  ],
  "Jordan": [
    "Amman", "Zarqa", "Irbid", "Russeifa", "Aqaba", 
    "Madaba", "As-Salt", "Mafraq", "Jerash", "Ma'an", "Other"
  ],
  "Lebanon": [
    "Beirut", "Tripoli", "Sidon", "Tyre", "Nabatieh", 
    "Zahlé", "Jounieh", "Byblos", "Baalbek", "Aley", "Other"
  ],
  "Iraq": [
    "Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", 
    "Najaf", "Karbala", "Kirkuk", "Nasiriyah", "Amarah", "Duhok", "Other"
  ]
};

// Global in-memory cache for dynamic city queries from worldwide database
const DYNAMIC_CITIES_CACHE = {};

export function getCitiesForCountry(countryName = "") {
  if (!countryName) return COUNTRY_CITIES_MAP["Algeria"];
  const normalized = countryName.trim();

  const aliases = {
    "dz": "Algeria",
    "algerie": "Algeria",
    "algérie": "Algeria",
    "usa": "United States",
    "us": "United States",
    "uk": "United Kingdom",
    "gb": "United Kingdom",
    "uae": "United Arab Emirates",
    "ksa": "Saudi Arabia"
  };
  const targetName = aliases[normalized.toLowerCase()] || normalized;
  
  // Algeria always uses the official numbered 58 wilayas
  if (targetName.toLowerCase() === "algeria" || normalized.toLowerCase().includes("alger")) {
    return COUNTRY_CITIES_MAP["Algeria"];
  }

  // Check in-memory cache
  if (DYNAMIC_CITIES_CACHE[targetName] && DYNAMIC_CITIES_CACHE[targetName].length > 0) {
    return DYNAMIC_CITIES_CACHE[targetName];
  }

  // Exact match in static map
  if (COUNTRY_CITIES_MAP[targetName]) {
    return COUNTRY_CITIES_MAP[targetName];
  }
  
  // Case-insensitive / partial match
  const foundKey = Object.keys(COUNTRY_CITIES_MAP).find(
    k => k.toLowerCase() === targetName.toLowerCase() ||
         targetName.toLowerCase().includes(k.toLowerCase()) ||
         k.toLowerCase().includes(targetName.toLowerCase())
  );

  return foundKey ? COUNTRY_CITIES_MAP[foundKey] : [];
}

// Dynamically fetch full cities list for any country worldwide
export async function fetchCitiesForCountryOnline(countryName = "") {
  if (!countryName) return COUNTRY_CITIES_MAP["Algeria"];
  const normalized = countryName.trim();
  const lower = normalized.toLowerCase();

  // For Algeria, ALWAYS use the official numbered 58 Wilayas catalog
  if (lower === "algeria" || lower === "dz" || lower === "algerie" || lower === "algérie" || lower.includes("alger")) {
    return COUNTRY_CITIES_MAP["Algeria"];
  }

  // Return cached if available
  if (DYNAMIC_CITIES_CACHE[normalized] && DYNAMIC_CITIES_CACHE[normalized].length > 0) {
    return DYNAMIC_CITIES_CACHE[normalized];
  }

  // Check localStorage cache if on client
  if (typeof window !== "undefined") {
    try {
      const cachedStr = localStorage.getItem(`cities_${normalized.toLowerCase()}`);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          DYNAMIC_CITIES_CACHE[normalized] = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
  }

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: normalized })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        // Unique and sorted cities
        const uniqueCities = Array.from(new Set(data.data)).sort((a, b) => a.localeCompare(b));
        const finalCities = [...uniqueCities, "Other"];
        DYNAMIC_CITIES_CACHE[normalized] = finalCities;

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`cities_${normalized.toLowerCase()}`, JSON.stringify(finalCities));
          } catch {
            // ignore
          }
        }
        return finalCities;
      }
    }
  } catch (err) {
    console.warn("Dynamic cities fetch fallback to static map:", err);
  }

  return getCitiesForCountry(normalized);
}

export const PRESET_SMART_FIELDS = [
  {
    id: "preset_gender",
    type: "select",
    label: "Gender",
    placeholder: "Select your gender...",
    description: "Dropdown with standard gender options",
    icon: Users,
    category: "Demographics",
    required: false,
    options: ["Male", "Female", "Prefer not to say"]
  },
  {
    id: "preset_country",
    type: "country",
    label: "Country",
    placeholder: "Select your country of residence...",
    description: "Searchable country selector (all world countries)",
    icon: Globe,
    category: "Location",
    required: true,
    options: []
  },
  {
    id: "preset_city",
    type: "city",
    label: "City",
    placeholder: "Select or enter your city...",
    description: "Dynamic city selection linked to Country",
    icon: MapPin,
    category: "Location",
    required: false,
    options: []
  },
  {
    id: "preset_picture",
    type: "picture",
    label: "Badge Picture",
    placeholder: "Upload or take a photo for your attendee badge...",
    description: "Attendee photo displayed and printed on the official badge",
    icon: Camera,
    category: "Identity",
    required: false,
    showsOnBadge: true,
    options: []
  },
  {
    id: "preset_company",
    type: "text",
    label: "Company / Organization",
    placeholder: "e.g. Acme Corporation, Google, MIT...",
    description: "Company or organization name displayed on the attendee badge",
    icon: Building2,
    category: "Professional",
    required: false,
    showsOnBadge: true,
    options: []
  },
  {
    id: "preset_function",
    type: "select",
    label: "Job Function / Role",
    placeholder: "Select your professional job function...",
    description: "Job role or function displayed on the attendee badge",
    icon: Award,
    category: "Professional",
    required: true,
    showsOnBadge: true,
    options: [
      "Executive & C-Suite",
      "Engineering & Software Development",
      "Product Management & UX Design",
      "Sales & Business Development",
      "Marketing, PR & Growth",
      "Operations & Logistics",
      "Human Resources & Talent",
      "Finance, Accounting & Legal",
      "Research & Data Science",
      "Founder & Entrepreneur",
      "Student / Academic Researcher",
      "Consulting & Advisory",
      "Other"
    ]
  },
  {
    id: "preset_industry",
    type: "select",
    label: "Industry",
    placeholder: "Select your primary industry...",
    description: "Dropdown with standard business industries",
    icon: Briefcase,
    category: "Professional",
    required: true,
    options: [
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
    ]
  },
  {
    id: "preset_referral",
    type: "select",
    label: "How did you hear about us?",
    placeholder: "Select referral channel...",
    description: "Marketing & referral source attribution",
    icon: Megaphone,
    category: "Marketing",
    required: false,
    options: [
      "Social Media (LinkedIn, X, Instagram)",
      "Email Newsletter / Invitation",
      "Friend or Colleague Recommendation",
      "Search Engine (Google, Bing)",
      "Event Sponsor or Exhibitor Partner",
      "Community / Slack / Discord Group",
      "Online Press & News Article",
      "Outdoor / Billboard / Print Flyer",
      "Other"
    ]
  },
  {
    id: "preset_reason",
    type: "checkbox",
    label: "Reason for Attending",
    placeholder: "Select all that apply...",
    description: "Multi-select attendance goals & objectives",
    icon: Target,
    category: "Marketing",
    required: false,
    options: [
      "Networking & Meeting Industry Peers",
      "Learning from Keynotes & Workshops",
      "Finding New Business Partners & Leads",
      "Meeting Investors & Seeking Funding",
      "Exploring Career & Job Opportunities",
      "Discovering Innovative Products & Tech",
      "Evaluating Sponsorship / Exhibitor Booths",
      "Speaking & Presenting Research",
      "Other"
    ]
  }
];

/**
 * Splits a list of form fields into multi-page sections based on `type: "section"` elements.
 * If no section elements exist, returns 1 single section containing all fields.
 */
export function getFormSections(fields = []) {
  const safeFields = Array.isArray(fields) ? fields : [];
  const hasSections = safeFields.some(f => f && f.type === "section");
  
  if (!hasSections) {
    return [{
      id: "section_default",
      title: "",
      description: "",
      fields: safeFields
    }];
  }

  const sections = [];
  let currentSection = {
    id: "section_initial",
    title: "General Information",
    description: "",
    fields: []
  };

  safeFields.forEach((field, idx) => {
    if (!field) return;
    if (field.type === "section") {
      // If previous section accumulated any fields, save it to sections array
      if (currentSection.fields.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        id: field.id || `section_${idx + 1}`,
        title: field.label || `Section ${sections.length + 1}`,
        description: field.helpText || field.description || "",
        fields: []
      };
    } else {
      currentSection.fields.push(field);
    }
  });

  if (currentSection.fields.length > 0 || sections.length === 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Helper to get the localized label for a smart preset field.
 */
export function getPresetFieldLabel(preset, t) {
  if (!preset) return "";
  if (typeof t === "function") {
    const keyMap = {
      preset_gender: "forms.smartFieldGenderLabel",
      preset_country: "forms.smartFieldCountryLabel",
      preset_city: "forms.smartFieldCityLabel",
      preset_picture: "forms.smartFieldPictureLabel",
      preset_company: "forms.smartFieldCompanyLabel",
      preset_function: "forms.smartFieldFunctionLabel",
      preset_industry: "forms.smartFieldIndustryLabel",
      preset_referral: "forms.smartFieldReferralLabel",
      preset_reason: "forms.smartFieldReasonLabel"
    };
    if (preset.id && keyMap[preset.id]) {
      return t(keyMap[preset.id], preset.label);
    }
  }
  return preset.label;
}

/**
 * Helper to get the localized description for a smart preset field.
 */
export function getPresetFieldDescription(preset, t) {
  if (!preset) return "";
  if (typeof t === "function") {
    const keyMap = {
      preset_gender: "forms.smartFieldGenderDesc",
      preset_country: "forms.smartFieldCountryDesc",
      preset_city: "forms.smartFieldCityDesc",
      preset_picture: "forms.smartFieldPictureDesc",
      preset_company: "forms.smartFieldCompanyDesc",
      preset_function: "forms.smartFieldFunctionDesc",
      preset_industry: "forms.smartFieldIndustryDesc",
      preset_referral: "forms.smartFieldReferralDesc",
      preset_reason: "forms.smartFieldReasonDesc"
    };
    if (preset.id && keyMap[preset.id]) {
      return t(keyMap[preset.id], preset.description);
    }
  }
  return preset.description;
}

/**
 * Helper to get localized option text for standard options across presets.
 */
export function getLocalizedPresetOption(opt, t) {
  if (!opt || typeof opt !== "string") return opt;
  if (typeof t !== "function") return opt;

  const optionKeyMap = {
    "Male": "forms.optMale",
    "Female": "forms.optFemale",
    "Prefer not to say": "forms.optPreferNotToSay",
    "Executive & C-Suite": "forms.optExecutiveCSuite",
    "Engineering & Software Development": "forms.optEngineeringSoftware",
    "Product Management & UX Design": "forms.optProductManagementUx",
    "Sales & Business Development": "forms.optSalesBusinessDev",
    "Marketing, PR & Growth": "forms.optMarketingPrGrowth",
    "Operations & Logistics": "forms.optOperationsLogistics",
    "Human Resources & Talent": "forms.optHumanResourcesTalent",
    "Finance, Accounting & Legal": "forms.optFinanceAccountingLegal",
    "Research & Data Science": "forms.optResearchDataScience",
    "Founder & Entrepreneur": "forms.optFounderEntrepreneur",
    "Student / Academic Researcher": "forms.optStudentResearcher",
    "Consulting & Advisory": "forms.optConsultingAdvisory",
    "Social Media (LinkedIn, X, Instagram)": "forms.optSocialMedia",
    "Email Newsletter / Invitation": "forms.optEmailNewsletter",
    "Friend or Colleague Recommendation": "forms.optFriendRecommendation",
    "Search Engine (Google, Bing)": "forms.optSearchEngine",
    "Event Sponsor or Exhibitor Partner": "forms.optEventSponsor",
    "Community / Slack / Discord Group": "forms.optCommunityGroup",
    "Online Press & News Article": "forms.optOnlinePress",
    "Outdoor / Billboard / Print Flyer": "forms.optOutdoorPrint",
    "Networking & Meeting Industry Peers": "forms.optNetworkingPeers",
    "Learning from Keynotes & Workshops": "forms.optLearningKeynotes",
    "Finding New Business Partners & Leads": "forms.optBusinessPartners",
    "Meeting Investors & Seeking Funding": "forms.optMeetingInvestors",
    "Exploring Career & Job Opportunities": "forms.optCareerOpportunities",
    "Discovering Innovative Products & Tech": "forms.optDiscoveringTech",
    "Evaluating Sponsorship / Exhibitor Booths": "forms.optEvaluatingSponsorship",
    "Speaking & Presenting Research": "forms.optSpeakingResearch",
    "Other": "common.other"
  };

  const key = optionKeyMap[opt.trim()];
  if (key) {
    return t(key, opt);
  }
  return opt;
}
