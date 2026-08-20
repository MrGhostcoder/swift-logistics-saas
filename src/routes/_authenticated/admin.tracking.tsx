import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Skeletons, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, SHIP_STATUSES, STATUS_LABEL, type ShipStatus } from "@/lib/swift";

export const Route = createFileRoute("/_authenticated/admin/tracking")({
  component: AdminTracking,
});

type Row = {
  id: string;
  code: string;
  package_name: string | null;
  recipient_name: string | null;
  origin: string | null;
  destination: string | null;
  current_location: string | null;
  estimated_delivery: string | null;
  status: string;
  created_at: string;
};

const STATUS_FILTERS = ["all", ...SHIP_STATUSES] as const;

function AdminTracking() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [eventFor, setEventFor] = useState<Row | null>(null);
  const [eventForm, setEventForm] = useState({
    status: "in_transit",
    title: "",
    location: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracking_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: ShipStatus) {
    const { error } = await supabase.from("tracking_codes").update({ status }).eq("id", id);
    if (error) {
      toast.error("Could not update status.");
      return;
    }
    toast.success("Status updated.");
    qc.invalidateQueries({ queryKey: ["admin-tracking"] });
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      package_name: row.package_name ?? "",
      recipient_name: row.recipient_name ?? "",
      origin: row.origin ?? "",
      destination: row.destination ?? "",
      current_location: row.current_location ?? "",
      estimated_delivery: row.estimated_delivery ?? "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase
      .from("tracking_codes")
      .update({
        package_name: form["package_name"] ?? "",
        recipient_name: form["recipient_name"] ?? "",
        origin: form["origin"] ?? "",
        destination: form["destination"] ?? "",
        current_location: form["current_location"] ?? "",
        estimated_delivery: form["estimated_delivery"] ? form["estimated_delivery"] : null,
      })
      .eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error("Could not save shipment.");
      return;
    }
    toast.success("Shipment updated.");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-tracking"] });
  }

  async function addEvent() {
    if (!eventFor) return;
    if (!eventForm.title.trim()) {
      toast.error("Add a title for the event.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("tracking_events").insert({
      tracking_code_id: eventFor.id,
      status: eventForm.status as ShipStatus,
      title: eventForm.title.trim(),
      location: eventForm.location.trim(),
      note: eventForm.note.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error("Could not add the timeline event.");
      return;
    }
    toast.success("Timeline event added.");
    setEventFor(null);
    setEventForm({ status: "in_transit", title: "", location: "", note: "" });
    qc.invalidateQueries();
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete ${row.code}? This also removes its timeline and messages.`)) return;
    const { error } = await supabase.from("tracking_codes").delete().eq("id", row.id);
    if (error) {
      toast.error("Could not delete this shipment.");
      return;
    }
    toast.success("Shipment deleted.");
    qc.invalidateQueries({ queryKey: ["admin-tracking"] });
  }

  const term = q.trim().toLowerCase();
  const rows = ((data ?? []) as Row[]).filter(
    (c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (!term ||
        c.code.toLowerCase().includes(term) ||
        (c.recipient_name ?? "").toLowerCase().includes(term) ||
        (c.package_name ?? "").toLowerCase().includes(term)),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">All Tracking Codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit shipment details, push timeline updates or remove codes.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, package or recipient"
          className="max-w-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABEL[s as ShipStatus]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeletons rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Package} title="No tracking codes" description="Nothing matches your search." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Code", "Package", "Recipient", "Route", "Status", "Created", "Update", "Actions"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">
                    <a
                      href={`/track/${c.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      {c.code}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                  <td className="px-4 py-3">{c.package_name || "—"}</td>
                  <td className="px-4 py-3">{c.recipient_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(c.origin || "—") + " → " + (c.destination || "—")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => setStatus(c.id, e.target.value as ShipStatus)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      {SHIP_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEventFor(c);
                          setEventForm({
                            status: c.status,
                            title: "",
                            location: c.current_location ?? "",
                            note: "",
                          });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(c)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit shipment {editing?.code}</DialogTitle>
            <DialogDescription>Changes are visible on the public tracking page.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "package_name", label: "Package name" },
              { key: "recipient_name", label: "Recipient" },
              { key: "origin", label: "Origin" },
              { key: "destination", label: "Destination" },
              { key: "current_location", label: "Current location" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="estimated_delivery">Estimated delivery</Label>
              <Input
                id="estimated_delivery"
                type="date"
                value={form["estimated_delivery"] ?? ""}
                onChange={(e) => setForm((v) => ({ ...v, estimated_delivery: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventFor} onOpenChange={(o) => !o && setEventFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add timeline event · {eventFor?.code}</DialogTitle>
            <DialogDescription>
              Adds a custom entry to the public tracking timeline without changing the status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-status">Status shown</Label>
              <select
                id="ev-status"
                value={eventForm.status}
                onChange={(e) => setEventForm((v) => ({ ...v, status: e.target.value }))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {SHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                value={eventForm.title}
                onChange={(e) => setEventForm((v) => ({ ...v, title: e.target.value }))}
                placeholder="Arrived at sorting facility"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-location">Location</Label>
              <Input
                id="ev-location"
                value={eventForm.location}
                onChange={(e) => setEventForm((v) => ({ ...v, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-note">Internal note (optional)</Label>
              <Textarea
                id="ev-note"
                value={eventForm.note}
                onChange={(e) => setEventForm((v) => ({ ...v, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventFor(null)}>
              Cancel
            </Button>
            <Button onClick={addEvent} disabled={busy}>
              {busy ? "Adding…" : "Add event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
