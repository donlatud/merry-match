import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import MemberNavDropdown from "@/components/MemberNavDropdown";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { ButtonMerry, ButtonPass } from "@/components/commons/button/IconButton";
import { ProfilePopup } from "@/components/profilePopup/ProfilePopup";
import MerryMatchModal from "@/components/matching/MerryMatchModal";
import { useNotificationBadge } from "@/hooks/notifications/useNotificationBadge";
import { useNotificationProfilePopup } from "@/hooks/notifications/useNotificationProfilePopup";
import { useAuth } from "@/hooks/login/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/apiClient";
import {
  hasActiveMembership,
  isPremiumMembership as isPremiumMembershipForSubscription,
} from "@/lib/membershipHelpers";

export default function MemberNavBar({ onLogout }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [me, setMe] = useState(null);
  const [membershipResolved, setMembershipResolved] = useState(false);
  const [matchModalOpenFromNotif, setMatchModalOpenFromNotif] = useState(false);
  const [matchedProfileIdFromNotif, setMatchedProfileIdFromNotif] =
    useState(null);
  const [matchedProfileFromNotif, setMatchedProfileFromNotif] = useState(null);
  const mobileNotifRef = useRef(null);
  const desktopNotifRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [matchingPopupId, setMatchingPopupId] = useState(null);
  const [matchingSwipeSubmitting, setMatchingSwipeSubmitting] = useState(false);

  const {
    hasUnread: hasUnreadNotifications,
    refresh: fetchUnreadForBadge,
    markSeen: markNotificationsSeen,
  } = useNotificationBadge({ userId: user?.id });

  const hasActiveMembershipState = hasActiveMembership(me?.subscription);
  const isPremiumMembership = isPremiumMembershipForSubscription(
    me?.subscription,
  );
  const membershipHref = hasActiveMembershipState ? "/membership" : "/payment";

  useEffect(() => {
    const controller = new AbortController();
    const fetchProfileImage = async () => {
      if (!user?.id) {
        setProfileImageUrl(null);
        return;
      }
      try {ss
        const response = await apiClient.get("/me/profile-image", {
          signal: controller.signal,
        });
        setProfileImageUrl(response.data.profile_image_url ?? null);
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("fetchProfileImage error:", error);
          setProfileImageUrl(null);
        }
      }
    };
    fetchProfileImage();
    return () => controller.abort();
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
        if (error.name !== "CanceledError") setMe(null);
      } finally {
        if (!controller.signal.aborted) setMembershipResolved(true);
      }
    };
    fetchMembership();
    return () => controller.abort();
  }, [user?.id]);

  const userInitials = (user?.username || "MM").slice(0, 2).toUpperCase();
  const showNotifRing = hasUnreadNotifications && !notifOpen;

  const {
    selectedProfileId: selectedNotificationProfileId,
    popupOpen: notificationProfilePopupOpen,
    closePopup: closeNotificationProfilePopup,
    openPopup: openNotificationProfilePopup,
    merrySubmitting,
    hasMatchedWithSelected,
    checkingMatched,
    handleMerry: handleNotificationPopupMerry,
  } = useNotificationProfilePopup({
    onPopupOpened: () => {
      markNotificationsSeen();
      setNotifOpen(false);
    },
    onRefresh: fetchUnreadForBadge,
    onMatch: (profileId) => {
      setMatchedProfileIdFromNotif(profileId);
      setMatchModalOpenFromNotif(true);
    },
  });

  const notificationPopupRightButton =
    checkingMatched || hasMatchedWithSelected ? (
      <></>
    ) : (
      <ButtonMerry
        key={`merry-${selectedNotificationProfileId ?? "notification"}`}
        onClick={handleNotificationPopupMerry}
        disabled={merrySubmitting}
        className="w-20 h-20 disabled:opacity-40 disabled:cursor-not-allowed [&_img]:w-12 [&_img]:h-12"
      />
    );

  useEffect(() => {
    if (!matchModalOpenFromNotif || !matchedProfileIdFromNotif) {
      setMatchedProfileFromNotif(null);
      return;
    }
    const controller = new AbortController();
    apiClient
      .get(`/profile/${matchedProfileIdFromNotif}`, {
        signal: controller.signal,
      })
      .then((res) => {
        const d = res.data;
        setMatchedProfileFromNotif({
          id: d?.id,
          name: d?.name ?? "Someone",
          image: Array.isArray(d?.images) ? (d.images[0] ?? null) : null,
        });
      })
      .catch((err) => {
        if (err.name !== "CanceledError")
          setMatchedProfileFromNotif({
            id: matchedProfileIdFromNotif,
            name: "Someone",
            image: null,
          });
      });
    return () => controller.abort();
  }, [matchModalOpenFromNotif, matchedProfileIdFromNotif]);

  const closeMatchModalFromNotif = useCallback(() => {
    setMatchModalOpenFromNotif(false);
    setMatchedProfileIdFromNotif(null);
    setMatchedProfileFromNotif(null);
  }, []);

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
      )
        setProfileOpen(false);
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      )
        setMobileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, markNotificationsSeen]);

  // ✅ เปิด chat overlay บน path ปัจจุบัน — ไม่ hardcode ไป matchingpage
  const handleChatClick = () => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, showChat: "true" },
      },
      undefined,
      { shallow: true },
    );
  };

  // ✅ ปิด chat overlay กลับ path ปัจจุบัน — ลบแค่ showChat ออก
  const handleChatClose = () => {
    const { showChat, ...restQuery } = router.query;
    router.push({ pathname: router.pathname, query: restQuery }, undefined, {
      shallow: true,
    });
  };

  const isChatOpen = router.query.showChat === "true";

  useEffect(() => {
    const handler = (e) => setMatchingPopupId(e.detail.profileId);
    window.addEventListener("matching:viewProfile", handler);
    return () => window.removeEventListener("matching:viewProfile", handler);
  }, []);

  const handleMatchingSwipe = useCallback(
    (direction) => {
      if (!matchingPopupId) return;
      setMatchingSwipeSubmitting(true);
      window.dispatchEvent(
        new CustomEvent("matching:swipe", {
          detail: { direction, profileId: matchingPopupId },
        }),
      );
      setMatchingPopupId(null);
      setMatchingSwipeSubmitting(false);
    },
    [matchingPopupId],
  );

  const matchingPopupLeftButton = (
    <ButtonPass
      onClick={() => handleMatchingSwipe("left")}
      disabled={matchingSwipeSubmitting}
      className="w-15 h-15 [&_img]:w-10 [&_img]:h-10 shadow-button"
    />
  );
  const matchingPopupRightButton = (
    <ButtonMerry
      onClick={() => handleMatchingSwipe("right")}
      disabled={matchingSwipeSubmitting}
      className="w-15 h-15 [&_img]:w-12 [&_img]:h-10 shadow-button"
    />
  );

  return (
    <>
      <ProfilePopup
        open={notificationProfilePopupOpen}
        onClose={closeNotificationProfilePopup}
        id={selectedNotificationProfileId}
        leftButton={<></>}
        rightButton={notificationPopupRightButton}
      />
      <MerryMatchModal
        open={matchModalOpenFromNotif}
        onClose={closeMatchModalFromNotif}
        matchedProfile={matchedProfileFromNotif}
      />
      <ProfilePopup
        open={!!matchingPopupId}
        onClose={() => setMatchingPopupId(null)}
        id={matchingPopupId}
        leftButton={matchingPopupLeftButton}
        rightButton={matchingPopupRightButton}
      />

      {/* Mobile Chat Overlay — render ที่นี่เพื่อให้ทำงานได้ทุกหน้า */}
      {isChatOpen && (
        <div className="fixed inset-0 z-150 bg-white lg:hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <h2 className="text-body2 font-bold text-gray-900">
              Matches & Chats
            </h2>
            <button
              onClick={handleChatClose}
              className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <img
                src="/merry_icon/icon-close.svg"
                alt="Close"
                className="w-6 h-6"
              />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* LeftSidebar จาก context — ไม่ fetch ใหม่ */}
            <ChatOverlaySidebar />
          </div>
        </div>
      )}

      {/* Mobile */}
      <div className="flex items-center gap-5 lg:hidden">
        <div className="flex items-center gap-3">
          {/* ✅ ใช้ button + handleChatClick */}
          <button
            type="button"
            onClick={handleChatClick}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-100 cursor-pointer"
            aria-label="Chat"
          >
            <img
              src="/merry_icon/icon-chat.svg"
              alt=""
              className="w-3.5 h-3.5"
            />
          </button>

          <div className="relative w-7 h-7" ref={mobileNotifRef}>
            {showNotifRing && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-purple-300 ring-offset-2 ring-offset-red-300 pointer-events-none"
                aria-hidden
                animate={{ scale: [1, 0.9, 1], opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => {
                  markNotificationsSeen();
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
                className="absolute -top-px right-0 size-[7px] rounded-full bg-red-500 z-10"
                aria-hidden
              />
            )}
            {notifOpen && (
              <NotificationDropdown
                variant="mobile"
                onOpenProfilePopup={openNotificationProfilePopup}
                onClose={() => {
                  markNotificationsSeen();
                  setNotifOpen(false);
                }}
              />
            )}
          </div>
        </div>

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
          {mobileMenuOpen && (
            <MemberNavDropdown
              variant="mobile"
              onClose={() => setMobileMenuOpen(false)}
              onLogout={onLogout}
              hasActiveMembership={hasActiveMembershipState}
              isPremiumMembership={isPremiumMembership}
              membershipResolved={membershipResolved}
            />
          )}
        </div>
      </div>

      {/* Desktop */}
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
          <div className="relative" ref={desktopNotifRef}>
            {showNotifRing && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-purple-300 ring-offset-2 ring-offset-red-300 pointer-events-none"
                aria-hidden
                animate={{ scale: [1, 0.9, 1], opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => {
                  markNotificationsSeen();
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
                onOpenProfilePopup={openNotificationProfilePopup}
                onClose={() => {
                  markNotificationsSeen();
                  setNotifOpen(false);
                }}
              />
            )}
          </div>

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
            {profileOpen && (
              <MemberNavDropdown
                variant="desktop"
                onClose={() => setProfileOpen(false)}
                onLogout={onLogout}
                hasActiveMembership={hasActiveMembershipState}
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

// ── ChatOverlaySidebar — fetch matches ตอนเปิด overlay ──
function ChatOverlaySidebar() {
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data: profileResult } = await apiClient.get(
          "/matching/profiles?limit=1",
        );
        const profileId = profileResult?.myProfileId;
        if (!profileId) return;
        const { data: result } = await apiClient.get(
          `/matching/matches?profileId=${profileId}`,
        );
        if (result.success) setMatches(result.data);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setMatchesLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const LeftSidebar = require("@/components/matching/LeftSidebar").default;
  return <LeftSidebar matches={matches} loading={matchesLoading} />;
}
