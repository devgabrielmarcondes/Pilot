import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-[color,background,border,box-shadow,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "border border-transparent bg-[#7C3AED] text-white hover:-translate-y-px hover:bg-[#6D28D9] hover:shadow-[0_4px_14px_rgba(124,58,237,0.25)]",
        secondary:
          "border border-black/12 bg-white text-black hover:-translate-y-px hover:border-[#7C3AED] hover:text-[#7C3AED] hover:shadow-[0_4px_14px_rgba(124,58,237,0.25)]",
        danger:
          "border border-transparent bg-[#dc2626] text-white hover:-translate-y-px hover:bg-[#b91c1c] hover:shadow-[0_4px_14px_rgba(220,38,38,0.25)]",
        ghost:
          "border border-transparent bg-black/5 text-black hover:scale-105 hover:bg-[#7C3AED] hover:text-white",
      },
      size: {
        default: "h-9 px-[18px]",
        sm: "h-7 px-3 text-xs",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);

Button.displayName = "Button";
