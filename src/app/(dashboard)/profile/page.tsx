import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "User Profile" };

export default function ProfilePage() {
  return (
    <ModulePlaceholder
      title="User Profile"
      description="Profile details and password management will be connected in Phase 2."
      icon={UserRound}
      phase="Phase 2"
    />
  );
}
