import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Package,
  Receipt,
  Wallet,
  Truck,
  MapPinCheck,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatUsdt } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [profiles, codes, payments] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, subscription_status, created_at"),
        supabase.from("tracking_codes").select("id, code, status, package_name, created_at"),
        supabase.from("payments").select("id, amount, status, created_at, user_id, plans(name)"),
      ]);
      if (profiles.error) throw profiles.error;
      if (codes.error) throw codes.error;
      if (payments.error) throw payments.error;
      return {
        profiles: profiles.data ?? [],
        codes: codes.data ?? [],
        payments: payments.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <Skeletons rows={5} />;

  const pendingPayments = data.payments.filter((p) => p.status === "pending");
  const approved = data.payments.filter((p) => p.status === "approved");
  const revenue = approved.reduce((s, p) => s + Number(p.amount || 0), 0);
  const inTransit = data.codes.filter((c) =>
    ["picked_up", "in_transit", "out_for_delivery"].includes(c.status),
  ).length;
  const delivered = data.codes.filter((c) => c.status === "delivered").length;

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const series = days.map((d) => {
    const next = new Date(d.getTime() + 86400000);
    const within = (v: string) => {
      const t = new Date(v).getTime();
      return t >= d.getTime() && t < next.getTime();
    };
    return {
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      shipments: data.codes.filter((c) => within(c.created_at)).length,
      revenue: approved
        .filter((p) => within(p.created_at))
        .reduce((s, p) => s + Number(p.amount || 0), 0),
    };
  });
  const last7 = series.slice(7).reduce((s, r) => s + r.shipments, 0);
  const prev7 = series.slice(0, 7).reduce((s, r) => s + r.shipments, 0);
  const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

  const recentCodes = [...data.codes]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);
  const recentUsers = [...data.profiles]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide activity across users, shipments and payments.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/tracking">
            <Button variant="outline">Manage Shipments</Button>
          </Link>
          <Link to="/admin/payments">
            <Button>Verify Payments ({pendingPayments.length})</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Users} label="Total Users" value={String(data.profiles.length)} tone="text-primary" />
        <Stat icon={Package} label="Tracking Codes" value={String(data.codes.length)} tone="text-foreground" />
        <Stat icon={Receipt} label="Pending Payments" value={String(pendingPayments.length)} tone="text-primary" />
        <Stat icon={Wallet} label="Approved Revenue" value={formatUsdt(revenue)} tone="text-success" />
        <Stat icon={Truck} label="In Transit" value={String(inTransit)} tone="text-telegram" />
        <Stat icon={MapPinCheck} label="Delivered" value={String(delivered)} tone="text-success" />
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Shipments · last 14 days</h2>
            <p className="text-sm text-muted-foreground">New tracking codes created per day.</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              delta >= 0
                ? "border-success/20 bg-success/10 text-success"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {delta >= 0 ? "+" : ""}
            {delta}% vs previous week
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="shipFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="shipments"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#shipFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Shipments</h2>
            <Link
              to="/admin/tracking"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Code", "Package", "Status", "Created"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCodes.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                    <td className="px-4 py-3">{c.package_name || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
                {recentCodes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No shipments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Newest Users</h2>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="surface divide-y divide-border">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.full_name || "Unnamed"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No users yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="surface flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
      </div>
    </div>
  );
}
