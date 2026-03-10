import Link from "next/link";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";

const MEMBER_NAV_MENU_ITEMS = [
  { href: "/profile", icon: "/merry_icon/icon-user.svg", label: "Profile" },
  {
    href: "/merry-list",
    icon: "/merry_icon/icon-merry.svg",
    label: "Merry list",
  },
  {
    href: "/membership",
    icon: "/merry_icon/icon-package.svg",
    label: "Merry Membership",
  },
  {
    href: "/complaint",
    icon: "/merry_icon/icon-warning.svg",
    label: "Complaint",
  },
];

export default function MemberNavDropdown({
  variant = "desktop",
  onClose,
  onLogout,
  hasActiveMembership = false,
  isPremiumMembership = false,
  membershipResolved = true,
}) {
  const desktopDropdownRef = useRef(null);
  const shouldShowUpgrade = membershipResolved && !isPremiumMembership;
  const visibleMenuItems = hasActiveMembership
    ? MEMBER_NAV_MENU_ITEMS
    : MEMBER_NAV_MENU_ITEMS.filter(({ href }) => href !== "/membership");

  useEffect(() => {
    if (variant !== "desktop") return;
    if (!desktopDropdownRef.current) return;

    desktopDropdownRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: "ease-out",
      fill: "both",
    });
  }, [variant]);

  const handleLogout = () => {
    onClose?.();
    onLogout?.();
  };

  if (variant === "mobile") {
    return (
      <div className="fixed right-0 top-13 -z-1 flex w-screen h-screen flex-col items-center rounded-[4px] bg-utility-white shadow-[4px_4px_16px_0px_#00000014]">
        <div className="flex flex-col w-[375px] h-full max-h-[764px] min-h-0 gap-4 px-4 py-6 overflow-y-auto overscroll-contain">
          {shouldShowUpgrade ? (
            <Link
              href="/payment"
              className="flex items-center justify-center gap-[6px] rounded-[99px] bg-utility-linear px-6 py-[10px] cursor-pointer"
              onClick={onClose}
            >
              <img
                src="/merry_icon/icon-package-platinum.svg"
                alt=""
                className="size-[14.4px]"
              />
              <span className="text-body4 text-utility-white">
                More limit Merry!
              </span>
            </Link>
          ) : null}

          <div className="flex flex-col">
            {visibleMenuItems.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-[14px] py-3 text-body4 text-gray-700 hover:bg-purple-100 rounded-[99px] cursor-pointer"
                onClick={onClose}
              >
                <img src={icon} alt={label} className="size-4" />
                <span className="text-body4 text-gray-700">{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col border-t border-gray-300">
            <button
              type="button"
              className="flex items-center gap-3 px-[14px] py-3 text-body4 text-gray-700 hover:bg-purple-100 rounded-[99px] cursor-pointer w-full"
              onClick={handleLogout}
            >
              <ArrowRightStartOnRectangleIcon className="size-4 text-gray-700" />
              <span className="text-body4 text-gray-700">Log out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div
      ref={desktopDropdownRef}
      className="absolute right-0 top-full z-50 mt-2 py-2 gap-2 flex flex-col w-[198px] rounded-[16px] bg-utility-white shadow-button"
    >
      {shouldShowUpgrade ? (
        <Link
          href="/payment"
          className="flex items-center justify-center gap-[6px] rounded-[99px] mx-2 bg-utility-linear px-6 py-[10px] cursor-pointer"
          onClick={onClose}
        >
          <img
            src="/merry_icon/icon-package-platinum.svg"
            alt=""
            className="size-4"
          />
          <span className="text-body4 text-utility-white">
            More limit Merry!
          </span>
        </Link>
      ) : null}

      <div className="flex flex-col">
        {visibleMenuItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-[14px] py-2 text-gray-700 transition-colors hover:bg-purple-100 rounded-[8px] cursor-pointer"
            onClick={onClose}
          >
            <img src={icon} alt={label} className="size-4" />
            <span className="text-body4 text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-100 hover:bg-purple-100 rounded-b-[16px] rounded-t-[8px]">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-[14px] py-2 text-gray-700 transition-colors hover:bg-purple-100 rounded-[16px] cursor-pointer"
          onClick={handleLogout}
        >
          <ArrowRightStartOnRectangleIcon className="size-4 text-gray-700" />
          <span className="text-body4 text-gray-700">Log out</span>
        </button>
      </div>
    </div>
  );
}
