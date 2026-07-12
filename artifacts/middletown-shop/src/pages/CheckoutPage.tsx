import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createOrder, markOrderPaid, createReceipt } from "@/lib/firestore";
import toast from "react-hot-toast";
import { 
  doc,
  runTransaction,
  getDocs,
  updateDoc,
  collection,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDeliverySettings } from "@/lib/firestore";
import { 
  Truck, 
  Store, 
  Wallet, 
  Tag, 
  User, 
  Phone, 
  MapPin, 
  MessageSquare,
  CreditCard,
  ShoppingBag,
  ArrowLeft
} from "lucide-react";

interface ShippingForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  deliveryType: "pickup" | "delivery";
  deliveryPayment: "store" | "dispatch";
  deliveryArea: "Accra" | "Tema" | "Outside Accra";
  notes: string;
}

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ShippingForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    deliveryType: "delivery",
    deliveryPayment: "store",
    deliveryArea: "Accra",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const update = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const deliveryFees = {
    Accra: Number(deliverySettings?.accraFee || 35),
    Tema: Number(deliverySettings?.temaFee || 60),
    "Outside Accra": Number(deliverySettings?.outsideAccraFee || 80),
  };

  const deliveryFee =
    form.deliveryType === "delivery" && form.deliveryPayment === "store"
      ? deliveryFees[form.deliveryArea]
      : 0;

  const subtotalWithDelivery = cartTotal + deliveryFee;
  const finalTotal = Math.max(subtotalWithDelivery - couponDiscount, 0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getDeliverySettings();
        setDeliverySettings(settings);
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    try {
      const q = query(
        collection(db, "coupons"),
        where("code", "==", couponCode.trim())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Coupon not found");
        return;
      }

      const couponDoc = snapshot.docs[0];
      const coupon = couponDoc.data();

      if (coupon.used) {
        toast.error("Coupon already used");
        return;
      }

      if (coupon.userId !== user?.uid) {
        toast.error("This coupon is not yours");
        return;
      }

      if (coupon.expiresAt.toDate() < new Date()) {
        toast.error("Coupon expired");
        return;
      }

      const discountAmount = (cartTotal + deliveryFee) * (coupon.discount / 100);
      setAppliedCoupon({ id: couponDoc.id, ...coupon });
      setCouponDiscount(discountAmount);
      toast.success(`${coupon.discount}% coupon applied`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply coupon");
    }
  };

  const markCouponUsed = async () => {
    if (!appliedCoupon) return;
    try {
      await updateDoc(doc(db, "coupons", appliedCoupon.id), { used: true });
    } catch (error) {
      console.error("Coupon update failed", error);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty"); return; }

    const { name, phone, address, city, state, deliveryType } = form;

    if (!name || !phone) {
      toast.error("Please enter name and phone");
      return;
    }

    if (deliveryType === "delivery" && (!address || !city || !state)) {
      toast.error("Please complete delivery address");
      return;
    }

    setLoading(true);
    const reference = `MS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      const orderId = await createOrder({
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

      const walletBalance = Number(userProfile?.walletBalance || 0);
      if (walletBalance < finalTotal) {
        toast.error("Insufficient wallet balance");
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      await runTransaction(db, async (tx) => {
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found");
        const balance = userDoc.data().walletBalance || 0;
        if (balance < finalTotal) throw new Error("Insufficient wallet balance");
        tx.update(userRef, { walletBalance: balance - finalTotal });
      });

      await markOrderPaid(orderId, reference, finalTotal, "GHS", new Date().toISOString());
      await markCouponUsed();

      const receiptId = await createReceipt({
        receiptNumber: `RCP-${Date.now()}`,
        orderId,
        orderType: "shop",
        customerId: user.uid,
        customerName: name,
        customerEmail: user.email || "",
        items: cartItems.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        totalAmount: finalTotal,
        paymentReference: reference,
        paidAt: new Date().toISOString(),
      });

      await refreshProfile();
      clearCart();
      toast.success("Payment successful");
      setLoading(false);
      navigate(`/receipt/${receiptId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate checkout. Please try again.");
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-6 font-medium">Your checkout cart is empty.</p>
        <button onClick={() => navigate("/products")} className="w-full bg-primary text-white py-3 rounded-xl font-bold tracking-wide shadow-sm hover:bg-primary/95 transition-all">
          Browse Premium Products
        </button>
      </div>
    );
  }

  const REGIONS = [
    "Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Volta",
    "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
    "Oti", "North East", "Savannah", "Western North"
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Upper Navigation Header */}
      <div className="mb-8 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 border rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Secure Checkout</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Complete your luxury order via your balance pool</p>
        </div>
      </div>

      <form onSubmit={handlePay} className="grid lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: INFORMATION DECKS */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: DELIVERY OPTION TYPE SELECTOR */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-foreground text-base mb-4 flex items-center gap-2.5">
              <span className="w-6 "><Truck className="w-5 h-5 text-primary" /></span>
              Choose Delivery Track
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => setForm(f => ({ ...f, deliveryType: "delivery" }))}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${form.deliveryType === "delivery" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-muted-foreground/30"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-foreground">Doorstep Delivery</span>
                  <input type="radio" checked={form.deliveryType === "delivery"} readOnly className="text-primary focus:ring-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Receive your items straight to your precise home or workspace destination.</p>
              </div>

              <div 
                onClick={() => setForm(f => ({ ...f, deliveryType: "pickup" }))}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${form.deliveryType === "pickup" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-muted-foreground/30"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-foreground">Self-Pickup Station</span>
                  <input type="radio" checked={form.deliveryType === "pickup"} readOnly className="text-primary focus:ring-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Pick up directly from our local logistics hub at your own convenience.</p>
              </div>
            </div>
          </div>

          {/* SHIPPING CORE DETAILS INPUT */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="font-bold text-foreground text-base flex items-center gap-2.5">
              <span className="w-6"><User className="w-5 h-5 text-primary" /></span>
              Contact & Fulfillment Information
            </h2>

            {/* Pickup Node Alert Info Box */}
            {form.deliveryType === "pickup" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-900 text-sm">Hub Collection Address</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-blue-900/80">
                  <p><strong>Pickup Location:</strong><br />{deliverySettings?.pickupAddress || "Accra, Circle"}</p>
                  <p><strong>Working Hours:</strong><br />{deliverySettings?.workingHours || "Mon - Sat, 8:00 AM - 6:00 PM"}</p>
                </div>
              </div>
            )}

            {/* Core Form Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Full Name</label>
                <div className="relative">
                  <input value={form.name} onChange={update("name")} required placeholder="John Doe" className="w-full border border-border rounded-xl pl-3 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Phone Number</label>
                <input value={form.phone} onChange={update("phone")} required placeholder="025 786 9403" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>

              {/* DYNAMIC DOORSTEP FIELDS */}
              {form.deliveryType === "delivery" && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Region</label>
                    <select value={form.state} onChange={update("state")} required className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                      <option value="">Select Region</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">City</label>
                    <input value={form.city} onChange={update("city")} required placeholder="East Legon" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Street Address</label>
                    <input value={form.address} onChange={update("address")} required placeholder="House No, Street Name, Close Landmarks" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>

                  {/* DELIVERY PRICING OPTIONS MATRIX */}
                  <div className="sm:col-span-2 space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h3 className="font-bold text-xs uppercase tracking-wide text-muted-foreground">Delivery Logistics Split</h3>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className={`flex items-start gap-3 p-3 border rounded-xl bg-white cursor-pointer transition-all ${form.deliveryPayment === "store" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                        <input type="radio" name="deliveryPayment" checked={form.deliveryPayment === "store"} onChange={() => setForm(f => ({ ...f, deliveryPayment: "store" }))} className="mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Standard Upfront Fee</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Calculated natively by the application system baseline instantly.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 border rounded-xl bg-white cursor-pointer transition-all ${form.deliveryPayment === "dispatch" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                        <input type="radio" name="deliveryPayment" checked={form.deliveryPayment === "dispatch"} onChange={() => setForm(f => ({ ...f, deliveryPayment: "dispatch" }))} className="mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Pay Rider Directly</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Pay item total now, handle courier expense upon handoff delivery.</p>
                        </div>
                      </label>
                    </div>

                    {form.deliveryPayment === "store" && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Delivery Target Zone</label>
                        <select value={form.deliveryArea} onChange={update("deliveryArea")} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                          <option value="Accra">Accra/ Greater (₵{deliveryFees.Accra})</option>
                          <option value="Tema">Tema / Greater  (₵{deliveryFees.Tema})</option>
                          <option value="Outside Accra">Outside Accra  (₵{deliveryFees["Outside Accra"]})</option>
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ADDITIONAL COMMUNICATOR NOTES */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Order Notes (Optional)</label>
                <textarea value={form.notes} onChange={update("notes")} rows={2} placeholder="Gate code, drop-off details, or special requests..." className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          </div>

          {/* STEP 2: SECURE WALLET DECK LAYER */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-foreground text-base mb-4 flex items-center gap-2.5">
              <span className="w-6"><CreditCard className="w-5 h-5 text-primary" /></span>
              Payment Method
            </h2>

            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg"><Wallet className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-bold text-emerald-900 tracking-wide uppercase">Available Account Balance</p>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500 text-white px-2 py-1 rounded-full">Active Sec</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY DECK */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm tracking-wide uppercase border-b pb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              Basket Lineup
            </h3>

            {/* Scrollable Items Container */}
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={item.productId} className="flex gap-3 items-center justify-between border-b border-dashed border-muted/60 pb-2 last:border-0 last:pb-0">
                  <div className="flex gap-2.5 items-center min-w-0">
                    <img src={item.image || "https://placehold.co/40x40"} alt={item.name} className="w-10 h-10 object-cover rounded-lg border flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground flex-shrink-0">₵{Number((item.price || 0) * item.quantity).toLocaleString("en-GH")}</span>
                </div>
              ))}
            </div>

            {/* COUPON SECTION ACCORDION COMPONENT */}
            <div className="border-t pt-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" /> Promotional Discount Code
              </label>
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="PROMO10" disabled={!!appliedCoupon} className="flex-1 border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none uppercase font-semibold" />
                <button type="button" onClick={applyCoupon} disabled={!!appliedCoupon} className="px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors">
                  {appliedCoupon ? "Active" : "Apply"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">✓ Verified ({appliedCoupon.discount}% Off)</p>
              )}
            </div>

            {/* MATRICES CALCULATION STACK */}
            <div className="border-t border-border pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Cart Subtotal</span>
                <span className="font-medium text-foreground">₵{cartTotal.toLocaleString("en-GH")}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Deduction</span>
                  <span>-₵{couponDiscount.toLocaleString("en-GH")}</span>
                </div>
              )}

              {form.deliveryType === "delivery" && form.deliveryPayment === "store" && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Calculated Delivery</span>
                  <span className="font-medium text-foreground">₵{deliveryFee}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm text-foreground pt-2 border-t border-dashed">
                <span>Final Payable</span>
                <span className="text-base text-primary">₵{finalTotal.toLocaleString("en-GH")}</span>
              </div>
            </div>

            {/* TRIGGER FULFILLMENT FORM ACCORDION SUBMIT BUTTON */}
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-xl font-bold transition-all text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Authorizing Transfer...</>
              ) : (
                <>Authorize Payment · ₵{finalTotal.toLocaleString("en-GH")}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}