import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/notificationHelpers";

/**
 * แถวเดียวของ notification (presentational)
 */
export function NotificationItem({
  id,
  headline,
  description,
  profileImageUrl,
  name,
  time,
  resolvedHref,
  isUnread,
  heartCount,
  shouldBlurAvatar,
  compact = false,
  onClick,
}) {
  return (
    <Link
      href={resolvedHref}
      className={`flex items-start gap-3 text-gray-700 transition-colors hover:bg-purple-100 cursor-pointer px-[14px] py-3 rounded-[8px] ${isUnread ? "bg-red-100/50" : ""}`}
      onClick={onClick}
    >
      <div className="relative shrink-0 size-8 rounded-full bg-gray-100">
        <div
          className={
            shouldBlurAvatar ? "size-8 overflow-hidden rounded-full" : ""
          }
        >
          <Avatar
            size="xl"
            className={`size-8 ${shouldBlurAvatar ? "blur-sm" : ""}`}
          >
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
          <p
            className={`text-body4 ${isUnread ? "font-semibold text-purple-800" : "text-gray-700"}`}
          >
            {isUnread && (
              <span
                className="inline-block size-[6.4px] rounded-full bg-purple-500 mr-1 mb-[2px] align-middle"
                aria-hidden
              />
            )}
            {headline}
            {compact && (
              <span className="text-tagline text-gray-500 ml-1">{time}</span>
            )}
          </p>
          {!compact && (
            <span className="shrink-0 text-tagline text-gray-500">{time}</span>
          )}
        </div>
        <p className="text-body4 text-gray-700">{description}</p>
      </div>
    </Link>
  );
}
