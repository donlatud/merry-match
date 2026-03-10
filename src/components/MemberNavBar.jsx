import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import MemberNavDropdown from "@/components/MemberNavDropdown";
import NotificationDropdown from "@/components/NotificationDropdown";
import { useAuth } from "@/hooks/login/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/providers/supabase.provider";

export default function MemberNavBar({ onLogout }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [myProfileId, setMyProfileId] = useState(null);
  const [me, setMe] = useState(null);
  const [membershipResolved, setMembershipResolved] = useState(false);
  const mobileNotifRef = useRef(null);
  const desktopNotifRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hasActiveMembership = Boolean(
    me?.subscription?.status === "ACTIVE" && me?.subscription?.package,
  );
  const isPremiumMembership = Boolean(
    hasActiveMembership &&
    String(me?.subscription?.package?.name ?? "").toLowerCase() === "premium",
  );
  const membershipHref = hasActiveMembership ? "/membership" : "/payment";

  // Badge ring: ใช้ seen_at — โชว์ ring เมื่อมี noti ที่ read_at null และ (seen_at null หรือ created_at > seen_at)
  const fetchUnreadForBadge = useCallback(() => {
    apiClient
      .get("/notifications", { params: { limit: 10 } })
      .then((res) => {
        const items = res.data?.items || [];
        const hasUnread = items.some((item) => {
          if (item.read_at != null) return false;
          const createdAt = item.createdAt
            ? new Date(item.createdAt).getTime()
            : 0;
          const seenAt = item.seen_at ? new Date(item.seen_at).getTime() : null;
          return seenAt == null || createdAt > seenAt;
        });
        setHasUnreadNotifications(hasUnread);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadForBadge();
  }, [user?.id, fetchUnreadForBadge]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchUnreadForBadge();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadForBadge]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfileImage = async () => {
      if (!user?.id) {
        setProfileImageUrl(null);
        return;
      }

      try {
        const response = await apiClient.get("/me/profile-image", {
          signal: controller.signal,
        });
        setProfileImageUrl(response.data.profile_image_url ?? null);
        setMyProfileId(response.data.id ?? null);
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("fetchProfileImage error:", error);
          setProfileImageUrl(null);
          setMyProfileId(null);
        }
      }
    };

    fetchProfileImage();

    return () => {
      controller.abort();
    };
  }, [user?.id]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMembership = async () => {
      if (!user?.id) {
        setMe(null);
        setMembershipResolved(false);
        return;
      }

      try {
        const response = await apiClient.get("/me", {
          signal: controller.signal,
        });
        setMe(response.data ?? null);
      } catch (error) {
        if (error.name !== "CanceledError") {
          setMe(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setMembershipResolved(true);
        }
      }
    };

    fetchMembership();

    return () => {
      controller.abort();
    };
  }, [user?.id]);

  const userInitials = (user?.username || "MM").slice(0, 2).toUpperCase();
  const showNotifRing = hasUnreadNotifications && !notifOpen;

  const markNotificationsSeen = useCallback(() => {
    apiClient.patch("/notifications", { action: "seen" }).catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsideNotif =
        (mobileNotifRef.current &&
          mobileNotifRef.current.contains(event.target)) ||
        (desktopNotifRef.current &&
          desktopNotifRef.current.contains(event.target));

      if (!clickedInsideNotif) {
        if (notifOpen) markNotificationsSeen();
        setNotifOpen(false);
      }

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen, markNotificationsSeen]);

  // Close mobile menu when clicking outside (handled by backdrop now)

  return (
    <>
      {/* Mobile: Chat + Notification + Hamburger */}
      <div className="flex items-center gap-5 lg:hidden">
        <div className="flex items-center gap-3">
          {/* TODO: link to chat — ใส่ตรงนี้ */}
          <Link
            // แทนที่จะเป็น /chat เฉยๆ ให้แก้เป็นแบบนี้:
            href="/matchingpage?showChat=true"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-100 cursor-pointer"
            aria-label="Chat"
          >
            <img
              src="/merry_icon/icon-chat.svg"
              alt=""
              className="w-3.5 h-3.5"
            />
          </Link>

          {/* TODO: link to notifications — ใส่ตรงนี้ */}
          <div className="relative w-7 h-7" ref={mobileNotifRef}>
            {showNotifRing && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-purple-300 ring-offset-2 ring-offset-red-300 pointer-events-none"
                aria-hidden
                animate={{
                  scale: [1, 0.9, 1],
                  opacity: [0.2, 1, 0.2],
                }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => {
                  if (!prev) {
                    setHasUnreadNotifications(false);
                    markNotificationsSeen();
                  } else {
                    markNotificationsSeen();
                  }
                  return !prev;
                });
              }}
              className={`flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-100 cursor-pointer ${showNotifRing ? "relative z-10" : ""}`}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <img
                src="/merry_icon/icon-notification.svg"
                alt=""
                className="w-[14px] h-[14px]"
              />
            </button>
            {showNotifRing && (
              <span
                className="absolute -top-[1px] right-0 size-[7px] rounded-full bg-red-500 z-10"
                aria-hidden
              />
            )}

            {notifOpen && (
              <NotificationDropdown
                variant="mobile"
                onClose={() => {
                  markNotificationsSeen();
                  setNotifOpen(false);
                }}
              />
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="relative" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col justify-between w-5 h-4 cursor-pointer"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
            <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
            <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
          </button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <MemberNavDropdown
              variant="mobile"
              onClose={() => setMobileMenuOpen(false)}
              onLogout={onLogout}
              hasActiveMembership={hasActiveMembership}
              isPremiumMembership={isPremiumMembership}
              membershipResolved={membershipResolved}
            />
          )}
        </div>
      </div>

      {/* Desktop: Start Matching + Membership + Notification + Profile */}
      <div className="hidden lg:flex items-center gap-11">
        <Link
          href="/matchingpage"
          className="text-body2 text-purple-800 font-bold hover:underline cursor-pointer"
        >
          Start Matching!
        </Link>
        <Link
          href={membershipHref}
          className="text-body2 text-purple-800 font-bold hover:underline cursor-pointer"
        >
          Merry Membership
        </Link>
        <div className="flex items-center gap-3">
          {/* TODO: Notifications dropdown — ใส่ตรงนี้ */}
          <div className="relative" ref={desktopNotifRef}>
            {showNotifRing && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-purple-300 ring-offset-2 ring-offset-red-300 pointer-events-none"
                aria-hidden
                animate={{
                  scale: [1, 0.9, 1],
                  opacity: [0.2, 1, 0.2],
                }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => {
                  if (!prev) {
                    setHasUnreadNotifications(false);
                    markNotificationsSeen();
                  } else {
                    markNotificationsSeen();
                  }
                  return !prev;
                });
              }}
              className={`flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 transition-opacity hover:bg-purple-100 cursor-pointer ${showNotifRing ? "relative z-10" : ""}`}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <img
                src="/merry_icon/icon-notification.svg"
                alt=""
                className="w-5 h-5"
              />
            </button>
            {showNotifRing && (
              <span
                className="absolute top-0 right-0 size-[10px] rounded-full bg-red-500 z-10"
                aria-hidden
              />
            )}

            {notifOpen && (
              <NotificationDropdown
                variant="desktop"
                onClose={() => {
                  markNotificationsSeen();
                  setNotifOpen(false);
                }}
              />
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-gray-100 cursor-pointer"
              aria-label="Profile"
              aria-expanded={profileOpen}
            >
              <Avatar size="xl" className="size-16">
                <AvatarImage
                  src={profileImageUrl || ""}
                  alt="Profile"
                  className="transition duration-300 ease-out group-hover/avatar:grayscale"
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <MemberNavDropdown
                variant="desktop"
                onClose={() => setProfileOpen(false)}
                onLogout={onLogout}
                hasActiveMembership={hasActiveMembership}
                isPremiumMembership={isPremiumMembership}
                membershipResolved={membershipResolved}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
