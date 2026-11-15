import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { brand } from "@/config/brand";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-page">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-soft)_0%,_transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-navy">{title}</h1>
          <p className="mt-2 text-sm text-secondary">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-secondary">
          {brand.tagline} ·{" "}
          <Link href="/" className="font-medium text-primary hover:text-navy">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
