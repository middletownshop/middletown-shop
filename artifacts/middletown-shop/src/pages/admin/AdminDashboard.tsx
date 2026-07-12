import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/lib/types";
import { getDocs, collection, query, orderBy, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import {
  Users, Package, DollarSign, Clock, Signal, MessageSquare,
  ChevronRight, Wallet, ShoppingBag, TrendingUp, Gift,
} from "lucide-react";


// ==========================================
// ⚠️ TODO: IMPORT YOUR EXISTING WALLET FUNCTION HERE
// Example: import { addWalletDeposit } from "@/lib/wallet";
// ==========================================
// If it isn't imported, you can define a stub or replace this placeholder:
async function addWalletDeposit(userId: string, amount: number, reference: string, description: string): Promise<void> {
  // Your existing Firestore function logic runs here.
  // DO NOT change its internal structure.
}

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalBundles: number;
  pendingComplaints: number;
  pendingWithdrawals: number;
}

interface Customer {
  uid: string;
  displayName?: string;
  email?: string;
  phone?: string;
  walletBalance?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalOrders: 0, totalRevenue: 0,
    totalProducts: 0, totalBundles: 0, pendingComplaints: 0, pendingWithdrawals: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Wallet Credit Feature States
  const [searchType, setSearchType] = useState<"phone" | "email" | "displayName">("phone");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Customer Search Query Handler
  const handleCustomerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSelectedCustomer(null);
    setSuccessMessage(null);
    setSubmitError(null);

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where(searchType, "==", searchQuery.trim()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchError(`No customer found matching that ${searchType === "displayName" ? "name" : searchType}.`);
        return;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      setSelectedCustomer({
        uid: doc.id,
        displayName: data.displayName || data.name,
        email: data.email,
        phone: data.phone,
        walletBalance: data.walletBalance ?? 0,
      });
    } catch (error) {
      console.error("Error finding customer account:", error);
      setSearchError("Failed to look up customer profile. Try checking network connection.");
    } finally {
      setIsSearching(false);
    }
  };

  // Wallet Balance Modification Handler
  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError("Please enter a valid credit deposit amount greater than 0.");
      return;
    }
    if (!reference.trim()) {
      setSubmitError("A clear reference identifier is required.");
      return;
    }
    if (!reason.trim()) {
      setSubmitError("Please provide an internal accounting reason description.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Calls your pre-existing, non-modified function using the target UID
      await addWalletDeposit(
        selectedCustomer.uid,
        parsedAmount,
        reference.trim(),
        reason.trim()
      );

      setSuccessMessage(`Successfully added GH₵${parsedAmount.toFixed(2)} to ${selectedCustomer.displayName || "Customer"}'s wallet account.`);

      // Update local state dynamically so dashboard UI reflects changes immediately
      setSelectedCustomer(prev => prev ? {
        ...prev,
        walletBalance: (prev.walletBalance || 0) + parsedAmount
      } : null);

      // Clean transactional payload fields
      setAmount("");
      setReference("");
      setReason("");
    } catch (error: any) {
      console.error("Error dispatching external wallet balance function:", error);
      setSubmitError(error.message || "Failed to commit wallet updates. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { label: "Withdrawals", href: "/admin/withdrawals", desc: "Process withdrawal requests", icon: <Wallet className="w-5 h-5 text-red-500" /> },
    { label: "Notices", href: "/admin/notices", desc: "Send announcements to users", icon: <MessageSquare className="w-5 h-5 text-blue-600" /> },
    { label: "Coupons", href: "/admin/coupons", desc: "Manage Spin & Win coupons", icon: <TrendingUp className="w-5 h-5 text-green-600" /> },
    { label: "Spin Management", href: "/admin/spin-management", desc: "View spins, winners and game revenue", icon: <Gift className="w-5 h-5 text-orange-600" /> },
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
          {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
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

      {/* Manual Wallet Credit Feature */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-8 max-w-2xl">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h2 className="font-bold text-foreground text-base">Manual Wallet Credit</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Lookup a user directly to drop manual deposits over standard offline payments.</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Lookup Input Group */}
          <form onSubmit={handleCustomerSearch} className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Customer</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="phone">Phone Number</option>
                <option value="email">Email Address</option>
                <option value="displayName">Display Name</option>
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchType === "phone" ? "e.g., 0241234567" :
                    searchType === "email" ? "e.g., abc@gmail.com" : "e.g., Abdul Razak"
                  }
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="bg-primary hover:bg-primary/90 text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[85px] flex justify-center items-center"
              >
                {isSearching ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Search"}
              </button>
            </div>
            {searchError && <p className="text-xs font-semibold text-destructive mt-1">{searchError}</p>}
          </form>

          {/* Action Profile Section */}
          {selectedCustomer && (
            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground font-medium uppercase tracking-tight">Name:</span>
                  <span className="font-bold text-foreground">{selectedCustomer.displayName || "Unknown User"}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground font-medium uppercase tracking-tight">Phone:</span>
                  <span className="text-foreground">{selectedCustomer.phone || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground font-medium uppercase tracking-tight">Email:</span>
                  <span className="text-foreground truncate block">{selectedCustomer.email || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground font-medium uppercase tracking-tight">Current Wallet:</span>
                  <span className="font-extrabold text-emerald-600">GH₵{Number(selectedCustomer.walletBalance || 0).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCreditSubmit} className="space-y-4 pt-2 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50"
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">Reference</label>
                    <input
                      type="text"
                      required
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="CASH-001"
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Reason</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Customer paid via MoMo"
                    className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {submitError && <p className="text-xs font-medium text-destructive">{submitError}</p>}
                {successMessage && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">{successMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isSubmitting ? "Processing Deposit..." : "Credit Wallet"}
                </button>
              </form>
            </div>
          )}
        </div>
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