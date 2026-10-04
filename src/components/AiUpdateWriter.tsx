import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { draftTrackingUpdate } from "@/lib/ai-update.functions";
import { SHIP_STATUSES, STATUS_LABEL, type ShipStatus } from "@/lib/swift";

export function AiUpdateWriter({ trackingId, currentStatus }: { trackingId: string; currentStatus: ShipStatus }) {
  const qc = useQueryClient();
  const draft = useServerFn(draftTrackingUpdate);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ShipStatus>(currentStatus);
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [writing, setWriting] = useState(false);
  const [posting, setPosting] = useState(false);

  async function write() {
    if (notes.trim().length < 3) return toast.error("Add a few rough details first.");
    setWriting(true);
    try {
      const r = await draft({ data: { trackingId, notes, status, location } });
      setTitle(r.title);
      setNote(r.note);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not write the update.");
    } finally {
      setWriting(false);
    }
  }

  async function post() {
    setPosting(true);
    const { error } = await supabase.from("tracking_events").insert({
      tracking_code_id: trackingId,
      status,
      title: title.trim().slice(0, 120),
      note: note.trim().slice(0, 600),
      location: location.trim().slice(0, 200),
    });
    setPosting(false);
    if (error) return toast.error("Could not post the update.");
    toast.success("Update posted to the customer's timeline.");
    setNotes("");
    setTitle("");
    setNote("");
    qc.invalidateQueries();
  }

  return (
    <div className="surface p-6">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Sparkles className="h-4 w-4 text-primary" /> AI Update Writer
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Jot down rough details and AI turns them into a clear update for your customer.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Status for this update</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ShipStatus)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SHIP_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Location (optional)</Label>
          <Input className="mt-1.5" maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Rough details</Label>
          <Textarea
            className="mt-1.5"
            maxLength={1500}
            placeholder="e.g. truck delayed at lagos hub, customs check, should leave tmrw morning"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <Button className="mt-3" onClick={write} disabled={writing}>
        <Sparkles className="mr-1.5 h-4 w-4" />
        {writing ? "Writing…" : note ? "Rewrite" : "Write update"}
      </Button>

      {note && (
        <div className="mt-5 space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div>
            <Label>Headline</Label>
            <Input className="mt-1.5" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Customer message</Label>
            <Textarea className="mt-1.5" maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={post} disabled={posting || !title.trim() || !note.trim()}>
            {posting ? "Posting…" : "Post to timeline"}
          </Button>
        </div>
      )}
    </div>
  );
}
