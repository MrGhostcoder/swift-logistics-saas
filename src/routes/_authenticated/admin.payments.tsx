import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Receipt, Wallet, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatUsdt } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

const FILTERS = ["pending", "approved", "rejected", "all"] as const;
type Filter = (typeof FILTERS)[number];

function AdminPayments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, plans(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((p) => p.user_id)));
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((u) => [u.id, u]));
      return (data ?? []).map((p) => ({ ...p, customer: byId.get(p.user_id) ?? null }));
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("approve_payment", { _payment_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment approved and plan activated.");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not approve this payment."),
  });

  const reject = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase.rpc("reject_payment", { _payment_id: id, _note: note });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment rejected.");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not reject this payment."),
  });

  async function viewReceipt(path: string | null) {
    if (!path) {
      toast.error("No receipt uploaded.");
      return;
    }
    const key = path.includes("/receipts/") ? (path.split("/receipts/")[1] ?? path) : path;
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(key, 300);
    if (error || !data) {
      toast.error("Could not open receipt.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const all = data ?? [];
  const term = q.trim().toLowerCase();
  const rows = all.filter((p) => {
    const inFilter = filter === "all" || p.status === filter;
    const matches =
      !term ||
      (p.customer?.full_name ?? "").toLowerCase().includes(term) ||
      (p.customer?.email ?? "").toLowerCase().includes(term) ||
      p.reference.toLowerCase().includes(term);
    return inFilter && matches;
  });

  const counts = {
    pending: all.filter((p) => p.status === "pending").length,
    approved: all.filter((p) => p.status === "approved").length,
    rejected: all.filter((p) => p.status === "rejected").length,
    all: all.length,
  };
  const pendingRows = rows.filter((p) => p.status === "pending");
  const pendingRevenue = all
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function bulkApprove() {
    setBulkBusy(true);
    let ok = 0;
    for (const id of selected) {
      const { error } = await supabase.rpc("approve_payment", { _payment_id: id });
      if (!error) ok += 1;
    }
    setBulkBusy(false);
    setSelected([]);
    qc.invalidateQueries();
    toast.success(`${ok} payment${ok === 1 ? "" : "s"} approved.`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Payment Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.pending} awaiting review · {formatUsdt(pendingRevenue)} pending value
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customer, email or reference"
          className="max-w-xs"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSelected([]);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {pendingRows.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={selected.length > 0 && selected.length === pendingRows.length}
                onCheckedChange={(v) =>
                  setSelected(v === true ? pendingRows.map((p) => p.id) : [])
                }
              />
              Select all pending
            </label>
            <Button size="sm" disabled={selected.length === 0 || bulkBusy} onClick={bulkApprove}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              {bulkBusy ? "Approving…" : `Approve selected (${selected.length})`}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeletons rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nothing here"
          description={`No ${filter === "all" ? "" : filter} payments to show.`}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const customer = p.customer;
            return (
              <div key={p.id} className="surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {p.status === "pending" && (
                      <Checkbox
                        className="mt-1"
                        checked={selected.includes(p.id)}
                        onCheckedChange={() => toggle(p.id)}
                        aria-label="Select payment"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">
                        {customer?.full_name || "Unknown user"}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {customer?.email}
                        </span>
                      </p>
                      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        {(p.plans as { name: string } | null)?.name ?? "—"} · {formatUsdt(p.amount)} ·
                        Ref <span className="font-mono">{p.reference}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(p.created_at)} · Paid {formatDate(p.payment_date)}
                      </p>
                      {p.admin_note && <p className="text-xs text-destructive">Note: {p.admin_note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewReceipt(p.receipt_url)}>
                      View Receipt
                    </Button>
                    {p.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate(p.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reject.isPending}
                          onClick={() => {
                            const note = window.prompt("Reason for rejection?") ?? "";
                            if (note !== null) reject.mutate({ id: p.id, note });
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          p.status === "approved"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {p.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
