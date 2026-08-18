import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Package, Receipt, Wallet, Truck, MapPinCheck } from "lucide-react";
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
  const revenue = data.payments
    .filter((p) => p.status === "approved")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const inTransit = data.codes.filter((c) =>
    ["picked_up", "in_transit", "out_for_delivery"].includes(c.status),
  ).length;
  const delivered = data.codes.filter((c) => c.status === "delivered").length;

  const recentCodes = [...data.codes]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide activity across users, shipments and payments.
          </p>
        </div>
        <Link to="/admin/payments">
          <Button>Verify Payments ({pendingPayments.length})</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Users} label="Total Users" value={String(data.profiles.length)} tone="text-primary" />
        <Stat icon={Package} label="Tracking Codes" value={String(data.codes.length)} tone="text-foreground" />
        <Stat icon={Receipt} label="Pending Payments" value={String(pendingPayments.length)} tone="text-primary" />
        <Stat icon={Wallet} label="Approved Revenue" value={formatUsdt(revenue)} tone="text-success" />
        <Stat icon={Truck} label="In Transit" value={String(inTransit)} tone="text-telegram" />
        <Stat icon={MapPinCheck} label="Delivered" value={String(delivered)} tone="text-success" />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">Recent Shipments</h2>
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
                  <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                    No shipments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
