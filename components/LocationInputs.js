"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Globe, MapPin, Loader2 } from "lucide-react";
import { COUNTRIES } from "./CountryPhoneInput";
import { getCitiesForCountry, fetchCitiesForCountryOnline } from "../lib/formPresets";
import SearchableSelect from "./SearchableSelect";

export function CountrySelect({
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select your country...",
  className = ""
}) {
  const countryOptions = useMemo(() => {
    return COUNTRIES.map(c => ({
      value: c.name,
      label: c.name,
      icon: <span className="text-base leading-none">{c.flag}</span>
    }));
  }, []);

  return (
    <div className={`relative ${className}`}>
      <SearchableSelect
        value={value}
        onChange={(val) => onChange && onChange(val)}
        options={countryOptions}
        placeholder={placeholder}
        searchPlaceholder="Search country..."
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

export function CitySelect({
  value = "",
  onChange,
  country = "",
  required = false,
  disabled = false,
  placeholder = "Select or enter your city...",
  className = ""
}) {
  const [dynamicCities, setDynamicCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);

  // Sync cities when country changes
  useEffect(() => {
    const targetCountry = country || "Algeria";
    const localList = getCitiesForCountry(targetCountry);
    setDynamicCities(localList);

    // Fetch complete catalog online if available
    let isCancelled = false;
    setIsLoadingCities(true);
    fetchCitiesForCountryOnline(targetCountry)
      .then(cities => {
        if (!isCancelled && Array.isArray(cities) && cities.length > 0) {
          setDynamicCities(cities);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoadingCities(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [country]);

  const cityOptions = useMemo(() => {
    const list = dynamicCities.length > 0 ? dynamicCities : getCitiesForCountry(country || "Algeria");
    return list;
  }, [dynamicCities, country]);

  if (cityOptions.length > 0 && !isCustomCity) {
    const fullOptions = [...cityOptions, "Other (Type custom city)"];
    return (
      <div className={`relative ${className}`}>
        <SearchableSelect
          value={value}
          onChange={(val) => {
            if (val === "Other (Type custom city)") {
              setIsCustomCity(true);
              if (onChange) onChange("");
            } else {
              if (onChange) onChange(val);
            }
          }}
          options={fullOptions}
          placeholder={placeholder || (country ? `Select city in ${country}...` : "Select city...")}
          searchPlaceholder={country ? `Search city in ${country}...` : "Search wilaya or city..."}
          required={required}
          disabled={disabled}
        />
        {isLoadingCities && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
            <Loader2 size={12} className="animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Fallback / Custom City typing with datalist suggestions
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        list="cities-datalist"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder || (country ? `e.g. City in ${country}` : "e.g. Algiers, Paris, New York...")}
        required={required}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all shadow-2xs"
      />
      {cityOptions.length > 0 && (
        <datalist id="cities-datalist">
          {cityOptions.map((city, idx) => (
            <option key={idx} value={city} />
          ))}
        </datalist>
      )}
      {isCustomCity && (
        <button
          type="button"
          onClick={() => setIsCustomCity(false)}
          className="mt-1 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
        >
          ← Choose from searchable list
        </button>
      )}
    </div>
  );
}
