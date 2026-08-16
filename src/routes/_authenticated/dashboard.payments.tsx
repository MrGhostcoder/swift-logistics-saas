import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { formatCurrency, formatDate, PAYMENT_LABEL, paymentClass } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/dashboard/payments")({
  component: Payments,
});

function Payments() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, plans(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Payment History</h1>
        <Link to="/pricing">
          <Button variant="outline">Buy New Plan</Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeletons rows={3} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Choose a plan and upload your bank transfer receipt to get started."
          action={
            <Link to="/pricing">
              <Button>View Plans</Button>
            </Link>
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Plan", "Amount", "Reference", "Status", "Submitted"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {(p.plans as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.reference ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentClass(p.status)}`}
                    >
                      {PAYMENT_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
