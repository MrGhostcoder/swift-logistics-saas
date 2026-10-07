import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, SHIP_STATUSES, STATUS_LABEL } from "@/lib/swift";
import icon3dPackage from "@/assets/icon3d-package.png";
import icon3dTruck from "@/assets/icon3d-truck.png";
import icon3dDelivered from "@/assets/icon3d-delivered.png";
import icon3dAlert from "@/assets/icon3d-alert.png";

export const Route = createFileRoute("/_authenticated/admin/shipments")({
  component: ShipmentBoard,
});

const PROGRESS: Record<string, number> = {
  pending: 0.05,
  picked_up: 0.25,
  in_transit: 0.55,
  out_for_delivery: 0.85,
  delivered: 1,
  exception: 0.5,
};

type Shipment = {
  id: string;
  code: string;
  package_name: string | null;
  recipient_name: string | null;
  origin: string | null;
  destination: string | null;
  current_location: string | null;
  estimated_delivery: string | null;
  status: string;
  updated_at: string;
};

function ShipmentBoard() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("active");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracking_codes")
        .select(
          "id, code, package_name, recipient_name, origin, destination, current_location, estimated_delivery, status, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Shipment[];
    },
  });

  // Live refresh when any shipment changes
  useEffect(() => {
    const ch = supabase
      .channel("admin-shipments")
      .on("postgres_changes", { event: "*", schema: "public", table: "tracking_codes" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-shipments"] }),
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tracking_events" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-shipment-events"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const all = data ?? [];
  const counts = useMemo(() => {
    const c = { total: all.length, moving: 0, delivered: 0, exception: 0 };
    all.forEach((s) => {
      if (s.status === "delivered") c.delivered++;
      else if (s.status === "exception") c.exception++;
      else c.moving++;
    });
    return c;
  }, [all]);

  const rows = all.filter((s) => {
    if (filter === "active" && (s.status === "delivered")) return false;
    if (filter !== "active" && filter !== "all" && s.status !== filter) return false;
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return [s.code, s.package_name, s.recipient_name, s.origin, s.destination, s.current_location]
      .some((v) => (v ?? "").toLowerCase().includes(t));
  });

  const current = all.find((s) => s.id === selected) ?? rows[0] ?? null;

  const stats = [
    { label: "All shipments", value: counts.total, img: icon3dPackage, key: "all" },
    { label: "On the move", value: counts.moving, img: icon3dTruck, key: "active" },
    { label: "Delivered", value: counts.delivered, img: icon3dDelivered, key: "delivered" },
    { label: "Exceptions", value: counts.exception, img: icon3dAlert, key: "exception" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Shipment Control Center</h1>
          <p className="text-sm text-muted-foreground">Every package, live — no need to open the customer page.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`surface group flex items-center justify-between p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] ${filter === s.key ? "ring-2 ring-primary" : ""}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3xl font-extrabold">{s.value}</p>
            </div>
            <img src={s.img} alt="" width={816} height={816} className="h-16 w-16 object-contain drop-shadow-lg transition-transform group-hover:scale-110" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search code, recipient, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {["active", "all", ...SHIP_STATUSES].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >
              {f === "active" ? "Active" : f === "all" ? "All" : STATUS_LABEL[f as keyof typeof STATUS_LABEL]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeletons rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Package} title="No shipments" description="Nothing matches this view." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="surface map-grid relative overflow-hidden p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <MapPin className="h-4 w-4 text-primary" /> Live Route Board
            </h2>
            <ul className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {rows.map((s) => (
                <RouteLane key={s.id} s={s} active={current?.id === s.id} onClick={() => setSelected(s.id)} />
              ))}
            </ul>
          </div>
          {current && <ShipmentPanel s={current} />}
        </div>
      )}
    </div>
  );
}

function RouteLane({ s, active, onClick }: { s: Shipment; active: boolean; onClick: () => void }) {
  const p = PROGRESS[s.status] ?? 0.3;
  const moving = s.status !== "delivered" && s.status !== "exception";
  const color =
    s.status === "delivered" ? "bg-success" : s.status === "exception" ? "bg-destructive" : "bg-primary";
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full rounded-2xl border bg-card/90 p-3 text-left backdrop-blur transition-all hover:border-primary/50 ${active ? "border-primary shadow-[var(--shadow-card)]" : "border-border"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold">{s.code}</span>
          <StatusBadge status={s.status} />
        </div>
        <div className="relative mt-3 h-6">
          <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-border" />
          <div className={`absolute left-2 top-1/2 h-1 -translate-y-1/2 rounded-full ${color} transition-all duration-700`} style={{ width: `calc((100% - 1rem) * ${p})` }} />
          <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-primary bg-card" />
          <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-foreground/40 bg-card" />
          <span
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
            style={{ left: `calc(0.5rem + (100% - 1rem) * ${p})` }}
          >
            {moving && <span className={`absolute inset-0 animate-ping rounded-full ${color} opacity-60`} />}
            <span className={`relative block h-4 w-4 rounded-full ${color} ring-4 ring-card`} />
          </span>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span className="truncate">{s.origin || "Origin"}</span>
          <span className="truncate px-2 font-medium text-foreground">{s.current_location || ""}</span>
          <span className="truncate text-right">{s.destination || "Destination"}</span>
        </div>
      </button>
    </li>
  );
}

function ShipmentPanel({ s }: { s: Shipment }) {
  const { data: events } = useQuery({
    queryKey: ["admin-shipment-events", s.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracking_events")
        .select("id, title, location, note, status, occurred_at")
        .eq("tracking_code_id", s.id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <aside className="surface h-fit p-5 lg:sticky lg:top-20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold">{s.code}</p>
          <p className="text-sm text-muted-foreground">{s.package_name || "Package"}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info k="Recipient" v={s.recipient_name} />
        <Info k="Current location" v={s.current_location} />
        <Info k="From" v={s.origin} />
        <Info k="To" v={s.destination} />
        <Info k="Est. delivery" v={formatDate(s.estimated_delivery)} />
        <Info k="Last update" v={formatDate(s.updated_at)} />
      </dl>
      <h3 className="mt-5 text-sm font-bold">Timeline</h3>
      <ol className="mt-3 max-h-80 space-y-3 overflow-y-auto">
        {(events ?? []).map((e, i) => (
          <li key={e.id} className="flex gap-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-primary animate-pulse" : "bg-border"}`} />
            <div>
              <p className="text-sm font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(e.occurred_at)}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.note && <p className="mt-0.5 text-xs text-muted-foreground">{e.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      <Link to="/admin/tracking" className="mt-4 inline-block text-sm font-semibold text-primary">
        Manage shipments →
      </Link>
    </aside>
  );
}

function Info({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="truncate font-medium">{v || "—"}</dd>
    </div>
  );
}
