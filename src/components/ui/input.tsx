import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-navy placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-accent focus:border-primary focus:ring-2 focus:ring-accent/30",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
