import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, SHIP_STATUSES, STATUS_LABEL, type ShipStatus } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/tracking")({
  component: AdminTracking,
});

function AdminTracking() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracking_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: ShipStatus) {
    const { error } = await supabase.from("tracking_codes").update({ status }).eq("id", id);
    if (error) {
      toast.error("Could not update status.");
      return;
    }
    toast.success("Status updated.");
    qc.invalidateQueries({ queryKey: ["admin-tracking"] });
  }

  const term = q.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (c) =>
      !term ||
      c.code.toLowerCase().includes(term) ||
      (c.recipient_name ?? "").toLowerCase().includes(term) ||
      (c.package_name ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">All Tracking Codes</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, package or recipient"
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <Skeletons rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Package} title="No tracking codes" description="Nothing matches your search." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Code", "Package", "Recipient", "Route", "Status", "Created", "Update"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.package_name || "—"}</td>
                  <td className="px-4 py-3">{c.recipient_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(c.origin || "—") + " → " + (c.destination || "—")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => setStatus(c.id, e.target.value as ShipStatus)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      {SHIP_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
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
