import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Users, ShieldCheck, ShieldOff, Ban, CircleCheck, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, SUBSCRIPTION_LABEL } from "@/lib/swift";
import { useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const TABS = ["all", "active", "suspended", "admins"] as const;
type Tab = (typeof TABS)[number];

function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useSession();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [quotaFor, setQuotaFor] = useState<{ id: string; name: string; total: number } | null>(null);
  const [quotaValue, setQuotaValue] = useState("0");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*, plans(name)").order("created_at", { ascending: false }),
        supabase.rpc("admin_list_roles"),
      ]);
      if (profiles.error) throw profiles.error;
      const adminIds = new Set(
        (roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );
      return (profiles.data ?? []).map((p) => ({ ...p, isAdmin: adminIds.has(p.id) }));
    },
  });

  async function run(key: string, fn: () => Promise<{ error: unknown }>, ok: string) {
    setBusy(key);
    const { error } = await fn();
    setBusy(null);
    if (error) {
      toast.error((error as { message?: string })?.message ?? "Action failed.");
      return;
    }
    toast.success(ok);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  const term = q.trim().toLowerCase();
  const rows = (data ?? []).filter((u) => {
    const matches =
      !term ||
      (u.full_name ?? "").toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term);
    const inTab =
      tab === "all" ||
      (tab === "admins" && u.isAdmin) ||
      (tab === "active" && u.account_status === "active") ||
      (tab === "suspended" && u.account_status === "suspended");
    return matches && inTab;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage access, admin rights and tracking-code allowances.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          className="max-w-xs"
        />
      </div>

      <div className="flex w-fit gap-1.5 rounded-xl border border-border bg-card p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeletons rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search term." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["User", "Plan", "Subscription", "Codes", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const suspended = u.account_status === "suspended";
                return (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                          {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="flex items-center gap-2 font-medium">
                            {u.full_name || "Unnamed"}
                            {u.isAdmin && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{(u.plans as { name: string } | null)?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {SUBSCRIPTION_LABEL[u.subscription_status] ?? u.subscription_status}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {u.codes_used}/{u.codes_total}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                          suspended
                            ? "border-destructive/20 bg-destructive/10 text-destructive"
                            : "border-success/20 bg-success/10 text-success"
                        }`}
                      >
                        {u.account_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `q-${u.id}`}
                          onClick={() => {
                            setQuotaFor({
                              id: u.id,
                              name: u.full_name || u.email,
                              total: u.codes_total,
                            });
                            setQuotaValue(String(u.codes_total));
                          }}
                        >
                          <Package className="mr-1 h-3.5 w-3.5" />
                          Codes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `s-${u.id}`}
                          onClick={() =>
                            run(
                              `s-${u.id}`,
                              () =>
                                supabase.rpc("admin_set_account_status", {
                                  _user_id: u.id,
                                  _status: suspended ? "active" : "suspended",
                                }),
                              suspended ? "Account reactivated." : "Account suspended.",
                            )
                          }
                        >
                          {suspended ? (
                            <>
                              <CircleCheck className="mr-1 h-3.5 w-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <Ban className="mr-1 h-3.5 w-3.5" /> Suspend
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `r-${u.id}` || u.id === user?.id}
                          onClick={() =>
                            run(
                              `r-${u.id}`,
                              () =>
                                supabase.rpc("admin_set_admin_role", {
                                  _user_id: u.id,
                                  _grant: !u.isAdmin,
                                }),
                              u.isAdmin ? "Admin access removed." : "Admin access granted.",
                            )
                          }
                        >
                          {u.isAdmin ? (
                            <>
                              <ShieldOff className="mr-1 h-3.5 w-3.5" /> Revoke
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Make Admin
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!quotaFor} onOpenChange={(o) => !o && setQuotaFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tracking code allowance</DialogTitle>
            <DialogDescription>
              Set the total number of tracking codes available to {quotaFor?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="codes_total">Total codes</Label>
            <Input
              id="codes_total"
              type="number"
              min={0}
              value={quotaValue}
              onChange={(e) => setQuotaValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!quotaFor) return;
                const id = quotaFor.id;
                setQuotaFor(null);
                await run(
                  `q-${id}`,
                  () =>
                    supabase.rpc("admin_set_codes", {
                      _user_id: id,
                      _codes_total: Number(quotaValue) || 0,
                    }),
                  "Allowance updated.",
                );
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
