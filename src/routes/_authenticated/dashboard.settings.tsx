import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: Settings,
});

function Settings() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setCompany(profile.company ?? "");
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, company })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile.");
      return;
    }
    toast.success("Profile updated.");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function resetPassword() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) toast.error("Could not send the reset email.");
    else toast.success("Password reset link sent to your email.");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <form className="surface space-y-4 p-6" onSubmit={save}>
        <h2 className="text-base font-bold">Profile</h2>
        <div>
          <Label>Email</Label>
          <Input className="mt-1.5" value={user?.email ?? ""} readOnly />
        </div>
        <div>
          <Label>Full Name</Label>
          <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>Company</Label>
          <Input className="mt-1.5" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <Button disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
      </form>

      <div className="surface space-y-3 p-6">
        <h2 className="text-base font-bold">Security</h2>
        <p className="text-sm text-muted-foreground">
          We'll email you a secure link to choose a new password.
        </p>
        <Button variant="outline" onClick={resetPassword}>
          Send password reset link
        </Button>
      </div>
    </div>
  );
}
