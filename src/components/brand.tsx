import { Link } from "@tanstack/react-router";
import { Package, Send, MessageCircle } from "lucide-react";
import { useSettings } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { statusClasses, STATUS_LABEL, type ShipStatus } from "@/lib/swift";

export function Logo({ to = "/" as string, compact = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Package className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">SwiftTrack</span>
      )}
    </Link>
  );
}

export function TelegramButton({ className }: { className?: string }) {
  const { data: settings } = useSettings();
  return (
    <a
      href={settings?.["telegram_url"] ?? "https://t.me/swifttrack"}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-telegram px-3.5 py-2 text-sm font-semibold text-telegram-foreground transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Send className="h-4 w-4" />
      Join Telegram Group
    </a>
  );
}

export function SupportButton() {
  const { data: settings } = useSettings();
  return (
    <a
      href={settings?.["support_url"] ?? "https://t.me/swifttrack_support"}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-support px-4 py-3 text-sm font-semibold text-support-foreground shadow-[var(--shadow-pop)] transition-transform hover:scale-105"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Need Support? Send a DM</span>
      <span className="sm:hidden">Support</span>
    </a>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusClasses(status),
      )}
    >
      {STATUS_LABEL[status as ShipStatus] ?? status}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeletons({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/60" />
      ))}
    </div>
  );
}
