import { Bell, BellRing, Package, Wallet, type LucideIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AppNotification = Tables<"notifications">;
export type NotificationPrefs = Tables<"notification_preferences">;

export const notifKeys = {
  all: ["notifications"] as const,
  unread: (uid?: string) => ["notifications", "unread", uid] as const,
  recent: (uid?: string) => ["notifications", "recent", uid] as const,
  list: (uid: string | undefined, filter: string) => ["notifications", "list", uid, filter] as const,
  prefs: (uid?: string) => ["notification-prefs", uid] as const,
  devices: (uid?: string) => ["push-devices", uid] as const,
};

export const DEFAULT_PREFS = {
  push_enabled: true,
  push_shipment: true,
  push_account: true,
  in_app_popups: true,
};

export const KIND_META: Record<string, { label: string; icon: LucideIcon }> = {
  shipment: { label: "Shipment", icon: Package },
  account: { label: "Account", icon: Wallet },
  test: { label: "Test", icon: BellRing },
};

export function kindMeta(kind?: string | null) {
  return KIND_META[kind ?? ""] ?? { label: "General", icon: Bell };
}

/** Only same-site paths are followed from a notification. */
export function safeLink(link?: string | null): string | null {
  if (!link || !link.startsWith("/") || link.startsWith("//")) return null;
  return link;
}

export function timeAgo(value: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function fetchUnreadCount(uid: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function setRead(ids: string[], read = true) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("notifications").update({ read }).in("id", ids);
  if (error) throw error;
}

export async function markAllRead(uid: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", uid)
    .eq("read", false);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchPrefs(uid: string) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_PREFS, ...(data ?? {}) };
}

export async function savePrefs(uid: string, patch: Partial<typeof DEFAULT_PREFS>) {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: uid, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}
