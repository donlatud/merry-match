"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconButtonWhiteClasses =
  "size-12 rounded-2xl bg-white shadow-[var(--shadow-button)] p-0 inline-flex items-center justify-center hover:bg-white cursor-pointer";

const iconButtonTooltipClasses =
  "pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-1 rounded px-2 py-0.5 bg-gray-600 text-white text-sm whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100";

export function ButtonGoToChat({ className, ...props }) {
  return (
    <span className="relative inline-block group cursor-pointer">
      <Button
        variant="ghost"
        title="Go to chat"
        aria-label="Go to chat"
        className={cn(iconButtonWhiteClasses, className)}
        {...props}
      >
        <Image
          src="/merry_icon/icon-chat.svg"
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0"
        />
      </Button>
      <span className={iconButtonTooltipClasses} role="tooltip" aria-hidden>
        Go to chat
      </span>
    </span>
  );
}

export function ButtonSeeProfile({ className, ...props }) {
  return (
    <span className="relative inline-block group cursor-pointer">
      <Button
        variant="ghost"
        title="See profile"
        aria-label="See profile"
        className={cn(iconButtonWhiteClasses, className)}
        {...props}
      >
        <Image
          src="/merry_icon/icon-view.svg"
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0"
        />
      </Button>
      <span className={iconButtonTooltipClasses} role="tooltip" aria-hidden>
        See profile
      </span>
    </span>
  );
}

export function ButtonMerry({ className, onClick, ...props }) {
  const [pressed, setPressed] = useState(false);

  const handleClick = (e) => {
    setPressed((prev) => !prev);
    onClick?.(e);
  };

  return (
    <span className="relative inline-block group cursor-pointer">
      <Button
        variant="ghost"
        type="button"
        title="Merry"
        aria-label="Merry"
        aria-pressed={pressed}
        onClick={handleClick}
        className={cn(
          iconButtonWhiteClasses,
          "transition-all duration-500 ease-in-out",
          pressed && "bg-red-500 hover:bg-red-500 shadow-(--shadow-button)",
          className,
        )}
        {...props}
      >
        <Image
          src="/merry_icon/icon-match-log.svg"
          alt=""
          width={24}
          height={24}
          className={cn(
            "size-6 shrink-0 object-contain transition-all duration-500",
            pressed && "brightness-0 invert",
          )}
        />
      </Button>
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-1 rounded px-2 py-0.5 bg-gray-600 text-white text-sm whitespace-nowrap transition-opacity duration-200",
          pressed ? "opacity-0" : "opacity-0 group-hover:opacity-100",
        )}
        role="tooltip"
        aria-hidden
      >
        Merry
      </span>
    </span>
  );
}

export function ButtonPass({ className, onClick, ...props }) {
  const [pressed, setPressed] = useState(false);

  const handleClick = (e) => {
    setPressed((prev) => !prev);
    onClick?.(e);
  };

  return (
    <span className="relative inline-block group cursor-pointer">
      <Button
        variant="ghost"
        type="button"
        title="Pass"
        aria-label="Pass"
        aria-pressed={pressed}
        onClick={handleClick}
        className={cn(
          iconButtonWhiteClasses,
          "transition-all duration-500 ease-in-out",
          pressed && "bg-gray-200 hover:bg-gray-200 shadow-(--shadow-button)",
          className,
        )}
        {...props}
      >
        <Image
          src="/merry_icon/icon-merry-close.svg"
          alt=""
          width={24}
          height={24}
          className={cn(
            "size-6 shrink-0 object-contain transition-all duration-500",
            pressed && "opacity-60",
          )}
        />
      </Button>
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-1 rounded px-2 py-0.5 bg-gray-600 text-white text-sm whitespace-nowrap transition-opacity duration-200",
          pressed ? "opacity-0" : "opacity-0 group-hover:opacity-100",
        )}
        role="tooltip"
        aria-hidden
      >
        Pass
      </span>
    </span>
  );
}