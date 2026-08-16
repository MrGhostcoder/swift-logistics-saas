import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — SwiftTrack" },
      { name: "description", content: "Reset the password for your SwiftTrack account." },
      { property: "og:title", content: "Reset Password — SwiftTrack" },
      { property: "og:description", content: "Request a password reset link for SwiftTrack." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="surface mt-6 p-7">
          <h1 className="text-2xl font-extrabold">Forgot password</h1>
          {sent ? (
            <p className="mt-3 text-sm text-muted-foreground">
              If an account exists for {email}, a reset link is on its way.
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button className="w-full" size="lg">
                Send reset link
              </Button>
            </form>
          )}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
