import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, Tracking, OrderStatus } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { CheckCircle2, Circle, Package } from "lucide-react";

const STATUS_STEPS: OrderStatus[] = [
  "pending", "processing", "paid", "packed", "shipped", "in_transit", "out_for_delivery", "delivered"
];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed", processing: "Processing", paid: "Payment Confirmed",
  packed: "Packed", shipped: "Shipped", in_transit: "In Transit",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const u1 = onSnapshot(doc(db, "orders", orderId), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
      setLoading(false);
    });
    const u2 = onSnapshot(doc(db, "tracking", orderId), snap => {
      if (snap.exists()) setTracking({ id: snap.id, ...snap.data() } as Tracking);
    });
    return () => { u1(); u2(); };
  }, [orderId]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Order not found</h2>
      <p className="text-muted-foreground text-sm">Check the order ID and try again</p>
      <Link to="/orders" className="text-primary hover:underline mt-4 inline-block">My Orders</Link>
    </div>
  );

  const currentStepIdx = order.status === "cancelled" ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-bold text-lg mb-1">Order Tracking</h1>
              <p className="text-white/80 text-sm">{order.orderId}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-3 text-sm text-white/80">
            Placed {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6">
          {order.status === "cancelled" ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-7 h-7 text-destructive" />
              </div>
              <p className="text-destructive font-bold">Order Cancelled</p>
            </div>
          ) : (
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIdx;
                const current = i === currentStepIdx;
                return (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${done ? "bg-primary border-primary" : "bg-white border-border"}`}>
                        {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 ${i < currentStepIdx ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-6 pt-1.5">
                      <p className={`text-sm font-medium ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                        {STATUS_LABELS[step]}
                        {current && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>}
                      </p>
                      {tracking?.updates?.find(u => u.status === step) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tracking.updates.find(u => u.status === step)?.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items summary */}
          <div className="border-t border-border mt-2 pt-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Items</h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.image || "https://placehold.co/40x40/e2e8f0/64748b?text=Item"} alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg border border-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-border">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-primary">₦{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
