"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const secondaryButtonBase =
  "h-12 min-w-[127px] py-3 px-6 rounded-full font-medium shadow-[var(--shadow-button)] gap-2";

const secondaryButtonStates =
  "bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-100";

export function SecondaryButton({ className, children, ...props }) {
  return (
    <Button
      variant="secondary"
      className={cn(secondaryButtonBase, secondaryButtonStates, className)}
      {...props}
    >
      {children}
    </Button>
  );
}
