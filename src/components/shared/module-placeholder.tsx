import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
};

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  phase,
}: ModulePlaceholderProps) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-primary">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-2xl bg-page px-4 py-3 text-sm text-secondary">
          This module shell is ready for <strong className="text-navy">{phase}</strong>.
          Navigation, layout, and branding are already wired.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium !text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover hover:!text-white hover:shadow-md"
        >
          Back to Dashboard
        </Link>
      </CardContent>
    </Card>
  );
}
