import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// --- Check required environment variables ---
const requiredEnv = [
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_BASE_URL",
  "OXAPAY_MERCHANT_API_KEY",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// --- Initialize Supabase ---
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Express app ---
const app = express();
app.use(express.json());
app.use(cors());

// --- Test route ---
app.get("/", (req, res) => res.send("✅ OxaPay server is running."));

// --- Create Deposit Invoice ---
app.post("/api/oxapay/create-invoice", async (req, res) => {
  try {
    console.log("💡 Incoming request:", req.body);

    const { amount, user_id } = req.body;
    if (!amount || !user_id) {
      return res.status(400).json({ success: false, error: "Missing amount or user_id" });
    }

    const payload = {
      amount: Number(amount),
      currency: "USDT",
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/oxapay/webhook`,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      orderId: `${user_id}-${Date.now()}`,
    };

    const response = await axios.post(
      "https://api.oxapay.com/v1/payment/invoice",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "merchant_api_key": process.env.OXAPAY_MERCHANT_API_KEY,
        },
      }
    );

    const { payment_url, expired_at } = response.data.data;

    // Save pending transaction
    const { error: insertError } = await supabase.from("transactions").insert([
      {
        user_id,
        type: "deposit",
        amount: Number(amount),
        status: "pending",
        wallet_address: payment_url,
      },
    ]);

    if (insertError) console.error("❌ Failed to insert transaction:", insertError);

    res.json({
      success: true,
      wallet_address: payment_url,
      expiration: expired_at,
    });
  } catch (err) {
    console.error("❌ OxaPay Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data?.message || err.message });
  }
});

// --- OxaPay Webhook ---
app.post("/api/oxapay/webhook", async (req, res) => {
  try {
    console.log("✅ Webhook received:", req.body);

    const { track_id, status, amount, user_id } = req.body;

    if (!track_id || !user_id) return res.status(400).json({ success: false });

    if (status === "success") {
      // 1️⃣ Mark transaction as completed
      const { error: transactionError } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("wallet_address", track_id);

      if (transactionError) console.error("❌ Failed to update transaction:", transactionError);

      // 2️⃣ Credit user balance
      const { error: balanceError } = await supabase.rpc("increment_user_balance", {
        p_user_id: user_id,
        p_amount: Number(amount),
      });

      if (balanceError) console.error("❌ Failed to credit user balance:", balanceError);
    } else {
      // Mark transaction as failed
      const { error: failError } = await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("wallet_address", track_id);

      if (failError) console.error("❌ Failed to mark transaction failed:", failError);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false });
  }
});

// --- Start server ---
const PORT = 8080;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
