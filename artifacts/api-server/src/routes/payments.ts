import { Router } from "express";
import { VerifyPaymentBody } from "@workspace/api-zod";

const router = Router();

router.post("/payments/verify", async (req, res) => {
  const parseResult = VerifyPaymentBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { reference, orderId } = parseResult.data;
  const secretKey = process.env["PAYSTACK_SECRET_KEY"];

  if (!secretKey) {
    req.log.error("PAYSTACK_SECRET_KEY is not set");
    res.status(500).json({ error: "Payment service not configured" });
    return;
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paystackRes.ok) {
      req.log.error(
        { status: paystackRes.status, orderId, reference },
        "Paystack API returned non-OK status"
      );
      res.status(400).json({ error: "Payment verification failed" });
      return;
    }

    const paystackData = (await paystackRes.json()) as {
      status: boolean;
      message: string;
      data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at: string;
        id: number;
      };
    };

    if (!paystackData.status || paystackData.data?.status !== "success") {
      req.log.warn(
        { reference, orderId, paystackStatus: paystackData.data?.status },
        "Payment not successful"
      );
      res.status(400).json({
        success: false,
        message: paystackData.message || "Payment was not successful",
        transactionId: null,
        amount: null,
        currency: null,
        paidAt: null,
      });
      return;
    }

    const txData = paystackData.data;
    req.log.info(
      { reference, orderId, amount: txData.amount },
      "Payment verified successfully"
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      transactionId: String(txData.id),
      amount: txData.amount / 100,
      currency: txData.currency,
      paidAt: txData.paid_at,
    });
  } catch (err) {
    req.log.error({ err, reference, orderId }, "Error verifying payment");
    res.status(500).json({ error: "Internal server error during payment verification" });
  }
});

export default router;
