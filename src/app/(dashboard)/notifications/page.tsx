import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <ModulePlaceholder
      title="Notifications"
      description="Low-stock alerts and store notices will be wired after core modules."
      icon={Bell}
      phase="Phase 3+"
    />
  );
}
