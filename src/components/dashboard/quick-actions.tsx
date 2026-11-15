import Link from "next/link";
import {
  BarChart3,
  PackagePlus,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  {
    label: "New Sale",
    description: "Open the POS checkout",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    label: "Add Product",
    description: "Create a new SKU",
    href: "/products",
    icon: PackagePlus,
  },
  {
    label: "Restock Inventory",
    description: "Record stock-in",
    href: "/inventory",
    icon: Warehouse,
  },
  {
    label: "View Reports",
    description: "Sales and profit insights",
    href: "/reports",
    icon: BarChart3,
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Quick Actions</CardTitle>
          <p className="mt-1 text-sm text-secondary">
            Jump into the most common store tasks.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-border bg-page p-4 transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:bg-accent-soft/40 hover:shadow-md"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-navy transition-colors group-hover:text-primary">
                  {action.label}
                </p>
                <p className="mt-1 text-xs text-secondary">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
