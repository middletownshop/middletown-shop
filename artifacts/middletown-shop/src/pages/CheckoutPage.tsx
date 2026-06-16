import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createOrder, markOrderPaid, createReceipt } from "@/lib/firestore";
import { useVerifyPayment } from "@workspace/api-client-react";
import toast from "react-hot-toast";
import { Shield, CreditCard } from "lucide-react";

interface ShippingForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const verifyPayment = useVerifyPayment();

  const [form, setForm] = useState<ShippingForm>({
    name: userProfile?.displayName || "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty"); return; }

    const { name, phone, address, city, state } = form;
    if (!name || !phone || !address || !city || !state) {
      toast.error("Please fill in all shipping details");
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
        shippingInfo: { name, address, phone, city, state },
        totalAmount: cartTotal,
        paymentReference: reference,
      });

      setLoading(false);

      // Open Paystack
      const handler = (window as any).PaystackPop?.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: cartTotal * 100,
        currency: "NGN",
        ref: reference,
        metadata: { orderId, customerName: name },
        callback: async (response: { reference: string }) => {
          setLoading(true);
          try {
            // Verify server-side
            const result = await new Promise<any>((resolve, reject) => {
              verifyPayment.mutate(
                { data: { reference: response.reference, orderId } },
                { onSuccess: resolve, onError: reject }
              );
            });

            if (result.success) {
              await markOrderPaid(orderId, response.reference, result.amount ?? cartTotal, result.currency ?? "NGN", result.paidAt ?? new Date().toISOString());
              // Create receipt
              const receiptId = await createReceipt({
                receiptNumber: `RCP-${Date.now()}`,
                orderId,
                customerId: user.uid,
                customerName: name,
                customerEmail: user.email || "",
                items: cartItems.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
                totalAmount: cartTotal,
                paymentReference: response.reference,
                paidAt: result.paidAt ?? new Date().toISOString(),
              });
              clearCart();
              toast.success("Payment successful! Order placed.");
              navigate(`/receipt/${receiptId}`);
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          toast.error("Payment cancelled");
          setLoading(false);
        },
      });

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

  const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>
      <form onSubmit={handlePay}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Shipping form */}
          <div className="lg:col-span-2 bg-white border border-border rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">1</span>
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
                <input value={form.phone} onChange={update("phone")} required placeholder="08012345678" data-testid="input-shipping-phone"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                <select value={form.state} onChange={update("state")} required data-testid="select-shipping-state"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                <input value={form.city} onChange={update("city")} required placeholder="City" data-testid="input-shipping-city"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
                <input value={form.address} onChange={update("address")} required placeholder="House number, street name, area" data-testid="input-shipping-address"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">2</span>
                Payment Method
              </h2>
              <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-xl bg-primary/5">
                <CreditCard className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Paystack</p>
                  <p className="text-xs text-muted-foreground">Card, Bank Transfer, USSD, and more</p>
                </div>
                <div className="ml-auto w-4 h-4 bg-primary rounded-full border-2 border-white ring-2 ring-primary" />
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span>Your payment is secured by Paystack. We never store card details.</span>
              </div>
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
                    <span className="text-xs font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 mb-5">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Subtotal</span><span>₦{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span data-testid="text-checkout-total">₦{cartTotal.toLocaleString()}</span>
                </div>
              </div>
              <button type="submit" disabled={loading} data-testid="button-pay"
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : (
                  <>Pay ₦{cartTotal.toLocaleString()}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
