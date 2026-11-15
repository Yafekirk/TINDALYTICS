import { cn } from "@/lib/utils/cn";

type AvatarProps = {
  name: string;
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-primary ring-2 ring-white transition-transform duration-200",
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
