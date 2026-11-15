"use client";

import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { StoreNotification } from "@/types/account";

type NotificationsPanelProps = {
  notifications: StoreNotification[];
};

function toneForType(type: string) {
  if (type === "warning" || type === "danger") return "warning" as const;
  if (type === "success") return "success" as const;
  return "info" as const;
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function markOne(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <h3 className="text-base font-semibold text-navy">No notifications yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-secondary">
          Low-stock alerts and store notices will show up here as your inventory
          and sales activity grow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "You are all caught up."}
        </p>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={markAll}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all as read
          </Button>
        ) : null}
      </div>

      <ul className="space-y-3">
        {notifications.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:border-accent/60",
              !item.isRead && "border-accent bg-accent-soft/20",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-navy">{item.title}</h3>
                  <Badge tone={toneForType(item.type)}>{item.type}</Badge>
                  {!item.isRead ? <Badge tone="danger">Unread</Badge> : null}
                </div>
                <p className="text-sm leading-6 text-secondary">{item.message}</p>
                <p className="mt-2 text-xs text-secondary">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
              {!item.isRead ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => markOne(item.id)}
                >
                  Mark read
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
