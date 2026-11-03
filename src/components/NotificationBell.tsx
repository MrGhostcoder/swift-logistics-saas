import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import {
  fetchPrefs,
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

/** Live subscription to the signed-in user's notifications. Mount once. */
function useNotificationsRealtime(uid: string | undefined, popups: boolean) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const popupsRef = useRef(popups);
  popupsRef.current = popups;

  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notifications-${uid}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: notifKeys.all });
          if (payload.eventType === "INSERT" && popupsRef.current) {
            const n = payload.new as AppNotification;
            const link = safeLink(n.link);
            toast(n.title, {
              description: n.body || undefined,
              action: link ? { label: "View", onClick: () => navigate({ to: link }) } : undefined,
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, qc, navigate]);
}

export function NotificationBell() {
  const { user } = useSession();
  const uid = user?.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: prefs } = useQuery({
    queryKey: notifKeys.prefs(uid),
    enabled: !!uid,
    queryFn: () => fetchPrefs(uid!),
  });
  useNotificationsRealtime(uid, prefs?.in_app_popups ?? true);

  const { data: unread = 0 } = useQuery({
    queryKey: notifKeys.unread(uid),
    enabled: !!uid,
    queryFn: () => fetchUnreadCount(uid!),
  });

  const { data: recent = [], isLoading } = useQuery({
    queryKey: notifKeys.recent(uid),
    enabled: !!uid && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  async function openItem(n: AppNotification) {
    if (!n.read) {
      await setRead([n.id]).catch(() => undefined);
      qc.invalidateQueries({ queryKey: notifKeys.all });
    }
    const link = safeLink(n.link);
    setOpen(false);
    if (link) navigate({ to: link });
  }

  async function readAll() {
    if (!uid) return;
    try {
      await markAllRead(uid);
      qc.invalidateQueries({ queryKey: notifKeys.all });
    } catch {
      toast.error("Could not mark notifications as read.");
    }
  }

  const badge = unread > 99 ? "99+" : String(unread);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={readAll} disabled={unread === 0} className="h-8 gap-1.5 text-xs">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
        <div className="max-h-[22rem] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((n) => {
                const { icon: Icon } = kindMeta(n.kind);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={cn("text-sm leading-snug", n.read ? "font-medium" : "font-bold")}>{n.title}</span>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                        </span>
                        {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
                        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-2 py-2">
          <Link to="/dashboard/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </Link>
          <Link to="/dashboard/notifications/settings" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" /> Settings
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
