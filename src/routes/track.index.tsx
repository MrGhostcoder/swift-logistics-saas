import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Track a Package — SwiftTrack" },
      {
        name: "description",
        content: "Enter your SwiftTrack tracking code to see live shipment status and delivery updates.",
      },
      { property: "og:title", content: "Track a Package — SwiftTrack" },
      { property: "og:description", content: "Live shipment status for any SwiftTrack tracking code." },
    ],
  }),
  component: TrackSearch,
});

function TrackSearch() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-xl flex-1 px-4 py-20">
        <h1 className="text-center text-3xl font-extrabold">Track a Package</h1>
        <p className="mt-2 text-center text-muted-foreground">
          No account required — just your tracking code.
        </p>
        <form
          className="surface mt-8 flex flex-col gap-3 p-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const v = code.trim().toUpperCase();
            if (!v) {
              toast.error("Please enter a tracking code.");
              return;
            }
            navigate({ to: "/track/$code", params: { code: v } });
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter tracking code"
              className="h-12 border-0 pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" size="lg" className="h-12">
            Track Package
          </Button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
