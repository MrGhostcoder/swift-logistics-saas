import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatUsdt } from "@/lib/swift";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — SwiftTrack Tracking Plans" },
      {
        name: "description",
        content:
          "Simple, transparent SwiftTrack pricing. Choose a plan that gives you the tracking codes your business needs.",
      },
      { property: "og:title", content: "Pricing — SwiftTrack Tracking Plans" },
      {
        property: "og:description",
        content: "Starter, Business and Pro tracking plans with public tracking links.",
      },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Simple, Transparent Pricing</h1>
          <p className="mt-3 text-muted-foreground">
            Choose a plan that gives you the tracking codes you need.
          </p>
        </div>

        {isLoading ? (
          <Skeletons rows={3} className="mt-12" />
        ) : (
          <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
            {(plans ?? []).map((plan) => (
              <div
                key={plan.id}
                className={`surface relative flex flex-col p-7 ${
                  plan.is_popular ? "border-primary ring-2 ring-primary/25" : ""
                }`}
              >
                {plan.is_popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="mt-3 text-4xl font-extrabold">{formatUsdt(Number(plan.price))}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.code_limit} tracking codes
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/checkout/$planId"
                  params={{ planId: plan.id }}
                  className="mt-7 block"
                >
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.is_popular ? "default" : "outline"}
                  >
                    Pay with USDT
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
