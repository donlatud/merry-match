export function hasActiveMembership(subscription) {
  return Boolean(subscription?.status === "ACTIVE" && subscription?.package);
}

export function isPremiumMembership(subscription) {
  return Boolean(
    hasActiveMembership(subscription) &&
      String(subscription?.package?.name ?? "").toLowerCase() === "premium",
  );
}
