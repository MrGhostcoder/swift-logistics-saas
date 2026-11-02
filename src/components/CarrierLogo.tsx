import { Check, Truck } from "lucide-react";

import iconUrl from "@/assets/swifttrack-icon.png";
import { cn } from "@/lib/utils";
import { CARRIERS, getCarrier, type CarrierId } from "@/lib/carriers";

const SIZES = {
  sm: { tile: "h-8 w-8 rounded-lg", logo: "h-5 w-5" },
  md: { tile: "h-11 w-11 rounded-xl", logo: "h-7 w-7" },
  lg: { tile: "h-14 w-14 rounded-2xl", logo: "h-9 w-9" },
};

export function CarrierLogo({
  carrier,
  size = "md",
  className,
}: {
  carrier?: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const c = getCarrier(carrier);
  const s = SIZES[size];

  if (c.logo) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center border border-border", s.tile, className)}
        style={{ backgroundColor: `var(--carrier-${c.id}-bg)` }}
        aria-hidden
      >
        <span
          className={s.logo}
          style={{
            backgroundColor: `var(--carrier-${c.id}-fg)`,
            WebkitMask: `url(${c.logo}) center / contain no-repeat`,
            mask: `url(${c.logo}) center / contain no-repeat`,
          }}
        />
      </span>
    );
  }

  if (c.id === "swifttrack") {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-card", s.tile, className)}
        aria-hidden
      >
        <img src={iconUrl} alt="" className={s.logo} />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground", s.tile, className)}
      aria-hidden
    >
      <Truck className={cn(s.logo, "p-0.5")} />
    </span>
  );
}

/** Logo + name, for read-only detail views. */
export function CarrierBadge({ carrier }: { carrier?: string | null }) {
  const c = getCarrier(carrier);
  return (
    <span className="inline-flex items-center gap-2">
      <CarrierLogo carrier={c.id} size="sm" />
      <span className="font-semibold">{c.name}</span>
    </span>
  );
}

export function CarrierPicker({
  value,
  onChange,
}: {
  value: CarrierId;
  onChange: (id: CarrierId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Shipping carrier" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARRIERS.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.id)}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-all",
              "hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary ring-2 ring-primary/30" : "border-border",
            )}
          >
            <CarrierLogo carrier={c.id} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{c.tagline}</span>
            </span>
            {active && (
              <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
