import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/firestore";
import type { Order, OrderStatus } from "@/lib/types";
import OrderStatusBadge, { STATUS_CONFIG } from "@/components/OrderStatusBadge";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, ChevronDown } from "lucide-react";

const ALL_STATUSES: OrderStatus[] = [
  "pending", "processing", "paid", "packed", "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled"
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingMessage, setTrackingMessage] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");

  const load = () => {
    getAllOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = orders
    .filter(o => !statusFilter || o.status === statusFilter)
    .filter(o => !search || o.orderId.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.customerEmail.toLowerCase().includes(search.toLowerCase()));

  const handleUpdateStatus = async (orderId: string) => {
    if (!trackingMessage.trim()) { toast.error("Add a tracking message"); return; }
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, trackingMessage);
      toast.success("Order status updated");
      setExpandedOrder(null);
      setTrackingMessage("");
      load();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Order Management</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID, customer..." data-testid="input-order-search"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OrderStatus | "")} data-testid="select-status-filter"
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Payment</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No orders found</td></tr>
              ) : filtered.map(order => (
                <>
                  <tr key={order.id} data-testid={`order-admin-row-${order.id}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-foreground">{order.orderId}</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} item(s)</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-foreground">₦{order.totalAmount.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.paymentVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {order.paymentVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        data-testid={`button-update-order-${order.id}`}
                        className="flex items-center gap-1 text-primary text-xs hover:underline">
                        Update <ChevronDown className={`w-3 h-3 transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-expand`} className="border-t border-primary/20 bg-primary/5">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">New Status</label>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value as OrderStatus)} data-testid="select-new-status"
                              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-foreground mb-1">Tracking Message</label>
                            <input value={trackingMessage} onChange={e => setTrackingMessage(e.target.value)} data-testid="input-tracking-message"
                              placeholder="e.g. Package dispatched from Lagos warehouse" 
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <button onClick={() => handleUpdateStatus(order.id)} disabled={updating === order.id} data-testid="button-confirm-update"
                            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap">
                            {updating === order.id ? "Updating..." : "Update"}
                          </button>
                          <button onClick={() => setExpandedOrder(null)} className="text-muted-foreground text-sm hover:text-foreground">Cancel</button>
                        </div>
                        {/* Items preview */}
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5">
                              <img src={item.image || "https://placehold.co/24x24/e2e8f0/64748b?text=Item"} alt={item.name} className="w-6 h-6 object-cover rounded" />
                              <span className="text-xs text-foreground">{item.name} x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
