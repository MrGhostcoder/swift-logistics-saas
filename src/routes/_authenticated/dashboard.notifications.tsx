import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  component: Notifications,
});

function Notifications() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Notifications</h1>
        <Button variant="outline" onClick={markAllRead}>
          Mark all as read
        </Button>
      </div>
      {isLoading ? (
        <Skeletons rows={3} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((n) => (
            <div
              key={n.id}
              className={`surface p-4 ${n.read ? "" : "border-primary/40 bg-primary/5"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
              </div>
              {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
