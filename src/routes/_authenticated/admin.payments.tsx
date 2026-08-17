import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNaira } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

function AdminPayments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, plans(name), profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
    if (!path) return toast.error("No receipt uploaded.");
    const key = path.includes("/receipts/") ? path.split("/receipts/")[1] : path;
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(key, 300);
    if (error || !data) return toast.error("Could not open receipt.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const rows = (data ?? []).filter((p) => filter === "all" || p.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Payment Verification</h1>
        <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
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
            const customer = p.profiles as { full_name: string; email: string } | null;
            return (
              <div key={p.id} className="surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold">
                      {customer?.full_name || "Unknown user"}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        {customer?.email}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(p.plans as { name: string } | null)?.name ?? "—"} ·{" "}
                      {formatNaira(p.amount)} · Ref{" "}
                      <span className="font-mono">{p.reference}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(p.created_at)} · Paid {formatDate(p.payment_date)}
                    </p>
                    {p.admin_note && (
                      <p className="text-xs text-destructive">Note: {p.admin_note}</p>
                    )}
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
