import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Order, Notification } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Package, Receipt, Bell, Wallet, ShoppingBag, BellRing, Gamepad2 } from "lucide-react";
import { markNotificationRead } from "@/lib/firestore";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const handleMarkRead = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
  };

  const stats = [
    { label: "Total Orders", value: orders.length, icon: <Package className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-100" },
    { label: "Wallet Balance", value: `₵${Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}`, icon: <Wallet className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-100" },
    { label: "Notifications", value: unread, icon: <Bell className="w-5 h-5 text-orange-600" />, color: "bg-orange-50 border-orange-100" },
    { label: "Saved Items", value: userProfile?.savedProducts?.length || 0, icon: <ShoppingBag className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-100" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, {userProfile?.displayName || user?.email?.split("@")[0]}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* PREMIUM CHROME HIGHLIGHT: LUCKY SPIN HERO CARD */}
      <div className="mb-6 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-700 rounded-2xl p-0.5 shadow-md">
        <div className="bg-[#0f0a21] rounded-[14px] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
            <div className="text-3xl bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/20 text-amber-400 animate-pulse">
              🎡
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5 justify-center sm:justify-start">
                Lucky Spin Available! <span className="text-xs bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full font-extrabold animate-bounce">FREE</span>
              </h3>
              <p className="text-xs text-purple-200/70 mt-0.5">
                Spin the premium wheel now to unlock up to ₵100 instantly!
              </p>
            </div>
          </div>
          <Link
            to="/spin-win"
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl tracking-wider uppercase text-center shadow-lg transition-transform active:scale-95"
          >
            Play & Win
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Orders</h2>
            <Link to="/orders" className="text-primary text-xs hover:underline">View all</Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <Link to="/products" className="text-primary text-sm hover:underline mt-1 inline-block">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between gap-3 hover:bg-accent p-2 rounded-lg transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.orderId}</p>
                    <p className="text-xs text-muted-foreground">₵{Number(order?.totalAmount || 0).toLocaleString("en-GH")} · {order.items.length} item(s)</p>
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
              {unread > 0 && <span className="bg-destructive text-white text-xs rounded-full px-1.5 py-0.5">{unread}</span>}
            </h2>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <BellRing className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${n.read ? "bg-muted/40" : "bg-primary/5 border border-primary/20"}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-muted" : "bg-primary"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions (Includes updated responsive 5-column grid) */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Browse Products", href: "/products", icon: <ShoppingBag className="w-5 h-5" /> },
          { label: "My Orders", href: "/orders", icon: <Package className="w-5 h-5" /> },
          { label: "Play Games", href: "/spin-win", icon: <Gamepad2 className="w-5 h-5 text-amber-500" />, highlight: true },
          { label: "Receipts", href: "/orders", icon: <Receipt className="w-5 h-5" /> },
          { label: "Track Order", href: "/orders", icon: <Package className="w-5 h-5" /> },
        ].map(action => (
          <Link 
            key={action.label} 
            to={action.href}
            className={`flex flex-col items-center gap-2 p-4 border rounded-xl hover:shadow-sm transition-all text-center group bg-white
              ${action.highlight ? "border-amber-300 hover:border-amber-500 bg-amber-50/20" : "border-border hover:border-primary"}`}
          >
            <div className={`transition-colors ${action.highlight ? "text-amber-500 group-hover:text-amber-600" : "text-muted-foreground group-hover:text-primary"}`}>
              {action.icon}
            </div>
            <span className={`text-xs font-bold transition-colors ${action.highlight ? "text-amber-700 group-hover:text-amber-900" : "text-foreground group-hover:text-primary"}`}>
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}