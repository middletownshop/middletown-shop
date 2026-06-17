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
  Phone,
  X,
  CheckCircle2,
  Search,
  Sparkles,
  CreditCard,
} from "lucide-react";

const NETWORKS = [
  "All",
  "MTN",
  "Telecel",
  "AirtelTigo",
] as const;

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
    bg: "#EAB308",
    text: "#fff",
    logo: "🟡",
    prefixes: ["024", "054", "055", "059"],
  },

  Telecel: {
    bg: "#EF4444",
    text: "#fff",
    logo: "🔴",
    prefixes: ["020", "050"],
  },

  AirtelTigo: {
    bg: "#3B82F6",
    text: "#fff",
    logo: "🔵",
    prefixes: ["026", "027", "056", "057"],
  },
};

function PhoneModal({
  bundle,
  balance,
  onConfirm,
  onClose,
  loading,
}: {
  bundle: any;
  balance: number;

  onConfirm: (
    phone: string,
    paymentMethod: "wallet" | "paystack"
  ) => void;

  onClose: () => void;
  loading: boolean;
}) {
  const [phone, setPhone] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"wallet" | "paystack">(
      "paystack"
    );

  const cfg =
    NETWORK_CONFIG[bundle.network] ||
    NETWORK_CONFIG["MTN"];

  const isValid = /^0\d{9}$/.test(phone);

  const hasDiscount =
    bundle.discount &&
    bundle.discount > 0;

  const finalPrice = hasDiscount
    ? bundle.price -
      bundle.price * (bundle.discount / 100)
    : bundle.price;

  const canUseWallet =
    balance >= finalPrice;

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (isValid) {
      onConfirm(phone, paymentMethod);
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
                <h3 className="font-black text-xl text-black">
                  Checkout
                </h3>

                <p className="text-xs text-gray-500">
                  Complete your purchase
                </p>
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
                  className="mb-2 border-0"
                  style={{
                    backgroundColor: cfg.bg,
                    color: "#fff",
                  }}
                >
                  {cfg.logo} {bundle.network}
                </Badge>

                <h2 className="text-3xl font-black text-black">
                  {bundle.size}
                </h2>

                <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <Clock className="h-3 w-3" />
                  {bundle.validity}
                </p>
              </div>

              <div className="text-right">
                {hasDiscount ? (
                  <>
                    <p className="text-3xl font-black text-black">
                      GHS{" "}
                      {finalPrice.toFixed(2)}
                    </p>

                    <p className="text-sm line-through text-gray-400">
                      GHS{" "}
                      {bundle.price.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-black text-black">
                    GHS{" "}
                    {bundle.price.toFixed(2)}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Wallet: GHS{" "}
                  {balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <Label className="text-black">
              Payment Method
            </Label>

            <div className="grid grid-cols-2 gap-3">
              {/* Paystack */}
              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "paystack"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition-all ${
                  paymentMethod ===
                  "paystack"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
              >
                <CreditCard className="h-5 w-5 mb-2 text-primary" />

                <p className="font-bold text-black">
                  Paystack
                </p>

                <p className="text-xs text-gray-500">
                  MOMO / Card
                </p>
              </button>

              {/* Wallet */}
              <button
                type="button"
                disabled={!canUseWallet}
                onClick={() =>
                  setPaymentMethod(
                    "wallet"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition-all ${
                  paymentMethod ===
                  "wallet"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                } ${
                  !canUseWallet
                    ? "opacity-50"
                    : ""
                }`}
              >
                <Wallet className="h-5 w-5 mb-2 text-primary" />

                <p className="font-bold text-black">
                  Wallet
                </p>

                <p className="text-xs text-gray-500">
                  Use balance
                </p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-black"
              >
                Recipient Number
              </Label>

              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0241234567"
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
                    onClick={() =>
                      setPhone(prefix)
                    }
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
              ) : paymentMethod ===
                "paystack" ? (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Continue to Paystack
                </span>
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
  const { user, userProfile: profile } = useAuth();

  const { toast } = useToast();

  const [bundles, setBundles] = useState<
    any[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [activeNetwork, setActiveNetwork] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [selectedBundle, setSelectedBundle] =
    useState<any | null>(null);

  const [buying, setBuying] =
    useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "bundles"),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        data.sort(
          (a: any, b: any) =>
            (a.price || 0) -
            (b.price || 0)
        );

        setBundles(data);

        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const handleBuy = async (
    phone: string,
    paymentMethod:
      | "wallet"
      | "paystack"
  ) => {
    if (!selectedBundle) return;

    const finalPrice =
      selectedBundle.discount &&
      selectedBundle.discount > 0
        ? selectedBundle.price -
          selectedBundle.price *
            (selectedBundle.discount /
              100)
        : selectedBundle.price;

    // PAYSTACK
    if (paymentMethod === "paystack") {
      toast({
        title:
          "Redirecting to Paystack...",
        description:
          "Complete your payment securely",
      });

      console.log({
        amount: finalPrice,
        phone,
        bundle: selectedBundle,
      });

      return;
    }

    // WALLET
    if (!user || !profile) return;

    const balance =
      profile.walletBalance ?? 0;

    if (balance < finalPrice) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
      });

      return;
    }

    setBuying(true);

    try {
      await runTransaction(
        db,
        async (tx) => {
          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userDoc =
            await tx.get(userRef);

          if (!userDoc.exists()) {
            throw new Error(
              "User not found"
            );
          }

          const currentBalance =
            userDoc.data()
              .walletBalance || 0;

          if (
            currentBalance < finalPrice
          ) {
            throw new Error(
              "Insufficient balance"
            );
          }

          tx.update(userRef, {
            walletBalance:
              currentBalance -
              finalPrice,
          });
        }
      );

      await addDoc(
        collection(db, "orders"),
        {
          uid: user.uid,
          userName: profile.displayName,

          bundleId: selectedBundle.id,

          network:
            selectedBundle.network,

          size: selectedBundle.size,

          validity:
            selectedBundle.validity,

          originalPrice:
            selectedBundle.price,

          discount:
            selectedBundle.discount || 0,

          amountPaid: finalPrice,

          recipientPhone: phone,

          flashSale:
            selectedBundle.flashSale ||
            false,

          paymentMethod:
            paymentMethod,

          status: "completed",

          timestamp:
            serverTimestamp(),
        }
      );

      toast({
        title:
          "Bundle Sent Successfully ⚡",

        description: `${selectedBundle.network} ${selectedBundle.size} → ${phone}`,
      });

      setSelectedBundle(null);
    } catch (error: any) {
      toast({
        variant: "destructive",

        title: "Purchase Failed",

        description:
          error.message ||
          "Please try again",
      });
    } finally {
      setBuying(false);
    }
  };

  const filtered =
    activeNetwork === "All"
      ? bundles
      : bundles.filter(
          (b) =>
            b.network ===
            activeNetwork
        );

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
              <h1 className="text-3xl font-black text-black">
                Data Bundles
              </h1>

              <p className="text-gray-500 text-sm">
                “Trusted data bundles • Fast activation”
              </p>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Wallet Balance
                </p>

                <h3 className="text-2xl font-black text-black">
                  GHS{" "}
                  {profile?.walletBalance?.toFixed(
                    2
                  ) ?? "0.00"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

            <Input
              placeholder="Search bundles..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="pl-11 h-12 rounded-2xl bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((net) => {
              const cfg =
                net !== "All"
                  ? NETWORK_CONFIG[net]
                  : null;

              const active =
                activeNetwork === net;

              return (
                <button
                  key={net}
                  onClick={() =>
                    setActiveNetwork(net)
                  }
                  className={`rounded-2xl px-4 py-2 text-sm font-bold border transition-all ${
                    active
                      ? "scale-105 shadow-lg"
                      : "hover:scale-105 bg-white"
                  }`}
                  style={
                    active && cfg
                      ? {
                          backgroundColor:
                            cfg.bg,

                          borderColor:
                            cfg.bg,

                          color: "#fff",
                        }
                      : {}
                  }
                >
                  {cfg
                    ? `${cfg.logo} ${net}`
                    : "All"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map(
              (_, i) => (
                <Skeleton
                  key={i}
                  className="h-64 rounded-3xl"
                />
              )
            )}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          filtered.length === 0 && (
            <Card className="rounded-3xl bg-white">
              <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                <Wifi className="h-12 w-12 text-gray-300" />

                <div className="text-center">
                  <h3 className="font-bold text-lg">
                    No Bundles Found
                  </h3>

                  <p className="text-sm text-gray-500">
                    Try another search
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Bundle Cards */}
        {!loading &&
          filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered
                .filter(
                  (bundle) =>
                    !search ||
                    bundle.network
                      ?.toLowerCase()
                      .includes(
                        search.toLowerCase()
                      ) ||
                    bundle.size
                      ?.toLowerCase()
                      .includes(
                        search.toLowerCase()
                      )
                )
                .map((bundle) => {
                  const cfg =
                    NETWORK_CONFIG[
                      bundle.network
                    ] ||
                    NETWORK_CONFIG["MTN"];

                  const hasDiscount =
                    bundle.discount &&
                    bundle.discount >
                      0;

                  const discountedPrice =
                    hasDiscount
                      ? bundle.price -
                        bundle.price *
                          (bundle.discount /
                            100)
                      : bundle.price;

                  return (
                    <div
                      key={bundle.id}
                      className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Glow */}
                      <div
                        className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20"
                        style={{
                          backgroundColor:
                            cfg.bg,
                        }}
                      />

                      {/* Top Line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{
                          background: `linear-gradient(to right, white, ${cfg.bg}, white)`,
                        }}
                      />

                      {/* Flash Sale */}
                      {bundle.flashSale && (
                        <div className="absolute top-3 right-3 z-20">
                          <div className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black text-white shadow-lg animate-pulse">
                            ⚡ FLASH SALE
                          </div>
                        </div>
                      )}

                      {/* Discount */}
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 z-20">
                          <div className="rounded-full bg-green-500 px-3 py-1 text-[10px] font-black text-white shadow-lg">
                            -
                            {
                              bundle.discount
                            }
                            %
                          </div>
                        </div>
                      )}

                      <div className="relative p-4 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mt-5 mb-4">
                          <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${cfg.bg}, white)`,
                            }}
                          >
                            {cfg.logo}
                          </div>

                          <Badge
                            className="border-0 rounded-full text-[11px] font-bold shadow-sm"
                            style={{
                              backgroundColor: `${cfg.bg}20`,
                              color: cfg.bg,
                            }}
                          >
                            {
                              bundle.network
                            }
                          </Badge>
                        </div>

                        {/* Size */}
                        <div className="space-y-1 mb-3">
                          <h2 className="text-3xl font-black leading-none text-black">
                            {bundle.size}
                          </h2>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            {
                              bundle.validity
                            }
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                          {hasDiscount ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-black">
                                  GHS{" "}
                                  {discountedPrice.toFixed(
                                    2
                                  )}
                                </span>

                                <span className="text-sm line-through text-gray-400">
                                  {
                                    bundle.price
                                  }
                                </span>
                              </div>

                              <p className="text-[11px] text-green-600 font-bold">
                                Save GHS{" "}
                                {(
                                  bundle.price -
                                  discountedPrice
                                ).toFixed(
                                  2
                                )}
                              </p>
                            </>
                          ) : (
                            <span className="text-3xl font-black text-black">
                              GHS{" "}
                              {bundle.price?.toFixed(
                                2
                              )}
                            </span>
                          )}
                        </div>

                        {/* Features */}
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

                        {/* Button */}
                        <Button
                          onClick={() =>
                            setSelectedBundle(
                              bundle
                            )
                          }
                          className="mt-auto h-11 rounded-2xl text-sm font-bold text-white shadow-lg hover:scale-[1.02] transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.bg}CC)`,
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
      </div>

      {/* Modal */}
      {selectedBundle && (
        <PhoneModal
          bundle={selectedBundle}
          balance={
            profile?.walletBalance ??
            0
          }
          onConfirm={handleBuy}
          onClose={() =>
            !buying &&
            setSelectedBundle(null)
          }
          loading={buying}
        />
      )}
    </>
  );
}