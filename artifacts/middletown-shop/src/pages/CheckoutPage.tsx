import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createOrder, markOrderPaid, createReceipt } from "@/lib/firestore";
import toast from "react-hot-toast";
import { Shield, CreditCard } from "lucide-react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ShippingForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;

  deliveryType: "pickup" | "delivery";

  // NEW
  deliveryPayment: "store" | "dispatch";
  deliveryArea: "Accra" | "Tema" | "Outside Accra";

  notes: string;
}

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const {
    user,
    userProfile,
    refreshProfile,
  } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ShippingForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",

    deliveryType: "pickup",

    // NEW
    deliveryPayment: "store",
    deliveryArea: "Accra",

    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "wallet">("paystack");
  
  const update = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const deliveryFees = {
    "Accra": 35,
    "Tema": 60,
    "Outside Accra": 80,
  };

  const deliveryFee =
    form.deliveryType === "delivery" &&
    form.deliveryPayment === "store"
      ? deliveryFees[form.deliveryArea]
      : 0;

  
  const finalTotal = cartTotal + deliveryFee;
  
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty"); return; }

    const {
      name,
      phone,
      address,
      city,
      state,
      deliveryType,
    } = form;

    if (!name || !phone) {
      toast.error("Please enter name and phone");
      return;
    }

    if (
      deliveryType === "delivery" &&
      (!address || !city || !state)
    ) {
      toast.error(
        "Please complete delivery address"
      );
      return;
    }

    setLoading(true);
    let orderId = "";
    const reference = `MS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      // Create order in Firestore first
      orderId = await createOrder({
        customerId: user.uid,
        customerEmail: user.email || "",
        customerName: name,
        items: cartItems.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        shippingInfo: {
          name,
          phone,
          address,
          city,
          state,

          deliveryType,

          deliveryPayment: form.deliveryPayment,

          deliveryArea: form.deliveryArea,

          deliveryFee,

          notes: form.notes,
        },
        totalAmount: finalTotal,
        paymentReference: reference,
      });

      setLoading(false);
      if (paymentMethod === "wallet") {

        const walletBalance =
          Number(userProfile?.walletBalance || 0);

        if (walletBalance < finalTotal) {
          toast.error("Insufficient wallet balance");
          setLoading(false);
          return;
        }


        const userRef = doc(db, "users", user.uid);

        await runTransaction(db, async (tx) => {
          const userDoc = await tx.get(userRef);

          if (!userDoc.exists()) {
            throw new Error("User not found");
          }

          const balance =
            userDoc.data().walletBalance || 0;

          if (balance < finalTotal) {
            throw new Error("Insufficient wallet balance");
          }

          tx.update(userRef, {
            walletBalance: balance - finalTotal,
          });
        });

        await markOrderPaid(
          orderId,
          reference,
          finalTotal,
          "GHS",
          new Date().toISOString()
        );

        const receiptId = await createReceipt({
          receiptNumber: `RCP-${Date.now()}`,
          orderId,
          customerId: user.uid,
          customerName: name,
          customerEmail: user.email || "",

          items: cartItems.map(i => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),

          totalAmount: finalTotal,
          paymentReference: reference,
          paidAt: new Date().toISOString(),
        });

        await refreshProfile();
        
        clearCart();

        toast.success("Payment successful");

        navigate(`/receipt/${receiptId}`);
        return;
      }
      
      // Open Paystack
      const PaystackPop = (window as any).PaystackPop;

      if (!PaystackPop) {
        toast.error("Paystack not loaded");
        setLoading(false);
        return;
      }

      if (!user?.email) {
        toast.error("No email found on account");
        setLoading(false);
        return;
      }

      const verifyPayment = async (
        response: { reference: string }
      ) => {
        try {
          setLoading(true);

          const verifyRes = await fetch(
            `${import.meta.env.VITE_API_URL}/paystack/verify/${response.reference}`
          );

          const result = await verifyRes.json();

          if (!result.success) {
            toast.error("Payment verification failed");
            return;
          }

          await markOrderPaid(
            orderId,
            response.reference,
            finalTotal,
            "GHS",
            new Date().toISOString()
          );

          const receiptId = await createReceipt({
            receiptNumber: `RCP-${Date.now()}`,
            orderId,
            customerId: user.uid,
            customerName: name,
            customerEmail: user.email,
            items: cartItems.map((i) => ({
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              image: i.image,
            })),
            totalAmount: finalTotal,
            paymentReference: response.reference,
            paidAt: new Date().toISOString(),
          });

          clearCart();

          toast.success("Payment Successful");

          navigate(`/receipt/${receiptId}`);
        } catch (err) {
          console.error(err);
          toast.error("Verification failed");
        } finally {
          setLoading(false);
        }
      };

      console.log("Paystack key:", import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);
      console.log("User email:", user.email);
      console.log("Amount:", cartTotal * 100);

      const handler = PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(cartTotal * 100),
        currency: "GHS",
        ref: reference,

        metadata: {
          orderId,
          customerName: name,
          uid: user.uid,
        },

        callback: function (response: any) {
          verifyPayment(response);
        },

        onClose: function () {
          toast.error("Payment cancelled");
          setLoading(false);
        },
      });

      handler.openIframe();
      handler?.openIframe();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate checkout. Please try again.");
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <button onClick={() => navigate("/products")} className="bg-primary text-white px-6 py-2 rounded-lg">Browse Products</button>
      </div>
    );
  }

  const REGIONS = [
    "Greater Accra",
    "Ashanti",
    "Western",
    "Eastern",
    "Central",
    "Volta",
    "Northern",
    "Upper East",
    "Upper West",
    "Bono",
    "Bono East",
    "Ahafo",
    "Oti",
    "North East",
    "Savannah",
    "Western North",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>
      <form onSubmit={handlePay}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Shipping form */}
          <div className="lg:col-span-2 bg-white border border-border rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Delivery Method
              </label>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.deliveryType === "delivery"}
                    onChange={() =>
                      setForm({
                        ...form,
                        deliveryType: "delivery",
                      })
                    }
                  />
                  Delivery
                </label>

                <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.deliveryType === "pickup"}
                    onChange={() =>
                      setForm({
                        ...form,
                        deliveryType: "pickup",
                      })
                    }
                  />
                  Pickup
                </label>
              </div>
            </div>

            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                1
              </span>
              Shipping Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                <input value={form.name} onChange={update("name")} required placeholder="Your full name" data-testid="input-shipping-name"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                <input value={form.phone} onChange={update("phone")} required placeholder="0257869403" data-testid="input-shipping-phone"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              {form.deliveryType === "delivery" && (
                <>
                  {/* Delivery Fee */}
                  {form.deliveryType === "delivery" && (
                    <div className="space-y-3 border rounded-xl p-4 bg-gray-50">

                      <h3 className="font-bold">
                        Delivery Option
                      </h3>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryFeeType"
                          value="store"
                          checked={form.deliveryPayment === "store"}
                          onChange={() =>
                            setForm({
                              ...form,
                              deliveryPayment: "store",
                            })
                          }
                        />

                        <div>
                          <p className="font-semibold">
                            Store Delivery Fee
                          </p>

                          <p className="text-sm text-gray-500">
                            The store will calculate the delivery fee after confirming your location.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryFeeType"
                          value="rider"
                          checked={form.deliveryPayment === "dispatch"}
                          onChange={() =>
                            setForm({
                              ...form,
                              deliveryPayment: "dispatch",
                            })
                          }
                        />

                        <div>
                          <p className="font-semibold">
                            Agree With Dispatch Rider
                          </p>

                          <p className="text-sm text-gray-500">
                            Pay for your items now and agree on the delivery fee directly with the dispatch rider.
                          </p>
                        </div>
                      </label>

                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Region *
                    </label>

                    <select
                      value={form.state}
                      onChange={update("state")}
                      data-testid="select-shipping-state"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    >
                      <option value="">Select Region</option>

                      {REGIONS.map(region => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      City *
                    </label>

                    <input
                      value={form.city}
                      onChange={update("city")}
                      placeholder="City"
                      data-testid="input-shipping-city"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Street Address *
                    </label>

                    <input
                      value={form.address}
                      onChange={update("address")}
                      placeholder="House number, street name, area"
                      data-testid="input-shipping-address"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}
              </div>
            <div className="mt-6 pt-5 border-t border-border">

              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                Payment Method
              </h2>

              <div className="space-y-3">

                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMethod === "paystack"}
                    onChange={() => setPaymentMethod("paystack")}
                  />
                  <span>Paystack</span>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMethod === "wallet"}
                    onChange={() => setPaymentMethod("wallet")}
                  />
                  <div>
                    <p>Wallet Balance</p>
                    <p className="text-xs">
                      ₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}
                    </p>
                  </div>
                </label>

              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span>Your payment is secured by Paystack.</span>
              </div>

            </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span>Your payment is secured by Paystack.</span>
              </div>

            </div>

          {/* Order summary */}
          <div>
            <div className="bg-white border border-border rounded-xl p-5 sticky top-20">
              <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <img src={item.image || "https://placehold.co/40x40/e2e8f0/64748b?text=Item"} alt={item.name} className="w-10 h-10 object-cover rounded border border-border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold">₵{Number((item.price || 0) * item.quantity).toLocaleString("en-GH")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 mb-5">

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₵{cartTotal.toLocaleString("en-GH")}</span>
                </div>

                {form.deliveryType === "delivery" &&
                  form.deliveryPayment === "store" && (
                    <div className="flex justify-between text-sm mt-2">
                      <span>Delivery Fee</span>
                      <span>₵{deliveryFee}</span>
                    </div>
                )}

                {form.deliveryPayment === "store" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Delivery Area
                    </label>

                    <select
                      value={form.deliveryArea}
                      onChange={update("deliveryArea")}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="Accra">Accra</option>
                      <option value="Tema">Tema</option>
                      <option value="Outside Accra">Outside Accra</option>
                    </select>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg mt-3 border-t pt-2">
                  <span>Total</span>
                  <span>₵{finalTotal.toLocaleString("en-GH")}</span>
                </div>

              </div>
              <button type="submit" disabled={loading} data-testid="button-pay"
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : (
                  <>Pay ₵{Number(finalTotal || 0).toLocaleString("en-GH")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
