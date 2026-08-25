"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export const COUNTRIES = [
  { code: "AF", name: "Afghanistan", dial: "+93", sample: "70 123 4567" },
  { code: "AL", name: "Albania", dial: "+355", sample: "69 123 4567" },
  { code: "DZ", name: "Algeria", dial: "+213", sample: "550 12 34 56" },
  { code: "AD", name: "Andorra", dial: "+376", sample: "312 345" },
  { code: "AO", name: "Angola", dial: "+244", sample: "923 123 456" },
  { code: "AG", name: "Antigua and Barbuda", dial: "+1268", sample: "464 1234" },
  { code: "AR", name: "Argentina", dial: "+54", sample: "11 1234-5678" },
  { code: "AM", name: "Armenia", dial: "+374", sample: "77 123456" },
  { code: "AU", name: "Australia", dial: "+61", sample: "412 345 678" },
  { code: "AT", name: "Austria", dial: "+43", sample: "664 1234567" },
  { code: "AZ", name: "Azerbaijan", dial: "+994", sample: "50 123 45 67" },
  { code: "BS", name: "Bahamas", dial: "+1242", sample: "359 1234" },
  { code: "BH", name: "Bahrain", dial: "+973", sample: "3600 1234" },
  { code: "BD", name: "Bangladesh", dial: "+880", sample: "1712-345678" },
  { code: "BB", name: "Barbados", dial: "+1246", sample: "230 1234" },
  { code: "BY", name: "Belarus", dial: "+375", sample: "29 123-45-67" },
  { code: "BE", name: "Belgium", dial: "+32", sample: "470 12 34 56" },
  { code: "BZ", name: "Belize", dial: "+501", sample: "612-3456" },
  { code: "BJ", name: "Benin", dial: "+229", sample: "97 12 34 56" },
  { code: "BT", name: "Bhutan", dial: "+975", sample: "17 12 34 56" },
  { code: "BO", name: "Bolivia", dial: "+591", sample: "71234567" },
  { code: "BA", name: "Bosnia and Herzegovina", dial: "+387", sample: "61 123 456" },
  { code: "BW", name: "Botswana", dial: "+267", sample: "71 234 567" },
  { code: "BR", name: "Brazil", dial: "+55", sample: "11 91234-5678" },
  { code: "BN", name: "Brunei", dial: "+673", sample: "712 3456" },
  { code: "BG", name: "Bulgaria", dial: "+359", sample: "88 123 4567" },
  { code: "BF", name: "Burkina Faso", dial: "+226", sample: "70 12 34 56" },
  { code: "BI", name: "Burundi", dial: "+257", sample: "79 12 34 56" },
  { code: "CV", name: "Cabo Verde", dial: "+238", sample: "991 12 34" },
  { code: "KH", name: "Cambodia", dial: "+855", sample: "12 345 678" },
  { code: "CM", name: "Cameroon", dial: "+237", sample: "6 71 23 45 67" },
  { code: "CA", name: "Canada", dial: "+1", sample: "(555) 000-0000" },
  { code: "CF", name: "Central African Republic", dial: "+236", sample: "75 12 34 56" },
  { code: "TD", name: "Chad", dial: "+235", sample: "66 12 34 56" },
  { code: "CL", name: "Chile", dial: "+56", sample: "9 1234 5678" },
  { code: "CN", name: "China", dial: "+86", sample: "138 0000 0000" },
  { code: "CO", name: "Colombia", dial: "+57", sample: "300 1234567" },
  { code: "KM", name: "Comoros", dial: "+269", sample: "321 12 34" },
  { code: "CG", name: "Congo (Brazzaville)", dial: "+242", sample: "06 123 4567" },
  { code: "CD", name: "Congo (Kinshasa)", dial: "+243", sample: "812 345 678" },
  { code: "CR", name: "Costa Rica", dial: "+506", sample: "8312 3456" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", sample: "07 12 34 56 78" },
  { code: "HR", name: "Croatia", dial: "+385", sample: "91 234 5678" },
  { code: "CU", name: "Cuba", dial: "+53", sample: "5 1234567" },
  { code: "CY", name: "Cyprus", dial: "+357", sample: "96 123456" },
  { code: "CZ", name: "Czech Republic", dial: "+420", sample: "601 123 456" },
  { code: "DK", name: "Denmark", dial: "+45", sample: "32 12 34 56" },
  { code: "DJ", name: "Djibouti", dial: "+253", sample: "77 12 34 56" },
  { code: "DM", name: "Dominica", dial: "+1767", sample: "275 1234" },
  { code: "DO", name: "Dominican Republic", dial: "+1809", sample: "234 5678" },
  { code: "EC", name: "Ecuador", dial: "+593", sample: "99 123 4567" },
  { code: "EG", name: "Egypt", dial: "+20", sample: "10 1234 5678" },
  { code: "SV", name: "El Salvador", dial: "+503", sample: "7012 3456" },
  { code: "GQ", name: "Equatorial Guinea", dial: "+240", sample: "222 12 34 56" },
  { code: "ER", name: "Eritrea", dial: "+291", sample: "7 123 456" },
  { code: "EE", name: "Estonia", dial: "+372", sample: "5123 4567" },
  { code: "SZ", name: "Eswatini", dial: "+268", sample: "7612 3456" },
  { code: "ET", name: "Ethiopia", dial: "+251", sample: "91 123 4567" },
  { code: "FJ", name: "Fiji", dial: "+679", sample: "701 2345" },
  { code: "FI", name: "Finland", dial: "+358", sample: "40 1234567" },
  { code: "FR", name: "France", dial: "+33", sample: "6 12 34 56 78" },
  { code: "GA", name: "Gabon", dial: "+241", sample: "06 12 34 56" },
  { code: "GM", name: "Gambia", dial: "+220", sample: "701 2345" },
  { code: "GE", name: "Georgia", dial: "+995", sample: "555 12 34 56" },
  { code: "DE", name: "Germany", dial: "+49", sample: "151 23456789" },
  { code: "GH", name: "Ghana", dial: "+233", sample: "24 123 4567" },
  { code: "GR", name: "Greece", dial: "+30", sample: "691 234 5678" },
  { code: "GD", name: "Grenada", dial: "+1473", sample: "403 1234" },
  { code: "GT", name: "Guatemala", dial: "+502", sample: "5123 4567" },
  { code: "GN", name: "Guinea", dial: "+224", sample: "621 12 34 56" },
  { code: "GW", name: "Guinea-Bissau", dial: "+245", sample: "955 12 34 56" },
  { code: "GY", name: "Guyana", dial: "+592", sample: "612 3456" },
  { code: "HT", name: "Haiti", dial: "+509", sample: "34 12 3456" },
  { code: "HN", name: "Honduras", dial: "+504", sample: "9123-4567" },
  { code: "HK", name: "Hong Kong", dial: "+852", sample: "9123 4567" },
  { code: "HU", name: "Hungary", dial: "+36", sample: "20 123 4567" },
  { code: "IS", name: "Iceland", dial: "+354", sample: "612 3456" },
  { code: "IN", name: "India", dial: "+91", sample: "98765 43210" },
  { code: "ID", name: "Indonesia", dial: "+62", sample: "812-3456-7890" },
  { code: "IR", name: "Iran", dial: "+98", sample: "912 345 6789" },
  { code: "IQ", name: "Iraq", dial: "+964", sample: "790 123 4567" },
  { code: "IE", name: "Ireland", dial: "+353", sample: "85 123 4567" },
  { code: "IL", name: "Israel", dial: "+972", sample: "50-123-4567" },
  { code: "IT", name: "Italy", dial: "+39", sample: "312 3456789" },
  { code: "JM", name: "Jamaica", dial: "+1876", sample: "281 1234" },
  { code: "JP", name: "Japan", dial: "+81", sample: "90 1234 5678" },
  { code: "JO", name: "Jordan", dial: "+962", sample: "7 9012 3456" },
  { code: "KZ", name: "Kazakhstan", dial: "+7", sample: "701 123 4567" },
  { code: "KE", name: "Kenya", dial: "+254", sample: "712 345678" },
  { code: "KI", name: "Kiribati", dial: "+686", sample: "720 12345" },
  { code: "KW", name: "Kuwait", dial: "+965", sample: "9123 4567" },
  { code: "KG", name: "Kyrgyzstan", dial: "+996", sample: "555 123 456" },
  { code: "LA", name: "Laos", dial: "+856", sample: "20 22 123 456" },
  { code: "LV", name: "Latvia", dial: "+371", sample: "21 234 567" },
  { code: "LB", name: "Lebanon", dial: "+961", sample: "71 123 456" },
  { code: "LS", name: "Lesotho", dial: "+266", sample: "5812 3456" },
  { code: "LR", name: "Liberia", dial: "+231", sample: "77 123 456" },
  { code: "LY", name: "Libya", dial: "+218", sample: "91 234 5678" },
  { code: "LI", name: "Liechtenstein", dial: "+423", sample: "660 1234" },
  { code: "LT", name: "Lithuania", dial: "+370", sample: "612 34567" },
  { code: "LU", name: "Luxembourg", dial: "+352", sample: "628 123 456" },
  { code: "MO", name: "Macao", dial: "+853", sample: "6123 4567" },
  { code: "MG", name: "Madagascar", dial: "+261", sample: "32 12 345 67" },
  { code: "MW", name: "Malawi", dial: "+265", sample: "99 123 4567" },
  { code: "MY", name: "Malaysia", dial: "+60", sample: "12-345 6789" },
  { code: "MV", name: "Maldives", dial: "+960", sample: "712-3456" },
  { code: "ML", name: "Mali", dial: "+223", sample: "65 12 34 56" },
  { code: "MT", name: "Malta", dial: "+356", sample: "9912 3456" },
  { code: "MR", name: "Mauritania", dial: "+222", sample: "22 12 34 56" },
  { code: "MU", name: "Mauritius", dial: "+230", sample: "5123 4567" },
  { code: "MX", name: "Mexico", dial: "+52", sample: "55 1234 5678" },
  { code: "MD", name: "Moldova", dial: "+373", sample: "621 12 345" },
  { code: "MC", name: "Monaco", dial: "+377", sample: "6 12 34 56 78" },
  { code: "MN", name: "Mongolia", dial: "+976", sample: "8812 3456" },
  { code: "ME", name: "Montenegro", dial: "+382", sample: "67 123 456" },
  { code: "MA", name: "Morocco", dial: "+212", sample: "612-345678" },
  { code: "MZ", name: "Mozambique", dial: "+258", sample: "84 123 4567" },
  { code: "MM", name: "Myanmar", dial: "+95", sample: "9 212 345 678" },
  { code: "NA", name: "Namibia", dial: "+264", sample: "81 123 4567" },
  { code: "NP", name: "Nepal", dial: "+977", sample: "984-1234567" },
  { code: "NL", name: "Netherlands", dial: "+31", sample: "6 12345678" },
  { code: "NZ", name: "New Zealand", dial: "+64", sample: "21 123 4567" },
  { code: "NI", name: "Nicaragua", dial: "+505", sample: "8123 4567" },
  { code: "NE", name: "Niger", dial: "+227", sample: "90 12 34 56" },
  { code: "NG", name: "Nigeria", dial: "+234", sample: "803 123 4567" },
  { code: "MK", name: "North Macedonia", dial: "+389", sample: "70 123 456" },
  { code: "NO", name: "Norway", dial: "+47", sample: "412 34 567" },
  { code: "OM", name: "Oman", dial: "+968", sample: "9123 4567" },
  { code: "PK", name: "Pakistan", dial: "+92", sample: "301 2345678" },
  { code: "PS", name: "Palestine", dial: "+970", sample: "59 123 4567" },
  { code: "PA", name: "Panama", dial: "+507", sample: "6123-4567" },
  { code: "PG", name: "Papua New Guinea", dial: "+675", sample: "7012 3456" },
  { code: "PY", name: "Paraguay", dial: "+595", sample: "981 123456" },
  { code: "PE", name: "Peru", dial: "+51", sample: "912 345 678" },
  { code: "PH", name: "Philippines", dial: "+63", sample: "917 123 4567" },
  { code: "PL", name: "Poland", dial: "+48", sample: "512 345 678" },
  { code: "PT", name: "Portugal", dial: "+351", sample: "912 345 678" },
  { code: "QA", name: "Qatar", dial: "+974", sample: "3312 3456" },
  { code: "RO", name: "Romania", dial: "+40", sample: "712 345 678" },
  { code: "RU", name: "Russia", dial: "+7", sample: "912 345-67-89" },
  { code: "RW", name: "Rwanda", dial: "+250", sample: "788 123 456" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", sample: "50 123 4567" },
  { code: "SN", name: "Senegal", dial: "+221", sample: "77 123 45 67" },
  { code: "RS", name: "Serbia", dial: "+381", sample: "60 1234567" },
  { code: "SC", name: "Seychelles", dial: "+248", sample: "2 512 345" },
  { code: "SL", name: "Sierra Leone", dial: "+232", sample: "76 123456" },
  { code: "SG", name: "Singapore", dial: "+65", sample: "8123 4567" },
  { code: "SK", name: "Slovakia", dial: "+421", sample: "905 123 456" },
  { code: "SI", name: "Slovenia", dial: "+386", sample: "41 234 567" },
  { code: "SO", name: "Somalia", dial: "+252", sample: "61 234567" },
  { code: "ZA", name: "South Africa", dial: "+27", sample: "82 123 4567" },
  { code: "KR", name: "South Korea", dial: "+82", sample: "10 1234 5678" },
  { code: "SS", name: "South Sudan", dial: "+211", sample: "912 345 678" },
  { code: "ES", name: "Spain", dial: "+34", sample: "612 345 678" },
  { code: "LK", name: "Sri Lanka", dial: "+94", sample: "71 234 5678" },
  { code: "SD", name: "Sudan", dial: "+249", sample: "91 234 5678" },
  { code: "SE", name: "Sweden", dial: "+46", sample: "70-123 45 67" },
  { code: "CH", name: "Switzerland", dial: "+41", sample: "78 123 45 67" },
  { code: "SY", name: "Syria", dial: "+963", sample: "944 123 456" },
  { code: "TW", name: "Taiwan", dial: "+886", sample: "912 345 678" },
  { code: "TJ", name: "Tajikistan", dial: "+992", sample: "918 12 3456" },
  { code: "TZ", name: "Tanzania", dial: "+255", sample: "712 345 678" },
  { code: "TH", name: "Thailand", dial: "+66", sample: "81 234 5678" },
  { code: "TG", name: "Togo", dial: "+228", sample: "90 12 34 56" },
  { code: "TN", name: "Tunisia", dial: "+216", sample: "20 123 456" },
  { code: "TR", name: "Turkey", dial: "+90", sample: "532 123 45 67" },
  { code: "TM", name: "Turkmenistan", dial: "+993", sample: "65 123456" },
  { code: "UG", name: "Uganda", dial: "+256", sample: "772 123456" },
  { code: "UA", name: "Ukraine", dial: "+380", sample: "50 123 4567" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", sample: "50 123 4567" },
  { code: "GB", name: "United Kingdom", dial: "+44", sample: "7911 123456" },
  { code: "US", name: "United States", dial: "+1", sample: "(555) 000-0000" },
  { code: "UY", name: "Uruguay", dial: "+598", sample: "94 123 456" },
  { code: "UZ", name: "Uzbekistan", dial: "+998", sample: "90 123 45 67" },
  { code: "VA", name: "Vatican City", dial: "+379", sample: "6 123 4567" },
  { code: "VE", name: "Venezuela", dial: "+58", sample: "412 1234567" },
  { code: "VN", name: "Vietnam", dial: "+84", sample: "91 234 5678" },
  { code: "YE", name: "Yemen", dial: "+967", sample: "71 234 567" },
  { code: "ZM", name: "Zambia", dial: "+260", sample: "97 1234567" },
  { code: "ZW", name: "Zimbabwe", dial: "+263", sample: "71 234 5678" }
];

export function parsePhoneNumber(fullStr = "", defaultCountryCode = "DZ") {
  const str = (fullStr || "").trim();
  if (!str) {
    const fallback = COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
    return { country: fallback, nationalNumber: "" };
  }

  // If starts with +, match the longest dial code
  if (str.startsWith("+")) {
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (str.startsWith(c.dial)) {
        const national = str.slice(c.dial.length).trim();
        return { country: c, nationalNumber: national };
      }
    }
  }

  const defaultCountry = COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
  return { country: defaultCountry, nationalNumber: str };
}

export default function CountryPhoneInput({
  value = "",
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  id,
  name,
  className = "",
  inputClassName = "",
  defaultCountry = "DZ"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Parse current country and national number
  const parsed = useMemo(() => {
    return parsePhoneNumber(value, defaultCountry);
  }, [value, defaultCountry]);

  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);

  // Sync if value prop changes from outside
  useEffect(() => {
    const p = parsePhoneNumber(value, defaultCountry);
    setSelectedCountry(p.country);
    setNationalNumber(p.nationalNumber);
  }, [value, defaultCountry]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    if (!search) return COUNTRIES;
    const s = search.toLowerCase();
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(s) || c.dial.includes(s) || c.code.toLowerCase().includes(s)
    );
  }, [search]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    const combined = nationalNumber.trim() ? `${country.dial} ${nationalNumber.trim()}` : "";
    if (onChange) onChange(combined);
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;

    // Check if user pasted/typed a full number starting with +
    if (raw.startsWith("+")) {
      const p = parsePhoneNumber(raw, selectedCountry.code);
      setSelectedCountry(p.country);
      setNationalNumber(p.nationalNumber);
      if (onChange) onChange(p.nationalNumber ? `${p.country.dial} ${p.nationalNumber}` : "");
      return;
    }

    setNationalNumber(raw);
    const combined = raw.trim() ? `${selectedCountry.dial} ${raw.trim()}` : "";
    if (onChange) onChange(combined);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="relative flex items-stretch w-full rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white transition-all shadow-2xs">
        {/* Country Selector Button - Compact without flag icon to save space */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 border-r border-slate-200 bg-slate-100/80 hover:bg-slate-200/70 rounded-l-xl text-xs font-bold text-slate-800 transition-colors cursor-pointer select-none shrink-0"
          title={`Selected: ${selectedCountry.name} (${selectedCountry.dial})`}
        >
          <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
            {selectedCountry.code}
          </span>
          <span className="text-xs font-bold text-slate-800">
            {selectedCountry.dial}
          </span>
          <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* National Number Input */}
        <input
          type="tel"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          value={nationalNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.sample}
          className={`flex-1 min-w-0 px-3.5 py-2 bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none ${inputClassName}`}
        />
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1.5 w-72 max-h-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-scale-up"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Country List - Clean text without flags */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-56">
            {filteredCountries.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No country found</div>
            ) : (
              filteredCountries.map(c => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={`${c.code}-${c.dial}`}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-bold text-slate-400 w-5">{c.code}</span>
                      <span className="truncate text-slate-800 font-medium">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">{c.dial}</span>
                      {isSelected && <Check size={13} className="text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
