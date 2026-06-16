import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Order, Notification } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Package, Receipt, Bell, Wallet, ShoppingBag, BellRing } from "lucide-react";
import { markNotificationRead } from "@/lib/firestore";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("customerId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
    return onSnapshot(q, snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(10));
    return onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))));
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
  };

  const stats = [
    { label: "Total Orders", value: orders.length, icon: <Package className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-100" },
    { label: "Wallet Balance", value: `₦${(userProfile?.walletBalance || 0).toLocaleString()}`, icon: <Wallet className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-100" },
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
                    <p className="text-xs text-muted-foreground">₦{order.totalAmount.toLocaleString()} · {order.items.length} item(s)</p>
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

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Browse Products", href: "/products", icon: <ShoppingBag className="w-5 h-5" /> },
          { label: "My Orders", href: "/orders", icon: <Package className="w-5 h-5" /> },
          { label: "Receipts", href: "/orders", icon: <Receipt className="w-5 h-5" /> },
          { label: "Track Order", href: "/orders", icon: <Package className="w-5 h-5" /> },
        ].map(action => (
          <Link key={action.label} to={action.href}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all text-center group">
            <div className="text-muted-foreground group-hover:text-primary transition-colors">{action.icon}</div>
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
