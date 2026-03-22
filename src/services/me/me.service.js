import { meRepository } from "@/repositories/me/me.repository";

/**
 * Map subscription + package + details to response shape.
 * Returns null if no subscription; otherwise { status, end_date, package }.
 */
function mapSubscription(sub) {
  if (!sub) return null;
  return {
    status: sub.status,
    end_date: sub.end_date,
    package: sub.package
      ? {
          id: sub.package.id,
          name: sub.package.name,
          price: sub.package.price?.toString?.() ?? sub.package.price,
          limit_matching: sub.package.limit_matching,
          icon_url: sub.package.icon_url,
          currency: sub.package.currency,
          billing_interval: sub.package.billing_interval,
          features: sub.package.features,
          details: sub.package.details ?? [],
        }
      : null,
  };
}

export const meService = {
  /**
   * คืนข้อมูล current user: profile + subscription (พร้อม package และ details)
   */
  async getCurrentUser(userId) {
    const profileRow = await meRepository.findProfileWithSubscription(userId);

    if (!profileRow) {
      return { profile: null, subscription: null };
    }

    const { subscription: sub, ...profile } = profileRow;
    const subscription = mapSubscription(sub);

    return { profile, subscription };
  },

  /**
   * คืน id + profile_image_url สำหรับ GET /api/me/profile-image
   */
  async getProfileImage(userId) {
    const profile = await meRepository.findProfileIdAndFirstImage(userId);
    return {
      id: profile?.id ?? null,
      profile_image_url: profile?.images?.[0]?.image_url ?? null,
    };
  },
};
