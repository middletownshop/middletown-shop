import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Order, WalletTransaction } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { getWalletTransactions } from "@/lib/firestore";
import {
  Package, Wallet, ShoppingBag, Signal, ArrowRight,
  TrendingUp, ArrowDownLeft, ArrowUpRight, Plus, Minus,
} from "lucide-react";
import { markNotificationRead } from "@/lib/firestore";

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletTxs, setWalletTxs] = useState<WalletTransaction[]>([]);
  const now = useClock();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("customerId", "==", user.uid));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      all.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
      setOrders(all.slice(0, 5));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getWalletTransactions(user.uid)
      .then(txs => setWalletTxs(txs.slice(0, 5)))
      .catch(() => setWalletTxs([]));
  }, [user]);

  const balance = Number(userProfile?.walletBalance || 0);
  const name = userProfile?.displayName || user?.email?.split("@")[0] || "there";

  const txIcon = (type: string) =>
    ["deposit", "commission", "refund"].includes(type)
      ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
      : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />;

  const txPositive = (type: string) => ["deposit", "commission", "refund"].includes(type);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* Greeting + Clock */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting(now)}, {name} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's your account overview</p>
        </div>
        <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-2 text-right">
          <p className="text-xl font-mono font-bold text-primary">
            {now.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white mb-5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-200" />
            <span className="text-sm text-blue-200 font-medium">Wallet Balance</span>
          </div>
          <Link to="/wallet" className="flex items-center gap-1 text-blue-200 text-xs hover:text-white transition-colors">
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-3xl font-bold mb-3">
          ₵{balance.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-2">
          <Link to="/wallet" className="flex items-center gap-1 bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Deposit
          </Link>
          <Link to="/wallet" className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
            <Minus className="w-3.5 h-3.5" /> Withdraw
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
        {[
          { label: "Buy Data", href: "/bundles", icon: <Signal className="w-5 h-5" />, color: "text-green-600 bg-green-50 border-green-100" },
          { label: "Shop", href: "/products?category=market", icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Deposit", href: "/wallet", icon: <Plus className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Withdraw", href: "/wallet", icon: <Minus className="w-5 h-5" />, color: "text-orange-600 bg-orange-50 border-orange-100" },
          { label: "Orders", href: "/orders", icon: <Package className="w-5 h-5" />, color: "text-purple-600 bg-purple-50 border-purple-100" },
        ].map(a => (
          <Link key={a.label} to={a.href}
            className={`flex flex-col items-center gap-1.5 p-3 border rounded-xl hover:shadow-sm transition-all text-center ${a.color}`}>
            {a.icon}
            <span className="text-xs font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Transactions</h2>
            <Link to="/wallet" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {walletTxs.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <Link to="/wallet" className="text-primary text-xs hover:underline mt-1 inline-block">Add funds</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {walletTxs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${txPositive(tx.type) ? "bg-green-100" : "bg-red-50"}`}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{tx.type} · {tx.status}</p>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${txPositive(tx.type) ? "text-green-600" : "text-red-500"}`}>
                    {txPositive(tx.type) ? "+" : "-"}₵{Number(tx.amount || 0).toLocaleString("en-GH")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Orders</h2>
            <Link to="/orders" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <Link to="/products" className="text-primary text-xs hover:underline mt-1 inline-block">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <Link key={order.id} to={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{order.orderId}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ₵{Number(order?.totalAmount || 0).toLocaleString("en-GH")} · {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Promo */}
      {userProfile?.role === "customer" && (
        <div className="mt-5 bg-gradient-to-r from-orange-500 to-orange-700 rounded-xl p-4 text-white flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm">Earn as an Agent 🤝</p>
            <p className="text-xs text-orange-100 mt-0.5">Join our agent program and earn 5% commission on every sale</p>
          </div>
          <Link to="/agent/apply" className="flex-shrink-0 bg-white text-orange-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1">
            Apply <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
