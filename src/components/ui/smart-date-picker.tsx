"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Check } from "lucide-react"
import { format, parse, isValid } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface SmartDatePickerProps {
    date?: Date
    onDateChange: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function SmartDatePicker({
    date,
    onDateChange,
    placeholder = "DD/MM/YYYY",
    disabled = false,
    className
}: SmartDatePickerProps) {
    const [inputValue, setInputValue] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

    // Sync input value when date prop changes
    React.useEffect(() => {
        if (date) {
            setInputValue(format(date, "P")) // Localized date format (e.g., 01/24/2025)
        } else {
            setInputValue("")
        }
    }, [date])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)

        if (value.trim() === "") {
            onDateChange(undefined)
            return
        }

        // Try parsing common formats
        const parsedDate = parseDateString(value)

        if (parsedDate && isValid(parsedDate)) {
            // Only update if it's a valid date
            // We might want to check reasonable bounds here too
            if (parsedDate.getFullYear() > 1900 && parsedDate.getFullYear() < 2100) {
                onDateChange(parsedDate)
            }
        }
    }

    const handleInputBlur = () => {
        // On blur, if valid date, format it nicely. If invalid, revert to previous date or clear?
        // For "industry standard", usually we leave the invalid text but don't submit it, OR we revert.
        // Let's revert to the formatted valid date if strictly invalid, or keep text if it parsed successfully.

        if (date) {
            setInputValue(format(date, "P"))
        } else {
            // If undefined, clearing is safe
            setInputValue("")
        }
    }

    const handleCalendarSelect = (newDate: Date | undefined) => {
        onDateChange(newDate)
        setIsOpen(false) // Close popover on selection
    }

    return (
        <div className={cn("relative flex items-center", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <div className="relative w-full">
                    <Input
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn("pr-10", !date && "text-muted-foreground")}
                    />
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                            disabled={disabled}
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                </div>

                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleCalendarSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

// Helper to parse loose date strings
function parseDateString(value: string): Date | null {
    // Clean string
    const clean = value.trim()

    const formats = [
        "P", // Localized format (01/24/2000)
        "PP", // Medium (Jan 24, 2000)
        "yyyy-MM-dd", // ISO
        "dd/MM/yyyy",
        "dd-MM-yyyy",
        "dd.MM.yyyy",
        "MM/dd/yyyy",
    ]

    for (const fmt of formats) {
        const d = parse(clean, fmt, new Date())
        if (isValid(d)) return d
    }

    // Fallback: try native Date.parse (good for "Jan 1 2024")
    const native = new Date(clean)
    if (isValid(native)) return native

    return null
}
