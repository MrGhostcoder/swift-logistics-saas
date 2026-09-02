import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

type TronTransfer = {
  transaction_id: string;
  to: string;
  value: string;
  token_info?: { address?: string; decimals?: number; symbol?: string };
};

/**
 * Looks up recent incoming USDT (TRC20) transfers for the merchant wallet and
 * returns the one matching the given transaction hash.
 */
async function findTronTransfer(wallet: string, txHash: string) {
  const url =
    `https://api.trongrid.io/v1/accounts/${wallet}/transactions/trc20` +
    `?only_to=true&limit=200&contract_address=${USDT_TRC20_CONTRACT}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("Could not reach the Tron network right now.");
  const json = (await res.json()) as { data?: TronTransfer[] };
  const hash = txHash.trim().toLowerCase().replace(/^0x/, "");
  const match = (json.data ?? []).find(
    (t) => (t.transaction_id ?? "").toLowerCase() === hash,
  );
  if (!match) return null;
  const decimals = match.token_info?.decimals ?? 6;
  return {
    to: match.to,
    amount: Number(match.value) / 10 ** decimals,
    symbol: match.token_info?.symbol ?? "USDT",
  };
}

export const verifyUsdtPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        paymentId: z.string().uuid(),
        txHash: z.string().trim().min(20).max(120),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: payment, error } = await supabase
      .from("payments")
      .select("id, user_id, plan_id, amount, status")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (error) throw new Error("Could not load the payment.");
    if (!payment || payment.user_id !== userId) throw new Error("Payment not found.");
    if (payment.status === "approved") {
      return { status: "approved" as const, message: "Payment already confirmed." };
    }

    const { data: settings } = await supabase.rpc("get_public_settings");
    const wallet = (settings ?? []).find(
      (s: { key: string; value: string }) => s.key === "usdt_address",
    )?.value;
    if (!wallet) throw new Error("No merchant wallet is configured.");

    const { data: plan } = await supabase
      .from("plans")
      .select("price")
      .eq("id", payment.plan_id ?? "")
      .maybeSingle();
    const expected = Number(plan?.price ?? payment.amount ?? 0);

    const transfer = await findTronTransfer(wallet, data.txHash);
    if (!transfer) {
      return {
        status: "pending" as const,
        message:
          "We could not find that transaction on-chain yet. It can take a minute to confirm — an admin will verify it if it does not settle automatically.",
      };
    }
    if (transfer.to.toLowerCase() !== wallet.toLowerCase()) {
      return { status: "pending" as const, message: "That transaction was not sent to our wallet." };
    }
    // 1% tolerance for network rounding
    if (transfer.amount + 0.0001 < expected * 0.99) {
      return {
        status: "pending" as const,
        message: `Amount received (${transfer.amount} USDT) is less than the plan price (${expected} USDT).`,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: settleError } = await supabaseAdmin.rpc("settle_payment_onchain", {
      _payment_id: payment.id,
      _tx_hash: data.txHash.trim(),
      _amount: transfer.amount,
    });
    if (settleError) throw new Error("Payment verified on-chain but could not be activated.");

    return {
      status: "approved" as const,
      message: `Received ${transfer.amount} USDT — your plan is active.`,
    };
  });
