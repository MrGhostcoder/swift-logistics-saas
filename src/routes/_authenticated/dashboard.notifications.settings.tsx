import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BellRing, ExternalLink, Laptop, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { DEFAULT_PREFS, fetchPrefs, notifKeys, savePrefs, timeAgo } from "@/lib/notifications";
import {
  browserPermission,
  disablePushOnThisDevice,
  enablePush,
  inIframe,
  pushConfigured,
  thisDeviceToken,
  type PushStatus,
} from "@/lib/push";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/notifications/settings")({
  head: () => ({
    meta: [
      { title: "Notification Settings — SwiftTrack" },
      { name: "description", content: "Turn on browser push and choose which SwiftTrack updates you receive." },
      { property: "og:title", content: "Notification Settings — SwiftTrack" },
      { property: "og:description", content: "Turn on browser push and choose which SwiftTrack updates you receive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationSettings,
});

const STATUS_COPY: Record<Exclude<PushStatus, "registered">, string> = {
  "not-configured": "Browser push isn't switched on for this site yet.",
  unsupported: "This browser doesn't support push notifications. Try Chrome, Edge or Firefox, or add the site to your home screen on iPhone.",
  "open-in-new-tab": "Push can't be enabled inside the editor preview. Open the site in its own tab and try again.",
  denied: "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
  error: "Something went wrong while enabling notifications.",
};

function NotificationSettings() {
  const { user } = useSession();
  const uid = user?.id;
  const qc = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const [myToken, setMyToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setPermission(browserPermission());
    setEmbedded(inIframe());
    setMyToken(thisDeviceToken());
  }, []);

  const { data: prefs = { ...DEFAULT_PREFS } } = useQuery({
    queryKey: notifKeys.prefs(uid),
    enabled: !!uid,
    queryFn: () => fetchPrefs(uid!),
  });

  const { data: devices = [] } = useQuery({
    queryKey: notifKeys.devices(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_tokens")
        .select("id, token, device_label, created_at, last_seen_at")
        .eq("user_id", uid!)
        .order("last_seen_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const thisDeviceOn = permission === "granted" && !!myToken && devices.some((d) => d.token === myToken);
  const configured = pushConfigured();

  async function updatePref(patch: Partial<typeof DEFAULT_PREFS>) {
    if (!uid) return;
    qc.setQueryData(notifKeys.prefs(uid), { ...prefs, ...patch });
    try {
      await savePrefs(uid, patch);
    } catch {
      toast.error("Could not save your notification settings.");
    }
    qc.invalidateQueries({ queryKey: notifKeys.prefs(uid) });
  }

  async function onEnable() {
    setBusy(true);
    setProblem(null);
    const res = await enablePush();
    setBusy(false);
    setPermission(browserPermission());
    setMyToken(thisDeviceToken());
    qc.invalidateQueries({ queryKey: notifKeys.devices(uid) });
    qc.invalidateQueries({ queryKey: notifKeys.prefs(uid) });
    if (res.status === "registered") {
      toast.success("Browser notifications are on for this device.");
    } else {
      const refused = res.status === "error" && /permission denied|not allowed|incognito/i.test(res.message ?? "");
      setProblem(
        refused
          ? "Your browser refused push. This happens in private or incognito windows, or when notifications are blocked for this site."
          : res.status === "error" && res.message
            ? `${STATUS_COPY.error} (${res.message})`
            : STATUS_COPY[res.status],
      );
    }
  }

  async function onDisableHere() {
    setBusy(true);
    await disablePushOnThisDevice();
    setBusy(false);
    setMyToken(null);
    qc.invalidateQueries({ queryKey: notifKeys.devices(uid) });
    toast.success("Browser notifications are off for this device.");
  }

  async function removeDevice(id: string) {
    const { error } = await supabase.from("push_tokens").delete().eq("id", id);
    if (error) toast.error("Could not remove that device.");
    qc.invalidateQueries({ queryKey: notifKeys.devices(uid) });
  }

  async function sendTest() {
    setTesting(true);
    const { error } = await supabase.rpc("send_test_notification");
    setTesting(false);
    if (error) toast.error(error.message.includes("wait") ? error.message : "Could not send a test notification.");
  }

  const statusLabel = !configured
    ? { text: "Not available yet", tone: "muted" }
    : permission === "denied"
      ? { text: "Blocked in this browser", tone: "bad" }
      : thisDeviceOn
        ? { text: "On for this device", tone: "good" }
        : { text: "Off for this device", tone: "muted" };

  return (
    <div className="space-y-5">
      <div>
        <Link to="/dashboard/notifications" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Notifications
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">Notification settings</h1>
        <p className="text-sm text-muted-foreground">
          In-app notifications are always on and arrive live. Browser push reaches you even when SwiftTrack is closed.
        </p>
      </div>

      <section className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <BellRing className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-base font-bold">Browser push notifications</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Get an alert on this device when a shipment moves or your account changes.</p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  statusLabel.tone === "good" && "bg-primary/10 text-primary",
                  statusLabel.tone === "bad" && "bg-destructive/10 text-destructive",
                  statusLabel.tone === "muted" && "bg-muted text-muted-foreground",
                )}
              >
                {statusLabel.text}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {embedded && configured ? (
              <Button onClick={() => window.open(window.location.href, "_blank", "noopener")} className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open in new tab to enable
              </Button>
            ) : thisDeviceOn ? (
              <Button variant="outline" onClick={onDisableHere} disabled={busy}>
                Turn off on this device
              </Button>
            ) : (
              <Button onClick={onEnable} disabled={busy || !configured} className="gap-2">
                <BellRing className="h-4 w-4" /> {busy ? "Enabling…" : "Enable Notifications"}
              </Button>
            )}
          </div>
        </div>
        {problem && <p className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm">{problem}</p>}
        {!configured && (
          <p className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            {STATUS_COPY["not-configured"]} In-app notifications keep working in the meantime.
          </p>
        )}

        {devices.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Devices receiving push</p>
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {d.device_label || "Browser"}
                      {d.token === myToken && <span className="ml-2 text-xs font-semibold text-primary">This device</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Added {timeAgo(d.created_at)}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove device" onClick={() => removeDevice(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="surface p-6">
        <h2 className="text-base font-bold">What to notify me about</h2>
        <div className="mt-4 divide-y divide-border">
          <PrefRow
            id="push_enabled"
            title="Browser push"
            body="Master switch for push alerts on all your devices."
            checked={prefs.push_enabled}
            onChange={(v) => updatePref({ push_enabled: v })}
          />
          <PrefRow
            id="push_shipment"
            title="Shipment status changes"
            body="Picked up, in transit, out for delivery, delivered and exceptions."
            checked={prefs.push_shipment}
            disabled={!prefs.push_enabled}
            onChange={(v) => updatePref({ push_shipment: v })}
          />
          <PrefRow
            id="push_account"
            title="Account & payments"
            body="Plan activations, wallet top-ups and payment reviews."
            checked={prefs.push_account}
            disabled={!prefs.push_enabled}
            onChange={(v) => updatePref({ push_account: v })}
          />
          <PrefRow
            id="in_app_popups"
            title="Pop-up alerts in the dashboard"
            body="Show a small pop-up when a new notification arrives while you're here."
            checked={prefs.in_app_popups}
            onChange={(v) => updatePref({ in_app_popups: v })}
          />
        </div>
      </section>

      <section className="surface flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-base font-bold">Try it out</h2>
          <p className="text-sm text-muted-foreground">Sends a real notification to your account and every device you've enabled.</p>
        </div>
        <Button variant="outline" onClick={sendTest} disabled={testing} className="gap-2">
          <Send className="h-4 w-4" /> {testing ? "Sending…" : "Send test notification"}
        </Button>
      </section>
    </div>
  );
}

function PrefRow({
  id,
  title,
  body,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  body: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3.5", disabled && "opacity-50")}>
      <label htmlFor={id} className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{body}</span>
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
