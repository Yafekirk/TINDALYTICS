import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StoreSettingsForm } from "@/components/settings/store-settings-form";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getStoreSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Store Settings" };

export default async function SettingsPage() {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const settings = await getStoreSettings(supabase, store.id, role);

  if (!settings) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">
          Unable to load store settings
        </h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy">Store Settings</h2>
        <p className="mt-1 text-sm text-secondary">
          Manage your tindahan profile, contact details, and defaults.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Store profile</CardTitle>
            <CardDescription>
              These details appear across the dashboard and receipts.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <StoreSettingsForm store={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
