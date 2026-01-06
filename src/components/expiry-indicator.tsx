"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { analytics } from "@/lib/analytics"

export type ExpiryStatus = "EXPIRING_CRITICAL" | "EXPIRING_SOON" | null

interface ExpiryIndicatorProps {
  expiryStatus?: ExpiryStatus | string
  earliestExpiryDate?: string | Date | null
  type: "customer" | "product"
  className?: string
}

export function ExpiryIndicator({
  expiryStatus,
  earliestExpiryDate,
  type,
  className,
}: ExpiryIndicatorProps) {
  if (!expiryStatus || !earliestExpiryDate) return null

  const isCritical = expiryStatus === "EXPIRING_CRITICAL"
  const isWarning = expiryStatus === "EXPIRING_SOON"

  if (!isCritical && !isWarning) return null

  const date = new Date(earliestExpiryDate)
  const formattedDate = format(date, "dd/MM/yyyy")

  const tooltipText =
    type === "customer"
      ? `One or more products expiring on ${formattedDate}`
      : `Expiring on ${formattedDate}`

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "h-2 w-2 rounded-full shrink-0 cursor-help focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white",
              isCritical ? "bg-red-500 focus:ring-red-500" : "focus:ring-yellow-500",
              className
            )}
            style={!isCritical ? { backgroundColor: '#FFD700' } : undefined}
            tabIndex={0}
            role="img"
            aria-label={tooltipText}
            onMouseEnter={() => {
              analytics.capture('expiry_indicator_hovered', {
                expiryStatus,
                earliestExpiryDate,
                type
              })
            }}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-slate-900 text-white border-slate-800 text-xs px-2 py-1"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
