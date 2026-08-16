import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/dashboard/messages")({
  component: Messages,
});

function Messages() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["my-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, tracking_codes(id, code, package_name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Messages</h1>
      {isLoading ? (
        <Skeletons rows={3} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Messages from your package recipients will appear here."
        />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((m) => {
            const tc = m.tracking_codes as { id: string; code: string; package_name: string | null } | null;
            return (
              <div key={m.id} className="surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {m.sender_name}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {m.sender_type === "owner" ? "· you" : "· recipient"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
                </div>
                <p className="mt-2 text-sm">{m.body}</p>
                {tc && (
                  <Link to="/dashboard/tracking/$id" params={{ id: tc.id }} className="mt-3 inline-block">
                    <Button size="sm" variant="outline">
                      {tc.code}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
