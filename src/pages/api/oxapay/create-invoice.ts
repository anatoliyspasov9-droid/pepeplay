// src/pages/api/oxapay/create-invoice.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { amount, user_id } = req.body;
    if (!amount || !user_id) {
      return res.status(400).json({ success: false, error: "Missing amount or user_id" });
    }

    const oxapayKey = process.env.OXAPAY_MERCHANT_API_KEY!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    // OxaPay API docs: https://docs.oxapay.com/api-reference/payment/generate-invoice
    const response = await axios.post("https://api.oxapay.com/v1/create-invoice", {
      merchant: oxapayKey,
      currency: "USDT",
      network: "TRX",
      order_id: `${user_id}-${Date.now()}`,
      amount: amount.toString(),
      callback_url: `${baseUrl}/api/oxapay/webhook`,
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}/dashboard`,
    });

    if (!response.data || !response.data.success) {
      return res.status(400).json({ success: false, error: response.data?.error || "OxaPay failed" });
    }

    const { pay_url, track_id } = response.data.result;

    return res.status(200).json({
      success: true,
      wallet_address: pay_url,
      trackId: track_id,
    });
  } catch (err: any) {
    console.error("OxaPay invoice error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.error || err.message || "Server error",
    });
  }
}
