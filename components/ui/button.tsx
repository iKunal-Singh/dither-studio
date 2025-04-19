import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider font-bold",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-800 text-zinc-50 shadow-lg hover:scale-[1.02] active:scale-[0.98] active:bg-zinc-700 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.2)]",
        destructive: "bg-red-600 text-destructive-foreground hover:scale-[1.02] active:scale-[0.98] hover:bg-red-700",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-zinc-800 text-zinc-50 hover:bg-zinc-700 border border-zinc-700 hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-zinc-800 hover:text-zinc-50 hover:scale-[1.02] active:scale-[0.98]",
        link: "text-zinc-50 underline-offset-4 hover:underline",
        glitch:
          "relative bg-zinc-800 text-zinc-50 shadow-lg hover:scale-[1.02] active:scale-[0.98] active:bg-zinc-700 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.2)] before:absolute before:inset-0 before:bg-zinc-700 before:opacity-0 hover:before:opacity-100 before:transition-opacity overflow-hidden",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
