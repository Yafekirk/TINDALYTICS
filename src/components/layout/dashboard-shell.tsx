"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils/cn";
import type { AuthStoreInfo, AuthUserInfo } from "@/types/auth";

type DashboardShellProps = {
  children: ReactNode;
  user: AuthUserInfo;
  store: AuthStoreInfo | null;
  role: string | null;
};

export function DashboardShell({
  children,
  user,
  store,
  role,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
        store={store}
        role={role}
      />

      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[88px]" : "lg:pl-72",
        )}
      >
        <Header
          pathname={pathname}
          onMenuClick={() => setMobileOpen(true)}
          user={user}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
