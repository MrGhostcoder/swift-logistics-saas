import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Package,
  RefreshCw,
  Link2,
  MessagesSquare,
  Mail,
  ShieldCheck,
  Search,
  Check,
  MapPin,
  CalendarClock,
  PackageX,
  Loader2,
  Truck,
  Globe2,
  Sparkles,
  ArrowRight,
  Clock3,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, type ShipStatus } from "@/lib/swift";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwiftTrack — Track Your Package With Ease" },
      {
        name: "description",
        content:
          "Track shipments in real time, share public tracking links and manage deliveries from one secure SwiftTrack dashboard.",
      },
      { property: "og:title", content: "SwiftTrack — Track Your Package With Ease" },
      {
        property: "og:description",
        content: "Real-time shipment tracking, public tracking links and delivery notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Package, title: "Package Tracking", body: "Follow every shipment from pickup to doorstep with a precise, timestamped trail." },
  { icon: RefreshCw, title: "Real-Time Updates", body: "Status changes propagate instantly, so nobody has to ask “where is it?”" },
  { icon: Link2, title: "Public Tracking Links", body: "Share a branded, read-only link with customers — no login required." },
  {
    icon: MessagesSquare,
    title: "Customer Messaging",
    body: "Recipients can reply on the tracking page and reach you directly.",
  },
  {
    icon: Mail,
    title: "Email Notifications",
    body: "Automatic delivery notices the moment a shipment changes status.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Dashboard",
    body: "Role-protected workspace with strict data isolation per account.",
  },
];

const steps = [
  { icon: Sparkles, title: "Create a shipment", body: "Add package details and a tracking code is generated instantly." },
  { icon: Truck, title: "Update the journey", body: "Push status changes and location events as the package moves." },
  { icon: Globe2, title: "Share the link", body: "Your customer follows the live timeline from any device." },
];

const stats = [
  { value: "99.9%", label: "Tracking uptime" },
  { value: "< 1s", label: "Status propagation" },
  { value: "24/7", label: "Support on Telegram" },
  { value: "150+", label: "Destinations covered" },
];

type PublicTracking = {
  tc: {
    code: string;
    status: ShipStatus;
    package_name: string | null;
    origin: string | null;
    destination: string | null;
    estimated_delivery: string | null;
    current_location: string | null;
  };
  events: {
    id: string;
    title: string;
    location: string | null;
    occurred_at: string;
  }[];
};

function Home() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicTracking | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);

  async function track(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) {
      toast.error("Please enter a tracking code.");
      return;
    }
    setLoading(true);
    setNotFound(null);
    setResult(null);
    const { data, error } = await supabase.rpc("get_public_tracking", { _code: value });
    setLoading(false);
    if (error) {
      toast.error("Could not look up that tracking code. Please try again.");
      return;
    }
    const parsed = data as unknown as PublicTracking | null;
    if (!parsed?.tc) {
      setNotFound(value);
      return;
    }
    setResult(parsed);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader minimal />

      <section className="relative overflow-hidden">
        <div className="hero-aurora pointer-events-none absolute inset-0 -z-10" />
        <div className="grid-fade pointer-events-none absolute inset-0 -z-10" />

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur">
                <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
                Live logistics tracking platform
              </span>
              <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
                <span className="text-gradient-brand">Track your package</span>
                <br />
                with absolute clarity.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Enter a tracking code to see the live status, route and delivery timeline — no
                account, no waiting, no guesswork.
              </p>

              <form
                onSubmit={track}
                className="surface-elevated mt-9 flex flex-col gap-3 p-2.5 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter tracking code (e.g. STK-839271)"
                    aria-label="Tracking code"
                    className="h-13 border-0 bg-transparent pl-11 text-base shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="h-13 gap-2 rounded-xl px-7 text-base font-semibold shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Track Package <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {notFound && (
                <div className="surface mt-5 flex items-start gap-3 p-5">
                  <PackageX className="mt-0.5 h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-bold">No shipment found for {notFound}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Double-check the tracking code and try again.
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div className="surface-elevated animate-rise mt-6 p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Tracking code</p>
                      <p className="font-mono text-lg font-bold">{result.tc.code}</p>
                    </div>
                    <StatusBadge status={result.tc.status} />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3.5">
                      <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Route</p>
                        <p className="text-sm font-semibold">
                          {result.tc.origin || "—"} → {result.tc.destination || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3.5">
                      <CalendarClock className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated delivery</p>
                        <p className="text-sm font-semibold">
                          {result.tc.estimated_delivery
                            ? formatDate(result.tc.estimated_delivery)
                            : "To be announced"}
                        </p>
                      </div>
                    </div>
                    {result.tc.current_location && (
                      <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3.5 sm:col-span-2">
                        <Package className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Current location</p>
                          <p className="text-sm font-semibold">{result.tc.current_location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {result.events?.length > 0 && (
                    <ol className="mt-6 space-y-4 border-t border-border pt-6">
                      {result.events.slice(0, 4).map((ev, i) => (
                        <li key={ev.id} className="relative flex items-start gap-3 pl-1">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                              i === 0 ? "bg-primary animate-pulse-ring" : "bg-muted-foreground/40"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-semibold">{ev.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {[ev.location, formatDateTime(ev.occurred_at)]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  <Link
                    to="/track/$code"
                    params={{ code: result.tc.code }}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    View full details <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Real-time status updates", "Secure tracking", "No account required"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />
              <div className="surface-elevated relative overflow-hidden p-8">
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10" />
                <div className="relative space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                      <Package className="h-6 w-6" />
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Tracking number</p>
                      <p className="font-mono text-lg font-bold">STK-839271</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Clock3 className="h-3.5 w-3.5" /> Live
                    </span>
                  </div>

                  <div className="relative space-y-5 pl-1">
                    <span className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                    {[
                      ["Shipment Created", "Lagos, Nigeria", true],
                      ["Package Picked Up", "Lagos, Nigeria", true],
                      ["Arrived at Distribution Center", "Abuja", true],
                      ["In Transit", "Abuja Distribution Center", false],
                    ].map(([title, place, done], i) => (
                      <div key={i} className="relative flex items-start gap-3">
                        <span
                          className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ring-4 ring-card ${
                            done
                              ? "bg-success text-success-foreground"
                              : "bg-primary text-primary-foreground animate-pulse-ring"
                          }`}
                        >
                          {done ? "✓" : "●"}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{title as string}</p>
                          <p className="text-xs text-muted-foreground">{place as string}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Estimated delivery</p>
                    <p className="text-sm font-bold">Tomorrow, before 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card px-6 py-7 text-center">
                <dt className="order-2 mt-1 text-xs font-medium text-muted-foreground">{s.label}</dt>
                <dd className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="features" className="border-y border-border bg-card py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Platform
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need to track deliveries
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete tracking layer for your logistics operation — built for speed, clarity and
              trust.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="surface group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three steps from pickup to proof of delivery
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="surface relative p-7">
                <span className="absolute right-6 top-5 text-5xl font-extrabold text-muted/80">
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="hero-aurora mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-16 text-center shadow-[var(--shadow-elevated)] sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Have a tracking code? See where your package is right now.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Live status, route history and estimated delivery — in one search.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/track">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-xl px-7 text-base font-semibold shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
              >
                Track a package <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
