"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const primaryButtonBase =
  "h-12 min-w-[107px] py-3 px-6 rounded-full font-medium shadow-[var(--shadow-button)] gap-2";

const primaryButtonStates =
  "bg-red-500 text-white hover:bg-red-400 active:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-100";

export function PrimaryButton({ className, children, ...props }) {
  return (
    <Button
      variant="default"
      className={cn(primaryButtonBase, primaryButtonStates, className)}
      {...props}
    >
      {children}
    </Button>
  );
}
