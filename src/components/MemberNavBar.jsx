import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import MemberNavDropdown from "@/components/MemberNavDropdown";
import { useAuth } from "@/hooks/login/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MemberNavBar({ onLogout }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        if (!user?.id) {
          setProfileImageUrl(null);
          return;
        }

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setProfileImageUrl(null);
          return;
        }

        const response = await axios.get("/api/me/profile-image", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfileImageUrl(response.data.profile_image_url ?? null);
      } catch {
        setProfileImageUrl(null);
      }
    };

    fetchProfileImage();
  }, [user?.id]);

  const userInitials = (user?.username || "MM").slice(0, 2).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
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
  }, []);

  // Close mobile menu when clicking outside (handled by backdrop now)

  return (
    <>
      {/* Mobile: Chat + Notification + Hamburger */}
      <div className="flex items-center gap-5 lg:hidden">
        <div className="flex items-center gap-3">
          {/* TODO: link to chat — ใส่ตรงนี้ */}
          <Link
            href="/chat"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-100 cursor-pointer"
            aria-label="Chat"
          >
            <img
              src="/merry_icon/icon-chat.svg"
              alt=""
              className="w-[14px] h-[14px]"
            />
          </Link>

          {/* TODO: link to notifications — ใส่ตรงนี้ */}
          <Link
            href="/notifications"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-100 cursor-pointer"
            aria-label="Notifications"
          >
            <img
              src="/merry_icon/icon-notification.svg"
              alt=""
              className="w-[14px] h-[14px]"
            />
          </Link>
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
          href="/membership"
          className="text-body2 text-purple-800 font-bold hover:underline cursor-pointer"
        >
          Merry Membership
        </Link>
        <div className="flex items-center gap-3">
          {/* TODO: Notifications dropdown — ใส่ตรงนี้ */}
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 transition-opacity hover:bg-purple-100 cursor-pointer"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <img
              src="/merry_icon/icon-notification.svg"
              alt=""
              className="w-5 h-5"
            />
          </button>

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
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
