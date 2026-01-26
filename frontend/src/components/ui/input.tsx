import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-transparent px-4 py-3 text-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary h-10",
        glass: "border-border/50 bg-surface-glass/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/60 h-11",
        terminal: "border-terminal-green/40 bg-terminal-green/10 text-terminal-green font-mono focus-visible:ring-2 focus-visible:ring-terminal-green/50 placeholder:text-terminal-green/50 h-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
