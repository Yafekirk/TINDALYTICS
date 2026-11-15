import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: memberships } = await supabase
          .from("store_members")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (!memberships?.length) {
          const storeName =
            (user.user_metadata?.store_name as string | undefined) ??
            "My Sari-Sari Store";
          await supabase.rpc("create_store_with_owner", {
            store_name: storeName,
            store_address: null,
            store_phone: null,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
