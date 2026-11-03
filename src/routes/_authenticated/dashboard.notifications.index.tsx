import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Circle, CircleCheck, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/swift";
import {
  deleteNotification,
  fetchUnreadCount,
  kindMeta,
  markAllRead,
  notifKeys,
  safeLink,
  setRead,
  timeAgo,
  type AppNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/notifications/")({
  head: () => ({
    meta: [
      { title: "Notifications — SwiftTrack" },
      { name: "description", content: "Your SwiftTrack shipment and account notification history." },
      { property: "og:title", content: "Notifications — SwiftTrack" },
      { property: "og:description", content: "Your SwiftTrack shipment and account notification history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

const PAGE = 20;
const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "shipment", label: "Shipments" },
  { id: "account", label: "Account" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

function Notifications() {
  const { user } = useSession();
  const uid = user?.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const { data: unread = 0 } = useQuery({
    queryKey: notifKeys.unread(uid),
    enabled: !!uid,
    queryFn: () => fetchUnreadCount(uid!),
  });

  const list = useInfiniteQuery({
    queryKey: notifKeys.list(uid, filter),
    enabled: !!uid,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE - 1);
      if (filter === "unread") q = q.eq("read", false);
      if (filter === "shipment") q = q.eq("kind", "shipment");
      if (filter === "account") q = q.neq("kind", "shipment");
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    getNextPageParam: (last, pages) => (last.length < PAGE ? undefined : pages.length * PAGE),
  });
  const items = list.data?.pages.flat() ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey: notifKeys.all });

  async function run(fn: () => Promise<void>, fail: string) {
    try {
      await fn();
      refresh();
    } catch {
      toast.error(fail);
    }
  }

  async function open(n: AppNotification) {
    if (!n.read) await run(() => setRead([n.id]), "Could not update notification.");
    const link = safeLink(n.link);
    if (link) navigate({ to: link });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up"} · updates arrive live
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/notifications/settings">
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" /> Settings
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2"
            disabled={unread === 0}
            onClick={() => run(() => markAllRead(uid!), "Could not mark notifications as read.")}
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
      </div>

      <div role="tablist" aria-label="Filter notifications" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {f.id === "unread" && unread > 0 ? ` (${unread})` : ""}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <Skeletons rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description="Shipment status changes and account updates will show up here the moment they happen."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const meta = kindMeta(n.kind);
            const Icon = meta.icon;
            const link = safeLink(n.link);
            return (
              <li
                key={n.id}
                className={cn("surface flex gap-4 p-4", !n.read && "border-primary/40 bg-primary/5")}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className={cn("text-sm", n.read ? "font-semibold" : "font-bold")}>{n.title}</p>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1.5 text-xs text-muted-foreground" title={formatDateTime(n.created_at)}>
                    {timeAgo(n.created_at)}
                  </p>
                  {link && (
                    <button onClick={() => open(n)} className="mt-2 text-sm font-semibold text-primary hover:underline">
                      View details →
                    </button>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={n.read ? "Mark as unread" : "Mark as read"}
                    title={n.read ? "Mark as unread" : "Mark as read"}
                    onClick={() => run(() => setRead([n.id], !n.read), "Could not update notification.")}
                  >
                    {n.read ? <Circle className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete notification"
                    title="Delete"
                    onClick={() => run(() => deleteNotification(n.id), "Could not delete notification.")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {list.hasNextPage && (
        <div className="text-center">
          <Button variant="outline" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
            {list.isFetchingNextPage ? "Loading…" : "Load older notifications"}
          </Button>
        </div>
      )}
    </div>
  );
}
