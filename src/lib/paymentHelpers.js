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

const DEFAULT_LIMIT_TEXT = "“Merry” more than a daily limited";

/**
 * Maps `/api/package` response item into UI model for `MerryPackageCard`.
 * @param {any} pkg
 * ใช้ icon_url จาก API (เหมือน MembershipContent) แทน icon variant
 * @returns {{ id: number; name: string; price: string; limitText: string; features: string[]; iconUrl: string | null }}
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
    iconUrl: pkg?.icon_url ?? null,
  };
}

