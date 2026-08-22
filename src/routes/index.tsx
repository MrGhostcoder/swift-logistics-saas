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
    ],
  }),
  component: Home,
});

const features = [
  { icon: Package, title: "Package Tracking", body: "Track your shipment from pickup to delivery." },
  { icon: RefreshCw, title: "Real-Time Updates", body: "Receive the latest package status updates." },
  { icon: Link2, title: "Public Tracking Links", body: "Share a tracking link with your customers." },
  {
    icon: MessagesSquare,
    title: "Customer Messaging",
    body: "Communicate with customers about their delivery.",
  },
  {
    icon: Mail,
    title: "Email Notifications",
    body: "Automatically notify customers when shipment status changes.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Dashboard",
    body: "Manage all your tracking codes and packages in one place.",
  },
];

function Home() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  function track(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) {
      toast.error("Please enter a tracking code.");
      return;
    }
    navigate({ to: "/track/$code", params: { code: value } });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Logistics tracking platform
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl">
              Track Your Package With Ease
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Enter your tracking code to view the latest status and delivery updates for your
              package.
            </p>

            <form onSubmit={track} className="surface mt-8 flex flex-col gap-3 p-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter tracking code (e.g. STK-839271)"
                  className="h-12 border-0 pl-9 text-base shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 text-base font-semibold">
                Track Package
              </Button>
            </form>

            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Real-time status updates", "Secure tracking", "No account required"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface relative overflow-hidden p-8">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Package className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tracking number</p>
                  <p className="font-mono text-lg font-bold">STK-839271</p>
                </div>
              </div>
              {[
                ["Shipment Created", "Lagos, Nigeria", true],
                ["Package Picked Up", "Lagos, Nigeria", true],
                ["Arrived at Distribution Center", "Abuja", true],
                ["In Transit", "Abuja Distribution Center", false],
              ].map(([title, place, done], i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      done
                        ? "bg-success text-success-foreground"
                        : "bg-primary text-primary-foreground"
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
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
            Everything You Need to Track Deliveries
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="surface p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
