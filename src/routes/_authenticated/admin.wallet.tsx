import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatUsdt } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/wallet")({
  component: AdminWallet,
});

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

function AdminWallet() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [busyAll, setBusyAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wallet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*, plans(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((t) => t.user_id)));
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((u) => [u.id, u]));
      return (data ?? []).map((t) => ({ ...t, customer: byId.get(t.user_id) ?? null }));
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("admin_review_wallet_tx", {
        _id: id,
        _approve: approve,
        _note: approve ? "" : "Rejected by admin",
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.approve ? "Transaction approved." : "Transaction rejected.");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || "Could not update transaction."),
  });

  const rows = (data ?? []).filter((t) => filter === "all" || t.status === filter);
  const pending = (data ?? []).filter((t) => t.status === "pending");

  async function approveAll() {
    setBusyAll(true);
    let ok = 0;
    for (const t of pending) {
      const { error } = await supabase.rpc("admin_review_wallet_tx", { _id: t.id, _approve: true });
      if (!error) ok++;
    }
    setBusyAll(false);
    toast.success(`Approved ${ok} of ${pending.length} transactions.`);
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Wallet Transactions</h1>
        <Button onClick={approveAll} disabled={!pending.length || busyAll}>
          <CheckCheck className="mr-1.5 h-4 w-4" />
          {busyAll ? "Approving…" : `Approve all pending (${pending.length})`}
        </Button>
      </div>
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeletons rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="Nothing here" description="No wallet transactions match this filter." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Customer", "Type", "Amount", "Details", "Status", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.customer?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{t.customer?.email}</p>
                  </td>
                  <td className="px-4 py-3">{t.kind === "topup" ? "Top-up" : "Plan purchase"}</td>
                  <td className="px-4 py-3 font-semibold">{formatUsdt(t.amount)}</td>
                  <td className="max-w-[200px] px-4 py-3 font-mono text-xs">
                    {t.kind === "topup" ? (
                      <a
                        className="break-all text-primary underline"
                        href={`https://tronscan.org/#/transaction/${t.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.tx_hash}
                      </a>
                    ) : (
                      (t.plans as { name: string } | null)?.name
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{t.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3">
                    {t.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => review.mutate({ id: t.id, approve: true })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => review.mutate({ id: t.id, approve: false })}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
