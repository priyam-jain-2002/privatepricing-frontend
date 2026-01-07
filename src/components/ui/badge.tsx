import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100/80",
                destructive:
                    "border-red-200 bg-red-50 text-red-700 hover:bg-red-50/80",
                outline: "text-foreground",
                success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80",
                warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50/80",
                info: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50/80",
                purple: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50/80",
                indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50/80",
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
