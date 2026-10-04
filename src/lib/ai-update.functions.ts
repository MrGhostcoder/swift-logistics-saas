import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUSES = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception"] as const;

export const draftTrackingUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        trackingId: z.string().uuid(),
        notes: z.string().trim().min(3).max(1500),
        status: z.enum(STATUSES),
        location: z.string().trim().max(200).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // RLS: only the owner or an admin can read this shipment
    const { data: tc } = await context.supabase
      .from("tracking_codes")
      .select("code, package_name, origin, destination")
      .eq("id", data.trackingId)
      .maybeSingle();
    if (!tc) throw new Error("Shipment not found.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      maxRetries: 0,
      system:
        "You write shipment tracking updates shown to customers on a public tracking page. " +
        "Be clear, calm, professional and factual. Never invent facts, times, or locations not given. " +
        "Do not mention internal staff names, systems or blame. " +
        "Reply in exactly this format and nothing else:\nTITLE: <short headline, max 8 words>\nNOTE: <1-3 sentences for the customer, max 60 words>",
      prompt:
        `Shipment ${tc.code} (${tc.package_name || "package"}), ${tc.origin || "?"} → ${tc.destination || "?"}.\n` +
        `New status: ${data.status.replace(/_/g, " ")}.\n` +
        (data.location ? `Location: ${data.location}.\n` : "") +
        `Manager's rough notes: ${data.notes}`,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    let text: string;
    try {
      text = await result.text;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 429) throw new Error("AI is busy right now. Please try again in a minute.");
      if (status === 402) throw new Error("AI credits are used up. Please add credits to continue.");
      throw new Error("Could not write the update. Please try again.");
    }

    const title = text.match(/TITLE:\s*(.+)/i)?.[1]?.trim().slice(0, 120) ?? "";
    const note = text.match(/NOTE:\s*([\s\S]+)/i)?.[1]?.trim().slice(0, 600) ?? text.trim().slice(0, 600);
    if (!note) throw new Error("The AI did not return an update. Please try again.");
    return { title: title || "Shipment update", note };
  });
