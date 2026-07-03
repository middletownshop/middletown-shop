import express from "express";
import crypto from "crypto";

// import your DB (adjust to your project)
import { db, admin } from "../lib/firebase"; // change if needed

const router = express.Router();

/**
 * PAYSTACK WEBHOOK
 */
router.post("/paystack/webhook", async (req: any, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY");
      return res.sendStatus(500);
    }

    // ─────────────────────────────────────────────
    // VERIFY PAYSTACK SIGNATURE (SECURITY CHECK)
    // ─────────────────────────────────────────────
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.sendStatus(400);
    }

    const event = req.body;

    // ─────────────────────────────────────────────
    // PAYMENT SUCCESS EVENT
    // ─────────────────────────────────────────────
    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const amount = event.data.amount / 100;
      const uid = event.data.metadata?.uid;
      const businessAmount = event.data.metadata?.businessAmount || amount;

      if (!reference || !uid) {
        return res.sendStatus(200);
      }

      // ─────────────────────────────────────────────
      // IDENTITY CHECK (PREVENT DOUBLE CREDIT)
      // ─────────────────────────────────────────────
      const txRef = await db.collection("transactions").doc(reference).get();

      if (txRef.exists) {
        return res.sendStatus(200);
      }

      // ─────────────────────────────────────────────
      // SAVE TRANSACTION
      // ─────────────────────────────────────────────
      await db.collection("transactions").doc(reference).set({
        uid,
        reference,
        amountPaid: amount,
        creditedAmount: businessAmount,
        status: "success",
        createdAt: Date.now(),
      });

      // ─────────────────────────────────────────────
      // CREDIT WALLET
      // ─────────────────────────────────────────────
      await db.collection("wallets").doc(uid).set(
        {
          balance: admin.firestore.FieldValue.increment(
            Number(businessAmount)
          ),
        },
        { merge: true }
      );

      console.log("✅ WALLET CREDITED:", {
        uid,
        reference,
        businessAmount,
      });
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});

export default router;