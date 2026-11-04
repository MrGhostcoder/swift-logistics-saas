import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Backend push sender. The database calls this once for every new notification row.
// Security: the caller only supplies a notification id. The handler claims that row once
// (push_claimed_at), only if it is fresh, and only ever sends it to the row's own owner's
// registered devices — so a caller can neither choose content nor recipients, nor re-send.
// Nothing about the notification or the user is returned.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";
const Body = z.object({ id: z.string().uuid() });

export const Route = createFileRoute("/api/public/push/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let id: string;
        try {
          id = Body.parse(await request.json()).id;
        } catch {
          return Response.json({ ok: false }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const freshSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: n, error } = await supabaseAdmin
          .from("notifications")
          .update({ push_claimed_at: new Date().toISOString() })
          .eq("id", id)
          .is("push_claimed_at", null)
          .gte("created_at", freshSince)
          .select("id, user_id, title, body, link, kind")
          .maybeSingle();
        if (error) {
          console.error("push claim failed", error.message);
          return Response.json({ ok: false }, { status: 500 });
        }
        if (!n) return Response.json({ ok: true, sent: 0 });

        const { data: prefs } = await supabaseAdmin
          .from("notification_preferences")
          .select("push_enabled, push_shipment, push_account")
          .eq("user_id", n.user_id)
          .maybeSingle();
        const p = { push_enabled: true, push_shipment: true, push_account: true, ...(prefs ?? {}) };
        const wanted =
          p.push_enabled &&
          (n.kind === "test" || (n.kind === "shipment" ? p.push_shipment : p.push_account));
        if (!wanted) return Response.json({ ok: true, sent: 0 });

        const { data: tokens } = await supabaseAdmin
          .from("push_tokens")
          .select("id, token")
          .eq("user_id", n.user_id);
        if (!tokens?.length) return Response.json({ ok: true, sent: 0 });

        const lovableKey = process.env["LOVABLE_API_KEY"];
        const fcmKey = process.env["FIREBASE_MESSAGING_API_KEY"];
        if (!lovableKey || !fcmKey) {
          console.error("push not configured: missing LOVABLE_API_KEY or FIREBASE_MESSAGING_API_KEY");
          return Response.json({ ok: true, sent: 0 });
        }

        const origin = new URL(request.url).origin;
        const path = n.link && n.link.startsWith("/") && !n.link.startsWith("//") ? n.link : "/dashboard/notifications";
        const link = `${origin}${path}`;

        let sent = 0;
        const stale: string[] = [];
        await Promise.all(
          tokens.map(async (t) => {
            const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableKey}`,
                "X-Connection-Api-Key": fcmKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: {
                  token: t.token,
                  notification: { title: n.title, body: n.body || "" },
                  data: { link: path, notification_id: n.id },
                  webpush: {
                    notification: { icon: `${origin}/favicon.png`, badge: `${origin}/favicon.png`, tag: n.id },
                    fcm_options: { link },
                  },
                },
              }),
            });
            if (res.ok) {
              sent++;
              return;
            }
            const text = await res.text();
            if (res.status === 404 || /UNREGISTERED|registration token is not a valid/i.test(text)) {
              stale.push(t.id);
            } else {
              console.error(`FCM send failed [${res.status}]: ${text}`);
            }
          }),
        );
        if (stale.length) await supabaseAdmin.from("push_tokens").delete().in("id", stale);
        return Response.json({ ok: true, sent });
      },
    },
  },
});
