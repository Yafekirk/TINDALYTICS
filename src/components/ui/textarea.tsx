import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-24 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-accent focus:border-primary focus:ring-2 focus:ring-accent/30",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
