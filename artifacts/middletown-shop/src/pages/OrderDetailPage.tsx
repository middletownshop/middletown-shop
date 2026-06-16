import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, Tracking, OrderStatus } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { CheckCircle2, Circle, Package, Receipt } from "lucide-react";

const STATUS_STEPS: OrderStatus[] = [
  "pending", "processing", "paid", "packed", "shipped", "in_transit", "out_for_delivery", "delivered"
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  processing: "Processing",
  paid: "Payment Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub1 = onSnapshot(doc(db, "orders", id), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
      setLoading(false);
    });
    const unsub2 = onSnapshot(doc(db, "tracking", id), snap => {
      if (snap.exists()) setTracking({ id: snap.id, ...snap.data() } as Tracking);
    });
    return () => { unsub1(); unsub2(); };
  }, [id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );

  if (!order) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold">Order not found</h2>
      <Link to="/orders" className="text-primary hover:underline mt-2 inline-block">Back to orders</Link>
    </div>
  );

  const currentStepIdx = order.status === "cancelled"
    ? -1
    : STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">← Back to orders</Link>
          <h1 className="text-xl font-bold text-foreground">{order.orderId}</h1>
          <p className="text-sm text-muted-foreground">Placed on {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="text-xl font-bold text-primary">₦{order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {/* Tracking timeline */}
          {order.status !== "cancelled" && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4">Order Tracking</h3>
              <div className="relative">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStepIdx;
                  const current = i === currentStepIdx;
                  return (
                    <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-primary" : "bg-muted border-2 border-border"}`}>
                          {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-6 mt-1 transition-all ${done && i < currentStepIdx ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                          {STATUS_LABELS[step]}
                          {current && <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Current</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tracking updates */}
          {tracking?.updates && tracking.updates.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4">Status History</h3>
              <div className="space-y-3">
                {[...tracking.updates].reverse().map((u, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground capitalize">{STATUS_LABELS[u.status] || u.status}</p>
                      <p className="text-muted-foreground text-xs">{u.message}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {u.timestamp?.toDate ? u.timestamp.toDate().toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-4">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <img src={item.image || "https://placehold.co/48x48/e2e8f0/64748b?text=Item"} alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Shipping info */}
          <div className="bg-white border border-border rounded-xl p-4">
            <h3 className="font-bold text-foreground mb-3 text-sm">Shipping Address</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{order.shippingInfo.name}</p>
              <p>{order.shippingInfo.address}</p>
              <p>{order.shippingInfo.city}, {order.shippingInfo.state}</p>
              <p>{order.shippingInfo.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-border rounded-xl p-4">
            <h3 className="font-bold text-foreground mb-3 text-sm">Payment</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-primary">₦{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${order.paymentVerified ? "text-green-600" : "text-yellow-600"}`}>
                  {order.paymentVerified ? "Verified" : "Pending"}
                </span>
              </div>
              {order.paymentReference && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground break-all">Ref: {order.paymentReference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Receipt link */}
          <Link to={`/track/${order.id}`} className="flex items-center gap-2 text-primary text-sm hover:underline">
            <Receipt className="w-4 h-4" /> View receipt
          </Link>
        </div>
      </div>
    </div>
  );
}
