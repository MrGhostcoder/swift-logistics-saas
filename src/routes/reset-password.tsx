import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a New Password — SwiftTrack" },
      { name: "description", content: "Securely choose a new password for your SwiftTrack account." },
      { property: "og:title", content: "Choose a New Password — SwiftTrack" },
      { property: "og:description", content: "Restore secure access to your SwiftTrack account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recovery = true;
        if (active) setState("ready");
      } else if (event === "SIGNED_OUT" && active) {
        setState((current) => current === "done" ? "done" : "invalid");
      }
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (active) setState(recovery && data.user && !error ? "ready" : "invalid");
    }).catch(() => {
      if (active) setState("invalid");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state !== "ready" || saving) return;
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setState("done");
      setPassword("");
      setConfirm("");
      await supabase.auth.signOut();
    } catch {
      setError("Your password could not be updated. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell>
      <section className="surface p-7">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {state === "done" ? <CheckCircle2 aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
        </div>
        <h1 className="text-2xl font-extrabold">{state === "done" ? "Password updated" : "Set a new password"}</h1>
        {state === "checking" && <p className="mt-3 text-sm text-muted-foreground" role="status">Checking your reset link…</p>}
        {state === "invalid" && (
          <div className="mt-4 space-y-5">
            <p className="text-sm text-muted-foreground" role="alert">This reset link is missing, expired, or has already been used.</p>
            <Button asChild className="w-full"><Link to="/forgot-password">Request a new reset link</Link></Button>
          </div>
        )}
        {state === "done" && <p role="status" className="mt-3 text-sm text-muted-foreground">Your new password is saved. You can now log in.</p>}
        {state === "ready" && (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput id="new-password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} disabled={saving} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput id="confirm-password" autoComplete="new-password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={saving} className="mt-1.5" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={saving}>{saving ? "Saving…" : "Save new password"}</Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm"><Link to="/login" className="font-semibold text-primary">Back to login</Link></p>
      </section>
    </AuthShell>
  );
}