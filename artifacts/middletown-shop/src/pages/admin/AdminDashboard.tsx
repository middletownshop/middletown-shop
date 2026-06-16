import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Users, Package, DollarSign, Clock, TrendingUp, ChevronRight } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
      ]);
      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setStats({
        totalUsers: usersSnap.size,
        totalOrders: orders.length,
        totalRevenue: orders.filter(o => o.paymentVerified).reduce((s, o) => s + o.totalAmount, 0),
        pendingOrders: orders.filter(o => o.status === "pending" || o.status === "processing").length,
        completedOrders: orders.filter(o => o.status === "delivered").length,
      });
      setRecentOrders(orders.slice(0, 8));
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users className="w-6 h-6 text-blue-600" />, color: "bg-blue-50 border-blue-100", href: "/admin/users" },
    { label: "Total Orders", value: stats.totalOrders, icon: <Package className="w-6 h-6 text-purple-600" />, color: "bg-purple-50 border-purple-100", href: "/admin/orders" },
    { label: "Total Revenue", value: `₦${stats.totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-green-600" />, color: "bg-green-50 border-green-100", href: "/admin/orders" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: <Clock className="w-6 h-6 text-orange-600" />, color: "bg-orange-50 border-orange-100", href: "/admin/orders" },
    { label: "Completed", value: stats.completedOrders, icon: <TrendingUp className="w-6 h-6 text-emerald-600" />, color: "bg-emerald-50 border-emerald-100", href: "/admin/orders" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Middletown Shop overview</p>
        </div>
        <Link to="/admin/products" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Manage Products
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map(s => (
            <Link key={s.label} to={s.href} className={`border rounded-xl p-4 hover:shadow-md transition-all ${s.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">{s.icon}</div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Products", href: "/admin/products", desc: "Add, edit, manage products" },
          { label: "Orders", href: "/admin/orders", desc: "View and update order status" },
          { label: "Users", href: "/admin/users", desc: "View all customer accounts" },
        ].map(nav => (
          <Link key={nav.label} to={nav.href} className="bg-white border border-border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all">
            <p className="font-bold text-foreground">{nav.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{nav.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Recent Orders</h2>
          <Link to="/admin/orders" className="text-primary text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No orders yet</td></tr>
              ) : recentOrders.map(order => (
                <tr key={order.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{order.orderId}</td>
                  <td className="px-5 py-3 text-muted-foreground">{order.customerName}</td>
                  <td className="px-5 py-3 font-bold text-foreground">₦{order.totalAmount.toLocaleString()}</td>
                  <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders`} className="text-primary text-xs hover:underline">Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
