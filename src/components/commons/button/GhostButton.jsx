"use client";

import { MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ghostButtonBase =
  "min-w-[85px] h-8 py-1 px-2 rounded-2xl shadow-none gap-2 inline-flex items-center justify-center";

const ghostButtonStates =
  "bg-transparent hover:bg-transparent active:bg-transparent disabled:bg-transparent text-red-500 hover:text-red-400 active:text-red-600 disabled:text-gray-400 disabled:opacity-100";

export function GhostButton({ className, children, ...props }) {
  return (
    <Button
      variant="ghost"
      className={cn(ghostButtonBase, ghostButtonStates, className)}
      {...props}
    >
      <span className="inline-flex size-4 shrink-0 items-center justify-center" aria-hidden>
        <MoveLeft className="size-[10.25px]" strokeWidth={2} />
      </span>
      <span className="flex h-6 w-[45px] items-center justify-center text-base font-bold leading-6">
        {children}
      </span>
    </Button>
  );
}
