export function parseFeaturesParam(featuresParam, fallbackFeatures) {
  if (featuresParam && typeof featuresParam === "string") {
    try {
      const parsed = JSON.parse(featuresParam);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // keep fallback
    }
  }
  return fallbackFeatures;
}

/**
 * @param {string} packageName
 * @returns {"basic" | "platinum" | "premium"}
 */
export function getIconVariant(packageName) {
  const nameLower = String(packageName || "").toLowerCase();
  if (nameLower === "platinum") return "platinum";
  if (nameLower === "premium") return "premium";
  return "basic";
}

const DEFAULT_LIMIT_TEXT = "“Merry” more than a daily limited";

/**
 * Maps `/api/package` response item into UI model for `MerryPackageCard`.
 * @param {any} pkg
 * @returns {{ id: number; name: string; price: string; limitText: string; features: string[]; iconVariant: "basic" | "platinum" | "premium" }}
 */
export function mapPackageFromApi(pkg) {
  const priceStr =
    typeof pkg?.price === "number" ? pkg.price.toFixed(2) : String(pkg?.price ?? "");
  const featuresArr = Array.isArray(pkg?.features) ? pkg.features : [];
  const detailsArr = Array.isArray(pkg?.details) ? pkg.details : [];

  const limitText = featuresArr[0] ?? detailsArr[0]?.value ?? DEFAULT_LIMIT_TEXT;
  const features =
    featuresArr.length > 1
      ? featuresArr.slice(1)
      : detailsArr
          .slice(1)
          .map((d) => d?.value)
          .filter(Boolean);

  return {
    id: pkg?.id,
    name: pkg?.name,
    price: priceStr,
    limitText,
    features,
    iconVariant: getIconVariant(pkg?.name),
  };
}

