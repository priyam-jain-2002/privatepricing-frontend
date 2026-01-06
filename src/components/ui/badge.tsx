import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-red-100 text-red-900 hover:bg-red-200/80",
                outline: "text-foreground",
                success: "border-transparent bg-emerald-100 text-emerald-900 hover:bg-emerald-200/80",
                warning: "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-200/80",
                info: "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-200/80",
                purple: "border-transparent bg-purple-100 text-purple-900 hover:bg-purple-200/80",
                indigo: "border-transparent bg-indigo-100 text-indigo-900 hover:bg-indigo-200/80",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
