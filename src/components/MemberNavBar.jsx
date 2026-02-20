import { useState } from "react";
import Link from "next/link";

export default function MemberNavBar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      {/* Mobile: Chat + Notification + Hamburger */}
      <div className="flex items-center gap-5 lg:hidden">
        <div className="flex items-center gap-3">
          {/* TODO: link to chat — ใส่ตรงนี้ */}
          <Link
            href="/chat"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 transition-opacity hover:opacity-90 cursor-pointer"
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
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 transition-opacity hover:opacity-90 cursor-pointer"
            aria-label="Notifications"
          >
            <img
              src="/merry_icon/icon-notification.svg"
              alt=""
              className="w-[14px] h-[14px]"
            />
          </Link>
        </div>

        {/* TODO: link to profile — ใส่ตรงนี้ */}
        <Link
          href="/profile"
          className="flex flex-col justify-between w-5 h-4 cursor-pointer"
        >
          <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
          <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
          <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
        </Link>
      </div>

      {/* Desktop: Start Matching + Membership + Notification + Profile */}
      <div className="hidden lg:flex items-center gap-8">
        <Link
          href="/matching-page"
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
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 transition-opacity hover:opacity-90 cursor-pointer"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <img
              src="/merry_icon/icon-notification.svg"
              alt=""
              className="w-5 h-5"
            />
          </button>

          {/* TODO: Profile dropdown — ใส่ตรงนี้ */}
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-gray-200 cursor-pointer transition-opacity hover:opacity-90"
            aria-label="Profile"
            aria-expanded={profileOpen}
          >
            <img
              src="/merry_icon/icon-user.svg"
              alt=""
              className="w-5 h-5 text-gray-600"
            />
          </button>
        </div>
      </div>
    </>
  );
}
