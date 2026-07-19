import { useNavigate } from "react-router-dom";
import { getBundlePrice } from "@/lib/bundlePricing";
import { createAdminNotification } from "@/lib/firestore";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Wifi,
  Clock,
  Wallet,
  X,
  CheckCircle2,
  Search,
  Sparkles,
} from "lucide-react";

// --- TYPES FOR THE EXTENDED SYSTEM NOTICE ---
type NoticeStatus = "normal" | "delay" | "outage";
type MobileNetworkFilter = "all" | "MTN" | "Telecel" | "AirtelTigo";

interface DeliveryNotice {
  id: string;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  type: "general" | "delivery";
  createdAt: Timestamp;
  status?: NoticeStatus;
  network?: MobileNetworkFilter;
  enabled?: boolean;
  waitTime?: string;
  updatedAt?: Timestamp;
}

const NETWORKS = ["All", "MTN", "Telecel", "AirtelTigo"] as const;

const NETWORK_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    logo: string;
    prefixes: string[];
  }
> = {
  MTN: {
    bg: "#FFCC00",
    text: "#1A1A1A",
    logo: "/logos/mtn.png",
    prefixes: ["024", "054", "055", "059"],
  },
  Telecel: {
    bg: "#E60000",
    text: "#FFFFFF",
    logo: "/logos/telecel.png",
    prefixes: ["020", "050"],
  },
  AirtelTigo: {
    bg: "#0057B8",
    text: "#FFFFFF",
    logo: "/logos/airteltigo.png",
    prefixes: ["026", "027", "056", "057"],
  },
};

