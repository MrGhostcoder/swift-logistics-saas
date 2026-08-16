import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useAuth";
import { generateTrackingCode, SHIP_STATUSES, STATUS_LABEL, type ShipStatus } from "@/lib/swift";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/tracking/new")({
  component: NewTracking,
});

const initial = {
  sender_name: "",
  sender_phone: "",
  sender_email: "",
  pickup_address: "",
  recipient_name: "",
  recipient_phone: "",
  recipient_email: "",
  delivery_address: "",
  package_name: "",
  package_description: "",
  package_category: "",
  weight: "",
  quantity: "1",
  package_value: "",
  shipping_method: "Standard",
  estimated_delivery: "",
  current_location: "",
  origin: "",
  destination: "",
  special_instructions: "",
};

function NewTracking() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const code = useMemo(() => generateTrackingCode(), []);
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<ShipStatus>("pending");
  const [saving, setSaving] = useState(false);

  const remaining = (profile?.codes_total ?? 0) - (profile?.codes_used ?? 0);
  const set = (k: keyof typeof initial, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("tracking_codes").insert({
      user_id: user.id,
      code,
      ...form,
      quantity: Number(form.quantity || 1),
      estimated_delivery: form.estimated_delivery || null,
      status,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("remaining") ? error.message : "Could not create tracking code.");
      return;
    }
    toast.success("Tracking code created successfully.");
    qc.invalidateQueries();
    navigate({ to: "/dashboard/tracking" });
  }

  if (remaining <= 0) {
    return (
      <div className="surface p-10 text-center">
        <h1 className="text-xl font-bold">Codes Remaining: 0</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You've used all your tracking codes. Buy a new plan to create more.
        </p>
        <Link to="/pricing" className="mt-5 inline-block">
          <Button>Buy New Plan</Button>
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">New Tracking Code</h1>
          <p className="text-sm text-muted-foreground">
            Code <span className="font-mono font-semibold">{code}</span> · {remaining} remaining
          </p>
        </div>
        <Button disabled={saving}>{saving ? "Creating…" : "Create Tracking Code"}</Button>
      </div>

      <Section title="Sender Information">
        <F label="Sender Name" v={form.sender_name} on={(v) => set("sender_name", v)} required />
        <F label="Sender Phone" v={form.sender_phone} on={(v) => set("sender_phone", v)} />
        <F label="Sender Email" v={form.sender_email} on={(v) => set("sender_email", v)} type="email" />
        <F label="Pickup Address" v={form.pickup_address} on={(v) => set("pickup_address", v)} />
      </Section>

      <Section title="Recipient Information">
        <F label="Recipient Name" v={form.recipient_name} on={(v) => set("recipient_name", v)} required />
        <F label="Recipient Phone" v={form.recipient_phone} on={(v) => set("recipient_phone", v)} />
        <F
          label="Recipient Email"
          v={form.recipient_email}
          on={(v) => set("recipient_email", v)}
          type="email"
        />
        <F label="Delivery Address" v={form.delivery_address} on={(v) => set("delivery_address", v)} />
      </Section>

      <Section title="Package Information">
        <F label="Package Name" v={form.package_name} on={(v) => set("package_name", v)} required />
        <F label="Package Category" v={form.package_category} on={(v) => set("package_category", v)} />
        <F label="Weight" v={form.weight} on={(v) => set("weight", v)} placeholder="4.2 kg" />
        <F label="Quantity" v={form.quantity} on={(v) => set("quantity", v)} type="number" />
        <F label="Package Value" v={form.package_value} on={(v) => set("package_value", v)} />
        <div className="sm:col-span-2">
          <Label>Package Description</Label>
          <Textarea
            className="mt-1.5"
            value={form.package_description}
            onChange={(e) => set("package_description", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Shipping Information">
        <F label="Shipping Method" v={form.shipping_method} on={(v) => set("shipping_method", v)} />
        <F
          label="Estimated Delivery Date"
          v={form.estimated_delivery}
          on={(v) => set("estimated_delivery", v)}
          type="date"
        />
        <F label="Origin" v={form.origin} on={(v) => set("origin", v)} />
        <F label="Destination" v={form.destination} on={(v) => set("destination", v)} />
        <F label="Current Location" v={form.current_location} on={(v) => set("current_location", v)} />
        <div>
          <Label>Initial Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ShipStatus)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIP_STATUSES.filter((s) => s !== "exception").map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Additional Information">
        <div className="sm:col-span-2">
          <Label>Special Instructions</Label>
          <Textarea
            className="mt-1.5"
            value={form.special_instructions}
            onChange={(e) => set("special_instructions", e.target.value)}
          />
        </div>
      </Section>

      <Button size="lg" disabled={saving}>
        {saving ? "Creating…" : "Create Tracking Code"}
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function F({
  label,
  v,
  on,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-1.5"
        type={type}
        value={v}
        required={required}
        placeholder={placeholder}
        onChange={(e) => on(e.target.value)}
      />
    </div>
  );
}
