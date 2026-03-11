import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { useNotificationFeed } from "@/hooks/notifications/useNotificationFeed";
import { formatTimeAgo } from "@/lib/timeHelpers";
import { getNotificationMessage } from "@/lib/notificationHelpers";
import { NotificationItem } from "@/components/notifications/NotificationItem";

export default function NotificationDropdown({
  variant = "desktop",
  onClose,
  onOpenProfilePopup,
}) {
  const router = useRouter();
  const desktopDropdownRef = useRef(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const DESKTOP_VISIBLE_ITEMS = 6;
  const DESKTOP_ITEM_HEIGHT = 64;
  const { items, loading, isPremiumMembership } = useNotificationFeed(50);

  useEffect(() => {
    if (variant !== "desktop") return;
    if (!desktopDropdownRef.current) return;

    desktopDropdownRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: "ease-out",
      fill: "both",
    });
  }, [variant]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const handleNotificationClick = useCallback(
    async (e, item) => {
      const isPremiumLiked =
        item?.type === "liked" &&
        isPremiumMembership &&
        item?.meta?.requesterProfileId;

      if (isPremiumLiked) {
        e?.preventDefault?.();
        if (item?.id != null) {
          apiClient.patch("/notifications", { id: item.id }).catch(() => {});
        }
        onOpenProfilePopup?.(item.meta.requesterProfileId);
        onClose?.();
        return;
      }

      const isMatched =
        item?.type === "matched" && item?.meta?.requesterProfileId;
      if (isMatched) {
        e?.preventDefault?.();
        onClose?.();
        if (item?.id != null) {
          apiClient.patch("/notifications", { id: item.id }).catch(() => {});
        }
        try {
          const res = await apiClient.post("/chat/rooms", {
            partnerId: item.meta.requesterProfileId,
          });
          const roomId = res.data?.data?.id;
          if (roomId) {
            router.push(`/chat/${roomId}`);
          } else {
            router.push("/chat");
          }
        } catch {
          router.push("/chat");
        }
        return;
      }
      onClose?.();
      if (item?.type === "message" && item?.meta?.roomId) {
        apiClient
          .patch("/notifications", { roomId: item.meta.roomId })
          .catch(() => {});
      } else if (item?.id != null) {
        apiClient.patch("/notifications", { id: item.id }).catch(() => {});
      }
    },
    [isPremiumMembership, onClose, onOpenProfilePopup, router],
  );

  const renderedItems = items.map((item) => ({
    ...item,
    time: formatTimeAgo(item.createdAt, currentTimeMs),
  }));

  const renderRow = (item, compact = false) => {
    const { headline, description } = getNotificationMessage({
      name: item.name,
      type: item.type,
      messageCount: item.messageCount,
      isPremiumMembership,
    });
    const heartCount =
      item.type === "liked" ? 1 : item.type === "matched" ? 2 : 0;
    const isUnread = item.read_at == null;
    const shouldBlurAvatar = item.type === "liked" && !isPremiumMembership;
    const resolvedHref =
      item.type === "liked" && !isPremiumMembership
        ? "/payment"
        : item.href || "/notifications";

    return (
      <NotificationItem
        key={item.id}
        id={item.id}
        headline={headline}
        description={description}
        profileImageUrl={item.profileImageUrl}
        name={item.name}
        time={item.time}
        resolvedHref={resolvedHref}
        isUnread={isUnread}
        heartCount={heartCount}
        shouldBlurAvatar={shouldBlurAvatar}
        compact={compact}
        onClick={(e) => handleNotificationClick(e, { id: item.id, type: item.type, meta: item.meta })}
      />
    );
  };

  if (variant === "mobile") {
    return (
      <div className="fixed right-0 top-13 -z-1 flex w-screen h-screen flex-col items-center rounded-[4px] bg-utility-white shadow-[4px_4px_16px_0px_#00000014]">
        <div className="flex h-full w-[375px] min-h-0 flex-col gap-4 px-4 py-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="px-[14px] py-3 text-body4 text-gray-500">
                Loading…
              </div>
            ) : renderedItems.length === 0 ? (
              <div className="px-[14px] py-3 text-body4 text-gray-500">
                No notifications yet.
              </div>
            ) : (
              renderedItems.map((item) => renderRow(item))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={desktopDropdownRef}
      className="absolute right-0 top-full z-50 mt-2 py-2 gap-2 flex flex-col w-[251px] rounded-[16px] bg-utility-white shadow-button overflow-hidden"
    >
      <div
        className="flex flex-col overflow-y-auto"
        style={{
          maxHeight: `${DESKTOP_VISIBLE_ITEMS * DESKTOP_ITEM_HEIGHT}px`,
        }}
      >
        {loading ? (
          <div className="px-[14px] py-3 text-body4 text-gray-500">
            Loading…
          </div>
        ) : renderedItems.length === 0 ? (
          <div className="px-[14px] py-3 text-body4 text-gray-500">
            No notifications yet.
          </div>
        ) : (
          renderedItems.map((item) => renderRow(item, true))
        )}
      </div>
    </div>
  );
}
