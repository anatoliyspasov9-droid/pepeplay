// /api/oxapay/webhook.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body;
    console.log("OxaPay webhook received:", payload);

    const trackId = payload?.track_id;
    const status = payload?.status;
    const amount = parseFloat(payload?.amount || "0");

    if (!trackId || !status) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Update deposit status
    const { data: deposit, error: depErr } = await supabaseAdmin
      .from("deposits")
      .update({ status })
      .eq("track_id", trackId)
      .select()
      .single();

    if (depErr) throw depErr;
    if (!deposit) throw new Error("Deposit not found for track ID");

    // If payment confirmed or paid, credit user's balance
    if (status === "paid" || status === "confirmed") {
      const userId = deposit.user_id;

      const { error: balanceErr } = await supabaseAdmin.rpc("increment_balance", {
        user_id: userId,
        amount: amount,
      });

      if (balanceErr) throw balanceErr;
      console.log(`✅ Credited $${amount} to user ${userId}`);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: err.message });
  }
}
