import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Order, Notification } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Package, Bell, Wallet, ShoppingBag, BellRing, Signal, ArrowRight, TrendingUp } from "lucide-react";
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      all.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
      setNotifications(all.slice(0, 10));
    });
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;
  const name = userProfile?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* Greeting + Clock */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting(now)}, {name} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your account</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-primary">
            {now.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Wallet Summary Card */}
      <Link to="/wallet" className="block mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-200 font-medium">Wallet Balance</span>
            </div>
            <div className="flex items-center gap-1 text-blue-200 text-sm">
              <span>Manage</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            ₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex gap-3">
            <span className="text-xs bg-white/20 rounded-full px-3 py-1">Tap to Add Funds</span>
            <span className="text-xs bg-white/20 rounded-full px-3 py-1">View Transactions</span>
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Orders", value: orders.length, icon: <Package className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-100", href: "/orders" },
          { label: "Notifications", value: unread, icon: <Bell className="w-5 h-5 text-orange-600" />, color: "bg-orange-50 border-orange-100", href: "/dashboard" },
          { label: "Saved", value: userProfile?.savedProducts?.length || 0, icon: <ShoppingBag className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-100", href: "/products" },
          { label: "Bundle Orders", value: "—", icon: <Signal className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-100", href: "/bundle-orders" },
        ].map(s => (
          <Link key={s.label} to={s.href} className={`border rounded-xl p-3 hover:shadow-sm transition-all ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">{s.icon}</div>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Buy Data", href: "/bundles", icon: <Signal className="w-5 h-5" />, color: "text-green-600 bg-green-50 border-green-100" },
          { label: "Shop Market", href: "/products?category=market", icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "My Orders", href: "/orders", icon: <Package className="w-5 h-5" />, color: "text-purple-600 bg-purple-50 border-purple-100" },
          { label: "Agent Program", href: "/agent/apply", icon: <TrendingUp className="w-5 h-5" />, color: "text-orange-600 bg-orange-50 border-orange-100" },
        ].map(a => (
          <Link key={a.label} to={a.href}
            className={`flex flex-col items-center gap-2 p-4 border rounded-xl hover:shadow-sm transition-all text-center ${a.color}`}>
            {a.icon}
            <span className="text-xs font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Orders</h2>
            <Link to="/orders" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <Link to="/products" className="text-primary text-sm hover:underline mt-1 inline-block">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <Link key={order.id} to={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.orderId}</p>
                    <p className="text-xs text-muted-foreground">
                      ₵{Number(order?.totalAmount || 0).toLocaleString("en-GH")} · {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="bg-destructive text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{unread}</span>
              )}
            </h2>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <BellRing className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} onClick={() => !n.read && markNotificationRead(n.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${n.read ? "bg-muted/40" : "bg-primary/5 border border-primary/20"}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-muted" : "bg-primary"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString("en-GH") : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
