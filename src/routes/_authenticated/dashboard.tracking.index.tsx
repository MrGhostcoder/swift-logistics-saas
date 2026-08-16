import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Copy, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useAuth";
import { formatDate, trackingUrl } from "@/lib/swift";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/tracking/")({
  component: TrackingList,
});

function TrackingList() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const remaining = (profile?.codes_total ?? 0) - (profile?.codes_used ?? 0);

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Your Tracking Codes</h1>
        <Link to="/dashboard/tracking/new">
          <Button disabled={remaining <= 0}>+ New Tracking Code</Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeletons rows={4} />
      ) : (codes ?? []).length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No tracking codes yet. Create your first one!"
          action={
            <Link to="/dashboard/tracking/new">
              <Button disabled={remaining <= 0}>+ New Tracking Code</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(codes ?? []).map((c) => (
            <div key={c.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-bold">{c.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.package_name} · {c.recipient_name}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Created {formatDate(c.created_at)} · Updated {formatDate(c.updated_at)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/dashboard/tracking/$id" params={{ id: c.id }}>
                  <Button size="sm" variant="outline">
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingUrl(c.code));
                    toast.success("Tracking link copied.");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Link
                </Button>
                <a href={trackingUrl(c.code)} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost">
                    Public page
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => remove(c.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
