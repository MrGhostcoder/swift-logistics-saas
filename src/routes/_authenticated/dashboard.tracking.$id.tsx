import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Share2, Send, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useAuth";
import {
  formatDate,
  formatDateTime,
  SHIP_STATUSES,
  STATUS_LABEL,
  trackingUrl,
  type ShipStatus,
} from "@/lib/swift";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/tracking/$id")({
  component: TrackingDetail,
});

function TrackingDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [location, setLocation] = useState("");

  const planName = (profile?.plans as { name?: string } | null)?.name ?? "";
  const premium = planName === "Business" || planName === "Pro";

  const { data, isLoading } = useQuery({
    queryKey: ["code-detail", id],
    queryFn: async () => {
      const { data: tc, error } = await supabase
        .from("tracking_codes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!tc) return null;
      const { data: events } = await supabase
        .from("tracking_events")
        .select("*")
        .eq("tracking_code_id", id)
        .order("occurred_at", { ascending: false });
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("tracking_code_id", id)
        .order("created_at", { ascending: true });
      return { tc, events: events ?? [], messages: messages ?? [] };
    },
  });

  async function updateStatus(status: ShipStatus) {
    const { error } = await supabase
      .from("tracking_codes")
      .update({ status, current_location: location || data?.tc.current_location })
      .eq("id", id);
    if (error) {
      toast.error("Could not update the status.");
      return;
    }
    toast.success("Status updated and customer notified.");
    qc.invalidateQueries();
  }

  async function sendMessage() {
    if (!message.trim() || !user) return;
    const { error } = await supabase.from("messages").insert({
      tracking_code_id: id,
      user_id: user.id,
      sender_name: profile?.full_name || "Sender",
      sender_type: "owner",
      body: message.trim(),
    });
    if (error) {
      toast.error("Could not send the message.");
      return;
    }
    setMessage("");
    toast.success("Message sent.");
    qc.invalidateQueries({ queryKey: ["code-detail", id] });
  }

  async function sendEmail() {
    if (!data?.tc.recipient_email) {
      toast.error("This shipment has no recipient email.");
      return;
    }
    const { error } = await supabase.from("email_log").insert({
      user_id: user?.id ?? null,
      tracking_code_id: id,
      to_email: data.tc.recipient_email,
      subject: emailSubject || `Update on ${data.tc.code}`,
      body: emailBody,
    });
    if (error) {
      toast.error("Could not queue the email.");
      return;
    }
    setEmailSubject("");
    setEmailBody("");
    toast.success("Email queued to the customer.");
  }

  if (isLoading) return <Skeletons rows={5} />;
  if (!data)
    return (
      <div className="surface p-10 text-center">
        <p className="font-semibold">Tracking code not found.</p>
      </div>
    );

  const url = trackingUrl(data.tc.code);

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-2xl font-bold">{data.tc.code}</p>
            <p className="text-sm text-muted-foreground">
              {data.tc.package_name} → {data.tc.recipient_name}
            </p>
            <div className="mt-3">
              <StatusBadge status={data.tc.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Tracking link copied.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (navigator.share) await navigator.share({ title: data.tc.code, url });
                else {
                  navigator.clipboard.writeText(url);
                  toast.success("Tracking link copied.");
                }
              }}
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Link to="/track/$code" params={{ code: data.tc.code }}>
              <Button variant="ghost">Public page</Button>
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <D label="Origin" v={data.tc.origin || data.tc.pickup_address} />
          <D label="Destination" v={data.tc.destination || data.tc.delivery_address} />
          <D label="Estimated Delivery" v={formatDate(data.tc.estimated_delivery)} />
          <D label="Weight" v={data.tc.weight} />
          <D label="Shipping Method" v={data.tc.shipping_method} />
          <D label="Current Location" v={data.tc.current_location} />
        </dl>
      </div>

      <div className="surface p-6">
        <h2 className="text-base font-bold">Update Status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <Label>Current Location</Label>
            <Input
              className="mt-1.5"
              placeholder={data.tc.current_location ?? "e.g. Abuja Distribution Center"}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={data.tc.status} onValueChange={(v) => updateStatus(v as ShipStatus)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIP_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Each status change creates a tracking event and notifies the customer.
        </p>
      </div>

      <div className="surface p-6">
        <h2 className="text-base font-bold">Tracking Events</h2>
        <ul className="mt-4 space-y-3">
          {data.events.map((ev) => (
            <li key={ev.id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">{ev.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(ev.occurred_at)}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {premium ? (
        <>
          <div className="surface p-6">
            <h2 className="text-base font-bold">Customer Messaging</h2>
            <div className="mt-4 space-y-2">
              {data.messages.length === 0 && (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              )}
              {data.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl border border-border p-3 text-sm ${
                    m.sender_type === "owner" ? "bg-accent" : "bg-muted/40"
                  }`}
                >
                  <p className="font-semibold">
                    {m.sender_name}{" "}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {m.read ? "Read" : "Unread"}
                    </span>
                  </p>
                  <p className="mt-1">{m.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Textarea
                rows={2}
                placeholder="Reply to your customer…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={sendMessage} className="sm:self-end">
                <Send className="mr-2 h-4 w-4" /> Send
              </Button>
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="text-base font-bold">Email the Customer</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Customer Email</Label>
                <Input className="mt-1.5" value={data.tc.recipient_email ?? ""} readOnly />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  className="mt-1.5"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  className="mt-1.5"
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
              <Button onClick={sendEmail}>
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="surface flex flex-col items-center p-8 text-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">
            Customer messaging is available on Business and Pro plans.
          </p>
          <Link to="/pricing" className="mt-4">
            <Button>Upgrade Plan</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function D({ label, v }: { label: string; v?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{v || "—"}</dd>
    </div>
  );
}
