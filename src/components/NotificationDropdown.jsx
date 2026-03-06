import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/apiClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/providers/supabase.provider";

export default function NotificationDropdown({ variant = "desktop", onClose }) {
  const desktopDropdownRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const DESKTOP_VISIBLE_ITEMS = 6;
  const DESKTOP_ITEM_HEIGHT = 64;

  const limit = useMemo(() => 50, []);

  const isPremium = Boolean(
    me?.subscription?.status === "ACTIVE" && me?.subscription?.package
  );

  useEffect(() => {
    apiClient.get("/me").then((res) => setMe(res.data ?? null)).catch(() => setMe(null));
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/notifications", {
        params: { limit },
      });
      const next = Array.isArray(res.data?.items) ? res.data.items : [];
      setItems(next);
    } catch (error) {
      console.error("fetchNotifications error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (variant !== "desktop") return;
    if (!desktopDropdownRef.current) return;

    desktopDropdownRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: "ease-out",
      fill: "both",
    });
  }, [variant]);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const formatTimeAgo = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSeconds < 10) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  };

  const getNotificationMessage = ({ name, type, messageCount = 0 }) => {
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
        headline: `‘${name}’ sent ${messageLabel}`,
        description: descriptionLabel,
      };
    }

    if (type === "matched") {
      return {
        headline: `‘${name}’ Merry you back!`,
        description: "Let's start conversation now",
      };
    }

    // liked: แสดงชื่อ + "Just Merry you!" เฉพาะ user ที่มี package premium (จาก UserSubscription)
    if (isPremium) {
      return {
        headline: `‘${name}’ Just Merry you!`,
        description: "Click here to see profile",
      };
    }
    return {
      headline: "Someone Just Merry you!",
      description: (
        <>
          Upgrade to <span className="font-bold text-utility-red">Premium</span> to see their profile
        </>
      ),
    };
  };

  const handleNotificationClick = useCallback((item) => {
    onClose?.();
    if (item?.id != null) {
      apiClient.patch("/notifications", { id: item.id }).catch(() => {});
    }
  }, [onClose]);

  const renderNotificationItem = ({
    id,
    name,
    type,
    messageCount,
    profileImageUrl,
    time,
    href,
    read_at,
    meta,
    compact = false,
  }) => {
    const { headline, description } = getNotificationMessage({
      name,
      type,
      messageCount,
    });
    const heartCount = type === "liked" ? 1 : type === "matched" ? 2 : 0;
    const isUnread = read_at == null;
    const shouldBlurAvatar = type === "liked" && !isPremium;

    return (
      <Link
        key={id}
        href={href || "/notifications"}
        className={`flex items-start gap-3 text-gray-700 transition-colors hover:bg-purple-100 cursor-pointer px-[14px] py-3 rounded-[8px] ${isUnread ? "bg-red-100/50" : ""}`}
        onClick={() => {
          handleNotificationClick({ id, type, meta });
        }}
      >
        <div className="relative shrink-0 size-8 rounded-full bg-gray-100">
          <div className={shouldBlurAvatar ? "size-8 overflow-hidden rounded-full" : ""}>
            <Avatar size="xl" className={`size-8 ${shouldBlurAvatar ? "blur-sm" : ""}`}>
              <AvatarImage
                src={profileImageUrl || ""}
                alt={name || "Profile"}
                className="size-full object-cover object-[50%_30%] scale-140"
              />
              <AvatarFallback className="bg-gray-200 text-body4 text-gray-700">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute -bottom-1 -right-[6.5px] flex items-center -space-x-[8px] rounded-full bg-transparent px-1 py-[2px]">
            {Array.from({ length: heartCount }).map((_, index) => (
              <span
                key={`${id}-heart-${index}`}
                className="text-[8px] leading-none text-red-400"
              >
                <HeartIcon className="h-[11px] w-[14px] fill-red-400 stroke-utility-white stroke-[2px]" />
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 relative">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-body4 ${isUnread ? "font-semibold text-purple-800" : "text-gray-700"}`}>
              {isUnread && <span className="inline-block size-[6.4px] rounded-full bg-purple-500 mr-1 mb-[2px] align-middle" aria-hidden />}
              {headline}
              {compact && <span className="text-tagline text-gray-500 ml-1">{time}</span>}
            </p>
            {!compact && (
              <span className="shrink-0 text-tagline text-gray-500">{time}</span>
            )}
          </div>
          <p className="text-body4 text-gray-700">{description}</p>
        </div>
      </Link>
    );
  };

  const renderedItems = items.map((item) => ({
    ...item,
    time: formatTimeAgo(item.createdAt),
  }));

  if (variant === "mobile") {
    return (
      <div className="fixed right-0 top-13 -z-1 flex w-screen h-screen flex-col items-center rounded-[4px] bg-utility-white shadow-[4px_4px_16px_0px_#00000014]">
        <div className="flex h-full w-[375px] min-h-0 flex-col gap-4 px-4 py-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="px-[14px] py-3 text-body4 text-gray-500">Loading…</div>
            ) : renderedItems.length === 0 ? (
              <div className="px-[14px] py-3 text-body4 text-gray-500">
                No notifications yet.
              </div>
            ) : (
              renderedItems.map((item) => renderNotificationItem(item))
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
        style={{ maxHeight: `${DESKTOP_VISIBLE_ITEMS * DESKTOP_ITEM_HEIGHT}px` }}
      >
        {loading ? (
          <div className="px-[14px] py-3 text-body4 text-gray-500">Loading…</div>
        ) : renderedItems.length === 0 ? (
          <div className="px-[14px] py-3 text-body4 text-gray-500">
            No notifications yet.
          </div>
        ) : (
          renderedItems.map((item) =>
            renderNotificationItem({ ...item, compact: true })
          )
        )}
      </div>
    </div>
  );
}
