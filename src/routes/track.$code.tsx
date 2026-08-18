import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Share2, MapPin, Truck, CalendarClock, PackageX, Send } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { StatusBadge, Skeletons } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, trackingUrl, STATUS_LABEL, type ShipStatus } from "@/lib/swift";
import { toast } from "sonner";

export const Route = createFileRoute("/track/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Tracking ${params.code} — SwiftTrack` },
      {
        name: "description",
        content: `Live shipment status, location history and estimated delivery for tracking code ${params.code}.`,
      },
      { property: "og:title", content: `Tracking ${params.code} — SwiftTrack` },
      {
        property: "og:description",
        content: `Follow shipment ${params.code} from pickup to delivery.`,
      },
    ],
  }),
  component: TrackDetail,
});

type PublicTracking = {
  tc: {
    id: string;
    code: string;
    status: ShipStatus;
    package_name: string | null;
    package_category: string | null;
    weight: string | null;
    sender_name: string | null;
    recipient_name: string | null;
    origin: string | null;
    destination: string | null;
    pickup_address: string | null;
    delivery_address: string | null;
    shipping_method: string | null;
    estimated_delivery: string | null;
    current_location: string | null;
  };
  events: { id: string; status: string; title: string; location: string | null; occurred_at: string }[];
  messages: { id: string; sender_name: string; sender_type: string; body: string; created_at: string }[];
};

function TrackDetail() {
  const { code } = Route.useParams();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["track", code],
    queryFn: async () => {
      const { data: result, error } = await supabase.rpc("get_public_tracking", {
        _code: code.toUpperCase(),
      });
      if (error) throw error;
      if (!result) return null;
      return result as unknown as PublicTracking;
    },
  });


  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.tc || !body.trim()) return;
    const { error } = await supabase.rpc("send_public_message", {
      _code: code.toUpperCase(),
      _sender_name: name.trim() || "Recipient",
      _body: body.trim(),
    });
    if (error) {
      toast.error("Could not send your message. Please try again.");
      return;
    }
    setBody("");
    toast.success("Message sent to the sender.");
    qc.invalidateQueries({ queryKey: ["track", code] });
  }


  const url = trackingUrl(code.toUpperCase());

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        {isLoading ? (
          <Skeletons rows={5} />
        ) : !data ? (
          <div className="surface p-12 text-center">
            <PackageX className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-bold">Tracking code not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tracking code not found. Please check the code and try again.
            </p>
            <Link to="/track" className="mt-6 inline-block">
              <Button>Try another code</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="surface p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tracking number
                  </p>
                  <p className="font-mono text-2xl font-bold">{data.tc.code}</p>
                  <p className="mt-3 text-3xl font-extrabold uppercase text-primary">
                    {STATUS_LABEL[data.tc.status as ShipStatus]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast.success("Tracking link copied.");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Tracking Link
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (navigator.share) {
                        await navigator.share({ title: `Tracking ${data.tc.code}`, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success("Tracking link copied.");
                      }
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Info icon={MapPin} label="Current Location" value={data.tc.current_location} />
                <Info icon={Truck} label="Destination" value={data.tc.destination} />
                <Info
                  icon={CalendarClock}
                  label="Estimated Delivery"
                  value={formatDate(data.tc.estimated_delivery)}
                />
              </div>
            </div>

            <div className="surface p-6 sm:p-8">
              <h2 className="text-lg font-bold">Tracking Timeline</h2>
              <ol className="mt-6 space-y-0">
                {data.events.map((ev, i) => {
                  const isLast = i === data.events.length - 1;
                  return (
                    <li key={ev.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            isLast
                              ? "bg-primary text-primary-foreground"
                              : "bg-success text-success-foreground"
                          }`}
                        >
                          {isLast ? "●" : "✓"}
                        </span>
                        {i < data.events.length - 1 && <span className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-7">
                        <p className="text-sm font-semibold">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(ev.occurred_at)}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
                {["out_for_delivery", "delivered"]
                  .filter(
                    (s) =>
                      !data.events.some((e) => e.status === s) &&
                      data.tc.status !== "delivered" &&
                      data.tc.status !== "exception",
                  )
                  .map((s) => (
                    <li key={s} className="flex gap-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                        ○
                      </span>
                      <p className="pb-7 text-sm text-muted-foreground">
                        {STATUS_LABEL[s as ShipStatus]}
                      </p>
                    </li>
                  ))}
              </ol>
            </div>

            <div className="surface p-6 sm:p-8">
              <h2 className="text-lg font-bold">Package Details</h2>
              <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="Tracking Number" value={data.tc.code} />
                <Detail label="Package Type" value={data.tc.package_category || data.tc.package_name} />
                <Detail label="Weight" value={data.tc.weight} />
                <Detail label="Sender" value={data.tc.sender_name} />
                <Detail label="Recipient" value={data.tc.recipient_name} />
                <Detail label="Origin" value={data.tc.origin || data.tc.pickup_address} />
                <Detail label="Destination" value={data.tc.destination || data.tc.delivery_address} />
                <Detail label="Shipping Method" value={data.tc.shipping_method} />
                <Detail label="Estimated Delivery" value={formatDate(data.tc.estimated_delivery)} />
                <Detail
                  label="Current Status"
                  value={<StatusBadge status={data.tc.status} />}
                />
              </dl>
            </div>

            <div className="surface p-6 sm:p-8">
              <h2 className="text-lg font-bold">Message the Sender</h2>
              <div className="mt-4 space-y-3">
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
                    <p className="font-semibold">{m.sender_name}</p>
                    <p className="mt-1">{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(m.created_at)}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="mt-5 space-y-3">
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                  placeholder="Write a message about this delivery…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                />
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold">{value || "—"}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
