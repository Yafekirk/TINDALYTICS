import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/services/profile";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "User Profile" };

export default async function ProfilePage() {
  const { user } = await requireUser();
  const profile = await getProfile(user.id);

  const details = profile ?? {
    id: user.id,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "User",
    email: user.email ?? null,
    avatarUrl: null,
    createdAt: user.created_at,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy">User Profile</h2>
        <p className="mt-1 text-sm text-secondary">
          Update your name and password for this account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>
              Member since {formatDate(details.createdAt)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={details} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Choose a new password with at least 6 characters.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
