import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Receipt,
  Truck,
  ClipboardList,
  BarChart3,
  Wallet,
  Users,
  HandCoins,
  Sparkles,
  Bell,
  Settings,
  UserRound,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Warehouse },
  { label: "Sales", href: "/sales", icon: Receipt },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Expenses", href: "/expenses", icon: Wallet },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Utang / Credit", href: "/credits", icon: HandCoins },
  { label: "AI Insights", href: "/ai-insights", icon: Sparkles },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export const secondaryNavItems: NavItem[] = [
  { label: "Store Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "Point of Sale",
  "/products": "Products",
  "/inventory": "Inventory",
  "/sales": "Sales & Transactions",
  "/suppliers": "Suppliers",
  "/purchase-orders": "Purchase Orders",
  "/reports": "Reports & Analytics",
  "/expenses": "Expenses",
  "/customers": "Customers",
  "/credits": "Utang / Customer Credit",
  "/ai-insights": "AI Insights",
  "/notifications": "Notifications",
  "/settings": "Store Settings",
  "/profile": "User Profile",
};