function PhoneModal({
  bundle,
  profile,
  balance,
  onConfirm,
  onClose,
  loading,
}: {
  bundle: any;
  profile: any;
  balance: number;
  onConfirm: (phone: string, paymentMethod: "wallet") => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [phone, setPhone] = useState("");

  const cfg = NETWORK_CONFIG[bundle.network] || NETWORK_CONFIG["MTN"];
  const isValid = /^0\d{9}$/.test(phone);
  const bundlePrice = getBundlePrice(bundle, profile);
  const hasDiscount = bundle.discount && bundle.discount > 0;

  const finalPrice = hasDiscount
    ? bundlePrice - bundlePrice * (bundle.discount / 100)
    : bundlePrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(phone, "wallet");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Top Gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{
            background: `linear-gradient(to right, white, ${cfg.bg}, white)`,
          }}
        />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${cfg.bg}20`,
                  color: cfg.bg,
                }}
              >
                <Sparkles className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-black text-xl text-black">Checkout</h3>
                <p className="text-xs text-gray-500">Complete your purchase</p>
              </div>
            </div>

            {!loading && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Bundle Preview */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${cfg.bg}40`,
              backgroundColor: `${cfg.bg}10`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  className="mb-2 border-0 flex items-center gap-2"
                  style={{
                    backgroundColor: cfg.bg,
                    color: cfg.text,
                  }}
                >
                  <img
                    src={cfg.logo}
                    alt={bundle.network}
                    className="h-4 w-auto object-contain"
                  />
                  <span>{bundle.network}</span>
                </Badge>

                <h2 className="text-3xl font-black text-black">{bundle.data}</h2>

                <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <Clock className="h-3 w-3" />
                  {bundle.validity}
                </p>
              </div>

              <div className="text-right">
                {hasDiscount ? (
                  <>
                    <p className="text-3xl font-black text-black">
                      GHS {finalPrice.toFixed(2)}
                    </p>
                    <p className="text-sm line-through text-gray-400">
                      GHS {bundlePrice.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-black text-black">
                    GHS {bundlePrice.toFixed(2)}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Wallet: GHS {balance.toFixed(2)}
                </p>
                <p className="text-sm font-bold text-green-600 mt-1">
                  Total: GHS {finalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Payment */}
          <div className="space-y-2">
            <Label className="text-black">Wallet Payment</Label>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-bold text-black">Wallet Balance</p>
                  <p className="text-green-600 text-lg font-bold">
                    ₵{Number(profile?.walletBalance || 0).toLocaleString("en-GH")}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This purchase will be paid directly from your wallet.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-black">
                Recipient Number
              </Label>

              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0257869403"
                  value={phone}
                  disabled={loading}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  className="h-12 rounded-2xl pr-10 font-mono text-lg"
                />

                {isValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>

              {/* Prefixes */}
              <div className="flex flex-wrap gap-2">
                {cfg.prefixes.map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    disabled={loading}
                    onClick={() => setPhone(prefix)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold hover:opacity-80"
                    style={{
                      borderColor: `${cfg.bg}40`,
                      color: cfg.bg,
                    }}
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="h-12 w-full rounded-2xl text-base font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.bg}CC)`,
              }}
            >
              {loading ? (
                "Processing..."
              ) : (
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Pay with Wallet
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const { user, userProfile: profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);
  const [buying, setBuying] = useState(false);

  // --- REAL-TIME DELIVERY BANNER STATE ---
  const [deliveryNotice, setDeliveryNotice] = useState<DeliveryNotice | null>(null);

  // Live Listen to Newest Delivery Notification Document
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("type", "==", "delivery"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribeNotice = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data() as Omit<DeliveryNotice, "id">;

          if (data.enabled === false) {
            setDeliveryNotice(null);
          } else {
            setDeliveryNotice({
              id: docSnap.id,
              ...data,
            });
          }
        } else {
          setDeliveryNotice(null);
        }
      },
      (error) => {
        console.error("Error streaming delivery notice: ", error);
      }
    );

    return () => unsubscribeNotice();
  }, []);

  // Live Listen to Enabled Bundles
  useEffect(() => {
    const bundlesQuery = query(
      collection(db, "bundles"),
      where("enabled", "==", true)
    );

    const unsubscribe = onSnapshot(
      bundlesQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort((a: any, b: any) => {
          const getOrder = (network: string) => {
            if (network === "MTN") return 1;
            if (network === "Telecel") return 2;
            if (network === "AirtelTigo") return 3;
            return 99;
          };

          const networkCompare = getOrder(a.network) - getOrder(b.network);
          if (networkCompare !== 0) return networkCompare;
          return (a.price || 0) - (b.price || 0);
        });

        setBundles(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const handleBuy = async (phone: string, paymentMethod: "wallet" | "paystack") => {
    if (!selectedBundle) return;

    const bundlePrice = getBundlePrice(selectedBundle, profile);
    const finalPrice =
      selectedBundle.discount && selectedBundle.discount > 0
        ? bundlePrice - bundlePrice * (selectedBundle.discount / 100)
        : bundlePrice;

    if (paymentMethod === "paystack") {
      try {
        setBuying(true);
        const response = await fetch(
          "https://paystack-api-dspq.onrender.com/api/paystack/initialize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email:
                profile?.email ||
                user?.email ||
                `${user?.uid}@middletown.com`,
              amount: finalPrice,
              callback_url: `${window.location.origin}/paystack-success`,
              metadata: {
                uid: user?.uid,
                phone,
                bundleId: selectedBundle.id,
              },
            }),
          }
        );

        const data = await response.json();

        localStorage.setItem(
          "pendingBundlePurchase",
          JSON.stringify({
            uid: user?.uid,
            name: profile?.displayName,
            email: profile?.email,
            phone,
            amount: finalPrice,
            bundle: {
              id: selectedBundle.id,
              network: selectedBundle.network,
              data: selectedBundle.data,
              validity: selectedBundle.validity,
              price: selectedBundle.price,
            },
          })
        );
        window.location.href = data.data.authorization_url;
        return;
      } catch (error) {
        console.error("PAYSTACK ERROR", error);
      } finally {
        setBuying(false);
      }
    }

    // WALLET FLOW
    if (!user || !profile) return;
    const balance = profile.walletBalance ?? 0;

    if (balance < finalPrice) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
      });
      return;
    }

    setBuying(true);

    try {
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await tx.get(userRef);

        if (!userDoc.exists()) {
          throw new Error("User not found");
        }

        const currentBalance = userDoc.data().walletBalance || 0;
        if (currentBalance < finalPrice) {
          throw new Error("Insufficient balance");
        }

        tx.update(userRef, {
          walletBalance: currentBalance - finalPrice,
        });
      });

      const orderRef = await addDoc(collection(db, "orders"), {
        uid: user.uid,
        userName: profile.displayName || "Customer",
        bundleId: selectedBundle.id,
        network: selectedBundle.network,
        size: selectedBundle.data,
        validity: selectedBundle.validity,
        originalPrice: selectedBundle.price,
        discount: selectedBundle.discount || 0,
        amountPaid: finalPrice,
        recipientPhone: phone,
        flashSale: selectedBundle.flashSale || false,
        paymentMethod,
        status: "completed",
        timestamp: serverTimestamp(),
      });

      createAdminNotification({
        title: "New Bundle Order",
        message: `${profile.displayName || "Customer"} purchased ${selectedBundle.network} ${selectedBundle.data}`,
        type: "bundle_order",
        referenceId: orderRef.id,
        customerId: user.uid,
        customerName: profile.displayName || "Customer",
        customerEmail: profile.email || "",
        amount: finalPrice,
      }).catch(() => {});

      const receiptRef = await addDoc(collection(db, "receipts"), {
        orderId: orderRef.id,
        orderType: "bundle",
        receiptNumber: "RCT-" + Date.now(),
        customerId: user.uid,
        customerName: profile.displayName || "Customer",
        customerEmail: profile.email || "",
        paymentReference: orderRef.id,
        totalAmount: finalPrice,
        paidAt: new Date().toISOString(),
        items: [
          {
            name: `${selectedBundle.network} ${selectedBundle.data}`,
            quantity: 1,
            price: finalPrice,
          },
        ],
        createdAt: serverTimestamp(),
      });

      await refreshProfile();
      navigate(`/receipt/${receiptRef.id}`);
      await refreshProfile();

      toast({
        title: "Bundle Sent Successfully ⚡",
        description: `${selectedBundle.network} ${selectedBundle.data} → ${phone}`,
      });

      setSelectedBundle(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error?.message || "Please try again",
      });
    } finally {
      setBuying(false);
    }
  };

  const filtered =
    activeNetwork === "All"
      ? bundles
      : bundles.filter((b) => b.network === activeNetwork);

  const getStatusTheme = (status?: NoticeStatus) => {
    if (status === "outage") {
      return { border: "border-red-900", bg: "bg-[#1c0a0a]", text: "text-red-400", dot: "bg-red-500", badge: "Outage" };
    }
    if (status === "delay") {
      return { border: "border-amber-950", bg: "bg-[#1c1207]", text: "text-amber-400", dot: "bg-amber-500", badge: "Delay" };
    }
    return { border: "border-emerald-950", bg: "bg-[#061811]", text: "text-emerald-400", dot: "bg-red-600", badge: "Delivery Progress" };
  };

  const theme = getStatusTheme(deliveryNotice?.status);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-black">Data Bundles</h1>
              <p className="text-gray-500 text-sm">“Trusted data bundles • Fast activation”</p>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Wallet Balance</p>
                <h3 className="text-2xl font-black text-black">
                  GHS {profile?.walletBalance?.toFixed(2) ?? "0.00"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* REAL-TIME SYSTEM DELIVERY BANNER */}
        {deliveryNotice && (
          <div className={`relative overflow-hidden rounded-3xl border ${theme.border} ${theme.bg} p-5 ${theme.text} shadow-inner flex flex-col gap-3 transition-all duration-300`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${theme.dot} animate-pulse shrink-0`}>
                  <span className="h-2 rounded-full bg-white w-2" />
                </div>
                <h4 className="font-black text-sm tracking-wide uppercase text-slate-100 flex items-center gap-2">
                  <span>🚚</span> {deliveryNotice.title || theme.badge}
                </h4>
              </div>

              {deliveryNotice.network && deliveryNotice.network !== "all" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/10 font-mono uppercase">
                  Network: {deliveryNotice.network}
                </span>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium leading-relaxed text-slate-200 whitespace-pre-line">
                {deliveryNotice.message}
              </p>
              {profile?.role === "admin" && (
                <span className="inline-block text-[10px] bg-black/40 text-gray-400 font-mono px-2 py-0.5 rounded border border-white/5 mt-1">
                  Live View • Rest Assured,All Orders Will Be Delivered.
                </span>
              )}
            </div>

            {deliveryNotice.waitTime && (
              <div className="text-xs pt-1 border-t border-white/5 flex items-center gap-1.5 opacity-90 font-medium text-slate-300">
                <Clock className="h-3.5 w-3.5 shrink-0 text-current" />
                <span>Estimated wait time: <strong className="text-white font-bold">{deliveryNotice.waitTime}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bundles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((net) => {
              const cfg = net !== "All" ? NETWORK_CONFIG[net] : null;
              const active = activeNetwork === net;

              return (
                <button
                  key={net}
                  onClick={() => setActiveNetwork(net)}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold border transition-all ${
                    active ? "scale-105 shadow-lg" : "hover:scale-105 bg-white"
                  }`}
                  style={
                    active && cfg
                      ? {
                          backgroundColor: cfg.bg,
                          borderColor: cfg.bg,
                          color: "#fff",
                        }
                      : {}
                  }
                >
                  {cfg ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={cfg.logo}
                        alt={net}
                        className="h-5 w-auto object-contain"
                      />
                      <span>{net}</span>
                    </div>
                  ) : (
                    "All"
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <Card className="rounded-3xl bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
              <Wifi className="h-12 w-12 text-gray-300" />
              <div className="text-center">
                <h3 className="font-bold text-lg">No Bundles Found</h3>
                <p className="text-sm text-gray-500">Try another search</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bundle Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered
              .filter(
                (bundle) =>
                  !search ||
                  bundle.network?.toLowerCase().includes(search.toLowerCase()) ||
                  bundle.data?.toLowerCase().includes(search.toLowerCase())
              )
              .map((bundle) => {
                const cfg = NETWORK_CONFIG[bundle.network] || NETWORK_CONFIG["MTN"];
                const basePrice = getBundlePrice(bundle, profile);
                const hasDiscount = bundle.discount && bundle.discount > 0;
                const discountedPrice = hasDiscount
                  ? basePrice - basePrice * (bundle.discount / 100)
                  : basePrice;

                return (
                  <div
                    key={bundle.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div
                      className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20"
                      style={{ backgroundColor: cfg.bg }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{
                        background: `linear-gradient(to right, white, ${cfg.bg}, white)`,
                      }}
                    />

                    {bundle.flashSale && (
                      <div className="absolute top-3 right-3 z-20">
                        <div className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black text-white shadow-lg animate-pulse">
                          ⚡ FLASH SALE
                        </div>
                      </div>
                    )}

                    {hasDiscount && (
                      <div className="absolute top-3 left-3 z-20">
                        <div className="rounded-full bg-green-500 px-3 py-1 text-[10px] font-black text-white shadow-lg">
                          -{bundle.discount}%
                        </div>
                      </div>
                    )}

                    <div className="relative p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 rounded-2xl bg-white shadow-md flex items-center justify-center p-2">
                            <img
                              src={cfg.logo}
                              alt={bundle.network}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-black">{bundle.network}</h3>
                            <p className="text-xs text-gray-500">Ghana Telecom</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <h2 className="text-4xl font-black text-gray-900">{bundle.data}</h2>
                        <p className="text-sm text-gray-500 mt-1">High-Speed Internet Bundle</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {bundle.validity}
                        </div>
                      </div>

                      <div className="mb-4">
                        {hasDiscount ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-black">
                                GHS {discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-sm line-through text-gray-400">
                                GHS {basePrice.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[11px] text-green-600 font-bold">
                              Save GHS {(basePrice - discountedPrice).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <span className="text-4xl font-black text-green-600">
                            GHS {basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Secure Checkout
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Fast Delivery 24/7
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedBundle(bundle)}
                        className="mt-auto h-11 rounded-2xl text-sm font-bold text-white shadow-lg hover:scale-[1.02] transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.bg}CC)`,
                        }}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Buy Bundle
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {selectedBundle && (
        <PhoneModal
          bundle={selectedBundle}
          profile={profile}
          balance={profile?.walletBalance || 0}
          loading={buying}
          onClose={() => setSelectedBundle(null)}
          onConfirm={(phone, method) => handleBuy(phone, method)}
        />
      )}
    </>
  );
}