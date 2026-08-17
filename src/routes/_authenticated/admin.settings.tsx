import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeletons } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

const FIELDS: { key: string; label: string }[] = [
  { key: "bank_name", label: "Bank Name" },
  { key: "account_name", label: "Account Name" },
  { key: "account_number", label: "Account Number" },
  { key: "telegram_url", label: "Telegram Channel URL" },
  { key: "support_url", label: "Support Chat URL" },
];

function AdminSettings() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => (map[r.key] = r.value));
      return map;
    },
  });

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  async function save() {
    setSaving(true);
    const rows = FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? "" }));
    const { error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save settings.");
      return;
    }
    toast.success("Settings saved.");
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
  }

  if (isLoading) return <Skeletons rows={4} />;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Platform Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bank transfer details and support links shown to customers.
        </p>
      </div>

      <div className="surface space-y-4 p-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
