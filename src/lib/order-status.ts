
export const ORDER_STATUS = {
    REQUESTED: 0,
    PENDING: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    PI: 4,
    COMPLETED: 5,
    CANCELLED: 6,
} as const;

export type OrderStatusType = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const STATUS_CONFIG: Record<number, { label: string, variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" | "indigo" }> = {
    0: { label: "Requested", variant: "warning" },
    1: { label: "Pending", variant: "secondary" },
    2: { label: "Processing", variant: "info" },
    3: { label: "Shipped", variant: "purple" },
    4: { label: "PI", variant: "indigo" },
    5: { label: "Completed", variant: "success" },
    6: { label: "Cancelled", variant: "destructive" },
};

export const COMPLETED_STATUSES = [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED];
