import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  primary:
    "bg-primary !text-white shadow-sm hover:bg-primary-hover hover:!text-white hover:shadow-md hover:-translate-y-px active:translate-y-0 focus-visible:ring-primary/30",
  secondary:
    "bg-white text-navy border border-border hover:border-accent hover:bg-accent-soft/40 hover:text-navy focus-visible:ring-accent/40",
  ghost:
    "bg-transparent text-secondary hover:bg-accent-soft/50 hover:text-navy focus-visible:ring-accent/30",
  danger:
    "bg-danger text-white shadow-sm hover:bg-red-600 hover:shadow-md focus-visible:ring-danger/30",
  soft: "bg-accent-soft text-navy hover:bg-accent hover:text-navy focus-visible:ring-accent/40",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-10 w-10",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
