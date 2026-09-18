/**
 * Convert numeric monetary amounts to French spelled-out words
 * Compliant with Algerian invoicing regulations:
 * "ARRÊTÉ À LA SOMME DE : [Montant en lettres] dinars algériens [et ... centimes]"
 */

const UNITS = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"
];

const TENS = [
  "", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"
];

function convertLessThanThousand(n) {
  let res = "";

  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    n %= 100;
    if (hundreds === 1) {
      res += "cent";
    } else {
      res += UNITS[hundreds] + " cent";
      if (n === 0) res += "s";
    }
    if (n > 0) res += " ";
  }

  if (n >= 20) {
    const tens = Math.floor(n / 10);
    const units = n % 10;

    if (tens === 7 || tens === 9) {
      const baseTen = tens === 7 ? "soixante" : "quatre-vingt";
      if (tens === 7 && units === 1) {
        res += `${baseTen} et onze`;
      } else {
        res += `${baseTen}-${UNITS[10 + units]}`;
      }
    } else {
      const baseTen = TENS[tens];
      if (units === 1) {
        res += tens === 8 ? `${baseTen}-un` : `${baseTen} et un`;
      } else if (units > 1) {
        res += `${baseTen}-${UNITS[units]}`;
      } else {
        res += tens === 8 ? `${baseTen}s` : baseTen;
      }
    }
  } else if (n > 0) {
    res += UNITS[n];
  }

  return res.trim();
}

/**
 * Converts a positive integer to French words
 */
export function integerToFrenchWords(num) {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "zéro";

  const billions = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  const parts = [];

  if (billions > 0) {
    if (billions === 1) {
      parts.push("un milliard");
    } else {
      parts.push(`${convertLessThanThousand(billions)} milliards`);
    }
  }

  if (millions > 0) {
    if (millions === 1) {
      parts.push("un million");
    } else {
      parts.push(`${convertLessThanThousand(millions)} millions`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push("mille");
    } else {
      parts.push(`${convertLessThanThousand(thousands)} mille`);
    }
  }

  if (remainder > 0) {
    parts.push(convertLessThanThousand(remainder));
  }

  return parts.join(" ");
}

/**
 * Convert total amount to full Algerian legal phrasing
 * e.g. 42840 -> "quarante-deux mille huit cent quarante dinars algériens"
 */
export function numberToAlgerianWords(amount = 0, currency = "DZD") {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const dinars = Math.floor(numericAmount);
  const centimes = Math.round((numericAmount - dinars) * 100);

  const dinarsInWords = integerToFrenchWords(dinars);

  let currencyUnit = "dinars algériens";
  if (currency === "EUR") currencyUnit = dinars <= 1 ? "euro" : "euros";
  else if (currency === "USD") currencyUnit = dinars <= 1 ? "dollar" : "dollars";
  else if (dinars <= 1 && dinars > 0) currencyUnit = "dinar algérien";

  let result = `${dinarsInWords} ${currencyUnit}`;

  if (centimes > 0) {
    const centimesInWords = integerToFrenchWords(centimes);
    const centUnit = currency === "DZD" ? "centimes" : (currency === "EUR" ? "centimes" : "cents");
    result += ` et ${centimesInWords} ${centUnit}`;
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}
