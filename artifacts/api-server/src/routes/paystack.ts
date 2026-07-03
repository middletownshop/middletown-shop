import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "../firebaseAdmin";

const db = admin.firestore();

const paystackRouter = Router();

const PAYSTACK_BASE_URL =
  "https://api.paystack.co";

//
// INITIALIZE PAYMENT
//
paystackRouter.post(
  "/paystack/initialize",
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        amount,
        callback_url,
        metadata = {},
      } = req.body;

      if (!email || !amount) {
        return res.status(400).json({
          success: false,
          message:
            "email and amount required",
        });
      }

      const businessAmount =
        Number(amount);

      if (
        isNaN(businessAmount) ||
        businessAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "invalid amount",
        });
      }

      const percentageFee = 0.0195;
      const fixedFee = 0.1;

      const customerPays =
        (businessAmount + fixedFee) /
        (1 - percentageFee);

      const amountInPesewas =
        Math.ceil(customerPays * 100);

      const controller =
        new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        10000
      );

      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            amount: amountInPesewas,
            currency: "GHS",
            callback_url,
            metadata: {
              ...metadata,
              businessAmount,
            },
          }),
        }
      );

      clearTimeout(timeout);

      const data: any =
        await response.json();

      if (!data.status) {
        return res.status(400).json({
          success: false,
          message: data.message,
        });
      }

      return res.json({
        success: true,
        data: data.data,
      });
    } catch (err) {
      console.error(
        "Initialize error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "initialize error",
      });
    }
  }
);

//
// VERIFY PAYMENT
//
paystackRouter.get(
  "/paystack/verify/:reference",
  async (req: Request, res: Response) => {
    try {
      const { reference } =
        req.params;

      const controller =
        new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        10000
      );

      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      clearTimeout(timeout);

      const data: any =
        await response.json();

      if (!data.status) {
        return res.status(400).json({
          success: false,
          message: data.message,
        });
      }

      return res.json({
        success: true,
        data: data.data,
      });
    } catch (err) {
      console.error(
        "Verify error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "verify error",
      });
    }
  }
);

//
// WEBHOOK
//
paystackRouter.post(
  "/paystack/webhook",
  async (req: Request, res: Response) => {
    try {
      const secret =
        process.env.PAYSTACK_SECRET_KEY;

      if (!secret) {
        return res.sendStatus(500);
      }

      const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

      if (
        hash !==
        req.headers[
          "x-paystack-signature"
        ]
      ) {
        return res.sendStatus(400);
      }

      const event: any = req.body;

      if (
        event.event ===
        "charge.success"
      ) {
        const reference =
          event.data.reference;

        const uid =
          event.data.metadata?.uid;

        const businessAmount =
          Number(
            event.data.metadata
              ?.businessAmount || 0
          );

        if (!uid || !reference) {
          return res.sendStatus(200);
        }

        const existing =
          await db
            .collection(
              "transactions"
            )
            .doc(reference)
            .get();

        if (existing.exists) {
          return res.sendStatus(200);
        }

        await db
          .collection("transactions")
          .doc(reference)
          .set({
            uid,
            reference,
            businessAmount,
            status: "success",
            createdAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });

        const userRef =
          db
            .collection("users")
            .doc(uid);

        const userSnap =
          await userRef.get();

        if (!userSnap.exists) {
          console.log(
            "User not found:",
            uid
          );

          return res.sendStatus(200);
        }

        await userRef.update({
          walletBalance:
            admin.firestore.FieldValue.increment(
              businessAmount
            ),
        });

        // Save wallet transaction
        await db
          .collection("walletTransactions")
          .add({
            userId: uid,
            type: "deposit",
            amount: businessAmount,
            reference,
            status: "completed",
            description: "Paystack Wallet Topup",
            createdAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });

        // Create receipt
        await db
          .collection("receipts")
          .add({
            customerId: uid,
            reference,
            amount: businessAmount,
            paymentMethod: "Paystack",
            status: "completed",
            type: "wallet_topup",
            description: "Wallet funded via Paystack",
            createdAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log(
          "Wallet credited:",
          uid,
          businessAmount
        );
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error(
        "Webhook error:",
        err
      );

      return res.sendStatus(500);
    }
  }
);

export default paystackRouter;