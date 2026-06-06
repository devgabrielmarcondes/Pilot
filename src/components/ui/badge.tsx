import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.02em]",
  {
    variants: {
      variant: {
        default: "bg-black/6 text-black",
        success: "bg-[#16a34a]/10 text-[#16a34a]",
        warning: "bg-[#ca8a04]/10 text-[#ca8a04]",
        danger: "bg-[#dc2626]/10 text-[#dc2626]",
        info: "bg-[#2563eb]/10 text-[#2563eb]",
        agent: "bg-[#9333ea]/10 text-[#9333ea]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
