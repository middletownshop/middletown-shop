import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { DataBundle, NetworkProvider } from "@/lib/types";
import { createBundleOrder, markBundleOrderPaid } from "@/lib/firestore";
import { Signal, Phone, Check, Loader2, Zap } from "lucide-react";
import toast from "react-hot-toast";

const BUNDLES: Record<NetworkProvider, DataBundle[]> = {
  MTN: [
    { id: "mtn-1", network: "MTN", name: "Daily Starter", data: "1GB", validity: "24 hours", price: 5 },
    { id: "mtn-2", network: "MTN", name: "3-Day Pack", data: "2GB", validity: "3 days", price: 8 },
    { id: "mtn-3", network: "MTN", name: "Weekly Pack", data: "5GB", validity: "7 days", price: 15, popular: true },
    { id: "mtn-4", network: "MTN", name: "Monthly Light", data: "10GB", validity: "30 days", price: 25 },
    { id: "mtn-5", network: "MTN", name: "Monthly Pro", data: "20GB", validity: "30 days", price: 45, popular: true },
    { id: "mtn-6", network: "MTN", name: "Monthly Max", data: "50GB", validity: "30 days", price: 90 },
  ],
  Telecel: [
    { id: "tc-1", network: "Telecel", name: "Daily Starter", data: "1GB", validity: "1 day", price: 4 },
    { id: "tc-2", network: "Telecel", name: "Weekly Pack", data: "3GB", validity: "7 days", price: 12, popular: true },
    { id: "tc-3", network: "Telecel", name: "Monthly Light", data: "6GB", validity: "30 days", price: 20 },
    { id: "tc-4", network: "Telecel", name: "Monthly Pro", data: "15GB", validity: "30 days", price: 35, popular: true },
    { id: "tc-5", network: "Telecel", name: "Monthly Max", data: "30GB", validity: "30 days", price: 60 },
  ],
  AirtelTigo: [
    { id: "at-1", network: "AirtelTigo", name: "Daily Starter", data: "1.5GB", validity: "1 day", price: 5 },
    { id: "at-2", network: "AirtelTigo", name: "Weekly Pack", data: "4GB", validity: "7 days", price: 12, popular: true },
    { id: "at-3", network: "AirtelTigo", name: "Monthly Light", data: "8GB", validity: "30 days", price: 22 },
    { id: "at-4", network: "AirtelTigo", name: "Monthly Pro", data: "20GB", validity: "30 days", price: 40, popular: true },
    { id: "at-5", network: "AirtelTigo", name: "Monthly Max", data: "40GB", validity: "30 days", price: 70 },
  ],
};

const NETWORK_COLORS: Record<NetworkProvider, { bg: string; text: string; badge: string; ring: string }> = {
  MTN: { bg: "bg-yellow-400", text: "text-yellow-900", badge: "bg-yellow-100 text-yellow-800", ring: "ring-yellow-400" },
  Telecel: { bg: "bg-red-500", text: "text-white", badge: "bg-red-100 text-red-700", ring: "ring-red-400" },
  AirtelTigo: { bg: "bg-blue-600", text: "text-white", badge: "bg-blue-100 text-blue-700", ring: "ring-blue-500" },
};

export default function DataBundlesPage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [network, setNetwork] = useState<NetworkProvider>("MTN");
  const [selected, setSelected] = useState<DataBundle | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = NETWORK_COLORS[network];
  const bundles = BUNDLES[network];

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return toast.error("Please select a bundle");
    if (!phone.trim() || phone.length < 10) return toast.error("Enter a valid phone number");

    if (!user) {
      toast.error("Please sign in to purchase bundles");
      return navigate("/login");
    }

    // Create pending order first
    let orderId: string;
    try {
      orderId = await createBundleOrder({
        customerId: user.uid,
        customerEmail: user.email || "",
        customerName: userProfile?.displayName || user.email?.split("@")[0] || "Customer",
        network: selected.network,
        bundleName: selected.name,
        bundleData: selected.data,
        bundleValidity: selected.validity,
        phoneNumber: phone.trim(),
        amount: selected.price,
        paymentReference: "",
      });
    } catch {
      return toast.error("Failed to create order. Please try again.");
    }

    const handler = (window as any).PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: selected.price * 100,
      currency: "GHS",
      ref: `BD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      metadata: { orderId, network: selected.network, phone: phone.trim() },
      callback: async (response: { reference: string }) => {
        setLoading(true);
        try {
          await markBundleOrderPaid(orderId, response.reference, selected.price);
          toast.success(`${selected.data} ${selected.network} bundle purchased! Delivering to ${phone}...`);
          setSelected(null);
          setPhone("");
          navigate("/bundle-orders");
        } catch {
          toast.error("Payment received but order update failed. Contact support.");
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {},
    });
    handler?.openIframe();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Signal className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Data Bundles</h1>
        </div>
        <p className="text-muted-foreground text-sm">Affordable data bundles for all networks in Ghana</p>
      </div>

      {/* Network selector */}
      <div className="flex gap-3 mb-8">
        {(Object.keys(BUNDLES) as NetworkProvider[]).map(n => {
          const c = NETWORK_COLORS[n];
          const isActive = network === n;
          return (
            <button
              key={n}
              onClick={() => { setNetwork(n); setSelected(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? `${c.bg} ${c.text} shadow-lg ring-2 ${c.ring} ring-offset-2`
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Bundle grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {bundles.map(bundle => {
          const isSelected = selected?.id === bundle.id;
          return (
            <button
              key={bundle.id}
              onClick={() => setSelected(bundle)}
              className={`relative text-left border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-white hover:border-primary/50"
              }`}
            >
              {bundle.popular && (
                <span className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Popular
                </span>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${NETWORK_COLORS[network].badge}`}>
                {bundle.validity}
              </div>
              <p className="text-2xl font-black text-foreground">{bundle.data}</p>
              <p className="text-sm text-muted-foreground mb-3">{bundle.name}</p>
              <p className="text-lg font-bold text-primary">₵{bundle.price}</p>
            </button>
          );
        })}
      </div>

      {/* Purchase form */}
      {selected && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-1">
            Complete Purchase — {selected.data} {selected.network} ({selected.validity})
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Total: <span className="font-bold text-primary">₵{selected.price}</span>
          </p>
          <form onSubmit={handleBuy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Recipient Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="e.g. 0244123456"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter the phone number that should receive the data bundle</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-2 flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ₵${selected.price} via Paystack`}
              </button>
            </div>
          </form>
        </div>
      )}

      {!selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>How it works:</strong> Select a bundle above, enter the recipient's phone number, and pay securely via Paystack. Bundle is delivered instantly after payment confirmation.
        </div>
      )}
    </div>
  );
}
