"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Menu, Search, Settings, UserRound } from "lucide-react";
import { pageTitles } from "@/config/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { AuthUserInfo } from "@/types/auth";

type HeaderProps = {
  pathname: string;
  onMenuClick: () => void;
  user: AuthUserInfo;
};

export function Header({ pathname, onMenuClick, user }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = pageTitles[pathname] ?? "Tindalytics";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">
            Store Overview
          </p>
          <h1 className="truncate text-lg font-semibold text-navy sm:text-xl">
            {title}
          </h1>
        </div>

        <div className="hidden max-w-sm flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary transition-colors peer-focus:text-primary" />
            <Input
              placeholder="Search products, sales, customers..."
              className="peer pl-9"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-secondary transition-all duration-200 hover:bg-accent-soft/60 hover:text-primary hover:scale-105"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-2.5 py-1.5 transition-all duration-200 hover:border-accent hover:bg-accent-soft/30 hover:shadow-sm"
            >
              <Avatar name={user.fullName} />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-navy">
                  {user.fullName}
                </span>
                <span className="block text-xs text-secondary">
                  {user.email}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "hidden h-4 w-4 text-secondary transition-transform duration-200 sm:block",
                  profileOpen && "rotate-180",
                )}
              />
            </button>

            <div
              className={cn(
                "absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-white p-2 shadow-lg transition-all duration-200",
                profileOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-1 pointer-events-none opacity-0",
              )}
            >
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-navy transition-colors hover:bg-accent-soft/50 hover:text-primary"
              >
                <UserRound className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-navy transition-colors hover:bg-accent-soft/50 hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Store Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
