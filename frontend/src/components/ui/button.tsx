import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary-foreground border border-primary/40 backdrop-blur-md hover:bg-primary/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20",
        destructive: "bg-destructive/20 text-destructive-foreground border border-destructive/40 backdrop-blur-md hover:bg-destructive/30 hover:border-destructive/60",
        outline: "border border-border bg-transparent backdrop-blur-sm hover:bg-secondary/50 hover:text-secondary-foreground hover:border-border/80",
        secondary: "bg-secondary/60 text-secondary-foreground backdrop-blur-sm border border-border/40 hover:bg-secondary/80",
        ghost: "hover:bg-secondary/50 hover:text-secondary-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        // Glassmorphism red glow variant
        glow: "bg-primary/15 text-primary-foreground border border-primary/50 backdrop-blur-md shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:bg-primary/25 hover:border-primary/70 hover:shadow-[0_0_30px_hsl(var(--primary)/0.35),0_0_60px_hsl(var(--primary)/0.15)]",
        terminal: "bg-terminal-green/15 text-terminal-green border border-terminal-green/40 backdrop-blur-md hover:bg-terminal-green/25 hover:border-terminal-green/60 font-mono",
        danger: "bg-destructive/15 text-destructive border border-destructive/40 backdrop-blur-md hover:bg-destructive/25 hover:border-destructive/60 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.2)]",
        success: "bg-terminal-green/15 text-terminal-green border border-terminal-green/40 backdrop-blur-md hover:bg-terminal-green/25 hover:border-terminal-green/60 hover:shadow-[0_0_20px_hsl(var(--terminal-green)/0.2)]",
        warning: "bg-warning-amber/15 text-warning-amber border border-warning-amber/40 backdrop-blur-md hover:bg-warning-amber/25 hover:border-warning-amber/60",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
