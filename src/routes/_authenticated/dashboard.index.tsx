import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, MapPinCheck, Info, MapPin, Copy, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useAuth";
import { formatDate, formatUsdt, trackingUrl, SUBSCRIPTION_LABEL } from "@/lib/swift";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const qc = useQueryClient();

  const { data: codes, isLoading } = useQuery({
    queryKey: ["my-codes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracking_codes")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remaining = (profile?.codes_total ?? 0) - (profile?.codes_used ?? 0);
  const total = codes?.length ?? 0;
  const inTransit = (codes ?? []).filter((c) =>
    ["in_transit", "out_for_delivery", "picked_up"].includes(c.status),
  ).length;
  const delivered = (codes ?? []).filter((c) => c.status === "delivered").length;

  const planLabel = profile?.plans
    ? `${(profile.plans as { name: string }).name} Plan`
    : SUBSCRIPTION_LABEL[profile?.subscription_status ?? "NO_PLAN"];

  async function remove(id: string) {
    const { error } = await supabase.from("tracking_codes").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete this tracking code.");
      return;
    }
    toast.success("Tracking code deleted.");
    qc.invalidateQueries({ queryKey: ["my-codes"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profileLoading ? "Loading…" : `${planLabel} · ${Math.max(remaining, 0)} codes remaining`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/pricing">
            <Button variant="outline">Buy New Plan</Button>
          </Link>
          <Link to="/dashboard/tracking/new">
            <Button disabled={remaining <= 0}>+ New Tracking Code</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Package} label="Total Packages" value={total} tone="text-primary" />
        <Stat icon={Truck} label="In Transit" value={inTransit} tone="text-foreground" />
        <Stat icon={MapPinCheck} label="Delivered" value={delivered} tone="text-success" />
        <Stat
          icon={Info}
          label="Codes Remaining"
          value={Math.max(remaining, 0)}
          tone="text-telegram"
        />
      </div>

      <WalletOverview />

      <div>
        <h2 className="mb-3 text-lg font-bold">Your Tracking Codes</h2>
        {isLoading ? (
          <Skeletons rows={3} />
        ) : total === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No tracking codes yet. Create your first one!"
            description={
              remaining > 0
                ? "Create a shipment to generate a public tracking link."
                : "You have no codes remaining. Buy a plan to continue."
            }
            action={
              remaining > 0 ? (
                <Link to="/dashboard/tracking/new">
                  <Button>+ New Tracking Code</Button>
                </Link>
              ) : (
                <Link to="/pricing">
                  <Button>Buy New Plan</Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {[
                    "Tracking Code",
                    "Package",
                    "Customer",
                    "Status",
                    "Created",
                    "Last Updated",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(codes ?? []).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                    <td className="px-4 py-3">{c.package_name || "—"}</td>
                    <td className="px-4 py-3">{c.recipient_name || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link to="/dashboard/tracking/$id" params={{ id: c.id }}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(trackingUrl(c.code));
                            toast.success("Tracking link copied.");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => remove(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  value: number;
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

function WalletOverview() {
  const { user } = useSession();
  const { data: balance } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_wallet_balance");
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
  const { data: wallet } = useQuery({
    queryKey: ["wallet-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("id, kind, amount, status, created_at, plans(name, code_limit)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: payments } = useQuery({
    queryKey: ["my-approved-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, created_at, plans(name, code_limit)")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pending = (wallet ?? []).filter((t) => t.kind === "topup" && t.status === "pending");
  type P = { name: string; code_limit: number } | null;
  const plans = [
    ...(wallet ?? [])
      .filter((t) => t.kind === "purchase" && t.status === "approved")
      .map((t) => ({ id: t.id, plan: t.plans as P, amount: t.amount, at: t.created_at, via: "Wallet" })),
    ...(payments ?? []).map((p) => ({ id: p.id, plan: p.plans as P, amount: p.amount, at: p.created_at, via: "USDT" })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="surface p-5">
        <p className="text-sm font-medium text-muted-foreground">Wallet balance</p>
        <p className="mt-3 text-3xl font-extrabold">{formatUsdt(balance ?? 0)}</p>
        <Link to="/dashboard/wallet">
          <Button size="sm" variant="outline" className="mt-4">Top up wallet</Button>
        </Link>
      </div>
      <div className="surface p-5">
        <p className="text-sm font-medium text-muted-foreground">Pending top-ups</p>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending top-ups.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {pending.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span className="font-semibold">{formatUsdt(t.amount)}</span>
                <span className="text-muted-foreground">{formatDate(t.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="surface p-5">
        <p className="text-sm font-medium text-muted-foreground">Approved plans</p>
        {plans.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No approved plans yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {plans.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="font-semibold">
                  {p.plan?.name ?? "Plan"} <span className="font-normal text-muted-foreground">· {p.plan?.code_limit ?? 0} codes · {p.via}</span>
                </span>
                <span className="text-muted-foreground">{formatDate(p.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
