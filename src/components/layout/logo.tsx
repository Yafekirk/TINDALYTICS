import Image from "next/image";
import Link from "next/link";
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
      aria-label={brand.name}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 object-contain transition-all duration-200 group-hover:scale-[1.03]"
        priority
      />
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
