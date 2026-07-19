import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth } from "@/lib/firebase";
import { createAdminNotification } from "@/lib/firestore";

import { db } from "@/lib/firebase";

export default function PaystackSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const reference =
          params.get("reference");
       console.log(
          "PAYSTACK SUCCESS PAGE LOADED"
        );

        console.log(
          "REFERENCE:",
          reference
        );

        console.log(
          "CURRENT URL:",
          window.location.href
        );

        console.log(
          "CURRENT ORIGIN:",
          window.location.origin
        );
        
        console.log(
          "LOCAL STORAGE:",
          localStorage.getItem(
            "pendingBundlePurchase"
          )
        );
        if (!reference) {
          navigate("/");
          return;
        }

        console.log(
          "Payment reference:",
          reference
        );

        const pending = localStorage.getItem(
          "pendingBundlePurchase"
        );

        console.log("PENDING PURCHASE:", pending);

        if (!pending) {
          console.log(
            "Purchase already processed or missing"
          );

          navigate("/bundles");

          return;
        }

        const purchase =
          JSON.parse(pending);

        // Verify payment
        console.log("VERIFYING PAYMENT...");

        const response = await fetch(
          `https://paystack-api-dspq.onrender.com/api/paystack/verify/${reference}`
        );

        console.log("VERIFY RESPONSE STATUS:", response.status);

        const result = await response.json();

        console.log(
          "VERIFY RESPONSE FULL:",
          JSON.stringify(result, null, 2)
        );

        console.log("VERIFY CHECK:", {
          success: result.success,
          status: result.data?.status,
        });

        if (
          result.success === false ||
          result.data?.status !== "success"
        ) {
          console.error(
            "PAYSTACK VERIFY FAILED:",
            result
          );

          throw new Error(
            JSON.stringify(result)
          );
        }

        console.log(
          "PASSED VERIFICATION CHECK"
        );

        console.log(
          "PAYMENT VERIFIED SUCCESSFULLY"
        );
        console.log(
          "PAYMENT VERIFIED SUCCESSFULLY"
        );

        console.log(
          "CURRENT USER:",
          auth.currentUser
        );
        // Create order
        console.log("BEFORE ORDER WRITE");

        // Prevent duplicate orders
        const existingOrder = await getDocs(
          query(
            collection(db, "orders"),
            where(
              "paymentReference",
              "==",
              reference
            )
          )
        );

        if (!existingOrder.empty) {
          console.log(
            "ORDER ALREADY EXISTS FOR:",
            reference
          );

          localStorage.removeItem(
            "pendingBundlePurchase"
          );

          navigate("/bundle orders");

          return;
        }

        console.log(
          "NO EXISTING ORDER FOUND"
        );

        console.log(
          "PURCHASE OBJECT:",
          purchase
        );

        const orderRef = await addDoc(
          collection(db, "orders"),
          {
            uid: purchase.uid,
            userName: purchase.name,

            bundleId:
              purchase.bundle?.id || "",

            network:
              purchase.bundle?.network || "",

            validity:
              purchase.bundle?.validity || "",

            originalPrice:
              purchase.bundle?.price || 0,

            amountPaid:
              purchase.amount || 0,

            recipientPhone:
              purchase.phone || "",

            paymentMethod:
              "paystack",

            paymentReference:
              reference,

            status:
              "completed",

            timestamp:
              serverTimestamp(),
          }
        );

        console.log(
          "ORDER CREATED:",
          orderRef.id
        );

        createAdminNotification({
          title: "New Bundle Order",
          message: `${purchase.name || "A customer"} purchased ${purchase.bundle?.network || ""} ${purchase.bundle?.data || ""}`.trim(),
          type: "bundle_order",
          referenceId: orderRef.id,
          customerId: purchase.uid || "",
          customerName: purchase.name || "",
          customerEmail: purchase.email || "",
          amount: purchase.amount || 0,
        }).catch(() => {});

        // Create receipt
        console.log(
          "BEFORE RECEIPT WRITE"
        );

        // Create receipt
        const receiptRef = await addDoc(
          collection(db, "receipts"),
          {
            orderId: orderRef.id,

            receiptNumber:
              "RCT-" + Date.now(),

            customerId:
              purchase.uid,

            customerName:
              purchase.name,

            customerEmail:
              purchase.email,

            paymentReference:
              reference,

            totalAmount:
              purchase.amount,

            paidAt:
              new Date().toISOString(),

            items: [
              {
                name: `${purchase.bundle.network} ${purchase.bundle.data}`,
                quantity: 1,
                price:
                  purchase.amount,
              },
            ],

            createdAt:
              serverTimestamp(),
          }
        );

        console.log(
          "RECEIPT CREATED:",
          receiptRef.id
        );

        localStorage.removeItem(
          "pendingBundlePurchase"
        );

        window.location.replace(
          `/receipt/${receiptRef.id}`
        );
        } catch (error: any) {
          console.error(
            "PAYSTACK SUCCESS ERROR FULL:",
            error
          );

          console.error(
            "ERROR MESSAGE:",
            error?.message
          );

          console.error(
            "ERROR STACK:",
            error?.stack
          );

          alert(
            error?.message ||
            JSON.stringify(error)
          );
        }
    };

    verify();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-xl font-bold">
        Verifying Payment...
      </h1>
    </div>
  );
}