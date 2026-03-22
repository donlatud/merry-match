/**
 * Convert minor units (e.g. satang) to major units (e.g. THB).
 */
export function amountFromMinorToMajor(amountMinor, currency) {
  const n = Number(amountMinor);
  if (!Number.isFinite(n)) return 0;
  const currencyUpper = String(currency || "THB").toUpperCase();
  if (currencyUpper === "THB" || currencyUpper === "JPY") return n / 100;
  return n / 100;
}

/**
 * Convert major units (Decimal string like "149.00") into minor units integer (like 14900).
 * Keeps it simple: assumes 2 decimals for now (THB satang).
 */
export function amountFromMajorToMinor(amountMajor, currency) {
  const cur = String(currency || "THB").toUpperCase();
  const raw = String(amountMajor ?? "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const whole = Number.parseInt(match[1], 10);
  const frac = (match[2] || "").padEnd(2, "0");
  const minor = whole * 100 + Number.parseInt(frac || "0", 10);

  if (!Number.isFinite(minor) || minor <= 0) return null;
  if (!cur) return minor;
  return minor;
}

