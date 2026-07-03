import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/lib/types";
import { getDocs, collection, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import {
  Users, Package, DollarSign, Clock, Signal, MessageSquare,
  ChevronRight, Wallet, ShoppingBag, TrendingUp,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalBundles: number;
  pendingComplaints: number;
  pendingWithdrawals: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalOrders: 0, totalRevenue: 0,
    totalProducts: 0, totalBundles: 0, pendingComplaints: 0, pendingWithdrawals: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersSnap, ordersSnap, productsSnap, bundlesSnap, complaintsSnap, withdrawalsSnap] =
        await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "bundles")),
          getDocs(collection(db, "complaints")),
          getDocs(query(collection(db, "withdrawalRequests"), where("status", "==", "pending"))),
        ]);

      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      const pendingComplaints = complaintsSnap.docs.filter(d => d.data().status !== "resolved").length;

      setStats({
        totalUsers: usersSnap.size,
        totalOrders: orders.length,
        totalRevenue: orders.filter(o => o.paymentVerified).reduce((s, o) => s + (o.totalAmount || 0), 0),
        totalProducts: productsSnap.size,
        totalBundles: bundlesSnap.size,
        pendingComplaints,
        pendingWithdrawals: withdrawalsSnap.size,
      });
      setRecentOrders(orders.slice(0, 8));
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-100", href: "/admin/users" },
    { label: "Total Orders", value: stats.totalOrders, icon: <Package className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-100", href: "/admin/orders" },
    { label: "Revenue (GHS)", value: `₵${Number(stats.totalRevenue || 0).toLocaleString("en-GH")}`, icon: <DollarSign className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-100", href: "/admin/orders" },
    { label: "Total Products", value: stats.totalProducts, icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />, color: "bg-indigo-50 border-indigo-100", href: "/admin/products" },
    { label: "Total Bundles", value: stats.totalBundles, icon: <Signal className="w-5 h-5 text-emerald-600" />, color: "bg-emerald-50 border-emerald-100", href: "/admin/bundles" },
    { label: "Complaints", value: stats.pendingComplaints, icon: <MessageSquare className="w-5 h-5 text-orange-600" />, color: "bg-orange-50 border-orange-100", href: "/admin/complaints" },
    { label: "Withdrawals", value: stats.pendingWithdrawals, icon: <Wallet className="w-5 h-5 text-red-500" />, color: "bg-red-50 border-red-100", href: "/admin/withdrawals" },
  ];

  const quickNav = [
    { label: "Products", href: "/admin/products", desc: "Add, edit, manage shop products", icon: <ShoppingBag className="w-5 h-5 text-indigo-600" /> },
    { label: "Bundles", href: "/admin/bundles", desc: "Manage data bundle plans", icon: <Signal className="w-5 h-5 text-emerald-600" /> },
    { label: "Orders", href: "/admin/orders", desc: "View and update order status", icon: <Package className="w-5 h-5 text-purple-600" /> },
    { label: "Users", href: "/admin/users", desc: "View all customer accounts", icon: <Users className="w-5 h-5 text-blue-600" /> },
    { label: "Complaints", href: "/admin/complaints", desc: "Review and resolve complaints", icon: <MessageSquare className="w-5 h-5 text-orange-600" /> },
    { label: "Withdrawals", href: "/admin/withdrawals", desc: "Process withdrawal requests", icon: <Wallet className="w-5 h-5 text-red-500" /> },{
      label: "Notices",
      href: "/admin/notices",
      desc: "Send announcements to users",
      icon: <MessageSquare className="w-5 h-5 text-blue-600" />
    },
  ];

  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Middletown Shop overview</p>
        </div>
        <Link to="/admin/products" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + Add Product
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <Link key={s.label} to={s.href} className={`border rounded-xl p-4 hover:shadow-md transition-all ${s.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">{s.icon}</div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {quickNav.map(nav => (
          <Link key={nav.label} to={nav.href}
            className="bg-white border border-border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg flex-shrink-0">{nav.icon}</div>
            <div>
              <p className="font-bold text-foreground text-sm">{nav.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{nav.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Recent Orders</h2>
          <Link to="/admin/orders" className="text-primary text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Order ID", "Customer", "Amount", "Status", "Date", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No orders yet</td></tr>
              ) : recentOrders.map(order => (
                <tr key={order.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{order.orderId}</td>
                  <td className="px-5 py-3 text-muted-foreground">{order?.customerName || "Unknown"}</td>
                  <td className="px-5 py-3 font-bold text-foreground">₵{Number(order?.totalAmount || 0).toLocaleString("en-GH")}</td>
                  <td className="px-5 py-3"><OrderStatusBadge status={order?.status || "pending"} /></td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                    {order?.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-GH") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Link to="/admin/orders" className="text-primary text-xs hover:underline">Manage</Link>
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
