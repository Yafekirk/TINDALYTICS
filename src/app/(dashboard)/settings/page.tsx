import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Store Settings" };

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Store Settings"
      description="Store profile, payment methods, and preferences will follow authentication setup."
      icon={Settings}
      phase="Phase 2+"
    />
  );
}
