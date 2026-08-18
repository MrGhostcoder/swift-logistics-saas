import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, Clock, Wallet } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Skeletons } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useCheckoutSettings } from "@/hooks/useAuth";
import { formatUsdt, generatePaymentRef } from "@/lib/swift";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/$planId")({
  head: () => ({
    meta: [
      { title: "USDT Checkout — SwiftTrack" },
      {
        name: "description",
        content: "Complete your SwiftTrack plan purchase by sending USDT and submitting your transaction hash.",
      },
      { property: "og:title", content: "USDT Checkout — SwiftTrack" },
      { property: "og:description", content: "Pay for your SwiftTrack tracking plan with USDT." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { planId } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: settings } = useCheckoutSettings();
  const reference = useMemo(() => generatePaymentRef(), []);
  const [step, setStep] = useState<"instructions" | "proof" | "done">("instructions");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [txHash, setTxHash] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").eq("id", planId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("You need to log in to submit a payment.");
      navigate({ to: "/login" });
      return;
    }
    setSaving(true);
    try {
      let receiptPath: string | null = null;
      if (file) {
        const path = `${user.id}/${reference}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, file);
        if (upErr) throw upErr;
        receiptPath = path;
      }
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        plan_id: planId,
        amount: Number(amount || plan?.price || 0),
        reference: txHash.trim() ? `${reference} · ${txHash.trim()}` : reference,
        payment_date: date,
        receipt_url: receiptPath,
      });
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ subscription_status: "PENDING_PAYMENT" })
        .eq("id", user.id);
      setStep("done");
    } catch {
      toast.error("Something went wrong while submitting your payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {isLoading ? (
          <Skeletons rows={4} />
        ) : !plan ? (
          <div className="surface p-10 text-center">
            <p className="font-semibold">Plan not found.</p>
            <Link to="/pricing" className="mt-4 inline-block">
              <Button>Back to pricing</Button>
            </Link>
          </div>
        ) : step === "done" ? (
          <div className="surface p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/20 text-warning-foreground">
              <Clock className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold">Pending Admin Verification</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We received your payment submission with reference{" "}
              <span className="font-mono font-semibold">{reference}</span>. Your {plan.name} plan
              activates as soon as an admin verifies the USDT transaction on-chain.
            </p>
            <Link to="/dashboard/payments" className="mt-6 inline-block">
              <Button>View payment history</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="surface p-6 sm:p-8">
              <h1 className="text-2xl font-extrabold">Complete your purchase</h1>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Field label="Selected Plan" value={plan.name} />
                <Field label="Plan Price" value={formatUsdt(Number(plan.price))} />
                <Field label="Tracking Codes" value={`${plan.code_limit} codes`} />
              </div>
            </div>

            <div className="surface p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Wallet className="h-5 w-5 text-primary" /> USDT Payment Instructions
              </h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Network" value={settings?.["usdt_network"] || "TRC20 (Tron)"} />
                <Field label="USDT Wallet Address" value={settings?.["usdt_address"] || "—"} mono />
                {settings?.["usdt_memo"] ? (
                  <Field label="Memo / Tag" value={settings["usdt_memo"]} mono />
                ) : null}
                <Field label="Reference" value={reference} mono />
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Send exactly {formatUsdt(Number(plan.price))} to the wallet address above on the{" "}
                {settings?.["usdt_network"] || "TRC20"} network. Sending on a different network may
                result in permanent loss of funds. Keep your transaction hash — you will need it on
                the next step.
              </p>
              {step === "instructions" && (
                <Button className="mt-6" size="lg" onClick={() => setStep("proof")}>
                  I have sent the USDT
                </Button>
              )}
            </div>

            {step === "proof" && (
              <form className="surface space-y-4 p-6 sm:p-8" onSubmit={submitPayment}>
                <h2 className="text-lg font-bold">Confirm your USDT payment</h2>
                <div>
                  <Label>Payment Reference</Label>
                  <Input value={reference} readOnly className="mt-1.5 font-mono" />
                </div>
                <div>
                  <Label htmlFor="amount">Amount Sent (USDT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder={String(plan.price)}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="txhash">Transaction Hash (TXID)</Label>
                  <Input
                    id="txhash"
                    placeholder="e.g. 9f3a…"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="receipt">Upload Transaction Screenshot</Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="mt-1.5"
                  />
                </div>
                {!user && (
                  <p className="text-sm text-destructive">
                    You need to{" "}
                    <Link to="/login" className="font-semibold underline">
                      log in
                    </Link>{" "}
                    to submit a payment.
                  </p>
                )}
                <Button size="lg" disabled={saving}>
                  <Check className="mr-2 h-4 w-4" />
                  {saving ? "Submitting…" : "Submit Payment"}
                </Button>
              </form>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
