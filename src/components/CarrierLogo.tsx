import { Check, Search, Truck } from "lucide-react";
import { useState } from "react";

import iconUrl from "@/assets/swifttrack-icon.png";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { getCarrier, searchCarriers, type CarrierId } from "@/lib/carriers";

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

  if (c.path) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border border-border",
          s.tile,
          className,
        )}
        style={{ backgroundColor: `var(--carrier-${c.id}-bg)` }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className={s.logo} style={{ fill: `var(--carrier-${c.id}-fg)` }}>
          <path d={c.path} />
        </svg>
      </span>
    );
  }

  if (c.mark) {
    const len = [...c.mark].length;
    const fontSize = len <= 1 ? 15 : len === 2 ? 11 : len === 3 ? 8.5 : 7.5;
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border border-border",
          s.tile,
          className,
        )}
        style={{ backgroundColor: `var(--carrier-${c.id}-bg)` }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className={s.logo}>
          <text
            x="12"
            y="12.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight={800}
            letterSpacing={len > 2 ? -0.3 : 0}
            style={{ fill: `var(--carrier-${c.id}-fg)`, fontFamily: "inherit" }}
          >
            {c.mark}
          </text>
        </svg>
      </span>
    );
  }

  if (c.id === "swifttrack") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-card",
          s.tile,
          className,
        )}
        aria-hidden
      >
        <img src={iconUrl} alt="" className={s.logo} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground",
        s.tile,
        className,
      )}
      aria-hidden
    >
      <Truck className={cn(s.logo, "p-0.5")} />
    </span>
  );
}

/** Logo + name, for read-only detail views. */
export function CarrierBadge({ carrier }: { carrier?: string | null | undefined }) {
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
  const [query, setQuery] = useState("");
  const results = searchCarriers(query);
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search carriers or countries"
          aria-label="Search carriers"
          className="pl-9"
        />
      </div>
      <div
        role="radiogroup"
        aria-label="Shipping carrier"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {results.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
            No carrier matches — pick "Other" for local or private couriers.
          </p>
        )}
        {results.map((c) => {
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
    </div>
  );
}
