"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { mainNavItems, secondaryNavItems } from "@/config/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import type { AuthStoreInfo, AuthUserInfo } from "@/types/auth";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: AuthUserInfo;
  store: AuthStoreInfo | null;
  role: string | null;
};

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  user,
  store,
  role,
}: SidebarProps) {
  const pathname = usePathname();
  const storeName = store?.name ?? "Your Store";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-navy/40 backdrop-blur-[2px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-white transition-all duration-300",
          collapsed ? "w-[88px]" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-4",
            collapsed ? "justify-center gap-1" : "justify-between gap-2",
          )}
        >
          <Logo collapsed={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden shrink-0 lg:inline-flex",
              collapsed && "absolute top-3 right-2",
            )}
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <NavSection
            title="Operations"
            items={mainNavItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onCloseMobile}
          />
          <NavSection
            title="Account"
            items={secondaryNavItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onCloseMobile}
          />
        </nav>

        <div className="border-t border-border p-3">
          <div
            className={cn(
              "mb-3 rounded-2xl border border-transparent bg-accent-soft/35 p-3 transition-colors hover:border-accent/40 hover:bg-accent-soft/55",
              collapsed && "flex justify-center p-2",
            )}
          >
            {collapsed ? (
              <Avatar name={user.fullName} />
            ) : (
              <div className="flex items-center gap-3">
                <Avatar name={user.fullName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">
                    {storeName}
                  </p>
                  <p className="truncate text-xs text-secondary">
                    {roleLabel} · {user.fullName}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form action={logoutAction}>
            <Button
              type="submit"
              variant="secondary"
              className={cn("w-full", collapsed && "px-0")}
              onClick={onCloseMobile}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed ? "Logout" : null}
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

type NavSectionProps = {
  title: string;
  items: typeof mainNavItems;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
};

function NavSection({
  title,
  items,
  pathname,
  collapsed,
  onNavigate,
}: NavSectionProps) {
  return (
    <div>
      {!collapsed ? (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
          {title}
        </p>
      ) : null}
      <ul className="space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-primary !text-white shadow-sm hover:!text-white"
                    : "text-secondary hover:bg-accent-soft/50 hover:text-navy hover:translate-x-0.5",
                )}
              >
                {active && !collapsed ? (
                  <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                ) : null}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    !active && "group-hover:scale-110",
                  )}
                />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
