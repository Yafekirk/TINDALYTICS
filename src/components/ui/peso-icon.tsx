import type { SVGProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Lucide-compatible peso mark for money metrics (replaces dollar icons). */
export function PesoIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10 7.25h3.1c1.55 0 2.65.95 2.65 2.3 0 1.2-.75 2.05-1.9 2.35M10 7.25V16.75M10 11.9h3.85M8.75 9.35h7.1M8.75 11.9h7.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
