export type ShipStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export const SHIP_STATUSES: ShipStatus[] = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
];

export const STATUS_LABEL: Record<ShipStatus, string> = {
  pending: "Pending",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  exception: "Exception",
};

export function statusClasses(status: string) {
  switch (status) {
    case "delivered":
      return "bg-success/10 text-success border-success/20";
    case "in_transit":
      return "bg-primary/10 text-primary border-primary/20";
    case "out_for_delivery":
      return "bg-telegram/10 text-telegram border-telegram/20";
    case "exception":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function generateTrackingCode() {
  return `STK-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generatePaymentRef() {
  return `STK-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function formatNaira(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `₦${(n || 0).toLocaleString("en-NG")}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return `${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })} · ${d.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function trackingUrl(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/track/${code}`;
}

export const SUBSCRIPTION_LABEL: Record<string, string> = {
  NO_PLAN: "No Plan",
  PENDING_PAYMENT: "Payment Pending",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
};
