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
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, type ShipStatus } from "@/lib/swift";
import { toast } from "sonner";
import heroVideoAsset from "@/assets/hero-video.mp4.asset.json";
import heroVideoWebmAsset from "@/assets/hero-video.webm.asset.json";
import warehouseImg from "@/assets/home-warehouse.jpg";
import courierImg from "@/assets/home-courier.jpg";
import globalImg from "@/assets/home-global.jpg";
import appImg from "@/assets/home-app.jpg";

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

      <section className="relative isolate overflow-hidden">
        <video
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source src={heroVideoWebmAsset.url} type="video/webm" />
          <source src={heroVideoAsset.url} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-background/45" />

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
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
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
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
                <div className="surface mt-5 flex items-start gap-3 p-5 text-left">
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
                <div className="surface-elevated animate-rise mt-6 p-6 text-left sm:p-7">
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

              <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Real-time status updates", "Secure tracking", "No account required"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {t}
                  </li>
                ))}
              </ul>
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
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="relative">
            <img
              src={appImg}
              alt="Customer following a live parcel tracking timeline on a phone"
              loading="lazy"
              width={1280}
              height={960}
              className="w-full rounded-[2rem] border border-border object-cover shadow-[var(--shadow-elevated)]"
            />
            <img
              src={courierImg}
              alt="Courier handing a parcel to a customer at the door"
              loading="lazy"
              width={1280}
              height={960}
              className="absolute -bottom-8 -right-4 hidden w-48 rounded-2xl border-4 border-background object-cover shadow-[var(--shadow-pop)] sm:block lg:w-56"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Built for trust
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              A tracking experience your customers actually enjoy
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Every shipment gets a clean, mobile-first page with live status, route history and an
              estimated delivery date — plus a direct line to your team if anything looks off.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "Mobile-first timeline that updates in real time",
                "Branded, shareable links with no login required",
                "Automatic email notices on every status change",
                "Two-way messaging right on the tracking page",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Operations
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              From the sorting floor to the front door
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Warehouse teams push scans and status changes in seconds. Recipients see them
              instantly — no phone calls, no spreadsheets, no chasing updates.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { value: "150+", label: "Destinations covered" },
                { value: "4M+", label: "Scans processed" },
              ].map((s) => (
                <div key={s.label} className="surface p-5">
                  <p className="text-2xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src={warehouseImg}
            alt="Warehouse team scanning parcels on a conveyor line"
            loading="lazy"
            width={1280}
            height={960}
            className="order-1 w-full rounded-[2rem] border border-border object-cover shadow-[var(--shadow-elevated)] lg:order-2"
          />
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

      <section className="px-4 pb-24 pt-24">
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border px-6 py-20 text-center shadow-[var(--shadow-elevated)] sm:px-12">
          <img
            src={globalImg}
            alt="Global freight network at dusk with cargo plane, container ship and delivery vans"
            loading="lazy"
            width={1600}
            height={900}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-[2px]" />
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
