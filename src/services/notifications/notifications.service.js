import { notificationRepository } from "@/repositories/notifications/notification.repository";

/**
 * จำกัดค่า query param limit ให้ปลอดภัย (1–50)
 */
function parseLimit(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, n));
}

/**
 * Map notification row + relations → shape ที่ UI (NotificationDropdown) ใช้
 */
function notificationToItem(n) {
  const typeLower = n.type?.toLowerCase() ?? "liked";
  let href = "/notifications";
  if (n.type === "MESSAGE" && n.room_id) {
    href = `/chat/${n.room_id}`;
  } else if (n.type === "MATCHED") {
    href = "/chat";
  } else if (n.actor_id) {
    href = `/profile/${n.actor_id}`;
  }

  return {
    id: n.id,
    type: typeLower,
    name: n.actor?.full_name || "Someone",
    messageCount:
      n.type === "MESSAGE"
        ? n.data && typeof n.data === "object" && "messageCount" in n.data
          ? n.data.messageCount
          : 1
        : undefined,
    profileImageUrl: n.actor?.images?.[0]?.image_url ?? null,
    createdAt: n.created_at,
    read_at: n.read_at ?? null,
    seen_at: n.seen_at ?? null,
    href,
    meta: {
      swipeId: n.swipe_id ?? null,
      requesterProfileId: n.actor_id ?? null,
      roomId: n.room_id ?? null,
    },
  };
}

export const notificationsService = {
  /**
   * GET — รายการ noti ของ user
   */
  async getItems(userId, query = {}) {
    const limit = parseLimit(query?.limit, 4);
    const profileId =
      await notificationRepository.findProfileIdByUserId(userId);

    if (!profileId) {
      return { items: [] };
    }

    const rows = await notificationRepository.findManyByRecipientId(
      profileId,
      limit,
    );
    const items = rows
      .map(notificationToItem)
      .filter(
        (item) => !(item.type === "message" && (item.messageCount ?? 0) === 0),
      );
    return { items };
  },

  /**
   * PATCH — mark seen / read
   * body: { action: "seen" | "read-all" } | { id } | { roomId }
   */
  async patch(userId, body) {
    const profileId =
      await notificationRepository.findProfileIdByUserId(userId);
    if (!profileId) {
      return { ok: true };
    }

    let parsed = {};
    try {
      parsed = typeof body === "string" ? JSON.parse(body) : body || {};
    } catch {
      return { error: "Invalid JSON body", status: 400 };
    }

    const now = new Date();

    if (parsed.action === "seen") {
      await notificationRepository.updateSeenByRecipientId(profileId, now);
      return { ok: true };
    }
    if (parsed.action === "read-all") {
      await notificationRepository.updateReadAllByRecipientId(profileId, now);
      return { ok: true };
    }

    const notiId = parsed.id != null ? Number(parsed.id) : NaN;
    if (Number.isFinite(notiId)) {
      await notificationRepository.updateReadById(profileId, notiId, now);
      return { ok: true };
    }

    if (parsed.roomId && typeof parsed.roomId === "string") {
      await notificationRepository.updateReadByRoomId(
        profileId,
        parsed.roomId,
        now,
      );
      return { ok: true };
    }

    return { error: "Missing action, id, roomId in body", status: 400 };
  },
};
