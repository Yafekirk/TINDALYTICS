import { createClient } from "@/lib/supabase/server";
import type { ProfileDetails } from "@/types/account";

export async function getProfile(userId: string): Promise<ProfileDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}
