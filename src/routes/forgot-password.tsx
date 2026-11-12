import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — SwiftTrack" },
      { name: "description", content: "Reset the password for your SwiftTrack account." },
      { property: "og:title", content: "Forgot Password — SwiftTrack" },
      { property: "og:description", content: "Request a password reset link for SwiftTrack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send your reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
        <div className="surface p-7">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {sent ? <CheckCircle2 aria-hidden="true" /> : <Mail aria-hidden="true" />}
          </div>
          <h1 className="text-2xl font-extrabold">{sent ? "Check your email" : "Forgot password?"}</h1>
          {sent ? (
            <p role="status" className="mt-3 break-words text-sm text-muted-foreground">
              If an account exists for {email.trim()}, a reset link is on its way. Check your inbox and spam folder. Open only the newest reset email; older links stop working after a new request.
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          {sent && <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => { setSent(false); setError(""); }}>Use a different email or request another link</Button>}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary">
              Back to login
            </Link>
          </p>
        </div>
    </AuthShell>
  );
}
