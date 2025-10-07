import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OXAPAY_MERCHANT_API_KEY = Deno.env.get("OXAPAY_MERCHANT_API_KEY");
const OXAPAY_CALLBACK_URL = Deno.env.get("OXAPAY_CALLBACK_URL");

if (!OXAPAY_MERCHANT_API_KEY) throw new Error("Missing OXAPAY_MERCHANT_API_KEY");
if (!OXAPAY_CALLBACK_URL) throw new Error("Missing OXAPAY_CALLBACK_URL");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:8080",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    // JWT check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.split(" ")[1];
    // Optional: verify JWT here if needed

    const { amount, user_id, currency } = await req.json();
    if (!amount || !user_id || currency !== "USDT") {
      return new Response(JSON.stringify({ error: "Missing or invalid parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- OxaPay generate-invoice API call ---
    const oxaRes = await fetch("https://api.oxapay.io/api/v1/payment/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OXAPAY_MERCHANT_API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        currency: "USDT",
        callback_url: OXAPAY_CALLBACK_URL,
        user_id,
      }),
    });

    const oxaData = await oxaRes.json();

    if (!oxaRes.ok || oxaData.result !== 0) {
      console.error("OxaPay invoice error:", oxaData);
      return new Response(JSON.stringify({ error: "OxaPay invoice creation failed", details: oxaData }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:8080" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      wallet_address: oxaData.payment_url, // user pays USDT here
      trackId: oxaData.track_id,
      amount,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:8080" },
    });

  } catch (err) {
    console.error("Deposit error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:8080" },
    });
  }
});
