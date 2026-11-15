import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import { brand } from "@/config/brand";
import { Logo } from "@/components/layout/logo";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const features = [
  {
    title: "Point of Sale",
    description: "Fast checkout with cash, GCash, and receipt printing.",
    icon: ShoppingCart,
  },
  {
    title: "Inventory Control",
    description: "Track stock levels, restocks, and low-stock alerts.",
    icon: Package,
  },
  {
    title: "Sales Analytics",
    description: "Understand daily sales, profits, and top products.",
    icon: BarChart3,
  },
  {
    title: "AI Insights",
    description: "Get restocking tips and sales forecasts for your tindahan.",
    icon: Sparkles,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-secondary transition-all duration-200 hover:bg-accent-soft/50 hover:text-primary sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium !text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover hover:!text-white hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-soft)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(96,193,229,0.25)_0%,_transparent_45%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-1 text-xs font-semibold text-navy shadow-sm">
                <Store className="h-3.5 w-3.5 text-primary" />
                Built for Filipino sari-sari stores
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">
                {brand.tagline}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-navy/80 sm:text-lg">
                {brand.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium !text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover hover:!text-white hover:shadow-md"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-navy transition-all duration-200 hover:border-accent hover:bg-accent-soft/40"
                >
                  Explore Features
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white/90 p-4 shadow-sm backdrop-blur sm:p-6">
              <div className="rounded-2xl bg-navy p-5 text-white shadow-inner">
                <p className="text-sm font-medium text-white/85">Today&apos;s Sales</p>
                <p className="mt-2 text-3xl font-semibold text-white">₱12,480.50</p>
                <p className="mt-1 text-sm font-medium text-accent">+12.4% vs yesterday</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/15">
                    <p className="text-xs font-medium text-white/80">Transactions</p>
                    <p className="mt-1 text-xl font-semibold text-white">86</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/15">
                    <p className="text-xs font-medium text-white/80">Low Stock</p>
                    <p className="mt-1 text-xl font-semibold text-white">12</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-page p-4 transition hover:border-accent hover:bg-accent-soft/30">
                  <p className="text-xs text-secondary">Inventory Value</p>
                  <p className="mt-1 text-lg font-semibold text-navy">
                    ₱186,450.00
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-page p-4 transition hover:border-accent hover:bg-accent-soft/30">
                  <p className="text-xs text-secondary">Gross Profit</p>
                  <p className="mt-1 text-lg font-semibold text-navy">
                    ₱4,280.75
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-navy sm:text-3xl">
                Everything your tindahan needs
              </h2>
              <p className="mt-3 text-secondary">
                One simple system for selling, stocking, reporting, and growing
                your small retail business.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl border border-border bg-page p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:bg-accent-soft/35 hover:shadow-md"
                  >
                    <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-navy group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-3xl bg-gradient-to-br from-navy via-primary to-[#0077b6] px-6 py-12 text-center text-white shadow-lg sm:px-10">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Ready to run a smarter tindahan?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
                Explore the Phase 1 dashboard demo with realistic Philippine
                store data, then continue building auth, POS, and inventory in
                the next phases.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-accent-soft hover:text-navy hover:shadow-md"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © 2026 {brand.name}. {brand.tagline}
          </p>
          <p>Portfolio project for full-stack development.</p>
        </div>
      </footer>
    </div>
  );
}
