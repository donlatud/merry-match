/**
 * Helper สำหรับข้อความแสดงใน notification (headline + description)
 */
export function getNotificationMessage({
  name,
  type,
  messageCount = 0,
  isPremiumMembership,
}) {
  if (type === "message") {
    const normalizedCount = Number(messageCount) || 0;
    const messageLabel =
      normalizedCount === 1
        ? "a new message"
        : `${normalizedCount} new messages`;
    const descriptionLabel =
      normalizedCount === 1
        ? "Click here to see message"
        : "Click here to see messages";

    return {
      headline: `'${name}' sent ${messageLabel}`,
      description: descriptionLabel,
    };
  }

  if (type === "matched") {
    return {
      headline: `'${name}' Merry you back!`,
      description: "Let's start conversation now",
    };
  }

  if (isPremiumMembership) {
    return {
      headline: `'${name}' Just Merry you!`,
      description: "Click here to see profile",
    };
  }

  return {
    headline: "Someone Just Merry you!",
    description: (
      <>
        Upgrade to <span className="font-bold text-utility-red">Premium</span>{" "}
        to see their profile
      </>
    ),
  };
}

export function getInitials(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
