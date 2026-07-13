import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  Signal,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Crown,
  Coins,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const STATUS_STYLES: Record<
  string,
  {
    color: string;
    icon: React.ReactNode;
    label: string;
    glow: string;
  }
> = {
  pending: {
    color: "bg-amber-950/60 text-amber-400 border border-amber-500/30",
    icon: <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
    label: "Pending Verification",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  },

  processing: {
    color: "bg-indigo-950/60 text-indigo-400 border border-indigo-500/30",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />,
    label: "Processing Deal",
    glow: "shadow-[0_0_12px_rgba(99,102,241,0.15)]",
  },

  delivered: {
    color: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
    label: "Paid & Settled",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  },

  failed: {
    color: "bg-rose-950/60 text-rose-400 border border-rose-500/30",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
    label: "Transaction Void",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  },
};

const NETWORK_BADGE: Record<string, string> = {
  MTN: "bg-amber-500 text-neutral-950 border border-amber-400 font-extrabold",
  Telecel: "bg-red-600 text-white border border-red-500 font-bold",
  AirtelTigo: "bg-blue-600 text-white border border-blue-500 font-bold",
};

export default function BundleOrdersPage() {
  const { user, userProfile } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) return;

    let q;

    if (userProfile.role === "admin") {
      q = query(collection(db, "orders"));
    } else {
      q = query(
        collection(db, "orders"),
        where("uid", "==", user.uid)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort(
          (a: any, b: any) =>
            (b.timestamp?.toMillis?.() || 0) -
            (a.timestamp?.toMillis?.() || 0)
        );

        setOrders(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  const updateStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, "orders", orderId), {
      status,
      updatedAt: new Date(),
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto min-h-screen text-slate-100 bg-neutral-950 font-sans">
      {/* Premium Luxury Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 border border-amber-500/20 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Crown className="w-32 h-32 text-amber-400" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-3 rounded-xl text-neutral-950 shadow-lg shadow-yellow-500/10">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200">
              {userProfile?.role === "admin" ? "Purchase History" : "PURCASE HISTORY"}
            </h1>
            <p className="text-xs md:text-sm text-amber-500/70 font-medium tracking-wide mt-0.5 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Track your data orders
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-neutral-900/60 border border-neutral-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl p-6">
          <Signal className="w-12 h-12 mx-auto mb-4 text-amber-500/40 animate-pulse" />
          <h3 className="text-lg font-bold text-neutral-200 tracking-tight uppercase">
            No active room plays
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Your premium high-speed network loads or allocations will appear immediately upon settlement initialization.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

            return (
              <div
                key={order.id}
                className={`group bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 hover:border-amber-500/30 rounded-2xl p-5 shadow-xl transition-all duration-300 ${status.glow}`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base md:text-lg font-black tracking-tight text-white uppercase">
                        {order.size} Package
                      </h3>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-sm ${NETWORK_BADGE[order.network] || "bg-neutral-800 text-neutral-300"}`}>
                        {order.network}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium font-mono">
                      STAMP: {order.timestamp?.toDate?.()?.toLocaleString() || "UNVERIFIED TIME"}
                    </p>
                  </div>

                  <div className={`self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${status.color}`}>
                    {status.icon}
                    <span>{status.label}</span>
                  </div>
                </div>

                {/* Badges/Tags layout */}
                <div className="flex flex-wrap gap-2 mb-4 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-900">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-amber-500" />
                    VAL: {order.validity || "Standard Entry"}
                  </span>

                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-neutral-900 text-amber-400 border border-neutral-800 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-amber-500" />
                    {order.recipientPhone}
                  </span>
                </div>

                {/* Bottom metadata panel layout */}
                <div className="flex justify-between items-center border-t border-neutral-800/60 pt-4 bg-gradient-to-t from-neutral-950 to-transparent">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                      Account Owner
                    </p>
                    <p className="font-bold text-sm text-neutral-300 tracking-tight">
                      {order.userName || "Guest Player"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                      AMOUNT
                    </p>
                    <p className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 tracking-tight">
                      GHS {Number(order.amountPaid || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* VIP Live Admin Control Panel Dropdown Override */}
                {userProfile?.role === "admin" && (
                  <div className="mt-4 pt-3 border-t border-neutral-800/40">
                    <label className="block text-[10px] text-amber-500/70 uppercase font-bold tracking-widest mb-1.5">
                      System Action Switchboard
                    </label>
                    <div className="relative">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-xl p-2.5 text-xs font-bold tracking-wide focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all cursor-pointer appearance-none"
                      >
                        <option value="pending" className="bg-neutral-950 text-amber-400 font-bold">⚠️ SET STATE: PENDING</option>
                        <option value="processing" className="bg-neutral-950 text-indigo-400 font-bold">⚡ SET STATE: RUNNING</option>
                        <option value="delivered" className="bg-neutral-950 text-emerald-400 font-bold">💎 SET STATE: DELIVERED</option>
                        <option value="failed" className="bg-neutral-950 text-rose-400 font-bold">❌ SET STATE: VOID</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-500 text-[10px] font-black">▼</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}