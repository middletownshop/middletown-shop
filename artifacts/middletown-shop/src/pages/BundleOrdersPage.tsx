import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { BundleOrder } from "@/lib/types";
import { getCustomerBundleOrders } from "@/lib/firestore";
import { Signal, Phone, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending:    { color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" />, label: "Pending" },
  paid:       { color: "bg-blue-100 text-blue-700",    icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Paid" },
  processing: { color: "bg-purple-100 text-purple-700", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: "Processing" },
  delivered:  { color: "bg-green-100 text-green-700",  icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Delivered" },
  failed:     { color: "bg-red-100 text-red-700",      icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed" },
};

const NETWORK_BADGE: Record<string, string> = {
  MTN: "bg-yellow-100 text-yellow-800",
  Telecel: "bg-red-100 text-red-700",
  AirtelTigo: "bg-blue-100 text-blue-700",
};

export default function BundleOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BundleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getCustomerBundleOrders(user.uid)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Bundle Orders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">History of your data bundle purchases</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <Signal className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No bundle orders yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Purchase your first data bundle</p>
          <a href="/bundles" className="inline-block bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Buy Data Bundles
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const statusInfo = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            return (
              <div key={order.id} className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <p className="font-bold text-foreground text-sm">{order.bundleOrderId}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-GH", { year:"numeric", month:"long", day:"numeric" }) : "—"}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${NETWORK_BADGE[order.network] || "bg-muted text-muted-foreground"}`}>
                    {order.network}
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                    {order.bundleData} · {order.bundleValidity}
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {order.phoneNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{order.bundleName}</span>
                  <span className="font-bold text-primary">₵{Number(order.amount || 0).toLocaleString("en-GH")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
