import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutSettings, useSession } from "@/hooks/useAuth";
import { formatDate, formatUsdt } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/dashboard/wallet")({
  component: WalletPage,
});

const STATUS: Record<string, string> = {
  pending: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
};
function statusClass(s: string) {
  if (s === "approved") return "bg-success/10 text-success";
  if (s === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-primary/10 text-primary";
}

function WalletPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: settings } = useCheckoutSettings();
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");

  const balance = useQuery({
    queryKey: ["wallet-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_wallet_balance");
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
  const history = useQuery({
    queryKey: ["wallet-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*, plans(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const plans = useQuery({
    queryKey: ["plans-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price, code_limit")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const topup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("request_wallet_topup", {
        _amount: Number(amount),
        _tx_hash: txid.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Top-up submitted. It will be added once an admin approves it.");
      setAmount("");
      setTxid("");
      qc.invalidateQueries({ queryKey: ["wallet-history"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit top-up."),
  });

  const buy = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.rpc("request_wallet_purchase", { _plan_id: planId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase requested. Your plan activates once an admin approves it.");
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      qc.invalidateQueries({ queryKey: ["wallet-history"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not buy this plan."),
  });

  const address = settings?.["usdt_address"] || "";
  const bal = balance.data ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Wallet</h1>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface flex flex-col justify-between bg-gradient-to-br from-primary/15 to-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" /> Available balance
          </div>
          <p className="mt-3 text-4xl font-extrabold">{formatUsdt(bal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Top-ups and purchases are confirmed by our team.
          </p>
        </div>

        <form
          className="surface space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            topup.mutate();
          }}
        >
          <h2 className="font-bold">Top up with USDT</h2>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Send USDT on {settings?.["usdt_network"] || "TRC20 (Tron)"} to:
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="break-all font-mono text-xs">{address || "—"}</span>
              {address && (
                <button
                  type="button"
                  aria-label="Copy address"
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    toast.success("Address copied");
                  }}
                >
                  <Copy className="h-4 w-4 text-primary" />
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amt">Amount (USDT)</Label>
              <Input
                id="amt"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="tx">Transaction ID (TXID)</Label>
              <Input
                id="tx"
                required
                minLength={20}
                maxLength={120}
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                className="mt-1.5 font-mono"
              />
            </div>
          </div>
          <Button disabled={topup.isPending}>
            {topup.isPending ? "Submitting…" : "Submit Top-up"}
          </Button>
        </form>
      </div>

      <section className="surface p-6">
        <h2 className="font-bold">Buy a plan with your balance</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(plans.data ?? []).map((p) => (
            <div key={p.id} className="rounded-2xl border border-border p-4">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatUsdt(p.price)} · {p.code_limit} codes
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                disabled={bal < Number(p.price) || buy.isPending}
                onClick={() => buy.mutate(p.id)}
              >
                {bal < Number(p.price) ? "Insufficient balance" : "Buy with wallet"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">Transactions</h2>
        {history.isLoading ? (
          <Skeletons rows={3} />
        ) : (history.data ?? []).length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions yet" description="Your top-ups and purchases will appear here." />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Type", "Amount", "Details", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(history.data ?? []).map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{t.kind === "topup" ? "Top-up" : "Plan purchase"}</td>
                    <td className={`px-4 py-3 font-semibold ${t.kind === "topup" ? "text-success" : ""}`}>
                      {t.kind === "topup" ? "+" : "−"}
                      {formatUsdt(t.amount)}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs">
                      {t.kind === "topup" ? t.tx_hash : (t.plans as { name: string } | null)?.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(t.status)}`}>
                        {STATUS[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
