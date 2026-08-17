import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, SUBSCRIPTION_LABEL } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, plans(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const term = q.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (u) =>
      !term ||
      (u.full_name ?? "").toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Users</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <Skeletons rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search term." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Name", "Email", "Phone", "Plan", "Subscription", "Codes", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="px-4 py-3">{(u.plans as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {SUBSCRIPTION_LABEL[u.subscription_status] ?? u.subscription_status}
                  </td>
                  <td className="px-4 py-3">
                    {u.codes_used}/{u.codes_total}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
