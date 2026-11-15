import Link from "next/link";
import { Store } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils/cn";

type LogoProps = {
  href?: string;
  collapsed?: boolean;
  className?: string;
};

export function Logo({ href = "/dashboard", collapsed = false, className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 text-navy transition-opacity hover:opacity-90",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition-all duration-200 group-hover:bg-navy group-hover:shadow-md group-hover:scale-[1.03]">
        <Store className="h-5 w-5" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-base font-bold tracking-tight">
            {brand.name}
          </span>
          <span className="block truncate text-xs text-secondary">
            Store POS & Inventory
          </span>
        </span>
      ) : null}
    </Link>
  );
}
